/**
 * DocPlatform Interactive Client Application Orchestrator
 *
 * Modular Architecture:
 * - modules/tool-registry.js    : Tool definitions, icons, metadata, and FAQ registries
 * - modules/utils.js            : Binary encodings, type detection, formatting & sanitizers
 * - modules/signature-studio.js : Pen drawing canvas, modal, optimizer & photo upload (<30KB)
 * - modules/gst-studio.js       : Split-screen GST invoice generator, tax engine, UPI QR & live preview
 * - modules/direct-ai.js        : Browser-to-Gemini 2.0 Flash zero-server-trust execution
 * - modules/local-engine.js     : Pure client-side PDFLib / PDF.js vector manipulations
 * - modules/progress-tracker.js : Multi-phase animated progress, job polling & result cards
 */

import { TOOL_DEFINITIONS, TOOL_ICONS, TOOL_DETAILS_DATA } from './modules/tool-registry.js';
import {
  escapeHtml,
  renderSimpleMarkdown,
  arrayBufferToBase64,
  parsePageRanges,
  detectFileType,
  getBaseName,
  getDerivedOutputFilename
} from './modules/utils.js';
import {
  getSignatureData,
  setSignatureData,
  setSignatureInk,
  setSignatureStroke,
  switchSignatureTab,
  openSignatureDrawModal,
  closeSignatureDrawModal,
  initSignatureCanvas,
  clearSignaturePad,
  saveDrawnSignature,
  downloadDrawnSignature,
  initStudioSignatureCanvas,
  clearStudioSignaturePad,
  downloadStudioSignature,
  handleSignatureUpload
} from './modules/signature-studio.js';
import {
  gstItems,
  initGstInvoiceStudio,
  renderGstItemsTable,
  onGstItemChange,
  addGstItemRow,
  deleteGstItemRow,
  numberToWordsClient,
  updateGstInvoicePreview,
  generateAndDownloadGstInvoicePdf,
  printGstInvoicePreview
} from './modules/gst-studio.js';
import {
  getStoredGeminiKey,
  hasValidGeminiKey,
  copyAiPreviewText,
  executeDirectGeminiAi
} from './modules/direct-ai.js';
import {
  startLiveProgressTracking,
  stopLiveProgressTracking,
  updateProgress,
  pollJobStatus,
  renderSuccessDownload
} from './modules/progress-tracker.js';
import {
  canHandleLocally,
  executeLocalOperation
} from './modules/local-engine.js';

// ── Application Workspace State ─────────────────────────────────────────────
let stagedFiles = [];
let activeTool = 'merge-pdf';
let currentJobId = null;
let perPageRotations = {};

// ── UI Navigation & Tab Controls ────────────────────────────────────────────

function renderToolTabs() {
  const container = document.querySelector('.tool-tabs');
  if (!container) return;

  const categories = [
    { key: 'all', label: 'All Tools' },
    { key: 'core', label: 'Core PDF' },
    { key: 'convert', label: 'Convert' },
    { key: 'security', label: 'Security & Sign' },
    { key: 'ai', label: 'AI & OCR' },
    { key: 'business', label: 'Business & Tax' },
  ];

  let html = `<div class="category-pills-container">`;
  categories.forEach(cat => {
    html += `<button class="category-pill-btn ${cat.key === 'all' ? 'active' : ''}" onclick="window.filterCategory('${cat.key}')" data-cat="${cat.key}">${cat.label}</button>`;
  });
  html += `</div><div class="tool-tabs-scroll">`;

  for (const [key, tool] of Object.entries(TOOL_DEFINITIONS)) {
    const label = tool.title.replace(' Online', '').replace(' Converter', '').replace(' Documents', '');
    html += `<button class="tool-tab-btn" data-tool="${key}" data-cat="${tool.category}" onclick="window.switchTool('${key}')"><span>${label}</span></button>`;
  }
  html += `</div>`;
  container.innerHTML = html;
}

function initFaqAccordion() {
  document.querySelectorAll('.faq-question').forEach(q => {
    q.addEventListener('click', () => {
      const item = q.closest('.faq-item');
      if (item) {
        item.classList.toggle('open');
      }
    });
  });
}

export function setBillingCycle(cycle) {
  const monthlyBtn = document.getElementById('billing-monthly-btn');
  const yearlyBtn = document.getElementById('billing-yearly-btn');
  if (monthlyBtn && yearlyBtn) {
    monthlyBtn.classList.toggle('active', cycle === 'monthly');
    yearlyBtn.classList.toggle('active', cycle === 'yearly');
  }

  const proPrice = document.getElementById('price-pro');
  const proPeriod = document.getElementById('period-pro');
  const proBilled = document.getElementById('billed-pro');

  const entPrice = document.getElementById('price-enterprise');
  const entPeriod = document.getElementById('period-enterprise');
  const entBilled = document.getElementById('billed-enterprise');

  if (cycle === 'yearly') {
    if (proPrice) proPrice.textContent = '$5';
    if (proPeriod) proPeriod.textContent = '/ month';
    if (proBilled) proBilled.textContent = 'Billed $59 annually (Save 50%)';
    if (entPrice) entPrice.textContent = '$19';
    if (entPeriod) entPeriod.textContent = '/ month';
    if (entBilled) entBilled.textContent = 'Billed $229 annually (Save 35%)';
  } else {
    if (proPrice) proPrice.textContent = '$9';
    if (proPeriod) proPeriod.textContent = '/ month';
    if (proBilled) proBilled.textContent = 'Billed monthly, cancel anytime';
    if (entPrice) entPrice.textContent = '$29';
    if (entPeriod) entPeriod.textContent = '/ month';
    if (entBilled) entBilled.textContent = 'Billed monthly, cancel anytime';
  }
}

export function filterCategory(catKey) {
  document.querySelectorAll('.category-pill-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.cat === catKey);
  });
  document.querySelectorAll('.tool-tab-btn').forEach(btn => {
    if (catKey === 'all' || btn.dataset.cat === catKey) {
      btn.style.display = 'inline-flex';
    } else {
      btn.style.display = 'none';
    }
  });
}

export function switchTool(toolKey, updateUrl = true) {
  if (!TOOL_DEFINITIONS[toolKey]) return;
  activeTool = toolKey;
  stagedFiles = [];
  perPageRotations = {};

  // 1. Sync Browser URL and History
  if (updateUrl && window.location.pathname !== '/' + toolKey) {
    try {
      window.history.pushState({ tool: toolKey }, '', '/' + toolKey);
    } catch { /* ignore in non-browser environments */ }
  }

  // 2. Update Active Tab Pill
  document.querySelectorAll('.tool-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tool === toolKey);
  });

  const config = TOOL_DEFINITIONS[toolKey];
  const details = TOOL_DETAILS_DATA[toolKey] || {
    category: config.category === 'convert' ? 'Conversions' : config.category === 'security' ? 'Security & Sign' : config.category === 'ai' ? 'AI & OCR' : 'Core PDF',
    categoryLink: '/' + toolKey,
    features: [config.badge, 'High-resolution vector fidelity', '100% in-browser privacy'],
    howToSteps: [
      { name: 'Upload File', text: 'Select or drag your document into the drop zone.' },
      { name: 'Configure Options', text: 'Choose your desired conversion or editing parameters.' },
      { name: 'Download', text: 'Download your processed document instantly.' }
    ],
    faqs: [
      { question: 'Is my document secure?', answer: 'Yes! All operations run locally in your browser with zero data retention.' }
    ],
    related: ['merge-pdf', 'compress-pdf', 'pdf-to-word', 'protect-pdf']
  };

  // 3. Update Document Title & Breadcrumbs
  document.title = `${config.title} — DocPlatform`;
  const breadcrumbCat = document.getElementById('breadcrumb-cat');
  const breadcrumbCurrent = document.getElementById('breadcrumb-current');
  if (breadcrumbCat) {
    breadcrumbCat.textContent = details.category;
    breadcrumbCat.href = details.categoryLink;
  }
  if (breadcrumbCurrent) {
    breadcrumbCurrent.textContent = config.title;
  }

  // 4. Update Hero & Button Labels
  document.getElementById('hero-badge-text').textContent = config.badge;
  document.getElementById('hero-title').textContent = config.title;
  document.getElementById('hero-subtitle').textContent = config.subtitle;
  document.getElementById('process-btn-text').textContent = config.actionName;

  const fileInput = document.getElementById('file-input');
  if (fileInput) {
    fileInput.accept = config.accept;
    fileInput.multiple = config.multiple;
  }

  // Toggle Signature Studio vs GST Invoice Studio vs standard PDF dropzone
  const sigStudio = document.getElementById('signature-studio');
  const gstStudio = document.getElementById('gst-invoice-studio');
  const dropzone = document.getElementById('dropzone');

  if (toolKey === 'draw-signature') {
    if (sigStudio) sigStudio.style.display = 'block';
    if (gstStudio) gstStudio.style.display = 'none';
    if (dropzone) dropzone.style.display = 'none';
    switchSignatureTab('draw');
  } else if (toolKey === 'gst-invoice-pdf') {
    if (sigStudio) sigStudio.style.display = 'none';
    if (gstStudio) gstStudio.style.display = 'block';
    if (dropzone) dropzone.style.display = 'none';
    initGstInvoiceStudio();
  } else {
    if (sigStudio) sigStudio.style.display = 'none';
    if (gstStudio) gstStudio.style.display = 'none';
    if (dropzone) dropzone.style.display = 'block';
  }

  // Dynamic Dropzone Labels
  const dropTitle = document.getElementById('dropzone-title');
  const dropDesc = document.getElementById('dropzone-desc');
  const dropBtn = document.getElementById('dropzone-btn-text');

  if (activeTool === 'draw-signature') {
    if (dropTitle) dropTitle.textContent = 'Upload Signature Photo to Compress';
    if (dropDesc) dropDesc.textContent = 'or drop your handwritten signature photo here to auto-compress under 30 KB.';
    if (dropBtn) dropBtn.textContent = 'Choose Signature Photo';
  } else if (activeTool === 'jpg-to-pdf') {
    if (dropTitle) dropTitle.textContent = 'Select Image files (JPG, PNG, WebP)';
    if (dropDesc) dropDesc.textContent = 'or drop JPG, PNG, or WebP images here. Instant client-side PDF creation.';
    if (dropBtn) dropBtn.textContent = 'Select Images';
  } else if (activeTool === 'markdown-to-pdf') {
    if (dropTitle) dropTitle.textContent = 'Select Markdown file (.md, .txt)';
    if (dropDesc) dropDesc.textContent = 'or drop Markdown files here. Instant compilation to vector PDF.';
    if (dropBtn) dropBtn.textContent = 'Select Markdown File';
  } else if (config.category === 'convert' && (activeTool.includes('word') || activeTool.includes('excel') || activeTool.includes('powerpoint') || activeTool.includes('ppt'))) {
    if (dropTitle) dropTitle.textContent = 'Select Office document';
    if (dropDesc) dropDesc.textContent = 'or drop Word, Excel, or PowerPoint files here.';
    if (dropBtn) dropBtn.textContent = 'Select Document';
  } else {
    if (dropTitle) dropTitle.textContent = 'Select PDF files';
    if (dropDesc) dropDesc.textContent = 'or drop PDFs here. Instant client-side verification with zero data upload.';
    if (dropBtn) dropBtn.textContent = 'Select PDF files';
  }

  const optionsContainer = document.getElementById('tool-options-container');
  if (optionsContainer) optionsContainer.innerHTML = config.optionsHtml;

  // 5. Dynamic Content Updates (Steps, Features, Related Tools, FAQs)
  const stepsContainer = document.getElementById('tool-steps-container');
  if (stepsContainer && details.howToSteps) {
    stepsContainer.innerHTML = details.howToSteps.map((step, idx) => `
      <div class="tool-step-card">
        <div class="tool-step-badge">${idx + 1}</div>
        <h3 class="tool-step-title">${step.name}</h3>
        <p class="tool-step-desc">${step.text}</p>
      </div>
    `).join('');
  }

  const featuresContainer = document.getElementById('tool-features-container');
  if (featuresContainer && details.features) {
    featuresContainer.innerHTML = details.features.map((feat, idx) => `
      <div class="tool-feature-card">
        <div class="tool-feature-icon">${idx === 0 ? '🔒' : idx === 1 ? '⚡' : '✨'}</div>
        <h3 class="tool-feature-title">Feature ${idx + 1}</h3>
        <p class="tool-feature-desc">${feat}</p>
      </div>
    `).join('');
  }

  const relatedContainer = document.getElementById('related-tools-container');
  if (relatedContainer && details.related) {
    relatedContainer.innerHTML = details.related.slice(0, 4).map(slug => {
      const relTool = TOOL_DEFINITIONS[slug];
      if (!relTool) return '';
      return `
        <a href="/${slug}" class="related-tool-card" onclick="event.preventDefault(); window.switchTool('${slug}')">
          <span class="related-tool-icon">${TOOL_ICONS[slug] || '📄'}</span>
          <span class="related-tool-title">${relTool.title}</span>
          <span class="related-tool-desc">${relTool.subtitle.substring(0, 80)}...</span>
        </a>
      `;
    }).join('');
  }

  const faqContainer = document.getElementById('faq-list-container');
  if (faqContainer && details.faqs) {
    faqContainer.innerHTML = details.faqs.map(faq => `
      <div class="faq-item">
        <div class="faq-question">
          <span>${faq.question}</span>
          <div class="faq-icon">+</div>
        </div>
        <div class="faq-answer">${faq.answer}</div>
      </div>
    `).join('');
    initFaqAccordion();
  }

  // Dynamic handlers for split mode dropdown
  const splitModeSelect = document.getElementById('opt-split-mode');
  const splitRangesInput = document.getElementById('opt-split-ranges');
  if (splitModeSelect && splitRangesInput) {
    splitModeSelect.addEventListener('change', () => {
      splitRangesInput.style.display = splitModeSelect.value === 'ranges' ? 'inline-block' : 'none';
    });
  }

  // Dynamic handlers for rotate pages dropdown
  const rotatePagesSelect = document.getElementById('opt-rotate-pages');
  const rotateCustomInput = document.getElementById('opt-rotate-custom-pages');
  if (rotatePagesSelect && rotateCustomInput) {
    rotatePagesSelect.addEventListener('change', () => {
      rotateCustomInput.style.display = rotatePagesSelect.value === 'custom' ? 'inline-block' : 'none';
    });
  }

  resetWorkspace();
}

export function resetWorkspace() {
  stopLiveProgressTracking(false);
  stagedFiles = [];
  perPageRotations = {};

  const resultCard = document.getElementById('result-card');
  if (resultCard) resultCard.style.display = 'none';

  const progressContainer = document.getElementById('progress-container');
  if (progressContainer) progressContainer.style.display = 'none';

  const stagingArea = document.getElementById('staging-area');
  if (stagingArea) stagingArea.style.display = 'none';

  const sigStudio = document.getElementById('signature-studio');
  const gstStudio = document.getElementById('gst-invoice-studio');
  const dropzone = document.getElementById('dropzone');

  if (activeTool === 'draw-signature') {
    if (sigStudio) sigStudio.style.display = 'block';
    if (gstStudio) gstStudio.style.display = 'none';
    if (dropzone) dropzone.style.display = 'none';
    switchSignatureTab('draw');
  } else if (activeTool === 'gst-invoice-pdf') {
    if (sigStudio) sigStudio.style.display = 'none';
    if (gstStudio) gstStudio.style.display = 'block';
    if (dropzone) dropzone.style.display = 'none';
    initGstInvoiceStudio();
  } else {
    if (sigStudio) sigStudio.style.display = 'none';
    if (gstStudio) gstStudio.style.display = 'none';
    if (dropzone) dropzone.style.display = 'block';
  }

  const fileInput = document.getElementById('file-input');
  if (fileInput) fileInput.value = '';
  const addMoreInput = document.getElementById('add-more-input');
  if (addMoreInput) addMoreInput.value = '';
}

// ── File Ingestion & Staging Area ───────────────────────────────────────────

async function handleFilesSelected(files, isAppend = false) {
  const validFiles = [];

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const detected = detectFileType(file, bytes);

    let isValid = false;
    if (activeTool === 'jpg-to-pdf' || activeTool === 'draw-signature') {
      isValid = ['png', 'jpeg', 'webp'].includes(detected);
    } else if (activeTool === 'markdown-to-pdf') {
      isValid = ['markdown', 'unknown'].includes(detected) || file.name.endsWith('.md') || file.name.endsWith('.txt');
    } else if (activeTool.includes('word') || activeTool.includes('excel') || activeTool.includes('powerpoint') || activeTool.includes('ppt')) {
      isValid = ['docx', 'office-legacy', 'pdf'].includes(detected);
    } else {
      isValid = (detected === 'pdf');
    }

    if (isValid) {
      validFiles.push({
        id: `f_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        name: file.name,
        size: file.size,
        fileObject: file,
        bytes: bytes,
        detectedFormat: detected === 'markdown' ? 'markdown' : detected
      });
    } else {
      const expectedType = activeTool === 'jpg-to-pdf' ? 'Image (JPG, PNG, WebP)' :
                           activeTool === 'markdown-to-pdf' ? 'Markdown file (.md, .txt)' : 'PDF document';
      alert(`File "${file.name}" was rejected. Please select a valid ${expectedType}.`);
    }
  }

  if (isAppend) {
    stagedFiles.push(...validFiles);
  } else {
    stagedFiles = TOOL_DEFINITIONS[activeTool].multiple ? validFiles : validFiles.slice(0, activeTool === 'compare-pdf' ? 2 : 1);
  }

  if (stagedFiles.length > 0) {
    document.getElementById('dropzone').style.display = 'none';
    document.getElementById('staging-area').style.display = 'block';
    await renderFileList();
  }
}

async function renderFileList() {
  const container = document.getElementById('files-grid');
  if (!container) return;
  container.innerHTML = '';

  stagedFiles.forEach((file, index) => {
    const card = document.createElement('div');
    card.className = 'file-card';
    card.draggable = TOOL_DEFINITIONS[activeTool].multiple;

    card.innerHTML = `
      <div class="file-card-icon">📄</div>
      <div class="file-card-info">
        <div class="file-card-name" title="${file.name}">${file.name}</div>
        <div class="file-card-meta">${(file.size / 1024 / 1024).toFixed(2)} MB ${activeTool === 'compare-pdf' ? (index === 0 ? '• Original (A)' : '• Modified (B)') : ''}</div>
      </div>
      <button class="file-card-remove" onclick="window.removeStagedFile(${index})">✕</button>
    `;
    container.appendChild(card);
  });

  // Visual page rotation grid for rotate-pdf
  if (activeTool === 'rotate-pdf' && stagedFiles.length === 1 && typeof window.PDFLib !== 'undefined') {
    try {
      const doc = await window.PDFLib.PDFDocument.load(stagedFiles[0].bytes.slice(0));
      const totalPages = doc.getPageCount();

      const rotateContainer = document.createElement('div');
      rotateContainer.style.gridColumn = '1 / -1';
      rotateContainer.style.marginTop = '0.75rem';

      let pagesHtml = `
        <div style="padding-top: 1rem; border-top: 1px solid var(--border-subtle);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.85rem; flex-wrap: wrap; gap: 0.5rem;">
            <div style="font-weight: 700; font-size: 0.95rem; color: var(--text-hero); display: flex; align-items: center; gap: 0.4rem;">
              <span>📑</span> Rotate Single Pages (${totalPages} page${totalPages > 1 ? 's' : ''})
            </div>
            <div style="display: flex; gap: 0.4rem;">
              <button type="button" class="select-control" style="padding: 0.3rem 0.75rem; font-size: 0.8rem; cursor: pointer;" onclick="window.rotateAllVisualPages(90)">🔄 Rotate All +90°</button>
              <button type="button" class="select-control" style="padding: 0.3rem 0.75rem; font-size: 0.8rem; cursor: pointer;" onclick="window.resetAllVisualRotations()">↺ Reset</button>
            </div>
          </div>
          <div class="rotate-pages-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 0.85rem;">
      `;

      for (let i = 0; i < totalPages; i++) {
        const pageNum = i + 1;
        const rot = perPageRotations[i] || 0;
        pagesHtml += `
          <div class="page-rotate-card" id="page-card-${i}" style="background: var(--bg-subtle); border: 1px solid var(--border-subtle); border-radius: 10px; padding: 0.75rem; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 0.4rem; transition: all 0.2s ease;">
            <div style="font-size: 0.8rem; font-weight: 700; color: var(--text-secondary); display: flex; justify-content: space-between; width: 100%;">
              <span>Page ${pageNum}</span>
              <span id="page-angle-${i}" style="font-family: 'JetBrains Mono', monospace; color: var(--brand-primary); font-size: 0.75rem; font-weight: 800;">${rot}°</span>
            </div>
            <div style="width: 60px; height: 78px; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 4px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.05); margin: 0.3rem 0; overflow: hidden;">
              <div id="page-preview-box-${i}" style="transform: rotate(${rot}deg); transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1); display: flex; flex-direction: column; align-items: center; font-size: 0.7rem; color: #64748b;">
                <span style="font-size: 1.3rem;">📄</span>
                <span style="font-size: 0.65rem; font-weight: 700;">P${pageNum}</span>
              </div>
            </div>
            <button type="button" class="select-control" style="width: 100%; padding: 0.35rem 0.4rem; font-size: 0.78rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.25rem;" onclick="window.rotateSingleVisualPage(${i}, 90)">
              🔄 Rotate 90°
            </button>
          </div>
        `;
      }
      pagesHtml += `</div></div>`;
      rotateContainer.innerHTML = pagesHtml;
      container.appendChild(rotateContainer);
    } catch {
      // Best-effort visual preview
    }
  }

  const addMoreBtn = document.getElementById('add-more-btn');
  if (addMoreBtn) {
    addMoreBtn.style.display = TOOL_DEFINITIONS[activeTool].multiple ? 'inline-flex' : 'none';
  }
}

export function rotateSingleVisualPage(pageIndex, deg = 90) {
  perPageRotations[pageIndex] = ((perPageRotations[pageIndex] || 0) + deg) % 360;
  const newRot = perPageRotations[pageIndex];
  const box = document.getElementById(`page-preview-box-${pageIndex}`);
  const angleBadge = document.getElementById(`page-angle-${pageIndex}`);
  if (box) box.style.transform = `rotate(${newRot}deg)`;
  if (angleBadge) angleBadge.textContent = `${newRot}°`;
}

export function rotateAllVisualPages(deg = 90) {
  const cards = document.querySelectorAll('[id^="page-preview-box-"]');
  cards.forEach((_, i) => {
    rotateSingleVisualPage(i, deg);
  });
}

export function resetAllVisualRotations() {
  perPageRotations = {};
  renderFileList();
}

export function removeStagedFile(index) {
  stagedFiles.splice(index, 1);
  perPageRotations = {};
  if (stagedFiles.length === 0) {
    resetWorkspace();
  } else {
    renderFileList();
  }
}

// ── Options Collector & Execution Router ────────────────────────────────────

function collectActiveToolOptions() {
  const opts = {};

  if (activeTool === 'split-pdf') {
    const mode = document.getElementById('opt-split-mode')?.value || 'all-pages';
    opts.mode = mode;
    if (mode === 'ranges') opts.ranges = [document.getElementById('opt-split-ranges')?.value || '1'];
  } else if (activeTool === 'compress-pdf') {
    opts.level = document.getElementById('opt-compress-level')?.value || 'recommended';
  } else if (activeTool === 'rotate-pdf') {
    opts.rotation = parseInt(document.getElementById('opt-rotate-angle')?.value || '90', 10);
    const targetPages = document.getElementById('opt-rotate-pages')?.value || 'all';
    if (targetPages === 'custom') {
      const customInput = document.getElementById('opt-rotate-custom-pages')?.value || '1';
      opts.targetPages = parsePageRanges(customInput, 1000);
    } else {
      opts.targetPages = targetPages;
    }
  } else if (activeTool === 'delete-pdf-pages') {
    opts.deleteInput = document.getElementById('opt-delete-pages')?.value || '';
  } else if (activeTool === 'extract-pages') {
    opts.pages = parsePageRanges(document.getElementById('opt-extract-pages')?.value || '1', 1000);
  } else if (activeTool === 'jpg-to-pdf') {
    opts.pageSize = document.getElementById('opt-image-pagesize')?.value || 'A4';
    opts.orientation = document.getElementById('opt-image-orientation')?.value || 'auto';
  } else if (activeTool === 'watermark-pdf') {
    opts.text = document.getElementById('opt-watermark-text')?.value || 'CONFIDENTIAL';
    opts.opacity = parseFloat(document.getElementById('opt-watermark-opacity')?.value || '0.3');
  } else if (activeTool === 'protect-pdf') {
    opts.userPassword = document.getElementById('opt-protect-pass')?.value || '123456';
  } else if (activeTool === 'unlock-pdf') {
    opts.password = document.getElementById('opt-unlock-pass')?.value || '';
  } else if (activeTool === 'redact-pdf') {
    opts.boxes = [{ page: 1, x: 50, y: 400, width: 200, height: 30, replacementLabel: document.getElementById('opt-redact-label')?.value || '[REDACTED]' }];
    opts.sanitizeMetadata = document.getElementById('opt-redact-meta')?.checked ?? true;
  } else if (activeTool === 'ocr-pdf') {
    opts.language = document.getElementById('opt-ocr-lang')?.value || 'eng';
    opts.outputType = document.getElementById('opt-ocr-out')?.value || 'searchable-pdf';
  } else if (activeTool === 'compare-pdf') {
    opts.mode = document.getElementById('opt-compare-mode')?.value || 'visual-diff';
  } else if (activeTool === 'ai-summarize') {
    opts.mode = document.getElementById('opt-sum-mode')?.value || 'executive';
    opts.focusArea = document.getElementById('opt-sum-focus')?.value || 'all';
  } else if (activeTool === 'ai-ask') {
    opts.question = document.getElementById('opt-ask-query')?.value || 'What are the main key points of this document?';
  } else if (activeTool === 'ai-extract-table') {
    opts.format = document.getElementById('opt-table-format')?.value || 'json';
  } else if (activeTool === 'pdf-to-markdown') {
    opts.preserveTables = document.getElementById('opt-md-tables')?.checked ?? true;
    opts.includePageBreaks = document.getElementById('opt-md-page-break')?.checked ?? true;
  } else if (activeTool === 'markdown-to-pdf') {
    opts.pageSize = document.getElementById('opt-md-pagesize')?.value || 'A4';
    opts.theme = document.getElementById('opt-md-theme')?.value || 'modern';
  }

  return opts;
}

export async function executeDocumentOperation() {
  if (stagedFiles.length === 0) return;

  document.getElementById('dropzone').style.display = 'none';
  document.getElementById('staging-area').style.display = 'none';
  document.getElementById('result-card').style.display = 'none';
  document.getElementById('progress-container').style.display = 'block';

  startLiveProgressTracking(activeTool);

  try {
    // 1. Check BYOK for Direct AI Tools
    if (activeTool === 'ai-ask' || activeTool === 'ai-summarize') {
      if (!hasValidGeminiKey()) {
        document.getElementById('progress-container').style.display = 'none';
        document.getElementById('staging-area').style.display = 'block';
        if (typeof window.openApiKeyModal === 'function') {
          window.openApiKeyModal();
        } else {
          alert('Please enter your free Google Gemini API Key to run AI Q&A / Summarizer.');
        }
        return;
      }
    }

    // 2. Route 1: Local In-Browser Processing (Zero-Latency, Zero-Cloud)
    if (canHandleLocally(activeTool, stagedFiles)) {
      await executeLocalOperation(activeTool, stagedFiles, {
        perPageRotations,
        updateProgress,
        renderSuccessDownload: (url, filename) => renderSuccessDownload(url, filename, { activeTool, stagedFiles })
      });
      return;
    }

    // 3. Route 1.5: Direct In-Browser AI Execution (Zero-Server-Trust)
    if (activeTool === 'ai-ask' || activeTool === 'ai-summarize') {
      try {
        const directResult = await executeDirectGeminiAi({
          activeTool,
          stagedFiles,
          updateProgress
        });
        if (directResult) {
          renderSuccessDownload(URL.createObjectURL(directResult.blob), directResult.filename, { activeTool, stagedFiles });
          return;
        }
      } catch (directAiErr) {
        console.warn('[Direct AI] In-browser execution failed, falling back to worker pool:', directAiErr);
      }
    }

    // 4. Route 2: Asynchronous Distributed Worker Pipeline Fallback
    updateProgress(25, 'Submitting job to isolated worker pool...');

    const options = collectActiveToolOptions();
    if (activeTool.startsWith('ai-')) {
      options.apiKey = getStoredGeminiKey();
    }

    const filesPayload = stagedFiles.map(f => ({
      name: f.name,
      size: f.size,
      base64Data: arrayBufferToBase64(f.bytes)
    }));

    const jobResponse = await fetch('/api/v1/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operation: activeTool,
        files: filesPayload,
        options
      })
    });

    const jobData = await jobResponse.json();
    if (!jobResponse.ok) {
      throw new Error(jobData.error?.message || 'Failed to submit document job.');
    }

    currentJobId = jobData.jobId;
    pollJobStatus(currentJobId, {
      activeTool,
      stagedFiles,
      onComplete: (url, filename) => renderSuccessDownload(url, filename, { activeTool, stagedFiles }),
      onError: (err) => {
        alert(`Worker error: ${err.message}`);
        resetWorkspace();
      }
    });

  } catch (err) {
    alert(`Processing error: ${err.message}`);
    resetWorkspace();
  }
}

async function handleGenerateGstInvoice() {
  await generateAndDownloadGstInvoicePdf({
    startProgress: (tool) => startLiveProgressTracking(tool),
    onJobSubmitted: (jobId) => {
      currentJobId = jobId;
      pollJobStatus(jobId, {
        activeTool: 'gst-invoice-pdf',
        stagedFiles,
        onComplete: (url, filename) => renderSuccessDownload(url, filename, { activeTool: 'gst-invoice-pdf', stagedFiles }),
        onError: (err) => {
          alert(`Worker error: ${err.message}`);
          resetWorkspace();
        }
      });
    },
    onError: (err) => {
      stopLiveProgressTracking(false);
      alert(`Error generating invoice: ${err.message}`);
      const gstStudio = document.getElementById('gst-invoice-studio');
      const progContainer = document.getElementById('progress-container');
      if (gstStudio) gstStudio.style.display = 'block';
      if (progContainer) progContainer.style.display = 'none';
    }
  });
}

function setupEventListeners() {
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('file-input');
  const addMoreInput = document.getElementById('add-more-input');
  const processBtn = document.getElementById('process-btn');

  if (!dropzone || !fileInput || !processBtn) return;

  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
    });
  });

  dropzone.addEventListener('drop', (e) => {
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(Array.from(e.dataTransfer.files));
    }
  });

  dropzone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesSelected(Array.from(e.target.files));
      fileInput.value = '';
    }
  });

  if (addMoreInput) {
    addMoreInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFilesSelected(Array.from(e.target.files), true);
        addMoreInput.value = '';
      }
    });
  }

  processBtn.addEventListener('click', () => {
    executeDocumentOperation();
  });
}

// ── Global Window Bindings for Inline HTML Compatibility ────────────────────
window.switchTool = switchTool;
window.resetWorkspace = resetWorkspace;
window.filterCategory = filterCategory;
window.setBillingCycle = setBillingCycle;
window.rotateSingleVisualPage = rotateSingleVisualPage;
window.rotateAllVisualPages = rotateAllVisualPages;
window.resetAllVisualRotations = resetAllVisualRotations;
window.removeStagedFile = removeStagedFile;
window.executeDocumentOperation = executeDocumentOperation;

// Signature Studio Bindings
window.openSignatureDrawModal = openSignatureDrawModal;
window.closeSignatureDrawModal = closeSignatureDrawModal;
window.initSignatureCanvas = initSignatureCanvas;
window.clearSignaturePad = clearSignaturePad;
window.saveDrawnSignature = saveDrawnSignature;
window.downloadDrawnSignature = downloadDrawnSignature;
window.setSignatureInk = setSignatureInk;
window.setSignatureStroke = setSignatureStroke;
window.switchSignatureTab = switchSignatureTab;
window.initStudioSignatureCanvas = initStudioSignatureCanvas;
window.clearStudioSignaturePad = clearStudioSignaturePad;
window.downloadStudioSignature = downloadStudioSignature;
window.handleSignatureUpload = handleSignatureUpload;

// GST Studio Bindings
window.gstItems = gstItems;
window.initGstInvoiceStudio = initGstInvoiceStudio;
window.renderGstItemsTable = renderGstItemsTable;
window.onGstItemChange = onGstItemChange;
window.addGstItemRow = addGstItemRow;
window.deleteGstItemRow = deleteGstItemRow;
window.numberToWordsClient = numberToWordsClient;
window.updateGstInvoicePreview = updateGstInvoicePreview;
window.generateAndDownloadGstInvoicePdf = handleGenerateGstInvoice;
window.printGstInvoicePreview = printGstInvoicePreview;

// AI Preview Binding
window.copyAiPreviewText = copyAiPreviewText;

// ── Lifecycle Initialization ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  renderToolTabs();
  setupEventListeners();
  initFaqAccordion();

  // Set active tab on tool load based on URL path
  const currentPath = window.location.pathname.replace(/^\//, '') || 'merge-pdf';
  if (TOOL_DEFINITIONS[currentPath]) {
    switchTool(currentPath, false);
  } else {
    switchTool('merge-pdf', false);
  }

  // Handle browser Back / Forward Navigation
  window.addEventListener('popstate', () => {
    const slug = window.location.pathname.replace(/^\//, '') || 'merge-pdf';
    if (TOOL_DEFINITIONS[slug]) {
      switchTool(slug, false);
    }
  });
});
