/**
 * @file sprint-e.test.js
 * @description Integration and unit tests for Sprint E processors:
 *   - PDF to Word (`pdf-to-word` -> .docx OpenXML package)
 *   - PDF to Excel (`pdf-to-excel` -> .xlsx OpenXML package)
 *   - Zero-Leak Security Redaction (`redact-pdf`)
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument } from 'pdf-lib';

import { PdfToWordProcessor, PdfToExcelProcessor } from '../../workers/dist/processors/pdf-to-office.js';
import { RedactPdfProcessor } from '../../workers/dist/processors/redact.js';
import { PlatformError, inspectFileMagicBytes } from '../dist/index.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function makeTestPdf(pageCount = 2, meta = {}) {
  const pdf = await PDFDocument.create();
  if (meta.author) pdf.setAuthor(meta.author);
  if (meta.title) pdf.setTitle(meta.title);
  for (let i = 0; i < pageCount; i++) {
    pdf.addPage([595, 842]);
  }
  return Buffer.from(await pdf.save());
}

function makeCtx(jobId = 'test-sprint-e') {
  return {
    jobId,
    workerId: 'worker_test_e',
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

function assertValidOpenXmlZip(buf, label = 'office-package') {
  assert.ok(buf.length > 30, `${label}: package is too small`);
  // ZIP header PK\x03\x04 (0x50, 0x4b, 0x03, 0x04)
  assert.equal(buf[0], 0x50, `${label}: invalid PK byte 0`);
  assert.equal(buf[1], 0x4b, `${label}: invalid PK byte 1`);
  assert.equal(buf[2], 0x03, `${label}: invalid PK byte 2`);
  assert.equal(buf[3], 0x04, `${label}: invalid PK byte 3`);
}

// ─── PDF to Word Tests ────────────────────────────────────────────────────────

test('PdfToWord - converts PDF to valid Microsoft Word (.docx) OpenXML package', async () => {
  const processor = new PdfToWordProcessor();
  const inputBuf = await makeTestPdf(3);
  const ctx = makeCtx('word-001');

  const result = await processor.process([inputBuf], { preserveLayout: 'flowing', includeImages: true }, ctx);

  assert.equal(result.outputFiles.length, 1);
  assert.equal(result.outputFiles[0].filename, 'converted_document.docx');
  assert.equal(result.outputFiles[0].mimeType, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  assertValidOpenXmlZip(result.outputFiles[0].buffer, 'docx-output');
  assert.equal(result.outputFiles[0].pageCount, 3);
});

test('PdfToWord - rejects empty input', async () => {
  const processor = new PdfToWordProcessor();
  await assert.rejects(
    () => processor.validateInput([], {}),
    (err) => err instanceof PlatformError && err.code === 'INVALID_INPUT'
  );
});

test('PdfToWord - rejects multiple inputs', async () => {
  const processor = new PdfToWordProcessor();
  await assert.rejects(
    () => processor.validateInput([
      { sizeBytes: 100, mimeType: 'application/pdf' },
      { sizeBytes: 200, mimeType: 'application/pdf' },
    ], {}),
    (err) => err instanceof PlatformError && err.code === 'INVALID_INPUT'
  );
});

// ─── PDF to Excel Tests ───────────────────────────────────────────────────────

test('PdfToExcel - converts PDF to valid Microsoft Excel (.xlsx) OpenXML package', async () => {
  const processor = new PdfToExcelProcessor();
  const inputBuf = await makeTestPdf(2);
  const ctx = makeCtx('excel-001');

  const result = await processor.process([inputBuf], { detectionMode: 'auto', formatNumbers: true }, ctx);

  assert.equal(result.outputFiles.length, 1);
  assert.equal(result.outputFiles[0].filename, 'extracted_tables.xlsx');
  assert.equal(result.outputFiles[0].mimeType, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  assertValidOpenXmlZip(result.outputFiles[0].buffer, 'xlsx-output');
  assert.equal(result.outputFiles[0].pageCount, 2);
});

test('PdfToExcel - rejects invalid input file count', async () => {
  const processor = new PdfToExcelProcessor();
  await assert.rejects(
    () => processor.validateInput([], {}),
    (err) => err instanceof PlatformError && err.code === 'INVALID_INPUT'
  );
});

// ─── PDF Redaction Tests ──────────────────────────────────────────────────────

test('RedactPdf - applies permanent solid blackout box with label to target page', async () => {
  const processor = new RedactPdfProcessor();
  const inputBuf = await makeTestPdf(2, { author: 'Secret Author', title: 'Confidential Plan' });
  const ctx = makeCtx('redact-001');

  const result = await processor.process([inputBuf], {
    boxes: [
      {
        page: 1,
        x: 50,
        y: 400,
        width: 200,
        height: 30,
        color: '#000000',
        replacementLabel: '[REDACTED]',
      },
    ],
    sanitizeMetadata: true,
  }, ctx);

  assert.equal(result.outputFiles.length, 1);
  assert.equal(result.outputFiles[0].filename, 'redacted_document.pdf');
  assertValidPdf(result.outputFiles[0].buffer, 'redact-output');

  // Verify metadata sanitization
  const outputDoc = await PDFDocument.load(result.outputFiles[0].buffer);
  assert.equal(outputDoc.getAuthor() ?? '', '', 'Author metadata must be sanitized');
  assert.equal(outputDoc.getTitle() ?? '', '', 'Title metadata must be sanitized');
});

test('RedactPdf - applies multiple redaction boxes across different pages', async () => {
  const processor = new RedactPdfProcessor();
  const inputBuf = await makeTestPdf(3);
  const ctx = makeCtx('redact-002');

  const result = await processor.process([inputBuf], {
    boxes: [
      { page: 1, x: 100, y: 100, width: 150, height: 20 },
      { page: 2, x: 200, y: 300, width: 100, height: 40, color: '#111111' },
      { page: 3, x: 50, y: 700, width: 300, height: 50, replacementLabel: 'CONFIDENTIAL' },
    ],
  }, ctx);

  assertValidPdf(result.outputFiles[0].buffer, 'redact-multi');
  assert.equal(result.outputFiles[0].pageCount, 3);
});

test('RedactPdf - rejects empty redaction boxes list', async () => {
  const processor = new RedactPdfProcessor();
  await assert.rejects(
    () => processor.validateInput(
      [{ sizeBytes: 1000, mimeType: 'application/pdf' }],
      { boxes: [] }
    ),
    (err) => err instanceof PlatformError && err.code === 'INVALID_INPUT'
  );
});

test('RedactPdf - rejects invalid box dimensions (non-positive width/height)', async () => {
  const processor = new RedactPdfProcessor();
  await assert.rejects(
    () => processor.validateInput(
      [{ sizeBytes: 1000, mimeType: 'application/pdf' }],
      { boxes: [{ page: 1, x: 10, y: 10, width: -50, height: 20 }] }
    ),
    (err) => err instanceof PlatformError && err.code === 'INVALID_INPUT'
  );
});

test('RedactPdf - rejects out-of-range target page number', async () => {
  const processor = new RedactPdfProcessor();
  const inputBuf = await makeTestPdf(2); // 2-page doc
  const ctx = makeCtx('redact-err-01');

  await assert.rejects(
    () => processor.process([inputBuf], {
      boxes: [{ page: 10, x: 10, y: 10, width: 100, height: 20 }], // Page 10 out of bounds
    }, ctx),
    (err) => err instanceof PlatformError && err.code === 'INVALID_INPUT'
  );
});
