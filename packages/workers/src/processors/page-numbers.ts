/**
 * @file processors/page-numbers.ts
 * @description Adds page numbers (headers/footers) to PDF pages with fully configurable
 * template, position, font size, color, start number, and margin.
 *
 * Template variables supported:
 *   {page}  — current page number
 *   {total} — total page count
 *
 * Example templates:
 *   '{page}'           → "1", "2", "3"
 *   'Page {page}'      → "Page 1", "Page 2"
 *   '{page} / {total}' → "1 / 12", "2 / 12"
 *   '{page} of {total}' → "1 of 12"
 */

import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';
import {
  PageNumbersPdfOptions,
  PageNumberPosition,
  PlatformError,
  ProcessingResult,
  ValidatedFile,
  WorkerExecutionContext,
  validatePdfSafety,
} from '@doc-platform/core';
import { DocumentProcessor, ResourceEstimate } from '@doc-platform/providers';
import { validateOutputDocument } from '../validator.js';

function parseHexColor(hex: string): ReturnType<typeof rgb> {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  return rgb(r, g, b);
}

function computeNumberPosition(
  pageWidth: number,
  pageHeight: number,
  textWidth: number,
  position: PageNumberPosition,
  margin: number
): { x: number; y: number } {
  const isBottom = position.startsWith('bottom');
  const y = isBottom ? margin : pageHeight - margin - 12;

  if (position.endsWith('left')) return { x: margin, y };
  if (position.endsWith('right')) return { x: pageWidth - textWidth - margin, y };
  return { x: (pageWidth - textWidth) / 2, y }; // center
}

export class PageNumbersPdfProcessor implements DocumentProcessor<PageNumbersPdfOptions> {
  readonly operation = 'page-numbers-pdf' as const;

  async validateInput(inputFiles: ValidatedFile[], _options: PageNumbersPdfOptions): Promise<void> {
    if (!inputFiles || inputFiles.length !== 1) {
      throw new PlatformError('INVALID_INPUT', {
        message: 'Page numbering requires exactly 1 input PDF.',
      });
    }
  }

  estimateResourceCost(inputFiles: ValidatedFile[], _options: PageNumbersPdfOptions): ResourceEstimate {
    const size = inputFiles[0]?.sizeBytes || 0;
    return {
      estimatedDurationMs: Math.max(400, Math.round(size / 15000)),
      estimatedMemoryBytes: Math.round(size * 2),
      isHeavyOperation: false,
    };
  }

  async process(
    inputBuffers: Buffer[],
    options: PageNumbersPdfOptions,
    context: WorkerExecutionContext
  ): Promise<ProcessingResult> {
    const startTime = Date.now();
    const inputBuffer = inputBuffers[0];
    validatePdfSafety(inputBuffer);

    await context.onProgress(15, 'Loading document for page numbering...');

    const pdfDoc = await PDFDocument.load(inputBuffer);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const pages = pdfDoc.getPages();
    const totalPages = pages.length;

    // Resolve options with sensible defaults
    const position: PageNumberPosition = options.position ?? 'bottom-center';
    const template = options.template ?? '{page}';
    const fontSize = options.fontSize ?? 11;
    const textColor = parseHexColor(options.color ?? '#000000');
    const startAt = options.startAt ?? 1;
    const margin = options.margin ?? 20;

    await context.onProgress(25, `Adding page numbers to ${totalPages} pages...`);

    for (let i = 0; i < totalPages; i++) {
      if (context.isCancelled()) {
        throw new PlatformError('JOB_CANCELLED', { jobId: context.jobId });
      }

      const page = pages[i];
      const { width: pageWidth, height: pageHeight } = page.getSize();
      const displayNumber = startAt + i;

      // Substitute template variables
      const label = template
        .replace(/\{page\}/g, String(displayNumber))
        .replace(/\{total\}/g, String(totalPages + startAt - 1));

      const textWidth = font.widthOfTextAtSize(label, fontSize);
      const { x, y } = computeNumberPosition(pageWidth, pageHeight, textWidth, position, margin);

      page.drawText(label, {
        x,
        y,
        font,
        size: fontSize,
        color: textColor,
        rotate: degrees(0),
      });

      const progress = Math.round(25 + ((i + 1) / totalPages) * 60);
      await context.onProgress(progress);
    }

    await context.onProgress(90, 'Saving numbered document...');
    const bytes = await pdfDoc.save({ useObjectStreams: true });
    const outputBuffer = Buffer.from(bytes);

    validateOutputDocument(outputBuffer, 'pdf');
    await context.onProgress(100, 'Page numbers added successfully.');

    return {
      outputFiles: [
        {
          filename: 'numbered_document.pdf',
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
