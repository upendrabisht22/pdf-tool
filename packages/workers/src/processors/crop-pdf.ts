/**
 * @file processors/crop-pdf.ts
 * @description PDF Crop & Resize Processor supporting margin trimming and standard sheet resizing.
 */

import { PDFDocument } from 'pdf-lib';
import {
  PlatformError,
  ProcessingResult,
  CropPdfOptions,
  ValidatedFile,
  WorkerExecutionContext,
  validatePdfSafety,
} from '@doc-platform/core';
import { DocumentProcessor, ResourceEstimate } from '@doc-platform/providers';
import { validateOutputDocument } from '../validator.js';

const MM_TO_POINTS = 72 / 25.4; // 2.83464567 points per mm
const IN_TO_POINTS = 72;

const STANDARD_SIZES: Record<string, [number, number]> = {
  A4: [595.28, 841.89],
  LETTER: [612, 792],
  LEGAL: [612, 1008],
  A3: [841.89, 1190.55],
  A5: [419.53, 595.28],
};

export class CropPdfProcessor implements DocumentProcessor<CropPdfOptions> {
  readonly operation = 'crop-pdf' as const;

  async validateInput(inputFiles: ValidatedFile[], _options: CropPdfOptions): Promise<void> {
    if (!inputFiles || inputFiles.length !== 1) {
      throw new PlatformError('INVALID_INPUT', {
        message: 'Crop operation requires exactly 1 input PDF file.',
      });
    }
  }

  estimateResourceCost(inputFiles: ValidatedFile[], _options: CropPdfOptions): ResourceEstimate {
    const size = inputFiles[0]?.sizeBytes || 0;
    return {
      estimatedDurationMs: Math.max(300, Math.round(size / 20000)),
      estimatedMemoryBytes: Math.round(size * 2.5),
      isHeavyOperation: size > 40 * 1024 * 1024,
    };
  }

  async process(
    inputBuffers: Buffer[],
    options: CropPdfOptions,
    context: WorkerExecutionContext
  ): Promise<ProcessingResult> {
    const startTime = Date.now();
    const inputBuffer = inputBuffers[0];
    validatePdfSafety(inputBuffer);

    await context.onProgress(15, 'Parsing document geometry...');
    let pdfDoc: PDFDocument;
    try {
      pdfDoc = await PDFDocument.load(inputBuffer);
    } catch (err: unknown) {
      throw new PlatformError('FILE_CORRUPTED', { message: `Failed to parse PDF: ${(err as Error).message}` });
    }

    const pages = pdfDoc.getPages();
    const totalPages = pages.length;
    if (totalPages === 0) {
      throw new PlatformError('INVALID_INPUT', { message: 'PDF document contains no pages to crop.' });
    }

    // Determine target page indices
    const targetIndices = new Set<number>();
    if (!options.pages || options.pages === 'all') {
      for (let i = 0; i < totalPages; i++) targetIndices.add(i);
    } else if (options.pages === 'odd') {
      for (let i = 0; i < totalPages; i += 2) targetIndices.add(i);
    } else if (options.pages === 'even') {
      for (let i = 1; i < totalPages; i += 2) targetIndices.add(i);
    } else if (Array.isArray(options.pages)) {
      for (const p of options.pages) {
        if (p >= 1 && p <= totalPages) targetIndices.add(p - 1);
      }
    } else if (typeof options.pages === 'string') {
      const parts = options.pages.split(',');
      for (const part of parts) {
        const trimmed = part.trim();
        if (trimmed.includes('-')) {
          const [start, end] = trimmed.split('-').map(n => parseInt(n.trim(), 10));
          if (!isNaN(start) && !isNaN(end)) {
            for (let p = Math.min(start, end); p <= Math.max(start, end); p++) {
              if (p >= 1 && p <= totalPages) targetIndices.add(p - 1);
            }
          }
        } else {
          const p = parseInt(trimmed, 10);
          if (!isNaN(p) && p >= 1 && p <= totalPages) targetIndices.add(p - 1);
        }
      }
    }

    await context.onProgress(40, 'Applying geometric crop transformations...');
    const mode = options.mode || 'trim';

    if (mode === 'resize') {
      const targetSizeKey = (options.targetSize || 'A4').toUpperCase();
      const targetDims = STANDARD_SIZES[targetSizeKey] || STANDARD_SIZES.A4;
      const [targetW, targetH] = targetDims;

      for (const i of targetIndices) {
        const page = pages[i];
        const { width: curW, height: curH } = page.getSize();
        const scale = Math.min(targetW / curW, targetH / curH);
        page.scale(scale, scale);
        const newW = curW * scale;
        const newH = curH * scale;

        const xOffset = (targetW - newW) / 2;
        const yOffset = (targetH - newH) / 2;
        page.setSize(targetW, targetH);
        page.translateContent(xOffset, yOffset);
      }
    } else {
      // Trim margins
      let unitMultiplier = 1;
      if (options.unit === 'mm') unitMultiplier = MM_TO_POINTS;
      else if (options.unit === 'in') unitMultiplier = IN_TO_POINTS;

      const topPts = (options.top || 0) * unitMultiplier;
      const bottomPts = (options.bottom || 0) * unitMultiplier;
      const leftPts = (options.left || 0) * unitMultiplier;
      const rightPts = (options.right || 0) * unitMultiplier;

      for (const i of targetIndices) {
        const page = pages[i];
        const mediaBox = page.getMediaBox();
        const curWidth = mediaBox.width;
        const curHeight = mediaBox.height;

        const newX = mediaBox.x + leftPts;
        const newY = mediaBox.y + bottomPts;
        const newWidth = Math.max(20, curWidth - leftPts - rightPts);
        const newHeight = Math.max(20, curHeight - topPts - bottomPts);

        page.setCropBox(newX, newY, newWidth, newHeight);
        page.setMediaBox(newX, newY, newWidth, newHeight);
      }
    }

    await context.onProgress(85, 'Compiling output vector PDF...');
    const outBytes = await pdfDoc.save();
    const outputBuffer = Buffer.from(outBytes);

    validateOutputDocument(outputBuffer, 'pdf');

    return {
      outputFiles: [
        {
          filename: 'cropped_document.pdf',
          mimeType: 'application/pdf',
          buffer: outputBuffer,
          pageCount: totalPages,
        },
      ],
      metrics: {
        durationMs: Date.now() - startTime,
        inputSizeBytes: inputBuffer.length,
        outputSizeBytes: outputBuffer.length,
        totalPageCount: totalPages,
      },
    };
  }
}
