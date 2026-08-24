/**
 * @file security/file-size-guard.js
 * @description Per-tier file size enforcement middleware.
 *
 * Tier Limits:
 *   ANONYMOUS  → 50MB  (no account, processed locally or in free queue)
 *   FREE       → 50MB  (registered, same as anonymous)
 *   PRO        → 500MB (paid subscription, priority queue)
 *   BUSINESS   → 2GB   (API key, batch pipeline)
 *   ENTERPRISE → 2GB   (custom SLA, dedicated worker pool)
 *
 * Where it runs:
 *   1. Upload Request: Checked before a presigned URL is issued.
 *      We won't even give the client an upload slot for an oversized file.
 *   2. Job Creation: Re-validated when the job is created (defence in depth).
 *   3. Worker: The SandboxedWorkerHarness checks MAX_COMPRESSED_SIZE_BYTES
 *      from pdf-bomb-defense.js as a final backstop.
 *
 * Note on multi-file operations (e.g. Merge):
 *   The size limit applies to EACH individual file AND to the total
 *   combined size of all input files in a single job.
 */

/** Tier size limits in bytes */
export const TIER_SIZE_LIMITS = {
  ANONYMOUS:  50  * 1024 * 1024,        // 50MB
  FREE:       50  * 1024 * 1024,        // 50MB
  PRO:        500 * 1024 * 1024,        // 500MB
  BUSINESS:   2   * 1024 * 1024 * 1024, // 2GB
  ENTERPRISE: 2   * 1024 * 1024 * 1024, // 2GB
};

/**
 * Format bytes into a human-readable string.
 * @param {number} bytes
 * @returns {string}
 */
function formatSize(bytes) {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024 / 1024).toFixed(1)}GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(0)}MB`;
  return `${(bytes / 1024).toFixed(0)}KB`;
}

/**
 * Validate a single file's size against the user's tier limit.
 *
 * @param {number} sizeBytes - Size of the file in bytes
 * @param {string} tier - User tier ('ANONYMOUS' | 'FREE' | 'PRO' | 'BUSINESS' | 'ENTERPRISE')
 * @returns {{ valid: boolean; error?: { code: string; message: string; userAction: string } }}
 */
export function validateFileSize(sizeBytes, tier = 'ANONYMOUS') {
  const limit = TIER_SIZE_LIMITS[tier] ?? TIER_SIZE_LIMITS.ANONYMOUS;

  if (sizeBytes > limit) {
    const isUpgrade = tier === 'ANONYMOUS' || tier === 'FREE';
    return {
      valid: false,
      error: {
        code: 'FILE_TOO_LARGE',
        message: `File size ${formatSize(sizeBytes)} exceeds the ${tier} tier limit of ${formatSize(limit)}.`,
        userAction: isUpgrade
          ? `Upgrade to Pro to upload files up to 500MB. Your file is ${formatSize(sizeBytes)}.`
          : `Your file (${formatSize(sizeBytes)}) exceeds your ${tier} tier limit of ${formatSize(limit)}.`,
      },
    };
  }

  return { valid: true };
}

/**
 * Validate the total combined size of all files in a batch job.
 *
 * @param {Array<{ sizeBytes: number }>} files
 * @param {string} tier
 * @returns {{ valid: boolean; error?: object }}
 */
export function validateTotalJobSize(files, tier = 'ANONYMOUS') {
  const limit = TIER_SIZE_LIMITS[tier] ?? TIER_SIZE_LIMITS.ANONYMOUS;
  const total = files.reduce((sum, f) => sum + (f.sizeBytes || f.size || 0), 0);

  if (total > limit) {
    const isUpgrade = tier === 'ANONYMOUS' || tier === 'FREE';
    return {
      valid: false,
      error: {
        code: 'TOTAL_SIZE_TOO_LARGE',
        message: `Total job size ${formatSize(total)} exceeds the ${tier} tier limit of ${formatSize(limit)}.`,
        userAction: isUpgrade
          ? `Upgrade to Pro to process batches up to 500MB total. Your batch is ${formatSize(total)}.`
          : `Your batch (${formatSize(total)}) exceeds your ${tier} tier limit of ${formatSize(limit)}.`,
      },
    };
  }

  return { valid: true };
}
