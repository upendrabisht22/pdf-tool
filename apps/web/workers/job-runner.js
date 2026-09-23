/**
 * @file workers/job-runner.js
 * @description Background worker loop and processor harness for DocPlatform.
 *
 * Consumes document processing jobs leased from the QueueProvider,
 * executes them within a SandboxedWorkerHarness, uploads outputs to the
 * StorageProvider, records usage metrics, and dispatches webhooks.
 */

import {
  MergePdfProcessor,
  SplitPdfProcessor,
  RotatePdfProcessor,
  CompressPdfProcessor,
  ImageToPdfProcessor,
  ReorderDeletePagesProcessor,
  ExtractPagesProcessor,
  WatermarkPdfProcessor,
  PageNumbersPdfProcessor,
  ProtectPdfProcessor,
  UnlockPdfProcessor,
  RepairPdfProcessor,
  StripMetadataPdfProcessor,
  OfficeToPdfProcessor,
  PdfToImageProcessor,
  SignPdfProcessor,
  FlattenPdfProcessor,
  PdfToWordProcessor,
  PdfToExcelProcessor,
  RedactPdfProcessor,
  OcrPdfProcessor,
  ComparePdfProcessor,
  AiSummarizeProcessor,
  AiAskProcessor,
  AiExtractTableProcessor,
  PipelineProcessor,
  PdfToMarkdownProcessor,
  MarkdownToPdfProcessor,
  GstInvoiceProcessor,
  PosBillingProcessor,
  TaxReceiptProcessor,
  EstimateMakerProcessor,
  CropPdfProcessor,
  EditPdfProcessor
} from '@doc-platform/workers';
import { insertUsageEvent } from '../api/usage-store.js';
import { dispatchWebhookEvent } from '../api/webhook-store.js';

/**
 * Creates and registers instances of all available operation processors.
 * @returns {Record<string, Object>} Map of operation slug to processor instance
 */
export function createProcessorRegistry() {
  return {
    // Phase 1 (Core PDF)
    'merge-pdf': new MergePdfProcessor(),
    'split-pdf': new SplitPdfProcessor(),
    'rotate-pdf': new RotatePdfProcessor(),
    'compress-pdf': new CompressPdfProcessor(),
    'image-to-pdf': new ImageToPdfProcessor(),
    'jpg-to-pdf': new ImageToPdfProcessor(),
    'extract-pages': new ExtractPagesProcessor(),
    'delete-pdf-pages': new ReorderDeletePagesProcessor(),
    'delete-pages': new ReorderDeletePagesProcessor(),
    'reorder-pdf': new ReorderDeletePagesProcessor(),
    // Sprint A (Page manipulation & security)
    'watermark-pdf': new WatermarkPdfProcessor(),
    'page-numbers-pdf': new PageNumbersPdfProcessor(),
    'protect-pdf': new ProtectPdfProcessor(),
    'unlock-pdf': new UnlockPdfProcessor(),
    'repair-pdf': new RepairPdfProcessor(),
    'strip-metadata-pdf': new StripMetadataPdfProcessor(),
    // Sprint C (Office to PDF)
    'word-to-pdf': new OfficeToPdfProcessor('word-to-pdf'),
    'excel-to-pdf': new OfficeToPdfProcessor('excel-to-pdf'),
    'powerpoint-to-pdf': new OfficeToPdfProcessor('powerpoint-to-pdf'),
    'ppt-to-pdf': new OfficeToPdfProcessor('powerpoint-to-pdf'),
    // Sprint D (Output Formats + Signatures)
    'pdf-to-image': new PdfToImageProcessor(),
    'pdf-to-jpg': new PdfToImageProcessor(),
    'sign-pdf': new SignPdfProcessor(),
    'flatten-pdf': new FlattenPdfProcessor(),
    // Sprint E (PDF to Office + Redaction)
    'pdf-to-word': new PdfToWordProcessor(),
    'pdf-to-excel': new PdfToExcelProcessor(),
    'redact-pdf': new RedactPdfProcessor(),
    // Sprint F (OCR + PDF Compare)
    'ocr-pdf': new OcrPdfProcessor(),
    'compare-pdf': new ComparePdfProcessor(),
    // Sprint G (AI Document Intelligence & Pipeline)
    'ai-summarize': new AiSummarizeProcessor(),
    'ai-ask': new AiAskProcessor(),
    'ai-extract-table': new AiExtractTableProcessor(),
    'pipeline': new PipelineProcessor(),
    'pdf-to-markdown': new PdfToMarkdownProcessor(),
    'markdown-to-pdf': new MarkdownToPdfProcessor(),
    'gst-invoice-pdf': new GstInvoiceProcessor(),
    'pos-billing': new PosBillingProcessor(),
    'clean-billing': new PosBillingProcessor(),
    'tax-receipt': new TaxReceiptProcessor(),
    'estimate-maker': new EstimateMakerProcessor(),
    'crop-pdf': new CropPdfProcessor(),
    'edit-pdf': new EditPdfProcessor(),
    'pdf-editor': new EditPdfProcessor(),
  };
}

/**
 * Starts the continuous background worker loop consuming leased jobs.
 * @param {Object} options
 * @param {Object} options.queueProvider - Job queue interface
 * @param {Object} options.storageProvider - Storage interface
 * @param {Object} options.sandbox - Sandboxed execution harness
 * @param {string} [options.workerId='worker_main_01'] - Identifier for this worker instance
 */
export async function startWorkerLoop({ queueProvider, storageProvider, sandbox, workerId = 'worker_main_01' }) {
  const processors = createProcessorRegistry();

  while (true) {
    try {
      const lease = await queueProvider.leaseJob(workerId, 60000);
      if (lease) {
        const { job, leaseToken } = lease;
        const processor = processors[job.operation];

        if (processor) {
          await sandbox.runIsolated(job.id, workerId, async (ctx) => {
            // Load input buffers
            const inputBuffers = [];
            for (const file of job.inputFiles) {
              const buf = await storageProvider.getObject(file.storageKey);
              inputBuffers.push(buf);
            }

            ctx.onProgress = async (percent, msg) => {
              await queueProvider.updateJobProgress(job.id, leaseToken, percent);
            };

            const result = await processor.process(inputBuffers, job.options, ctx);

            // Store outputs
            const outputFileIds = [];
            for (const out of result.outputFiles) {
              if (out.buffer) {
                const outKey = `outputs/${job.id}/${out.filename}`;
                await storageProvider.putObject(outKey, out.buffer, {
                  contentType: out.mimeType,
                });
                outputFileIds.push(outKey);
              }
            }

            await queueProvider.ackJob(job.id, leaseToken, outputFileIds);

            // Record usage event + dispatch webhook on job completion
            const ownerId = job.userId || job.sessionId || 'anonymous';
            insertUsageEvent({
              ownerId,
              apiKeyId: null,
              operation: job.operation,
              statusCode: 200,
              inputBytes: result.metrics.inputSizeBytes,
              outputBytes: result.metrics.outputSizeBytes,
              durationMs: result.metrics.durationMs,
              jobId: job.id,
            });

            // Dispatch webhook event (non-blocking, fire-and-forget)
            dispatchWebhookEvent({
              ownerId,
              event: 'job.completed',
              data: {
                jobId: job.id,
                operation: job.operation,
                outputFileCount: outputFileIds.length,
                metrics: result.metrics,
              },
            }).catch(() => {});
          });
        }
      }
    } catch (err) {
      console.error('Background worker error:', err);
    }
    await new Promise((r) => setTimeout(r, 500));
  }
}
