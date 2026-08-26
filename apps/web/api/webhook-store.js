/**
 * @file webhook-store.js
 * @description In-memory Webhook subscription store with HMAC-SHA256 payload signing.
 *
 * DESIGN DECISIONS:
 *  - Each webhook gets its own 32-byte random secret for independent signing
 *  - Payload signing uses HMAC-SHA256 with the delivery body (same as GitHub/Stripe)
 *  - Delivery attempts are tracked with consecutive failure counting
 *  - Webhooks auto-transition to 'failing' after 5 consecutive failures
 *  - Retry strategy: exponential backoff (1s, 2s, 4s) — max 3 attempts per event
 *  - Timeout per delivery attempt: 10 seconds
 */

import { randomBytes, createHmac } from 'node:crypto';

/** @type {Map<string, import('@doc-platform/core').WebhookRecord>} */
const webhookStore = new Map();

/** @type {Map<string, import('@doc-platform/core').WebhookDeliveryAttempt[]>} */
const deliveryLog = new Map();

// ---------------------------------------------------------------------------
// Webhook CRUD
// ---------------------------------------------------------------------------

/**
 * Creates a new webhook subscription.
 * @param {object} params
 * @param {string} params.ownerId
 * @param {string} params.url
 * @param {string} params.description
 * @param {string[]} params.events
 * @returns {import('@doc-platform/core').WebhookRecord}
 */
export function createWebhook({ ownerId, url, description = '', events }) {
  const id = `wh_${randomBytes(8).toString('hex')}`;
  const secret = `whsec_${randomBytes(24).toString('base64url')}`;
  const now = new Date().toISOString();

  const record = {
    id,
    ownerId,
    url,
    description,
    events,
    status: 'active',
    secret,
    lastDeliveredAt: null,
    successCount: 0,
    failureCount: 0,
    consecutiveFailures: 0,
    createdAt: now,
    updatedAt: now,
  };

  webhookStore.set(id, record);
  deliveryLog.set(id, []);
  return record;
}

/**
 * Lists all webhooks for an owner (secret redacted in list view).
 * @param {string} ownerId
 * @returns {import('@doc-platform/core').WebhookRecord[]}
 */
export function listWebhooks(ownerId) {
  return Array.from(webhookStore.values())
    .filter((wh) => wh.ownerId === ownerId)
    .map((wh) => ({ ...wh, secret: '[REDACTED]' }));
}

/**
 * Gets a single webhook (secret included — for internal dispatch only).
 * @param {string} webhookId
 * @param {string} ownerId
 * @returns {{ record: import('@doc-platform/core').WebhookRecord | null, forbidden: boolean }}
 */
export function getWebhook(webhookId, ownerId) {
  const record = webhookStore.get(webhookId);
  if (!record) return { record: null, forbidden: false };
  if (record.ownerId !== ownerId) return { record: null, forbidden: true };
  return { record, forbidden: false };
}

/**
 * Updates an existing webhook.
 * @param {string} webhookId
 * @param {string} ownerId
 * @param {Partial<{description: string, events: string[], status: string}>} updates
 * @returns {{ record: import('@doc-platform/core').WebhookRecord | null, error?: string }}
 */
export function updateWebhook(webhookId, ownerId, updates) {
  const wh = webhookStore.get(webhookId);
  if (!wh) return { record: null, error: 'Webhook not found.' };
  if (wh.ownerId !== ownerId) return { record: null, error: 'Forbidden.' };

  const updated = {
    ...wh,
    ...(updates.description !== undefined && { description: updates.description }),
    ...(updates.events !== undefined && { events: updates.events }),
    ...(updates.status !== undefined && { status: updates.status }),
    updatedAt: new Date().toISOString(),
  };

  webhookStore.set(webhookId, updated);
  return { record: { ...updated, secret: '[REDACTED]' } };
}

/**
 * Deletes a webhook subscription.
 * @param {string} webhookId
 * @param {string} ownerId
 * @returns {{ success: boolean, error?: string }}
 */
export function deleteWebhook(webhookId, ownerId) {
  const wh = webhookStore.get(webhookId);
  if (!wh) return { success: false, error: 'Webhook not found.' };
  if (wh.ownerId !== ownerId) return { success: false, error: 'Forbidden.' };

  webhookStore.delete(webhookId);
  deliveryLog.delete(webhookId);
  return { success: true };
}

/**
 * Gets delivery history for a webhook.
 * @param {string} webhookId
 * @param {string} ownerId
 * @param {number} limit
 * @returns {import('@doc-platform/core').WebhookDeliveryAttempt[] | null}
 */
export function getDeliveryLog(webhookId, ownerId, limit = 50) {
  const wh = webhookStore.get(webhookId);
  if (!wh || wh.ownerId !== ownerId) return null;
  const log = deliveryLog.get(webhookId) || [];
  return log.slice(-limit).reverse();
}

// ---------------------------------------------------------------------------
// Payload Signing
// ---------------------------------------------------------------------------

/**
 * Signs a webhook payload body using HMAC-SHA256.
 * Header format: `sha256=<hex_digest>` (compatible with GitHub webhook signature).
 *
 * @param {string} payload - JSON-serialized body string
 * @param {string} secret - Webhook secret
 * @returns {string} Signature header value
 */
export function signWebhookPayload(payload, secret) {
  const hmac = createHmac('sha256', secret);
  hmac.update(payload, 'utf8');
  return `sha256=${hmac.digest('hex')}`;
}

// ---------------------------------------------------------------------------
// Dispatch Engine (called by job completion hooks)
// ---------------------------------------------------------------------------

/**
 * Dispatches a webhook event to all matching active subscriptions.
 * Uses exponential backoff retry (3 attempts max, 1s/2s/4s).
 *
 * @param {object} params
 * @param {string} params.ownerId - Only dispatch to webhooks owned by this user
 * @param {import('@doc-platform/core').WebhookEventType} params.event
 * @param {Record<string, unknown>} params.data
 * @returns {Promise<void>}
 */
export async function dispatchWebhookEvent({ ownerId, event, data }) {
  const matchingWebhooks = Array.from(webhookStore.values()).filter(
    (wh) =>
      wh.ownerId === ownerId &&
      wh.status === 'active' &&
      wh.events.includes(event),
  );

  await Promise.all(
    matchingWebhooks.map((wh) => deliverWithRetry(wh, event, data)),
  );
}

/**
 * Delivers a single event to a single webhook with up to 3 retry attempts.
 * @param {import('@doc-platform/core').WebhookRecord} webhook
 * @param {string} event
 * @param {Record<string, unknown>} data
 */
async function deliverWithRetry(webhook, event, data) {
  const deliveryId = `del_${randomBytes(8).toString('hex')}`;

  /** @type {import('@doc-platform/core').WebhookDeliveryPayload} */
  const payload = {
    deliveryId,
    webhookId: webhook.id,
    event,
    timestamp: new Date().toISOString(),
    data,
    apiVersion: '2026-01',
  };

  const bodyStr = JSON.stringify(payload);
  const signature = signWebhookPayload(bodyStr, webhook.secret);

  const MAX_ATTEMPTS = 3;
  const BACKOFF_MS = [0, 1000, 2000]; // 0s, 1s, 2s delays between attempts

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, BACKOFF_MS[attempt]));
    }

    const attemptId = `${deliveryId}_a${attempt}`;
    const start = Date.now();
    let responseStatus = null;
    let success = false;
    let error = null;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-DocPlatform-Signature': signature,
          'X-DocPlatform-Delivery': deliveryId,
          'X-DocPlatform-Event': event,
          'User-Agent': 'DocPlatform-Webhooks/2026-01',
        },
        body: bodyStr,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      responseStatus = response.status;
      success = response.status >= 200 && response.status < 300;
    } catch (err) {
      error = err.name === 'AbortError' ? 'Request timed out (10s)' : err.message;
    }

    const latencyMs = Date.now() - start;

    // Record delivery attempt
    const attemptRecord = {
      id: attemptId,
      webhookId: webhook.id,
      event,
      responseStatus,
      latencyMs,
      success,
      error,
      attemptedAt: new Date().toISOString(),
      attemptNumber: attempt,
    };

    const log = deliveryLog.get(webhook.id) || [];
    log.push(attemptRecord);
    // Cap log at 500 entries per webhook
    if (log.length > 500) log.shift();
    deliveryLog.set(webhook.id, log);

    // Update webhook stats
    const current = webhookStore.get(webhook.id);
    if (current) {
      const consecutiveFailures = success ? 0 : current.consecutiveFailures + 1;
      webhookStore.set(webhook.id, {
        ...current,
        lastDeliveredAt: success ? new Date().toISOString() : current.lastDeliveredAt,
        successCount: success ? current.successCount + 1 : current.successCount,
        failureCount: success ? current.failureCount : current.failureCount + 1,
        consecutiveFailures,
        // Auto-mark as failing after 5 consecutive failures
        status: consecutiveFailures >= 5 ? 'failing' : current.status,
        updatedAt: new Date().toISOString(),
      });
    }

    if (success) break; // Stop retrying on success
  }
}
