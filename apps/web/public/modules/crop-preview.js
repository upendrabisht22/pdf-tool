/**
 * @file modules/crop-preview.js
 * @description Interactive visual crop and margins preview for crop-pdf and resize-pdf.
 *
 * Renders page 1 on an HTML5 canvas with dynamic shaded overlays showing
 * cropped margins or target page dimensions in real-time.
 */

import { getStagedFiles } from './file-staging.js';

let cropPdfDoc = null;
let cropPageViewport = null;
let cropPageOrigWidth = 595.28;
let cropPageOrigHeight = 841.89;

/**
 * Renders page 1 of the staged PDF with an interactive crop overlay.
 * @param {HTMLElement} container - Parent element to append crop preview UI into
 * @param {Array|null} [stagedFilesParam=null] - Optional staged files override
 */
export async function renderLiveCropPreview(container, stagedFilesParam = null) {
  const pdfjs = window.pdfjsLib || window['pdfjs-dist/build/pdf'];
  const files = stagedFilesParam || getStagedFiles();
  if (!pdfjs || !files[0] || !files[0].bytes) return;

  let cropSection = document.getElementById('crop-live-preview-section');
  if (!cropSection) {
    cropSection = document.createElement('div');
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
  }

  try {
    const loadingTask = pdfjs.getDocument({ data: files[0].bytes.slice(0) });
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

/**
 * Attaches event listeners to crop dimension input elements.
 */
export function attachCropInputsListeners() {
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

/**
 * Dynamically re-calculates and positions shaded overlay regions on the canvas.
 */
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

/**
 * Apply a preset trim in mm to the crop inputs.
 */
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

/**
 * Switch between 'trim' and 'resize' modes.
 */
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

// Auto-bind for internal staging preview hook
if (typeof window !== 'undefined') {
  window._renderLiveCropPreview = renderLiveCropPreview;
}
