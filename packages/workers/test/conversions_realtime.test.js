import test from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument } from 'pdf-lib';
import { PdfToWordProcessor, PdfToExcelProcessor } from '../dist/processors/pdf-to-office.js';
import { OfficeToPdfProcessor } from '../dist/processors/office-to-pdf.js';
import { ImageToPdfProcessor } from '../dist/processors/images.js';

test('Real-time Conversion: PDF to Word (.docx)', async () => {
  const doc = await PDFDocument.create();
  const page = doc.addPage([500, 700]);
  page.drawText('Sample Contract Agreement Text for Conversion');
  const pdfBytes = await doc.save();

  const mockContext = {
    jobId: 'job_wrd_1',
    workerId: 'worker_wrd_1',
    timeoutMs: 30000,
    maxMemoryBytes: 512 * 1024 * 1024,
    tempWorkingDir: '.',
    isCancelled: () => false,
    onProgress: async () => {},
  };

  const processor = new PdfToWordProcessor();
  const result = await processor.process([Buffer.from(pdfBytes)], {}, mockContext);

  assert.ok(result.outputFiles[0].buffer);
  assert.strictEqual(result.outputFiles[0].filename.endsWith('.docx'), true);
  
  // Verify PK\x03\x04 Zip magic header for OpenXML DOCX
  const buf = Buffer.from(result.outputFiles[0].buffer);
  assert.strictEqual(buf[0], 0x50);
  assert.strictEqual(buf[1], 0x4b);
  assert.strictEqual(buf[2], 0x03);
  assert.strictEqual(buf[3], 0x04);
});

test('Real-time Conversion: PDF to Excel (.xlsx)', async () => {
  const doc = await PDFDocument.create();
  const page = doc.addPage([500, 700]);
  page.drawText('Column A | Column B | Column C\nRow 1 | 100 | Completed');
  const pdfBytes = await doc.save();

  const mockContext = {
    jobId: 'job_xls_1',
    workerId: 'worker_xls_1',
    timeoutMs: 30000,
    maxMemoryBytes: 512 * 1024 * 1024,
    tempWorkingDir: '.',
    isCancelled: () => false,
    onProgress: async () => {},
  };

  const processor = new PdfToExcelProcessor();
  const result = await processor.process([Buffer.from(pdfBytes)], {}, mockContext);

  assert.ok(result.outputFiles[0].buffer);
  assert.strictEqual(result.outputFiles[0].filename.endsWith('.xlsx'), true);
  
  // Verify PK\x03\x04 Zip magic header for OpenXML XLSX
  const buf = Buffer.from(result.outputFiles[0].buffer);
  assert.strictEqual(buf[0], 0x50);
  assert.strictEqual(buf[1], 0x4b);
  assert.strictEqual(buf[2], 0x03);
  assert.strictEqual(buf[3], 0x04);
});

test('Real-time Conversion: Word to PDF (OfficeToPdfProcessor)', async () => {
  const mockContext = {
    jobId: 'job_w2p_1',
    workerId: 'worker_w2p_1',
    timeoutMs: 30000,
    maxMemoryBytes: 512 * 1024 * 1024,
    tempWorkingDir: '.',
    isCancelled: () => false,
    onProgress: async () => {},
  };

  // Mock OpenXML Word document buffer
  const sampleDocxBuf = Buffer.from('PK\x03\x04sample_docx_binary_content');

  const processor = new OfficeToPdfProcessor('word-to-pdf');
  const result = await processor.process([sampleDocxBuf], {}, mockContext);

  assert.ok(result.outputFiles[0].buffer);
  assert.strictEqual(result.outputFiles[0].mimeType, 'application/pdf');

  // Verify PDF header
  const outputDoc = await PDFDocument.load(result.outputFiles[0].buffer);
  assert.ok(outputDoc.getPageCount() >= 1);
});

test('Real-time Conversion: Excel to PDF (OfficeToPdfProcessor)', async () => {
  const mockContext = {
    jobId: 'job_x2p_1',
    workerId: 'worker_x2p_1',
    timeoutMs: 30000,
    maxMemoryBytes: 512 * 1024 * 1024,
    tempWorkingDir: '.',
    isCancelled: () => false,
    onProgress: async () => {},
  };

  const sampleXlsxBuf = Buffer.from('PK\x03\x04sample_xlsx_binary_content');

  const processor = new OfficeToPdfProcessor('excel-to-pdf');
  const result = await processor.process([sampleXlsxBuf], {}, mockContext);

  assert.ok(result.outputFiles[0].buffer);
  assert.strictEqual(result.outputFiles[0].mimeType, 'application/pdf');

  const outputDoc = await PDFDocument.load(result.outputFiles[0].buffer);
  assert.ok(outputDoc.getPageCount() >= 1);
});

test('Real-time Conversion: Images (PNG/JPG) to PDF', async () => {
  const mockContext = {
    jobId: 'job_img_1',
    workerId: 'worker_img_1',
    timeoutMs: 30000,
    maxMemoryBytes: 512 * 1024 * 1024,
    tempWorkingDir: '.',
    isCancelled: () => false,
    onProgress: async () => {},
  };

  // 1x1 transparent PNG buffer
  const samplePng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');

  const processor = new ImageToPdfProcessor();
  const result = await processor.process([samplePng], { pageSize: 'A4', orientation: 'auto' }, mockContext);

  assert.ok(result.outputFiles[0].buffer);
  const doc = await PDFDocument.load(result.outputFiles[0].buffer);
  assert.strictEqual(doc.getPageCount(), 1);
});
