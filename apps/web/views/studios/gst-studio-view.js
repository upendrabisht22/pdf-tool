/**
 * @file views/studios/gst-studio-view.js
 * @description Dedicated GST tax invoice studio view with live A4 split preview.
 */

/**
 * Renders the GST Invoice Studio HTML component.
 * @param {Object} options
 * @param {string} [options.studioId] - Active studio identifier
 * @returns {string} HTML markup
 */
export function renderGstStudioView({ studioId }) {
  const isVisible = studioId === 'gst-invoice-studio';
  return `
    <!-- Dedicated Professional GST Invoice Studio -->
    <div id="gst-invoice-studio" style="display: ${isVisible ? 'block' : 'none'}; padding: 0.5rem 0;">
      <!-- Mobile/Tablet View Mode Switcher -->
      <div class="gst-mobile-view-switcher" id="gst-mobile-view-switcher">
        <button type="button" class="gst-view-tab-btn active" id="gst-tab-form" onclick="window.setGstStudioView('form')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          <span>Edit Form</span>
        </button>
        <button type="button" class="gst-view-tab-btn" id="gst-tab-preview" onclick="window.setGstStudioView('preview')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
          <span>Live A4 Preview</span>
        </button>
        <button type="button" class="gst-view-tab-btn" id="gst-tab-split" onclick="window.setGstStudioView('split')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="12" y1="3" x2="12" y2="21"></line></svg>
          <span>Split View</span>
        </button>
      </div>

      <div class="gst-studio-container" id="gst-studio-container">
        <!-- Left: Invoice Editor Form -->
        <div class="gst-form-panel" id="gst-form-panel">
          <div class="gst-panel-header">
            <div class="gst-panel-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #7b61ff;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              <span>GST Tax Invoice Studio</span>
            </div>
            <div class="gst-theme-picker">
              <span style="font-size: 0.75rem; color: var(--text-secondary); font-family: 'JetBrains Mono', monospace;">Theme:</span>
              <select id="gst-theme-select" class="mono-copy select-control" onchange="updateGstInvoicePreview()" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; background: var(--bg-elevated); border: 1px solid var(--border); color: var(--text-primary);">
                <option value="modern" selected>Modern Slate</option>
                <option value="corporate">Corporate Blue</option>
                <option value="emerald">Emerald Green</option>
                <option value="minimal">Clean Minimal</option>
              </select>
            </div>
          </div>

          <!-- Seller Details -->
          <div class="gst-section-card">
            <div class="gst-section-title">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><path d="M9 22v-4h6v4"></path><path d="M8 6h.01"></path><path d="M16 6h.01"></path><path d="M8 10h.01"></path><path d="M16 10h.01"></path><path d="M8 14h.01"></path><path d="M16 14h.01"></path></svg>
              <span>Billed From (Supplier / Business Details)</span>
            </div>
            <div class="gst-grid-2">
              <input type="text" id="gst-seller-name" placeholder="Business Name *" value="Acme Technologies Pvt Ltd" oninput="updateGstInvoicePreview()" class="gst-input" />
              <input type="text" id="gst-seller-gstin" placeholder="Your GSTIN (e.g. 07AAAAA0000A1Z5)" value="07AAAAA0000A1Z5" oninput="updateGstInvoicePreview()" class="gst-input" />
            </div>
            <div class="gst-grid-2" style="margin-top: 0.5rem;">
              <input type="text" id="gst-seller-address" placeholder="Address, City, Pincode" value="Plot 42, Okhla Phase 3, New Delhi" oninput="updateGstInvoicePreview()" class="gst-input" />
              <div style="display: flex; gap: 0.5rem;">
                <input type="text" id="gst-seller-state" placeholder="State (e.g. Delhi)" value="Delhi" oninput="updateGstInvoicePreview()" class="gst-input" style="flex: 2;" />
                <input type="text" id="gst-seller-code" placeholder="Code" value="07" oninput="updateGstInvoicePreview()" class="gst-input" style="flex: 1;" />
              </div>
            </div>
            <div class="gst-grid-2" style="margin-top: 0.5rem;">
              <input type="text" id="gst-seller-phone" placeholder="Phone (optional)" value="+91 98765 43210" oninput="updateGstInvoicePreview()" class="gst-input" />
              <input type="text" id="gst-seller-pan" placeholder="PAN Number" value="AAAAA0000A" oninput="updateGstInvoicePreview()" class="gst-input" />
            </div>
          </div>

          <!-- Buyer Details -->
          <div class="gst-section-card">
            <div class="gst-section-title">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              <span>Billed To (Recipient / Client Details)</span>
            </div>
            <div class="gst-grid-2">
              <input type="text" id="gst-buyer-name" placeholder="Client Name *" value="Apex Retailers LLP" oninput="updateGstInvoicePreview()" class="gst-input" />
              <input type="text" id="gst-buyer-gstin" placeholder="Buyer GSTIN (if registered)" value="07BBBBB1111B1Z2" oninput="updateGstInvoicePreview()" class="gst-input" />
            </div>
            <div class="gst-grid-2" style="margin-top: 0.5rem;">
              <input type="text" id="gst-buyer-address" placeholder="Client Address, City" value="Connaught Place, Central Delhi" oninput="updateGstInvoicePreview()" class="gst-input" />
              <div style="display: flex; gap: 0.5rem;">
                <input type="text" id="gst-buyer-state" placeholder="State (e.g. Delhi)" value="Delhi" oninput="updateGstInvoicePreview()" class="gst-input" style="flex: 2;" />
                <input type="text" id="gst-buyer-code" placeholder="Code" value="07" oninput="updateGstInvoicePreview()" class="gst-input" style="flex: 1;" />
              </div>
            </div>
          </div>

          <!-- Invoice Meta & Tax Mode -->
          <div class="gst-section-card">
            <div class="gst-section-title">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              <span>Invoice Meta & Tax Mode</span>
            </div>
            <div class="gst-grid-3">
              <div>
                <label class="gst-label mono-copy">Invoice Number</label>
                <input type="text" id="gst-inv-number" value="INV-2026-001" oninput="updateGstInvoicePreview()" class="gst-input" />
              </div>
              <div>
                <label class="gst-label mono-copy">Invoice Date</label>
                <input type="date" id="gst-inv-date" oninput="updateGstInvoicePreview()" class="gst-input" />
              </div>
              <div>
                <label class="gst-label mono-copy">Tax Type</label>
                <select id="gst-tax-type" class="gst-input mono-copy" onchange="updateGstInvoicePreview()">
                  <option value="auto" selected>Auto (Intra/Inter)</option>
                  <option value="intra">Intra-State (CGST + SGST)</option>
                  <option value="inter">Inter-State (IGST)</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Line Items Table -->
          <div class="gst-section-card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <div class="gst-section-title" style="margin-bottom: 0;">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                <span>Line Items & Services</span>
              </div>
              <button type="button" class="mono-copy select-control" onclick="addGstItemRow()" style="font-size: 0.72rem; padding: 0.28rem 0.75rem; display: inline-flex; align-items: center; gap: 4px; background: var(--bg); border: 1px solid var(--border); color: var(--text-primary); cursor: pointer;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                <span>Add Item</span>
              </button>
            </div>
            <div class="gst-items-table-wrapper">
              <table class="gst-items-table mono-copy" id="gst-items-table">
                <thead>
                  <tr>
                    <th style="min-width: 180px;">Item Description</th>
                    <th style="width: 110px;">HSN/SAC</th>
                    <th style="width: 70px; text-align: center;">Qty</th>
                    <th style="width: 100px; text-align: right;">Rate (₹)</th>
                    <th style="width: 80px; text-align: center;">GST%</th>
                    <th style="width: 40px; text-align: center;"></th>
                  </tr>
                </thead>
                <tbody id="gst-items-tbody">
                  <!-- Dynamically filled -->
                </tbody>
              </table>
            </div>
          </div>

          <!-- Banking & UPI QR Details -->
          <div class="gst-section-card">
            <div class="gst-section-title">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
              <span>Digital Payment & Bank Details</span>
            </div>
            <div class="gst-grid-2">
              <div>
                <label class="gst-label mono-copy">UPI ID (for dynamic QR)</label>
                <input type="text" id="gst-upi-id" placeholder="yourbusiness@upi / 9876543210@paytm" value="acmetech@hdfcbank" oninput="updateGstInvoicePreview()" class="gst-input" />
              </div>
              <div>
                <label class="gst-label mono-copy">Bank Name</label>
                <input type="text" id="gst-bank-name" placeholder="Bank Name" value="HDFC Bank" oninput="updateGstInvoicePreview()" class="gst-input" />
              </div>
            </div>
            <div class="gst-grid-2" style="margin-top: 0.5rem;">
              <div>
                <label class="gst-label mono-copy">Account Number</label>
                <input type="text" id="gst-bank-acc" placeholder="Account Number" value="50200012345678" oninput="updateGstInvoicePreview()" class="gst-input" />
              </div>
              <div>
                <label class="gst-label mono-copy">IFSC Code</label>
                <input type="text" id="gst-bank-ifsc" placeholder="IFSC Code" value="HDFC0000123" oninput="updateGstInvoicePreview()" class="gst-input" />
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="gst-action-bar" style="display: flex; gap: 0.75rem;">
            <button type="button" class="paper-cta-btn group" onclick="generateAndDownloadGstInvoicePdf()" style="flex: 2; justify-content: center;">
              <span class="cta-fill"></span>
              <span class="relative z-10 flex items-center justify-center gap-2 mono-copy" style="font-size: 0.78rem; text-transform: uppercase;">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                <span>Download GST Invoice PDF</span>
              </span>
            </button>
            <button type="button" class="mono-copy" onclick="printGstInvoicePreview()" style="flex: 1; height: 38px; border: 1px dashed var(--border); background: var(--bg-elevated); color: var(--text-primary); font-size: 0.75rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.4rem;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
              <span>Print</span>
            </button>
          </div>
        </div>

        <!-- Right: Live Real-Time Invoice Document Preview -->
        <div class="gst-preview-panel" id="gst-preview-panel">
          <div class="gst-preview-toolbar">
            <div class="gst-preview-badge mono-copy">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              <span>LIVE A4 VECTOR PREVIEW</span>
            </div>
            <span id="gst-preview-tax-badge" class="gst-preview-tax-mode mono-copy">Intra-State (CGST 9% + SGST 9%)</span>
          </div>
          <div class="gst-paper" id="gst-paper">
            <!-- Real-time Live preview -->
          </div>
        </div>
      </div>
    </div>
  `;
}
