import {
  ProtectPdfOptions,
  PlatformError,
  ProcessingResult,
  ValidatedFile,
  WorkerExecutionContext,
  validatePdfSafety,
} from '@doc-platform/core';
import { DocumentProcessor, ResourceEstimate } from '@doc-platform/providers';
import { validateOutputDocument } from '../validator.js';
import { encryptPDF } from '@pdfsmaller/pdf-encrypt';
import { PDFDocument } from 'pdf-lib';
import { randomBytes } from 'node:crypto';

function generateStrongPassword(): string {
  return randomBytes(32).toString('hex');
}

export class ProtectPdfProcessor implements DocumentProcessor<ProtectPdfOptions> {
  readonly operation = 'protect-pdf' as const;

  async validateInput(inputFiles: ValidatedFile[], options: ProtectPdfOptions): Promise<void> {
    if (!inputFiles || inputFiles.length !== 1) {
      throw new PlatformError('INVALID_INPUT', {
        message: 'Protect operation requires exactly 1 input PDF.',
      });
    }
    if (!options.userPassword || options.userPassword.trim().length === 0) {
      throw new PlatformError('INVALID_INPUT', {
        message: 'A user password must be provided to protect the document.',
      });
    }
    if (options.userPassword.length > 128) {
      throw new PlatformError('INVALID_INPUT', {
        message: 'Password must be 128 characters or fewer.',
      });
    }
  }

  estimateResourceCost(inputFiles: ValidatedFile[], _options: ProtectPdfOptions): ResourceEstimate {
    const size = inputFiles[0]?.sizeBytes || 0;
    return {
      estimatedDurationMs: Math.max(400, Math.round(size / 20000)),
      estimatedMemoryBytes: Math.round(size * 2),
      isHeavyOperation: false,
    };
  }

  async process(
    inputBuffers: Buffer[],
    options: ProtectPdfOptions,
    context: WorkerExecutionContext
  ): Promise<ProcessingResult> {
    const startTime = Date.now();
    const inputBuffer = inputBuffers[0];
    validatePdfSafety(inputBuffer);

    await context.onProgress(20, 'Loading document for encryption...');

    let pageCount = 1;
    try {
      const pdfDoc = await PDFDocument.load(inputBuffer, { ignoreEncryption: true });
      pageCount = pdfDoc.getPageCount();
    } catch {
      // Continue to encryption
    }

    await context.onProgress(50, 'Applying AES-256 military-grade password encryption...');

    const ownerPassword = options.ownerPassword || generateStrongPassword();

    let encryptedBytes: Uint8Array;
    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      encryptedBytes = await encryptPDF(new Uint8Array(inputBuffer), options.userPassword, {
        ownerPassword,
      });
    } catch (err: unknown) {
      throw new PlatformError('INTERNAL_SERVER_ERROR', {
        message: `Encryption failed: ${(err as Error).message}`,
      });
    }

    const outputBuffer = Buffer.from(encryptedBytes);
    validateOutputDocument(outputBuffer, 'pdf');
    await context.onProgress(100, 'Document encrypted & protected successfully.');

    return {
      outputFiles: [
        {
          filename: 'protected_document.pdf',
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
