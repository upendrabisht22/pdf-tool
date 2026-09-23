/**
 * @file modules/options-collector.js
 * @description Centralized options gathering for all tool operations.
 *
 * Reads DOM form values for the currently active tool and returns
 * a structured options object ready for the worker API.
 */

import { parsePageRanges } from './utils.js';

/**
 * Collects tool-specific options from the DOM for the active tool.
 * @param {string} activeTool - The currently active tool key
 * @returns {Object} Options object to pass to the worker API
 */
export function collectActiveToolOptions(activeTool) {
  const opts = {};

  if (activeTool === 'split-pdf') {
    const mode = document.getElementById('opt-split-mode')?.value || 'all-pages';
    opts.mode = mode;
    if (mode === 'ranges') opts.ranges = [document.getElementById('opt-split-ranges')?.value || '1'];
  } else if (activeTool === 'compress-pdf') {
    opts.level = document.getElementById('opt-compress-level')?.value || 'recommended';
  } else if (activeTool === 'rotate-pdf') {
    opts.rotation = parseInt(document.getElementById('opt-rotate-angle')?.value || '90', 10);
    const targetPages = document.getElementById('opt-rotate-pages')?.value || 'all';
    if (targetPages === 'custom') {
      const customInput = document.getElementById('opt-rotate-custom-pages')?.value || '1';
      opts.targetPages = parsePageRanges(customInput, 1000);
    } else {
      opts.targetPages = targetPages;
    }
  } else if (activeTool === 'delete-pdf-pages') {
    opts.deleteInput = document.getElementById('opt-delete-pages')?.value || '';
  } else if (activeTool === 'extract-pages') {
    opts.pages = parsePageRanges(document.getElementById('opt-extract-pages')?.value || '1', 1000);
  } else if (activeTool === 'jpg-to-pdf') {
    opts.pageSize = document.getElementById('opt-image-pagesize')?.value || 'A4';
    opts.orientation = document.getElementById('opt-image-orientation')?.value || 'auto';
  } else if (activeTool === 'watermark-pdf') {
    opts.text = document.getElementById('opt-watermark-text')?.value || 'CONFIDENTIAL';
    opts.opacity = parseFloat(document.getElementById('opt-watermark-opacity')?.value || '0.3');
  } else if (activeTool === 'protect-pdf') {
    opts.userPassword = document.getElementById('opt-protect-pass')?.value || '123456';
  } else if (activeTool === 'unlock-pdf') {
    opts.password = document.getElementById('opt-unlock-pass')?.value || '';
  } else if (activeTool === 'redact-pdf') {
    opts.boxes = [{ page: 1, x: 50, y: 400, width: 200, height: 30, replacementLabel: document.getElementById('opt-redact-label')?.value || '[REDACTED]' }];
    opts.sanitizeMetadata = document.getElementById('opt-redact-meta')?.checked ?? true;
  } else if (activeTool === 'ocr-pdf') {
    opts.language = document.getElementById('opt-ocr-lang')?.value || 'eng';
    opts.outputType = document.getElementById('opt-ocr-out')?.value || 'searchable-pdf';
  } else if (activeTool === 'compare-pdf') {
    opts.mode = document.getElementById('opt-compare-mode')?.value || 'visual-diff';
  } else if (activeTool === 'ai-summarize') {
    opts.mode = document.getElementById('opt-sum-mode')?.value || 'executive';
    opts.focusArea = document.getElementById('opt-sum-focus')?.value || 'all';
  } else if (activeTool === 'ai-ask') {
    opts.question = document.getElementById('opt-ask-query')?.value || 'What are the main key points of this document?';
  } else if (activeTool === 'ai-extract-table') {
    opts.format = document.getElementById('opt-table-format')?.value || 'json';
  } else if (activeTool === 'pdf-to-markdown') {
    opts.preserveTables = document.getElementById('opt-md-tables')?.checked ?? true;
    opts.includePageBreaks = document.getElementById('opt-md-page-break')?.checked ?? true;
  } else if (activeTool === 'markdown-to-pdf') {
    opts.pageSize = document.getElementById('opt-md-pagesize')?.value || 'A4';
    opts.theme = document.getElementById('opt-md-theme')?.value || 'modern';
  }

  return opts;
}
