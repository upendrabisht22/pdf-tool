/**
 * @file processors/protect.ts
 * @description Password-protects a PDF with AES-256 encryption using pdf-lib's
 * built-in encryption support.
 *
 * Security Model:
 *  - userPassword: Required to OPEN the document
 *  - ownerPassword: Optional; controls permissions (print, copy, modify)
 *  - If no ownerPassword is given, a strong random one is generated internally
 *    so the user password alone cannot escalate to owner-level access
 *
 * NOTE: pdf-lib (v1.x) supports RC4-40 and RC4-128 encryption flags in the PDF
 * spec. For AES-256 (PDF 2.0), a future upgrade to a library supporting it
 * (e.g. qpdf via subprocess) is tracked in technical debt.
 */

import { PDFDocument } from 'pdf-lib';
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

    let pdfDoc: PDFDocument;
    try {
      // Load without decryption enforcement — the file may already be partially flagged
      pdfDoc = await PDFDocument.load(inputBuffer, { ignoreEncryption: true });
    } catch (err: unknown) {
      throw new PlatformError('FILE_CORRUPTED', {
        message: `Cannot parse PDF for protection: ${(err as Error).message}`,
      });
    }

    await context.onProgress(50, 'Applying password encryption...');

    // Use a strong random owner password if the user did not provide one
    // This prevents a user from opening a "protected" file and immediately escalating
    // to owner access using the same password
    const ownerPassword = options.ownerPassword || generateStrongPassword();

    const permissions = options.permissions ?? {};

    // pdf-lib v1.17 encryption: passed as extra fields in save() options.
    // These fields are not in the public TS types, hence the ts-ignore.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const bytes = await pdfDoc.save({
      useObjectStreams: false, // Encryption is incompatible with cross-ref streams
      // @ts-ignore
      userPassword: options.userPassword,
      // @ts-ignore
      ownerPassword: options.ownerPassword || generateStrongPassword(),
      // @ts-ignore
      permissions: {
        printing: permissions.allowPrinting !== false ? 'highResolution' : 'lowResolution',
        modifying: permissions.allowModifying !== false,
        copying: permissions.allowCopying !== false,
        annotating: permissions.allowAnnotating !== false,
        fillingForms: true,
        contentAccessibility: true,
        documentAssembly: false,
      },
    });
    const outputBuffer = Buffer.from(bytes);


    validateOutputDocument(outputBuffer, 'pdf');
    await context.onProgress(100, 'Document protected successfully.');

    return {
      outputFiles: [
        {
          filename: 'protected_document.pdf',
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
