/**
 * @file views/studios/estimate-studio-view.js
 * @description Dedicated Project Estimate & Quotation Maker studio view.
 */

/**
 * Renders the Estimate Maker Studio HTML component.
 * @param {Object} options
 * @param {string} [options.studioId] - Active studio identifier
 * @returns {string} HTML markup
 */
export function renderEstimateStudioView({ studioId }) {
  const isVisible = studioId === 'estimate-studio';
  return `
    <!-- Dedicated Project Estimate & Quotation Studio -->
    <div id="estimate-studio" style="display: ${isVisible ? 'block' : 'none'}; padding: 0.5rem 0;">
      <div class="gst-mobile-view-switcher" id="est-mobile-view-switcher">
        <button type="button" class="gst-view-tab-btn active" id="est-tab-form" onclick="window.setEstimateStudioView('form')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          <span>Edit Estimate</span>
        </button>
        <button type="button" class="gst-view-tab-btn" id="est-tab-preview" onclick="window.setEstimateStudioView('preview')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
          <span>Proposal Preview</span>
        </button>
        <button type="button" class="gst-view-tab-btn" id="est-tab-split" onclick="window.setEstimateStudioView('split')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="12" y1="3" x2="12" y2="21"></line></svg>
          <span>Split View</span>
        </button>
      </div>

      <div class="gst-studio-container" id="estimate-studio-container">
        <!-- Left Form Panel -->
        <div class="gst-form-panel" id="estimate-form-panel">
          <div class="gst-panel-header">
            <div class="gst-panel-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7b61ff" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
              <span>Estimates & Quotation Studio</span>
            </div>
          </div>

          <!-- Business Info -->
          <div class="gst-section-card">
            <div class="gst-section-title">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
              <span>Provider / Agency Branding</span>
            </div>
            <div class="gst-grid-2">
              <input type="text" id="est-biz-name" placeholder="Business / Agency Name *" value="Vertex Studio & Engineering" oninput="updateEstimatePreview()" class="gst-input" />
              <input type="text" id="est-biz-contact" placeholder="Email & Phone" value="hello@vertexstudio.io • +1 (555) 234-5678" oninput="updateEstimatePreview()" class="gst-input" />
            </div>
            <div style="margin-top: 0.5rem;">
              <input type="text" id="est-biz-addr" placeholder="Business Address" value="101 Cyber Tech Park, Innovation Way" oninput="updateEstimatePreview()" class="gst-input" />
            </div>
          </div>

          <!-- Quote & Client Info -->
          <div class="gst-section-card">
            <div class="gst-section-title">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><polyline points="17 11 19 13 23 9"></polyline></svg>
              <span>Client & Project Details</span>
            </div>
            <div class="gst-grid-2">
              <input type="text" id="est-number" placeholder="Estimate #" value="EST-2026-084" oninput="updateEstimatePreview()" class="gst-input" />
              <input type="date" id="est-date" oninput="updateEstimatePreview()" class="gst-input" />
            </div>
            <div class="gst-grid-2" style="margin-top: 0.5rem;">
              <input type="date" id="est-valid-date" placeholder="Valid Until" oninput="updateEstimatePreview()" class="gst-input" />
              <input type="text" id="est-currency" placeholder="Currency Symbol ($, ₹, €, £)" value="$" oninput="updateEstimatePreview()" class="gst-input" />
            </div>
            <div class="gst-grid-2" style="margin-top: 0.5rem;">
              <input type="text" id="est-client-name" placeholder="Client Name *" value="Acme Enterprises" oninput="updateEstimatePreview()" class="gst-input" />
              <input type="text" id="est-client-company" placeholder="Client Company / Org" value="Global Digital Solutions" oninput="updateEstimatePreview()" class="gst-input" />
            </div>
            <div class="gst-grid-2" style="margin-top: 0.5rem;">
              <input type="text" id="est-client-addr" placeholder="Client Address" value="450 Lexington Ave, New York, NY" oninput="updateEstimatePreview()" class="gst-input" />
              <input type="text" id="est-prj-title" placeholder="Project Scope Title" value="Enterprise Cloud & Document Platform Development" oninput="updateEstimatePreview()" class="gst-input" />
            </div>
          </div>

          <!-- Deliverables Scope Items Table -->
          <div class="gst-section-card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <div class="gst-section-title" style="margin-bottom: 0;">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
                <span>Scope Deliverables & Pricing</span>
              </div>
              <button type="button" class="mono-copy" onclick="addEstimateItemRow()" style="padding: 0.25rem 0.6rem; font-size: 0.75rem; border: 1px dashed var(--accent); background: rgba(123, 97, 255, 0.1); color: var(--accent); cursor: pointer;">
                + Add Deliverable
              </button>
            </div>
            <div style="overflow-x: auto;">
              <table class="gst-items-table" style="width: 100%;">
                <thead>
                  <tr>
                    <th>Deliverable Description</th>
                    <th style="width: 75px; text-align: center;">Unit</th>
                    <th style="width: 65px; text-align: center;">Qty</th>
                    <th style="width: 85px; text-align: right;">Rate</th>
                    <th style="width: 90px; text-align: right;">Amount</th>
                    <th style="width: 40px; text-align: center;"></th>
                  </tr>
                </thead>
                <tbody id="est-items-tbody"></tbody>
              </table>
            </div>
          </div>

          <!-- Commercial Terms -->
          <div class="gst-section-card">
            <div class="gst-section-title">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
              <span>Discounts, Taxes & Commercial Terms</span>
            </div>
            <div class="gst-grid-2">
              <div>
                <label class="gst-label mono-copy">Discount (%)</label>
                <input type="number" id="est-discount" min="0" max="100" step="1" placeholder="0" value="0" oninput="updateEstimatePreview()" class="gst-input" />
              </div>
              <div>
                <label class="gst-label mono-copy">Estimated Tax (%)</label>
                <input type="number" id="est-tax" min="0" max="100" step="1" placeholder="0" value="0" oninput="updateEstimatePreview()" class="gst-input" />
              </div>
            </div>
            <div style="margin-top: 0.5rem;">
              <label class="gst-label mono-copy">Terms & Conditions</label>
              <textarea id="est-terms" rows="3" class="gst-input" oninput="updateEstimatePreview()" style="font-size: 0.8rem; line-height: 1.4;">1. Validity: This quotation remains valid for 30 calendar days from the date of issue.
2. Payment Terms: 50% advance upon project initiation, 50% upon final sign-off & milestone handover.
3. Out-of-Scope: Any additional requests outside the documented scope will be estimated separately.</textarea>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="gst-action-bar" style="display: flex; gap: 0.75rem;">
            <button type="button" class="paper-cta-btn group" onclick="generateEstimatePdf()" style="flex: 2; justify-content: center;">
              <span class="cta-fill"></span>
              <span class="relative z-10 flex items-center justify-center gap-2 mono-copy" style="font-size: 0.78rem; text-transform: uppercase;">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                <span>Download Estimate PDF</span>
              </span>
            </button>
            <button type="button" class="mono-copy" onclick="window.print()" style="flex: 1; height: 38px; border: 1px dashed var(--border); background: var(--bg-elevated); color: var(--text-primary); font-size: 0.75rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.4rem;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
              <span>Print</span>
            </button>
          </div>
        </div>

        <!-- Right Live Preview -->
        <div class="gst-preview-panel" id="estimate-preview-panel">
          <div class="gst-preview-toolbar">
            <div class="gst-preview-badge mono-copy">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              <span>LIVE PROJECT ESTIMATE PREVIEW</span>
            </div>
          </div>
          <div class="gst-paper" style="padding: 1.5rem; background: var(--bg-elevated); border: 1px dashed var(--border);">
            <div id="estimate-preview-content" style="max-width: 580px; margin: 0 auto; box-shadow: 0 4px 16px rgba(0,0,0,0.1);"></div>
          </div>
        </div>
      </div>
    </div>
  `;
}
