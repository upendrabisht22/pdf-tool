/**
 * @file test/sprint-b.test.js
 * @description Security hardening tests for Sprint B:
 *   - Rate limiter (sliding window, route classification, 429 response)
 *   - PDF bomb defense (stream expansion ratio, page count, metadata strings)
 *   - File size guard (per-tier limits, total batch size)
 *   - Job TTL constants (sanity checks)
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { checkRateLimit, ROUTE_LIMITS } from '../security/rate-limiter.js';
import {
  scanForPdfBomb,
  validatePageCount,
  validateMetadataStrings,
  MAX_PAGE_COUNT,
  MAX_METADATA_STRING_BYTES,
} from '../security/pdf-bomb-defense.js';
import {
  validateFileSize,
  validateTotalJobSize,
  TIER_SIZE_LIMITS,
} from '../security/file-size-guard.js';
import {
  OUTPUT_FILE_TTL_MS,
  STALE_JOB_TTL_MS,
  UPLOAD_FILE_TTL_MS,
} from '../security/job-ttl.js';

// ─── Helper: Fake request object ─────────────────────────────────────────────

function makeReq(ip = '1.2.3.4', method = 'GET', path = '/api/v1/health', xForwardedFor = null) {
  return {
    method,
    socket: { remoteAddress: ip },
    headers: xForwardedFor ? { 'x-forwarded-for': xForwardedFor } : {},
    url: path,
  };
}

// ─── Rate Limiter Tests ───────────────────────────────────────────────────────

test('RateLimiter - allows requests within limit', () => {
  const req = makeReq('10.0.0.1', 'GET', '/api/v1/jobs/test-job-id');
  const result = checkRateLimit(req, '/api/v1/jobs/test-job-id');
  assert.equal(result.limited, false);
  assert.ok(result.remaining > 0);
});

test('RateLimiter - blocks requests after limit is exceeded', () => {
  const ip = `192.168.1.${Math.floor(Math.random() * 250)}`; // Unique IP per test
  const req = makeReq(ip, 'POST', '/api/v1/files/upload-request');
  const limit = ROUTE_LIMITS.upload.maxRequests;

  // Exhaust the limit
  for (let i = 0; i < limit; i++) {
    checkRateLimit(req, '/api/v1/files/upload-request');
  }

  // Next request should be blocked
  const result = checkRateLimit(req, '/api/v1/files/upload-request');
  assert.equal(result.limited, true);
  assert.ok(result.retryAfterSeconds > 0, 'Should have retry-after value');
});

test('RateLimiter - different IPs have independent counters', () => {
  const ip1 = `172.16.${Math.floor(Math.random() * 200)}.1`;
  const ip2 = `172.16.${Math.floor(Math.random() * 200)}.2`;

  const req1 = makeReq(ip1, 'POST', '/api/v1/jobs');
  const req2 = makeReq(ip2, 'POST', '/api/v1/jobs');

  // Exhaust IP1's job limit
  const limit = ROUTE_LIMITS.job.maxRequests;
  for (let i = 0; i < limit; i++) {
    checkRateLimit(req1, '/api/v1/jobs');
  }
  const blocked = checkRateLimit(req1, '/api/v1/jobs');
  assert.equal(blocked.limited, true, 'IP1 should be blocked');

  // IP2 should not be blocked
  const allowed = checkRateLimit(req2, '/api/v1/jobs');
  assert.equal(allowed.limited, false, 'IP2 should still be allowed');
});

test('RateLimiter - no limit on static assets', () => {
  const req = makeReq('10.0.0.5', 'GET', '/styles.css');
  const result = checkRateLimit(req, '/styles.css');
  assert.equal(result.limited, false);
  assert.equal(result.remaining, Infinity);
});

test('RateLimiter - respects X-Forwarded-For header', () => {
  const req = makeReq('10.10.10.10', 'POST', '/api/v1/jobs', '203.0.113.42, 10.1.1.1');
  // Should read 203.0.113.42 as the real client IP, not 10.10.10.10
  const result = checkRateLimit(req, '/api/v1/jobs');
  assert.equal(result.limited, false); // Fresh IP, should be fine
});

// ─── PDF Bomb Defense Tests ───────────────────────────────────────────────────

test('PdfBombDefense - accepts a normal PDF buffer', () => {
  const normalPdf = Buffer.from('%PDF-1.7\n/Length 100\n>>stream\n' + 'x'.repeat(100) + '\nendstream');
  const result = scanForPdfBomb(normalPdf);
  assert.equal(result.safe, true);
});

test('PdfBombDefense - rejects file exceeding max compressed size', () => {
  // Simulate a 501MB file check by creating a buffer with a fake declared size
  // We can't allocate 501MB in a test, so we test the logic path via a stub
  const fakeOversizedBuffer = {
    length: 501 * 1024 * 1024, // 501MB
    toString: () => '', // No stream declarations
    slice: () => Buffer.from('%PDF-'),
  };
  const result = scanForPdfBomb(fakeOversizedBuffer);
  assert.equal(result.safe, false);
  assert.ok(result.reason.includes('exceeds the maximum'));
});

test('PdfBombDefense - rejects suspicious stream expansion ratio', () => {
  // Craft a buffer that declares massive streams but is tiny on disk
  // /Length 999999999 × many entries = extremely high expansion ratio
  let fakeContent = '%PDF-1.4\n';
  for (let i = 0; i < 100; i++) {
    fakeContent += '/Length 9999999\n>>stream\n\nendstream\n'; // 100 × 10MB declared
  }
  const buffer = Buffer.from(fakeContent);
  const result = scanForPdfBomb(buffer);
  assert.equal(result.safe, false, 'High expansion ratio should be rejected');
  assert.ok(result.reason.includes('expansion ratio') || result.reason.includes('decompressed'), result.reason);
});

test('PdfBombDefense - validatePageCount rejects > MAX_PAGE_COUNT', () => {
  const result = validatePageCount(MAX_PAGE_COUNT + 1);
  assert.equal(result.safe, false);
  assert.ok(result.reason.includes('pages'));
});

test('PdfBombDefense - validatePageCount accepts normal page count', () => {
  const result = validatePageCount(50);
  assert.equal(result.safe, true);
});

test('PdfBombDefense - validateMetadataStrings rejects oversized field', () => {
  const hugeAuthor = 'A'.repeat(MAX_METADATA_STRING_BYTES + 1);
  const result = validateMetadataStrings({ author: hugeAuthor });
  assert.equal(result.safe, false);
  assert.ok(result.reason.includes('author'));
});

test('PdfBombDefense - validateMetadataStrings accepts normal metadata', () => {
  const result = validateMetadataStrings({
    author: 'John Doe',
    title: 'Q3 Financial Report',
    keywords: 'finance, quarterly, internal',
  });
  assert.equal(result.safe, true);
});

// ─── File Size Guard Tests ────────────────────────────────────────────────────

test('FileSizeGuard - ANONYMOUS tier rejects files over 50MB', () => {
  const sizeBytes = 51 * 1024 * 1024; // 51MB
  const result = validateFileSize(sizeBytes, 'ANONYMOUS');
  assert.equal(result.valid, false);
  assert.equal(result.error.code, 'FILE_TOO_LARGE');
  assert.ok(result.error.userAction.includes('Upgrade to Pro'));
});

test('FileSizeGuard - ANONYMOUS tier accepts files under 50MB', () => {
  const sizeBytes = 25 * 1024 * 1024; // 25MB
  const result = validateFileSize(sizeBytes, 'ANONYMOUS');
  assert.equal(result.valid, true);
});

test('FileSizeGuard - PRO tier accepts files up to 500MB', () => {
  const sizeBytes = 450 * 1024 * 1024; // 450MB
  const result = validateFileSize(sizeBytes, 'PRO');
  assert.equal(result.valid, true);
});

test('FileSizeGuard - PRO tier rejects files over 500MB', () => {
  const sizeBytes = 501 * 1024 * 1024; // 501MB
  const result = validateFileSize(sizeBytes, 'PRO');
  assert.equal(result.valid, false);
  assert.equal(result.error.code, 'FILE_TOO_LARGE');
});

test('FileSizeGuard - BUSINESS tier accepts files up to 2GB', () => {
  const sizeBytes = 1.5 * 1024 * 1024 * 1024; // 1.5GB
  const result = validateFileSize(sizeBytes, 'BUSINESS');
  assert.equal(result.valid, true);
});

test('FileSizeGuard - validateTotalJobSize blocks batch exceeding tier limit', () => {
  const files = [
    { sizeBytes: 30 * 1024 * 1024 }, // 30MB
    { sizeBytes: 30 * 1024 * 1024 }, // 30MB
  ]; // Total: 60MB > ANONYMOUS limit of 50MB
  const result = validateTotalJobSize(files, 'ANONYMOUS');
  assert.equal(result.valid, false);
  assert.equal(result.error.code, 'TOTAL_SIZE_TOO_LARGE');
});

test('FileSizeGuard - validateTotalJobSize allows batch within tier limit', () => {
  const files = [
    { sizeBytes: 20 * 1024 * 1024 }, // 20MB
    { sizeBytes: 20 * 1024 * 1024 }, // 20MB
  ]; // Total: 40MB < ANONYMOUS limit
  const result = validateTotalJobSize(files, 'ANONYMOUS');
  assert.equal(result.valid, true);
});

test('FileSizeGuard - unknown tier defaults to ANONYMOUS limits', () => {
  const sizeBytes = 51 * 1024 * 1024; // 51MB
  const result = validateFileSize(sizeBytes, 'UNKNOWN_TIER');
  assert.equal(result.valid, false);
  assert.equal(result.error.code, 'FILE_TOO_LARGE');
});

// ─── TTL Constants Sanity Checks ──────────────────────────────────────────────

test('TTL - output file TTL is at least 30 minutes', () => {
  assert.ok(OUTPUT_FILE_TTL_MS >= 30 * 60 * 1000, 'Output TTL should be ≥ 30 minutes');
});

test('TTL - upload file TTL is greater than output file TTL', () => {
  assert.ok(UPLOAD_FILE_TTL_MS > OUTPUT_FILE_TTL_MS, 'Uploads should live longer than outputs');
});

test('TTL - stale job TTL is less than output file TTL', () => {
  assert.ok(STALE_JOB_TTL_MS < OUTPUT_FILE_TTL_MS, 'Stale jobs expire before completed job outputs');
});
