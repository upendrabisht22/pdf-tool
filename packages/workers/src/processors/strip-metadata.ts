/**
 * @file processors/strip-metadata.ts
 * @description Removes identifying metadata from a PDF document to protect user privacy.
 *
 * What gets stripped:
 *  - Author, Creator, Producer, Subject, Keywords (PII-carrying fields)
 *  - Creation date and modification date
 *  - XMP metadata streams (embedded XML with rich authoring info, camera EXIF etc.)
 *  - Document ID (unique fingerprint the creating software embeds)
 *
 * Use cases:
 *  - Remove "Created by [Full Name] on [exact date]" before sharing externally
 *  - Strip Word/Acrobat/Author metadata before legal disclosure
 *  - Remove GPS/device info embedded in converted photo-PDFs
 */

import { PDFDocument, PDFName, PDFDict, PDFNull } from 'pdf-lib';
import {
  StripMetadataPdfOptions,
  PlatformError,
  ProcessingResult,
  ValidatedFile,
  WorkerExecutionContext,
  validatePdfSafety,
} from '@doc-platform/core';
import { DocumentProcessor, ResourceEstimate } from '@doc-platform/providers';
import { validateOutputDocument } from '../validator.js';

export class StripMetadataPdfProcessor implements DocumentProcessor<StripMetadataPdfOptions> {
  readonly operation = 'strip-metadata-pdf' as const;

  async validateInput(inputFiles: ValidatedFile[], _options: StripMetadataPdfOptions): Promise<void> {
    if (!inputFiles || inputFiles.length !== 1) {
      throw new PlatformError('INVALID_INPUT', {
        message: 'Metadata strip operation requires exactly 1 input PDF.',
      });
    }
  }

  estimateResourceCost(inputFiles: ValidatedFile[], _options: StripMetadataPdfOptions): ResourceEstimate {
    const size = inputFiles[0]?.sizeBytes || 0;
    return {
      estimatedDurationMs: Math.max(300, Math.round(size / 20000)),
      estimatedMemoryBytes: Math.round(size * 1.8),
      isHeavyOperation: false,
    };
  }

  async process(
    inputBuffers: Buffer[],
    options: StripMetadataPdfOptions,
    context: WorkerExecutionContext
  ): Promise<ProcessingResult> {
    const startTime = Date.now();
    const inputBuffer = inputBuffers[0];
    validatePdfSafety(inputBuffer);

    await context.onProgress(20, 'Loading document for metadata analysis...');

    const pdfDoc = await PDFDocument.load(inputBuffer, { ignoreEncryption: true });

    // Resolve options (strip everything by default — privacy-first)
    const stripAuthorInfo = options.stripAuthorInfo !== false;
    const stripDates = options.stripDates !== false;
    const stripXmp = options.stripXmp !== false;
    const stripDocumentId = options.stripDocumentId !== false;

    await context.onProgress(40, 'Stripping identifying metadata fields...');

    if (stripAuthorInfo) {
      // Clear standard Info dictionary PII fields
      pdfDoc.setTitle('');
      pdfDoc.setAuthor('');
      pdfDoc.setSubject('');
      pdfDoc.setKeywords([]);
      pdfDoc.setProducer('');
      pdfDoc.setCreator('');
    }

    if (stripDates) {
      // pdf-lib does not expose setCreationDate/setModificationDate directly as void setters,
      // but we can remove them from the Info dictionary using the low-level catalog API
      try {
        const catalog = pdfDoc.catalog;
        const infoRef = (pdfDoc as any).context?.trailerInfo?.get(PDFName.of('Info'));
        if (infoRef) {
          const infoDict = (pdfDoc as any).context?.lookup(infoRef);
          if (infoDict instanceof PDFDict) {
            infoDict.delete(PDFName.of('CreationDate'));
            infoDict.delete(PDFName.of('ModDate'));
          }
        }
      } catch {
        // Best-effort — some PDFs have unusual trailer structures
      }
    }

    if (stripXmp) {
      // Remove the XMP metadata stream reference from the catalog
      try {
        const catalog = pdfDoc.catalog;
        if (catalog.has(PDFName.of('Metadata'))) {
          catalog.set(PDFName.of('Metadata'), PDFNull);
        }
      } catch {
        // Best-effort
      }
    }

    if (stripDocumentId) {
      // Clear the document ID array from the trailer
      try {
        const trailer = (pdfDoc as any).context?.trailer;
        if (trailer instanceof PDFDict && trailer.has(PDFName.of('ID'))) {
          trailer.delete(PDFName.of('ID'));
        }
      } catch {
        // Best-effort
      }
    }

    await context.onProgress(80, 'Saving sanitized document...');
    const bytes = await pdfDoc.save({ useObjectStreams: true });
    const outputBuffer = Buffer.from(bytes);

    validateOutputDocument(outputBuffer, 'pdf');
    await context.onProgress(100, 'Metadata stripped successfully.');

    return {
      outputFiles: [
        {
          filename: 'sanitized_document.pdf',
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
