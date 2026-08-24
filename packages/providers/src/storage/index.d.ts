/**
 * @file storage/index.ts
 * @description Pluggable Storage Provider abstraction (R2, S3, Local filesystem).
 */
export interface PresignedUrlOptions {
    contentType: string;
    maxSizeBytes: number;
    expiresInSeconds?: number;
    metadata?: Record<string, string>;
}
export interface PresignedDownloadOptions {
    expiresInSeconds?: number;
    filename?: string;
}
export interface StoredObjectMetadata {
    key: string;
    sizeBytes: number;
    contentType: string;
    etag?: string;
    lastModified: Date;
    customMetadata?: Record<string, string>;
}
export interface StorageProvider {
    createPresignedUploadUrl(key: string, options: PresignedUrlOptions): Promise<{
        url: string;
        headers?: Record<string, string>;
        expiresAt: Date;
    }>;
    createPresignedDownloadUrl(key: string, options?: PresignedDownloadOptions): Promise<{
        url: string;
        expiresAt: Date;
    }>;
    getObject(key: string): Promise<Buffer>;
    putObject(key: string, data: Buffer | Uint8Array, metadata: {
        contentType: string;
        customMetadata?: Record<string, string>;
    }): Promise<{
        key: string;
        sizeBytes: number;
    }>;
    deleteObject(key: string): Promise<void>;
    deleteObjects(keys: string[]): Promise<void>;
    headObject(key: string): Promise<StoredObjectMetadata | null>;
}
/**
 * Local Filesystem Storage Provider
 * Designed for local development, CI/CD automated testing, and zero-cloud environments.
 */
export declare class LocalStorageProvider implements StorageProvider {
    private baseDir;
    private baseUrl;
    constructor(baseDir?: string, baseUrl?: string);
    private getFilePath;
    private ensureDir;
    createPresignedUploadUrl(key: string, options: PresignedUrlOptions): Promise<{
        url: string;
        headers?: Record<string, string>;
        expiresAt: Date;
    }>;
    createPresignedDownloadUrl(key: string, options?: PresignedDownloadOptions): Promise<{
        url: string;
        expiresAt: Date;
    }>;
    getObject(key: string): Promise<Buffer>;
    putObject(key: string, data: Buffer | Uint8Array, metadata: {
        contentType: string;
        customMetadata?: Record<string, string>;
    }): Promise<{
        key: string;
        sizeBytes: number;
    }>;
    deleteObject(key: string): Promise<void>;
    deleteObjects(keys: string[]): Promise<void>;
    headObject(key: string): Promise<StoredObjectMetadata | null>;
}
/**
 * Cloudflare R2 / AWS S3 Compatible Storage Provider
 */
export declare class R2StorageProvider implements StorageProvider {
    private bucket;
    private endpoint;
    private publicDomain?;
    constructor(config: {
        accountId: string;
        accessKeyId: string;
        secretAccessKey: string;
        bucketName: string;
        publicDomain?: string;
    });
    createPresignedUploadUrl(key: string, options: PresignedUrlOptions): Promise<{
        url: string;
        headers?: Record<string, string>;
        expiresAt: Date;
    }>;
    createPresignedDownloadUrl(key: string, options?: PresignedDownloadOptions): Promise<{
        url: string;
        expiresAt: Date;
    }>;
    getObject(key: string): Promise<Buffer>;
    putObject(key: string, data: Buffer | Uint8Array, metadata: {
        contentType: string;
        customMetadata?: Record<string, string>;
    }): Promise<{
        key: string;
        sizeBytes: number;
    }>;
    deleteObject(key: string): Promise<void>;
    deleteObjects(keys: string[]): Promise<void>;
    headObject(key: string): Promise<StoredObjectMetadata | null>;
}
//# sourceMappingURL=index.d.ts.map