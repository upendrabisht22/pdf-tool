/**
 * @file views/studios/tax-receipt-studio-view.js
 * @description Dedicated Section 80G Tax Exemption Certificate studio view.
 */

/**
 * Renders the Section 80G Tax Receipt Studio HTML component.
 * @param {Object} options
 * @param {string} [options.studioId] - Active studio identifier
 * @returns {string} HTML markup
 */
export function renderTaxReceiptStudioView({ studioId }) {
  const isVisible = studioId === 'tax-receipt-studio';
  return `
    <!-- Dedicated Section 80G Tax Receipt Studio -->
    <div id="tax-receipt-studio" style="display: ${isVisible ? 'block' : 'none'}; padding: 0.5rem 0;">
      <div class="gst-mobile-view-switcher" id="tr-mobile-view-switcher">
        <button type="button" class="gst-view-tab-btn active" id="tr-tab-form" onclick="window.setTaxReceiptStudioView('form')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          <span>Edit Receipt</span>
        </button>
        <button type="button" class="gst-view-tab-btn" id="tr-tab-preview" onclick="window.setTaxReceiptStudioView('preview')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
          <span>Certificate Preview</span>
        </button>
        <button type="button" class="gst-view-tab-btn" id="tr-tab-split" onclick="window.setTaxReceiptStudioView('split')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="12" y1="3" x2="12" y2="21"></line></svg>
          <span>Split View</span>
        </button>
      </div>

      <div class="gst-studio-container" id="tax-receipt-studio-container">
        <!-- Left Form Panel -->
        <div class="gst-form-panel" id="tax-receipt-form-panel">
          <div class="gst-panel-header">
            <div class="gst-panel-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7b61ff" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line></svg>
              <span>Tax Receipt & 80G Certificate Studio</span>
            </div>
          </div>

          <!-- Trust / Society Info -->
          <div class="gst-section-card">
            <div class="gst-section-title">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3"></path></svg>
              <span>Trust / Organization Details</span>
            </div>
            <div class="gst-grid-2">
              <input type="text" id="tr-trust-name" placeholder="Trust / NGO Name *" value="Seva Foundation Charitable Trust" oninput="updateTaxReceiptPreview()" class="gst-input" />
              <input type="text" id="tr-reg-no" placeholder="Trust Regn / Society No." value="REG-MH/1048/2018" oninput="updateTaxReceiptPreview()" class="gst-input" />
            </div>
            <div class="gst-grid-2" style="margin-top: 0.5rem;">
              <input type="text" id="tr-urn-80g" placeholder="Section 80G URN *" value="AAATE1234F21UR01" oninput="updateTaxReceiptPreview()" class="gst-input" />
              <input type="text" id="tr-trust-pan" placeholder="Trust PAN (10 chars)" value="AAATE1234F" oninput="updateTaxReceiptPreview()" class="gst-input" />
            </div>
            <div style="margin-top: 0.5rem;">
              <input type="text" id="tr-trust-addr" placeholder="Registered Trust Address" value="104 Lotus Chambers, Bandra West, Mumbai 400050" oninput="updateTaxReceiptPreview()" class="gst-input" />
            </div>
          </div>

          <!-- Receipt & Donor Meta -->
          <div class="gst-section-card">
            <div class="gst-section-title">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              <span>Donor & Contribution Details</span>
            </div>
            <div class="gst-grid-2">
              <input type="text" id="tr-receipt-no" placeholder="Receipt #" value="80G-2026-1042" oninput="updateTaxReceiptPreview()" class="gst-input" />
              <input type="date" id="tr-date" oninput="updateTaxReceiptPreview()" class="gst-input" />
            </div>
            <div class="gst-grid-2" style="margin-top: 0.5rem;">
              <input type="text" id="tr-donor-name" placeholder="Donor Full Name *" value="Mr. Rajesh Kumar" oninput="updateTaxReceiptPreview()" class="gst-input" />
              <input type="text" id="tr-donor-pan" placeholder="Donor PAN (e.g. ABCDE1234F)" value="ABCDE1234F" oninput="updateTaxReceiptPreview()" class="gst-input" />
            </div>
            <div style="margin-top: 0.5rem;">
              <input type="text" id="tr-donor-addr" placeholder="Donor Address / City" value="Flat 402, Sunshine Heights, Mumbai" oninput="updateTaxReceiptPreview()" class="gst-input" />
            </div>
          </div>

          <!-- Financial & Payment -->
          <div class="gst-section-card">
            <div class="gst-section-title">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
              <span>Donation Amount & Payment Mode</span>
            </div>
            <div class="gst-grid-2">
              <div>
                <label class="gst-label mono-copy">Donation Amount (₹) *</label>
                <input type="number" id="tr-amount" min="1" step="100" placeholder="10000" value="10000" oninput="updateTaxReceiptPreview()" class="gst-input" />
              </div>
              <div>
                <label class="gst-label mono-copy">Payment Mode</label>
                <select id="tr-payment-mode" class="gst-input" onchange="updateTaxReceiptPreview()">
                  <option value="NEFT/RTGS" selected>NEFT / RTGS</option>
                  <option value="UPI">UPI / QR Code</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>
            </div>
            <div class="gst-grid-2" style="margin-top: 0.5rem;">
              <input type="text" id="tr-pay-ref" placeholder="Txn Ref / Cheque #" value="TXN-98765432" oninput="updateTaxReceiptPreview()" class="gst-input" />
              <input type="text" id="tr-purpose" placeholder="Donation Purpose" value="Child Healthcare & Education Relief Fund" oninput="updateTaxReceiptPreview()" class="gst-input" />
            </div>
            <div style="margin-top: 0.5rem;">
              <input type="text" id="tr-signatory" placeholder="Signatory Designation" value="Authorized Trustee / Secretary" oninput="updateTaxReceiptPreview()" class="gst-input" />
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="gst-action-bar" style="display: flex; gap: 0.75rem;">
            <button type="button" class="paper-cta-btn group" onclick="generateTaxReceiptPdf()" style="flex: 2; justify-content: center;">
              <span class="cta-fill"></span>
              <span class="relative z-10 flex items-center justify-center gap-2 mono-copy" style="font-size: 0.78rem; text-transform: uppercase;">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                <span>Download 80G Receipt PDF</span>
              </span>
            </button>
            <button type="button" class="mono-copy" onclick="window.print()" style="flex: 1; height: 38px; border: 1px dashed var(--border); background: var(--bg-elevated); color: var(--text-primary); font-size: 0.75rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.4rem;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
              <span>Print</span>
            </button>
          </div>
        </div>

        <!-- Right Live Preview -->
        <div class="gst-preview-panel" id="tax-receipt-preview-panel">
          <div class="gst-preview-toolbar">
            <div class="gst-preview-badge mono-copy">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              <span>LIVE 80G TAX CERTIFICATE PREVIEW</span>
            </div>
          </div>
          <div class="gst-paper" style="padding: 1.5rem; background: var(--bg-elevated); border: 1px dashed var(--border);">
            <div id="tax-receipt-preview-content" style="max-width: 540px; margin: 0 auto; box-shadow: 0 4px 16px rgba(0,0,0,0.1);"></div>
          </div>
        </div>
      </div>
    </div>
  `;
}
