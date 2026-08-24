"use strict";
/**
 * @file errors.ts
 * @description Standardized error taxonomy, user-safe diagnostics, and HTTP status codes.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlatformError = exports.ERROR_DEFINITIONS = void 0;
exports.ERROR_DEFINITIONS = {
    INVALID_INPUT: {
        message: 'The requested operation received invalid parameters.',
        userAction: 'Please check your options and selected files, then try again.',
        httpStatus: 400,
        retryable: false,
    },
    UNSUPPORTED_FORMAT: {
        message: 'The uploaded file format is not supported for this operation.',
        userAction: 'Please upload a valid PDF or supported document format.',
        httpStatus: 400,
        retryable: false,
    },
    MAGIC_BYTE_MISMATCH: {
        message: 'The file contents do not match its reported file extension.',
        userAction: 'Please ensure the file is an unaltered, valid PDF or image.',
        httpStatus: 400,
        retryable: false,
    },
    FILE_CORRUPTED: {
        message: 'The document appears to be corrupted or structurally damaged.',
        userAction: 'Please verify that this file opens in a standard PDF viewer.',
        httpStatus: 422,
        retryable: false,
    },
    FILE_ENCRYPTED: {
        message: 'The PDF is password protected and cannot be processed without unlocking.',
        userAction: 'Please unlock the document or provide the document password.',
        httpStatus: 422,
        retryable: false,
    },
    PDF_BOMB_DETECTED: {
        message: 'The document contains abnormal nested resources exceeding safety limits.',
        userAction: 'Please use a standard, optimized document.',
        httpStatus: 400,
        retryable: false,
    },
    FILE_SIZE_EXCEEDED: {
        message: 'The uploaded file exceeds the maximum file size limit for your plan.',
        userAction: 'Compress the document first or upgrade to a Pro account for larger uploads.',
        httpStatus: 413,
        retryable: false,
    },
    PAGE_LIMIT_EXCEEDED: {
        message: 'The document page count exceeds the maximum limit for your tier.',
        userAction: 'Split the document into smaller batches or upgrade your plan.',
        httpStatus: 413,
        retryable: false,
    },
    QUOTA_EXCEEDED: {
        message: 'You have reached your processing limit for this billing or hourly cycle.',
        userAction: 'Please wait for your quota to reset or upgrade your subscription.',
        httpStatus: 429,
        retryable: false,
    },
    RATE_LIMITED: {
        message: 'Too many requests have been made in a short time window.',
        userAction: 'Please wait a few moments before trying again.',
        httpStatus: 429,
        retryable: true,
    },
    UNAUTHORIZED: {
        message: 'Authentication is required to access this resource.',
        userAction: 'Please sign in to your account and try again.',
        httpStatus: 401,
        retryable: false,
    },
    FORBIDDEN: {
        message: 'You do not have permission to access or modify this document.',
        userAction: 'Please contact the document owner for access permissions.',
        httpStatus: 403,
        retryable: false,
    },
    NOT_FOUND: {
        message: 'The requested job or file could not be found.',
        userAction: 'The link or file may have expired or been deleted. Please upload again.',
        httpStatus: 404,
        retryable: false,
    },
    JOB_CANCELLED: {
        message: 'The processing job was cancelled by the user.',
        userAction: 'You can restart the operation at any time.',
        httpStatus: 499,
        retryable: false,
    },
    JOB_TIMEOUT: {
        message: 'Processing took longer than the allocated execution budget.',
        userAction: 'Try processing fewer pages or smaller files, or retry on our cloud tier.',
        httpStatus: 504,
        retryable: true,
    },
    WORKER_CRASH: {
        message: 'The isolated processing worker encountered an unexpected process crash.',
        userAction: 'Our system has recorded this issue. Retrying may succeed.',
        httpStatus: 500,
        retryable: true,
    },
    STORAGE_ERROR: {
        message: 'Temporary communication issue with the object storage provider.',
        userAction: 'Please wait a moment and try again. Your file will not be lost.',
        httpStatus: 503,
        retryable: true,
    },
    SANDBOX_VIOLATION: {
        message: 'Operation exceeded memory or CPU resource limits.',
        userAction: 'Please simplify the document or optimize large embedded graphics.',
        httpStatus: 500,
        retryable: false,
    },
    INTERNAL_SERVER_ERROR: {
        message: 'An unexpected platform error occurred.',
        userAction: 'Please try again. If the issue persists, contact support with your Job ID.',
        httpStatus: 500,
        retryable: true,
    },
};
class PlatformError extends Error {
    code;
    userAction;
    httpStatus;
    retryable;
    jobId;
    details;
    constructor(code, options) {
        const def = exports.ERROR_DEFINITIONS[code] || exports.ERROR_DEFINITIONS.INTERNAL_SERVER_ERROR;
        super(options?.message || def.message);
        this.name = 'PlatformError';
        this.code = code;
        this.userAction = options?.userAction || def.userAction;
        this.httpStatus = def.httpStatus;
        this.retryable = def.retryable;
        this.jobId = options?.jobId;
        this.details = options?.details;
    }
    toJSON() {
        return {
            error: {
                code: this.code,
                message: this.message,
                userAction: this.userAction,
                retryable: this.retryable,
                jobId: this.jobId,
                timestamp: new Date().toISOString(),
            },
        };
    }
}
exports.PlatformError = PlatformError;
//# sourceMappingURL=errors.js.map