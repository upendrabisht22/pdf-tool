/**
 * DocPlatform GST Tax Invoice Studio Controller
 * Handles interactive split-screen invoice creation, real-time CGST/SGST/IGST tax calculation,
 * amount in words conversion (Crores/Lakhs/Thousands), dynamic UPI QR generation, and PDF export.
 */

import { escapeHtml } from './utils.js';

export let gstItems = [
  { id: 1, description: 'Enterprise Cloud Architecture & Consulting', hsn: '998313', quantity: 1, rate: 45000, gstRate: 18 },
  { id: 2, description: 'Secure Document Pipeline Implementation', hsn: '998314', quantity: 2, rate: 12500, gstRate: 18 }
];

let nextGstItemId = 3;

/**
 * Initializes the GST Invoice Studio with default values and renders preview.
 */
export function initGstInvoiceStudio() {
  const dateInput = document.getElementById('gst-inv-date');
  if (dateInput && !dateInput.value) {
    dateInput.value = new Date().toISOString().split('T')[0];
  }
  renderGstItemsTable();
  updateGstInvoicePreview();
}

/**
 * Renders the interactive items input table.
 */
export function renderGstItemsTable() {
  const tbody = document.getElementById('gst-items-tbody');
  if (!tbody) return;

  tbody.innerHTML = gstItems.map(item => `
    <tr data-item-id="${item.id}">
      <td>
        <input type="text" class="gst-input" value="${escapeHtml(item.description)}" 
               oninput="window.onGstItemChange(${item.id}, 'description', this.value)" 
               placeholder="Item / Service description *" style="font-size: 0.8rem; padding: 0.35rem 0.5rem;" />
      </td>
      <td>
        <input type="text" class="gst-input" value="${escapeHtml(item.hsn)}" 
               oninput="window.onGstItemChange(${item.id}, 'hsn', this.value)" 
               placeholder="HSN/SAC" style="font-size: 0.8rem; padding: 0.35rem 0.5rem;" />
      </td>
      <td>
        <input type="number" min="1" step="1" class="gst-input" value="${item.quantity}" 
               oninput="window.onGstItemChange(${item.id}, 'quantity', parseFloat(this.value) || 0)" 
               style="font-size: 0.8rem; padding: 0.35rem 0.4rem; text-align: center;" />
      </td>
      <td>
        <input type="number" min="0" step="any" class="gst-input" value="${item.rate}" 
               oninput="window.onGstItemChange(${item.id}, 'rate', parseFloat(this.value) || 0)" 
               placeholder="0.00" style="font-size: 0.8rem; padding: 0.35rem 0.5rem; text-align: right;" />
      </td>
      <td>
        <select class="gst-input" onchange="window.onGstItemChange(${item.id}, 'gstRate', parseFloat(this.value) || 0)" 
                style="font-size: 0.8rem; padding: 0.35rem 0.3rem;">
          <option value="0" ${item.gstRate === 0 ? 'selected' : ''}>0%</option>
          <option value="5" ${item.gstRate === 5 ? 'selected' : ''}>5%</option>
          <option value="12" ${item.gstRate === 12 ? 'selected' : ''}>12%</option>
          <option value="18" ${item.gstRate === 18 ? 'selected' : ''}>18%</option>
          <option value="28" ${item.gstRate === 28 ? 'selected' : ''}>28%</option>
        </select>
      </td>
      <td style="text-align: center;">
        <button type="button" class="file-card-remove" onclick="window.deleteGstItemRow(${item.id})" 
                title="Delete Row" style="font-size: 0.75rem;">✕</button>
      </td>
    </tr>
  `).join('');
}

/**
 * Handles field value updates on line items.
 */
export function onGstItemChange(id, field, value) {
  const item = gstItems.find(it => it.id === id);
  if (item) {
    item[field] = value;
    updateGstInvoicePreview();
  }
}

/**
 * Adds a new item row to the invoice table.
 */
export function addGstItemRow() {
  gstItems.push({
    id: nextGstItemId++,
    description: '',
    hsn: '9983',
    quantity: 1,
    rate: 1000,
    gstRate: 18
  });
  renderGstItemsTable();
  updateGstInvoicePreview();
}

/**
 * Deletes an item row from the invoice.
 */
export function deleteGstItemRow(id) {
  if (gstItems.length <= 1) {
    alert('At least 1 line item is required on the invoice.');
    return;
  }
  gstItems = gstItems.filter(it => it.id !== id);
  renderGstItemsTable();
  updateGstInvoicePreview();
}

/**
 * Indian Rupee Number-to-Words converter for official tax compliance.
 * Supports Crores, Lakhs, Thousands, Hundreds, Rupees, and Paise.
 */
export function numberToWordsClient(amount) {
  const words = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertChunk(n) {
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

/**
 * Recalculates all taxes and updates the live A4 preview DOM paper.
 */
export function updateGstInvoicePreview() {
  const paper = document.getElementById('gst-paper');
  if (!paper) return;

  const sellerName = document.getElementById('gst-seller-name')?.value || 'Acme Technologies Pvt Ltd';
  const sellerGstin = document.getElementById('gst-seller-gstin')?.value || '';
  const sellerAddress = document.getElementById('gst-seller-address')?.value || '';
  const sellerState = document.getElementById('gst-seller-state')?.value || 'Delhi';
  const sellerCode = document.getElementById('gst-seller-code')?.value || '07';
  const sellerPhone = document.getElementById('gst-seller-phone')?.value || '';
  const sellerPan = document.getElementById('gst-seller-pan')?.value || '';

  const buyerName = document.getElementById('gst-buyer-name')?.value || 'Apex Retailers LLP';
  const buyerGstin = document.getElementById('gst-buyer-gstin')?.value || '';
  const buyerAddress = document.getElementById('gst-buyer-address')?.value || '';
  const buyerState = document.getElementById('gst-buyer-state')?.value || 'Delhi';
  const buyerCode = document.getElementById('gst-buyer-code')?.value || '07';

  const invNumber = document.getElementById('gst-inv-number')?.value || 'INV-2026-001';
  const invDate = document.getElementById('gst-inv-date')?.value || new Date().toISOString().split('T')[0];
  const taxTypeMode = document.getElementById('gst-tax-type')?.value || 'auto';
  const theme = document.getElementById('gst-theme-select')?.value || 'modern';

  const upiId = document.getElementById('gst-upi-id')?.value || '';
  const bankName = document.getElementById('gst-bank-name')?.value || '';
  const bankAcc = document.getElementById('gst-bank-acc')?.value || '';
  const bankIfsc = document.getElementById('gst-bank-ifsc')?.value || '';

  // Determine inter vs intra state
  let isInterState = false;
  if (taxTypeMode === 'inter') {
    isInterState = true;
  } else if (taxTypeMode === 'intra') {
    isInterState = false;
  } else {
    isInterState = (sellerState.toLowerCase().trim() !== buyerState.toLowerCase().trim());
  }

  // Update Tax badge
  const taxBadge = document.getElementById('gst-preview-tax-badge');
  if (taxBadge) {
    taxBadge.textContent = isInterState ? 'Inter-State (100% IGST)' : 'Intra-State (CGST 50% + SGST 50%)';
  }

  // Theme color styling
  let themePrimary = '#0f172a';
  let themeLight = '#f8fafc';
  if (theme === 'corporate') {
    themePrimary = '#1e40af';
    themeLight = '#eff6ff';
  } else if (theme === 'emerald') {
    themePrimary = '#065f46';
    themeLight = '#ecfdf5';
  } else if (theme === 'minimal') {
    themePrimary = '#334155';
    themeLight = '#f8fafc';
  }

  // Calculate totals
  let subtotal = 0;
  let cgstTotal = 0;
  let sgstTotal = 0;
  let igstTotal = 0;

  const itemRowsHtml = gstItems.map((item, idx) => {
    const qty = Number(item.quantity) || 0;
    const rate = Number(item.rate) || 0;
    const itemTotal = qty * rate;
    const gstPct = Number(item.gstRate) || 0;
    subtotal += itemTotal;

    let taxAmount = 0;
    if (isInterState) {
      taxAmount = itemTotal * (gstPct / 100);
      igstTotal += taxAmount;
    } else {
      const halfTax = itemTotal * (gstPct / 200);
      cgstTotal += halfTax;
      sgstTotal += halfTax;
      taxAmount = halfTax * 2;
    }
    const lineGross = itemTotal + taxAmount;

    return `
      <tr>
        <td style="text-align: center; color: #64748b;">${idx + 1}</td>
        <td style="font-weight: 600; color: #0f172a;">${escapeHtml(item.description || 'Service / Product')}</td>
        <td style="text-align: center;">${escapeHtml(item.hsn || '-')}</td>
        <td style="text-align: center;">${qty}</td>
        <td style="text-align: right;">${rate.toFixed(2)}</td>
        <td style="text-align: right; font-weight: 600;">${itemTotal.toFixed(2)}</td>
        <td style="text-align: center;">${gstPct}%</td>
        <td style="text-align: right;">${taxAmount.toFixed(2)}</td>
        <td style="text-align: right; font-weight: 700;">${lineGross.toFixed(2)}</td>
      </tr>
    `;
  }).join('');

  const totalTax = isInterState ? igstTotal : (cgstTotal + sgstTotal);
  const grandTotal = Math.round(subtotal + totalTax);
  const roundOff = (grandTotal - (subtotal + totalTax));
  const amountInWords = numberToWordsClient(grandTotal);

  paper.innerHTML = `
    <!-- Invoice Header -->
    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.25rem; border-bottom: 2px solid ${themePrimary}; padding-bottom: 1rem;">
      <div>
        <h1 style="font-size: 1.4rem; font-weight: 800; color: ${themePrimary}; margin: 0; letter-spacing: -0.02em;">${escapeHtml(sellerName)}</h1>
        <div style="font-size: 0.76rem; color: #64748b; margin-top: 0.25rem;">${escapeHtml(sellerAddress)}</div>
        <div style="font-size: 0.74rem; font-weight: 700; color: #334155; margin-top: 0.2rem;">
          GSTIN: <span style="font-family: monospace;">${escapeHtml(sellerGstin || 'Unregistered')}</span>
          ${sellerPan ? ` • PAN: <span style="font-family: monospace;">${escapeHtml(sellerPan)}</span>` : ''}
          ${sellerPhone ? ` • Ph: ${escapeHtml(sellerPhone)}` : ''}
        </div>
      </div>
      <div style="text-align: right;">
        <div style="background: ${themePrimary}; color: #ffffff; padding: 0.3rem 0.85rem; border-radius: 4px; font-weight: 800; font-size: 0.85rem; letter-spacing: 0.06em; display: inline-block;">
          TAX INVOICE
        </div>
        <div style="font-size: 0.68rem; color: #64748b; margin-top: 0.35rem; font-weight: 600;">Original for Recipient</div>
      </div>
    </div>

    <!-- Meta Details Grid -->
    <div class="gst-doc-meta-grid" style="background: ${themeLight}; border: 1px solid #e2e8f0; margin-bottom: 1rem;">
      <div><strong>Invoice No:</strong> <span style="font-family: monospace; font-weight: 700; color: #0f172a;">${escapeHtml(invNumber)}</span></div>
      <div><strong>Invoice Date:</strong> ${escapeHtml(invDate)}</div>
      <div><strong>Place of Supply:</strong> ${escapeHtml(buyerState)} (${escapeHtml(buyerCode)})</div>
      <div><strong>Reverse Charge:</strong> No</div>
    </div>

    <!-- Addresses Section -->
    <div class="gst-doc-addresses">
      <div class="gst-doc-addr-card">
        <div class="gst-doc-addr-title">Billed By (Supplier)</div>
        <div style="font-weight: 700; font-size: 0.82rem; color: #0f172a;">${escapeHtml(sellerName)}</div>
        <div style="font-size: 0.75rem; color: #475569; margin-top: 0.15rem;">${escapeHtml(sellerAddress)}</div>
        <div style="font-size: 0.75rem; color: #475569; margin-top: 0.15rem;">State: ${escapeHtml(sellerState)} (${escapeHtml(sellerCode)})</div>
        <div style="font-size: 0.75rem; font-weight: 700; color: #0f172a; margin-top: 0.25rem;">GSTIN: <span style="font-family: monospace;">${escapeHtml(sellerGstin)}</span></div>
      </div>
      <div class="gst-doc-addr-card">
        <div class="gst-doc-addr-title">Billed To (Recipient / Client)</div>
        <div style="font-weight: 700; font-size: 0.82rem; color: #0f172a;">${escapeHtml(buyerName)}</div>
        <div style="font-size: 0.75rem; color: #475569; margin-top: 0.15rem;">${escapeHtml(buyerAddress || 'Address on file')}</div>
        <div style="font-size: 0.75rem; color: #475569; margin-top: 0.15rem;">State: ${escapeHtml(buyerState)} (${escapeHtml(buyerCode)})</div>
        <div style="font-size: 0.75rem; font-weight: 700; color: #0f172a; margin-top: 0.25rem;">GSTIN: <span style="font-family: monospace;">${escapeHtml(buyerGstin || 'Consumer / Unregistered')}</span></div>
      </div>
    </div>

    <!-- Items Table -->
    <table class="gst-doc-table">
      <thead>
        <tr>
          <th style="width: 5%; text-align: center;">#</th>
          <th style="width: 32%;">Item Description</th>
          <th style="width: 10%; text-align: center;">HSN</th>
          <th style="width: 7%; text-align: center;">Qty</th>
          <th style="width: 12%; text-align: right;">Rate (Rs.)</th>
          <th style="width: 12%; text-align: right;">Taxable (Rs.)</th>
          <th style="width: 8%; text-align: center;">GST%</th>
          <th style="width: 10%; text-align: right;">Tax (Rs.)</th>
          <th style="width: 14%; text-align: right;">Total (Rs.)</th>
        </tr>
      </thead>
      <tbody>
        ${itemRowsHtml}
      </tbody>
    </table>

    <!-- Bottom Section: Amount in words, UPI QR, Bank, Totals -->
    <div class="gst-doc-bottom">
      <div style="display: flex; flex-direction: column; gap: 0.65rem;">
        <div style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 0.5rem 0.75rem; background: ${themeLight};">
          <div style="font-size: 0.68rem; font-weight: 800; color: #64748b; text-transform: uppercase;">Total Amount in Words</div>
          <div style="font-size: 0.78rem; font-weight: 700; color: #0f172a; margin-top: 0.15rem;">${escapeHtml(amountInWords)}</div>
        </div>

        <div class="gst-doc-bank-box">
          <div id="gst-paper-qr-box" class="gst-doc-qr"></div>
          <div style="font-size: 0.72rem; color: #475569; line-height: 1.45;">
            <div style="font-weight: 700; color: #0f172a; margin-bottom: 0.2rem;">🏦 Bank & UPI Details</div>
            ${bankName ? `<div><strong>Bank:</strong> ${escapeHtml(bankName)}</div>` : ''}
            ${bankAcc ? `<div><strong>A/C:</strong> <span style="font-family: monospace;">${escapeHtml(bankAcc)}</span></div>` : ''}
            ${bankIfsc ? `<div><strong>IFSC:</strong> <span style="font-family: monospace;">${escapeHtml(bankIfsc)}</span></div>` : ''}
            ${upiId ? `<div style="margin-top: 0.15rem; color: ${themePrimary}; font-weight: 700;"><strong>UPI ID:</strong> ${escapeHtml(upiId)}</div>` : ''}
          </div>
        </div>

        <div style="font-size: 0.68rem; color: #94a3b8; line-height: 1.35; padding-left: 0.2rem;">
          Terms: Subject to ${escapeHtml(sellerState)} jurisdiction. Goods / services once invoiced are subject to agreement terms.
        </div>
      </div>

      <div>
        <div class="gst-doc-totals-box">
          <div class="gst-doc-total-row">
            <span style="color: #64748b;">Taxable Value:</span>
            <span style="font-weight: 600;">Rs. ${subtotal.toFixed(2)}</span>
          </div>
          ${!isInterState ? `
            <div class="gst-doc-total-row">
              <span style="color: #64748b;">Central GST (CGST):</span>
              <span style="font-weight: 600;">Rs. ${cgstTotal.toFixed(2)}</span>
            </div>
            <div class="gst-doc-total-row">
              <span style="color: #64748b;">State GST (SGST):</span>
              <span style="font-weight: 600;">Rs. ${sgstTotal.toFixed(2)}</span>
            </div>
          ` : `
            <div class="gst-doc-total-row">
              <span style="color: #64748b;">Integrated GST (IGST):</span>
              <span style="font-weight: 600;">Rs. ${igstTotal.toFixed(2)}</span>
            </div>
          `}
          ${roundOff !== 0 ? `
            <div class="gst-doc-total-row" style="font-size: 0.7rem; color: #94a3b8;">
              <span>Round Off:</span>
              <span>${roundOff > 0 ? '+' : ''}${roundOff.toFixed(2)}</span>
            </div>
          ` : ''}
          <div class="gst-doc-total-row gst-doc-grand-total">
            <span style="color: ${themePrimary};">Invoice Total:</span>
            <span style="color: ${themePrimary}; font-size: 1.05rem;">Rs. ${grandTotal.toFixed(2)}</span>
          </div>
        </div>

        <div style="margin-top: 1.25rem; text-align: right; padding-right: 0.5rem;">
          <div style="font-size: 0.72rem; color: #64748b;">For <strong>${escapeHtml(sellerName)}</strong></div>
          <div style="height: 38px;"></div>
          <div style="border-top: 1px dashed #cbd5e1; display: inline-block; padding-top: 0.25rem; font-size: 0.72rem; font-weight: 700; color: #334155;">
            Authorized Signatory
          </div>
        </div>
      </div>
    </div>
  `;

  // Render dynamic UPI QR code
  const qrBox = document.getElementById('gst-paper-qr-box');
  if (qrBox) {
    qrBox.innerHTML = '';
    if (upiId && grandTotal > 0 && typeof QRCode !== 'undefined') {
      try {
        const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(sellerName)}&am=${grandTotal.toFixed(2)}&cu=INR&tn=${encodeURIComponent(invNumber)}`;
        new QRCode(qrBox, {
          text: upiUri,
          width: 66,
          height: 66,
          colorDark: '#0f172a',
          colorLight: '#ffffff',
          correctLevel: QRCode.CorrectLevel?.M || 0
        });
      } catch (qrErr) {
        qrBox.innerHTML = `<span style="font-size: 0.6rem; color: #94a3b8; text-align: center;">UPI QR</span>`;
      }
    } else {
      qrBox.innerHTML = `<span style="font-size: 0.6rem; color: #94a3b8; text-align: center;">UPI QR</span>`;
    }
  }
}

/**
 * Submits the current invoice to the worker pipeline to generate a crisp vector PDF.
 */
export async function generateAndDownloadGstInvoicePdf({ startProgress, onJobSubmitted, onError }) {
  const sellerName = document.getElementById('gst-seller-name')?.value || 'Acme Technologies Pvt Ltd';
  const sellerGstin = document.getElementById('gst-seller-gstin')?.value || '';
  const sellerAddress = document.getElementById('gst-seller-address')?.value || '';
  const sellerState = document.getElementById('gst-seller-state')?.value || 'Delhi';
  const sellerCode = document.getElementById('gst-seller-code')?.value || '07';
  const sellerPhone = document.getElementById('gst-seller-phone')?.value || '';
  const sellerPan = document.getElementById('gst-seller-pan')?.value || '';

  const buyerName = document.getElementById('gst-buyer-name')?.value || 'Apex Retailers LLP';
  const buyerGstin = document.getElementById('gst-buyer-gstin')?.value || '';
  const buyerAddress = document.getElementById('gst-buyer-address')?.value || '';
  const buyerState = document.getElementById('gst-buyer-state')?.value || 'Delhi';
  const buyerCode = document.getElementById('gst-buyer-code')?.value || '07';

  const invNumber = document.getElementById('gst-inv-number')?.value || 'INV-2026-001';
  const invDate = document.getElementById('gst-inv-date')?.value || new Date().toISOString().split('T')[0];
  const taxType = document.getElementById('gst-tax-type')?.value || 'auto';
  const theme = document.getElementById('gst-theme-select')?.value || 'modern';

  const upiId = document.getElementById('gst-upi-id')?.value || '';
  const bankName = document.getElementById('gst-bank-name')?.value || '';
  const bankAcc = document.getElementById('gst-bank-acc')?.value || '';
  const bankIfsc = document.getElementById('gst-bank-ifsc')?.value || '';

  const options = {
    seller: {
      name: sellerName,
      gstin: sellerGstin,
      address: sellerAddress,
      state: sellerState,
      stateCode: sellerCode,
      phone: sellerPhone,
      pan: sellerPan
    },
    buyer: {
      name: buyerName,
      gstin: buyerGstin,
      address: buyerAddress,
      state: buyerState,
      stateCode: buyerCode
    },
    invoiceNumber: invNumber,
    invoiceDate: invDate,
    taxType: taxType,
    theme: theme,
    currency: 'INR',
    upiId: upiId,
    bankDetails: {
      bankName: bankName,
      accountNumber: bankAcc,
      ifscCode: bankIfsc
    },
    items: gstItems.map(it => ({
      description: it.description || 'Service',
      hsn: it.hsn || '9983',
      quantity: Number(it.quantity) || 1,
      rate: Number(it.rate) || 0,
      gstRate: Number(it.gstRate) || 18
    }))
  };

  const gstStudio = document.getElementById('gst-invoice-studio');
  if (gstStudio) gstStudio.style.display = 'none';

  const progContainer = document.getElementById('progress-container');
  if (progContainer) progContainer.style.display = 'block';

  if (typeof startProgress === 'function') {
    startProgress('gst-invoice-pdf');
  }

  try {
    const res = await fetch('/api/v1/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operation: 'gst-invoice-pdf',
        files: [],
        options: options
      })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || 'Failed to submit GST invoice job.');
    }

    if (typeof onJobSubmitted === 'function') {
      onJobSubmitted(data.jobId);
    }
  } catch (err) {
    if (typeof onError === 'function') {
      onError(err);
    } else {
      alert(`Error generating invoice: ${err.message}`);
      if (gstStudio) gstStudio.style.display = 'block';
      if (progContainer) progContainer.style.display = 'none';
    }
  }
}

/**
 * Triggers standard browser print dialog for the invoice preview paper.
 */
export function printGstInvoicePreview() {
  window.print();
}

// CommonJS fallback
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    gstItems,
    initGstInvoiceStudio,
    renderGstItemsTable,
    onGstItemChange,
    addGstItemRow,
    deleteGstItemRow,
    numberToWordsClient,
    updateGstInvoicePreview,
    generateAndDownloadGstInvoicePdf,
    printGstInvoicePreview
  };
}
