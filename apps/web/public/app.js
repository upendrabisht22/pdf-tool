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
        <option value="odd">Odd Pages Only</option>
        <option value="even">Even Pages Only</option>
      </select>
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
      <input type="text" id="opt-delete-pages" placeholder="Pages to delete (e.g. 2, 4-6)" class="select-control" style="width: 220px;" />
    `
  },
  'jpg-to-pdf': {
    category: 'core',
    title: 'JPG / PNG to PDF Converter',
    badge: 'Compile Photos to Document',
    subtitle: 'Convert images (JPG, PNG, WebP) into a high-resolution, organized PDF document.',
    actionName: 'Convert Images to PDF',
    multiple: true,
    accept: 'image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp',
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
    title: 'PDF to JPG / PNG Converter',
    badge: 'High-DPI Image Extraction',
    subtitle: 'Extract all pages from your PDF as crisp high-resolution images.',
    actionName: 'Convert PDF to Images',
    multiple: false,
    accept: '.pdf,application/pdf',
    optionsHtml: `
      <select id="opt-img-format" class="select-control">
        <option value="png">PNG (Lossless Vector Crispness)</option>
        <option value="jpeg">JPEG (Compressed Web Photos)</option>
      </select>
      <select id="opt-img-dpi" class="select-control">
        <option value="150">150 DPI (Standard Quality)</option>
        <option value="300">300 DPI (High-Resolution Print)</option>
        <option value="72">72 DPI (Web Preview)</option>
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

window.switchTool = function(toolKey) {
  if (!TOOL_DEFINITIONS[toolKey]) return;
  activeTool = toolKey;
  stagedFiles = [];

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

  const optionsContainer = document.getElementById('tool-options-container');
  optionsContainer.innerHTML = config.optionsHtml;

  resetWorkspace();
};

window.resetWorkspace = function resetWorkspace() {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
  stagedFiles = [];
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

async function handleFilesSelected(files, isAppend = false) {
  const validFiles = [];

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // Client-side zero-trust format validation
    let isValid = false;
    if (activeTool === 'jpg-to-pdf' || file.type.startsWith('image/')) {
      if ((bytes[0] === 0x89 && bytes[1] === 0x50) || // PNG
          (bytes[0] === 0xff && bytes[1] === 0xd8) || // JPEG
          (bytes[0] === 0x52 && bytes[1] === 0x49)) { // WEBP
        isValid = true;
      }
    } else if (activeTool.includes('word') || activeTool.includes('excel')) {
      // OpenXML (PK..) or OLE2
      if ((bytes[0] === 0x50 && bytes[1] === 0x4b) ||
          (bytes[0] === 0xd0 && bytes[1] === 0xcf) ||
          (bytes[0] === 0x25 && bytes[1] === 0x50)) {
        isValid = true;
      }
    } else {
      // PDF (%PDF)
      if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
        isValid = true;
      }
    }

    if (isValid) {
      validFiles.push({
        id: `f_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        name: file.name,
        size: file.size,
        fileObject: file,
        bytes: bytes
      });
    } else {
      alert(`File "${file.name}" was rejected because its header format does not match ${activeTool}.`);
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
    renderFileList();
  }
}

function renderFileList() {
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

  const addMoreBtn = document.getElementById('add-more-btn');
  if (addMoreBtn) {
    addMoreBtn.style.display = TOOL_DEFINITIONS[activeTool].multiple ? 'inline-flex' : 'none';
  }
}

window.removeStagedFile = function(index) {
  stagedFiles.splice(index, 1);
  if (stagedFiles.length === 0) {
    resetWorkspace();
  } else {
    renderFileList();
  }
};

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
    if (activeTool === 'merge-pdf' && typeof PDFLib !== 'undefined') {
      updateProgress(40, 'Merging documents locally in your browser...');
      const mergedPdf = await PDFLib.PDFDocument.create();

      for (const file of stagedFiles) {
        const doc = await PDFLib.PDFDocument.load(file.bytes);
        const copiedPages = await mergedPdf.copyPages(doc, doc.getPageIndices());
        copiedPages.forEach(p => mergedPdf.addPage(p));
      }

      updateProgress(90, 'Finalizing merged vector output...');
      const pdfBytes = await mergedPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      renderSuccessDownload(URL.createObjectURL(blob), 'merged_document.pdf');
      return;
    }

    // ── Route 2: Asynchronous Distributed Worker Pipeline ──────────────────
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
    opts.targetPages = document.getElementById('opt-rotate-pages')?.value || 'all';
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

