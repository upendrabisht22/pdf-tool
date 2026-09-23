/**
 * @file views/components/faq-accordion.js
 * @description Interactive FAQ accordion knowledge base component.
 */

/**
 * Renders the FAQ Accordion section.
 * @param {Object} toolConfig
 * @returns {string} HTML markup
 */
export function renderFaqAccordion(toolConfig) {
  const faqs = toolConfig.faqs || [];
  return `
    <!-- 4. Tool-Specific FAQ Accordion -->
    <section class="p-6 sm:p-10" id="faq">
      <div class="mb-6">
        <span class="mono-copy text-[10px] text-accent uppercase tracking-widest">[ KNOWLEDGE BASE ]</span>
        <h2 class="hero-display text-2xl sm:text-3xl text-text-primary mt-1">Frequently Asked Questions</h2>
        <p class="mono-copy text-xs text-text-secondary mt-1">Everything you need to know about this tool and security standards.</p>
      </div>
      <div class="space-y-3" id="faq-list-container">
        ${faqs.map(faq => `
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
  `;
}
