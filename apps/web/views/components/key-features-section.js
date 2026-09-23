/**
 * @file views/components/key-features-section.js
 * @description Key features, specifications and security guarantees section.
 */

/**
 * Renders the Key Features & Security section.
 * @param {Object} toolConfig
 * @returns {string} HTML markup
 */
export function renderKeyFeaturesSection(toolConfig) {
  const features = toolConfig.features || [];
  return `
    <!-- 2. Tool-Specific Key Features & Security (Vector SVGs - No Emojis) -->
    <section class="p-6 sm:p-10 border-b border-dashed border-border">
      <div class="mb-6">
        <span class="mono-copy text-[10px] text-accent uppercase tracking-widest">[ SPECIFICATION ]</span>
        <h2 class="hero-display text-2xl sm:text-3xl text-text-primary mt-1">Key Features & Security</h2>
        <p class="mono-copy text-xs text-text-secondary mt-1">Engineered with precision vector geometry, high-fidelity font preservation, and zero data storage.</p>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4" id="tool-features-container">
        ${features.map((feat, idx) => `
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
  `;
}
