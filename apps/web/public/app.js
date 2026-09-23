/**
 * DocPlatform Interactive Client Application Orchestrator
 *
 * Modular Architecture:
 * - modules/tool-registry.js    : Tool definitions, icons, metadata, and FAQ registries
 * - modules/utils.js            : Binary encodings, type detection, formatting & sanitizers
 * - modules/file-staging.js     : File ingestion, validation, drag-reorder & per-page rotation
 * - modules/options-collector.js: DOM options gathering for document execution
 * - modules/crop-preview.js     : Live interactive crop & margins preview canvas
 * - modules/window-bindings.js  : Global window bindings for inline HTML templates
 * - modules/signature-studio.js : Pen drawing canvas, modal, optimizer & photo upload (<30KB)
 * - modules/gst-studio.js       : Split-screen GST invoice generator, tax engine, UPI QR & live preview
 * - modules/pos-studio.js       : Thermal slip POS receipt studio
 * - modules/tax-receipt-studio.js: Section 80G compliant donation tax receipt studio
 * - modules/estimate-studio.js  : Quotation & work estimate studio
 * - modules/p2p-client.js       : Zero-login WebRTC direct P2P file & code sharing engine
 * - modules/direct-ai.js        : Browser-to-Gemini zero-server-trust execution
 * - modules/local-engine.js     : Pure client-side PDFLib / PDF.js vector manipulations
 * - modules/progress-tracker.js : Multi-phase animated progress, job polling & result cards
 * - modules/pdf-editor-studio.js: Interactive in-browser PDF annotation & editing studio
 */

import { TOOL_DEFINITIONS, TOOL_DETAILS_DATA, getClientToolContract } from './modules/tool-registry.js';
import { arrayBufferToBase64 } from './modules/utils.js';
import {
  getStagedFiles,
  getActiveTool,
  setActiveTool,
  getPerPageRotations,
  clearStagingState,
  handleFilesSelected,
  renderFileList
} from './modules/file-staging.js';
import { collectActiveToolOptions } from './modules/options-collector.js';
import { initWindowBindings } from './modules/window-bindings.js';
import { initP2pStudio } from './modules/p2p-client.js?v=4.0';
import {
  initGstInvoiceStudio,
  setGstStudioView,
  generateAndDownloadGstInvoicePdf
} from './modules/gst-studio.js?v=3.2';
import {
  initPosStudio,
  setPosStudioView,
  generatePosReceiptPdf
} from './modules/pos-studio.js?v=3.5';
import {
  initTaxReceiptStudio,
  setTaxReceiptStudioView,
  generateTaxReceiptPdf
} from './modules/tax-receipt-studio.js?v=3.5';
import {
  initEstimateStudio,
  setEstimateStudioView,
  generateEstimatePdf
} from './modules/estimate-studio.js?v=3.5';
import { switchSignatureTab } from './modules/signature-studio.js';
import { initPdfEditorStudio } from './modules/pdf-editor-studio.js';
import {
  getStoredGeminiKey,
  hasValidGeminiKey,
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
let currentJobId = null;

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
  'pdf-editor-studio',
  'p2p-share-studio'
];

export const STUDIO_INITIALIZERS = {
  'p2p-share-studio': () => {
    initP2pStudio();
  },
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
    const files = getStagedFiles();
    if (files.length > 0 && files[0].bytes) {
      if (uploadGate) uploadGate.style.display = 'none';
      if (workspace) workspace.style.display = 'block';
      initPdfEditorStudio(files[0].bytes);
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
    window.location.href = '/' + originalKey;
    return;
  }
  toolKey = resolved;
  setActiveTool(toolKey);
  clearStagingState();

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
  const headerInner = document.getElementById('site-header-inner');
  if (headerInner) {
    headerInner.style.maxWidth = contract.wideCanvas ? '80rem' : '64rem';
  }
  const blueprintContainer = document.getElementById('main-blueprint-container');
  if (blueprintContainer) {
    blueprintContainer.classList.toggle('max-w-7xl', Boolean(contract.wideCanvas));
    blueprintContainer.classList.toggle('max-w-5xl', !contract.wideCanvas);
  }
  const workspaceCard = document.querySelector('.workspace-card');
  if (workspaceCard) {
    workspaceCard.classList.toggle('w-full', Boolean(contract.wideCanvas));
    workspaceCard.classList.toggle('max-w-4xl', !contract.wideCanvas);
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
  clearStagingState();
  if (typeof window.dismissSupportToast === 'function') window.dismissSupportToast();

  const resultCard = document.getElementById('result-card');
  if (resultCard) resultCard.style.display = 'none';

  const progressContainer = document.getElementById('progress-container');
  if (progressContainer) progressContainer.style.display = 'none';

  const stagingArea = document.getElementById('staging-area');
  if (stagingArea) stagingArea.style.display = 'none';

  hideAllStudiosAndDropzone();

  const activeTool = getActiveTool();
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

export async function executeDocumentOperation() {
  const activeTool = getActiveTool();
  const contract = getClientToolContract(activeTool);
  if (!contract.requiresInputFile) {
    return;
  }
  const stagedFiles = getStagedFiles();
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
        perPageRotations: getPerPageRotations(),
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

    const options = collectActiveToolOptions(activeTool);
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
  const stagedFiles = getStagedFiles();
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
  const stagedFiles = getStagedFiles();
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
  const stagedFiles = getStagedFiles();
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
  const stagedFiles = getStagedFiles();
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

function resolveToolKey(path) {
  const raw = (path || '').replace(/^\//, '').replace(/_/g, '-') || 'merge-pdf';
  return CLIENT_ROUTE_ALIASES[raw] || raw;
}

// ── Initialize Global Window Bindings ───────────────────────────────────────
initWindowBindings({
  switchTool,
  resetWorkspace,
  filterCategory,
  setBillingCycle,
  executeDocumentOperation,
  generateAndDownloadGstInvoicePdf: handleGenerateGstInvoice,
  generatePosReceiptPdf: handleGeneratePosReceipt,
  generateTaxReceiptPdf: handleGenerateTaxReceipt,
  generateEstimatePdf: handleGenerateEstimate
});

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
