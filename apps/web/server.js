/**
 * @file server.js
 * @description Production HTTP Server & Control Plane API for DocPlatform (v2.3).
 */

import * as http from 'node:http';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PDFDocument } from 'pdf-lib';
import {
  LocalStorageProvider,
  InMemoryQueueProvider,
  DefaultAuthProvider,
} from '@doc-platform/providers';
import {
  MergePdfProcessor,
  SplitPdfProcessor,
  RotatePdfProcessor,
  CompressPdfProcessor,
  ImageToPdfProcessor,
  ReorderDeletePagesProcessor,
  ExtractPagesProcessor,
  WatermarkPdfProcessor,
  PageNumbersPdfProcessor,
  ProtectPdfProcessor,
  UnlockPdfProcessor,
  RepairPdfProcessor,
  StripMetadataPdfProcessor,
  OfficeToPdfProcessor,
  PdfToImageProcessor,
  SignPdfProcessor,
  FlattenPdfProcessor,
  PdfToWordProcessor,
  PdfToExcelProcessor,
  RedactPdfProcessor,
  OcrPdfProcessor,
  ComparePdfProcessor,
  AiSummarizeProcessor,
  AiAskProcessor,
  AiExtractTableProcessor,
  PipelineProcessor,
  PdfToMarkdownProcessor,
  MarkdownToPdfProcessor,
  GstInvoiceProcessor,
  PosBillingProcessor,
  TaxReceiptProcessor,
  EstimateMakerProcessor,
  CropPdfProcessor,
  EditPdfProcessor,
  SandboxedWorkerHarness,
} from '@doc-platform/workers';
import { TOOL_REGISTRY, generateToolJsonLd } from '@doc-platform/core';
import { applyRateLimit } from './security/rate-limiter.js';
import { scanForPdfBomb } from './security/pdf-bomb-defense.js';
import { validateFileSize, validateTotalJobSize, TIER_SIZE_LIMITS } from './security/file-size-guard.js';
import { startTtlCleanupDaemon } from './security/job-ttl.js';
// ── Phase 7: Developer API Platform ─────────────────────────────────────────
import { handleDeveloperRoutes } from './api/developer-routes.js';
import { handleWebhookRoutes } from './api/webhook-routes.js';
import { handleUsageRoutes } from './api/usage-routes.js';
import { insertUsageEvent, appendAuditEntry } from './api/usage-store.js';
import { dispatchWebhookEvent } from './api/webhook-store.js';
// ── Phase 8: Growth Platform & i18n SEO ──────────────────────────────────────
import { handleGrowthRoutes } from './api/growth-routes.js';
// ── Modular View Templates (Layout, Static Pages, Main App Page) ────────────
import { renderNavbar, renderFooter, renderGsapScripts } from './views/layout.js';
import { renderPricingPage, renderPrivacyPage, renderTermsPage, renderSecurityPage, render404Page } from './views/static-pages.js';
import { renderAppPage, getToolCategory, getRelatedToolsList } from './views/app-page.js';
import { renderLandingPage } from './views/landing-page.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3000;

// Initialize Storage, Queue, Auth and Sandbox Harness
const storageDir = path.join(__dirname, '.storage');
const storageProvider = new LocalStorageProvider(storageDir, '/api/v1/storage/local');
const queueProvider = new InMemoryQueueProvider();
const authProvider = new DefaultAuthProvider();
const sandbox = new SandboxedWorkerHarness({ defaultTimeoutMs: 60000 });

// Worker loop to consume background jobs
async function startWorkerLoop() {
  const processors = {
    // Phase 1 (Core PDF)
    'merge-pdf': new MergePdfProcessor(),
    'split-pdf': new SplitPdfProcessor(),
    'rotate-pdf': new RotatePdfProcessor(),
    'compress-pdf': new CompressPdfProcessor(),
    'image-to-pdf': new ImageToPdfProcessor(),
    'jpg-to-pdf': new ImageToPdfProcessor(),
    'extract-pages': new ExtractPagesProcessor(),
    'delete-pdf-pages': new ReorderDeletePagesProcessor(),
    'delete-pages': new ReorderDeletePagesProcessor(),
    'reorder-pdf': new ReorderDeletePagesProcessor(),
    // Sprint A
    'watermark-pdf': new WatermarkPdfProcessor(),
    'page-numbers-pdf': new PageNumbersPdfProcessor(),
    'protect-pdf': new ProtectPdfProcessor(),
    'unlock-pdf': new UnlockPdfProcessor(),
    'repair-pdf': new RepairPdfProcessor(),
    'strip-metadata-pdf': new StripMetadataPdfProcessor(),
    // Sprint C (Office to PDF)
    'word-to-pdf': new OfficeToPdfProcessor('word-to-pdf'),
    'excel-to-pdf': new OfficeToPdfProcessor('excel-to-pdf'),
    'powerpoint-to-pdf': new OfficeToPdfProcessor('powerpoint-to-pdf'),
    'ppt-to-pdf': new OfficeToPdfProcessor('powerpoint-to-pdf'),
    // Sprint D (Output Formats + Signatures)
    'pdf-to-image': new PdfToImageProcessor(),
    'pdf-to-jpg': new PdfToImageProcessor(),
    'sign-pdf': new SignPdfProcessor(),
    'flatten-pdf': new FlattenPdfProcessor(),
    // Sprint E (PDF to Office + Redaction)
    'pdf-to-word': new PdfToWordProcessor(),
    'pdf-to-excel': new PdfToExcelProcessor(),
    'redact-pdf': new RedactPdfProcessor(),
    // Sprint F (OCR + PDF Compare)
    'ocr-pdf': new OcrPdfProcessor(),
    'compare-pdf': new ComparePdfProcessor(),
    // Sprint G (AI Document Intelligence & Pipeline)
    'ai-summarize': new AiSummarizeProcessor(),
    'ai-ask': new AiAskProcessor(),
    'ai-extract-table': new AiExtractTableProcessor(),
    'pipeline': new PipelineProcessor(),
    'pdf-to-markdown': new PdfToMarkdownProcessor(),
    'markdown-to-pdf': new MarkdownToPdfProcessor(),
    'gst-invoice-pdf': new GstInvoiceProcessor(),
    'pos-billing': new PosBillingProcessor(),
    'clean-billing': new PosBillingProcessor(),
    'tax-receipt': new TaxReceiptProcessor(),
    'estimate-maker': new EstimateMakerProcessor(),
    'crop-pdf': new CropPdfProcessor(),
    'edit-pdf': new EditPdfProcessor(),
    'pdf-editor': new EditPdfProcessor(),
  };

  while (true) {
    try {
      const lease = await queueProvider.leaseJob('worker_main_01', 60000);
      if (lease) {
        const { job, leaseToken } = lease;
        const processor = processors[job.operation];

        if (processor) {
          await sandbox.runIsolated(job.id, 'worker_main_01', async (ctx) => {
            // Load input buffers
            const inputBuffers = [];
            for (const file of job.inputFiles) {
              const buf = await storageProvider.getObject(file.storageKey);
              inputBuffers.push(buf);
            }

            ctx.onProgress = async (percent, msg) => {
              await queueProvider.updateJobProgress(job.id, leaseToken, percent);
            };

            const result = await processor.process(inputBuffers, job.options, ctx);

            // Store outputs
            const outputFileIds = [];
            for (const out of result.outputFiles) {
              if (out.buffer) {
                const outKey = `outputs/${job.id}/${out.filename}`;
                await storageProvider.putObject(outKey, out.buffer, {
                  contentType: out.mimeType,
                });
                outputFileIds.push(outKey);
              }
            }

            await queueProvider.ackJob(job.id, leaseToken, outputFileIds);

            // ── Phase 7: Record usage event + dispatch webhook on job completion
            const ownerId = job.userId || job.sessionId || 'anonymous';
            insertUsageEvent({
              ownerId,
              apiKeyId: null, // populated if request came via API key (Phase 8)
              operation: job.operation,
              statusCode: 200,
              inputBytes: result.metrics.inputSizeBytes,
              outputBytes: result.metrics.outputSizeBytes,
              durationMs: result.metrics.durationMs,
              jobId: job.id,
            });

            // Dispatch webhook event (non-blocking, fire-and-forget)
            dispatchWebhookEvent({
              ownerId,
              event: 'job.completed',
              data: {
                jobId: job.id,
                operation: job.operation,
                outputFileCount: outputFileIds.length,
                metrics: result.metrics,
              },
            }).catch(() => {}); // Webhook failures MUST NOT crash the worker
          });
        }
      }
    } catch (err) {
      console.error('Background worker error:', err);
    }
    await new Promise((r) => setTimeout(r, 500));
  }
}

startWorkerLoop();

// Start TTL cleanup daemon — auto-deletes expired output files and stale jobs
startTtlCleanupDaemon(queueProvider, storageProvider);

// HTTP Request Handler
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  // Helper for JSON responses
  const sendJson = (statusCode, data) => {
    res.writeHead(statusCode, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Session-Id',
    });
    res.end(JSON.stringify(data));
  };

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Session-Id',
    });
    res.end();
    return;
  }

  // ── Security Middleware: Rate Limiting ─────────────────────────────────────
  // Applied to all API routes before any processing begins
  if (applyRateLimit(req, res, pathname)) return;
  // ──────────────────────────────────────────────────────────────────────────

  // API Route: Health Check
  if (pathname === '/api/v1/health') {
    return sendJson(200, {
      status: 'healthy',
      service: 'docplatform-api',
      uptimeSeconds: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  }

  // ── Storage Download & Upload Endpoints for LocalStorageProvider ───────────
  if (pathname === '/api/v1/storage/local/download') {
    const key = url.searchParams.get('key');
    const customFilename = url.searchParams.get('filename') || (key ? path.basename(key) : 'document.pdf');
    if (!key) {
      return sendJson(400, { error: { code: 'INVALID_INPUT', message: 'Missing key parameter.' } });
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
      return;
    } catch (err) {
      return sendJson(404, { error: { code: 'NOT_FOUND', message: err.message } });
    }
  }

  if (pathname === '/api/v1/storage/local/upload' && (req.method === 'PUT' || req.method === 'POST')) {
    const key = url.searchParams.get('key');
    if (!key) {
      return sendJson(400, { error: { code: 'INVALID_INPUT', message: 'Missing key parameter.' } });
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
    return;
  }

  // API Route: Upload Request
  if (pathname === '/api/v1/files/upload-request' && req.method === 'POST') {
    let bodyStr = '';
    req.on('data', (chunk) => (bodyStr += chunk));
    req.on('end', async () => {
      try {
        const body = JSON.parse(bodyStr || '{}');

        // ── Security: Per-tier file size enforcement ───────────────────────
        const session = await authProvider.resolveSession(req.headers);
        const tier = session.tier || 'ANONYMOUS';
        const sizeCheck = validateFileSize(body.sizeBytes || 0, tier);
        if (!sizeCheck.valid) {
          return sendJson(413, { error: sizeCheck.error });
        }
        // ──────────────────────────────────────────────────────────────────

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
    return;
  }

  // API Route: Create Job
  if (pathname === '/api/v1/jobs' && req.method === 'POST') {
    let bodyStr = '';
    req.on('data', (chunk) => (bodyStr += chunk));
    req.on('end', async () => {
      try {
        const body = JSON.parse(bodyStr || '{}');
        const session = await authProvider.resolveSession(req.headers);
        const tier = session.tier || 'ANONYMOUS';

        // ── Security: Total batch size enforcement ─────────────────────────
        const files = body.files || [];
        const totalSizeCheck = validateTotalJobSize(files, tier);
        if (!totalSizeCheck.valid) {
          return sendJson(413, { error: totalSizeCheck.error });
        }
        // ──────────────────────────────────────────────────────────────────

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
    return;
  }

  // API Route: Get Job Status
  if (pathname.startsWith('/api/v1/jobs/') && req.method === 'GET') {
    const jobId = pathname.replace('/api/v1/jobs/', '');
    const job = await queueProvider.getJob(jobId);
    if (!job) {
      return sendJson(404, { error: { code: 'NOT_FOUND', message: 'Job not found.' } });
    }

    let downloadUrl = null;
    let filename = `processed_${job.operation}.pdf`;
    if (job.status === 'COMPLETED' && job.outputFileIds && job.outputFileIds.length > 0) {
      const presigned = await storageProvider.createPresignedDownloadUrl(job.outputFileIds[0]);
      downloadUrl = presigned.url;
      filename = path.basename(job.outputFileIds[0]);
    }

    return sendJson(200, {
      jobId: job.id,
      status: job.status,
      progress: job.progressPercent,
      downloadUrl,
      filename,
      error: job.error,
    });
  }


  // ── Phase 7: Developer API Key Routes ──────────────────────────────────────
  if (pathname.startsWith('/api/v1/developer')) {
    const handled = await handleDeveloperRoutes(req, res, pathname, sendJson, authProvider);
    if (handled) return;
  }

  // ── Phase 7: Webhook Management Routes ─────────────────────────────────────
  if (pathname.startsWith('/api/v1/webhooks')) {
    const handled = await handleWebhookRoutes(req, res, pathname, sendJson, authProvider);
    if (handled) return;
  }

  // ── Phase 7: Usage Telemetry & Audit Log Routes ─────────────────────────────
  if (pathname.startsWith('/api/v1/usage') || pathname.startsWith('/api/v1/audit-log')) {
    const handled = await handleUsageRoutes(req, res, pathname, url, sendJson, authProvider);
    if (handled) return;
  }

  // ── Phase 8: Growth Platform, Sitemap & Widget Routes ──────────────────────
  const growthHandled = await handleGrowthRoutes(req, res, pathname, url, sendJson);
  if (growthHandled) return;

  // Serve Static CSS
  if (pathname === '/styles.css') {
    const css = await fs.readFile(path.join(__dirname, 'public', 'styles.css'));
    res.writeHead(200, {
      'Content-Type': 'text/css',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
    });
    res.end(css);
    return;
  }

  // Serve Static Client App JS
  if (pathname === '/app.js') {
    const js = await fs.readFile(path.join(__dirname, 'public', 'app.js'));
    res.writeHead(200, {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
    });
    res.end(js);
    return;
  }

  // Serve Static Client ES Modules
  if (pathname.startsWith('/modules/')) {
    const safePath = path.normalize(path.join(__dirname, 'public', pathname));
    if (safePath.startsWith(path.join(__dirname, 'public', 'modules'))) {
      try {
        const mod = await fs.readFile(safePath);
        res.writeHead(200, {
          'Content-Type': 'application/javascript; charset=utf-8',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        });
        res.end(mod);
        return;
      } catch {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Module Not Found');
        return;
      }
    }
  }

  // Serve Static Vendor Files (GSAP, ScrollSmoother, etc.)
  if (pathname.startsWith('/vendor/')) {
    const safePath = path.normalize(path.join(__dirname, 'public', pathname));
    if (safePath.startsWith(path.join(__dirname, 'public', 'vendor'))) {
      try {
        const file = await fs.readFile(safePath);
        const ext = path.extname(safePath).toLowerCase();
        const contentType = ext === '.css' ? 'text/css' : (ext === '.js' ? 'application/javascript; charset=utf-8' : 'application/octet-stream');
        res.writeHead(200, {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400',
        });
        res.end(file);
        return;
      } catch {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Vendor File Not Found');
        return;
      }
    }
  }
  // Route: Dedicated /pricing Page (100% Free & Community Supported Transparency Page)
  if (pathname === '/pricing') {
    const pricingHtml = renderPricingPage({ renderNavbar, renderFooter, renderGsapScripts });
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(pricingHtml);
    return;
  }

  // Route: Dedicated /privacy Page (Zero-Retention & In-Browser Privacy Policy)
  if (pathname === '/privacy') {
    const privacyHtml = renderPrivacyPage({ renderNavbar, renderFooter, renderGsapScripts });
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(privacyHtml);
    return;
  }

  // Route: Dedicated /terms Page (Terms of Service)
  if (pathname === '/terms') {
    const termsHtml = renderTermsPage({ renderNavbar, renderFooter, renderGsapScripts });
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(termsHtml);
    return;
  }

  // Route: Dedicated /security Page (Security Architecture Whitepaper)
  if (pathname === '/security') {
    const securityHtml = renderSecurityPage({ renderNavbar, renderFooter, renderGsapScripts });
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(securityHtml);
    return;
  }

  // Route: Flagship SaaS Dark Landing Page (Root Route /)
  if (pathname === '/' || pathname === '') {
    const landingHtml = renderLandingPage({
      renderNavbar,
      renderFooter,
      TOOL_REGISTRY,
    });
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(landingHtml);
    return;
  }

  // Route Aliasing for Friendly Slugs
  const ROUTE_ALIASES = {
    'image-to-pdf': 'jpg-to-pdf',
    'gst-invoice': 'gst-invoice-pdf',
    'pos-billing': 'pos-billing',
    'clean-billing': 'pos-billing',
    'tax-receipt': 'tax-receipt',
    'estimate-maker': 'estimate-maker',
    'chat-with-pdf': 'ai-ask',
    'summarize-pdf': 'ai-summarize',
    'organize-pages': 'delete-pdf-pages',
    'crop-pdf': 'crop-pdf',
    'resize-pdf': 'crop-pdf',
    'pdf-to-audio': 'ai-summarize',
    'edit-pdf': 'edit-pdf',
    'pdf-editor': 'edit-pdf',
    'sign-pdf': 'draw-signature',
    'add-watermark': 'watermark-pdf',
    'page-numbers': 'page-numbers-pdf',
    'headers-footers': 'page-numbers-pdf',
    'extract-text': 'ocr-pdf',
    'extract-tables': 'ai-extract-table',
    'extract-pages': 'extract-pages',
    'split-pages': 'split-pdf',
    'flatten-pdf': 'flatten-pdf',
    'repair-pdf': 'repair-pdf',
    'encrypt-pdf': 'protect-pdf',
    'remove-password': 'unlock-pdf',
    'privacy-scanner': 'strip-metadata-pdf',
    'fingerprint-pdf': 'watermark-pdf',
    'compare-pdfs': 'compare-pdf',
  };

  // Serve Dedicated Tool Studio with Rich SEO & Structured Data
  const rawToolKey = pathname.replace(/^\//, '');
  const currentToolKey = ROUTE_ALIASES[rawToolKey] || rawToolKey;
  const toolConfig = TOOL_REGISTRY[currentToolKey];

  if (!toolConfig) {
    const notFoundHtml = render404Page({ renderNavbar, renderFooter, renderGsapScripts });
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(notFoundHtml);
    return;
  }

  const jsonLd = generateToolJsonLd(toolConfig);
  const category = getToolCategory(currentToolKey);
  const relatedSlugs = getRelatedToolsList(currentToolKey);

  const html = renderAppPage({
    toolConfig,
    jsonLd,
    category,
    relatedSlugs,
    renderNavbar,
    renderFooter,
    TOOL_REGISTRY,
    renderGsapScripts,
    currentToolKey,
  });

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
});

server.listen(PORT, () => {
  console.log(`DocPlatform production server running on http://localhost:${PORT}`);
});
// Reload trigger: 2026-09-15-saas-dark-landing-page

