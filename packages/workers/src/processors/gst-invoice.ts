/**
 * @file processors/gst-invoice.ts
 * @description Authentic, Production-Grade Indian GST Tax Invoice Generator (Rule 46 CGST Rules, 2017).
 * Features:
 *  - Formal outer boundary frame & ruled ledger box-in-box structure
 *  - Statutory Rule 46 header & Original for Recipient marking
 *  - Detailed Billed To (Buyer) & Shipped To (Consignee) grid
 *  - Line items table with multi-line text wrapping & exact right-aligned currency
 *  - Mandatory HSN/SAC Tax Summary Table with CGST/SGST/IGST breakdown
 *  - Indian currency words (Lakhs/Crores) & statutory declaration
 *  - Banking details with dynamic NPCI UPI QR Code
 *  - Boxed Authorized Signatory block with stamp/signature area
 */

import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from 'pdf-lib';
import * as QRCode from 'qrcode';
import {
  GstInvoiceOptions,
  PlatformError,
  ProcessingResult,
  ValidatedFile,
  WorkerExecutionContext,
} from '@doc-platform/core';
import { DocumentProcessor, ResourceEstimate } from '@doc-platform/providers';

// ─── Number & Text Formatting Helpers ─────────────────────────────────────────

function formatInr(val: number): string {
  const parts = Math.abs(val).toFixed(2).split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1];

  let lastThree = integerPart.substring(integerPart.length - 3);
  const otherNumbers = integerPart.substring(0, integerPart.length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const formattedInt = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
  const sign = val < 0 ? '-' : '';
  return `${sign}${formattedInt}.${decimalPart}`;
}

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

function wrapText(text: string, maxWidth: number, font: PDFFont, fontSize: number): string[] {
  if (!text) return [''];
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const width = font.widthOfTextAtSize(testLine, fontSize);
    if (width <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines.length ? lines : [text];
}

function drawTextRight(page: PDFPage, text: string, rightX: number, y: number, font: PDFFont, size: number, color: any) {
  const textWidth = font.widthOfTextAtSize(text, size);
  page.drawText(text, {
    x: rightX - textWidth,
    y,
    size,
    font,
    color,
  });
}

function drawTextCenter(page: PDFPage, text: string, centerX: number, y: number, font: PDFFont, size: number, color: any) {
  const textWidth = font.widthOfTextAtSize(text, size);
  page.drawText(text, {
    x: centerX - (textWidth / 2),
    y,
    size,
    font,
    color,
  });
}

// ─── Main Processor Class ─────────────────────────────────────────────────────

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
    await context.onProgress(10, 'Calculating GST tax splits and totals...');

    const seller = options.seller;
    const buyer = options.buyer;
    const items = options.items || [];
    const invoiceNumber = options.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`;
    const invoiceDate = options.invoiceDate || new Date().toISOString().split('T')[0];
    const currencyPrefix = options.currency === 'USD' ? '$ ' : options.currency === 'EUR' ? 'EUR ' : 'Rs. ';

    // Tax Determination: Inter-state (IGST) vs Intra-state (CGST + SGST)
    const isInterState = options.taxType === 'inter' ||
      (options.taxType !== 'intra' && seller.state && buyer.state && seller.state.trim().toLowerCase() !== buyer.state.trim().toLowerCase());

    let totalTaxable = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;

    // HSN aggregation map for the statutory HSN summary table
    const hsnSummaryMap = new Map<string, {
      hsn: string;
      taxable: number;
      gstRate: number;
      cgst: number;
      sgst: number;
      igst: number;
    }>();

    const processedItems = items.map((it, idx) => {
      const qty = Math.max(1, (it as any).qty ?? (it as any).quantity ?? 1);
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

      // Group into HSN summary
      const hsnKey = `${it.hsn || '9983'}_${gstRate}`;
      const existingHsn = hsnSummaryMap.get(hsnKey) || {
        hsn: it.hsn || '9983',
        taxable: 0,
        gstRate,
        cgst: 0,
        sgst: 0,
        igst: 0,
      };
      existingHsn.taxable += taxable;
      existingHsn.cgst += cgst;
      existingHsn.sgst += sgst;
      existingHsn.igst += igst;
      hsnSummaryMap.set(hsnKey, existingHsn);

      return {
        sno: idx + 1,
        description: it.description || `Item ${idx + 1}`,
        hsn: it.hsn || '9983',
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

    const totalTax = isInterState ? totalIgst : (totalCgst + totalSgst);
    const rawTotal = totalTaxable + totalTax;
    const grandTotal = Math.round(rawTotal);
    const roundOff = Math.round((grandTotal - rawTotal) * 100) / 100;
    const amountWords = numberToWords(grandTotal);

    await context.onProgress(35, 'Generating vector PDF invoice canvas...');
    const pdfDoc = await PDFDocument.create();
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

    const pageWidth = 595.28;
    const pageHeight = 841.89; // A4 portrait
    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    // Professional Color Palette (Clean dark navy / charcoal with formal border styling)
    const primaryNavy = rgb(0.06, 0.12, 0.24);
    const headerBg = rgb(0.94, 0.96, 0.98);
    const subtleBg = rgb(0.97, 0.98, 0.99);
    const darkBorder = rgb(0.25, 0.3, 0.38);
    const lightBorder = rgb(0.8, 0.84, 0.88);
    const textDark = rgb(0.08, 0.1, 0.14);
    const textMuted = rgb(0.38, 0.43, 0.5);

    // ── Outer Ledger Boundary Frame ──────────────────────────────────────────
    const margin = 24;
    const boxX = margin;
    const boxWidth = pageWidth - 2 * margin; // 547.28
    const boxBottom = 24;
    const boxTop = pageHeight - 24; // 817.89
    const boxHeight = boxTop - boxBottom; // 793.89

    page.drawRectangle({
      x: boxX,
      y: boxBottom,
      width: boxWidth,
      height: boxHeight,
      borderColor: darkBorder,
      borderWidth: 1.2,
    });

    let yPos = boxTop;

    // ── 1. Statutory Header Bar (Rule 46 CGST Rules, 2017) ───────────────────
    const statHeaderHeight = 32;
    page.drawRectangle({
      x: boxX,
      y: yPos - statHeaderHeight,
      width: boxWidth,
      height: statHeaderHeight,
      color: headerBg,
      borderColor: darkBorder,
      borderWidth: 0.8,
    });

    drawTextCenter(page, 'TAX INVOICE', boxX + boxWidth / 2, yPos - 14, fontBold, 12, primaryNavy);
    drawTextCenter(page, '(Issued under Section 31 of CGST Act, 2017 read with Rule 46 of CGST Rules, 2017)', boxX + boxWidth / 2, yPos - 25, fontItalic, 6.8, textMuted);
    
    // Copy indicator right aligned
    drawTextRight(page, 'Original for Recipient', boxX + boxWidth - 10, yPos - 18, fontBold, 7.5, primaryNavy);

    yPos -= statHeaderHeight;

    // ── 2. Seller / Supplier Banner Block ────────────────────────────────────
    const sellerHeight = 56;
    page.drawRectangle({
      x: boxX,
      y: yPos - sellerHeight,
      width: boxWidth,
      height: sellerHeight,
      borderColor: darkBorder,
      borderWidth: 0.8,
    });

    page.drawText(seller.name.toUpperCase(), {
      x: boxX + 12,
      y: yPos - 16,
      size: 11.5,
      font: fontBold,
      color: primaryNavy,
    });

    const sellerAddr = (seller.address || '').slice(0, 85);
    page.drawText(sellerAddr, {
      x: boxX + 12,
      y: yPos - 29,
      size: 7.8,
      font: fontRegular,
      color: textDark,
    });

    const sellerDetailsLine = `GSTIN: ${seller.gstin || 'Unregistered'}  |  PAN: ${seller.pan || '-'}  |  State: ${seller.state || '-'} (Code: ${seller.stateCode || '-'})`;
    page.drawText(sellerDetailsLine, {
      x: boxX + 12,
      y: yPos - 41,
      size: 7.5,
      font: fontBold,
      color: textDark,
    });

    const contactStr = `${seller.phone ? `Ph: ${seller.phone}   ` : ''}${seller.email ? `Email: ${seller.email}` : ''}`;
    if (contactStr.trim()) {
      page.drawText(contactStr, {
        x: boxX + 12,
        y: yPos - 51,
        size: 7,
        font: fontRegular,
        color: textMuted,
      });
    }

    yPos -= sellerHeight;

    // ── 3. Invoice Meta 4-Quadrant Ruled Grid ─────────────────────────────────
    const metaHeight = 44;
    const midX = boxX + boxWidth / 2;

    page.drawRectangle({
      x: boxX,
      y: yPos - metaHeight,
      width: boxWidth,
      height: metaHeight,
      color: subtleBg,
      borderColor: darkBorder,
      borderWidth: 0.8,
    });

    // Vertical divider line between left and right meta columns
    page.drawLine({
      start: { x: midX, y: yPos },
      end: { x: midX, y: yPos - metaHeight },
      thickness: 0.8,
      color: darkBorder,
    });

    // Left metadata column
    page.drawText('Invoice Number:', { x: boxX + 12, y: yPos - 12, size: 7.5, font: fontBold, color: textDark });
    page.drawText(invoiceNumber, { x: boxX + 90, y: yPos - 12, size: 8, font: fontBold, color: primaryNavy });

    page.drawText('Invoice Date:', { x: boxX + 12, y: yPos - 22, size: 7.5, font: fontRegular, color: textDark });
    page.drawText(invoiceDate, { x: boxX + 90, y: yPos - 22, size: 7.5, font: fontBold, color: textDark });

    page.drawText('State & Code:', { x: boxX + 12, y: yPos - 32, size: 7.5, font: fontRegular, color: textDark });
    page.drawText(`${seller.state || '-'} (${seller.stateCode || '-'})`, { x: boxX + 90, y: yPos - 32, size: 7.5, font: fontRegular, color: textDark });

    page.drawText('Reverse Charge:', { x: boxX + 12, y: yPos - 41, size: 7.5, font: fontRegular, color: textDark });
    page.drawText('No', { x: boxX + 90, y: yPos - 41, size: 7.5, font: fontRegular, color: textDark });

    // Right metadata column
    page.drawText('Place of Supply:', { x: midX + 12, y: yPos - 12, size: 7.5, font: fontBold, color: textDark });
    page.drawText(`${buyer.placeOfSupply || buyer.state || '-'} (${buyer.stateCode || '-'})`, { x: midX + 95, y: yPos - 12, size: 8, font: fontBold, color: primaryNavy });

    page.drawText('Supply Type:', { x: midX + 12, y: yPos - 22, size: 7.5, font: fontRegular, color: textDark });
    page.drawText(isInterState ? 'Inter-State (IGST)' : 'Intra-State (CGST + SGST)', { x: midX + 95, y: yPos - 22, size: 7.5, font: fontBold, color: textDark });

    page.drawText('Payment Due Date:', { x: midX + 12, y: yPos - 32, size: 7.5, font: fontRegular, color: textDark });
    page.drawText(options.dueDate || 'Net 15 Days / Immediate', { x: midX + 95, y: yPos - 32, size: 7.5, font: fontRegular, color: textDark });

    page.drawText('Vehicle / Trans No:', { x: midX + 12, y: yPos - 41, size: 7.5, font: fontRegular, color: textDark });
    page.drawText('Direct / Hand Delivery', { x: midX + 95, y: yPos - 41, size: 7.5, font: fontRegular, color: textDark });

    yPos -= metaHeight;

    // ── 4. Party Details Grid (Receiver Billed To & Consignee Shipped To) ────
    const partyHeight = 62;
    page.drawRectangle({
      x: boxX,
      y: yPos - partyHeight,
      width: boxWidth,
      height: partyHeight,
      borderColor: darkBorder,
      borderWidth: 0.8,
    });

    // Vertical divider line between Billed to and Shipped to
    page.drawLine({
      start: { x: midX, y: yPos },
      end: { x: midX, y: yPos - partyHeight },
      thickness: 0.8,
      color: darkBorder,
    });

    // Left: Details of Receiver | Billed to:
    page.drawText('DETAILS OF RECEIVER (BILLED TO)', { x: boxX + 12, y: yPos - 13, size: 7.5, font: fontBold, color: textMuted });
    page.drawText(buyer.name, { x: boxX + 12, y: yPos - 25, size: 9, font: fontBold, color: textDark });
    page.drawText((buyer.address || 'Registered Address on File').slice(0, 52), { x: boxX + 12, y: yPos - 36, size: 7.5, font: fontRegular, color: textDark });
    page.drawText(`State: ${buyer.state || '-'} (Code: ${buyer.stateCode || '-'})`, { x: boxX + 12, y: yPos - 46, size: 7.5, font: fontRegular, color: textDark });
    page.drawText(`GSTIN / UIN: ${buyer.gstin || 'Consumer / Unregistered'}`, { x: boxX + 12, y: yPos - 56, size: 7.5, font: fontBold, color: primaryNavy });

    // Right: Details of Consignee | Shipped to:
    page.drawText('DETAILS OF CONSIGNEE (SHIPPED TO)', { x: midX + 12, y: yPos - 13, size: 7.5, font: fontBold, color: textMuted });
    page.drawText(buyer.name, { x: midX + 12, y: yPos - 25, size: 9, font: fontBold, color: textDark });
    page.drawText((buyer.address || 'Same as Billed Address').slice(0, 52), { x: midX + 12, y: yPos - 36, size: 7.5, font: fontRegular, color: textDark });
    page.drawText(`State: ${buyer.state || '-'} (Code: ${buyer.stateCode || '-'})`, { x: midX + 12, y: yPos - 46, size: 7.5, font: fontRegular, color: textDark });
    page.drawText(`GSTIN / UIN: ${buyer.gstin || 'Consumer / Unregistered'}`, { x: midX + 12, y: yPos - 56, size: 7.5, font: fontBold, color: primaryNavy });

    yPos -= partyHeight;

    // ── 5. Main Itemized Goods & Services Table ──────────────────────────────
    // Column geometry totaling boxWidth = 547.28 exactly
    type ColDef = { id: string; label: string; width: number; align: 'left' | 'center' | 'right' };
    
    let columns: ColDef[];
    if (isInterState) {
      columns = [
        { id: 'sno', label: 'S.N.', width: 22, align: 'center' },
        { id: 'desc', label: 'Description of Goods / Services', width: 195, align: 'left' },
        { id: 'hsn', label: 'HSN/SAC', width: 48, align: 'center' },
        { id: 'qty', label: 'Qty', width: 28, align: 'center' },
        { id: 'rate', label: 'Rate (Rs.)', width: 58, align: 'right' },
        { id: 'taxable', label: 'Taxable (Rs.)', width: 68, align: 'right' },
        { id: 'igst', label: 'IGST (Rs.)', width: 58, align: 'right' },
        { id: 'total', label: 'Total (Rs.)', width: 70.28, align: 'right' },
      ];
    } else {
      columns = [
        { id: 'sno', label: 'S.N.', width: 22, align: 'center' },
        { id: 'desc', label: 'Description of Goods / Services', width: 165, align: 'left' },
        { id: 'hsn', label: 'HSN/SAC', width: 46, align: 'center' },
        { id: 'qty', label: 'Qty', width: 26, align: 'center' },
        { id: 'rate', label: 'Rate (Rs.)', width: 54, align: 'right' },
        { id: 'taxable', label: 'Taxable (Rs.)', width: 58, align: 'right' },
        { id: 'cgst', label: 'CGST (Rs.)', width: 53, align: 'right' },
        { id: 'sgst', label: 'SGST (Rs.)', width: 53, align: 'right' },
        { id: 'total', label: 'Total (Rs.)', width: 70.28, align: 'right' },
      ];
    }

    // Draw Table Header Row
    const thHeight = 18;
    page.drawRectangle({
      x: boxX,
      y: yPos - thHeight,
      width: boxWidth,
      height: thHeight,
      color: headerBg,
      borderColor: darkBorder,
      borderWidth: 0.8,
    });

    let curX = boxX;
    for (let i = 0; i < columns.length; i++) {
      const col = columns[i];
      if (i > 0) {
        page.drawLine({
          start: { x: curX, y: yPos },
          end: { x: curX, y: yPos - thHeight },
          thickness: 0.6,
          color: darkBorder,
        });
      }

      const textY = yPos - 12;
      if (col.align === 'center') {
        drawTextCenter(page, col.label, curX + col.width / 2, textY, fontBold, 7, primaryNavy);
      } else if (col.align === 'right') {
        drawTextRight(page, col.label, curX + col.width - 5, textY, fontBold, 7, primaryNavy);
      } else {
        page.drawText(col.label, { x: curX + 6, y: textY, size: 7, font: fontBold, color: primaryNavy });
      }
      curX += col.width;
    }

    yPos -= thHeight;

    // Draw Items Rows (with multi-line text wrapping so titles are never clipped!)
    let sumQty = 0;
    for (let r = 0; r < processedItems.length; r++) {
      const item = processedItems[r];
      sumQty += item.qty;

      const descColWidth = columns.find(c => c.id === 'desc')!.width;
      const descLines = wrapText(item.description, descColWidth - 12, fontBold, 7.8);
      const rowHeight = Math.max(20, descLines.length * 9.5 + 8);

      // Background alternating tint
      if (r % 2 === 1) {
        page.drawRectangle({
          x: boxX,
          y: yPos - rowHeight,
          width: boxWidth,
          height: rowHeight,
          color: subtleBg,
        });
      }

      // Bottom row divider line
      page.drawLine({
        start: { x: boxX, y: yPos - rowHeight },
        end: { x: boxX + boxWidth, y: yPos - rowHeight },
        thickness: 0.5,
        color: lightBorder,
      });

      // Render cell contents & vertical column divider lines
      let rowX = boxX;
      for (let c = 0; c < columns.length; c++) {
        const col = columns[c];
        if (c > 0) {
          page.drawLine({
            start: { x: rowX, y: yPos },
            end: { x: rowX, y: yPos - rowHeight },
            thickness: 0.5,
            color: lightBorder,
          });
        }

        const cellTopY = yPos - 13;
        if (col.id === 'sno') {
          drawTextCenter(page, String(item.sno), rowX + col.width / 2, cellTopY, fontRegular, 7.5, textDark);
        } else if (col.id === 'desc') {
          for (let l = 0; l < descLines.length; l++) {
            page.drawText(descLines[l], {
              x: rowX + 6,
              y: yPos - 11 - (l * 9.5),
              size: 7.8,
              font: fontBold,
              color: textDark,
            });
          }
        } else if (col.id === 'hsn') {
          drawTextCenter(page, item.hsn, rowX + col.width / 2, cellTopY, fontRegular, 7.5, textDark);
        } else if (col.id === 'qty') {
          drawTextCenter(page, String(item.qty), rowX + col.width / 2, cellTopY, fontRegular, 7.5, textDark);
        } else if (col.id === 'rate') {
          drawTextRight(page, formatInr(item.rate), rowX + col.width - 5, cellTopY, fontRegular, 7.5, textDark);
        } else if (col.id === 'taxable') {
          drawTextRight(page, formatInr(item.taxable), rowX + col.width - 5, cellTopY, fontRegular, 7.5, textDark);
        } else if (col.id === 'cgst') {
          drawTextRight(page, formatInr(item.cgst), rowX + col.width - 5, cellTopY, fontRegular, 7.5, textDark);
        } else if (col.id === 'sgst') {
          drawTextRight(page, formatInr(item.sgst), rowX + col.width - 5, cellTopY, fontRegular, 7.5, textDark);
        } else if (col.id === 'igst') {
          drawTextRight(page, formatInr(item.igst), rowX + col.width - 5, cellTopY, fontRegular, 7.5, textDark);
        } else if (col.id === 'total') {
          drawTextRight(page, formatInr(item.total), rowX + col.width - 5, cellTopY, fontBold, 7.8, primaryNavy);
        }

        rowX += col.width;
      }

      yPos -= rowHeight;
    }

    // Table Totals / Subtotal Row
    const subtotalHeight = 16;
    page.drawRectangle({
      x: boxX,
      y: yPos - subtotalHeight,
      width: boxWidth,
      height: subtotalHeight,
      color: headerBg,
      borderColor: darkBorder,
      borderWidth: 0.8,
    });

    let totX = boxX;
    for (let c = 0; c < columns.length; c++) {
      const col = columns[c];
      if (c > 0) {
        page.drawLine({
          start: { x: totX, y: yPos },
          end: { x: totX, y: yPos - subtotalHeight },
          thickness: 0.6,
          color: darkBorder,
        });
      }

      const totY = yPos - 11;
      if (col.id === 'desc') {
        page.drawText('Total Items & Values', { x: totX + 6, y: totY, size: 7.5, font: fontBold, color: primaryNavy });
      } else if (col.id === 'qty') {
        drawTextCenter(page, String(sumQty), totX + col.width / 2, totY, fontBold, 7.5, primaryNavy);
      } else if (col.id === 'taxable') {
        drawTextRight(page, formatInr(totalTaxable), totX + col.width - 5, totY, fontBold, 7.5, primaryNavy);
      } else if (col.id === 'cgst') {
        drawTextRight(page, formatInr(totalCgst), totX + col.width - 5, totY, fontBold, 7.5, primaryNavy);
      } else if (col.id === 'sgst') {
        drawTextRight(page, formatInr(totalSgst), totX + col.width - 5, totY, fontBold, 7.5, primaryNavy);
      } else if (col.id === 'igst') {
        drawTextRight(page, formatInr(totalIgst), totX + col.width - 5, totY, fontBold, 7.5, primaryNavy);
      } else if (col.id === 'total') {
        drawTextRight(page, formatInr(rawTotal), totX + col.width - 5, totY, fontBold, 8, primaryNavy);
      }

      totX += col.width;
    }

    yPos -= subtotalHeight;

    // ── 6. Mandatory HSN / SAC Tax Summary Table (Rule 46 CGST Rules) ────────
    const hsnRows = Array.from(hsnSummaryMap.values());
    const hsnThHeight = 14;
    const hsnRowHeight = 13;
    const hsnTableHeight = hsnThHeight + (hsnRows.length * hsnRowHeight) + hsnRowHeight; // includes total row

    page.drawRectangle({
      x: boxX,
      y: yPos - hsnTableHeight,
      width: boxWidth,
      height: hsnTableHeight,
      borderColor: darkBorder,
      borderWidth: 0.8,
    });

    // HSN Columns: HSN/SAC | Taxable Value | Central Tax (CGST) | State Tax (SGST) | Total Tax
    type HsnColDef = { label: string; width: number; align: 'left' | 'center' | 'right' };
    let hsnCols: HsnColDef[];
    if (isInterState) {
      hsnCols = [
        { label: 'HSN / SAC Code', width: 90, align: 'center' },
        { label: 'Taxable Value (Rs.)', width: 140, align: 'right' },
        { label: 'Integrated Tax (IGST Rate & Amount)', width: 170, align: 'right' },
        { label: 'Total Tax Amount (Rs.)', width: 147.28, align: 'right' },
      ];
    } else {
      hsnCols = [
        { label: 'HSN / SAC Code', width: 85, align: 'center' },
        { label: 'Taxable Value (Rs.)', width: 110, align: 'right' },
        { label: 'Central Tax (CGST Rate & Amt)', width: 125, align: 'right' },
        { label: 'State Tax (SGST Rate & Amt)', width: 125, align: 'right' },
        { label: 'Total Tax Amount (Rs.)', width: 102.28, align: 'right' },
      ];
    }

    // Draw HSN Header
    page.drawRectangle({
      x: boxX,
      y: yPos - hsnThHeight,
      width: boxWidth,
      height: hsnThHeight,
      color: headerBg,
    });

    let hsnX = boxX;
    for (let c = 0; c < hsnCols.length; c++) {
      const col = hsnCols[c];
      if (c > 0) {
        page.drawLine({
          start: { x: hsnX, y: yPos },
          end: { x: hsnX, y: yPos - hsnTableHeight },
          thickness: 0.5,
          color: lightBorder,
        });
      }
      const hsnThY = yPos - 10;
      if (col.align === 'center') {
        drawTextCenter(page, col.label, hsnX + col.width / 2, hsnThY, fontBold, 6.8, primaryNavy);
      } else {
        drawTextRight(page, col.label, hsnX + col.width - 6, hsnThY, fontBold, 6.8, primaryNavy);
      }
      hsnX += col.width;
    }

    let hsnY = yPos - hsnThHeight;

    // Draw HSN Data Rows
    for (let i = 0; i < hsnRows.length; i++) {
      const row = hsnRows[i];
      let curColX = boxX;

      page.drawLine({
        start: { x: boxX, y: hsnY - hsnRowHeight },
        end: { x: boxX + boxWidth, y: hsnY - hsnRowHeight },
        thickness: 0.5,
        color: lightBorder,
      });

      const dataY = hsnY - 9;
      if (isInterState) {
        drawTextCenter(page, row.hsn, curColX + hsnCols[0].width / 2, dataY, fontRegular, 7, textDark);
        curColX += hsnCols[0].width;

        drawTextRight(page, formatInr(row.taxable), curColX + hsnCols[1].width - 6, dataY, fontRegular, 7, textDark);
        curColX += hsnCols[1].width;

        drawTextRight(page, `${row.gstRate}% : ${formatInr(row.igst)}`, curColX + hsnCols[2].width - 6, dataY, fontRegular, 7, textDark);
        curColX += hsnCols[2].width;

        drawTextRight(page, formatInr(row.igst), curColX + hsnCols[3].width - 6, dataY, fontBold, 7, textDark);
      } else {
        const halfRate = row.gstRate / 2;
        drawTextCenter(page, row.hsn, curColX + hsnCols[0].width / 2, dataY, fontRegular, 7, textDark);
        curColX += hsnCols[0].width;

        drawTextRight(page, formatInr(row.taxable), curColX + hsnCols[1].width - 6, dataY, fontRegular, 7, textDark);
        curColX += hsnCols[1].width;

        drawTextRight(page, `${halfRate}% : ${formatInr(row.cgst)}`, curColX + hsnCols[2].width - 6, dataY, fontRegular, 7, textDark);
        curColX += hsnCols[2].width;

        drawTextRight(page, `${halfRate}% : ${formatInr(row.sgst)}`, curColX + hsnCols[3].width - 6, dataY, fontRegular, 7, textDark);
        curColX += hsnCols[3].width;

        drawTextRight(page, formatInr(row.cgst + row.sgst), curColX + hsnCols[4].width - 6, dataY, fontBold, 7, textDark);
      }

      hsnY -= hsnRowHeight;
    }

    // HSN Summary Total Row
    page.drawRectangle({
      x: boxX,
      y: hsnY - hsnRowHeight,
      width: boxWidth,
      height: hsnRowHeight,
      color: headerBg,
    });

    const hsnTotY = hsnY - 9;
    drawTextCenter(page, 'Tax Summary Total', boxX + hsnCols[0].width / 2, hsnTotY, fontBold, 6.8, primaryNavy);
    drawTextRight(page, formatInr(totalTaxable), boxX + hsnCols[0].width + hsnCols[1].width - 6, hsnTotY, fontBold, 6.8, primaryNavy);

    if (isInterState) {
      drawTextRight(page, formatInr(totalIgst), boxX + hsnCols[0].width + hsnCols[1].width + hsnCols[2].width - 6, hsnTotY, fontBold, 6.8, primaryNavy);
      drawTextRight(page, formatInr(totalIgst), boxX + boxWidth - 6, hsnTotY, fontBold, 7, primaryNavy);
    } else {
      drawTextRight(page, formatInr(totalCgst), boxX + hsnCols[0].width + hsnCols[1].width + hsnCols[2].width - 6, hsnTotY, fontBold, 6.8, primaryNavy);
      drawTextRight(page, formatInr(totalSgst), boxX + hsnCols[0].width + hsnCols[1].width + hsnCols[2].width + hsnCols[3].width - 6, hsnTotY, fontBold, 6.8, primaryNavy);
      drawTextRight(page, formatInr(totalCgst + totalSgst), boxX + boxWidth - 6, hsnTotY, fontBold, 7, primaryNavy);
    }

    yPos -= hsnTableHeight;

    // ── 7. Bottom Details: Amount in Words, Bank + QR, Totals & Signatory ─────
    const bottomHeight = yPos - boxBottom;
    const splitX = boxX + 325; // 325 width left, 222.28 width right

    // Vertical divider line dividing bottom area
    page.drawLine({
      start: { x: splitX, y: yPos },
      end: { x: splitX, y: boxBottom },
      thickness: 0.8,
      color: darkBorder,
    });

    // ── LEFT BOTTOM COLUMN (Words, Bank, Dynamic UPI QR, Declaration) ────────
    let leftY = yPos;

    // Total Amount in Words box
    const wordsBoxHeight = 32;
    page.drawRectangle({
      x: boxX,
      y: leftY - wordsBoxHeight,
      width: splitX - boxX,
      height: wordsBoxHeight,
      color: subtleBg,
      borderColor: darkBorder,
      borderWidth: 0.6,
    });

    page.drawText('TOTAL INVOICE AMOUNT IN WORDS:', {
      x: boxX + 10,
      y: leftY - 11,
      size: 6.8,
      font: fontBold,
      color: textMuted,
    });

    const wordsLines = wrapText(amountWords, splitX - boxX - 20, fontBold, 7.8);
    for (let l = 0; l < wordsLines.length; l++) {
      page.drawText(wordsLines[l], {
        x: boxX + 10,
        y: leftY - 22 - (l * 9),
        size: 7.8,
        font: fontBold,
        color: primaryNavy,
      });
    }

    leftY -= wordsBoxHeight;

    // Dynamic NPCI UPI QR Code & Banking Details Side-by-Side
    const bankBoxHeight = 78;
    page.drawRectangle({
      x: boxX,
      y: leftY - bankBoxHeight,
      width: splitX - boxX,
      height: bankBoxHeight,
      borderColor: darkBorder,
      borderWidth: 0.6,
    });

    // Resolve UPI ID reliably from root or bankDetails
    const upiId = options.bankDetails?.upiId || (options as any).upiId || (options.seller as any)?.upiId || 'merchant@upi';
    let qrPngBuffer: Buffer | null = null;
    if (upiId && upiId.includes('@')) {
      const upiPayload = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(seller.name)}&am=${grandTotal.toFixed(2)}&tn=INV-${encodeURIComponent(invoiceNumber)}&cu=INR`;
      try {
        qrPngBuffer = await QRCode.toBuffer(upiPayload, {
          width: 140,
          margin: 1,
          color: { dark: '#0a1020', light: '#ffffff' },
        });
      } catch (qrErr) {
        console.warn('[GstInvoice] QR code generation failed:', qrErr);
      }
    }

    // Bank details left
    const bank = options.bankDetails || {};
    page.drawText('BANKING & PAYMENT DETAILS', { x: boxX + 10, y: leftY - 13, size: 7.2, font: fontBold, color: primaryNavy });
    page.drawText(`Bank Name: ${bank.bankName || 'HDFC Bank'}`, { x: boxX + 10, y: leftY - 26, size: 7.5, font: fontRegular, color: textDark });
    page.drawText(`A/C Holder: ${seller.name}`, { x: boxX + 10, y: leftY - 37, size: 7.5, font: fontRegular, color: textDark });
    page.drawText(`A/C No: ${bank.accountNumber || '50200012345678'}`, { x: boxX + 10, y: leftY - 48, size: 7.5, font: fontBold, color: textDark });
    page.drawText(`IFSC Code: ${bank.ifscCode || 'HDFC0000123'}`, { x: boxX + 10, y: leftY - 59, size: 7.5, font: fontBold, color: textDark });
    page.drawText(`UPI ID: ${upiId}`, { x: boxX + 10, y: leftY - 70, size: 7.5, font: fontBold, color: primaryNavy });

    // Embed UPI QR Image on the right of the bank box
    if (qrPngBuffer) {
      const qrImage = await pdfDoc.embedPng(qrPngBuffer);
      const qrSize = 58;
      const qrX = splitX - qrSize - 12;
      const qrY = leftY - bankBoxHeight + 14;
      page.drawImage(qrImage, {
        x: qrX,
        y: qrY,
        width: qrSize,
        height: qrSize,
      });
      drawTextCenter(page, 'Scan & Pay via UPI', qrX + qrSize / 2, qrY - 7, fontBold, 5.8, primaryNavy);
    }

    leftY -= bankBoxHeight;

    // Statutory Declaration & Terms
    page.drawText('DECLARATION:', { x: boxX + 10, y: leftY - 11, size: 6.8, font: fontBold, color: textMuted });
    const declText = 'We declare that this invoice shows the actual price of the goods / services described and that all particulars are true and correct.';
    const declLines = wrapText(declText, splitX - boxX - 20, fontRegular, 6.8);
    for (let l = 0; l < declLines.length; l++) {
      page.drawText(declLines[l], {
        x: boxX + 10,
        y: leftY - 21 - (l * 8.5),
        size: 6.8,
        font: fontRegular,
        color: textDark,
      });
    }

    const termsText = `Terms: 1. All disputes subject to ${seller.state || 'Delhi'} jurisdiction only. 2. Payment due within specified period.`;
    page.drawText(termsText, {
      x: boxX + 10,
      y: boxBottom + 8,
      size: 6.2,
      font: fontItalic,
      color: textMuted,
    });

    // ── RIGHT BOTTOM COLUMN (Financial Totals & Authorized Signatory) ────────
    let rightY = yPos;
    const rightWidth = boxX + boxWidth - splitX; // 222.28

    // Financial Calculation Summary Box
    const sumLineHeight = 15;
    const calcLinesCount = isInterState ? 4 : 5; // taxable, (cgst+sgst or igst), roundoff, grandTotal
    const calcBoxHeight = calcLinesCount * sumLineHeight + 8;

    page.drawRectangle({
      x: splitX,
      y: rightY - calcBoxHeight,
      width: rightWidth,
      height: calcBoxHeight,
      color: subtleBg,
      borderColor: darkBorder,
      borderWidth: 0.6,
    });

    let cy = rightY - 12;

    // Taxable Value
    page.drawText('Taxable Amount:', { x: splitX + 10, y: cy, size: 7.8, font: fontRegular, color: textDark });
    drawTextRight(page, `${currencyPrefix}${formatInr(totalTaxable)}`, boxX + boxWidth - 10, cy, fontBold, 7.8, textDark);

    if (isInterState) {
      cy -= sumLineHeight;
      page.drawText('Add: Integrated GST (IGST):', { x: splitX + 10, y: cy, size: 7.8, font: fontRegular, color: textDark });
      drawTextRight(page, `${currencyPrefix}${formatInr(totalIgst)}`, boxX + boxWidth - 10, cy, fontBold, 7.8, textDark);
    } else {
      cy -= sumLineHeight;
      page.drawText('Add: Central GST (CGST):', { x: splitX + 10, y: cy, size: 7.8, font: fontRegular, color: textDark });
      drawTextRight(page, `${currencyPrefix}${formatInr(totalCgst)}`, boxX + boxWidth - 10, cy, fontBold, 7.8, textDark);

      cy -= sumLineHeight;
      page.drawText('Add: State GST (SGST):', { x: splitX + 10, y: cy, size: 7.8, font: fontRegular, color: textDark });
      drawTextRight(page, `${currencyPrefix}${formatInr(totalSgst)}`, boxX + boxWidth - 10, cy, fontBold, 7.8, textDark);
    }

    // Round Off
    cy -= sumLineHeight;
    page.drawText('Round Off:', { x: splitX + 10, y: cy, size: 7.5, font: fontRegular, color: textMuted });
    const roundOffStr = `${roundOff >= 0 ? '+' : ''}${formatInr(roundOff)}`;
    drawTextRight(page, `${currencyPrefix}${roundOffStr}`, boxX + boxWidth - 10, cy, fontRegular, 7.5, textMuted);

    // Grand Total Bar
    page.drawRectangle({
      x: splitX,
      y: rightY - calcBoxHeight,
      width: rightWidth,
      height: 20,
      color: primaryNavy,
    });

    page.drawText('TOTAL INVOICE VALUE:', {
      x: splitX + 8,
      y: rightY - calcBoxHeight + 6,
      size: 8,
      font: fontBold,
      color: rgb(1, 1, 1),
    });

    drawTextRight(page, `${currencyPrefix}${formatInr(grandTotal)}`, boxX + boxWidth - 10, rightY - calcBoxHeight + 6, fontBold, 9.5, rgb(1, 1, 1));

    rightY -= calcBoxHeight;

    // Authorized Signatory Box
    const signatoryHeight = rightY - boxBottom;
    page.drawRectangle({
      x: splitX,
      y: boxBottom,
      width: rightWidth,
      height: signatoryHeight,
      borderColor: darkBorder,
      borderWidth: 0.6,
    });

    page.drawText(`For ${seller.name.toUpperCase()}`, {
      x: splitX + 10,
      y: rightY - 14,
      size: 8,
      font: fontBold,
      color: primaryNavy,
    });

    page.drawText('(Authorized Signatory / Stamp)', {
      x: splitX + 10,
      y: rightY - 26,
      size: 6.8,
      font: fontItalic,
      color: textMuted,
    });

    // Signature line
    page.drawLine({
      start: { x: splitX + 12, y: boxBottom + 22 },
      end: { x: boxX + boxWidth - 12, y: boxBottom + 22 },
      thickness: 0.6,
      color: darkBorder,
    });

    drawTextCenter(page, 'Authorised Signatory', splitX + rightWidth / 2, boxBottom + 10, fontBold, 7.5, primaryNavy);

    // Finalize PDF
    await context.onProgress(95, 'Finalizing authentic vector PDF invoice bytes...');
    const pdfBytes = await pdfDoc.save();
    const outputBuffer = Buffer.from(pdfBytes);
    await context.onProgress(100, 'Authentic Indian GST Invoice PDF ready.');

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
