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

import { TOOL_DEFINITIONS, TOOL_ICONS, TOOL_DETAILS_DATA, getClientToolContract } from './modules/tool-registry.js';
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
  printGstInvoicePreview,
  setGstStudioView,
  formatInrClient
} from './modules/gst-studio.js?v=3.2';
import {
  initPosStudio,
  updatePosReceiptPreview,
  generatePosReceiptPdf,
  setPosStudioView
} from './modules/pos-studio.js?v=3.5';
import {
  initTaxReceiptStudio,
  updateTaxReceiptPreview,
  generateTaxReceiptPdf,
  setTaxReceiptStudioView
} from './modules/tax-receipt-studio.js?v=3.5';
import {
  initEstimateStudio,
  updateEstimatePreview,
  generateEstimatePdf,
  setEstimateStudioView
} from './modules/estimate-studio.js?v=3.5';
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
import {
  initPdfEditorStudio,
  switchEditorPage,
  prevEditorPage,
  nextEditorPage,
  renderEditorPage,
  renderPageAnnotations,
  handleOverlayCanvasMouseDown,
  selectAnnotation,
  deleteSelectedAnnotation,
  setEditorTool,
  setEditorWhiteoutColor,
  redactAndTypeOverSelected,
  handleEditorImageUpload,
  insertImageAnnotation,
  setupEditorKeyboardAndPaste,
  insertStamp,
  insertDateStamp,
  insertSignatureStamp,
  setEditorFontFamily,
  setEditorFontSize,
  toggleEditorBold,
  toggleEditorItalic,
  setEditorTextColor,
  setEditorTextBg,
  setEditorShapeType,
  setEditorStrokeColor,
  setEditorStrokeWidth,
  zoomEditor,
  undoEditor,
  redoEditor,
  exportEditedPdf
} from './modules/pdf-editor-studio.js';

// ── Client Route Aliases ───────────────────────────────────────────────────
export const CLIENT_ROUTE_ALIASES = {
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
  'flatten-pdf': 'flatten-pdf',
  'repair-pdf': 'repair-pdf',
  'encrypt-pdf': 'protect-pdf',
  'remove-password': 'unlock-pdf',
  'privacy-scanner': 'strip-metadata-pdf',
  'fingerprint-pdf': 'watermark-pdf',
  'compare-pdfs': 'compare-pdf',
  'extract-tables': 'ai-extract-table',
  'extract-pages': 'extract-pages',
  'split-pages': 'split-pdf',
};

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
    if (q.dataset.bound === 'true') return;
    q.dataset.bound = 'true';
    q.addEventListener('click', () => {
      const item = q.closest('.faq-item');
      if (item) {
        item.classList.toggle('active');
        const ans = item.querySelector('.faq-answer');
        const icon = item.querySelector('.faq-icon');
        if (ans) {
          const isBlock = ans.style.display === 'block';
          ans.style.display = isBlock ? 'none' : 'block';
          if (icon) icon.textContent = isBlock ? '+' : '−';
        }
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

const ALL_STUDIO_IDS = [
  'signature-studio',
  'gst-invoice-studio',
  'pos-billing-studio',
  'tax-receipt-studio',
  'estimate-studio',
  'pdf-editor-studio'
];

export const STUDIO_INITIALIZERS = {
  'gst-invoice-studio': () => {
    initGstInvoiceStudio();
    if (window.innerWidth <= 1024) setGstStudioView('form');
    else setGstStudioView('split');
  },
  'pos-billing-studio': () => {
    initPosStudio();
    if (window.innerWidth <= 1024) setPosStudioView('form');
    else setPosStudioView('split');
  },
  'tax-receipt-studio': () => {
    initTaxReceiptStudio();
    if (window.innerWidth <= 1024) setTaxReceiptStudioView('form');
    else setTaxReceiptStudioView('split');
  },
  'estimate-studio': () => {
    initEstimateStudio();
    if (window.innerWidth <= 1024) setEstimateStudioView('form');
    else setEstimateStudioView('split');
  },
  'signature-studio': () => {
    switchSignatureTab('draw');
  },
  'pdf-editor-studio': () => {
    const uploadGate = document.getElementById('editor-upload-gate');
    const workspace = document.getElementById('editor-workspace');
    if (stagedFiles.length > 0 && stagedFiles[0].bytes) {
      if (uploadGate) uploadGate.style.display = 'none';
      if (workspace) workspace.style.display = 'block';
      initPdfEditorStudio(stagedFiles[0].bytes);
    } else {
      if (uploadGate) uploadGate.style.display = 'block';
      if (workspace) workspace.style.display = 'none';
    }
  }
};

export function hideAllStudiosAndDropzone() {
  ALL_STUDIO_IDS.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.style.display = 'none';
      el.classList.add('hidden');
    }
  });
  const dropzone = document.getElementById('dropzone');
  if (dropzone) {
    dropzone.style.setProperty('display', 'none', 'important');
    dropzone.classList.add('hidden');
    dropzone.setAttribute('hidden', '');
  }
}

export function switchTool(toolKey, updateUrl = true) {
  const originalKey = toolKey;
  const resolved = CLIENT_ROUTE_ALIASES[toolKey] || toolKey;
  if (!TOOL_DEFINITIONS[resolved]) {
    // If not found in client definitions, let browser navigate normally!
    window.location.href = '/' + originalKey;
    return;
  }
  toolKey = resolved;
  activeTool = toolKey;
  stagedFiles = [];
  perPageRotations = {};

  const contract = getClientToolContract(toolKey);
  const config = TOOL_DEFINITIONS[toolKey];
  const details = TOOL_DETAILS_DATA[toolKey] || {
    category: config.category === 'convert' ? 'Conversions' : config.category === 'security' ? 'Security & Sign' : config.category === 'ai' ? 'AI & OCR' : 'Core PDF',
    categoryLink: '/' + toolKey,
    features: [config.badge, 'High-resolution vector fidelity', '100% in-browser privacy'],
    howToSteps: [
      { name: 'Configure Options', text: 'Enter your details or select required options.' },
      { name: 'Process Document', text: 'Instantly generate or process your document in your browser.' },
      { name: 'Download', text: 'Download your processed document instantly.' }
    ],
    faqs: [
      { question: 'Is my document secure?', answer: 'Yes! All operations run locally in your browser with zero data retention.' }
    ],
    related: ['merge-pdf', 'compress-pdf', 'pdf-to-word', 'protect-pdf']
  };

  // 1. Sync Browser URL and History
  const targetUrl = '/' + originalKey;
  if (updateUrl && window.location.pathname !== targetUrl) {
    try {
      window.history.pushState({ tool: toolKey }, '', targetUrl);
    } catch { /* ignore in non-browser environments */ }
  }

  // 2. Update Active Tab Pill
  document.querySelectorAll('.tool-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tool === toolKey || btn.dataset.tool === originalKey);
  });

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
  const heroBadge = document.getElementById('hero-badge-text');
  if (heroBadge) heroBadge.textContent = config.badge || '';
  const heroTitle = document.getElementById('hero-title');
  if (heroTitle) heroTitle.textContent = config.title || '';
  const heroSubtitle = document.getElementById('hero-subtitle');
  if (heroSubtitle) heroSubtitle.textContent = config.subtitle || '';
  const procBtnText = document.getElementById('process-btn-text');
  if (procBtnText) procBtnText.textContent = config.actionName || 'Process Document';

  const fileInput = document.getElementById('file-input');
  if (fileInput) {
    fileInput.accept = contract.accept || '';
    fileInput.multiple = Boolean(config.multiple);
  }

  // 5. Layout Setup via ToolContract
  const mainContent = document.querySelector('.main-content');
  if (mainContent) {
    mainContent.classList.toggle('wide-canvas', Boolean(contract.wideCanvas));
  }

  hideAllStudiosAndDropzone();

  if (contract.studioId) {
    const studioEl = document.getElementById(contract.studioId);
    if (studioEl) {
      studioEl.style.display = 'block';
      studioEl.classList.remove('hidden');
    }
    STUDIO_INITIALIZERS[contract.studioId]?.();
  }

  const dropzone = document.getElementById('dropzone');
  if (dropzone) {
    if (contract.requiresInputFile && contract.mode !== 'editor') {
      dropzone.style.removeProperty('display');
      dropzone.style.display = 'flex';
      dropzone.classList.remove('hidden');
      dropzone.removeAttribute('hidden');
    } else {
      dropzone.style.setProperty('display', 'none', 'important');
      dropzone.classList.add('hidden');
      dropzone.setAttribute('hidden', '');
    }
  }

  // 6. Dynamic Dropzone Labels & Icons (Strictly driven by contract.inputType)
  if (contract.requiresInputFile && contract.mode !== 'editor') {
    const dropTitle = document.getElementById('dropzone-title');
    const dropDesc = document.getElementById('dropzone-desc');
    const dropBtn = document.getElementById('dropzone-btn-text');
    const iconContainer = document.getElementById('dropzone-icon-container');

    if (contract.inputType === 'image') {
      if (dropTitle) dropTitle.textContent = 'Select Image files (JPG, PNG, WebP)';
      if (dropDesc) dropDesc.textContent = 'or drop JPG, PNG, or WebP images here. Instant client-side PDF creation.';
      if (dropBtn) dropBtn.textContent = 'Select Images';
      if (iconContainer) {
        iconContainer.innerHTML = `
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
            <circle cx="9" cy="9" r="2"></circle>
            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
          </svg>
        `;
      }
    } else if (contract.inputType === 'markdown') {
      if (dropTitle) dropTitle.textContent = 'Select Markdown file (.md, .txt)';
      if (dropDesc) dropDesc.textContent = 'or drop Markdown files here. Instant compilation to vector PDF.';
      if (dropBtn) dropBtn.textContent = 'Select Markdown File';
      if (iconContainer) {
        iconContainer.innerHTML = `
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <path d="M10 12.5 8 15l2 2.5"></path>
            <path d="m14 12.5 2 2.5-2 2.5"></path>
          </svg>
        `;
      }
    } else if (contract.inputType === 'office') {
      if (dropTitle) dropTitle.textContent = 'Select Office document (.docx, .xlsx, .pptx)';
      if (dropDesc) dropDesc.textContent = 'or drop Word, Excel, or PowerPoint files here for instant conversion.';
      if (dropBtn) dropBtn.textContent = 'Select Document';
      if (iconContainer) {
        iconContainer.innerHTML = `
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
        `;
      }
    } else if (contract.inputType === 'pdf-or-image') {
      if (dropTitle) dropTitle.textContent = 'Select PDF or Image files';
      if (dropDesc) dropDesc.textContent = 'or drop PDF or image files for OCR processing.';
      if (dropBtn) dropBtn.textContent = 'Select File';
      if (iconContainer) {
        iconContainer.innerHTML = `
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="12" y1="18" x2="12" y2="12"></line>
            <line x1="9" y1="15" x2="15" y2="15"></line>
          </svg>
        `;
      }
    } else {
      if (dropTitle) dropTitle.textContent = 'Select PDF files';
      if (dropDesc) dropDesc.textContent = 'or drop PDFs here. Instant client-side verification with zero data upload.';
      if (dropBtn) dropBtn.textContent = 'Select PDF files';
      if (iconContainer) {
        iconContainer.innerHTML = `
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="12" y1="18" x2="12" y2="12"></line>
            <line x1="9" y1="15" x2="15" y2="15"></line>
          </svg>
        `;
      }
    }
  }

  const optionsContainer = document.getElementById('tool-options-container');
  if (optionsContainer) optionsContainer.innerHTML = config ? (config.optionsHtml || '') : '';

  // 7. Dynamic Content Updates (Steps, Features, Related Tools, FAQs)
  const stepsContainer = document.getElementById('tool-steps-container');
  if (stepsContainer && details.howToSteps) {
    stepsContainer.innerHTML = details.howToSteps.map((step, idx) => `
      <div class="border border-dashed border-border bg-bg-elevated p-5 flex flex-col justify-between">
        <div>
          <div class="mono-copy text-xs text-accent font-semibold mb-3">[ 0${idx + 1} ]</div>
          <h3 class="mono-copy text-xs font-bold text-text-primary uppercase tracking-wide mb-2">${step.name}</h3>
          <p class="mono-copy text-xs text-text-secondary leading-relaxed">${step.text}</p>
        </div>
      </div>
    `).join('');
  }

  const featuresContainer = document.getElementById('tool-features-container');
  if (featuresContainer && details.features) {
    featuresContainer.innerHTML = details.features.map((feat, idx) => `
      <div class="border border-dashed border-border bg-bg-elevated p-5 flex flex-col justify-between">
        <div>
          <div class="w-8 h-8 border border-dashed border-border flex items-center justify-center text-accent mb-3 bg-bg">
            ${idx === 0 ? `
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            ` : idx === 1 ? `
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
            ` : `
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
            `}
          </div>
          <div class="mono-copy text-[10px] text-text-muted uppercase tracking-widest mb-1.5">FEATURE_0${idx + 1}</div>
          <h3 class="mono-copy text-xs font-bold text-text-primary uppercase tracking-wide mb-2">${idx === 0 ? 'Client-Side Privacy' : idx === 1 ? 'High-Performance Engine' : 'Vector Precision'}</h3>
          <p class="mono-copy text-xs text-text-secondary leading-relaxed">${feat}</p>
        </div>
      </div>
    `).join('');
  }

  const relatedContainer = document.getElementById('related-tools-container');
  if (relatedContainer && details.related) {
    relatedContainer.innerHTML = details.related.slice(0, 4).map(slug => {
      const relTool = TOOL_DEFINITIONS[slug];
      if (!relTool) return '';
      return `
        <a href="/${slug}" class="tool-blueprint-card group relative p-4 bg-bg-elevated border border-dashed border-border hover:border-accent transition-all flex flex-col justify-between" onclick="event.preventDefault(); window.switchTool('${slug}')" style="text-decoration: none;">
          <div>
            <div class="flex items-center justify-between mb-3">
              <span class="mono-copy text-[10px] text-text-muted uppercase tracking-wider">${relTool.category || 'PDF'}</span>
              <span class="mono-copy text-xs text-text-muted group-hover:text-accent transition-colors">↗</span>
            </div>
            <h4 class="mono-copy text-xs font-bold text-text-primary group-hover:text-accent transition-colors mb-1.5">${relTool.title}</h4>
            <p class="mono-copy text-[11px] text-text-secondary leading-relaxed">${relTool.subtitle.substring(0, 70)}...</p>
          </div>
        </a>
      `;
    }).join('');
  }

  const faqContainer = document.getElementById('faq-list-container');
  if (faqContainer && details.faqs) {
    faqContainer.innerHTML = details.faqs.map(faq => `
      <div class="faq-item border border-dashed border-border bg-bg-elevated overflow-hidden transition-all">
        <div class="faq-question p-4 flex items-center justify-between cursor-pointer select-none">
          <span class="mono-copy text-xs font-semibold text-text-primary pr-4">${faq.question}</span>
          <div class="faq-icon mono-copy text-sm text-text-muted font-mono transition-transform duration-200">+</div>
        </div>
        <div class="faq-answer px-4 pb-4 mono-copy text-xs text-text-secondary leading-relaxed border-t border-dashed border-border/50 pt-3" style="display: none;">
          ${faq.answer}
        </div>
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

  hideAllStudiosAndDropzone();

  const contract = getClientToolContract(activeTool);
  if (contract.studioId) {
    const studio = document.getElementById(contract.studioId);
    if (studio) {
      studio.style.display = 'block';
      studio.classList.remove('hidden');
    }
    STUDIO_INITIALIZERS[contract.studioId]?.();
  } else if (contract.requiresInputFile && contract.mode !== 'editor') {
    const dropzone = document.getElementById('dropzone');
    if (dropzone) {
      dropzone.style.removeProperty('display');
      dropzone.style.display = 'flex';
      dropzone.classList.remove('hidden');
      dropzone.removeAttribute('hidden');
    }
  }

  const fileInput = document.getElementById('file-input');
  if (fileInput) fileInput.value = '';
  const addMoreInput = document.getElementById('add-more-input');
  if (addMoreInput) addMoreInput.value = '';
}

// ── File Ingestion & Staging Area ───────────────────────────────────────────

async function handleFilesSelected(files, isAppend = false) {
  const contract = getClientToolContract(activeTool);
  if (!contract.requiresInputFile) {
    console.warn(`Tool "${activeTool}" is a document generator and does not accept file uploads.`);
    return;
  }

  const validFiles = [];

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const detected = detectFileType(file, bytes);

    let isValid = false;
    if (contract.inputType === 'image') {
      isValid = ['png', 'jpeg', 'webp'].includes(detected);
    } else if (contract.inputType === 'markdown') {
      isValid = ['markdown', 'unknown'].includes(detected) || file.name.endsWith('.md') || file.name.endsWith('.txt');
    } else if (contract.inputType === 'office') {
      isValid = ['docx', 'office-legacy', 'pdf'].includes(detected);
    } else if (contract.inputType === 'pdf-or-image') {
      isValid = (detected === 'pdf') || ['png', 'jpeg', 'webp'].includes(detected);
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
      const expectedType = contract.inputType === 'image' ? 'Image (JPG, PNG, WebP)' :
                           contract.inputType === 'markdown' ? 'Markdown file (.md, .txt)' :
                           contract.inputType === 'office' ? 'Office document (Word, Excel, PPT)' :
                           contract.inputType === 'pdf-or-image' ? 'PDF or Image' : 'PDF document';
      alert(`File "${file.name}" was rejected. Please select a valid ${expectedType}.`);
    }
  }

  if (isAppend) {
    stagedFiles.push(...validFiles);
  } else {
    stagedFiles = TOOL_DEFINITIONS[activeTool].multiple ? validFiles : validFiles.slice(0, activeTool === 'compare-pdf' ? 2 : 1);
  }

  if (stagedFiles.length > 0) {
    if (contract.mode === 'editor') {
      const editorStudio = document.getElementById('pdf-editor-studio');
      const uploadGate = document.getElementById('editor-upload-gate');
      const workspace = document.getElementById('editor-workspace');
      if (editorStudio) editorStudio.style.display = 'block';
      if (uploadGate) uploadGate.style.display = 'none';
      if (workspace) workspace.style.display = 'block';
      const mainDropzone = document.getElementById('dropzone');
      const stagingArea = document.getElementById('staging-area');
      if (mainDropzone) mainDropzone.style.display = 'none';
      if (stagingArea) stagingArea.style.display = 'none';
      await initPdfEditorStudio(stagedFiles[0].bytes);
      return;
    }
    const dz = document.getElementById('dropzone');
    if (dz) dz.style.display = 'none';
    const sa = document.getElementById('staging-area');
    if (sa) sa.style.display = 'block';
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

  // Live visual preview for crop-pdf
  if (activeTool === 'crop-pdf' && stagedFiles.length === 1) {
    try {
      await renderLiveCropPreview(container);
    } catch (cropPreviewErr) {
      console.warn('Could not render live crop preview:', cropPreviewErr);
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
  const contract = getClientToolContract(activeTool);
  if (!contract.requiresInputFile) {
    return;
  }
  if (stagedFiles.length === 0) return;

  const dz = document.getElementById('dropzone');
  if (dz) dz.style.display = 'none';
  const sa = document.getElementById('staging-area');
  if (sa) sa.style.display = 'none';
  const rc = document.getElementById('result-card');
  if (rc) rc.style.display = 'none';
  const pc = document.getElementById('progress-container');
  if (pc) pc.style.display = 'block';

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

async function handleGeneratePosReceipt() {
  await generatePosReceiptPdf({
    startProgress: (tool) => startLiveProgressTracking(tool),
    onJobSubmitted: (jobId) => {
      currentJobId = jobId;
      pollJobStatus(jobId, {
        activeTool: 'pos-billing',
        stagedFiles,
        onComplete: (url, filename) => renderSuccessDownload(url, filename, { activeTool: 'pos-billing', stagedFiles }),
        onError: (err) => {
          alert(`Worker error: ${err.message}`);
          resetWorkspace();
        }
      });
    },
    onError: (err) => {
      stopLiveProgressTracking(false);
      alert(`Error generating POS receipt: ${err.message}`);
      const posStudio = document.getElementById('pos-billing-studio');
      const progContainer = document.getElementById('progress-container');
      if (posStudio) posStudio.style.display = 'block';
      if (progContainer) progContainer.style.display = 'none';
    }
  });
}

async function handleGenerateTaxReceipt() {
  await generateTaxReceiptPdf({
    startProgress: (tool) => startLiveProgressTracking(tool),
    onJobSubmitted: (jobId) => {
      currentJobId = jobId;
      pollJobStatus(jobId, {
        activeTool: 'tax-receipt',
        stagedFiles,
        onComplete: (url, filename) => renderSuccessDownload(url, filename, { activeTool: 'tax-receipt', stagedFiles }),
        onError: (err) => {
          alert(`Worker error: ${err.message}`);
          resetWorkspace();
        }
      });
    },
    onError: (err) => {
      stopLiveProgressTracking(false);
      alert(`Error generating Tax Receipt: ${err.message}`);
      const trStudio = document.getElementById('tax-receipt-studio');
      const progContainer = document.getElementById('progress-container');
      if (trStudio) trStudio.style.display = 'block';
      if (progContainer) progContainer.style.display = 'none';
    }
  });
}

async function handleGenerateEstimate() {
  await generateEstimatePdf({
    startProgress: (tool) => startLiveProgressTracking(tool),
    onJobSubmitted: (jobId) => {
      currentJobId = jobId;
      pollJobStatus(jobId, {
        activeTool: 'estimate-maker',
        stagedFiles,
        onComplete: (url, filename) => renderSuccessDownload(url, filename, { activeTool: 'estimate-maker', stagedFiles }),
        onError: (err) => {
          alert(`Worker error: ${err.message}`);
          resetWorkspace();
        }
      });
    },
    onError: (err) => {
      stopLiveProgressTracking(false);
      alert(`Error generating estimate: ${err.message}`);
      const estStudio = document.getElementById('estimate-studio');
      const progContainer = document.getElementById('progress-container');
      if (estStudio) estStudio.style.display = 'block';
      if (progContainer) progContainer.style.display = 'none';
    }
  });
}

function setupEventListeners() {
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('file-input');
  const addMoreInput = document.getElementById('add-more-input');
  const processBtn = document.getElementById('process-btn');

  if (dropzone) {
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

    if (fileInput) {
      dropzone.addEventListener('click', () => fileInput.click());
    }
  }

  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFilesSelected(Array.from(e.target.files));
        fileInput.value = '';
      }
    });
  }

  if (addMoreInput) {
    addMoreInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFilesSelected(Array.from(e.target.files), true);
        addMoreInput.value = '';
      }
    });
  }

  if (processBtn) {
    processBtn.addEventListener('click', () => {
      executeDocumentOperation();
    });
  }
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

let cropPdfDoc = null;
let cropPageViewport = null;
let cropPageOrigWidth = 595.28;
let cropPageOrigHeight = 841.89;

async function renderLiveCropPreview(container) {
  const pdfjs = window.pdfjsLib || window['pdfjs-dist/build/pdf'];
  if (!pdfjs || !stagedFiles[0] || !stagedFiles[0].bytes) return;

  const cropSection = document.createElement('div');
  cropSection.id = 'crop-live-preview-section';
  cropSection.style.gridColumn = '1 / -1';
  cropSection.style.marginTop = '1rem';
  cropSection.style.borderTop = '1px dashed var(--border)';
  cropSection.style.paddingTop = '1rem';

  cropSection.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; flex-wrap: wrap; gap: 0.5rem;">
      <div style="font-weight: 700; font-size: 0.95rem; color: var(--text-hero); display: flex; align-items: center; gap: 0.4rem;">
        <span>✂️</span> Live Crop & Margins Preview (Page 1)
      </div>
      <div style="display: flex; gap: 0.4rem; font-family: 'JetBrains Mono', monospace; font-size: 0.75rem;">
        <span id="crop-dim-original" style="padding: 0.2rem 0.5rem; background: var(--bg-subtle); border: 1px dashed var(--border); color: var(--text-secondary);">Original: Loading...</span>
        <span id="crop-dim-result" style="padding: 0.2rem 0.5rem; background: rgba(123, 97, 255, 0.12); border: 1px dashed var(--accent); color: var(--accent); font-weight: bold;">Cropped: ...</span>
      </div>
    </div>

    <div style="display: flex; justify-content: center; align-items: center; background: var(--bg-subtle); border: 1px dashed var(--border); padding: 1.25rem; border-radius: 6px; overflow: hidden; position: relative;">
      <div id="crop-stage-container" style="position: relative; box-shadow: 0 4px 18px rgba(0,0,0,0.15); line-height: 0;">
        <canvas id="crop-preview-canvas" style="display: block; background: #ffffff; max-height: 380px; width: auto; height: auto;"></canvas>
        <div id="crop-overlay-shade-top" style="position: absolute; top: 0; left: 0; right: 0; background: rgba(15, 23, 42, 0.6); pointer-events: none; transition: height 0.08s ease;"></div>
        <div id="crop-overlay-shade-bottom" style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(15, 23, 42, 0.6); pointer-events: none; transition: height 0.08s ease;"></div>
        <div id="crop-overlay-shade-left" style="position: absolute; top: 0; bottom: 0; left: 0; background: rgba(15, 23, 42, 0.6); pointer-events: none; transition: width 0.08s ease;"></div>
        <div id="crop-overlay-shade-right" style="position: absolute; top: 0; bottom: 0; right: 0; background: rgba(15, 23, 42, 0.6); pointer-events: none; transition: width 0.08s ease;"></div>
        <div id="crop-overlay-viewport" style="position: absolute; border: 2px dashed #7b61ff; pointer-events: none; box-sizing: border-box; transition: all 0.08s ease;">
          <span style="position: absolute; bottom: 4px; right: 6px; font-family: 'JetBrains Mono', monospace; font-size: 10px; background: rgba(123, 97, 255, 0.9); color: #fff; padding: 1px 5px; border-radius: 2px;">KEEP VIEWPORT</span>
        </div>
      </div>
    </div>

    <!-- Quick margin presets -->
    <div style="display: flex; gap: 0.5rem; margin-top: 0.75rem; align-items: center; flex-wrap: wrap;">
      <span class="mono-copy text-xs text-text-muted">Quick Trim Presets:</span>
      <button type="button" class="select-control" style="padding: 0.2rem 0.6rem; font-size: 0.75rem; cursor: pointer;" onclick="window.applyCropPreset(0, 0, 0, 0)">Zero Margins</button>
      <button type="button" class="select-control" style="padding: 0.2rem 0.6rem; font-size: 0.75rem; cursor: pointer;" onclick="window.applyCropPreset(10, 10, 10, 10)">10mm Trim</button>
      <button type="button" class="select-control" style="padding: 0.2rem 0.6rem; font-size: 0.75rem; cursor: pointer;" onclick="window.applyCropPreset(20, 20, 15, 15)">20mm Margins</button>
      <button type="button" class="select-control" style="padding: 0.2rem 0.6rem; font-size: 0.75rem; cursor: pointer;" onclick="window.applyCropPreset(25, 0, 0, 0)">Trim Header (25mm)</button>
    </div>
  `;
  container.appendChild(cropSection);

  try {
    const loadingTask = pdfjs.getDocument({ data: stagedFiles[0].bytes.slice(0) });
    cropPdfDoc = await loadingTask.promise;
    const page = await cropPdfDoc.getPage(1);
    const viewport = page.getViewport({ scale: 1.0 });
    cropPageViewport = viewport;
    cropPageOrigWidth = viewport.width;
    cropPageOrigHeight = viewport.height;

    const canvas = document.getElementById('crop-preview-canvas');
    if (!canvas) return;

    const maxH = 380;
    const renderScale = Math.min(2.0, maxH / viewport.height);
    const renderViewport = page.getViewport({ scale: renderScale });

    const dpr = window.devicePixelRatio || 1;
    canvas.width = renderViewport.width * dpr;
    canvas.height = renderViewport.height * dpr;
    canvas.style.width = `${renderViewport.width}px`;
    canvas.style.height = `${renderViewport.height}px`;

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    await page.render({
      canvasContext: ctx,
      viewport: renderViewport
    }).promise;

    const origBadge = document.getElementById('crop-dim-original');
    const origW_mm = Math.round(cropPageOrigWidth / 2.83465);
    const origH_mm = Math.round(cropPageOrigHeight / 2.83465);
    if (origBadge) {
      origBadge.textContent = `Original: ${Math.round(cropPageOrigWidth)} × ${Math.round(cropPageOrigHeight)} pt (${origW_mm} × ${origH_mm} mm)`;
    }

    attachCropInputsListeners();
    updateCropLivePreviewOverlay();
  } catch (err) {
    console.error('Error rendering page for crop preview:', err);
  }
}

function attachCropInputsListeners() {
  const ids = ['opt-crop-top', 'opt-crop-bottom', 'opt-crop-left', 'opt-crop-right', 'opt-crop-unit', 'opt-crop-mode', 'opt-resize-size'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.removeEventListener('input', updateCropLivePreviewOverlay);
      el.addEventListener('input', updateCropLivePreviewOverlay);
      el.removeEventListener('change', updateCropLivePreviewOverlay);
      el.addEventListener('change', updateCropLivePreviewOverlay);
    }
  });
}

export function updateCropLivePreviewOverlay() {
  const canvas = document.getElementById('crop-preview-canvas');
  if (!canvas || !cropPageViewport) return;

  const displayW = parseFloat(canvas.style.width) || canvas.width;
  const displayH = parseFloat(canvas.style.height) || canvas.height;
  const scale = displayW / cropPageOrigWidth;

  const modeEl = document.getElementById('opt-crop-mode');
  const mode = modeEl ? modeEl.value : 'trim';

  const shadeTop = document.getElementById('crop-overlay-shade-top');
  const shadeBottom = document.getElementById('crop-overlay-shade-bottom');
  const shadeLeft = document.getElementById('crop-overlay-shade-left');
  const shadeRight = document.getElementById('crop-overlay-shade-right');
  const viewportBox = document.getElementById('crop-overlay-viewport');
  const resultBadge = document.getElementById('crop-dim-result');

  if (mode === 'resize') {
    const resizeSizeEl = document.getElementById('opt-resize-size');
    const targetSizeKey = resizeSizeEl ? resizeSizeEl.value : 'A4';
    const SIZES = {
      'A4': [595.28, 841.89, 'A4 (210 × 297 mm)'],
      'LETTER': [612, 792, 'US Letter (8.5 × 11 in)'],
      'LEGAL': [612, 1008, 'US Legal (8.5 × 14 in)'],
      'A3': [841.89, 1190.55, 'A3 (297 × 420 mm)'],
      'A5': [419.53, 595.28, 'A5 (148 × 210 mm)'],
    };
    const [targetW, targetH, label] = SIZES[targetSizeKey] || SIZES['A4'];

    if (shadeTop) shadeTop.style.height = '0px';
    if (shadeBottom) shadeBottom.style.height = '0px';
    if (shadeLeft) shadeLeft.style.width = '0px';
    if (shadeRight) shadeRight.style.width = '0px';
    if (viewportBox) {
      viewportBox.style.top = '0px';
      viewportBox.style.left = '0px';
      viewportBox.style.width = '100%';
      viewportBox.style.height = '100%';
      const tag = viewportBox.querySelector('span');
      if (tag) tag.textContent = `TARGET: ${targetSizeKey}`;
    }
    if (resultBadge) {
      resultBadge.textContent = `Target: ${label}`;
    }
    return;
  }

  // Trim Margins Mode
  const unitEl = document.getElementById('opt-crop-unit');
  const unit = unitEl ? unitEl.value : 'mm';
  const unitRatio = unit === 'in' ? 72 : unit === 'pt' ? 1 : (72 / 25.4);

  const topVal = (parseFloat(document.getElementById('opt-crop-top')?.value) || 0) * unitRatio;
  const bottomVal = (parseFloat(document.getElementById('opt-crop-bottom')?.value) || 0) * unitRatio;
  const leftVal = (parseFloat(document.getElementById('opt-crop-left')?.value) || 0) * unitRatio;
  const rightVal = (parseFloat(document.getElementById('opt-crop-right')?.value) || 0) * unitRatio;

  const topPx = Math.min(displayH / 2, Math.max(0, topVal * scale));
  const bottomPx = Math.min(displayH / 2, Math.max(0, bottomVal * scale));
  const leftPx = Math.min(displayW / 2, Math.max(0, leftVal * scale));
  const rightPx = Math.min(displayW / 2, Math.max(0, rightVal * scale));

  if (shadeTop) shadeTop.style.height = `${topPx}px`;
  if (shadeBottom) shadeBottom.style.height = `${bottomPx}px`;
  if (shadeLeft) {
    shadeLeft.style.top = `${topPx}px`;
    shadeLeft.style.bottom = `${bottomPx}px`;
    shadeLeft.style.width = `${leftPx}px`;
  }
  if (shadeRight) {
    shadeRight.style.top = `${topPx}px`;
    shadeRight.style.bottom = `${bottomPx}px`;
    shadeRight.style.width = `${rightPx}px`;
  }

  if (viewportBox) {
    viewportBox.style.top = `${topPx}px`;
    viewportBox.style.left = `${leftPx}px`;
    viewportBox.style.width = `${Math.max(10, displayW - leftPx - rightPx)}px`;
    viewportBox.style.height = `${Math.max(10, displayH - topPx - bottomPx)}px`;
    const tag = viewportBox.querySelector('span');
    if (tag) tag.textContent = 'KEEP VIEWPORT';
  }

  const croppedW_pt = Math.max(10, Math.round(cropPageOrigWidth - leftVal - rightVal));
  const croppedH_pt = Math.max(10, Math.round(cropPageOrigHeight - topVal - bottomVal));
  const croppedW_mm = Math.round(croppedW_pt / 2.83465);
  const croppedH_mm = Math.round(croppedH_pt / 2.83465);

  if (resultBadge) {
    resultBadge.textContent = `Cropped: ${croppedW_pt} × ${croppedH_pt} pt (${croppedW_mm} × ${croppedH_mm} mm)`;
  }
}

export function applyCropPreset(top, bottom, left, right) {
  const topInput = document.getElementById('opt-crop-top');
  const bottomInput = document.getElementById('opt-crop-bottom');
  const leftInput = document.getElementById('opt-crop-left');
  const rightInput = document.getElementById('opt-crop-right');
  const unitSelect = document.getElementById('opt-crop-unit');
  const modeSelect = document.getElementById('opt-crop-mode');

  if (unitSelect) unitSelect.value = 'mm';
  if (modeSelect) {
    modeSelect.value = 'trim';
    toggleCropMode('trim');
  }

  if (topInput) topInput.value = top;
  if (bottomInput) bottomInput.value = bottom;
  if (leftInput) leftInput.value = left;
  if (rightInput) rightInput.value = right;

  updateCropLivePreviewOverlay();
}
window.applyCropPreset = applyCropPreset;
window.updateCropLivePreviewOverlay = updateCropLivePreviewOverlay;

export function toggleCropMode(mode) {
  const trimBox = document.getElementById('crop-trim-inputs');
  const resizeBox = document.getElementById('crop-resize-inputs');
  if (trimBox && resizeBox) {
    if (mode === 'resize') {
      trimBox.style.display = 'none';
      resizeBox.style.display = 'flex';
    } else {
      trimBox.style.display = 'flex';
      resizeBox.style.display = 'none';
    }
  }
  updateCropLivePreviewOverlay();
}
window.toggleCropMode = toggleCropMode;

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
window.setGstStudioView = setGstStudioView;
window.formatInrClient = formatInrClient;

// POS Studio Bindings
window.initPosStudio = initPosStudio;
window.updatePosReceiptPreview = updatePosReceiptPreview;
window.generatePosReceiptPdf = handleGeneratePosReceipt;
window.setPosStudioView = setPosStudioView;

// Tax Receipt Studio Bindings
window.initTaxReceiptStudio = initTaxReceiptStudio;
window.updateTaxReceiptPreview = updateTaxReceiptPreview;
window.generateTaxReceiptPdf = handleGenerateTaxReceipt;
window.setTaxReceiptStudioView = setTaxReceiptStudioView;

// Estimate Studio Bindings
window.initEstimateStudio = initEstimateStudio;
window.updateEstimatePreview = updateEstimatePreview;
window.generateEstimatePdf = handleGenerateEstimate;
window.setEstimateStudioView = setEstimateStudioView;

// AI Preview Binding
window.copyAiPreviewText = copyAiPreviewText;

// Visual PDF Editor Studio Bindings
window.initPdfEditorStudio = initPdfEditorStudio;
window.switchEditorPage = switchEditorPage;
window.prevEditorPage = prevEditorPage;
window.nextEditorPage = nextEditorPage;
window.renderEditorPage = renderEditorPage;
window.renderPageAnnotations = renderPageAnnotations;
window.handleOverlayCanvasMouseDown = handleOverlayCanvasMouseDown;
window.selectAnnotation = selectAnnotation;
window.deleteSelectedAnnotation = deleteSelectedAnnotation;
window.setEditorTool = setEditorTool;
window.insertStamp = insertStamp;
window.insertDateStamp = insertDateStamp;
window.insertSignatureStamp = insertSignatureStamp;
window.setEditorFontFamily = setEditorFontFamily;
window.setEditorFontSize = setEditorFontSize;
window.toggleEditorBold = toggleEditorBold;
window.toggleEditorItalic = toggleEditorItalic;
window.setEditorTextColor = setEditorTextColor;
window.setEditorTextBg = setEditorTextBg;
window.setEditorShapeType = setEditorShapeType;
window.setEditorStrokeColor = setEditorStrokeColor;
window.setEditorStrokeWidth = setEditorStrokeWidth;
window.zoomEditor = zoomEditor;
window.undoEditor = undoEditor;
window.redoEditor = redoEditor;
window.exportEditedPdf = exportEditedPdf;
window.setEditorWhiteoutColor = setEditorWhiteoutColor;
window.redactAndTypeOverSelected = redactAndTypeOverSelected;
window.handleEditorImageUpload = handleEditorImageUpload;
window.insertImageAnnotation = insertImageAnnotation;
window.setupEditorKeyboardAndPaste = setupEditorKeyboardAndPaste;

function resolveToolKey(path) {
  // Normalize underscores to hyphens (e.g. /draw_signature → draw-signature)
  const raw = (path || '').replace(/^\//, '').replace(/_/g, '-') || 'merge-pdf';
  return CLIENT_ROUTE_ALIASES[raw] || raw;
}

// ── Lifecycle Initialization ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  renderToolTabs();
  setupEventListeners();
  initFaqAccordion();

  // Set active tab on tool load based on URL path
  const resolved = resolveToolKey(window.location.pathname);
  if (TOOL_DEFINITIONS[resolved]) {
    switchTool(resolved, false);
  } else {
    switchTool('merge-pdf', false);
  }

  // Handle browser Back / Forward Navigation
  window.addEventListener('popstate', () => {
    const slug = resolveToolKey(window.location.pathname);
    if (TOOL_DEFINITIONS[slug]) {
      switchTool(slug, false);
    }
  });
});

