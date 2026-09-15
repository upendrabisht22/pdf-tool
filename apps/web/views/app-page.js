/**
 * DocPlatform Main Tool Application View
 * Renders the responsive document canvas, dropzone, signature/GST studios,
 * dynamic SEO metadata, JSON-LD schema, how-to guides, and FAQ accordions.
 */

const TOOL_ICONS_MAP = {
  'merge-pdf': '📑', 'split-pdf': '✂️', 'compress-pdf': '⚡', 'rotate-pdf': '🔄',
  'delete-pdf-pages': '🗑️', 'extract-pages': '📑', 'jpg-to-pdf': '🖼️', 'pdf-to-jpg': '📷',
  'word-to-pdf': '📄', 'excel-to-pdf': '📊', 'pdf-to-word': '📝', 'pdf-to-excel': '📈',
  'watermark-pdf': '💧', 'page-numbers-pdf': '🔢', 'strip-metadata-pdf': '🧹', 'sign-pdf': '📜',
  'draw-signature': '✍️', 'flatten-pdf': '📄', 'repair-pdf': '🛠️', 'protect-pdf': '🔒',
  'unlock-pdf': '🔓', 'redact-pdf': '🛡️', 'ocr-pdf': '👁️', 'compare-pdf': '⚖️',
  'ai-summarize': '💡', 'ai-ask': '🤖', 'ai-extract-table': '📋', 'pipeline': '⚡',
  'pdf-to-markdown': '📝', 'markdown-to-pdf': '📄', 'gst-invoice-pdf': '🧾'
};

export function getToolCategory(key) {
  if (['merge-pdf', 'split-pdf', 'compress-pdf', 'rotate-pdf', 'delete-pdf-pages', 'extract-pages'].includes(key)) return { name: 'Core PDF', link: '/merge-pdf' };
  if (['word-to-pdf', 'excel-to-pdf', 'pdf-to-word', 'pdf-to-excel', 'jpg-to-pdf', 'pdf-to-jpg', 'pdf-to-markdown', 'markdown-to-pdf'].includes(key)) return { name: 'Conversions', link: '/pdf-to-word' };
  if (['watermark-pdf', 'page-numbers-pdf', 'strip-metadata-pdf', 'sign-pdf', 'draw-signature', 'flatten-pdf', 'repair-pdf', 'protect-pdf', 'unlock-pdf', 'redact-pdf'].includes(key)) return { name: 'Security & Sign', link: '/protect-pdf' };
  if (['ocr-pdf', 'compare-pdf', 'ai-summarize', 'ai-ask', 'ai-extract-table'].includes(key)) return { name: 'AI & OCR', link: '/ai-ask' };
  if (['gst-invoice-pdf'].includes(key)) return { name: 'Business & Tax', link: '/gst-invoice-pdf' };
  return { name: 'PDF Tools', link: '/merge-pdf' };
}

export function getRelatedToolsList(key) {
  const map = {
    'pdf-to-word': ['word-to-pdf', 'compress-pdf', 'ocr-pdf', 'protect-pdf', 'pdf-to-excel', 'merge-pdf'],
    'word-to-pdf': ['pdf-to-word', 'compress-pdf', 'merge-pdf', 'protect-pdf', 'sign-pdf', 'excel-to-pdf'],
    'pdf-to-excel': ['excel-to-pdf', 'ai-extract-table', 'pdf-to-word', 'compress-pdf'],
    'excel-to-pdf': ['pdf-to-excel', 'word-to-pdf', 'compress-pdf', 'merge-pdf'],
    'merge-pdf': ['split-pdf', 'compress-pdf', 'rotate-pdf', 'pdf-to-word', 'protect-pdf'],
    'split-pdf': ['merge-pdf', 'extract-pages', 'delete-pdf-pages', 'compress-pdf'],
    'compress-pdf': ['merge-pdf', 'pdf-to-word', 'protect-pdf', 'redact-pdf'],
    'protect-pdf': ['unlock-pdf', 'watermark-pdf', 'redact-pdf', 'sign-pdf'],
    'unlock-pdf': ['protect-pdf', 'compress-pdf', 'pdf-to-word', 'merge-pdf'],
    'ai-ask': ['ai-summarize', 'ai-extract-table', 'ocr-pdf', 'pdf-to-word'],
    'ai-summarize': ['ai-ask', 'ai-extract-table', 'ocr-pdf', 'compress-pdf'],
    'ocr-pdf': ['pdf-to-word', 'ai-ask', 'compress-pdf', 'searchable-pdf'],
    'redact-pdf': ['protect-pdf', 'strip-metadata-pdf', 'flatten-pdf', 'watermark-pdf'],
    'draw-signature': ['sign-pdf', 'flatten-pdf', 'protect-pdf', 'compress-pdf'],
    'pdf-to-markdown': ['markdown-to-pdf', 'pdf-to-word', 'ai-summarize', 'ocr-pdf'],
    'markdown-to-pdf': ['pdf-to-markdown', 'word-to-pdf', 'compress-pdf', 'merge-pdf'],
    'gst-invoice-pdf': ['sign-pdf', 'protect-pdf', 'pdf-to-excel', 'compress-pdf'],
  };
  return map[key] || ['merge-pdf', 'pdf-to-word', 'compress-pdf', 'ai-ask'];
}

export function renderAppPage({ toolConfig, jsonLd, category, relatedSlugs, renderNavbar, renderFooter, TOOL_REGISTRY }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${toolConfig.metaTitle}</title>
  <meta name="description" content="${toolConfig.metaDescription}">
  <meta name="keywords" content="${toolConfig.keywords.join(', ')}">
  <link rel="canonical" href="${toolConfig.canonicalUrl}">
  <link rel="stylesheet" href="/styles.css?v=2.3">
  <script src="https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
  <script type="application/ld+json">
    ${JSON.stringify(jsonLd.webAppSchema)}
  </script>
  <script type="application/ld+json">
    ${JSON.stringify(jsonLd.howToSchema)}
  </script>
  <script type="application/ld+json">
    ${JSON.stringify(jsonLd.faqSchema)}
  </script>
</head>
<body>
  ${renderNavbar(category.name === 'AI & OCR' ? 'ai' : 'tools')}

  <!-- Interactive Category & Tool Navigation -->
  <div class="tool-navigation-wrapper">
    <div class="tool-tabs" id="tool-tabs-container"></div>
  </div>

  <!-- Main Experience Canvas -->
  <main class="main-content">
    <!-- Breadcrumb Navigation for Dedicated Tool Pages -->
    <nav class="breadcrumb-bar" id="breadcrumb-bar" aria-label="Breadcrumb">
      <a href="/">Home</a>
      <span class="breadcrumb-sep">/</span>
      <a href="${category.link}" id="breadcrumb-cat">${category.name}</a>
      <span class="breadcrumb-sep">/</span>
      <span class="breadcrumb-current" id="breadcrumb-current">${toolConfig.title}</span>
    </nav>

    <section class="hero-section">
      <div class="hero-badge-pill">
        <span>🔒</span>
        <span id="hero-badge-text">${toolConfig.features[0] || '100% Private In-Browser Processing'}</span>
      </div>
      <h1 class="hero-title" id="hero-title">${toolConfig.title}</h1>
      <p class="hero-subtitle" id="hero-subtitle">${toolConfig.metaDescription}</p>
    </section>

    <!-- Interactive Dropzone & Workspace -->
    <div class="workspace-card">
      <input type="file" id="file-input" style="display:none;" />
      <input type="file" id="add-more-input" style="display:none;" />

      <!-- Dedicated Signature Creator Studio -->
      <div id="signature-studio" style="display: none; padding: 0.5rem;">
        <div style="display: flex; gap: 0.75rem; margin-bottom: 1.25rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.75rem;">
          <button type="button" id="sig-tab-draw" class="category-pill-btn active" onclick="switchSignatureTab('draw')">✍️ Draw Signature on Screen</button>
          <button type="button" id="sig-tab-upload" class="category-pill-btn" onclick="switchSignatureTab('upload')">📁 Upload & Compress Photo</button>
        </div>

        <!-- Draw Mode Sub-view -->
        <div id="sig-draw-view">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; flex-wrap: wrap; gap: 0.5rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; font-weight: 600; color: var(--text-secondary);">
              <span>Ink Color:</span>
              <button type="button" class="sig-color-btn" onclick="setSignatureInk('#0f172a')" style="width: 24px; height: 24px; border-radius: 50%; background: #0f172a; border: 2px solid #3b82f6; cursor: pointer;"></button>
              <button type="button" class="sig-color-btn" onclick="setSignatureInk('#1d4ed8')" style="width: 24px; height: 24px; border-radius: 50%; background: #1d4ed8; border: 2px solid transparent; cursor: pointer;"></button>
              <button type="button" class="sig-color-btn" onclick="setSignatureInk('#047857')" style="width: 24px; height: 24px; border-radius: 50%; background: #047857; border: 2px solid transparent; cursor: pointer;"></button>
            </div>
            <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; font-weight: 600; color: var(--text-secondary);">
              <span>Pen Thickness:</span>
              <select id="sig-studio-stroke" onchange="setSignatureStroke(this.value)" class="select-control">
                <option value="2">Fine (2px)</option>
                <option value="3" selected>Standard (3px)</option>
                <option value="4.5">Bold (4.5px)</option>
              </select>
            </div>
          </div>

          <!-- In-Page Canvas -->
          <div style="border: 2px dashed var(--border-subtle); border-radius: 12px; background: #ffffff; margin-bottom: 1rem; overflow: hidden; position: relative;">
            <canvas id="sig-studio-canvas" width="600" height="200" style="touch-action: none; cursor: crosshair; display: block; width: 100%; height: 200px; background: #ffffff;"></canvas>
          </div>

          <!-- Optimization Preset Grid -->
          <div style="background: var(--bg-subtle); border: 1px solid var(--border-subtle); border-radius: 10px; padding: 1rem; margin-bottom: 1.25rem; display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div>
              <label style="font-size: 0.78rem; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 0.35rem;">TARGET FILE SIZE</label>
              <select id="sig-studio-maxkb" class="select-control" style="width: 100%; font-weight: 700;">
                <option value="30" selected>&lt; 30 KB (Standard Defense / UPSC)</option>
                <option value="20">&lt; 20 KB (Strict Govt Form)</option>
                <option value="50">&lt; 50 KB (SSC / Banking)</option>
                <option value="0">Original Resolution</option>
              </select>
            </div>
            <div>
              <label style="font-size: 0.78rem; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 0.35rem;">IMAGE FORMAT</label>
              <select id="sig-studio-format" class="select-control" style="width: 100%;">
                <option value="jpeg" selected>JPG (Crisp White Background)</option>
                <option value="png">PNG (Transparent / Lossless)</option>
                <option value="webp">WebP (Ultra Compact)</option>
              </select>
            </div>
          </div>

          <!-- Action Buttons -->
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
            <button type="button" class="select-control" onclick="clearStudioSignaturePad()" style="cursor: pointer; padding: 0.6rem 1.2rem;">↺ Clear Drawing Board</button>
            <button type="button" class="process-btn" onclick="downloadStudioSignature()" style="padding: 0.7rem 1.8rem; font-size: 1rem; cursor: pointer;">
              📥 Download Compressed Signature (&lt;30 KB)
            </button>
          </div>
        </div>

        <!-- Upload Mode Sub-view -->
        <div id="sig-upload-view" style="display: none;">
          <div class="dropzone" id="sig-upload-dropzone" onclick="document.getElementById('file-input').click()" style="border-style: dashed; padding: 2.5rem 1.5rem;">
            <div class="dropzone-icon-box">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
            </div>
            <h3 style="font-size: 1.2rem; font-weight: 700; color: var(--text-hero); margin-bottom: 0.35rem;">Select Signature Photo from Phone / PC</h3>
            <p style="font-size: 0.88rem; color: var(--text-secondary); margin-bottom: 1.25rem;">Drop any phone camera photo of your handwritten signature here to auto-compress strictly under 30 KB.</p>
            <button type="button" class="upload-btn"><span>Choose Signature Image</span></button>
          </div>
        </div>
      </div>

      <!-- Dedicated Professional GST Invoice Studio -->
      <div id="gst-invoice-studio" style="display: none; padding: 0.5rem 0;">
        <!-- Mobile/Tablet View Mode Switcher -->
        <div class="gst-mobile-view-switcher" id="gst-mobile-view-switcher">
          <button type="button" class="gst-view-tab-btn active" id="gst-tab-form" onclick="window.setGstStudioView('form')">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            <span>Edit Form</span>
          </button>
          <button type="button" class="gst-view-tab-btn" id="gst-tab-preview" onclick="window.setGstStudioView('preview')">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            <span>Live A4 Preview</span>
          </button>
          <button type="button" class="gst-view-tab-btn" id="gst-tab-split" onclick="window.setGstStudioView('split')">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="12" y1="3" x2="12" y2="21"></line></svg>
            <span>Split View</span>
          </button>
        </div>

        <div class="gst-studio-container" id="gst-studio-container">
          <!-- Left: Invoice Editor Form -->
          <div class="gst-form-panel" id="gst-form-panel">
            <div class="gst-panel-header">
              <div class="gst-panel-title">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--brand-primary);"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                <span>GST Tax Invoice Studio</span>
              </div>
              <div class="gst-theme-picker">
                <span style="font-size: 0.8rem; color: var(--text-secondary); font-weight: 600;">Theme:</span>
                <select id="gst-theme-select" class="select-control" onchange="updateGstInvoicePreview()" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;">
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
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><path d="M9 22v-4h6v4"></path><path d="M8 6h.01"></path><path d="M16 6h.01"></path><path d="M8 10h.01"></path><path d="M16 10h.01"></path><path d="M8 14h.01"></path><path d="M16 14h.01"></path></svg>
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
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
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
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                <span>Invoice Meta & Tax Mode</span>
              </div>
              <div class="gst-grid-3">
                <div>
                  <label class="gst-label">Invoice Number</label>
                  <input type="text" id="gst-inv-number" value="INV-2026-001" oninput="updateGstInvoicePreview()" class="gst-input" />
                </div>
                <div>
                  <label class="gst-label">Invoice Date</label>
                  <input type="date" id="gst-inv-date" oninput="updateGstInvoicePreview()" class="gst-input" />
                </div>
                <div>
                  <label class="gst-label">Tax Type</label>
                  <select id="gst-tax-type" class="gst-input" onchange="updateGstInvoicePreview()">
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
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                  <span>Line Items & Services</span>
                </div>
                <button type="button" class="select-control" onclick="addGstItemRow()" style="font-size: 0.78rem; padding: 0.28rem 0.75rem; display: inline-flex; align-items: center; gap: 4px;">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  <span>Add Item</span>
                </button>
              </div>
              <div class="gst-items-table-wrapper">
                <table class="gst-items-table" id="gst-items-table">
                  <thead>
                    <tr>
                      <th style="min-width: 180px;">Item Description</th>
                      <th style="width: 110px;">HSN/SAC</th>
                      <th style="width: 80px; text-align: center;">Qty</th>
                      <th style="width: 110px; text-align: right;">Rate (₹)</th>
                      <th style="width: 90px; text-align: center;">GST%</th>
                      <th style="width: 44px; text-align: center;"></th>
                    </tr>
                  </thead>
                  <tbody id="gst-items-tbody">
                    <!-- Rows dynamically generated -->
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Banking & UPI QR Setup -->
            <div class="gst-section-card">
              <div class="gst-section-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
                <span>Digital Payment & Bank Details</span>
              </div>
              <div class="gst-grid-2">
                <div>
                  <label class="gst-label">UPI ID (for dynamic QR code)</label>
                  <input type="text" id="gst-upi-id" placeholder="yourbusiness@upi / 9876543210@paytm" value="acmetech@hdfcbank" oninput="updateGstInvoicePreview()" class="gst-input" />
                </div>
                <div>
                  <label class="gst-label">Bank Name</label>
                  <input type="text" id="gst-bank-name" placeholder="Bank Name" value="HDFC Bank" oninput="updateGstInvoicePreview()" class="gst-input" />
                </div>
              </div>
              <div class="gst-grid-2" style="margin-top: 0.5rem;">
                <div>
                  <label class="gst-label">Account Number</label>
                  <input type="text" id="gst-bank-acc" placeholder="Account Number" value="50200012345678" oninput="updateGstInvoicePreview()" class="gst-input" />
                </div>
                <div>
                  <label class="gst-label">IFSC Code</label>
                  <input type="text" id="gst-bank-ifsc" placeholder="IFSC Code" value="HDFC0000123" oninput="updateGstInvoicePreview()" class="gst-input" />
                </div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="gst-action-bar">
              <button type="button" class="process-btn gst-action-btn-download" onclick="generateAndDownloadGstInvoicePdf()">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                <span>Download GST Invoice PDF</span>
              </button>
              <button type="button" class="select-control gst-action-btn-print" onclick="printGstInvoicePreview()">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                <span>Print Invoice</span>
              </button>
            </div>
          </div>

          <!-- Right: Live Real-Time Invoice Document Preview -->
          <div class="gst-preview-panel" id="gst-preview-panel">
            <div class="gst-preview-toolbar">
              <div class="gst-preview-badge">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                <span>LIVE A4 VECTOR PREVIEW</span>
              </div>
              <span id="gst-preview-tax-badge" class="gst-preview-tax-mode">Intra-State (CGST 9% + SGST 9%)</span>
            </div>
            <div class="gst-paper" id="gst-paper">
              <!-- Live Invoice Content rendered in real-time -->
            </div>
          </div>
        </div>
      </div>

      <!-- Drag and drop zone -->
      <div class="dropzone" id="dropzone">
        <div class="dropzone-icon-box">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="12" y1="18" x2="12" y2="12"></line>
            <line x1="9" y1="15" x2="15" y2="15"></line>
          </svg>
        </div>
        <h2 class="dropzone-title" id="dropzone-title">Select PDF files</h2>
        <p class="dropzone-desc" id="dropzone-desc">or drop PDFs here. Instant client-side verification with zero data upload.</p>
        <button class="upload-btn">
          <span id="dropzone-btn-text">Select PDF files</span>
        </button>
      </div>

      <!-- File Staging Area -->
      <div class="staging-area" id="staging-area">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--text-hero);">Selected Documents</h3>
          <button class="select-control" id="add-more-btn" onclick="document.getElementById('add-more-input').click()">+ Add More Files</button>
        </div>

        <div class="files-grid" id="files-grid"></div>

        <!-- Action Controls -->
        <div class="action-bar">
          <div class="options-group" id="tool-options-container"></div>
          <button class="process-btn" id="process-btn">
            <span id="process-btn-text">Merge PDF Files</span>
          </button>
        </div>
      </div>

      <!-- Progress Tracking (Dynamic Real-Time Live Status) -->
      <div class="progress-container" id="progress-container">
        <div class="progress-header-box">
          <div class="progress-spinner" id="progress-spinner"></div>
          <div class="progress-titles">
            <h3 id="progress-status-text" class="progress-status-text">Processing Document...</h3>
            <p id="progress-sub-status" class="progress-sub-status">Analyzing document structure & vector glyphs...</p>
          </div>
        </div>
        <div class="progress-bar-track">
          <div class="progress-bar-fill" id="progress-bar-fill"></div>
        </div>
        <div class="progress-meta-row">
          <span class="progress-percent" id="progress-percent">0%</span>
          <span class="progress-timer" id="progress-timer">⏱️ 0.0s</span>
        </div>
      </div>

      <!-- Result / Success Card (Modern Framer Motion Redesign) -->
      <div class="result-card" id="result-card">
        <div class="result-icon-box">✓</div>
        <h3 class="result-title" id="result-title">Document Processed Successfully!</h3>
        <p class="result-subtitle" id="result-subtitle">Your optimized document has been generated, sanitized, and verified.</p>
        
        <div class="result-file-info" id="result-file-info">
          <div class="result-file-main">
            <span class="result-file-icon" id="result-file-icon">📄</span>
            <div>
              <div class="result-file-name" id="result-file-name">document.pdf</div>
              <div class="result-file-meta" id="result-file-meta">Verified • Client-Side Secure</div>
            </div>
          </div>
          <span class="result-file-badge" id="result-file-badge">PDF</span>
        </div>

        <!-- AI Response & Preview Box (For AI Summaries, Q&A, and Extracted Tables) -->
        <div class="result-ai-preview" id="result-ai-preview" style="display: none;">
          <div class="result-ai-header">
            <span class="result-ai-badge">🤖 AI Intelligence Preview</span>
            <button type="button" class="result-ai-copy-btn" id="result-ai-copy-btn" onclick="copyAiPreviewText()">📋 Copy Text</button>
          </div>
          <div class="result-ai-body" id="result-ai-body"></div>
        </div>

        <div>
          <a href="#" class="download-action-btn" id="download-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            <span id="download-btn-text">Download Document</span>
          </a>
        </div>

        <div class="result-actions-row">
          <button class="result-secondary-btn" id="result-secondary-btn" onclick="resetWorkspace()">↻ Convert Another File</button>
        </div>

        <!-- Next Steps Recommendations -->
        <div class="next-steps-container">
          <div class="next-steps-label">⚡ Next Recommended Actions</div>
          <div class="next-steps-chips" id="next-steps-chips">
            <a href="/compress-pdf" class="next-step-chip"><span>⚡ Compress File Size</span></a>
            <a href="/protect-pdf" class="next-step-chip"><span>🔒 Protect with Password</span></a>
            <a href="/sign-pdf" class="next-step-chip"><span>✍️ Sign Document</span></a>
          </div>
        </div>
      </div>
    </div>

    <!-- Tool-Specific Content & Smart Backlinks Section -->
    <div class="tool-content-wrapper" id="tool-content-wrapper">
      <!-- 1. Tool-Specific How-To Guide -->
      <section class="tool-howto-section" style="margin-bottom: 3.5rem;">
        <h2 class="tool-section-heading">How to use this tool</h2>
        <p class="tool-section-subheading">Follow these simple steps to process your document in seconds.</p>
        <div class="tool-steps-grid" id="tool-steps-container">
          ${toolConfig.howToSteps.map((step, idx) => `
            <div class="tool-step-card">
              <div class="tool-step-badge">${idx + 1}</div>
              <h3 class="tool-step-title">${step.name}</h3>
              <p class="tool-step-desc">${step.text}</p>
            </div>
          `).join('')}
        </div>
      </section>

      <!-- 2. Tool-Specific Key Features -->
      <section class="tool-features-section" style="margin-bottom: 3.5rem;">
        <h2 class="tool-section-heading">Key Features & Security</h2>
        <p class="tool-section-subheading">Engineered with precision vector geometry, high-fidelity font preservation, and zero data storage.</p>
        <div class="tool-features-grid" id="tool-features-container">
          ${toolConfig.features.map((feat, idx) => `
            <div class="tool-feature-card">
              <div class="tool-feature-icon">${idx === 0 ? '🔒' : idx === 1 ? '⚡' : '✨'}</div>
              <h3 class="tool-feature-title">Feature ${idx + 1}</h3>
              <p class="tool-feature-desc">${feat}</p>
            </div>
          `).join('')}
        </div>
      </section>

      <!-- 3. Smart Related Tools & High-Converting Backlinks -->
      <section class="related-tools-section">
        <h2 class="tool-section-heading" style="margin-bottom: 0.5rem;">Related Document Tools</h2>
        <p class="tool-section-subheading" style="margin-bottom: 2rem;">Explore complementary tools to edit, convert, and secure your files.</p>
        <div class="related-tools-grid" id="related-tools-container">
          ${relatedSlugs.slice(0, 4).map(slug => {
            const relTool = TOOL_REGISTRY[slug];
            if (!relTool) return '';
            return `
              <a href="/${slug}" class="related-tool-card">
                <span class="related-tool-icon">${TOOL_ICONS_MAP[slug] || '📄'}</span>
                <span class="related-tool-title">${relTool.title}</span>
                <span class="related-tool-desc">${relTool.metaDescription.substring(0, 80)}...</span>
              </a>
            `;
          }).join('')}
        </div>
      </section>

      <!-- 4. Tool-Specific FAQ Accordion -->
      <section class="faq-container" id="faq" style="margin-top: 3.5rem;">
        <h2 class="tool-section-heading">Frequently Asked Questions</h2>
        <p class="tool-section-subheading">Everything you need to know about this tool and security standards.</p>
        <div id="faq-list-container">
          ${toolConfig.faqs.map(faq => `
            <div class="faq-item">
              <div class="faq-question">
                <span>${faq.question}</span>
                <div class="faq-icon">+</div>
              </div>
              <div class="faq-answer">${faq.answer}</div>
            </div>
          `).join('')}
        </div>
      </section>
    </div>
  </main>

  ${renderFooter()}
  <script type="module" src="/app.js?v=3.2"></script>
</body>
</html>`;
}

// CommonJS fallback
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    renderAppPage,
    getToolCategory,
    getRelatedToolsList
  };
}
