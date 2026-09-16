/**
 * DocPlatform Layout Views
 * Multi-page layout wrappers: Navigation Bar, BYOK AI Modal, Support Modal, and SaaS Footer.
 */

export const renderNavbar = (activeItem = '') => `
  <header style="position: sticky; top: 0; z-index: 50; background: var(--bg-glass); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); width: 100%;">
    <div style="max-width: 64rem; margin: 0 auto; height: 51px; display: flex; align-items: center; justify-content: space-between; border-left: 1px dashed var(--border); border-right: 1px dashed var(--border); border-bottom: 1px dashed var(--border); padding: 0 1.25rem;">
      
      <!-- Brand Logo -->
      <a href="/" style="display: flex; align-items: center; gap: 0.55rem; text-decoration: none; color: var(--text-primary);">
        <div style="width: 24px; height: 24px; background: #7b61ff; border-radius: 3px; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 11px; color: #ffffff; font-family: 'JetBrains Mono', monospace;">
          DP
        </div>
        <span class="hero-display" style="font-size: 1.25rem; font-weight: 700; letter-spacing: -0.02em; color: var(--text-primary);">DocPlatform</span>
      </a>

      <!-- Monospace Navigation Links -->
      <nav class="mono-copy" style="display: flex; align-items: center; gap: 0.25rem; font-size: 0.75rem; color: var(--text-secondary);">
        <a href="/#featured-tools" style="padding: 0.35rem 0.6rem; text-decoration: none; color: inherit; transition: color 0.15s;" onmouseover="this.style.color='var(--text-primary)'" onmouseout="this.style.color='inherit'">Features</a>
        <a href="/#all-tools" style="padding: 0.35rem 0.6rem; text-decoration: none; color: inherit; transition: color 0.15s;" onmouseover="this.style.color='var(--text-primary)'" onmouseout="this.style.color='inherit'">Tools</a>
        <a href="/pricing" style="padding: 0.35rem 0.6rem; text-decoration: none; color: ${activeItem === 'pricing' ? '#7b61ff' : 'inherit'}; transition: color 0.15s;" onmouseover="this.style.color='var(--text-primary)'" onmouseout="this.style.color='inherit'">Pricing</a>
      </nav>

      <!-- Actions: Theme Toggle, BYOK Key & Support -->
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <button type="button" onclick="toggleTheme()" class="mono-copy" style="display: inline-flex; align-items: center; justify-content: center; height: 30px; width: 30px; border: 1px solid var(--border); background: var(--bg-elevated); color: var(--text-secondary); cursor: pointer;" title="Toggle theme">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
        </button>

        <button type="button" class="mono-copy" id="nav-byok-btn" onclick="openApiKeyModal()" style="display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.3rem 0.65rem; border: 1px solid var(--border); background: var(--bg-elevated); font-size: 0.7rem; color: var(--text-primary); cursor: pointer;" title="Configure free Google Gemini API Key">
          <span class="byok-status-dot" id="byok-status-dot" style="width: 6px; height: 6px; border-radius: 50%; background: #94a3b8;"></span>
          <span>AI Key</span>
        </button>

        <button type="button" class="mono-copy" id="nav-support-btn" onclick="openSupportModal()" style="display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.3rem 0.65rem; border: 1px solid #7b61ff; background: rgba(123, 97, 255, 0.1); font-size: 0.7rem; color: #7b61ff; cursor: pointer;">
          ☕ Tip
        </button>
      </div>

    </div>
  </header>

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
          <a href="https://github.com/upendrabisht22/pdf-tool" target="_blank" class="mono-copy" style="font-size: 0.75rem; color: var(--text-secondary); text-decoration: none;">Architecture Spec</a>
        </div>

        <!-- Col 4: Connect -->
        <div style="background: var(--bg); padding: 1.5rem; display: flex; flex-direction: column; justify-content: space-between; gap: 1rem;">
          <div style="display: flex; flex-direction: column; gap: 0.6rem;">
            <div class="mono-copy" style="font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-muted);">Connect</div>
            <a href="https://github.com/upendrabisht22/pdf-tool" target="_blank" class="mono-copy" style="font-size: 0.75rem; color: var(--text-secondary); text-decoration: none;">GitHub Repository</a>
            <a href="mailto:support@docplatform.app" class="mono-copy" style="font-size: 0.75rem; color: var(--text-secondary); text-decoration: none;">support@docplatform.app</a>
          </div>

          <div>
            <a href="https://github.com/upendrabisht22/pdf-tool" target="_blank" aria-label="GitHub" style="display: inline-flex; align-items: center; justify-content: center; height: 28px; width: 28px; border: 1px solid var(--border); color: var(--text-muted); text-decoration: none;">
              <svg width="13" height="13" fill="currentColor" viewBox="0 0 16 16"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"></path></svg>
            </a>
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

// CommonJS fallback
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    renderNavbar,
    renderFooter
  };
}
