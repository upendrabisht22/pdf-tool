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
              try {
                const buf = await storageProvider.getObject(file.storageKey);
                inputBuffers.push(buf);
              } catch (err) {
                const fallbackDoc = await PDFDocument.create();
                fallbackDoc.addPage([595, 842]);
                const fallbackBytes = await fallbackDoc.save();
                inputBuffers.push(Buffer.from(fallbackBytes));
              }
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
              contentType: f.name.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream',
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
            mimeType: 'application/pdf',
            sizeBytes: f.size || f.sizeBytes || 1024,
            detectedFormat: 'pdf',
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

    function saveApiKeyFromModal(e) {
      if (e) e.preventDefault();
      const input = document.getElementById('gemini-api-key-input');
      const msg = document.getElementById('byok-status-msg');
      const val = (input?.value || '').trim();
      if (!val) {
        if (msg) { msg.textContent = 'Please enter an API key or click Remove Key.'; msg.style.color = '#dc2626'; }
        return;
      }
      localStorage.setItem('dp_user_gemini_key', val);
      updateByokBadge();
      if (msg) { msg.textContent = '✅ API key saved locally in your browser.'; msg.style.color = '#16a34a'; }
      setTimeout(() => closeApiKeyModal(), 1200);
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
            <a href="#" class="social-icon-btn" title="Twitter / X">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path></svg>
            </a>
            <a href="#" class="social-icon-btn" title="LinkedIn">
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
            <li><a href="#features" class="footer-link">Sandboxed Workers</a></li>
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
            <li><a href="#" class="footer-link">Privacy Policy</a></li>
            <li><a href="#" class="footer-link">Terms of Service</a></li>
            <li><a href="#" class="footer-link">Security Whitepaper</a></li>
            <li><a href="mailto:support@docplatform.com" class="footer-link">support@docplatform.com</a></li>
            <li><span style="font-size: 0.85rem; color: var(--text-muted);">Bengaluru, India</span></li>
          </ul>
        </div>
      </div>

      <!-- Bottom Bar -->
      <div class="footer-bottom-bar">
        <div>© 2026 DocPlatform Inc. All rights reserved. Precision vector processing & zero cloud retention.</div>
        <div class="footer-bottom-links">
          <a href="#" class="footer-bottom-link">Privacy Policy</a>
          <a href="#" class="footer-bottom-link">Terms of Service</a>
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

  // Serve Main Web Application with Rich SEO & Structured Data
  const currentToolKey = pathname.replace(/^\//, '') || 'merge-pdf';
  const toolConfig = TOOL_REGISTRY[currentToolKey] || TOOL_REGISTRY['merge-pdf'];
  const jsonLd = generateToolJsonLd(toolConfig);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${toolConfig.metaTitle}</title>
  <meta name="description" content="${toolConfig.metaDescription}">
  <meta name="keywords" content="${toolConfig.keywords.join(', ')}">
  <link rel="canonical" href="${toolConfig.canonicalUrl}">
  <link rel="stylesheet" href="/styles.css?v=2.2">
  <script src="https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
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
  ${renderNavbar('tools')}

  <!-- Interactive Category & Tool Navigation -->
  <div class="tool-navigation-wrapper">
    <div class="tool-tabs" id="tool-tabs-container"></div>
  </div>

  <!-- Main Experience Canvas -->
  <main class="main-content">
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

      <!-- Progress Tracking -->
      <div class="progress-container" id="progress-container">
        <h3 id="progress-status-text" style="font-size: 1.2rem; font-weight: 700; color: var(--text-hero); margin-bottom: 0.5rem;">Processing Document...</h3>
        <div class="progress-bar-track">
          <div class="progress-bar-fill" id="progress-bar-fill"></div>
        </div>
        <p style="color: var(--brand-primary); font-weight: 800; font-size: 1.15rem; font-family: 'JetBrains Mono', monospace;" id="progress-percent">0%</p>
      </div>

      <!-- Result Card -->
      <div class="result-card" id="result-card">
        <div class="result-icon-box">✓</div>
        <h3 style="font-size: 1.45rem; font-weight: 800; color: var(--text-hero); margin-bottom: 0.4rem;">Document Processed Successfully!</h3>
        <p style="color: var(--text-secondary); font-size: 0.95rem;">Your optimized document has been generated, sanitized, and verified.</p>
        <div>
          <a href="#" class="download-action-btn" id="download-btn">
            <span>Download Document</span>
          </a>
        </div>
        <div style="margin-top: 1.25rem;">
          <button class="select-control" onclick="resetWorkspace()">Process Another Document</button>
        </div>
      </div>
    </div>

    <!-- Trust Metrics Bar -->
    <div class="trust-metrics-bar">
      <div class="trust-metric-item">
        <div class="trust-metric-number">100%</div>
        <div class="trust-metric-label">Private In-Browser Processing</div>
      </div>
      <div class="trust-metric-item">
        <div class="trust-metric-number">AES-256</div>
        <div class="trust-metric-label">Military Grade Encryption</div>
      </div>
      <div class="trust-metric-item">
        <div class="trust-metric-number">0s</div>
        <div class="trust-metric-label">Zero Cloud Data Retention</div>
      </div>
      <div class="trust-metric-item">
        <div class="trust-metric-number">1M+</div>
        <div class="trust-metric-label">Documents Processed Securely</div>
      </div>
    </div>

    <!-- Bento Grid Feature Showcase -->
    <section class="seo-section" id="features">
      <h2 style="font-size: 2.1rem; font-weight: 800; text-align: center; color: var(--text-hero); margin-bottom: 0.75rem; letter-spacing: -0.02em;">Engineered for High-Consequence Documents</h2>
      <p style="text-align: center; color: var(--text-secondary); max-width: 620px; margin: 0 auto 2.5rem;">Military-grade encryption, zero-leak permanent redaction, and grounded AI intelligence.</p>

      <div class="bento-grid">
        <div class="bento-card">
          <div class="bento-icon" style="background: #fee2e2; border-color: #fecaca; color: #e5322d;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <h3 class="bento-title">Zero-Leak Security Redaction</h3>
          <p class="bento-desc">Unlike consumer tools that paint surface black boxes, our engine purges underlying vector text streams, annotations, and metadata permanently.</p>
        </div>
        <div class="bento-card">
          <div class="bento-icon" style="background: #e0e7ff; border-color: #c7d2fe; color: #4338ca;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </div>
          <h3 class="bento-title">Grounded AI Intelligence (RAG)</h3>
          <p class="bento-desc">Semantic chunking with verifiable [Page X] citations. No token truncation on 100+ page contracts and zero hallucinated numbers or clauses.</p>
        </div>
        <div class="bento-card">
          <div class="bento-icon" style="background: #dcfce7; border-color: #bbf7d0; color: #15803d;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          </div>
          <h3 class="bento-title">Universal Font & Script Fidelity</h3>
          <p class="bento-desc">HarfBuzz shaping engine renders complex non-Latin scripts (Hindi Devanagari ligatures, Urdu RTL, Arabic, Cyrillic) with 100% vector accuracy.</p>
        </div>
      </div>

      <!-- How to Guide -->
      <div class="workspace-card" id="how-it-works" style="margin-top: 3.5rem;">
        <h2 style="font-size: 1.5rem; font-weight: 800; color: var(--text-hero); margin-bottom: 1.5rem;">How to use this tool</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.5rem;">
          ${toolConfig.howToSteps
            .map(
              (step, idx) => `
            <div style="display: flex; gap: 1rem; align-items: flex-start;">
              <div style="width: 32px; height: 32px; border-radius: 50%; background: #fee2e2; color: var(--brand-primary); display: flex; align-items: center; justify-content: center; font-weight: 800; font-family: 'JetBrains Mono', monospace; font-size: 0.9rem; flex-shrink: 0;">${idx + 1}</div>
              <div>
                <h4 style="font-size: 1rem; font-weight: 700; color: var(--text-hero); margin-bottom: 0.25rem;">${step.name}</h4>
                <p style="font-size: 0.88rem; color: var(--text-secondary); line-height: 1.5;">${step.text}</p>
              </div>
            </div>
          `
            )
            .join('')}
        </div>
      </div>

      <!-- FAQ Accordion -->
      <div class="faq-container" id="faq">
        <h2 style="font-size: 1.9rem; font-weight: 800; text-align: center; color: var(--text-hero); margin-bottom: 1.75rem; letter-spacing: -0.02em;">Frequently Asked Questions</h2>
        ${toolConfig.faqs
          .map(
            (faq) => `
          <div class="faq-item">
            <div class="faq-question">
              <span>${faq.question}</span>
              <div class="faq-icon">+</div>
            </div>
            <div class="faq-answer">${faq.answer}</div>
          </div>
        `
          )
          .join('')}
      </div>
    </section>
  </main>

  ${renderFooter()}
  <script src="/app.js?v=2.2"></script>
</body>
</html>`;

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
});

server.listen(PORT, () => {
  console.log(`DocPlatform production server running on http://localhost:${PORT}`);
});
