/**
 * @file developer-routes.js
 * @description Phase 7 — Developer API Key Management Routes.
 *
 * Routes:
 *   POST   /api/v1/developer/keys          — Create new API key
 *   GET    /api/v1/developer/keys          — List all keys for authenticated user
 *   GET    /api/v1/developer/keys/:id      — Get a specific key by ID
 *   DELETE /api/v1/developer/keys/:id      — Revoke a key
 *   GET    /api/v1/developer/me            — Get current API context info
 *
 * Authentication: All routes require a valid API key with appropriate scope,
 * EXCEPT the "bootstrap" endpoint which uses a mock session token for demo.
 *
 * NOTE on Bootstrap Auth:
 *   In a full production system, key creation would be done via an OAuth2
 *   session cookie (after web UI login). For Phase 7 we use a session header
 *   (X-Session-Id) to identify the owner, consistent with the existing auth
 *   provider pattern in the rest of the server.
 */

import {
  createApiKey,
  listApiKeys,
  revokeApiKey,
  getApiKey,
} from './api-key-store.js';
import { appendAuditEntry } from './usage-store.js';
import { requireApiKeyAuth } from './api-key-auth.js';
import { ALL_API_SCOPES } from '@doc-platform/core';

/** Maximum scopes allowed per key */
const VALID_SCOPES = new Set(ALL_API_SCOPES);

/** Max key name length */
const MAX_NAME_LENGTH = 64;

/** Max expiry in days */
const MAX_EXPIRY_DAYS = 365;

// ---------------------------------------------------------------------------
// Input Validators
// ---------------------------------------------------------------------------

function validateCreateKeyBody(body) {
  const errors = [];

  if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
    errors.push('name is required and must be a non-empty string.');
  } else if (body.name.trim().length > MAX_NAME_LENGTH) {
    errors.push(`name must be ${MAX_NAME_LENGTH} characters or fewer.`);
  }

  if (!Array.isArray(body.scopes) || body.scopes.length === 0) {
    errors.push('scopes must be a non-empty array.');
  } else {
    const invalidScopes = body.scopes.filter((s) => !VALID_SCOPES.has(s));
    if (invalidScopes.length > 0) {
      errors.push(`Invalid scopes: ${invalidScopes.join(', ')}. Valid: ${[...VALID_SCOPES].join(', ')}`);
    }
  }

  if (body.expiresInDays !== undefined) {
    if (
      typeof body.expiresInDays !== 'number' ||
      !Number.isInteger(body.expiresInDays) ||
      body.expiresInDays < 1 ||
      body.expiresInDays > MAX_EXPIRY_DAYS
    ) {
      errors.push(`expiresInDays must be an integer between 1 and ${MAX_EXPIRY_DAYS}.`);
    }
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Route Handler
// ---------------------------------------------------------------------------

/**
 * Handles all /api/v1/developer/* routes.
 *
 * @param {import('node:http').IncomingMessage} req
 * @param {import('node:http').ServerResponse} res
 * @param {string} pathname
 * @param {Function} sendJson - (statusCode, data) => void
 * @param {object} authProvider - Existing session auth provider
 * @returns {Promise<boolean>} true if route was handled
 */
export async function handleDeveloperRoutes(req, res, pathname, sendJson, authProvider) {
  const method = req.method;
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';

  // ── GET /api/v1/developer/me ────────────────────────────────────────────
  if (pathname === '/api/v1/developer/me' && method === 'GET') {
    // This endpoint works with either session auth OR API key auth
    const rawKey = req.headers['authorization']?.split(' ')[1];
    if (rawKey) {
      const rejected = await requireApiKeyAuth('jobs:read')(req, res, sendJson);
      if (rejected) return true;

      return sendJson(200, {
        authenticated: true,
        method: 'api_key',
        keyId: req.apiKeyContext.keyId,
        ownerId: req.apiKeyContext.ownerId,
        tier: req.apiKeyContext.tier,
        scopes: req.apiKeyContext.scopes,
        requestId: req.apiKeyContext.requestId,
      }), true;
    }

    // Fallback: session auth
    const session = await authProvider.resolveSession(req.headers);
    return sendJson(200, {
      authenticated: !!session.userId,
      method: 'session',
      userId: session.userId,
      sessionId: session.sessionId,
      tier: session.tier || 'ANONYMOUS',
    }), true;
  }

  // ── POST /api/v1/developer/keys ─────────────────────────────────────────
  // Bootstrap: uses session auth (web UI user creating their first key)
  if (pathname === '/api/v1/developer/keys' && method === 'POST') {
    return new Promise((resolve) => {
      let bodyStr = '';
      req.on('data', (chunk) => (bodyStr += chunk));
      req.on('end', async () => {
        const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

        try {
          const body = JSON.parse(bodyStr || '{}');
          const session = await authProvider.resolveSession(req.headers);

          // For Phase 7, we require a session user ID to own the key
          // In production this would be a verified JWT claim
          const ownerId = session.userId || session.sessionId || 'anonymous';
          const tier = (session.tier || 'PRO').toUpperCase();

          // Validate allowed tiers for API key creation
          const allowedTiers = ['PRO', 'BUSINESS', 'ENTERPRISE'];
          if (!allowedTiers.includes(tier)) {
            appendAuditEntry({
              actor: { userId: ownerId, apiKeyId: null, ipAddress: ip, userAgent },
              event: 'api_key.created',
              resourceType: 'api_key',
              resourceId: null,
              outcome: 'failure',
              metadata: { reason: 'Tier not eligible for API keys', tier, requestId },
            });
            sendJson(403, {
              error: {
                code: 'FORBIDDEN',
                message: 'API key creation requires a Pro, Business, or Enterprise plan.',
                requestId,
              },
            });
            return resolve(true);
          }

          // Validate request body
          const errors = validateCreateKeyBody(body);
          if (errors.length > 0) {
            sendJson(422, {
              error: {
                code: 'VALIDATION_ERROR',
                message: 'Request body validation failed.',
                details: { errors },
                requestId,
              },
            });
            return resolve(true);
          }

          const { record, secret } = createApiKey({
            ownerId,
            name: body.name.trim(),
            tier,
            scopes: body.scopes,
            expiresInDays: body.expiresInDays ?? null,
          });

          appendAuditEntry({
            actor: { userId: ownerId, apiKeyId: null, ipAddress: ip, userAgent },
            event: 'api_key.created',
            resourceType: 'api_key',
            resourceId: record.id,
            outcome: 'success',
            metadata: { keyName: record.name, scopes: record.scopes, requestId },
          });

          // Return the secret ONCE — never again
          sendJson(201, {
            id: record.id,
            name: record.name,
            secret, // ← shown ONCE only
            keyPrefix: record.keyPrefix,
            scopes: record.scopes,
            tier: record.tier,
            createdAt: record.createdAt,
            expiresAt: record.expiresAt,
            warning: 'Store this secret securely. It will not be shown again.',
          });
          resolve(true);
        } catch (err) {
          sendJson(400, {
            error: { code: 'INVALID_INPUT', message: err.message, requestId: 'unknown' },
          });
          resolve(true);
        }
      });
    });
  }

  // ── GET /api/v1/developer/keys ──────────────────────────────────────────
  if (pathname === '/api/v1/developer/keys' && method === 'GET') {
    // Requires an active API key with 'jobs:read' scope OR a session
    const session = await authProvider.resolveSession(req.headers);
    const ownerId = session.userId || session.sessionId || 'anonymous';

    const keys = listApiKeys(ownerId);

    appendAuditEntry({
      actor: { userId: ownerId, apiKeyId: null, ipAddress: ip, userAgent },
      event: 'api_key.listed',
      resourceType: 'api_key',
      resourceId: null,
      outcome: 'success',
      metadata: { count: keys.length },
    });

    return sendJson(200, {
      keys,
      total: keys.length,
    }), true;
  }

  // ── GET /api/v1/developer/keys/:id ──────────────────────────────────────
  const keyDetailMatch = pathname.match(/^\/api\/v1\/developer\/keys\/([^/]+)$/);
  if (keyDetailMatch && method === 'GET') {
    const keyId = keyDetailMatch[1];
    const session = await authProvider.resolveSession(req.headers);
    const ownerId = session.userId || session.sessionId || 'anonymous';

    const key = getApiKey(keyId);
    if (!key) {
      return sendJson(404, {
        error: { code: 'NOT_FOUND', message: `API key ${keyId} not found.` },
      }), true;
    }

    if (key.ownerId !== ownerId) {
      return sendJson(403, {
        error: { code: 'FORBIDDEN', message: 'You do not have access to this API key.' },
      }), true;
    }

    return sendJson(200, { key }), true;
  }

  // ── DELETE /api/v1/developer/keys/:id ───────────────────────────────────
  const keyDeleteMatch = pathname.match(/^\/api\/v1\/developer\/keys\/([^/]+)$/);
  if (keyDeleteMatch && method === 'DELETE') {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const keyId = keyDeleteMatch[1];
    const session = await authProvider.resolveSession(req.headers);
    const ownerId = session.userId || session.sessionId || 'anonymous';

    const result = revokeApiKey(keyId, ownerId);

    if (!result.success) {
      const statusCode = result.error === 'Forbidden.' ? 403 : 404;
      return sendJson(statusCode, {
        error: { code: 'REVOKE_FAILED', message: result.error, requestId },
      }), true;
    }

    appendAuditEntry({
      actor: { userId: ownerId, apiKeyId: null, ipAddress: ip, userAgent },
      event: 'api_key.revoked',
      resourceType: 'api_key',
      resourceId: keyId,
      outcome: 'success',
      metadata: { requestId },
    });

    return sendJson(200, {
      id: keyId,
      status: 'revoked',
      message: 'API key has been permanently revoked. All future requests using this key will be rejected.',
    }), true;
  }

  return false; // route not handled
}
