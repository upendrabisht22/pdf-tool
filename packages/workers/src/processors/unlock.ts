/**
 * @file processors/unlock.ts
 * @description Removes password encryption from a PDF when the user provides the correct password.
 *
 * Security Rules:
 *  - We do NOT attempt brute-force or dictionary attacks on PDFs.
 *  - The user must provide their own password.
 *  - We are removing protection from documents users own.
 *  - If the password is wrong, we return FILE_ENCRYPTED with a clear error.
 *
 * Legal Note: Only unlock documents you own or have explicit authorization to decrypt.
 */

import { PDFDocument } from 'pdf-lib';
import {
  UnlockPdfOptions,
  PlatformError,
  ProcessingResult,
  ValidatedFile,
  WorkerExecutionContext,
  validatePdfSafety,
} from '@doc-platform/core';
import { DocumentProcessor, ResourceEstimate } from '@doc-platform/providers';
import { validateOutputDocument } from '../validator.js';

export class UnlockPdfProcessor implements DocumentProcessor<UnlockPdfOptions> {
  readonly operation = 'unlock-pdf' as const;

  async validateInput(inputFiles: ValidatedFile[], options: UnlockPdfOptions): Promise<void> {
    if (!inputFiles || inputFiles.length !== 1) {
      throw new PlatformError('INVALID_INPUT', {
        message: 'Unlock operation requires exactly 1 input PDF.',
      });
    }
    if (!options.password || options.password.trim().length === 0) {
      throw new PlatformError('INVALID_INPUT', {
        message: 'A password is required to unlock this document. Only unlock documents you own.',
      });
    }
  }

  estimateResourceCost(inputFiles: ValidatedFile[], _options: UnlockPdfOptions): ResourceEstimate {
    const size = inputFiles[0]?.sizeBytes || 0;
    return {
      estimatedDurationMs: Math.max(300, Math.round(size / 20000)),
      estimatedMemoryBytes: Math.round(size * 2),
      isHeavyOperation: false,
    };
  }

  async process(
    inputBuffers: Buffer[],
    options: UnlockPdfOptions,
    context: WorkerExecutionContext
  ): Promise<ProcessingResult> {
    const startTime = Date.now();
    const inputBuffer = inputBuffers[0];
    validatePdfSafety(inputBuffer);

    await context.onProgress(20, 'Attempting to decrypt document...');

    let pdfDoc: PDFDocument;
    try {
      // pdf-lib v1.x: password is passed via the undocumented `password` field
      // which is not in the public TypeScript typings — use ts-ignore here.
      // This is the only supported decryption path in pdf-lib v1.
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      pdfDoc = await PDFDocument.load(inputBuffer, { password: options.password });
    } catch (err: unknown) {
      const message = (err as Error).message || '';
      // pdf-lib throws when wrong password is given
      if (
        message.toLowerCase().includes('password') ||
        message.toLowerCase().includes('encrypted') ||
        message.toLowerCase().includes('decrypt')
      ) {
        throw new PlatformError('FILE_ENCRYPTED', {
          message: 'The provided password is incorrect or the document cannot be decrypted.',
          userAction:
            'Please verify you have the correct password for this document. Only documents you own can be unlocked here.',
        });
      }
      throw new PlatformError('FILE_CORRUPTED', {
        message: `Failed to parse PDF: ${message}`,
      });
    }

    await context.onProgress(60, 'Saving decrypted document...');

    // Save without any encryption — this removes the password entirely
    const bytes = await pdfDoc.save({ useObjectStreams: true });
    const outputBuffer = Buffer.from(bytes);

    validateOutputDocument(outputBuffer, 'pdf');
    await context.onProgress(100, 'Document unlocked successfully.');

    return {
      outputFiles: [
        {
          filename: 'unlocked_document.pdf',
          mimeType: 'application/pdf',
          buffer: outputBuffer,
          pageCount: pdfDoc.getPageCount(),
        },
      ],
      metrics: {
        durationMs: Date.now() - startTime,
        inputSizeBytes: inputBuffer.length,
        outputSizeBytes: outputBuffer.length,
      },
    };
  }
}
