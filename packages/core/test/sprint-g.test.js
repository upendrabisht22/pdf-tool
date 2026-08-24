/**
 * @file sprint-g.test.js
 * @description Integration and unit tests for Sprint G:
 *   - AI Document Summarizer (`ai-summarize`)
 *   - AI Grounded Q&A with Citations (`ai-ask`)
 *   - AI Structured Table / Schema Extractor (`ai-extract-table`)
 *   - Multi-Operation Workflow Pipeline Engine (`pipeline`)
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument } from 'pdf-lib';

import {
  AiSummarizeProcessor,
  AiAskProcessor,
  AiExtractTableProcessor,
} from '../../workers/dist/processors/ai-document.js';
import { PipelineProcessor } from '../../workers/dist/processors/pipeline.js';
import { PlatformError } from '../dist/index.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function makeTestPdf(pageCount = 3) {
  const pdf = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) {
    pdf.addPage([595, 842]);
  }
  return Buffer.from(await pdf.save());
}

function makeCtx(jobId = 'test-sprint-g') {
  return {
    jobId,
    workerId: 'worker_test_g',
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

// ─── AI Summarizer Tests ──────────────────────────────────────────────────────

test('AI Summarize - generates executive markdown summary from document', async () => {
  const processor = new AiSummarizeProcessor();
  const inputBuf = await makeTestPdf(4);
  const ctx = makeCtx('ai-sum-001');

  const result = await processor.process(
    [inputBuf],
    { mode: 'executive', focusArea: 'financials' },
    ctx
  );

  assert.equal(result.outputFiles.length, 1);
  assert.equal(result.outputFiles[0].filename, 'ai_document_summary.md');
  assert.equal(result.outputFiles[0].mimeType, 'text/markdown');
  const markdown = result.outputFiles[0].buffer.toString('utf8');
  assert.ok(markdown.includes('Executive Overview'));
  assert.ok(markdown.includes('4 Page(s) Analyzed'));
});

test('AI Summarize - rejects empty file input', async () => {
  const processor = new AiSummarizeProcessor();
  await assert.rejects(
    () => processor.validateInput([], {}),
    (err) => err instanceof PlatformError && err.code === 'INVALID_INPUT'
  );
});

// ─── AI Grounded Q&A Tests ───────────────────────────────────────────────────

test('AI Ask - returns grounded answer with exact page citations', async () => {
  const processor = new AiAskProcessor();
  const inputBuf = await makeTestPdf(3);
  const ctx = makeCtx('ai-ask-001');

  const result = await processor.process(
    [inputBuf],
    { question: 'What are the invoice payment terms and arbitration rules?' },
    ctx
  );

  assert.equal(result.outputFiles.length, 1);
  assert.equal(result.outputFiles[0].filename, 'ai_qa_response.json');
  assert.equal(result.outputFiles[0].mimeType, 'application/json');

  const payload = JSON.parse(result.outputFiles[0].buffer.toString('utf8'));
  assert.equal(payload.question, 'What are the invoice payment terms and arbitration rules?');
  assert.ok(payload.citations && payload.citations.length > 0, 'Must include grounded citations');
  assert.ok(payload.citations[0].pageNumber >= 1, 'Citation must refer to a valid page number');
  assert.ok(payload.groundedConfidence > 0.9, 'Must have high confidence score');
});

test('AI Ask - rejects empty question query', async () => {
  const processor = new AiAskProcessor();
  await assert.rejects(
    () => processor.validateInput([{ sizeBytes: 1000, mimeType: 'application/pdf' }], { question: '   ' }),
    (err) => err instanceof PlatformError && err.code === 'INVALID_INPUT'
  );
});

// ─── AI Table Extractor Tests ────────────────────────────────────────────────

test('AI Table Extractor - extracts structured JSON records from document', async () => {
  const processor = new AiExtractTableProcessor();
  const inputBuf = await makeTestPdf(2);
  const ctx = makeCtx('ai-tbl-001');

  const result = await processor.process([inputBuf], { format: 'json' }, ctx);

  assert.equal(result.outputFiles.length, 1);
  assert.equal(result.outputFiles[0].mimeType, 'application/json');
  const payload = JSON.parse(result.outputFiles[0].buffer.toString('utf8'));
  assert.ok(Array.isArray(payload.extractedRecords));
  assert.ok(payload.extractedRecords.length > 0);
});

test('AI Table Extractor - extracts CSV format', async () => {
  const processor = new AiExtractTableProcessor();
  const inputBuf = await makeTestPdf(1);
  const ctx = makeCtx('ai-tbl-002');

  const result = await processor.process([inputBuf], { format: 'csv' }, ctx);

  assert.equal(result.outputFiles.length, 1);
  assert.equal(result.outputFiles[0].mimeType, 'text/csv');
  const csv = result.outputFiles[0].buffer.toString('utf8');
  assert.ok(csv.includes('Item,Quantity,Unit Price'));
});

// ─── Multi-Operation Workflow Pipeline Tests ─────────────────────────────────

test('Pipeline - chains multiple operations: Watermark -> Protect', async () => {
  const processor = new PipelineProcessor();
  const inputBuf = await makeTestPdf(2);
  const ctx = makeCtx('pipe-001');

  const result = await processor.process(
    [inputBuf],
    {
      steps: [
        {
          operation: 'watermark-pdf',
          options: { text: 'CONFIDENTIAL', opacity: 0.3, position: 'center' },
        },
        {
          operation: 'protect-pdf',
          options: { userPassword: 'SecretPassword123' },
        },
      ],
    },
    ctx
  );

  assert.equal(result.outputFiles.length, 1);
  assertValidPdf(result.outputFiles[0].buffer, 'pipeline-output');
  assert.equal(result.outputFiles[0].filename, 'pipeline_processed_document.pdf');
});

test('Pipeline - rejects empty steps array', async () => {
  const processor = new PipelineProcessor();
  await assert.rejects(
    () => processor.validateInput([{ sizeBytes: 1000, mimeType: 'application/pdf' }], { steps: [] }),
    (err) => err instanceof PlatformError && err.code === 'INVALID_INPUT'
  );
});

test('Pipeline - rejects unsupported step operation', async () => {
  const processor = new PipelineProcessor();
  await assert.rejects(
    () => processor.validateInput(
      [{ sizeBytes: 1000, mimeType: 'application/pdf' }],
      { steps: [{ operation: 'non-existent-op', options: {} }] }
    ),
    (err) => err instanceof PlatformError && err.code === 'INVALID_INPUT'
  );
});
