"use strict";
/**
 * @file types.ts
 * @description Canonical domain models, state machines, and contracts for the Document Utility Platform.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TIER_LIMITS = exports.VALID_JOB_TRANSITIONS = void 0;
exports.VALID_JOB_TRANSITIONS = {
    CREATED: ['QUEUED', 'EXPIRED', 'CANCELLED'],
    QUEUED: ['PROCESSING', 'CANCELLED', 'EXPIRED'],
    PROCESSING: ['VALIDATING', 'FAILED', 'CANCELLED'],
    VALIDATING: ['COMPLETED', 'FAILED', 'CANCELLED'],
    COMPLETED: ['EXPIRED'],
    FAILED: ['QUEUED', 'EXPIRED'], // Allows retry
    CANCELLED: ['EXPIRED'],
    EXPIRED: [],
};
exports.TIER_LIMITS = {
    ANONYMOUS: {
        tier: 'ANONYMOUS',
        maxUploadSizeBytes: 50 * 1024 * 1024, // 50MB
        maxFilesPerJob: 10,
        maxPagesPerDocument: 100,
        maxJobsPerHour: 10,
        maxConcurrentJobs: 2,
        retentionHours: 2,
        hasOcrAccess: false,
        hasAiAccess: false,
        hasPriorityQueue: false,
    },
    FREE: {
        tier: 'FREE',
        maxUploadSizeBytes: 100 * 1024 * 1024, // 100MB
        maxFilesPerJob: 20,
        maxPagesPerDocument: 250,
        maxJobsPerHour: 25,
        maxConcurrentJobs: 3,
        retentionHours: 24,
        hasOcrAccess: true,
        hasAiAccess: false,
        hasPriorityQueue: false,
    },
    PRO: {
        tier: 'PRO',
        maxUploadSizeBytes: 500 * 1024 * 1024, // 500MB
        maxFilesPerJob: 100,
        maxPagesPerDocument: 2000,
        maxJobsPerHour: 200,
        maxConcurrentJobs: 10,
        retentionHours: 168, // 7 days
        hasOcrAccess: true,
        hasAiAccess: true,
        hasPriorityQueue: true,
    },
    BUSINESS: {
        tier: 'BUSINESS',
        maxUploadSizeBytes: 2 * 1024 * 1024 * 1024, // 2GB
        maxFilesPerJob: 500,
        maxPagesPerDocument: 10000,
        maxJobsPerHour: 1000,
        maxConcurrentJobs: 25,
        retentionHours: 720, // 30 days
        hasOcrAccess: true,
        hasAiAccess: true,
        hasPriorityQueue: true,
    },
    ENTERPRISE: {
        tier: 'ENTERPRISE',
        maxUploadSizeBytes: 5 * 1024 * 1024 * 1024, // 5GB
        maxFilesPerJob: 2000,
        maxPagesPerDocument: 50000,
        maxJobsPerHour: 10000,
        maxConcurrentJobs: 100,
        retentionHours: 8760, // 365 days
        hasOcrAccess: true,
        hasAiAccess: true,
        hasPriorityQueue: true,
    },
};
//# sourceMappingURL=types.js.map