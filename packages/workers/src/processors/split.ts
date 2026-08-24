/**
 * @file processors/split.ts
 * @description PDF Split Processor supporting range extraction and individual page splitting.
 */

import { PDFDocument } from 'pdf-lib';
import {
  PlatformError,
  ProcessingResult,
  SplitPdfOptions,
  ValidatedFile,
  WorkerExecutionContext,
  validatePdfSafety,
} from '@doc-platform/core';
import { DocumentProcessor, ResourceEstimate } from '@doc-platform/providers';
import { validateOutputDocument } from '../validator.js';

export class SplitPdfProcessor implements DocumentProcessor<SplitPdfOptions> {
  readonly operation = 'split-pdf' as const;

  async validateInput(inputFiles: ValidatedFile[], _options: SplitPdfOptions): Promise<void> {
    if (!inputFiles || inputFiles.length !== 1) {
      throw new PlatformError('INVALID_INPUT', {
        message: 'Split operation requires exactly 1 input PDF.',
      });
    }
  }

  estimateResourceCost(inputFiles: ValidatedFile[], _options: SplitPdfOptions): ResourceEstimate {
    const size = inputFiles[0]?.sizeBytes || 0;
    return {
      estimatedDurationMs: Math.max(400, Math.round(size / 15000)),
      estimatedMemoryBytes: Math.round(size * 2),
      isHeavyOperation: size > 30 * 1024 * 1024,
    };
  }

  async process(
    inputBuffers: Buffer[],
    options: SplitPdfOptions,
    context: WorkerExecutionContext
  ): Promise<ProcessingResult> {
    const startTime = Date.now();
    const inputBuffer = inputBuffers[0];
    validatePdfSafety(inputBuffer);

    await context.onProgress(10, 'Loading source document...');
    let sourcePdf: PDFDocument;
    try {
      sourcePdf = await PDFDocument.load(inputBuffer);
    } catch (err: unknown) {
      throw new PlatformError('FILE_CORRUPTED', { message: `Failed to parse PDF: ${(err as Error).message}` });
    }

    const totalPages = sourcePdf.getPageCount();
    const outputFiles: ProcessingResult['outputFiles'] = [];

    if (options.mode === 'all-pages' || !options.ranges || options.ranges.length === 0) {
      // Split into every single page
      for (let i = 0; i < totalPages; i++) {
        if (context.isCancelled()) throw new PlatformError('JOB_CANCELLED', { jobId: context.jobId });
        const newPdf = await PDFDocument.create();
        const [copiedPage] = await newPdf.copyPages(sourcePdf, [i]);
        newPdf.addPage(copiedPage);
        const bytes = await newPdf.save({ useObjectStreams: true });
        const buf = Buffer.from(bytes);
        validateOutputDocument(buf, 'pdf');
        outputFiles.push({
          filename: `page_${i + 1}.pdf`,
          mimeType: 'application/pdf',
          buffer: buf,
          pageCount: 1,
        });

        const progress = Math.round(10 + ((i + 1) / totalPages) * 80);
        await context.onProgress(progress, `Split page ${i + 1} of ${totalPages}...`);
      }
    } else {
      // Split by specified ranges (e.g. "1-3", "4-5")
      for (let rIdx = 0; rIdx < options.ranges.length; rIdx++) {
        if (context.isCancelled()) throw new PlatformError('JOB_CANCELLED', { jobId: context.jobId });
        const rangeStr = options.ranges[rIdx].trim();
        const pageIndices: number[] = [];

        if (rangeStr.includes('-')) {
          const [startStr, endStr] = rangeStr.split('-');
          const start = Math.max(1, parseInt(startStr, 10));
          const end = Math.min(totalPages, parseInt(endStr, 10));
          for (let p = start; p <= end; p++) {
            pageIndices.push(p - 1);
          }
        } else {
          const p = parseInt(rangeStr, 10);
          if (p >= 1 && p <= totalPages) {
            pageIndices.push(p - 1);
          }
        }

        if (pageIndices.length > 0) {
          const newPdf = await PDFDocument.create();
          const copiedPages = await newPdf.copyPages(sourcePdf, pageIndices);
          for (const cp of copiedPages) newPdf.addPage(cp);
          const bytes = await newPdf.save({ useObjectStreams: true });
          const buf = Buffer.from(bytes);
          validateOutputDocument(buf, 'pdf');
          outputFiles.push({
            filename: `split_range_${rangeStr}.pdf`,
            mimeType: 'application/pdf',
            buffer: buf,
            pageCount: pageIndices.length,
          });
        }
      }
    }

    await context.onProgress(100, 'Split operation finished.');

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
