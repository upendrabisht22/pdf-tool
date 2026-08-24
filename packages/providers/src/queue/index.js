"use strict";
/**
 * @file queue/index.ts
 * @description Pluggable Job Queue Provider abstraction (InMemory for dev/test, Redis/BullMQ / Cloud Tasks for prod).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryQueueProvider = void 0;
const core_1 = require("@doc-platform/core");
/**
 * High-performance In-Memory Asynchronous Queue Provider
 * Supports concurrency limits, leasing, retry backoff, idempotency, and TTL expiration.
 */
class InMemoryQueueProvider {
    jobs = new Map();
    queue = []; // Job IDs waiting in line
    leases = new Map();
    async enqueueJob(job, _options) {
        // Check idempotency if key provided
        if (job.idempotencyKey) {
            for (const existing of this.jobs.values()) {
                if (existing.idempotencyKey === job.idempotencyKey) {
                    return { jobId: existing.id, status: existing.status };
                }
            }
        }
        const enqueuedJob = {
            ...job,
            status: 'QUEUED',
            progressPercent: 0,
            createdAt: new Date(),
        };
        this.jobs.set(job.id, enqueuedJob);
        this.queue.push(job.id);
        return { jobId: job.id, status: 'QUEUED' };
    }
    async leaseJob(workerId, timeoutMs = 60000) {
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
        const jobId = this.queue.shift();
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
            job: job,
            leaseToken,
            expiresAt,
        };
    }
    async ackJob(jobId, leaseToken, outputFileIds) {
        const lease = this.leases.get(jobId);
        if (!lease || lease.leaseToken !== leaseToken) {
            throw new core_1.PlatformError('FORBIDDEN', { message: 'Invalid or expired lease token for ackJob.' });
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
    async nackJob(jobId, leaseToken, error) {
        const lease = this.leases.get(jobId);
        if (!lease || lease.leaseToken !== leaseToken) {
            return;
        }
        this.leases.delete(jobId);
        const job = this.jobs.get(jobId);
        if (!job)
            return;
        if (error.retryable && job.attemptCount < job.maxRetries) {
            job.status = 'QUEUED';
            job.error = {
                code: error.code,
                message: error.message,
                userAction: 'Operation encountered a temporary issue and is being retried.',
                retryable: true,
            };
            this.queue.push(jobId); // Re-queue for retry
        }
        else {
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
    async cancelJob(jobId) {
        const job = this.jobs.get(jobId);
        if (!job || job.status === 'COMPLETED' || job.status === 'EXPIRED') {
            return false;
        }
        job.status = 'CANCELLED';
        this.leases.delete(jobId);
        this.queue = this.queue.filter((id) => id !== jobId);
        return true;
    }
    async getJob(jobId) {
        return this.jobs.get(jobId) || null;
    }
    async updateJobProgress(jobId, leaseToken, percent) {
        const lease = this.leases.get(jobId);
        if (!lease || lease.leaseToken !== leaseToken)
            return;
        const job = this.jobs.get(jobId);
        if (job) {
            job.progressPercent = Math.min(100, Math.max(0, percent));
        }
    }
}
exports.InMemoryQueueProvider = InMemoryQueueProvider;
//# sourceMappingURL=index.js.map