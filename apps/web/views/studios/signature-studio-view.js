/**
 * @file views/studios/signature-studio-view.js
 * @description In-browser signature canvas & photo compression studio view.
 */

/**
 * Renders the Signature Studio HTML component.
 * @param {Object} options
 * @param {string} [options.studioId] - Active studio identifier
 * @returns {string} HTML markup
 */
export function renderSignatureStudioView({ studioId }) {
  const isVisible = studioId === 'signature-studio';
  return `
    <!-- Dedicated Signature Creator Studio -->
    <div id="signature-studio" style="display: ${isVisible ? 'block' : 'none'}; padding: 0.5rem 0;">
      <div style="display: flex; gap: 0.5rem; margin-bottom: 1.25rem; border-bottom: 1px dashed var(--border); padding-bottom: 0.75rem;">
        <button type="button" id="sig-tab-draw" class="mono-copy active" onclick="switchSignatureTab('draw')" style="padding: 0.4rem 0.85rem; border: 1px solid #7b61ff; background: rgba(123, 97, 255, 0.1); color: #7b61ff; font-size: 0.75rem; cursor: pointer;">✍️ Draw Signature on Screen</button>
        <button type="button" id="sig-tab-upload" class="mono-copy" onclick="switchSignatureTab('upload')" style="padding: 0.4rem 0.85rem; border: 1px dashed var(--border); background: var(--bg-elevated); color: var(--text-secondary); font-size: 0.75rem; cursor: pointer;">📁 Upload & Compress Photo</button>
      </div>

      <!-- Draw Mode Sub-view -->
      <div id="sig-draw-view">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; flex-wrap: wrap; gap: 0.5rem;">
          <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem;" class="mono-copy text-text-secondary">
            <span>Ink Color:</span>
            <button type="button" class="sig-color-btn" onclick="setSignatureInk('#0f172a')" style="width: 20px; height: 20px; border-radius: 50%; background: #0f172a; border: 2px solid #7b61ff; cursor: pointer;"></button>
            <button type="button" class="sig-color-btn" onclick="setSignatureInk('#1d4ed8')" style="width: 20px; height: 20px; border-radius: 50%; background: #1d4ed8; border: 2px solid transparent; cursor: pointer;"></button>
            <button type="button" class="sig-color-btn" onclick="setSignatureInk('#047857')" style="width: 20px; height: 20px; border-radius: 50%; background: #047857; border: 2px solid transparent; cursor: pointer;"></button>
          </div>
          <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem;" class="mono-copy text-text-secondary">
            <span>Stroke:</span>
            <select id="sig-studio-stroke" onchange="setSignatureStroke(this.value)" class="mono-copy select-control" style="background: var(--bg-elevated); border: 1px solid var(--border); color: var(--text-primary); padding: 0.25rem 0.5rem; font-size: 0.75rem;">
              <option value="2">Fine (2px)</option>
              <option value="3" selected>Standard (3px)</option>
              <option value="4.5">Bold (4.5px)</option>
            </select>
          </div>
        </div>

        <!-- In-Page Canvas -->
        <div style="border: 1px dashed var(--border); background: #ffffff; margin-bottom: 1rem; overflow: hidden; position: relative;">
          <canvas id="sig-studio-canvas" width="600" height="200" style="touch-action: none; cursor: crosshair; display: block; width: 100%; height: 200px; background: #ffffff;"></canvas>
        </div>

        <!-- Optimization Preset Grid -->
        <div style="background: var(--bg-elevated); border: 1px dashed var(--border); padding: 1rem; margin-bottom: 1.25rem; display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div>
            <label class="mono-copy" style="font-size: 0.7rem; font-weight: 700; color: var(--text-muted); display: block; margin-bottom: 0.35rem; text-transform: uppercase;">TARGET FILE SIZE</label>
            <select id="sig-studio-maxkb" class="mono-copy select-control" style="width: 100%; background: var(--bg); border: 1px solid var(--border); color: var(--text-primary); padding: 0.35rem 0.5rem; font-size: 0.75rem;">
              <option value="30" selected>&lt; 30 KB (Defense / UPSC Standard)</option>
              <option value="20">&lt; 20 KB (Strict Govt Form)</option>
              <option value="50">&lt; 50 KB (SSC / Banking)</option>
              <option value="0">Original Resolution</option>
            </select>
          </div>
          <div>
            <label class="mono-copy" style="font-size: 0.7rem; font-weight: 700; color: var(--text-muted); display: block; margin-bottom: 0.35rem; text-transform: uppercase;">IMAGE FORMAT</label>
            <select id="sig-studio-format" class="mono-copy select-control" style="width: 100%; background: var(--bg); border: 1px solid var(--border); color: var(--text-primary); padding: 0.35rem 0.5rem; font-size: 0.75rem;">
              <option value="jpeg" selected>JPG (Crisp White Background)</option>
              <option value="png">PNG (Transparent / Lossless)</option>
              <option value="webp">WebP (Ultra Compact)</option>
            </select>
          </div>
        </div>

        <!-- Action Buttons -->
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
          <button type="button" class="mono-copy" onclick="clearStudioSignaturePad()" style="cursor: pointer; padding: 0.5rem 1rem; border: 1px dashed var(--border); background: transparent; color: var(--text-secondary); font-size: 0.75rem;">↺ Clear Canvas</button>
          <button type="button" class="paper-cta-btn group" onclick="downloadStudioSignature()">
            <span class="cta-fill"></span>
            <span class="relative z-10 flex items-center gap-2 mono-copy" style="font-size: 0.75rem; text-transform: uppercase;">
              <span>Download Compressed Signature (&lt;30 KB)</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            </span>
          </button>
        </div>
      </div>

      <!-- Upload Mode Sub-view -->
      <div id="sig-upload-view" style="display: none;">
        <div class="dropzone p-8 border border-dashed border-border hover:border-accent bg-bg-elevated cursor-pointer flex flex-col items-center justify-center text-center transition-all group" id="sig-upload-dropzone" onclick="document.getElementById('file-input').click()">
          <div class="w-12 h-12 border border-dashed border-border flex items-center justify-center mb-3 text-accent bg-bg group-hover:border-accent transition-colors">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
          </div>
          <h3 class="hero-display text-xl sm:text-2xl text-text-primary mb-1">Select Signature Photo</h3>
          <p class="mono-copy text-xs text-text-secondary mb-4 max-w-sm">Drop any smartphone photo of your handwritten signature to auto-compress strictly under 30 KB.</p>
          <button type="button" class="paper-cta-btn group">
            <span class="cta-fill"></span>
            <span class="relative z-10 mono-copy text-xs uppercase font-medium">Choose Signature Image</span>
          </button>
        </div>
      </div>
    </div>
  `;
}
