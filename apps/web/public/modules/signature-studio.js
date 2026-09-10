/**
 * DocPlatform Signature Studio Module
 * Handles drawing modal, standalone signature studio, pen controls,
 * image compression under target KB (&lt;30KB for govt portals), and canvas management.
 */

let signatureInkColor = '#0f172a';
let signatureStrokeWidth = 3;

let sigCtx = null;
let isDrawingSig = false;

let studioSigCtx = null;
let isDrawingStudioSig = false;

let uploadedSignatureBytes = null;
let uploadedSignatureType = 'image/png';

/**
 * Returns current signature data payload for stamping on PDFs.
 */
export function getSignatureData() {
  return {
    bytes: uploadedSignatureBytes,
    type: uploadedSignatureType,
    inkColor: signatureInkColor,
    strokeWidth: signatureStrokeWidth
  };
}

/**
 * Directly updates the stored signature bytes and MIME type.
 */
export function setSignatureData(bytes, type = 'image/png') {
  uploadedSignatureBytes = bytes;
  uploadedSignatureType = type;
}

/**
 * Sets active ink color and updates color picker indicators.
 */
export function setSignatureInk(color) {
  signatureInkColor = color;
  if (sigCtx) sigCtx.strokeStyle = color;
  if (studioSigCtx) studioSigCtx.strokeStyle = color;
  document.querySelectorAll('.sig-color-btn').forEach(btn => {
    btn.style.borderColor = btn.style.backgroundColor.includes(color) ? '#3b82f6' : 'transparent';
  });
}

/**
 * Sets active pen stroke width.
 */
export function setSignatureStroke(val) {
  signatureStrokeWidth = parseFloat(val) || 3;
  if (sigCtx) sigCtx.lineWidth = signatureStrokeWidth;
  if (studioSigCtx) studioSigCtx.lineWidth = signatureStrokeWidth;
}

/**
 * Switches between Draw and Upload tabs in the Studio interface.
 */
export function switchSignatureTab(tab) {
  const drawTabBtn = document.getElementById('sig-tab-draw');
  const uploadTabBtn = document.getElementById('sig-tab-upload');
  const drawView = document.getElementById('sig-draw-view');
  const uploadView = document.getElementById('sig-upload-view');

  if (tab === 'draw') {
    if (drawTabBtn) drawTabBtn.classList.add('active');
    if (uploadTabBtn) uploadTabBtn.classList.remove('active');
    if (drawView) drawView.style.display = 'block';
    if (uploadView) uploadView.style.display = 'none';
    setTimeout(initStudioSignatureCanvas, 50);
  } else {
    if (drawTabBtn) drawTabBtn.classList.remove('active');
    if (uploadTabBtn) uploadTabBtn.classList.add('active');
    if (drawView) drawView.style.display = 'none';
    if (uploadView) uploadView.style.display = 'block';
  }
}

/**
 * Initializes drawing events on the modal canvas (#sig-pad-canvas).
 */
export function initSignatureCanvas() {
  const canvas = document.getElementById('sig-pad-canvas');
  if (!canvas) return;
  sigCtx = canvas.getContext('2d');
  sigCtx.strokeStyle = signatureInkColor;
  sigCtx.lineWidth = signatureStrokeWidth;
  sigCtx.lineCap = 'round';
  sigCtx.lineJoin = 'round';

  const startDraw = (e) => {
    isDrawingSig = true;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0].clientX);
    const clientY = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0].clientY);
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    sigCtx.beginPath();
    sigCtx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawingSig) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0].clientX);
    const clientY = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0].clientY);
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    sigCtx.lineTo(x, y);
    sigCtx.stroke();
  };

  const stopDraw = () => {
    isDrawingSig = false;
  };

  canvas.onmousedown = startDraw;
  canvas.onmousemove = draw;
  window.onmouseup = stopDraw;

  canvas.ontouchstart = startDraw;
  canvas.ontouchmove = draw;
  window.ontouchend = stopDraw;
}

/**
 * Clears the modal canvas.
 */
export function clearSignaturePad() {
  const canvas = document.getElementById('sig-pad-canvas');
  if (canvas && sigCtx) {
    sigCtx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

/**
 * Closes the signature modal.
 */
export function closeSignatureDrawModal() {
  const modal = document.getElementById('signature-draw-modal');
  if (modal) modal.style.display = 'none';
}

/**
 * Saves drawn signature from modal and prepares it for PDF stamping.
 */
export async function saveDrawnSignature() {
  const canvas = document.getElementById('sig-pad-canvas');
  if (!canvas) return;

  const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
  const arrayBuffer = await blob.arrayBuffer();
  uploadedSignatureBytes = new Uint8Array(arrayBuffer);
  uploadedSignatureType = 'image/png';

  const badge = document.getElementById('sig-status-badge');
  if (badge) {
    badge.textContent = '✓ Signature Drawn & Ready';
    badge.style.color = '#10b981';
  }

  closeSignatureDrawModal();
}

/**
 * Compresses and downloads the signature drawn in modal according to target KB settings.
 */
export async function downloadDrawnSignature() {
  const canvas = document.getElementById('sig-pad-canvas');
  if (!canvas) return;

  const maxKb = parseInt(document.getElementById('sig-export-maxkb')?.value || '30', 10);
  const format = document.getElementById('sig-export-format')?.value || 'jpeg';

  const targetW = 280;
  const targetH = 120;
  const outCanvas = document.createElement('canvas');
  outCanvas.width = targetW;
  outCanvas.height = targetH;
  const outCtx = outCanvas.getContext('2d');

  if (format === 'jpeg') {
    outCtx.fillStyle = '#ffffff';
    outCtx.fillRect(0, 0, targetW, targetH);
  } else {
    outCtx.clearRect(0, 0, targetW, targetH);
  }

  outCtx.drawImage(canvas, 0, 0, targetW, targetH);

  let mimeType = format === 'jpeg' ? 'image/jpeg' : (format === 'webp' ? 'image/webp' : 'image/png');
  let quality = 0.95;
  let outBlob = await new Promise(res => outCanvas.toBlob(res, mimeType, quality));

  if (maxKb > 0 && outBlob.size > maxKb * 1024 && (format === 'jpeg' || format === 'webp')) {
    while (quality > 0.15 && outBlob.size > maxKb * 1024) {
      quality -= 0.1;
      outBlob = await new Promise(res => outCanvas.toBlob(res, mimeType, quality));
    }
  }

  const ext = format === 'jpeg' ? 'jpg' : format;
  const sizeKb = (outBlob.size / 1024).toFixed(1);
  const filename = `signature_under_${sizeKb}kb.${ext}`;
  const url = URL.createObjectURL(outBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/**
 * Opens signature creator modal for drawing or creating optimized stamps.
 */
export function openSignatureDrawModal() {
  let modal = document.getElementById('signature-draw-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'signature-draw-modal';
    modal.className = 'modal-backdrop';
    modal.style.display = 'flex';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100vw';
    modal.style.height = '100vh';
    modal.style.background = 'rgba(15, 23, 42, 0.75)';
    modal.style.backdropFilter = 'blur(6px)';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.zIndex = '99999';
    modal.innerHTML = `
      <div class="modal-card" style="max-width: 520px; width: 92%; background: var(--bg-card); border-radius: 14px; padding: 1.5rem; text-align: left; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); border: 1px solid var(--border-subtle);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
          <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--text-hero); display: flex; align-items: center; gap: 0.4rem;">
            <span>✍️</span> Signature Creator & Optimizer
          </h3>
          <button type="button" onclick="closeSignatureDrawModal()" style="background: none; border: none; font-size: 1.25rem; cursor: pointer; color: var(--text-secondary);">✕</button>
        </div>
        <p style="font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 1rem;">
          Draw your official signature. Perfect for <strong>Govt Exams, Defense, Banking & Portal Uploads (&lt;30 KB)</strong> or stamping directly onto your PDF.
        </p>

        <!-- Pen Controls -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; flex-wrap: wrap; gap: 0.5rem;">
          <div style="display: flex; align-items: center; gap: 0.4rem; font-size: 0.8rem; font-weight: 600; color: var(--text-secondary);">
            <span>Ink:</span>
            <button type="button" class="sig-color-btn" onclick="setSignatureInk('#0f172a')" style="width: 22px; height: 22px; border-radius: 50%; background: #0f172a; border: 2px solid #3b82f6; cursor: pointer;"></button>
            <button type="button" class="sig-color-btn" onclick="setSignatureInk('#1d4ed8')" style="width: 22px; height: 22px; border-radius: 50%; background: #1d4ed8; border: 2px solid transparent; cursor: pointer;"></button>
            <button type="button" class="sig-color-btn" onclick="setSignatureInk('#047857')" style="width: 22px; height: 22px; border-radius: 50%; background: #047857; border: 2px solid transparent; cursor: pointer;"></button>
          </div>
          <div style="display: flex; align-items: center; gap: 0.4rem; font-size: 0.8rem; font-weight: 600; color: var(--text-secondary);">
            <span>Stroke:</span>
            <select id="sig-stroke-width" onchange="setSignatureStroke(this.value)" class="select-control" style="padding: 0.2rem 0.5rem; font-size: 0.78rem;">
              <option value="2">Fine (2px)</option>
              <option value="3" selected>Standard (3px)</option>
              <option value="4.5">Bold (4.5px)</option>
            </select>
          </div>
        </div>

        <!-- Canvas Area -->
        <div style="border: 2px dashed var(--border-subtle); border-radius: 10px; background: #ffffff; margin-bottom: 0.85rem; overflow: hidden; position: relative;">
          <canvas id="sig-pad-canvas" width="460" height="150" style="touch-action: none; cursor: crosshair; display: block; width: 100%; height: 150px; background: #ffffff;"></canvas>
        </div>

        <!-- Exam & Size Optimization Controls -->
        <div style="background: var(--bg-subtle); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 0.75rem; margin-bottom: 1rem; display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem;">
          <div>
            <label style="font-size: 0.72rem; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 0.2rem;">TARGET FILE SIZE</label>
            <select id="sig-export-maxkb" class="select-control" style="width: 100%; font-size: 0.8rem; padding: 0.35rem 0.5rem;">
              <option value="20">&lt; 20 KB (Strict Govt Form)</option>
              <option value="30" selected>&lt; 30 KB (Standard Defense/UPSC)</option>
              <option value="50">&lt; 50 KB (SSC / Banking)</option>
              <option value="0">Original Resolution</option>
            </select>
          </div>
          <div>
            <label style="font-size: 0.72rem; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 0.2rem;">IMAGE FORMAT</label>
            <select id="sig-export-format" class="select-control" style="width: 100%; font-size: 0.8rem; padding: 0.35rem 0.5rem;">
              <option value="png">PNG (Transparent / Lossless)</option>
              <option value="jpeg" selected>JPG (Clean White BG)</option>
              <option value="webp">WebP (Ultra Compact)</option>
            </select>
          </div>
        </div>

        <!-- Action Buttons -->
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.6rem;">
          <button type="button" class="select-control" onclick="clearSignaturePad()" style="cursor: pointer; padding: 0.45rem 0.85rem; font-size: 0.82rem;">↺ Clear</button>
          
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            <button type="button" class="select-control" onclick="downloadDrawnSignature()" style="cursor: pointer; padding: 0.45rem 0.9rem; font-size: 0.82rem; font-weight: 700; color: var(--brand-primary); background: var(--bg-card); border: 1px solid var(--brand-primary);" title="Download image under 30KB directly to your phone/PC">
              📥 Download &lt;30KB Image
            </button>
            <button type="button" class="process-btn" onclick="saveDrawnSignature()" style="padding: 0.45rem 1.15rem; font-size: 0.82rem; cursor: pointer;">
              ✓ Apply to PDF
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  } else {
    modal.style.display = 'flex';
  }

  initSignatureCanvas();
}

/**
 * Initializes drawing events on the full studio canvas (#sig-studio-canvas).
 */
export function initStudioSignatureCanvas() {
  const canvas = document.getElementById('sig-studio-canvas');
  if (!canvas) return;
  studioSigCtx = canvas.getContext('2d');
  studioSigCtx.strokeStyle = signatureInkColor;
  studioSigCtx.lineWidth = signatureStrokeWidth;
  studioSigCtx.lineCap = 'round';
  studioSigCtx.lineJoin = 'round';

  const startDraw = (e) => {
    isDrawingStudioSig = true;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0].clientX);
    const clientY = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0].clientY);
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    studioSigCtx.beginPath();
    studioSigCtx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawingStudioSig) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0].clientX);
    const clientY = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0].clientY);
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    studioSigCtx.lineTo(x, y);
    studioSigCtx.stroke();
  };

  const stopDraw = () => {
    isDrawingStudioSig = false;
  };

  canvas.onmousedown = startDraw;
  canvas.onmousemove = draw;
  window.onmouseup = stopDraw;

  canvas.ontouchstart = startDraw;
  canvas.ontouchmove = draw;
  window.ontouchend = stopDraw;
}

/**
 * Clears the studio canvas.
 */
export function clearStudioSignaturePad() {
  const canvas = document.getElementById('sig-studio-canvas');
  if (canvas && studioSigCtx) {
    studioSigCtx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

/**
 * Downloads the signature drawn on the studio canvas.
 */
export async function downloadStudioSignature() {
  const canvas = document.getElementById('sig-studio-canvas');
  if (!canvas) return;

  const maxKb = parseInt(document.getElementById('sig-studio-maxkb')?.value || '30', 10);
  const format = document.getElementById('sig-studio-format')?.value || 'jpeg';

  const targetW = 280;
  const targetH = 120;
  const outCanvas = document.createElement('canvas');
  outCanvas.width = targetW;
  outCanvas.height = targetH;
  const outCtx = outCanvas.getContext('2d');

  if (format === 'jpeg') {
    outCtx.fillStyle = '#ffffff';
    outCtx.fillRect(0, 0, targetW, targetH);
  } else {
    outCtx.clearRect(0, 0, targetW, targetH);
  }

  outCtx.drawImage(canvas, 0, 0, targetW, targetH);

  let mimeType = format === 'jpeg' ? 'image/jpeg' : (format === 'webp' ? 'image/webp' : 'image/png');
  let quality = 0.95;
  let outBlob = await new Promise(res => outCanvas.toBlob(res, mimeType, quality));

  if (maxKb > 0 && outBlob.size > maxKb * 1024 && (format === 'jpeg' || format === 'webp')) {
    while (quality > 0.15 && outBlob.size > maxKb * 1024) {
      quality -= 0.1;
      outBlob = await new Promise(res => outCanvas.toBlob(res, mimeType, quality));
    }
  }

  const ext = format === 'jpeg' ? 'jpg' : format;
  const sizeKb = (outBlob.size / 1024).toFixed(1);
  const filename = `signature_under_${sizeKb}kb.${ext}`;
  const url = URL.createObjectURL(outBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/**
 * Handles uploading an external signature image (PNG, JPG, WebP).
 */
export async function handleSignatureUpload(file) {
  if (!file) return;
  const buffer = await file.arrayBuffer();
  uploadedSignatureBytes = new Uint8Array(buffer);
  uploadedSignatureType = file.type || 'image/png';

  const preview = document.getElementById('sig-upload-preview');
  if (preview) {
    preview.src = URL.createObjectURL(file);
    preview.style.display = 'block';
  }
  const badge = document.getElementById('sig-status-badge');
  if (badge) {
    badge.textContent = `✓ Loaded: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
    badge.style.color = '#10b981';
  }
}

// CommonJS fallback
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
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
  };
}
