/**
 * @file processors/edit-pdf.ts
 * @description Visual PDF Editor Processor supporting text, whiteout, stamps, marks, and drawings.
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import {
  PlatformError,
  ProcessingResult,
  EditPdfOptions,
  PdfAnnotationItem,
  ValidatedFile,
  WorkerExecutionContext,
  validatePdfSafety,
} from '@doc-platform/core';
import { DocumentProcessor, ResourceEstimate } from '@doc-platform/providers';
import { validateOutputDocument } from '../validator.js';

function parseHexColor(hex?: string) {
  if (!hex || hex === 'transparent') return rgb(0.06, 0.09, 0.16);
  let c = hex.replace('#', '');
  if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
  const num = parseInt(c, 16);
  if (isNaN(num)) return rgb(0.06, 0.09, 0.16);
  return rgb(((num >> 16) & 255) / 255, ((num >> 8) & 255) / 255, (num & 255) / 255);
}

export class EditPdfProcessor implements DocumentProcessor<EditPdfOptions> {
  readonly operation = 'edit-pdf' as const;

  async validateInput(inputFiles: ValidatedFile[], options: EditPdfOptions): Promise<void> {
    if (!inputFiles || inputFiles.length !== 1) {
      throw new PlatformError('INVALID_INPUT', {
        message: 'Visual PDF Editor requires exactly 1 input PDF file.',
      });
    }
    if (options && options.annotations && !Array.isArray(options.annotations)) {
      throw new PlatformError('INVALID_INPUT', {
        message: 'Annotations must be an array of annotation items.',
      });
    }
  }

  estimateResourceCost(inputFiles: ValidatedFile[], _options: EditPdfOptions): ResourceEstimate {
    const size = inputFiles[0]?.sizeBytes || 0;
    return {
      estimatedDurationMs: Math.max(300, Math.round(size / 20000)),
      estimatedMemoryBytes: Math.round(size * 3),
      isHeavyOperation: size > 40 * 1024 * 1024,
    };
  }

  async process(
    inputBuffers: Buffer[],
    options: EditPdfOptions,
    context: WorkerExecutionContext
  ): Promise<ProcessingResult> {
    const startTime = Date.now();
    const inputBuffer = inputBuffers[0];
    validatePdfSafety(inputBuffer);

    await context.onProgress(15, 'Loading PDF document...');
    let pdfDoc: PDFDocument;
    try {
      pdfDoc = await PDFDocument.load(inputBuffer);
    } catch (err: unknown) {
      throw new PlatformError('FILE_CORRUPTED', { message: `Failed to parse PDF: ${(err as Error).message}` });
    }

    const pages = pdfDoc.getPages();
    const totalPages = pages.length;
    if (totalPages === 0) {
      throw new PlatformError('INVALID_INPUT', { message: 'PDF document contains no pages.' });
    }

    await context.onProgress(35, 'Embedding typographical assets...');
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const courier = await pdfDoc.embedFont(StandardFonts.Courier);

    const annotations: PdfAnnotationItem[] = options?.annotations || [];
    await context.onProgress(50, `Rendering ${annotations.length} visual annotations...`);

    for (let idx = 0; idx < annotations.length; idx++) {
      const item = annotations[idx];
      const pageIdx = typeof item.pageIndex === 'number' ? item.pageIndex : 0;
      if (pageIdx < 0 || pageIdx >= totalPages) continue;

      const page = pages[pageIdx];
      const { width: pageWidth, height: pageHeight } = page.getSize();

      const x = Math.max(0, Math.min(pageWidth - 10, item.x || 0));
      const y = item.y > 0 && item.y < pageHeight ? pageHeight - item.y : item.y;
      const w = item.width || 60;
      const h = item.height || 20;

      if (item.type === 'whiteout') {
        page.drawRectangle({
          x,
          y: y - h,
          width: w,
          height: h,
          color: rgb(1, 1, 1),
        });
      } else if (item.type === 'text') {
        const font = item.fontFamily === 'TimesRoman' ? timesRoman : item.fontFamily === 'Courier' ? courier : item.bold ? helveticaBold : helvetica;
        const fontSize = item.fontSize || 16;
        const textColor = parseHexColor(item.color);

        if (item.backgroundColor && item.backgroundColor !== 'transparent') {
          page.drawRectangle({
            x: x - 2,
            y: y - fontSize - 2,
            width: font.widthOfTextAtSize(item.text || '', fontSize) + 6,
            height: fontSize + 6,
            color: parseHexColor(item.backgroundColor),
          });
        }

        page.drawText(item.text || '', {
          x,
          y: y - fontSize,
          size: fontSize,
          font,
          color: textColor,
        });
      } else if (item.type === 'checkmark' || item.type === 'crossmark') {
        const markColor = item.type === 'checkmark' ? rgb(0.08, 0.65, 0.29) : rgb(0.86, 0.15, 0.15);
        const markSize = item.fontSize || 22;
        const thickness = Math.max(1.5, markSize * 0.12);
        const originY = y - markSize;

        if (item.type === 'checkmark') {
          page.drawLine({
            start: { x: x, y: originY + markSize * 0.35 },
            end: { x: x + markSize * 0.35, y: originY },
            thickness,
            color: markColor,
          });
          page.drawLine({
            start: { x: x + markSize * 0.35, y: originY },
            end: { x: x + markSize * 0.9, y: originY + markSize * 0.7 },
            thickness,
            color: markColor,
          });
        } else {
          page.drawLine({
            start: { x: x, y: originY },
            end: { x: x + markSize * 0.8, y: originY + markSize * 0.8 },
            thickness,
            color: markColor,
          });
          page.drawLine({
            start: { x: x, y: originY + markSize * 0.8 },
            end: { x: x + markSize * 0.8, y: originY },
            thickness,
            color: markColor,
          });
        }
      } else if (item.type === 'stamp') {
        const stampText = (item.stampText || 'APPROVED').toUpperCase();
        const stampColor = parseHexColor(item.color || '#dc2626');
        const stampW = fontWidth(helveticaBold, stampText, 14) + 16;
        const stampH = 26;

        page.drawRectangle({
          x,
          y: y - stampH,
          width: stampW,
          height: stampH,
          borderColor: stampColor,
          borderWidth: 2,
          color: rgb(1, 1, 1),
        });

        page.drawText(stampText, {
          x: x + 8,
          y: y - stampH + 7,
          size: 14,
          font: helveticaBold,
          color: stampColor,
        });
      } else if (item.type === 'shape') {
        const strokeColor = parseHexColor(item.color || '#0f172a');
        const borderWidth = item.strokeWidth || 2;
        page.drawRectangle({
          x,
          y: y - h,
          width: w,
          height: h,
          borderColor: strokeColor,
          borderWidth,
          color: item.backgroundColor ? parseHexColor(item.backgroundColor) : undefined,
        });
      } else if (item.type === 'draw' || item.type === 'highlight') {
        if (item.points && item.points.length > 1) {
          const isHighlight = item.type === 'highlight';
          const strokeColor = isHighlight ? rgb(1, 0.94, 0.54) : parseHexColor(item.color || '#0f172a');
          const opacity = isHighlight ? 0.4 : 1.0;
          const strokeWidth = item.strokeWidth || (isHighlight ? 14 : 2);

          for (let pIdx = 0; pIdx < item.points.length - 1; pIdx++) {
            const p1 = item.points[pIdx];
            const p2 = item.points[pIdx + 1];
            page.drawLine({
              start: { x: p1.x, y: pageHeight - p1.y },
              end: { x: p2.x, y: pageHeight - p2.y },
              thickness: strokeWidth,
              color: strokeColor,
              opacity,
            });
          }
        }
      }
    }

    await context.onProgress(85, 'Compiling and validating modified PDF...');
    const outputBytes = await pdfDoc.save({ useObjectStreams: true });
    const outputBuffer = Buffer.from(outputBytes);

    validateOutputDocument(outputBuffer, 'pdf');

    await context.onProgress(100, 'Visual PDF edits complete.');

    return {
      outputFiles: [
        {
          filename: 'edited_document.pdf',
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

function fontWidth(font: any, text: string, size: number): number {
  try {
    return font.widthOfTextAtSize(text, size);
  } catch {
    return text.length * size * 0.6;
  }
}
