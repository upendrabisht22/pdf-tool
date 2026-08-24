/**
 * @file types.ts
 * @description Canonical domain models, state machines, and contracts for the Document Utility Platform.
 */
export type OperationType = 'merge-pdf' | 'split-pdf' | 'compress-pdf' | 'rotate-pdf' | 'reorder-pdf' | 'delete-pages' | 'extract-pages' | 'image-to-pdf' | 'pdf-to-image' | 'word-to-pdf' | 'pdf-to-word' | 'excel-to-pdf' | 'pdf-to-excel' | 'ocr-pdf' | 'watermark-pdf' | 'page-numbers-pdf' | 'protect-pdf' | 'unlock-pdf' | 'ai-summarize' | 'ai-ask';
export type JobStatus = 'CREATED' | 'QUEUED' | 'PROCESSING' | 'VALIDATING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'EXPIRED';
export declare const VALID_JOB_TRANSITIONS: Record<JobStatus, readonly JobStatus[]>;
export interface FileMetadata {
    id: string;
    ownerId?: string | null;
    sessionId?: string | null;
    originalFilename: string;
    sanitizedFilename: string;
    storageKey: string;
    mimeType: string;
    sizeBytes: number;
    sha256Hash: string;
    pageCount?: number | null;
    createdAt: Date;
    expiresAt: Date;
    isDeleted: boolean;
}
export interface ValidatedFile {
    fileId: string;
    storageKey: string;
    filename: string;
    mimeType: string;
    sizeBytes: number;
    detectedFormat: string;
    pageCount?: number;
}
export interface MergePdfOptions {
    preserveBookmarks?: boolean;
    normalizePageSizes?: boolean;
}
export interface SplitPdfOptions {
    mode: 'all-pages' | 'ranges' | 'fixed-chunks';
    ranges?: string[];
    chunkSize?: number;
}
export interface CompressPdfOptions {
    level: 'extreme' | 'recommended' | 'low';
    targetDpi?: number;
    imageQualityPercent?: number;
}
export interface RotatePdfOptions {
    rotation: 90 | 180 | 270;
    targetPages: 'all' | 'odd' | 'even' | number[];
}
export interface ReorderDeletePagesOptions {
    pageOrder: number[];
}
export interface ExtractPagesOptions {
    pages: number[];
    combineIntoSingleFile?: boolean;
}
export interface ImageToPdfOptions {
    pageSize: 'A4' | 'LETTER' | 'FIT_IMAGE' | 'AUTO';
    orientation: 'portrait' | 'landscape' | 'auto';
    marginPx?: number;
}
export interface PdfToImageOptions {
    format: 'png' | 'jpeg' | 'webp';
    dpi: number;
    pages?: number[] | 'all';
}
export type OperationOptionsMap = {
    'merge-pdf': MergePdfOptions;
    'split-pdf': SplitPdfOptions;
    'compress-pdf': CompressPdfOptions;
    'rotate-pdf': RotatePdfOptions;
    'reorder-pdf': ReorderDeletePagesOptions;
    'delete-pages': ReorderDeletePagesOptions;
    'extract-pages': ExtractPagesOptions;
    'image-to-pdf': ImageToPdfOptions;
    'pdf-to-image': PdfToImageOptions;
    [key: string]: Record<string, unknown> | undefined;
};
export interface JobPayload<TOptions = Record<string, unknown>> {
    id: string;
    idempotencyKey?: string;
    userId?: string | null;
    sessionId: string;
    operation: OperationType;
    inputFiles: ValidatedFile[];
    options: TOptions;
    status: JobStatus;
    progressPercent: number;
    attemptCount: number;
    maxRetries: number;
    createdAt: Date;
    startedAt?: Date | null;
    completedAt?: Date | null;
    expiresAt: Date;
    outputFileIds?: string[];
    error?: {
        code: string;
        message: string;
        userAction: string;
        retryable: boolean;
    } | null;
}
export interface WorkerExecutionContext {
    jobId: string;
    workerId: string;
    timeoutMs: number;
    maxMemoryBytes: number;
    tempWorkingDir: string;
    isCancelled: () => boolean;
    onProgress: (percent: number, message?: string) => Promise<void>;
}
export interface ProcessingResult {
    outputFiles: {
        filename: string;
        mimeType: string;
        buffer?: Buffer | Uint8Array;
        localFilePath?: string;
        pageCount?: number;
    }[];
    metrics: {
        durationMs: number;
        inputSizeBytes: number;
        outputSizeBytes: number;
        compressionRatio?: number;
    };
}
export type UserTier = 'ANONYMOUS' | 'FREE' | 'PRO' | 'BUSINESS' | 'ENTERPRISE';
export interface TierQuotaLimits {
    tier: UserTier;
    maxUploadSizeBytes: number;
    maxFilesPerJob: number;
    maxPagesPerDocument: number;
    maxJobsPerHour: number;
    maxConcurrentJobs: number;
    retentionHours: number;
    hasOcrAccess: boolean;
    hasAiAccess: boolean;
    hasPriorityQueue: boolean;
}
export declare const TIER_LIMITS: Record<UserTier, TierQuotaLimits>;
//# sourceMappingURL=types.d.ts.map