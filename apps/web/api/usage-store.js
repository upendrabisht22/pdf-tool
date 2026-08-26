/**
 * @file usage-store.js
 * @description Immutable usage event store and audit log for DocPlatform.
 *
 * DESIGN DECISIONS:
 *  - Usage events are append-only. insertUsageEvent() is the only write path.
 *  - Audit log entries are similarly append-only with no delete operation exposed.
 *  - All IDs use crypto.randomBytes for uniqueness guarantees.
 *  - getUsageSummary() computes aggregations in-memory; in production this
 *    maps to a pre-aggregated analytics table (e.g. ClickHouse / BigQuery).
 *  - The in-memory store is bounded to 10,000 events before a circular buffer
 *    eviction strategy applies (oldest event dropped first).
 */

import { randomBytes } from 'node:crypto';

/** Maximum events retained in memory before oldest are evicted */
const MAX_USAGE_EVENTS = 10_000;
const MAX_AUDIT_ENTRIES = 50_000;

/** @type {import('@doc-platform/core').UsageEvent[]} */
const usageEvents = [];

/** @type {import('@doc-platform/core').AuditLogEntry[]} */
const auditLog = [];

// ---------------------------------------------------------------------------
// Usage Events
// ---------------------------------------------------------------------------

/**
 * Records a new immutable usage event.
 * @param {Omit<import('@doc-platform/core').UsageEvent, 'id' | 'recordedAt'>} params
 * @returns {import('@doc-platform/core').UsageEvent}
 */
export function insertUsageEvent(params) {
  const event = {
    id: `evt_${randomBytes(8).toString('hex')}`,
    ...params,
    recordedAt: new Date().toISOString(),
  };

  usageEvents.push(event);

  // Bounded circular buffer — evict oldest when over limit
  if (usageEvents.length > MAX_USAGE_EVENTS) {
    usageEvents.shift();
  }

  return event;
}

/**
 * Queries usage events for a given owner, with optional time window and operation filter.
 * @param {object} params
 * @param {string} params.ownerId
 * @param {string} [params.since] - ISO timestamp lower bound
 * @param {string} [params.until] - ISO timestamp upper bound
 * @param {string} [params.operation] - Filter by operation type
 * @param {number} [params.limit] - Max events to return (default: 100, max: 1000)
 * @returns {import('@doc-platform/core').UsageEvent[]}
 */
export function queryUsageEvents({ ownerId, since, until, operation, limit = 100 }) {
  const effectiveLimit = Math.min(limit, 1000);

  return usageEvents
    .filter((e) => {
      if (e.ownerId !== ownerId) return false;
      if (since && e.recordedAt < since) return false;
      if (until && e.recordedAt > until) return false;
      if (operation && e.operation !== operation) return false;
      return true;
    })
    .slice(-effectiveLimit)
    .reverse(); // most recent first
}

/**
 * Computes an aggregated usage summary for a given owner and time window.
 * @param {object} params
 * @param {string} params.ownerId
 * @param {string} params.windowStart - ISO timestamp
 * @param {string} params.windowEnd - ISO timestamp
 * @returns {import('@doc-platform/core').UsageSummary}
 */
export function getUsageSummary({ ownerId, windowStart, windowEnd }) {
  const windowEvents = usageEvents.filter(
    (e) =>
      e.ownerId === ownerId &&
      e.recordedAt >= windowStart &&
      e.recordedAt <= windowEnd,
  );

  const operationBreakdown = {};
  let totalInputBytes = 0;
  let totalOutputBytes = 0;
  let totalDurationMs = 0;
  let successfulRequests = 0;
  let failedRequests = 0;

  for (const e of windowEvents) {
    operationBreakdown[e.operation] = (operationBreakdown[e.operation] || 0) + 1;
    totalInputBytes += e.inputBytes;
    totalOutputBytes += e.outputBytes;
    totalDurationMs += e.durationMs;
    if (e.statusCode >= 200 && e.statusCode < 300) {
      successfulRequests++;
    } else {
      failedRequests++;
    }
  }

  return {
    ownerId,
    windowStart,
    windowEnd,
    totalRequests: windowEvents.length,
    successfulRequests,
    failedRequests,
    totalInputBytes,
    totalOutputBytes,
    totalDurationMs,
    operationBreakdown,
  };
}

// ---------------------------------------------------------------------------
// Audit Log (Append-Only)
// ---------------------------------------------------------------------------

/**
 * Appends an immutable entry to the audit log.
 * This is the ONLY write path for audit log entries.
 *
 * @param {Omit<import('@doc-platform/core').AuditLogEntry, 'id' | 'occurredAt'>} params
 * @returns {import('@doc-platform/core').AuditLogEntry}
 */
export function appendAuditEntry(params) {
  const entry = {
    id: `aud_${randomBytes(8).toString('hex')}`,
    ...params,
    occurredAt: new Date().toISOString(),
  };

  auditLog.push(entry);

  // Bounded circular buffer
  if (auditLog.length > MAX_AUDIT_ENTRIES) {
    auditLog.shift();
  }

  return entry;
}

/**
 * Queries the audit log for a given owner.
 * @param {object} params
 * @param {string} params.ownerId - Must be the actor.userId or resource owner
 * @param {string} [params.since] - ISO timestamp lower bound
 * @param {string} [params.until] - ISO timestamp upper bound
 * @param {string} [params.event] - Filter by event type
 * @param {string} [params.resourceType] - Filter by resource type
 * @param {number} [params.limit] - Max entries to return (default: 50, max: 500)
 * @returns {import('@doc-platform/core').AuditLogEntry[]}
 */
export function queryAuditLog({ ownerId, since, until, event, resourceType, limit = 50 }) {
  const effectiveLimit = Math.min(limit, 500);

  return auditLog
    .filter((e) => {
      const isActor = e.actor.userId === ownerId;
      if (!isActor) return false;
      if (since && e.occurredAt < since) return false;
      if (until && e.occurredAt > until) return false;
      if (event && e.event !== event) return false;
      if (resourceType && e.resourceType !== resourceType) return false;
      return true;
    })
    .slice(-effectiveLimit)
    .reverse(); // most recent first
}
