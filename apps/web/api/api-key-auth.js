/**
 * @file api-key-auth.js
 * @description API Key authentication middleware for Phase 7 developer routes.
 *
 * AUTHENTICATION SCHEME:
 *   Authorization: Bearer dpk_<base64url_secret>
 *
 * The middleware:
 *  1. Extracts the Bearer token from the Authorization header
 *  2. Validates the token via constant-time HMAC comparison (authenticateApiKey)
 *  3. Checks that the key has the required scope for the requested route
 *  4. Appends audit log entry for all authentication attempts
 *  5. Injects `req.apiKeyContext` with key metadata for downstream handlers
 *
 * SECURITY NOTES:
 *  - Timing-safe comparison prevents oracle attacks
 *  - Rate limiting (existing middleware) still applies before auth middleware
 *  - 401 vs 403 distinction is strictly maintained (unauthenticated vs unauthorized)
 */

import { authenticateApiKey } from './api-key-store.js';
import { appendAuditEntry } from './usage-store.js';

/**
 * Extracts the Bearer token from an Authorization header.
 * Returns null if header is missing or malformed.
 * @param {string|undefined} authHeader
 * @returns {string|null}
 */
function extractBearerToken(authHeader) {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') return null;
  return parts[1] || null;
}

/**
 * Retrieves the client's real IP, respecting trusted proxy headers.
 * In production, configure trusted proxy list precisely.
 * @param {import('node:http').IncomingMessage} req
 * @returns {string}
 */
function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || 'unknown';
}

/**
 * Middleware factory that authenticates and authorizes API key requests.
 *
 * @param {import('@doc-platform/core').ApiKeyScope} requiredScope - Scope required for this route
 * @returns {(req: object, res: object, sendJson: Function, next: Function) => Promise<boolean>}
 *   Returns true if the request was rejected (caller should return immediately).
 *   Returns false if the request is authenticated and authorized.
 */
export function requireApiKeyAuth(requiredScope) {
  /**
   * @param {import('node:http').IncomingMessage} req
   * @param {import('node:http').ServerResponse} res
   * @param {Function} sendJson
   * @returns {Promise<boolean>} true = rejected, false = proceed
   */
  return async function applyApiKeyAuth(req, res, sendJson) {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const ip = getClientIp(req);
    const userAgent = req.headers['user-agent'] || 'unknown';

    const rawKey = extractBearerToken(req.headers['authorization']);

    if (!rawKey) {
      appendAuditEntry({
        actor: { userId: null, apiKeyId: null, ipAddress: ip, userAgent },
        event: 'auth.invalid_key',
        resourceType: 'auth',
        resourceId: null,
        outcome: 'failure',
        metadata: { reason: 'Missing or malformed Authorization header', requestId },
      });

      sendJson(401, {
        error: {
          code: 'UNAUTHORIZED',
          message: 'API key required. Include: Authorization: Bearer dpk_<key>',
          requestId,
        },
      });
      return true; // rejected
    }

    const keyRecord = authenticateApiKey(rawKey);

    if (!keyRecord) {
      appendAuditEntry({
        actor: { userId: null, apiKeyId: null, ipAddress: ip, userAgent },
        event: 'auth.invalid_key',
        resourceType: 'auth',
        resourceId: null,
        outcome: 'failure',
        metadata: { reason: 'Invalid or revoked API key', requestId },
      });

      sendJson(401, {
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid, revoked, or expired API key.',
          requestId,
        },
      });
      return true; // rejected
    }

    // Check scope authorization
    if (!keyRecord.scopes.includes(requiredScope)) {
      appendAuditEntry({
        actor: { userId: keyRecord.ownerId, apiKeyId: keyRecord.id, ipAddress: ip, userAgent },
        event: 'auth.invalid_key',
        resourceType: 'auth',
        resourceId: keyRecord.id,
        outcome: 'blocked',
        metadata: {
          reason: 'Insufficient scope',
          requiredScope,
          grantedScopes: keyRecord.scopes,
          requestId,
        },
      });

      sendJson(403, {
        error: {
          code: 'FORBIDDEN',
          message: `This API key does not have the required scope: ${requiredScope}`,
          requestId,
        },
      });
      return true; // rejected
    }

    // SUCCESS — inject context for downstream handlers
    req.apiKeyContext = {
      keyId: keyRecord.id,
      ownerId: keyRecord.ownerId,
      tier: keyRecord.tier,
      scopes: keyRecord.scopes,
      requestId,
    };

    // Log successful API key usage
    appendAuditEntry({
      actor: { userId: keyRecord.ownerId, apiKeyId: keyRecord.id, ipAddress: ip, userAgent },
      event: 'auth.api_key_used',
      resourceType: 'auth',
      resourceId: keyRecord.id,
      outcome: 'success',
      metadata: { scope: requiredScope, requestId },
    });

    return false; // proceed
  };
}
