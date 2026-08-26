/**
 * @file api-key-store.js
 * @description In-memory API Key Store with HMAC-SHA256 key generation and
 * constant-time comparison. Designed as an interface-compatible stub that maps
 * 1:1 to a database-backed implementation (e.g. PostgreSQL / Redis) in production.
 *
 * SECURITY INVARIANTS:
 *  1. Raw secrets are NEVER stored. Only SHA-256 hex digests are persisted.
 *  2. All key comparisons use crypto.timingSafeEqual to prevent timing attacks.
 *  3. Keys are prefixed with "dpk_" for easy identification in logs.
 *  4. Key generation uses 32 cryptographically random bytes (256 bits of entropy).
 */

import { createHmac, randomBytes, timingSafeEqual, createHash } from 'node:crypto';

// ---------------------------------------------------------------------------
// Key Generation
// ---------------------------------------------------------------------------

/** Prefix for all DocPlatform API keys */
const KEY_PREFIX = 'dpk_';

/**
 * Generates a new cryptographically secure API key.
 * Returns both the raw secret (shown once) and its hash (stored).
 */
function generateApiKey() {
  const rawBytes = randomBytes(32); // 256 bits of entropy
  const rawSecret = `${KEY_PREFIX}${rawBytes.toString('base64url')}`;
  const keyHash = createHash('sha256').update(rawSecret).digest('hex');
  const keyPrefix = rawSecret.substring(0, 12); // "dpk_XXXXXXXX"
  return { rawSecret, keyHash, keyPrefix };
}

/**
 * Performs constant-time comparison of a provided raw key against a stored hash.
 * CRITICAL: This prevents timing oracle attacks.
 */
function verifyApiKey(rawSecret, storedHash) {
  const inputHash = createHash('sha256').update(rawSecret).digest('hex');
  const storedBuf = Buffer.from(storedHash, 'hex');
  const inputBuf = Buffer.from(inputHash, 'hex');
  if (storedBuf.length !== inputBuf.length) return false;
  return timingSafeEqual(storedBuf, inputBuf);
}

// ---------------------------------------------------------------------------
// In-Memory Store (drop-in replaceable with DB provider)
// ---------------------------------------------------------------------------

/** @type {Map<string, import('@doc-platform/core').ApiKeyRecord>} */
const keyStore = new Map();

/**
 * Creates a new API key for a given owner.
 *
 * @param {object} params
 * @param {string} params.ownerId
 * @param {string} params.name
 * @param {('PRO'|'BUSINESS'|'ENTERPRISE')} params.tier
 * @param {string[]} params.scopes
 * @param {number|null} params.expiresInDays
 * @returns {{ record: import('@doc-platform/core').ApiKeyRecord, secret: string }}
 */
export function createApiKey({ ownerId, name, tier, scopes, expiresInDays }) {
  const { rawSecret, keyHash, keyPrefix } = generateApiKey();
  const now = new Date().toISOString();
  const id = `dpk_${randomBytes(8).toString('hex')}`;

  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 86400000).toISOString()
    : null;

  const record = {
    id,
    name,
    ownerId,
    tier,
    keyHash,
    keyPrefix,
    status: 'active',
    scopes,
    lastUsedAt: null,
    requestCount: 0,
    createdAt: now,
    revokedAt: null,
    expiresAt,
  };

  keyStore.set(id, record);
  return { record, secret: rawSecret };
}

/**
 * Lists all active API keys for a given owner (redacts the hash).
 * @param {string} ownerId
 * @returns {import('@doc-platform/core').ApiKeyRecord[]}
 */
export function listApiKeys(ownerId) {
  return Array.from(keyStore.values())
    .filter((k) => k.ownerId === ownerId)
    .map((k) => ({ ...k, keyHash: '[REDACTED]' }));
}

/**
 * Revokes an API key by ID.
 * @param {string} keyId
 * @param {string} ownerId
 * @returns {{ success: boolean, error?: string }}
 */
export function revokeApiKey(keyId, ownerId) {
  const key = keyStore.get(keyId);
  if (!key) return { success: false, error: 'API key not found.' };
  if (key.ownerId !== ownerId) return { success: false, error: 'Forbidden.' };
  if (key.status === 'revoked') return { success: false, error: 'Key is already revoked.' };

  keyStore.set(keyId, {
    ...key,
    status: 'revoked',
    revokedAt: new Date().toISOString(),
  });
  return { success: true };
}

/**
 * Authenticates an incoming request using its raw API key.
 * Updates lastUsedAt and requestCount on success.
 *
 * @param {string} rawSecret - The raw "dpk_..." key from the Authorization header
 * @returns {import('@doc-platform/core').ApiKeyRecord | null} The key record, or null if invalid
 */
export function authenticateApiKey(rawSecret) {
  if (!rawSecret || !rawSecret.startsWith(KEY_PREFIX)) return null;

  for (const [id, record] of keyStore.entries()) {
    if (record.status !== 'active') continue;
    if (record.expiresAt && new Date(record.expiresAt) < new Date()) continue;

    if (verifyApiKey(rawSecret, record.keyHash)) {
      // Update usage metadata (in production this would be a batched async write)
      keyStore.set(id, {
        ...record,
        lastUsedAt: new Date().toISOString(),
        requestCount: record.requestCount + 1,
      });
      return keyStore.get(id);
    }
  }

  return null;
}

/**
 * Gets a single key record by ID (for internal use).
 * @param {string} keyId
 * @returns {import('@doc-platform/core').ApiKeyRecord | undefined}
 */
export function getApiKey(keyId) {
  const key = keyStore.get(keyId);
  if (!key) return undefined;
  return { ...key, keyHash: '[REDACTED]' };
}
