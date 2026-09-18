/**
 * @file processors/pos-billing.ts
 * @description Dedicated Minimal POS Billing & Thermal Slip Generator for DocPlatform.
 * Generates compact, authentic 80mm thermal receipt roll slips (width: 226.77 pt) or standard receipts
 * with itemized lines, discounts, taxes, and dynamic NPCI UPI QR code.
 */

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import * as QRCode from 'qrcode';
import {
  PosBillingOptions,
  PlatformError,
  ProcessingResult,
  ValidatedFile,
  WorkerExecutionContext,
} from '@doc-platform/core';
import { DocumentProcessor, ResourceEstimate } from '@doc-platform/providers';

function formatCurrency(val: number): string {
  return (Number(val) || 0).toFixed(2);
}

export class PosBillingProcessor implements DocumentProcessor<PosBillingOptions> {
  readonly operation = 'pos-billing' as const;

  async validateInput(_inputFiles: ValidatedFile[], options: PosBillingOptions): Promise<void> {
    if (!options) {
      throw new PlatformError('INVALID_INPUT', { message: 'POS Billing options are required.' });
    }
    if (!options.storeName || options.storeName.trim().length === 0) {
      throw new PlatformError('INVALID_INPUT', { message: 'Store / Merchant name is required.' });
    }
  }

  estimateResourceCost(_inputFiles: ValidatedFile[], _options: PosBillingOptions): ResourceEstimate {
    return {
      estimatedDurationMs: 300,
      estimatedMemoryBytes: 16 * 1024 * 1024,
      isHeavyOperation: false,
    };
  }

  async process(
    _inputBuffers: Buffer[],
    options: PosBillingOptions,
    context: WorkerExecutionContext
  ): Promise<ProcessingResult> {
    const startTime = Date.now();
    await context.onProgress(10, 'Initializing POS thermal slip engine...');

    const storeName = (options.storeName || 'QUICK BITES & RETAIL').trim();
    const orderNumber = (options.orderNumber || (options as any).receiptNumber || `ORD-${Math.floor(1000 + Math.random() * 9000)}`).trim();
    const dateTime = options.dateTime || (options as any).date || new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
    const cashier = options.cashier || (options as any).cashierName || 'Counter 01';
    const storeAddress = options.address || (options as any).storeAddress || '';
    const storePhone = options.phone || (options as any).storePhone || '';
    const items = options.items && options.items.length > 0 ? options.items : [
      { name: 'Standard Counter Item', qty: 1, rate: 100 }
    ];

    // Compute totals
    let subtotal = 0;
    let totalQty = 0;
    items.forEach(item => {
      const q = Math.max(1, Number(item.qty) || 1);
      const r = Math.max(0, Number(item.rate ?? (item as any).price) || 0);
      subtotal += q * r;
      totalQty += q;
    });

    const discountPct = Math.max(0, Math.min(100, Number(options.discountPct) || 0));
    const discountAmount = (subtotal * discountPct) / 100;
    const taxableAmount = Math.max(0, subtotal - discountAmount);

    const taxPct = Math.max(0, Math.min(100, Number(options.taxPct) || 0));
    const taxAmount = (taxableAmount * taxPct) / 100;
    const grandTotal = taxableAmount + taxAmount;

    // Standard 80mm roll width: 80mm = ~226.77 points
    const pageWidth = 226.77;
    const margin = 10;
    const contentWidth = pageWidth - margin * 2;

    // Estimate height dynamically based on items count and QR code presence
    const hasUpi = Boolean(options.upiId && options.upiId.trim());
    const baseHeaderHeight = 120;
    const itemsHeight = items.length * 24;
    const totalsHeight = 90;
    const upiHeight = hasUpi ? 110 : 20;
    const footerHeight = 60;
    const calculatedHeight = Math.max(350, baseHeaderHeight + itemsHeight + totalsHeight + upiHeight + footerHeight);

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([pageWidth, calculatedHeight]);

    const fontMono = await pdfDoc.embedFont(StandardFonts.Courier);
    const fontMonoBold = await pdfDoc.embedFont(StandardFonts.CourierBold);

    const cBlack = rgb(0.08, 0.08, 0.08);
    const cGray = rgb(0.4, 0.4, 0.4);

    let curY = calculatedHeight - 16;

    const drawDottedLine = (y: number) => {
      const dots = '- '.repeat(Math.floor(contentWidth / 7));
      page.drawText(dots, { x: margin, y, size: 7, font: fontMono, color: cGray });
    };

    // Store Name
    const storeTitle = storeName.toUpperCase();
    const storeWidth = fontMonoBold.widthOfTextAtSize(storeTitle, 11);
    page.drawText(storeTitle, {
      x: Math.max(margin, (pageWidth - storeWidth) / 2),
      y: curY,
      size: 11,
      font: fontMonoBold,
      color: cBlack,
    });
    curY -= 14;

    // Tagline / Address
    if (options.tagline) {
      const tagW = fontMono.widthOfTextAtSize(options.tagline, 7.5);
      page.drawText(options.tagline, {
        x: Math.max(margin, (pageWidth - tagW) / 2),
        y: curY,
        size: 7.5,
        font: fontMono,
        color: cGray,
      });
      curY -= 11;
    }

    if (storeAddress) {
      const addrW = fontMono.widthOfTextAtSize(storeAddress, 7);
      page.drawText(storeAddress, {
        x: Math.max(margin, (pageWidth - addrW) / 2),
        y: curY,
        size: 7,
        font: fontMono,
        color: cGray,
      });
      curY -= 10;
    }

    if (storePhone) {
      const phW = fontMono.widthOfTextAtSize(`Ph: ${storePhone}`, 7);
      page.drawText(`Ph: ${storePhone}`, {
        x: Math.max(margin, (pageWidth - phW) / 2),
        y: curY,
        size: 7,
        font: fontMono,
        color: cGray,
      });
      curY -= 11;
    }

    curY -= 3;
    drawDottedLine(curY);
    curY -= 12;

    // Order Info
    page.drawText(`TOKEN / BILL: #${orderNumber}`, {
      x: margin,
      y: curY,
      size: 8.5,
      font: fontMonoBold,
      color: cBlack,
    });
    curY -= 11;

    page.drawText(`Date: ${dateTime}`, {
      x: margin,
      y: curY,
      size: 7.5,
      font: fontMono,
      color: cBlack,
    });
    curY -= 10;

    page.drawText(`Cashier: ${cashier}`, {
      x: margin,
      y: curY,
      size: 7.5,
      font: fontMono,
      color: cBlack,
    });
    curY -= 12;

    drawDottedLine(curY);
    curY -= 12;

    // Table Header
    page.drawText('ITEM', { x: margin, y: curY, size: 7.5, font: fontMonoBold, color: cBlack });
    page.drawText('QTY', { x: margin + 105, y: curY, size: 7.5, font: fontMonoBold, color: cBlack });
    page.drawText('RATE', { x: margin + 135, y: curY, size: 7.5, font: fontMonoBold, color: cBlack });
    page.drawText('TOTAL', { x: margin + 175, y: curY, size: 7.5, font: fontMonoBold, color: cBlack });
    curY -= 10;

    drawDottedLine(curY);
    curY -= 12;

    // Items List
    for (const item of items) {
      const q = Math.max(1, Number(item.qty) || 1);
      const r = Math.max(0, Number(item.rate) || 0);
      const tot = q * r;

      const itemName = item.name.length > 18 ? item.name.substring(0, 16) + '..' : item.name;
      page.drawText(itemName, { x: margin, y: curY, size: 7.5, font: fontMono, color: cBlack });

      const qStr = String(q);
      const rStr = formatCurrency(r);
      const tStr = formatCurrency(tot);

      page.drawText(qStr, { x: margin + 110, y: curY, size: 7.5, font: fontMono, color: cBlack });
      page.drawText(rStr, { x: margin + 135, y: curY, size: 7.5, font: fontMono, color: cBlack });
      page.drawText(tStr, { x: margin + 172, y: curY, size: 7.5, font: fontMonoBold, color: cBlack });

      curY -= 14;
    }

    drawDottedLine(curY);
    curY -= 12;

    // Subtotal & Calculations
    const drawRowRight = (label: string, value: string, isBold = false) => {
      const f = isBold ? fontMonoBold : fontMono;
      const s = isBold ? 8.5 : 7.5;
      page.drawText(label, { x: margin + 30, y: curY, size: s, font: f, color: cBlack });
      const valW = f.widthOfTextAtSize(value, s);
      page.drawText(value, { x: pageWidth - margin - valW, y: curY, size: s, font: f, color: cBlack });
      curY -= 12;
    };

    drawRowRight(`Subtotal (${totalQty} items):`, `Rs. ${formatCurrency(subtotal)}`);
    if (discountPct > 0) {
      drawRowRight(`Discount (${discountPct}%):`, `- Rs. ${formatCurrency(discountAmount)}`);
    }
    if (taxPct > 0) {
      drawRowRight(`Tax / GST (${taxPct}%):`, `+ Rs. ${formatCurrency(taxAmount)}`);
    }

    curY -= 6;
    const grandBoxH = 20;
    const grandBoxY = curY - grandBoxH;
    // Grand Total Bar
    page.drawRectangle({
      x: margin,
      y: grandBoxY,
      width: contentWidth,
      height: grandBoxH,
      color: cBlack,
    });
    page.drawText('GRAND TOTAL:', { x: margin + 8, y: grandBoxY + 5.5, size: 9, font: fontMonoBold, color: rgb(1, 1, 1) });
    const gStr = `Rs. ${formatCurrency(grandTotal)}`;
    const gW = fontMonoBold.widthOfTextAtSize(gStr, 9);
    page.drawText(gStr, { x: pageWidth - margin - 8 - gW, y: grandBoxY + 5.5, size: 9, font: fontMonoBold, color: rgb(1, 1, 1) });
    curY = grandBoxY - 14;

    // Payment Mode
    const paymentMode = options.paymentMethod || 'Cash';
    page.drawText(`Payment Mode: ${paymentMode}`, {
      x: margin,
      y: curY,
      size: 7.5,
      font: fontMono,
      color: cBlack,
    });
    curY -= 12;

    // Dynamic UPI QR Code
    if (hasUpi) {
      await context.onProgress(60, 'Generating dynamic UPI payment QR code for counter slip...');
      try {
        const upiUri = `upi://pay?pa=${encodeURIComponent(options.upiId!.trim())}&pn=${encodeURIComponent(storeName)}&am=${grandTotal.toFixed(2)}&cu=INR`;
        const qrPngDataUrl = await QRCode.toDataURL(upiUri, {
          margin: 1,
          width: 80,
          errorCorrectionLevel: 'M',
        });
        const qrBase64 = qrPngDataUrl.split(',')[1];
        const qrImage = await pdfDoc.embedPng(Buffer.from(qrBase64, 'base64'));

        const qrSize = 65;
        const qrX = (pageWidth - qrSize) / 2;
        curY -= qrSize + 4;
        page.drawImage(qrImage, {
          x: qrX,
          y: curY,
          width: qrSize,
          height: qrSize,
        });

        curY -= 9;
        const qrText = 'Scan & Pay via UPI';
        const qrtW = fontMonoBold.widthOfTextAtSize(qrText, 7);
        page.drawText(qrText, {
          x: (pageWidth - qrtW) / 2,
          y: curY,
          size: 7,
          font: fontMonoBold,
          color: cBlack,
        });
        curY -= 12;
      } catch (err) {
        console.warn('POS QR generation warning:', err);
      }
    }

    drawDottedLine(curY);
    curY -= 12;

    // Footer Message
    const footerMsg = options.footerMessage || 'Thank You! Visit Again.';
    const fMsgW = fontMonoBold.widthOfTextAtSize(footerMsg, 7.5);
    page.drawText(footerMsg, {
      x: Math.max(margin, (pageWidth - fMsgW) / 2),
      y: curY,
      size: 7.5,
      font: fontMonoBold,
      color: cBlack,
    });
    curY -= 10;

    const brandStr = 'DocPlatform Local POS Engine';
    const bW = fontMono.widthOfTextAtSize(brandStr, 6);
    page.drawText(brandStr, {
      x: Math.max(margin, (pageWidth - bW) / 2),
      y: curY,
      size: 6,
      font: fontMono,
      color: cGray,
    });
    curY -= 10;

    const cutText = '- - - - - [CUT HERE] - - - - -';
    const cutW = fontMono.widthOfTextAtSize(cutText, 6.5);
    page.drawText(cutText, {
      x: Math.max(margin, (pageWidth - cutW) / 2),
      y: curY,
      size: 6.5,
      font: fontMono,
      color: cGray,
    });

    await context.onProgress(90, 'Serializing vector PDF thermal receipt...');
    const pdfBytes = await pdfDoc.save();
    const outputBuffer = Buffer.from(pdfBytes);

    await context.onProgress(100, 'POS Billing thermal slip ready.');
    return {
      outputFiles: [
        {
          filename: `pos_receipt_${orderNumber}.pdf`,
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
