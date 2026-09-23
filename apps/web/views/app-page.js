/**
 * DocPlatform Main Tool Application View
 * Renders the responsive document canvas, dropzone, signature/GST studios,
 * dynamic SEO metadata, JSON-LD schema, how-to guides, and FAQ accordions.
 * Built with the DocPlatform Architectural Minimalist Blueprint Design System.
 */

import { getToolContract } from '@doc-platform/core';

const TOOL_ICONS_MAP = {
  'merge-pdf': '📑', 'split-pdf': '✂️', 'compress-pdf': '⚡', 'rotate-pdf': '🔄',
  'delete-pdf-pages': '🗑️', 'extract-pages': '📑', 'jpg-to-pdf': '🖼️', 'pdf-to-jpg': '📷',
  'word-to-pdf': '📄', 'excel-to-pdf': '📊', 'pdf-to-word': '📝', 'pdf-to-excel': '📈',
  'watermark-pdf': '💧', 'page-numbers-pdf': '🔢', 'strip-metadata-pdf': '🧹', 'sign-pdf': '📜',
  'draw-signature': '✍️', 'flatten-pdf': '📄', 'repair-pdf': '🛠️', 'protect-pdf': '🔒',
  'unlock-pdf': '🔓', 'redact-pdf': '🛡️', 'ocr-pdf': '👁️', 'compare-pdf': '⚖️',
  'ai-summarize': '💡', 'ai-ask': '🤖', 'ai-extract-table': '📋', 'pipeline': '⚡',
  'pdf-to-markdown': '📝', 'markdown-to-pdf': '📄', 'gst-invoice-pdf': '🧾',
  'chat-with-pdf': '🤖', 'gst-invoice': '🧾', 'pos-billing': '🧾', 'clean-billing': '🧾',
  'tax-receipt': '📜', 'estimate-maker': '📊', 'crop-pdf': '✂️', 'edit-pdf': '📝', 'pdf-editor': '📝',
  'p2p-share': '⚡', 'p2p': '⚡'
};

export function getToolCategory(key) {
  if (['merge-pdf', 'split-pdf', 'compress-pdf', 'rotate-pdf', 'delete-pdf-pages', 'extract-pages', 'crop-pdf'].includes(key)) return { name: 'Core PDF', link: '/merge-pdf' };
  if (['word-to-pdf', 'excel-to-pdf', 'pdf-to-word', 'pdf-to-excel', 'jpg-to-pdf', 'pdf-to-jpg', 'pdf-to-markdown', 'markdown-to-pdf'].includes(key)) return { name: 'Conversions', link: '/pdf-to-word' };
  if (['watermark-pdf', 'page-numbers-pdf', 'strip-metadata-pdf', 'sign-pdf', 'draw-signature', 'flatten-pdf', 'repair-pdf', 'protect-pdf', 'unlock-pdf', 'redact-pdf', 'edit-pdf', 'pdf-editor', 'p2p-share', 'p2p'].includes(key)) return { name: 'Security & Sign', link: '/p2p-share' };
  if (['ocr-pdf', 'compare-pdf', 'ai-summarize', 'ai-ask', 'ai-extract-table', 'chat-with-pdf'].includes(key)) return { name: 'AI & OCR', link: '/chat-with-pdf' };
  if (['gst-invoice-pdf', 'gst-invoice', 'pos-billing', 'clean-billing', 'tax-receipt', 'estimate-maker'].includes(key)) return { name: 'Business & Tax', link: '/gst-invoice' };
  return { name: 'PDF Tools', link: '/#all-tools' };
}

export function getRelatedToolsList(key) {
  const map = {
    'p2p-share': ['draw-signature', 'protect-pdf', 'compress-pdf', 'merge-pdf'],
    'crop-pdf': ['split-pdf', 'rotate-pdf', 'compress-pdf', 'merge-pdf'],
    'edit-pdf': ['draw-signature', 'sign-pdf', 'flatten-pdf', 'protect-pdf'],
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
    'draw-signature': ['p2p-share', 'sign-pdf', 'flatten-pdf', 'protect-pdf', 'compress-pdf'],
    'pdf-to-markdown': ['markdown-to-pdf', 'pdf-to-word', 'ai-summarize', 'ocr-pdf'],
    'markdown-to-pdf': ['pdf-to-markdown', 'word-to-pdf', 'compress-pdf', 'merge-pdf'],
    'gst-invoice-pdf': ['sign-pdf', 'protect-pdf', 'pdf-to-excel', 'compress-pdf'],
  };
  return map[key] || ['merge-pdf', 'pdf-to-word', 'compress-pdf', 'ai-ask'];
}

export function renderAppPage({ toolConfig, jsonLd, category, relatedSlugs, renderNavbar, renderFooter, TOOL_REGISTRY, renderGsapScripts, currentToolKey, toolContract }) {
  const toolKey = currentToolKey || (toolConfig.canonicalUrl ? toolConfig.canonicalUrl.split('/').pop() : 'merge-pdf');
  const contract = toolContract || (toolConfig.mode ? toolConfig : getToolContract(toolKey));
  const mode = contract.mode || 'processor';
  const requiresInputFile = contract.requiresInputFile ?? (mode === 'processor' || mode === 'editor');
  const inputType = contract.inputType || (requiresInputFile ? 'pdf' : 'none');
  const studioId = contract.studioId || null;
  const isWideCanvas = Boolean(contract.wideCanvas || mode === 'generator' || mode === 'editor');
  const isMultiple = Boolean(contract.multiple);
  const initialAccept = contract.accept !== undefined ? (contract.accept || '') : (requiresInputFile ? '.pdf,application/pdf' : '');

  const initialDropTitle = inputType === 'image' ? 'Select Image files (JPG, PNG, WebP)' :
                           inputType === 'markdown' ? 'Select Markdown file (.md, .txt)' :
                           inputType === 'office' ? 'Select Office Document (.docx, .xlsx, .pptx)' :
                           inputType === 'pdf-or-image' ? 'Select PDF or Image file' :
                           'Select PDF files';

  const initialDropDesc = inputType === 'image' ? 'or drop JPG, PNG, or WebP images here. Instant client-side PDF creation.' :
                          inputType === 'markdown' ? 'or drop Markdown files here. Instant compilation to vector PDF.' :
                          inputType === 'office' ? 'or drop Word, Excel, or PowerPoint files here for instant conversion.' :
                          inputType === 'pdf-or-image' ? 'or drop PDF or image scan here for OCR processing.' :
                          'or drop PDFs here. Instant client-side verification with zero data upload.';

  const initialDropBtn = inputType === 'image' ? 'Select Images' :
                         inputType === 'markdown' ? 'Select Markdown File' :
                         inputType === 'office' ? 'Select Document' :
                         inputType === 'pdf-or-image' ? 'Select PDF or Image' :
                         'Select PDF files';

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

  <link rel="stylesheet" href="/styles.css?v=3.5">

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
  ${renderNavbar(category.name === 'AI & OCR' ? 'ai' : 'tools', isWideCanvas)}

  <!-- GSAP ScrollSmoother Wrapper & Blueprint Canvas -->
  <div id="smooth-wrapper">
    <div id="smooth-content" style="padding-top: 51px;">
      <main class="main-content w-full flex-1 ${isWideCanvas ? 'wide-canvas' : ''}">
        <div id="main-blueprint-container" class="mx-auto ${isWideCanvas ? 'max-w-7xl' : 'max-w-5xl'} border-x border-dashed border-border flex flex-col">

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
        <div class="workspace-card ${isWideCanvas ? 'w-full' : 'max-w-4xl mx-auto'}" style="border: none; padding: 0; background: transparent; box-shadow: none;">
          <input type="file" id="file-input" accept="${initialAccept}" ${isMultiple ? 'multiple' : ''} style="display:none;" />
          <input type="file" id="add-more-input" accept="${initialAccept}" multiple style="display:none;" />

          <!-- Dedicated Signature Creator Studio -->
          <div id="signature-studio" style="display: ${studioId === 'signature-studio' ? 'block' : 'none'}; padding: 0.5rem 0;">
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
          <div id="gst-invoice-studio" style="display: ${studioId === 'gst-invoice-studio' ? 'block' : 'none'}; padding: 0.5rem 0;">
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

          <!-- Dedicated Minimal POS Billing Studio -->
          <div id="pos-billing-studio" style="display: ${studioId === 'pos-billing-studio' ? 'block' : 'none'}; padding: 0.5rem 0;">
            <div class="gst-mobile-view-switcher" id="pos-mobile-view-switcher">
              <button type="button" class="gst-view-tab-btn active" id="pos-tab-form" onclick="window.setPosStudioView('form')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                <span>Edit Counter Bill</span>
              </button>
              <button type="button" class="gst-view-tab-btn" id="pos-tab-preview" onclick="window.setPosStudioView('preview')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                <span>Live Slip Preview</span>
              </button>
              <button type="button" class="gst-view-tab-btn" id="pos-tab-split" onclick="window.setPosStudioView('split')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="12" y1="3" x2="12" y2="21"></line></svg>
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

          <!-- Dedicated Section 80G Tax Receipt Studio -->
          <div id="tax-receipt-studio" style="display: ${studioId === 'tax-receipt-studio' ? 'block' : 'none'}; padding: 0.5rem 0;">
            <div class="gst-mobile-view-switcher" id="tr-mobile-view-switcher">
              <button type="button" class="gst-view-tab-btn active" id="tr-tab-form" onclick="window.setTaxReceiptStudioView('form')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                <span>Edit Receipt</span>
              </button>
              <button type="button" class="gst-view-tab-btn" id="tr-tab-preview" onclick="window.setTaxReceiptStudioView('preview')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                <span>Certificate Preview</span>
              </button>
              <button type="button" class="gst-view-tab-btn" id="tr-tab-split" onclick="window.setTaxReceiptStudioView('split')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="12" y1="3" x2="12" y2="21"></line></svg>
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

          <!-- Dedicated Project Estimate & Quotation Studio -->
          <div id="estimate-studio" style="display: ${studioId === 'estimate-studio' ? 'block' : 'none'}; padding: 0.5rem 0;">
            <div class="gst-mobile-view-switcher" id="est-mobile-view-switcher">
              <button type="button" class="gst-view-tab-btn active" id="est-tab-form" onclick="window.setEstimateStudioView('form')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                <span>Edit Estimate</span>
              </button>
              <button type="button" class="gst-view-tab-btn" id="est-tab-preview" onclick="window.setEstimateStudioView('preview')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                <span>Proposal Preview</span>
              </button>
              <button type="button" class="gst-view-tab-btn" id="est-tab-split" onclick="window.setEstimateStudioView('split')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="12" y1="3" x2="12" y2="21"></line></svg>
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

          <!-- Dedicated Visual PDF Editor Studio -->
          <div id="pdf-editor-studio" style="display: ${studioId === 'pdf-editor-studio' ? 'block' : 'none'}; padding: 0.5rem 0;">
            <!-- Upload Gate if document not yet loaded -->
            <div id="editor-upload-gate" class="dropzone p-10 sm:p-14 border border-dashed border-border hover:border-accent bg-bg-elevated cursor-pointer flex flex-col items-center justify-center text-center transition-all group" onclick="document.getElementById('file-input').click()">
              <div class="w-12 h-12 border border-dashed border-border flex items-center justify-center mb-4 text-accent bg-bg group-hover:border-accent transition-colors">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
              </div>
              <h2 class="hero-display text-2xl sm:text-3xl text-text-primary mb-1">Select PDF to Edit</h2>
              <p class="mono-copy text-xs text-text-secondary mb-6 max-w-md leading-relaxed">Drop any PDF to add text, whiteout typos, draw annotations, fill forms, and insert signatures.</p>
              <button type="button" class="paper-cta-btn group">
                <span class="cta-fill"></span>
                <span class="relative z-10 flex items-center gap-2 mono-copy text-xs uppercase font-medium">
                  <span>Choose PDF Document</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </span>
              </button>
            </div>

            <!-- Active Visual Studio Workspace -->
            <div id="editor-workspace" style="display: none;" class="border border-dashed border-border bg-bg-elevated">
              <!-- Top Floating Blueprint Toolbar -->
              <div class="editor-main-toolbar border-b border-dashed border-border p-2 sm:p-3 bg-bg flex flex-wrap items-center justify-between gap-2">
                <!-- Tool Selector Buttons -->
                <div class="flex items-center gap-1 flex-wrap">
                  <button type="button" class="editor-tool-btn active mono-copy" data-tool="select" onclick="window.setEditorTool('select')" title="Select & Move (V)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="m13 13 6 6"/></svg>
                    <span>Select</span>
                  </button>
                  <button type="button" class="editor-tool-btn mono-copy" data-tool="text" onclick="window.setEditorTool('text')" title="Add Text (T)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" x2="15" y1="20" y2="20"/><line x1="12" x2="12" y1="4" y2="20"/></svg>
                    <span>Text</span>
                  </button>
                  <button type="button" class="editor-tool-btn mono-copy" data-tool="whiteout" onclick="window.setEditorTool('whiteout')" title="Whiteout Eraser (E)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="14" x="3" y="5" rx="2"/><path d="M3 10h18"/></svg>
                    <span>Whiteout</span>
                  </button>
                  <button type="button" class="editor-tool-btn mono-copy" data-tool="draw" onclick="window.setEditorTool('draw')" title="Pen Draw (P)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/></svg>
                    <span>Pen</span>
                  </button>
                  <button type="button" class="editor-tool-btn mono-copy" data-tool="highlight" onclick="window.setEditorTool('highlight')" title="Highlighter (H)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 11-6 6v3h3l6-6"/><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"/></svg>
                    <span>Highlight</span>
                  </button>
                  <button type="button" class="editor-tool-btn mono-copy" data-tool="shape" onclick="window.setEditorTool('shape')" title="Rectangle / Shape">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/></svg>
                    <span>Shape</span>
                  </button>
                  <button type="button" class="editor-tool-btn mono-copy" data-tool="checkmark" onclick="window.setEditorTool('checkmark')" title="Add Checkmark ✓">
                    <span style="color: #16a34a; font-weight: bold;">✓</span>
                    <span>Check</span>
                  </button>
                  <button type="button" class="editor-tool-btn mono-copy" data-tool="crossmark" onclick="window.setEditorTool('crossmark')" title="Add Crossmark ✗">
                    <span style="color: #dc2626; font-weight: bold;">✗</span>
                    <span>Cross</span>
                  </button>
                  <button type="button" class="editor-tool-btn mono-copy" data-tool="image" onclick="document.getElementById('editor-image-upload-input').click()" title="Insert Image / Logo (or press Ctrl+V to paste)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                    <span>Image</span>
                  </button>
                  <input type="file" id="editor-image-upload-input" accept="image/png,image/jpeg,image/webp" style="display: none;" onchange="window.handleEditorImageUpload(event)" />
                </div>

                <!-- Stamps & Signature Actions -->
                <div class="flex items-center gap-1 flex-wrap">
                  <button type="button" class="editor-tool-btn mono-copy" onclick="window.insertSignatureStamp()" title="Insert Signature">
                    <span>✍️ Signature</span>
                  </button>
                  <div class="relative group/stamp" style="position: relative;">
                    <button type="button" class="editor-tool-btn mono-copy" onclick="const m = document.getElementById('stamp-dropdown-menu'); if(m) m.classList.toggle('open');">
                      <span>🏷️ Stamp ▾</span>
                    </button>
                    <div id="stamp-dropdown-menu" class="stamp-dropdown-menu">
                      <button type="button" onclick="window.insertStamp('APPROVED', '#16a34a'); this.parentElement.classList.remove('open');">✅ APPROVED</button>
                      <button type="button" onclick="window.insertStamp('CONFIDENTIAL', '#dc2626'); this.parentElement.classList.remove('open');">🔒 CONFIDENTIAL</button>
                      <button type="button" onclick="window.insertStamp('DRAFT', '#d97706'); this.parentElement.classList.remove('open');">📝 DRAFT</button>
                      <button type="button" onclick="window.insertStamp('PAID', '#2563eb'); this.parentElement.classList.remove('open');">💳 PAID</button>
                      <button type="button" onclick="window.insertStamp('VOID', '#64748b'); this.parentElement.classList.remove('open');">⛔ VOID</button>
                      <button type="button" onclick="window.insertDateStamp(); this.parentElement.classList.remove('open');">📅 TODAY'S DATE</button>
                    </div>
                  </div>
                  <div style="height: 18px; width: 1px; background: var(--border); margin: 0 0.25rem;"></div>
                  <button type="button" class="editor-action-icon-btn" onclick="window.undoEditor()" title="Undo (Ctrl+Z)">↺</button>
                  <button type="button" class="editor-action-icon-btn" onclick="window.redoEditor()" title="Redo (Ctrl+Y)">↻</button>
                  <button type="button" class="editor-action-icon-btn text-danger" id="editor-delete-selected-btn" style="display: none;" onclick="window.deleteSelectedAnnotation()" title="Delete Item">🗑️</button>
                </div>
              </div>

              <!-- Secondary Contextual Toolbar (Text & Formatting Controls) -->
              <div id="editor-text-controls" class="border-b border-dashed border-border p-2 bg-bg-elevated flex items-center gap-3 flex-wrap text-xs mono-copy" style="display: none;">
                <div class="flex items-center gap-1">
                  <span>Font:</span>
                  <select id="editor-font-family" class="select-control text-xs" onchange="window.setEditorFontFamily(this.value)">
                    <option value="Helvetica" selected>Helvetica</option>
                    <option value="TimesRoman">Times Roman</option>
                    <option value="Courier">Courier</option>
                    <option value="JetBrainsMono">JetBrains Mono</option>
                  </select>
                </div>
                <div class="flex items-center gap-1">
                  <span>Size:</span>
                  <select id="editor-font-size" class="select-control text-xs" onchange="window.setEditorFontSize(this.value)">
                    <option value="12">12px</option>
                    <option value="14">14px</option>
                    <option value="16" selected>16px</option>
                    <option value="20">20px</option>
                    <option value="24">24px</option>
                    <option value="32">32px</option>
                  </select>
                </div>
                <div class="flex items-center gap-1">
                  <button type="button" class="editor-fmt-btn" onclick="window.toggleEditorBold()"><b>B</b></button>
                  <button type="button" class="editor-fmt-btn" onclick="window.toggleEditorItalic()"><i>I</i></button>
                </div>
                <div class="flex items-center gap-1">
                  <span>Color:</span>
                  <button type="button" class="editor-swatch-btn" style="background:#0f172a;" onclick="window.setEditorTextColor('#0f172a')"></button>
                  <button type="button" class="editor-swatch-btn" style="background:#1d4ed8;" onclick="window.setEditorTextColor('#1d4ed8')"></button>
                  <button type="button" class="editor-swatch-btn" style="background:#dc2626;" onclick="window.setEditorTextColor('#dc2626')"></button>
                  <button type="button" class="editor-swatch-btn" style="background:#16a34a;" onclick="window.setEditorTextColor('#16a34a')"></button>
                </div>
                <div class="flex items-center gap-1">
                  <span>Background:</span>
                  <button type="button" class="editor-bg-btn active" onclick="window.setEditorTextBg('transparent')">None</button>
                  <button type="button" class="editor-bg-btn" style="background:#ffffff; color:#0f172a;" onclick="window.setEditorTextBg('#ffffff')">White</button>
                  <button type="button" class="editor-bg-btn" style="background:#fef08a; color:#0f172a;" onclick="window.setEditorTextBg('#fef08a')">Yellow</button>
                </div>
              </div>

              <!-- Contextual Whiteout Controls (Paper-Tone Match & Redact-and-Replace) -->
              <div id="editor-whiteout-controls" class="border-b border-dashed border-border p-2 bg-bg-elevated flex items-center gap-3 flex-wrap text-xs mono-copy" style="display: none;">
                <span class="text-accent font-semibold">[ Whiteout Tone ]:</span>
                <div class="flex items-center gap-1.5">
                  <button type="button" class="editor-bg-btn active" id="btn-wo-white" onclick="window.setEditorWhiteoutColor('#ffffff')">⬜ White (#fff)</button>
                  <button type="button" class="editor-bg-btn" id="btn-wo-cream" style="background:#fdfbf7; color:#0f172a; border-color:#e2e8f0;" onclick="window.setEditorWhiteoutColor('#fdfbf7')">📜 Cream</button>
                  <button type="button" class="editor-bg-btn" id="btn-wo-black" style="background:#09090b; color:#ffffff;" onclick="window.setEditorWhiteoutColor('#09090b')">⬛ Redact Black</button>
                  <input type="color" id="editor-whiteout-custom-color" value="#ffffff" onchange="window.setEditorWhiteoutColor(this.value)" class="cursor-pointer" style="width:24px; height:22px; padding:0; border:1px solid var(--border); border-radius:3px;" title="Custom Tone" />
                </div>
                <div style="height: 16px; width: 1px; background: var(--border);"></div>
                <button type="button" class="mono-copy" onclick="window.redactAndTypeOverSelected()" style="padding: 0.25rem 0.65rem; border: 1px dashed var(--accent); background: rgba(123, 97, 255, 0.12); color: var(--accent); font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 0.35rem;" title="Mask area and type replacement text directly on top">
                  <span>✍️ Redact & Type Over</span>
                </button>
              </div>

              <!-- Studio Body (Thumbnails Sidebar + Canvas Viewport) -->
              <div class="editor-body-grid" style="display: flex; min-height: 580px; position: relative;">
                <!-- Left Sidebar: Page Thumbnails -->
                <div class="editor-sidebar-thumbnails border-r border-dashed border-border bg-bg p-3" id="editor-thumbnails-container" style="width: 130px; flex-shrink: 0; overflow-y: auto; max-height: 680px;"></div>

                <!-- Main Interactive Viewport -->
                <div class="editor-canvas-viewport p-4 sm:p-6 flex-1 flex flex-col items-center justify-start overflow-auto bg-bg-elevated" id="editor-canvas-viewport" style="max-height: 680px; position: relative;">
                  <div class="editor-stage-wrapper" id="editor-stage-wrapper" style="position: relative; box-shadow: 0 4px 20px rgba(0,0,0,0.15); display: inline-block;">
                    <!-- Base PDF Render Canvas (HiDPI) -->
                    <canvas id="editor-pdf-canvas" style="display: block; background: #ffffff;"></canvas>
                    <!-- Freehand Drawing Canvas -->
                    <canvas id="editor-draw-canvas" style="position: absolute; inset: 0; pointer-events: none;"></canvas>
                    <!-- Interactive SVG/HTML Overlay for Annotations, Text Boxes & Stamps -->
                    <div id="editor-annotation-overlay" class="editor-annotation-overlay" onmousedown="window.handleOverlayCanvasMouseDown(event)"></div>
                  </div>
                </div>
              </div>

              <!-- Bottom Status & Export Bar -->
              <div class="editor-footer-bar border-t border-dashed border-border p-3 bg-bg flex flex-wrap items-center justify-between gap-3">
                <div class="flex items-center gap-3 mono-copy text-xs">
                  <div class="flex items-center gap-1">
                    <button type="button" class="editor-page-nav-btn" onclick="window.prevEditorPage()">◀ Prev</button>
                    <span>Page <span id="editor-cur-page">1</span> of <span id="editor-total-pages">1</span></span>
                    <button type="button" class="editor-page-nav-btn" onclick="window.nextEditorPage()">Next ▶</button>
                  </div>
                  <div style="height: 14px; width: 1px; background: var(--border);"></div>
                  <div class="flex items-center gap-1">
                    <button type="button" class="editor-action-icon-btn" onclick="window.zoomEditor(-0.15)">−</button>
                    <span id="editor-zoom-label">100%</span>
                    <button type="button" class="editor-action-icon-btn" onclick="window.zoomEditor(0.15)">+</button>
                  </div>
                </div>

                <div class="flex items-center gap-3">
                  <button type="button" class="mono-copy" onclick="document.getElementById('file-input').click()" style="padding: 0.4rem 0.8rem; border: 1px dashed var(--border); background: transparent; color: var(--text-secondary); font-size: 0.75rem; cursor: pointer;">
                    Change PDF
                  </button>
                  <button type="button" class="paper-cta-btn group" id="editor-export-btn" onclick="window.exportEditedPdf()">
                    <span class="cta-fill"></span>
                    <span class="relative z-10 flex items-center gap-2 mono-copy" style="font-size: 0.78rem; text-transform: uppercase; font-weight: 600;">
                      <span>Download Edited PDF</span>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Dedicated Zero-Login WebRTC P2P Sharing Studio -->
          <div id="p2p-share-studio" style="display: ${studioId === 'p2p-share-studio' ? 'block' : 'none'}; padding: 0.5rem 0;">
            <div class="p2p-studio-container">
              
              <!-- 1. Top Pairing & Room Connection Banner -->
              <div class="p2p-card p2p-connection-card">
                <div class="p2p-connection-header">
                  <div class="flex items-center gap-3">
                    <div class="p2p-icon-glow">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="18" cy="5" r="3"></circle>
                        <circle cx="6" cy="12" r="3"></circle>
                        <circle cx="18" cy="19" r="3"></circle>
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                      </svg>
                    </div>
                    <div>
                      <h2 class="hero-display text-base font-bold text-text-primary tracking-tight">Zero-Login P2P Air-Drop</h2>
                      <p class="mono-copy text-[11px] text-text-secondary">Direct browser-to-browser WebRTC encrypted transfer • Zero server storage</p>
                    </div>
                  </div>

                  <!-- Status Pill -->
                  <div id="p2p-status-badge" class="p2p-status-pill mono-copy status-disconnected">
                    <span id="p2p-status-icon">
                      <span class="p2p-dot"></span>
                    </span>
                    <span id="p2p-status-text">DISCONNECTED</span>
                  </div>
                </div>

                <!-- Initial Room Setup View: Choice to Host or Join -->
                <div id="p2p-room-setup-grid" class="p2p-setup-grid mt-4">
                  <!-- Host Card -->
                  <div class="p2p-action-box" id="p2p-create-view">
                    <div class="mono-copy text-[10px] text-accent uppercase tracking-wider mb-1">[ SHARE FROM THIS DEVICE ]</div>
                    <h3 class="text-sm font-semibold text-text-primary mb-1">Create Ephemeral Room</h3>
                    <p class="mono-copy text-xs text-text-secondary mb-3">Generate an ephemeral room code (e.g. LAB-402) & QR code for neighboring PCs or phone cameras to bridge.</p>
                    <button type="button" class="paper-cta-btn group w-full justify-center" onclick="window.createP2pRoom()">
                      <span class="cta-fill"></span>
                      <span class="relative z-10 flex items-center justify-center gap-2 mono-copy text-xs uppercase font-medium">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
                        <span>Create New Room</span>
                      </span>
                    </button>
                  </div>

                  <!-- Join Card -->
                  <div class="p2p-action-box" id="p2p-join-view">
                    <div class="mono-copy text-[10px] text-[#10b981] uppercase tracking-wider mb-1">[ RECEIVE / CONNECT ]</div>
                    <h3 class="text-sm font-semibold text-text-primary mb-1">Connect to Workstation</h3>
                    <p class="mono-copy text-xs text-text-secondary mb-3">Enter the room code (e.g. LAB-402) shown on your other computer or whiteboard.</p>
                    <div class="flex gap-2">
                      <input type="text" id="p2p-join-input" placeholder="e.g. LAB-402" maxlength="10" class="mono-copy gst-input uppercase text-center font-bold tracking-widest text-sm" style="flex: 1;" onkeydown="if(event.key==='Enter') window.joinP2pRoom()" />
                      <button type="button" class="paper-cta-btn group" style="padding: 0 1rem;" onclick="window.joinP2pRoom()">
                        <span class="cta-fill"></span>
                        <span class="relative z-10 mono-copy text-xs uppercase font-medium">Join</span>
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Active Connected Room Control Bar (Hidden initially) -->
                <div id="p2p-active-room-view" class="p2p-active-room-bar mt-4" style="display: none;">
                  <div class="flex flex-wrap items-center justify-between gap-4 w-full">
                    <div class="flex items-center gap-3">
                      <div>
                        <div class="mono-copy text-[10px] text-text-secondary">ACTIVE ROOM CODE</div>
                        <div class="mono-copy text-2xl font-black text-text-primary tracking-widest" id="p2p-active-room-code">LAB-000</div>
                      </div>
                      <div class="flex items-center gap-2">
                        <button type="button" id="p2p-copy-code-btn" class="p2p-btn-secondary mono-copy text-xs" onclick="window.copyP2pRoomCode()" title="Copy Room Code">
                          <span>Copy Code</span>
                        </button>
                        <button type="button" id="p2p-copy-url-btn" class="p2p-btn-secondary mono-copy text-xs" onclick="window.copyP2pJoinUrl()" title="Copy Direct Join Link">
                          <span>Copy Link</span>
                        </button>
                      </div>
                    </div>

                    <!-- Pairing QR Code Flyout Container -->
                    <div class="flex items-center gap-3">
                      <div class="p2p-qr-wrapper" id="p2p-qr-wrapper">
                        <div id="p2p-qr-container" class="p2p-qr-container"></div>
                        <span class="mono-copy text-[10px] text-text-secondary block text-center mt-1">Scan with phone camera</span>
                      </div>
                      <button type="button" class="p2p-btn-danger mono-copy text-xs" onclick="window.disconnectP2p()">
                        <span>Leave Room</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 2. Transfer Mode Tabs (Files vs Snippets) -->
              <div class="p2p-tabs-bar mt-4">
                <button type="button" id="p2p-tab-files" class="p2p-tab-btn active mono-copy" onclick="window.setP2pStudioTab('files')">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                  <span>Files & Documents</span>
                </button>
                <button type="button" id="p2p-tab-snippets" class="p2p-tab-btn mono-copy" onclick="window.setP2pStudioTab('snippets')">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
                  <span>Code Snippet Pad</span>
                </button>
              </div>

              <!-- 3A. Files Section -->
              <div id="p2p-files-view" class="p2p-view-section mt-4">
                <!-- Dropzone for Files -->
                <div class="p2p-dropzone p2p-disabled mono-copy" id="p2p-dropzone" onclick="document.getElementById('p2p-file-input').click()">
                  <input type="file" id="p2p-file-input" multiple style="display: none;" onchange="if(this.files.length) window.sendP2pFiles(this.files)" />
                  <div class="p2p-dropzone-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                  </div>
                  <div class="font-semibold text-text-primary text-sm mb-1">Drop Files to Stream to Peer</div>
                  <div class="text-xs text-text-secondary max-w-sm">PDFs, lab assignments, ZIPs, photos, videos, or source code. Files stream in 64KB encrypted chunks directly to your peer.</div>
                </div>

                <!-- Outgoing Progress Bar -->
                <div id="p2p-outgoing-progress" class="p2p-progress-box mono-copy mt-3" style="display: none;">
                  <div class="flex justify-between text-xs mb-1">
                    <span id="p2p-outgoing-name" class="font-semibold text-text-primary truncate">Sending file...</span>
                    <span id="p2p-outgoing-stat" class="text-text-secondary">0%</span>
                  </div>
                  <div class="p2p-progress-track">
                    <div id="p2p-outgoing-bar" class="p2p-progress-bar outgoing"></div>
                  </div>
                </div>

                <!-- Incoming Progress Bar -->
                <div id="p2p-incoming-progress" class="p2p-progress-box mono-copy mt-3" style="display: none;">
                  <div class="flex justify-between text-xs mb-1">
                    <span id="p2p-incoming-text" class="font-semibold text-text-primary">Receiving file from peer...</span>
                  </div>
                  <div class="p2p-progress-track">
                    <div id="p2p-incoming-bar" class="p2p-progress-bar incoming"></div>
                  </div>
                </div>

                <!-- Received Files Section -->
                <div class="mt-6">
                  <div class="flex justify-between items-center mb-3">
                    <span class="mono-copy text-xs font-semibold text-text-primary uppercase tracking-wider flex items-center gap-2">
                      <span>Received Files</span>
                      <span class="p2p-badge-count" id="p2p-received-count"></span>
                    </span>
                    <label class="mono-copy text-xs text-text-secondary flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" id="p2p-opt-auto-download" checked />
                      <span>Auto-download to device</span>
                    </label>
                  </div>
                  <div id="p2p-received-list" class="p2p-received-grid">
                    <!-- Populated dynamically -->
                  </div>
                </div>
              </div>

              <!-- 3B. Code Snippet Section -->
              <div id="p2p-snippets-view" class="p2p-view-section mt-4" style="display: none;">
                <div class="p2p-card p-4">
                  <div class="flex flex-wrap gap-2 mb-3">
                    <input type="text" id="p2p-snippet-title" placeholder="Snippet Title (e.g. lab_solution.cpp)" class="gst-input mono-copy text-xs" style="flex: 2; min-width: 180px;" />
                    <select id="p2p-snippet-lang" class="select-control mono-copy text-xs" style="flex: 1; min-width: 120px;">
                      <option value="cpp">C++</option>
                      <option value="python">Python</option>
                      <option value="java">Java</option>
                      <option value="javascript">JavaScript</option>
                      <option value="typescript">TypeScript</option>
                      <option value="sql">SQL</option>
                      <option value="html">HTML / CSS</option>
                      <option value="text">Plain Text</option>
                    </select>
                    <button type="button" id="p2p-send-snippet-btn" class="paper-cta-btn group" onclick="window.sendP2pCodeSnippet()" disabled>
                      <span class="cta-fill"></span>
                      <span class="relative z-10 flex items-center gap-2 mono-copy text-xs uppercase font-medium">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                        <span>Send Snippet</span>
                      </span>
                    </button>
                  </div>
                  <textarea id="p2p-snippet-code" rows="8" placeholder="Paste your code snippet or assignment solution here... Delivered instantly into peer's clipboard/view." class="p2p-code-textarea mono-copy text-xs w-full"></textarea>
                </div>

                <!-- Feed of Snippets -->
                <div class="mt-6">
                  <div class="mono-copy text-xs font-semibold text-text-primary uppercase tracking-wider mb-3">Code Snippets Stream</div>
                  <div id="p2p-snippets-list" class="p2p-snippets-stream">
                    <!-- Populated dynamically -->
                  </div>
                </div>
              </div>

            </div>
          </div>

          <!-- Main Architectural Drag and Drop Zone -->
          <div class="dropzone ${requiresInputFile && mode !== 'editor' ? '' : 'hidden'} p-10 sm:p-14 border border-dashed border-border hover:border-accent bg-bg-elevated cursor-pointer flex flex-col items-center justify-center text-center transition-all group" id="dropzone" style="display: ${requiresInputFile && mode !== 'editor' ? 'flex' : 'none'} !important; flex-direction: column; align-items: center; justify-content: center; text-align: center; width: 100%;" ${requiresInputFile && mode !== 'editor' ? '' : 'hidden'}>
            <div id="dropzone-icon-container" class="dropzone-icon-box w-12 h-12 border border-dashed border-border flex items-center justify-center mb-4 text-accent bg-bg group-hover:border-accent transition-colors mx-auto" style="width: 48px; height: 48px; margin-left: auto; margin-right: auto; margin-bottom: 1rem; display: flex; align-items: center; justify-content: center;">
              ${inputType === 'image' ? `
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
                  <circle cx="9" cy="9" r="2"></circle>
                  <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
                </svg>
              ` : inputType === 'markdown' ? `
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <path d="M10 12.5 8 15l2 2.5"></path>
                  <path d="m14 12.5 2 2.5-2 2.5"></path>
                </svg>
              ` : inputType === 'office' ? `
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
              ` : `
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="12" y1="18" x2="12" y2="12"></line>
                  <line x1="9" y1="15" x2="15" y2="15"></line>
                </svg>
              `}
            </div>
            <h2 class="hero-display text-2xl sm:text-3xl text-text-primary mb-1" id="dropzone-title">${initialDropTitle}</h2>
            <p class="mono-copy text-xs text-text-secondary mb-6 max-w-md leading-relaxed" id="dropzone-desc">${initialDropDesc}</p>
            <button type="button" class="paper-cta-btn group">
              <span class="cta-fill"></span>
              <span class="relative z-10 flex items-center gap-2 mono-copy" style="font-size: 0.75rem; text-transform: uppercase; font-weight: 600;">
                <span id="dropzone-btn-text">${initialDropBtn}</span>
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

            <!-- Post-Processing Community Support & Server Cost Banner -->
            <div class="result-support-banner border border-dashed border-border bg-bg p-5 max-w-lg mx-auto mt-6 text-center" id="result-support-banner">
              <div class="mono-copy text-[10px] text-[#7b61ff] tracking-widest uppercase mb-1.5 flex items-center justify-center gap-1.5 font-semibold">
                <span style="width: 6px; height: 6px; background: #7b61ff; border-radius: 50%;"></span>
                <span>COMMUNITY SUPPORTED • RUNNING 100% FREE FOR YOU</span>
              </div>
              <h4 class="hero-display text-lg text-text-primary mb-1">Servers Run 100% Free For You</h4>
              <p class="mono-copy text-xs text-text-secondary leading-relaxed max-w-md mx-auto mb-3.5">
                Our servers and client engines run 100% free with zero paywalls, subscriptions, or ads. If this tool saved you time or licensing fees today, consider voluntary support to help cover our edge CDN, high-speed servers & ongoing maintenance.
              </p>
              <div class="flex flex-col sm:flex-row items-center justify-center gap-2.5">
                <button type="button" onclick="openSupportModal()" class="paper-cta-btn group" style="display: inline-flex; align-items: center; justify-content: center; height: 38px; padding: 0 1.25rem; text-decoration: none; cursor: pointer;">
                  <span class="cta-fill"></span>
                  <span class="relative z-10 flex items-center justify-center gap-2 mono-copy text-xs uppercase font-semibold text-text-primary">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>
                    <span>☕ Support via UPI (Pay What You Want)</span>
                  </span>
                </button>
              </div>
              <div class="mono-copy text-[10px] text-text-muted mt-2.5">
                🔒 Direct settlement to verified merchant Wcode (PDF Tool) • Works with GPay, PhonePe, Paytm & any UPI app
              </div>
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

        <!-- Directory Backlink Callout -->
        <div class="mt-6 pt-5 border-t border-dashed border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div class="mono-copy text-xs text-text-secondary flex items-center gap-2">
            <span class="w-1.5 h-1.5 rounded-full bg-accent inline-block"></span>
            <span>Looking for a different document utility? Explore our full catalog of 35 local tools.</span>
          </div>
          <a href="/#all-tools" class="paper-cta-btn group" style="text-decoration: none;">
            <span class="cta-fill"></span>
            <span class="relative z-10 flex items-center gap-2 mono-copy text-xs uppercase font-medium">
              <span>View All 35 Tools Directory</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </span>
          </a>
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
