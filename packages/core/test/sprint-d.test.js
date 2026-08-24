/**
 * @file sprint-d.test.js
 * @description Integration tests for Sprint D processors:
 *   - PDF to Image (Ghostscript production path / dev PNG stub fallback)
 *   - Sign PDF (text, initials, stamp signature types)
 *   - Flatten PDF (form fields, annotation removal)
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument } from 'pdf-lib';

import { PdfToImageProcessor } from '../../workers/dist/processors/pdf-to-image.js';
import { SignPdfProcessor } from '../../workers/dist/processors/sign-pdf.js';
import { FlattenPdfProcessor } from '../../workers/dist/processors/flatten-pdf.js';
import { PlatformError } from '../dist/index.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function makeTestPdf(pageCount = 3) {
  const pdf = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) {
    pdf.addPage([595, 842]); // A4
  }
  return Buffer.from(await pdf.save());
}

function makeCtx(jobId = 'test-sprint-d') {
  return {
    jobId,
    workerId: 'worker_test_d',
    timeoutMs: 60000,
    maxMemoryBytes: 512 * 1024 * 1024,
    tempWorkingDir: '',
    isCancelled: () => false,
    onProgress: async () => {},
    log: () => {},
  };
}

function assertValidPdf(buf, label = 'output') {
  assert.ok(buf.length > 100, `${label}: too small`);
  assert.equal(buf.slice(0, 5).toString('ascii'), '%PDF-', `${label}: bad header`);
}

function assertValidPng(buf, label = 'image') {
  assert.ok(buf.length > 8, `${label}: too small`);
  const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  const actual = [...buf.slice(0, 8)];
  assert.deepEqual(actual, sig, `${label}: invalid PNG signature`);
}

// ─── PDF to Image Tests ───────────────────────────────────────────────────────

test('PdfToImage - extracts all pages as PNG images (dev stub mode)', async () => {
  const processor = new PdfToImageProcessor();
  const inputBuf = await makeTestPdf(3);
  const ctx = makeCtx('img-001');

  const result = await processor.process([inputBuf], {
    format: 'png',
    dpi: 150,
    pages: 'all',
  }, ctx);

  assert.equal(result.outputFiles.length, 3, 'Should produce 3 image files for 3-page PDF');
  for (const file of result.outputFiles) {
    assert.equal(file.mimeType, 'image/png');
    assertValidPng(file.buffer, file.filename);
  }
});

test('PdfToImage - extracts specific pages only', async () => {
  const processor = new PdfToImageProcessor();
  const inputBuf = await makeTestPdf(5);
  const ctx = makeCtx('img-002');

  const result = await processor.process([inputBuf], {
    format: 'png',
    dpi: 96,
    pages: [1, 3, 5],
  }, ctx);

  assert.equal(result.outputFiles.length, 3, 'Should produce 3 images for pages [1,3,5]');
  assert.equal(result.outputFiles[0].filename, 'page_001.png');
  assert.equal(result.outputFiles[1].filename, 'page_003.png');
  assert.equal(result.outputFiles[2].filename, 'page_005.png');
});

test('PdfToImage - rejects invalid DPI values', async () => {
  const processor = new PdfToImageProcessor();
  await assert.rejects(
    () => processor.validateInput(
      [{ sizeBytes: 10000, mimeType: 'application/pdf' }],
      { format: 'png', dpi: 9999 }
    ),
    (err) => err instanceof PlatformError && err.code === 'INVALID_INPUT'
  );
});

test('PdfToImage - rejects unsupported format', async () => {
  const processor = new PdfToImageProcessor();
  await assert.rejects(
    () => processor.validateInput(
      [{ sizeBytes: 10000, mimeType: 'application/pdf' }],
      { format: 'bmp', dpi: 150 }
    ),
    (err) => err instanceof PlatformError && err.code === 'INVALID_INPUT'
  );
});

test('PdfToImage - rejects wrong file count', async () => {
  const processor = new PdfToImageProcessor();
  await assert.rejects(
    () => processor.validateInput([], { format: 'png', dpi: 150 }),
    (err) => err instanceof PlatformError && err.code === 'INVALID_INPUT'
  );
});

test('PdfToImage - resource estimate scales with DPI', () => {
  const processor = new PdfToImageProcessor();
  const lowDpi = processor.estimateResourceCost(
    [{ sizeBytes: 1 * 1024 * 1024, mimeType: 'application/pdf' }],
    { format: 'png', dpi: 72 }
  );
  const highDpi = processor.estimateResourceCost(
    [{ sizeBytes: 1 * 1024 * 1024, mimeType: 'application/pdf' }],
    { format: 'png', dpi: 600 }
  );
  assert.ok(highDpi.estimatedMemoryBytes > lowDpi.estimatedMemoryBytes,
    'High DPI should require more memory than low DPI');
  assert.equal(highDpi.isHeavyOperation, true, '600 DPI is a heavy operation');
  assert.equal(lowDpi.isHeavyOperation, false, '72 DPI is not heavy');
});

// ─── Sign PDF Tests ───────────────────────────────────────────────────────────

test('SignPdf - applies text signature to page 1', async () => {
  const processor = new SignPdfProcessor();
  const inputBuf = await makeTestPdf(2);
  const ctx = makeCtx('sign-001');

  const result = await processor.process([inputBuf], {
    type: 'text',
    name: 'Upendra Sharma',
    title: 'CEO & Co-Founder',
    placements: [{ page: 1, x: 50, y: 80, width: 180, height: 70 }],
    color: '#1a3a6b',
    showBorder: true,
    showDate: true,
  }, ctx);

  assert.equal(result.outputFiles.length, 1);
  assertValidPdf(result.outputFiles[0].buffer, 'sign-text');
  assert.equal(result.outputFiles[0].filename, 'signed_document.pdf');
});

test('SignPdf - applies initials signature', async () => {
  const processor = new SignPdfProcessor();
  const inputBuf = await makeTestPdf(1);
  const ctx = makeCtx('sign-002');

  const result = await processor.process([inputBuf], {
    type: 'initials',
    name: 'Upendra Sharma',
    placements: [{ page: 1, x: 450, y: 700, width: 60, height: 40 }],
  }, ctx);

  assertValidPdf(result.outputFiles[0].buffer, 'sign-initials');
});

test('SignPdf - applies stamp signature', async () => {
  const processor = new SignPdfProcessor();
  const inputBuf = await makeTestPdf(1);
  const ctx = makeCtx('sign-003');

  const result = await processor.process([inputBuf], {
    type: 'stamp',
    name: 'Authorized Signatory',
    date: '2026-08-24',
    placements: [{ page: 1, x: 60, y: 60, width: 160, height: 60 }],
    color: '#8b0000',
  }, ctx);

  assertValidPdf(result.outputFiles[0].buffer, 'sign-stamp');
});

test('SignPdf - applies multiple signatures on different pages', async () => {
  const processor = new SignPdfProcessor();
  const inputBuf = await makeTestPdf(3);
  const ctx = makeCtx('sign-004');

  const result = await processor.process([inputBuf], {
    type: 'text',
    name: 'Witness Name',
    placements: [
      { page: 1, x: 50, y: 60 },
      { page: 2, x: 50, y: 60 },
      { page: 3, x: 50, y: 60 },
    ],
  }, ctx);

  assertValidPdf(result.outputFiles[0].buffer, 'sign-multi-page');
});

test('SignPdf - rejects empty signer name', async () => {
  const processor = new SignPdfProcessor();
  await assert.rejects(
    () => processor.validateInput(
      [{ sizeBytes: 5000, mimeType: 'application/pdf' }],
      { type: 'text', name: '', placements: [{ page: 1, x: 0, y: 0 }] }
    ),
    (err) => err instanceof PlatformError && err.code === 'INVALID_INPUT'
  );
});

test('SignPdf - rejects placements on out-of-range pages', async () => {
  const processor = new SignPdfProcessor();
  const inputBuf = await makeTestPdf(2); // 2-page PDF
  const ctx = makeCtx('sign-err-01');

  await assert.rejects(
    () => processor.process([inputBuf], {
      type: 'text',
      name: 'John',
      placements: [{ page: 99, x: 100, y: 100 }], // page 99 doesn't exist
    }, ctx),
    (err) => err instanceof PlatformError && err.code === 'INVALID_INPUT'
  );
});

test('SignPdf - rejects invalid signature type', async () => {
  const processor = new SignPdfProcessor();
  await assert.rejects(
    () => processor.validateInput(
      [{ sizeBytes: 5000, mimeType: 'application/pdf' }],
      { type: 'handwriting', name: 'Test', placements: [{ page: 1, x: 0, y: 0 }] }
    ),
    (err) => err instanceof PlatformError && err.code === 'INVALID_INPUT'
  );
});

// ─── Flatten PDF Tests ────────────────────────────────────────────────────────

test('FlattenPdf - flattens a standard PDF (no-op safe on plain PDF)', async () => {
  const processor = new FlattenPdfProcessor();
  const inputBuf = await makeTestPdf(2);
  const ctx = makeCtx('flatten-001');

  const result = await processor.process([inputBuf], {
    flattenForms: true,
    flattenAnnotations: true,
    flattenSignatures: false,
  }, ctx);

  assert.equal(result.outputFiles.length, 1);
  assertValidPdf(result.outputFiles[0].buffer, 'flatten-basic');
  assert.equal(result.outputFiles[0].filename, 'flattened_document.pdf');
});

test('FlattenPdf - selective flatten: only forms', async () => {
  const processor = new FlattenPdfProcessor();
  const inputBuf = await makeTestPdf(1);
  const ctx = makeCtx('flatten-002');

  const result = await processor.process([inputBuf], {
    flattenForms: true,
    flattenAnnotations: false,
    flattenSignatures: false,
  }, ctx);

  assertValidPdf(result.outputFiles[0].buffer, 'flatten-forms-only');
});

test('FlattenPdf - selective flatten: only annotations', async () => {
  const processor = new FlattenPdfProcessor();
  const inputBuf = await makeTestPdf(1);
  const ctx = makeCtx('flatten-003');

  const result = await processor.process([inputBuf], {
    flattenForms: false,
    flattenAnnotations: true,
    flattenSignatures: true,
  }, ctx);

  assertValidPdf(result.outputFiles[0].buffer, 'flatten-annotations-only');
});

test('FlattenPdf - rejects wrong file count', async () => {
  const processor = new FlattenPdfProcessor();
  await assert.rejects(
    () => processor.validateInput([], {}),
    (err) => err instanceof PlatformError && err.code === 'INVALID_INPUT'
  );
});
