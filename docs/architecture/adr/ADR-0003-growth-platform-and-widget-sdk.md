# ADR-0003: Phase 8 Growth Platform, i18n Localization & Embeddable Widget SDK

## Status
**ACCEPTED** (2026-08-26)

## Context
To achieve hyper-scalable organic growth and viral distribution, the platform requires:
1. Multi-language localization (i18n) across 6 global languages with localized URLs and SEO canonical tags.
2. An embeddable JavaScript Widget SDK allowing third-party SaaS, blogs, and portals to embed our document utilities with minimal configuration.
3. Automated programmatic XML sitemaps covering all multi-language tool routes.

## Problem
How to support dynamic multilingual routing, lightweight zero-dependency embed widgets, and search engine crawler indexing without increasing page load bundle size or adding heavy third-party framework runtime dependencies?

## Key Decisions

### 1. Zero-Dependency i18n Engine (`packages/core/src/i18n.ts`)
- Native TypeScript dictionary mapping with type-safe fallback to English (`en`).
- Supported Locales: `en` (English), `es` (Spanish), `fr` (French), `de` (German), `hi` (Hindi), `ja` (Japanese).
- Localized URL structure: `/:lang/:tool` (e.g. `/es/merge-pdf`, `/de/compress-pdf`).
- Server-side pre-rendered HTML with language-specific meta descriptions, titles, and `hreflang` alternating tags.

### 2. Standalone Embeddable Widget SDK (`apps/web/public/widget.js`)
- Standard vanilla JavaScript SDK (~8KB minified, zero external dependencies).
- Can be initialized via `data-` HTML attributes on a `<script>` tag or programmatically via `window.DocPlatform.initWidget({ ... })`.
- Responsive container sizing with seamless postMessage communication between parent frame and tool runtime.
- Supports light/dark theme matching and custom accent colors.

### 3. Programmatic XML Sitemap & Robots Engine (`/sitemap.xml`, `/robots.txt`)
- Dynamically generated XML sitemap incorporating all 27 tools across all 6 supported languages (160+ unique URLs).
- Each entry includes `<xhtml:link rel="alternate" hreflang="xx">` mappings for full multi-region Google indexing compliance.

## Consequences & Verification
- Unit & integration tests in `apps/web/test/sprint-i.test.js` validating translation lookups, widget script serving, and sitemap generation.
- Zero impact on Core engine performance or WASM execution speeds.
