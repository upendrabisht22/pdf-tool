import test from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument } from 'pdf-lib';
import { CropPdfProcessor } from '../dist/index.js';

const mockContext = {
  jobId: 'job_crop_test_1',
  workerId: 'worker_crop_1',
  timeoutMs: 30000,
  maxMemoryBytes: 512 * 1024 * 1024,
  tempWorkingDir: '.',
  isCancelled: () => false,
  onProgress: async () => {},
};

async function createSamplePdf(width = 600, height = 800, pageCount = 2) {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) {
    const page = doc.addPage([width, height]);
    page.drawText(`Page ${i + 1}`, { x: 50, y: height - 100 });
  }
  const bytes = await doc.save();
  return Buffer.from(bytes);
}

test('Crop & Resize Suite: CropPdfProcessor trims margins accurately', async () => {
  const processor = new CropPdfProcessor();
  const sampleBuffer = await createSamplePdf(600, 800, 2);

  const options = {
    mode: 'trim',
    top: 20,
    bottom: 20,
    left: 20,
    right: 20,
    unit: 'pt',
  };

  const result = await processor.process([sampleBuffer], options, mockContext);
  assert.ok(result.outputFiles.length === 1);
  const outDoc = await PDFDocument.load(result.outputFiles[0].buffer);
  assert.strictEqual(outDoc.getPageCount(), 2);

  const page = outDoc.getPage(0);
  const cropBox = page.getCropBox();
  assert.strictEqual(cropBox.x, 20);
  assert.strictEqual(cropBox.y, 20);
  assert.strictEqual(cropBox.width, 560);
  assert.strictEqual(cropBox.height, 760);
});

test('Crop & Resize Suite: CropPdfProcessor resizes pages to standard A4 sheet', async () => {
  const processor = new CropPdfProcessor();
  const sampleBuffer = await createSamplePdf(612, 792, 1); // US Letter

  const options = {
    mode: 'resize',
    targetSize: 'A4',
    scaleMode: 'fit',
  };

  const result = await processor.process([sampleBuffer], options, mockContext);
  assert.ok(result.outputFiles.length === 1);
  const outDoc = await PDFDocument.load(result.outputFiles[0].buffer);
  const page = outDoc.getPage(0);
  const size = page.getSize();
  assert.ok(Math.abs(size.width - 595.28) < 0.1);
  assert.ok(Math.abs(size.height - 841.89) < 0.1);
});

test('Crop & Resize Suite: CropPdfProcessor validates input properly', async () => {
  const processor = new CropPdfProcessor();
  await assert.rejects(
    async () => processor.validateInput([], {}),
    /Crop operation requires exactly 1 input PDF/
  );
});
