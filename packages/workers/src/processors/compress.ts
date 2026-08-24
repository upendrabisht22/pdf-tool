/**
 * @file processors/compress.ts
 * @description PDF Compression Processor using object stream consolidation, metadata stripping, and dictionary optimization.
 */

import { PDFDocument } from 'pdf-lib';
import {
  CompressPdfOptions,
  PlatformError,
  ProcessingResult,
  ValidatedFile,
  WorkerExecutionContext,
  validatePdfSafety,
} from '@doc-platform/core';
import { DocumentProcessor, ResourceEstimate } from '@doc-platform/providers';
import { validateOutputDocument } from '../validator.js';

export class CompressPdfProcessor implements DocumentProcessor<CompressPdfOptions> {
  readonly operation = 'compress-pdf' as const;

  async validateInput(inputFiles: ValidatedFile[], _options: CompressPdfOptions): Promise<void> {
    if (!inputFiles || inputFiles.length !== 1) {
      throw new PlatformError('INVALID_INPUT', { message: 'Compress operation requires 1 input PDF.' });
    }
  }

  estimateResourceCost(inputFiles: ValidatedFile[], _options: CompressPdfOptions): ResourceEstimate {
    const size = inputFiles[0]?.sizeBytes || 0;
    return {
      estimatedDurationMs: Math.max(500, Math.round(size / 10000)),
      estimatedMemoryBytes: Math.round(size * 2.5),
      isHeavyOperation: size > 25 * 1024 * 1024,
    };
  }

  async process(
    inputBuffers: Buffer[],
    options: CompressPdfOptions,
    context: WorkerExecutionContext
  ): Promise<ProcessingResult> {
    const startTime = Date.now();
    const inputBuffer = inputBuffers[0];
    validatePdfSafety(inputBuffer);

    await context.onProgress(20, 'Analyzing PDF structure and compression opportunities...');
    const sourcePdf = await PDFDocument.load(inputBuffer, { updateMetadata: false });

    await context.onProgress(50, 'Optimizing stream objects and dictionary trees...');

    // In extreme mode, strip non-essential authoring metadata
    if (options.level === 'extreme') {
      sourcePdf.setTitle('');
      sourcePdf.setAuthor('');
      sourcePdf.setSubject('');
      sourcePdf.setKeywords([]);
      sourcePdf.setProducer('DocPlatform Optimizer');
      sourcePdf.setCreator('DocPlatform Optimizer');
    }

    await context.onProgress(80, 'Compacting cross-reference streams...');
    // Save with maximum object stream compression
    const bytes = await sourcePdf.save({
      useObjectStreams: true,
      addDefaultPage: false,
      objectsPerTick: 50,
    });

    const outputBuffer = Buffer.from(bytes);
    validateOutputDocument(outputBuffer, 'pdf');

    const inputSize = inputBuffer.length;
    const outputSize = outputBuffer.length;
    const compressionRatio = Math.round((1 - outputSize / inputSize) * 100);

    await context.onProgress(100, 'Compression complete.');

    return {
      outputFiles: [
        {
          filename: 'compressed_document.pdf',
          mimeType: 'application/pdf',
          buffer: outputBuffer,
          pageCount: sourcePdf.getPageCount(),
        },
      ],
      metrics: {
        durationMs: Date.now() - startTime,
        inputSizeBytes: inputSize,
        outputSizeBytes: outputSize,
        compressionRatio: Math.max(0, compressionRatio),
      },
    };
  }
}
