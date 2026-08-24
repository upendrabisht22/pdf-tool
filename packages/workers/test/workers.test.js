import test from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument, rgb } from 'pdf-lib';
import {
  MergePdfProcessor,
  SplitPdfProcessor,
  RotatePdfProcessor,
  CompressPdfProcessor,
  ImageToPdfProcessor,
  SandboxedWorkerHarness,
} from '../dist/index.js';

// Helper to create a synthetic valid PDF with N pages
async function createTestPdf(pageCount = 2, title = 'Sample') {
  const doc = await PDFDocument.create();
  for (let i = 1; i <= pageCount; i++) {
    const page = doc.addPage([400, 600]);
    page.drawText(`${title} - Page ${i}`, {
      x: 50,
      y: 500,
      size: 20,
      color: rgb(0.2, 0.4, 0.8),
    });
  }
  const bytes = await doc.save();
  return Buffer.from(bytes);
}

// 1x1 PNG image fixture
const SAMPLE_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

const mockContext = {
  jobId: 'job_test_worker',
  workerId: 'worker_01',
  timeoutMs: 10000,
  maxMemoryBytes: 100 * 1024 * 1024,
  tempWorkingDir: '',
  isCancelled: () => false,
  onProgress: async () => {},
};

test('Workers - MergePdfProcessor combines 2 PDFs into 1 document', async () => {
  const pdf1 = await createTestPdf(2, 'DocA');
  const pdf2 = await createTestPdf(3, 'DocB');

  const processor = new MergePdfProcessor();
  const result = await processor.process([pdf1, pdf2], {}, mockContext);

  assert.equal(result.outputFiles.length, 1);
  assert.equal(result.outputFiles[0].pageCount, 5);
  assert.ok(result.outputFiles[0].buffer);
  assert.ok(result.outputFiles[0].buffer.length > 0);
  assert.ok(result.metrics.durationMs >= 0);
});

test('Workers - SplitPdfProcessor splits a PDF by custom range', async () => {
  const sourcePdf = await createTestPdf(5, 'DocToSplit');
  const processor = new SplitPdfProcessor();

  const result = await processor.process([sourcePdf], { mode: 'ranges', ranges: ['1-2', '4-5'] }, mockContext);
  assert.equal(result.outputFiles.length, 2);
  assert.equal(result.outputFiles[0].pageCount, 2);
  assert.equal(result.outputFiles[1].pageCount, 2);
});

test('Workers - RotatePdfProcessor rotates pages 90 degrees', async () => {
  const sourcePdf = await createTestPdf(2, 'DocToRotate');
  const processor = new RotatePdfProcessor();

  const result = await processor.process([sourcePdf], { rotation: 90, targetPages: 'all' }, mockContext);
  assert.equal(result.outputFiles.length, 1);
  assert.equal(result.outputFiles[0].pageCount, 2);
  assert.ok(result.outputFiles[0].buffer);
});

test('Workers - CompressPdfProcessor compresses PDF', async () => {
  const sourcePdf = await createTestPdf(3, 'DocToCompress');
  const processor = new CompressPdfProcessor();

  const result = await processor.process([sourcePdf], { level: 'recommended' }, mockContext);
  assert.equal(result.outputFiles.length, 1);
  assert.ok(result.outputFiles[0].buffer);
});

test('Workers - ImageToPdfProcessor compiles PNG into paginated PDF', async () => {
  const processor = new ImageToPdfProcessor();
  const result = await processor.process([SAMPLE_PNG, SAMPLE_PNG], { pageSize: 'A4', orientation: 'portrait' }, mockContext);

  assert.equal(result.outputFiles.length, 1);
  assert.equal(result.outputFiles[0].pageCount, 2);
});

test('Workers - SandboxedWorkerHarness handles timeouts cleanly', async () => {
  const harness = new SandboxedWorkerHarness({ defaultTimeoutMs: 100 });
  await assert.rejects(
    () =>
      harness.runIsolated('job_timeout_test', 'w1', async () => {
        await new Promise((resolve) => setTimeout(resolve, 300));
        return true;
      }),
    (err) => err.code === 'JOB_TIMEOUT'
  );
});
