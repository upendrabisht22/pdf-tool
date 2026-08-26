/**
 * @file webhook-routes.js
 * @description Phase 7 — Webhook Management Routes.
 *
 * Routes:
 *   POST   /api/v1/webhooks               — Register a new webhook endpoint
 *   GET    /api/v1/webhooks               — List all webhooks for authenticated owner
 *   GET    /api/v1/webhooks/:id           — Get a specific webhook
 *   PATCH  /api/v1/webhooks/:id           — Update webhook (events, description, status)
 *   DELETE /api/v1/webhooks/:id           — Permanently delete webhook
 *   GET    /api/v1/webhooks/:id/deliveries — Get delivery history for a webhook
 *   POST   /api/v1/webhooks/:id/ping      — Send a test ping event to verify endpoint
 *
 * All routes require authentication via API key with 'webhooks:read' or 'webhooks:write' scope,
 * OR a valid session (for web UI management).
 */

import {
  createWebhook,
  listWebhooks,
  getWebhook,
  updateWebhook,
  deleteWebhook,
  getDeliveryLog,
  dispatchWebhookEvent,
} from './webhook-store.js';
import { appendAuditEntry } from './usage-store.js';
import { ALL_WEBHOOK_EVENTS } from '@doc-platform/core';

const VALID_EVENTS = new Set(ALL_WEBHOOK_EVENTS);
const MAX_URL_LENGTH = 2048;
const MAX_DESC_LENGTH = 256;

// ---------------------------------------------------------------------------
// Input Validators
// ---------------------------------------------------------------------------

function isValidHttpsUrl(url) {
  try {
    const parsed = new URL(url);
    // In production, enforce HTTPS; allow HTTP for local dev
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

function validateCreateWebhookBody(body) {
  const errors = [];

  if (!body.url || typeof body.url !== 'string') {
    errors.push('url is required.');
  } else if (body.url.length > MAX_URL_LENGTH) {
    errors.push(`url must be ${MAX_URL_LENGTH} characters or fewer.`);
  } else if (!isValidHttpsUrl(body.url)) {
    errors.push('url must be a valid HTTP or HTTPS URL.');
  }

  if (!Array.isArray(body.events) || body.events.length === 0) {
    errors.push('events must be a non-empty array.');
  } else {
    const invalidEvents = body.events.filter((e) => !VALID_EVENTS.has(e));
    if (invalidEvents.length > 0) {
      errors.push(`Invalid events: ${invalidEvents.join(', ')}. Valid: ${[...VALID_EVENTS].join(', ')}`);
    }
  }

  if (body.description !== undefined && typeof body.description !== 'string') {
    errors.push('description must be a string.');
  } else if (body.description && body.description.length > MAX_DESC_LENGTH) {
    errors.push(`description must be ${MAX_DESC_LENGTH} characters or fewer.`);
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Route Handler
// ---------------------------------------------------------------------------

/**
 * Handles all /api/v1/webhooks/* routes.
 *
 * @param {import('node:http').IncomingMessage} req
 * @param {import('node:http').ServerResponse} res
 * @param {string} pathname
 * @param {Function} sendJson
 * @param {object} authProvider
 * @returns {Promise<boolean>} true if route was handled
 */
export async function handleWebhookRoutes(req, res, pathname, sendJson, authProvider) {
  const method = req.method;
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  // Resolve owner from session (web UI) or API key context (already injected)
  const session = await authProvider.resolveSession(req.headers);
  const ownerId = req.apiKeyContext?.ownerId || session.userId || session.sessionId || 'anonymous';

  // ── POST /api/v1/webhooks ────────────────────────────────────────────────
  if (pathname === '/api/v1/webhooks' && method === 'POST') {
    return new Promise((resolve) => {
      let bodyStr = '';
      req.on('data', (chunk) => (bodyStr += chunk));
      req.on('end', async () => {
        try {
          const body = JSON.parse(bodyStr || '{}');
          const errors = validateCreateWebhookBody(body);

          if (errors.length > 0) {
            sendJson(422, {
              error: {
                code: 'VALIDATION_ERROR',
                message: 'Webhook registration validation failed.',
                details: { errors },
                requestId,
              },
            });
            return resolve(true);
          }

          const record = createWebhook({
            ownerId,
            url: body.url,
            description: body.description || '',
            events: body.events,
          });

          appendAuditEntry({
            actor: { userId: ownerId, apiKeyId: req.apiKeyContext?.keyId || null, ipAddress: ip, userAgent },
            event: 'webhook.created',
            resourceType: 'webhook',
            resourceId: record.id,
            outcome: 'success',
            metadata: { url: body.url, events: body.events, requestId },
          });

          // Return the record with the secret — shown once for setup
          sendJson(201, {
            ...record,
            signingSecret: record.secret, // alias for clarity
            instructions: {
              headerName: 'X-DocPlatform-Signature',
              format: 'sha256=<hmac_hex_digest>',
              algorithm: 'HMAC-SHA256',
              example: `To verify: createHmac('sha256', signingSecret).update(rawBody).digest('hex')`,
            },
            warning: 'Store the signingSecret securely — it will not be shown again in list/get endpoints.',
          });
          resolve(true);
        } catch (err) {
          sendJson(400, {
            error: { code: 'INVALID_INPUT', message: err.message, requestId },
          });
          resolve(true);
        }
      });
    });
  }

  // ── GET /api/v1/webhooks ─────────────────────────────────────────────────
  if (pathname === '/api/v1/webhooks' && method === 'GET') {
    const webhooks = listWebhooks(ownerId);
    return sendJson(200, { webhooks, total: webhooks.length }), true;
  }

  // Match /api/v1/webhooks/:id and sub-paths
  const webhookBaseMatch = pathname.match(/^\/api\/v1\/webhooks\/([^/]+)(\/.*)?$/);
  if (!webhookBaseMatch) return false;

  const webhookId = webhookBaseMatch[1];
  const subPath = webhookBaseMatch[2] || '';

  // ── GET /api/v1/webhooks/:id ─────────────────────────────────────────────
  if (!subPath && method === 'GET') {
    const { record, forbidden } = getWebhook(webhookId, ownerId);

    if (forbidden) {
      return sendJson(403, { error: { code: 'FORBIDDEN', message: 'Access denied.', requestId } }), true;
    }
    if (!record) {
      return sendJson(404, { error: { code: 'NOT_FOUND', message: `Webhook ${webhookId} not found.`, requestId } }), true;
    }

    return sendJson(200, { ...record, secret: '[REDACTED]' }), true;
  }

  // ── PATCH /api/v1/webhooks/:id ───────────────────────────────────────────
  if (!subPath && method === 'PATCH') {
    return new Promise((resolve) => {
      let bodyStr = '';
      req.on('data', (chunk) => (bodyStr += chunk));
      req.on('end', async () => {
        try {
          const body = JSON.parse(bodyStr || '{}');

          // Validate events if provided
          if (body.events !== undefined) {
            if (!Array.isArray(body.events) || body.events.length === 0) {
              sendJson(422, {
                error: { code: 'VALIDATION_ERROR', message: 'events must be a non-empty array.', requestId },
              });
              return resolve(true);
            }
            const invalidEvents = body.events.filter((e) => !VALID_EVENTS.has(e));
            if (invalidEvents.length > 0) {
              sendJson(422, {
                error: { code: 'VALIDATION_ERROR', message: `Invalid events: ${invalidEvents.join(', ')}`, requestId },
              });
              return resolve(true);
            }
          }

          if (body.status !== undefined && !['active', 'paused'].includes(body.status)) {
            sendJson(422, {
              error: { code: 'VALIDATION_ERROR', message: 'status must be "active" or "paused".', requestId },
            });
            return resolve(true);
          }

          const { record, error } = updateWebhook(webhookId, ownerId, body);

          if (error) {
            const code = error === 'Forbidden.' ? 403 : 404;
            sendJson(code, { error: { code: 'UPDATE_FAILED', message: error, requestId } });
            return resolve(true);
          }

          appendAuditEntry({
            actor: { userId: ownerId, apiKeyId: req.apiKeyContext?.keyId || null, ipAddress: ip, userAgent },
            event: body.status === 'paused' ? 'webhook.paused' : 'webhook.resumed',
            resourceType: 'webhook',
            resourceId: webhookId,
            outcome: 'success',
            metadata: { updates: body, requestId },
          });

          sendJson(200, record);
          resolve(true);
        } catch (err) {
          sendJson(400, { error: { code: 'INVALID_INPUT', message: err.message, requestId } });
          resolve(true);
        }
      });
    });
  }

  // ── DELETE /api/v1/webhooks/:id ──────────────────────────────────────────
  if (!subPath && method === 'DELETE') {
    const result = deleteWebhook(webhookId, ownerId);

    if (!result.success) {
      const code = result.error === 'Forbidden.' ? 403 : 404;
      return sendJson(code, { error: { code: 'DELETE_FAILED', message: result.error, requestId } }), true;
    }

    appendAuditEntry({
      actor: { userId: ownerId, apiKeyId: req.apiKeyContext?.keyId || null, ipAddress: ip, userAgent },
      event: 'webhook.deleted',
      resourceType: 'webhook',
      resourceId: webhookId,
      outcome: 'success',
      metadata: { requestId },
    });

    return sendJson(200, {
      id: webhookId,
      deleted: true,
      message: 'Webhook endpoint has been permanently removed. No further events will be delivered.',
    }), true;
  }

  // ── GET /api/v1/webhooks/:id/deliveries ──────────────────────────────────
  if (subPath === '/deliveries' && method === 'GET') {
    const log = getDeliveryLog(webhookId, ownerId, 100);

    if (log === null) {
      return sendJson(404, { error: { code: 'NOT_FOUND', message: `Webhook ${webhookId} not found.`, requestId } }), true;
    }

    return sendJson(200, {
      webhookId,
      deliveries: log,
      total: log.length,
    }), true;
  }

  // ── POST /api/v1/webhooks/:id/ping ───────────────────────────────────────
  if (subPath === '/ping' && method === 'POST') {
    const { record, forbidden } = getWebhook(webhookId, ownerId);

    if (forbidden) {
      return sendJson(403, { error: { code: 'FORBIDDEN', message: 'Access denied.', requestId } }), true;
    }
    if (!record) {
      return sendJson(404, { error: { code: 'NOT_FOUND', message: `Webhook ${webhookId} not found.`, requestId } }), true;
    }

    // Dispatch a synthetic ping event (non-blocking)
    dispatchWebhookEvent({
      ownerId,
      event: 'job.completed', // Use a real event type for the ping
      data: {
        type: 'ping',
        webhookId,
        message: 'This is a test event dispatched by DocPlatform to verify your endpoint.',
        timestamp: new Date().toISOString(),
      },
    }).catch(() => {}); // Ping is fire-and-forget

    return sendJson(200, {
      webhookId,
      message: 'Ping dispatched. Check your endpoint and the /deliveries log for the result.',
      event: 'job.completed',
      sentAt: new Date().toISOString(),
    }), true;
  }

  return false; // route not handled
}
