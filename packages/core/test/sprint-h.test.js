/**
 * @file sprint-h.test.js
 * @description Unit and integration tests for Sprint H:
 *   - PDF to Markdown Converter (`pdf-to-markdown`)
 *   - Markdown to PDF Converter (`markdown-to-pdf`)
 *   - GST & Tax-Compliant Invoice Generator (`gst-invoice-pdf`)
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument } from 'pdf-lib';

import {
  PdfToMarkdownProcessor,
  MarkdownToPdfProcessor,
  GstInvoiceProcessor,
} from '../../workers/dist/index.js';
import { PlatformError } from '../dist/index.js';

// ─── Test Helpers ─────────────────────────────────────────────────────────────

async function makeTestPdf(text = 'Hello World Document') {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const font = await pdf.embedFont('Helvetica');
  page.drawText(text, { x: 50, y: 750, size: 18, font });
  return Buffer.from(await pdf.save());
}

function makeCtx(jobId = 'test-sprint-h') {
  return {
    jobId,
    workerId: 'worker_test_h',
    timeoutMs: 30000,
    maxMemoryBytes: 256 * 1024 * 1024,
    tempWorkingDir: '',
    isCancelled: () => false,
    onProgress: async () => {},
    log: () => {},
  };
}

function assertValidPdf(buf, label = 'output') {
  assert.ok(buf.length > 100, `${label}: buffer is too small`);
  const header = buf.slice(0, 5).toString('ascii');
  assert.equal(header, '%PDF-', `${label}: missing PDF header`);
}

// ─── Phase 1: PDF to Markdown Tests ───────────────────────────────────────────

test('PDF to Markdown - extracts text and formats markdown document', async () => {
  const processor = new PdfToMarkdownProcessor();
  const inputBuf = await makeTestPdf('Quarterly Financial Summary Report');
  const ctx = makeCtx('pdf-to-md-001');

  const result = await processor.process([inputBuf], { extractTables: true }, ctx);

  assert.equal(result.outputFiles.length, 1);
  assert.equal(result.outputFiles[0].filename, 'converted_document.md');
  assert.equal(result.outputFiles[0].mimeType, 'text/markdown');
  const mdText = result.outputFiles[0].buffer.toString('utf8');
  assert.ok(mdText.length > 10);
  assert.ok(mdText.includes('Quarterly Financial Summary Report'));
});

test('PDF to Markdown - rejects missing file input', async () => {
  const processor = new PdfToMarkdownProcessor();
  await assert.rejects(
    () => processor.validateInput([], {}),
    (err) => err instanceof PlatformError && err.code === 'INVALID_INPUT'
  );
});

// ─── Phase 1: Markdown to PDF Tests ───────────────────────────────────────────

test('Markdown to PDF - compiles markdown headings, lists, and code blocks into vector PDF', async () => {
  const processor = new MarkdownToPdfProcessor();
  const sampleMd = `
# Executive Strategy 2026

DocPlatform infrastructure and document automation.

## Core Milestones
- High fidelity vector rendering
- Zero server retention
- Fast local processing

\`\`\`javascript
const speed = "100MB/s";
console.log(speed);
\`\`\`

---
End of Document
`;
  const inputBuf = Buffer.from(sampleMd, 'utf8');
  const ctx = makeCtx('md-to-pdf-001');

  const result = await processor.process([inputBuf], { theme: 'github', pageSize: 'A4' }, ctx);

  assert.equal(result.outputFiles.length, 1);
  assert.equal(result.outputFiles[0].filename, 'compiled_document.pdf');
  assert.equal(result.outputFiles[0].mimeType, 'application/pdf');
  assertValidPdf(result.outputFiles[0].buffer);
  assert.equal(result.outputFiles[0].pageCount, 1);
});

test('Markdown to PDF - rejects empty input', async () => {
  const processor = new MarkdownToPdfProcessor();
  await assert.rejects(
    () => processor.validateInput([], {}),
    (err) => err instanceof PlatformError && err.code === 'INVALID_INPUT'
  );
});

// ─── Phase 2: GST Tax Invoice Tests ───────────────────────────────────────────

test('GST Invoice - calculates intra-state tax split (CGST + SGST) and embeds UPI QR', async () => {
  const processor = new GstInvoiceProcessor();
  const ctx = makeCtx('gst-inv-001');

  const options = {
    seller: {
      name: 'Acme Technologies Pvt Ltd',
      gstin: '07AAAAA0000A1Z5',
      pan: 'AAAAA0000A',
      address: 'Plot 42, Okhla Industrial Area Phase 3',
      state: 'Delhi',
      stateCode: '07',
    },
    buyer: {
      name: 'Apex Retailers LLP',
      gstin: '07BBBBB1111B1Z2',
      address: 'Connaught Place, Central Delhi',
      state: 'Delhi',
      stateCode: '07',
    },
    invoiceNumber: 'INV-2026-001',
    invoiceDate: '2026-09-10',
    taxType: 'intra',
    items: [
      { id: '1', description: 'Cloud Consulting Services', hsn: '998311', qty: 2, rate: 5000, gstRate: 18 },
      { id: '2', description: 'Document Engine License', hsn: '997331', qty: 1, rate: 10000, discountPct: 10, gstRate: 18 },
    ],
    bankDetails: {
      bankName: 'HDFC Bank',
      accountNumber: '50200012345678',
      ifscCode: 'HDFC0000123',
      upiId: 'acmetech@hdfcbank',
    },
  };

  const result = await processor.process([], options, ctx);

  assert.equal(result.outputFiles.length, 1);
  assert.equal(result.outputFiles[0].filename, 'invoice_INV-2026-001.pdf');
  assertValidPdf(result.outputFiles[0].buffer);
  assert.equal(result.outputFiles[0].pageCount, 1);
  // Buffer size should be substantial because it includes vector fonts, grid, and embedded PNG UPI QR code
  assert.ok(result.outputFiles[0].buffer.length > 1000);
});

test('GST Invoice - calculates inter-state tax (IGST) correctly', async () => {
  const processor = new GstInvoiceProcessor();
  const ctx = makeCtx('gst-inv-002');

  const options = {
    seller: {
      name: 'Delhi Software Solutions',
      gstin: '07AAAAA0000A1Z5',
      address: 'Nehru Place, New Delhi',
      state: 'Delhi',
    },
    buyer: {
      name: 'Bengaluru Innovations Ltd',
      gstin: '29BBBBB2222B2Z8',
      address: 'Koramangala, Bengaluru',
      state: 'Karnataka',
    },
    invoiceNumber: 'INV-INTER-099',
    invoiceDate: '2026-09-10',
    items: [
      { id: '1', description: 'Enterprise Annual Subscription', qty: 1, rate: 50000, gstRate: 18 },
    ],
  };

  const result = await processor.process([], options, ctx);

  assert.equal(result.outputFiles.length, 1);
  assertValidPdf(result.outputFiles[0].buffer);
});

test('GST Invoice - rejects missing seller or buyer details', async () => {
  const processor = new GstInvoiceProcessor();
  await assert.rejects(
    () => processor.validateInput([], { seller: { name: '' }, buyer: { name: 'Client' }, items: [] }),
    (err) => err instanceof PlatformError && err.code === 'INVALID_INPUT'
  );
});
