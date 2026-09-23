/**
 * @file views/app-page.js
 * @description Main Tool Application Page Composer.
 *
 * Coordinates modular domain studios (Signature, GST, POS, Tax Receipt,
 * Estimate, Editor, P2P), workflow guides, specifications, and FAQs
 * adhering to the DocPlatform Architectural Minimalist Blueprint Design System.
 */

import { getToolContract } from '@doc-platform/core';
import { renderSignatureStudioView } from './studios/signature-studio-view.js';
import { renderGstStudioView } from './studios/gst-studio-view.js';
import { renderPosStudioView } from './studios/pos-studio-view.js';
import { renderTaxReceiptStudioView } from './studios/tax-receipt-studio-view.js';
import { renderEstimateStudioView } from './studios/estimate-studio-view.js';
import { renderPdfEditorStudioView } from './studios/pdf-editor-studio-view.js';
import { renderP2pStudioView } from './studios/p2p-studio-view.js';
import { renderResultSupportBanner } from './components/support-banner.js';
import { renderHowToSection } from './components/how-to-section.js';
import { renderKeyFeaturesSection } from './components/key-features-section.js';
import { renderRelatedToolsSection } from './components/related-tools-section.js';
import { renderFaqAccordion } from './components/faq-accordion.js';

export const TOOL_ICONS_MAP = {
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

          <!-- Domain Studios (Modular) -->
          ${renderSignatureStudioView({ studioId })}
          ${renderGstStudioView({ studioId })}
          ${renderPosStudioView({ studioId })}
          ${renderTaxReceiptStudioView({ studioId })}
          ${renderEstimateStudioView({ studioId })}
          ${renderPdfEditorStudioView({ studioId })}
          ${renderP2pStudioView({ studioId })}

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

            ${renderResultSupportBanner()}

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

      <!-- Workflow, Features, Related Ecosystem & FAQs (Modular Components) -->
      ${renderHowToSection(toolConfig)}
      ${renderKeyFeaturesSection(toolConfig)}
      ${renderRelatedToolsSection(relatedSlugs, TOOL_REGISTRY)}
      ${renderFaqAccordion(toolConfig)}

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
    getRelatedToolsList,
    TOOL_ICONS_MAP
  };
}
