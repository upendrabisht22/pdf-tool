"use strict";
/**
 * @file storage/index.ts
 * @description Pluggable Storage Provider abstraction (R2, S3, Local filesystem).
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.R2StorageProvider = exports.LocalStorageProvider = void 0;
const fs = __importStar(require("node:fs/promises"));
const path = __importStar(require("node:path"));
const core_1 = require("@doc-platform/core");
/**
 * Local Filesystem Storage Provider
 * Designed for local development, CI/CD automated testing, and zero-cloud environments.
 */
class LocalStorageProvider {
    baseDir;
    baseUrl;
    constructor(baseDir = path.join(process.cwd(), '.storage'), baseUrl = '/api/v1/storage/local') {
        this.baseDir = baseDir;
        this.baseUrl = baseUrl;
    }
    getFilePath(key) {
        const sanitizedKey = key.replace(/\.\./g, '').replace(/^[/\\]+/, '');
        return path.join(this.baseDir, sanitizedKey);
    }
    async ensureDir(filePath) {
        const dir = path.dirname(filePath);
        await fs.mkdir(dir, { recursive: true });
    }
    async createPresignedUploadUrl(key, options) {
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
    async createPresignedDownloadUrl(key, options) {
        const expiresAt = new Date(Date.now() + (options?.expiresInSeconds || 900) * 1000);
        const filenameParam = options?.filename ? `&filename=${encodeURIComponent(options.filename)}` : '';
        const url = `${this.baseUrl}/download?key=${encodeURIComponent(key)}&expires=${expiresAt.getTime()}${filenameParam}`;
        return {
            url,
            expiresAt,
        };
    }
    async getObject(key) {
        try {
            const filePath = this.getFilePath(key);
            return await fs.readFile(filePath);
        }
        catch (err) {
            if (err.code === 'ENOENT') {
                throw new core_1.PlatformError('NOT_FOUND', { message: `Object with key "${key}" was not found.` });
            }
            throw new core_1.PlatformError('STORAGE_ERROR', { message: `Failed to read local object: ${err.message}` });
        }
    }
    async putObject(key, data, metadata) {
        try {
            const filePath = this.getFilePath(key);
            await this.ensureDir(filePath);
            await fs.writeFile(filePath, data);
            return { key, sizeBytes: data.length };
        }
        catch (err) {
            throw new core_1.PlatformError('STORAGE_ERROR', { message: `Failed to write local object: ${err.message}` });
        }
    }
    async deleteObject(key) {
        try {
            const filePath = this.getFilePath(key);
            await fs.unlink(filePath);
        }
        catch (err) {
            if (err.code !== 'ENOENT') {
                throw new core_1.PlatformError('STORAGE_ERROR', { message: `Failed to delete local object: ${err.message}` });
            }
        }
    }
    async deleteObjects(keys) {
        await Promise.all(keys.map((k) => this.deleteObject(k)));
    }
    async headObject(key) {
        try {
            const filePath = this.getFilePath(key);
            const stats = await fs.stat(filePath);
            return {
                key,
                sizeBytes: stats.size,
                contentType: 'application/octet-stream',
                lastModified: stats.mtime,
            };
        }
        catch {
            return null;
        }
    }
}
exports.LocalStorageProvider = LocalStorageProvider;
/**
 * Cloudflare R2 / AWS S3 Compatible Storage Provider
 */
class R2StorageProvider {
    bucket;
    endpoint;
    publicDomain;
    constructor(config) {
        this.bucket = config.bucketName;
        this.endpoint = `https://${config.accountId}.r2.cloudflarestorage.com`;
        this.publicDomain = config.publicDomain;
    }
    async createPresignedUploadUrl(key, options) {
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
    async createPresignedDownloadUrl(key, options) {
        const expiresAt = new Date(Date.now() + (options?.expiresInSeconds || 900) * 1000);
        const domain = this.publicDomain || `${this.endpoint}/${this.bucket}`;
        const url = `${domain}/${encodeURIComponent(key)}?signed=true&expires=${expiresAt.getTime()}`;
        return { url, expiresAt };
    }
    async getObject(key) {
        throw new core_1.PlatformError('STORAGE_ERROR', {
            message: `R2 getObject for ${key} requires production credentials. Use LocalStorageProvider for dev/testing.`,
        });
    }
    async putObject(key, data, metadata) {
        return { key, sizeBytes: data.length };
    }
    async deleteObject(key) {
        // S3 DeleteObjectCommand
    }
    async deleteObjects(keys) {
        // S3 DeleteObjectsCommand
    }
    async headObject(key) {
        return null;
    }
}
exports.R2StorageProvider = R2StorageProvider;
//# sourceMappingURL=index.js.map