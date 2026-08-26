/**
 * @file api-types.ts
 * @description Phase 7 — Canonical domain types for the Developer API Platform.
 * Covers API Key management, Webhook subscriptions, Usage telemetry, and Audit log.
 *
 * DESIGN PRINCIPLES:
 *  - All IDs are opaque strings (prefixed for readability: dpk_, wh_, evt_, aud_)
 *  - Keys are never stored raw; only a SHA-256 HMAC digest is persisted
 *  - Webhooks use HMAC-SHA256 payload signing (same pattern as GitHub/Stripe)
 *  - Audit log is append-only (no updates, no deletes permitted by the type system)
 *  - Usage events are immutable after creation
 */

// ============================================================================
// 1. API KEY DOMAIN
// ============================================================================

/** Lifecycle states of an API key. */
export type ApiKeyStatus = 'active' | 'revoked' | 'expired';

/**
 * Represents a persisted API key record.
 * The raw secret is NEVER stored — only the hash is kept.
 */
export interface ApiKeyRecord {
  /** Opaque ID with "dpk_" prefix, e.g. dpk_abc123 */
  id: string;
  /** Human-readable name given by the developer, e.g. "Production App Key" */
  name: string;
  /** Owner user ID (maps to the authenticated user who created the key) */
  ownerId: string;
  /** User tier at time of creation, controls rate limits applied to this key */
  tier: 'PRO' | 'BUSINESS' | 'ENTERPRISE';
  /** SHA-256 hex digest of the raw secret. Used for constant-time comparison. */
  keyHash: string;
  /** First 8 characters of the raw key for display purposes, e.g. "dpk_ab1c" */
  keyPrefix: string;
  /** Lifecycle status */
  status: ApiKeyStatus;
  /** Scopes this key is authorized for */
  scopes: ApiKeyScope[];
  /** ISO timestamp of last successful authenticated request, or null */
  lastUsedAt: string | null;
  /** Total requests made using this key */
  requestCount: number;
  /** ISO timestamp of key creation */
  createdAt: string;
  /** ISO timestamp of key revocation, or null if still active */
  revokedAt: string | null;
  /** ISO timestamp when the key expires, or null for indefinite keys */
  expiresAt: string | null;
}

/**
 * Scopes define which API capabilities a key is authorized to access.
 * Follows a resource:action pattern for fine-grained control.
 */
export type ApiKeyScope =
  | 'jobs:read'
  | 'jobs:write'
  | 'files:read'
  | 'files:write'
  | 'webhooks:read'
  | 'webhooks:write'
  | 'usage:read'
  | 'audit:read';

/** All available scopes — used for validation */
export const ALL_API_SCOPES: readonly ApiKeyScope[] = [
  'jobs:read',
  'jobs:write',
  'files:read',
  'files:write',
  'webhooks:read',
  'webhooks:write',
  'usage:read',
  'audit:read',
] as const;

/**
 * Response shape returned once when a new key is created.
 * The `secret` field is only returned here — it is NEVER returned again.
 */
export interface ApiKeyCreatedResponse {
  id: string;
  name: string;
  /** Full raw secret — shown ONCE, never stored. Starts with "dpk_" */
  secret: string;
  keyPrefix: string;
  scopes: ApiKeyScope[];
  tier: string;
  createdAt: string;
  expiresAt: string | null;
}

// ============================================================================
// 2. WEBHOOK DOMAIN
// ============================================================================

/** Lifecycle states of a webhook subscription. */
export type WebhookStatus = 'active' | 'paused' | 'failing';

/**
 * Events that DocPlatform will dispatch to registered webhook endpoints.
 */
export type WebhookEventType =
  | 'job.completed'
  | 'job.failed'
  | 'job.cancelled'
  | 'job.queued'
  | 'file.uploaded'
  | 'file.expired'
  | 'api_key.revoked';

/** All webhook event types */
export const ALL_WEBHOOK_EVENTS: readonly WebhookEventType[] = [
  'job.completed',
  'job.failed',
  'job.cancelled',
  'job.queued',
  'file.uploaded',
  'file.expired',
  'api_key.revoked',
] as const;

/**
 * A registered webhook subscription.
 */
export interface WebhookRecord {
  /** Opaque ID with "wh_" prefix */
  id: string;
  /** Owner user ID */
  ownerId: string;
  /** Target URL where signed POST payloads will be delivered */
  url: string;
  /** Human-readable label */
  description: string;
  /** Event types this webhook subscribes to */
  events: WebhookEventType[];
  /** Status of the webhook endpoint */
  status: WebhookStatus;
  /**
   * HMAC-SHA256 secret used to sign all outgoing payloads.
   * This IS stored (unlike API keys) because it must be used to sign each delivery.
   * Must be stored encrypted at rest in production.
   */
  secret: string;
  /** ISO timestamp of last successful delivery */
  lastDeliveredAt: string | null;
  /** Total number of successful deliveries */
  successCount: number;
  /** Total number of failed delivery attempts */
  failureCount: number;
  /** Consecutive failures (resets to 0 on success). If ≥ 5, status → 'failing'. */
  consecutiveFailures: number;
  /** ISO timestamp of creation */
  createdAt: string;
  /** ISO timestamp of last update */
  updatedAt: string;
}

/**
 * The payload body delivered to a webhook endpoint via HTTP POST.
 */
export interface WebhookDeliveryPayload {
  /** Unique delivery ID for idempotent processing by the receiver */
  deliveryId: string;
  /** The registered webhook subscription ID */
  webhookId: string;
  /** Event type */
  event: WebhookEventType;
  /** ISO timestamp of when the event occurred */
  timestamp: string;
  /** Event data (structure varies by event type) */
  data: Record<string, unknown>;
  /** DocPlatform API version for this payload schema */
  apiVersion: '2026-01';
}

/**
 * Record of a single webhook delivery attempt.
 */
export interface WebhookDeliveryAttempt {
  /** Opaque delivery attempt ID */
  id: string;
  /** Parent webhook ID */
  webhookId: string;
  /** The event that triggered this delivery */
  event: WebhookEventType;
  /** HTTP status code returned by the receiver (null if network error) */
  responseStatus: number | null;
  /** Latency in milliseconds */
  latencyMs: number;
  /** Whether the delivery was successful (2xx response within timeout) */
  success: boolean;
  /** Error message if delivery failed */
  error: string | null;
  /** ISO timestamp of this attempt */
  attemptedAt: string;
  /** Which retry attempt this was (0 = first attempt) */
  attemptNumber: number;
}

// ============================================================================
// 3. USAGE TELEMETRY DOMAIN
// ============================================================================

/**
 * An immutable usage event recorded for every API operation.
 * Used for billing, analytics, and quota enforcement.
 */
export interface UsageEvent {
  /** Opaque event ID with "evt_" prefix */
  id: string;
  /** Owner user ID */
  ownerId: string;
  /** API key ID if the request was authenticated via API key */
  apiKeyId: string | null;
  /** The PDF/AI operation performed */
  operation: string;
  /** HTTP status code of the outcome */
  statusCode: number;
  /** Total bytes of input files processed */
  inputBytes: number;
  /** Total bytes of output produced */
  outputBytes: number;
  /** Processing duration in milliseconds */
  durationMs: number;
  /** The job ID if associated */
  jobId: string | null;
  /** ISO timestamp */
  recordedAt: string;
}

/**
 * Aggregated usage statistics for a time window.
 */
export interface UsageSummary {
  ownerId: string;
  windowStart: string;
  windowEnd: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalInputBytes: number;
  totalOutputBytes: number;
  totalDurationMs: number;
  operationBreakdown: Record<string, number>;
}

// ============================================================================
// 4. AUDIT LOG DOMAIN
// ============================================================================

/**
 * Audit event types — covers all security-relevant and billing-relevant actions.
 */
export type AuditEventType =
  | 'api_key.created'
  | 'api_key.revoked'
  | 'api_key.listed'
  | 'webhook.created'
  | 'webhook.deleted'
  | 'webhook.paused'
  | 'webhook.resumed'
  | 'job.submitted'
  | 'job.completed'
  | 'job.failed'
  | 'file.uploaded'
  | 'file.downloaded'
  | 'file.deleted'
  | 'auth.api_key_used'
  | 'auth.invalid_key'
  | 'quota.exceeded'
  | 'security.rate_limited';

/**
 * An append-only audit log entry.
 * INVARIANT: Once created, audit records MUST NOT be modified or deleted.
 */
export interface AuditLogEntry {
  /** Opaque ID with "aud_" prefix */
  id: string;
  /** Actor who performed the action */
  actor: {
    userId: string | null;
    apiKeyId: string | null;
    ipAddress: string;
    userAgent: string;
  };
  /** Type of event */
  event: AuditEventType;
  /** Resource type affected */
  resourceType: 'api_key' | 'webhook' | 'job' | 'file' | 'auth' | 'quota' | 'security';
  /** Resource ID affected */
  resourceId: string | null;
  /** Outcome of the action */
  outcome: 'success' | 'failure' | 'blocked';
  /** Additional structured metadata about the event */
  metadata: Record<string, unknown>;
  /** ISO timestamp — immutable */
  occurredAt: string;
}

// ============================================================================
// 5. API REQUEST/RESPONSE CONTRACTS
// ============================================================================

/** POST /api/v1/developer/keys — Create API key */
export interface CreateApiKeyRequest {
  name: string;
  scopes: ApiKeyScope[];
  /** Optional expiry in days from now. Omit for no expiry. Max: 365 */
  expiresInDays?: number;
}

/** POST /api/v1/webhooks — Register webhook */
export interface CreateWebhookRequest {
  url: string;
  description?: string;
  events: WebhookEventType[];
}

/** PATCH /api/v1/webhooks/:id — Update webhook */
export interface UpdateWebhookRequest {
  description?: string;
  events?: WebhookEventType[];
  status?: 'active' | 'paused';
}

/** Standard API error envelope */
export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    requestId: string;
  };
}
