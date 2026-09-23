/**
 * DocPlatform Layout Views
 * Multi-page layout wrappers: Navigation Bar, BYOK AI Modal, Support Modal, and SaaS Footer.
 */

export const renderNavbar = (activeItem = '', isWideCanvas = false) => `
  <header class="site-header" style="position: fixed; top: 0; left: 0; right: 0; z-index: 50; background: var(--bg-glass); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); width: 100%;">
    <div id="site-header-inner" style="max-width: ${isWideCanvas ? '80rem' : '64rem'}; margin: 0 auto; height: 51px; display: flex; align-items: center; justify-content: space-between; border-left: 1px dashed var(--border); border-right: 1px dashed var(--border); border-bottom: 1px dashed var(--border); padding: 0 1.25rem; position: relative; transition: max-width 0.2s ease;">
      
      <!-- Brand Logo -->
      <a href="/" style="display: flex; align-items: center; gap: 0.55rem; text-decoration: none; color: var(--text-primary);">
        <div style="width: 24px; height: 24px; background: #7b61ff; border-radius: 3px; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 11px; color: #ffffff; font-family: 'JetBrains Mono', monospace;">
          DP
        </div>
        <span class="hero-display" style="font-size: 1.25rem; font-weight: 700; letter-spacing: -0.02em; color: var(--text-primary);">DocPlatform</span>
      </a>

      <!-- Monospace Navigation Links -->
      <nav class="mono-copy" style="display: flex; align-items: center; gap: 0.25rem; font-size: 0.75rem; color: var(--text-secondary);">
        <a href="/#featured-tools" style="padding: 0.35rem 0.65rem; text-decoration: none; color: inherit; transition: color 0.15s;" onmouseover="this.style.color='var(--text-primary)'" onmouseout="this.style.color='inherit'">Features</a>
        
        <!-- Tools Dropdown & Mega-Menu Group -->
        <div class="nav-tools-group" id="nav-tools-group">
          <a href="/#all-tools" class="nav-tools-btn flex items-center gap-1" id="nav-tools-btn" style="padding: 0.35rem 0.65rem; text-decoration: none; color: ${activeItem === 'tools' ? 'var(--text-primary)' : 'inherit'}; transition: color 0.15s;" onmouseover="this.style.color='var(--text-primary)'" onmouseout="this.style.color='inherit'">
            <span>Tools</span>
            <svg class="nav-tools-caret" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </a>

          <!-- Mega-Menu Dropdown Panel (Categorized Architecture Directory) -->
          <div class="nav-mega-menu" id="nav-mega-menu" role="menu" aria-label="PDF Tools Directory">
            <div class="mega-menu-grid">
              
              <!-- Col 1: Core PDF -->
              <div class="mega-menu-col">
                <div class="mega-menu-header">
                  <span class="mega-menu-cat-num">01</span>
                  <span>CORE PDF</span>
                </div>
                <div class="mega-menu-links">
                  <a href="/merge-pdf" class="mega-menu-link" onclick="handleMegaMenuNav(event, 'merge-pdf')">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="8" y="2" width="13" height="13" rx="2"/><path d="M4 8v11a2 2 0 0 0 2 2h11"/></svg>
                    <span>Merge PDF</span>
                  </a>
                  <a href="/split-pdf" class="mega-menu-link" onclick="handleMegaMenuNav(event, 'split-pdf')">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>
                    <span>Split PDF</span>
                  </a>
                  <a href="/compress-pdf" class="mega-menu-link" onclick="handleMegaMenuNav(event, 'compress-pdf')">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
                    <span>Compress PDF</span>
                  </a>
                  <a href="/delete-pdf-pages" class="mega-menu-link" onclick="handleMegaMenuNav(event, 'delete-pdf-pages')">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
                    <span>Organize Pages</span>
                  </a>
                  <a href="/rotate-pdf" class="mega-menu-link" onclick="handleMegaMenuNav(event, 'rotate-pdf')">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
                    <span>Rotate Pages</span>
                  </a>
                  <a href="/crop-pdf" class="mega-menu-link" onclick="handleMegaMenuNav(event, 'crop-pdf')">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2v14a2 2 0 0 0 2 2h14"/><path d="M18 22V8a2 2 0 0 0-2-2H2"/></svg>
                    <span>Crop & Resize</span>
                  </a>
                  <a href="/extract-pages" class="mega-menu-link" onclick="handleMegaMenuNav(event, 'extract-pages')">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
                    <span>Extract Pages</span>
                  </a>
                  <a href="/flatten-pdf" class="mega-menu-link" onclick="handleMegaMenuNav(event, 'flatten-pdf')">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 13.74a2 2 0 0 1-2 0L2.5 8.87a1 1 0 0 1 0-1.74L11 2.26a2 2 0 0 1 2 0l8.5 4.87a1 1 0 0 1 0 1.74z"/><path d="m20 14.285 1.5.845a1 1 0 0 1 0 1.74L13 21.74a2 2 0 0 1-2 0l-8.5-4.87a1 1 0 0 1 0-1.74l1.5-.845"/></svg>
                    <span>Flatten Forms</span>
                  </a>
                  <a href="/repair-pdf" class="mega-menu-link" onclick="handleMegaMenuNav(event, 'repair-pdf')">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z"/></svg>
                    <span>Repair Corrupted</span>
                  </a>
                  <a href="/edit-pdf" class="mega-menu-link" onclick="handleMegaMenuNav(event, 'edit-pdf')">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 4v16"/><path d="M4 7V5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2"/><path d="M9 20h6"/></svg>
                    <span>Visual PDF Editor</span>
                  </a>
                </div>
              </div>

              <!-- Col 2: Conversions -->
              <div class="mega-menu-col">
                <div class="mega-menu-header">
                  <span class="mega-menu-cat-num">02</span>
                  <span>CONVERT</span>
                </div>
                <div class="mega-menu-links">
                  <a href="/pdf-to-word" class="mega-menu-link" onclick="handleMegaMenuNav(event, 'pdf-to-word')">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                    <span>PDF to Word</span>
                  </a>
                  <a href="/word-to-pdf" class="mega-menu-link" onclick="handleMegaMenuNav(event, 'word-to-pdf')">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    <span>Word to PDF</span>
                  </a>
                  <a href="/pdf-to-excel" class="mega-menu-link" onclick="handleMegaMenuNav(event, 'pdf-to-excel')">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/></svg>
                    <span>PDF to Excel</span>
                  </a>
                  <a href="/excel-to-pdf" class="mega-menu-link" onclick="handleMegaMenuNav(event, 'excel-to-pdf')">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/><path d="M8 13h2"/><path d="M14 13h2"/></svg>
                    <span>Excel to PDF</span>
                  </a>
                  <a href="/jpg-to-pdf" class="mega-menu-link" onclick="handleMegaMenuNav(event, 'jpg-to-pdf')">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22h6a2 2 0 0 0 2-2V8a2.4 2.4 0 0 0-.706-1.706l-3.588-3.588A2.4 2.4 0 0 0 14 2H6a2 2 0 0 0-2 2v6"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/><path d="M7 14v8"/></svg>
                    <span>Images to PDF</span>
                  </a>
                  <a href="/pdf-to-jpg" class="mega-menu-link" onclick="handleMegaMenuNav(event, 'pdf-to-jpg')">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                    <span>PDF to Images</span>
                  </a>
                  <a href="/markdown-to-pdf" class="mega-menu-link" onclick="handleMegaMenuNav(event, 'markdown-to-pdf')">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/><path d="M20 21H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2z"/></svg>
                    <span>Markdown to PDF</span>
                  </a>
                  <a href="/pdf-to-markdown" class="mega-menu-link" onclick="handleMegaMenuNav(event, 'pdf-to-markdown')">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 14 12 9 7 14"/><line x1="12" y1="9" x2="12" y2="21"/><path d="M20 21H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2z"/></svg>
                    <span>PDF to Markdown</span>
                  </a>
                </div>
              </div>

              <!-- Col 3: Security & Sign -->
              <div class="mega-menu-col">
                <div class="mega-menu-header">
                  <span class="mega-menu-cat-num">03</span>
                  <span>SECURITY & SIGN</span>
                </div>
                <div class="mega-menu-links">
                  <a href="/draw-signature" class="mega-menu-link" onclick="handleMegaMenuNav(event, 'draw-signature')">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m18 2 4 4-12 12H6v-4L18 2z"/></svg>
                    <span>Draw & Sign</span>
                  </a>
                  <a href="/protect-pdf" class="mega-menu-link" onclick="handleMegaMenuNav(event, 'protect-pdf')">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    <span>Protect PDF</span>
                  </a>
                  <a href="/unlock-pdf" class="mega-menu-link" onclick="handleMegaMenuNav(event, 'unlock-pdf')">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>
                    <span>Unlock PDF</span>
                  </a>
                  <a href="/watermark-pdf" class="mega-menu-link" onclick="handleMegaMenuNav(event, 'watermark-pdf')">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>
                    <span>Watermark PDF</span>
                  </a>
                  <a href="/page-numbers-pdf" class="mega-menu-link" onclick="handleMegaMenuNav(event, 'page-numbers-pdf')">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" x2="20" y1="9" y2="9"/><line x1="4" x2="20" y1="15" y2="15"/><line x1="10" x2="8" y1="3" y2="21"/><line x1="16" x2="14" y1="3" y2="21"/></svg>
                    <span>Page Numbers</span>
                  </a>
                  <a href="/strip-metadata-pdf" class="mega-menu-link" onclick="handleMegaMenuNav(event, 'strip-metadata-pdf')">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>
                    <span>Privacy Scanner</span>
                  </a>
                  <a href="/redact-pdf" class="mega-menu-link" onclick="handleMegaMenuNav(event, 'redact-pdf')">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    <span>Redact Sensitive</span>
                  </a>
                  <a href="/p2p-share" class="mega-menu-link" onclick="handleMegaMenuNav(event, 'p2p-share')">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                    <span>P2P File & Code Share <span class="mega-badge">NEW</span></span>
                  </a>
                </div>
              </div>

              <!-- Col 4: AI & Intelligence -->
              <div class="mega-menu-col">
                <div class="mega-menu-header">
                  <span class="mega-menu-cat-num">04</span>
                  <span>AI & OCR</span>
                </div>
                <div class="mega-menu-links">
                  <a href="/chat-with-pdf" class="mega-menu-link" onclick="handleMegaMenuNav(event, 'chat-with-pdf')">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    <span>Chat with PDF</span>
                  </a>
                  <a href="/ai-summarize" class="mega-menu-link" onclick="handleMegaMenuNav(event, 'ai-summarize')">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3z"/></svg>
                    <span>AI Summarizer</span>
                  </a>
                  <a href="/ai-extract-table" class="mega-menu-link" onclick="handleMegaMenuNav(event, 'ai-extract-table')">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/></svg>
                    <span>Extract Tables</span>
                  </a>
                  <a href="/ocr-pdf" class="mega-menu-link" onclick="handleMegaMenuNav(event, 'ocr-pdf')">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                    <span>OCR Scanner</span>
                  </a>
                  <a href="/compare-pdf" class="mega-menu-link" onclick="handleMegaMenuNav(event, 'compare-pdf')">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M13 6h3a2 2 0 0 1 2 2v7"/><path d="M11 18H8a2 2 0 0 1-2-2V9"/></svg>
                    <span>Compare PDFs</span>
                  </a>
                </div>
              </div>

              <!-- Col 5: Business & Tax Studio -->
              <div class="mega-menu-col">
                <div class="mega-menu-header">
                  <span class="mega-menu-cat-num">05</span>
                  <span>BUSINESS & TAX</span>
                </div>
                <div class="mega-menu-links">
                  <a href="/gst-invoice" class="mega-menu-link" onclick="handleMegaMenuNav(event, 'gst-invoice')">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M7 15h0M2 9.5h20"/></svg>
                    <span>GST Studio <span class="mega-badge">NEW</span></span>
                  </a>
                  <a href="/clean-billing" class="mega-menu-link" onclick="handleMegaMenuNav(event, 'clean-billing')">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                    <span>Minimal POS Billing</span>
                  </a>
                  <a href="/tax-receipt" class="mega-menu-link" onclick="handleMegaMenuNav(event, 'tax-receipt')">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/></svg>
                    <span>Tax Receipt Maker</span>
                  </a>
                  <a href="/estimate-maker" class="mega-menu-link" onclick="handleMegaMenuNav(event, 'estimate-maker')">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
                    <span>Estimate & Quotes</span>
                  </a>
                </div>
              </div>

            </div>

            <!-- Architectural Bottom Bar -->
            <div class="mega-menu-footer">
              <div class="mega-menu-footer-privacy">
                <span class="privacy-dot"></span>
                <span>35 IN-BROWSER TOOLS • 100% PRIVATE • ZERO DATA UPLOAD</span>
              </div>
              <a href="/#all-tools" class="mega-menu-footer-all">
                <span>VIEW COMPLETE DIRECTORY (35)</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
              </a>
            </div>
          </div>
        </div>

        <a href="/pricing" style="padding: 0.35rem 0.6rem; text-decoration: none; color: ${activeItem === 'pricing' ? '#7b61ff' : 'inherit'}; transition: color 0.15s;" onmouseover="this.style.color='var(--text-primary)'" onmouseout="this.style.color='inherit'">Pricing</a>
      </nav>

      <!-- Actions: Theme Toggle, BYOK Key & Support -->
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <button type="button" onclick="toggleTheme()" class="mono-copy" style="display: inline-flex; align-items: center; justify-content: center; height: 30px; width: 30px; border: 1px solid var(--border); background: var(--bg-elevated); color: var(--text-secondary); cursor: pointer;" title="Toggle theme">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
        </button>

        <button type="button" class="mono-copy" id="nav-byok-btn" onclick="openApiKeyModal()" style="display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.3rem 0.65rem; border: 1px solid var(--border); background: var(--bg-elevated); font-size: 0.7rem; color: var(--text-primary); cursor: pointer;" title="Configure free Google Gemini API Key">
          <span class="byok-status-dot" id="byok-status-dot" style="width: 6px; height: 6px; border-radius: 50%; background: #94a3b8;"></span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#7b61ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="7.5" cy="15.5" r="4.5"/><path d="m21 3-9.5 9.5"/><path d="m15.5 7.5 3 3"/></svg>
          <span id="byok-btn-text">AI Key</span>
        </button>

        <button type="button" class="mono-copy" id="nav-support-btn" onclick="openSupportModal()" style="display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.3rem 0.65rem; border: 1px solid #7b61ff; background: rgba(123, 97, 255, 0.1); font-size: 0.7rem; color: #7b61ff; cursor: pointer;">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" y1="2" x2="6" y2="4"/><line x1="10" y1="2" x2="10" y2="4"/><line x1="14" y1="2" x2="14" y2="4"/></svg>
          <span>Tip</span>
        </button>
      </div>

    </div>
  </header>

  <!-- Support & Donation Modal (Official Wcode Razorpay UPI Merchant) -->
  <div class="support-modal-backdrop" id="support-modal-backdrop" onclick="closeSupportModal()"></div>
  <div class="support-modal" id="support-modal" role="dialog" aria-modal="true" aria-label="Support DocPlatform">
    <button class="modal-close-btn" onclick="closeSupportModal()" aria-label="Close">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
    <div class="support-modal-header" style="margin-bottom: 0.85rem;">
      <div class="mono-copy" style="font-size: 0.68rem; color: #7b61ff; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 0.4rem;">
        [ COMMUNITY SUPPORT • UPI MERCHANT ]
      </div>
      <h2 class="hero-display" style="font-size: 1.75rem; font-weight: 400; color: var(--text-primary); margin-bottom: 0.35rem;">Support Wcode PDF Tool</h2>
      <p class="mono-copy" style="font-size: 0.74rem; color: var(--text-secondary); line-height: 1.5; margin: 0;">
        DocPlatform is <strong>100% free with zero paywalls & zero tracking</strong>. If this tool saved you software license fees or hours of work, support edge development by scanning the official verified merchant QR below.
      </p>
    </div>

    <!-- Official Razorpay Merchant Poster Card -->
    <div class="upi-merchant-container" style="background: var(--bg); border: 1px dashed var(--border); padding: 1rem; text-align: center; margin-bottom: 0.85rem;">
      <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 0.4rem; margin-bottom: 0.75rem;">
        <span class="mono-copy" style="font-size: 0.65rem; color: #10b981; background: rgba(16, 185, 129, 0.08); border: 1px dashed rgba(16, 185, 129, 0.3); padding: 0.2rem 0.55rem; display: inline-flex; align-items: center; gap: 0.35rem;">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          VERIFIED MERCHANT: <strong>WCODE (PDF TOOL)</strong>
        </span>
        <span class="mono-copy" style="font-size: 0.65rem; color: #3b82f6; background: rgba(59, 130, 246, 0.08); border: 1px dashed rgba(59, 130, 246, 0.3); padding: 0.2rem 0.55rem; display: inline-flex; align-items: center; gap: 0.35rem;">
          POWERED BY RAZORPAY UPI
        </span>
      </div>

      <div class="upi-poster-wrapper" style="display: inline-block; position: relative; margin: 0 auto 0.65rem; max-width: 200px; width: 100%;">
        <img src="/images/wcode-upi-qr.png" alt="Wcode PDF Tool Official Razorpay UPI QR Code" id="upi-qr-image" style="width: 100%; height: auto; display: block; border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 6px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5); margin: 0 auto;" />
      </div>

      <!-- VPA Copy Bar -->
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; background: var(--bg-elevated); border: 1px dashed var(--border); padding: 0.45rem 0.65rem; text-align: left; margin-top: 0.4rem;">
        <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          <span class="mono-copy" style="font-size: 0.6rem; color: var(--text-muted); display: block; text-transform: uppercase; letter-spacing: 0.05em;">UPI ID / VPA</span>
          <span class="mono-copy" id="merchant-vpa-text" style="font-size: 0.76rem; font-weight: 600; color: var(--text-primary); letter-spacing: 0.02em;">wcode883153.rzp@rxairtel</span>
        </div>
        <button type="button" class="mono-copy" id="copy-vpa-btn" onclick="copyMerchantVpa()" style="background: rgba(123, 97, 255, 0.12); border: 1px solid #7b61ff; color: #7b61ff; padding: 0.28rem 0.6rem; font-size: 0.68rem; cursor: pointer; display: inline-flex; align-items: center; gap: 0.3rem; flex-shrink: 0; transition: all 0.15s;">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
          <span id="copy-vpa-label">Copy VPA</span>
        </button>
      </div>
    </div>

    <!-- Modal CTAs -->
    <div class="support-cta-box">
      <a href="upi://pay?cu=INR&mc=8241&mode=19&pa=wcode883153.rzp@rxairtel&tn=Payment%20To%20Wcode&tr=TfWAYAYsmincbzqrv2" class="support-submit-btn paper-cta-btn group" id="support-submit-btn" style="width: 100%; justify-content: center; text-decoration: none;">
        <span class="cta-fill"></span>
        <span class="relative z-10 flex items-center justify-center gap-2" style="font-family: 'JetBrains Mono', monospace; font-size: 0.76rem; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase;">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          <span>Open Any UPI App (Mobile)</span>
        </span>
      </a>
      
      <div style="display: flex; justify-content: center; gap: 0.5rem; margin-top: 0.15rem;">
        <a href="/images/wcode-razorpay-qr.jpg" download="wcode-pdf-tool-upi-qr.jpg" class="mono-copy" style="font-size: 0.65rem; color: var(--text-secondary); text-decoration: none; display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.25rem 0.55rem; border: 1px dashed var(--border); background: var(--bg); transition: all 0.15s;">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          <span>Save Official QR Poster</span>
        </a>
      </div>

      <p class="mono-copy" style="font-size: 0.64rem; color: var(--text-muted); text-align: center; margin: 0.35rem 0 0; line-height: 1.4;">
        🔒 Direct settlement to verified merchant Wcode • Works with Google Pay, PhonePe, Paytm, BHIM & all banking apps
      </p>
    </div>
  </div>

  <!-- BYOK (Bring Your Own Key) Settings Modal -->
  <div class="byok-modal-backdrop" id="byok-modal-backdrop" onclick="closeApiKeyModal()"></div>
  <div class="byok-modal" id="byok-modal" role="dialog" aria-modal="true" aria-label="AI API Key Configuration">
    <button class="modal-close-btn" onclick="closeApiKeyModal()" aria-label="Close">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
    <div class="byok-modal-header">
      <div class="mono-copy" style="font-size: 0.68rem; color: #7b61ff; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 0.4rem;">
        [ BYOK • ZERO SERVER PERSISTENCE ]
      </div>
      <h2 class="hero-display" style="font-size: 1.85rem; font-weight: 400; color: var(--text-primary); margin-bottom: 0.35rem;">Bring Your Own Key</h2>
      <p class="mono-copy" style="font-size: 0.75rem; color: var(--text-secondary); line-height: 1.5; margin: 0;">
        DocPlatform uses direct browser-to-Gemini execution. Your key is stored <strong>strictly in your browser's localStorage</strong> and is never logged or saved on our servers.
      </p>
    </div>

    <!-- Monospace Quick Steps -->
    <div class="byok-help-card" style="background: var(--bg-subtle); border: 1px dashed var(--border); border-radius: 0px; padding: 0.85rem 1rem; margin-bottom: 1.25rem;">
      <div class="mono-copy" style="font-size: 0.72rem; color: var(--text-secondary); display: flex; flex-direction: column; gap: 0.45rem;">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <span style="color: #7b61ff; font-weight: 700;">[01]</span>
          <span>Get a free key at <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener" style="color: var(--text-primary); font-weight: 600; text-decoration: underline;">Google AI Studio</a>.</span>
        </div>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <span style="color: #7b61ff; font-weight: 700;">[02]</span>
          <span>Click <strong>"Create API Key"</strong> and copy it.</span>
        </div>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <span style="color: #7b61ff; font-weight: 700;">[03]</span>
          <span>Paste below & save. (Free tier: 15 req/min, 1M TPM).</span>
        </div>
      </div>
    </div>

    <form class="byok-form" onsubmit="saveApiKeyFromModal(event)">
      <div class="byok-field">
        <label for="gemini-api-key-input" class="mono-copy" style="font-size: 0.68rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); display: block; margin-bottom: 0.4rem;">
          Google Gemini API Key
        </label>
        <div class="byok-input-wrapper">
          <input type="password" id="gemini-api-key-input" placeholder="AIzaSy..." autocomplete="off" class="mono-copy" style="width: 100%; height: 38px; padding: 0 2.5rem 0 0.85rem; border: 1px solid var(--border); background: var(--bg); color: var(--text-primary); font-size: 0.8rem; border-radius: 0px; outline: none; transition: border-color 0.15s;" />
          <button type="button" class="byok-toggle-visibility" onclick="toggleKeyVisibility()" aria-label="Toggle password visibility" style="position: absolute; right: 0.6rem; background: none; border: none; cursor: pointer; color: var(--text-muted); display: flex; align-items: center;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
          </button>
        </div>
      </div>

      <div class="byok-btn-row" style="display: flex; gap: 0.6rem; margin-top: 1rem;">
        <button type="submit" class="paper-cta-btn group" style="flex: 2; height: 38px; justify-content: center;">
          <span class="cta-fill"></span>
          <span class="relative z-10 mono-copy" style="font-size: 0.75rem; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase;">Save API Key</span>
        </button>
        <button type="button" class="mono-copy" onclick="clearApiKeyFromModal()" style="flex: 1; height: 38px; border: 1px dashed var(--border); background: transparent; color: var(--text-muted); font-size: 0.72rem; cursor: pointer; border-radius: 0px; transition: all 0.15s;" onmouseover="this.style.borderColor='var(--text-primary)'; this.style.color='var(--text-primary)'" onmouseout="this.style.borderColor='var(--border)'; this.style.color='var(--text-muted)'">
          Remove Key
        </button>
      </div>
      <p class="byok-status-message mono-copy" id="byok-status-msg" style="font-size: 0.72rem; text-align: center; margin-top: 0.6rem; min-height: 1.2rem;"></p>
    </form>
  </div>

  <script>
    // ── Global BYOK & Support Modal Management ──────────────────────────────
    function getStoredGeminiKey() {
      return localStorage.getItem('dp_user_gemini_key') || '';
    }

    function updateByokBadge() {
      const key = getStoredGeminiKey();
      const dot = document.getElementById('byok-status-dot');
      const text = document.getElementById('byok-btn-text');
      const btn = document.getElementById('nav-byok-btn');
      if (dot && text && btn) {
        if (key && key.length > 5) {
          dot.className = 'byok-status-dot active';
          text.textContent = 'AI Key Active';
          btn.classList.add('active');
        } else {
          dot.className = 'byok-status-dot';
          text.textContent = 'AI Key';
          btn.classList.remove('active');
        }
      }
    }

    function openApiKeyModal() {
      const modal = document.getElementById('byok-modal');
      const backdrop = document.getElementById('byok-modal-backdrop');
      const input = document.getElementById('gemini-api-key-input');
      const msg = document.getElementById('byok-status-msg');
      if (input) input.value = getStoredGeminiKey();
      if (msg) msg.textContent = '';
      if (modal && backdrop) {
        modal.classList.add('open');
        backdrop.classList.add('open');
        document.body.style.overflow = 'hidden';
        if (window.smoother) window.smoother.paused(true);
      }
    }

    function closeApiKeyModal() {
      const modal = document.getElementById('byok-modal');
      const backdrop = document.getElementById('byok-modal-backdrop');
      if (modal && backdrop) {
        modal.classList.remove('open');
        backdrop.classList.remove('open');
        document.body.style.overflow = '';
        if (window.smoother) window.smoother.paused(false);
      }
    }

    async function saveApiKeyFromModal(e) {
      if (e) e.preventDefault();
      const input = document.getElementById('gemini-api-key-input');
      const msg = document.getElementById('byok-status-msg');
      const val = (input?.value || '').trim();
      if (!val) {
        if (msg) { msg.textContent = 'Please enter an API key or click Remove Key.'; msg.style.color = '#dc2626'; }
        return;
      }

      if (msg) {
        msg.textContent = '🔄 Validating key with Google Gemini API...';
        msg.style.color = '#6366f1';
      }

      try {
        const testRes = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + encodeURIComponent(val), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: 'ping' }] }] })
        });
        const data = await testRes.json();
        if (!testRes.ok || data.error) {
          const errText = data.error?.message || 'API key is invalid or rejected by Google.';
          if (msg) {
            msg.textContent = '❌ Verification Failed: ' + errText;
            msg.style.color = '#dc2626';
          }
          return;
        }

        localStorage.setItem('dp_user_gemini_key', val);
        updateByokBadge();
        if (msg) {
          msg.textContent = '✅ Key verified & active with Google Gemini 2.0 Flash!';
          msg.style.color = '#16a34a';
        }
        setTimeout(() => closeApiKeyModal(), 1200);
      } catch (netErr) {
        localStorage.setItem('dp_user_gemini_key', val);
        updateByokBadge();
        if (msg) {
          msg.textContent = '⚠️ Key saved (offline network bypass).';
          msg.style.color = '#d97706';
        }
        setTimeout(() => closeApiKeyModal(), 1200);
      }
    }

    function clearApiKeyFromModal() {
      localStorage.removeItem('dp_user_gemini_key');
      const input = document.getElementById('gemini-api-key-input');
      const msg = document.getElementById('byok-status-msg');
      if (input) input.value = '';
      updateByokBadge();
      if (msg) { msg.textContent = 'Key removed from browser storage.'; msg.style.color = '#475569'; }
    }

    function toggleKeyVisibility() {
      const input = document.getElementById('gemini-api-key-input');
      if (input) {
        input.type = input.type === 'password' ? 'text' : 'password';
      }
    }

    // ── Support / Donation Modal ─────────────────────────────────────────────
    let selectedTip = 5;
    function openSupportModal() {
      const modal = document.getElementById('support-modal');
      const backdrop = document.getElementById('support-modal-backdrop');
      if (modal && backdrop) {
        modal.classList.add('open');
        backdrop.classList.add('open');
        document.body.style.overflow = 'hidden';
        if (window.smoother) window.smoother.paused(true);
      }
    }

    function closeSupportModal() {
      const modal = document.getElementById('support-modal');
      const backdrop = document.getElementById('support-modal-backdrop');
      if (modal && backdrop) {
        modal.classList.remove('open');
        backdrop.classList.remove('open');
        document.body.style.overflow = '';
        if (window.smoother) window.smoother.paused(false);
      }
    }

    function copyMerchantVpa() {
      const vpa = 'wcode883153.rzp@rxairtel';
      const fallbackCopy = (text) => {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch (e) {}
        document.body.removeChild(ta);
      };

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(vpa).then(onSuccess).catch(() => {
          fallbackCopy(vpa);
          onSuccess();
        });
      } else {
        fallbackCopy(vpa);
        onSuccess();
      }

      function onSuccess() {
        const label = document.getElementById('copy-vpa-label');
        const btn = document.getElementById('copy-vpa-btn');
        if (label) label.textContent = 'Copied!';
        if (btn) {
          btn.style.background = 'rgba(16, 185, 129, 0.18)';
          btn.style.borderColor = '#10b981';
          btn.style.color = '#10b981';
        }
        setTimeout(() => {
          if (label) label.textContent = 'Copy VPA';
          if (btn) {
            btn.style.background = 'rgba(123, 97, 255, 0.12)';
            btn.style.borderColor = '#7b61ff';
            btn.style.color = '#7b61ff';
          }
        }, 2200);
      }
    }

    function selectTipAmount(amount, btnEl) {
      // Retained for backward-compatibility if invoked from any legacy view
    }

    // ── Mega-Menu Navigation & Hover Handlers ────────────────────────────────
    function handleMegaMenuNav(event, slug) {
      const group = document.getElementById('nav-tools-group');
      if (group) group.classList.remove('is-open');
      // Allow browser to follow href directly so all tool routes redirect reliably
    }

    (function initNavbarToolsMenu() {
      let timer = null;
      const group = document.getElementById('nav-tools-group');
      const menu = document.getElementById('nav-mega-menu');
      const btn = document.getElementById('nav-tools-btn');
      if (!group || !menu) return;

      function open() {
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
        group.classList.add('is-open');
      }

      function closeWithDelay() {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          group.classList.remove('is-open');
          timer = null;
        }, 200);
      }

      function closeImmediate() {
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
        group.classList.remove('is-open');
      }

      group.addEventListener('mouseenter', open);
      group.addEventListener('mouseleave', closeWithDelay);

      // Immediately close when hovering over any other nav element so buttons are 100% active and unblocked
      const header = group.closest('header') || document.querySelector('.site-header');
      if (header) {
        const otherNavItems = header.querySelectorAll('a:not(.nav-tools-btn):not(.mega-menu-link), button');
        otherNavItems.forEach(item => {
          item.addEventListener('mouseenter', closeImmediate);
        });
      }

      // Mobile toggle on touch (<860px)
      if (btn) {
        btn.addEventListener('click', (e) => {
          if (window.innerWidth <= 860) {
            e.preventDefault();
            group.classList.toggle('is-open');
          }
        });
      }

      document.addEventListener('click', (e) => {
        if (!group.contains(e.target)) {
          closeImmediate();
        }
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          closeImmediate();
          closeApiKeyModal();
          closeSupportModal();
        }
      });
    })();

    document.addEventListener('DOMContentLoaded', () => {
      updateByokBadge();
    });
  </script>
`;

export const renderFooter = () => `
  <footer style="margin-top: auto; border-top: 1px dashed var(--border); background: var(--bg); color: var(--text-muted);">
    <div style="max-width: 64rem; margin: 0 auto; border-left: 1px dashed var(--border); border-right: 1px dashed var(--border);">
      
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1px; background: var(--border);">
        
        <!-- Col 1: Brand -->
        <div style="background: var(--bg); padding: 1.5rem; display: flex; flex-direction: column; justify-content: space-between; gap: 1rem;">
          <div>
            <a href="/" style="display: flex; align-items: center; gap: 0.5rem; text-decoration: none; color: var(--text-primary);">
              <div style="width: 22px; height: 22px; background: #7b61ff; border-radius: 3px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 10px; color: #ffffff; font-family: 'JetBrains Mono', monospace;">
                DP
              </div>
              <span class="hero-display" style="font-size: 1.15rem; font-weight: 700; color: var(--text-primary);">DocPlatform</span>
            </a>
            <p class="mono-copy" style="font-size: 0.72rem; color: var(--text-secondary); margin-top: 0.75rem; line-height: 1.5;">
              Precision tools for your PDF workflows. 100% private in-browser document processing.
            </p>
          </div>
          <div class="mono-copy" style="font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em;">
            Designed for privacy & speed.
          </div>
        </div>

        <!-- Col 2: Product -->
        <div style="background: var(--bg); padding: 1.5rem; display: flex; flex-direction: column; gap: 0.6rem;">
          <div class="mono-copy" style="font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-muted);">Product</div>
          <a href="/merge-pdf" class="mono-copy" style="font-size: 0.75rem; color: var(--text-secondary); text-decoration: none;">PDF Tools</a>
          <a href="/gst-invoice" class="mono-copy" style="font-size: 0.75rem; color: var(--text-secondary); text-decoration: none;">GST Studio</a>
          <a href="/chat-with-pdf" class="mono-copy" style="font-size: 0.75rem; color: var(--text-secondary); text-decoration: none;">Chat with PDF</a>
          <a href="/ocr-pdf" class="mono-copy" style="font-size: 0.75rem; color: var(--text-secondary); text-decoration: none;">OCR Engine</a>
          <a href="/pricing" class="mono-copy" style="font-size: 0.75rem; color: var(--text-secondary); text-decoration: none;">Pricing</a>
        </div>

        <!-- Col 3: Company & Security -->
        <div style="background: var(--bg); padding: 1.5rem; display: flex; flex-direction: column; gap: 0.6rem;">
          <div class="mono-copy" style="font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-muted);">Company</div>
          <a href="/privacy" class="mono-copy" style="font-size: 0.75rem; color: var(--text-secondary); text-decoration: none;">Privacy First</a>
          <a href="/security" class="mono-copy" style="font-size: 0.75rem; color: var(--text-secondary); text-decoration: none;">Security Model</a>
          <a href="/terms" class="mono-copy" style="font-size: 0.75rem; color: var(--text-secondary); text-decoration: none;">Terms of Service</a>
        </div>

        <!-- Col 4: Architecture & Trust -->
        <div style="background: var(--bg); padding: 1.5rem; display: flex; flex-direction: column; justify-content: space-between; gap: 1rem;">
          <div style="display: flex; flex-direction: column; gap: 0.6rem;">
            <div class="mono-copy" style="font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-muted);">Architecture</div>
            <span class="mono-copy" style="font-size: 0.75rem; color: var(--text-secondary);">Client-Side WebAssembly</span>
            <span class="mono-copy" style="font-size: 0.75rem; color: var(--text-secondary);">Zero Server Persistence</span>
            <span class="mono-copy" style="font-size: 0.75rem; color: var(--text-secondary);">Local RAM Sandbox</span>
          </div>

          <div class="mono-copy" style="font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em;">
            100% Private Processing
          </div>
        </div>

      </div>

      <!-- Copyright Bar -->
      <div class="mono-copy" style="border-top: 1px dashed var(--border); padding: 0.9rem 1.5rem; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.5rem; font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-muted);">
        <div>© 2026 DOCPLATFORM. ALL RIGHTS RESERVED.</div>
        <div style="display: flex; align-items: center; gap: 0.4rem;">
          <span style="width: 4px; height: 4px; background: #7b61ff; border-radius: 50%;"></span>
          <span>CLIENT-SIDE PRIVACY ARCHITECTURE</span>
        </div>
      </div>

    </div>
  </footer>
`;

export const renderGsapScripts = () => `
  <!-- GSAP Core, ScrollTrigger & ScrollSmoother Engine (Local Offline-First) -->
  <script src="/vendor/gsap/gsap.min.js"></script>
  <script src="/vendor/gsap/ScrollTrigger.min.js"></script>
  <script src="/vendor/gsap/ScrollSmoother.min.js"></script>
  <script>
    (function() {
      function initSmoothScroller() {
        if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined' || typeof ScrollSmoother === 'undefined') return;
        if (window.smoother) return;

        gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

        const wrapper = document.getElementById('smooth-wrapper');
        const content = document.getElementById('smooth-content');
        if (!wrapper || !content) return;

        try {
          const smoother = ScrollSmoother.create({
            wrapper: '#smooth-wrapper',
            content: '#smooth-content',
            smooth: 1.15,
            effects: true,
            smoothTouch: 0.1,
            normalizeScroll: false,
            ignoreMobileResize: true
          });

          window.smoother = smoother;
          window.refreshScrollSmoother = function() {
            if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
          };

          // Smooth anchor links handling
          document.querySelectorAll('a[href*="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
              const href = this.getAttribute('href');
              if (!href) return;
              const hashIndex = href.indexOf('#');
              if (hashIndex === -1) return;
              const hash = href.substring(hashIndex);
              if (hash.length <= 1) return;
              const target = document.querySelector(hash);
              if (target) {
                e.preventDefault();
                smoother.scrollTo(target, true, 'top 65px');
              }
            });
          });
        } catch (err) {
          console.warn('ScrollSmoother initialization skipped:', err);
        }
      }

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSmoothScroller);
      } else {
        initSmoothScroller();
      }
    })();
  </script>
`;

// CommonJS fallback
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    renderNavbar,
    renderFooter,
    renderGsapScripts
  };
}
