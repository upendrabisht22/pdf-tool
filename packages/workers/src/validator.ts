/**
 * @file validator.ts
 * @description Output integrity validator to ensure processed documents are healthy, structurally valid, and non-empty.
 */

import { inspectFileMagicBytes, PlatformError } from '@doc-platform/core';

export interface OutputValidationResult {
  isValid: boolean;
  format: string;
  sizeBytes: number;
  error?: string;
}

export function validateOutputDocument(
  outputBuffer: Buffer | Uint8Array,
  expectedFormat: 'pdf' | 'png' | 'jpeg' | 'webp' | 'docx' = 'pdf'
): OutputValidationResult {
  if (!outputBuffer || outputBuffer.length === 0) {
    throw new PlatformError('FILE_CORRUPTED', {
      message: 'Worker produced an empty 0-byte output document.',
    });
  }

  const inspection = inspectFileMagicBytes(outputBuffer);

  if (expectedFormat === 'pdf' && inspection.detectedFormat !== 'pdf') {
    throw new PlatformError('FILE_CORRUPTED', {
      message: `Generated document does not contain valid PDF magic bytes. Detected: ${inspection.detectedFormat}`,
    });
  }

  if (expectedFormat !== 'pdf' && inspection.detectedFormat !== expectedFormat) {
    throw new PlatformError('FILE_CORRUPTED', {
      message: `Generated output does not match expected format "${expectedFormat}". Detected: ${inspection.detectedFormat}`,
    });
  }

  return {
    isValid: true,
    format: inspection.detectedFormat,
    sizeBytes: outputBuffer.length,
  };
}
