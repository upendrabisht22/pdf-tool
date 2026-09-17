/**
 * @file modules/tool-registry.js
 * @description Centralized metadata registry for all document processing tools.
 */

export const TOOL_DEFINITIONS = {
  // ── Core PDF Tools ──────────────────────────────────────────────────────────
  'merge-pdf': {
    category: 'core',
    title: 'Merge PDF Online',
    badge: '100% Private Local Processing',
    subtitle: 'Combine multiple PDF files into one clean, high-resolution document in seconds.',
    actionName: 'Merge PDF Files',
    multiple: true,
    accept: '.pdf,application/pdf',
    optionsHtml: `
      <label style="font-size: 0.85rem; color: var(--text-secondary); display: flex; align-items: center; gap: 0.5rem;">
        <input type="checkbox" id="opt-normalize" checked> Normalize Page Dimensions
      </label>
    `
  },
  'split-pdf': {
    category: 'core',
    title: 'Split PDF Online',
    badge: 'Extract & Separate Pages',
    subtitle: 'Separate PDF pages into standalone documents or extract custom page ranges.',
    actionName: 'Split PDF Document',
    multiple: false,
    accept: '.pdf,application/pdf',
    optionsHtml: `
      <select id="opt-split-mode" class="select-control">
        <option value="all-pages">Split Every Page</option>
        <option value="ranges">Custom Page Ranges (e.g. 1-2, 3)</option>
      </select>
      <input type="text" id="opt-split-ranges" placeholder="e.g. 1-3, 4" class="select-control" style="display:none; width: 140px;" />
    `
  },
  'compress-pdf': {
    category: 'core',
    title: 'Compress PDF Online',
    badge: 'Shrink File Size Without Quality Loss',
    subtitle: 'Reduce document size while maintaining crisp vector fonts and clear imagery.',
    actionName: 'Compress PDF Now',
    multiple: false,
    accept: '.pdf,application/pdf',
    optionsHtml: `
      <select id="opt-compress-level" class="select-control">
        <option value="recommended">Recommended Compression (Good quality, small size)</option>
        <option value="extreme">Extreme Compression (Smallest size, email ready)</option>
        <option value="low">Low Compression (Maximum quality preservation)</option>
      </select>
    `
  },
  'rotate-pdf': {
    category: 'core',
    title: 'Rotate PDF Online',
    badge: 'Permanent Orientation Fix',
    subtitle: 'Rotate individual pages or entire documents 90°, 180°, or 270° clockwise.',
    actionName: 'Rotate PDF Document',
    multiple: false,
    accept: '.pdf,application/pdf',
    optionsHtml: `
      <select id="opt-rotate-angle" class="select-control">
        <option value="90">Rotate 90° Clockwise</option>
        <option value="180">Rotate 180° Upside Down</option>
        <option value="270">Rotate 270° (90° Counter-Clockwise)</option>
      </select>
      <select id="opt-rotate-pages" class="select-control">
        <option value="all">All Pages</option>
        <option value="custom">Specific Pages (e.g. 1, 3-5)</option>
        <option value="odd">Odd Pages Only</option>
        <option value="even">Even Pages Only</option>
      </select>
      <input type="text" id="opt-rotate-custom-pages" placeholder="e.g. 1, 3-5" class="select-control" style="display:none; width: 140px;" />
    `
  },
  'delete-pdf-pages': {
    category: 'core',
    title: 'Delete PDF Pages',
    badge: 'Trim Unwanted Content',
    subtitle: 'Remove unwanted pages and download a clean, streamlined PDF.',
    actionName: 'Delete Pages & Export',
    multiple: false,
    accept: '.pdf,application/pdf',
    optionsHtml: `
      <input type="text" id="opt-delete-pages" placeholder="Pages to delete (e.g. 2, 4-6)" class="select-control" style="width: 240px;" />
    `
  },
  'extract-pages': {
    category: 'core',
    title: 'Extract PDF Pages',
    badge: 'Select & Save Specific Pages',
    subtitle: 'Extract specific pages or page ranges from your PDF into a clean, unified document.',
    actionName: 'Extract Pages & Save',
    multiple: false,
    accept: '.pdf,application/pdf',
    optionsHtml: `
      <input type="text" id="opt-extract-pages" placeholder="Pages to extract (e.g. 1-3, 5)" class="select-control" style="width: 240px;" />
    `
  },
  'crop-pdf': {
    category: 'core',
    title: 'Crop & Resize PDF Online',
    badge: 'Precision Margin Trimming & Standard Sizing',
    subtitle: 'Crop document margins, trim white borders, and resize pages to standard A4, Letter, and Legal formats.',
    actionName: 'Crop & Resize Document',
    multiple: false,
    accept: '.pdf,application/pdf',
    optionsHtml: `
      <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: center; margin-bottom: 0.5rem;">
        <select id="opt-crop-mode" class="select-control" onchange="window.toggleCropMode(this.value)">
          <option value="trim" selected>Trim Margins (Crop Bounding Box)</option>
          <option value="resize">Resize Page Dimensions (A4, Letter, etc.)</option>
        </select>
        <select id="opt-crop-unit" class="select-control">
          <option value="mm" selected>Millimeters (mm)</option>
          <option value="pt">Points (pt)</option>
          <option value="in">Inches (in)</option>
        </select>
        <select id="opt-crop-pages" class="select-control" onchange="const c = document.getElementById('opt-crop-custom-pages'); if(c) c.style.display = this.value === 'custom' ? 'inline-block' : 'none';">
          <option value="all" selected>All Pages</option>
          <option value="odd">Odd Pages Only</option>
          <option value="even">Even Pages Only</option>
          <option value="custom">Custom Range (e.g. 1-3)</option>
        </select>
        <input type="text" id="opt-crop-custom-pages" placeholder="e.g. 1-3, 5" class="select-control" style="display:none; width: 120px;" />
      </div>
      <div id="crop-trim-inputs" style="display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center;">
        <input type="number" id="opt-crop-top" placeholder="Top (e.g. 10)" value="10" min="0" step="1" class="select-control" style="width: 100px;" title="Top Margin" />
        <input type="number" id="opt-crop-bottom" placeholder="Bottom (e.g. 10)" value="10" min="0" step="1" class="select-control" style="width: 100px;" title="Bottom Margin" />
        <input type="number" id="opt-crop-left" placeholder="Left (e.g. 10)" value="10" min="0" step="1" class="select-control" style="width: 100px;" title="Left Margin" />
        <input type="number" id="opt-crop-right" placeholder="Right (e.g. 10)" value="10" min="0" step="1" class="select-control" style="width: 100px;" title="Right Margin" />
      </div>
      <div id="crop-resize-inputs" style="display: none; gap: 0.5rem; flex-wrap: wrap; align-items: center;">
        <select id="opt-resize-size" class="select-control">
          <option value="A4" selected>A4 (210 × 297 mm)</option>
          <option value="LETTER">US Letter (8.5 × 11 in)</option>
          <option value="LEGAL">US Legal (8.5 × 14 in)</option>
          <option value="A3">A3 (297 × 420 mm)</option>
          <option value="A5">A5 (148 × 210 mm)</option>
        </select>
        <select id="opt-resize-scale" class="select-control">
          <option value="fit" selected>Scale content to fit</option>
          <option value="pad">Keep original scale & pad center</option>
        </select>
      </div>
    `
  },
  'jpg-to-pdf': {
    category: 'convert',
    title: 'JPG / PNG / WebP to PDF Converter',
    badge: 'Compile Images to PDF',
    subtitle: 'Convert images (JPG, PNG, WebP) into a high-resolution, organized PDF document.',
    actionName: 'Convert Images to PDF',
    multiple: true,
    accept: 'image/png,image/jpeg,image/webp,image/*,.png,.jpg,.jpeg,.webp',
    optionsHtml: `
      <select id="opt-image-pagesize" class="select-control">
        <option value="A4">A4 Standard</option>
        <option value="FIT_IMAGE">Fit to Image Size</option>
        <option value="LETTER">US Letter</option>
      </select>
      <select id="opt-image-orientation" class="select-control">
        <option value="auto">Auto Orientation</option>
        <option value="portrait">Portrait</option>
        <option value="landscape">Landscape</option>
      </select>
    `
  },
  'pdf-to-jpg': {
    category: 'convert',
    title: 'PDF to JPG / PNG / WebP Converter',
    badge: 'High-Resolution Image Extraction',
    subtitle: 'Extract all pages from your PDF as crisp high-resolution PNG, JPEG, or WebP images.',
    actionName: 'Convert PDF to Images',
    multiple: false,
    accept: '.pdf,application/pdf',
    optionsHtml: `
      <select id="opt-img-format" class="select-control">
        <option value="png">PNG (Lossless Vector Quality)</option>
        <option value="jpeg">JPEG (Compressed Web Photos)</option>
        <option value="webp">WebP (Compact Modern Web)</option>
      </select>
      <select id="opt-img-dpi" class="select-control">
        <option value="150">150 DPI (Standard Quality)</option>
        <option value="300">300 DPI (High-Resolution Print)</option>
        <option value="72">72 DPI (Web / Screen Preview)</option>
        <option value="600">600 DPI (Ultra HD Print)</option>
      </select>
    `
  },

  // ── Office Conversions ──────────────────────────────────────────────────────
  'word-to-pdf': {
    category: 'convert',
    title: 'Word to PDF Converter',
    badge: '100% Vector Layout Fidelity',
    subtitle: 'Convert Word documents (DOCX, DOC, RTF) to PDF with Hindi ligatures & Urdu RTL support.',
    actionName: 'Convert Word to PDF',
    multiple: false,
    accept: '.docx,.doc,.rtf,.odt,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword',
    optionsHtml: `
      <select id="opt-word-orientation" class="select-control">
        <option value="auto">Respect Document Layout</option>
        <option value="portrait">Force Portrait</option>
        <option value="landscape">Force Landscape</option>
      </select>
    `
  },
  'excel-to-pdf': {
    category: 'convert',
    title: 'Excel to PDF Converter',
    badge: 'Table & Currency Formatting Preserved',
    subtitle: 'Convert spreadsheets (XLSX, XLS, CSV) into clean PDF tables with automatic column fitting.',
    actionName: 'Convert Excel to PDF',
    multiple: false,
    accept: '.xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel',
    optionsHtml: `
      <label style="font-size: 0.85rem; color: var(--text-secondary); display: flex; align-items: center; gap: 0.5rem;">
        <input type="checkbox" id="opt-excel-fit" checked> Fit Columns to Page Width
      </label>
      <label style="font-size: 0.85rem; color: var(--text-secondary); display: flex; align-items: center; gap: 0.5rem; margin-left: 1rem;">
        <input type="checkbox" id="opt-excel-grid" checked> Render Gridlines
      </label>
    `
  },
  'pdf-to-word': {
    category: 'convert',
    title: 'PDF to Word Converter',
    badge: 'Editable DOCX Reconstruction',
    subtitle: 'Convert PDF documents into editable Microsoft Word (.docx) files with flowing text.',
    actionName: 'Convert PDF to Word',
    multiple: false,
    accept: '.pdf,application/pdf',
    optionsHtml: `
      <select id="opt-pdf2word-layout" class="select-control">
        <option value="flowing">Flowing Text (Easily Editable)</option>
        <option value="exact">Exact Visual Layout (Fixed Frames)</option>
      </select>
    `
  },
  'pdf-to-excel': {
    category: 'convert',
    title: 'PDF to Excel Converter',
    badge: 'Automated Tabular Data Extraction',
    subtitle: 'Extract tabular statements, invoices, and records from PDF into clean Excel spreadsheets.',
    actionName: 'Extract to Excel (.xlsx)',
    multiple: false,
    accept: '.pdf,application/pdf',
    optionsHtml: `
      <label style="font-size: 0.85rem; color: var(--text-secondary); display: flex; align-items: center; gap: 0.5rem;">
        <input type="checkbox" id="opt-excel-tabs" checked> Separate Sheet Tab per Page
      </label>
    `
  },

  // ── Security & Advanced Tools ───────────────────────────────────────────────
  'watermark-pdf': {
    category: 'security',
    title: 'Watermark PDF Online',
    badge: 'Custom Text & Stamp Positioning',
    subtitle: 'Add custom security stamps or watermarks to your PDF pages with adjustable opacity.',
    actionName: 'Apply Watermark',
    multiple: false,
    accept: '.pdf,application/pdf',
    optionsHtml: `
      <input type="text" id="opt-watermark-text" placeholder="Watermark Text (e.g. CONFIDENTIAL)" value="CONFIDENTIAL" class="select-control" style="width: 200px;" />
      <select id="opt-watermark-opacity" class="select-control">
        <option value="0.3">30% Opacity (Subtle)</option>
        <option value="0.5">50% Opacity (Standard)</option>
        <option value="0.8">80% Opacity (Prominent)</option>
      </select>
    `
  },
  'page-numbers-pdf': {
    category: 'security',
    title: 'Add Page Numbers to PDF',
    badge: 'Custom Header & Footer Numbering',
    subtitle: 'Insert customizable page numbers into your PDF document with exact placement.',
    actionName: 'Insert Page Numbers',
    multiple: false,
    accept: '.pdf,application/pdf',
    optionsHtml: `
      <select id="opt-pagenum-pos" class="select-control">
        <option value="bottom-center">Bottom Center</option>
        <option value="bottom-right">Bottom Right</option>
        <option value="top-right">Top Right</option>
      </select>
      <select id="opt-pagenum-format" class="select-control">
        <option value="Page {n} of {total}">Page 1 of N</option>
        <option value="{n} / {total}">1 / N</option>
        <option value="{n}">1, 2, 3...</option>
      </select>
    `
  },
  'strip-metadata-pdf': {
    category: 'security',
    title: 'Sanitize & Strip PDF Metadata',
    badge: 'Zero-Trace Privacy Guard',
    subtitle: 'Wipe all hidden author names, timestamps, GPS tags, and software fingerprints.',
    actionName: 'Strip Metadata & Sanitize',
    multiple: false,
    accept: '.pdf,application/pdf',
    optionsHtml: `
      <label style="font-size: 0.85rem; color: var(--text-secondary); display: flex; align-items: center; gap: 0.5rem;">
        <input type="checkbox" id="opt-strip-all" checked> Wipe Author, Dates & XMP Trees
      </label>
    `
  },
  'sign-pdf': {
    category: 'security',
    title: 'Sign PDF Online',
    badge: 'Digital Verification Stamp',
    subtitle: 'Add a verified digital signature stamp, signer name, and cryptographic timestamp badge.',
    actionName: 'Sign PDF Document',
    multiple: false,
    accept: '.pdf,application/pdf',
    optionsHtml: `
      <input type="text" id="opt-sign-name" placeholder="Signer Full Name (e.g. Yogendra)" value="Yogendra" class="select-control" style="width: 220px;" />
    `
  },
  'draw-signature': {
    category: 'security',
    title: 'Draw & Compress Signature (<30 KB)',
    badge: 'Govt Exam & Defense Portal Ready',
    subtitle: 'Draw your signature on screen or upload a photo to compress strictly under 20KB, 30KB, or 50KB for online forms.',
    actionName: 'Compress & Download Signature',
    multiple: false,
    accept: 'image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp',
    optionsHtml: ``
  },
  'edit-pdf': {
    category: 'security',
    title: 'Visual PDF Editor & Form Filler',
    badge: '100% In-Browser Interactive Vector Editor',
    subtitle: 'Add text, erase with whiteout, draw annotations, place checkmarks, and sign documents with zero server upload.',
    actionName: 'Open Visual PDF Editor',
    multiple: false,
    accept: '.pdf,application/pdf',
    optionsHtml: ``
  },
  'flatten-pdf': {
    category: 'security',
    title: 'Flatten PDF Forms & Layers',
    badge: 'Print-Ready Vector Locking',
    subtitle: 'Flatten interactive form fields and annotations into permanent, read-only PDF vectors.',
    actionName: 'Flatten PDF Layers',
    multiple: false,
    accept: '.pdf,application/pdf',
    optionsHtml: `
      <label style="font-size: 0.85rem; color: var(--text-secondary); display: flex; align-items: center; gap: 0.5rem;">
        <input type="checkbox" id="opt-flatten-forms" checked> Lock All Form Fields & Text Inputs
      </label>
    `
  },
  'repair-pdf': {
    category: 'security',
    title: 'Repair Corrupted PDF',
    badge: 'XRef & Trailer Dictionary Rebuilder',
    subtitle: 'Reconstruct broken cross-reference tables and recover inaccessible PDF pages.',
    actionName: 'Repair & Recover PDF',
    multiple: false,
    accept: '.pdf,application/pdf',
    optionsHtml: `
      <label style="font-size: 0.85rem; color: var(--text-secondary); display: flex; align-items: center; gap: 0.5rem;">
        <input type="checkbox" id="opt-repair-xref" checked> Rebuild XRef Table & Streams
      </label>
    `
  },
  'protect-pdf': {
    category: 'security',
    title: 'Protect PDF with Password',
    badge: 'AES Password Encryption',
    subtitle: 'Encrypt your PDF documents with secure password protection and permission restrictions.',
    actionName: 'Encrypt & Protect PDF',
    multiple: false,
    accept: '.pdf,application/pdf',
    optionsHtml: `
      <input type="password" id="opt-protect-pass" placeholder="Enter Secure Password" class="select-control" style="width: 220px;" />
    `
  },
  'unlock-pdf': {
    category: 'security',
    title: 'Unlock PDF Online',
    badge: 'Remove Restrictions',
    subtitle: 'Remove password protection from your authorized PDF files for unrestricted access.',
    actionName: 'Unlock PDF Document',
    multiple: false,
    accept: '.pdf,application/pdf',
    optionsHtml: `
      <input type="password" id="opt-unlock-pass" placeholder="Enter Current Password" class="select-control" style="width: 220px;" />
    `
  },
  'redact-pdf': {
    category: 'security',
    title: 'Redact PDF Online',
    badge: 'Zero-Leak Permanent Blackout',
    subtitle: 'Permanently remove and black out sensitive data, PII, and financial records with zero data leak.',
    actionName: 'Permanently Redact PDF',
    multiple: false,
    accept: '.pdf,application/pdf',
    optionsHtml: `
      <input type="text" id="opt-redact-label" placeholder="Replacement Label (e.g. [REDACTED])" value="[REDACTED]" class="select-control" style="width: 220px;" />
      <label style="font-size: 0.85rem; color: var(--text-secondary); display: flex; align-items: center; gap: 0.5rem; margin-top: 0.5rem;">
        <input type="checkbox" id="opt-redact-meta" checked> Sanitize Search Metadata & XMP
      </label>
    `
  },

  // ── AI & Document Intelligence ──────────────────────────────────────────────
  'ocr-pdf': {
    category: 'ai',
    title: 'OCR Scanned PDF to Searchable Document',
    badge: 'Multilingual Optical Character Recognition',
    subtitle: 'Convert scanned PDF documents and camera images into searchable text-selectable PDFs.',
    actionName: 'Run Optical Character Recognition',
    multiple: false,
    accept: '.pdf,image/png,image/jpeg,.png,.jpg',
    optionsHtml: `
      <select id="opt-ocr-lang" class="select-control">
        <option value="eng">English (eng)</option>
        <option value="hin">Hindi (hin - Devanagari)</option>
        <option value="spa">Spanish (spa)</option>
        <option value="fra">French (fra)</option>
        <option value="deu">German (deu)</option>
        <option value="ara">Arabic (ara)</option>
      </select>
      <select id="opt-ocr-out" class="select-control">
        <option value="searchable-pdf">Searchable Sandwich PDF</option>
        <option value="text">Plain Text (.txt)</option>
        <option value="json">Structured JSON (hOCR)</option>
      </select>
    `
  },
  'compare-pdf': {
    category: 'ai',
    title: 'Compare 2 PDF Documents',
    badge: 'Visual Diff & Change Highlights',
    subtitle: 'Compare two PDF versions to highlight additions (cyan) and removals (crimson) automatically.',
    actionName: 'Generate Comparison Report',
    multiple: true,
    accept: '.pdf,application/pdf',
    optionsHtml: `
      <select id="opt-compare-mode" class="select-control">
        <option value="visual-diff">Visual Diff Overlay (Colored Highlights)</option>
        <option value="side-by-side">Side-by-Side Dual-Pane Canvas</option>
      </select>
    `
  },
  'ai-summarize': {
    category: 'ai',
    title: 'AI Document Summarizer',
    badge: 'Hierarchical Map-Reduce (100+ Pages)',
    subtitle: 'Summarize extensive contracts, filings, and books into structured executive takeaways.',
    actionName: 'Generate AI Executive Summary',
    multiple: false,
    accept: '.pdf,application/pdf',
    optionsHtml: `
      <select id="opt-sum-mode" class="select-control">
        <option value="executive">Executive Summary (Key Takeaways & Metrics)</option>
        <option value="brief">Brief (1 Concise Paragraph)</option>
        <option value="deep">Deep Dive (Detailed Section Analysis)</option>
      </select>
      <select id="opt-sum-focus" class="select-control">
        <option value="all">Comprehensive Analysis</option>
        <option value="financials">Financial & Numerical Focus</option>
        <option value="legal-obligations">Legal Obligations & Risks</option>
      </select>
    `
  },
  'ai-ask': {
    category: 'ai',
    title: 'AI Document Q&A (Chat with PDF)',
    badge: 'Grounded Citations (Zero Hallucinations)',
    subtitle: 'Ask any question to your document and receive verifiable answers with exact [Page X] citations.',
    actionName: 'Ask Document Intelligence',
    multiple: false,
    accept: '.pdf,application/pdf',
    optionsHtml: `
      <input type="text" id="opt-ask-query" placeholder="Ask a question (e.g. What are the payment deadlines?)" class="select-control" style="width: 320px;" />
    `
  },
  'ai-extract-table': {
    category: 'ai',
    title: 'AI Table & Financial Record Extractor',
    badge: 'Structured Data Extraction',
    subtitle: 'Extract financial statements, invoices, and data tables from PDFs into clean CSV, JSON, or Markdown tables.',
    actionName: 'Extract Structured Tables',
    multiple: false,
    accept: '.pdf,application/pdf',
    optionsHtml: `
      <select id="opt-table-format" class="select-control">
        <option value="csv" selected>Standard CSV Spreadsheet (.csv)</option>
        <option value="json">Structured JSON Records (.json)</option>
        <option value="markdown">Markdown Table (.md)</option>
      </select>
    `
  },
  'pdf-to-markdown': {
    category: 'convert',
    title: 'PDF to Markdown Converter',
    badge: 'Structure & Table Aware',
    subtitle: 'Convert PDF documents into clean, structured Markdown (.md) with headings, code blocks, lists, and formatted tables.',
    actionName: 'Convert to Markdown (.md)',
    multiple: false,
    accept: '.pdf,application/pdf',
    optionsHtml: `
      <label style="font-size: 0.85rem; color: var(--text-secondary); display: flex; align-items: center; gap: 0.5rem;">
        <input type="checkbox" id="opt-md-tables" checked> Preserve Tables in GFM Format
      </label>
      <label style="font-size: 0.85rem; color: var(--text-secondary); display: flex; align-items: center; gap: 0.5rem; margin-top: 0.5rem;">
        <input type="checkbox" id="opt-md-page-break" checked> Include Page Break Dividers (---)
      </label>
    `
  },
  'markdown-to-pdf': {
    category: 'convert',
    title: 'Markdown to PDF Converter',
    badge: 'Vector Typography & Styling',
    subtitle: 'Compile GitHub-flavored Markdown (.md) into crisp, high-resolution vector PDF documents with custom styling.',
    actionName: 'Compile to PDF (.pdf)',
    multiple: false,
    accept: '.md,.markdown,text/markdown,text/plain',
    optionsHtml: `
      <select id="opt-md-pagesize" class="select-control">
        <option value="A4" selected>A4 Standard (210 x 297 mm)</option>
        <option value="Letter">US Letter (8.5 x 11 in)</option>
      </select>
      <select id="opt-md-theme" class="select-control">
        <option value="modern" selected>Modern Clean (Helvetica)</option>
        <option value="technical">Technical / Code (Courier)</option>
      </select>
    `
  },
  'gst-invoice-pdf': {
    category: 'business',
    title: 'Professional GST & Tax Invoice Generator',
    badge: 'Split-Screen Live Studio & Dynamic UPI QR',
    subtitle: 'Create 100% compliant Indian GST tax invoices with instant vector PDF generation and scannable UPI QR code.',
    actionName: 'Generate GST Invoice PDF',
    multiple: false,
    accept: '.pdf,application/pdf',
    optionsHtml: ``
  },
  'pos-billing': {
    category: 'business',
    title: 'Minimal POS Billing & Thermal Slip Maker',
    badge: 'Split-Screen Live Thermal Preview & UPI QR',
    subtitle: 'Generate clean retail counter receipts and standard 80mm thermal paper slips with instant print and vector PDF export.',
    actionName: 'Generate POS Receipt PDF',
    multiple: false,
    accept: '.pdf,application/pdf',
    optionsHtml: ``
  },
  'clean-billing': {
    category: 'business',
    title: 'Minimal POS Billing & Thermal Slip Maker',
    badge: 'Split-Screen Live Thermal Preview & UPI QR',
    subtitle: 'Generate clean retail counter receipts and standard 80mm thermal paper slips with instant print and vector PDF export.',
    actionName: 'Generate POS Receipt PDF',
    multiple: false,
    accept: '.pdf,application/pdf',
    optionsHtml: ``
  },
  'tax-receipt': {
    category: 'business',
    title: 'Tax Receipt & 80G Donation Receipt Maker',
    badge: 'Certificate-Grade 80G Exemption Receipt Studio',
    subtitle: 'Create official Section 80G charitable donation receipts, Trust exemption certificates, and deduction slips in seconds.',
    actionName: 'Generate 80G Receipt PDF',
    multiple: false,
    accept: '.pdf,application/pdf',
    optionsHtml: ``
  },
  'estimate-maker': {
    category: 'business',
    title: 'Estimates & Quotation Maker',
    badge: 'Live Scope Proposal & Acceptance Sign-off',
    subtitle: 'Create professional project estimates, client sales proposals, and proforma quotations with deliverables grids and terms.',
    actionName: 'Generate Estimate PDF',
    multiple: false,
    accept: '.pdf,application/pdf',
    optionsHtml: ``
  },
  'flatten-pdf': {
    category: 'core',
    title: 'Flatten PDF Online',
    badge: 'Lock Interactive Forms & Markup',
    subtitle: 'Convert fillable form fields and annotations into permanent, read-only static pages.',
    actionName: 'Flatten PDF Document',
    multiple: false,
    accept: '.pdf,application/pdf',
    optionsHtml: ``
  },
  'repair-pdf': {
    category: 'core',
    title: 'Repair PDF Online',
    badge: 'Fix Corrupted & Damaged Files',
    subtitle: 'Recover unreadable PDF files with automatic cross-reference reconstruction and stream repair.',
    actionName: 'Repair & Recover PDF',
    multiple: false,
    accept: '.pdf,application/pdf',
    optionsHtml: ``
  },
  'page-numbers-pdf': {
    category: 'security',
    title: 'Add Page Numbers to PDF',
    badge: 'Custom Alignment & Numbering Styles',
    subtitle: 'Insert clean automated page numbers and headers/footers with custom positioning and numbering formats.',
    actionName: 'Apply Page Numbers',
    multiple: false,
    accept: '.pdf,application/pdf',
    optionsHtml: `
      <select id="opt-page-pos" class="select-control">
        <option value="bottom-right" selected>Bottom Right</option>
        <option value="bottom-center">Bottom Center</option>
        <option value="bottom-left">Bottom Left</option>
        <option value="top-right">Top Right</option>
        <option value="top-center">Top Center</option>
        <option value="top-left">Top Left</option>
      </select>
      <select id="opt-page-format" class="select-control">
        <option value="n" selected>1, 2, 3</option>
        <option value="page-n">Page 1, Page 2</option>
        <option value="page-n-of-total">Page 1 of 5</option>
      </select>
    `
  },
  'strip-metadata-pdf': {
    category: 'security',
    title: 'Privacy Scanner & Strip Metadata',
    badge: 'Purge Hidden PII & Tracking Tags',
    subtitle: 'Sanitize confidential PDFs by removing author names, creation software history, and hidden metadata.',
    actionName: 'Sanitize & Strip Metadata',
    multiple: false,
    accept: '.pdf,application/pdf',
    optionsHtml: ``
  },
  'ai-extract-table': {
    category: 'ai',
    title: 'Extract Tables from PDF',
    badge: 'AI & Layout Reconstruction to Excel / JSON',
    subtitle: 'Extract complex tabular data from PDF invoices, bank statements, and reports into Excel (.xlsx) and CSV.',
    actionName: 'Extract Tables Now',
    multiple: false,
    accept: '.pdf,application/pdf',
    optionsHtml: `
      <select id="opt-table-format" class="select-control">
        <option value="excel" selected>Microsoft Excel (.xlsx)</option>
        <option value="csv">Comma-Separated Values (.csv)</option>
        <option value="json">Structured JSON (.json)</option>
      </select>
    `
  },
  'crop-pdf': {
    category: 'core',
    title: 'Crop & Resize PDF',
    badge: 'Trim Margins & Standard Paper Sizing',
    subtitle: 'Trim unwanted white space or margins from PDF pages, or resize pages to standard A4, Letter, or Legal dimensions.',
    actionName: 'Crop & Resize PDF',
    multiple: false,
    accept: '.pdf,application/pdf',
    optionsHtml: `
      <div style="display: flex; flex-direction: column; gap: 0.75rem; width: 100%;">
        <div style="display: flex; gap: 0.5rem; align-items: center;">
          <span style="font-weight: 600; color: var(--text-primary);">Mode:</span>
          <select id="opt-crop-mode" class="select-control" onchange="window.toggleCropMode(this.value)">
            <option value="trim" selected>Trim Margins</option>
            <option value="resize">Resize to Standard Paper</option>
          </select>
        </div>
        <div id="crop-trim-inputs" style="display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center;">
          <span>Top: <input type="number" id="opt-crop-top" value="20" min="0" style="width: 50px; padding: 2px 4px; background: var(--bg); border: 1px solid var(--border); color: var(--text-primary);"></span>
          <span>Bottom: <input type="number" id="opt-crop-bottom" value="20" min="0" style="width: 50px; padding: 2px 4px; background: var(--bg); border: 1px solid var(--border); color: var(--text-primary);"></span>
          <span>Left: <input type="number" id="opt-crop-left" value="20" min="0" style="width: 50px; padding: 2px 4px; background: var(--bg); border: 1px solid var(--border); color: var(--text-primary);"></span>
          <span>Right: <input type="number" id="opt-crop-right" value="20" min="0" style="width: 50px; padding: 2px 4px; background: var(--bg); border: 1px solid var(--border); color: var(--text-primary);"></span>
          <select id="opt-crop-unit" class="select-control">
            <option value="pt" selected>Points (pt)</option>
            <option value="mm">Millimeters (mm)</option>
            <option value="in">Inches (in)</option>
          </select>
        </div>
        <div id="crop-resize-inputs" style="display: none; gap: 0.5rem; flex-wrap: wrap; align-items: center;">
          <span>Paper Size:</span>
          <select id="opt-crop-target-size" class="select-control">
            <option value="A4" selected>A4 (210 × 297 mm)</option>
            <option value="LETTER">US Letter (8.5 × 11 in)</option>
            <option value="LEGAL">US Legal (8.5 × 14 in)</option>
            <option value="A3">A3 (297 × 420 mm)</option>
            <option value="A5">A5 (148 × 210 mm)</option>
          </select>
          <span>Fit Mode:</span>
          <select id="opt-crop-scale-mode" class="select-control">
            <option value="fit" selected>Scale & Center</option>
            <option value="stretch">Stretch to Fill</option>
            <option value="pad">Pad Canvas</option>
          </select>
        </div>
      </div>
    `
  },
  'edit-pdf': {
    category: 'core',
    title: 'Visual PDF Editor',
    badge: '100% In-Browser Interactive Studio',
    subtitle: 'Add text, whiteout typos, draw freehand lines, highlight, add stamps, and insert signatures directly on your PDF pages.',
    actionName: 'Open Visual PDF Editor',
    multiple: false,
    accept: '.pdf,application/pdf',
    optionsHtml: ``
  },
  'pdf-editor': {
    category: 'core',
    title: 'Visual PDF Editor',
    badge: '100% In-Browser Interactive Studio',
    subtitle: 'Add text, whiteout typos, draw freehand lines, highlight, add stamps, and insert signatures directly on your PDF pages.',
    actionName: 'Open Visual PDF Editor',
    multiple: false,
    accept: '.pdf,application/pdf',
    optionsHtml: ``
  }
};

export const TOOL_ICONS = {
  'merge-pdf': '📑',
  'split-pdf': '✂️',
  'compress-pdf': '⚡',
  'rotate-pdf': '🔄',
  'delete-pdf-pages': '🗑️',
  'extract-pages': '📑',
  'jpg-to-pdf': '🖼️',
  'pdf-to-jpg': '📷',
  'word-to-pdf': '📄',
  'excel-to-pdf': '📊',
  'pdf-to-word': '📝',
  'pdf-to-excel': '📈',
  'watermark-pdf': '💧',
  'page-numbers-pdf': '🔢',
  'strip-metadata-pdf': '🧹',
  'sign-pdf': '📜',
  'draw-signature': '✍️',
  'flatten-pdf': '📄',
  'repair-pdf': '🛠️',
  'protect-pdf': '🔒',
  'unlock-pdf': '🔓',
  'redact-pdf': '🛡️',
  'ocr-pdf': '👁️',
  'compare-pdf': '⚖️',
  'ai-summarize': '💡',
  'ai-ask': '🤖',
  'ai-extract-table': '📋',
  'pdf-to-markdown': '📝',
  'markdown-to-pdf': '📄',
  'gst-invoice-pdf': '🧾',
  'pos-billing': '🧾',
  'clean-billing': '🧾',
  'tax-receipt': '📜',
  'estimate-maker': '📊',
  'crop-pdf': '✂️',
  'edit-pdf': '📝',
  'pdf-editor': '📝',
  'resize-pdf': '✂️',
  'pipeline': '⚡'
};

export const TOOL_DETAILS_DATA = {
  'merge-pdf': {
    category: 'Core PDF', categoryLink: '/merge-pdf',
    features: ['Zero-upload client-side processing for ultimate speed and privacy', 'Drag-and-drop file reordering with live page preview', 'Preserves high-resolution images, bookmarks, and form fields'],
    howToSteps: [
      { name: 'Upload PDFs', text: 'Select and drag your PDF documents into the drop zone.' },
      { name: 'Arrange Order', text: 'Drag files or pages to set your desired reading order.' },
      { name: 'Merge & Download', text: 'Click "Merge PDF" to combine instantly and download your unified document.' }
    ],
    faqs: [
      { question: 'Is my data safe when merging PDFs?', answer: 'Yes. Lightweight merges are processed locally right in your browser. Your files never leave your computer.' },
      { question: 'How many PDF files can I combine at once?', answer: 'You can merge up to 50 files simultaneously for free.' },
      { question: 'Will combining PDFs reduce document quality?', answer: 'No. The original vector fidelity, fonts, and embedded images are preserved with zero degradation.' }
    ],
    related: ['split-pdf', 'compress-pdf', 'rotate-pdf', 'pdf-to-word']
  },
  'split-pdf': {
    category: 'Core PDF', categoryLink: '/merge-pdf',
    features: ['Split by custom page ranges (e.g. 1-5, 8, 11-14)', 'Extract every single page into separate standalone files', 'Instant client-side extraction with zero lag'],
    howToSteps: [
      { name: 'Upload PDF', text: 'Drop your PDF file into the splitter.' },
      { name: 'Select Pages', text: 'Choose your desired page ranges or split every page.' },
      { name: 'Download', text: 'Download your extracted PDF files individually or as a ZIP archive.' }
    ],
    faqs: [
      { question: 'Can I extract non-consecutive pages?', answer: 'Yes! Specify ranges like 1-3, 5, 8-10 in the split configuration.' }
    ],
    related: ['merge-pdf', 'extract-pages', 'delete-pdf-pages', 'compress-pdf']
  },
  'compress-pdf': {
    category: 'Core PDF', categoryLink: '/merge-pdf',
    features: ['Three intelligent compression levels tailored for email and web', 'Smart vector preservation ensuring crisp, readable typography', 'Real-time compression ratio and size savings calculator'],
    howToSteps: [
      { name: 'Upload PDF', text: 'Select the PDF file you want to shrink.' },
      { name: 'Choose Preset', text: 'Select Extreme, Recommended, or High Quality compression.' },
      { name: 'Download', text: 'Get your lightweight PDF ready for email and sharing.' }
    ],
    faqs: [
      { question: 'How much can I reduce my PDF size?', answer: 'Most PDFs are reduced between 40% and 85% depending on embedded images and fonts.' }
    ],
    related: ['merge-pdf', 'pdf-to-word', 'protect-pdf', 'redact-pdf']
  },
  'pdf-to-word': {
    category: 'Conversions', categoryLink: '/pdf-to-word',
    features: ['Reconstructs native Word tables (<w:tbl>) from vector grids', 'Preserves original font families, sizes, and layout structure', 'Auto-rasterizes barcode and custom symbol spans at 300 DPI'],
    howToSteps: [
      { name: 'Upload PDF', text: 'Select or drag your PDF document into the workspace.' },
      { name: 'Reconstruct', text: 'Our Python/WASM engine analyzes structure, fonts, and tables.' },
      { name: 'Download Word', text: 'Download and edit your native .docx file in Microsoft Word or Google Docs.' }
    ],
    faqs: [
      { question: 'Can I edit the converted Word file?', answer: 'Yes! The output is a standard OpenXML .docx file compatible with Microsoft Word, LibreOffice, and Google Docs.' },
      { question: 'Are tables and barcodes preserved accurately?', answer: 'Yes. Our high-fidelity engine reconstructs native Word tables and renders specialized barcode fonts as high-res 300 DPI inline images.' }
    ],
    related: ['word-to-pdf', 'compress-pdf', 'ocr-pdf', 'protect-pdf']
  },
  'word-to-pdf': {
    category: 'Conversions', categoryLink: '/pdf-to-word',
    features: ['Universal font rendering with HarfBuzz engine (Devanagari, Arabic, Latin)', 'Preserves margins, headings, bullet lists, and complex table layouts', 'Supports DOCX, DOC, RTF, ODT, and TXT files'],
    howToSteps: [
      { name: 'Upload Word File', text: 'Select or drag your .docx or .doc file into the converter.' },
      { name: 'Convert', text: 'Our engine compiles the document layout into clean vector PDF.' },
      { name: 'Download PDF', text: 'Download your high-resolution PDF instantly.' }
    ],
    faqs: [
      { question: 'Are non-English scripts supported?', answer: 'Yes! Our HarfBuzz engine has universal Unicode fonts installed for Hindi, Urdu, Arabic, Spanish, French, and currencies.' }
    ],
    related: ['pdf-to-word', 'compress-pdf', 'merge-pdf', 'protect-pdf']
  },
  'ai-ask': {
    category: 'AI & OCR', categoryLink: '/ai-ask',
    features: ['Hybrid Vector + BM25 retrieval for high-precision fact retrieval', 'Grounded citations: every answer references exact page numbers and source quotes', 'Zero-hallucination constraint architecture with BYOK Gemini key'],
    howToSteps: [
      { name: 'Upload Document', text: 'Select your PDF document.' },
      { name: 'Ask a Question', text: 'Type your query (e.g. "What are the termination penalties?").' },
      { name: 'Get Answer', text: 'Receive verified answers with clickable page citations.' }
    ],
    faqs: [
      { question: 'How does it prevent hallucinations?', answer: 'The model is strictly constrained to retrieved context chunks and must provide direct source quotes for every claim.' },
      { question: 'Is my Gemini API key secure?', answer: 'Yes. Your key is stored exclusively in your browser localStorage and is never stored on our servers.' }
    ],
    related: ['ai-summarize', 'ai-extract-table', 'ocr-pdf', 'pdf-to-word']
  },
  'ai-summarize': {
    category: 'AI & OCR', categoryLink: '/ai-ask',
    features: ['Hierarchical map-reduce: analyzes full long documents without truncation', 'Executive Overviews, Key Findings, Risk Liabilities, and Numerical Tables', 'Export summary as Markdown or structured text'],
    howToSteps: [
      { name: 'Upload PDF', text: 'Upload any report, contract, or textbook.' },
      { name: 'Choose Focus', text: 'Select Executive, Financial, or Legal focus area.' },
      { name: 'Generate Summary', text: 'Get instant structured takeaways and action items.' }
    ],
    faqs: [
      { question: 'Does it truncate large documents?', answer: 'No. Our hierarchical engine processes every page independently before synthesizing the final summary.' }
    ],
    related: ['ai-ask', 'ai-extract-table', 'compress-pdf', 'pdf-to-word']
  },
  'ocr-pdf': {
    category: 'AI & OCR', categoryLink: '/ai-ask',
    features: ['Sandwich PDF generation: original visual clarity with invisible searchable text', 'Multilingual OCR models (English, Hindi, Spanish, French, German, Arabic)', 'Export to Searchable PDF, Plain Text, or structured JSON'],
    howToSteps: [
      { name: 'Upload Scanned PDF', text: 'Upload your scan or camera document.' },
      { name: 'Select Language', text: 'Pick your document language for optimal recognition.' },
      { name: 'Download Searchable PDF', text: 'Search, select, and copy text directly in your PDF.' }
    ],
    faqs: [
      { question: 'What is a Searchable PDF?', answer: 'A Searchable PDF preserves the exact visual appearance of your scan while placing an invisible text layer behind the image.' }
    ],
    related: ['pdf-to-word', 'ai-ask', 'compress-pdf', 'word-to-pdf']
  },
  'protect-pdf': {
    category: 'Security & Sign', categoryLink: '/protect-pdf',
    features: ['Strong AES-256 encryption standards', 'Granular permission locks for printing, copying, and editing', '100% private in-browser encryption'],
    howToSteps: [
      { name: 'Upload PDF', text: 'Select the file to lock.' },
      { name: 'Set Password', text: 'Enter a strong password to secure the document.' },
      { name: 'Encrypt & Download', text: 'Download your encrypted PDF.' }
    ],
    faqs: [
      { question: 'Can anyone open the file without the password?', answer: 'No. The document cannot be viewed or decrypted without entering the correct password.' }
    ],
    related: ['unlock-pdf', 'watermark-pdf', 'redact-pdf', 'sign-pdf']
  },
  'pdf-to-markdown': {
    category: 'Conversions', categoryLink: '/pdf-to-markdown',
    features: ['Structure-aware heading detection (#, ##, ###) from font sizes', 'Table column alignment & formatting in GitHub Flavored Markdown (GFM)', 'Clean list and code block preservation without broken lines'],
    howToSteps: [
      { name: 'Upload PDF', text: 'Drag and drop your PDF document into the workspace.' },
      { name: 'Configure Options', text: 'Toggle GFM table preservation and page divider breaks.' },
      { name: 'Download Markdown', text: 'Download clean .md file for GitHub, Obsidian, or documentation.' }
    ],
    faqs: [
      { question: 'Does it preserve tables in Markdown format?', answer: 'Yes! Vector tables are automatically recognized and converted into standard GFM Markdown pipes (| col1 | col2 |).' },
      { question: 'Can I edit the extracted Markdown in Obsidian or VS Code?', answer: 'Yes, the generated .md files are 100% standard CommonMark/GFM files ready for any markdown editor.' }
    ],
    related: ['markdown-to-pdf', 'pdf-to-word', 'ai-extract-table', 'ocr-pdf']
  },
  'markdown-to-pdf': {
    category: 'Conversions', categoryLink: '/markdown-to-pdf',
    features: ['Vector PDF compilation with crisp typography and custom margin metrics', 'Syntax-styled code blocks, blockquotes, horizontal rules, and tables', 'Intelligent automatic pagination with header and page numbering'],
    howToSteps: [
      { name: 'Upload Markdown', text: 'Drop your .md or .txt markdown file into the converter.' },
      { name: 'Select Theme', text: 'Choose A4 or Letter, plus Modern or Technical theme.' },
      { name: 'Compile & Download', text: 'Get your professional vector PDF ready for sharing and printing.' }
    ],
    faqs: [
      { question: 'Are code blocks and tables styled properly?', answer: 'Yes. Fenced code blocks are styled with monospaced Courier font and background tints, and tables are formatted with clean borders.' },
      { question: 'Does it handle multi-page documents?', answer: 'Yes. The engine automatically measures vertical text flow and creates new pages with exact margin preservation.' }
    ],
    related: ['pdf-to-markdown', 'word-to-pdf', 'compress-pdf', 'protect-pdf']
  },
  'gst-invoice-pdf': {
    category: 'Business & Tax', categoryLink: '/gst-invoice-pdf',
    features: ['Real-time split-screen interactive live preview studio with instant rendering', 'Automated CGST / SGST intra-state split or IGST inter-state allocation', 'Dynamic UPI QR Code embedding for instant scannable mobile payment'],
    howToSteps: [
      { name: 'Fill Business Details', text: 'Enter your company name, GSTIN, address, and buyer details.' },
      { name: 'Add Invoice Items', text: 'Add line items, HSN/SAC codes, quantities, and GST tax rates.' },
      { name: 'Download Vector PDF', text: 'Instant download of a 100% GST-compliant invoice with UPI payment QR.' }
    ],
    faqs: [
      { question: 'Is the GST invoice compliant with Indian tax guidelines?', answer: 'Yes! It contains all mandatory fields: GSTIN, HSN/SAC codes, Place of Supply, Reverse Charge flag, CGST/SGST/IGST breakdown, and Total Amount in Words.' },
      { question: 'How does the UPI QR Code work?', answer: 'It encodes the standard UPI URI format (upi://pay?pa=...&pn=...&am=...&cu=INR). Customers can scan with Google Pay, PhonePe, or Paytm to pay directly.' },
      { question: 'Is my financial invoice data kept private?', answer: 'Yes. Invoices are generated locally or in ephemeral worker tasks that never log or store your sensitive customer information.' }
    ],
    related: ['pdf-to-excel', 'ai-extract-table', 'draw-signature', 'sign-pdf']
  },
  'pos-billing': {
    category: 'Business & Tax', categoryLink: '/pos-billing',
    features: ['Instant 80mm and 58mm thermal slip generation ready for direct ESC/POS and standard printers', 'Dynamic UPI QR Code embedding for instant counter scannable mobile payments', 'Split-screen live interactive receipt preview with cash calculation and itemization'],
    howToSteps: [
      { name: 'Enter Store & Bill Info', text: 'Enter your business name, counter/terminal ID, and invoice number.' },
      { name: 'Add Items & Rates', text: 'Add line items, quantities, and prices — subtotal and GST compute automatically.' },
      { name: 'Print or Download', text: 'Click Print Thermal Slip or Download PDF for instant paperless receipt generation.' }
    ],
    faqs: [
      { question: 'Can I print directly to my 80mm thermal receipt printer?', answer: 'Yes! Clicking "Print Thermal Slip" opens the native browser print dialogue configured with 80mm receipt dimensions for thermal printers.' },
      { question: 'Is POS billing free and private?', answer: 'Yes, 100% free with unlimited receipts and zero server tracking. All receipt computation runs entirely in your browser.' }
    ],
    related: ['gst-invoice-pdf', 'tax-receipt', 'estimate-maker', 'compress-pdf']
  },
  'tax-receipt': {
    category: 'Business & Tax', categoryLink: '/tax-receipt',
    features: ['Compliant with Section 80G and 12A trust donation receipt guidelines', 'Automated Amount in Words conversion in Indian numbering (Rupees Lakhs & Crores)', 'Statutory tax exemption declaration clause with Trust PAN and 80G URN', 'Official certificate-grade double border, seal, and authorized signatory signature block'],
    howToSteps: [
      { name: 'Enter Trust / NGO Info', text: 'Provide organization name, registration number, 80G URN, and address.' },
      { name: 'Enter Donor Details', text: 'Add donor name, PAN number, address, and donation amount.' },
      { name: 'Download PDF', text: 'Download official certificate-grade tax deduction receipt instantly.' }
    ],
    faqs: [
      { question: 'Is this receipt valid for claiming income tax deduction under Section 80G?', answer: 'Yes, when issued by an eligible registered NGO or trust with valid 80G registration numbers and donor PAN.' },
      { question: 'Does it convert the donation amount to words automatically?', answer: 'Yes! The tool automatically formats the total in standard Indian numbering words (e.g. Rupees Five Thousand Only).' }
    ],
    related: ['gst-invoice-pdf', 'pos-billing', 'estimate-maker', 'sign-pdf']
  },
  'estimate-maker': {
    category: 'Business & Tax', categoryLink: '/estimate-maker',
    features: ['Professional agency and business proposal format with project title and scope', 'Line items table with deliverables, units, quantities, and rates', 'Configurable validity timeline and commercial payment terms', 'Client acceptance signature block for quick formal sign-off'],
    howToSteps: [
      { name: 'Enter Business & Client Details', text: 'Add your business branding and client recipient info.' },
      { name: 'Define Scope & Deliverables', text: 'Add line items, units, quantities, and pricing.' },
      { name: 'Download Proposal PDF', text: 'Download a clean, high-resolution vector PDF quotation ready to send.' }
    ],
    faqs: [
      { question: 'Can I add custom payment terms to the quote?', answer: 'Yes! You can specify delivery timelines, advance payment requirements, and acceptance terms directly on the estimate.' },
      { question: 'Can clients sign off on this quotation?', answer: 'Yes! The document includes a dedicated Client Acceptance & Authorization signature line at the bottom.' }
    ],
    related: ['gst-invoice-pdf', 'pos-billing', 'tax-receipt', 'pdf-to-word']
  },
  'crop-pdf': {
    category: 'Core PDF', categoryLink: '/crop-pdf',
    features: ['Millimeter-accurate margin trimming on all four sides', 'Resize to standard international sheet formats (A4, Letter, Legal, A3, A5)', 'Scale content to fit or pad and center with vector geometry retention'],
    howToSteps: [
      { name: 'Upload PDF', text: 'Select or drag your PDF document into the workspace.' },
      { name: 'Set Margins or Format', text: 'Enter trim margins or choose a standard sheet size preset (e.g. A4).' },
      { name: 'Crop & Download', text: 'Download your cropped or resized PDF document instantly.' }
    ],
    faqs: [
      { question: 'Does cropping delete content permanently?', answer: 'Cropping adjusts the visible viewport bounding box (CropBox and MediaBox) according to PDF specifications.' },
      { question: 'Can I resize US Letter documents to A4 format?', answer: 'Yes! Select the Resize Page Dimensions mode, pick A4, and choose whether to scale the content to fit.' }
    ],
    related: ['split-pdf', 'merge-pdf', 'compress-pdf', 'rotate-pdf']
  },
  'edit-pdf': {
    category: 'Security & Sign', categoryLink: '/edit-pdf',
    features: ['Interactive visual canvas with zoom and multi-page thumbnail navigation', 'Add editable text with font family, size, color, and background styling', 'Clean whiteout eraser, freehand drawing pen, translucent highlighter, shapes, checkmarks, and signature stamps'],
    howToSteps: [
      { name: 'Upload Document', text: 'Upload any PDF file to load into the visual editor canvas.' },
      { name: 'Edit, Fill & Annotate', text: 'Add text boxes, erase areas with whiteout, draw highlighters, or place signatures.' },
      { name: 'Export Vector PDF', text: 'Click Export to bake your changes directly into a crisp vector PDF.' }
    ],
    faqs: [
      { question: 'Is my document uploaded to a server while editing?', answer: 'No! The visual editor runs 100% locally in your browser using canvas and vector libraries. Your document never leaves your device.' },
      { question: 'Can I fill out non-editable scanned forms?', answer: 'Yes! Use the Text tool and Checkmark tool to easily type into form fields and check off boxes on any scanned document.' }
    ],
    related: ['draw-signature', 'sign-pdf', 'flatten-pdf', 'protect-pdf']
  }
};

// ── Defensive Alias Registration ──────────────────────────────────────────────
export const TOOL_ALIASES = {
  'chat-with-pdf': 'ai-ask',
  'gst-invoice': 'gst-invoice-pdf',
  'pos-billing': 'pos-billing',
  'clean-billing': 'pos-billing',
  'tax-receipt': 'tax-receipt',
  'estimate-maker': 'estimate-maker',
  'summarize-pdf': 'ai-summarize',
  'organize-pages': 'delete-pdf-pages',
  'crop-pdf': 'crop-pdf',
  'resize-pdf': 'crop-pdf',
  'pdf-to-audio': 'ai-summarize',
  'edit-pdf': 'edit-pdf',
  'pdf-editor': 'edit-pdf',
  'sign-pdf': 'draw-signature',
  'add-watermark': 'watermark-pdf',
  'page-numbers': 'page-numbers-pdf',
  'headers-footers': 'page-numbers-pdf',
  'extract-text': 'ocr-pdf',
  'extract-tables': 'ai-extract-table',
  'extract-pages': 'extract-pages',
  'flatten-pdf': 'flatten-pdf',
  'repair-pdf': 'repair-pdf',
  'encrypt-pdf': 'protect-pdf',
  'remove-password': 'unlock-pdf',
  'privacy-scanner': 'strip-metadata-pdf',
  'fingerprint-pdf': 'watermark-pdf',
  'compare-pdfs': 'compare-pdf',
};

for (const [alias, target] of Object.entries(TOOL_ALIASES)) {
  if (TOOL_DEFINITIONS[target] && !TOOL_DEFINITIONS[alias]) {
    TOOL_DEFINITIONS[alias] = TOOL_DEFINITIONS[target];
  }
  if (TOOL_ICONS[target] && !TOOL_ICONS[alias]) {
    TOOL_ICONS[alias] = TOOL_ICONS[target];
  }
  if (TOOL_DETAILS_DATA[target] && !TOOL_DETAILS_DATA[alias]) {
    TOOL_DETAILS_DATA[alias] = TOOL_DETAILS_DATA[target];
  }
}
