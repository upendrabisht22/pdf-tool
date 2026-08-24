/**
 * @file processors/sign-pdf.ts
 * @description Places electronic signature blocks onto PDF pages.
 *
 * Signature Types:
 *   'text'     → Renders the signer's full name in a signature-style layout with
 *                a dividing line, date, and optional title/designation.
 *   'initials' → Places abbreviated initials (first letter of first + last name)
 *                as a compact inline signature mark.
 *   'stamp'    → Places a rectangular "APPROVED" / "SIGNED" stamp with signer
 *                name, date, and a colored border. Used for document approval flows.
 *
 * What this is NOT:
 *   - This is NOT a cryptographic digital signature (PKI/X.509).
 *   - It does NOT embed a private key, certificate, or timestamp authority response.
 *   - It is a VISUAL signature for wet-ink style signing.
 *   - Cryptographic signing (DocuSign-grade) is tracked as Phase 7 (Business API tier).
 *
 * Legal notes:
 *   Visual e-signatures are legally recognized under the IT Act 2000 (India),
 *   ESIGN Act (US), eIDAS (EU) for simple electronic signatures in most use cases.
 *   However, regulated sectors (finance, healthcare, legal filings) may require
 *   cryptographic (advanced/qualified) signatures instead.
 */

import { PDFDocument, PDFPage, StandardFonts, rgb, degrees } from 'pdf-lib';
import {
  SignPdfOptions,
  SignaturePlacement,
  PlatformError,
  ProcessingResult,
  ValidatedFile,
  WorkerExecutionContext,
  validatePdfSafety,
} from '@doc-platform/core';
import { DocumentProcessor, ResourceEstimate } from '@doc-platform/providers';
import { validateOutputDocument } from '../validator.js';

function hexToRgb(hex: string): ReturnType<typeof rgb> {
  const clean = hex.replace('#', '');
  return rgb(
    parseInt(clean.substring(0, 2), 16) / 255,
    parseInt(clean.substring(2, 4), 16) / 255,
    parseInt(clean.substring(4, 6), 16) / 255
  );
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(part => part[0].toUpperCase())
    .join('');
}

/**
 * Draws a 'text' style signature: cursive-like name rendered with Helvetica-Oblique,
 * underline rule, date, and optional title.
 */
async function drawTextSignature(
  page: PDFPage,
  pdfDoc: PDFDocument,
  placement: SignaturePlacement,
  options: SignPdfOptions,
  signColor: ReturnType<typeof rgb>,
  today: string
): Promise<void> {
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  const fontSmall = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const w = placement.width ?? 180;
  const h = placement.height ?? 70;
  const x = placement.x;
  const y = placement.y;

  // Optional border box
  if (options.showBorder !== false) {
    page.drawRectangle({
      x: x - 4,
      y: y - 4,
      width: w + 8,
      height: h + 8,
      borderColor: signColor,
      borderWidth: 0.75,
      borderOpacity: 0.5,
      color: rgb(1, 1, 1),
      opacity: 0,
    });
  }

  // Name in signature style
  const nameFontSize = Math.min(22, Math.max(14, w / (options.name.length * 0.6)));
  page.drawText(options.name, {
    x,
    y: y + h - nameFontSize - 4,
    font,
    size: nameFontSize,
    color: signColor,
    rotate: degrees(0),
  });

  // Divider line below name
  page.drawLine({
    start: { x, y: y + h - nameFontSize - 10 },
    end: { x: x + w, y: y + h - nameFontSize - 10 },
    thickness: 0.6,
    color: signColor,
    opacity: 0.7,
  });

  // Title / designation (if provided)
  if (options.title && options.title.trim()) {
    page.drawText(options.title.trim(), {
      x,
      y: y + h - nameFontSize - 22,
      font: fontSmall,
      size: 8,
      color: rgb(0.3, 0.3, 0.3),
    });
  }

  // Date
  if (options.showDate !== false) {
    const dateLabel = `Date: ${options.date ?? today}`;
    page.drawText(dateLabel, {
      x,
      y: y + 2,
      font: fontSmall,
      size: 7.5,
      color: rgb(0.45, 0.45, 0.45),
    });
  }
}

/**
 * Draws 'initials' — compact abbreviated initial mark.
 */
async function drawInitialsSignature(
  page: PDFPage,
  pdfDoc: PDFDocument,
  placement: SignaturePlacement,
  options: SignPdfOptions,
  signColor: ReturnType<typeof rgb>
): Promise<void> {
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  const initials = getInitials(options.name);
  const w = placement.width ?? 60;
  const h = placement.height ?? 40;
  const x = placement.x;
  const y = placement.y;

  // Circle background
  page.drawCircle({
    x: x + w / 2,
    y: y + h / 2,
    size: Math.min(w, h) / 2 - 2,
    borderColor: signColor,
    borderWidth: 1,
    color: rgb(0.95, 0.97, 1.0),
  });

  const fontSize = Math.min(20, h * 0.55);
  const textWidth = font.widthOfTextAtSize(initials, fontSize);
  page.drawText(initials, {
    x: x + w / 2 - textWidth / 2,
    y: y + h / 2 - fontSize / 3,
    font,
    size: fontSize,
    color: signColor,
  });
}

/**
 * Draws a 'stamp' — rectangular approval stamp with name, date, SIGNED label.
 */
async function drawStampSignature(
  page: PDFPage,
  pdfDoc: PDFDocument,
  placement: SignaturePlacement,
  options: SignPdfOptions,
  signColor: ReturnType<typeof rgb>,
  today: string
): Promise<void> {
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontSmall = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const w = placement.width ?? 160;
  const h = placement.height ?? 60;
  const x = placement.x;
  const y = placement.y;

  // Outer border — double-line stamp effect
  page.drawRectangle({
    x,
    y,
    width: w,
    height: h,
    borderColor: signColor,
    borderWidth: 2,
    color: rgb(1, 1, 1),
    opacity: 0.9,
  });
  page.drawRectangle({
    x: x + 3,
    y: y + 3,
    width: w - 6,
    height: h - 6,
    borderColor: signColor,
    borderWidth: 0.6,
    color: rgb(1, 1, 1),
    opacity: 0,
  });

  // "SIGNED" label header
  const headerLabel = 'E-SIGNED';
  const headerFontSize = 9;
  const headerWidth = fontBold.widthOfTextAtSize(headerLabel, headerFontSize);
  page.drawText(headerLabel, {
    x: x + (w - headerWidth) / 2,
    y: y + h - 18,
    font: fontBold,
    size: headerFontSize,
    color: signColor,
    opacity: 0.85,
  });

  // Divider
  page.drawLine({
    start: { x: x + 8, y: y + h - 22 },
    end: { x: x + w - 8, y: y + h - 22 },
    thickness: 0.5,
    color: signColor,
    opacity: 0.6,
  });

  // Signer name
  const nameFontSize = Math.min(12, w / (options.name.length * 0.55 + 2));
  const nameWidth = fontBold.widthOfTextAtSize(options.name, nameFontSize);
  page.drawText(options.name, {
    x: x + (w - nameWidth) / 2,
    y: y + h / 2 - 4,
    font: fontBold,
    size: nameFontSize,
    color: signColor,
  });

  // Date
  const dateStr = options.date ?? today;
  const dateFontSize = 7.5;
  const dateWidth = fontSmall.widthOfTextAtSize(dateStr, dateFontSize);
  page.drawText(dateStr, {
    x: x + (w - dateWidth) / 2,
    y: y + 8,
    font: fontSmall,
    size: dateFontSize,
    color: rgb(0.4, 0.4, 0.4),
  });
}

// ─── Main Processor ───────────────────────────────────────────────────────────

export class SignPdfProcessor implements DocumentProcessor<SignPdfOptions> {
  readonly operation = 'sign-pdf' as const;

  async validateInput(inputFiles: ValidatedFile[], options: SignPdfOptions): Promise<void> {
    if (!inputFiles || inputFiles.length !== 1) {
      throw new PlatformError('INVALID_INPUT', {
        message: 'Sign PDF requires exactly 1 input PDF.',
      });
    }
    if (!options.name || options.name.trim().length === 0) {
      throw new PlatformError('INVALID_INPUT', {
        message: 'Signer name is required and cannot be empty.',
      });
    }
    if (options.name.length > 120) {
      throw new PlatformError('INVALID_INPUT', {
        message: 'Signer name must be 120 characters or fewer.',
      });
    }
    if (!options.placements || options.placements.length === 0) {
      throw new PlatformError('INVALID_INPUT', {
        message: 'At least one signature placement position is required.',
      });
    }
    const validTypes = ['text', 'initials', 'stamp'];
    if (!validTypes.includes(options.type)) {
      throw new PlatformError('INVALID_INPUT', {
        message: `Invalid signature type '${options.type}'. Use 'text', 'initials', or 'stamp'.`,
      });
    }
  }

  estimateResourceCost(inputFiles: ValidatedFile[], options: SignPdfOptions): ResourceEstimate {
    const size = inputFiles[0]?.sizeBytes || 0;
    return {
      estimatedDurationMs: Math.max(400, Math.round(size / 15000)),
      estimatedMemoryBytes: Math.round(size * 2.5),
      isHeavyOperation: false,
    };
  }

  async process(
    inputBuffers: Buffer[],
    options: SignPdfOptions,
    context: WorkerExecutionContext
  ): Promise<ProcessingResult> {
    const startTime = Date.now();
    const inputBuffer = inputBuffers[0];
    validatePdfSafety(inputBuffer);

    await context.onProgress(15, 'Loading document for signing...');
    const pdfDoc = await PDFDocument.load(inputBuffer, { ignoreEncryption: true });
    const totalPages = pdfDoc.getPageCount();

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const signColor = hexToRgb(options.color ?? '#1a3a6b');

    // Validate placement page numbers
    for (const placement of options.placements) {
      if (placement.page < 1 || placement.page > totalPages) {
        throw new PlatformError('INVALID_INPUT', {
          message: `Signature placement page ${placement.page} is out of range. Document has ${totalPages} pages.`,
        });
      }
    }

    await context.onProgress(30, `Applying ${options.placements.length} signature(s)...`);

    for (let i = 0; i < options.placements.length; i++) {
      if (context.isCancelled()) throw new PlatformError('JOB_CANCELLED', { jobId: context.jobId });

      const placement = options.placements[i];
      const page = pdfDoc.getPages()[placement.page - 1];

      switch (options.type) {
        case 'text':
          await drawTextSignature(page, pdfDoc, placement, options, signColor, today);
          break;
        case 'initials':
          await drawInitialsSignature(page, pdfDoc, placement, options, signColor);
          break;
        case 'stamp':
          await drawStampSignature(page, pdfDoc, placement, options, signColor, today);
          break;
      }

      const progress = Math.round(30 + ((i + 1) / options.placements.length) * 55);
      await context.onProgress(progress);
    }

    await context.onProgress(90, 'Saving signed document...');
    const bytes = await pdfDoc.save({ useObjectStreams: true });
    const outputBuffer = Buffer.from(bytes);

    validateOutputDocument(outputBuffer, 'pdf');
    await context.onProgress(100, 'Document signed successfully.');

    return {
      outputFiles: [
        {
          filename: 'signed_document.pdf',
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
