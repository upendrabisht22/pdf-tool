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
import { decryptPDF } from '@pdfsmaller/pdf-decrypt';
import { PDFDocument } from 'pdf-lib';

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

    let decryptedBytes: Uint8Array;
    try {
      decryptedBytes = await decryptPDF(new Uint8Array(inputBuffer), options.password);
    } catch (err: unknown) {
      const message = (err as Error).message || '';
      throw new PlatformError('FILE_ENCRYPTED', {
        message: `Failed to unlock document: ${message}. Please check your password.`,
      });
    }

    await context.onProgress(60, 'Saving decrypted document...');

    const outputBuffer = Buffer.from(decryptedBytes);
    validateOutputDocument(outputBuffer, 'pdf');
    
    let pageCount = 1;
    try {
      const pdfDoc = await PDFDocument.load(outputBuffer);
      pageCount = pdfDoc.getPageCount();
    } catch {
      // Continue
    }

    await context.onProgress(100, 'Document unlocked successfully.');

    return {
      outputFiles: [
        {
          filename: 'unlocked_document.pdf',
          mimeType: 'application/pdf',
          buffer: outputBuffer,
          pageCount,
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
