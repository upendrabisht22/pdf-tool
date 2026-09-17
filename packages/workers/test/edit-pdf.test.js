import test from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument } from 'pdf-lib';
import { EditPdfProcessor } from '../dist/index.js';

const mockContext = {
  jobId: 'job_edit_test_1',
  workerId: 'worker_edit_1',
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
    page.drawText(`Sample Content on Page ${i + 1}`, { x: 50, y: height - 100 });
  }
  const bytes = await doc.save();
  return Buffer.from(bytes);
}

test('Visual PDF Editor Suite: EditPdfProcessor applies text, whiteout, and stamps', async () => {
  const processor = new EditPdfProcessor();
  const sampleBuffer = await createSamplePdf(600, 800, 2);

  const options = {
    annotations: [
      {
        id: 'anno_txt_1',
        type: 'text',
        pageIndex: 0,
        x: 100,
        y: 200,
        text: 'Approved Contract Revision',
        fontSize: 18,
        bold: true,
        color: '#1d4ed8',
      },
      {
        id: 'anno_wo_1',
        type: 'whiteout',
        pageIndex: 0,
        x: 50,
        y: 100,
        width: 200,
        height: 30,
      },
      {
        id: 'anno_stamp_1',
        type: 'stamp',
        pageIndex: 1,
        x: 120,
        y: 150,
        stampText: 'CONFIDENTIAL',
        color: '#dc2626',
      },
      {
        id: 'anno_check_1',
        type: 'checkmark',
        pageIndex: 1,
        x: 80,
        y: 300,
      },
      {
        id: 'anno_shape_1',
        type: 'shape',
        pageIndex: 0,
        x: 50,
        y: 400,
        width: 150,
        height: 80,
        color: '#0f172a',
        strokeWidth: 2,
      },
      {
        id: 'anno_draw_1',
        type: 'draw',
        pageIndex: 0,
        points: [
          { x: 50, y: 500 },
          { x: 80, y: 520 },
          { x: 120, y: 510 },
        ],
        color: '#ef4444',
        strokeWidth: 3,
      },
    ],
  };

  const result = await processor.process([sampleBuffer], options, mockContext);
  assert.ok(result.outputFiles.length === 1);
  assert.strictEqual(result.outputFiles[0].filename, 'edited_document.pdf');
  assert.strictEqual(result.outputFiles[0].mimeType, 'application/pdf');

  const outDoc = await PDFDocument.load(result.outputFiles[0].buffer);
  assert.strictEqual(outDoc.getPageCount(), 2);
  assert.ok(result.metrics.outputSizeBytes > 0);
});

test('Visual PDF Editor Suite: EditPdfProcessor validates inputs correctly', async () => {
  const processor = new EditPdfProcessor();
  await assert.rejects(
    async () => processor.validateInput([], { annotations: [] }),
    /Visual PDF Editor requires exactly 1 input PDF/
  );

  const sampleBuffer = await createSamplePdf(600, 800, 1);
  await assert.rejects(
    async () => processor.validateInput([sampleBuffer], { annotations: 'invalid-non-array' }),
    /Annotations must be an array/
  );
});
