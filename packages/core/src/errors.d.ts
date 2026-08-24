/**
 * @file errors.ts
 * @description Standardized error taxonomy, user-safe diagnostics, and HTTP status codes.
 */
export type ErrorCode = 'INVALID_INPUT' | 'UNSUPPORTED_FORMAT' | 'MAGIC_BYTE_MISMATCH' | 'FILE_CORRUPTED' | 'FILE_ENCRYPTED' | 'PDF_BOMB_DETECTED' | 'FILE_SIZE_EXCEEDED' | 'PAGE_LIMIT_EXCEEDED' | 'QUOTA_EXCEEDED' | 'RATE_LIMITED' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND' | 'JOB_CANCELLED' | 'JOB_TIMEOUT' | 'WORKER_CRASH' | 'STORAGE_ERROR' | 'SANDBOX_VIOLATION' | 'INTERNAL_SERVER_ERROR';
export interface ErrorDetails {
    code: ErrorCode;
    message: string;
    userAction: string;
    httpStatus: number;
    retryable: boolean;
}
export declare const ERROR_DEFINITIONS: Record<ErrorCode, Omit<ErrorDetails, 'code'>>;
export declare class PlatformError extends Error {
    readonly code: ErrorCode;
    readonly userAction: string;
    readonly httpStatus: number;
    readonly retryable: boolean;
    readonly jobId?: string;
    readonly details?: Record<string, unknown>;
    constructor(code: ErrorCode, options?: {
        message?: string;
        userAction?: string;
        jobId?: string;
        details?: Record<string, unknown>;
    });
    toJSON(): {
        error: {
            code: ErrorCode;
            message: string;
            userAction: string;
            retryable: boolean;
            jobId: string | undefined;
            timestamp: string;
        };
    };
}
//# sourceMappingURL=errors.d.ts.map