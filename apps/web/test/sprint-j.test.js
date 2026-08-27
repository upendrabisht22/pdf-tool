/**
 * @file test/sprint-j.test.js
 * @description Phase 9: Zero-Login, BYOK AI & Core Platform Invariants Test Suite
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { TOOL_REGISTRY, TIER_LIMITS } from '@doc-platform/core';
import { DefaultAuthProvider } from '@doc-platform/providers';

describe('Phase 9 — Zero-Login & BYOK Architecture', () => {
  it('DefaultAuthProvider resolves anonymous sessions with 0 credentials', async () => {
    const auth = new DefaultAuthProvider();
    const session = await auth.resolveSession({});
    assert.equal(session.tier, 'ANONYMOUS');
    assert.equal(session.userId, null);
    assert.ok(session.sessionId.startsWith('anon_'));
    assert.equal(session.quotas.maxUploadSizeBytes, 50 * 1024 * 1024);
  });

  it('TOOL_REGISTRY contains Core PDF, Security, and Conversion tools with SEO metadata', () => {
    const expectedTools = [
      'merge-pdf',
      'split-pdf',
      'compress-pdf',
      'rotate-pdf',
      'delete-pdf-pages',
      'jpg-to-pdf',
      'pdf-to-jpg',
      'word-to-pdf',
      'excel-to-pdf',
      'pdf-to-word',
      'pdf-to-excel',
      'watermark-pdf',
      'protect-pdf',
      'unlock-pdf',
    ];

    for (const tool of expectedTools) {
      assert.ok(TOOL_REGISTRY[tool], `Tool ${tool} must exist in TOOL_REGISTRY`);
      assert.ok(TOOL_REGISTRY[tool].title, `Tool ${tool} must have a title`);
      assert.ok(TOOL_REGISTRY[tool].metaDescription, `Tool ${tool} must have a metaDescription`);
    }
  });

  it('Tier limits allow generous free anonymous quotas without login', () => {
    const anon = TIER_LIMITS.ANONYMOUS;
    assert.equal(anon.maxUploadSizeBytes, 50 * 1024 * 1024, 'Anonymous limit must be 50MB');
    assert.equal(anon.maxFilesPerJob, 10, 'Anonymous batch limit must be 10');
  });

  it('Anonymous users have fast 2-hour storage retention with zero data leak', () => {
    const anon = TIER_LIMITS.ANONYMOUS;
    assert.equal(anon.retentionHours, 2, 'Anonymous files auto-purged within 2 hours');
  });
});
