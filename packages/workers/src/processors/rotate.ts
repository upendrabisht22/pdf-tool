/**
 * @file processors/rotate.ts
 * @description PDF Rotation Processor supporting 90, 180, and 270 degree permanent transformations.
 */

import { degrees, PDFDocument } from 'pdf-lib';
import {
  PlatformError,
  ProcessingResult,
  RotatePdfOptions,
  ValidatedFile,
  WorkerExecutionContext,
  validatePdfSafety,
} from '@doc-platform/core';
import { DocumentProcessor, ResourceEstimate } from '@doc-platform/providers';
import { validateOutputDocument } from '../validator.js';

export class RotatePdfProcessor implements DocumentProcessor<RotatePdfOptions> {
  readonly operation = 'rotate-pdf' as const;

  async validateInput(inputFiles: ValidatedFile[], options: RotatePdfOptions): Promise<void> {
    if (!inputFiles || inputFiles.length !== 1) {
      throw new PlatformError('INVALID_INPUT', { message: 'Rotate operation requires 1 input PDF.' });
    }
    if (![90, 180, 270].includes(options.rotation)) {
      throw new PlatformError('INVALID_INPUT', { message: 'Rotation must be 90, 180, or 270 degrees.' });
    }
  }

  estimateResourceCost(inputFiles: ValidatedFile[], _options: RotatePdfOptions): ResourceEstimate {
    const size = inputFiles[0]?.sizeBytes || 0;
    return {
      estimatedDurationMs: Math.max(300, Math.round(size / 20000)),
      estimatedMemoryBytes: Math.round(size * 1.8),
      isHeavyOperation: false,
    };
  }

  async process(
    inputBuffers: Buffer[],
    options: RotatePdfOptions,
    context: WorkerExecutionContext
  ): Promise<ProcessingResult> {
    const startTime = Date.now();
    const inputBuffer = inputBuffers[0];
    validatePdfSafety(inputBuffer);

    await context.onProgress(20, 'Loading document...');
    const pdfDoc = await PDFDocument.load(inputBuffer);
    const pages = pdfDoc.getPages();
    const totalPages = pages.length;

    await context.onProgress(50, 'Applying rotation to specified pages...');
    for (let i = 0; i < totalPages; i++) {
      const pageNum = i + 1;
      let shouldRotate = false;

      if (options.targetPages === 'all') {
        shouldRotate = true;
      } else if (options.targetPages === 'odd' && pageNum % 2 !== 0) {
        shouldRotate = true;
      } else if (options.targetPages === 'even' && pageNum % 2 === 0) {
        shouldRotate = true;
      } else if (Array.isArray(options.targetPages) && options.targetPages.includes(pageNum)) {
        shouldRotate = true;
      }

      if (shouldRotate) {
        const page = pages[i];
        const currentRotation = page.getRotation().angle;
        page.setRotation(degrees((currentRotation + options.rotation) % 360));
      }
    }

    await context.onProgress(85, 'Saving rotated document...');
    const bytes = await pdfDoc.save({ useObjectStreams: true });
    const outputBuffer = Buffer.from(bytes);

    validateOutputDocument(outputBuffer, 'pdf');
    await context.onProgress(100, 'Rotation complete.');

    return {
      outputFiles: [
        {
          filename: 'rotated_document.pdf',
          mimeType: 'application/pdf',
          buffer: outputBuffer,
          pageCount: totalPages,
        },
      ],
      metrics: {
        durationMs: Date.now() - startTime,
        inputSizeBytes: inputBuffer.length,
        outputSizeBytes: outputBuffer.length,
      },
    };
  }
}
