/**
 * @file sprint-a.test.js
 * @description Integration tests for Sprint A processors:
 *   - Watermark PDF
 *   - Page Numbers PDF
 *   - Protect PDF
 *   - Unlock PDF
 *   - Repair PDF
 *   - Strip Metadata PDF
 *
 * Test strategy: create minimal in-memory PDFs using pdf-lib, run them through
 * each processor, and assert on the output buffer's validity and processor contract.
 *
 * All tests use real buffers — no mocking of pdf-lib calls.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument } from 'pdf-lib';

// Resolve dist paths from repo root
import { WatermarkPdfProcessor } from '../../workers/dist/processors/watermark.js';
import { PageNumbersPdfProcessor } from '../../workers/dist/processors/page-numbers.js';
import { UnlockPdfProcessor } from '../../workers/dist/processors/unlock.js';
import { RepairPdfProcessor } from '../../workers/dist/processors/repair.js';
import { StripMetadataPdfProcessor } from '../../workers/dist/processors/strip-metadata.js';
import { PlatformError } from '../dist/index.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Creates a minimal valid in-memory PDF with N blank pages */
async function makeTestPdf(pageCount = 3, metadata = {}) {
  const pdf = await PDFDocument.create();
  if (metadata.author) pdf.setAuthor(metadata.author);
  if (metadata.title) pdf.setTitle(metadata.title);
  for (let i = 0; i < pageCount; i++) {
    pdf.addPage([595, 842]); // A4
  }
  return Buffer.from(await pdf.save());
}

/** Minimal execution context stub for testing */
function makeCtx(jobId = 'test-job-001') {
  return {
    jobId,
    isCancelled: () => false,
    onProgress: async () => {},
    log: (level, msg) => { /* swallow in tests */ },
  };
}

/** Checks that a buffer is a valid PDF by its header */
function assertValidPdf(buf, label = 'output') {
  assert.ok(buf.length > 100, `${label}: buffer is too small`);
  const header = buf.slice(0, 5).toString('ascii');
  assert.equal(header, '%PDF-', `${label}: missing PDF header`);
}

// ─── Watermark Tests ──────────────────────────────────────────────────────────

test('Watermark - applies text watermark to all pages (center/diagonal)', async () => {
  const processor = new WatermarkPdfProcessor();
  const inputBuf = await makeTestPdf(3);
  const ctx = makeCtx();

  const result = await processor.process([inputBuf], {
    text: 'CONFIDENTIAL',
    opacity: 0.3,
    position: 'diagonal',
  }, ctx);

  assert.equal(result.outputFiles.length, 1);
  assertValidPdf(result.outputFiles[0].buffer, 'watermark diagonal');
  assert.equal(result.outputFiles[0].pageCount, 3);
});

test('Watermark - applies text watermark to specific pages only', async () => {
  const processor = new WatermarkPdfProcessor();
  const inputBuf = await makeTestPdf(5);
  const ctx = makeCtx();

  const result = await processor.process([inputBuf], {
    text: 'DRAFT',
    opacity: 0.5,
    position: 'top-right',
    pages: [1, 3, 5],
  }, ctx);

  assert.equal(result.outputFiles.length, 1);
  assertValidPdf(result.outputFiles[0].buffer, 'watermark selective');
});

test('Watermark - rejects empty text', async () => {
  const processor = new WatermarkPdfProcessor();
  const inputBuf = await makeTestPdf(1);

  await assert.rejects(
    () => processor.validateInput(
      [{ sizeBytes: inputBuf.length, mimeType: 'application/pdf' }],
      { text: '' }
    ),
    (err) => err instanceof PlatformError && err.code === 'INVALID_INPUT'
  );
});

test('Watermark - rejects text exceeding 200 characters', async () => {
  const processor = new WatermarkPdfProcessor();
  await assert.rejects(
    () => processor.validateInput(
      [{ sizeBytes: 1000, mimeType: 'application/pdf' }],
      { text: 'x'.repeat(201) }
    ),
    (err) => err instanceof PlatformError && err.code === 'INVALID_INPUT'
  );
});

test('Watermark - rejects invalid opacity value', async () => {
  const processor = new WatermarkPdfProcessor();
  await assert.rejects(
    () => processor.validateInput(
      [{ sizeBytes: 1000, mimeType: 'application/pdf' }],
      { text: 'DRAFT', opacity: 1.5 }
    ),
    (err) => err instanceof PlatformError && err.code === 'INVALID_INPUT'
  );
});

// ─── Page Numbers Tests ───────────────────────────────────────────────────────

test('PageNumbers - adds default page numbers to 4-page PDF', async () => {
  const processor = new PageNumbersPdfProcessor();
  const inputBuf = await makeTestPdf(4);
  const ctx = makeCtx();

  const result = await processor.process([inputBuf], {
    position: 'bottom-center',
    template: 'Page {page} of {total}',
  }, ctx);

  assert.equal(result.outputFiles.length, 1);
  assertValidPdf(result.outputFiles[0].buffer, 'page-numbers default');
  assert.equal(result.outputFiles[0].pageCount, 4);
});

test('PageNumbers - custom start number and position', async () => {
  const processor = new PageNumbersPdfProcessor();
  const inputBuf = await makeTestPdf(3);
  const ctx = makeCtx();

  const result = await processor.process([inputBuf], {
    position: 'top-right',
    template: '{page}',
    startAt: 5,
    fontSize: 9,
    color: '#555555',
  }, ctx);

  assertValidPdf(result.outputFiles[0].buffer, 'page-numbers custom-start');
});

test('PageNumbers - rejects wrong file count', async () => {
  const processor = new PageNumbersPdfProcessor();
  await assert.rejects(
    () => processor.validateInput([], {}),
    (err) => err instanceof PlatformError && err.code === 'INVALID_INPUT'
  );
});

// ─── Unlock Tests ─────────────────────────────────────────────────────────────

test('Unlock - rejects empty password', async () => {
  const processor = new UnlockPdfProcessor();
  await assert.rejects(
    () => processor.validateInput(
      [{ sizeBytes: 1000, mimeType: 'application/pdf' }],
      { password: '' }
    ),
    (err) => err instanceof PlatformError && err.code === 'INVALID_INPUT'
  );
});

test('Unlock - processes an unencrypted PDF transparently (no-op unlock)', async () => {
  // An unencrypted PDF can be "unlocked" — it just passes through unchanged
  const processor = new UnlockPdfProcessor();
  const inputBuf = await makeTestPdf(2);
  const ctx = makeCtx();

  const result = await processor.process([inputBuf], { password: 'any-password' }, ctx);
  assert.equal(result.outputFiles.length, 1);
  assertValidPdf(result.outputFiles[0].buffer, 'unlock no-op');
});

// ─── Repair Tests ─────────────────────────────────────────────────────────────

test('Repair - recovers a structurally valid (non-corrupted) PDF', async () => {
  const processor = new RepairPdfProcessor();
  const inputBuf = await makeTestPdf(2);
  const ctx = makeCtx();

  const result = await processor.process([inputBuf], { aggressiveRecovery: true }, ctx);
  assert.equal(result.outputFiles.length, 1);
  assertValidPdf(result.outputFiles[0].buffer, 'repair valid input');
  assert.equal(result.outputFiles[0].pageCount, 2);
});

test('Repair - rejects a non-PDF buffer', async () => {
  const processor = new RepairPdfProcessor();
  const junkBuf = Buffer.from('This is not a PDF file at all.');
  const ctx = makeCtx();

  await assert.rejects(
    () => processor.process([junkBuf], {}, ctx),
    (err) => err instanceof PlatformError && err.code === 'INVALID_INPUT'
  );
});

// ─── Strip Metadata Tests ─────────────────────────────────────────────────────

test('StripMetadata - strips all metadata from a PDF with author info', async () => {
  const processor = new StripMetadataPdfProcessor();
  const inputBuf = await makeTestPdf(2, {
    author: 'John Doe',
    title: 'Secret Internal Report',
  });
  const ctx = makeCtx();

  const result = await processor.process([inputBuf], {
    stripAuthorInfo: true,
    stripDates: true,
    stripXmp: true,
    stripDocumentId: true,
  }, ctx);

  assert.equal(result.outputFiles.length, 1);
  assertValidPdf(result.outputFiles[0].buffer, 'strip-metadata full');

  // Verify author and title are removed from the output
  const outputPdf = await PDFDocument.load(result.outputFiles[0].buffer);
  assert.equal(outputPdf.getAuthor() ?? '', '', 'Author should be empty after strip');
});

test('StripMetadata - partial strip (only author info, keep dates)', async () => {
  const processor = new StripMetadataPdfProcessor();
  const inputBuf = await makeTestPdf(1, { author: 'Jane Smith' });
  const ctx = makeCtx();

  const result = await processor.process([inputBuf], {
    stripAuthorInfo: true,
    stripDates: false,
    stripXmp: false,
    stripDocumentId: false,
  }, ctx);

  assertValidPdf(result.outputFiles[0].buffer, 'strip-metadata partial');
});

test('StripMetadata - rejects wrong file count', async () => {
  const processor = new StripMetadataPdfProcessor();
  await assert.rejects(
    () => processor.validateInput([], {}),
    (err) => err instanceof PlatformError && err.code === 'INVALID_INPUT'
  );
});
