/**
 * @file views/components/support-banner.js
 * @description Voluntary community support and verified UPI merchant donation banner.
 */

/**
 * Renders the result community support banner.
 * @returns {string} HTML markup
 */
export function renderResultSupportBanner() {
  return `
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
  `;
}
