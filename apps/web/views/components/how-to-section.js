/**
 * @file views/components/how-to-section.js
 * @description Step-by-step workflow guide section.
 */

/**
 * Renders the How-To workflow guide section.
 * @param {Object} toolConfig
 * @returns {string} HTML markup
 */
export function renderHowToSection(toolConfig) {
  const steps = toolConfig.howToSteps || [];
  return `
    <!-- 1. Tool-Specific How-To Guide (Architectural Steps) -->
    <section class="p-6 sm:p-10 border-b border-dashed border-border">
      <div class="mb-6">
        <span class="mono-copy text-[10px] text-accent uppercase tracking-widest">[ WORKFLOW ]</span>
        <h2 class="hero-display text-2xl sm:text-3xl text-text-primary mt-1">How to use this tool</h2>
        <p class="mono-copy text-xs text-text-secondary mt-1">Follow these simple steps to process your document in seconds.</p>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4" id="tool-steps-container">
        ${steps.map((step, idx) => `
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
  `;
}
