/**
 * @file sprint-c.test.js
 * @description Integration and unit tests for Sprint C:
 *   - Office document magic byte detection (DOCX, XLSX, PPTX, OLE2 Legacy DOC/XLS/PPT)
 *   - Word to PDF Conversion processor (`word-to-pdf`)
 *   - Excel to PDF Conversion processor (`excel-to-pdf`)
 *   - PowerPoint to PDF Conversion processor (`powerpoint-to-pdf`, `ppt-to-pdf`)
 *   - Validation & Error Contracts
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { OfficeToPdfProcessor } from '../../workers/dist/processors/office-to-pdf.js';
import { inspectFileMagicBytes, PlatformError } from '../dist/index.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeDummyDocxBuffer() {
  // Minimal ZIP header (PK\x03\x04) representing a modern OpenXML docx container
  const header = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
  const dummyPayload = Buffer.from('PK-MOCK-WORD-DOCUMENT-XML-CONTAINER-DATA');
  return Buffer.concat([header, dummyPayload]);
}

function makeDummyLegacyDocBuffer() {
  // OLE2 Compound Binary Header (\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1)
  const header = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
  const payload = Buffer.from('MOCK-LEGACY-BINARY-DOC-DATA');
  return Buffer.concat([header, payload]);
}

function makeCtx(jobId = 'test-office-job-001') {
  return {
    jobId,
    workerId: 'worker_test_01',
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

// ─── Magic Byte Validator Tests ───────────────────────────────────────────────

test('Sprint C - Magic Byte Validator detects Modern Office OpenXML ZIP container', () => {
  const docxBuf = makeDummyDocxBuffer();
  const res = inspectFileMagicBytes(docxBuf);
  assert.equal(res.isValid, true);
  assert.equal(res.detectedFormat, 'docx');
  assert.equal(res.mimeType, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
});

test('Sprint C - Magic Byte Validator detects Legacy OLE2 Office binary (doc, xls, ppt)', () => {
  const legacyBuf = makeDummyLegacyDocBuffer();
  const res = inspectFileMagicBytes(legacyBuf);
  assert.equal(res.isValid, true);
  assert.equal(res.detectedFormat, 'office-legacy');
  assert.equal(res.mimeType, 'application/msword');
});

// ─── Word to PDF Conversion Tests ─────────────────────────────────────────────

test('WordToPdf - converts Word document (.docx) to valid vector PDF', async () => {
  const processor = new OfficeToPdfProcessor('word-to-pdf');
  const inputBuf = makeDummyDocxBuffer();
  const ctx = makeCtx('job-word-01');

  const result = await processor.process([inputBuf], { orientation: 'portrait' }, ctx);

  assert.equal(result.outputFiles.length, 1);
  assert.equal(result.outputFiles[0].mimeType, 'application/pdf');
  assertValidPdf(result.outputFiles[0].buffer, 'word-to-pdf output');
  assert.ok(result.metrics.durationMs >= 0);
});

test('WordToPdf - rejects missing input files', async () => {
  const processor = new OfficeToPdfProcessor('word-to-pdf');
  await assert.rejects(
    () => processor.validateInput([], {}),
    (err) => err instanceof PlatformError && err.code === 'INVALID_INPUT'
  );
});

test('WordToPdf - rejects multiple files in single conversion operation', async () => {
  const processor = new OfficeToPdfProcessor('word-to-pdf');
  const files = [
    { sizeBytes: 100, mimeType: 'application/docx' },
    { sizeBytes: 200, mimeType: 'application/docx' },
  ];
  await assert.rejects(
    () => processor.validateInput(files, {}),
    (err) => err instanceof PlatformError && err.code === 'INVALID_INPUT'
  );
});

// ─── Excel to PDF Conversion Tests ────────────────────────────────────────────

test('ExcelToPdf - converts spreadsheet (.xlsx) to valid PDF with layout options', async () => {
  const processor = new OfficeToPdfProcessor('excel-to-pdf');
  const inputBuf = makeDummyDocxBuffer(); // uses OpenXML container signature
  const ctx = makeCtx('job-excel-01');

  const result = await processor.process(
    [inputBuf],
    { fitToPageWidth: true, orientation: 'landscape', renderGridlines: true },
    ctx
  );

  assert.equal(result.outputFiles.length, 1);
  assert.equal(result.outputFiles[0].mimeType, 'application/pdf');
  assertValidPdf(result.outputFiles[0].buffer, 'excel-to-pdf output');
});

// ─── PowerPoint to PDF Conversion Tests ───────────────────────────────────────

test('PowerPointToPdf - converts presentation (.pptx) to valid PDF', async () => {
  const processor = new OfficeToPdfProcessor('powerpoint-to-pdf');
  const inputBuf = makeDummyDocxBuffer();
  const ctx = makeCtx('job-ppt-01');

  const result = await processor.process(
    [inputBuf],
    { layout: 'slides', includeHiddenSlides: false },
    ctx
  );

  assert.equal(result.outputFiles.length, 1);
  assert.equal(result.outputFiles[0].mimeType, 'application/pdf');
  assertValidPdf(result.outputFiles[0].buffer, 'powerpoint-to-pdf output');
});

test('OfficeToPdf - estimates appropriate memory cost for heavy conversion', () => {
  const processor = new OfficeToPdfProcessor('word-to-pdf');
  const estimate = processor.estimateResourceCost([{ sizeBytes: 10 * 1024 * 1024, mimeType: 'application/docx' }], {});
  assert.equal(estimate.isHeavyOperation, true);
  assert.ok(estimate.estimatedMemoryBytes >= 128 * 1024 * 1024);
});
