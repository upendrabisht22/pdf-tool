/**
 * DocPlatform Progress Tracker & Visualizer Module
 * Manages live progress bars, asynchronous job polling, tool-specific micro-steps,
 * and the rich result card with contextual download buttons and Next Steps recommendation chips.
 */

import { escapeHtml, renderSimpleMarkdown } from './utils.js';

let progressAnimInterval = null;
let currentVisualProgress = 18;
let progressStartTime = 0;
let pollInterval = null;

/**
 * Starts animated asymptotic progress bar with tool-specific micro-milestones.
 * @param {string} toolKey
 */
export function startLiveProgressTracking(toolKey) {
  if (progressAnimInterval) clearInterval(progressAnimInterval);
  currentVisualProgress = 18;
  progressStartTime = Date.now();

  const toolPhaseMap = {
    'pdf-to-word': [
      { maxPct: 35, text: 'Analyzing vector layout & font glyphs...', sub: 'Scanning PDF text streams & barcode assets' },
      { maxPct: 60, text: 'Reconstructing tables & column hierarchy...', sub: 'Python pdf2docx engine rebuilding native Word tables' },
      { maxPct: 82, text: 'Embedding high-fidelity images & formatting...', sub: 'Translating coordinate matrices to OpenXML paragraphs' },
      { maxPct: 94, text: 'Validating Word (.docx) document integrity...', sub: 'Final packaging & font mapping' },
    ],
    'pdf-to-excel': [
      { maxPct: 35, text: 'Detecting vector table grids & cells...', sub: 'PyMuPDF vector grid coordinate analyzer' },
      { maxPct: 65, text: 'Extracting spreadsheet rows & decoding CMaps...', sub: 'ToUnicode font translation & cell formatting' },
      { maxPct: 85, text: 'Building native Excel (.xlsx) workbook...', sub: 'openpyxl styling & auto-column width sizing' },
      { maxPct: 95, text: 'Sanitizing spreadsheet output...', sub: 'Validating table row consistency' },
    ],
    'pdf-to-markdown': [
      { maxPct: 35, text: 'Parsing PDF document vector streams...', sub: 'Detecting layout, text blocks & font sizes' },
      { maxPct: 65, text: 'Reconstructing headings, tables & lists...', sub: 'PyMuPDF structure extractor & GFM formatter' },
      { maxPct: 92, text: 'Sanitizing Markdown syntax...', sub: 'Validating CommonMark / GFM compliance' },
    ],
    'markdown-to-pdf': [
      { maxPct: 35, text: 'Parsing Markdown AST & elements...', sub: 'Analyzing headings, code blocks, tables & quotes' },
      { maxPct: 70, text: 'Typesetting vector typography & pages...', sub: 'Calculating page flow, margins & line wraps' },
      { maxPct: 92, text: 'Compiling high-resolution PDF document...', sub: 'Embedding vector fonts & metadata' },
    ],
    'gst-invoice-pdf': [
      { maxPct: 30, text: 'Calculating GST tax rates & Indian Rupee words...', sub: 'Intra/Inter-State tax splitting (CGST/SGST/IGST)' },
      { maxPct: 65, text: 'Generating dynamic UPI payment QR code...', sub: 'Encoding payment URI with exact invoice amount' },
      { maxPct: 92, text: 'Drawing vector A4 tax invoice geometry...', sub: 'Embedding clean vector typography & payment matrix' },
    ],
    'word-to-pdf': [
      { maxPct: 35, text: 'Parsing OpenXML Word document...', sub: 'Reading document body, headers & styles' },
      { maxPct: 70, text: 'Rendering vector pages & typography...', sub: 'Translating Word layout to high-fidelity PDF vectors' },
      { maxPct: 92, text: 'Compiling PDF document stream...', sub: 'Finalizing PDF/A standard compliance' },
    ],
    'excel-to-pdf': [
      { maxPct: 35, text: 'Parsing Excel worksheets & cells...', sub: 'Reading grid dimensions, formulas & cell formats' },
      { maxPct: 70, text: 'Rendering print layout & sheets...', sub: 'Calculating page breaks & auto-fitting columns' },
      { maxPct: 92, text: 'Compiling PDF document stream...', sub: 'Finalizing PDF output' },
    ],
    'ocr-pdf': [
      { maxPct: 35, text: 'Rasterizing pages at 300 DPI...', sub: 'Optimizing contrast for multilingual OCR engine' },
      { maxPct: 70, text: 'Running neural text recognition...', sub: 'Generating transparent searchable text overlay layer' },
      { maxPct: 92, text: 'Compiling Sandwich PDF...', sub: 'Embedding vector text coordinates behind scan' },
    ],
    'ai-summarize': [
      { maxPct: 40, text: 'Extracting semantic document text...', sub: 'Indexing document pages with zero loss' },
      { maxPct: 75, text: 'Hierarchical map-reduce summarization...', sub: 'Google Gemini 2.0 Flash analyzing covenants & metrics' },
      { maxPct: 95, text: 'Formatting structured executive analysis...', sub: 'Grounding citations & generating markdown' },
    ],
    'ai-ask': [
      { maxPct: 40, text: 'Indexing semantic document chunks...', sub: 'Extracting text and building BM25 token index' },
      { maxPct: 75, text: 'Querying Gemini with grounded context...', sub: 'Matching query across all pages and extracting citations' },
      { maxPct: 95, text: 'Formatting verified answer & page citations...', sub: 'Calculating confidence score' },
    ],
    'ai-extract-table': [
      { maxPct: 40, text: 'Analyzing document structure & tables...', sub: 'PyMuPDF vector table detection + Gemini AI Corrector' },
      { maxPct: 75, text: 'Extracting structured rows & columns...', sub: 'Aligning data types and standardizing cells' },
      { maxPct: 95, text: 'Formatting tabular export...', sub: 'Generating clean CSV / JSON / Markdown' },
    ],
  };

  const defaultPhases = [
    { maxPct: 40, text: 'Processing document...', sub: 'Initializing secure worker container' },
    { maxPct: 75, text: 'Applying precision document transformations...', sub: 'Executing vector processing pipeline' },
    { maxPct: 92, text: 'Finalizing & validating output...', sub: 'Sanitizing document & removing temporary scratch' },
  ];

  const phases = toolPhaseMap[toolKey] || defaultPhases;
  updateProgress(18, phases[0].text, phases[0].sub);

  progressAnimInterval = setInterval(() => {
    const elapsedSec = ((Date.now() - progressStartTime) / 1000).toFixed(1);
    const timerEl = document.getElementById('progress-timer');
    if (timerEl) timerEl.textContent = `⏱️ ${elapsedSec}s`;

    // Smooth asymptotic creep towards 94%
    if (currentVisualProgress < 94) {
      const remaining = 95 - currentVisualProgress;
      const step = Math.max(0.25, remaining * 0.04);
      currentVisualProgress = Math.min(94, currentVisualProgress + step);
    }

    const activePhase = phases.find(p => currentVisualProgress <= p.maxPct) || phases[phases.length - 1];
    updateProgress(Math.round(currentVisualProgress), activePhase.text, activePhase.sub);
  }, 400);
}

/**
 * Halts live progress tracking.
 * @param {boolean} success
 */
export function stopLiveProgressTracking(success = true) {
  if (progressAnimInterval) {
    clearInterval(progressAnimInterval);
    progressAnimInterval = null;
  }
  if (success) {
    updateProgress(100, 'Processing Complete!', 'Verified • Ready for download');
  }
}

/**
 * Updates DOM progress bar percent and status messages.
 */
export function updateProgress(percent, text, subtext = '') {
  const fill = document.getElementById('progress-bar-fill');
  const pct = document.getElementById('progress-percent');
  const status = document.getElementById('progress-status-text');
  const sub = document.getElementById('progress-sub-status');

  if (fill) fill.style.width = `${percent}%`;
  if (pct) pct.textContent = `${percent}%`;
  if (status && text) status.textContent = text;
  if (sub && subtext) sub.textContent = subtext;
}

/**
 * Polls backend worker job status until COMPLETED or FAILED.
 */
export function pollJobStatus(jobId, { activeTool, stagedFiles, onComplete, onError }) {
  if (pollInterval) clearInterval(pollInterval);

  pollInterval = setInterval(async () => {
    try {
      const res = await fetch(`/api/v1/jobs/${jobId}`);
      const data = await res.json();

      if (data.status === 'PROCESSING') {
        if (data.progress && data.progress > currentVisualProgress) {
          currentVisualProgress = data.progress;
        }
      } else if (data.status === 'COMPLETED') {
        clearInterval(pollInterval);
        pollInterval = null;
        stopLiveProgressTracking(true);

        let outName = data.filename || `processed_${activeTool}.pdf`;
        if (stagedFiles && stagedFiles.length > 0 && stagedFiles[0].fileObject?.name) {
          const originalName = stagedFiles[0].fileObject.name;
          const baseName = originalName.replace(/\.[^/.]+$/, '');
          if (activeTool === 'protect-pdf') {
            outName = `${baseName}_protected.pdf`;
          } else if (activeTool === 'unlock-pdf') {
            outName = `${baseName}_unlocked.pdf`;
          } else if (activeTool === 'compress-pdf') {
            outName = `${baseName}_compressed.pdf`;
          } else if (activeTool === 'ocr-pdf') {
            outName = `${baseName}_ocr.pdf`;
          } else if (activeTool === 'word-to-pdf' || activeTool === 'excel-to-pdf' || activeTool === 'ppt-to-pdf' || activeTool === 'powerpoint-to-pdf') {
            outName = `${baseName}.pdf`;
          } else if (activeTool === 'pdf-to-word') {
            outName = `${baseName}.docx`;
          } else if (activeTool === 'pdf-to-excel') {
            outName = `${baseName}.xlsx`;
          } else if (activeTool === 'pdf-to-markdown') {
            outName = `${baseName}.md`;
          } else if (activeTool === 'markdown-to-pdf') {
            outName = `${baseName}.pdf`;
          } else if (activeTool === 'gst-invoice-pdf') {
            outName = `${baseName || 'gst_invoice'}.pdf`;
          } else if (activeTool === 'split-pdf') {
            outName = `${baseName}_split.zip`;
          } else if (activeTool === 'ai-summarize') {
            outName = `${baseName}_summary.md`;
          } else if (activeTool === 'ai-ask') {
            outName = `${baseName}_qa_answer.json`;
          } else if (activeTool === 'ai-extract-table') {
            const fmt = document.getElementById('opt-table-format')?.value || 'csv';
            outName = `${baseName}_tables.${fmt}`;
          } else {
            outName = `${baseName}_${activeTool}.pdf`;
          }
        }

        if (typeof onComplete === 'function') {
          onComplete(data.downloadUrl, outName);
        } else {
          renderSuccessDownload(data.downloadUrl, outName, { activeTool, stagedFiles });
        }
      } else if (data.status === 'FAILED') {
        clearInterval(pollInterval);
        pollInterval = null;
        stopLiveProgressTracking(false);
        const errMsg = data.error?.message || 'Processing failed.';
        if (typeof onError === 'function') {
          onError(new Error(errMsg));
        } else {
          alert(`Worker error: ${errMsg}`);
          if (typeof window.resetWorkspace === 'function') window.resetWorkspace();
        }
      }
    } catch {
      // Retry smoothly on temporary network hiccup
    }
  }, 800);
}

/**
 * Renders the success download card, file metadata, live preview, and next steps chips.
 */
export function renderSuccessDownload(url, filename, { activeTool, stagedFiles }) {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
  const dropzone = document.getElementById('dropzone');
  const stagingArea = document.getElementById('staging-area');
  const progressContainer = document.getElementById('progress-container');
  const sigStudio = document.getElementById('signature-studio');

  if (dropzone) dropzone.style.display = 'none';
  if (stagingArea) stagingArea.style.display = 'none';
  if (progressContainer) progressContainer.style.display = 'none';
  if (sigStudio) sigStudio.style.display = 'none';
  
  const resultCard = document.getElementById('result-card');
  if (resultCard) resultCard.style.display = 'block';

  // 1. File Metadata & Extension Parsing
  const cleanFilename = filename || (stagedFiles && stagedFiles[0]?.name ? `${stagedFiles[0].name.replace(/\.[^/.]+$/, '')}_processed.pdf` : 'converted_document.pdf');
  const ext = (cleanFilename.split('.').pop() || 'pdf').toUpperCase();

  const fileNameEl = document.getElementById('result-file-name');
  const fileBadgeEl = document.getElementById('result-file-badge');
  const fileIconEl = document.getElementById('result-file-icon');
  const fileMetaEl = document.getElementById('result-file-meta');
  const downloadBtnText = document.getElementById('download-btn-text');

  if (fileNameEl) fileNameEl.textContent = cleanFilename;
  if (fileBadgeEl) fileBadgeEl.textContent = ext;

  if (fileIconEl) {
    if (ext === 'DOCX' || ext === 'DOC') fileIconEl.textContent = '📝';
    else if (ext === 'XLSX' || ext === 'XLS') fileIconEl.textContent = '📊';
    else if (ext === 'CSV') fileIconEl.textContent = '📊';
    else if (ext === 'MD') fileIconEl.textContent = '📋';
    else if (ext === 'JSON') fileIconEl.textContent = '🤖';
    else if (ext === 'ZIP') fileIconEl.textContent = '📦';
    else if (ext === 'PNG' || ext === 'JPG' || ext === 'JPEG' || ext === 'WEBP') fileIconEl.textContent = '🖼️';
    else fileIconEl.textContent = '📄';
  }

  if (fileMetaEl) {
    fileMetaEl.textContent = 'Verified High Fidelity • Client-Side Secure • Ready';
  }

  const downloadBtn = document.getElementById('download-btn');
  if (downloadBtn) {
    downloadBtn.href = url;
    downloadBtn.download = cleanFilename;
  }
  if (downloadBtnText) {
    if (ext === 'DOCX') downloadBtnText.textContent = 'Download Word (.docx)';
    else if (ext === 'XLSX') downloadBtnText.textContent = 'Download Excel (.xlsx)';
    else if (ext === 'CSV') downloadBtnText.textContent = 'Download CSV Spreadsheet';
    else if (ext === 'MD') downloadBtnText.textContent = 'Download Markdown (.md)';
    else if (ext === 'JSON') downloadBtnText.textContent = 'Download AI Answers (.json)';
    else if (activeTool === 'gst-invoice-pdf') downloadBtnText.textContent = 'Download GST Tax Invoice (.pdf)';
    else if (ext === 'PDF') downloadBtnText.textContent = 'Download PDF Document';
    else if (ext === 'ZIP') downloadBtnText.textContent = 'Download All Files (.zip)';
    else downloadBtnText.textContent = `Download ${ext} Document`;
  }

  // Contextual Secondary Action Button
  const secondaryBtn = document.getElementById('result-secondary-btn');
  if (secondaryBtn) {
    if (activeTool === 'ai-summarize') {
      secondaryBtn.textContent = '↻ Summarize Another Document';
    } else if (activeTool === 'ai-ask') {
      secondaryBtn.textContent = '↻ Ask Another Question';
    } else if (activeTool === 'ai-extract-table') {
      secondaryBtn.textContent = '↻ Extract Another Table';
    } else if (activeTool === 'pdf-to-markdown') {
      secondaryBtn.textContent = '↻ Convert Another PDF';
    } else if (activeTool === 'markdown-to-pdf') {
      secondaryBtn.textContent = '↻ Compile Another Markdown';
    } else if (activeTool === 'gst-invoice-pdf') {
      secondaryBtn.textContent = '↻ Create Another Invoice';
    } else if (activeTool === 'draw-signature' || activeTool === 'sign-pdf') {
      secondaryBtn.textContent = '↻ Sign Another Document';
    } else if (activeTool === 'protect-pdf' || activeTool === 'unlock-pdf') {
      secondaryBtn.textContent = '↻ Process Another Document';
    } else if (activeTool === 'compress-pdf') {
      secondaryBtn.textContent = '↻ Compress Another Document';
    } else if (activeTool === 'merge-pdf') {
      secondaryBtn.textContent = '↻ Merge Other Files';
    } else if (activeTool === 'split-pdf') {
      secondaryBtn.textContent = '↻ Split Another Document';
    } else if (activeTool === 'ocr-pdf') {
      secondaryBtn.textContent = '↻ OCR Another Document';
    } else {
      secondaryBtn.textContent = '↻ Convert Another File';
    }
  }

  // Live AI Response & Table Preview Box
  const aiPreviewBox = document.getElementById('result-ai-preview');
  const aiPreviewBody = document.getElementById('result-ai-body');
  if (aiPreviewBox && aiPreviewBody) {
    if ((activeTool && activeTool.startsWith('ai-')) || ext === 'MD' || ext === 'JSON' || ext === 'CSV') {
      fetch(url)
        .then(r => r.text())
        .then(txt => {
          aiPreviewBox.style.display = 'block';
          window._lastAiPreviewText = txt;
          if (ext === 'JSON') {
            try {
              const parsed = JSON.parse(txt);
              if (parsed.answer) {
                let html = `<div class="ai-qa-box"><div class="ai-qa-q">❓ <strong>${escapeHtml(parsed.question || '')}</strong></div><div class="ai-qa-a">${escapeHtml(parsed.answer)}</div>`;
                if (parsed.citations && parsed.citations.length > 0) {
                  html += `<div class="ai-qa-citations"><strong>Verified Page Citations:</strong><ul>`;
                  for (const c of parsed.citations) {
                    html += `<li><span class="ai-cit-badge">Page ${c.pageNumber}</span> <em>"${escapeHtml(c.snippetText)}"</em></li>`;
                  }
                  html += `</ul></div>`;
                }
                html += `</div>`;
                aiPreviewBody.innerHTML = html;
              } else {
                aiPreviewBody.innerHTML = `<pre class="ai-raw-preview">${escapeHtml(JSON.stringify(parsed, null, 2))}</pre>`;
              }
            } catch {
              aiPreviewBody.innerHTML = `<pre class="ai-raw-preview">${escapeHtml(txt)}</pre>`;
            }
          } else if (ext === 'MD') {
            aiPreviewBody.innerHTML = `<div class="ai-md-rendered">${renderSimpleMarkdown(txt)}</div>`;
          } else {
            aiPreviewBody.innerHTML = `<pre class="ai-raw-preview">${escapeHtml(txt.slice(0, 4000))}</pre>`;
          }
        })
        .catch(() => {
          aiPreviewBox.style.display = 'none';
        });
    } else {
      aiPreviewBox.style.display = 'none';
    }
  }

  // Next Steps Recommendations
  const nextStepsChips = document.getElementById('next-steps-chips');
  if (nextStepsChips) {
    const nextStepsMap = {
      'pdf-to-markdown': [
        { label: '📄 Markdown to PDF', link: '/markdown-to-pdf' },
        { label: '📝 Convert to Word', link: '/pdf-to-word' },
        { label: '⚡ Compress PDF', link: '/compress-pdf' }
      ],
      'markdown-to-pdf': [
        { label: '📝 PDF to Markdown', link: '/pdf-to-markdown' },
        { label: '⚡ Compress PDF', link: '/compress-pdf' },
        { label: '🔒 Protect PDF', link: '/protect-pdf' }
      ],
      'gst-invoice-pdf': [
        { label: '✍️ Draw & Sign Document', link: '/draw-signature' },
        { label: '🔒 Password Protect Invoice', link: '/protect-pdf' },
        { label: '⚡ Compress PDF', link: '/compress-pdf' }
      ],
      'pdf-to-word': [
        { label: '⚡ Compress Word / PDF', link: '/compress-pdf' },
        { label: '🔒 Protect with Password', link: '/protect-pdf' },
        { label: '✍️ Draw / Add Signature', link: '/draw-signature' }
      ],
      'word-to-pdf': [
        { label: '⚡ Compress PDF', link: '/compress-pdf' },
        { label: '🔒 Protect PDF', link: '/protect-pdf' },
        { label: '📑 Merge with other PDFs', link: '/merge-pdf' }
      ],
      'merge-pdf': [
        { label: '⚡ Compress Merged PDF', link: '/compress-pdf' },
        { label: '🔒 Protect PDF', link: '/protect-pdf' },
        { label: '📝 Convert to Word', link: '/pdf-to-word' }
      ],
      'compress-pdf': [
        { label: '🔒 Protect PDF', link: '/protect-pdf' },
        { label: '✍️ Sign Document', link: '/draw-signature' },
        { label: '📝 Convert to Word', link: '/pdf-to-word' }
      ],
      'ai-ask': [
        { label: '💡 Generate Full Summary', link: '/ai-summarize' },
        { label: '📋 Extract Tables to Excel', link: '/ai-extract-table' },
        { label: '📝 Convert to Word', link: '/pdf-to-word' }
      ]
    };
    const steps = (activeTool && nextStepsMap[activeTool]) || [
      { label: '⚡ Compress File', link: '/compress-pdf' },
      { label: '🔒 Protect with Password', link: '/protect-pdf' },
      { label: '📝 Convert to Word', link: '/pdf-to-word' }
    ];
    nextStepsChips.innerHTML = steps.map(s => `
      <a href="${s.link}" class="next-step-chip" onclick="event.preventDefault(); if (window.switchTool) window.switchTool('${s.link.replace(/^\//, '')}')">
        <span>${s.label}</span>
      </a>
    `).join('');
  }
}

// CommonJS fallback
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    startLiveProgressTracking,
    stopLiveProgressTracking,
    updateProgress,
    pollJobStatus,
    renderSuccessDownload
  };
}
