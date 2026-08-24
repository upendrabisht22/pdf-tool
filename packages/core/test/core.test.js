import test from 'node:test';
import assert from 'node:assert/strict';
import {
  inspectFileMagicBytes,
  validatePdfSafety,
  PlatformError,
  VALID_JOB_TRANSITIONS,
  TIER_LIMITS,
  TOOL_REGISTRY,
  generateToolJsonLd,
} from '../dist/index.js';

test('Core - Magic Byte Validator rejects empty or tiny buffers', () => {
  assert.throws(
    () => inspectFileMagicBytes(Buffer.from([])),
    (err) => err instanceof PlatformError && err.code === 'INVALID_INPUT'
  );
});

test('Core - Magic Byte Validator detects valid PDF header', () => {
  const pdfHeader = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]); // %PDF-1.7
  const res = inspectFileMagicBytes(pdfHeader);
  assert.equal(res.isValid, true);
  assert.equal(res.detectedFormat, 'pdf');
  assert.equal(res.mimeType, 'application/pdf');
});

test('Core - Magic Byte Validator detects PNG header', () => {
  const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const res = inspectFileMagicBytes(pngHeader);
  assert.equal(res.isValid, true);
  assert.equal(res.detectedFormat, 'png');
});

test('Core - Magic Byte Validator detects JPEG header', () => {
  const jpegHeader = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
  const res = inspectFileMagicBytes(jpegHeader);
  assert.equal(res.isValid, true);
  assert.equal(res.detectedFormat, 'jpeg');
});

test('Core - Magic Byte Validator flags unknown binary as invalid', () => {
  const exeHeader = Buffer.from([0x4d, 0x5a, 0x90, 0x00]); // MZ..
  const res = inspectFileMagicBytes(exeHeader);
  assert.equal(res.isValid, false);
  assert.equal(res.detectedFormat, 'unknown');
});

test('Core - Job State Machine contains valid state transitions', () => {
  assert.deepEqual(VALID_JOB_TRANSITIONS.CREATED, ['QUEUED', 'EXPIRED', 'CANCELLED']);
  assert.deepEqual(VALID_JOB_TRANSITIONS.QUEUED, ['PROCESSING', 'CANCELLED', 'EXPIRED']);
  assert.deepEqual(VALID_JOB_TRANSITIONS.PROCESSING, ['VALIDATING', 'FAILED', 'CANCELLED']);
  assert.deepEqual(VALID_JOB_TRANSITIONS.VALIDATING, ['COMPLETED', 'FAILED', 'CANCELLED']);
});

test('Core - Tier Limits contain defined quotas', () => {
  assert.equal(TIER_LIMITS.ANONYMOUS.maxUploadSizeBytes, 50 * 1024 * 1024);
  assert.equal(TIER_LIMITS.PRO.maxUploadSizeBytes, 500 * 1024 * 1024);
  assert.equal(TIER_LIMITS.PRO.hasPriorityQueue, true);
});

test('Core - SEO JSON-LD structured data generation', () => {
  const mergeConfig = TOOL_REGISTRY['merge-pdf'];
  assert.ok(mergeConfig);
  const jsonLd = generateToolJsonLd(mergeConfig);
  assert.equal(jsonLd.webAppSchema['@type'], 'WebApplication');
  assert.equal(jsonLd.howToSchema['@type'], 'HowTo');
  assert.equal(jsonLd.faqSchema['@type'], 'FAQPage');
  assert.equal(jsonLd.faqSchema.mainEntity.length, 3);
});
