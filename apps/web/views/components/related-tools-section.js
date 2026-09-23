/**
 * @file views/components/related-tools-section.js
 * @description Related document utilities and full tool catalog directory link.
 */

/**
 * Renders the Related Tools ecosystem section.
 * @param {string[]} relatedSlugs
 * @param {Record<string, any>} TOOL_REGISTRY
 * @returns {string} HTML markup
 */
export function renderRelatedToolsSection(relatedSlugs, TOOL_REGISTRY) {
  return `
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
  `;
}
