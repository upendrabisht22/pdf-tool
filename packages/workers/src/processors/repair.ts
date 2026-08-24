/**
 * @file processors/repair.ts
 * @description Attempts to repair and recover corrupted or malformed PDF documents
 * by using pdf-lib's lenient parsing mode, then re-serializing a clean copy.
 *
 * Recovery Strategy:
 *  1. Load with all fault-tolerance flags enabled (ignoreEncryption, throwOnInvalidObject: false)
 *  2. Walk all pages and attempt to read their content streams (forces lazy-loaded objects to decode)
 *  3. Re-embed any successfully parsed content into a fresh PDFDocument
 *  4. Save a structurally clean, valid PDF
 *
 * Limitations (tracked in tech debt):
 *  - pdf-lib cannot recover completely shredded binary objects — those require qpdf/Ghostscript
 *  - Heavily linearized files with cross-ref stream damage may still fail
 *  - The aggressive recovery option strips all optional extensions to maximize compat
 */

import { PDFDocument, PDFName, PDFDict, PDFNull } from 'pdf-lib';
import {
  RepairPdfOptions,
  PlatformError,
  ProcessingResult,
  ValidatedFile,
  WorkerExecutionContext,
  validatePdfSafety,
} from '@doc-platform/core';
import { DocumentProcessor, ResourceEstimate } from '@doc-platform/providers';
import { validateOutputDocument } from '../validator.js';

export class RepairPdfProcessor implements DocumentProcessor<RepairPdfOptions> {
  readonly operation = 'repair-pdf' as const;

  async validateInput(inputFiles: ValidatedFile[], _options: RepairPdfOptions): Promise<void> {
    if (!inputFiles || inputFiles.length !== 1) {
      throw new PlatformError('INVALID_INPUT', {
        message: 'Repair operation requires exactly 1 input PDF.',
      });
    }
    // Note: We do NOT call validatePdfSafety() here with strict mode since
    // the file is expected to be malformed — we want to accept it and try recovery.
  }

  estimateResourceCost(inputFiles: ValidatedFile[], _options: RepairPdfOptions): ResourceEstimate {
    const size = inputFiles[0]?.sizeBytes || 0;
    return {
      estimatedDurationMs: Math.max(600, Math.round(size / 8000)),
      estimatedMemoryBytes: Math.round(size * 4), // Recovery needs extra scratch space
      isHeavyOperation: true,
    };
  }

  async process(
    inputBuffers: Buffer[],
    options: RepairPdfOptions,
    context: WorkerExecutionContext
  ): Promise<ProcessingResult> {
    const startTime = Date.now();
    const inputBuffer = inputBuffers[0];

    // Basic safety check — still need to ensure it's not a malicious non-PDF
    if (!inputBuffer.slice(0, 5).toString('ascii').startsWith('%PDF-')) {
      throw new PlatformError('INVALID_INPUT', {
        message: 'File does not appear to be a PDF (missing %PDF- header).',
      });
    }

    await context.onProgress(10, 'Attempting PDF recovery with lenient parser...');

    const aggressiveRecovery = options.aggressiveRecovery !== false;

    let sourcePdf: PDFDocument;
    try {
      sourcePdf = await PDFDocument.load(inputBuffer, {
        ignoreEncryption: true,
        // @ts-ignore — undocumented tolerance flag in pdf-lib
        throwOnInvalidObject: false,
        // @ts-ignore
        updateMetadata: false,
        // @ts-ignore — 1500 = maximum thorough parse (slow but most fault-tolerant)
        parseSpeed: 1500,
      });
    } catch (err: unknown) {
      throw new PlatformError('FILE_CORRUPTED', {
        message: `Could not recover this PDF. The file may be too severely damaged: ${(err as Error).message}`,
        userAction:
          'Try re-downloading or re-exporting the original document. If it came from a failed transfer, the source file may need to be re-shared.',
      });
    }

    await context.onProgress(40, 'Copying pages into clean PDF structure...');

    // Create a fresh, structurally valid PDF and copy pages from the recovered source
    const repairedPdf = await PDFDocument.create();

    const pageCount = sourcePdf.getPageCount();
    for (let i = 0; i < pageCount; i++) {
      if (context.isCancelled()) {
        throw new PlatformError('JOB_CANCELLED', { jobId: context.jobId });
      }
      try {
        const [copiedPage] = await repairedPdf.copyPages(sourcePdf, [i]);
        repairedPdf.addPage(copiedPage);
      } catch {
        // Skip unrecoverable pages, continue with rest
        context.log?.('warn', `Skipped unrecoverable page ${i + 1} of ${pageCount}`);
      }

      const progress = Math.round(40 + ((i + 1) / pageCount) * 40);
      await context.onProgress(progress);
    }

    if (repairedPdf.getPageCount() === 0) {
      throw new PlatformError('FILE_CORRUPTED', {
        message: 'No pages could be recovered from this PDF.',
        userAction: 'The document appears to be unrecoverable. Please obtain the file from its original source.',
      });
    }

    if (aggressiveRecovery) {
          // Strip optional extensions that may cause viewer compatibility issues
      try {
        const repairCatalog = repairedPdf.catalog;
        if (repairCatalog.has(PDFName.of('Extensions'))) {
          repairCatalog.delete(PDFName.of('Extensions'));
        }
        if (repairCatalog.has(PDFName.of('Metadata'))) {
          repairCatalog.set(PDFName.of('Metadata'), PDFNull);
        }
      } catch {
        // Best-effort
      }
    }

    await context.onProgress(90, 'Saving repaired document...');
    const bytes = await repairedPdf.save({ useObjectStreams: true });
    const outputBuffer = Buffer.from(bytes);

    validateOutputDocument(outputBuffer, 'pdf');
    await context.onProgress(100, `Recovered ${repairedPdf.getPageCount()} page(s) successfully.`);

    return {
      outputFiles: [
        {
          filename: 'repaired_document.pdf',
          mimeType: 'application/pdf',
          buffer: outputBuffer,
          pageCount: repairedPdf.getPageCount(),
        },
      ],
      metrics: {
        durationMs: Date.now() - startTime,
        inputSizeBytes: inputBuffer.length,
        outputSizeBytes: outputBuffer.length,
        pagesRecovered: repairedPdf.getPageCount(),
        totalPageCount: pageCount,
      },
    };
  }
}
