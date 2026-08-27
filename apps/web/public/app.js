/**
 * DocPlatform Interactive Client Application Engine
 *
 * Core Capabilities:
 * - Local-First in-browser WASM processing (Zero cloud data upload, complete privacy)
 * - Distributed Worker asynchronous job submission & live SSE/Polling visualizer
 * - Client-side magic byte inspection (PDF, PNG, JPEG, WEBP, OpenXML DOCX/XLSX, OLE2)
 * - Complete 20+ tool registry with custom visual option controls
 */

let stagedFiles = [];
let activeTool = 'merge-pdf';
let currentJobId = null;
let pollInterval = null;

const TOOL_DEFINITIONS = {
  // ── Core PDF Tools ──────────────────────────────────────────────────────────
  'merge-pdf': {
    category: 'core',
    title: 'Merge PDF Online',
    badge: '100% Private Local Processing',
    subtitle: 'Combine multiple PDF files into one clean, high-resolution document in seconds.',
    actionName: 'Merge PDF Files',
    multiple: true,
    accept: '.pdf,application/pdf',
    optionsHtml: `
      <label style="font-size: 0.85rem; color: var(--text-secondary); display: flex; align-items: center; gap: 0.5rem;">
        <input type="checkbox" id="opt-normalize" checked> Normalize Page Dimensions
      </label>
    `
  },
  'split-pdf': {
    category: 'core',
    title: 'Split PDF Online',
    badge: 'Extract & Separate Pages',
    subtitle: 'Separate PDF pages into standalone documents or extract custom page ranges.',
    actionName: 'Split PDF Document',
    multiple: false,
    accept: '.pdf,application/pdf',
    optionsHtml: `
      <select id="opt-split-mode" class="select-control">
        <option value="all-pages">Split Every Page</option>
        <option value="ranges">Custom Page Ranges (e.g. 1-2, 3)</option>
      </select>
      <input type="text" id="opt-split-ranges" placeholder="e.g. 1-3, 4" class="select-control" style="display:none; width: 140px;" />
    `
  },
  'compress-pdf': {
    category: 'core',
    title: 'Compress PDF Online',
    badge: 'Shrink File Size Without Quality Loss',
    subtitle: 'Reduce document size while maintaining crisp vector fonts and clear imagery.',
    actionName: 'Compress PDF Now',
    multiple: false,
    accept: '.pdf,application/pdf',
    optionsHtml: `
      <select id="opt-compress-level" class="select-control">
        <option value="recommended">Recommended Compression (Good quality, small size)</option>
        <option value="extreme">Extreme Compression (Smallest size, email ready)</option>
        <option value="low">Low Compression (Maximum quality preservation)</option>
      </select>
    `
  },
  'rotate-pdf': {
    category: 'core',
    title: 'Rotate PDF Online',
    badge: 'Permanent Orientation Fix',
    subtitle: 'Rotate individual pages or entire documents 90°, 180°, or 270° clockwise.',
    actionName: 'Rotate PDF Document',
    multiple: false,
    accept: '.pdf,application/pdf',
    optionsHtml: `
      <select id="opt-rotate-angle" class="select-control">
        <option value="90">Rotate 90° Clockwise</option>
        <option value="180">Rotate 180° Upside Down</option>
        <option value="270">Rotate 270° (90° Counter-Clockwise)</option>
      </select>
      <select id="opt-rotate-pages" class="select-control">
        <option value="all">All Pages</option>
        <option value="custom">Specific Pages (e.g. 1, 3-5)</option>
        <option value="odd">Odd Pages Only</option>
        <option value="even">Even Pages Only</option>
      </select>
      <input type="text" id="opt-rotate-custom-pages" placeholder="e.g. 1, 3-5" class="select-control" style="display:none; width: 140px;" />
    `
  },
  'delete-pdf-pages': {
    category: 'core',
    title: 'Delete PDF Pages',
    badge: 'Trim Unwanted Content',
    subtitle: 'Remove unwanted pages and download a clean, streamlined PDF.',
    actionName: 'Delete Pages & Export',
    multiple: false,
    accept: '.pdf,application/pdf',
    optionsHtml: `
      <input type="text" id="opt-delete-pages" placeholder="Pages to delete (e.g. 2, 4-6)" class="select-control" style="width: 240px;" />
    `
  },
  'extract-pages': {
    category: 'core',
    title: 'Extract PDF Pages',
    badge: 'Select & Save Specific Pages',
    subtitle: 'Extract specific pages or page ranges from your PDF into a clean, unified document.',
    actionName: 'Extract Pages & Save',
    multiple: false,
    accept: '.pdf,application/pdf',
    optionsHtml: `
      <input type="text" id="opt-extract-pages" placeholder="Pages to extract (e.g. 1-3, 5)" class="select-control" style="width: 240px;" />
    `
  },
  'jpg-to-pdf': {
    category: 'core',
    title: 'JPG / PNG / WebP to PDF Converter',
    badge: 'Compile Images to PDF',
    subtitle: 'Convert images (JPG, PNG, WebP) into a high-resolution, organized PDF document.',
    actionName: 'Convert Images to PDF',
    multiple: true,
    accept: 'image/png,image/jpeg,image/webp,image/*,.png,.jpg,.jpeg,.webp',
    optionsHtml: `
      <select id="opt-image-pagesize" class="select-control">
        <option value="A4">A4 Standard</option>
        <option value="FIT_IMAGE">Fit to Image Size</option>
        <option value="LETTER">US Letter</option>
      </select>
      <select id="opt-image-orientation" class="select-control">
        <option value="auto">Auto Orientation</option>
        <option value="portrait">Portrait</option>
        <option value="landscape">Landscape</option>
      </select>
    `
  },
  'pdf-to-jpg': {
    category: 'core',
    title: 'PDF to JPG / PNG / WebP Converter',
    badge: 'High-Resolution Image Extraction',
    subtitle: 'Extract all pages from your PDF as crisp high-resolution PNG, JPEG, or WebP images.',
    actionName: 'Convert PDF to Images',
    multiple: false,
    accept: '.pdf,application/pdf',
    optionsHtml: `
      <select id="opt-img-format" class="select-control">
        <option value="png">PNG (Lossless Vector Quality)</option>
        <option value="jpeg">JPEG (Compressed Web Photos)</option>
        <option value="webp">WebP (Compact Modern Web)</option>
      </select>
      <select id="opt-img-dpi" class="select-control">
        <option value="150">150 DPI (Standard Quality)</option>
        <option value="300">300 DPI (High-Resolution Print)</option>
        <option value="72">72 DPI (Web / Screen Preview)</option>
        <option value="600">600 DPI (Ultra HD Print)</option>
      </select>
    `
  },

  // ── Office Conversions ──────────────────────────────────────────────────────
  'word-to-pdf': {
    category: 'convert',
    title: 'Word to PDF Converter',
    badge: '100% Vector Layout Fidelity',
    subtitle: 'Convert Word documents (DOCX, DOC, RTF) to PDF with Hindi ligatures & Urdu RTL support.',
    actionName: 'Convert Word to PDF',
    multiple: false,
    accept: '.docx,.doc,.rtf,.odt,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword',
    optionsHtml: `
      <select id="opt-word-orientation" class="select-control">
        <option value="auto">Respect Document Layout</option>
        <option value="portrait">Force Portrait</option>
        <option value="landscape">Force Landscape</option>
      </select>
    `
  },
  'excel-to-pdf': {
    category: 'convert',
    title: 'Excel to PDF Converter',
    badge: 'Table & Currency Formatting Preserved',
    subtitle: 'Convert spreadsheets (XLSX, XLS, CSV) into clean PDF tables with automatic column fitting.',
    actionName: 'Convert Excel to PDF',
    multiple: false,
    accept: '.xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel',
    optionsHtml: `
      <label style="font-size: 0.85rem; color: var(--text-secondary); display: flex; align-items: center; gap: 0.5rem;">
        <input type="checkbox" id="opt-excel-fit" checked> Fit Columns to Page Width
      </label>
      <label style="font-size: 0.85rem; color: var(--text-secondary); display: flex; align-items: center; gap: 0.5rem; margin-left: 1rem;">
        <input type="checkbox" id="opt-excel-grid" checked> Render Gridlines
      </label>
    `
  },
  'pdf-to-word': {
    category: 'convert',
    title: 'PDF to Word Converter',
    badge: 'Editable DOCX Reconstruction',
    subtitle: 'Convert PDF documents into editable Microsoft Word (.docx) files with flowing text.',
    actionName: 'Convert PDF to Word',
    multiple: false,
    accept: '.pdf,application/pdf',
    optionsHtml: `
      <select id="opt-pdf2word-layout" class="select-control">
        <option value="flowing">Flowing Text (Easily Editable)</option>
        <option value="exact">Exact Visual Layout (Fixed Frames)</option>
      </select>
    `
  },
  'pdf-to-excel': {
    category: 'convert',
    title: 'PDF to Excel Converter',
    badge: 'Automated Tabular Data Extraction',
    subtitle: 'Extract tabular statements, invoices, and records from PDF into clean Excel spreadsheets.',
    actionName: 'Extract to Excel (.xlsx)',
    multiple: false,
    accept: '.pdf,application/pdf',
    optionsHtml: `
      <label style="font-size: 0.85rem; color: var(--text-secondary); display: flex; align-items: center; gap: 0.5rem;">
        <input type="checkbox" id="opt-excel-tabs" checked> Separate Sheet Tab per Page
      </label>
    `
  },

  // ── Security & Advanced Tools ───────────────────────────────────────────────
  'watermark-pdf': {
    category: 'security',
    title: 'Watermark PDF Online',
    badge: 'Custom Text & Stamp Positioning',
    subtitle: 'Add custom security stamps or watermarks to your PDF pages with adjustable opacity.',
    actionName: 'Apply Watermark',
    multiple: false,
    accept: '.pdf,application/pdf',
    optionsHtml: `
      <input type="text" id="opt-watermark-text" placeholder="Watermark Text (e.g. CONFIDENTIAL)" value="CONFIDENTIAL" class="select-control" style="width: 200px;" />
      <select id="opt-watermark-opacity" class="select-control">
        <option value="0.3">30% Opacity (Subtle)</option>
        <option value="0.5">50% Opacity (Standard)</option>
        <option value="0.8">80% Opacity (Prominent)</option>
      </select>
    `
  },
  'protect-pdf': {
    category: 'security',
    title: 'Protect PDF with Password',
    badge: 'AES Password Encryption',
    subtitle: 'Encrypt your PDF documents with secure password protection and permission restrictions.',
    actionName: 'Encrypt & Protect PDF',
    multiple: false,
    accept: '.pdf,application/pdf',
    optionsHtml: `
      <input type="password" id="opt-protect-pass" placeholder="Enter Secure Password" class="select-control" style="width: 220px;" />
    `
  },
  'unlock-pdf': {
    category: 'security',
    title: 'Unlock PDF Online',
    badge: 'Remove Restrictions',
    subtitle: 'Remove password protection from your authorized PDF files for unrestricted access.',
    actionName: 'Unlock PDF Document',
    multiple: false,
    accept: '.pdf,application/pdf',
    optionsHtml: `
      <input type="password" id="opt-unlock-pass" placeholder="Enter Current Password" class="select-control" style="width: 220px;" />
    `
  },
  'redact-pdf': {
    category: 'security',
    title: 'Redact PDF Online',
    badge: 'Zero-Leak Permanent Blackout',
    subtitle: 'Permanently remove and black out sensitive data, PII, and financial records with zero data leak.',
    actionName: 'Permanently Redact PDF',
    multiple: false,
    accept: '.pdf,application/pdf',
    optionsHtml: `
      <input type="text" id="opt-redact-label" placeholder="Replacement Label (e.g. [REDACTED])" value="[REDACTED]" class="select-control" style="width: 220px;" />
      <label style="font-size: 0.85rem; color: var(--text-secondary); display: flex; align-items: center; gap: 0.5rem; margin-top: 0.5rem;">
        <input type="checkbox" id="opt-redact-meta" checked> Sanitize Search Metadata & XMP
      </label>
    `
  },

  // ── AI & Document Intelligence ──────────────────────────────────────────────
  'ocr-pdf': {
    category: 'ai',
    title: 'OCR Scanned PDF to Searchable Document',
    badge: 'Multilingual Optical Character Recognition',
    subtitle: 'Convert scanned PDF documents and camera images into searchable text-selectable PDFs.',
    actionName: 'Run Optical Character Recognition',
    multiple: false,
    accept: '.pdf,image/png,image/jpeg,.png,.jpg',
    optionsHtml: `
      <select id="opt-ocr-lang" class="select-control">
        <option value="eng">English (eng)</option>
        <option value="hin">Hindi (hin - Devanagari)</option>
        <option value="spa">Spanish (spa)</option>
        <option value="fra">French (fra)</option>
        <option value="deu">German (deu)</option>
        <option value="ara">Arabic (ara)</option>
      </select>
      <select id="opt-ocr-out" class="select-control">
        <option value="searchable-pdf">Searchable Sandwich PDF</option>
        <option value="text">Plain Text (.txt)</option>
        <option value="json">Structured JSON (hOCR)</option>
      </select>
    `
  },
  'compare-pdf': {
    category: 'ai',
    title: 'Compare 2 PDF Documents',
    badge: 'Visual Diff & Change Highlights',
    subtitle: 'Compare two PDF versions to highlight additions (cyan) and removals (crimson) automatically.',
    actionName: 'Generate Comparison Report',
    multiple: true,
    accept: '.pdf,application/pdf',
    optionsHtml: `
      <select id="opt-compare-mode" class="select-control">
        <option value="visual-diff">Visual Diff Overlay (Colored Highlights)</option>
        <option value="side-by-side">Side-by-Side Dual-Pane Canvas</option>
      </select>
    `
  },
  'ai-summarize': {
    category: 'ai',
    title: 'AI Document Summarizer',
    badge: 'Hierarchical Map-Reduce (100+ Pages)',
    subtitle: 'Summarize extensive contracts, filings, and books into structured executive takeaways.',
    actionName: 'Generate AI Executive Summary',
    multiple: false,
    accept: '.pdf,application/pdf',
    optionsHtml: `
      <select id="opt-sum-mode" class="select-control">
        <option value="executive">Executive Summary (Key Takeaways & Metrics)</option>
        <option value="brief">Brief (1 Concise Paragraph)</option>
        <option value="deep">Deep Dive (Detailed Section Analysis)</option>
      </select>
      <select id="opt-sum-focus" class="select-control">
        <option value="all">Comprehensive Analysis</option>
        <option value="financials">Financial & Numerical Focus</option>
        <option value="legal-obligations">Legal Obligations & Risks</option>
      </select>
    `
  },
  'ai-ask': {
    category: 'ai',
    title: 'AI Document Q&A (Chat with PDF)',
    badge: 'Grounded Citations (Zero Hallucinations)',
    subtitle: 'Ask any question to your document and receive verifiable answers with exact [Page X] citations.',
    actionName: 'Ask Document Intelligence',
    multiple: false,
    accept: '.pdf,application/pdf',
    optionsHtml: `
      <input type="text" id="opt-ask-query" placeholder="Ask a question (e.g. What are the payment deadlines?)" class="select-control" style="width: 320px;" />
    `
  },
  'ai-extract-table': {
    category: 'ai',
    title: 'AI Table & Financial Record Extractor',
    badge: 'Structured Data Extraction',
    subtitle: 'Extract financial statements, invoices, and data tables from PDFs into clean CSV, JSON, or Markdown tables.',
    actionName: 'Extract Structured Tables',
    multiple: false,
    accept: '.pdf,application/pdf',
    optionsHtml: `
      <select id="opt-table-format" class="select-control">
        <option value="csv" selected>Standard CSV Spreadsheet (.csv)</option>
        <option value="json">Structured JSON Records (.json)</option>
        <option value="markdown">Markdown Table (.md)</option>
      </select>
    `
  }
};

// ── DOM Initialization ────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  renderToolTabs();
  
  // Read tool from URL path if present e.g. /word-to-pdf
  const pathSlug = window.location.pathname.replace(/^\//, '');
  if (TOOL_DEFINITIONS[pathSlug]) {
    switchTool(pathSlug);
  } else {
    switchTool('merge-pdf');
  }
});

const TOOL_ICONS = {
  'merge-pdf': '📑',
  'split-pdf': '✂️',
  'compress-pdf': '⚡',
  'rotate-pdf': '🔄',
  'delete-pdf-pages': '🗑️',
  'extract-pages': '📑',
  'jpg-to-pdf': '🖼️',
  'pdf-to-jpg': '📷',
  'word-to-pdf': '📄',
  'excel-to-pdf': '📊',
  'pdf-to-word': '📝',
  'pdf-to-excel': '📈',
  'watermark-pdf': '💧',
  'protect-pdf': '🔒',
  'unlock-pdf': '🔓',
  'redact-pdf': '🛡️',
  'ocr-pdf': '👁️',
  'compare-pdf': '⚖️',
  'ai-summarize': '💡',
  'ai-ask': '🤖',
  'ai-extract-table': '📋',
  'pipeline': '⚡'
};

function renderToolTabs() {
  const container = document.querySelector('.tool-tabs');
  if (!container) return;

  const categories = [
    { key: 'all', label: 'All Tools' },
    { key: 'core', label: 'Core PDF' },
    { key: 'convert', label: 'Convert' },
    { key: 'security', label: 'Security & Sign' },
    { key: 'ai', label: 'AI & OCR' },
  ];

  let html = `<div class="category-pills-container">`;
  categories.forEach(cat => {
    html += `<button class="category-pill-btn ${cat.key === 'all' ? 'active' : ''}" onclick="filterCategory('${cat.key}')" data-cat="${cat.key}">${cat.label}</button>`;
  });
  html += `</div><div class="tool-tabs-scroll">`;

  for (const [key, tool] of Object.entries(TOOL_DEFINITIONS)) {
    const label = tool.title.replace(' Online', '').replace(' Converter', '').replace(' Documents', '');
    html += `<button class="tool-tab-btn" data-tool="${key}" data-cat="${tool.category}" onclick="switchTool('${key}')"><span>${label}</span></button>`;
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

window.setBillingCycle = function(cycle) {
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
};

window.filterCategory = function(catKey) {
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
};

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

let perPageRotations = {};

function parsePageRanges(rangeStr, totalPages) {
  const pages = new Set();
  const parts = (rangeStr || '').split(/[,;\s]+/).filter(Boolean);
  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-');
      const start = Math.max(1, parseInt(startStr, 10) || 1);
      const end = Math.min(totalPages, parseInt(endStr, 10) || totalPages);
      for (let p = start; p <= end; p++) pages.add(p);
    } else {
      const p = parseInt(part, 10);
      if (p >= 1 && p <= totalPages) pages.add(p);
    }
  }
  return Array.from(pages).sort((a, b) => a - b);
}

window.switchTool = function(toolKey) {
  if (!TOOL_DEFINITIONS[toolKey]) return;
  activeTool = toolKey;
  stagedFiles = [];
  perPageRotations = {};

  document.querySelectorAll('.tool-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tool === toolKey);
  });

  const config = TOOL_DEFINITIONS[toolKey];
  document.getElementById('hero-badge-text').textContent = config.badge;
  document.getElementById('hero-title').textContent = config.title;
  document.getElementById('hero-subtitle').textContent = config.subtitle;
  document.getElementById('process-btn-text').textContent = config.actionName;

  const fileInput = document.getElementById('file-input');
  fileInput.accept = config.accept;
  fileInput.multiple = config.multiple;

  // Dynamic Dropzone Labels based on Tool Category
  const dropTitle = document.getElementById('dropzone-title');
  const dropDesc = document.getElementById('dropzone-desc');
  const dropBtn = document.getElementById('dropzone-btn-text');

  if (activeTool === 'jpg-to-pdf') {
    if (dropTitle) dropTitle.textContent = 'Select Image files (JPG, PNG, WebP)';
    if (dropDesc) dropDesc.textContent = 'or drop JPG, PNG, or WebP images here. Instant client-side PDF creation.';
    if (dropBtn) dropBtn.textContent = 'Select Images';
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
  optionsContainer.innerHTML = config.optionsHtml;

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
};

window.resetWorkspace = function resetWorkspace() {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
  stagedFiles = [];
  perPageRotations = {};
  document.getElementById('dropzone').style.display = 'block';
  document.getElementById('staging-area').style.display = 'none';
  document.getElementById('progress-container').style.display = 'none';
  document.getElementById('result-card').style.display = 'none';
  const fileInput = document.getElementById('file-input');
  if (fileInput) fileInput.value = '';
  const addMoreInput = document.getElementById('add-more-input');
  if (addMoreInput) addMoreInput.value = '';
  renderFileList();
};

function detectFileType(file, bytes) {
  if (!bytes || bytes.length < 4) return 'unknown';

  // 1. PDF Signature: %PDF
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
    return 'pdf';
  }

  // 2. PNG Signature: \x89PNG
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return 'png';
  }
  if (bytes[0] === 0x89 && bytes[1] === 0x50) {
    return 'png';
  }

  // 3. JPEG Signature: \xFF\xD8
  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    return 'jpeg';
  }

  // 4. WebP Signature: RIFF....WEBP
  if (bytes.length >= 12 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
      bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
    return 'webp';
  }
  if (bytes.length >= 4 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
    return 'webp';
  }

  // 5. OpenXML Office (DOCX, XLSX, PPTX): PK\x03\x04
  if (bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04) {
    return 'docx';
  }

  // 6. Legacy Office OLE2: \xD0\xCF\x11\xE0
  if (bytes[0] === 0xd0 && bytes[1] === 0xcf && bytes[2] === 0x11 && bytes[3] === 0xe0) {
    return 'office-legacy';
  }

  // 7. Fallback to MIME and extension
  const ext = (file.name || '').split('.').pop().toLowerCase();
  if (['png', 'jpg', 'jpeg', 'webp', 'bmp', 'gif', 'svg'].includes(ext) || (file.type && file.type.startsWith('image/'))) {
    return ext === 'png' ? 'png' : (ext === 'webp' ? 'webp' : 'jpeg');
  }
  if (ext === 'pdf' || file.type === 'application/pdf') {
    return 'pdf';
  }
  if (['docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt', 'rtf', 'odt'].includes(ext)) {
    return 'docx';
  }

  return 'unknown';
}

async function handleFilesSelected(files, isAppend = false) {
  const validFiles = [];

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const detected = detectFileType(file, bytes);

    let isValid = false;
    if (activeTool === 'jpg-to-pdf') {
      isValid = ['png', 'jpeg', 'webp'].includes(detected);
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
        detectedFormat: detected
      });
    } else {
      alert(`File "${file.name}" was rejected. Please select a valid ${activeTool === 'jpg-to-pdf' ? 'Image (JPG, PNG, WebP)' : 'PDF document'}.`);
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
      <button class="file-card-remove" onclick="removeStagedFile(${index})">✕</button>
    `;
    container.appendChild(card);
  });

  // If Rotate PDF tool is active, render interactive visual page rotation grid
  if (activeTool === 'rotate-pdf' && stagedFiles.length === 1 && typeof PDFLib !== 'undefined') {
    try {
      const doc = await PDFLib.PDFDocument.load(stagedFiles[0].bytes.slice(0));
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
              <button type="button" class="select-control" style="padding: 0.3rem 0.75rem; font-size: 0.8rem; cursor: pointer;" onclick="rotateAllVisualPages(90)">🔄 Rotate All +90°</button>
              <button type="button" class="select-control" style="padding: 0.3rem 0.75rem; font-size: 0.8rem; cursor: pointer;" onclick="resetAllVisualRotations()">↺ Reset</button>
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
            <button type="button" class="select-control" style="width: 100%; padding: 0.35rem 0.4rem; font-size: 0.78rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.25rem;" onclick="rotateSingleVisualPage(${i}, 90)">
              🔄 Rotate 90°
            </button>
          </div>
        `;
      }
      pagesHtml += `</div></div>`;
      rotateContainer.innerHTML = pagesHtml;
      container.appendChild(rotateContainer);
    } catch {
      // Best-effort preview
    }
  }

  const addMoreBtn = document.getElementById('add-more-btn');
  if (addMoreBtn) {
    addMoreBtn.style.display = TOOL_DEFINITIONS[activeTool].multiple ? 'inline-flex' : 'none';
  }
}

window.rotateSingleVisualPage = function(pageIndex, deg = 90) {
  perPageRotations[pageIndex] = ((perPageRotations[pageIndex] || 0) + deg) % 360;
  const newRot = perPageRotations[pageIndex];
  const box = document.getElementById(`page-preview-box-${pageIndex}`);
  const angleBadge = document.getElementById(`page-angle-${pageIndex}`);
  if (box) box.style.transform = `rotate(${newRot}deg)`;
  if (angleBadge) angleBadge.textContent = `${newRot}°`;
};

window.rotateAllVisualPages = function(deg = 90) {
  const cards = document.querySelectorAll('[id^="page-preview-box-"]');
  cards.forEach((_, i) => {
    window.rotateSingleVisualPage(i, deg);
  });
};

window.resetAllVisualRotations = function() {
  perPageRotations = {};
  renderFileList();
};

window.removeStagedFile = function(index) {
  stagedFiles.splice(index, 1);
  perPageRotations = {};
  if (stagedFiles.length === 0) {
    resetWorkspace();
  } else {
    renderFileList();
  }
};

function getBaseName(filename) {
  if (!filename) return 'document';
  return filename.replace(/\.[^/.]+$/, '');
}

function getDerivedOutputFilename(actionSuffix = 'processed', ext = 'pdf') {
  if (!stagedFiles || stagedFiles.length === 0) return `document_${actionSuffix}.${ext}`;
  const base = getBaseName(stagedFiles[0].name);
  return `${base}_${actionSuffix}.${ext}`;
}

// ── Execution Router ──────────────────────────────────────────────────────────

async function executeDocumentOperation() {
  if (stagedFiles.length === 0) return;

  document.getElementById('dropzone').style.display = 'none';
  document.getElementById('staging-area').style.display = 'none';
  document.getElementById('result-card').style.display = 'none';
  document.getElementById('progress-container').style.display = 'block';

  updateProgress(15, 'Preparing document canvas...');

  try {
    // ── Check BYOK Key for AI LLM Tools (Ask PDF & Summarizer) ─────────────
    if (activeTool === 'ai-ask' || activeTool === 'ai-summarize') {
      const userApiKey = (typeof getStoredGeminiKey === 'function') ? getStoredGeminiKey() : localStorage.getItem('dp_user_gemini_key');
      if (!userApiKey || userApiKey.length < 5) {
        document.getElementById('progress-container').style.display = 'none';
        document.getElementById('staging-area').style.display = 'block';
        if (typeof openApiKeyModal === 'function') {
          openApiKeyModal();
        } else {
          alert('Please enter your free Google Gemini API Key to run AI Q&A / Summarizer.');
        }
        return;
      }
    }

    // ── Route 1: Local In-Browser Processing (Zero-Latency, Zero-Cloud) ─────
    if (typeof PDFLib !== 'undefined') {
      // 1. Merge PDF
      if (activeTool === 'merge-pdf') {
        updateProgress(40, 'Merging documents locally in your browser...');
        const mergedPdf = await PDFLib.PDFDocument.create();

        for (const file of stagedFiles) {
          const doc = await PDFLib.PDFDocument.load(file.bytes);
          const copiedPages = await mergedPdf.copyPages(doc, doc.getPageIndices());
          copiedPages.forEach(p => mergedPdf.addPage(p));
        }

        updateProgress(90, 'Finalizing merged vector output...');
        const pdfBytes = await mergedPdf.save({ useObjectStreams: true });
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const outName = getDerivedOutputFilename('merged', 'pdf');
        renderSuccessDownload(URL.createObjectURL(blob), outName);
        return;
      }

      // 2. Rotate PDF
      if (activeTool === 'rotate-pdf' && stagedFiles.length === 1) {
        updateProgress(40, 'Rotating PDF pages locally in browser...');
        const doc = await PDFLib.PDFDocument.load(stagedFiles[0].bytes);
        const baseAngle = parseInt(document.getElementById('opt-rotate-angle')?.value || '90', 10);
        const targetPagesOpt = document.getElementById('opt-rotate-pages')?.value || 'all';
        const customInput = document.getElementById('opt-rotate-custom-pages')?.value || '';
        const pages = doc.getPages();
        const totalPages = pages.length;
        const customPages = new Set(parsePageRanges(customInput, totalPages));

        const hasManualClicks = Object.keys(perPageRotations).some(k => (perPageRotations[k] || 0) > 0);

        for (let i = 0; i < totalPages; i++) {
          const pageNum = i + 1;
          let addedAngle = 0;

          if (hasManualClicks) {
            addedAngle = perPageRotations[i] || 0;
          } else {
            let shouldRotate = false;
            if (targetPagesOpt === 'all') shouldRotate = true;
            else if (targetPagesOpt === 'odd' && pageNum % 2 !== 0) shouldRotate = true;
            else if (targetPagesOpt === 'even' && pageNum % 2 === 0) shouldRotate = true;
            else if (targetPagesOpt === 'custom' && customPages.has(pageNum)) shouldRotate = true;

            if (shouldRotate) addedAngle = baseAngle;
          }

          if (addedAngle > 0) {
            const page = pages[i];
            const currentRotation = page.getRotation().angle;
            page.setRotation(PDFLib.degrees((currentRotation + addedAngle) % 360));
          }
        }

        updateProgress(90, 'Saving rotated document...');
        const pdfBytes = await doc.save({ useObjectStreams: true });
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        renderSuccessDownload(URL.createObjectURL(blob), getDerivedOutputFilename('rotated', 'pdf'));
        return;
      }

      // 3. Delete PDF Pages
      if (activeTool === 'delete-pdf-pages' && stagedFiles.length === 1) {
        updateProgress(40, 'Removing specified pages locally...');
        const doc = await PDFLib.PDFDocument.load(stagedFiles[0].bytes);
        const totalPages = doc.getPageCount();
        const deleteInput = document.getElementById('opt-delete-pages')?.value || '';
        const pagesToDelete = new Set(parsePageRanges(deleteInput, totalPages));

        const pagesToKeep = [];
        for (let p = 1; p <= totalPages; p++) {
          if (!pagesToDelete.has(p)) pagesToKeep.push(p - 1);
        }

        if (pagesToKeep.length === 0) {
          throw new Error('You cannot delete all pages in the document. At least 1 page must remain.');
        }

        const newPdf = await PDFLib.PDFDocument.create();
        const copied = await newPdf.copyPages(doc, pagesToKeep);
        copied.forEach(p => newPdf.addPage(p));

        updateProgress(90, 'Saving trimmed document...');
        const pdfBytes = await newPdf.save({ useObjectStreams: true });
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        renderSuccessDownload(URL.createObjectURL(blob), getDerivedOutputFilename('trimmed', 'pdf'));
        return;
      }

      // 4. Extract PDF Pages
      if (activeTool === 'extract-pages' && stagedFiles.length === 1) {
        updateProgress(40, 'Extracting selected pages locally...');
        const doc = await PDFLib.PDFDocument.load(stagedFiles[0].bytes);
        const totalPages = doc.getPageCount();
        const extractInput = document.getElementById('opt-extract-pages')?.value || '1';
        const pageNumbers = parsePageRanges(extractInput, totalPages);
        const targetIndices = pageNumbers.map(p => p - 1);

        if (targetIndices.length === 0) {
          throw new Error('Please specify valid page numbers to extract (e.g. 1-3, 5).');
        }

        const newPdf = await PDFLib.PDFDocument.create();
        const copied = await newPdf.copyPages(doc, targetIndices);
        copied.forEach(p => newPdf.addPage(p));

        updateProgress(90, 'Saving extracted pages...');
        const pdfBytes = await newPdf.save({ useObjectStreams: true });
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        renderSuccessDownload(URL.createObjectURL(blob), getDerivedOutputFilename('extracted', 'pdf'));
        return;
      }

      // 5. Split PDF (Ranges or Split Every Page)
      if (activeTool === 'split-pdf' && stagedFiles.length === 1) {
        const mode = document.getElementById('opt-split-mode')?.value || 'all-pages';
        const doc = await PDFLib.PDFDocument.load(stagedFiles[0].bytes);
        const totalPages = doc.getPageCount();
        const base = getBaseName(stagedFiles[0].name);

        if (mode === 'ranges') {
          updateProgress(40, 'Extracting custom page ranges locally...');
          const rangesInput = document.getElementById('opt-split-ranges')?.value || '1';
          const targetIndices = parsePageRanges(rangesInput, totalPages).map(p => p - 1);

          if (targetIndices.length === 0) {
            throw new Error('Please specify a valid page range (e.g. 1-3, 5).');
          }

          const newPdf = await PDFLib.PDFDocument.create();
          const copied = await newPdf.copyPages(doc, targetIndices);
          copied.forEach(p => newPdf.addPage(p));

          updateProgress(90, 'Saving split range...');
          const pdfBytes = await newPdf.save({ useObjectStreams: true });
          const blob = new Blob([pdfBytes], { type: 'application/pdf' });
          const cleanSuffix = rangesInput.replace(/[^a-zA-Z0-9_-]/g, '_');
          renderSuccessDownload(URL.createObjectURL(blob), `${base}_split_${cleanSuffix}.pdf`);
          return;
        } else {
          // Split Every Page
          updateProgress(35, `Separating all ${totalPages} pages into individual files...`);

          if (totalPages === 1) {
            const blob = new Blob([stagedFiles[0].bytes], { type: 'application/pdf' });
            renderSuccessDownload(URL.createObjectURL(blob), `${base}_page_1.pdf`);
            return;
          }

          if (typeof JSZip !== 'undefined') {
            const zip = new JSZip();
            for (let i = 0; i < totalPages; i++) {
              const singlePdf = await PDFLib.PDFDocument.create();
              const [copiedPage] = await singlePdf.copyPages(doc, [i]);
              singlePdf.addPage(copiedPage);
              const singleBytes = await singlePdf.save({ useObjectStreams: true });
              zip.file(`${base}_page_${i + 1}.pdf`, singleBytes);
              const progress = Math.round(35 + ((i + 1) / totalPages) * 50);
              updateProgress(progress, `Compiled page ${i + 1} of ${totalPages}...`);
            }
            updateProgress(90, 'Archiving split documents into ZIP...');
            const zipContent = await zip.generateAsync({ type: 'blob' });
            renderSuccessDownload(URL.createObjectURL(zipContent), `${base}_all_pages.zip`);
            return;
          } else {
            const singlePdf = await PDFLib.PDFDocument.create();
            const [copiedPage] = await singlePdf.copyPages(doc, [0]);
            singlePdf.addPage(copiedPage);
            const singleBytes = await singlePdf.save({ useObjectStreams: true });
            const blob = new Blob([singleBytes], { type: 'application/pdf' });
            renderSuccessDownload(URL.createObjectURL(blob), `${base}_page_1.pdf`);
            return;
          }
        }
      }

      // 6. Compress PDF (In-Browser Object Stream Optimization)
      if (activeTool === 'compress-pdf' && stagedFiles.length === 1) {
        updateProgress(40, 'Optimizing stream objects and dictionary trees locally...');
        const doc = await PDFLib.PDFDocument.load(stagedFiles[0].bytes, { updateMetadata: false });
        const level = document.getElementById('opt-compress-level')?.value || 'recommended';

        if (level === 'extreme') {
          doc.setTitle('');
          doc.setAuthor('');
          doc.setSubject('');
          doc.setKeywords([]);
          doc.setProducer('DocPlatform Optimizer');
          doc.setCreator('DocPlatform Optimizer');
        }

        updateProgress(85, 'Compacting cross-reference table...');
        const pdfBytes = await doc.save({
          useObjectStreams: true,
          addDefaultPage: false,
          objectsPerTick: 50,
        });
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        renderSuccessDownload(URL.createObjectURL(blob), getDerivedOutputFilename('compressed', 'pdf'));
        return;
      }

      // 7. JPG / PNG / WebP to PDF
      if (activeTool === 'jpg-to-pdf' && stagedFiles.length > 0) {
        updateProgress(30, 'Compiling images to PDF in browser...');
        const newPdf = await PDFLib.PDFDocument.create();
        const pageSizeOpt = document.getElementById('opt-image-pagesize')?.value || 'A4';
        const orientation = document.getElementById('opt-image-orientation')?.value || 'auto';
        const margin = 20;

        for (let i = 0; i < stagedFiles.length; i++) {
          const file = stagedFiles[i];
          const detected = detectFileType(file, file.bytes);
          let embeddedImage;

          if (detected === 'png') {
            embeddedImage = await newPdf.embedPng(file.bytes);
          } else if (detected === 'jpeg') {
            embeddedImage = await newPdf.embedJpg(file.bytes);
          } else {
            // WebP or custom image: draw to canvas and convert to PNG bytes
            const blob = new Blob([file.bytes], { type: file.fileObject?.type || 'image/webp' });
            const bitmap = await createImageBitmap(blob);
            const canvas = document.createElement('canvas');
            canvas.width = bitmap.width;
            canvas.height = bitmap.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(bitmap, 0, 0);
            const pngBlob = await new Promise(res => canvas.toBlob(res, 'image/png', 1.0));
            const pngBuf = await pngBlob.arrayBuffer();
            embeddedImage = await newPdf.embedPng(new Uint8Array(pngBuf));
          }

          const { width: imgWidth, height: imgHeight } = embeddedImage;
          let pageWidth = 595.28; // A4
          let pageHeight = 841.89;

          if (pageSizeOpt === 'FIT_IMAGE') {
            pageWidth = imgWidth + margin * 2;
            pageHeight = imgHeight + margin * 2;
          } else if (pageSizeOpt === 'LETTER') {
            pageWidth = 612;
            pageHeight = 792;
          }

          if (orientation === 'landscape' || (orientation === 'auto' && imgWidth > imgHeight)) {
            if (pageWidth < pageHeight) {
              const tmp = pageWidth;
              pageWidth = pageHeight;
              pageHeight = tmp;
            }
          }

          const page = newPdf.addPage([pageWidth, pageHeight]);
          const maxW = pageWidth - margin * 2;
          const maxH = pageHeight - margin * 2;
          const scale = Math.min(maxW / imgWidth, maxH / imgHeight, 1);
          const dw = imgWidth * scale;
          const dh = imgHeight * scale;
          const dx = (pageWidth - dw) / 2;
          const dy = (pageHeight - dh) / 2;

          page.drawImage(embeddedImage, { x: dx, y: dy, width: dw, height: dh });
          const progress = Math.round(30 + ((i + 1) / stagedFiles.length) * 60);
          updateProgress(progress, `Embedded image ${i + 1} of ${stagedFiles.length}...`);
        }

        updateProgress(95, 'Finalizing PDF output...');
        const pdfBytes = await newPdf.save({ useObjectStreams: true });
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        renderSuccessDownload(URL.createObjectURL(blob), getDerivedOutputFilename('compiled', 'pdf'));
        return;
      }

      // 8. PDF to JPG / PNG / WebP Converter (with configurable DPI 72, 150, 300, 600)
      if (activeTool === 'pdf-to-jpg' && stagedFiles.length === 1 && typeof pdfjsLib !== 'undefined') {
        const format = document.getElementById('opt-img-format')?.value || 'png';
        const dpi = parseInt(document.getElementById('opt-img-dpi')?.value || '150', 10);
        const scale = dpi / 72;
        const mimeType = format === 'jpeg' ? 'image/jpeg' : (format === 'webp' ? 'image/webp' : 'image/png');
        const ext = format === 'jpeg' ? 'jpg' : (format === 'webp' ? 'webp' : 'png');
        const base = getBaseName(stagedFiles[0].name);

        updateProgress(20, `Rendering PDF pages at ${dpi} DPI (${format.toUpperCase()})...`);
        
        // Configure PDF.js Worker properly
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        
        // Pass a fresh cloned copy of the ArrayBuffer to avoid detached ArrayBuffer errors
        const dataCopy = new Uint8Array(stagedFiles[0].bytes.slice(0));
        const loadingTask = pdfjsLib.getDocument({ data: dataCopy });
        const pdf = await loadingTask.promise;
        const totalPages = pdf.numPages;

        if (totalPages === 1) {
          const page = await pdf.getPage(1);
          const viewport = page.getViewport({ scale });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d');
          await page.render({ canvasContext: ctx, viewport }).promise;

          const imgBlob = await new Promise(res => canvas.toBlob(res, mimeType, 0.95));
          renderSuccessDownload(URL.createObjectURL(imgBlob), `${base}_page_1.${ext}`);
          return;
        }

        if (typeof JSZip !== 'undefined') {
          const zip = new JSZip();
          for (let i = 1; i <= totalPages; i++) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale });
            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const ctx = canvas.getContext('2d');
            await page.render({ canvasContext: ctx, viewport }).promise;

            const imgBlob = await new Promise(res => canvas.toBlob(res, mimeType, 0.95));
            const imgBuf = await imgBlob.arrayBuffer();
            zip.file(`${base}_page_${i}.${ext}`, imgBuf);

            const progress = Math.round(20 + (i / totalPages) * 70);
            updateProgress(progress, `Rendered page ${i} of ${totalPages} at ${dpi} DPI...`);
          }

          updateProgress(95, 'Packaging high-resolution images into ZIP...');
          const zipBlob = await zip.generateAsync({ type: 'blob' });
          renderSuccessDownload(URL.createObjectURL(zipBlob), `${base}_${dpi}dpi_images.zip`);
          return;
        }
      }
    }

    // ── Route 2: Asynchronous Distributed Worker Pipeline Fallback ──────────
    updateProgress(25, 'Submitting job to isolated worker pool...');

    const options = collectActiveToolOptions();
    if (activeTool.startsWith('ai-')) {
      options.apiKey = (typeof getStoredGeminiKey === 'function') ? getStoredGeminiKey() : localStorage.getItem('dp_user_gemini_key');
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
    pollJobStatus(currentJobId);

  } catch (err) {
    alert(`Processing error: ${err.message}`);
    resetWorkspace();
  }
}

function arrayBufferToBase64(buffer) {
  if (!buffer) return '';
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const len = bytes.byteLength;
  const chunkSize = 8192;
  for (let i = 0; i < len; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
    binary += String.fromCharCode.apply(null, chunk);
  }
  return btoa(binary);
}

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
  }

  return opts;
}

function pollJobStatus(jobId) {
  pollInterval = setInterval(async () => {
    try {
      const res = await fetch(`/api/v1/jobs/${jobId}`);
      const data = await res.json();

      if (data.status === 'PROCESSING') {
        updateProgress(Math.max(30, data.progress || 50), 'Processing in isolated worker container...');
      } else if (data.status === 'COMPLETED') {
        clearInterval(pollInterval);
        pollInterval = null;
        updateProgress(100, 'Processing complete!');
        renderSuccessDownload(data.downloadUrl, data.filename || `processed_${activeTool}`);
      } else if (data.status === 'FAILED') {
        clearInterval(pollInterval);
        alert(`Worker error: ${data.error?.message || 'Processing failed.'}`);
        resetWorkspace();
      }
    } catch {
      // Retry on network glitch
    }
  }, 800);
}

function updateProgress(percent, text) {
  document.getElementById('progress-bar-fill').style.width = `${percent}%`;
  document.getElementById('progress-percent').textContent = `${percent}%`;
  document.getElementById('progress-status-text').textContent = text;
}

function renderSuccessDownload(url, filename) {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
  document.getElementById('dropzone').style.display = 'none';
  document.getElementById('staging-area').style.display = 'none';
  document.getElementById('progress-container').style.display = 'none';
  
  const resultCard = document.getElementById('result-card');
  resultCard.style.display = 'block';

  const downloadBtn = document.getElementById('download-btn');
  downloadBtn.href = url;
  downloadBtn.download = filename;
}

// Global Initialization
document.addEventListener('DOMContentLoaded', () => {
  renderToolTabs();
  setupEventListeners();
  initFaqAccordion();

  // Set active tab on tool load
  const currentPath = window.location.pathname.replace(/^\//, '') || 'merge-pdf';
  if (TOOL_DEFINITIONS[currentPath]) {
    switchTool(currentPath);
  }
});

