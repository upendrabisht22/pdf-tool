/**
 * @file modules/estimate-studio.js
 * @description Dedicated Project Estimate & Quotation Proposal Studio Controller for DocPlatform.
 * Provides split-screen live proposal preview, deliverable items table, terms & conditions,
 * and direct vector PDF & browser print outputs.
 */

import { escapeHtml } from './utils.js';

export let estimateItems = [
  { id: 1, description: 'Phase 1: Architecture & UI/UX Design System', unit: 'Milestone', qty: 1, rate: 3500 },
  { id: 2, description: 'Phase 2: Core WASM Processing & Pipeline Engine', unit: 'Milestone', qty: 1, rate: 6500 },
  { id: 3, description: 'Phase 3: Security Hardening & Production Deployment', unit: 'Milestone', qty: 1, rate: 2500 }
];

let nextEstimateItemId = 4;

export function initEstimateStudio() {
  const dtInput = document.getElementById('est-date');
  if (dtInput && !dtInput.value) {
    dtInput.value = new Date().toISOString().split('T')[0];
  }
  const valInput = document.getElementById('est-valid-date');
  if (valInput && !valInput.value) {
    const validDate = new Date(Date.now() + 30 * 86400000);
    valInput.value = validDate.toISOString().split('T')[0];
  }
  const estNum = document.getElementById('est-number');
  if (estNum && !estNum.value) {
    estNum.value = `EST-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
  }
  renderEstimateItemsTable();
  updateEstimatePreview();
}

export function renderEstimateItemsTable() {
  const tbody = document.getElementById('est-items-tbody');
  if (!tbody) return;

  tbody.innerHTML = estimateItems.map(item => `
    <tr data-est-item-id="${item.id}">
      <td>
        <input type="text" class="gst-input" value="${escapeHtml(item.description)}"
               oninput="window.onEstimateItemChange(${item.id}, 'description', this.value)"
               placeholder="Deliverable / Service description *" style="font-size: 0.8rem; padding: 0.35rem 0.5rem;" />
      </td>
      <td>
        <input type="text" class="gst-input" value="${escapeHtml(item.unit || 'Item')}"
               oninput="window.onEstimateItemChange(${item.id}, 'unit', this.value)"
               placeholder="Unit (e.g. Hr, Mo)" style="font-size: 0.8rem; padding: 0.35rem 0.4rem; text-align: center;" />
      </td>
      <td>
        <input type="number" min="1" step="1" class="gst-input" value="${item.qty}"
               oninput="window.onEstimateItemChange(${item.id}, 'qty', parseFloat(this.value) || 0)"
               style="font-size: 0.8rem; padding: 0.35rem 0.4rem; text-align: center;" />
      </td>
      <td>
        <input type="number" min="0" step="any" class="gst-input" value="${item.rate}"
               oninput="window.onEstimateItemChange(${item.id}, 'rate', parseFloat(this.value) || 0)"
               placeholder="0.00" style="font-size: 0.8rem; padding: 0.35rem 0.5rem; text-align: right;" />
      </td>
      <td style="text-align: right; font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; padding-right: 0.5rem;">
        ${((Number(item.qty) || 1) * (Number(item.rate) || 0)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
      </td>
      <td style="text-align: center;">
        <button type="button" class="gst-del-btn" onclick="window.deleteEstimateItemRow(${item.id})"
                title="Remove Item" aria-label="Remove Item">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      </td>
    </tr>
  `).join('');
}

export function addEstimateItemRow() {
  estimateItems.push({
    id: nextEstimateItemId++,
    description: 'Scope Deliverable',
    unit: 'Item',
    qty: 1,
    rate: 1000
  });
  renderEstimateItemsTable();
  updateEstimatePreview();
}

export function deleteEstimateItemRow(id) {
  if (estimateItems.length <= 1) {
    alert('At least one deliverable item is required on the quote.');
    return;
  }
  estimateItems = estimateItems.filter(i => i.id !== id);
  renderEstimateItemsTable();
  updateEstimatePreview();
}

export function onEstimateItemChange(id, field, value) {
  const it = estimateItems.find(i => i.id === id);
  if (it) {
    it[field] = value;
    const row = document.querySelector(`tr[data-est-item-id="${id}"]`);
    if (row) {
      const amtCell = row.cells[4];
      if (amtCell) {
        amtCell.textContent = ((Number(it.qty) || 1) * (Number(it.rate) || 0)).toLocaleString('en-US', { minimumFractionDigits: 2 });
      }
    }
    updateEstimatePreview();
  }
}

export function updateEstimatePreview() {
  const preview = document.getElementById('estimate-preview-content');
  if (!preview) return;

  const bizName = document.getElementById('est-biz-name')?.value || 'VERTEX STUDIO & ENGINEERING';
  const bizAddr = document.getElementById('est-biz-addr')?.value || '101 Cyber Tech Park, Innovation Way';
  const bizContact = document.getElementById('est-biz-contact')?.value || 'hello@vertexstudio.io • +1 (555) 234-5678';

  const estNum = document.getElementById('est-number')?.value || 'EST-2026-084';
  const estDate = document.getElementById('est-date')?.value || new Date().toISOString().split('T')[0];
  const validUntil = document.getElementById('est-valid-date')?.value || '';

  const clientName = document.getElementById('est-client-name')?.value || 'Acme Enterprises';
  const clientCompany = document.getElementById('est-client-company')?.value || 'Global Digital Solutions';
  const clientAddr = document.getElementById('est-client-addr')?.value || '450 Lexington Ave, New York, NY';
  const prjTitle = document.getElementById('est-prj-title')?.value || 'Enterprise Cloud & Document Platform Development';
  const currency = document.getElementById('est-currency')?.value || '$';

  const discountPct = parseFloat(document.getElementById('est-discount')?.value) || 0;
  const taxPct = parseFloat(document.getElementById('est-tax')?.value) || 0;
  const terms = document.getElementById('est-terms')?.value ||
    '1. Validity: This quotation remains valid for 30 calendar days from the date of issue.\n2. Payment Terms: 50% advance upon project initiation, 50% upon final sign-off & milestone handover.\n3. Out-of-Scope: Any additional requests outside the documented scope will be estimated separately.';

  let subtotal = 0;
  estimateItems.forEach(i => {
    subtotal += (Number(i.qty) || 1) * (Number(i.rate) || 0);
  });

  const discAmt = (subtotal * discountPct) / 100;
  const taxable = Math.max(0, subtotal - discAmt);
  const taxAmt = (taxable * taxPct) / 100;
  const grandTotal = taxable + taxAmt;

  preview.innerHTML = `
    <div style="background: #fff; border: 1px solid #e2e8f0; padding: 28px; color: #1e293b; font-family: 'Plus Jakarta Sans', sans-serif;">
      <!-- Top Accent Bar -->
      <div style="height: 4px; background: #7b61ff; margin: -28px -28px 24px -28px;"></div>

      <!-- Header Grid -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
        <div>
          <h2 style="margin: 0; font-size: 18px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em;">
            ${escapeHtml(bizName.toUpperCase())}
          </h2>
          ${bizAddr ? `<div style="font-size: 11px; color: #64748b; margin-top: 3px;">${escapeHtml(bizAddr)}</div>` : ''}
          ${bizContact ? `<div style="font-size: 11px; color: #64748b;">${escapeHtml(bizContact)}</div>` : ''}
        </div>
        <div style="text-align: right;">
          <div style="font-size: 15px; font-weight: 800; color: #7b61ff; letter-spacing: 0.5px;">PROJECT ESTIMATE</div>
          <div style="font-size: 12px; font-weight: bold; color: #0f172a; margin-top: 2px;">Estimate #: ${escapeHtml(estNum)}</div>
          <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Date: ${escapeHtml(estDate)}</div>
          ${validUntil ? `<div style="font-size: 11px; font-weight: 600; color: #d97706; margin-top: 2px;">Valid Until: ${escapeHtml(validUntil)}</div>` : ''}
        </div>
      </div>

      <div style="border-top: 1px solid #e2e8f0; margin-bottom: 16px;"></div>

      <!-- Prepared For & Project Box -->
      <div style="display: grid; grid-template-columns: 1.2fr 1fr; background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px 16px; margin-bottom: 20px; font-size: 11.5px;">
        <div>
          <div style="font-size: 9.5px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 3px;">PREPARED FOR:</div>
          <div style="font-size: 13px; font-weight: 700; color: #0f172a;">${escapeHtml(clientName)}</div>
          ${clientCompany ? `<div style="color: #475569; font-weight: 600;">${escapeHtml(clientCompany)}</div>` : ''}
          ${clientAddr ? `<div style="color: #64748b; font-size: 11px;">${escapeHtml(clientAddr)}</div>` : ''}
        </div>
        <div>
          <div style="font-size: 9.5px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 3px;">PROJECT TITLE:</div>
          <div style="font-size: 12.5px; font-weight: 700; color: #7b61ff;">${escapeHtml(prjTitle)}</div>
          <div style="font-size: 10.5px; color: #64748b; font-style: italic; margin-top: 2px;">Formal Proposal & Scope of Work</div>
        </div>
      </div>

      <!-- Scope Table -->
      <div style="border: 1px solid #e2e8f0; overflow: hidden; margin-bottom: 16px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
          <thead>
            <tr style="background: #0f172a; color: #fff; font-weight: 700;">
              <th style="padding: 7px 10px; text-align: center; width: 30px;">#</th>
              <th style="padding: 7px 10px; text-align: left;">DELIVERABLES / SCOPE DESCRIPTION</th>
              <th style="padding: 7px 10px; text-align: center; width: 70px;">UNIT</th>
              <th style="padding: 7px 10px; text-align: center; width: 50px;">QTY</th>
              <th style="padding: 7px 10px; text-align: right; width: 90px;">RATE</th>
              <th style="padding: 7px 10px; text-align: right; width: 100px;">AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            ${estimateItems.map((it, idx) => {
              const q = Number(it.qty) || 1;
              const r = Number(it.rate) || 0;
              const rowAmt = q * r;
              const bg = idx % 2 === 1 ? '#f8fafc' : '#ffffff';
              return `
                <tr style="background: ${bg}; border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 7px 10px; text-align: center; color: #64748b;">${idx + 1}</td>
                  <td style="padding: 7px 10px; font-weight: 600; color: #1e293b;">${escapeHtml(it.description)}</td>
                  <td style="padding: 7px 10px; text-align: center; color: #64748b;">${escapeHtml(it.unit || 'Item')}</td>
                  <td style="padding: 7px 10px; text-align: center; font-weight: 600;">${q}</td>
                  <td style="padding: 7px 10px; text-align: right; color: #475569;">${currency} ${r.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td style="padding: 7px 10px; text-align: right; font-weight: 700; color: #0f172a;">${currency} ${rowAmt.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>

      <!-- Calculations Grid -->
      <div style="display: flex; justify-content: flex-end; margin-bottom: 20px;">
        <div style="width: 240px; font-size: 11.5px; line-height: 1.6;">
          <div style="display: flex; justify-content: space-between; color: #475569;">
            <span>Scope Subtotal:</span>
            <span style="font-weight: 600; color: #0f172a;">${currency} ${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
          ${discountPct > 0 ? `
            <div style="display: flex; justify-content: space-between; color: #dc2626;">
              <span>Discount (${discountPct}%):</span>
              <span>- ${currency} ${discAmt.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
          ` : ''}
          ${taxPct > 0 ? `
            <div style="display: flex; justify-content: space-between; color: #475569;">
              <span>Estimated Tax (${taxPct}%):</span>
              <span>+ ${currency} ${taxAmt.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
          ` : ''}
          <div style="background: #f1f5f9; border: 1px solid #7b61ff; padding: 6px 10px; margin-top: 6px; display: flex; justify-content: space-between; font-size: 13px; font-weight: 800; color: #0f172a;">
            <span>TOTAL ESTIMATE:</span>
            <span style="color: #7b61ff;">${currency} ${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      <!-- Commercial Terms -->
      <div style="border-top: 1px solid #e2e8f0; padding-top: 14px; margin-bottom: 24px;">
        <div style="font-size: 11px; font-weight: 700; color: #0f172a; margin-bottom: 6px;">COMMERCIAL TERMS & CONDITIONS</div>
        <div style="font-size: 10px; color: #64748b; line-height: 1.5; white-space: pre-line;">${escapeHtml(terms)}</div>
      </div>

      <!-- Signature Blocks -->
      <div style="display: flex; justify-content: space-between; align-items: flex-end; padding-top: 16px;">
        <div style="width: 200px; text-align: center; border-top: 1px solid #94a3b8; padding-top: 6px;">
          <div style="font-size: 11px; font-weight: 700; color: #0f172a;">Authorized Representative</div>
          <div style="font-size: 9.5px; color: #64748b;">${escapeHtml(bizName)}</div>
        </div>
        <div style="width: 200px; text-align: center; border-top: 1px solid #94a3b8; padding-top: 6px;">
          <div style="font-size: 11px; font-weight: 700; color: #0f172a;">Client Acceptance</div>
          <div style="font-size: 9.5px; color: #64748b;">Approval Signature & Date</div>
        </div>
      </div>
    </div>
  `;
}

export async function generateEstimatePdf(callbacks = {}) {
  const { startProgress, onJobSubmitted, onError } = callbacks;

  const bizName = document.getElementById('est-biz-name')?.value || 'VERTEX STUDIO & ENGINEERING';
  const bizAddr = document.getElementById('est-biz-addr')?.value || '';
  const bizContact = document.getElementById('est-biz-contact')?.value || '';
  const estNum = document.getElementById('est-number')?.value || `EST-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
  const estDate = document.getElementById('est-date')?.value || new Date().toISOString().split('T')[0];
  const validUntil = document.getElementById('est-valid-date')?.value || '';

  const clientName = document.getElementById('est-client-name')?.value || 'Acme Enterprises';
  const clientCompany = document.getElementById('est-client-company')?.value || '';
  const clientAddr = document.getElementById('est-client-addr')?.value || '';
  const prjTitle = document.getElementById('est-prj-title')?.value || 'Project Scope Estimate';
  const currency = document.getElementById('est-currency')?.value || '$';

  const discountPct = parseFloat(document.getElementById('est-discount')?.value) || 0;
  const taxPct = parseFloat(document.getElementById('est-tax')?.value) || 0;
  const terms = document.getElementById('est-terms')?.value || '';

  const options = {
    businessName: bizName,
    businessAddress: bizAddr,
    businessEmail: bizContact,
    clientName,
    clientCompany,
    clientAddress: clientAddr,
    estimateNumber: estNum,
    estimateDate: estDate,
    validUntilDate: validUntil,
    projectTitle: prjTitle,
    currency,
    discountPct,
    taxPct,
    terms,
    items: estimateItems.map(i => ({
      description: i.description,
      unit: i.unit || 'Item',
      qty: Number(i.qty) || 1,
      rate: Number(i.rate) || 0
    }))
  };

  const estStudio = document.getElementById('estimate-studio');
  if (estStudio) estStudio.style.display = 'none';

  const progContainer = document.getElementById('progress-container');
  if (progContainer) progContainer.style.display = 'block';

  if (typeof startProgress === 'function') {
    startProgress('estimate-maker');
  }

  try {
    const res = await fetch('/api/v1/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operation: 'estimate-maker',
        files: [],
        options
      })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || 'Failed to submit Estimate job.');
    }

    if (typeof onJobSubmitted === 'function') {
      onJobSubmitted(data.jobId);
    }
  } catch (err) {
    if (typeof onError === 'function') {
      onError(err);
    } else {
      alert(`Error generating estimate: ${err.message}`);
      if (estStudio) estStudio.style.display = 'block';
      if (progContainer) progContainer.style.display = 'none';
    }
  }
}

export function setEstimateStudioView(mode) {
  const formPanel = document.getElementById('estimate-form-panel');
  const previewPanel = document.getElementById('estimate-preview-panel');
  const container = document.getElementById('estimate-studio-container');
  const tabs = ['form', 'preview', 'split'];

  tabs.forEach(t => {
    const btn = document.getElementById(`est-tab-${t}`);
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
    updateEstimatePreview();
  } else {
    formPanel.style.display = 'block';
    previewPanel.style.display = 'block';
    container.style.gridTemplateColumns = '';
    updateEstimatePreview();
  }
}

if (typeof window !== 'undefined') {
  window.initEstimateStudio = initEstimateStudio;
  window.renderEstimateItemsTable = renderEstimateItemsTable;
  window.addEstimateItemRow = addEstimateItemRow;
  window.deleteEstimateItemRow = deleteEstimateItemRow;
  window.onEstimateItemChange = onEstimateItemChange;
  window.updateEstimatePreview = updateEstimatePreview;
  window.generateEstimatePdf = generateEstimatePdf;
  window.setEstimateStudioView = setEstimateStudioView;
}
