/**
 * @file widget.js
 * @description Phase 8 — Embeddable Document Utility Widget SDK.
 * Allows 3rd-party websites, blogs, intranets, and SaaS applications to embed
 * DocPlatform document tools with 1 line of HTML.
 *
 * USAGE (Declarative):
 *   <div data-docplatform-widget="merge-pdf" data-theme="light"></div>
 *   <script src="https://your-domain.com/widget.js" async></script>
 *
 * USAGE (Programmatic):
 *   <script src="https://your-domain.com/widget.js"></script>
 *   <script>
 *     DocPlatform.createWidget({
 *       container: '#my-container',
 *       tool: 'compress-pdf',
 *       theme: 'light',
 *       apiKey: 'dpk_optional_key',
 *       onSuccess: (result) => console.log('Done!', result),
 *     });
 *   </script>
 */

(function (window, document) {
  'use strict';

  // Prevent multiple executions
  if (window.DocPlatform && window.DocPlatform.__isLoaded) return;

  const DEFAULT_HOST = (function () {
    const scripts = document.getElementsByTagName('script');
    for (let i = 0; i < scripts.length; i++) {
      const src = scripts[i].getAttribute('src') || '';
      if (src.includes('widget.js')) {
        try {
          const url = new URL(src, window.location.href);
          return url.origin;
        } catch {
          break;
        }
      }
    }
    return window.location.origin;
  })();

  const WIDGET_STYLES = `
    .dp-widget-container {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      box-sizing: border-box;
      width: 100%;
      max-width: 600px;
      margin: 0 auto;
      border: 1.5px solid #E5E7EB;
      border-radius: 16px;
      padding: 24px;
      background: #FFFFFF;
      color: #111827;
      box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05);
      transition: all 0.2s ease;
    }
    .dp-widget-container * {
      box-sizing: border-box;
    }
    .dp-widget-dark {
      background: #0F172A;
      color: #F8FAFC;
      border-color: #334155;
    }
    .dp-widget-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }
    .dp-widget-title {
      font-size: 1.1rem;
      font-weight: 600;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .dp-widget-badge {
      font-size: 0.72rem;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 999px;
      background: #EFF6FF;
      color: #2563EB;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .dp-widget-dark .dp-widget-badge {
      background: #1E293B;
      color: #60A5FA;
    }
    .dp-widget-dropzone {
      border: 2px dashed #D1D5DB;
      border-radius: 12px;
      padding: 32px 16px;
      text-align: center;
      cursor: pointer;
      background: #F9FAFB;
      transition: all 0.15s ease;
    }
    .dp-widget-dropzone:hover, .dp-widget-dropzone.dp-dragover {
      border-color: #2563EB;
      background: #EFF6FF;
    }
    .dp-widget-dark .dp-widget-dropzone {
      background: #1E293B;
      border-color: #475569;
    }
    .dp-widget-dark .dp-widget-dropzone:hover {
      background: #0F172A;
      border-color: #60A5FA;
    }
    .dp-widget-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: #111827;
      color: #FFFFFF;
      border: none;
      border-radius: 10px;
      padding: 10px 20px;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s ease;
      width: 100%;
      margin-top: 14px;
    }
    .dp-widget-btn:hover {
      background: #1F2937;
    }
    .dp-widget-dark .dp-widget-btn {
      background: #2563EB;
    }
    .dp-widget-dark .dp-widget-btn:hover {
      background: #1D4ED8;
    }
    .dp-widget-progress {
      display: none;
      margin-top: 16px;
    }
    .dp-widget-bar-bg {
      width: 100%;
      height: 6px;
      background: #E5E7EB;
      border-radius: 999px;
      overflow: hidden;
    }
    .dp-widget-bar-fill {
      height: 100%;
      width: 0%;
      background: #2563EB;
      border-radius: 999px;
      transition: width 0.2s ease;
    }
    .dp-widget-status {
      font-size: 0.8rem;
      color: #6B7280;
      margin-top: 6px;
      display: flex;
      justify-content: space-between;
    }
    .dp-widget-footer {
      margin-top: 14px;
      font-size: 0.72rem;
      color: #9CA3AF;
      text-align: center;
    }
    .dp-widget-footer a {
      color: inherit;
      text-decoration: underline;
    }
  `;

  function injectStylesOnce() {
    if (document.getElementById('dp-widget-styles')) return;
    const styleEl = document.createElement('style');
    styleEl.id = 'dp-widget-styles';
    styleEl.textContent = WIDGET_STYLES;
    document.head.appendChild(styleEl);
  }

  /**
   * Widget Factory
   */
  function createWidget(options = {}) {
    injectStylesOnce();

    const containerEl =
      typeof options.container === 'string'
        ? document.querySelector(options.container)
        : options.container;

    if (!containerEl) {
      console.error('[DocPlatform Widget] Container element not found:', options.container);
      return null;
    }

    const tool = options.tool || 'merge-pdf';
    const theme = options.theme === 'dark' ? 'dp-widget-dark' : '';
    const host = options.host || DEFAULT_HOST;
    const apiKey = options.apiKey || '';

    const toolTitles = {
      'merge-pdf': 'Merge PDF Files',
      'split-pdf': 'Split PDF Document',
      'compress-pdf': 'Compress PDF',
      'rotate-pdf': 'Rotate PDF Pages',
      'word-to-pdf': 'Word to PDF',
      'excel-to-pdf': 'Excel to PDF',
      'pdf-to-word': 'PDF to Word',
      'ocr-pdf': 'OCR PDF (Searchable)',
      'protect-pdf': 'Protect & Encrypt PDF',
      'watermark-pdf': 'Watermark PDF',
    };

    const displayTitle = options.title || toolTitles[tool] || 'Document Utility';

    const widgetId = `dp_w_${Math.random().toString(36).substr(2, 8)}`;

    const html = `
      <div class="dp-widget-container ${theme}" id="${widgetId}">
        <div class="dp-widget-header">
          <h3 class="dp-widget-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
            </svg>
            ${displayTitle}
          </h3>
          <span class="dp-widget-badge">Free Tool</span>
        </div>

        <div class="dp-widget-dropzone" id="${widgetId}-dropzone">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="1.5" style="margin-bottom: 8px;">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
          <div style="font-size: 0.9rem; font-weight: 500; margin-bottom: 4px;">Click or drag PDF files here</div>
          <div style="font-size: 0.78rem; color: #9CA3AF;">Up to 50MB per file • 100% Private</div>
          <input type="file" id="${widgetId}-input" style="display: none;" ${tool === 'merge-pdf' ? 'multiple' : ''} accept=".pdf,application/pdf" />
        </div>

        <div id="${widgetId}-file-list" style="margin-top: 10px; font-size: 0.82rem; color: #4B5563; display: none;"></div>

        <button class="dp-widget-btn" id="${widgetId}-btn" style="display: none;">
          Process Document
        </button>

        <div class="dp-widget-progress" id="${widgetId}-progress">
          <div class="dp-widget-bar-bg">
            <div class="dp-widget-bar-fill" id="${widgetId}-fill"></div>
          </div>
          <div class="dp-widget-status">
            <span id="${widgetId}-status-text">Uploading securely...</span>
            <span id="${widgetId}-percent">0%</span>
          </div>
        </div>

        <div id="${widgetId}-result" style="display: none; margin-top: 14px; text-align: center;">
          <a href="#" class="dp-widget-btn" id="${widgetId}-download-link" style="background: #10B981; text-decoration: none;" download>
            ✓ Download Processed PDF
          </a>
        </div>

        <div class="dp-widget-footer">
          Powered by <a href="${host}" target="_blank" rel="noopener">DocPlatform Infrastructure</a>
        </div>
      </div>
    `;

    containerEl.innerHTML = html;

    // Attach event handlers
    const dropzone = document.getElementById(`${widgetId}-dropzone`);
    const fileInput = document.getElementById(`${widgetId}-input`);
    const fileList = document.getElementById(`${widgetId}-file-list`);
    const actionBtn = document.getElementById(`${widgetId}-btn`);
    const progressBox = document.getElementById(`${widgetId}-progress`);
    const progressBar = document.getElementById(`${widgetId}-fill`);
    const progressText = document.getElementById(`${widgetId}-status-text`);
    const progressPercent = document.getElementById(`${widgetId}-percent`);
    const resultBox = document.getElementById(`${widgetId}-result`);
    const downloadLink = document.getElementById(`${widgetId}-download-link`);

    let selectedFiles = [];

    dropzone.addEventListener('click', () => fileInput.click());

    ['dragenter', 'dragover'].forEach((eName) => {
      dropzone.addEventListener(eName, (e) => {
        e.preventDefault();
        dropzone.classList.add('dp-dragover');
      });
    });

    ['dragleave', 'drop'].forEach((eName) => {
      dropzone.addEventListener(eName, (e) => {
        e.preventDefault();
        dropzone.classList.remove('dp-dragover');
      });
    });

    dropzone.addEventListener('drop', (e) => {
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFiles(Array.from(e.dataTransfer.files));
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFiles(Array.from(e.target.files));
      }
    });

    function handleFiles(files) {
      selectedFiles = files;
      fileList.innerHTML = `Selected: <strong>${files.map((f) => f.name).join(', ')}</strong>`;
      fileList.style.display = 'block';
      actionBtn.style.display = 'inline-flex';
      resultBox.style.display = 'none';
    }

    actionBtn.addEventListener('click', async () => {
      if (selectedFiles.length === 0) return;

      actionBtn.style.display = 'none';
      progressBox.style.display = 'block';
      progressBar.style.width = '25%';
      progressPercent.textContent = '25%';
      progressText.textContent = 'Preparing document...';

      try {
        const headers = { 'Content-Type': 'application/json' };
        if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

        const jobRes = await fetch(`${host}/api/v1/jobs`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            operation: tool,
            files: selectedFiles.map((f) => ({ name: f.name, size: f.size })),
            options: options.toolOptions || {},
          }),
        });

        const jobData = await jobRes.json();
        if (!jobRes.ok) throw new Error(jobData.error?.message || 'Processing failed');

        progressBar.style.width = '60%';
        progressPercent.textContent = '60%';
        progressText.textContent = 'Processing in cloud worker...';

        // Poll for completion
        const poll = setInterval(async () => {
          try {
            const statusRes = await fetch(`${host}/api/v1/jobs/${jobData.jobId}`);
            const statusData = await statusRes.json();

            if (statusData.status === 'COMPLETED') {
              clearInterval(poll);
              progressBar.style.width = '100%';
              progressPercent.textContent = '100%';
              progressText.textContent = 'Complete!';

              downloadLink.href = statusData.downloadUrl || '#';
              resultBox.style.display = 'block';

              if (typeof options.onSuccess === 'function') {
                options.onSuccess(statusData);
              }
            } else if (statusData.status === 'FAILED') {
              clearInterval(poll);
              throw new Error(statusData.error?.message || 'Processing failed');
            }
          } catch (err) {
            clearInterval(poll);
            progressText.textContent = `Error: ${err.message}`;
            if (typeof options.onError === 'function') options.onError(err);
          }
        }, 800);
      } catch (err) {
        progressText.textContent = `Error: ${err.message}`;
        if (typeof options.onError === 'function') options.onError(err);
      }
    });

    return {
      id: widgetId,
      element: document.getElementById(widgetId),
    };
  }

  // Auto-init declarative widgets: <div data-docplatform-widget="merge-pdf">
  function autoInitDeclarativeWidgets() {
    const targets = document.querySelectorAll('[data-docplatform-widget]');
    targets.forEach((target) => {
      const tool = target.getAttribute('data-docplatform-widget') || 'merge-pdf';
      const theme = target.getAttribute('data-theme') || 'light';
      const apiKey = target.getAttribute('data-api-key') || '';
      createWidget({ container: target, tool, theme, apiKey });
    });
  }

  // Public SDK Object
  window.DocPlatform = {
    __isLoaded: true,
    version: '2.0.0',
    createWidget,
    init: autoInitDeclarativeWidgets,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInitDeclarativeWidgets);
  } else {
    autoInitDeclarativeWidgets();
  }
})(window, document);
