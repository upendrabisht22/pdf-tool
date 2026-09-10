/**
 * @file processors/gst-invoice.ts
 * @description Professional GST & Tax-Compliant Invoice Generator with dynamic UPI QR Code.
 */

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import * as QRCode from 'qrcode';
import {
  GstInvoiceOptions,
  PlatformError,
  ProcessingResult,
  ValidatedFile,
  WorkerExecutionContext,
} from '@doc-platform/core';
import { DocumentProcessor, ResourceEstimate } from '@doc-platform/providers';

// Helper to convert number to Indian Currency Words
function numberToWords(amount: number): string {
  const words = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertChunk(n: number): string {
    let str = '';
    if (n >= 100) {
      str += words[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      str += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    }
    if (n > 0) {
      str += words[n] + ' ';
    }
    return str.trim();
  }

  const rounded = Math.round(amount * 100) / 100;
  const rupees = Math.floor(rounded);
  const paise = Math.round((rounded - rupees) * 100);

  if (rupees === 0 && paise === 0) return 'Zero Rupees Only';

  let result = '';
  const crore = Math.floor(rupees / 10000000);
  const remCrore = rupees % 10000000;
  const lakh = Math.floor(remCrore / 100000);
  const remLakh = remCrore % 100000;
  const thousand = Math.floor(remLakh / 1000);
  const remThousand = remLakh % 1000;

  if (crore > 0) result += convertChunk(crore) + ' Crore ';
  if (lakh > 0) result += convertChunk(lakh) + ' Lakh ';
  if (thousand > 0) result += convertChunk(thousand) + ' Thousand ';
  if (remThousand > 0) result += convertChunk(remThousand) + ' ';

  result = 'Rupees ' + result.trim();
  if (paise > 0) {
    result += ' and ' + convertChunk(paise) + ' Paise';
  }
  return result + ' Only';
}

export class GstInvoiceProcessor implements DocumentProcessor<GstInvoiceOptions> {
  readonly operation = 'gst-invoice-pdf' as const;

  async validateInput(_inputFiles: ValidatedFile[], options: GstInvoiceOptions): Promise<void> {
    if (!options) {
      throw new PlatformError('INVALID_INPUT', { message: 'GST Invoice options are required.' });
    }
    if (!options.seller?.name || options.seller.name.trim().length === 0) {
      throw new PlatformError('INVALID_INPUT', { message: 'Seller / Business name is required.' });
    }
    if (!options.buyer?.name || options.buyer.name.trim().length === 0) {
      throw new PlatformError('INVALID_INPUT', { message: 'Buyer / Client name is required.' });
    }
    if (!options.items || options.items.length === 0) {
      throw new PlatformError('INVALID_INPUT', { message: 'At least 1 invoice line item is required.' });
    }
  }

  estimateResourceCost(_inputFiles: ValidatedFile[], options: GstInvoiceOptions): ResourceEstimate {
    const itemsCount = options?.items?.length || 1;
    return {
      estimatedDurationMs: Math.max(300, itemsCount * 50),
      estimatedMemoryBytes: 48 * 1024 * 1024,
      isHeavyOperation: false,
    };
  }

  async process(
    _inputBuffers: Buffer[],
    options: GstInvoiceOptions,
    context: WorkerExecutionContext
  ): Promise<ProcessingResult> {
    const startTime = Date.now();
    await context.onProgress(15, 'Calculating GST tax splits and totals...');

    const seller = options.seller;
    const buyer = options.buyer;
    const items = options.items || [];
    const invoiceNumber = options.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`;
    const invoiceDate = options.invoiceDate || new Date().toISOString().split('T')[0];
    const currencySymbol = options.currency === 'USD' ? '$ ' : options.currency === 'EUR' ? 'EUR ' : 'Rs. ';

    // Tax Determination: Inter-state (IGST) vs Intra-state (CGST + SGST)
    const isInterState = options.taxType === 'inter' ||
      (options.taxType !== 'intra' && seller.state && buyer.state && seller.state.trim().toLowerCase() !== buyer.state.trim().toLowerCase());

    let totalTaxable = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;

    const processedItems = items.map((it, idx) => {
      const qty = Math.max(1, it.qty || 1);
      const rate = Math.max(0, it.rate || 0);
      const discount = Math.min(100, Math.max(0, it.discountPct || 0));
      const taxable = Math.round((qty * rate * (1 - discount / 100)) * 100) / 100;
      const gstRate = it.gstRate || 0;

      let cgst = 0;
      let sgst = 0;
      let igst = 0;

      if (isInterState) {
        igst = Math.round((taxable * (gstRate / 100)) * 100) / 100;
      } else {
        cgst = Math.round((taxable * (gstRate / 200)) * 100) / 100;
        sgst = Math.round((taxable * (gstRate / 200)) * 100) / 100;
      }

      totalTaxable += taxable;
      totalCgst += cgst;
      totalSgst += sgst;
      totalIgst += igst;

      return {
        sno: idx + 1,
        description: it.description || `Item ${idx + 1}`,
        hsn: it.hsn || '-',
        qty,
        rate,
        taxable,
        gstRate,
        cgst,
        sgst,
        igst,
        total: Math.round((taxable + cgst + sgst + igst) * 100) / 100,
      };
    });

    const grandTotal = Math.round((totalTaxable + totalCgst + totalSgst + totalIgst) * 100) / 100;
    const amountWords = numberToWords(grandTotal);

    await context.onProgress(40, 'Generating vector PDF invoice canvas...');
    const pdfDoc = await PDFDocument.create();
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

    const pageWidth = 595.28;
    const pageHeight = 841.89; // A4 portrait
    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    const primaryColor = options.theme === 'corporate' ? rgb(0.12, 0.25, 0.55) :
                         options.theme === 'emerald' ? rgb(0.04, 0.45, 0.32) :
                         rgb(0.09, 0.12, 0.2); // Modern dark slate
    const subtleBg = rgb(0.96, 0.97, 0.98);
    const borderColor = rgb(0.85, 0.88, 0.92);
    const textColor = rgb(0.15, 0.18, 0.22);
    const mutedColor = rgb(0.45, 0.5, 0.58);

    // ── Header Banner ──────────────────────────────────────────────────────────
    page.drawRectangle({
      x: 36,
      y: pageHeight - 95,
      width: pageWidth - 72,
      height: 60,
      color: primaryColor,
    });

    page.drawText(seller.name.toUpperCase(), {
      x: 50,
      y: pageHeight - 65,
      size: 16,
      font: fontBold,
      color: rgb(1, 1, 1),
    });

    page.drawText(seller.gstin ? `GSTIN: ${seller.gstin}` : 'TAX INVOICE', {
      x: 50,
      y: pageHeight - 82,
      size: 9,
      font: fontRegular,
      color: rgb(0.9, 0.92, 0.98),
    });

    page.drawText('TAX INVOICE', {
      x: pageWidth - 165,
      y: pageHeight - 65,
      size: 14,
      font: fontBold,
      color: rgb(1, 1, 1),
    });

    page.drawText(`ORIGINAL FOR RECIPIENT`, {
      x: pageWidth - 165,
      y: pageHeight - 82,
      size: 7.5,
      font: fontRegular,
      color: rgb(0.9, 0.92, 0.98),
    });

    // ── Invoice Meta Bar & Address Boxes ──────────────────────────────────────
    let yPos = pageHeight - 110;

    // Meta Bar
    page.drawRectangle({
      x: 36,
      y: yPos - 30,
      width: pageWidth - 72,
      height: 30,
      color: subtleBg,
      borderColor,
      borderWidth: 1,
    });

    page.drawText(`Invoice No: ${invoiceNumber}`, { x: 48, y: yPos - 19, size: 9, font: fontBold, color: textColor });
    page.drawText(`Date: ${invoiceDate}`, { x: 210, y: yPos - 19, size: 9, font: fontRegular, color: textColor });
    page.drawText(`Place of Supply: ${buyer.placeOfSupply || buyer.state || 'Same State'}`, { x: 340, y: yPos - 19, size: 9, font: fontRegular, color: textColor });
    page.drawText(isInterState ? 'IGST (Inter-State)' : 'CGST+SGST (Intra)', { x: 470, y: yPos - 19, size: 8, font: fontBold, color: primaryColor });

    yPos -= 40;

    // Seller & Buyer 2-Column Grid
    const colWidth = (pageWidth - 72 - 12) / 2;

    // Seller Box (Left)
    page.drawRectangle({ x: 36, y: yPos - 75, width: colWidth, height: 75, borderColor, borderWidth: 1 });
    page.drawText('BILLED FROM (SELLER)', { x: 46, y: yPos - 14, size: 8, font: fontBold, color: mutedColor });
    page.drawText(seller.name, { x: 46, y: yPos - 27, size: 9.5, font: fontBold, color: textColor });
    page.drawText((seller.address || '').slice(0, 48), { x: 46, y: yPos - 39, size: 8, font: fontRegular, color: textColor });
    page.drawText(`State: ${seller.state || '-'} ${seller.stateCode ? `(${seller.stateCode})` : ''}`, { x: 46, y: yPos - 51, size: 8, font: fontRegular, color: textColor });
    page.drawText(`GSTIN: ${seller.gstin || 'Unregistered'} | PAN: ${seller.pan || '-'}`, { x: 46, y: yPos - 63, size: 7.5, font: fontRegular, color: textColor });

    // Buyer Box (Right)
    const rightX = 36 + colWidth + 12;
    page.drawRectangle({ x: rightX, y: yPos - 75, width: colWidth, height: 75, borderColor, borderWidth: 1 });
    page.drawText('BILLED TO (BUYER / CLIENT)', { x: rightX + 10, y: yPos - 14, size: 8, font: fontBold, color: mutedColor });
    page.drawText(buyer.name, { x: rightX + 10, y: yPos - 27, size: 9.5, font: fontBold, color: textColor });
    page.drawText((buyer.address || '').slice(0, 48), { x: rightX + 10, y: yPos - 39, size: 8, font: fontRegular, color: textColor });
    page.drawText(`State: ${buyer.state || '-'} ${buyer.stateCode ? `(${buyer.stateCode})` : ''}`, { x: rightX + 10, y: yPos - 51, size: 8, font: fontRegular, color: textColor });
    page.drawText(`GSTIN: ${buyer.gstin || 'Consumer'}`, { x: rightX + 10, y: yPos - 63, size: 7.5, font: fontRegular, color: textColor });

    yPos -= 90;

    // ── Table Header ──────────────────────────────────────────────────────────
    const tableHeaders = [
      { label: '#', x: 42, width: 22 },
      { label: 'Item Description', x: 68, width: 170 },
      { label: 'HSN', x: 242, width: 44 },
      { label: 'Qty', x: 290, width: 30 },
      { label: 'Rate', x: 324, width: 48 },
      { label: 'Taxable', x: 376, width: 54 },
      { label: isInterState ? 'IGST' : 'GST%', x: 434, width: 44 },
      { label: 'Total', x: 482, width: 70 },
    ];

    page.drawRectangle({
      x: 36,
      y: yPos - 20,
      width: pageWidth - 72,
      height: 20,
      color: subtleBg,
      borderColor,
      borderWidth: 1,
    });

    for (const th of tableHeaders) {
      page.drawText(th.label, { x: th.x, y: yPos - 14, size: 8, font: fontBold, color: primaryColor });
    }

    yPos -= 20;

    // ── Items Rows ────────────────────────────────────────────────────────────
    for (const item of processedItems) {
      page.drawRectangle({
        x: 36,
        y: yPos - 20,
        width: pageWidth - 72,
        height: 20,
        borderColor,
        borderWidth: 0.5,
      });

      page.drawText(String(item.sno), { x: 44, y: yPos - 14, size: 8, font: fontRegular, color: textColor });
      page.drawText(item.description.slice(0, 32), { x: 68, y: yPos - 14, size: 8, font: fontBold, color: textColor });
      page.drawText(item.hsn, { x: 242, y: yPos - 14, size: 7.5, font: fontRegular, color: mutedColor });
      page.drawText(String(item.qty), { x: 294, y: yPos - 14, size: 8, font: fontRegular, color: textColor });
      page.drawText(`${currencySymbol}${item.rate.toFixed(2)}`, { x: 324, y: yPos - 14, size: 8, font: fontRegular, color: textColor });
      page.drawText(`${currencySymbol}${item.taxable.toFixed(2)}`, { x: 376, y: yPos - 14, size: 8, font: fontRegular, color: textColor });
      page.drawText(`${item.gstRate}%`, { x: 436, y: yPos - 14, size: 8, font: fontRegular, color: textColor });
      page.drawText(`${currencySymbol}${item.total.toFixed(2)}`, { x: 486, y: yPos - 14, size: 8.5, font: fontBold, color: textColor });

      yPos -= 20;
    }

    yPos -= 10;

    // ── Amount in Words ───────────────────────────────────────────────────────
    page.drawRectangle({
      x: 36,
      y: yPos - 22,
      width: 320,
      height: 22,
      color: rgb(0.98, 0.98, 0.99),
      borderColor,
      borderWidth: 1,
    });
    page.drawText(`Amount (in words): ${amountWords.slice(0, 60)}`, {
      x: 44,
      y: yPos - 15,
      size: 7.5,
      font: fontItalic,
      color: textColor,
    });

    // ── Summary Box (Right) ───────────────────────────────────────────────────
    const sumBoxX = 368;
    const sumBoxWidth = pageWidth - 36 - sumBoxX;
    const sumBoxHeight = isInterState ? 75 : 88;

    page.drawRectangle({
      x: sumBoxX,
      y: yPos - sumBoxHeight + 22,
      width: sumBoxWidth,
      height: sumBoxHeight,
      color: subtleBg,
      borderColor,
      borderWidth: 1,
    });

    let sY = yPos + 8;
    page.drawText(`Taxable Value:`, { x: sumBoxX + 10, y: sY, size: 8, font: fontRegular, color: textColor });
    page.drawText(`${currencySymbol}${totalTaxable.toFixed(2)}`, { x: sumBoxX + sumBoxWidth - 55, y: sY, size: 8, font: fontRegular, color: textColor });

    if (isInterState) {
      sY -= 16;
      page.drawText(`Total IGST:`, { x: sumBoxX + 10, y: sY, size: 8, font: fontRegular, color: textColor });
      page.drawText(`${currencySymbol}${totalIgst.toFixed(2)}`, { x: sumBoxX + sumBoxWidth - 55, y: sY, size: 8, font: fontRegular, color: textColor });
    } else {
      sY -= 14;
      page.drawText(`Total CGST:`, { x: sumBoxX + 10, y: sY, size: 8, font: fontRegular, color: textColor });
      page.drawText(`${currencySymbol}${totalCgst.toFixed(2)}`, { x: sumBoxX + sumBoxWidth - 55, y: sY, size: 8, font: fontRegular, color: textColor });
      sY -= 14;
      page.drawText(`Total SGST:`, { x: sumBoxX + 10, y: sY, size: 8, font: fontRegular, color: textColor });
      page.drawText(`${currencySymbol}${totalSgst.toFixed(2)}`, { x: sumBoxX + sumBoxWidth - 55, y: sY, size: 8, font: fontRegular, color: textColor });
    }

    sY -= 18;
    page.drawLine({
      start: { x: sumBoxX, y: sY + 4 },
      end: { x: sumBoxX + sumBoxWidth, y: sY + 4 },
      thickness: 1,
      color: primaryColor,
    });
    page.drawText(`GRAND TOTAL:`, { x: sumBoxX + 10, y: sY - 8, size: 9.5, font: fontBold, color: primaryColor });
    page.drawText(`${currencySymbol}${grandTotal.toFixed(2)}`, { x: sumBoxX + sumBoxWidth - 62, y: sY - 8, size: 10.5, font: fontBold, color: primaryColor });

    yPos -= sumBoxHeight + 10;

    // ── Dynamic UPI QR Code & Banking Details ─────────────────────────────────
    await context.onProgress(75, 'Generating dynamic UPI payment QR code...');

    const upiId = options.bankDetails?.upiId;
    let qrPngBuffer: Buffer | null = null;

    if (upiId && upiId.includes('@')) {
      const upiPayload = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(seller.name)}&am=${grandTotal.toFixed(2)}&tn=INV-${encodeURIComponent(invoiceNumber)}&cu=INR`;
      try {
        qrPngBuffer = await QRCode.toBuffer(upiPayload, {
          width: 90,
          margin: 1,
          color: { dark: '#0f172a', light: '#ffffff' },
        });
      } catch (qrErr) {
        console.warn('[GstInvoice] QR code generation failed:', qrErr);
      }
    }

    // Payment Box
    page.drawRectangle({
      x: 36,
      y: yPos - 95,
      width: pageWidth - 72,
      height: 95,
      borderColor,
      borderWidth: 1,
    });

    page.drawText('BANKING & INSTANT DIGITAL PAYMENT', { x: 48, y: yPos - 15, size: 8, font: fontBold, color: primaryColor });
    const bank = options.bankDetails || {};
    page.drawText(`Bank Name: ${bank.bankName || 'HDFC Bank'}`, { x: 48, y: yPos - 30, size: 8, font: fontRegular, color: textColor });
    page.drawText(`A/C No: ${bank.accountNumber || 'XXXXXXXXXXXX1234'}`, { x: 48, y: yPos - 43, size: 8, font: fontBold, color: textColor });
    page.drawText(`IFSC Code: ${bank.ifscCode || 'HDFC0001234'}`, { x: 48, y: yPos - 56, size: 8, font: fontRegular, color: textColor });
    page.drawText(`UPI ID: ${upiId || seller.email || 'merchant@upi'}`, { x: 48, y: yPos - 69, size: 8, font: fontRegular, color: primaryColor });
    page.drawText(`Terms: Payment due in 15 days. Subject to local jurisdiction.`, { x: 48, y: yPos - 84, size: 7, font: fontItalic, color: mutedColor });

    if (qrPngBuffer) {
      const qrImage = await pdfDoc.embedPng(qrPngBuffer);
      page.drawImage(qrImage, {
        x: pageWidth - 145,
        y: yPos - 85,
        width: 75,
        height: 75,
      });
      page.drawText('Scan with any UPI App', {
        x: pageWidth - 152,
        y: yPos - 93,
        size: 6.5,
        font: fontBold,
        color: primaryColor,
      });
    }

    // Signatory
    page.drawText(`For ${seller.name}:`, { x: pageWidth - 160, y: 55, size: 8, font: fontBold, color: textColor });
    page.drawText('Authorized Signatory', { x: pageWidth - 160, y: 35, size: 7.5, font: fontRegular, color: mutedColor });

    await context.onProgress(95, 'Finalizing vector PDF invoice bytes...');
    const pdfBytes = await pdfDoc.save();
    const outputBuffer = Buffer.from(pdfBytes);
    await context.onProgress(100, 'GST Invoice PDF ready.');

    return {
      outputFiles: [
        {
          filename: `invoice_${invoiceNumber}.pdf`,
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
