/**
 * @file processors/estimate-maker.ts
 * @description Professional Project Estimate & Quotation Proposal Generator for DocPlatform.
 * Generates vector PDF business quotes with deliverables scope, itemized pricing,
 * commercial terms, and client acceptance sign-off.
 */

import { PDFDocument, StandardFonts, rgb, PDFFont } from 'pdf-lib';
import {
  EstimateOptions,
  PlatformError,
  ProcessingResult,
  ValidatedFile,
  WorkerExecutionContext,
} from '@doc-platform/core';
import { DocumentProcessor, ResourceEstimate } from '@doc-platform/providers';

function formatAmount(val: number): string {
  return (Number(val) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export class EstimateMakerProcessor implements DocumentProcessor<EstimateOptions> {
  readonly operation = 'estimate-maker' as const;

  async validateInput(_inputFiles: ValidatedFile[], options: EstimateOptions): Promise<void> {
    if (!options) {
      throw new PlatformError('INVALID_INPUT', { message: 'Estimate options are required.' });
    }
    if (!options.businessName || options.businessName.trim().length === 0) {
      throw new PlatformError('INVALID_INPUT', { message: 'Business or Agency name is required.' });
    }
    if (!options.clientName || options.clientName.trim().length === 0) {
      throw new PlatformError('INVALID_INPUT', { message: 'Client recipient name is required.' });
    }
  }

  estimateResourceCost(_inputFiles: ValidatedFile[], _options: EstimateOptions): ResourceEstimate {
    return {
      estimatedDurationMs: 350,
      estimatedMemoryBytes: 24 * 1024 * 1024,
      isHeavyOperation: false,
    };
  }

  async process(
    _inputBuffers: Buffer[],
    options: EstimateOptions,
    context: WorkerExecutionContext
  ): Promise<ProcessingResult> {
    const startTime = Date.now();
    await context.onProgress(10, 'Initializing Project Quotation & Estimate engine...');

    const businessName = (options.businessName || (options as any).fromName || 'VERTEX STUDIO & ENGINEERING').trim();
    const businessAddress = options.businessAddress || (options as any).fromAddress || '';
    const businessEmail = options.businessEmail || (options as any).fromEmail || '';
    const businessPhone = options.businessPhone || (options as any).fromPhone || '';
    const estimateNum = options.estimateNumber || `EST-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const estimateDate = options.estimateDate || new Date().toISOString().split('T')[0];
    const validUntil = options.validUntilDate || (options as any).validUntil || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

    const clientName = (options.clientName || (options as any).toName || 'Acme Enterprises').trim();
    const clientCompany = options.clientCompany || (options as any).toContact || '';
    const clientAddress = options.clientAddress || (options as any).toAddress || '';
    const projectTitle = options.projectTitle || 'Enterprise Cloud & Document Platform Development';
    const currency = options.currency || '$';

    const items = options.items && options.items.length > 0 ? options.items : [
      { description: 'Phase 1: Architecture & UI/UX Design System', unit: 'Milestone', qty: 1, rate: 3500 },
      { description: 'Phase 2: Core WASM Processing & Pipeline Engine', unit: 'Milestone', qty: 1, rate: 6500 },
      { description: 'Phase 3: Security Hardening & Production Deployment', unit: 'Milestone', qty: 1, rate: 2500 }
    ];

    let subtotal = 0;
    items.forEach(i => {
      subtotal += (Number(i.qty) || 1) * (Number(i.rate ?? (i as any).unitPrice) || 0);
    });

    const discountPct = Math.max(0, Math.min(100, Number(options.discountPct) || 0));
    const discountAmount = (subtotal * discountPct) / 100;
    const taxableAmount = Math.max(0, subtotal - discountAmount);

    const taxPct = Math.max(0, Math.min(100, Number(options.taxPct) || 0));
    const taxAmount = (taxableAmount * taxPct) / 100;
    const totalEstimate = taxableAmount + taxAmount;

    // Standard A4 Page
    const pageWidth = 595.28;
    const pageHeight = 841.89;

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    const fontSans = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSansBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontSansOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

    const cNavy = rgb(0.09, 0.12, 0.2);
    const cAccent = rgb(0.48, 0.38, 1.0); // Blueprint indigo
    const cDark = rgb(0.12, 0.14, 0.18);
    const cMuted = rgb(0.42, 0.45, 0.5);
    const cBorder = rgb(0.85, 0.88, 0.92);

    const margin = 40;
    const contentWidth = pageWidth - margin * 2;

    // Top Architectural Bar
    page.drawRectangle({
      x: margin,
      y: pageHeight - 16,
      width: contentWidth,
      height: 3,
      color: cAccent,
    });

    let curY = pageHeight - 48;

    // Header Left: Business Name & Contact
    page.drawText(businessName.toUpperCase(), {
      x: margin,
      y: curY,
      size: 14,
      font: fontSansBold,
      color: cNavy,
    });
    curY -= 14;

    if (options.businessAddress) {
      page.drawText(options.businessAddress, { x: margin, y: curY, size: 8, font: fontSans, color: cMuted });
      curY -= 11;
    }
    if (options.businessEmail || options.businessPhone) {
      const contactStr = `${options.businessEmail || ''} ${options.businessPhone ? '• ' + options.businessPhone : ''}`;
      page.drawText(contactStr, { x: margin, y: curY, size: 8, font: fontSans, color: cMuted });
      curY -= 11;
    }

    // Header Right: Quote Title & Numbers
    const topRtX = pageWidth - margin - 170;
    let rtY = pageHeight - 45;

    page.drawText('PROJECT ESTIMATE', { x: topRtX, y: rtY, size: 12, font: fontSansBold, color: cAccent });
    rtY -= 14;
    page.drawText(`Estimate #: ${estimateNum}`, { x: topRtX, y: rtY, size: 8.5, font: fontSansBold, color: cNavy });
    rtY -= 11;
    page.drawText(`Date: ${estimateDate}`, { x: topRtX, y: rtY, size: 8, font: fontSans, color: cDark });
    rtY -= 11;
    page.drawText(`Valid Until: ${validUntil}`, { x: topRtX, y: rtY, size: 8, font: fontSansBold, color: rgb(0.8, 0.3, 0.1) });

    curY = Math.min(curY, rtY) - 14;

    // Separator line
    page.drawLine({
      start: { x: margin, y: curY },
      end: { x: pageWidth - margin, y: curY },
      thickness: 1,
      color: cBorder,
    });
    curY -= 18;

    // Client & Project Box
    page.drawRectangle({
      x: margin,
      y: curY - 48,
      width: contentWidth,
      height: 54,
      color: rgb(0.97, 0.98, 1.0),
      borderColor: rgb(0.88, 0.9, 0.96),
      borderWidth: 1,
    });

    page.drawText('PREPARED FOR:', { x: margin + 12, y: curY - 12, size: 7.5, font: fontSansBold, color: cMuted });
    page.drawText(clientName, { x: margin + 12, y: curY - 24, size: 10, font: fontSansBold, color: cNavy });
    if (clientCompany || options.clientAddress) {
      page.drawText(`${clientCompany} ${options.clientAddress ? '• ' + options.clientAddress : ''}`, {
        x: margin + 12,
        y: curY - 36,
        size: 7.5,
        font: fontSans,
        color: cMuted,
      });
    }

    const prjX = margin + 280;
    page.drawText('PROJECT SCOPE:', { x: prjX, y: curY - 12, size: 7.5, font: fontSansBold, color: cMuted });
    page.drawText(projectTitle, { x: prjX, y: curY - 24, size: 9, font: fontSansBold, color: cAccent });
    page.drawText('Formal Proposal & Deliverables Breakdown', { x: prjX, y: curY - 36, size: 7.5, font: fontSansOblique, color: cMuted });

    curY -= 64;

    // Deliverables Table Header
    page.drawRectangle({
      x: margin,
      y: curY - 5,
      width: contentWidth,
      height: 22,
      color: cNavy,
    });

    const colX = {
      num: margin + 8,
      desc: margin + 30,
      unit: margin + 310,
      qty: margin + 370,
      rate: margin + 420,
      amt: margin + 475,
    };

    page.drawText('#', { x: colX.num, y: curY + 2, size: 8, font: fontSansBold, color: rgb(1, 1, 1) });
    page.drawText('DELIVERABLES / SCOPE DESCRIPTION', { x: colX.desc, y: curY + 2, size: 8, font: fontSansBold, color: rgb(1, 1, 1) });
    page.drawText('UNIT', { x: colX.unit, y: curY + 2, size: 8, font: fontSansBold, color: rgb(1, 1, 1) });
    page.drawText('QTY', { x: colX.qty, y: curY + 2, size: 8, font: fontSansBold, color: rgb(1, 1, 1) });
    page.drawText('RATE', { x: colX.rate, y: curY + 2, size: 8, font: fontSansBold, color: rgb(1, 1, 1) });
    page.drawText('AMOUNT', { x: colX.amt, y: curY + 2, size: 8, font: fontSansBold, color: rgb(1, 1, 1) });
    curY -= 20;

    // Items List
    let itemIndex = 1;
    for (const item of items) {
      const q = Math.max(1, Number(item.qty) || 1);
      const r = Math.max(0, Number(item.rate ?? (item as any).unitPrice) || 0);
      const rowAmt = q * r;

      const isEven = itemIndex % 2 === 0;
      if (isEven) {
        page.drawRectangle({
          x: margin,
          y: curY - 5,
          width: contentWidth,
          height: 22,
          color: rgb(0.98, 0.98, 0.99),
        });
      }

      page.drawText(String(itemIndex), { x: colX.num, y: curY + 1, size: 8, font: fontSans, color: cMuted });

      const descText = item.description.length > 55 ? item.description.substring(0, 52) + '...' : item.description;
      page.drawText(descText, { x: colX.desc, y: curY + 1, size: 8.5, font: fontSansBold, color: cDark });

      page.drawText(item.unit || 'Item', { x: colX.unit, y: curY + 1, size: 8, font: fontSans, color: cMuted });
      page.drawText(String(q), { x: colX.qty + 5, y: curY + 1, size: 8, font: fontSans, color: cDark });
      page.drawText(`${currency} ${formatAmount(r)}`, { x: colX.rate, y: curY + 1, size: 8, font: fontSans, color: cDark });
      page.drawText(`${currency} ${formatAmount(rowAmt)}`, { x: colX.amt, y: curY + 1, size: 8.5, font: fontSansBold, color: cNavy });

      curY -= 20;
      itemIndex++;
    }

    page.drawLine({
      start: { x: margin, y: curY },
      end: { x: pageWidth - margin, y: curY },
      thickness: 1,
      color: cBorder,
    });
    curY -= 16;

    // Totals Box (Right Aligned)
    const totalsLeft = pageWidth - margin - 200;
    const drawTotalLine = (label: string, valStr: string, bold = false) => {
      const f = bold ? fontSansBold : fontSans;
      const s = bold ? 9 : 8;
      page.drawText(label, { x: totalsLeft, y: curY, size: s, font: f, color: bold ? cNavy : cMuted });
      const valW = f.widthOfTextAtSize(valStr, s);
      page.drawText(valStr, { x: pageWidth - margin - valW, y: curY, size: s, font: f, color: bold ? cNavy : cDark });
      curY -= 14;
    };

    drawTotalLine('Scope Subtotal:', `${currency} ${formatAmount(subtotal)}`);
    if (discountPct > 0) {
      drawTotalLine(`Discount (${discountPct}%):`, `- ${currency} ${formatAmount(discountAmount)}`);
    }
    if (taxPct > 0) {
      drawTotalLine(`Estimated Tax (${taxPct}%):`, `+ ${currency} ${formatAmount(taxAmount)}`);
    }

    curY -= 2;
    page.drawRectangle({
      x: totalsLeft - 8,
      y: curY - 5,
      width: 208,
      height: 24,
      color: rgb(0.96, 0.97, 1.0),
      borderColor: cAccent,
      borderWidth: 1,
    });
    page.drawText('TOTAL ESTIMATE:', { x: totalsLeft, y: curY + 2, size: 9.5, font: fontSansBold, color: cNavy });
    const totStr = `${currency} ${formatAmount(totalEstimate)}`;
    const totW = fontSansBold.widthOfTextAtSize(totStr, 11);
    page.drawText(totStr, { x: pageWidth - margin - totW, y: curY + 2, size: 11, font: fontSansBold, color: cAccent });
    curY -= 36;

    // Commercial Terms & Notes Box
    const terms = options.terms ||
      '1. Validity: This quotation remains valid for 30 calendar days from the date of issue.\n2. Payment Terms: 50% advance upon project initiation, 50% upon final sign-off & milestone handover.\n3. Out-of-Scope: Any additional requests outside the documented scope will be estimated separately.';

    page.drawText('COMMERCIAL TERMS & ACCEPTANCE', { x: margin, y: curY, size: 8.5, font: fontSansBold, color: cNavy });
    curY -= 12;

    const termLines = terms.split('\n');
    for (const tLine of termLines) {
      page.drawText(tLine, { x: margin, y: curY, size: 7.5, font: fontSans, color: cMuted });
      curY -= 11;
    }

    curY -= 24;

    // Sign-off section
    const signColW = 200;
    // Provider signature
    page.drawLine({
      start: { x: margin, y: curY },
      end: { x: margin + signColW, y: curY },
      thickness: 1,
      color: cBorder,
    });
    page.drawText(`Authorized Representative (${businessName})`, { x: margin, y: curY - 12, size: 7.5, font: fontSansBold, color: cNavy });
    page.drawText('Signature & Date', { x: margin, y: curY - 22, size: 7, font: fontSans, color: cMuted });

    // Client Acceptance signature
    const clientSignX = pageWidth - margin - signColW;
    page.drawLine({
      start: { x: clientSignX, y: curY },
      end: { x: clientSignX + signColW, y: curY },
      thickness: 1,
      color: cBorder,
    });
    page.drawText(`Client Acceptance (${clientName})`, { x: clientSignX, y: curY - 12, size: 7.5, font: fontSansBold, color: cNavy });
    page.drawText('Authorized Signature & Approval Date', { x: clientSignX, y: curY - 22, size: 7, font: fontSans, color: cMuted });

    // Bottom Branding
    const footerText = 'Generated via DocPlatform Professional Proposal Engine • Zero Data Retention WASM';
    const ftW = fontSans.widthOfTextAtSize(footerText, 7);
    page.drawText(footerText, { x: (pageWidth - ftW) / 2, y: 22, size: 7, font: fontSans, color: cMuted });

    await context.onProgress(90, 'Serializing vector PDF quotation...');
    const pdfBytes = await pdfDoc.save();
    const outputBuffer = Buffer.from(pdfBytes);

    await context.onProgress(100, 'Project Estimate PDF created successfully.');
    return {
      outputFiles: [
        {
          filename: `estimate_${estimateNum}.pdf`,
          mimeType: 'application/pdf',
          buffer: outputBuffer,
          pageCount: 1,
        },
      ],
      metrics: {
        durationMs: Date.now() - startTime,
        inputSizeBytes: 0,
        outputSizeBytes: outputBuffer.length,
        totalPageCount: 1,
      },
    };
  }
}
