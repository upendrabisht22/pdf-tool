/**
 * @file views/studios/pdf-editor-studio-view.js
 * @description Dedicated Visual PDF Editor studio view with multi-tool toolbar, annotations, and canvas viewport.
 */

/**
 * Renders the Visual PDF Editor Studio HTML component.
 * @param {Object} options
 * @param {string} [options.studioId] - Active studio identifier
 * @returns {string} HTML markup
 */
export function renderPdfEditorStudioView({ studioId }) {
  const isVisible = studioId === 'pdf-editor-studio';
  return `
    <!-- Dedicated Visual PDF Editor Studio -->
    <div id="pdf-editor-studio" style="display: ${isVisible ? 'block' : 'none'}; padding: 0.5rem 0;">
      <!-- Upload Gate if document not yet loaded -->
      <div id="editor-upload-gate" class="dropzone p-10 sm:p-14 border border-dashed border-border hover:border-accent bg-bg-elevated cursor-pointer flex flex-col items-center justify-center text-center transition-all group" onclick="document.getElementById('file-input').click()">
        <div class="w-12 h-12 border border-dashed border-border flex items-center justify-center mb-4 text-accent bg-bg group-hover:border-accent transition-colors">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
        </div>
        <h2 class="hero-display text-2xl sm:text-3xl text-text-primary mb-1">Select PDF to Edit</h2>
        <p class="mono-copy text-xs text-text-secondary mb-6 max-w-md leading-relaxed">Drop any PDF to add text, whiteout typos, draw annotations, fill forms, and insert signatures.</p>
        <button type="button" class="paper-cta-btn group">
          <span class="cta-fill"></span>
          <span class="relative z-10 flex items-center gap-2 mono-copy text-xs uppercase font-medium">
            <span>Choose PDF Document</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </span>
        </button>
      </div>

      <!-- Active Visual Studio Workspace -->
      <div id="editor-workspace" style="display: none;" class="border border-dashed border-border bg-bg-elevated">
        <!-- Top Floating Blueprint Toolbar -->
        <div class="editor-main-toolbar border-b border-dashed border-border p-2 sm:p-3 bg-bg flex flex-wrap items-center justify-between gap-2">
          <!-- Tool Selector Buttons -->
          <div class="flex items-center gap-1 flex-wrap">
            <button type="button" class="editor-tool-btn active mono-copy" data-tool="select" onclick="window.setEditorTool('select')" title="Select & Move (V)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="m13 13 6 6"/></svg>
              <span>Select</span>
            </button>
            <button type="button" class="editor-tool-btn mono-copy" data-tool="text" onclick="window.setEditorTool('text')" title="Add Text (T)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" x2="15" y1="20" y2="20"/><line x1="12" x2="12" y1="4" y2="20"/></svg>
              <span>Text</span>
            </button>
            <button type="button" class="editor-tool-btn mono-copy" data-tool="whiteout" onclick="window.setEditorTool('whiteout')" title="Whiteout Eraser (E)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="14" x="3" y="5" rx="2"/><path d="M3 10h18"/></svg>
              <span>Whiteout</span>
            </button>
            <button type="button" class="editor-tool-btn mono-copy" data-tool="draw" onclick="window.setEditorTool('draw')" title="Pen Draw (P)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/></svg>
              <span>Pen</span>
            </button>
            <button type="button" class="editor-tool-btn mono-copy" data-tool="highlight" onclick="window.setEditorTool('highlight')" title="Highlighter (H)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 11-6 6v3h3l6-6"/><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"/></svg>
              <span>Highlight</span>
            </button>
            <button type="button" class="editor-tool-btn mono-copy" data-tool="shape" onclick="window.setEditorTool('shape')" title="Rectangle / Shape">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/></svg>
              <span>Shape</span>
            </button>
            <button type="button" class="editor-tool-btn mono-copy" data-tool="checkmark" onclick="window.setEditorTool('checkmark')" title="Add Checkmark ✓">
              <span style="color: #16a34a; font-weight: bold;">✓</span>
              <span>Check</span>
            </button>
            <button type="button" class="editor-tool-btn mono-copy" data-tool="crossmark" onclick="window.setEditorTool('crossmark')" title="Add Crossmark ✗">
              <span style="color: #dc2626; font-weight: bold;">✗</span>
              <span>Cross</span>
            </button>
            <button type="button" class="editor-tool-btn mono-copy" data-tool="image" onclick="document.getElementById('editor-image-upload-input').click()" title="Insert Image / Logo (or press Ctrl+V to paste)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
              <span>Image</span>
            </button>
            <input type="file" id="editor-image-upload-input" accept="image/png,image/jpeg,image/webp" style="display: none;" onchange="window.handleEditorImageUpload(event)" />
          </div>

          <!-- Stamps & Signature Actions -->
          <div class="flex items-center gap-1 flex-wrap">
            <button type="button" class="editor-tool-btn mono-copy" onclick="window.insertSignatureStamp()" title="Insert Signature">
              <span>✍️ Signature</span>
            </button>
            <div class="relative group/stamp" style="position: relative;">
              <button type="button" class="editor-tool-btn mono-copy" onclick="const m = document.getElementById('stamp-dropdown-menu'); if(m) m.classList.toggle('open');">
                <span>🏷️ Stamp ▾</span>
              </button>
              <div id="stamp-dropdown-menu" class="stamp-dropdown-menu">
                <button type="button" onclick="window.insertStamp('APPROVED', '#16a34a'); this.parentElement.classList.remove('open');">✅ APPROVED</button>
                <button type="button" onclick="window.insertStamp('CONFIDENTIAL', '#dc2626'); this.parentElement.classList.remove('open');">🔒 CONFIDENTIAL</button>
                <button type="button" onclick="window.insertStamp('DRAFT', '#d97706'); this.parentElement.classList.remove('open');">📝 DRAFT</button>
                <button type="button" onclick="window.insertStamp('PAID', '#2563eb'); this.parentElement.classList.remove('open');">💳 PAID</button>
                <button type="button" onclick="window.insertStamp('VOID', '#64748b'); this.parentElement.classList.remove('open');">⛔ VOID</button>
                <button type="button" onclick="window.insertDateStamp(); this.parentElement.classList.remove('open');">📅 TODAY'S DATE</button>
              </div>
            </div>
            <div style="height: 18px; width: 1px; background: var(--border); margin: 0 0.25rem;"></div>
            <button type="button" class="editor-action-icon-btn" onclick="window.undoEditor()" title="Undo (Ctrl+Z)">↺</button>
            <button type="button" class="editor-action-icon-btn" onclick="window.redoEditor()" title="Redo (Ctrl+Y)">↻</button>
            <button type="button" class="editor-action-icon-btn text-danger" id="editor-delete-selected-btn" style="display: none;" onclick="window.deleteSelectedAnnotation()" title="Delete Item">🗑️</button>
          </div>
        </div>

        <!-- Secondary Contextual Toolbar (Text & Formatting Controls) -->
        <div id="editor-text-controls" class="border-b border-dashed border-border p-2 bg-bg-elevated flex items-center gap-3 flex-wrap text-xs mono-copy" style="display: none;">
          <div class="flex items-center gap-1">
            <span>Font:</span>
            <select id="editor-font-family" class="select-control text-xs" onchange="window.setEditorFontFamily(this.value)">
              <option value="Helvetica" selected>Helvetica</option>
              <option value="TimesRoman">Times Roman</option>
              <option value="Courier">Courier</option>
              <option value="JetBrainsMono">JetBrains Mono</option>
            </select>
          </div>
          <div class="flex items-center gap-1">
            <span>Size:</span>
            <select id="editor-font-size" class="select-control text-xs" onchange="window.setEditorFontSize(this.value)">
              <option value="12">12px</option>
              <option value="14">14px</option>
              <option value="16" selected>16px</option>
              <option value="20">20px</option>
              <option value="24">24px</option>
              <option value="32">32px</option>
            </select>
          </div>
          <div class="flex items-center gap-1">
            <button type="button" class="editor-fmt-btn" onclick="window.toggleEditorBold()"><b>B</b></button>
            <button type="button" class="editor-fmt-btn" onclick="window.toggleEditorItalic()"><i>I</i></button>
          </div>
          <div class="flex items-center gap-1">
            <span>Color:</span>
            <button type="button" class="editor-swatch-btn" style="background:#0f172a;" onclick="window.setEditorTextColor('#0f172a')"></button>
            <button type="button" class="editor-swatch-btn" style="background:#1d4ed8;" onclick="window.setEditorTextColor('#1d4ed8')"></button>
            <button type="button" class="editor-swatch-btn" style="background:#dc2626;" onclick="window.setEditorTextColor('#dc2626')"></button>
            <button type="button" class="editor-swatch-btn" style="background:#16a34a;" onclick="window.setEditorTextColor('#16a34a')"></button>
          </div>
          <div class="flex items-center gap-1">
            <span>Background:</span>
            <button type="button" class="editor-bg-btn active" onclick="window.setEditorTextBg('transparent')">None</button>
            <button type="button" class="editor-bg-btn" style="background:#ffffff; color:#0f172a;" onclick="window.setEditorTextBg('#ffffff')">White</button>
            <button type="button" class="editor-bg-btn" style="background:#fef08a; color:#0f172a;" onclick="window.setEditorTextBg('#fef08a')">Yellow</button>
          </div>
        </div>

        <!-- Contextual Whiteout Controls (Paper-Tone Match & Redact-and-Replace) -->
        <div id="editor-whiteout-controls" class="border-b border-dashed border-border p-2 bg-bg-elevated flex items-center gap-3 flex-wrap text-xs mono-copy" style="display: none;">
          <span class="text-accent font-semibold">[ Whiteout Tone ]:</span>
          <div class="flex items-center gap-1.5">
            <button type="button" class="editor-bg-btn active" id="btn-wo-white" onclick="window.setEditorWhiteoutColor('#ffffff')">⬜ White (#fff)</button>
            <button type="button" class="editor-bg-btn" id="btn-wo-cream" style="background:#fdfbf7; color:#0f172a; border-color:#e2e8f0;" onclick="window.setEditorWhiteoutColor('#fdfbf7')">📜 Cream</button>
            <button type="button" class="editor-bg-btn" id="btn-wo-black" style="background:#09090b; color:#ffffff;" onclick="window.setEditorWhiteoutColor('#09090b')">⬛ Redact Black</button>
            <input type="color" id="editor-whiteout-custom-color" value="#ffffff" onchange="window.setEditorWhiteoutColor(this.value)" class="cursor-pointer" style="width:24px; height:22px; padding:0; border:1px solid var(--border); border-radius:3px;" title="Custom Tone" />
          </div>
          <div style="height: 16px; width: 1px; background: var(--border);"></div>
          <button type="button" class="mono-copy" onclick="window.redactAndTypeOverSelected()" style="padding: 0.25rem 0.65rem; border: 1px dashed var(--accent); background: rgba(123, 97, 255, 0.12); color: var(--accent); font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 0.35rem;" title="Mask area and type replacement text directly on top">
            <span>✍️ Redact & Type Over</span>
          </button>
        </div>

        <!-- Studio Body (Thumbnails Sidebar + Canvas Viewport) -->
        <div class="editor-body-grid" style="display: flex; min-height: 580px; position: relative;">
          <!-- Left Sidebar: Page Thumbnails -->
          <div class="editor-sidebar-thumbnails border-r border-dashed border-border bg-bg p-3" id="editor-thumbnails-container" style="width: 130px; flex-shrink: 0; overflow-y: auto; max-height: 680px;"></div>

          <!-- Main Interactive Viewport -->
          <div class="editor-canvas-viewport p-4 sm:p-6 flex-1 flex flex-col items-center justify-start overflow-auto bg-bg-elevated" id="editor-canvas-viewport" style="max-height: 680px; position: relative;">
            <div class="editor-stage-wrapper" id="editor-stage-wrapper" style="position: relative; box-shadow: 0 4px 20px rgba(0,0,0,0.15); display: inline-block;">
              <!-- Base PDF Render Canvas (HiDPI) -->
              <canvas id="editor-pdf-canvas" style="display: block; background: #ffffff;"></canvas>
              <!-- Freehand Drawing Canvas -->
              <canvas id="editor-draw-canvas" style="position: absolute; inset: 0; pointer-events: none;"></canvas>
              <!-- Interactive SVG/HTML Overlay for Annotations, Text Boxes & Stamps -->
              <div id="editor-annotation-overlay" class="editor-annotation-overlay" onmousedown="window.handleOverlayCanvasMouseDown(event)"></div>
            </div>
          </div>
        </div>

        <!-- Bottom Status & Export Bar -->
        <div class="editor-footer-bar border-t border-dashed border-border p-3 bg-bg flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-3 mono-copy text-xs">
            <div class="flex items-center gap-1">
              <button type="button" class="editor-page-nav-btn" onclick="window.prevEditorPage()">◀ Prev</button>
              <span>Page <span id="editor-cur-page">1</span> of <span id="editor-total-pages">1</span></span>
              <button type="button" class="editor-page-nav-btn" onclick="window.nextEditorPage()">Next ▶</button>
            </div>
            <div style="height: 14px; width: 1px; background: var(--border);"></div>
            <div class="flex items-center gap-1">
              <button type="button" class="editor-action-icon-btn" onclick="window.zoomEditor(-0.15)">−</button>
              <span id="editor-zoom-label">100%</span>
              <button type="button" class="editor-action-icon-btn" onclick="window.zoomEditor(0.15)">+</button>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <button type="button" class="mono-copy" onclick="document.getElementById('file-input').click()" style="padding: 0.4rem 0.8rem; border: 1px dashed var(--border); background: transparent; color: var(--text-secondary); font-size: 0.75rem; cursor: pointer;">
              Change PDF
            </button>
            <button type="button" class="paper-cta-btn group" id="editor-export-btn" onclick="window.exportEditedPdf()">
              <span class="cta-fill"></span>
              <span class="relative z-10 flex items-center gap-2 mono-copy" style="font-size: 0.78rem; text-transform: uppercase; font-weight: 600;">
                <span>Download Edited PDF</span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}
