/**
 * @file modules/pos-studio.js
 * @description Dedicated Minimal POS Billing & Thermal Slip Studio Controller for DocPlatform.
 * Provides split-screen live thermal slip preview, rapid item additions, discount/tax calculations,
 * and direct vector PDF & browser print outputs.
 */

import { escapeHtml } from './utils.js';

export let posItems = [
  { id: 1, name: 'Espresso Double Shot', qty: 2, rate: 120 },
  { id: 2, name: 'Artisan Sourdough Toast', qty: 1, rate: 180 },
  { id: 3, name: 'Mineral Water 500ml', qty: 1, rate: 40 }
];

let nextPosItemId = 4;

export function initPosStudio() {
  const dtInput = document.getElementById('pos-datetime');
  if (dtInput && !dtInput.value) {
    const now = new Date();
    dtInput.value = now.toISOString().slice(0, 16);
  }
  const ordInput = document.getElementById('pos-order-num');
  if (ordInput && !ordInput.value) {
    ordInput.value = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
  }
  renderPosItemsTable();
  updatePosReceiptPreview();
}

export function renderPosItemsTable() {
  const tbody = document.getElementById('pos-items-tbody');
  if (!tbody) return;

  tbody.innerHTML = posItems.map(item => `
    <tr data-pos-item-id="${item.id}">
      <td>
        <input type="text" class="gst-input" value="${escapeHtml(item.name)}"
               oninput="window.onPosItemChange(${item.id}, 'name', this.value)"
               placeholder="Item name / SKU" style="font-size: 0.8rem; padding: 0.35rem 0.5rem;" />
      </td>
      <td>
        <input type="number" min="1" step="1" class="gst-input" value="${item.qty}"
               oninput="window.onPosItemChange(${item.id}, 'qty', parseFloat(this.value) || 0)"
               style="font-size: 0.8rem; padding: 0.35rem 0.4rem; text-align: center;" />
      </td>
      <td>
        <input type="number" min="0" step="any" class="gst-input" value="${item.rate}"
               oninput="window.onPosItemChange(${item.id}, 'rate', parseFloat(this.value) || 0)"
               placeholder="0.00" style="font-size: 0.8rem; padding: 0.35rem 0.5rem; text-align: right;" />
      </td>
      <td style="text-align: right; font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; padding-right: 0.5rem;">
        ₹${((Number(item.qty) || 1) * (Number(item.rate) || 0)).toFixed(2)}
      </td>
      <td style="text-align: center;">
        <button type="button" class="gst-del-btn" onclick="window.deletePosItemRow(${item.id})"
                title="Remove Item" aria-label="Remove Item">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      </td>
    </tr>
  `).join('');
}

export function addPosItemRow() {
  posItems.push({
    id: nextPosItemId++,
    name: 'Counter Item',
    qty: 1,
    rate: 50
  });
  renderPosItemsTable();
  updatePosReceiptPreview();
}

export function deletePosItemRow(id) {
  if (posItems.length <= 1) {
    alert('At least one item is required on the bill.');
    return;
  }
  posItems = posItems.filter(i => i.id !== id);
  renderPosItemsTable();
  updatePosReceiptPreview();
}

export function onPosItemChange(id, field, value) {
  const it = posItems.find(i => i.id === id);
  if (it) {
    it[field] = value;
    // Update line total column without rebuilding the entire table
    const row = document.querySelector(`tr[data-pos-item-id="${id}"]`);
    if (row) {
      const amtCell = row.cells[3];
      if (amtCell) {
        amtCell.textContent = `₹${((Number(it.qty) || 1) * (Number(it.rate) || 0)).toFixed(2)}`;
      }
    }
    updatePosReceiptPreview();
  }
}

export function updatePosReceiptPreview() {
  const preview = document.getElementById('pos-receipt-preview-content');
  if (!preview) return;

  const storeName = document.getElementById('pos-store-name')?.value || 'QUICK BITES & RETAIL';
  const tagline = document.getElementById('pos-tagline')?.value || 'Fast Counter Checkout';
  const address = document.getElementById('pos-address')?.value || 'Shop 12, Ground Floor, Central Plaza';
  const phone = document.getElementById('pos-phone')?.value || '+91 98765 43210';
  const orderNum = document.getElementById('pos-order-num')?.value || 'ORD-1042';
  const dtVal = document.getElementById('pos-datetime')?.value;
  const dtFormatted = dtVal ? new Date(dtVal).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : new Date().toLocaleString('en-IN');
  const cashier = document.getElementById('pos-cashier')?.value || 'Counter 01';
  const discountPct = parseFloat(document.getElementById('pos-discount')?.value) || 0;
  const taxPct = parseFloat(document.getElementById('pos-tax')?.value) || 0;
  const paymentMode = document.getElementById('pos-payment-mode')?.value || 'Cash';
  const upiId = document.getElementById('pos-upi-id')?.value || '';
  const footerMsg = document.getElementById('pos-footer-msg')?.value || 'Thank You! Visit Again.';

  let subtotal = 0;
  let totalQty = 0;
  posItems.forEach(i => {
    const q = Number(i.qty) || 1;
    const r = Number(i.rate) || 0;
    subtotal += q * r;
    totalQty += q;
  });

  const discAmt = (subtotal * discountPct) / 100;
  const taxable = Math.max(0, subtotal - discAmt);
  const taxAmt = (taxable * taxPct) / 100;
  const grandTotal = taxable + taxAmt;

  // Generate UPI QR preview if UPI ID provided
  let upiQrHtml = '';
  if (upiId && upiId.trim()) {
    const qrData = encodeURIComponent(`upi://pay?pa=${encodeURIComponent(upiId.trim())}&pn=${encodeURIComponent(storeName)}&am=${grandTotal.toFixed(2)}&cu=INR`);
    upiQrHtml = `
      <div style="margin: 12px 0 6px; text-align: center;">
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${qrData}" 
             alt="UPI QR" style="width: 80px; height: 80px; display: inline-block; border: 1px solid #ddd; padding: 3px; background: #fff;" />
        <div style="font-size: 8px; font-weight: bold; margin-top: 4px; letter-spacing: 0.5px;">SCAN & PAY VIA UPI</div>
      </div>
    `;
  }

  preview.innerHTML = `
    <div style="text-align: center; font-family: 'JetBrains Mono', Courier, monospace; color: #111;">
      <div style="font-size: 14px; font-weight: 800; letter-spacing: 0.5px;">${escapeHtml(storeName.toUpperCase())}</div>
      ${tagline ? `<div style="font-size: 9px; color: #555; margin-top: 2px;">${escapeHtml(tagline)}</div>` : ''}
      ${address ? `<div style="font-size: 8.5px; color: #555; margin-top: 2px;">${escapeHtml(address)}</div>` : ''}
      ${phone ? `<div style="font-size: 8.5px; color: #555;">Ph: ${escapeHtml(phone)}</div>` : ''}
      
      <div style="border-top: 1px dashed #777; margin: 8px 0;"></div>
      
      <div style="display: flex; justify-content: space-between; font-size: 9.5px; font-weight: bold;">
        <span>TOKEN / BILL: #${escapeHtml(orderNum)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 8.5px; color: #444; margin-top: 2px;">
        <span>Date: ${escapeHtml(dtFormatted)}</span>
        <span>Cashier: ${escapeHtml(cashier)}</span>
      </div>
      
      <div style="border-top: 1px dashed #777; margin: 8px 0 6px;"></div>
      
      <!-- Table Header -->
      <div style="display: grid; grid-template-columns: 2fr 1fr 1fr 1.2fr; font-size: 8.5px; font-weight: bold; text-align: right; margin-bottom: 4px;">
        <span style="text-align: left;">ITEM</span>
        <span>QTY</span>
        <span>RATE</span>
        <span>TOTAL</span>
      </div>
      
      <div style="border-top: 1px dashed #aaa; margin-bottom: 6px;"></div>
      
      <!-- Line Items -->
      ${posItems.map(i => {
        const q = Number(i.qty) || 1;
        const r = Number(i.rate) || 0;
        const tot = q * r;
        return `
          <div style="display: grid; grid-template-columns: 2fr 1fr 1fr 1.2fr; font-size: 9px; text-align: right; margin-bottom: 4px;">
            <span style="text-align: left; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(i.name)}</span>
            <span>${q}</span>
            <span>${r.toFixed(2)}</span>
            <span style="font-weight: 600;">₹${tot.toFixed(2)}</span>
          </div>
        `;
      }).join('')}
      
      <div style="border-top: 1px dashed #777; margin: 8px 0;"></div>
      
      <!-- Calculations -->
      <div style="font-size: 9px; text-align: right; line-height: 1.5;">
        <div style="display: flex; justify-content: space-between;">
          <span>Subtotal (${totalQty} items):</span>
          <span>₹${subtotal.toFixed(2)}</span>
        </div>
        ${discountPct > 0 ? `
          <div style="display: flex; justify-content: space-between; color: #c00;">
            <span>Discount (${discountPct}%):</span>
            <span>- ₹${discAmt.toFixed(2)}</span>
          </div>
        ` : ''}
        ${taxPct > 0 ? `
          <div style="display: flex; justify-content: space-between;">
            <span>Tax / GST (${taxPct}%):</span>
            <span>+ ₹${taxAmt.toFixed(2)}</span>
          </div>
        ` : ''}
      </div>
      
      <!-- Grand Total Highlight -->
      <div style="background: #111; color: #fff; padding: 5px 8px; margin: 6px 0; display: flex; justify-content: space-between; font-size: 11px; font-weight: 800;">
        <span>GRAND TOTAL:</span>
        <span>₹${grandTotal.toFixed(2)}</span>
      </div>
      
      <div style="display: flex; justify-content: space-between; font-size: 8.5px; color: #444; margin-top: 4px;">
        <span>Payment Mode:</span>
        <span style="font-weight: bold;">${escapeHtml(paymentMode)}</span>
      </div>
      
      ${upiQrHtml}
      
      <div style="border-top: 1px dashed #777; margin: 8px 0 6px;"></div>
      
      <div style="font-size: 9px; font-weight: bold; margin-bottom: 2px;">${escapeHtml(footerMsg)}</div>
      <div style="font-size: 7.5px; color: #666;">DocPlatform Local POS Engine</div>
      <div style="font-size: 7px; color: #999; margin-top: 4px;">- - - - - [CUT HERE] - - - - -</div>
    </div>
  `;
}

export async function generatePosReceiptPdf(callbacks = {}) {
  const { startProgress, onJobSubmitted, onError } = callbacks;

  const storeName = document.getElementById('pos-store-name')?.value || 'QUICK BITES & RETAIL';
  const tagline = document.getElementById('pos-tagline')?.value || '';
  const address = document.getElementById('pos-address')?.value || '';
  const phone = document.getElementById('pos-phone')?.value || '';
  const orderNum = document.getElementById('pos-order-num')?.value || `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
  const dtVal = document.getElementById('pos-datetime')?.value;
  const cashier = document.getElementById('pos-cashier')?.value || 'Counter 01';
  const discountPct = parseFloat(document.getElementById('pos-discount')?.value) || 0;
  const taxPct = parseFloat(document.getElementById('pos-tax')?.value) || 0;
  const paymentMethod = document.getElementById('pos-payment-mode')?.value || 'Cash';
  const upiId = document.getElementById('pos-upi-id')?.value || '';
  const footerMessage = document.getElementById('pos-footer-msg')?.value || 'Thank You! Visit Again.';

  const options = {
    storeName,
    tagline,
    address,
    phone,
    orderNumber: orderNum,
    dateTime: dtVal ? new Date(dtVal).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : new Date().toLocaleString('en-IN'),
    cashier,
    discountPct,
    taxPct,
    paymentMethod,
    upiId,
    footerMessage,
    items: posItems.map(i => ({
      name: i.name,
      qty: Number(i.qty) || 1,
      rate: Number(i.rate) || 0
    }))
  };

  const posStudio = document.getElementById('pos-billing-studio');
  if (posStudio) posStudio.style.display = 'none';

  const progContainer = document.getElementById('progress-container');
  if (progContainer) progContainer.style.display = 'block';

  if (typeof startProgress === 'function') {
    startProgress('pos-billing');
  }

  try {
    const res = await fetch('/api/v1/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operation: 'pos-billing',
        files: [],
        options
      })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || 'Failed to submit POS receipt job.');
    }

    if (typeof onJobSubmitted === 'function') {
      onJobSubmitted(data.jobId);
    }
  } catch (err) {
    if (typeof onError === 'function') {
      onError(err);
    } else {
      alert(`Error generating POS receipt: ${err.message}`);
      if (posStudio) posStudio.style.display = 'block';
      if (progContainer) progContainer.style.display = 'none';
    }
  }
}

export function setPosStudioView(mode) {
  const formPanel = document.getElementById('pos-form-panel');
  const previewPanel = document.getElementById('pos-preview-panel');
  const container = document.getElementById('pos-studio-container');
  const tabs = ['form', 'preview', 'split'];

  tabs.forEach(t => {
    const btn = document.getElementById(`pos-tab-${t}`);
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
    updatePosReceiptPreview();
  } else {
    formPanel.style.display = 'block';
    previewPanel.style.display = 'block';
    container.style.gridTemplateColumns = '';
    updatePosReceiptPreview();
  }
}

// Attach to window for inline onclick/oninput handlers
if (typeof window !== 'undefined') {
  window.initPosStudio = initPosStudio;
  window.renderPosItemsTable = renderPosItemsTable;
  window.addPosItemRow = addPosItemRow;
  window.deletePosItemRow = deletePosItemRow;
  window.onPosItemChange = onPosItemChange;
  window.updatePosReceiptPreview = updatePosReceiptPreview;
  window.generatePosReceiptPdf = generatePosReceiptPdf;
  window.setPosStudioView = setPosStudioView;
}
