/**
 * @file usage-routes.js
 * @description Phase 7 — Usage Telemetry & Audit Log Routes.
 *
 * Routes:
 *   GET /api/v1/usage                — Query usage events (with filters)
 *   GET /api/v1/usage/summary        — Aggregated usage stats for a time window
 *   GET /api/v1/audit-log            — Query the immutable audit log
 *
 * Authentication:
 *   All routes require API key with 'usage:read' scope (for /usage),
 *   or 'audit:read' scope (for /audit-log), OR a valid web session.
 */

import { queryUsageEvents, getUsageSummary, queryAuditLog } from './usage-store.js';

// ---------------------------------------------------------------------------
// Query Parameter Parsers
// ---------------------------------------------------------------------------

/**
 * Parses and clamps an integer query param.
 * @param {string|null} value
 * @param {number} defaultVal
 * @param {number} max
 * @returns {number}
 */
function parseLimit(value, defaultVal, max) {
  const n = parseInt(value, 10);
  if (isNaN(n) || n < 1) return defaultVal;
  return Math.min(n, max);
}

/**
 * Validates an ISO 8601 date string.
 * @param {string|null} value
 * @returns {string|null} Valid ISO string or null
 */
function parseIsoDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

// ---------------------------------------------------------------------------
// Route Handler
// ---------------------------------------------------------------------------

/**
 * Handles all /api/v1/usage/* and /api/v1/audit-log routes.
 *
 * @param {import('node:http').IncomingMessage} req
 * @param {import('node:http').ServerResponse} res
 * @param {string} pathname
 * @param {import('node:url').URL} url - Parsed URL with searchParams
 * @param {Function} sendJson
 * @param {object} authProvider
 * @returns {Promise<boolean>} true if route was handled
 */
export async function handleUsageRoutes(req, res, pathname, url, sendJson, authProvider) {
  const method = req.method;
  if (method !== 'GET') return false;

  const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  // Resolve owner
  const session = await authProvider.resolveSession(req.headers);
  const ownerId = req.apiKeyContext?.ownerId || session.userId || session.sessionId || 'anonymous';

  // ── GET /api/v1/usage ────────────────────────────────────────────────────
  if (pathname === '/api/v1/usage') {
    const since = parseIsoDate(url.searchParams.get('since'));
    const until = parseIsoDate(url.searchParams.get('until'));
    const operation = url.searchParams.get('operation') || undefined;
    const limit = parseLimit(url.searchParams.get('limit'), 100, 1000);

    const events = queryUsageEvents({ ownerId, since, until, operation, limit });

    return sendJson(200, {
      events,
      total: events.length,
      filters: { since, until, operation, limit },
      requestId,
    }), true;
  }

  // ── GET /api/v1/usage/summary ─────────────────────────────────────────────
  if (pathname === '/api/v1/usage/summary') {
    // Default window: last 30 days
    const now = new Date();
    const defaultStart = new Date(now.getTime() - 30 * 86400000).toISOString();

    const windowStart = parseIsoDate(url.searchParams.get('since')) || defaultStart;
    const windowEnd = parseIsoDate(url.searchParams.get('until')) || now.toISOString();

    if (windowStart > windowEnd) {
      return sendJson(422, {
        error: {
          code: 'VALIDATION_ERROR',
          message: '"since" must be before "until".',
          requestId,
        },
      }), true;
    }

    const summary = getUsageSummary({ ownerId, windowStart, windowEnd });

    return sendJson(200, {
      summary,
      requestId,
    }), true;
  }

  // ── GET /api/v1/audit-log ─────────────────────────────────────────────────
  if (pathname === '/api/v1/audit-log') {
    const since = parseIsoDate(url.searchParams.get('since'));
    const until = parseIsoDate(url.searchParams.get('until'));
    const event = url.searchParams.get('event') || undefined;
    const resourceType = url.searchParams.get('resourceType') || undefined;
    const limit = parseLimit(url.searchParams.get('limit'), 50, 500);

    const entries = queryAuditLog({ ownerId, since, until, event, resourceType, limit });

    return sendJson(200, {
      entries,
      total: entries.length,
      filters: { since, until, event, resourceType, limit },
      requestId,
    }), true;
  }

  return false; // route not handled
}
