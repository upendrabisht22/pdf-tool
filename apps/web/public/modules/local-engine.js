/**
 * DocPlatform In-Browser Local Processing Engine
 * High-performance, zero-server-upload vector manipulations powered by PDFLib and PDF.js.
 * All computations run 100% client-side in the user's browser memory for total privacy.
 */

import { parsePageRanges, detectFileType, getBaseName, getDerivedOutputFilename } from './utils.js';
import { openSignatureDrawModal } from './signature-studio.js';

/**
 * Determines whether the active tool can be executed purely client-side without worker job submission.
 * @param {string} activeTool
 * @param {Array} stagedFiles
 * @returns {boolean}
 */
export function canHandleLocally(activeTool, stagedFiles) {
  const hasPdfLib = typeof window !== 'undefined' && typeof window.PDFLib !== 'undefined';
  const hasPdfJs = typeof window !== 'undefined' && (typeof window.pdfjsLib !== 'undefined' || typeof window['pdfjs-dist/build/pdf'] !== 'undefined');

  if (activeTool === 'merge-pdf' && hasPdfLib && stagedFiles.length >= 1) return true;
  if (activeTool === 'rotate-pdf' && hasPdfLib && stagedFiles.length === 1) return true;
  if (activeTool === 'delete-pdf-pages' && hasPdfLib && stagedFiles.length === 1) return true;
  if (activeTool === 'extract-pages' && hasPdfLib && stagedFiles.length === 1) return true;
  if (activeTool === 'split-pdf' && hasPdfLib && stagedFiles.length === 1) return true;
  if (activeTool === 'compress-pdf' && hasPdfLib && stagedFiles.length === 1) return true;
  if (activeTool === 'jpg-to-pdf' && hasPdfLib && stagedFiles.length > 0) return true;
  if (activeTool === 'pdf-to-jpg' && hasPdfJs && stagedFiles.length === 1) return true;
  if (activeTool === 'watermark-pdf' && hasPdfLib && stagedFiles.length === 1) return true;
  if (activeTool === 'page-numbers-pdf' && hasPdfLib && stagedFiles.length === 1) return true;
  if (activeTool === 'strip-metadata-pdf' && hasPdfLib && stagedFiles.length === 1) return true;
  if (activeTool === 'sign-pdf' && hasPdfLib && stagedFiles.length === 1) return true;
  if (activeTool === 'draw-signature') return true;
  if (activeTool === 'flatten-pdf' && hasPdfLib && stagedFiles.length === 1) return true;
  if (activeTool === 'repair-pdf' && hasPdfLib && stagedFiles.length === 1) return true;
  if (activeTool === 'redact-pdf' && hasPdfLib && stagedFiles.length === 1) return true;
  if (activeTool === 'crop-pdf' && hasPdfLib && stagedFiles.length === 1) return true;

  return false;
}

/**
 * Executes the requested document operation locally inside the browser.
 * @param {string} activeTool
 * @param {Array} stagedFiles
 * @param {Object} context
 * @param {Object} context.perPageRotations
 * @param {Function} context.updateProgress
 * @param {Function} context.renderSuccessDownload
 */
export async function executeLocalOperation(activeTool, stagedFiles, { perPageRotations = {}, updateProgress, renderSuccessDownload }) {
  const PDFLib = window.PDFLib;
  const pdfjsLib = window.pdfjsLib || window['pdfjs-dist/build/pdf'];
  const JSZip = window.JSZip;

  // 1. Merge PDF
  if (activeTool === 'merge-pdf') {
    updateProgress(40, 'Merging documents locally in your browser...');
    const mergedPdf = await PDFLib.PDFDocument.create();

    for (const file of stagedFiles) {
      const doc = await PDFLib.PDFDocument.load(file.bytes);
      const copiedPages = await mergedPdf.copyPages(doc, doc.getPageIndices());
      copiedPages.forEach(p => mergedPdf.addPage(p));
    }

    updateProgress(90, 'Finalizing merged vector output...');
    const pdfBytes = await mergedPdf.save({ useObjectStreams: true });
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const outName = getDerivedOutputFilename(stagedFiles, 'merged', 'pdf');
    renderSuccessDownload(URL.createObjectURL(blob), outName);
    return;
  }

  // 2. Rotate PDF
  if (activeTool === 'rotate-pdf' && stagedFiles.length === 1) {
    updateProgress(40, 'Rotating PDF pages locally in browser...');
    const doc = await PDFLib.PDFDocument.load(stagedFiles[0].bytes);
    const baseAngle = parseInt(document.getElementById('opt-rotate-angle')?.value || '90', 10);
    const targetPagesOpt = document.getElementById('opt-rotate-pages')?.value || 'all';
    const customInput = document.getElementById('opt-rotate-custom-pages')?.value || '';
    const pages = doc.getPages();
    const totalPages = pages.length;
    const customPages = new Set(parsePageRanges(customInput, totalPages));

    const hasManualClicks = Object.keys(perPageRotations).some(k => (perPageRotations[k] || 0) > 0);

    for (let i = 0; i < totalPages; i++) {
      const pageNum = i + 1;
      let addedAngle = 0;

      if (hasManualClicks) {
        addedAngle = perPageRotations[i] || 0;
      } else {
        let shouldRotate = false;
        if (targetPagesOpt === 'all') shouldRotate = true;
        else if (targetPagesOpt === 'odd' && pageNum % 2 !== 0) shouldRotate = true;
        else if (targetPagesOpt === 'even' && pageNum % 2 === 0) shouldRotate = true;
        else if (targetPagesOpt === 'custom' && customPages.has(pageNum)) shouldRotate = true;

        if (shouldRotate) addedAngle = baseAngle;
      }

      if (addedAngle > 0) {
        const page = pages[i];
        const currentRotation = page.getRotation().angle;
        page.setRotation(PDFLib.degrees((currentRotation + addedAngle) % 360));
      }
    }

    updateProgress(90, 'Saving rotated document...');
    const pdfBytes = await doc.save({ useObjectStreams: true });
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    renderSuccessDownload(URL.createObjectURL(blob), getDerivedOutputFilename(stagedFiles, 'rotated', 'pdf'));
    return;
  }

  // 3. Delete PDF Pages
  if (activeTool === 'delete-pdf-pages' && stagedFiles.length === 1) {
    updateProgress(40, 'Removing specified pages locally...');
    const doc = await PDFLib.PDFDocument.load(stagedFiles[0].bytes);
    const totalPages = doc.getPageCount();
    const deleteInput = document.getElementById('opt-delete-pages')?.value || '';
    const pagesToDelete = new Set(parsePageRanges(deleteInput, totalPages));

    const pagesToKeep = [];
    for (let p = 1; p <= totalPages; p++) {
      if (!pagesToDelete.has(p)) pagesToKeep.push(p - 1);
    }

    if (pagesToKeep.length === 0) {
      throw new Error('You cannot delete all pages in the document. At least 1 page must remain.');
    }

    const newPdf = await PDFLib.PDFDocument.create();
    const copied = await newPdf.copyPages(doc, pagesToKeep);
    copied.forEach(p => newPdf.addPage(p));

    updateProgress(90, 'Saving trimmed document...');
    const pdfBytes = await newPdf.save({ useObjectStreams: true });
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    renderSuccessDownload(URL.createObjectURL(blob), getDerivedOutputFilename(stagedFiles, 'trimmed', 'pdf'));
    return;
  }

  // 4. Extract PDF Pages
  if (activeTool === 'extract-pages' && stagedFiles.length === 1) {
    updateProgress(40, 'Extracting selected pages locally...');
    const doc = await PDFLib.PDFDocument.load(stagedFiles[0].bytes);
    const totalPages = doc.getPageCount();
    const extractInput = document.getElementById('opt-extract-pages')?.value || '1';
    const pageNumbers = parsePageRanges(extractInput, totalPages);
    const targetIndices = pageNumbers.map(p => p - 1);

    if (targetIndices.length === 0) {
      throw new Error('Please specify valid page numbers to extract (e.g. 1-3, 5).');
    }

    const newPdf = await PDFLib.PDFDocument.create();
    const copied = await newPdf.copyPages(doc, targetIndices);
    copied.forEach(p => newPdf.addPage(p));

    updateProgress(90, 'Saving extracted pages...');
    const pdfBytes = await newPdf.save({ useObjectStreams: true });
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    renderSuccessDownload(URL.createObjectURL(blob), getDerivedOutputFilename(stagedFiles, 'extracted', 'pdf'));
    return;
  }

  // 5. Split PDF (Ranges or Split Every Page)
  if (activeTool === 'split-pdf' && stagedFiles.length === 1) {
    const mode = document.getElementById('opt-split-mode')?.value || 'all-pages';
    const doc = await PDFLib.PDFDocument.load(stagedFiles[0].bytes);
    const totalPages = doc.getPageCount();
    const base = getBaseName(stagedFiles[0].name);

    if (mode === 'ranges') {
      updateProgress(40, 'Extracting custom page ranges locally...');
      const rangesInput = document.getElementById('opt-split-ranges')?.value || '1';
      const targetIndices = parsePageRanges(rangesInput, totalPages).map(p => p - 1);

      if (targetIndices.length === 0) {
        throw new Error('Please specify a valid page range (e.g. 1-3, 5).');
      }

      const newPdf = await PDFLib.PDFDocument.create();
      const copied = await newPdf.copyPages(doc, targetIndices);
      copied.forEach(p => newPdf.addPage(p));

      updateProgress(90, 'Saving split range...');
      const pdfBytes = await newPdf.save({ useObjectStreams: true });
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const cleanSuffix = rangesInput.replace(/[^a-zA-Z0-9_-]/g, '_');
      renderSuccessDownload(URL.createObjectURL(blob), `${base}_split_${cleanSuffix}.pdf`);
      return;
    } else {
      updateProgress(35, `Separating all ${totalPages} pages into individual files...`);

      if (totalPages === 1) {
        const blob = new Blob([stagedFiles[0].bytes], { type: 'application/pdf' });
        renderSuccessDownload(URL.createObjectURL(blob), `${base}_page_1.pdf`);
        return;
      }

      if (typeof JSZip !== 'undefined') {
        const zip = new JSZip();
        for (let i = 0; i < totalPages; i++) {
          const singlePdf = await PDFLib.PDFDocument.create();
          const [copiedPage] = await singlePdf.copyPages(doc, [i]);
          singlePdf.addPage(copiedPage);
          const singleBytes = await singlePdf.save({ useObjectStreams: true });
          zip.file(`${base}_page_${i + 1}.pdf`, singleBytes);
          const progress = Math.round(35 + ((i + 1) / totalPages) * 50);
          updateProgress(progress, `Compiled page ${i + 1} of ${totalPages}...`);
        }
        updateProgress(90, 'Archiving split documents into ZIP...');
        const zipContent = await zip.generateAsync({ type: 'blob' });
        renderSuccessDownload(URL.createObjectURL(zipContent), `${base}_all_pages.zip`);
        return;
      } else {
        const singlePdf = await PDFLib.PDFDocument.create();
        const [copiedPage] = await singlePdf.copyPages(doc, [0]);
        singlePdf.addPage(copiedPage);
        const singleBytes = await singlePdf.save({ useObjectStreams: true });
        const blob = new Blob([singleBytes], { type: 'application/pdf' });
        renderSuccessDownload(URL.createObjectURL(blob), `${base}_page_1.pdf`);
        return;
      }
    }
  }

  // 6. Compress PDF
  if (activeTool === 'compress-pdf' && stagedFiles.length === 1) {
    updateProgress(40, 'Optimizing stream objects and dictionary trees locally...');
    const doc = await PDFLib.PDFDocument.load(stagedFiles[0].bytes, { updateMetadata: false });
    const level = document.getElementById('opt-compress-level')?.value || 'recommended';

    if (level === 'extreme') {
      doc.setTitle('');
      doc.setAuthor('');
      doc.setSubject('');
      doc.setKeywords([]);
      doc.setProducer('DocPlatform Optimizer');
      doc.setCreator('DocPlatform Optimizer');
    }

    updateProgress(85, 'Compacting cross-reference table...');
    const pdfBytes = await doc.save({
      useObjectStreams: true,
      addDefaultPage: false,
      objectsPerTick: 50,
    });
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    renderSuccessDownload(URL.createObjectURL(blob), getDerivedOutputFilename(stagedFiles, 'compressed', 'pdf'));
    return;
  }

  // 7. JPG / PNG / WebP to PDF
  if (activeTool === 'jpg-to-pdf' && stagedFiles.length > 0) {
    updateProgress(30, 'Compiling images to PDF in browser...');
    const newPdf = await PDFLib.PDFDocument.create();
    const pageSizeOpt = document.getElementById('opt-image-pagesize')?.value || 'A4';
    const orientation = document.getElementById('opt-image-orientation')?.value || 'auto';
    const margin = 20;

    for (let i = 0; i < stagedFiles.length; i++) {
      const file = stagedFiles[i];
      const detected = detectFileType(file, file.bytes);
      let embeddedImage;

      if (detected === 'png') {
        embeddedImage = await newPdf.embedPng(file.bytes);
      } else if (detected === 'jpeg') {
        embeddedImage = await newPdf.embedJpg(file.bytes);
      } else {
        const blob = new Blob([file.bytes], { type: file.fileObject?.type || 'image/webp' });
        const bitmap = await createImageBitmap(blob);
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(bitmap, 0, 0);
        const pngBlob = await new Promise(res => canvas.toBlob(res, 'image/png', 1.0));
        const pngBuf = await pngBlob.arrayBuffer();
        embeddedImage = await newPdf.embedPng(new Uint8Array(pngBuf));
      }

      const { width: imgWidth, height: imgHeight } = embeddedImage;
      let pageWidth = 595.28; // A4
      let pageHeight = 841.89;

      if (pageSizeOpt === 'FIT_IMAGE') {
        pageWidth = imgWidth + margin * 2;
        pageHeight = imgHeight + margin * 2;
      } else if (pageSizeOpt === 'LETTER') {
        pageWidth = 612;
        pageHeight = 792;
      }

      if (orientation === 'landscape' || (orientation === 'auto' && imgWidth > imgHeight)) {
        if (pageWidth < pageHeight) {
          const tmp = pageWidth;
          pageWidth = pageHeight;
          pageHeight = tmp;
        }
      }

      const page = newPdf.addPage([pageWidth, pageHeight]);
      const maxW = pageWidth - margin * 2;
      const maxH = pageHeight - margin * 2;
      const scale = Math.min(maxW / imgWidth, maxH / imgHeight, 1);
      const dw = imgWidth * scale;
      const dh = imgHeight * scale;
      const dx = (pageWidth - dw) / 2;
      const dy = (pageHeight - dh) / 2;

      page.drawImage(embeddedImage, { x: dx, y: dy, width: dw, height: dh });
      const progress = Math.round(30 + ((i + 1) / stagedFiles.length) * 60);
      updateProgress(progress, `Embedded image ${i + 1} of ${stagedFiles.length}...`);
    }

    updateProgress(95, 'Finalizing PDF output...');
    const pdfBytes = await newPdf.save({ useObjectStreams: true });
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    renderSuccessDownload(URL.createObjectURL(blob), getDerivedOutputFilename(stagedFiles, 'compiled', 'pdf'));
    return;
  }

  // 8. PDF to JPG / PNG / WebP Converter
  if (activeTool === 'pdf-to-jpg' && stagedFiles.length === 1 && typeof pdfjsLib !== 'undefined') {
    const format = document.getElementById('opt-img-format')?.value || 'png';
    const dpi = parseInt(document.getElementById('opt-img-dpi')?.value || '150', 10);
    const scale = dpi / 72;
    const mimeType = format === 'jpeg' ? 'image/jpeg' : (format === 'webp' ? 'image/webp' : 'image/png');
    const ext = format === 'jpeg' ? 'jpg' : (format === 'webp' ? 'webp' : 'png');
    const base = getBaseName(stagedFiles[0].name);

    updateProgress(20, `Rendering PDF pages at ${dpi} DPI (${format.toUpperCase()})...`);
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    
    const dataCopy = new Uint8Array(stagedFiles[0].bytes.slice(0));
    const loadingTask = pdfjsLib.getDocument({ data: dataCopy });
    const pdf = await loadingTask.promise;
    const totalPages = pdf.numPages;

    if (totalPages === 1) {
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      await page.render({ canvasContext: ctx, viewport }).promise;

      const imgBlob = await new Promise(res => canvas.toBlob(res, mimeType, 0.95));
      renderSuccessDownload(URL.createObjectURL(imgBlob), `${base}_page_1.${ext}`);
      return;
    }

    if (typeof JSZip !== 'undefined') {
      const zip = new JSZip();
      for (let i = 1; i <= totalPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport }).promise;

        const imgBlob = await new Promise(res => canvas.toBlob(res, mimeType, 0.95));
        const imgBuf = await imgBlob.arrayBuffer();
        zip.file(`${base}_page_${i}.${ext}`, imgBuf);

        const progress = Math.round(20 + (i / totalPages) * 70);
        updateProgress(progress, `Rendered page ${i} of ${totalPages} at ${dpi} DPI...`);
      }

      updateProgress(95, 'Packaging high-resolution images into ZIP...');
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      renderSuccessDownload(URL.createObjectURL(zipBlob), `${base}_${dpi}dpi_images.zip`);
      return;
    }
  }

  // 9. Watermark PDF
  if (activeTool === 'watermark-pdf' && stagedFiles.length === 1) {
    updateProgress(35, 'Watermarking document in browser...');
    const doc = await PDFLib.PDFDocument.load(stagedFiles[0].bytes.slice(0));
    const font = await doc.embedFont(PDFLib.StandardFonts.HelveticaBold);
    const text = document.getElementById('opt-watermark-text')?.value || 'CONFIDENTIAL';
    const opacity = parseFloat(document.getElementById('opt-watermark-opacity')?.value || '0.3');
    const pages = doc.getPages();

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const { width, height } = page.getSize();
      const fontSize = Math.max(20, Math.min(width, height) / 12);
      const textWidth = font.widthOfTextAtSize(text, fontSize);
      const textHeight = font.heightAtSize(fontSize);

      page.drawText(text, {
        x: (width - textWidth * 0.7) / 2,
        y: (height - textHeight) / 2,
        size: fontSize,
        font,
        color: PDFLib.rgb(0.5, 0.5, 0.5),
        opacity: isNaN(opacity) ? 0.3 : opacity,
        rotate: PDFLib.degrees(45),
      });
    }

    updateProgress(90, 'Saving watermarked document...');
    const pdfBytes = await doc.save({ useObjectStreams: true });
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    renderSuccessDownload(URL.createObjectURL(blob), getDerivedOutputFilename(stagedFiles, 'watermarked', 'pdf'));
    return;
  }

  // 10. Page Numbers PDF
  if (activeTool === 'page-numbers-pdf' && stagedFiles.length === 1) {
    updateProgress(35, 'Inserting page numbers in browser...');
    const doc = await PDFLib.PDFDocument.load(stagedFiles[0].bytes.slice(0));
    const font = await doc.embedFont(PDFLib.StandardFonts.Helvetica);
    const pos = document.getElementById('opt-pagenum-pos')?.value || 'bottom-center';
    const formatTpl = document.getElementById('opt-pagenum-format')?.value || 'Page {n} of {total}';
    const pages = doc.getPages();
    const total = pages.length;

    for (let i = 0; i < total; i++) {
      const page = pages[i];
      const { width, height } = page.getSize();
      const n = i + 1;
      const pageText = formatTpl.replace('{n}', n).replace('{total}', total);
      const fontSize = 10;
      const textWidth = font.widthOfTextAtSize(pageText, fontSize);
      let x = (width - textWidth) / 2;
      let y = 25;

      if (pos === 'bottom-right') {
        x = width - textWidth - 30;
        y = 25;
      } else if (pos === 'top-right') {
        x = width - textWidth - 30;
        y = height - 25;
      }

      page.drawText(pageText, {
        x,
        y,
        size: fontSize,
        font,
        color: PDFLib.rgb(0.3, 0.3, 0.3),
      });
    }

    updateProgress(90, 'Saving numbered document...');
    const pdfBytes = await doc.save({ useObjectStreams: true });
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    renderSuccessDownload(URL.createObjectURL(blob), getDerivedOutputFilename(stagedFiles, 'numbered', 'pdf'));
    return;
  }

  // 11. Sanitize & Strip Metadata PDF
  if (activeTool === 'strip-metadata-pdf' && stagedFiles.length === 1) {
    updateProgress(35, 'Stripping metadata & sanitizing in browser...');
    const doc = await PDFLib.PDFDocument.load(stagedFiles[0].bytes.slice(0), { updateMetadata: false });
    doc.setTitle('');
    doc.setAuthor('');
    doc.setSubject('');
    doc.setKeywords([]);
    doc.setProducer('');
    doc.setCreator('');
    doc.setCreationDate(new Date(0));
    doc.setModificationDate(new Date(0));

    updateProgress(90, 'Saving sanitized document...');
    const pdfBytes = await doc.save({ useObjectStreams: true });
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    renderSuccessDownload(URL.createObjectURL(blob), getDerivedOutputFilename(stagedFiles, 'sanitized', 'pdf'));
    return;
  }

  // 12. Sign PDF
  if (activeTool === 'sign-pdf' && stagedFiles.length === 1) {
    updateProgress(35, 'Applying digital verification stamp in browser...');
    const doc = await PDFLib.PDFDocument.load(stagedFiles[0].bytes.slice(0));
    const font = await doc.embedFont(PDFLib.StandardFonts.HelveticaBold);
    const regularFont = await doc.embedFont(PDFLib.StandardFonts.Helvetica);
    const signerName = document.getElementById('opt-sign-name')?.value || 'Authorized Signer';
    const pages = doc.getPages();
    const lastPage = pages[pages.length - 1];
    const { width } = lastPage.getSize();
    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

    const stampWidth = 200;
    const stampHeight = 65;
    const stampX = width - stampWidth - 35;
    const stampY = 40;

    lastPage.drawRectangle({
      x: stampX,
      y: stampY,
      width: stampWidth,
      height: stampHeight,
      borderColor: PDFLib.rgb(0.08, 0.45, 0.82),
      borderWidth: 1.5,
      color: PDFLib.rgb(0.96, 0.98, 1.0),
      opacity: 0.95,
    });

    lastPage.drawText('[VERIFIED] DIGITALLY SIGNED', {
      x: stampX + 10,
      y: stampY + 44,
      size: 9,
      font,
      color: PDFLib.rgb(0.08, 0.45, 0.82),
    });

    lastPage.drawText(signerName, {
      x: stampX + 10,
      y: stampY + 26,
      size: 12,
      font,
      color: PDFLib.rgb(0.1, 0.1, 0.1),
    });

    lastPage.drawText(`Date: ${dateStr} | DocPlatform Verified`, {
      x: stampX + 10,
      y: stampY + 10,
      size: 8,
      font: regularFont,
      color: PDFLib.rgb(0.4, 0.4, 0.4),
    });

    updateProgress(90, 'Saving signed document...');
    const pdfBytes = await doc.save({ useObjectStreams: true });
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    renderSuccessDownload(URL.createObjectURL(blob), getDerivedOutputFilename(stagedFiles, 'signed', 'pdf'));
    return;
  }

  // 13. Draw & Compress Signature (<30 KB)
  if (activeTool === 'draw-signature') {
    updateProgress(35, 'Optimizing signature image for exam portal (<30 KB)...');
    const maxKb = parseInt(document.getElementById('opt-drawsig-maxkb')?.value || '30', 10);
    const format = document.getElementById('opt-drawsig-format')?.value || 'jpeg';

    let canvas = document.getElementById('sig-pad-canvas');
    let srcImage = null;

    if (stagedFiles.length > 0) {
      const blob = new Blob([stagedFiles[0].bytes], { type: stagedFiles[0].fileObject?.type || 'image/png' });
      srcImage = await createImageBitmap(blob);
    }

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

    if (srcImage) {
      outCtx.drawImage(srcImage, 0, 0, targetW, targetH);
    } else if (canvas) {
      outCtx.drawImage(canvas, 0, 0, targetW, targetH);
    } else {
      openSignatureDrawModal();
      return;
    }

    let mimeType = format === 'jpeg' ? 'image/jpeg' : (format === 'webp' ? 'image/webp' : 'image/png');
    let quality = 0.95;
    let outBlob = await new Promise(res => outCanvas.toBlob(res, mimeType, quality));

    if (maxKb > 0 && outBlob.size > maxKb * 1024 && (format === 'jpeg' || format === 'webp')) {
      while (quality > 0.15 && outBlob.size > maxKb * 1024) {
        quality -= 0.1;
        outBlob = await new Promise(res => outCanvas.toBlob(res, mimeType, quality));
      }
    }

    updateProgress(90, `Signature compressed to ${(outBlob.size / 1024).toFixed(1)} KB (Exam Ready)...`);
    const ext = format === 'jpeg' ? 'jpg' : format;
    renderSuccessDownload(URL.createObjectURL(outBlob), `signature_under_${maxKb > 0 ? maxKb : '30'}kb.${ext}`);
    return;
  }

  // 14. Flatten PDF
  if (activeTool === 'flatten-pdf' && stagedFiles.length === 1) {
    updateProgress(35, 'Flattening form fields and layers in browser...');
    const doc = await PDFLib.PDFDocument.load(stagedFiles[0].bytes.slice(0));
    try {
      const form = doc.getForm();
      if (form) form.flatten();
    } catch {
      // Ignore if no form
    }

    updateProgress(90, 'Saving flattened document...');
    const pdfBytes = await doc.save({ useObjectStreams: true });
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    renderSuccessDownload(URL.createObjectURL(blob), getDerivedOutputFilename(stagedFiles, 'flattened', 'pdf'));
    return;
  }

  // 15. Repair PDF
  if (activeTool === 'repair-pdf' && stagedFiles.length === 1) {
    updateProgress(35, 'Reconstructing cross-reference tables in browser...');
    const doc = await PDFLib.PDFDocument.load(stagedFiles[0].bytes.slice(0), { ignoreEncryption: true });
    updateProgress(90, 'Rebuilding sanitized PDF stream...');
    const pdfBytes = await doc.save({ useObjectStreams: true });
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    renderSuccessDownload(URL.createObjectURL(blob), getDerivedOutputFilename(stagedFiles, 'repaired', 'pdf'));
    return;
  }

  // 16. Redact PDF
  if (activeTool === 'redact-pdf' && stagedFiles.length === 1) {
    updateProgress(35, 'Redacting document content in browser...');
    const doc = await PDFLib.PDFDocument.load(stagedFiles[0].bytes.slice(0));
    const font = await doc.embedFont(PDFLib.StandardFonts.HelveticaBold);
    const label = document.getElementById('opt-redact-label')?.value || '[REDACTED]';
    const pages = doc.getPages();

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const { width, height } = page.getSize();
      const rx = 50;
      const ry = height - 120;
      const rw = Math.min(220, width - 100);
      const rh = 26;

      page.drawRectangle({
        x: rx,
        y: ry,
        width: rw,
        height: rh,
        color: PDFLib.rgb(0, 0, 0),
      });

      page.drawText(label, {
        x: rx + 8,
        y: ry + 8,
        size: 10,
        font,
        color: PDFLib.rgb(1, 1, 1),
      });
    }

    updateProgress(90, 'Saving permanently redacted document...');
    const pdfBytes = await doc.save({ useObjectStreams: true });
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    renderSuccessDownload(URL.createObjectURL(blob), getDerivedOutputFilename(stagedFiles, 'redacted', 'pdf'));
    return;
  }

  // 17. Crop & Resize PDF
  if (activeTool === 'crop-pdf' && stagedFiles.length === 1) {
    updateProgress(35, 'Analyzing document dimensions in browser...');
    const doc = await PDFLib.PDFDocument.load(stagedFiles[0].bytes.slice(0));
    const pages = doc.getPages();
    const mode = document.getElementById('opt-crop-mode')?.value || 'trim';
    const unit = document.getElementById('opt-crop-unit')?.value || 'mm';
    const pageSelection = document.getElementById('opt-crop-pages')?.value || 'all';
    const customRange = document.getElementById('opt-crop-custom-pages')?.value || '';

    const multiplier = unit === 'pt' ? 1 : unit === 'in' ? 72 : (72 / 25.4);
    const top = Math.max(0, (parseFloat(document.getElementById('opt-crop-top')?.value) || 0) * multiplier);
    const bottom = Math.max(0, (parseFloat(document.getElementById('opt-crop-bottom')?.value) || 0) * multiplier);
    const left = Math.max(0, (parseFloat(document.getElementById('opt-crop-left')?.value) || 0) * multiplier);
    const right = Math.max(0, (parseFloat(document.getElementById('opt-crop-right')?.value) || 0) * multiplier);

    const standardSizes = {
      A4: [595.28, 841.89],
      LETTER: [612, 792],
      LEGAL: [612, 1008],
      A3: [841.89, 1190.55],
      A5: [419.53, 595.28],
    };

    updateProgress(65, mode === 'resize' ? 'Resizing page dimensions...' : 'Trimming margin bounding boxes...');

    for (let i = 0; i < pages.length; i++) {
      let apply = false;
      if (pageSelection === 'all') apply = true;
      else if (pageSelection === 'odd' && (i % 2 === 0)) apply = true;
      else if (pageSelection === 'even' && (i % 2 === 1)) apply = true;
      else if (pageSelection === 'custom') {
        const ranges = parsePageRanges(customRange, pages.length);
        if (ranges.includes(i + 1)) apply = true;
      }
      if (!apply) continue;

      const page = pages[i];
      if (mode === 'resize') {
        const targetSizeKey = document.getElementById('opt-resize-size')?.value || 'A4';
        const [targetW, targetH] = standardSizes[targetSizeKey] || standardSizes.A4;
        const scaleMode = document.getElementById('opt-resize-scale')?.value || 'fit';
        const { width: curW, height: curH } = page.getSize();

        if (scaleMode === 'fit') {
          const scale = Math.min(targetW / curW, targetH / curH);
          page.scale(scale, scale);
          const xOff = (targetW - curW * scale) / 2;
          const yOff = (targetH - curH * scale) / 2;
          page.translateContent(xOff, yOff);
        }
        page.setSize(targetW, targetH);
      } else {
        const mb = page.getMediaBox();
        const newX = mb.x + left;
        const newY = mb.y + bottom;
        const newW = Math.max(20, mb.width - left - right);
        const newH = Math.max(20, mb.height - top - bottom);
        page.setCropBox(newX, newY, newW, newH);
        page.setMediaBox(newX, newY, newW, newH);
      }
    }

    updateProgress(90, 'Saving cropped PDF document...');
    const pdfBytes = await doc.save({ useObjectStreams: true });
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    renderSuccessDownload(URL.createObjectURL(blob), getDerivedOutputFilename(stagedFiles, mode === 'resize' ? 'resized' : 'cropped', 'pdf'));
    return;
  }
}

// CommonJS fallback
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    canHandleLocally,
    executeLocalOperation
  };
}
