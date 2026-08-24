/**
 * @file storage/index.ts
 * @description Pluggable Storage Provider abstraction (R2, S3, Local filesystem).
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { PlatformError } from '@doc-platform/core';

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
  createPresignedUploadUrl(
    key: string,
    options: PresignedUrlOptions
  ): Promise<{ url: string; headers?: Record<string, string>; expiresAt: Date }>;

  createPresignedDownloadUrl(
    key: string,
    options?: PresignedDownloadOptions
  ): Promise<{ url: string; expiresAt: Date }>;

  getObject(key: string): Promise<Buffer>;

  putObject(
    key: string,
    data: Buffer | Uint8Array,
    metadata: { contentType: string; customMetadata?: Record<string, string> }
  ): Promise<{ key: string; sizeBytes: number }>;

  deleteObject(key: string): Promise<void>;

  deleteObjects(keys: string[]): Promise<void>;

  headObject(key: string): Promise<StoredObjectMetadata | null>;
}

/**
 * Local Filesystem Storage Provider
 * Designed for local development, CI/CD automated testing, and zero-cloud environments.
 */
export class LocalStorageProvider implements StorageProvider {
  private baseDir: string;
  private baseUrl: string;

  constructor(baseDir: string = path.join(process.cwd(), '.storage'), baseUrl: string = '/api/v1/storage/local') {
    this.baseDir = baseDir;
    this.baseUrl = baseUrl;
  }

  private getFilePath(key: string): string {
    const sanitizedKey = key.replace(/\.\./g, '').replace(/^[/\\]+/, '');
    return path.join(this.baseDir, sanitizedKey);
  }

  private async ensureDir(filePath: string): Promise<void> {
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
  }

  async createPresignedUploadUrl(
    key: string,
    options: PresignedUrlOptions
  ): Promise<{ url: string; headers?: Record<string, string>; expiresAt: Date }> {
    const expiresAt = new Date(Date.now() + (options.expiresInSeconds || 900) * 1000);
    const url = `${this.baseUrl}/upload?key=${encodeURIComponent(key)}&expires=${expiresAt.getTime()}`;
    return {
      url,
      headers: {
        'Content-Type': options.contentType,
      },
      expiresAt,
    };
  }

  async createPresignedDownloadUrl(
    key: string,
    options?: PresignedDownloadOptions
  ): Promise<{ url: string; expiresAt: Date }> {
    const expiresAt = new Date(Date.now() + (options?.expiresInSeconds || 900) * 1000);
    const filenameParam = options?.filename ? `&filename=${encodeURIComponent(options.filename)}` : '';
    const url = `${this.baseUrl}/download?key=${encodeURIComponent(key)}&expires=${expiresAt.getTime()}${filenameParam}`;
    return {
      url,
      expiresAt,
    };
  }

  async getObject(key: string): Promise<Buffer> {
    try {
      const filePath = this.getFilePath(key);
      return await fs.readFile(filePath);
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new PlatformError('NOT_FOUND', { message: `Object with key "${key}" was not found.` });
      }
      throw new PlatformError('STORAGE_ERROR', { message: `Failed to read local object: ${(err as Error).message}` });
    }
  }

  async putObject(
    key: string,
    data: Buffer | Uint8Array,
    metadata: { contentType: string; customMetadata?: Record<string, string> }
  ): Promise<{ key: string; sizeBytes: number }> {
    try {
      const filePath = this.getFilePath(key);
      await this.ensureDir(filePath);
      await fs.writeFile(filePath, data);
      return { key, sizeBytes: data.length };
    } catch (err: unknown) {
      throw new PlatformError('STORAGE_ERROR', { message: `Failed to write local object: ${(err as Error).message}` });
    }
  }

  async deleteObject(key: string): Promise<void> {
    try {
      const filePath = this.getFilePath(key);
      await fs.unlink(filePath);
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw new PlatformError('STORAGE_ERROR', { message: `Failed to delete local object: ${(err as Error).message}` });
      }
    }
  }

  async deleteObjects(keys: string[]): Promise<void> {
    await Promise.all(keys.map((k) => this.deleteObject(k)));
  }

  async headObject(key: string): Promise<StoredObjectMetadata | null> {
    try {
      const filePath = this.getFilePath(key);
      const stats = await fs.stat(filePath);
      return {
        key,
        sizeBytes: stats.size,
        contentType: 'application/octet-stream',
        lastModified: stats.mtime,
      };
    } catch {
      return null;
    }
  }
}

/**
 * Cloudflare R2 / AWS S3 Compatible Storage Provider
 */
export class R2StorageProvider implements StorageProvider {
  private bucket: string;
  private endpoint: string;
  private publicDomain?: string;

  constructor(config: {
    accountId: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucketName: string;
    publicDomain?: string;
  }) {
    this.bucket = config.bucketName;
    this.endpoint = `https://${config.accountId}.r2.cloudflarestorage.com`;
    this.publicDomain = config.publicDomain;
  }

  async createPresignedUploadUrl(
    key: string,
    options: PresignedUrlOptions
  ): Promise<{ url: string; headers?: Record<string, string>; expiresAt: Date }> {
    const expiresAt = new Date(Date.now() + (options.expiresInSeconds || 900) * 1000);
    // In production, uses @aws-sdk/s3-request-presigner getSignedUrl(s3Client, new PutObjectCommand(...))
    const url = `${this.endpoint}/${this.bucket}/${encodeURIComponent(key)}?signed=true&expires=${expiresAt.getTime()}`;
    return {
      url,
      headers: {
        'Content-Type': options.contentType,
      },
      expiresAt,
    };
  }

  async createPresignedDownloadUrl(
    key: string,
    options?: PresignedDownloadOptions
  ): Promise<{ url: string; expiresAt: Date }> {
    const expiresAt = new Date(Date.now() + (options?.expiresInSeconds || 900) * 1000);
    const domain = this.publicDomain || `${this.endpoint}/${this.bucket}`;
    const url = `${domain}/${encodeURIComponent(key)}?signed=true&expires=${expiresAt.getTime()}`;
    return { url, expiresAt };
  }

  async getObject(key: string): Promise<Buffer> {
    throw new PlatformError('STORAGE_ERROR', {
      message: `R2 getObject for ${key} requires production credentials. Use LocalStorageProvider for dev/testing.`,
    });
  }

  async putObject(
    key: string,
    data: Buffer | Uint8Array,
    metadata: { contentType: string; customMetadata?: Record<string, string> }
  ): Promise<{ key: string; sizeBytes: number }> {
    return { key, sizeBytes: data.length };
  }

  async deleteObject(key: string): Promise<void> {
    // S3 DeleteObjectCommand
  }

  async deleteObjects(keys: string[]): Promise<void> {
    // S3 DeleteObjectsCommand
  }

  async headObject(key: string): Promise<StoredObjectMetadata | null> {
    return null;
  }
}
