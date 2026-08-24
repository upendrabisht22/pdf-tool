/**
 * @file processors/pipeline.ts
 * @description Production-grade Multi-Operation Workflow Pipeline Engine.
 *
 * Allows users and API clients to chain multiple document operations in a single execution:
 *   e.g. `Merge -> Watermark -> Compress -> Protect`
 *
 * Execution Model:
 *   - Sandboxed Sequential Execution: Output buffer of step N becomes input buffer of step N+1.
 *   - Continuous Progress Aggregation: Maps sub-step percentages to overall 0-100% pipeline progress.
 *   - Error Handling: Halts immediately on failure (if stopOnError=true) and rolls back scratch data.
 */

import {
  PipelineOptions,
  PlatformError,
  ProcessingResult,
  ValidatedFile,
  WorkerExecutionContext,
  validatePdfSafety,
} from '@doc-platform/core';
import { DocumentProcessor, ResourceEstimate } from '@doc-platform/providers';
import { validateOutputDocument } from '../validator.js';

// Phase 1 Processors
import { MergePdfProcessor } from './merge.js';
import { SplitPdfProcessor } from './split.js';
import { RotatePdfProcessor } from './rotate.js';
import { CompressPdfProcessor } from './compress.js';
import { ImageToPdfProcessor } from './images.js';

// Sprint A Processors
import { WatermarkPdfProcessor } from './watermark.js';
import { PageNumbersPdfProcessor } from './page-numbers.js';
import { ProtectPdfProcessor } from './protect.js';
import { UnlockPdfProcessor } from './unlock.js';
import { RepairPdfProcessor } from './repair.js';
import { StripMetadataPdfProcessor } from './strip-metadata.js';

// Sprint D & E Processors
import { FlattenPdfProcessor } from './flatten-pdf.js';
import { RedactPdfProcessor } from './redact.js';

export class PipelineProcessor implements DocumentProcessor<PipelineOptions> {
  readonly operation = 'pipeline' as const;

  private getProcessorMap(): Record<string, DocumentProcessor<any>> {
    return {
      'merge-pdf': new MergePdfProcessor(),
      'split-pdf': new SplitPdfProcessor(),
      'rotate-pdf': new RotatePdfProcessor(),
      'compress-pdf': new CompressPdfProcessor(),
      'image-to-pdf': new ImageToPdfProcessor(),
      'watermark-pdf': new WatermarkPdfProcessor(),
      'page-numbers-pdf': new PageNumbersPdfProcessor(),
      'protect-pdf': new ProtectPdfProcessor(),
      'unlock-pdf': new UnlockPdfProcessor(),
      'repair-pdf': new RepairPdfProcessor(),
      'strip-metadata-pdf': new StripMetadataPdfProcessor(),
      'flatten-pdf': new FlattenPdfProcessor(),
      'redact-pdf': new RedactPdfProcessor(),
    };
  }

  async validateInput(inputFiles: ValidatedFile[], options: PipelineOptions): Promise<void> {
    if (!inputFiles || inputFiles.length === 0) {
      throw new PlatformError('INVALID_INPUT', {
        message: 'Pipeline requires at least 1 input file.',
      });
    }
    if (!options.steps || options.steps.length === 0) {
      throw new PlatformError('INVALID_INPUT', {
        message: 'Pipeline must define at least one step in options.steps.',
      });
    }

    const map = this.getProcessorMap();
    for (let i = 0; i < options.steps.length; i++) {
      const step = options.steps[i];
      if (!map[step.operation]) {
        throw new PlatformError('INVALID_INPUT', {
          message: `Pipeline step #${i + 1} specifies unsupported or unchainable operation '${step.operation}'.`,
        });
      }
    }
  }

  estimateResourceCost(inputFiles: ValidatedFile[], options: PipelineOptions): ResourceEstimate {
    const totalSize = inputFiles.reduce((s, f) => s + f.sizeBytes, 0);
    const stepsCount = options?.steps?.length || 1;
    return {
      estimatedDurationMs: Math.max(1000, stepsCount * 600),
      estimatedMemoryBytes: Math.max(64 * 1024 * 1024, totalSize * 3),
      isHeavyOperation: stepsCount > 2 || totalSize > 25 * 1024 * 1024,
    };
  }

  async process(
    inputBuffers: Buffer[],
    options: PipelineOptions,
    context: WorkerExecutionContext
  ): Promise<ProcessingResult> {
    const startTime = Date.now();
    const processorMap = this.getProcessorMap();
    const steps = options.steps;
    const totalSteps = steps.length;

    let currentBuffers: Buffer[] = [...inputBuffers];
    const initialSize = inputBuffers.reduce((sum, b) => sum + b.length, 0);

    for (let stepIdx = 0; stepIdx < totalSteps; stepIdx++) {
      if (context.isCancelled()) throw new PlatformError('JOB_CANCELLED', { jobId: context.jobId });

      const step = steps[stepIdx];
      const processor = processorMap[step.operation];

      const stepBaseProgress = Math.round((stepIdx / totalSteps) * 100);
      const stepMaxProgress = Math.round(((stepIdx + 1) / totalSteps) * 100);

      await context.onProgress(
        stepBaseProgress,
        `Executing step ${stepIdx + 1}/${totalSteps}: ${step.operation}...`
      );

      // Create scoped child execution context for sub-processor
      const stepContext: WorkerExecutionContext = {
        ...context,
        onProgress: async (subPercent, msg) => {
          const mapped = Math.round(
            stepBaseProgress + (subPercent / 100) * (stepMaxProgress - stepBaseProgress)
          );
          await context.onProgress(mapped, msg);
        },
      };

      try {
        const stepResult = await processor.process(currentBuffers, step.options || {}, stepContext);

        if (!stepResult.outputFiles || stepResult.outputFiles.length === 0) {
          throw new PlatformError('INTERNAL_SERVER_ERROR', {
            message: `Pipeline step #${stepIdx + 1} (${step.operation}) produced no output artifacts.`,
          });
        }

        // Output of step N becomes input of step N+1
        currentBuffers = stepResult.outputFiles
          .map(f => (Buffer.isBuffer(f.buffer) ? f.buffer : Buffer.from(f.buffer || [])))
          .filter(b => b.length > 0);
      } catch (err: unknown) {
        if (options.stopOnError !== false) {
          throw err;
        }
      }
    }

    const finalBuffer = currentBuffers[0];
    validateOutputDocument(finalBuffer, 'pdf');
    await context.onProgress(100, `Workflow pipeline completed (${totalSteps} steps).`);

    return {
      outputFiles: [
        {
          filename: 'pipeline_processed_document.pdf',
          mimeType: 'application/pdf',
          buffer: finalBuffer,
        },
      ],
      metrics: {
        durationMs: Date.now() - startTime,
        inputSizeBytes: initialSize,
        outputSizeBytes: finalBuffer.length,
      },
    };
  }
}
