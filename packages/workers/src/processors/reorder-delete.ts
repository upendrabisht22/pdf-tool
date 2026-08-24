/**
 * @file processors/reorder-delete.ts
 * @description Reorders or deletes PDF pages based on a custom sequence array.
 */

import { PDFDocument } from 'pdf-lib';
import {
  PlatformError,
  ProcessingResult,
  ReorderDeletePagesOptions,
  ValidatedFile,
  WorkerExecutionContext,
  validatePdfSafety,
} from '@doc-platform/core';
import { DocumentProcessor, ResourceEstimate } from '@doc-platform/providers';
import { validateOutputDocument } from '../validator.js';

export class ReorderDeletePagesProcessor implements DocumentProcessor<ReorderDeletePagesOptions> {
  readonly operation = 'reorder-pdf' as const;

  async validateInput(inputFiles: ValidatedFile[], options: ReorderDeletePagesOptions): Promise<void> {
    if (!inputFiles || inputFiles.length !== 1) {
      throw new PlatformError('INVALID_INPUT', { message: 'Reorder/Delete operation requires 1 input PDF.' });
    }
    if (!options.pageOrder || options.pageOrder.length === 0) {
      throw new PlatformError('INVALID_INPUT', { message: 'At least 1 page must be retained in the final document.' });
    }
  }

  estimateResourceCost(inputFiles: ValidatedFile[], _options: ReorderDeletePagesOptions): ResourceEstimate {
    const size = inputFiles[0]?.sizeBytes || 0;
    return {
      estimatedDurationMs: Math.max(300, Math.round(size / 20000)),
      estimatedMemoryBytes: Math.round(size * 2),
      isHeavyOperation: false,
    };
  }

  async process(
    inputBuffers: Buffer[],
    options: ReorderDeletePagesOptions,
    context: WorkerExecutionContext
  ): Promise<ProcessingResult> {
    const startTime = Date.now();
    const inputBuffer = inputBuffers[0];
    validatePdfSafety(inputBuffer);

    await context.onProgress(20, 'Loading source document...');
    const sourcePdf = await PDFDocument.load(inputBuffer);
    const totalPages = sourcePdf.getPageCount();

    // Map 1-indexed requested page order to 0-indexed indices
    const validIndices = options.pageOrder
      .filter((p) => p >= 1 && p <= totalPages)
      .map((p) => p - 1);

    if (validIndices.length === 0) {
      throw new PlatformError('INVALID_INPUT', {
        message: 'No valid pages found within document bounds.',
      });
    }

    await context.onProgress(50, 'Assembling reorganized pages...');
    const newPdf = await PDFDocument.create();
    const copiedPages = await newPdf.copyPages(sourcePdf, validIndices);
    for (const page of copiedPages) {
      newPdf.addPage(page);
    }

    await context.onProgress(85, 'Saving modified PDF...');
    const bytes = await newPdf.save({ useObjectStreams: true });
    const outputBuffer = Buffer.from(bytes);

    validateOutputDocument(outputBuffer, 'pdf');
    await context.onProgress(100, 'Page reorganization complete.');

    return {
      outputFiles: [
        {
          filename: 'reordered_document.pdf',
          mimeType: 'application/pdf',
          buffer: outputBuffer,
          pageCount: newPdf.getPageCount(),
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
