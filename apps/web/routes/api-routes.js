/**
 * @file routes/api-routes.js
 * @description Centralized API request dispatcher for DocPlatform.
 *
 * Handles core control-plane endpoints (/health, /storage, /files, /jobs)
 * and delegates to domain-specific route handlers (developer keys, webhooks,
 * usage telemetry, WebRTC P2P signaling, and growth/sitemaps).
 */

import * as path from 'node:path';
import { PDFDocument } from 'pdf-lib';
import { validateFileSize, validateTotalJobSize, TIER_SIZE_LIMITS } from '../security/file-size-guard.js';
import { handleDeveloperRoutes } from '../api/developer-routes.js';
import { handleWebhookRoutes } from '../api/webhook-routes.js';
import { handleUsageRoutes } from '../api/usage-routes.js';
import { handleP2pSignalingRoutes } from '../api/p2p-signaling.js';
import { handleGrowthRoutes } from '../api/growth-routes.js';

/**
 * Dispatches API requests to the appropriate handler.
 * @param {import('node:http').IncomingMessage} req
 * @param {import('node:http').ServerResponse} res
 * @param {string} pathname
 * @param {URL} url
 * @param {(code: number, data: any) => void} sendJson
 * @param {Object} context
 * @param {import('@doc-platform/providers').LocalStorageProvider} context.storageProvider
 * @param {import('@doc-platform/providers').InMemoryQueueProvider} context.queueProvider
 * @param {import('@doc-platform/providers').DefaultAuthProvider} context.authProvider
 * @returns {Promise<boolean>} True if the request was handled, false otherwise
 */
export async function handleApiRoutes(req, res, pathname, url, sendJson, { storageProvider, queueProvider, authProvider }) {
  // API Route: Health Check
  if (pathname === '/api/v1/health') {
    sendJson(200, {
      status: 'healthy',
      service: 'docplatform-api',
      uptimeSeconds: process.uptime(),
      timestamp: new Date().toISOString(),
    });
    return true;
  }

  // ── Storage Download Endpoint for LocalStorageProvider ───────────────────
  if (pathname === '/api/v1/storage/local/download') {
    const key = url.searchParams.get('key');
    const customFilename = url.searchParams.get('filename') || (key ? path.basename(key) : 'document.pdf');
    if (!key) {
      sendJson(400, { error: { code: 'INVALID_INPUT', message: 'Missing key parameter.' } });
      return true;
    }
    try {
      const buffer = await storageProvider.getObject(key);
      const ext = path.extname(customFilename).toLowerCase();
      let contentType = 'application/pdf';
      if (ext === '.png') contentType = 'image/png';
      else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
      else if (ext === '.webp') contentType = 'image/webp';
      else if (ext === '.zip') contentType = 'application/zip';
      else if (ext === '.docx') contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      else if (ext === '.xlsx') contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      else if (ext === '.json') contentType = 'application/json';
      else if (ext === '.txt') contentType = 'text/plain; charset=utf-8';

      res.writeHead(200, {
        'Content-Type': contentType,
        'Content-Length': buffer.length,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(customFilename)}"`,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache',
      });
      res.end(buffer);
      return true;
    } catch (err) {
      sendJson(404, { error: { code: 'NOT_FOUND', message: err.message } });
      return true;
    }
  }

  // ── Storage Upload Endpoint for LocalStorageProvider ─────────────────────
  if (pathname === '/api/v1/storage/local/upload' && (req.method === 'PUT' || req.method === 'POST')) {
    const key = url.searchParams.get('key');
    if (!key) {
      sendJson(400, { error: { code: 'INVALID_INPUT', message: 'Missing key parameter.' } });
      return true;
    }
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', async () => {
      try {
        const buffer = Buffer.concat(chunks);
        await storageProvider.putObject(key, buffer, {
          contentType: req.headers['content-type'] || 'application/octet-stream',
        });
        sendJson(200, { success: true, key, sizeBytes: buffer.length });
      } catch (err) {
        sendJson(500, { error: { code: 'STORAGE_ERROR', message: err.message } });
      }
    });
    return true;
  }

  // ── API Route: Upload Request ─────────────────────────────────────────────
  if (pathname === '/api/v1/files/upload-request' && req.method === 'POST') {
    let bodyStr = '';
    req.on('data', (chunk) => (bodyStr += chunk));
    req.on('end', async () => {
      try {
        const body = JSON.parse(bodyStr || '{}');

        // Security: Per-tier file size enforcement
        const session = await authProvider.resolveSession(req.headers);
        const tier = session.tier || 'ANONYMOUS';
        const sizeCheck = validateFileSize(body.sizeBytes || 0, tier);
        if (!sizeCheck.valid) {
          return sendJson(413, { error: sizeCheck.error });
        }

        const fileId = `file_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        const storageKey = `uploads/${fileId}/${body.filename || 'document.pdf'}`;
        const maxSize = TIER_SIZE_LIMITS[tier] ?? TIER_SIZE_LIMITS.ANONYMOUS;

        const presigned = await storageProvider.createPresignedUploadUrl(storageKey, {
          contentType: body.contentType || 'application/pdf',
          maxSizeBytes: maxSize,
        });

        sendJson(200, {
          fileId,
          storageKey,
          uploadUrl: presigned.url,
          expiresAt: presigned.expiresAt,
          maxSizeBytes: maxSize,
          tier,
        });
      } catch (err) {
        sendJson(400, { error: { code: 'INVALID_INPUT', message: err.message } });
      }
    });
    return true;
  }

  // ── API Route: Create Job ─────────────────────────────────────────────────
  if (pathname === '/api/v1/jobs' && req.method === 'POST') {
    let bodyStr = '';
    req.on('data', (chunk) => (bodyStr += chunk));
    req.on('end', async () => {
      try {
        const body = JSON.parse(bodyStr || '{}');
        const session = await authProvider.resolveSession(req.headers);
        const tier = session.tier || 'ANONYMOUS';

        // Security: Total batch size enforcement
        const files = body.files || [];
        const totalSizeCheck = validateTotalJobSize(files, tier);
        if (!totalSizeCheck.valid) {
          return sendJson(413, { error: totalSizeCheck.error });
        }

        const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

        const inputFiles = [];
        for (let idx = 0; idx < files.length; idx++) {
          const f = files[idx];
          const fileId = `f_${Date.now()}_${idx}`;
          const storageKey = `uploads/${fileId}/${f.name}`;

          if (f.base64Data) {
            const buf = Buffer.from(f.base64Data, 'base64');
            await storageProvider.putObject(storageKey, buf, {
              contentType: f.name.endsWith('.pdf') ? 'application/pdf' :
                           f.name.endsWith('.md') ? 'text/markdown' :
                           f.name.endsWith('.txt') ? 'text/plain' : 'application/octet-stream',
            });
          } else if (f.storageKey) {
            // Existing key
          } else {
            const doc = await PDFDocument.create();
            doc.addPage([595, 842]);
            const pdfBytes = await doc.save();
            await storageProvider.putObject(storageKey, Buffer.from(pdfBytes), {
              contentType: 'application/pdf',
            });
          }

          inputFiles.push({
            fileId,
            storageKey,
            filename: f.name,
            mimeType: f.name.endsWith('.docx') ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' :
                      f.name.endsWith('.xlsx') ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' :
                      f.name.endsWith('.pptx') ? 'application/vnd.openxmlformats-officedocument.presentationml.presentation' :
                      f.name.endsWith('.md') ? 'text/markdown' :
                      f.name.endsWith('.txt') ? 'text/plain' :
                      f.name.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream',
            sizeBytes: f.size || f.sizeBytes || 1024,
            detectedFormat: f.name.split('.').pop() || 'pdf',
          });
        }

        const newJob = {
          id: jobId,
          sessionId: session.sessionId,
          userId: session.userId,
          operation: body.operation || 'merge-pdf',
          inputFiles,
          options: body.options || {},
          status: 'CREATED',
          progressPercent: 0,
          attemptCount: 0,
          maxRetries: 3,
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 3600000),
        };

        const enqueued = await queueProvider.enqueueJob(newJob);
        sendJson(201, {
          jobId: enqueued.jobId,
          status: enqueued.status,
          message: 'Job enqueued for execution in isolated worker pool.',
        });
      } catch (err) {
        sendJson(500, { error: { code: 'INTERNAL_SERVER_ERROR', message: err.message } });
      }
    });
    return true;
  }

  // ── API Route: Get Job Status ─────────────────────────────────────────────
  if (pathname.startsWith('/api/v1/jobs/') && req.method === 'GET') {
    const jobId = pathname.replace('/api/v1/jobs/', '');
    const job = await queueProvider.getJob(jobId);
    if (!job) {
      sendJson(404, { error: { code: 'NOT_FOUND', message: 'Job not found.' } });
      return true;
    }

    let downloadUrl = null;
    let filename = `processed_${job.operation}.pdf`;
    if (job.status === 'COMPLETED' && job.outputFileIds && job.outputFileIds.length > 0) {
      const presigned = await storageProvider.createPresignedDownloadUrl(job.outputFileIds[0]);
      downloadUrl = presigned.url;
      filename = path.basename(job.outputFileIds[0]);
    }

    sendJson(200, {
      jobId: job.id,
      status: job.status,
      progress: job.progressPercent,
      downloadUrl,
      filename,
      error: job.error,
    });
    return true;
  }

  // ── Phase 7: Developer API Key Routes ─────────────────────────────────────
  if (pathname.startsWith('/api/v1/developer')) {
    const handled = await handleDeveloperRoutes(req, res, pathname, sendJson, authProvider);
    if (handled) return true;
  }

  // ── Phase 7: Webhook Management Routes ────────────────────────────────────
  if (pathname.startsWith('/api/v1/webhooks')) {
    const handled = await handleWebhookRoutes(req, res, pathname, sendJson, authProvider);
    if (handled) return true;
  }

  // ── Phase 7: Usage Telemetry & Audit Log Routes ───────────────────────────
  if (pathname.startsWith('/api/v1/usage') || pathname.startsWith('/api/v1/audit-log')) {
    const handled = await handleUsageRoutes(req, res, pathname, url, sendJson, authProvider);
    if (handled) return true;
  }

  // ── WebRTC P2P Ephemeral Signaling Routes ─────────────────────────────────
  if (pathname.startsWith('/api/v1/p2p')) {
    const handled = await handleP2pSignalingRoutes(req, res, pathname, sendJson);
    if (handled) return true;
  }

  // ── Phase 8: Growth Platform, Sitemap & Widget Routes ─────────────────────
  const growthHandled = await handleGrowthRoutes(req, res, pathname, url, sendJson);
  if (growthHandled) return true;

  return false;
}
