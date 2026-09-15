/**
 * DocPlatform GST Tax Invoice Studio Controller
 * Handles authentic Indian GST Tax Invoice creation compliant with Rule 46 of CGST Rules, 2017:
 *  - Formal ruled ledger box-in-box structure with outer border
 *  - Real-time Intra-state (CGST + SGST) vs Inter-state (IGST) tax engine
 *  - Mandatory HSN/SAC Tax Summary Table calculation
 *  - Amount in words (Crores/Lakhs/Thousands)
 *  - Dynamic NPCI UPI QR code generation
 *  - Multi-line item descriptions & right-aligned currency with Indian comma format
 *  - Export to vector PDF worker pipeline & browser print engine
 */

import { escapeHtml } from './utils.js';

export let gstItems = [
  { id: 1, description: 'Enterprise Cloud Architecture & Consulting', hsn: '998313', quantity: 1, rate: 45000, gstRate: 18 },
  { id: 2, description: 'Secure Document Pipeline Implementation', hsn: '998314', quantity: 2, rate: 12500, gstRate: 18 }
];

let nextGstItemId = 3;

/**
 * Formats a number with Indian currency grouping (lakhs & crores).
 */
export function formatInrClient(val) {
  const num = Number(val) || 0;
  const parts = Math.abs(num).toFixed(2).split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1];

  let lastThree = integerPart.substring(integerPart.length - 3);
  const otherNumbers = integerPart.substring(0, integerPart.length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const formattedInt = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
  const sign = num < 0 ? '-' : '';
  return `${sign}${formattedInt}.${decimalPart}`;
}

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
 * Renders the interactive items input table in the editor panel.
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
        <button type="button" class="gst-del-btn" onclick="window.deleteGstItemRow(${item.id})" 
                title="Remove Item" aria-label="Remove Item">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
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
 * Recalculates all taxes and updates the live A4 preview DOM paper
 * with the authentic Indian GST Tax Invoice format.
 */
export function updateGstInvoicePreview() {
  const paper = document.getElementById('gst-paper');
  if (!paper) return;

  const sellerName = document.getElementById('gst-seller-name')?.value || 'Acme Technologies Pvt Ltd';
  const sellerGstin = document.getElementById('gst-seller-gstin')?.value || '07AAAAA0000A1Z5';
  const sellerAddress = document.getElementById('gst-seller-address')?.value || 'Plot 42, Okhla Phase 3, New Delhi - 110020';
  const sellerState = document.getElementById('gst-seller-state')?.value || 'Delhi';
  const sellerCode = document.getElementById('gst-seller-code')?.value || '07';
  const sellerPhone = document.getElementById('gst-seller-phone')?.value || '+91 98765 43210';
  const sellerPan = document.getElementById('gst-seller-pan')?.value || 'AAAAA0000A';

  const buyerName = document.getElementById('gst-buyer-name')?.value || 'Apex Retailers LLP';
  const buyerGstin = document.getElementById('gst-buyer-gstin')?.value || '07BBBBB1111B1Z2';
  const buyerAddress = document.getElementById('gst-buyer-address')?.value || 'Connaught Place, Central Delhi, Delhi - 110001';
  const buyerState = document.getElementById('gst-buyer-state')?.value || 'Delhi';
  const buyerCode = document.getElementById('gst-buyer-code')?.value || '07';

  const invNumber = document.getElementById('gst-inv-number')?.value || 'INV-2026-001';
  const invDate = document.getElementById('gst-inv-date')?.value || new Date().toISOString().split('T')[0];
  const taxTypeMode = document.getElementById('gst-tax-type')?.value || 'auto';

  const upiId = document.getElementById('gst-upi-id')?.value || 'acmetech@hdfcbar';
  const bankName = document.getElementById('gst-bank-name')?.value || 'HDFC Bank';
  const bankAcc = document.getElementById('gst-bank-acc')?.value || '50200012345678';
  const bankIfsc = document.getElementById('gst-bank-ifsc')?.value || 'HDFC0000123';

  // Determine inter vs intra state
  let isInterState = false;
  if (taxTypeMode === 'inter') {
    isInterState = true;
  } else if (taxTypeMode === 'intra') {
    isInterState = false;
  } else {
    isInterState = (sellerState.toLowerCase().trim() !== buyerState.toLowerCase().trim());
  }

  // Update Tax badge in the UI
  const taxBadge = document.getElementById('gst-preview-tax-badge');
  if (taxBadge) {
    taxBadge.textContent = isInterState ? 'Inter-State (100% IGST)' : 'Intra-State (CGST 50% + SGST 50%)';
  }

  // Calculate totals and populate HSN summary map
  let subtotal = 0;
  let totalQty = 0;
  let cgstTotal = 0;
  let sgstTotal = 0;
  let igstTotal = 0;

  const hsnSummaryMap = new Map();

  const itemRowsHtml = gstItems.map((item, idx) => {
    const qty = Number(item.quantity) || 0;
    const rate = Number(item.rate) || 0;
    const itemTotal = qty * rate;
    const gstPct = Number(item.gstRate) || 0;
    const hsn = item.hsn || '9983';
    
    subtotal += itemTotal;
    totalQty += qty;

    let cgstAmt = 0;
    let sgstAmt = 0;
    let igstAmt = 0;

    if (isInterState) {
      igstAmt = itemTotal * (gstPct / 100);
      igstTotal += igstAmt;
    } else {
      cgstAmt = itemTotal * (gstPct / 200);
      sgstAmt = itemTotal * (gstPct / 200);
      cgstTotal += cgstAmt;
      sgstTotal += sgstAmt;
    }

    const lineGross = itemTotal + (isInterState ? igstAmt : (cgstAmt + sgstAmt));

    // Aggregate into HSN summary map
    const hsnKey = `${hsn}_${gstPct}`;
    const existing = hsnSummaryMap.get(hsnKey) || {
      hsn,
      taxable: 0,
      gstPct,
      cgst: 0,
      sgst: 0,
      igst: 0
    };
    existing.taxable += itemTotal;
    existing.cgst += cgstAmt;
    existing.sgst += sgstAmt;
    existing.igst += igstAmt;
    hsnSummaryMap.set(hsnKey, existing);

    if (isInterState) {
      return `
        <tr>
          <td style="text-align: center; color: #475569; font-weight: 600; width: 5%;">${idx + 1}</td>
          <td style="font-weight: 700; color: #0f172a; word-break: break-word; width: 32%; font-size: 0.68rem;">${escapeHtml(item.description || 'Service / Product')}</td>
          <td style="text-align: center; font-family: monospace; font-size: 0.65rem; width: 10%;">${escapeHtml(hsn)}</td>
          <td style="text-align: center; font-variant-numeric: tabular-nums; width: 6%;">${qty}</td>
          <td style="text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; width: 12%; font-size: 0.65rem;">₹${formatInrClient(rate)}</td>
          <td style="text-align: right; font-weight: 600; font-variant-numeric: tabular-nums; white-space: nowrap; width: 13%; font-size: 0.65rem;">₹${formatInrClient(itemTotal)}</td>
          <td style="text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; width: 11%; font-size: 0.62rem;">₹${formatInrClient(igstAmt)} <span style="font-size: 0.56rem; color: #64748b;">(${gstPct}%)</span></td>
          <td style="text-align: right; font-weight: 700; font-variant-numeric: tabular-nums; white-space: nowrap; width: 11%; color: #0f172a; font-size: 0.65rem;">₹${formatInrClient(lineGross)}</td>
        </tr>
      `;
    } else {
      return `
        <tr>
          <td style="text-align: center; color: #475569; font-weight: 600; width: 4%;">${idx + 1}</td>
          <td style="font-weight: 700; color: #0f172a; word-break: break-word; width: 27%; font-size: 0.68rem;">${escapeHtml(item.description || 'Service / Product')}</td>
          <td style="text-align: center; font-family: monospace; font-size: 0.65rem; width: 9%;">${escapeHtml(hsn)}</td>
          <td style="text-align: center; font-variant-numeric: tabular-nums; width: 5%;">${qty}</td>
          <td style="text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; width: 11%; font-size: 0.65rem;">₹${formatInrClient(rate)}</td>
          <td style="text-align: right; font-weight: 600; font-variant-numeric: tabular-nums; white-space: nowrap; width: 12%; font-size: 0.65rem;">₹${formatInrClient(itemTotal)}</td>
          <td style="text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; width: 11%; font-size: 0.62rem;">₹${formatInrClient(cgstAmt)} <span style="font-size: 0.56rem; color: #64748b;">(${gstPct / 2}%)</span></td>
          <td style="text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; width: 11%; font-size: 0.62rem;">₹${formatInrClient(sgstAmt)} <span style="font-size: 0.56rem; color: #64748b;">(${gstPct / 2}%)</span></td>
          <td style="text-align: right; font-weight: 700; font-variant-numeric: tabular-nums; white-space: nowrap; width: 10%; color: #0f172a; font-size: 0.65rem;">₹${formatInrClient(lineGross)}</td>
        </tr>
      `;
    }
  }).join('');

  const totalTax = isInterState ? igstTotal : (cgstTotal + sgstTotal);
  const rawTotal = subtotal + totalTax;
  const grandTotal = Math.round(rawTotal);
  const roundOff = Math.round((grandTotal - rawTotal) * 100) / 100;
  const amountInWords = numberToWordsClient(grandTotal);

  // Generate HSN Tax Summary Table Rows
  const hsnRowsHtml = Array.from(hsnSummaryMap.values()).map(h => {
    if (isInterState) {
      return `
        <tr>
          <td style="text-align: center; font-family: monospace; font-weight: 600;">${escapeHtml(h.hsn)}</td>
          <td style="text-align: right; font-variant-numeric: tabular-nums;">₹ ${formatInrClient(h.taxable)}</td>
          <td style="text-align: right; font-variant-numeric: tabular-nums;">${h.gstPct}% : ₹ ${formatInrClient(h.igst)}</td>
          <td style="text-align: right; font-weight: 700; font-variant-numeric: tabular-nums;">₹ ${formatInrClient(h.igst)}</td>
        </tr>
      `;
    } else {
      const halfRate = h.gstPct / 2;
      return `
        <tr>
          <td style="text-align: center; font-family: monospace; font-weight: 600;">${escapeHtml(h.hsn)}</td>
          <td style="text-align: right; font-variant-numeric: tabular-nums;">₹ ${formatInrClient(h.taxable)}</td>
          <td style="text-align: right; font-variant-numeric: tabular-nums;">${halfRate}% : ₹ ${formatInrClient(h.cgst)}</td>
          <td style="text-align: right; font-variant-numeric: tabular-nums;">${halfRate}% : ₹ ${formatInrClient(h.sgst)}</td>
          <td style="text-align: right; font-weight: 700; font-variant-numeric: tabular-nums;">₹ ${formatInrClient(h.cgst + h.sgst)}</td>
        </tr>
      `;
    }
  }).join('');

  // Authentic Indian GST Tax Invoice Markup (Box-in-Box Ruled Structure)
  paper.innerHTML = `
    <div class="gst-doc-ledger-box">
      <!-- 1. Statutory Header Bar (Rule 46 CGST Rules, 2017) -->
      <div class="gst-doc-stat-header">
        <div style="flex: 1; text-align: center;">
          <div style="font-size: 1rem; font-weight: 800; letter-spacing: 0.08em; color: #0f172a;">TAX INVOICE</div>
          <div style="font-size: 0.58rem; font-style: italic; color: #64748b; margin-top: 0.1rem;">
            (Issued under Section 31 of CGST Act, 2017 read with Rule 46 of CGST Rules, 2017)
          </div>
        </div>
        <div class="gst-doc-copy-tag">Original for Recipient</div>
      </div>

      <!-- 2. Seller / Supplier Details Banner -->
      <div class="gst-doc-seller-block">
        <div style="font-size: 1rem; font-weight: 800; color: #0f172a; letter-spacing: -0.01em;">
          ${escapeHtml(sellerName.toUpperCase())}
        </div>
        <div style="font-size: 0.68rem; color: #334155; margin-top: 0.15rem;">
          ${escapeHtml(sellerAddress)}
        </div>
        <div style="font-size: 0.68rem; font-weight: 700; color: #0f172a; margin-top: 0.2rem; word-break: break-word;">
          GSTIN: <span style="font-family: monospace;">${escapeHtml(sellerGstin)}</span>
          ${sellerPan ? ` &nbsp;|&nbsp; PAN: <span style="font-family: monospace;">${escapeHtml(sellerPan)}</span>` : ''}
          &nbsp;|&nbsp; State: <span>${escapeHtml(sellerState)} (${escapeHtml(sellerCode)})</span>
        </div>
        ${(sellerPhone || sellerPan) ? `
          <div style="font-size: 0.64rem; color: #64748b; margin-top: 0.1rem;">
            ${sellerPhone ? `Ph: ${escapeHtml(sellerPhone)} &nbsp;&nbsp;` : ''}
          </div>
        ` : ''}
      </div>

      <!-- 3. Invoice Meta 4-Quadrant Ruled Grid -->
      <div class="gst-doc-meta-table">
        <div class="gst-doc-meta-col">
          <div class="gst-doc-meta-row"><span>Invoice No:</span> <strong>${escapeHtml(invNumber)}</strong></div>
          <div class="gst-doc-meta-row"><span>Invoice Date:</span> <span>${escapeHtml(invDate)}</span></div>
          <div class="gst-doc-meta-row"><span>State / Code:</span> <span>${escapeHtml(sellerState)} (${escapeHtml(sellerCode)})</span></div>
          <div class="gst-doc-meta-row"><span>Reverse Charge:</span> <span>No</span></div>
        </div>
        <div class="gst-doc-meta-col">
          <div class="gst-doc-meta-row"><span>Place of Supply:</span> <strong>${escapeHtml(buyerState)} (${escapeHtml(buyerCode)})</strong></div>
          <div class="gst-doc-meta-row"><span>Supply Type:</span> <span>${isInterState ? 'Inter-State (IGST 100%)' : 'Intra-State (CGST 50% + SGST 50%)'}</span></div>
          <div class="gst-doc-meta-row"><span>Payment Due Date:</span> <span>Net 15 Days / Immediate</span></div>
          <div class="gst-doc-meta-row"><span>Transport / Mode:</span> <span>Direct / Hand Delivery</span></div>
        </div>
      </div>

      <!-- 4. Party Details Grid (Receiver Billed To & Consignee Shipped To) -->
      <div class="gst-doc-party-table">
        <div class="gst-doc-party-box">
          <div class="gst-doc-party-label">Details of Receiver | Billed to:</div>
          <div style="font-weight: 700; font-size: 0.84rem; color: #0f172a;">${escapeHtml(buyerName)}</div>
          <div style="font-size: 0.74rem; color: #475569; margin-top: 0.15rem;">${escapeHtml(buyerAddress || 'Registered Address on file')}</div>
          <div style="font-size: 0.74rem; color: #475569; margin-top: 0.15rem;">State: ${escapeHtml(buyerState)} (Code: ${escapeHtml(buyerCode)})</div>
          <div style="font-size: 0.74rem; font-weight: 700; color: #0f172a; margin-top: 0.25rem;">
            GSTIN / UIN: <span style="font-family: monospace;">${escapeHtml(buyerGstin || 'Consumer / Unregistered')}</span>
          </div>
        </div>
        <div class="gst-doc-party-box">
          <div class="gst-doc-party-label">Details of Consignee | Shipped to:</div>
          <div style="font-weight: 700; font-size: 0.84rem; color: #0f172a;">${escapeHtml(buyerName)}</div>
          <div style="font-size: 0.74rem; color: #475569; margin-top: 0.15rem;">${escapeHtml(buyerAddress || 'Same as Billed Address')}</div>
          <div style="font-size: 0.74rem; color: #475569; margin-top: 0.15rem;">State: ${escapeHtml(buyerState)} (Code: ${escapeHtml(buyerCode)})</div>
          <div style="font-size: 0.74rem; font-weight: 700; color: #0f172a; margin-top: 0.25rem;">
            GSTIN / UIN: <span style="font-family: monospace;">${escapeHtml(buyerGstin || 'Consumer / Unregistered')}</span>
          </div>
        </div>
      </div>

      <!-- 5. Main Itemized Goods & Services Table (With Vertical Divider Lines) -->
      <div class="gst-doc-table-scroll">
        <table class="gst-doc-table">
          <thead>
            <tr>
              <th style="width: 5%; text-align: center;">S.N.</th>
              <th style="width: ${isInterState ? '32%' : '27%'}; text-align: left;">Description of Goods / Services</th>
              <th style="width: ${isInterState ? '10%' : '9%'}; text-align: center;">HSN/SAC</th>
              <th style="width: ${isInterState ? '6%' : '5%'}; text-align: center;">Qty</th>
              <th style="width: ${isInterState ? '12%' : '11%'}; text-align: right;">Rate (₹)</th>
              <th style="width: ${isInterState ? '13%' : '12%'}; text-align: right;">Taxable (₹)</th>
              ${isInterState ? `
                <th style="width: 11%; text-align: right;">IGST (₹)</th>
              ` : `
                <th style="width: 11%; text-align: right;">CGST (₹)</th>
                <th style="width: 11%; text-align: right;">SGST (₹)</th>
              `}
              <th style="width: ${isInterState ? '11%' : '10%'}; text-align: right;">Total (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${itemRowsHtml}
            <!-- Subtotal Row -->
            <tr style="background: #f8fafc; font-weight: 700; border-top: 2px solid #cbd5e1; font-size: 0.65rem;">
              <td colspan="2" style="text-align: left; padding-left: 0.5rem; color: #0f172a;">Total Items & Values</td>
              <td style="text-align: center;">-</td>
              <td style="text-align: center;">${totalQty}</td>
              <td style="text-align: right;">-</td>
              <td style="text-align: right; white-space: nowrap;">₹${formatInrClient(subtotal)}</td>
              ${isInterState ? `
                <td style="text-align: right; white-space: nowrap;">₹${formatInrClient(igstTotal)}</td>
              ` : `
                <td style="text-align: right; white-space: nowrap;">₹${formatInrClient(cgstTotal)}</td>
                <td style="text-align: right; white-space: nowrap;">₹${formatInrClient(sgstTotal)}</td>
              `}
              <td style="text-align: right; white-space: nowrap; color: #0f172a;">₹${formatInrClient(rawTotal)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 6. Mandatory HSN / SAC Tax Summary Table (Rule 46 Compliance) -->
      <div style="margin-bottom: 0.65rem;">
        <div style="font-size: 0.60rem; font-weight: 800; color: #475569; text-transform: uppercase; margin-bottom: 0.2rem; letter-spacing: 0.04em;">
          Tax Summary (HSN / SAC Breakup)
        </div>
        <table class="gst-doc-hsn-table">
          <thead>
            <tr>
              <th style="text-align: center;">HSN / SAC</th>
              <th style="text-align: right;">Taxable Value (₹)</th>
              ${isInterState ? `
                <th style="text-align: right;">Integrated Tax (IGST Rate & Amt)</th>
              ` : `
                <th style="text-align: right;">Central Tax (CGST Rate & Amt)</th>
                <th style="text-align: right;">State Tax (SGST Rate & Amt)</th>
              `}
              <th style="text-align: right;">Total Tax Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${hsnRowsHtml}
            <tr style="background: #f1f5f9; font-weight: 700;">
              <td style="text-align: center;">Tax Summary Total</td>
              <td style="text-align: right;">₹ ${formatInrClient(subtotal)}</td>
              ${isInterState ? `
                <td style="text-align: right;">₹ ${formatInrClient(igstTotal)}</td>
                <td style="text-align: right;">₹ ${formatInrClient(igstTotal)}</td>
              ` : `
                <td style="text-align: right;">₹ ${formatInrClient(cgstTotal)}</td>
                <td style="text-align: right;">₹ ${formatInrClient(sgstTotal)}</td>
                <td style="text-align: right;">₹ ${formatInrClient(cgstTotal + sgstTotal)}</td>
              `}
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 7. Bottom Details: Amount in Words, Bank + QR, Totals, Declaration & Signatory -->
      <div class="gst-doc-bottom-grid">
        <!-- Left Column -->
        <div class="gst-doc-bottom-left">
          <!-- Total Amount in Words -->
          <div class="gst-doc-words-box">
            <div style="font-size: 0.58rem; font-weight: 800; color: #64748b; text-transform: uppercase;">
              Total Invoice Amount in Words
            </div>
            <div style="font-size: 0.70rem; font-weight: 700; color: #0f172a; margin-top: 0.15rem; word-break: break-word;">
              ${escapeHtml(amountInWords)}
            </div>
          </div>

          <!-- Bank & Dynamic UPI QR Box -->
          <div class="gst-doc-bank-qr-box">
            <div style="font-size: 0.66rem; color: #334155; line-height: 1.4; min-width: 0; flex: 1;">
              <div style="font-weight: 800; color: #0f172a; margin-bottom: 0.2rem; font-size: 0.68rem;">
                BANKING & PAYMENT DETAILS
              </div>
              <div><strong>Bank Name:</strong> ${escapeHtml(bankName)}</div>
              <div><strong>A/C Holder:</strong> ${escapeHtml(sellerName)}</div>
              <div><strong>Account No:</strong> <span style="font-family: monospace; font-weight: 700; font-size: 0.62rem;">${escapeHtml(bankAcc)}</span></div>
              <div><strong>IFSC Code:</strong> <span style="font-family: monospace; font-weight: 700; font-size: 0.62rem;">${escapeHtml(bankIfsc)}</span></div>
              ${upiId ? `<div style="margin-top: 0.15rem; color: #0f172a; font-weight: 700;"><strong>UPI ID:</strong> <span style="font-family: monospace; color: #0284c7; font-size: 0.62rem;">${escapeHtml(upiId)}</span></div>` : ''}
            </div>

            <div style="text-align: center; flex-shrink: 0;">
              <div id="gst-paper-qr-box" class="gst-doc-qr"></div>
              <div style="font-size: 0.54rem; font-weight: 700; color: #0f172a; margin-top: 0.15rem;">Scan & Pay via UPI</div>
            </div>
          </div>

          <!-- Declaration & Terms -->
          <div style="font-size: 0.60rem; color: #475569; line-height: 1.35; padding-top: 0.15rem;">
            <div><strong>DECLARATION:</strong> We declare that this invoice shows the actual price of the goods/services described and that all particulars are true and correct.</div>
            <div style="margin-top: 0.15rem; color: #64748b; font-style: italic;">
              Terms: 1. Subject to ${escapeHtml(sellerState)} jurisdiction. 2. Goods/services once invoiced are subject to terms of agreement.
            </div>
          </div>
        </div>

        <!-- Right Column (Financial Calculations & Signatory Box) -->
        <div class="gst-doc-bottom-right">
          <!-- Totals Breakdown -->
          <div class="gst-doc-calc-table">
            <div class="gst-doc-calc-row">
              <span>Taxable Amount:</span>
              <span>₹${formatInrClient(subtotal)}</span>
            </div>
            ${isInterState ? `
              <div class="gst-doc-calc-row">
                <span>Add: IGST:</span>
                <span>₹${formatInrClient(igstTotal)}</span>
              </div>
            ` : `
              <div class="gst-doc-calc-row">
                <span>Add: CGST:</span>
                <span>₹${formatInrClient(cgstTotal)}</span>
              </div>
              <div class="gst-doc-calc-row">
                <span>Add: SGST:</span>
                <span>₹${formatInrClient(sgstTotal)}</span>
              </div>
            `}
            ${roundOff !== 0 ? `
              <div class="gst-doc-calc-row" style="color: #64748b;">
                <span>Round Off:</span>
                <span>${roundOff > 0 ? '+' : ''}₹${formatInrClient(roundOff)}</span>
              </div>
            ` : ''}
            <div class="gst-doc-grand-row">
              <span>TOTAL VALUE:</span>
              <span>₹${formatInrClient(grandTotal)}</span>
            </div>
          </div>

          <!-- Authorized Signatory Box -->
          <div class="gst-doc-signatory-block">
            <div style="font-size: 0.68rem; font-weight: 700; color: #0f172a;">
              For ${escapeHtml(sellerName.toUpperCase())}
            </div>
            <div style="font-size: 0.58rem; font-style: italic; color: #64748b; margin-top: 0.08rem;">
              (Authorized Signatory / Stamp)
            </div>
            <div style="height: 38px;"></div>
            <div style="border-top: 1px solid #94a3b8; padding-top: 0.2rem; font-size: 0.66rem; font-weight: 700; color: #0f172a; text-align: center;">
              Authorised Signatory
            </div>
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
  const sellerGstin = document.getElementById('gst-seller-gstin')?.value || '07AAAAA0000A1Z5';
  const sellerAddress = document.getElementById('gst-seller-address')?.value || 'Plot 42, Okhla Phase 3, New Delhi - 110020';
  const sellerState = document.getElementById('gst-seller-state')?.value || 'Delhi';
  const sellerCode = document.getElementById('gst-seller-code')?.value || '07';
  const sellerPhone = document.getElementById('gst-seller-phone')?.value || '+91 98765 43210';
  const sellerPan = document.getElementById('gst-seller-pan')?.value || 'AAAAA0000A';

  const buyerName = document.getElementById('gst-buyer-name')?.value || 'Apex Retailers LLP';
  const buyerGstin = document.getElementById('gst-buyer-gstin')?.value || '07BBBBB1111B1Z2';
  const buyerAddress = document.getElementById('gst-buyer-address')?.value || 'Connaught Place, Central Delhi, Delhi - 110001';
  const buyerState = document.getElementById('gst-buyer-state')?.value || 'Delhi';
  const buyerCode = document.getElementById('gst-buyer-code')?.value || '07';

  const invNumber = document.getElementById('gst-inv-number')?.value || 'INV-2026-001';
  const invDate = document.getElementById('gst-inv-date')?.value || new Date().toISOString().split('T')[0];
  const taxType = document.getElementById('gst-tax-type')?.value || 'auto';
  const theme = document.getElementById('gst-theme-select')?.value || 'modern';

  const upiId = document.getElementById('gst-upi-id')?.value || 'acmetech@hdfcbar';
  const bankName = document.getElementById('gst-bank-name')?.value || 'HDFC Bank';
  const bankAcc = document.getElementById('gst-bank-acc')?.value || '50200012345678';
  const bankIfsc = document.getElementById('gst-bank-ifsc')?.value || 'HDFC0000123';

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
      ifscCode: bankIfsc,
      upiId: upiId
    },
    items: gstItems.map(it => ({
      description: it.description || 'Service',
      hsn: it.hsn || '9983',
      qty: Number(it.quantity) || 1,
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
 * Switches between Edit Form, Live Preview, and Split View on mobile/tablets.
 */
export function setGstStudioView(mode) {
  const formPanel = document.getElementById('gst-form-panel');
  const previewPanel = document.getElementById('gst-preview-panel');
  const container = document.getElementById('gst-studio-container');
  const tabs = ['form', 'preview', 'split'];
  
  tabs.forEach(t => {
    const btn = document.getElementById(`gst-tab-${t}`);
    if (btn) btn.classList.toggle('active', t === mode);
  });

  if (!container || !formPanel || !previewPanel) return;

  if (mode === 'form') {
    formPanel.style.display = 'block';
    previewPanel.style.display = 'none';
    container.style.gridTemplateColumns = '1fr';
  } else if (mode === 'preview') {
    formPanel.style.display = 'none';
    previewPanel.style.display = 'block';
    container.style.gridTemplateColumns = '1fr';
    updateGstInvoicePreview();
  } else {
    formPanel.style.display = 'block';
    previewPanel.style.display = 'block';
    container.style.gridTemplateColumns = '';
    updateGstInvoicePreview();
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
    formatInrClient,
    updateGstInvoicePreview,
    generateAndDownloadGstInvoicePdf,
    printGstInvoicePreview,
    setGstStudioView
  };
}
