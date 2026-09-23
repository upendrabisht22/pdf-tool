/**
 * @file views/studios/pos-studio-view.js
 * @description Dedicated Minimal POS Billing & 80mm Thermal Slip studio view.
 */

/**
 * Renders the POS Billing Studio HTML component.
 * @param {Object} options
 * @param {string} [options.studioId] - Active studio identifier
 * @returns {string} HTML markup
 */
export function renderPosStudioView({ studioId }) {
  const isVisible = studioId === 'pos-billing-studio';
  return `
    <!-- Dedicated Minimal POS Billing Studio -->
    <div id="pos-billing-studio" style="display: ${isVisible ? 'block' : 'none'}; padding: 0.5rem 0;">
      <div class="gst-mobile-view-switcher" id="pos-mobile-view-switcher">
        <button type="button" class="gst-view-tab-btn active" id="pos-tab-form" onclick="window.setPosStudioView('form')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          <span>Edit Counter Bill</span>
        </button>
        <button type="button" class="gst-view-tab-btn" id="pos-tab-preview" onclick="window.setPosStudioView('preview')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
          <span>Live Slip Preview</span>
        </button>
        <button type="button" class="gst-view-tab-btn" id="pos-tab-split" onclick="window.setPosStudioView('split')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="12" y1="3" x2="12" y2="21"></line></svg>
          <span>Split View</span>
        </button>
      </div>

      <div class="gst-studio-container" id="pos-studio-container">
        <!-- Left Form Panel -->
        <div class="gst-form-panel" id="pos-form-panel">
          <div class="gst-panel-header">
            <div class="gst-panel-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7b61ff" stroke-width="2"><circle cx="8" cy="21" r="1"></circle><circle cx="19" cy="21" r="1"></circle><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path></svg>
              <span>Minimal POS Billing & Thermal Slip Studio</span>
            </div>
          </div>

          <!-- Store Info -->
          <div class="gst-section-card">
            <div class="gst-section-title">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
              <span>Store / Merchant Branding</span>
            </div>
            <div class="gst-grid-2">
              <input type="text" id="pos-store-name" placeholder="Store Name *" value="Quick Bites & Retail" oninput="updatePosReceiptPreview()" class="gst-input" />
              <input type="text" id="pos-tagline" placeholder="Tagline / Department" value="Fresh Coffee & Bakery" oninput="updatePosReceiptPreview()" class="gst-input" />
            </div>
            <div class="gst-grid-2" style="margin-top: 0.5rem;">
              <input type="text" id="pos-address" placeholder="Store Address, Location" value="Shop 12, Ground Floor, Central Plaza" oninput="updatePosReceiptPreview()" class="gst-input" />
              <input type="text" id="pos-phone" placeholder="Phone Number" value="+91 98765 43210" oninput="updatePosReceiptPreview()" class="gst-input" />
            </div>
          </div>

          <!-- Order / Bill Meta -->
          <div class="gst-section-card">
            <div class="gst-section-title">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              <span>Counter & Token Meta</span>
            </div>
            <div class="gst-grid-2">
              <input type="text" id="pos-order-num" placeholder="Order / Token #" value="ORD-1042" oninput="updatePosReceiptPreview()" class="gst-input" />
              <input type="datetime-local" id="pos-datetime" oninput="updatePosReceiptPreview()" class="gst-input" />
            </div>
            <div class="gst-grid-2" style="margin-top: 0.5rem;">
              <input type="text" id="pos-cashier" placeholder="Cashier / Counter" value="Counter 01" oninput="updatePosReceiptPreview()" class="gst-input" />
              <select id="pos-payment-mode" class="gst-input" onchange="updatePosReceiptPreview()">
                <option value="Cash" selected>Payment: Cash</option>
                <option value="UPI">Payment: UPI</option>
                <option value="Card">Payment: Card / POS</option>
              </select>
            </div>
          </div>

          <!-- Line Items Table -->
          <div class="gst-section-card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <div class="gst-section-title" style="margin-bottom: 0;">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                <span>Itemized Counter Items</span>
              </div>
              <button type="button" class="mono-copy" onclick="addPosItemRow()" style="padding: 0.25rem 0.6rem; font-size: 0.75rem; border: 1px dashed var(--accent); background: rgba(123, 97, 255, 0.1); color: var(--accent); cursor: pointer;">
                + Add Item
              </button>
            </div>
            <div style="overflow-x: auto;">
              <table class="gst-items-table" style="width: 100%;">
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th style="width: 65px; text-align: center;">Qty</th>
                    <th style="width: 85px; text-align: right;">Rate (₹)</th>
                    <th style="width: 85px; text-align: right;">Total</th>
                    <th style="width: 40px; text-align: center;"></th>
                  </tr>
                </thead>
                <tbody id="pos-items-tbody"></tbody>
              </table>
            </div>
          </div>

          <!-- Discount, Tax & UPI -->
          <div class="gst-section-card">
            <div class="gst-section-title">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
              <span>Discounts, Tax & Instant QR</span>
            </div>
            <div class="gst-grid-2">
              <div>
                <label class="gst-label mono-copy">Discount (%)</label>
                <input type="number" id="pos-discount" min="0" max="100" step="1" placeholder="0" value="0" oninput="updatePosReceiptPreview()" class="gst-input" />
              </div>
              <div>
                <label class="gst-label mono-copy">Tax / GST (%)</label>
                <input type="number" id="pos-tax" min="0" max="100" step="1" placeholder="5" value="5" oninput="updatePosReceiptPreview()" class="gst-input" />
              </div>
            </div>
            <div class="gst-grid-2" style="margin-top: 0.5rem;">
              <div>
                <label class="gst-label mono-copy">UPI VPA (for instant counter QR)</label>
                <input type="text" id="pos-upi-id" placeholder="merchant@upi" value="quickbites@okaxis" oninput="updatePosReceiptPreview()" class="gst-input" />
              </div>
              <div>
                <label class="gst-label mono-copy">Footer Greeting</label>
                <input type="text" id="pos-footer-msg" placeholder="Thank You! Visit Again." value="Thank You! Visit Again." oninput="updatePosReceiptPreview()" class="gst-input" />
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="gst-action-bar" style="display: flex; gap: 0.75rem;">
            <button type="button" class="paper-cta-btn group" onclick="generatePosReceiptPdf()" style="flex: 2; justify-content: center;">
              <span class="cta-fill"></span>
              <span class="relative z-10 flex items-center justify-center gap-2 mono-copy" style="font-size: 0.78rem; text-transform: uppercase;">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                <span>Download Thermal Receipt PDF</span>
              </span>
            </button>
            <button type="button" class="mono-copy" onclick="window.print()" style="flex: 1; height: 38px; border: 1px dashed var(--border); background: var(--bg-elevated); color: var(--text-primary); font-size: 0.75rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.4rem;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
              <span>Print Slip</span>
            </button>
          </div>
        </div>

        <!-- Right Live Thermal Preview -->
        <div class="gst-preview-panel" id="pos-preview-panel">
          <div class="gst-preview-toolbar">
            <div class="gst-preview-badge mono-copy">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              <span>LIVE 80MM THERMAL SLIP PREVIEW</span>
            </div>
          </div>
          <div style="background: var(--bg-elevated); padding: 1.5rem; display: flex; justify-content: center; border: 1px dashed var(--border);">
            <div id="pos-receipt-preview-content" style="width: 290px; background: #fff; padding: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.12); border-radius: 2px;"></div>
          </div>
        </div>
      </div>
    </div>
  `;
}
