/**
 * @file sandbox.ts
 * @description Isolated sandboxed execution harness with execution budgets, timeout guarantees, and automated disk cleanup.
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import { PlatformError, ProcessingResult, WorkerExecutionContext } from '@doc-platform/core';

export interface SandboxConfig {
  defaultTimeoutMs?: number;
  maxMemoryBytes?: number;
}

export class SandboxedWorkerHarness {
  private config: Required<SandboxConfig>;

  constructor(config?: SandboxConfig) {
    this.config = {
      defaultTimeoutMs: config?.defaultTimeoutMs || 60000, // 60 seconds default
      maxMemoryBytes: config?.maxMemoryBytes || 512 * 1024 * 1024, // 512 MB
    };
  }

  async runIsolated<T>(
    jobId: string,
    workerId: string,
    taskFn: (context: WorkerExecutionContext) => Promise<T>
  ): Promise<T> {
    const tempDir = path.join(os.tmpdir(), `doc_job_${jobId}_${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });

    let isCancelled = false;
    const timeoutMs = this.config.defaultTimeoutMs;

    const context: WorkerExecutionContext = {
      jobId,
      workerId,
      timeoutMs,
      maxMemoryBytes: this.config.maxMemoryBytes,
      tempWorkingDir: tempDir,
      isCancelled: () => isCancelled,
      onProgress: async (_percent: number) => {
        if (isCancelled) {
          throw new PlatformError('JOB_CANCELLED', { jobId });
        }
      },
    };

    let timerId: NodeJS.Timeout | null = null;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timerId = setTimeout(() => {
        isCancelled = true;
        reject(
          new PlatformError('JOB_TIMEOUT', {
            jobId,
            message: `Job ${jobId} exceeded execution budget of ${timeoutMs}ms.`,
          })
        );
      }, timeoutMs);
    });

    try {
      const result = await Promise.race([taskFn(context), timeoutPromise]);
      return result;
    } finally {
      if (timerId) clearTimeout(timerId);
      // Clean up temporary workspace
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch {
        // Silently ignore cleanup errors
      }
    }
  }
}
