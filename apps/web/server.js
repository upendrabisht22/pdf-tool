/**
 * @file server.js
 * @description Production HTTP Server & Control Plane API for DocPlatform.
 */

import * as http from 'node:http';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
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
    // Phase 1
    'merge-pdf': new MergePdfProcessor(),
    'split-pdf': new SplitPdfProcessor(),
    'rotate-pdf': new RotatePdfProcessor(),
    'compress-pdf': new CompressPdfProcessor(),
    'image-to-pdf': new ImageToPdfProcessor(),
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

        const newJob = {
          id: jobId,
          sessionId: session.sessionId,
          userId: session.userId,
          operation: body.operation || 'merge-pdf',
          inputFiles: files.map((f, idx) => ({
            fileId: `f_${idx}`,
            storageKey: f.storageKey || `mock_${f.name}`,
            filename: f.name,
            mimeType: 'application/pdf',
            sizeBytes: f.size || f.sizeBytes || 1024,
            detectedFormat: 'pdf',
          })),
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
    if (job.status === 'COMPLETED' && job.outputFileIds && job.outputFileIds.length > 0) {
      const presigned = await storageProvider.createPresignedDownloadUrl(job.outputFileIds[0]);
      downloadUrl = presigned.url;
    }

    return sendJson(200, {
      jobId: job.id,
      status: job.status,
      progress: job.progressPercent,
      downloadUrl,
      error: job.error,
    });
  }

  // Serve Static CSS
  if (pathname === '/styles.css') {
    const css = await fs.readFile(path.join(__dirname, 'public', 'styles.css'));
    res.writeHead(200, { 'Content-Type': 'text/css' });
    res.end(css);
    return;
  }

  // Serve Static Client App JS
  if (pathname === '/app.js') {
    const js = await fs.readFile(path.join(__dirname, 'public', 'app.js'));
    res.writeHead(200, { 'Content-Type': 'application/javascript' });
    res.end(js);
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
  <link rel="stylesheet" href="/styles.css">
  <script src="https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js"></script>
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
  <!-- Header -->
  <header class="navbar">
    <a href="/" class="logo-container">
      <div class="logo-badge">DP</div>
      <span class="brand-title" style="font-size: 1.35rem;">DocPlatform</span>
    </a>
    <ul class="nav-links">
      <li><a href="/merge-pdf" class="nav-link">PDF Tools</a></li>
      <li><a href="#features" class="nav-link">Features</a></li>
      <li><a href="#how-it-works" class="nav-link">How it Works</a></li>
      <li><a href="#pricing" class="nav-link">Pricing</a></li>
      <li><button class="nav-btn-pro" onclick="alert('DocPlatform Pro gives unlimited 2GB uploads, high-speed OCR, and developer API keys.')">Upgrade to Pro</button></li>
    </ul>
  </header>

  <!-- Tool Tabs Navigation -->
  <nav class="tool-tabs-container" aria-label="Tool selection">
    <div class="tool-tabs">
      <button class="tool-tab-btn active" data-tool="merge-pdf" onclick="switchTool('merge-pdf')">📑 Merge PDF</button>
      <button class="tool-tab-btn" data-tool="split-pdf" onclick="switchTool('split-pdf')">✂️ Split PDF</button>
      <button class="tool-tab-btn" data-tool="compress-pdf" onclick="switchTool('compress-pdf')">⚡ Compress PDF</button>
      <button class="tool-tab-btn" data-tool="rotate-pdf" onclick="switchTool('rotate-pdf')">🔄 Rotate PDF</button>
      <button class="tool-tab-btn" data-tool="delete-pdf-pages" onclick="switchTool('delete-pdf-pages')">🗑️ Delete Pages</button>
      <button class="tool-tab-btn" data-tool="jpg-to-pdf" onclick="switchTool('jpg-to-pdf')">🖼️ JPG to PDF</button>
    </div>
  </nav>

  <!-- Main Experience Canvas -->
  <main class="main-content">
    <section class="hero-section">
      <div class="hero-badge">
        <span style="font-size: 1rem;">🔒</span>
        <span id="hero-badge-text">${toolConfig.features[0] || '100% Private Local Processing'}</span>
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
        <svg class="dropzone-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="12" y1="18" x2="12" y2="12"></line>
          <line x1="9" y1="15" x2="15" y2="15"></line>
        </svg>
        <h2 class="dropzone-title">Drop your documents here</h2>
        <p class="dropzone-desc">Instant client-side verification. Your files remain confidential and secure.</p>
        <button class="upload-btn">
          <span>Choose Files</span>
        </button>
      </div>

      <!-- File Staging Area -->
      <div class="staging-area" id="staging-area">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h3 style="font-size: 1.15rem;">Selected Documents</h3>
          <button class="select-control" onclick="document.getElementById('add-more-input').click()">+ Add More Files</button>
        </div>

        <div class="file-list" id="file-list"></div>

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
        <h3 id="progress-status-label" style="font-size: 1.25rem; margin-bottom: 0.5rem;">Processing Document...</h3>
        <div class="progress-bar-track">
          <div class="progress-bar-fill" id="progress-fill"></div>
        </div>
        <p style="color: var(--brand-primary); font-weight: 700; font-size: 1.1rem;" id="progress-percent">0%</p>
      </div>

      <!-- Result Card -->
      <div class="result-card" id="result-card">
        <div class="result-icon">✓</div>
        <h3 style="font-size: 1.5rem; margin-bottom: 0.5rem;">Operation Complete!</h3>
        <p style="color: var(--text-secondary);">Your optimized document has been generated and validated.</p>
        <div>
          <a href="#" class="download-btn" id="download-action-btn">
            <span>Download Document</span>
          </a>
        </div>
        <div style="margin-top: 1.5rem;">
          <button class="select-control" onclick="resetWorkspace()">Process Another Document</button>
        </div>
      </div>
    </div>

    <!-- Educational SEO Features & Security Badges -->
    <section class="seo-section" id="features">
      <h2 style="font-size: 1.85rem; text-align: center; margin-bottom: 2rem;">Why Professionals Trust DocPlatform</h2>
      <div class="features-grid">
        <div class="feature-box">
          <div class="feature-icon">🛡️</div>
          <h3 class="feature-title">Privacy-First Engineering</h3>
          <p class="feature-desc">Documents are processed locally in your browser when possible or protected by auto-deleting cloud sandbox workers with short-lived presigned URLs.</p>
        </div>
        <div class="feature-box">
          <div class="feature-icon">⚡</div>
          <h3 class="feature-title">Zero Egress Latency</h3>
          <p class="feature-desc">Built on a modular, decoupled architecture capable of scaling to thousands of concurrent document pipelines without slowing down.</p>
        </div>
        <div class="feature-box">
          <div class="feature-icon">🎯</div>
          <h3 class="feature-title">Flawless Vector Fidelity</h3>
          <p class="feature-desc">Preserve crisp text typography, embedded high-resolution graphics, annotations, and bookmarks with zero degradation.</p>
        </div>
      </div>

      <!-- Step by Step Guide -->
      <div class="howto-card" id="how-it-works">
        <h2 style="font-size: 1.5rem;">How to use this tool</h2>
        <div class="steps-list">
          ${toolConfig.howToSteps
            .map(
              (step, idx) => `
            <div class="step-item">
              <div class="step-number">${idx + 1}</div>
              <div class="step-text">
                <h4>${step.name}</h4>
                <p>${step.text}</p>
              </div>
            </div>
          `
            )
            .join('')}
        </div>
      </div>

      <!-- Pricing Section -->
      <div id="pricing" style="margin-top: 4rem;">
        <h2 style="font-size: 1.85rem; text-align: center; margin-bottom: 1rem;">Simple, Transparent Pricing</h2>
        <p style="text-align: center; color: var(--text-secondary); margin-bottom: 2.5rem;">Start completely free or upgrade for massive file limits and developer API keys.</p>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem;">
          <!-- Free Tier -->
          <div class="feature-box" style="border: 1px solid var(--border-subtle);">
            <h3 style="font-size: 1.35rem; margin-bottom: 0.5rem;">Free Forever</h3>
            <p style="color: var(--text-secondary); margin-bottom: 1.25rem;">Ideal for everyday document tasks</p>
            <div style="font-size: 2.2rem; font-weight: 800; margin-bottom: 1.5rem;">$0 <span style="font-size: 0.9rem; color: var(--text-muted);">/ month</span></div>
            <ul style="list-style: none; display: flex; flex-direction: column; gap: 0.75rem; font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 2rem;">
              <li>✓ Up to 50MB file size</li>
              <li>✓ Local-first privacy engine</li>
              <li>✓ Merge, Split, Rotate, Compress</li>
              <li>✓ Zero watermarks</li>
            </ul>
            <button class="select-control" style="width: 100%;" onclick="alert('You are already using the Free tier!')">Current Plan</button>
          </div>

          <!-- Pro Tier -->
          <div class="feature-box" style="border: 2px solid var(--brand-primary); background: rgba(0, 229, 255, 0.03); position: relative;">
            <div style="position: absolute; top: -12px; right: 20px; background: var(--brand-gradient); color: #05070d; font-size: 0.75rem; font-weight: 800; padding: 0.2rem 0.75rem; border-radius: var(--radius-full);">POPULAR</div>
            <h3 style="font-size: 1.35rem; margin-bottom: 0.5rem;">Pro Creator</h3>
            <p style="color: var(--text-secondary); margin-bottom: 1.25rem;">For power users and busy teams</p>
            <div style="font-size: 2.2rem; font-weight: 800; margin-bottom: 1.5rem;">$9 <span style="font-size: 0.9rem; color: var(--text-muted);">/ month</span></div>
            <ul style="list-style: none; display: flex; flex-direction: column; gap: 0.75rem; font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 2rem;">
              <li>✓ Massive 500MB upload limit</li>
              <li>✓ High-accuracy OCR & Searchable PDFs</li>
              <li>✓ AI Document Summarization & Q&A</li>
              <li>✓ Priority Cloud Worker Sandbox</li>
            </ul>
            <button class="nav-btn-pro" style="width: 100%;" onclick="alert('Checkout initiated for Pro Creator Plan ($9/mo).')">Get Pro Access</button>
          </div>

          <!-- Business Tier -->
          <div class="feature-box" style="border: 1px solid var(--border-subtle);">
            <h3 style="font-size: 1.35rem; margin-bottom: 0.5rem;">Business & API</h3>
            <p style="color: var(--text-secondary); margin-bottom: 1.25rem;">For companies and developers</p>
            <div style="font-size: 2.2rem; font-weight: 800; margin-bottom: 1.5rem;">$29 <span style="font-size: 0.9rem; color: var(--text-muted);">/ month</span></div>
            <ul style="list-style: none; display: flex; flex-direction: column; gap: 0.75rem; font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 2rem;">
              <li>✓ 2GB upload & batch pipeline</li>
              <li>✓ Developer REST API & Webhooks</li>
              <li>✓ Team workspaces & audit trails</li>
              <li>✓ Dedicated custom domain embeds</li>
            </ul>
            <button class="select-control" style="width: 100%;" onclick="alert('Contacting sales for Business & API Plan.')">Contact Enterprise</button>
          </div>
        </div>
      </div>
    </section>
  </main>

  <!-- Footer -->
  <footer class="footer">
    <div class="footer-inner">
      <div class="footer-copy">
        © 2026 DocPlatform Technologies Inc. All rights reserved. Built with strict privacy & security defaults.
      </div>
      <ul class="footer-links">
        <li><a href="/merge-pdf" class="footer-link">Merge PDF</a></li>
        <li><a href="/split-pdf" class="footer-link">Split PDF</a></li>
        <li><a href="/compress-pdf" class="footer-link">Compress PDF</a></li>
        <li><a href="/rotate-pdf" class="footer-link">Rotate PDF</a></li>
        <li><a href="/jpg-to-pdf" class="footer-link">JPG to PDF</a></li>
      </ul>
    </div>
  </footer>

  <script src="/app.js"></script>
</body>
</html>`;

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
});

server.listen(PORT, () => {
  console.log(`DocPlatform production server running on http://localhost:${PORT}`);
});
