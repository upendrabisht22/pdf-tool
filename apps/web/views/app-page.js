/**
 * DocPlatform Main Tool Application View
 * Renders the responsive document canvas, dropzone, signature/GST studios,
 * dynamic SEO metadata, JSON-LD schema, how-to guides, and FAQ accordions.
 * Built with the DocPlatform Architectural Minimalist Blueprint Design System.
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
    'ocr-pdf': ['pdf-to-word', 'ai-ask', 'compress-pdf', 'compare-pdf'],
    'redact-pdf': ['protect-pdf', 'strip-metadata-pdf', 'flatten-pdf', 'watermark-pdf'],
    'draw-signature': ['sign-pdf', 'flatten-pdf', 'protect-pdf', 'compress-pdf'],
    'pdf-to-markdown': ['markdown-to-pdf', 'pdf-to-word', 'ai-summarize', 'ocr-pdf'],
    'markdown-to-pdf': ['pdf-to-markdown', 'word-to-pdf', 'compress-pdf', 'merge-pdf'],
    'gst-invoice-pdf': ['sign-pdf', 'protect-pdf', 'pdf-to-excel', 'compress-pdf'],
  };
  return map[key] || ['merge-pdf', 'pdf-to-word', 'compress-pdf', 'ai-ask'];
}

export function renderAppPage({ toolConfig, jsonLd, category, relatedSlugs, renderNavbar, renderFooter, TOOL_REGISTRY, renderGsapScripts }) {
  return `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${toolConfig.metaTitle}</title>
  <meta name="description" content="${toolConfig.metaDescription}">
  <meta name="keywords" content="${toolConfig.keywords.join(', ')}">
  <link rel="canonical" href="${toolConfig.canonicalUrl}">

  <!-- Google Fonts: Instrument Serif + JetBrains Mono + Plus Jakarta Sans -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">

  <link rel="stylesheet" href="/styles.css?v=3.2">

  <!-- Tailwind CDN with DocPlatform Blueprint Configuration -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: ['selector', '[data-theme="dark"]'],
      theme: {
        extend: {
          colors: {
            bg: 'var(--bg)',
            'bg-subtle': 'var(--bg-subtle)',
            'bg-elevated': 'var(--bg-elevated)',
            border: 'var(--border)',
            accent: 'var(--accent)',
            'accent-hover': 'var(--accent-hover)',
            'accent-foreground': 'var(--accent-foreground)',
            'text-primary': 'var(--text-primary)',
            'text-secondary': 'var(--text-secondary)',
            'text-muted': 'var(--text-muted)',
          },
          fontFamily: {
            display: ['"Instrument Serif"', 'Georgia', 'serif'],
            mono: ['"JetBrains Mono"', 'monospace'],
            sans: ['"Plus Jakarta Sans"', 'sans-serif'],
          }
        }
      }
    }
  </script>

  <script>
    (function() {
      const saved = localStorage.getItem('dp_theme') || 'dark';
      document.documentElement.setAttribute('data-theme', saved);
    })();
    function toggleTheme() {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('dp_theme', next);
    }
  </script>
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
<body class="min-h-screen flex flex-col bg-bg text-text-primary antialiased">
  ${renderNavbar(category.name === 'AI & OCR' ? 'ai' : 'tools')}

  <!-- GSAP ScrollSmoother Wrapper & Blueprint Canvas -->
  <div id="smooth-wrapper">
    <div id="smooth-content" style="padding-top: 51px;">
      <main class="w-full flex-1">
        <div class="mx-auto max-w-5xl border-x border-dashed border-border flex flex-col">
      
      <!-- Architectural Hero Section -->
      <section class="relative overflow-hidden border-b border-dashed border-border py-10 px-6 sm:px-10">
        <!-- Linework Background Texture -->
        <div class="linework pointer-events-none absolute inset-0"></div>

        <div class="relative z-10 flex flex-col gap-3">

          <!-- Client-Side Security Badge -->
          <div class="flex items-center gap-3 mt-1">
            <span class="mono-copy inline-flex items-center gap-1.5 border border-border bg-bg-elevated px-2.5 py-1 text-[11px] text-text-primary tracking-wide">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#7b61ff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <span id="hero-badge-text">${toolConfig.features[0] || '100% Private In-Browser Processing'}</span>
            </span>
            <div style="height: 1px; width: 80px; background: linear-gradient(to right, var(--border), transparent);"></div>
          </div>

          <!-- Editorial Instrument Serif Title -->
          <h1 class="hero-display text-4xl sm:text-6xl text-text-primary tracking-tight" id="hero-title">${toolConfig.title}</h1>
          <p class="mono-copy text-xs sm:text-sm text-text-secondary max-w-2xl leading-relaxed" id="hero-subtitle">${toolConfig.metaDescription}</p>
        </div>
      </section>

      <!-- Interactive Dropzone & Studio Workspace Area -->
      <section class="p-6 sm:p-10 border-b border-dashed border-border bg-bg relative">
        <div class="workspace-card max-w-4xl mx-auto" style="border: none; padding: 0; background: transparent; box-shadow: none;">
          <input type="file" id="file-input" style="display:none;" />
          <input type="file" id="add-more-input" style="display:none;" />

          <!-- Dedicated Signature Creator Studio -->
          <div id="signature-studio" style="display: none; padding: 0.5rem 0;">
            <div style="display: flex; gap: 0.5rem; margin-bottom: 1.25rem; border-bottom: 1px dashed var(--border); padding-bottom: 0.75rem;">
              <button type="button" id="sig-tab-draw" class="mono-copy active" onclick="switchSignatureTab('draw')" style="padding: 0.4rem 0.85rem; border: 1px solid #7b61ff; background: rgba(123, 97, 255, 0.1); color: #7b61ff; font-size: 0.75rem; cursor: pointer;">✍️ Draw Signature on Screen</button>
              <button type="button" id="sig-tab-upload" class="mono-copy" onclick="switchSignatureTab('upload')" style="padding: 0.4rem 0.85rem; border: 1px dashed var(--border); background: var(--bg-elevated); color: var(--text-secondary); font-size: 0.75rem; cursor: pointer;">📁 Upload & Compress Photo</button>
            </div>

            <!-- Draw Mode Sub-view -->
            <div id="sig-draw-view">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; flex-wrap: wrap; gap: 0.5rem;">
                <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem;" class="mono-copy text-text-secondary">
                  <span>Ink Color:</span>
                  <button type="button" class="sig-color-btn" onclick="setSignatureInk('#0f172a')" style="width: 20px; height: 20px; border-radius: 50%; background: #0f172a; border: 2px solid #7b61ff; cursor: pointer;"></button>
                  <button type="button" class="sig-color-btn" onclick="setSignatureInk('#1d4ed8')" style="width: 20px; height: 20px; border-radius: 50%; background: #1d4ed8; border: 2px solid transparent; cursor: pointer;"></button>
                  <button type="button" class="sig-color-btn" onclick="setSignatureInk('#047857')" style="width: 20px; height: 20px; border-radius: 50%; background: #047857; border: 2px solid transparent; cursor: pointer;"></button>
                </div>
                <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem;" class="mono-copy text-text-secondary">
                  <span>Stroke:</span>
                  <select id="sig-studio-stroke" onchange="setSignatureStroke(this.value)" class="mono-copy select-control" style="background: var(--bg-elevated); border: 1px solid var(--border); color: var(--text-primary); padding: 0.25rem 0.5rem; font-size: 0.75rem;">
                    <option value="2">Fine (2px)</option>
                    <option value="3" selected>Standard (3px)</option>
                    <option value="4.5">Bold (4.5px)</option>
                  </select>
                </div>
              </div>

              <!-- In-Page Canvas -->
              <div style="border: 1px dashed var(--border); background: #ffffff; margin-bottom: 1rem; overflow: hidden; position: relative;">
                <canvas id="sig-studio-canvas" width="600" height="200" style="touch-action: none; cursor: crosshair; display: block; width: 100%; height: 200px; background: #ffffff;"></canvas>
              </div>

              <!-- Optimization Preset Grid -->
              <div style="background: var(--bg-elevated); border: 1px dashed var(--border); padding: 1rem; margin-bottom: 1.25rem; display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div>
                  <label class="mono-copy" style="font-size: 0.7rem; font-weight: 700; color: var(--text-muted); display: block; margin-bottom: 0.35rem; text-transform: uppercase;">TARGET FILE SIZE</label>
                  <select id="sig-studio-maxkb" class="mono-copy select-control" style="width: 100%; background: var(--bg); border: 1px solid var(--border); color: var(--text-primary); padding: 0.35rem 0.5rem; font-size: 0.75rem;">
                    <option value="30" selected>&lt; 30 KB (Defense / UPSC Standard)</option>
                    <option value="20">&lt; 20 KB (Strict Govt Form)</option>
                    <option value="50">&lt; 50 KB (SSC / Banking)</option>
                    <option value="0">Original Resolution</option>
                  </select>
                </div>
                <div>
                  <label class="mono-copy" style="font-size: 0.7rem; font-weight: 700; color: var(--text-muted); display: block; margin-bottom: 0.35rem; text-transform: uppercase;">IMAGE FORMAT</label>
                  <select id="sig-studio-format" class="mono-copy select-control" style="width: 100%; background: var(--bg); border: 1px solid var(--border); color: var(--text-primary); padding: 0.35rem 0.5rem; font-size: 0.75rem;">
                    <option value="jpeg" selected>JPG (Crisp White Background)</option>
                    <option value="png">PNG (Transparent / Lossless)</option>
                    <option value="webp">WebP (Ultra Compact)</option>
                  </select>
                </div>
              </div>

              <!-- Action Buttons -->
              <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
                <button type="button" class="mono-copy" onclick="clearStudioSignaturePad()" style="cursor: pointer; padding: 0.5rem 1rem; border: 1px dashed var(--border); background: transparent; color: var(--text-secondary); font-size: 0.75rem;">↺ Clear Canvas</button>
                <button type="button" class="paper-cta-btn group" onclick="downloadStudioSignature()">
                  <span class="cta-fill"></span>
                  <span class="relative z-10 flex items-center gap-2 mono-copy" style="font-size: 0.75rem; text-transform: uppercase;">
                    <span>Download Compressed Signature (&lt;30 KB)</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                  </span>
                </button>
              </div>
            </div>

            <!-- Upload Mode Sub-view -->
            <div id="sig-upload-view" style="display: none;">
              <div class="dropzone p-8 border border-dashed border-border hover:border-accent bg-bg-elevated cursor-pointer flex flex-col items-center justify-center text-center transition-all group" id="sig-upload-dropzone" onclick="document.getElementById('file-input').click()">
                <div class="w-12 h-12 border border-dashed border-border flex items-center justify-center mb-3 text-accent bg-bg group-hover:border-accent transition-colors">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                </div>
                <h3 class="hero-display text-xl sm:text-2xl text-text-primary mb-1">Select Signature Photo</h3>
                <p class="mono-copy text-xs text-text-secondary mb-4 max-w-sm">Drop any smartphone photo of your handwritten signature to auto-compress strictly under 30 KB.</p>
                <button type="button" class="paper-cta-btn group">
                  <span class="cta-fill"></span>
                  <span class="relative z-10 mono-copy text-xs uppercase font-medium">Choose Signature Image</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Dedicated Professional GST Invoice Studio -->
          <div id="gst-invoice-studio" style="display: none; padding: 0.5rem 0;">
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

          <!-- Main Architectural Drag and Drop Zone -->
          <div class="dropzone p-10 sm:p-14 border border-dashed border-border hover:border-accent bg-bg-elevated cursor-pointer flex flex-col items-center justify-center text-center transition-all group" id="dropzone">
            <div class="w-12 h-12 border border-dashed border-border flex items-center justify-center mb-4 text-accent bg-bg group-hover:border-accent transition-colors">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="12" y1="18" x2="12" y2="12"></line>
                <line x1="9" y1="15" x2="15" y2="15"></line>
              </svg>
            </div>
            <h2 class="hero-display text-2xl sm:text-3xl text-text-primary mb-1" id="dropzone-title">Select PDF files</h2>
            <p class="mono-copy text-xs text-text-secondary mb-6 max-w-md leading-relaxed" id="dropzone-desc">or drop PDFs here. Instant client-side verification with zero data upload.</p>
            <button type="button" class="paper-cta-btn group">
              <span class="cta-fill"></span>
              <span class="relative z-10 flex items-center gap-2 mono-copy" style="font-size: 0.75rem; text-transform: uppercase; font-weight: 600;">
                <span id="dropzone-btn-text">Select PDF files</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </span>
            </button>
          </div>

          <!-- File Staging Area -->
          <div class="staging-area" id="staging-area" style="display: none; margin-top: 1rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; border-bottom: 1px dashed var(--border); padding-bottom: 0.75rem;">
              <h3 class="hero-display text-xl sm:text-2xl text-text-primary">Selected Documents</h3>
              <button class="mono-copy" id="add-more-btn" onclick="document.getElementById('add-more-input').click()" style="padding: 0.35rem 0.75rem; border: 1px dashed var(--border); background: var(--bg-elevated); color: var(--text-primary); font-size: 0.72rem; cursor: pointer;">+ Add More Files</button>
            </div>

            <div class="files-grid" id="files-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.75rem; margin-bottom: 1.25rem;"></div>

            <!-- Action Controls -->
            <div class="action-bar" style="display: flex; flex-direction: column; gap: 1rem;">
              <div class="options-group mono-copy" id="tool-options-container" style="display: flex; flex-wrap: wrap; gap: 0.75rem; font-size: 0.75rem;"></div>
              <button class="paper-cta-btn group" id="process-btn" style="width: 100%; justify-content: center; height: 42px;">
                <span class="cta-fill"></span>
                <span class="relative z-10 flex items-center justify-center gap-2 mono-copy" style="font-size: 0.8rem; font-weight: 600; text-transform: uppercase;">
                  <span id="process-btn-text">Process Document</span>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </span>
              </button>
            </div>
          </div>

          <!-- Progress Tracking (Real-Time Live Status) -->
          <div class="progress-container border border-dashed border-border bg-bg-elevated p-6 mt-4" id="progress-container" style="display: none;">
            <div class="progress-header-box" style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
              <div class="progress-spinner" id="progress-spinner"></div>
              <div class="progress-titles">
                <h3 id="progress-status-text" class="mono-copy text-xs font-bold text-text-primary uppercase tracking-wide">Processing Document...</h3>
                <p id="progress-sub-status" class="mono-copy text-xs text-text-secondary">Analyzing document structure & vector glyphs...</p>
              </div>
            </div>
            <div class="progress-bar-track" style="height: 4px; background: var(--bg); border: 1px solid var(--border); overflow: hidden; margin-bottom: 0.5rem;">
              <div class="progress-bar-fill" id="progress-bar-fill" style="height: 100%; width: 0%; background: #7b61ff; transition: width 0.2s ease;"></div>
            </div>
            <div class="progress-meta-row flex justify-between items-center mono-copy text-xs text-text-muted">
              <span class="progress-percent" id="progress-percent">0%</span>
              <span class="progress-timer" id="progress-timer">0.0s</span>
            </div>
          </div>

          <!-- Result / Success Card (DocPlatform Blueprint Style) -->
          <div class="result-card border border-dashed border-border bg-bg-elevated p-8 text-center mt-4" id="result-card" style="display: none;">
            <div class="w-12 h-12 border border-dashed border-accent flex items-center justify-center mx-auto mb-4 text-accent bg-bg">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <h3 class="hero-display text-3xl text-text-primary mb-1" id="result-title">Document Processed Successfully!</h3>
            <p class="mono-copy text-xs text-text-secondary mb-6" id="result-subtitle">Your document has been optimized, verified, and rendered locally.</p>
            
            <div class="result-file-info border border-dashed border-border bg-bg p-3.5 max-w-md mx-auto mb-6 flex items-center justify-between" id="result-file-info">
              <div class="result-file-main flex items-center gap-3 text-left">
                <span class="result-file-icon text-accent" id="result-file-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                </span>
                <div>
                  <div class="result-file-name mono-copy text-xs font-bold text-text-primary" id="result-file-name">document.pdf</div>
                  <div class="result-file-meta mono-copy text-[10px] text-text-muted" id="result-file-meta">Verified • Client-Side Secure</div>
                </div>
              </div>
              <span class="result-file-badge mono-copy text-[10px] border border-border px-2 py-0.5 text-accent" id="result-file-badge">PDF</span>
            </div>

            <!-- AI Intelligence Response Preview Box -->
            <div class="result-ai-preview border border-dashed border-border bg-bg p-4 text-left mb-6 max-w-2xl mx-auto" id="result-ai-preview" style="display: none;">
              <div class="result-ai-header flex justify-between items-center mb-2 pb-2 border-b border-dashed border-border">
                <span class="mono-copy text-xs text-accent font-semibold flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>
                  <span>AI Intelligence Output</span>
                </span>
                <button type="button" class="result-ai-copy-btn mono-copy text-xs border border-border px-2 py-0.5 hover:border-accent" id="result-ai-copy-btn" onclick="copyAiPreviewText()">Copy Text</button>
              </div>
              <div class="result-ai-body mono-copy text-xs text-text-secondary leading-relaxed max-h-64 overflow-y-auto" id="result-ai-body"></div>
            </div>

            <div class="max-w-xs mx-auto mb-4">
              <a href="#" class="paper-cta-btn group w-full justify-center" id="download-btn" style="text-decoration: none; height: 42px;">
                <span class="cta-fill"></span>
                <span class="relative z-10 flex items-center justify-center gap-2 mono-copy" style="font-size: 0.78rem; text-transform: uppercase; font-weight: 600;">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                  <span id="download-btn-text">Download Document</span>
                </span>
              </a>
            </div>

            <div class="result-actions-row">
              <button class="mono-copy text-xs text-text-muted hover:text-text-primary transition-colors cursor-pointer" id="result-secondary-btn" onclick="resetWorkspace()">↻ Process Another File</button>
            </div>

            <!-- Next Steps Recommendations -->
            <div class="next-steps-container mt-8 pt-6 border-t border-dashed border-border">
              <div class="mono-copy text-[10px] text-text-muted uppercase tracking-wider mb-3">NEXT RECOMMENDED ACTIONS</div>
              <div class="next-steps-chips flex flex-wrap justify-center gap-2" id="next-steps-chips">
                <a href="/compress-pdf" class="next-step-chip">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
                  <span>Compress File Size</span>
                </a>
                <a href="/protect-pdf" class="next-step-chip">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  <span>Protect with Password</span>
                </a>
                <a href="/draw-signature" class="next-step-chip">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m18 2 4 4-12 12H6v-4L18 2z"/></svg>
                  <span>Sign Document</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 1. Tool-Specific How-To Guide (Architectural Steps) -->
      <section class="p-6 sm:p-10 border-b border-dashed border-border">
        <div class="mb-6">
          <span class="mono-copy text-[10px] text-accent uppercase tracking-widest">[ WORKFLOW ]</span>
          <h2 class="hero-display text-2xl sm:text-3xl text-text-primary mt-1">How to use this tool</h2>
          <p class="mono-copy text-xs text-text-secondary mt-1">Follow these simple steps to process your document in seconds.</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4" id="tool-steps-container">
          ${toolConfig.howToSteps.map((step, idx) => `
            <div class="border border-dashed border-border bg-bg-elevated p-5 flex flex-col justify-between">
              <div>
                <div class="mono-copy text-xs text-accent font-semibold mb-3">[ 0${idx + 1} ]</div>
                <h3 class="mono-copy text-xs font-bold text-text-primary uppercase tracking-wide mb-2">${step.name}</h3>
                <p class="mono-copy text-xs text-text-secondary leading-relaxed">${step.text}</p>
              </div>
            </div>
          `).join('')}
        </div>
      </section>

      <!-- 2. Tool-Specific Key Features & Security (Vector SVGs - No Emojis) -->
      <section class="p-6 sm:p-10 border-b border-dashed border-border">
        <div class="mb-6">
          <span class="mono-copy text-[10px] text-accent uppercase tracking-widest">[ SPECIFICATION ]</span>
          <h2 class="hero-display text-2xl sm:text-3xl text-text-primary mt-1">Key Features & Security</h2>
          <p class="mono-copy text-xs text-text-secondary mt-1">Engineered with precision vector geometry, high-fidelity font preservation, and zero data storage.</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4" id="tool-features-container">
          ${toolConfig.features.map((feat, idx) => `
            <div class="border border-dashed border-border bg-bg-elevated p-5 flex flex-col justify-between">
              <div>
                <div class="w-8 h-8 border border-dashed border-border flex items-center justify-center text-accent mb-3 bg-bg">
                  ${idx === 0 ? `
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  ` : idx === 1 ? `
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                  ` : `
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                  `}
                </div>
                <div class="mono-copy text-[10px] text-text-muted uppercase tracking-widest mb-1.5">FEATURE_0${idx + 1}</div>
                <h3 class="mono-copy text-xs font-bold text-text-primary uppercase tracking-wide mb-2">${idx === 0 ? 'Client-Side Privacy' : idx === 1 ? 'High-Performance Engine' : 'Vector Precision'}</h3>
                <p class="mono-copy text-xs text-text-secondary leading-relaxed">${feat}</p>
              </div>
            </div>
          `).join('')}
        </div>
      </section>

      <!-- 3. Smart Related Tools (Architectural Blueprint Grid) -->
      <section class="p-6 sm:p-10 border-b border-dashed border-border">
        <div class="mb-6">
          <span class="mono-copy text-[10px] text-accent uppercase tracking-widest">[ ECOSYSTEM ]</span>
          <h2 class="hero-display text-2xl sm:text-3xl text-text-primary mt-1">Related Document Tools</h2>
          <p class="mono-copy text-xs text-text-secondary mt-1">Explore complementary tools to edit, convert, and secure your files.</p>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3" id="related-tools-container">
          ${relatedSlugs.slice(0, 4).map(slug => {
            const relTool = TOOL_REGISTRY[slug];
            if (!relTool) return '';
            return `
              <a href="/${slug}" class="tool-blueprint-card group relative p-4 bg-bg-elevated border border-dashed border-border hover:border-accent transition-all flex flex-col justify-between" style="text-decoration: none;">
                <div>
                  <div class="flex items-center justify-between mb-3">
                    <span class="mono-copy text-[10px] text-text-muted uppercase tracking-wider">${relTool.category || 'PDF'}</span>
                    <span class="mono-copy text-xs text-text-muted group-hover:text-accent transition-colors">↗</span>
                  </div>
                  <h4 class="mono-copy text-xs font-bold text-text-primary group-hover:text-accent transition-colors mb-1.5">${relTool.title}</h4>
                  <p class="mono-copy text-[11px] text-text-secondary leading-relaxed">${relTool.metaDescription.substring(0, 70)}...</p>
                </div>
              </a>
            `;
          }).join('')}
        </div>
      </section>

      <!-- 4. Tool-Specific FAQ Accordion -->
      <section class="p-6 sm:p-10" id="faq">
        <div class="mb-6">
          <span class="mono-copy text-[10px] text-accent uppercase tracking-widest">[ KNOWLEDGE BASE ]</span>
          <h2 class="hero-display text-2xl sm:text-3xl text-text-primary mt-1">Frequently Asked Questions</h2>
          <p class="mono-copy text-xs text-text-secondary mt-1">Everything you need to know about this tool and security standards.</p>
        </div>
        <div class="space-y-3" id="faq-list-container">
          ${toolConfig.faqs.map(faq => `
            <div class="faq-item border border-dashed border-border bg-bg-elevated overflow-hidden transition-all">
              <div class="faq-question p-4 flex items-center justify-between cursor-pointer select-none" onclick="this.parentElement.classList.toggle('active'); const ans = this.nextElementSibling; ans.style.display = ans.style.display === 'block' ? 'none' : 'block'; const ic = this.querySelector('.faq-icon'); if (ic) ic.textContent = ans.style.display === 'block' ? '−' : '+';">
                <span class="mono-copy text-xs font-semibold text-text-primary pr-4">${faq.question}</span>
                <div class="faq-icon mono-copy text-sm text-text-muted font-mono transition-transform duration-200">+</div>
              </div>
              <div class="faq-answer px-4 pb-4 mono-copy text-xs text-text-secondary leading-relaxed border-t border-dashed border-border/50 pt-3" style="display: none;">
                ${faq.answer}
              </div>
            </div>
          `).join('')}
        </div>
      </section>

    </div>
  </main>

  ${renderFooter()}
    </div>
  </div>
  ${typeof renderGsapScripts === 'function' ? renderGsapScripts() : ''}
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
