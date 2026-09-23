/**
 * @file modules/window-bindings.js
 * @description Centralized registration of global window bindings for inline HTML
 * event handlers across all studios, tools, and interactive UI components.
 */

import {
  rotateSingleVisualPage,
  rotateAllVisualPages,
  resetAllVisualRotations,
  removeStagedFile
} from './file-staging.js';

import {
  applyCropPreset,
  updateCropLivePreviewOverlay,
  toggleCropMode,
  renderLiveCropPreview
} from './crop-preview.js';

import {
  openSignatureDrawModal,
  closeSignatureDrawModal,
  initSignatureCanvas,
  clearSignaturePad,
  saveDrawnSignature,
  downloadDrawnSignature,
  setSignatureInk,
  setSignatureStroke,
  switchSignatureTab,
  initStudioSignatureCanvas,
  clearStudioSignaturePad,
  downloadStudioSignature,
  handleSignatureUpload
} from './signature-studio.js';

import {
  gstItems,
  initGstInvoiceStudio,
  renderGstItemsTable,
  onGstItemChange,
  addGstItemRow,
  deleteGstItemRow,
  numberToWordsClient,
  updateGstInvoicePreview,
  printGstInvoicePreview,
  setGstStudioView,
  formatInrClient
} from './gst-studio.js?v=3.2';

import {
  initPosStudio,
  updatePosReceiptPreview,
  setPosStudioView
} from './pos-studio.js?v=3.5';

import {
  initTaxReceiptStudio,
  updateTaxReceiptPreview,
  setTaxReceiptStudioView
} from './tax-receipt-studio.js?v=3.5';

import {
  initEstimateStudio,
  updateEstimatePreview,
  setEstimateStudioView
} from './estimate-studio.js?v=3.5';

import {
  copyAiPreviewText
} from './direct-ai.js';

import {
  initP2pStudio,
  createP2pRoom,
  joinP2pRoom,
  disconnectP2p,
  sendP2pFiles,
  sendP2pCodeSnippet,
  setP2pStudioTab,
  copyP2pRoomCode,
  copyP2pJoinUrl,
  copyP2pSnippetText
} from './p2p-client.js?v=4.0';

import {
  initPdfEditorStudio,
  switchEditorPage,
  prevEditorPage,
  nextEditorPage,
  renderEditorPage,
  renderPageAnnotations,
  handleOverlayCanvasMouseDown,
  selectAnnotation,
  deleteSelectedAnnotation,
  setEditorTool,
  insertStamp,
  insertDateStamp,
  insertSignatureStamp,
  setEditorFontFamily,
  setEditorFontSize,
  toggleEditorBold,
  toggleEditorItalic,
  setEditorTextColor,
  setEditorTextBg,
  setEditorShapeType,
  setEditorStrokeColor,
  setEditorStrokeWidth,
  zoomEditor,
  undoEditor,
  redoEditor,
  exportEditedPdf,
  setEditorWhiteoutColor,
  redactAndTypeOverSelected,
  handleEditorImageUpload,
  insertImageAnnotation,
  setupEditorKeyboardAndPaste
} from './pdf-editor-studio.js';

/**
 * Initializes and binds all studio and tool handler functions to the global `window` object.
 * @param {Object} orchestratorHandlers - Functions from app.js (switchTool, resetWorkspace, etc.)
 */
export function initWindowBindings(orchestratorHandlers = {}) {
  // Orchestrator bindings
  if (orchestratorHandlers.switchTool) window.switchTool = orchestratorHandlers.switchTool;
  if (orchestratorHandlers.resetWorkspace) window.resetWorkspace = orchestratorHandlers.resetWorkspace;
  if (orchestratorHandlers.filterCategory) window.filterCategory = orchestratorHandlers.filterCategory;
  if (orchestratorHandlers.setBillingCycle) window.setBillingCycle = orchestratorHandlers.setBillingCycle;
  if (orchestratorHandlers.executeDocumentOperation) window.executeDocumentOperation = orchestratorHandlers.executeDocumentOperation;
  if (orchestratorHandlers.generateAndDownloadGstInvoicePdf) window.generateAndDownloadGstInvoicePdf = orchestratorHandlers.generateAndDownloadGstInvoicePdf;
  if (orchestratorHandlers.generatePosReceiptPdf) window.generatePosReceiptPdf = orchestratorHandlers.generatePosReceiptPdf;
  if (orchestratorHandlers.generateTaxReceiptPdf) window.generateTaxReceiptPdf = orchestratorHandlers.generateTaxReceiptPdf;
  if (orchestratorHandlers.generateEstimatePdf) window.generateEstimatePdf = orchestratorHandlers.generateEstimatePdf;

  // Staging & rotation
  window.rotateSingleVisualPage = rotateSingleVisualPage;
  window.rotateAllVisualPages = rotateAllVisualPages;
  window.resetAllVisualRotations = resetAllVisualRotations;
  window.removeStagedFile = removeStagedFile;

  // Crop preview
  window.applyCropPreset = applyCropPreset;
  window.updateCropLivePreviewOverlay = updateCropLivePreviewOverlay;
  window.toggleCropMode = toggleCropMode;
  window._renderLiveCropPreview = renderLiveCropPreview;

  // Signature studio
  window.openSignatureDrawModal = openSignatureDrawModal;
  window.closeSignatureDrawModal = closeSignatureDrawModal;
  window.initSignatureCanvas = initSignatureCanvas;
  window.clearSignaturePad = clearSignaturePad;
  window.saveDrawnSignature = saveDrawnSignature;
  window.downloadDrawnSignature = downloadDrawnSignature;
  window.setSignatureInk = setSignatureInk;
  window.setSignatureStroke = setSignatureStroke;
  window.switchSignatureTab = switchSignatureTab;
  window.initStudioSignatureCanvas = initStudioSignatureCanvas;
  window.clearStudioSignaturePad = clearStudioSignaturePad;
  window.downloadStudioSignature = downloadStudioSignature;
  window.handleSignatureUpload = handleSignatureUpload;

  // GST Studio
  window.gstItems = gstItems;
  window.initGstInvoiceStudio = initGstInvoiceStudio;
  window.renderGstItemsTable = renderGstItemsTable;
  window.onGstItemChange = onGstItemChange;
  window.addGstItemRow = addGstItemRow;
  window.deleteGstItemRow = deleteGstItemRow;
  window.numberToWordsClient = numberToWordsClient;
  window.updateGstInvoicePreview = updateGstInvoicePreview;
  window.printGstInvoicePreview = printGstInvoicePreview;
  window.setGstStudioView = setGstStudioView;
  window.formatInrClient = formatInrClient;

  // POS Studio
  window.initPosStudio = initPosStudio;
  window.updatePosReceiptPreview = updatePosReceiptPreview;
  window.setPosStudioView = setPosStudioView;

  // Tax Receipt Studio
  window.initTaxReceiptStudio = initTaxReceiptStudio;
  window.updateTaxReceiptPreview = updateTaxReceiptPreview;
  window.setTaxReceiptStudioView = setTaxReceiptStudioView;

  // Estimate Studio
  window.initEstimateStudio = initEstimateStudio;
  window.updateEstimatePreview = updateEstimatePreview;
  window.setEstimateStudioView = setEstimateStudioView;

  // AI Preview
  window.copyAiPreviewText = copyAiPreviewText;

  // P2P Studio
  window.initP2pStudio = initP2pStudio;
  window.createP2pRoom = createP2pRoom;
  window.joinP2pRoom = joinP2pRoom;
  window.disconnectP2p = disconnectP2p;
  window.sendP2pFiles = sendP2pFiles;
  window.sendP2pCodeSnippet = sendP2pCodeSnippet;
  window.setP2pStudioTab = setP2pStudioTab;
  window.copyP2pRoomCode = copyP2pRoomCode;
  window.copyP2pJoinUrl = copyP2pJoinUrl;
  window.copyP2pSnippetText = copyP2pSnippetText;

  // PDF Editor Studio
  window.initPdfEditorStudio = initPdfEditorStudio;
  window.switchEditorPage = switchEditorPage;
  window.prevEditorPage = prevEditorPage;
  window.nextEditorPage = nextEditorPage;
  window.renderEditorPage = renderEditorPage;
  window.renderPageAnnotations = renderPageAnnotations;
  window.handleOverlayCanvasMouseDown = handleOverlayCanvasMouseDown;
  window.selectAnnotation = selectAnnotation;
  window.deleteSelectedAnnotation = deleteSelectedAnnotation;
  window.setEditorTool = setEditorTool;
  window.insertStamp = insertStamp;
  window.insertDateStamp = insertDateStamp;
  window.insertSignatureStamp = insertSignatureStamp;
  window.setEditorFontFamily = setEditorFontFamily;
  window.setEditorFontSize = setEditorFontSize;
  window.toggleEditorBold = toggleEditorBold;
  window.toggleEditorItalic = toggleEditorItalic;
  window.setEditorTextColor = setEditorTextColor;
  window.setEditorTextBg = setEditorTextBg;
  window.setEditorShapeType = setEditorShapeType;
  window.setEditorStrokeColor = setEditorStrokeColor;
  window.setEditorStrokeWidth = setEditorStrokeWidth;
  window.zoomEditor = zoomEditor;
  window.undoEditor = undoEditor;
  window.redoEditor = redoEditor;
  window.exportEditedPdf = exportEditedPdf;
  window.setEditorWhiteoutColor = setEditorWhiteoutColor;
  window.redactAndTypeOverSelected = redactAndTypeOverSelected;
  window.handleEditorImageUpload = handleEditorImageUpload;
  window.insertImageAnnotation = insertImageAnnotation;
  window.setupEditorKeyboardAndPaste = setupEditorKeyboardAndPaste;
}
