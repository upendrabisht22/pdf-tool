/**
 * @file sprint-f.test.js
 * @description Integration and unit tests for Sprint F processors:
 *   - Optical Character Recognition (`ocr-pdf` -> Searchable Sandwich PDF / Plain Text / JSON)
 *   - PDF Document Compare / Diff (`compare-pdf` -> Visual Diff / Side-by-Side report)
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument } from 'pdf-lib';

import { OcrPdfProcessor } from '../../workers/dist/processors/ocr.js';
import { ComparePdfProcessor } from '../../workers/dist/processors/compare.js';
import { PlatformError } from '../dist/index.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function makeTestPdf(pageCount = 2) {
  const pdf = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) {
    pdf.addPage([595, 842]);
  }
  return Buffer.from(await pdf.save());
}

function makeCtx(jobId = 'test-sprint-f') {
  return {
    jobId,
    workerId: 'worker_test_f',
    timeoutMs: 60000,
    maxMemoryBytes: 512 * 1024 * 1024,
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

// ─── OCR Tests ────────────────────────────────────────────────────────────────

test('OCR - compiles Searchable PDF (Sandwich PDF) with selectable text layer', async () => {
  const processor = new OcrPdfProcessor();
  const inputBuf = await makeTestPdf(3);
  const ctx = makeCtx('ocr-001');

  const result = await processor.process(
    [inputBuf],
    { language: 'eng', outputType: 'searchable-pdf', dpi: 300 },
    ctx
  );

  assert.equal(result.outputFiles.length, 1);
  assert.equal(result.outputFiles[0].filename, 'searchable_document.pdf');
  assert.equal(result.outputFiles[0].mimeType, 'application/pdf');
  assertValidPdf(result.outputFiles[0].buffer, 'ocr-searchable-pdf');
  assert.equal(result.outputFiles[0].pageCount, 3);
});

test('OCR - extracts plain text format from document', async () => {
  const processor = new OcrPdfProcessor();
  const inputBuf = await makeTestPdf(2);
  const ctx = makeCtx('ocr-002');

  const result = await processor.process(
    [inputBuf],
    { language: 'eng', outputType: 'text' },
    ctx
  );

  assert.equal(result.outputFiles.length, 1);
  assert.equal(result.outputFiles[0].filename, 'extracted_text.txt');
  assert.equal(result.outputFiles[0].mimeType, 'text/plain');
  const textContent = result.outputFiles[0].buffer.toString('utf8');
  assert.ok(textContent.includes('OCR Extracted Text'));
});

test('OCR - extracts structured JSON tokenized word data', async () => {
  const processor = new OcrPdfProcessor();
  const inputBuf = await makeTestPdf(1);
  const ctx = makeCtx('ocr-003');

  const result = await processor.process(
    [inputBuf],
    { language: 'hin', outputType: 'json' },
    ctx
  );

  assert.equal(result.outputFiles.length, 1);
  assert.equal(result.outputFiles[0].filename, 'ocr_results.json');
  assert.equal(result.outputFiles[0].mimeType, 'application/json');
  const parsed = JSON.parse(result.outputFiles[0].buffer.toString('utf8'));
  assert.equal(parsed.language, 'hin');
});

test('OCR - rejects out-of-range DPI', async () => {
  const processor = new OcrPdfProcessor();
  await assert.rejects(
    () => processor.validateInput(
      [{ sizeBytes: 1000, mimeType: 'application/pdf' }],
      { dpi: 10 } // Too low
    ),
    (err) => err instanceof PlatformError && err.code === 'INVALID_INPUT'
  );
});

// ─── PDF Compare / Diff Tests ─────────────────────────────────────────────────

test('ComparePdf - generates Visual Diff Overlay comparing 2 documents', async () => {
  const processor = new ComparePdfProcessor();
  const docA = await makeTestPdf(2);
  const docB = await makeTestPdf(3); // Doc B has 1 additional page
  const ctx = makeCtx('diff-001');

  const result = await processor.process(
    [docA, docB],
    { mode: 'visual-diff', colorAdded: '#00E5FF', colorRemoved: '#FF0055' },
    ctx
  );

  assert.equal(result.outputFiles.length, 1);
  assert.equal(result.outputFiles[0].filename, 'comparison_report.pdf');
  assert.equal(result.outputFiles[0].mimeType, 'application/pdf');
  assertValidPdf(result.outputFiles[0].buffer, 'diff-report');
});

test('ComparePdf - generates Side-by-Side dual pane comparison report', async () => {
  const processor = new ComparePdfProcessor();
  const docA = await makeTestPdf(2);
  const docB = await makeTestPdf(2);
  const ctx = makeCtx('diff-002');

  const result = await processor.process(
    [docA, docB],
    { mode: 'side-by-side' },
    ctx
  );

  assert.equal(result.outputFiles.length, 1);
  assertValidPdf(result.outputFiles[0].buffer, 'side-by-side-diff');
  assert.equal(result.outputFiles[0].pageCount, 2);
});

test('ComparePdf - rejects when only 1 input document is provided', async () => {
  const processor = new ComparePdfProcessor();
  const singleFile = [{ sizeBytes: 5000, mimeType: 'application/pdf' }];

  await assert.rejects(
    () => processor.validateInput(singleFile, {}),
    (err) => err instanceof PlatformError && err.code === 'INVALID_INPUT'
  );
});

test('ComparePdf - rejects when more than 2 input documents are provided', async () => {
  const processor = new ComparePdfProcessor();
  const threeFiles = [
    { sizeBytes: 5000, mimeType: 'application/pdf' },
    { sizeBytes: 5000, mimeType: 'application/pdf' },
    { sizeBytes: 5000, mimeType: 'application/pdf' },
  ];

  await assert.rejects(
    () => processor.validateInput(threeFiles, {}),
    (err) => err instanceof PlatformError && err.code === 'INVALID_INPUT'
  );
});
