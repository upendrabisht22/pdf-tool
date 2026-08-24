/**
 * DocPlatform Interactive Client Engine
 * Features:
 * - Local-First in-browser WASM processing (0 cloud cost, instant completion, complete privacy)
 * - Cloud Worker asynchronous fallback pipeline
 * - Client-side magic byte inspection
 * - Multi-tool routing & state management
 */

// Staged files in memory
let stagedFiles = [];
let activeTool = 'merge-pdf';
let currentJobId = null;

const TOOL_DEFINITIONS = {
  'merge-pdf': {
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
  }
};

document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  switchTool('merge-pdf');
});

function setupEventListeners() {
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('file-input');
  const addMoreInput = document.getElementById('add-more-input');
  const processBtn = document.getElementById('process-btn');

  // Drag and Drop
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

  // Update tabs UI
  document.querySelectorAll('.tool-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tool === toolKey);
  });

  // Update hero & options
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

  // Add sub-event listeners for options if needed
  const splitMode = document.getElementById('opt-split-mode');
  if (splitMode) {
    splitMode.addEventListener('change', (e) => {
      const rangesInput = document.getElementById('opt-split-ranges');
      if (rangesInput) rangesInput.style.display = e.target.value === 'ranges' ? 'block' : 'none';
    });
  }

  resetWorkspace();
};

function resetWorkspace() {
  document.getElementById('dropzone').style.display = 'block';
  document.getElementById('staging-area').style.display = 'none';
  document.getElementById('progress-container').style.display = 'none';
  document.getElementById('result-card').style.display = 'none';
  renderFileList();
}

async function handleFilesSelected(files, isAppend = false) {
  const validFiles = [];

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // Client-side magic byte inspection
    let isMagicValid = false;
    if (activeTool === 'jpg-to-pdf') {
      // PNG, JPEG, WebP
      if (bytes[0] === 0x89 && bytes[1] === 0x50) isMagicValid = true; // PNG
      else if (bytes[0] === 0xff && bytes[1] === 0xd8) isMagicValid = true; // JPEG
      else if (bytes[0] === 0x52 && bytes[1] === 0x49) isMagicValid = true; // WEBP/RIFF
    } else {
      // PDF (%PDF)
      if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
        isMagicValid = true;
      }
    }

    if (isMagicValid) {
      validFiles.push({
        id: `f_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        name: file.name,
        size: file.size,
        fileObject: file,
        bytes: bytes
      });
    } else {
      alert(`File "${file.name}" was rejected because its header contents are invalid or corrupted.`);
    }
  }

  if (isAppend) {
    stagedFiles.push(...validFiles);
  } else {
    stagedFiles = TOOL_DEFINITIONS[activeTool].multiple ? validFiles : validFiles.slice(0, 1);
  }

  if (stagedFiles.length > 0) {
    document.getElementById('dropzone').style.display = 'none';
    document.getElementById('staging-area').style.display = 'flex';
    renderFileList();
  }
}

function renderFileList() {
  const container = document.getElementById('file-list');
  container.innerHTML = '';

  stagedFiles.forEach((file, index) => {
    const card = document.createElement('div');
    card.className = 'file-card';
    card.innerHTML = `
      <div class="file-card-header">
        <span class="file-icon-badge">${activeTool === 'jpg-to-pdf' ? 'IMG' : 'PDF'}</span>
        <button class="file-remove-btn" onclick="removeStagedFile(${index})" title="Remove file">&times;</button>
      </div>
      <div class="file-name">${escapeHtml(file.name)}</div>
      <div class="file-meta">${formatBytes(file.size)}</div>
    `;
    container.appendChild(card);
  });

  const processBtn = document.getElementById('process-btn');
  processBtn.disabled = stagedFiles.length === 0 || (activeTool === 'merge-pdf' && stagedFiles.length < 2);
}

window.removeStagedFile = function(index) {
  stagedFiles.splice(index, 1);
  if (stagedFiles.length === 0) {
    resetWorkspace();
  } else {
    renderFileList();
  }
};

async function executeDocumentOperation() {
  if (stagedFiles.length === 0) return;

  document.getElementById('staging-area').style.display = 'none';
  document.getElementById('progress-container').style.display = 'block';
  updateProgress(15, 'Preparing document pipeline...');

  try {
    // Attempt local browser-side WASM processing first if PDFLib is available in window
    if (window.PDFLib) {
      await executeLocalProcessing();
    } else {
      // Execute Cloud Worker Fallback via Control Plane API
      await executeServerJob();
    }
  } catch (err) {
    console.error('Processing error:', err);
    alert(`Operation failed: ${err.message}`);
    document.getElementById('progress-container').style.display = 'none';
    document.getElementById('staging-area').style.display = 'flex';
  }
}

// Local in-browser processing engine using PDFLib
async function executeLocalProcessing() {
  const { PDFDocument, degrees, PageSizes } = window.PDFLib;
  updateProgress(40, 'Executing client-side transformation...');

  let resultBytes = null;
  let outputFilename = 'output.pdf';

  if (activeTool === 'merge-pdf') {
    const mergedDoc = await PDFDocument.create();
    for (let i = 0; i < stagedFiles.length; i++) {
      const srcDoc = await PDFDocument.load(stagedFiles[i].bytes);
      const pages = await mergedDoc.copyPages(srcDoc, srcDoc.getPageIndices());
      pages.forEach(p => mergedDoc.addPage(p));
      updateProgress(40 + Math.round(((i + 1) / stagedFiles.length) * 45));
    }
    resultBytes = await mergedDoc.save({ useObjectStreams: true });
    outputFilename = 'merged_document.pdf';
  } else if (activeTool === 'rotate-pdf') {
    const angle = parseInt(document.getElementById('opt-rotate-angle')?.value || '90', 10);
    const target = document.getElementById('opt-rotate-pages')?.value || 'all';
    const doc = await PDFDocument.load(stagedFiles[0].bytes);
    const pages = doc.getPages();
    pages.forEach((p, idx) => {
      const num = idx + 1;
      let shouldRotate = target === 'all' || (target === 'odd' && num % 2 !== 0) || (target === 'even' && num % 2 === 0);
      if (shouldRotate) {
        const cur = p.getRotation().angle;
        p.setRotation(degrees((cur + angle) % 360));
      }
    });
    resultBytes = await doc.save({ useObjectStreams: true });
    outputFilename = 'rotated_document.pdf';
  } else if (activeTool === 'compress-pdf') {
    const doc = await PDFDocument.load(stagedFiles[0].bytes);
    resultBytes = await doc.save({ useObjectStreams: true, objectsPerTick: 50 });
    outputFilename = 'compressed_document.pdf';
  } else if (activeTool === 'jpg-to-pdf') {
    const doc = await PDFDocument.create();
    const pageSizePref = document.getElementById('opt-image-pagesize')?.value || 'A4';
    for (let i = 0; i < stagedFiles.length; i++) {
      const f = stagedFiles[i];
      let img;
      if (f.bytes[0] === 0x89) {
        img = await doc.embedPng(f.bytes);
      } else {
        img = await doc.embedJpg(f.bytes);
      }
      let dims = [PageSizes.A4[0], PageSizes.A4[1]];
      if (pageSizePref === 'FIT_IMAGE') dims = [img.width + 40, img.height + 40];
      const page = doc.addPage(dims);
      const scale = Math.min((dims[0] - 40) / img.width, (dims[1] - 40) / img.height, 1);
      const w = img.width * scale;
      const h = img.height * scale;
      page.drawImage(img, { x: (dims[0] - w) / 2, y: (dims[1] - h) / 2, width: w, height: h });
      updateProgress(40 + Math.round(((i + 1) / stagedFiles.length) * 45));
    }
    resultBytes = await doc.save({ useObjectStreams: true });
    outputFilename = 'compiled_images.pdf';
  }

  updateProgress(100, 'Done!');
  showCompletedResult(new Blob([resultBytes], { type: 'application/pdf' }), outputFilename);
}

// Server Worker execution fallback
async function executeServerJob() {
  updateProgress(20, 'Requesting direct upload tickets...');
  
  // Create job via control plane
  const jobPayload = {
    operation: activeTool,
    files: stagedFiles.map(f => ({ name: f.name, size: f.size }))
  };

  const jobRes = await fetch('/api/v1/jobs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(jobPayload)
  });

  const jobData = await jobRes.json();
  currentJobId = jobData.jobId;

  // Poll status
  let pollInterval = setInterval(async () => {
    const statusRes = await fetch(`/api/v1/jobs/${currentJobId}`);
    const statusData = await statusRes.json();

    updateProgress(statusData.progress || 50, statusData.message || 'Processing in cloud worker sandbox...');

    if (statusData.status === 'COMPLETED') {
      clearInterval(pollInterval);
      updateProgress(100, 'Document ready!');
      showCompletedResultUrl(statusData.downloadUrl, 'document_result.pdf');
    } else if (statusData.status === 'FAILED') {
      clearInterval(pollInterval);
      throw new Error(statusData.error?.message || 'Server worker failed.');
    }
  }, 1000);
}

function updateProgress(percent, label = '') {
  document.getElementById('progress-fill').style.width = `${percent}%`;
  document.getElementById('progress-percent').textContent = `${percent}%`;
  if (label) document.getElementById('progress-status-label').textContent = label;
}

function showCompletedResult(blob, filename) {
  document.getElementById('progress-container').style.display = 'none';
  const resultCard = document.getElementById('result-card');
  resultCard.style.display = 'block';

  const downloadBtn = document.getElementById('download-action-btn');
  const blobUrl = URL.createObjectURL(blob);
  downloadBtn.href = blobUrl;
  downloadBtn.download = filename;

  // Auto trigger download for seamless UX
  const autoLink = document.createElement('a');
  autoLink.href = blobUrl;
  autoLink.download = filename;
  autoLink.click();
}

function showCompletedResultUrl(url, filename) {
  document.getElementById('progress-container').style.display = 'none';
  const resultCard = document.getElementById('result-card');
  resultCard.style.display = 'block';

  const downloadBtn = document.getElementById('download-action-btn');
  downloadBtn.href = url;
  downloadBtn.download = filename;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
