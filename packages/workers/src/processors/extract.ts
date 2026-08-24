/**
 * @file processors/extract.ts
 * @description Extracts specific pages into standalone files or a single combined file.
 */

import { PDFDocument } from 'pdf-lib';
import {
  ExtractPagesOptions,
  PlatformError,
  ProcessingResult,
  ValidatedFile,
  WorkerExecutionContext,
  validatePdfSafety,
} from '@doc-platform/core';
import { DocumentProcessor, ResourceEstimate } from '@doc-platform/providers';
import { validateOutputDocument } from '../validator.js';

export class ExtractPagesProcessor implements DocumentProcessor<ExtractPagesOptions> {
  readonly operation = 'extract-pages' as const;

  async validateInput(inputFiles: ValidatedFile[], options: ExtractPagesOptions): Promise<void> {
    if (!inputFiles || inputFiles.length !== 1) {
      throw new PlatformError('INVALID_INPUT', { message: 'Extract operation requires 1 input PDF.' });
    }
    if (!options.pages || options.pages.length === 0) {
      throw new PlatformError('INVALID_INPUT', { message: 'Must specify at least 1 page number to extract.' });
    }
  }

  estimateResourceCost(inputFiles: ValidatedFile[], _options: ExtractPagesOptions): ResourceEstimate {
    const size = inputFiles[0]?.sizeBytes || 0;
    return {
      estimatedDurationMs: Math.max(300, Math.round(size / 20000)),
      estimatedMemoryBytes: Math.round(size * 1.5),
      isHeavyOperation: false,
    };
  }

  async process(
    inputBuffers: Buffer[],
    options: ExtractPagesOptions,
    context: WorkerExecutionContext
  ): Promise<ProcessingResult> {
    const startTime = Date.now();
    const inputBuffer = inputBuffers[0];
    validatePdfSafety(inputBuffer);

    await context.onProgress(20, 'Reading PDF structure...');
    const sourcePdf = await PDFDocument.load(inputBuffer);
    const totalPages = sourcePdf.getPageCount();

    const targetIndices = options.pages
      .filter((p) => p >= 1 && p <= totalPages)
      .map((p) => p - 1);

    if (targetIndices.length === 0) {
      throw new PlatformError('INVALID_INPUT', { message: 'None of the requested pages exist in this PDF.' });
    }

    const outputFiles: ProcessingResult['outputFiles'] = [];

    if (options.combineIntoSingleFile !== false) {
      // Combined extracted document
      const newPdf = await PDFDocument.create();
      const copiedPages = await newPdf.copyPages(sourcePdf, targetIndices);
      for (const page of copiedPages) newPdf.addPage(page);
      const bytes = await newPdf.save({ useObjectStreams: true });
      const outputBuffer = Buffer.from(bytes);
      validateOutputDocument(outputBuffer, 'pdf');

      outputFiles.push({
        filename: 'extracted_pages.pdf',
        mimeType: 'application/pdf',
        buffer: outputBuffer,
        pageCount: newPdf.getPageCount(),
      });
    } else {
      // Separate files for each extracted page
      for (let i = 0; i < targetIndices.length; i++) {
        const pageIdx = targetIndices[i];
        const newPdf = await PDFDocument.create();
        const [copiedPage] = await newPdf.copyPages(sourcePdf, [pageIdx]);
        newPdf.addPage(copiedPage);
        const bytes = await newPdf.save({ useObjectStreams: true });
        const outputBuffer = Buffer.from(bytes);
        validateOutputDocument(outputBuffer, 'pdf');

        outputFiles.push({
          filename: `extracted_page_${pageIdx + 1}.pdf`,
          mimeType: 'application/pdf',
          buffer: outputBuffer,
          pageCount: 1,
        });
      }
    }

    await context.onProgress(100, 'Pages extracted successfully.');

    return {
      outputFiles,
      metrics: {
        durationMs: Date.now() - startTime,
        inputSizeBytes: inputBuffer.length,
        outputSizeBytes: outputFiles.reduce((acc, f) => acc + (f.buffer?.length || 0), 0),
      },
    };
  }
}
