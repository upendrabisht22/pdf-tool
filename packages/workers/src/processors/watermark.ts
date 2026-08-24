/**
 * @file processors/watermark.ts
 * @description Applies user-defined text watermarks to PDF pages with full control
 * over opacity, font size, color, rotation, and position.
 *
 * NO platform branding is ever applied here. This processor applies only
 * the text the USER chooses, on the pages they choose.
 */

import { PDFDocument, PDFPage, rgb, StandardFonts, degrees } from 'pdf-lib';
import {
  WatermarkPdfOptions,
  WatermarkPosition,
  PlatformError,
  ProcessingResult,
  ValidatedFile,
  WorkerExecutionContext,
  validatePdfSafety,
} from '@doc-platform/core';
import { DocumentProcessor, ResourceEstimate } from '@doc-platform/providers';
import { validateOutputDocument } from '../validator.js';

// Parse "#rrggbb" hex string to pdf-lib rgb() values
function parseHexColor(hex: string): ReturnType<typeof rgb> {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  return rgb(r, g, b);
}

// Compute (x, y) origin for the watermark text given page dimensions and position setting
function computeTextOrigin(
  pageWidth: number,
  pageHeight: number,
  textWidth: number,
  textHeight: number,
  position: WatermarkPosition,
  margin: number
): { x: number; y: number } {
  switch (position) {
    case 'center':
    case 'diagonal':
      return {
        x: (pageWidth - textWidth) / 2,
        y: (pageHeight - textHeight) / 2,
      };
    case 'top-left':
      return { x: margin, y: pageHeight - textHeight - margin };
    case 'top-center':
      return { x: (pageWidth - textWidth) / 2, y: pageHeight - textHeight - margin };
    case 'top-right':
      return { x: pageWidth - textWidth - margin, y: pageHeight - textHeight - margin };
    case 'bottom-left':
      return { x: margin, y: margin };
    case 'bottom-center':
      return { x: (pageWidth - textWidth) / 2, y: margin };
    case 'bottom-right':
      return { x: pageWidth - textWidth - margin, y: margin };
    default:
      return { x: (pageWidth - textWidth) / 2, y: (pageHeight - textHeight) / 2 };
  }
}

export class WatermarkPdfProcessor implements DocumentProcessor<WatermarkPdfOptions> {
  readonly operation = 'watermark-pdf' as const;

  async validateInput(inputFiles: ValidatedFile[], options: WatermarkPdfOptions): Promise<void> {
    if (!inputFiles || inputFiles.length !== 1) {
      throw new PlatformError('INVALID_INPUT', {
        message: 'Watermark operation requires exactly 1 input PDF.',
      });
    }
    if (!options.text || options.text.trim().length === 0) {
      throw new PlatformError('INVALID_INPUT', {
        message: 'Watermark text cannot be empty.',
      });
    }
    if (options.text.length > 200) {
      throw new PlatformError('INVALID_INPUT', {
        message: 'Watermark text must be 200 characters or fewer.',
      });
    }
    if (options.opacity !== undefined && (options.opacity < 0 || options.opacity > 1)) {
      throw new PlatformError('INVALID_INPUT', {
        message: 'Watermark opacity must be between 0.0 and 1.0.',
      });
    }
  }

  estimateResourceCost(inputFiles: ValidatedFile[], _options: WatermarkPdfOptions): ResourceEstimate {
    const size = inputFiles[0]?.sizeBytes || 0;
    return {
      estimatedDurationMs: Math.max(400, Math.round(size / 15000)),
      estimatedMemoryBytes: Math.round(size * 2.5),
      isHeavyOperation: false,
    };
  }

  async process(
    inputBuffers: Buffer[],
    options: WatermarkPdfOptions,
    context: WorkerExecutionContext
  ): Promise<ProcessingResult> {
    const startTime = Date.now();
    const inputBuffer = inputBuffers[0];
    validatePdfSafety(inputBuffer);

    await context.onProgress(15, 'Loading document for watermarking...');

    const pdfDoc = await PDFDocument.load(inputBuffer);
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const pages = pdfDoc.getPages();
    const totalPages = pages.length;

    // Resolve options with safe defaults
    const fontSize = options.fontSize ?? 48;
    const opacity = options.opacity ?? 0.3;
    const colorHex = options.color ?? '#888888';
    const position: WatermarkPosition = options.position ?? 'diagonal';
    const rotation = options.rotation ?? (position === 'diagonal' ? 45 : 0);
    const textColor = parseHexColor(colorHex);
    const margin = 30;

    // Determine which pages to watermark
    const targetPageIndices: Set<number> = new Set();
    if (!options.pages || options.pages === 'all') {
      for (let i = 0; i < totalPages; i++) targetPageIndices.add(i);
    } else {
      for (const p of options.pages) {
        if (p >= 1 && p <= totalPages) targetPageIndices.add(p - 1);
      }
    }

    await context.onProgress(30, `Applying watermark to ${targetPageIndices.size} page(s)...`);

    for (let i = 0; i < totalPages; i++) {
      if (context.isCancelled()) {
        throw new PlatformError('JOB_CANCELLED', { jobId: context.jobId });
      }

      if (!targetPageIndices.has(i)) continue;

      const page: PDFPage = pages[i];
      const { width: pageWidth, height: pageHeight } = page.getSize();

      // Approximate text width for centering (Helvetica Bold glyph width ≈ 0.55 × fontSize per char)
      const approxTextWidth = options.text.length * fontSize * 0.55;
      const approxTextHeight = fontSize;

      const { x, y } = computeTextOrigin(
        pageWidth,
        pageHeight,
        approxTextWidth,
        approxTextHeight,
        position,
        margin
      );

      page.drawText(options.text, {
        x,
        y,
        font,
        size: fontSize,
        color: textColor,
        opacity,
        rotate: degrees(rotation),
      });

      const progress = Math.round(30 + ((i + 1) / totalPages) * 55);
      await context.onProgress(progress);
    }

    await context.onProgress(90, 'Saving watermarked document...');
    const bytes = await pdfDoc.save({ useObjectStreams: true });
    const outputBuffer = Buffer.from(bytes);

    validateOutputDocument(outputBuffer, 'pdf');
    await context.onProgress(100, 'Watermark applied successfully.');

    return {
      outputFiles: [
        {
          filename: 'watermarked_document.pdf',
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
