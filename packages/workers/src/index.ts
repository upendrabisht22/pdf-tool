/**
 * @file index.ts
 * @description Entry point for @doc-platform/workers.
 *
 * Phase 1 Processors (Merge, Split, Rotate, Reorder/Delete, Extract, Compress, Images)
 * Sprint A Processors (Watermark, Page Numbers, Protect, Unlock, Repair, Strip Metadata)
 */

// Phase 1
export * from './validator.js';
export * from './sandbox.js';
export * from './processors/merge.js';
export * from './processors/split.js';
export * from './processors/rotate.js';
export * from './processors/reorder-delete.js';
export * from './processors/extract.js';
export * from './processors/compress.js';
export * from './processors/images.js';

// Sprint A
export * from './processors/watermark.js';
export * from './processors/page-numbers.js';
export * from './processors/protect.js';
export * from './processors/unlock.js';
export * from './processors/repair.js';
export * from './processors/strip-metadata.js';

// Sprint C
export * from './processors/office-to-pdf.js';

// Sprint D
export * from './processors/pdf-to-image.js';
export * from './processors/sign-pdf.js';
export * from './processors/flatten-pdf.js';

// Sprint E
export * from './processors/pdf-to-office.js';
export * from './processors/redact.js';

// Sprint F
export * from './processors/ocr.js';
export * from './processors/compare.js';

// Sprint G
export * from './processors/ai-document.js';
export * from './processors/pipeline.js';

// Sprint H (Phase 1: PDF ↔ Markdown, Phase 2: GST Invoice, Phase 3: Business & Tax Suite)
export * from './processors/pdf-markdown.js';
export * from './processors/gst-invoice.js';
export * from './processors/pos-billing.js';
export * from './processors/tax-receipt.js';
export * from './processors/estimate-maker.js';
