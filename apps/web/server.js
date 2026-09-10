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
      'Content-Type': 'application/javascript',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
    });
    res.end(js);
    return;
  }
  // Reusable Component: Navbar
  const renderNavbar = (activeItem = '') => `
  <div class="navbar-wrapper">
    <header class="navbar">
      <a href="/" class="logo-container">
        <div class="logo-badge">DP</div>
        <span class="brand-title">DocPlatform</span>
      </a>
      <ul class="nav-links">
        <li><a href="/merge-pdf" class="nav-link ${activeItem === 'tools' ? 'active' : ''}">PDF Tools</a></li>
        <li><a href="/ai-ask" class="nav-link ${activeItem === 'ai' ? 'active' : ''}">AI & OCR</a></li>
        <li><a href="/#features" class="nav-link">Features</a></li>
        <li><a href="/pricing" class="nav-link ${activeItem === 'pricing' ? 'active' : ''}">Pricing & Support</a></li>
        <li><a href="/#faq" class="nav-link">FAQ</a></li>
      </ul>
      <div class="nav-action-area">
        <button class="nav-byok-btn" id="nav-byok-btn" onclick="openApiKeyModal()" title="Configure your free Google Gemini API Key for AI tools">
          <span class="byok-status-dot" id="byok-status-dot"></span>
          <span class="byok-btn-text" id="byok-btn-text">🔑 AI Key</span>
        </button>
        <button class="nav-support-btn" id="nav-support-btn" onclick="openSupportModal()">
          ☕ Support / Tip
        </button>
      </div>
    </header>
  </div>

  <!-- Support & Donation Modal -->
  <div class="support-modal-backdrop" id="support-modal-backdrop" onclick="closeSupportModal()"></div>
  <div class="support-modal" id="support-modal" role="dialog" aria-modal="true" aria-label="Support DocPlatform">
    <button class="modal-close-btn" onclick="closeSupportModal()" aria-label="Close">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
    <div class="support-modal-header">
      <div class="support-icon-badge">☕</div>
      <h2 class="support-modal-title">Support DocPlatform</h2>
      <p class="support-modal-desc">
        DocPlatform is <strong>100% free, private, and zero-login</strong> for everyone. If this tool saved you time or money, consider supporting our server & open development costs!
      </p>
    </div>
    
    <div class="tip-tiers-grid">
      <button class="tip-tier-card" onclick="selectTipAmount(3, this)">
        <span class="tip-emoji">☕</span>
        <span class="tip-amount">$3</span>
        <span class="tip-label">Buy a Coffee</span>
      </button>
      <button class="tip-tier-card active" onclick="selectTipAmount(5, this)">
        <span class="tip-emoji">🚀</span>
        <span class="tip-amount">$5</span>
        <span class="tip-label">Supporter</span>
      </button>
      <button class="tip-tier-card" onclick="selectTipAmount(15, this)">
        <span class="tip-emoji">🌟</span>
        <span class="tip-amount">$15</span>
        <span class="tip-label">Sponsor</span>
      </button>
    </div>

    <div class="support-cta-box">
      <a href="https://buymeacoffee.com" target="_blank" rel="noopener" class="support-submit-btn" id="support-submit-btn">
        <span>Tip $5 on BuyMeACoffee</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
      </a>
      <p class="support-note">🔒 Powered by secure external tip jar • Zero recurring fees • Voluntary gratitude</p>
    </div>
  </div>

  <!-- BYOK (Bring Your Own Key) Settings Modal -->
  <div class="byok-modal-backdrop" id="byok-modal-backdrop" onclick="closeApiKeyModal()"></div>
  <div class="byok-modal" id="byok-modal" role="dialog" aria-modal="true" aria-label="AI API Key Configuration">
    <button class="modal-close-btn" onclick="closeApiKeyModal()" aria-label="Close">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
    <div class="byok-modal-header">
      <div class="byok-icon-badge">🔑</div>
      <h2 class="byok-modal-title">AI API Key (BYOK)</h2>
      <p class="byok-modal-desc">
        To use <strong>Ask PDF (RAG Q&A)</strong> and <strong>AI Document Summarizer</strong> for free, provide your Google Gemini API Key. It is stored <strong>exclusively in your browser's localStorage</strong> and never saved on our servers.
      </p>
    </div>

    <form class="byok-form" onsubmit="saveApiKeyFromModal(event)">
      <div class="byok-field">
        <label for="gemini-api-key-input">Google Gemini API Key</label>
        <div class="byok-input-wrapper">
          <input type="password" id="gemini-api-key-input" placeholder="AIzaSy..." autocomplete="off" />
          <button type="button" class="byok-toggle-visibility" onclick="toggleKeyVisibility()">👁️</button>
        </div>
      </div>

      <div class="byok-help-card">
        <div class="byok-help-icon">💡</div>
        <div class="byok-help-text">
          <strong>How to get a Free Gemini Key in 10 seconds:</strong>
          <ol style="margin: 0.35rem 0 0 1.2rem; padding: 0; font-size: 0.8rem; color: var(--text-secondary); line-height: 1.4;">
            <li>Go to <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener" style="color: var(--brand-primary); font-weight: 600;">Google AI Studio (Free)</a>.</li>
            <li>Click <strong>"Create API Key"</strong>.</li>
            <li>Paste it here and click Save. Google provides free 15 requests/min.</li>
          </ol>
        </div>
      </div>

      <div class="byok-btn-row">
        <button type="submit" class="byok-save-btn">Save API Key</button>
        <button type="button" class="byok-clear-btn" onclick="clearApiKeyFromModal()">Remove Key</button>
      </div>
      <p class="byok-status-message" id="byok-status-msg"></p>
    </form>
  </div>

  <script>
    // ── Global BYOK & Support Modal Management ──────────────────────────────
    function getStoredGeminiKey() {
      return localStorage.getItem('dp_user_gemini_key') || '';
    }

    function updateByokBadge() {
      const key = getStoredGeminiKey();
      const dot = document.getElementById('byok-status-dot');
      const text = document.getElementById('byok-btn-text');
      const btn = document.getElementById('nav-byok-btn');
      if (dot && text && btn) {
        if (key && key.length > 5) {
          dot.className = 'byok-status-dot active';
          text.textContent = '🟢 AI Key Active';
          btn.classList.add('active');
        } else {
          dot.className = 'byok-status-dot';
          text.textContent = '🔑 Add AI Key';
          btn.classList.remove('active');
        }
      }
    }

    function openApiKeyModal() {
      const modal = document.getElementById('byok-modal');
      const backdrop = document.getElementById('byok-modal-backdrop');
      const input = document.getElementById('gemini-api-key-input');
      const msg = document.getElementById('byok-status-msg');
      if (input) input.value = getStoredGeminiKey();
      if (msg) msg.textContent = '';
      if (modal && backdrop) {
        modal.classList.add('open');
        backdrop.classList.add('open');
        document.body.style.overflow = 'hidden';
      }
    }

    function closeApiKeyModal() {
      const modal = document.getElementById('byok-modal');
      const backdrop = document.getElementById('byok-modal-backdrop');
      if (modal && backdrop) {
        modal.classList.remove('open');
        backdrop.classList.remove('open');
        document.body.style.overflow = '';
      }
    }

    async function saveApiKeyFromModal(e) {
      if (e) e.preventDefault();
      const input = document.getElementById('gemini-api-key-input');
      const msg = document.getElementById('byok-status-msg');
      const val = (input?.value || '').trim();
      if (!val) {
        if (msg) { msg.textContent = 'Please enter an API key or click Remove Key.'; msg.style.color = '#dc2626'; }
        return;
      }

      if (msg) {
        msg.textContent = '🔄 Validating key with Google Gemini API...';
        msg.style.color = '#6366f1';
      }

      try {
        const testRes = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + encodeURIComponent(val), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: 'ping' }] }] })
        });
        const data = await testRes.json();
        if (!testRes.ok || data.error) {
          const errText = data.error?.message || 'API key is invalid or rejected by Google.';
          if (msg) {
            msg.textContent = '❌ Verification Failed: ' + errText;
            msg.style.color = '#dc2626';
          }
          return;
        }

        localStorage.setItem('dp_user_gemini_key', val);
        updateByokBadge();
        if (msg) {
          msg.textContent = '✅ Key verified & active with Google Gemini 2.0 Flash!';
          msg.style.color = '#16a34a';
        }
        setTimeout(() => closeApiKeyModal(), 1200);
      } catch (netErr) {
        localStorage.setItem('dp_user_gemini_key', val);
        updateByokBadge();
        if (msg) {
          msg.textContent = '⚠️ Key saved (offline network bypass).';
          msg.style.color = '#d97706';
        }
        setTimeout(() => closeApiKeyModal(), 1200);
      }
    }

    function clearApiKeyFromModal() {
      localStorage.removeItem('dp_user_gemini_key');
      const input = document.getElementById('gemini-api-key-input');
      const msg = document.getElementById('byok-status-msg');
      if (input) input.value = '';
      updateByokBadge();
      if (msg) { msg.textContent = 'Key removed from browser storage.'; msg.style.color = '#475569'; }
    }

    function toggleKeyVisibility() {
      const input = document.getElementById('gemini-api-key-input');
      if (input) {
        input.type = input.type === 'password' ? 'text' : 'password';
      }
    }

    // ── Support / Donation Modal ─────────────────────────────────────────────
    let selectedTip = 5;
    function openSupportModal() {
      const modal = document.getElementById('support-modal');
      const backdrop = document.getElementById('support-modal-backdrop');
      if (modal && backdrop) {
        modal.classList.add('open');
        backdrop.classList.add('open');
        document.body.style.overflow = 'hidden';
      }
    }

    function closeSupportModal() {
      const modal = document.getElementById('support-modal');
      const backdrop = document.getElementById('support-modal-backdrop');
      if (modal && backdrop) {
        modal.classList.remove('open');
        backdrop.classList.remove('open');
        document.body.style.overflow = '';
      }
    }

    function selectTipAmount(amount, btnEl) {
      selectedTip = amount;
      document.querySelectorAll('.tip-tier-card').forEach(b => b.classList.remove('active'));
      if (btnEl) btnEl.classList.add('active');
      const cta = document.getElementById('support-submit-btn');
      if (cta) {
        cta.innerHTML = '<span>Tip $' + amount + ' on BuyMeACoffee</span> <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>';
      }
    }

    document.addEventListener('DOMContentLoaded', () => {
      updateByokBadge();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeApiKeyModal();
        closeSupportModal();
      }
    });
  </script>
  `;

  // Reusable Component: Multi-Column SaaS Footer
  const renderFooter = () => `
  <footer class="footer">
    <div class="footer-container">
      <div class="footer-grid">
        <!-- Brand Column -->
        <div class="footer-brand">
          <a href="/" class="footer-logo">
            <div class="logo-badge">DP</div>
            <span class="brand-title">DocPlatform</span>
          </a>
          <p class="footer-desc">
            The private, high-fidelity document platform. Engineered for zero-leak privacy, precision vector fidelity, and enterprise AI intelligence.
          </p>
          <div class="footer-social-links">
            <a href="https://github.com/upendrabisht22/pdf-tool" target="_blank" rel="noopener" class="social-icon-btn" title="GitHub">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
            </a>
            <a href="https://twitter.com/intent/tweet?text=DocPlatform+-+100%25+free+private+PDF+tools+with+AI&url=https://docplatform.app" target="_blank" rel="noopener" class="social-icon-btn" title="Share on Twitter / X">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path></svg>
            </a>
            <a href="https://www.linkedin.com/sharing/share-offsite/?url=https://docplatform.app" target="_blank" rel="noopener" class="social-icon-btn" title="Share on LinkedIn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
            </a>
          </div>
        </div>

        <!-- Product Column -->
        <div>
          <h4 class="footer-col-title">Product</h4>
          <ul class="footer-links-list">
            <li><a href="/merge-pdf" class="footer-link">PDF Tools</a></li>
            <li><a href="/word-to-pdf" class="footer-link">Document Convert</a></li>
            <li><a href="/redact-pdf" class="footer-link">Security & Redaction</a></li>
            <li><a href="/ocr-pdf" class="footer-link">Multilingual OCR</a></li>
            <li><a href="/ai-ask" class="footer-link">AI Document Q&A</a></li>
            <li><a href="/pricing" class="footer-link">Pricing Plans</a></li>
          </ul>
        </div>

        <!-- Developers & API Column -->
        <div>
          <h4 class="footer-col-title">Developers</h4>
          <ul class="footer-links-list">
            <li><a href="/api/v1/health" class="footer-link" target="_blank">REST API Health</a></li>
            <li><a href="/#features" class="footer-link">Sandboxed Workers</a></li>
            <li><a href="/pricing" class="footer-link">API Rate Limits</a></li>
            <li><a href="https://github.com/upendrabisht22/pdf-tool" class="footer-link" target="_blank">Architecture Spec</a></li>
            <li>
              <div class="status-pill" style="margin-top: 0.5rem;">
                <span>●</span> All Systems Operational
              </div>
            </li>
          </ul>
        </div>

        <!-- Legal & Contact Column -->
        <div>
          <h4 class="footer-col-title">Company & Legal</h4>
          <ul class="footer-links-list">
            <li><a href="/privacy" class="footer-link">Privacy Policy</a></li>
            <li><a href="/terms" class="footer-link">Terms of Service</a></li>
            <li><a href="/security" class="footer-link">Security Whitepaper</a></li>
            <li><a href="mailto:support@docplatform.com" class="footer-link">support@docplatform.com</a></li>
            <li><span style="font-size: 0.85rem; color: var(--text-muted);">Bengaluru, India</span></li>
          </ul>
        </div>
      </div>

      <!-- Bottom Bar -->
      <div class="footer-bottom-bar">
        <div>© 2026 DocPlatform Inc. All rights reserved. Precision vector processing & zero cloud retention.</div>
        <div class="footer-bottom-links">
          <a href="/privacy" class="footer-bottom-link">Privacy Policy</a>
          <a href="/terms" class="footer-bottom-link">Terms of Service</a>
          <a href="/security" class="footer-bottom-link">Security Whitepaper</a>
          <a href="mailto:support@docplatform.com" class="footer-bottom-link">Contact Support</a>
        </div>
      </div>
    </div>
  </footer>
  `;

  // Route: Dedicated /pricing Page (100% Free & Community Supported Transparency Page)
  if (pathname === '/pricing') {
    const pricingHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>100% Free Document Tools & Community Support — DocPlatform</title>
  <meta name="description" content="DocPlatform is 100% free with zero login and complete in-browser privacy. Use AI tools with your own free Gemini key (BYOK) or support the project with a tip.">
  <link rel="canonical" href="https://docplatform.app/pricing">
  <link rel="stylesheet" href="/styles.css?v=2.2">
</head>
<body>
  ${renderNavbar('pricing')}

  <main class="main-content" style="padding-top: 2rem;">
    <!-- Pricing Hero Section -->
    <section class="pricing-hero">
      <h1 class="pricing-title">
        100% Free Forever & <br>
        <span class="pricing-title-gradient">Community Supported</span>
      </h1>
      <p class="pricing-subtitle">
        Zero paywalls, zero subscriptions, and zero forced signups. All core PDF tools run in your browser for free. Use AI tools with your own free Gemini key (BYOK), and support our project with a coffee tip!
      </p>
    </section>

    <!-- Pricing Grid Cards (Free Core, BYOK AI, Community Supporter) -->
    <div class="pricing-grid">
      <!-- 1. Free Core PDF Tier -->
      <div class="pricing-card">
        <div class="pricing-header">
          <div class="plan-icon-box" style="background: #f1f5f9; color: #475569;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
          </div>
          <h2 class="plan-name">Free Core PDF</h2>
          <p class="plan-desc">For everyday document tasks with 100% client-side privacy.</p>
        </div>
        <div class="plan-price-box">
          <span class="plan-price">$0</span>
          <span class="plan-period">/ forever</span>
        </div>
        <p class="plan-billed-note">100% Free • No credit card • No sign-in required</p>
        <ul class="plan-features-list">
          <li class="plan-feature-item">
            <span class="plan-feature-check">✓</span>
            <span><strong>Up to 50MB</strong> file size per operation</span>
          </li>
          <li class="plan-feature-item">
            <span class="plan-feature-check">✓</span>
            <span><strong>100% In-Browser Privacy</strong> (Zero cloud upload)</span>
          </li>
          <li class="plan-feature-item">
            <span class="plan-feature-check">✓</span>
            <span>Merge, Split, Rotate, Delete, Compress & Reorder</span>
          </li>
          <li class="plan-feature-item">
            <span class="plan-feature-check">✓</span>
            <span>Watermark, Protect, Unlock, Sign & Redact</span>
          </li>
          <li class="plan-feature-item">
            <span class="plan-feature-check">✓</span>
            <span>Office to PDF & PDF to Office Vector Converters</span>
          </li>
          <li class="plan-feature-item">
            <span class="plan-feature-check">✓</span>
            <span><strong>Zero watermarks</strong> on output documents</span>
          </li>
        </ul>
        <button class="plan-cta-btn" onclick="window.location.href='/merge-pdf'">Use Free PDF Tools</button>
      </div>

      <!-- 2. Free AI Intelligence & OCR (BYOK) -->
      <div class="pricing-card popular">
        <div class="popular-tag">
          <span>★</span> BRING YOUR OWN KEY (BYOK)
        </div>
        <div class="pricing-header">
          <div class="plan-icon-box" style="background: #fee2e2; color: #e5322d;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
          </div>
          <h2 class="plan-name">AI Intelligence & OCR</h2>
          <p class="plan-desc">For researchers, lawyers, and students using AI Document Analysis.</p>
        </div>
        <div class="plan-price-box">
          <span class="plan-price">$0</span>
          <span class="plan-period">/ with your key</span>
        </div>
        <p class="plan-billed-note">Free Google Gemini API • Stored 100% in your browser</p>
        <ul class="plan-features-list">
          <li class="plan-feature-item">
            <span class="plan-feature-check">✓</span>
            <span><strong>Grounded AI Q&A (RAG)</strong> with verified [Page X] citations</span>
          </li>
          <li class="plan-feature-item">
            <span class="plan-feature-check">✓</span>
            <span><strong>Hierarchical Summarizer</strong> (100+ page contracts & books)</span>
          </li>
          <li class="plan-feature-item">
            <span class="plan-feature-check">✓</span>
            <span><strong>AI Table Extractor</strong> (Clean JSON, CSV & Markdown)</span>
          </li>
          <li class="plan-feature-item">
            <span class="plan-feature-check">✓</span>
            <span><strong>Multilingual OCR</strong> & Searchable Sandwich PDFs</span>
          </li>
          <li class="plan-feature-item">
            <span class="plan-feature-check">✓</span>
            <span>Zero vendor lock-in — your key, your complete data privacy</span>
          </li>
          <li class="plan-feature-item">
            <span class="plan-feature-check">✓</span>
            <span>Google provides free 15 requests/minute tier</span>
          </li>
        </ul>
        <button class="plan-cta-btn primary" onclick="openApiKeyModal()">Configure Free AI Key</button>
      </div>

      <!-- 3. Community Supporter / Tip Jar -->
      <div class="pricing-card">
        <div class="pricing-header">
          <div class="plan-icon-box" style="background: #e0e7ff; color: #4338ca;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>
          </div>
          <h2 class="plan-name">Community Supporter</h2>
          <p class="plan-desc">Help us cover domain, CDN bandwidth, and open maintenance.</p>
        </div>
        <div class="plan-price-box">
          <span class="plan-price">$3+</span>
          <span class="plan-period">/ voluntary tip</span>
        </div>
        <p class="plan-billed-note">One-time coffee tip • Zero recurring charges</p>
        <ul class="plan-features-list">
          <li class="plan-feature-item">
            <span class="plan-feature-check">✓</span>
            <span>Keeps DocPlatform <strong>100% free and open</strong> for everyone</span>
          </li>
          <li class="plan-feature-item">
            <span class="plan-feature-check">✓</span>
            <span>Supports continuous updates, new tools & optimizations</span>
          </li>
          <li class="plan-feature-item">
            <span class="plan-feature-check">✓</span>
            <span>Directly funds fast edge CDN bandwidth & server costs</span>
          </li>
          <li class="plan-feature-item">
            <span class="plan-feature-check">✓</span>
            <span>Support independent, privacy-first software development</span>
          </li>
          <li class="plan-feature-item">
            <span class="plan-feature-check">✓</span>
            <span>No account required — tip directly via BuyMeACoffee / UPI</span>
          </li>
        </ul>
        <button class="plan-cta-btn" onclick="openSupportModal()">☕ Support with a Tip</button>
      </div>
    </div>

    <!-- Feature Comparison Section -->
    <section class="comparison-section">
      <h2 class="comparison-title">Complete Transparency & Feature Overview</h2>
      <p class="comparison-subtitle">Every tool is accessible to everyone. Here is how DocPlatform operates.</p>

      <div class="table-responsive">
        <table class="comparison-table">
          <thead>
            <tr>
              <th style="width: 40%;">Platform Capability</th>
              <th style="width: 30%;">Core PDF Tools</th>
              <th style="width: 30%;">AI Intelligence & OCR</th>
            </tr>
          </thead>
          <tbody>
            <tr class="category-header">
              <td colspan="3">Document Privacy & Processing</td>
            </tr>
            <tr>
              <td>Cost to User</td>
              <td><strong style="color: #16a34a;">$0 (Free Forever)</strong></td>
              <td><strong style="color: #16a34a;">$0 (Free BYOK)</strong></td>
            </tr>
            <tr>
              <td>User Login / Sign-up Required</td>
              <td><span class="check-yes">✓</span> None (Zero Login)</td>
              <td><span class="check-yes">✓</span> None (Zero Login)</td>
            </tr>
            <tr>
              <td>Processing Engine</td>
              <td>100% In-Browser (WASM / JS)</td>
              <td>Client + Gemini AI / OCR</td>
            </tr>
            <tr>
              <td>Document Cloud Retention</td>
              <td>0s (Never leaves your browser)</td>
              <td>0s (Zero cloud retention)</td>
            </tr>
            <tr>
              <td>Watermarks on Output</td>
              <td><span class="check-yes">✓</span> None (Clean PDFs)</td>
              <td><span class="check-yes">✓</span> None (Clean Output)</td>
            </tr>

            <tr class="category-header">
              <td colspan="3">Supported Document Operations</td>
            </tr>
            <tr>
              <td>Core PDF (Merge, Split, Rotate, Delete, Extract, Compress)</td>
              <td><span class="check-yes">✓</span> Full Access</td>
              <td><span class="check-yes">✓</span> Full Access</td>
            </tr>
            <tr>
              <td>Security (Watermark, Password Protect, Unlock, Redact, Sign)</td>
              <td><span class="check-yes">✓</span> Full Access</td>
              <td><span class="check-yes">✓</span> Full Access</td>
            </tr>
            <tr>
              <td>Conversions (Word, Excel, PowerPoint $\leftrightarrow$ PDF)</td>
              <td><span class="check-yes">✓</span> Full Access</td>
              <td><span class="check-yes">✓</span> Full Access</td>
            </tr>
            <tr>
              <td>Multilingual OCR (Sandwich Searchable PDF)</td>
              <td>Standard</td>
              <td><span class="check-yes">✓</span> Full Vector Layer</td>
            </tr>
            <tr>
              <td>Grounded AI Q&A (RAG with [Page X] Citations)</td>
              <td>—</td>
              <td><span class="check-yes">✓</span> With Free Gemini Key</td>
            </tr>
            <tr>
              <td>Hierarchical Summarizer & Table Extractor</td>
              <td>—</td>
              <td><span class="check-yes">✓</span> With Free Gemini Key</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Pricing FAQs Accordion -->
    <section class="faq-container" style="margin-bottom: 3rem;">
      <h2 style="font-size: 2.1rem; font-weight: 800; text-align: center; color: var(--text-hero); margin-bottom: 1.75rem; letter-spacing: -0.02em;">Frequently Asked Questions</h2>
      <div class="faq-item">
        <div class="faq-question">
          <span>Why is DocPlatform completely free with no login?</span>
          <div class="faq-icon">+</div>
        </div>
        <div class="faq-answer">
          We believe basic document tasks (like merging contracts, splitting pages, and compressing files) should be private, fast, and accessible to students, researchers, and professionals worldwide. Because our processing runs directly inside your local web browser, our server costs are nearly zero — so we pass that complete freedom on to you.
        </div>
      </div>
      <div class="faq-item">
        <div class="faq-question">
          <span>How does Bring Your Own Key (BYOK) work for AI tools?</span>
          <div class="faq-icon">+</div>
        </div>
        <div class="faq-answer">
          To use AI Document Q&A, Summaries, and Table Extraction, you provide your own free Google Gemini API Key. Google provides a generous free tier (15 requests/minute). Your API key is stored exclusively in your browser's localStorage and is never saved to our database.
        </div>
      </div>
      <div class="faq-item">
        <div class="faq-question">
          <span>Are my documents private and secure?</span>
          <div class="faq-icon">+</div>
        </div>
        <div class="faq-answer">
          Yes, 100%. For standard PDF operations, the WebAssembly engine runs directly on your device — your files are never uploaded to any remote server or cloud bucket. For AI tools, only the specific text chunks you analyze are sent to Google's API via your personal key.
        </div>
      </div>
      <div class="faq-item">
        <div class="faq-question">
          <span>How can I support the project?</span>
          <div class="faq-icon">+</div>
        </div>
        <div class="faq-answer">
          If DocPlatform saved you time, you can support our domain, CDN bandwidth, and open maintenance costs with a voluntary coffee tip ($3, $5, or $15) via BuyMeACoffee or UPI. We are deeply grateful for your support!
        </div>
      </div>
      <div class="faq-item">
        <div class="faq-question">
          <span>Do you offer custom enterprise deployment or developer assistance?</span>
          <div class="faq-icon">+</div>
        </div>
        <div class="faq-answer">
          Yes! If you represent a law firm, accounting enterprise, or healthcare organization that needs custom air-gapped on-premise deployments or custom AI integrations, you can reach our engineering team directly at support@docplatform.com.
        </div>
      </div>
    </section>
  </main>

  ${renderFooter()}
  <script src="/app.js?v=2.2"></script>
</body>
</html>`;

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(pricingHtml);
    return;
  }

  // Route: Dedicated /privacy Page (Zero-Retention & In-Browser Privacy Policy)
  if (pathname === '/privacy') {
    const privacyHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Privacy Policy & Zero-Retention Architecture — DocPlatform</title>
  <meta name="description" content="Learn how DocPlatform protects your documents with 100% in-browser processing, zero cloud retention, and local BYOK Gemini key privacy.">
  <link rel="canonical" href="https://docplatform.app/privacy">
  <link rel="stylesheet" href="/styles.css?v=2.3">
</head>
<body>
  ${renderNavbar('')}

  <main class="main-content" style="padding-top: 2rem;">
    <nav class="breadcrumb-bar" aria-label="Breadcrumb">
      <a href="/">Home</a>
      <span class="breadcrumb-sep">/</span>
      <span class="breadcrumb-current">Privacy Policy</span>
    </nav>

    <section class="pricing-hero" style="margin-bottom: 2rem;">
      <h1 class="pricing-title">
        Privacy Policy & <br>
        <span class="pricing-title-gradient">Zero-Retention Guarantee</span>
      </h1>
      <p class="pricing-subtitle">
        Your documents belong to you. We believe privacy is a fundamental human right, not a paid tier feature.
      </p>
    </section>

    <div style="max-width: 860px; margin: 0 auto 5rem; background: #ffffff; border: 1px solid var(--border-subtle); border-radius: 16px; padding: 2.75rem 2.25rem; box-shadow: 0 4px 20px rgba(0,0,0,0.03); line-height: 1.8; color: var(--text-primary);">
      <div style="display: inline-flex; align-items: center; gap: 0.5rem; background: #dcfce7; color: #166534; padding: 0.35rem 0.9rem; border-radius: 9999px; font-weight: 700; font-size: 0.82rem; margin-bottom: 1.5rem;">
        <span>🔒</span> Zero Cloud Data Retention • Last Updated September 2026
      </div>

      <h2 style="font-size: 1.45rem; font-weight: 800; color: var(--text-hero); margin: 1.5rem 0 0.5rem;">1. 100% In-Browser Processing (Client-Side Privacy)</h2>
      <p>
        For standard PDF operations (including <strong>Merge, Split, Rotate, Compress, Delete Pages, Image to PDF, and Password Protect</strong>), all processing executes <strong>entirely inside your browser</strong> via WebAssembly and JavaScript vector engines. Your document bytes never leave your device and are never transmitted to our servers or stored in any cloud bucket.
      </p>

      <h2 style="font-size: 1.45rem; font-weight: 800; color: var(--text-hero); margin: 2rem 0 0.5rem;">2. Bring Your Own Key (BYOK) for AI Intelligence</h2>
      <p>
        For AI Document Q&A, Summaries, and Table Extraction, you provide your own free Google Gemini API Key. Your key is stored <strong>exclusively in your browser's localStorage</strong>. It is never written to our database, never logged, and never accessible by our team.
      </p>

      <h2 style="font-size: 1.45rem; font-weight: 800; color: var(--text-hero); margin: 2rem 0 0.5rem;">3. Ephemeral Server Workers & 60-Minute Auto-Purge</h2>
      <p>
        For heavy server conversions (such as high-fidelity Office to PDF or multilingual OCR), input files are held temporarily in ephemeral isolated scratch memory. Our automated <strong>Job-TTL Cleanup Daemon</strong> forcefully purges all inputs, outputs, and intermediate scratch files within <strong>60 minutes</strong> of job completion.
      </p>

      <h2 style="font-size: 1.45rem; font-weight: 800; color: var(--text-hero); margin: 2rem 0 0.5rem;">4. Zero Tracking, Cookies, or Data Monetization</h2>
      <p>
        We do not use tracking cookies, we do not profile your reading habits, and <strong>we never sell or monetize user data</strong>. DocPlatform is sustained through voluntary community coffee tips and open-source sponsorship.
      </p>

      <h2 style="font-size: 1.45rem; font-weight: 800; color: var(--text-hero); margin: 2rem 0 0.5rem;">5. Contact Our Privacy Team</h2>
      <p>
        If you have questions regarding our privacy architecture or require custom air-gapped on-premise deployments, contact us directly at <a href="mailto:support@docplatform.com" style="color: var(--brand-primary); font-weight: 700; text-decoration: underline;">support@docplatform.com</a>.
      </p>
    </div>
  </main>

  ${renderFooter()}
  <script src="/app.js?v=2.3"></script>
</body>
</html>`;

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(privacyHtml);
    return;
  }

  // Route: Dedicated /terms Page (Terms of Service)
  if (pathname === '/terms') {
    const termsHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Terms of Service — DocPlatform</title>
  <meta name="description" content="Simple, transparent, and developer-friendly Terms of Service for DocPlatform.">
  <link rel="canonical" href="https://docplatform.app/terms">
  <link rel="stylesheet" href="/styles.css?v=2.3">
</head>
<body>
  ${renderNavbar('')}

  <main class="main-content" style="padding-top: 2rem;">
    <nav class="breadcrumb-bar" aria-label="Breadcrumb">
      <a href="/">Home</a>
      <span class="breadcrumb-sep">/</span>
      <span class="breadcrumb-current">Terms of Service</span>
    </nav>

    <section class="pricing-hero" style="margin-bottom: 2rem;">
      <h1 class="pricing-title">
        Terms of <br>
        <span class="pricing-title-gradient">Service & Usage</span>
      </h1>
      <p class="pricing-subtitle">
        Zero paywalls, zero hidden contracts. Straightforward terms for our free document platform.
      </p>
    </section>

    <div style="max-width: 860px; margin: 0 auto 5rem; background: #ffffff; border: 1px solid var(--border-subtle); border-radius: 16px; padding: 2.75rem 2.25rem; box-shadow: 0 4px 20px rgba(0,0,0,0.03); line-height: 1.8; color: var(--text-primary);">
      <h2 style="font-size: 1.45rem; font-weight: 800; color: var(--text-hero); margin: 1rem 0 0.5rem;">1. Free & Zero-Login Commitment</h2>
      <p>
        DocPlatform is provided free of charge for personal, educational, and commercial use. You are not required to create an account, register your email, or provide credit card information to use any core document processing feature.
      </p>

      <h2 style="font-size: 1.45rem; font-weight: 800; color: var(--text-hero); margin: 2rem 0 0.5rem;">2. Acceptable Use Guidelines</h2>
      <p>
        You agree not to use DocPlatform to process, generate, or distribute malicious code, illegal materials, or execute denial-of-service (DoS) attacks against our infrastructure. Batch rate limits are enforced at the network level to ensure fair availability for all community users.
      </p>

      <h2 style="font-size: 1.45rem; font-weight: 800; color: var(--text-hero); margin: 2rem 0 0.5rem;">3. Intellectual Property</h2>
      <p>
        You retain 100% full ownership, rights, and copyright to all documents and data you process using DocPlatform. We claim zero rights or ownership over your content.
      </p>

      <h2 style="font-size: 1.45rem; font-weight: 800; color: var(--text-hero); margin: 2rem 0 0.5rem;">4. Disclaimer & Limitation of Liability</h2>
      <p>
        DocPlatform is provided "as is" without warranty of any kind, either express or implied. While we employ rigorous automated testing and cryptographic verification, users are encouraged to maintain backups of critical original documents before performing irreversible batch modifications.
      </p>

      <h2 style="font-size: 1.45rem; font-weight: 800; color: var(--text-hero); margin: 2rem 0 0.5rem;">5. Voluntary Community Support</h2>
      <p>
        Any tip or donation made via our coffee tip jar is voluntary gratitude and does not create an ongoing commercial contract or service-level commitment.
      </p>
    </div>
  </main>

  ${renderFooter()}
  <script src="/app.js?v=2.3"></script>
</body>
</html>`;

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(termsHtml);
    return;
  }

  // Route: Dedicated /security Page (Security Architecture Whitepaper)
  if (pathname === '/security') {
    const securityHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Security Architecture & Whitepaper — DocPlatform</title>
  <meta name="description" content="Technical overview of DocPlatform's security model: AES-256 GCM encryption, zero-leak vector redaction, sandboxed worker isolation, and ephemeral TTL memory.">
  <link rel="canonical" href="https://docplatform.app/security">
  <link rel="stylesheet" href="/styles.css?v=2.3">
</head>
<body>
  ${renderNavbar('')}

  <main class="main-content" style="padding-top: 2rem;">
    <nav class="breadcrumb-bar" aria-label="Breadcrumb">
      <a href="/">Home</a>
      <span class="breadcrumb-sep">/</span>
      <span class="breadcrumb-current">Security Whitepaper</span>
    </nav>

    <section class="pricing-hero" style="margin-bottom: 2rem;">
      <h1 class="pricing-title">
        Security Architecture & <br>
        <span class="pricing-title-gradient">Encryption Whitepaper</span>
      </h1>
      <p class="pricing-subtitle">
        Engineered with defense-in-depth security, strict memory isolation, and zero-leak document redaction.
      </p>
    </section>

    <div style="max-width: 860px; margin: 0 auto 5rem; background: #ffffff; border: 1px solid var(--border-subtle); border-radius: 16px; padding: 2.75rem 2.25rem; box-shadow: 0 4px 20px rgba(0,0,0,0.03); line-height: 1.8; color: var(--text-primary);">
      <h2 style="font-size: 1.45rem; font-weight: 800; color: var(--text-hero); margin: 1rem 0 0.5rem;">1. Cryptographic Standards (AES-256 GCM)</h2>
      <p>
        DocPlatform implements true AES-256 GCM authenticated encryption with PBKDF2 key derivation for PDF protection. Document permissions (printing, extraction, modification) are enforced cryptographically with 128-bit/256-bit permission flags.
      </p>

      <h2 style="font-size: 1.45rem; font-weight: 800; color: var(--text-hero); margin: 2rem 0 0.5rem;">2. Permanent Zero-Leak Vector Redaction</h2>
      <p>
        Unlike naive tools that merely draw a visual black box over sensitive text while leaving the underlying text stream selectable, DocPlatform's Redaction engine scrubs the underlying vector character streams, removes cached form XObjects, and strips metadata dictionary trails to guarantee <strong>zero-leak redaction</strong>.
      </p>

      <h2 style="font-size: 1.45rem; font-weight: 800; color: var(--text-hero); margin: 2rem 0 0.5rem;">3. Sandboxed Worker Isolation (SandboxedWorkerHarness)</h2>
      <p>
        All server-side conversion tasks execute inside sandboxed child worker processes with:
      </p>
      <ul style="padding-left: 1.5rem; margin: 0.75rem 0;">
        <li>Strict <strong>60-second execution CPU timeout budgets</strong> to neutralize decompression bombs (zip bombs).</li>
        <li>Memory consumption caps enforced per worker lease.</li>
        <li>Automatic subprocess process-group termination (SIGKILL) on timeout.</li>
      </ul>

      <h2 style="font-size: 1.45rem; font-weight: 800; color: var(--text-hero); margin: 2rem 0 0.5rem;">4. Automated Storage Hygiene (Job-TTL Daemon)</h2>
      <p>
        Our background cleanup daemon continuously monitors the file storage layer and automatically purges all temporary files older than <strong>60 minutes</strong>. No unencrypted document data is permanently archived.
      </p>

      <h2 style="font-size: 1.45rem; font-weight: 800; color: var(--text-hero); margin: 2rem 0 0.5rem;">5. Responsible Disclosure</h2>
      <p>
        If you discover a security vulnerability, please report it immediately to <a href="mailto:security@docplatform.com" style="color: var(--brand-primary); font-weight: 700; text-decoration: underline;">security@docplatform.com</a>. We review all security inquiries within 24 hours.
      </p>
    </div>
  </main>

  ${renderFooter()}
  <script src="/app.js?v=2.3"></script>
</body>
</html>`;

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(securityHtml);
    return;
  }

  // Serve Main Web Application with Rich SEO & Structured Data
  const isHomepage = pathname === '/' || pathname === '';
  const currentToolKey = isHomepage ? 'merge-pdf' : pathname.replace(/^\//, '');
  const toolConfig = TOOL_REGISTRY[currentToolKey] || TOOL_REGISTRY['merge-pdf'];
  const jsonLd = generateToolJsonLd(toolConfig);

  // Category & Related Tools Helper
  const TOOL_ICONS_MAP = {
    'merge-pdf': '📑', 'split-pdf': '✂️', 'compress-pdf': '⚡', 'rotate-pdf': '🔄',
    'delete-pdf-pages': '🗑️', 'extract-pages': '📑', 'jpg-to-pdf': '🖼️', 'pdf-to-jpg': '📷',
    'word-to-pdf': '📄', 'excel-to-pdf': '📊', 'pdf-to-word': '📝', 'pdf-to-excel': '📈',
    'watermark-pdf': '💧', 'page-numbers-pdf': '🔢', 'strip-metadata-pdf': '🧹', 'sign-pdf': '📜',
    'draw-signature': '✍️', 'flatten-pdf': '📄', 'repair-pdf': '🛠️', 'protect-pdf': '🔒',
    'unlock-pdf': '🔓', 'redact-pdf': '🛡️', 'ocr-pdf': '👁️', 'compare-pdf': '⚖️',
    'ai-summarize': '💡', 'ai-ask': '🤖', 'ai-extract-table': '📋', 'pipeline': '⚡',
    'pdf-to-markdown': '📝', 'markdown-to-pdf': '📄', 'gst-invoice-pdf': '🧾'
  };

  const getToolCategory = (key) => {
    if (['merge-pdf', 'split-pdf', 'compress-pdf', 'rotate-pdf', 'delete-pdf-pages', 'extract-pages'].includes(key)) return { name: 'Core PDF', link: '/merge-pdf' };
    if (['word-to-pdf', 'excel-to-pdf', 'pdf-to-word', 'pdf-to-excel', 'jpg-to-pdf', 'pdf-to-jpg', 'pdf-to-markdown', 'markdown-to-pdf'].includes(key)) return { name: 'Conversions', link: '/pdf-to-word' };
    if (['watermark-pdf', 'page-numbers-pdf', 'strip-metadata-pdf', 'sign-pdf', 'draw-signature', 'flatten-pdf', 'repair-pdf', 'protect-pdf', 'unlock-pdf', 'redact-pdf'].includes(key)) return { name: 'Security & Sign', link: '/protect-pdf' };
    if (['ocr-pdf', 'compare-pdf', 'ai-summarize', 'ai-ask', 'ai-extract-table'].includes(key)) return { name: 'AI & OCR', link: '/ai-ask' };
    if (['gst-invoice-pdf'].includes(key)) return { name: 'Business & Tax', link: '/gst-invoice-pdf' };
    return { name: 'PDF Tools', link: '/merge-pdf' };
  };

  const getRelatedToolsList = (key) => {
    const map = {
      'pdf-to-word': ['word-to-pdf', 'compress-pdf', 'ocr-pdf', 'protect-pdf', 'pdf-to-excel', 'merge-pdf'],
      'word-to-pdf': ['pdf-to-word', 'compress-pdf', 'merge-pdf', 'protect-pdf', 'sign-pdf', 'excel-to-pdf'],
      'pdf-to-excel': ['excel-to-pdf', 'ai-extract-table', 'pdf-to-word', 'compress-pdf'],
      'excel-to-pdf': ['pdf-to-excel', 'word-to-pdf', 'compress-pdf', 'merge-pdf'],
      'merge-pdf': ['split-pdf', 'compress-pdf', 'rotate-pdf', 'pdf-to-word', 'protect-pdf'],
      'split-pdf': ['merge-pdf', 'extract-pages', 'delete-pdf-pages', 'compress-pdf'],
      'compress-pdf': ['merge-pdf', 'pdf-to-word', 'protect-pdf', 'redact-pdf'],
      'protect-pdf': ['unlock-pdf', 'watermark-pdf', 'redact-pdf', 'sign-pdf'],
      'unlock-pdf': ['protect-pdf', 'compress-pdf', 'pdf-to-word', 'merge-pdf'],
      'ai-ask': ['ai-summarize', 'ai-extract-table', 'ocr-pdf', 'pdf-to-word'],
      'ai-summarize': ['ai-ask', 'ai-extract-table', 'ocr-pdf', 'compress-pdf'],
      'ocr-pdf': ['pdf-to-word', 'ai-ask', 'compress-pdf', 'searchable-pdf'],
      'redact-pdf': ['protect-pdf', 'strip-metadata-pdf', 'flatten-pdf', 'watermark-pdf'],
      'draw-signature': ['sign-pdf', 'flatten-pdf', 'protect-pdf', 'compress-pdf'],
      'pdf-to-markdown': ['markdown-to-pdf', 'pdf-to-word', 'ai-summarize', 'ocr-pdf'],
      'markdown-to-pdf': ['pdf-to-markdown', 'word-to-pdf', 'compress-pdf', 'merge-pdf'],
      'gst-invoice-pdf': ['sign-pdf', 'protect-pdf', 'pdf-to-excel', 'compress-pdf'],
    };
    return map[key] || ['merge-pdf', 'pdf-to-word', 'compress-pdf', 'ai-ask'];
  };

  const category = getToolCategory(currentToolKey);
  const relatedSlugs = getRelatedToolsList(currentToolKey);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${toolConfig.metaTitle}</title>
  <meta name="description" content="${toolConfig.metaDescription}">
  <meta name="keywords" content="${toolConfig.keywords.join(', ')}">
  <link rel="canonical" href="${toolConfig.canonicalUrl}">
  <link rel="stylesheet" href="/styles.css?v=2.3">
  <script src="https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
  <script type="application/ld+json">
    ${JSON.stringify(jsonLd.webAppSchema)}
  </script>
  <script type="application/ld+json">
    ${JSON.stringify(jsonLd.howToSchema)}
  </script>
  <script type="application/ld+json">
    ${JSON.stringify(jsonLd.faqSchema)}
  </script>
</head>
<body>
  ${renderNavbar(category.name === 'AI & OCR' ? 'ai' : 'tools')}

  <!-- Interactive Category & Tool Navigation -->
  <div class="tool-navigation-wrapper">
    <div class="tool-tabs" id="tool-tabs-container"></div>
  </div>

  <!-- Main Experience Canvas -->
  <main class="main-content">
    <!-- Breadcrumb Navigation for Dedicated Tool Pages -->
    <nav class="breadcrumb-bar" id="breadcrumb-bar" aria-label="Breadcrumb">
      <a href="/">Home</a>
      <span class="breadcrumb-sep">/</span>
      <a href="${category.link}" id="breadcrumb-cat">${category.name}</a>
      <span class="breadcrumb-sep">/</span>
      <span class="breadcrumb-current" id="breadcrumb-current">${toolConfig.title}</span>
    </nav>

    <section class="hero-section">
      <div class="hero-badge-pill">
        <span>🔒</span>
        <span id="hero-badge-text">${toolConfig.features[0] || '100% Private In-Browser Processing'}</span>
      </div>
      <h1 class="hero-title" id="hero-title">${toolConfig.title}</h1>
      <p class="hero-subtitle" id="hero-subtitle">${toolConfig.metaDescription}</p>
    </section>

    <!-- Interactive Dropzone & Workspace -->
    <div class="workspace-card">
      <input type="file" id="file-input" style="display:none;" />
      <input type="file" id="add-more-input" style="display:none;" />

      <!-- Dedicated Signature Creator Studio -->
      <div id="signature-studio" style="display: none; padding: 0.5rem;">
        <div style="display: flex; gap: 0.75rem; margin-bottom: 1.25rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.75rem;">
          <button type="button" id="sig-tab-draw" class="category-pill-btn active" onclick="switchSignatureTab('draw')">✍️ Draw Signature on Screen</button>
          <button type="button" id="sig-tab-upload" class="category-pill-btn" onclick="switchSignatureTab('upload')">📁 Upload & Compress Photo</button>
        </div>

        <!-- Draw Mode Sub-view -->
        <div id="sig-draw-view">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; flex-wrap: wrap; gap: 0.5rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; font-weight: 600; color: var(--text-secondary);">
              <span>Ink Color:</span>
              <button type="button" class="sig-color-btn" onclick="setSignatureInk('#0f172a')" style="width: 24px; height: 24px; border-radius: 50%; background: #0f172a; border: 2px solid #3b82f6; cursor: pointer;"></button>
              <button type="button" class="sig-color-btn" onclick="setSignatureInk('#1d4ed8')" style="width: 24px; height: 24px; border-radius: 50%; background: #1d4ed8; border: 2px solid transparent; cursor: pointer;"></button>
              <button type="button" class="sig-color-btn" onclick="setSignatureInk('#047857')" style="width: 24px; height: 24px; border-radius: 50%; background: #047857; border: 2px solid transparent; cursor: pointer;"></button>
            </div>
            <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; font-weight: 600; color: var(--text-secondary);">
              <span>Pen Thickness:</span>
              <select id="sig-studio-stroke" onchange="setSignatureStroke(this.value)" class="select-control">
                <option value="2">Fine (2px)</option>
                <option value="3" selected>Standard (3px)</option>
                <option value="4.5">Bold (4.5px)</option>
              </select>
            </div>
          </div>

          <!-- In-Page Canvas -->
          <div style="border: 2px dashed var(--border-subtle); border-radius: 12px; background: #ffffff; margin-bottom: 1rem; overflow: hidden; position: relative;">
            <canvas id="sig-studio-canvas" width="600" height="200" style="touch-action: none; cursor: crosshair; display: block; width: 100%; height: 200px; background: #ffffff;"></canvas>
          </div>

          <!-- Optimization Preset Grid -->
          <div style="background: var(--bg-subtle); border: 1px solid var(--border-subtle); border-radius: 10px; padding: 1rem; margin-bottom: 1.25rem; display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div>
              <label style="font-size: 0.78rem; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 0.35rem;">TARGET FILE SIZE</label>
              <select id="sig-studio-maxkb" class="select-control" style="width: 100%; font-weight: 700;">
                <option value="30" selected>&lt; 30 KB (Standard Defense / UPSC)</option>
                <option value="20">&lt; 20 KB (Strict Govt Form)</option>
                <option value="50">&lt; 50 KB (SSC / Banking)</option>
                <option value="0">Original Resolution</option>
              </select>
            </div>
            <div>
              <label style="font-size: 0.78rem; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 0.35rem;">IMAGE FORMAT</label>
              <select id="sig-studio-format" class="select-control" style="width: 100%;">
                <option value="jpeg" selected>JPG (Crisp White Background)</option>
                <option value="png">PNG (Transparent / Lossless)</option>
                <option value="webp">WebP (Ultra Compact)</option>
              </select>
            </div>
          </div>

          <!-- Action Buttons -->
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
            <button type="button" class="select-control" onclick="clearStudioSignaturePad()" style="cursor: pointer; padding: 0.6rem 1.2rem;">↺ Clear Drawing Board</button>
            <button type="button" class="process-btn" onclick="downloadStudioSignature()" style="padding: 0.7rem 1.8rem; font-size: 1rem; cursor: pointer;">
              📥 Download Compressed Signature (&lt;30 KB)
            </button>
          </div>
        </div>

        <!-- Upload Mode Sub-view -->
        <div id="sig-upload-view" style="display: none;">
          <div class="dropzone" id="sig-upload-dropzone" onclick="document.getElementById('file-input').click()" style="border-style: dashed; padding: 2.5rem 1.5rem;">
            <div class="dropzone-icon-box">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
            </div>
            <h3 style="font-size: 1.2rem; font-weight: 700; color: var(--text-hero); margin-bottom: 0.35rem;">Select Signature Photo from Phone / PC</h3>
            <p style="font-size: 0.88rem; color: var(--text-secondary); margin-bottom: 1.25rem;">Drop any phone camera photo of your handwritten signature here to auto-compress strictly under 30 KB.</p>
            <button type="button" class="upload-btn"><span>Choose Signature Image</span></button>
          </div>
        </div>
      </div>

      <!-- Dedicated Professional GST Invoice Studio -->
      <div id="gst-invoice-studio" style="display: none; padding: 0.5rem;">
        <div class="gst-studio-container">
          <!-- Left: Invoice Editor Form -->
          <div class="gst-form-panel">
            <div class="gst-panel-header">
              <div class="gst-panel-title">🧾 GST Invoice Designer</div>
              <div class="gst-theme-picker">
                <span style="font-size: 0.8rem; color: var(--text-secondary); font-weight: 600;">Theme:</span>
                <select id="gst-theme-select" class="select-control" onchange="updateGstInvoicePreview()" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;">
                  <option value="modern" selected>Modern Slate</option>
                  <option value="corporate">Corporate Blue</option>
                  <option value="emerald">Emerald Green</option>
                  <option value="minimal">Clean Minimal</option>
                </select>
              </div>
            </div>

            <!-- Seller Details -->
            <div class="gst-section-card">
              <div class="gst-section-title">🏢 Billed From (Your Business)</div>
              <div class="gst-grid-2">
                <input type="text" id="gst-seller-name" placeholder="Business Name *" value="Acme Technologies Pvt Ltd" oninput="updateGstInvoicePreview()" class="gst-input" />
                <input type="text" id="gst-seller-gstin" placeholder="Your GSTIN (e.g. 07AAAAA0000A1Z5)" value="07AAAAA0000A1Z5" oninput="updateGstInvoicePreview()" class="gst-input" />
              </div>
              <div class="gst-grid-2" style="margin-top: 0.5rem;">
                <input type="text" id="gst-seller-address" placeholder="Address, City, Pincode" value="Plot 42, Okhla Phase 3, New Delhi" oninput="updateGstInvoicePreview()" class="gst-input" />
                <div style="display: flex; gap: 0.5rem;">
                  <input type="text" id="gst-seller-state" placeholder="State (e.g. Delhi)" value="Delhi" oninput="updateGstInvoicePreview()" class="gst-input" style="flex: 2;" />
                  <input type="text" id="gst-seller-code" placeholder="Code" value="07" oninput="updateGstInvoicePreview()" class="gst-input" style="flex: 1;" />
                </div>
              </div>
              <div class="gst-grid-2" style="margin-top: 0.5rem;">
                <input type="text" id="gst-seller-phone" placeholder="Phone (optional)" value="+91 98765 43210" oninput="updateGstInvoicePreview()" class="gst-input" />
                <input type="text" id="gst-seller-pan" placeholder="PAN Number" value="AAAAA0000A" oninput="updateGstInvoicePreview()" class="gst-input" />
              </div>
            </div>

            <!-- Buyer Details -->
            <div class="gst-section-card">
              <div class="gst-section-title">👤 Billed To (Client / Customer)</div>
              <div class="gst-grid-2">
                <input type="text" id="gst-buyer-name" placeholder="Client Name *" value="Apex Retailers LLP" oninput="updateGstInvoicePreview()" class="gst-input" />
                <input type="text" id="gst-buyer-gstin" placeholder="Buyer GSTIN (if registered)" value="07BBBBB1111B1Z2" oninput="updateGstInvoicePreview()" class="gst-input" />
              </div>
              <div class="gst-grid-2" style="margin-top: 0.5rem;">
                <input type="text" id="gst-buyer-address" placeholder="Client Address, City" value="Connaught Place, Central Delhi" oninput="updateGstInvoicePreview()" class="gst-input" />
                <div style="display: flex; gap: 0.5rem;">
                  <input type="text" id="gst-buyer-state" placeholder="State (e.g. Delhi)" value="Delhi" oninput="updateGstInvoicePreview()" class="gst-input" style="flex: 2;" />
                  <input type="text" id="gst-buyer-code" placeholder="Code" value="07" oninput="updateGstInvoicePreview()" class="gst-input" style="flex: 1;" />
                </div>
              </div>
            </div>

            <!-- Invoice Meta & Tax Mode -->
            <div class="gst-section-card">
              <div class="gst-section-title">📅 Invoice Details & Tax Mode</div>
              <div class="gst-grid-3">
                <div>
                  <label class="gst-label">Invoice Number</label>
                  <input type="text" id="gst-inv-number" value="INV-2026-001" oninput="updateGstInvoicePreview()" class="gst-input" />
                </div>
                <div>
                  <label class="gst-label">Invoice Date</label>
                  <input type="date" id="gst-inv-date" oninput="updateGstInvoicePreview()" class="gst-input" />
                </div>
                <div>
                  <label class="gst-label">Tax Type</label>
                  <select id="gst-tax-type" class="gst-input" onchange="updateGstInvoicePreview()">
                    <option value="auto" selected>Auto (Intra/Inter)</option>
                    <option value="intra">Intra-State (CGST + SGST)</option>
                    <option value="inter">Inter-State (IGST)</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Line Items Table -->
            <div class="gst-section-card">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <div class="gst-section-title" style="margin-bottom: 0;">📦 Line Items & Services</div>
                <button type="button" class="select-control" onclick="addGstItemRow()" style="font-size: 0.78rem; padding: 0.25rem 0.65rem;">+ Add Item</button>
              </div>
              <div class="gst-items-table-wrapper">
                <table class="gst-items-table" id="gst-items-table">
                  <thead>
                    <tr>
                      <th style="width: 34%;">Description</th>
                      <th style="width: 16%;">HSN</th>
                      <th style="width: 12%;">Qty</th>
                      <th style="width: 16%;">Rate (Rs.)</th>
                      <th style="width: 14%;">GST%</th>
                      <th style="width: 8%;"></th>
                    </tr>
                  </thead>
                  <tbody id="gst-items-tbody">
                    <!-- Rows dynamically generated -->
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Banking & UPI QR Setup -->
            <div class="gst-section-card">
              <div class="gst-section-title">⚡ Instant Digital Payment & Bank Details</div>
              <div class="gst-grid-2">
                <div>
                  <label class="gst-label">UPI ID (for dynamic QR code)</label>
                  <input type="text" id="gst-upi-id" placeholder="yourbusiness@upi / 9876543210@paytm" value="acmetech@hdfcbank" oninput="updateGstInvoicePreview()" class="gst-input" />
                </div>
                <div>
                  <label class="gst-label">Bank Name</label>
                  <input type="text" id="gst-bank-name" placeholder="Bank Name" value="HDFC Bank" oninput="updateGstInvoicePreview()" class="gst-input" />
                </div>
              </div>
              <div class="gst-grid-2" style="margin-top: 0.5rem;">
                <div>
                  <label class="gst-label">Account Number</label>
                  <input type="text" id="gst-bank-acc" placeholder="Account Number" value="50200012345678" oninput="updateGstInvoicePreview()" class="gst-input" />
                </div>
                <div>
                  <label class="gst-label">IFSC Code</label>
                  <input type="text" id="gst-bank-ifsc" placeholder="IFSC Code" value="HDFC0000123" oninput="updateGstInvoicePreview()" class="gst-input" />
                </div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div style="display: flex; gap: 0.75rem; margin-top: 1rem;">
              <button type="button" class="process-btn" onclick="generateAndDownloadGstInvoicePdf()" style="flex: 2;">
                <span>⚡ Download GST Invoice PDF</span>
              </button>
              <button type="button" class="select-control" onclick="printGstInvoicePreview()" style="flex: 1; font-weight: 600;">
                <span>🖨️ Print</span>
              </button>
            </div>
          </div>

          <!-- Right: Live Real-Time Invoice Document Preview -->
          <div class="gst-preview-panel">
            <div class="gst-preview-toolbar">
              <span class="gst-preview-badge">LIVE A4 VECTOR PREVIEW</span>
              <span id="gst-preview-tax-badge" class="gst-preview-tax-mode">Intra-State (CGST 9% + SGST 9%)</span>
            </div>
            <div class="gst-paper" id="gst-paper">
              <!-- Live Invoice Content rendered in real-time -->
            </div>
          </div>
        </div>
      </div>

      <!-- Drag and drop zone -->
      <div class="dropzone" id="dropzone">
        <div class="dropzone-icon-box">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="12" y1="18" x2="12" y2="12"></line>
            <line x1="9" y1="15" x2="15" y2="15"></line>
          </svg>
        </div>
        <h2 class="dropzone-title" id="dropzone-title">Select PDF files</h2>
        <p class="dropzone-desc" id="dropzone-desc">or drop PDFs here. Instant client-side verification with zero data upload.</p>
        <button class="upload-btn">
          <span id="dropzone-btn-text">Select PDF files</span>
        </button>
      </div>

      <!-- File Staging Area -->
      <div class="staging-area" id="staging-area">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--text-hero);">Selected Documents</h3>
          <button class="select-control" id="add-more-btn" onclick="document.getElementById('add-more-input').click()">+ Add More Files</button>
        </div>

        <div class="files-grid" id="files-grid"></div>

        <!-- Action Controls -->
        <div class="action-bar">
          <div class="options-group" id="tool-options-container"></div>
          <button class="process-btn" id="process-btn">
            <span id="process-btn-text">Merge PDF Files</span>
          </button>
        </div>
      </div>

      <!-- Progress Tracking (Dynamic Real-Time Live Status) -->
      <div class="progress-container" id="progress-container">
        <div class="progress-header-box">
          <div class="progress-spinner" id="progress-spinner"></div>
          <div class="progress-titles">
            <h3 id="progress-status-text" class="progress-status-text">Processing Document...</h3>
            <p id="progress-sub-status" class="progress-sub-status">Analyzing document structure & vector glyphs...</p>
          </div>
        </div>
        <div class="progress-bar-track">
          <div class="progress-bar-fill" id="progress-bar-fill"></div>
        </div>
        <div class="progress-meta-row">
          <span class="progress-percent" id="progress-percent">0%</span>
          <span class="progress-timer" id="progress-timer">⏱️ 0.0s</span>
        </div>
      </div>

      <!-- Result / Success Card (Modern Framer Motion Redesign) -->
      <div class="result-card" id="result-card">
        <div class="result-icon-box">✓</div>
        <h3 class="result-title" id="result-title">Document Processed Successfully!</h3>
        <p class="result-subtitle" id="result-subtitle">Your optimized document has been generated, sanitized, and verified.</p>
        
        <div class="result-file-info" id="result-file-info">
          <div class="result-file-main">
            <span class="result-file-icon" id="result-file-icon">📄</span>
            <div>
              <div class="result-file-name" id="result-file-name">document.pdf</div>
              <div class="result-file-meta" id="result-file-meta">Verified • Client-Side Secure</div>
            </div>
          </div>
          <span class="result-file-badge" id="result-file-badge">PDF</span>
        </div>

        <!-- AI Response & Preview Box (For AI Summaries, Q&A, and Extracted Tables) -->
        <div class="result-ai-preview" id="result-ai-preview" style="display: none;">
          <div class="result-ai-header">
            <span class="result-ai-badge">🤖 AI Intelligence Preview</span>
            <button type="button" class="result-ai-copy-btn" id="result-ai-copy-btn" onclick="copyAiPreviewText()">📋 Copy Text</button>
          </div>
          <div class="result-ai-body" id="result-ai-body"></div>
        </div>

        <div>
          <a href="#" class="download-action-btn" id="download-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            <span id="download-btn-text">Download Document</span>
          </a>
        </div>

        <div class="result-actions-row">
          <button class="result-secondary-btn" id="result-secondary-btn" onclick="resetWorkspace()">↻ Convert Another File</button>
        </div>

        <!-- Next Steps Recommendations -->
        <div class="next-steps-container">
          <div class="next-steps-label">⚡ Next Recommended Actions</div>
          <div class="next-steps-chips" id="next-steps-chips">
            <a href="/compress-pdf" class="next-step-chip"><span>⚡ Compress File Size</span></a>
            <a href="/protect-pdf" class="next-step-chip"><span>🔒 Protect with Password</span></a>
            <a href="/sign-pdf" class="next-step-chip"><span>✍️ Sign Document</span></a>
          </div>
        </div>
      </div>
    </div>

    <!-- Tool-Specific Content & Smart Backlinks Section -->
    <div class="tool-content-wrapper" id="tool-content-wrapper">
      <!-- 1. Tool-Specific How-To Guide -->
      <section class="tool-howto-section" style="margin-bottom: 3.5rem;">
        <h2 class="tool-section-heading">How to use this tool</h2>
        <p class="tool-section-subheading">Follow these simple steps to process your document in seconds.</p>
        <div class="tool-steps-grid" id="tool-steps-container">
          ${toolConfig.howToSteps.map((step, idx) => `
            <div class="tool-step-card">
              <div class="tool-step-badge">${idx + 1}</div>
              <h3 class="tool-step-title">${step.name}</h3>
              <p class="tool-step-desc">${step.text}</p>
            </div>
          `).join('')}
        </div>
      </section>

      <!-- 2. Tool-Specific Key Features -->
      <section class="tool-features-section" style="margin-bottom: 3.5rem;">
        <h2 class="tool-section-heading">Key Features & Security</h2>
        <p class="tool-section-subheading">Engineered with precision vector geometry, high-fidelity font preservation, and zero data storage.</p>
        <div class="tool-features-grid" id="tool-features-container">
          ${toolConfig.features.map((feat, idx) => `
            <div class="tool-feature-card">
              <div class="tool-feature-icon">${idx === 0 ? '🔒' : idx === 1 ? '⚡' : '✨'}</div>
              <h3 class="tool-feature-title">Feature ${idx + 1}</h3>
              <p class="tool-feature-desc">${feat}</p>
            </div>
          `).join('')}
        </div>
      </section>

      <!-- 3. Smart Related Tools & High-Converting Backlinks -->
      <section class="related-tools-section">
        <h2 class="tool-section-heading" style="margin-bottom: 0.5rem;">Related Document Tools</h2>
        <p class="tool-section-subheading" style="margin-bottom: 2rem;">Explore complementary tools to edit, convert, and secure your files.</p>
        <div class="related-tools-grid" id="related-tools-container">
          ${relatedSlugs.slice(0, 4).map(slug => {
            const relTool = TOOL_REGISTRY[slug];
            if (!relTool) return '';
            return `
              <a href="/${slug}" class="related-tool-card">
                <span class="related-tool-icon">${TOOL_ICONS_MAP[slug] || '📄'}</span>
                <span class="related-tool-title">${relTool.title}</span>
                <span class="related-tool-desc">${relTool.metaDescription.substring(0, 80)}...</span>
              </a>
            `;
          }).join('')}
        </div>
      </section>

      <!-- 4. Tool-Specific FAQ Accordion -->
      <section class="faq-container" id="faq" style="margin-top: 3.5rem;">
        <h2 class="tool-section-heading">Frequently Asked Questions</h2>
        <p class="tool-section-subheading">Everything you need to know about this tool and security standards.</p>
        <div id="faq-list-container">
          ${toolConfig.faqs.map(faq => `
            <div class="faq-item">
              <div class="faq-question">
                <span>${faq.question}</span>
                <div class="faq-icon">+</div>
              </div>
              <div class="faq-answer">${faq.answer}</div>
            </div>
          `).join('')}
        </div>
      </section>
    </div>
  </main>

  ${renderFooter()}
  <script src="/app.js?v=2.3"></script>
</body>
</html>`;

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
});

server.listen(PORT, () => {
  console.log(`DocPlatform production server running on http://localhost:${PORT}`);
});
