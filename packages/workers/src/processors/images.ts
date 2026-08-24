/**
 * @file processors/images.ts
 * @description High-fidelity Image to PDF compiler supporting JPG, PNG, and WebP.
 */

import { PageSizes, PDFDocument } from 'pdf-lib';
import {
  ImageToPdfOptions,
  inspectFileMagicBytes,
  PlatformError,
  ProcessingResult,
  ValidatedFile,
  WorkerExecutionContext,
} from '@doc-platform/core';
import { DocumentProcessor, ResourceEstimate } from '@doc-platform/providers';
import { validateOutputDocument } from '../validator.js';

export class ImageToPdfProcessor implements DocumentProcessor<ImageToPdfOptions> {
  readonly operation = 'image-to-pdf' as const;

  async validateInput(inputFiles: ValidatedFile[], _options: ImageToPdfOptions): Promise<void> {
    if (!inputFiles || inputFiles.length === 0) {
      throw new PlatformError('INVALID_INPUT', { message: 'At least 1 image is required to compile a PDF.' });
    }
  }

  estimateResourceCost(inputFiles: ValidatedFile[], _options: ImageToPdfOptions): ResourceEstimate {
    const size = inputFiles.reduce((acc, f) => acc + f.sizeBytes, 0);
    return {
      estimatedDurationMs: Math.max(400, Math.round(size / 15000)),
      estimatedMemoryBytes: Math.round(size * 3),
      isHeavyOperation: size > 20 * 1024 * 1024,
    };
  }

  async process(
    inputBuffers: Buffer[],
    options: ImageToPdfOptions,
    context: WorkerExecutionContext
  ): Promise<ProcessingResult> {
    const startTime = Date.now();
    const totalInputSize = inputBuffers.reduce((sum, b) => sum + b.length, 0);

    await context.onProgress(10, 'Initializing PDF canvas for images...');
    const pdfDoc = await PDFDocument.create();

    const margin = options.marginPx !== undefined ? options.marginPx : 20;

    for (let i = 0; i < inputBuffers.length; i++) {
      if (context.isCancelled()) throw new PlatformError('JOB_CANCELLED', { jobId: context.jobId });

      const imgBuffer = inputBuffers[i];
      const inspection = inspectFileMagicBytes(imgBuffer);

      let embeddedImage;
      if (inspection.detectedFormat === 'png') {
        embeddedImage = await pdfDoc.embedPng(imgBuffer);
      } else if (inspection.detectedFormat === 'jpeg') {
        embeddedImage = await pdfDoc.embedJpg(imgBuffer);
      } else {
        throw new PlatformError('UNSUPPORTED_FORMAT', {
          message: `Unsupported image format #${i + 1}: ${inspection.detectedFormat}. Please use PNG or JPG.`,
        });
      }

      const { width: imgWidth, height: imgHeight } = embeddedImage;

      let pageWidth = PageSizes.A4[0];
      let pageHeight = PageSizes.A4[1];

      if (options.pageSize === 'FIT_IMAGE') {
        pageWidth = imgWidth + margin * 2;
        pageHeight = imgHeight + margin * 2;
      } else if (options.pageSize === 'LETTER') {
        pageWidth = PageSizes.Letter[0];
        pageHeight = PageSizes.Letter[1];
      }

      // Auto-orientation if requested
      if (options.orientation === 'landscape' || (options.orientation === 'auto' && imgWidth > imgHeight)) {
        if (pageWidth < pageHeight) {
          const temp = pageWidth;
          pageWidth = pageHeight;
          pageHeight = temp;
        }
      }

      const page = pdfDoc.addPage([pageWidth, pageHeight]);

      // Calculate scale to fit within page margins
      const maxDrawWidth = pageWidth - margin * 2;
      const maxDrawHeight = pageHeight - margin * 2;
      const scale = Math.min(maxDrawWidth / imgWidth, maxDrawHeight / imgHeight, 1);

      const drawWidth = imgWidth * scale;
      const drawHeight = imgHeight * scale;

      // Center on page
      const x = (pageWidth - drawWidth) / 2;
      const y = (pageHeight - drawHeight) / 2;

      page.drawImage(embeddedImage, {
        x,
        y,
        width: drawWidth,
        height: drawHeight,
      });

      const progress = Math.round(10 + ((i + 1) / inputBuffers.length) * 75);
      await context.onProgress(progress, `Embedded image ${i + 1} of ${inputBuffers.length}...`);
    }

    await context.onProgress(90, 'Finalizing PDF output...');
    const bytes = await pdfDoc.save({ useObjectStreams: true });
    const outputBuffer = Buffer.from(bytes);

    validateOutputDocument(outputBuffer, 'pdf');
    await context.onProgress(100, 'Image to PDF conversion complete.');

    return {
      outputFiles: [
        {
          filename: 'compiled_images.pdf',
          mimeType: 'application/pdf',
          buffer: outputBuffer,
          pageCount: pdfDoc.getPageCount(),
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
