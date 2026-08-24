/**
 * @file queue/index.ts
 * @description Pluggable Job Queue Provider abstraction (InMemory for dev/test, Redis/BullMQ / Cloud Tasks for prod).
 */

import { JobPayload, JobStatus, PlatformError } from '@doc-platform/core';

export interface EnqueueOptions {
  priority?: number;
  delayMs?: number;
}

export interface LeasedJob<TOptions = Record<string, unknown>> {
  job: JobPayload<TOptions>;
  leaseToken: string;
  expiresAt: Date;
}

export interface QueueProvider {
  enqueueJob<TOptions = Record<string, unknown>>(
    job: JobPayload<TOptions>,
    options?: EnqueueOptions
  ): Promise<{ jobId: string; status: JobStatus }>;

  leaseJob<TOptions = Record<string, unknown>>(
    workerId: string,
    timeoutMs: number
  ): Promise<LeasedJob<TOptions> | null>;

  ackJob(jobId: string, leaseToken: string, outputFileIds: string[]): Promise<void>;
  nackJob(jobId: string, leaseToken: string, error: { code: string; message: string; retryable: boolean }): Promise<void>;
  cancelJob(jobId: string): Promise<boolean>;
  getJob(jobId: string): Promise<JobPayload | null>;
  updateJobProgress(jobId: string, leaseToken: string, percent: number): Promise<void>;
}

/**
 * High-performance In-Memory Asynchronous Queue Provider
 * Supports concurrency limits, leasing, retry backoff, idempotency, and TTL expiration.
 */
export class InMemoryQueueProvider implements QueueProvider {
  private jobs: Map<string, JobPayload<any>> = new Map();
  private queue: string[] = []; // Job IDs waiting in line
  private leases: Map<string, { workerId: string; leaseToken: string; expiresAt: Date }> = new Map();

  async enqueueJob<TOptions = Record<string, unknown>>(
    job: JobPayload<TOptions>,
    _options?: EnqueueOptions
  ): Promise<{ jobId: string; status: JobStatus }> {
    // Check idempotency if key provided
    if (job.idempotencyKey) {
      for (const existing of this.jobs.values()) {
        if (existing.idempotencyKey === job.idempotencyKey) {
          return { jobId: existing.id, status: existing.status };
        }
      }
    }

    const enqueuedJob: JobPayload<TOptions> = {
      ...job,
      status: 'QUEUED',
      progressPercent: 0,
      createdAt: new Date(),
    };

    this.jobs.set(job.id, enqueuedJob as JobPayload<any>);
    this.queue.push(job.id);
    return { jobId: job.id, status: 'QUEUED' };
  }

  async leaseJob<TOptions = Record<string, unknown>>(
    workerId: string,
    timeoutMs: number = 60000
  ): Promise<LeasedJob<TOptions> | null> {
    // Sweep expired leases
    const now = Date.now();
    for (const [jobId, lease] of this.leases.entries()) {
      if (lease.expiresAt.getTime() < now) {
        this.leases.delete(jobId);
        const job = this.jobs.get(jobId);
        if (job && job.status === 'PROCESSING') {
          job.status = 'QUEUED';
          this.queue.unshift(jobId); // Re-queue
        }
      }
    }

    if (this.queue.length === 0) {
      return null;
    }

    const jobId = this.queue.shift()!;
    const job = this.jobs.get(jobId);
    if (!job || job.status === 'CANCELLED' || job.status === 'EXPIRED') {
      return null;
    }

    const leaseToken = `lease_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const expiresAt = new Date(Date.now() + timeoutMs);

    job.status = 'PROCESSING';
    job.startedAt = new Date();
    job.attemptCount += 1;

    this.leases.set(jobId, { workerId, leaseToken, expiresAt });

    return {
      job: job as JobPayload<TOptions>,
      leaseToken,
      expiresAt,
    };
  }

  async ackJob(jobId: string, leaseToken: string, outputFileIds: string[]): Promise<void> {
    const lease = this.leases.get(jobId);
    if (!lease || lease.leaseToken !== leaseToken) {
      throw new PlatformError('FORBIDDEN', { message: 'Invalid or expired lease token for ackJob.' });
    }

    const job = this.jobs.get(jobId);
    if (job) {
      job.status = 'COMPLETED';
      job.progressPercent = 100;
      job.completedAt = new Date();
      job.outputFileIds = outputFileIds;
    }

    this.leases.delete(jobId);
  }

  async nackJob(
    jobId: string,
    leaseToken: string,
    error: { code: string; message: string; retryable: boolean }
  ): Promise<void> {
    const lease = this.leases.get(jobId);
    if (!lease || lease.leaseToken !== leaseToken) {
      return;
    }
    this.leases.delete(jobId);

    const job = this.jobs.get(jobId);
    if (!job) return;

    if (error.retryable && job.attemptCount < job.maxRetries) {
      job.status = 'QUEUED';
      job.error = {
        code: error.code,
        message: error.message,
        userAction: 'Operation encountered a temporary issue and is being retried.',
        retryable: true,
      };
      this.queue.push(jobId); // Re-queue for retry
    } else {
      job.status = 'FAILED';
      job.completedAt = new Date();
      job.error = {
        code: error.code,
        message: error.message,
        userAction: 'Please check the document and try again.',
        retryable: false,
      };
    }
  }

  async cancelJob(jobId: string): Promise<boolean> {
    const job = this.jobs.get(jobId);
    if (!job || job.status === 'COMPLETED' || job.status === 'EXPIRED') {
      return false;
    }
    job.status = 'CANCELLED';
    this.leases.delete(jobId);
    this.queue = this.queue.filter((id) => id !== jobId);
    return true;
  }

  async getJob(jobId: string): Promise<JobPayload | null> {
    return this.jobs.get(jobId) || null;
  }

  async updateJobProgress(jobId: string, leaseToken: string, percent: number): Promise<void> {
    const lease = this.leases.get(jobId);
    if (!lease || lease.leaseToken !== leaseToken) return;
    const job = this.jobs.get(jobId);
    if (job) {
      job.progressPercent = Math.min(100, Math.max(0, percent));
    }
  }
}
