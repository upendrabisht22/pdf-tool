/**
 * @file modules/file-staging.js
 * @description File ingestion, staging area management, drag-reorder,
 * and visual per-page rotation grid for the document workspace.
 */

import { TOOL_DEFINITIONS, getClientToolContract } from './tool-registry.js';
import { detectFileType } from './utils.js';
import { initPdfEditorStudio } from './pdf-editor-studio.js';

// ── Module State ────────────────────────────────────────────────────────────
let stagedFiles = [];
let perPageRotations = {};
let activeTool = 'merge-pdf';

/** @returns {Array} Current staged files */
export function getStagedFiles() { return stagedFiles; }

/** @param {Array} files */
export function setStagedFiles(files) { stagedFiles = files; }

/** @returns {Object} Current per-page rotation map */
export function getPerPageRotations() { return perPageRotations; }

/** @param {Object} rotations */
export function setPerPageRotations(rotations) { perPageRotations = rotations; }

/** @returns {string} Current active tool key */
export function getActiveTool() { return activeTool; }

/** @param {string} tool */
export function setActiveTool(tool) { activeTool = tool; }

/**
 * Reset staging state to empty.
 */
export function clearStagingState() {
  stagedFiles = [];
  perPageRotations = {};
}

/**
 * Handles files selected via drag-drop or file picker.
 * Validates formats based on current tool contract and stages valid files.
 *
 * @param {FileList|File[]} files - Files to ingest
 * @param {boolean} isAppend - Whether to append to existing staged files
 * @param {Function} onStaged - Callback after files are staged, receives (stagedFiles)
 */
export async function handleFilesSelected(files, isAppend = false, onStaged = null) {
  const contract = getClientToolContract(activeTool);
  if (!contract.requiresInputFile) {
    console.warn(`Tool "${activeTool}" is a document generator and does not accept file uploads.`);
    return;
  }

  const validFiles = [];

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const detected = detectFileType(file, bytes);

    let isValid = false;
    if (contract.inputType === 'image') {
      isValid = ['png', 'jpeg', 'webp'].includes(detected);
    } else if (contract.inputType === 'markdown') {
      isValid = ['markdown', 'unknown'].includes(detected) || file.name.endsWith('.md') || file.name.endsWith('.txt');
    } else if (contract.inputType === 'office') {
      isValid = ['docx', 'office-legacy', 'pdf'].includes(detected);
    } else if (contract.inputType === 'pdf-or-image') {
      isValid = (detected === 'pdf') || ['png', 'jpeg', 'webp'].includes(detected);
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
        detectedFormat: detected === 'markdown' ? 'markdown' : detected
      });
    } else {
      const expectedType = contract.inputType === 'image' ? 'Image (JPG, PNG, WebP)' :
                           contract.inputType === 'markdown' ? 'Markdown file (.md, .txt)' :
                           contract.inputType === 'office' ? 'Office document (Word, Excel, PPT)' :
                           contract.inputType === 'pdf-or-image' ? 'PDF or Image' : 'PDF document';
      alert(`File "${file.name}" was rejected. Please select a valid ${expectedType}.`);
    }
  }

  if (isAppend) {
    stagedFiles.push(...validFiles);
  } else {
    stagedFiles = TOOL_DEFINITIONS[activeTool].multiple ? validFiles : validFiles.slice(0, activeTool === 'compare-pdf' ? 2 : 1);
  }

  if (stagedFiles.length > 0) {
    if (contract.mode === 'editor') {
      const editorStudio = document.getElementById('pdf-editor-studio');
      const uploadGate = document.getElementById('editor-upload-gate');
      const workspace = document.getElementById('editor-workspace');
      if (editorStudio) editorStudio.style.display = 'block';
      if (uploadGate) uploadGate.style.display = 'none';
      if (workspace) workspace.style.display = 'block';
      const mainDropzone = document.getElementById('dropzone');
      const stagingArea = document.getElementById('staging-area');
      if (mainDropzone) mainDropzone.style.display = 'none';
      if (stagingArea) stagingArea.style.display = 'none';
      await initPdfEditorStudio(stagedFiles[0].bytes);
      return;
    }
    const dz = document.getElementById('dropzone');
    if (dz) dz.style.display = 'none';
    const sa = document.getElementById('staging-area');
    if (sa) sa.style.display = 'block';
    await renderFileList();
  }

  if (typeof onStaged === 'function') {
    onStaged(stagedFiles);
  }
}

/**
 * Renders the file list in the staging area, including per-page rotation
 * controls for rotate-pdf tool.
 */
export async function renderFileList() {
  const container = document.getElementById('files-grid');
  if (!container) return;
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
      <button class="file-card-remove" onclick="window.removeStagedFile(${index})">✕</button>
    `;
    container.appendChild(card);
  });

  // Visual page rotation grid for rotate-pdf
  if (activeTool === 'rotate-pdf' && stagedFiles.length === 1 && typeof window.PDFLib !== 'undefined') {
    try {
      const doc = await window.PDFLib.PDFDocument.load(stagedFiles[0].bytes.slice(0));
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
              <button type="button" class="select-control" style="padding: 0.3rem 0.75rem; font-size: 0.8rem; cursor: pointer;" onclick="window.rotateAllVisualPages(90)">🔄 Rotate All +90°</button>
              <button type="button" class="select-control" style="padding: 0.3rem 0.75rem; font-size: 0.8rem; cursor: pointer;" onclick="window.resetAllVisualRotations()">↺ Reset</button>
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
            <button type="button" class="select-control" style="width: 100%; padding: 0.35rem 0.4rem; font-size: 0.78rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.25rem;" onclick="window.rotateSingleVisualPage(${i}, 90)">
              🔄 Rotate 90°
            </button>
          </div>
        `;
      }
      pagesHtml += `</div></div>`;
      rotateContainer.innerHTML = pagesHtml;
      container.appendChild(rotateContainer);
    } catch {
      // Best-effort visual preview
    }
  }

  // Live visual preview for crop-pdf — triggers external crop preview module
  if (activeTool === 'crop-pdf' && stagedFiles.length === 1) {
    try {
      if (typeof window._renderLiveCropPreview === 'function') {
        await window._renderLiveCropPreview(container);
      }
    } catch (cropPreviewErr) {
      console.warn('Could not render live crop preview:', cropPreviewErr);
    }
  }

  const addMoreBtn = document.getElementById('add-more-btn');
  if (addMoreBtn) {
    addMoreBtn.style.display = TOOL_DEFINITIONS[activeTool].multiple ? 'inline-flex' : 'none';
  }
}

/**
 * Rotate a single page's visual preview by the given degrees.
 */
export function rotateSingleVisualPage(pageIndex, deg = 90) {
  perPageRotations[pageIndex] = ((perPageRotations[pageIndex] || 0) + deg) % 360;
  const newRot = perPageRotations[pageIndex];
  const box = document.getElementById(`page-preview-box-${pageIndex}`);
  const angleBadge = document.getElementById(`page-angle-${pageIndex}`);
  if (box) box.style.transform = `rotate(${newRot}deg)`;
  if (angleBadge) angleBadge.textContent = `${newRot}°`;
}

/**
 * Rotate all visual page previews by the given degrees.
 */
export function rotateAllVisualPages(deg = 90) {
  const cards = document.querySelectorAll('[id^="page-preview-box-"]');
  cards.forEach((_, i) => {
    rotateSingleVisualPage(i, deg);
  });
}

/**
 * Reset all page rotation previews to 0°.
 */
export function resetAllVisualRotations() {
  perPageRotations = {};
  renderFileList();
}

/**
 * Remove a single staged file by index.
 * @param {number} index - Index of file to remove
 * @param {Function} onEmpty - Callback when all files are removed
 */
export function removeStagedFile(index, onEmpty = null) {
  stagedFiles.splice(index, 1);
  perPageRotations = {};
  if (stagedFiles.length === 0) {
    if (typeof onEmpty === 'function') onEmpty();
    else if (typeof window.resetWorkspace === 'function') window.resetWorkspace();
  } else {
    renderFileList();
  }
}
