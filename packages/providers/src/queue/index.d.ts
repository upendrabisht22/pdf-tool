/**
 * @file queue/index.ts
 * @description Pluggable Job Queue Provider abstraction (InMemory for dev/test, Redis/BullMQ / Cloud Tasks for prod).
 */
import { JobPayload, JobStatus } from '@doc-platform/core';
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
    enqueueJob<TOptions>(job: JobPayload<TOptions>, options?: EnqueueOptions): Promise<{
        jobId: string;
        status: JobStatus;
    }>;
    leaseJob<TOptions>(workerId: string, timeoutMs: number): Promise<LeasedJob<TOptions> | null>;
    ackJob(jobId: string, leaseToken: string, outputFileIds: string[]): Promise<void>;
    nackJob(jobId: string, leaseToken: string, error: {
        code: string;
        message: string;
        retryable: boolean;
    }): Promise<void>;
    cancelJob(jobId: string): Promise<boolean>;
    getJob(jobId: string): Promise<JobPayload | null>;
    updateJobProgress(jobId: string, leaseToken: string, percent: number): Promise<void>;
}
/**
 * High-performance In-Memory Asynchronous Queue Provider
 * Supports concurrency limits, leasing, retry backoff, idempotency, and TTL expiration.
 */
export declare class InMemoryQueueProvider implements QueueProvider {
    private jobs;
    private queue;
    private leases;
    enqueueJob<TOptions>(job: JobPayload<TOptions>, _options?: EnqueueOptions): Promise<{
        jobId: string;
        status: JobStatus;
    }>;
    leaseJob<TOptions>(workerId: string, timeoutMs?: number): Promise<LeasedJob<TOptions> | null>;
    ackJob(jobId: string, leaseToken: string, outputFileIds: string[]): Promise<void>;
    nackJob(jobId: string, leaseToken: string, error: {
        code: string;
        message: string;
        retryable: boolean;
    }): Promise<void>;
    cancelJob(jobId: string): Promise<boolean>;
    getJob(jobId: string): Promise<JobPayload | null>;
    updateJobProgress(jobId: string, leaseToken: string, percent: number): Promise<void>;
}
//# sourceMappingURL=index.d.ts.map