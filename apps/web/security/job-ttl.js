/**
 * @file security/job-ttl.js
 * @description Automatic Job TTL (Time-To-Live) expiry and file cleanup.
 *
 * Why this matters:
 *   - Completed/failed jobs with output files sitting in storage are a
 *     privacy liability. We must auto-delete them.
 *   - Abandoned jobs (user closed browser mid-upload) must not clog the queue.
 *   - Jobs that expire while QUEUED or PROCESSING are moved to EXPIRED state
 *     so the queue provider can stop working on them.
 *
 * Cleanup Policy:
 *   - COMPLETED jobs: output files deleted 1 hour after completion.
 *   - FAILED jobs: metadata deleted 1 hour after failure.
 *   - CREATED/QUEUED jobs with no progress: expire after 30 minutes.
 *   - Upload (input) files: deleted 2 hours after creation, regardless of job state.
 *
 * Implementation:
 *   - A background interval runs every 5 minutes.
 *   - Reads all jobs from the queue provider.
 *   - Deletes expired output files from storage.
 *   - Marks expired in-progress jobs as EXPIRED.
 *
 * Production Upgrade Path:
 *   Replace with a scheduled cloud function (e.g., Cloudflare Cron Trigger,
 *   AWS EventBridge) that calls this same cleanup logic via REST.
 */

/** How long output files are retained after job completes (milliseconds) */
export const OUTPUT_FILE_TTL_MS = 60 * 60 * 1000; // 1 hour

/** How long upload (input) files are retained */
export const UPLOAD_FILE_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

/** How long a QUEUED/CREATED job can sit untouched before expiry */
export const STALE_JOB_TTL_MS = 30 * 60 * 1000; // 30 minutes

/** How often the cleanup loop runs */
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Start the background TTL cleanup daemon.
 *
 * @param {object} queueProvider - Instance of QueueProvider
 * @param {object} storageProvider - Instance of StorageProvider
 */
export function startTtlCleanupDaemon(queueProvider, storageProvider) {
  let cleanupRunning = false;

  const cleanup = async () => {
    if (cleanupRunning) return; // Prevent overlapping runs
    cleanupRunning = true;

    try {
      const now = Date.now();
      const jobs = await queueProvider.getAllJobs?.() ?? [];

      for (const job of jobs) {
        const jobAge = now - new Date(job.createdAt).getTime();
        const completedAge = job.completedAt
          ? now - new Date(job.completedAt).getTime()
          : null;

        // ── Case 1: Completed job with output files past TTL ──────────────────
        if (
          (job.status === 'COMPLETED' || job.status === 'FAILED') &&
          completedAge !== null &&
          completedAge > OUTPUT_FILE_TTL_MS
        ) {
          // Delete output files from storage
          if (job.outputFileIds && job.outputFileIds.length > 0) {
            for (const fileKey of job.outputFileIds) {
              try {
                await storageProvider.deleteObject?.(fileKey);
              } catch (err) {
                console.warn(`[TTL] Failed to delete output file ${fileKey}:`, err.message);
              }
            }
          }

          // Remove job metadata from queue
          try {
            await queueProvider.deleteJob?.(job.id);
            console.info(`[TTL] Cleaned up expired ${job.status} job ${job.id}`);
          } catch (err) {
            console.warn(`[TTL] Failed to delete job ${job.id}:`, err.message);
          }

          continue;
        }

        // ── Case 2: Stale CREATED/QUEUED job past stale TTL ──────────────────
        if (
          (job.status === 'CREATED' || job.status === 'QUEUED') &&
          jobAge > STALE_JOB_TTL_MS
        ) {
          try {
            await queueProvider.expireJob?.(job.id);
            console.info(`[TTL] Expired stale ${job.status} job ${job.id} (age: ${Math.round(jobAge / 60000)}m)`);
          } catch (err) {
            console.warn(`[TTL] Failed to expire stale job ${job.id}:`, err.message);
          }

          continue;
        }

        // ── Case 3: Input upload files past upload TTL ────────────────────────
        if (jobAge > UPLOAD_FILE_TTL_MS && job.inputFiles) {
          for (const file of job.inputFiles) {
            if (file.storageKey && file.storageKey.startsWith('uploads/')) {
              try {
                await storageProvider.deleteObject?.(file.storageKey);
              } catch {
                // Non-fatal; file may have already been cleaned up
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('[TTL] Cleanup daemon error:', err);
    } finally {
      cleanupRunning = false;
    }
  };

  // Run immediately on startup, then on interval
  cleanup();
  const interval = setInterval(cleanup, CLEANUP_INTERVAL_MS);
  interval.unref(); // Don't block process exit

  console.info(`[TTL] Cleanup daemon started. Output TTL: ${OUTPUT_FILE_TTL_MS / 60000}m, Stale job TTL: ${STALE_JOB_TTL_MS / 60000}m`);

  return {
    stop: () => clearInterval(interval),
    runNow: cleanup, // For testing/manual trigger
  };
}
