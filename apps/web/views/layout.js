/**
 * DocPlatform Layout Views
 * Multi-page layout wrappers: Navigation Bar, BYOK AI Modal, Support Modal, and SaaS Footer.
 */

export const renderNavbar = (activeItem = '') => `
  <div class="navbar-wrapper">
    <header class="navbar">
      <a href="/" class="logo-container">
        <div class="logo-badge">DP</div>
        <span class="brand-title">DocPlatform</span>
      </a>
      <ul class="nav-links">
        <li><a href="/merge-pdf" class="nav-link ${activeItem === 'tools' ? 'active' : ''}">PDF Tools</a></li>
        <li><a href="/ai-ask" class="nav-link ${activeItem === 'ai' ? 'active' : ''}">AI & OCR</a></li>
        <li><a href="/#features" class="nav-link">Features</a></li>
        <li><a href="/pricing" class="nav-link ${activeItem === 'pricing' ? 'active' : ''}">Pricing & Support</a></li>
        <li><a href="/#faq" class="nav-link">FAQ</a></li>
      </ul>
      <div class="nav-action-area">
        <button class="nav-byok-btn" id="nav-byok-btn" onclick="openApiKeyModal()" title="Configure your free Google Gemini API Key for AI tools">
          <span class="byok-status-dot" id="byok-status-dot"></span>
          <span class="byok-btn-text" id="byok-btn-text">🔑 AI Key</span>
        </button>
        <button class="nav-support-btn" id="nav-support-btn" onclick="openSupportModal()">
          ☕ Support / Tip
        </button>
      </div>
    </header>
  </div>

  <!-- Support & Donation Modal -->
  <div class="support-modal-backdrop" id="support-modal-backdrop" onclick="closeSupportModal()"></div>
  <div class="support-modal" id="support-modal" role="dialog" aria-modal="true" aria-label="Support DocPlatform">
    <button class="modal-close-btn" onclick="closeSupportModal()" aria-label="Close">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
    <div class="support-modal-header">
      <div class="support-icon-badge">☕</div>
      <h2 class="support-modal-title">Support DocPlatform</h2>
      <p class="support-modal-desc">
        DocPlatform is <strong>100% free, private, and zero-login</strong> for everyone. If this tool saved you time or money, consider supporting our server & open development costs!
      </p>
    </div>
    
    <div class="tip-tiers-grid">
      <button class="tip-tier-card" onclick="selectTipAmount(3, this)">
        <span class="tip-emoji">☕</span>
        <span class="tip-amount">$3</span>
        <span class="tip-label">Buy a Coffee</span>
      </button>
      <button class="tip-tier-card active" onclick="selectTipAmount(5, this)">
        <span class="tip-emoji">🚀</span>
        <span class="tip-amount">$5</span>
        <span class="tip-label">Supporter</span>
      </button>
      <button class="tip-tier-card" onclick="selectTipAmount(15, this)">
        <span class="tip-emoji">🌟</span>
        <span class="tip-amount">$15</span>
        <span class="tip-label">Sponsor</span>
      </button>
    </div>

    <div class="support-cta-box">
      <a href="https://buymeacoffee.com" target="_blank" rel="noopener" class="support-submit-btn" id="support-submit-btn">
        <span>Tip $5 on BuyMeACoffee</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
      </a>
      <p class="support-note">🔒 Powered by secure external tip jar • Zero recurring fees • Voluntary gratitude</p>
    </div>
  </div>

  <!-- BYOK (Bring Your Own Key) Settings Modal -->
  <div class="byok-modal-backdrop" id="byok-modal-backdrop" onclick="closeApiKeyModal()"></div>
  <div class="byok-modal" id="byok-modal" role="dialog" aria-modal="true" aria-label="AI API Key Configuration">
    <button class="modal-close-btn" onclick="closeApiKeyModal()" aria-label="Close">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
    <div class="byok-modal-header">
      <div class="byok-icon-badge">🔑</div>
      <h2 class="byok-modal-title">AI API Key (BYOK)</h2>
      <p class="byok-modal-desc">
        To use <strong>Ask PDF (RAG Q&A)</strong> and <strong>AI Document Summarizer</strong> for free, provide your Google Gemini API Key. It is stored <strong>exclusively in your browser's localStorage</strong> and never saved on our servers.
      </p>
    </div>

    <form class="byok-form" onsubmit="saveApiKeyFromModal(event)">
      <div class="byok-field">
        <label for="gemini-api-key-input">Google Gemini API Key</label>
        <div class="byok-input-wrapper">
          <input type="password" id="gemini-api-key-input" placeholder="AIzaSy..." autocomplete="off" />
          <button type="button" class="byok-toggle-visibility" onclick="toggleKeyVisibility()">👁️</button>
        </div>
      </div>

      <div class="byok-help-card">
        <div class="byok-help-icon">💡</div>
        <div class="byok-help-text">
          <strong>How to get a Free Gemini Key in 10 seconds:</strong>
          <ol style="margin: 0.35rem 0 0 1.2rem; padding: 0; font-size: 0.8rem; color: var(--text-secondary); line-height: 1.4;">
            <li>Go to <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener" style="color: var(--brand-primary); font-weight: 600;">Google AI Studio (Free)</a>.</li>
            <li>Click <strong>"Create API Key"</strong>.</li>
            <li>Paste it here and click Save. Google provides free 15 requests/min.</li>
          </ol>
        </div>
      </div>

      <div class="byok-btn-row">
        <button type="submit" class="byok-save-btn">Save API Key</button>
        <button type="button" class="byok-clear-btn" onclick="clearApiKeyFromModal()">Remove Key</button>
      </div>
      <p class="byok-status-message" id="byok-status-msg"></p>
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
          text.textContent = '🟢 AI Key Active';
          btn.classList.add('active');
        } else {
          dot.className = 'byok-status-dot';
          text.textContent = '🔑 Add AI Key';
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
      }
    }

    function closeApiKeyModal() {
      const modal = document.getElementById('byok-modal');
      const backdrop = document.getElementById('byok-modal-backdrop');
      if (modal && backdrop) {
        modal.classList.remove('open');
        backdrop.classList.remove('open');
        document.body.style.overflow = '';
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
      }
    }

    function closeSupportModal() {
      const modal = document.getElementById('support-modal');
      const backdrop = document.getElementById('support-modal-backdrop');
      if (modal && backdrop) {
        modal.classList.remove('open');
        backdrop.classList.remove('open');
        document.body.style.overflow = '';
      }
    }

    function selectTipAmount(amount, btnEl) {
      selectedTip = amount;
      document.querySelectorAll('.tip-tier-card').forEach(b => b.classList.remove('active'));
      if (btnEl) btnEl.classList.add('active');
      const cta = document.getElementById('support-submit-btn');
      if (cta) {
        cta.innerHTML = '<span>Tip $' + amount + ' on BuyMeACoffee</span> <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>';
      }
    }

    document.addEventListener('DOMContentLoaded', () => {
      updateByokBadge();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeApiKeyModal();
        closeSupportModal();
      }
    });
  </script>
`;

export const renderFooter = () => `
  <footer class="footer">
    <div class="footer-container">
      <div class="footer-grid">
        <!-- Brand Column -->
        <div class="footer-brand">
          <a href="/" class="footer-logo">
            <div class="logo-badge">DP</div>
            <span class="brand-title">DocPlatform</span>
          </a>
          <p class="footer-desc">
            The private, high-fidelity document platform. Engineered for zero-leak privacy, precision vector fidelity, and enterprise AI intelligence.
          </p>
          <div class="footer-social-links">
            <a href="https://github.com/upendrabisht22/pdf-tool" target="_blank" rel="noopener" class="social-icon-btn" title="GitHub">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
            </a>
            <a href="https://twitter.com/intent/tweet?text=DocPlatform+-+100%25+free+private+PDF+tools+with+AI&url=https://docplatform.app" target="_blank" rel="noopener" class="social-icon-btn" title="Share on Twitter / X">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path></svg>
            </a>
            <a href="https://www.linkedin.com/sharing/share-offsite/?url=https://docplatform.app" target="_blank" rel="noopener" class="social-icon-btn" title="Share on LinkedIn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
            </a>
          </div>
        </div>

        <!-- Product Column -->
        <div>
          <h4 class="footer-col-title">Product</h4>
          <ul class="footer-links-list">
            <li><a href="/merge-pdf" class="footer-link">PDF Tools</a></li>
            <li><a href="/word-to-pdf" class="footer-link">Document Convert</a></li>
            <li><a href="/redact-pdf" class="footer-link">Security & Redaction</a></li>
            <li><a href="/ocr-pdf" class="footer-link">Multilingual OCR</a></li>
            <li><a href="/ai-ask" class="footer-link">AI Document Q&A</a></li>
            <li><a href="/pricing" class="footer-link">Pricing Plans</a></li>
          </ul>
        </div>

        <!-- Developers & API Column -->
        <div>
          <h4 class="footer-col-title">Developers</h4>
          <ul class="footer-links-list">
            <li><a href="/api/v1/health" class="footer-link" target="_blank">REST API Health</a></li>
            <li><a href="/#features" class="footer-link">Sandboxed Workers</a></li>
            <li><a href="/pricing" class="footer-link">API Rate Limits</a></li>
            <li><a href="https://github.com/upendrabisht22/pdf-tool" class="footer-link" target="_blank">Architecture Spec</a></li>
            <li>
              <div class="status-pill" style="margin-top: 0.5rem;">
                <span>●</span> All Systems Operational
              </div>
            </li>
          </ul>
        </div>

        <!-- Legal & Contact Column -->
        <div>
          <h4 class="footer-col-title">Company & Legal</h4>
          <ul class="footer-links-list">
            <li><a href="/privacy" class="footer-link">Privacy Policy</a></li>
            <li><a href="/terms" class="footer-link">Terms of Service</a></li>
            <li><a href="/security" class="footer-link">Security Whitepaper</a></li>
            <li><a href="mailto:support@docplatform.com" class="footer-link">support@docplatform.com</a></li>
            <li><span style="font-size: 0.85rem; color: var(--text-muted);">Bengaluru, India</span></li>
          </ul>
        </div>
      </div>

      <!-- Bottom Bar -->
      <div class="footer-bottom-bar">
        <div>© 2026 DocPlatform Inc. All rights reserved. Precision vector processing & zero cloud retention.</div>
        <div class="footer-bottom-links">
          <a href="/privacy" class="footer-bottom-link">Privacy Policy</a>
          <a href="/terms" class="footer-bottom-link">Terms of Service</a>
          <a href="/security" class="footer-bottom-link">Security Whitepaper</a>
          <a href="mailto:support@docplatform.com" class="footer-bottom-link">Contact Support</a>
        </div>
      </div>
    </div>
  </footer>
`;

// CommonJS fallback
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    renderNavbar,
    renderFooter
  };
}
