/**
 * @file modules/pdf-editor-studio.js
 * @description In-Browser Visual PDF Editor & Form Filler.
 * Zero-server-upload visual editing powered by PDF.js and PDFLib:
 * - Text insertion with custom font, size, style, color & background
 * - Whiteout eraser for correcting mistakes and redacting text
 * - Freehand pen & translucent fluorescent highlighter
 * - Vector shapes (rectangle, circle, arrow, line)
 * - Form fill marks (checkmarks ✓, crossmarks ✗, date stamps)
 * - Signature stamp placement with drag & drop handles
 * - Clean vector PDF export preserving original document fidelity
 */

import { getSignatureData, openSignatureDrawModal } from './signature-studio.js';

// ── State Management ────────────────────────────────────────────────────────
let editorPdfDoc = null;
let editorPdfBytes = null;
let currentPageNum = 1;
let totalPages = 1;
let currentZoom = 1.0;
let activeEditorTool = 'select'; // 'select' | 'text' | 'whiteout' | 'draw' | 'highlight' | 'shape' | 'checkmark' | 'crossmark' | 'stamp' | 'signature'

// Style Settings
let activeTextColor = '#0f172a';
let activeTextBg = 'transparent';
let activeFontSize = 16;
let activeFontFamily = 'Helvetica'; // 'Helvetica' | 'TimesRoman' | 'Courier'
let isTextBold = false;
let isTextItalic = false;
let activeStrokeColor = '#0f172a';
let activeStrokeWidth = 2;
let activeHighlightColor = 'rgba(254, 240, 138, 0.45)'; // Neon yellow translucent
let activeShapeType = 'rectangle';
let activeWhiteoutColor = '#ffffff';
let clipboardAnnotation = null;
let isKeyboardPasteInitialized = false;

// Annotations stored per page: { [pageIndex: number]: Array<Annotation> }
let pageAnnotations = {};
let historyStack = [];
let redoStack = [];
let selectedAnnotationId = null;

// Drawing in progress
let isDrawingStroke = false;
let currentStrokePoints = [];

// Dragging / Moving
let isDraggingItem = false;
let dragStartX = 0;
let dragStartY = 0;
let itemStartX = 0;
let itemStartY = 0;

/**
 * Initializes the Visual PDF Editor Studio with file bytes.
 * @param {Uint8Array|ArrayBuffer} pdfBytes
 */
export async function initPdfEditorStudio(pdfBytes) {
  if (!pdfBytes) return;
  editorPdfBytes = pdfBytes instanceof Uint8Array ? pdfBytes : new Uint8Array(pdfBytes);

  const pdfjs = window.pdfjsLib || window['pdfjs-dist/build/pdf'];
  if (!pdfjs) {
    console.error('PDF.js not loaded');
    return;
  }

  try {
    const loadingTask = pdfjs.getDocument({ data: editorPdfBytes.slice(0) });
    editorPdfDoc = await loadingTask.promise;
    totalPages = editorPdfDoc.numPages;
    currentPageNum = 1;
    pageAnnotations = {};
    historyStack = [];
    redoStack = [];
    selectedAnnotationId = null;

    renderThumbnailsList();
    await renderEditorPage(currentPageNum);
    updateEditorNavigationUI();
    setEditorTool('select');
    setupEditorKeyboardAndPaste();
  } catch (err) {
    console.error('Failed to load document into Visual PDF Editor:', err);
    alert('Unable to load document into Visual PDF Editor. Please ensure it is a valid PDF.');
  }
}

/**
 * Renders the left sidebar thumbnails for multi-page jump.
 */
function renderThumbnailsList() {
  const container = document.getElementById('editor-thumbnails-container');
  if (!container || !editorPdfDoc) return;

  container.innerHTML = '';
  for (let i = 1; i <= totalPages; i++) {
    const thumbItem = document.createElement('div');
    thumbItem.className = `editor-thumb-item ${i === currentPageNum ? 'active' : ''}`;
    thumbItem.dataset.page = i;
    thumbItem.onclick = () => switchEditorPage(i);

    const canvas = document.createElement('canvas');
    canvas.className = 'editor-thumb-canvas';
    canvas.id = `editor-thumb-${i}`;
    thumbItem.appendChild(canvas);

    const label = document.createElement('div');
    label.className = 'editor-thumb-label mono-copy';
    label.textContent = `Page ${i}`;
    thumbItem.appendChild(label);

    container.appendChild(thumbItem);

    // Render low-res thumbnail asynchronously
    renderThumbnailPage(i, canvas);
  }
}

async function renderThumbnailPage(pageNum, canvas) {
  if (!editorPdfDoc) return;
  try {
    const page = await editorPdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 0.2 });
    const ctx = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: ctx, viewport }).promise;
  } catch {
    // Ignore thumbnail error
  }
}

/**
 * Switches the active viewport page.
 */
export async function switchEditorPage(pageNum) {
  if (pageNum < 1 || pageNum > totalPages || pageNum === currentPageNum) return;
  saveHistoryState();
  currentPageNum = pageNum;
  selectedAnnotationId = null;

  document.querySelectorAll('.editor-thumb-item').forEach(el => {
    el.classList.toggle('active', parseInt(el.dataset.page, 10) === currentPageNum);
  });

  await renderEditorPage(currentPageNum);
  updateEditorNavigationUI();
}

export function prevEditorPage() {
  if (currentPageNum > 1) {
    switchEditorPage(currentPageNum - 1);
  }
}

export function nextEditorPage() {
  if (currentPageNum < totalPages) {
    switchEditorPage(currentPageNum + 1);
  }
}

/**
 * Renders the PDF page onto the base canvas, sizing the interactive overlay directly on top.
 */
export async function renderEditorPage(pageNum) {
  if (!editorPdfDoc) return;
  const canvas = document.getElementById('editor-pdf-canvas');
  const overlay = document.getElementById('editor-annotation-overlay');
  const drawCanvas = document.getElementById('editor-draw-canvas');
  if (!canvas || !overlay || !drawCanvas) return;

  const page = await editorPdfDoc.getPage(pageNum);
  const dpr = window.devicePixelRatio || 1;
  const viewport = page.getViewport({ scale: currentZoom });

  canvas.width = Math.floor(viewport.width * dpr);
  canvas.height = Math.floor(viewport.height * dpr);
  canvas.style.width = `${Math.floor(viewport.width)}px`;
  canvas.style.height = `${Math.floor(viewport.height)}px`;

  overlay.style.width = `${Math.floor(viewport.width)}px`;
  overlay.style.height = `${Math.floor(viewport.height)}px`;

  drawCanvas.width = Math.floor(viewport.width * dpr);
  drawCanvas.height = Math.floor(viewport.height * dpr);
  drawCanvas.style.width = `${Math.floor(viewport.width)}px`;
  drawCanvas.style.height = `${Math.floor(viewport.height)}px`;

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  await page.render({ canvasContext: ctx, viewport }).promise;

  renderPageAnnotations();
}

/**
 * Renders all existing annotations for the active page onto the overlay and draw canvas.
 */
export function renderPageAnnotations() {
  const overlay = document.getElementById('editor-annotation-overlay');
  const drawCanvas = document.getElementById('editor-draw-canvas');
  if (!overlay || !drawCanvas) return;

  overlay.innerHTML = '';
  const drawCtx = drawCanvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);

  const annotations = pageAnnotations[currentPageNum] || [];

  annotations.forEach(item => {
    if (item.type === 'draw' || item.type === 'highlight') {
      renderDrawAnnotation(item, drawCtx, dpr);
    } else {
      renderDOMAnnotation(item, overlay);
    }
  });
}

function renderDrawAnnotation(item, ctx, dpr) {
  if (!item.points || item.points.length < 2) return;
  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.beginPath();
  ctx.strokeStyle = item.color;
  ctx.lineWidth = item.strokeWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.moveTo(item.points[0].x, item.points[0].y);
  for (let i = 1; i < item.points.length; i++) {
    ctx.lineTo(item.points[i].x, item.points[i].y);
  }
  ctx.stroke();
  ctx.restore();
}

function renderDOMAnnotation(item, overlay) {
  const el = document.createElement('div');
  el.className = `editor-annotation-box ${item.id === selectedAnnotationId ? 'selected' : ''}`;
  el.id = `anno-${item.id}`;
  el.dataset.id = item.id;
  el.style.left = `${item.x}px`;
  el.style.top = `${item.y}px`;

  if (item.width) el.style.width = `${item.width}px`;
  if (item.height) el.style.height = `${item.height}px`;

  if (item.type === 'text') {
    el.classList.add('anno-text');
    el.style.fontSize = `${item.fontSize || 16}px`;
    el.style.fontFamily = item.fontFamily === 'JetBrainsMono' ? '"JetBrains Mono", monospace' : item.fontFamily === 'TimesRoman' ? 'Times, serif' : item.fontFamily === 'Courier' ? 'Courier, monospace' : 'Helvetica, Arial, sans-serif';
    el.style.fontWeight = item.bold ? 'bold' : 'normal';
    el.style.fontStyle = item.italic ? 'italic' : 'normal';
    el.style.color = item.color || '#0f172a';
    el.style.backgroundColor = item.backgroundColor || 'transparent';

    const textSpan = document.createElement('div');
    textSpan.className = 'anno-text-content';
    textSpan.contentEditable = item.id === selectedAnnotationId;
    textSpan.textContent = item.text || 'Click to type text';
    textSpan.oninput = (e) => {
      item.text = e.target.textContent;
    };
    textSpan.onblur = () => {
      textSpan.contentEditable = 'false';
    };
    el.appendChild(textSpan);
  } else if (item.type === 'whiteout') {
    el.classList.add('anno-whiteout');
    el.style.backgroundColor = item.backgroundColor || activeWhiteoutColor || '#ffffff';
    el.style.border = 'none';
    el.style.boxShadow = 'none';
  } else if (item.type === 'shape') {
    el.classList.add('anno-shape');
    if (item.shapeType === 'circle') {
      el.style.borderRadius = '50%';
      el.style.border = `${item.strokeWidth || 2}px solid ${item.color || '#0f172a'}`;
      if (item.backgroundColor) el.style.backgroundColor = item.backgroundColor;
    } else if (item.shapeType === 'line') {
      el.style.height = '0px';
      el.style.borderTop = `${item.strokeWidth || 2}px solid ${item.color || '#0f172a'}`;
    } else {
      el.style.border = `${item.strokeWidth || 2}px solid ${item.color || '#0f172a'}`;
      if (item.backgroundColor) el.style.backgroundColor = item.backgroundColor;
    }
  } else if (item.type === 'checkmark' || item.type === 'crossmark') {
    el.classList.add('anno-mark');
    el.style.fontSize = `${item.fontSize || 22}px`;
    el.style.color = item.color || (item.type === 'checkmark' ? '#16a34a' : '#dc2626');
    el.style.fontWeight = 'bold';
    el.textContent = item.type === 'checkmark' ? '✓' : '✗';
  } else if (item.type === 'stamp') {
    el.classList.add('anno-stamp');
    el.textContent = item.stampText || 'APPROVED';
    el.style.borderColor = item.color || '#dc2626';
    el.style.color = item.color || '#dc2626';
  } else if (item.type === 'signature' || item.type === 'image') {
    el.classList.add(item.type === 'image' ? 'anno-image' : 'anno-signature');
    const img = document.createElement('img');
    img.src = item.imageDataUrl;
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'contain';
    img.style.pointerEvents = 'none';
    el.appendChild(img);
  }

  // Bind Selection & Drag Handlers
  el.onmousedown = (e) => startAnnotationDrag(e, item);
  el.ondblclick = () => {
    selectAnnotation(item.id);
    if (item.type === 'text') {
      const content = el.querySelector('.anno-text-content');
      if (content) {
        content.contentEditable = 'true';
        content.focus();
      }
    } else if (item.type === 'whiteout') {
      redactAndTypeOverSelected();
    }
  };

  overlay.appendChild(el);
}

/**
 * Starts moving/dragging an annotation on the overlay.
 */
function startAnnotationDrag(e, item) {
  if (activeEditorTool !== 'select') return;
  e.stopPropagation();
  selectAnnotation(item.id);

  isDraggingItem = true;
  dragStartX = e.clientX;
  dragStartY = e.clientY;
  itemStartX = item.x;
  itemStartY = item.y;

  const onMouseMove = (moveEvt) => {
    if (!isDraggingItem) return;
    const dx = moveEvt.clientX - dragStartX;
    const dy = moveEvt.clientY - dragStartY;
    item.x = Math.max(0, itemStartX + dx);
    item.y = Math.max(0, itemStartY + dy);

    const el = document.getElementById(`anno-${item.id}`);
    if (el) {
      el.style.left = `${item.x}px`;
      el.style.top = `${item.y}px`;
    }
  };

  const onMouseUp = () => {
    isDraggingItem = false;
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
    saveHistoryState();
  };

  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
}

/**
 * Handles canvas clicks to create new annotations based on active tool.
 */
export function handleOverlayCanvasMouseDown(e) {
  const overlay = document.getElementById('editor-annotation-overlay');
  if (!overlay) return;

  const rect = overlay.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const clickY = e.clientY - rect.top;

  if (activeEditorTool === 'select') {
    selectAnnotation(null);
    return;
  }

  saveHistoryState();

  if (activeEditorTool === 'text') {
    const newId = `txt_${Date.now()}`;
    const newAnno = {
      id: newId,
      type: 'text',
      pageIndex: currentPageNum - 1,
      x: clickX,
      y: clickY,
      text: 'Type here...',
      fontSize: activeFontSize,
      fontFamily: activeFontFamily,
      bold: isTextBold,
      italic: isTextItalic,
      color: activeTextColor,
      backgroundColor: activeTextBg,
    };
    addAnnotation(newAnno);
    selectAnnotation(newId);
    setEditorTool('select');
  } else if (activeEditorTool === 'whiteout') {
    startShapeDrag(e, 'whiteout', clickX, clickY);
  } else if (activeEditorTool === 'shape') {
    startShapeDrag(e, 'shape', clickX, clickY);
  } else if (activeEditorTool === 'checkmark' || activeEditorTool === 'crossmark') {
    const newId = `mark_${Date.now()}`;
    const newAnno = {
      id: newId,
      type: activeEditorTool,
      pageIndex: currentPageNum - 1,
      x: clickX - 10,
      y: clickY - 14,
      fontSize: 24,
      color: activeEditorTool === 'checkmark' ? '#16a34a' : '#dc2626',
    };
    addAnnotation(newAnno);
    setEditorTool('select');
  } else if (activeEditorTool === 'draw' || activeEditorTool === 'highlight') {
    startFreehandDraw(clickX, clickY);
  }
}

function startShapeDrag(e, kind, startX, startY) {
  const overlay = document.getElementById('editor-annotation-overlay');
  const tempBox = document.createElement('div');
  tempBox.className = kind === 'whiteout' ? 'anno-whiteout' : 'anno-shape';
  tempBox.style.left = `${startX}px`;
  tempBox.style.top = `${startY}px`;
  tempBox.style.width = '0px';
  tempBox.style.height = '0px';
  tempBox.style.position = 'absolute';
  tempBox.style.pointerEvents = 'none';
  if (kind === 'whiteout') {
    tempBox.style.backgroundColor = activeWhiteoutColor || '#ffffff';
    tempBox.style.border = 'none';
    tempBox.style.outline = '1px dashed #7b61ff';
  } else {
    tempBox.style.border = `${activeStrokeWidth}px solid ${activeStrokeColor}`;
  }
  overlay.appendChild(tempBox);

  const onMouseMove = (moveEvt) => {
    const rect = overlay.getBoundingClientRect();
    const curX = moveEvt.clientX - rect.left;
    const curY = moveEvt.clientY - rect.top;

    const x = Math.min(startX, curX);
    const y = Math.min(startY, curY);
    const w = Math.abs(curX - startX);
    const h = Math.abs(curY - startY);

    tempBox.style.left = `${x}px`;
    tempBox.style.top = `${y}px`;
    tempBox.style.width = `${w}px`;
    tempBox.style.height = `${h}px`;
  };

  const onMouseUp = (upEvt) => {
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
    tempBox.remove();

    const rect = overlay.getBoundingClientRect();
    const endX = upEvt.clientX - rect.left;
    const endY = upEvt.clientY - rect.top;
    const w = Math.abs(endX - startX);
    const h = Math.abs(endY - startY);

    if (w > 5 && h > 5) {
      const newId = `${kind}_${Date.now()}`;
      const newAnno = {
        id: newId,
        type: kind,
        pageIndex: currentPageNum - 1,
        x: Math.min(startX, endX),
        y: Math.min(startY, endY),
        width: w,
        height: h,
        backgroundColor: kind === 'whiteout' ? (activeWhiteoutColor || '#ffffff') : undefined,
        color: activeStrokeColor,
        strokeWidth: activeStrokeWidth,
        shapeType: activeShapeType,
      };
      addAnnotation(newAnno);
      selectAnnotation(newId);
    }
    setEditorTool('select');
  };

  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
}

function startFreehandDraw(startX, startY) {
  isDrawingStroke = true;
  currentStrokePoints = [{ x: startX, y: startY }];

  const drawCanvas = document.getElementById('editor-draw-canvas');
  const overlay = document.getElementById('editor-annotation-overlay');
  const dpr = window.devicePixelRatio || 1;
  const ctx = drawCanvas.getContext('2d');

  const strokeColor = activeEditorTool === 'highlight' ? activeHighlightColor : activeStrokeColor;
  const strokeW = activeEditorTool === 'highlight' ? 14 : activeStrokeWidth;

  const onMouseMove = (moveEvt) => {
    if (!isDrawingStroke) return;
    const rect = overlay.getBoundingClientRect();
    const x = moveEvt.clientX - rect.left;
    const y = moveEvt.clientY - rect.top;

    currentStrokePoints.push({ x, y });

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.beginPath();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeW;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const prev = currentStrokePoints[currentStrokePoints.length - 2];
    ctx.moveTo(prev.x, prev.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.restore();
  };

  const onMouseUp = () => {
    isDrawingStroke = false;
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);

    if (currentStrokePoints.length > 1) {
      const newId = `draw_${Date.now()}`;
      const newAnno = {
        id: newId,
        type: activeEditorTool === 'highlight' ? 'highlight' : 'draw',
        pageIndex: currentPageNum - 1,
        points: [...currentStrokePoints],
        color: strokeColor,
        strokeWidth: strokeW,
      };
      addAnnotation(newAnno);
    }
  };

  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
}

/**
 * Adds an annotation to the active page state.
 */
function addAnnotation(anno) {
  if (!pageAnnotations[currentPageNum]) {
    pageAnnotations[currentPageNum] = [];
  }
  pageAnnotations[currentPageNum].push(anno);
  renderPageAnnotations();
}

/**
 * Selects an active annotation to highlight and edit.
 */
export function selectAnnotation(id) {
  selectedAnnotationId = id;
  document.querySelectorAll('.editor-annotation-box').forEach(b => {
    b.classList.toggle('selected', b.dataset.id === id);
    b.querySelectorAll('.anno-resize-handle').forEach(h => h.remove());
  });

  const deleteBtn = document.getElementById('editor-delete-selected-btn');
  if (deleteBtn) {
    deleteBtn.style.display = id ? 'inline-flex' : 'none';
  }

  const list = pageAnnotations[currentPageNum] || [];
  const selectedItem = list.find(a => a.id === id);

  const textBar = document.getElementById('editor-text-controls');
  const whiteoutBar = document.getElementById('editor-whiteout-controls');

  if (selectedItem) {
    if (selectedItem.type === 'text') {
      if (textBar) textBar.style.display = 'flex';
      if (whiteoutBar) whiteoutBar.style.display = 'none';
    } else if (selectedItem.type === 'whiteout') {
      if (whiteoutBar) whiteoutBar.style.display = 'flex';
      if (textBar) textBar.style.display = 'none';
      updateWhiteoutToolbarButtons(selectedItem.backgroundColor || '#ffffff');
    } else {
      if (textBar) textBar.style.display = 'none';
      if (whiteoutBar) whiteoutBar.style.display = 'none';
    }

    if (['image', 'signature', 'whiteout', 'shape'].includes(selectedItem.type)) {
      const el = document.getElementById(`anno-${id}`);
      if (el) attachResizeHandles(el, selectedItem);
    }
  } else {
    if (activeEditorTool === 'text') {
      if (textBar) textBar.style.display = 'flex';
      if (whiteoutBar) whiteoutBar.style.display = 'none';
    } else if (activeEditorTool === 'whiteout') {
      if (whiteoutBar) whiteoutBar.style.display = 'flex';
      if (textBar) textBar.style.display = 'none';
    } else {
      if (textBar) textBar.style.display = 'none';
      if (whiteoutBar) whiteoutBar.style.display = 'none';
    }
  }
}

/**
 * Deletes the currently selected annotation.
 */
export function deleteSelectedAnnotation() {
  if (!selectedAnnotationId) return;
  saveHistoryState();
  const list = pageAnnotations[currentPageNum] || [];
  pageAnnotations[currentPageNum] = list.filter(a => a.id !== selectedAnnotationId);
  selectedAnnotationId = null;
  renderPageAnnotations();
  selectAnnotation(null);
}

function attachResizeHandles(el, item) {
  const positions = ['nw', 'ne', 'se', 'sw'];
  positions.forEach(pos => {
    const handle = document.createElement('div');
    handle.className = `anno-resize-handle handle-${pos}`;
    handle.onmousedown = (e) => startResizeDrag(e, item, pos);
    el.appendChild(handle);
  });
}

function startResizeDrag(e, item, pos) {
  e.stopPropagation();
  e.preventDefault();
  saveHistoryState();

  const startMouseX = e.clientX;
  const startMouseY = e.clientY;
  const startW = item.width || 50;
  const startH = item.height || 20;
  const startX = item.x;
  const startY = item.y;

  const onMouseMove = (moveEvt) => {
    const dx = moveEvt.clientX - startMouseX;
    const dy = moveEvt.clientY - startMouseY;

    if (pos === 'se') {
      item.width = Math.max(15, startW + dx);
      item.height = Math.max(15, startH + dy);
    } else if (pos === 'sw') {
      const newW = Math.max(15, startW - dx);
      item.x = startX + (startW - newW);
      item.width = newW;
      item.height = Math.max(15, startH + dy);
    } else if (pos === 'ne') {
      const newH = Math.max(15, startH - dy);
      item.y = startY + (startH - newH);
      item.width = Math.max(15, startW + dx);
      item.height = newH;
    } else if (pos === 'nw') {
      const newW = Math.max(15, startW - dx);
      const newH = Math.max(15, startH - dy);
      item.x = startX + (startW - newW);
      item.y = startY + (startH - newH);
      item.width = newW;
      item.height = newH;
    }

    const el = document.getElementById(`anno-${item.id}`);
    if (el) {
      el.style.left = `${item.x}px`;
      el.style.top = `${item.y}px`;
      el.style.width = `${item.width}px`;
      el.style.height = `${item.height}px`;
    }
  };

  const onMouseUp = () => {
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
  };

  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
}

/**
 * Sets the active toolbox action.
 */
export function setEditorTool(tool) {
  activeEditorTool = tool;
  document.querySelectorAll('.editor-tool-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tool === tool);
  });

  const overlay = document.getElementById('editor-annotation-overlay');
  if (overlay) {
    overlay.className = `editor-annotation-overlay tool-${tool}`;
  }

  // Toggle contextual sub-bars
  const textBar = document.getElementById('editor-text-controls');
  const whiteoutBar = document.getElementById('editor-whiteout-controls');
  if (textBar) textBar.style.display = (tool === 'text') ? 'flex' : 'none';
  if (whiteoutBar) whiteoutBar.style.display = (tool === 'whiteout') ? 'flex' : 'none';
}

/**
 * Sets active whiteout mask color and updates selected whiteout if any.
 */
export function setEditorWhiteoutColor(color) {
  activeWhiteoutColor = color;
  updateWhiteoutToolbarButtons(color);

  if (selectedAnnotationId) {
    const list = pageAnnotations[currentPageNum] || [];
    const item = list.find(a => a.id === selectedAnnotationId);
    if (item && item.type === 'whiteout') {
      saveHistoryState();
      item.backgroundColor = color;
      const el = document.getElementById(`anno-${item.id}`);
      if (el) el.style.backgroundColor = color;
    }
  }
}

function updateWhiteoutToolbarButtons(color) {
  const btnWhite = document.getElementById('btn-wo-white');
  const btnCream = document.getElementById('btn-wo-cream');
  const btnBlack = document.getElementById('btn-wo-black');
  const colorInput = document.getElementById('editor-whiteout-custom-color');
  if (btnWhite) btnWhite.classList.toggle('active', color === '#ffffff');
  if (btnCream) btnCream.classList.toggle('active', color === '#fdfbf7');
  if (btnBlack) btnBlack.classList.toggle('active', color === '#09090b');
  if (colorInput && color) colorInput.value = color.startsWith('#') && color.length === 7 ? color : '#ffffff';
}

/**
 * Immediately overlays an editable text box on top of the selected whiteout mask.
 */
export function redactAndTypeOverSelected() {
  const list = pageAnnotations[currentPageNum] || [];
  let targetWhiteout = list.find(a => a.id === selectedAnnotationId && a.type === 'whiteout');
  if (!targetWhiteout) {
    targetWhiteout = [...list].reverse().find(a => a.type === 'whiteout');
  }

  if (!targetWhiteout) {
    alert('Please draw a whiteout mask first, or use the Text tool to type anywhere.');
    return;
  }

  saveHistoryState();
  const newId = `txt_${Date.now()}`;
  const calcFontSize = Math.min(20, Math.max(12, Math.round(targetWhiteout.height * 0.75)));
  const newAnno = {
    id: newId,
    type: 'text',
    pageIndex: currentPageNum - 1,
    x: targetWhiteout.x + 2,
    y: targetWhiteout.y + 1,
    width: Math.max(60, targetWhiteout.width - 4),
    height: Math.max(20, targetWhiteout.height - 2),
    text: 'Replacement text',
    fontSize: calcFontSize,
    fontFamily: activeFontFamily,
    bold: isTextBold,
    italic: isTextItalic,
    color: '#0f172a',
    backgroundColor: 'transparent',
  };
  addAnnotation(newAnno);
  selectAnnotation(newId);

  setTimeout(() => {
    const el = document.getElementById(`anno-${newId}`);
    if (el) {
      const content = el.querySelector('.anno-text-content');
      if (content) {
        content.contentEditable = 'true';
        content.focus();
        try {
          const range = document.createRange();
          range.selectNodeContents(content);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        } catch { /* ignore */ }
      }
    }
  }, 60);
}

/**
 * Handles image file picker upload.
 */
export function handleEditorImageUpload(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    insertImageAnnotation(e.target.result);
  };
  reader.readAsDataURL(file);
  event.target.value = '';
}

/**
 * Inserts an image or logo onto the document canvas.
 */
export function insertImageAnnotation(dataUrl) {
  if (!dataUrl) return;
  saveHistoryState();

  const tempImg = new Image();
  tempImg.onload = () => {
    const canvas = document.getElementById('editor-pdf-canvas');
    const stageW = canvas ? (parseFloat(canvas.style.width) || canvas.width) : 600;
    const stageH = canvas ? (parseFloat(canvas.style.height) || canvas.height) : 800;

    let targetW = 180;
    let targetH = Math.round(targetW * (tempImg.naturalHeight / (tempImg.naturalWidth || 1)));
    if (targetH > 220) {
      targetH = 220;
      targetW = Math.round(targetH * (tempImg.naturalWidth / (tempImg.naturalHeight || 1)));
    }

    const newId = `img_${Date.now()}`;
    const newAnno = {
      id: newId,
      type: 'image',
      pageIndex: currentPageNum - 1,
      x: Math.max(20, Math.round((stageW - targetW) / 2)),
      y: Math.max(20, Math.round((stageH - targetH) / 2)),
      width: targetW,
      height: targetH,
      imageDataUrl: dataUrl,
    };
    addAnnotation(newAnno);
    selectAnnotation(newId);
    setEditorTool('select');
  };
  tempImg.src = dataUrl;
}

/**
 * Sets up global clipboard paste (Ctrl+V) and keyboard shortcuts for the editor.
 */
export function setupEditorKeyboardAndPaste() {
  if (isKeyboardPasteInitialized) return;
  isKeyboardPasteInitialized = true;

  window.addEventListener('paste', (e) => {
    const studio = document.getElementById('pdf-editor-studio');
    if (!studio || studio.style.display === 'none') return;

    if (document.activeElement && (document.activeElement.isContentEditable || ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName))) {
      return;
    }

    const items = e.clipboardData && e.clipboardData.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type && items[i].type.indexOf('image') !== -1) {
        e.preventDefault();
        const blob = items[i].getAsFile();
        if (blob) {
          const reader = new FileReader();
          reader.onload = (evt) => {
            insertImageAnnotation(evt.target.result);
          };
          reader.readAsDataURL(blob);
          return;
        }
      }
    }

    if (clipboardAnnotation) {
      e.preventDefault();
      saveHistoryState();
      const newId = `${clipboardAnnotation.type}_${Date.now()}`;
      const copy = {
        ...JSON.parse(JSON.stringify(clipboardAnnotation)),
        id: newId,
        x: clipboardAnnotation.x + 20,
        y: clipboardAnnotation.y + 20,
        pageIndex: currentPageNum - 1,
      };
      addAnnotation(copy);
      selectAnnotation(newId);
    }
  });

  window.addEventListener('keydown', (e) => {
    const studio = document.getElementById('pdf-editor-studio');
    if (!studio || studio.style.display === 'none') return;

    if (document.activeElement && (document.activeElement.isContentEditable || ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName))) {
      return;
    }

    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (selectedAnnotationId) {
        e.preventDefault();
        deleteSelectedAnnotation();
      }
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
      if (selectedAnnotationId) {
        const list = pageAnnotations[currentPageNum] || [];
        const item = list.find(a => a.id === selectedAnnotationId);
        if (item) {
          clipboardAnnotation = JSON.parse(JSON.stringify(item));
        }
      }
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'x') {
      if (selectedAnnotationId) {
        const list = pageAnnotations[currentPageNum] || [];
        const item = list.find(a => a.id === selectedAnnotationId);
        if (item) {
          clipboardAnnotation = JSON.parse(JSON.stringify(item));
          deleteSelectedAnnotation();
        }
      }
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      undoEditor();
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
      e.preventDefault();
      redoEditor();
    }
  });
}

/**
 * Inserts a pre-made rubber stamp onto the current page.
 */
export function insertStamp(stampText, color = '#dc2626') {
  saveHistoryState();
  const newId = `stamp_${Date.now()}`;
  const newAnno = {
    id: newId,
    type: 'stamp',
    pageIndex: currentPageNum - 1,
    x: 100,
    y: 100,
    stampText,
    color,
  };
  addAnnotation(newAnno);
  selectAnnotation(newId);
  setEditorTool('select');
}

/**
 * Inserts today's date stamp onto the current page.
 */
export function insertDateStamp() {
  const today = new Date().toISOString().split('T')[0];
  insertStamp(`DATE: ${today}`, '#0f172a');
}

/**
 * Inserts signature from Signature Studio onto the document.
 */
export function insertSignatureStamp() {
  const sigData = getSignatureData();
  if (!sigData.bytes) {
    // Open modal to draw signature if none exists yet
    openSignatureDrawModal();
    return;
  }

  const blob = new Blob([sigData.bytes], { type: sigData.type || 'image/png' });
  const dataUrl = URL.createObjectURL(blob);

  saveHistoryState();
  const newId = `sig_${Date.now()}`;
  const newAnno = {
    id: newId,
    type: 'signature',
    pageIndex: currentPageNum - 1,
    x: 120,
    y: 150,
    width: 160,
    height: 60,
    imageDataUrl: dataUrl,
    imageBytes: sigData.bytes,
  };
  addAnnotation(newAnno);
  selectAnnotation(newId);
  setEditorTool('select');
}

/**
 * Formatting Setters
 */
export function setEditorFontFamily(val) {
  activeFontFamily = val;
  updateSelectedTextProperty('fontFamily', val);
}

export function setEditorFontSize(val) {
  activeFontSize = parseInt(val, 10) || 16;
  updateSelectedTextProperty('fontSize', activeFontSize);
}

export function toggleEditorBold() {
  isTextBold = !isTextBold;
  updateSelectedTextProperty('bold', isTextBold);
}

export function toggleEditorItalic() {
  isTextItalic = !isTextItalic;
  updateSelectedTextProperty('italic', isTextItalic);
}

export function setEditorTextColor(color) {
  activeTextColor = color;
  updateSelectedTextProperty('color', color);
}

export function setEditorTextBg(bg) {
  activeTextBg = bg;
  updateSelectedTextProperty('backgroundColor', bg);
}

export function setEditorShapeType(type) {
  activeShapeType = type;
}

export function setEditorStrokeColor(color) {
  activeStrokeColor = color;
}

export function setEditorStrokeWidth(w) {
  activeStrokeWidth = parseInt(w, 10) || 2;
}

function updateSelectedTextProperty(prop, value) {
  if (!selectedAnnotationId) return;
  const list = pageAnnotations[currentPageNum] || [];
  const item = list.find(a => a.id === selectedAnnotationId);
  if (item && item.type === 'text') {
    item[prop] = value;
    renderPageAnnotations();
  }
}

/**
 * Zoom In / Out
 */
export function zoomEditor(delta) {
  const newZoom = Math.min(2.5, Math.max(0.5, currentZoom + delta));
  if (newZoom !== currentZoom) {
    currentZoom = newZoom;
    const zoomText = document.getElementById('editor-zoom-label');
    if (zoomText) zoomText.textContent = `${Math.round(currentZoom * 100)}%`;
    renderEditorPage(currentPageNum);
  }
}

/**
 * History Management (Undo / Redo)
 */
function saveHistoryState() {
  historyStack.push(JSON.parse(JSON.stringify(pageAnnotations)));
  redoStack = [];
  if (historyStack.length > 30) historyStack.shift();
}

export function undoEditor() {
  if (historyStack.length === 0) return;
  redoStack.push(JSON.parse(JSON.stringify(pageAnnotations)));
  pageAnnotations = historyStack.pop();
  selectedAnnotationId = null;
  renderPageAnnotations();
}

export function redoEditor() {
  if (redoStack.length === 0) return;
  historyStack.push(JSON.parse(JSON.stringify(pageAnnotations)));
  pageAnnotations = redoStack.pop();
  selectedAnnotationId = null;
  renderPageAnnotations();
}

function updateEditorNavigationUI() {
  const curEl = document.getElementById('editor-cur-page');
  const totalEl = document.getElementById('editor-total-pages');
  if (curEl) curEl.textContent = currentPageNum;
  if (totalEl) totalEl.textContent = totalPages;
}

/**
 * Compiles all visual annotations across all pages directly into native PDF vector operators via PDFLib.
 */
export async function exportEditedPdf() {
  if (!editorPdfBytes) return;

  const PDFLib = window.PDFLib;
  if (!PDFLib) {
    alert('PDFLib is not loaded');
    return;
  }

  const exportBtn = document.getElementById('editor-export-btn');
  const originalBtnHtml = exportBtn ? exportBtn.innerHTML : '';
  if (exportBtn) {
    exportBtn.disabled = true;
    exportBtn.innerHTML = '<span>Compiling Vector PDF...</span>';
  }

  try {
    const pdfDoc = await PDFLib.PDFDocument.load(editorPdfBytes.slice(0));
    const pages = pdfDoc.getPages();

    // Standard Font Embeddings
    const helvetica = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);
    const timesRoman = await pdfDoc.embedFont(PDFLib.StandardFonts.TimesRoman);
    const courier = await pdfDoc.embedFont(PDFLib.StandardFonts.Courier);

    const canvas = document.getElementById('editor-pdf-canvas');
    const displayWidth = parseFloat(canvas.style.width) || canvas.width;
    const displayHeight = parseFloat(canvas.style.height) || canvas.height;

    for (let p = 0; p < pages.length; p++) {
      const pageIndex = p;
      const pageNumber = p + 1;
      const annotations = pageAnnotations[pageNumber] || [];
      if (annotations.length === 0) continue;

      const page = pages[pageIndex];
      const { width: nativeWidth, height: nativeHeight } = page.getSize();
      const scaleX = nativeWidth / displayWidth;
      const scaleY = nativeHeight / displayHeight;

      for (const item of annotations) {
        const nativeX = item.x * scaleX;
        const nativeW = (item.width || 50) * scaleX;
        const nativeH = (item.height || 20) * scaleY;
        // PDF Y-axis origin is at bottom-left
        const nativeY = nativeHeight - ((item.y + (item.height || 20)) * scaleY);

        if (item.type === 'whiteout') {
          page.drawRectangle({
            x: nativeX,
            y: nativeY,
            width: nativeW,
            height: nativeH,
            color: hexToRgbPdf(item.backgroundColor || '#ffffff'),
          });
        } else if (item.type === 'text') {
          const font = item.fontFamily === 'TimesRoman' ? timesRoman : item.fontFamily === 'Courier' ? courier : item.bold ? helveticaBold : helvetica;
          const fontSize = (item.fontSize || 16) * scaleX;
          const textY = nativeHeight - ((item.y + (item.fontSize || 16) * 0.85) * scaleY);

          // Optional background box
          if (item.backgroundColor && item.backgroundColor !== 'transparent') {
            const bgRgb = hexToRgbPdf(item.backgroundColor);
            page.drawRectangle({
              x: nativeX - 2,
              y: textY - 3,
              width: font.widthOfTextAtSize(item.text || '', fontSize) + 6,
              height: fontSize + 6,
              color: bgRgb,
            });
          }

          page.drawText(item.text || '', {
            x: nativeX,
            y: textY,
            size: fontSize,
            font,
            color: hexToRgbPdf(item.color || '#0f172a'),
          });
        } else if (item.type === 'checkmark' || item.type === 'crossmark') {
          const markColor = item.type === 'checkmark' ? PDFLib.rgb(0.08, 0.65, 0.29) : PDFLib.rgb(0.86, 0.15, 0.15);
          const markSize = 22 * scaleX;
          const thickness = Math.max(1.5, markSize * 0.12);
          const originY = nativeHeight - ((item.y + 22) * scaleY);

          if (item.type === 'checkmark') {
            page.drawLine({
              start: { x: nativeX, y: originY + markSize * 0.35 },
              end: { x: nativeX + markSize * 0.35, y: originY },
              thickness,
              color: markColor,
            });
            page.drawLine({
              start: { x: nativeX + markSize * 0.35, y: originY },
              end: { x: nativeX + markSize * 0.9, y: originY + markSize * 0.7 },
              thickness,
              color: markColor,
            });
          } else {
            page.drawLine({
              start: { x: nativeX, y: originY },
              end: { x: nativeX + markSize * 0.8, y: originY + markSize * 0.8 },
              thickness,
              color: markColor,
            });
            page.drawLine({
              start: { x: nativeX, y: originY + markSize * 0.8 },
              end: { x: nativeX + markSize * 0.8, y: originY },
              thickness,
              color: markColor,
            });
          }
        } else if (item.type === 'stamp') {
          const stampW = 120 * scaleX;
          const stampH = 36 * scaleY;
          const stampY = nativeHeight - ((item.y + 36) * scaleY);
          const stampColor = hexToRgbPdf(item.color || '#dc2626');

          page.drawRectangle({
            x: nativeX,
            y: stampY,
            width: stampW,
            height: stampH,
            borderColor: stampColor,
            borderWidth: 2,
            color: PDFLib.rgb(1, 1, 1),
          });

          page.drawText(item.stampText || 'APPROVED', {
            x: nativeX + 8,
            y: stampY + 10,
            size: 14 * scaleX,
            font: helveticaBold,
            color: stampColor,
          });
        } else if (item.type === 'shape') {
          const shapeColor = hexToRgbPdf(item.color || '#0f172a');
          if (item.shapeType === 'circle') {
            page.drawEllipse({
              x: nativeX + nativeW / 2,
              y: nativeY + nativeH / 2,
              xScale: nativeW / 2,
              yScale: nativeH / 2,
              borderColor: shapeColor,
              borderWidth: item.strokeWidth || 2,
            });
          } else if (item.shapeType === 'line') {
            page.drawLine({
              start: { x: nativeX, y: nativeHeight - (item.y * scaleY) },
              end: { x: nativeX + nativeW, y: nativeHeight - (item.y * scaleY) },
              thickness: item.strokeWidth || 2,
              color: shapeColor,
            });
          } else {
            page.drawRectangle({
              x: nativeX,
              y: nativeY,
              width: nativeW,
              height: nativeH,
              borderColor: shapeColor,
              borderWidth: item.strokeWidth || 2,
            });
          }
        } else if ((item.type === 'signature' || item.type === 'image') && item.imageDataUrl) {
          try {
            const isJpg = item.imageDataUrl.startsWith('data:image/jpeg') || item.imageDataUrl.startsWith('data:image/jpg');
            const imgRes = await fetch(item.imageDataUrl);
            const imgBuf = await imgRes.arrayBuffer();
            const embeddedImg = isJpg ? await pdfDoc.embedJpg(imgBuf) : await pdfDoc.embedPng(imgBuf);
            page.drawImage(embeddedImg, {
              x: nativeX,
              y: nativeY,
              width: nativeW,
              height: nativeH,
            });
          } catch (imgErr) {
            console.warn('Failed to embed image:', imgErr);
          }
        } else if ((item.type === 'draw' || item.type === 'highlight') && item.points && item.points.length > 1) {
          const isHighlight = item.type === 'highlight';
          const strokeColor = isHighlight ? PDFLib.rgb(1, 0.94, 0.54) : hexToRgbPdf(item.color || '#0f172a');
          const opacity = isHighlight ? 0.4 : 1.0;
          const strokeWidth = (item.strokeWidth || 2) * scaleX;

          for (let i = 0; i < item.points.length - 1; i++) {
            const p1 = item.points[i];
            const p2 = item.points[i + 1];
            page.drawLine({
              start: { x: p1.x * scaleX, y: nativeHeight - (p1.y * scaleY) },
              end: { x: p2.x * scaleX, y: nativeHeight - (p2.y * scaleY) },
              thickness: strokeWidth,
              color: strokeColor,
              opacity,
            });
          }
        }
      }
    }

    const savedBytes = await pdfDoc.save({ useObjectStreams: true });
    const blob = new Blob([savedBytes], { type: 'application/pdf' });
    const downloadUrl = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = 'edited_document.pdf';
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch (err) {
    console.error('Error exporting edited PDF:', err);
    alert('Failed to export edited PDF: ' + err.message);
  } finally {
    if (exportBtn) {
      exportBtn.disabled = false;
      exportBtn.innerHTML = originalBtnHtml;
    }
  }
}

function hexToRgbPdf(hex) {
  const PDFLib = window.PDFLib;
  if (!hex || hex === 'transparent') return PDFLib.rgb(0, 0, 0);
  let c = hex.replace('#', '');
  if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
  const num = parseInt(c, 16);
  return PDFLib.rgb(((num >> 16) & 255) / 255, ((num >> 8) & 255) / 255, (num & 255) / 255);
}
