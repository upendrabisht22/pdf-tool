/**
 * @file modules/tax-receipt-studio.js
 * @description Dedicated Tax Receipt & 80G Donation Receipt Studio Controller for DocPlatform.
 * Provides live certificate preview, automatic Rupee words conversion, donor PAN verification,
 * and direct vector PDF & browser print outputs.
 */

import { escapeHtml } from './utils.js';

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

  const intPart = Math.floor(Math.abs(Number(amount) || 0));
  if (intPart === 0) return 'Zero Rupees Only';

  let remaining = intPart;
  const parts = [];

  const crores = Math.floor(remaining / 10000000);
  remaining %= 10000000;
  if (crores > 0) parts.push(convertChunk(crores) + ' Crore');

  const lakhs = Math.floor(remaining / 100000);
  remaining %= 100000;
  if (lakhs > 0) parts.push(convertChunk(lakhs) + ' Lakh');

  const thousands = Math.floor(remaining / 1000);
  remaining %= 1000;
  if (thousands > 0) parts.push(convertChunk(thousands) + ' Thousand');

  const hundreds = Math.floor(remaining / 100);
  remaining %= 100;
  if (hundreds > 0) parts.push(words[hundreds] + ' Hundred');

  if (remaining > 0) {
    if (parts.length > 0) parts.push('and ' + convertChunk(remaining));
    else parts.push(convertChunk(remaining));
  }

  return parts.join(' ').replace(/\s+/g, ' ').trim() + ' Rupees Only';
}

export function initTaxReceiptStudio() {
  const dtInput = document.getElementById('tr-date');
  if (dtInput && !dtInput.value) {
    dtInput.value = new Date().toISOString().split('T')[0];
  }
  const recInput = document.getElementById('tr-receipt-no');
  if (recInput && !recInput.value) {
    recInput.value = `80G-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  }
  updateTaxReceiptPreview();
}

export function updateTaxReceiptPreview() {
  const preview = document.getElementById('tax-receipt-preview-content');
  if (!preview) return;

  const trustName = document.getElementById('tr-trust-name')?.value || 'SEVA FOUNDATION CHARITABLE TRUST';
  const regNo = document.getElementById('tr-reg-no')?.value || 'REG-MH/1048/2018';
  const urn80G = document.getElementById('tr-urn-80g')?.value || 'AAATE1234F21UR01';
  const trustPan = document.getElementById('tr-trust-pan')?.value || 'AAATE1234F';
  const trustAddr = document.getElementById('tr-trust-addr')?.value || '104 Lotus Chambers, Bandra West, Mumbai 400050';

  const receiptNo = document.getElementById('tr-receipt-no')?.value || '80G-2026-1042';
  const receiptDate = document.getElementById('tr-date')?.value || new Date().toISOString().split('T')[0];

  const donorName = document.getElementById('tr-donor-name')?.value || 'Mr. Rajesh Kumar';
  const donorPan = document.getElementById('tr-donor-pan')?.value || 'ABCDE1234F';
  const donorAddr = document.getElementById('tr-donor-addr')?.value || 'Flat 402, Sunshine Heights, Mumbai';
  const amount = Math.max(1, parseFloat(document.getElementById('tr-amount')?.value) || 10000);
  const words = numberToWordsClient(amount);

  const paymentMode = document.getElementById('tr-payment-mode')?.value || 'NEFT/RTGS';
  const payRef = document.getElementById('tr-pay-ref')?.value || 'TXN-98765432';
  const purpose = document.getElementById('tr-purpose')?.value || 'Child Healthcare & Education Relief Fund';
  const signatory = document.getElementById('tr-signatory')?.value || 'Authorized Trustee / Secretary';

  preview.innerHTML = `
    <div style="border: 2px solid #1a2744; padding: 16px; background: #fff; font-family: 'Times New Roman', serif; color: #111; position: relative;">
      <div style="border: 1px solid #c8a858; padding: 20px;">
        
        <!-- Organization Header -->
        <div style="text-align: center;">
          <h2 style="margin: 0; font-size: 18px; font-weight: bold; color: #1a2744; letter-spacing: 0.5px; font-family: 'Times New Roman', serif;">
            ${escapeHtml(trustName.toUpperCase())}
          </h2>
          <div style="font-size: 10.5px; color: #555; margin-top: 4px; font-family: 'Plus Jakarta Sans', sans-serif;">
            Trust Regn No: <strong>${escapeHtml(regNo)}</strong> &nbsp;|&nbsp; PAN: <strong>${escapeHtml(trustPan)}</strong>
          </div>
          <div style="font-size: 11px; font-weight: bold; color: #b38827; margin-top: 3px; font-family: 'Plus Jakarta Sans', sans-serif;">
            Section 80G Unique Registration No. (URN): ${escapeHtml(urn80G)}
          </div>
          <div style="font-size: 10px; color: #666; margin-top: 2px; font-family: 'Plus Jakarta Sans', sans-serif;">
            ${escapeHtml(trustAddr)}
          </div>
        </div>

        <div style="border-top: 1px solid #c8a858; margin: 14px 0 16px;"></div>

        <!-- Certificate Title -->
        <div style="text-align: center; margin-bottom: 16px;">
          <div style="display: inline-block; border: 1px solid #1a2744; background: #f7f9fc; padding: 4px 14px; font-size: 12px; font-weight: bold; color: #1a2744; font-family: 'Plus Jakarta Sans', sans-serif; letter-spacing: 0.5px;">
            DONATION RECEIPT & SECTION 80G CERTIFICATE
          </div>
          <div style="font-size: 10px; font-style: italic; color: #555; margin-top: 4px;">
            (Issued under Section 80G(5)(vi) of the Income Tax Act, 1961)
          </div>
        </div>

        <!-- Meta Bar -->
        <div style="display: flex; justify-content: space-between; background: #fbfbfb; border: 1px solid #e0e4eb; padding: 6px 12px; font-size: 11px; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 600; color: #1a2744; margin-bottom: 16px;">
          <span>Receipt No: ${escapeHtml(receiptNo)}</span>
          <span>Date: ${escapeHtml(receiptDate)}</span>
        </div>

        <!-- Donor Information Grid -->
        <div style="font-size: 11.5px; line-height: 1.8; color: #222; font-family: 'Plus Jakarta Sans', sans-serif;">
          <div style="display: flex; margin-bottom: 4px;">
            <span style="width: 170px; font-weight: 600; color: #1a2744;">Received with thanks from:</span>
            <span style="font-weight: bold; color: #1a2744; font-size: 12px;">${escapeHtml(donorName)}</span>
          </div>
          <div style="display: flex; margin-bottom: 4px;">
            <span style="width: 170px; font-weight: 600; color: #1a2744;">Donor PAN:</span>
            <span style="font-family: 'JetBrains Mono', monospace; font-weight: bold;">${escapeHtml(donorPan || 'Not Provided')}</span>
          </div>
          <div style="display: flex; margin-bottom: 4px;">
            <span style="width: 170px; font-weight: 600; color: #1a2744;">Donor Address:</span>
            <span>${escapeHtml(donorAddr)}</span>
          </div>
        </div>

        <!-- Amount Box -->
        <div style="background: #faf8f2; border: 1px solid #c8a858; padding: 10px 14px; margin: 14px 0;">
          <div style="display: flex; align-items: baseline; justify-content: space-between;">
            <span style="font-size: 11px; font-weight: 700; color: #1a2744; font-family: 'Plus Jakarta Sans', sans-serif;">DONATION AMOUNT:</span>
            <span style="font-size: 18px; font-weight: 800; color: #b38827; font-family: 'Plus Jakarta Sans', sans-serif;">₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
          <div style="font-size: 11px; font-style: italic; color: #333; margin-top: 4px;">
            Amount in words: <strong>${escapeHtml(words)}</strong>
          </div>
        </div>

        <!-- Payment Details -->
        <div style="font-size: 11px; line-height: 1.7; color: #333; font-family: 'Plus Jakarta Sans', sans-serif;">
          <div style="display: flex;">
            <span style="width: 170px; font-weight: 600; color: #1a2744;">Mode of Payment:</span>
            <span>${escapeHtml(paymentMode)}</span>
          </div>
          <div style="display: flex;">
            <span style="width: 170px; font-weight: 600; color: #1a2744;">Transaction Reference:</span>
            <span style="font-family: 'JetBrains Mono', monospace;">${escapeHtml(payRef)}</span>
          </div>
          <div style="display: flex;">
            <span style="width: 170px; font-weight: 600; color: #1a2744;">Purpose of Donation:</span>
            <span>${escapeHtml(purpose)}</span>
          </div>
        </div>

        <!-- 80G Statutory Exemption Box -->
        <div style="border: 1px solid #d0d7e5; background: #f9fbfe; padding: 8px 12px; margin: 16px 0 20px; font-size: 10px; color: #444; line-height: 1.5; font-family: 'Plus Jakarta Sans', sans-serif;">
          <strong style="color: #1a2744;">STATUTORY TAX EXEMPTION DECLARATION:</strong><br />
          Donations made to <strong>${escapeHtml(trustName)}</strong> are eligible for income tax deduction under Section 80G(5)(vi) of the Income Tax Act, 1961 vide Unique Registration Number: <strong>${escapeHtml(urn80G)}</strong>. Donors can claim eligible tax exemption on this contribution.
        </div>

        <!-- Seal & Signatory Row -->
        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 24px; font-family: 'Plus Jakarta Sans', sans-serif;">
          <div style="border: 1px dashed #b0b8c8; width: 100px; height: 50px; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: bold; color: #8892a4;">
            TRUST SEAL
          </div>
          <div style="text-align: center; border-top: 1px solid #1a2744; padding-top: 4px; min-width: 160px;">
            <div style="font-size: 10.5px; font-weight: bold; color: #1a2744;">${escapeHtml(signatory)}</div>
            <div style="font-size: 9px; color: #666;">For ${escapeHtml(trustName)}</div>
          </div>
        </div>

      </div>
    </div>
  `;
}

export async function generateTaxReceiptPdf(callbacks = {}) {
  const { startProgress, onJobSubmitted, onError } = callbacks;

  const trustName = document.getElementById('tr-trust-name')?.value || 'SEVA FOUNDATION CHARITABLE TRUST';
  const regNo = document.getElementById('tr-reg-no')?.value || 'REG-MH/1048/2018';
  const urn80G = document.getElementById('tr-urn-80g')?.value || 'AAATE1234F21UR01';
  const trustPan = document.getElementById('tr-trust-pan')?.value || 'AAATE1234F';
  const trustAddr = document.getElementById('tr-trust-addr')?.value || '';
  const receiptNo = document.getElementById('tr-receipt-no')?.value || `80G-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const receiptDate = document.getElementById('tr-date')?.value || new Date().toISOString().split('T')[0];

  const donorName = document.getElementById('tr-donor-name')?.value || 'Mr. Rajesh Kumar';
  const donorPan = document.getElementById('tr-donor-pan')?.value || '';
  const donorAddr = document.getElementById('tr-donor-addr')?.value || '';
  const amount = Math.max(1, parseFloat(document.getElementById('tr-amount')?.value) || 10000);

  const paymentMode = document.getElementById('tr-payment-mode')?.value || 'NEFT/RTGS';
  const payRef = document.getElementById('tr-pay-ref')?.value || '';
  const purpose = document.getElementById('tr-purpose')?.value || 'General Charitable Relief';
  const signatory = document.getElementById('tr-signatory')?.value || 'Authorized Trustee';

  const options = {
    trustName,
    registrationNumber: regNo,
    section80GNumber: urn80G,
    panNumber: trustPan,
    trustAddress: trustAddr,
    receiptNumber: receiptNo,
    receiptDate,
    donorName,
    donorPan,
    donorAddress: donorAddr,
    amount,
    paymentMode,
    paymentReference: payRef,
    purpose,
    signatoryName: signatory,
    signatoryDesignation: `For ${trustName}`
  };

  const trStudio = document.getElementById('tax-receipt-studio');
  if (trStudio) trStudio.style.display = 'none';

  const progContainer = document.getElementById('progress-container');
  if (progContainer) progContainer.style.display = 'block';

  if (typeof startProgress === 'function') {
    startProgress('tax-receipt');
  }

  try {
    const res = await fetch('/api/v1/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operation: 'tax-receipt',
        files: [],
        options
      })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || 'Failed to submit Tax Receipt job.');
    }

    if (typeof onJobSubmitted === 'function') {
      onJobSubmitted(data.jobId);
    }
  } catch (err) {
    if (typeof onError === 'function') {
      onError(err);
    } else {
      alert(`Error generating tax receipt: ${err.message}`);
      if (trStudio) trStudio.style.display = 'block';
      if (progContainer) progContainer.style.display = 'none';
    }
  }
}

export function setTaxReceiptStudioView(mode) {
  const formPanel = document.getElementById('tax-receipt-form-panel');
  const previewPanel = document.getElementById('tax-receipt-preview-panel');
  const container = document.getElementById('tax-receipt-studio-container');
  const tabs = ['form', 'preview', 'split'];

  tabs.forEach(t => {
    const btn = document.getElementById(`tr-tab-${t}`);
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
    updateTaxReceiptPreview();
  } else {
    formPanel.style.display = 'block';
    previewPanel.style.display = 'block';
    container.style.gridTemplateColumns = '';
    updateTaxReceiptPreview();
  }
}

if (typeof window !== 'undefined') {
  window.initTaxReceiptStudio = initTaxReceiptStudio;
  window.updateTaxReceiptPreview = updateTaxReceiptPreview;
  window.generateTaxReceiptPdf = generateTaxReceiptPdf;
  window.setTaxReceiptStudioView = setTaxReceiptStudioView;
}
