/**
 * @file processors/merge.ts
 * @description High-efficiency multi-document PDF merge processor.
 */

import { PDFDocument } from 'pdf-lib';
import {
  MergePdfOptions,
  PlatformError,
  ProcessingResult,
  ValidatedFile,
  WorkerExecutionContext,
  validatePdfSafety,
} from '@doc-platform/core';
import { DocumentProcessor, ResourceEstimate } from '@doc-platform/providers';
import { validateOutputDocument } from '../validator.js';

export class MergePdfProcessor implements DocumentProcessor<MergePdfOptions> {
  readonly operation = 'merge-pdf' as const;

  async validateInput(inputFiles: ValidatedFile[], _options: MergePdfOptions): Promise<void> {
    if (!inputFiles || inputFiles.length < 2) {
      throw new PlatformError('INVALID_INPUT', {
        message: 'At least 2 PDF files are required to perform a merge operation.',
      });
    }
  }

  estimateResourceCost(inputFiles: ValidatedFile[], _options: MergePdfOptions): ResourceEstimate {
    const totalBytes = inputFiles.reduce((acc, f) => acc + f.sizeBytes, 0);
    return {
      estimatedDurationMs: Math.max(500, Math.round(totalBytes / 10000)),
      estimatedMemoryBytes: Math.round(totalBytes * 2.5),
      isHeavyOperation: totalBytes > 20 * 1024 * 1024,
    };
  }

  async process(
    inputBuffers: Buffer[],
    options: MergePdfOptions,
    context: WorkerExecutionContext
  ): Promise<ProcessingResult> {
    const startTime = Date.now();
    const totalInputSize = inputBuffers.reduce((sum, b) => sum + b.length, 0);

    // Validate magic bytes
    for (const buf of inputBuffers) {
      validatePdfSafety(buf);
    }

    await context.onProgress(10, 'Initializing merged document structure...');

    const mergedPdf = await PDFDocument.create();

    const totalDocs = inputBuffers.length;
    for (let i = 0; i < totalDocs; i++) {
      if (context.isCancelled()) {
        throw new PlatformError('JOB_CANCELLED', { jobId: context.jobId });
      }

      const docBuffer = inputBuffers[i];
      let sourcePdf: PDFDocument;
      try {
        sourcePdf = await PDFDocument.load(docBuffer, { ignoreEncryption: false });
      } catch (err: unknown) {
        throw new PlatformError('FILE_CORRUPTED', {
          message: `Failed to parse input PDF #${i + 1}: ${(err as Error).message}`,
        });
      }

      const copiedPages = await mergedPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());
      for (const page of copiedPages) {
        mergedPdf.addPage(page);
      }

      const progress = Math.round(10 + ((i + 1) / totalDocs) * 75);
      await context.onProgress(progress, `Merged document ${i + 1} of ${totalDocs}...`);
    }

    await context.onProgress(90, 'Serializing final PDF output...');
    const mergedBytes = await mergedPdf.save({ useObjectStreams: true });
    const outputBuffer = Buffer.from(mergedBytes);

    // Integrity check
    validateOutputDocument(outputBuffer, 'pdf');

    await context.onProgress(100, 'Merge completed successfully.');

    return {
      outputFiles: [
        {
          filename: 'merged_document.pdf',
          mimeType: 'application/pdf',
          buffer: outputBuffer,
          pageCount: mergedPdf.getPageCount(),
        },
      ],
      metrics: {
        durationMs: Date.now() - startTime,
        inputSizeBytes: totalInputSize,
        outputSizeBytes: outputBuffer.length,
      },
    };
  }
}
