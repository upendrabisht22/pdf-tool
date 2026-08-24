/**
 * @file processor/index.ts
 * @description Pure abstract Document Processor contract.
 */
import { OperationType, ProcessingResult, ValidatedFile, WorkerExecutionContext } from '@doc-platform/core';
export interface ResourceEstimate {
    estimatedDurationMs: number;
    estimatedMemoryBytes: number;
    isHeavyOperation: boolean;
}
export interface DocumentProcessor<TOptions = Record<string, unknown>> {
    readonly operation: OperationType;
    /**
     * Fast pre-execution check on input files and options.
     */
    validateInput(inputFiles: ValidatedFile[], options: TOptions): Promise<void>;
    /**
     * Estimates computational budget required before scheduling on a worker.
     */
    estimateResourceCost(inputFiles: ValidatedFile[], options: TOptions): ResourceEstimate;
    /**
     * Executes the document transformation in a sandboxed context.
     */
    process(inputBuffers: Buffer[], options: TOptions, context: WorkerExecutionContext): Promise<ProcessingResult>;
}
//# sourceMappingURL=index.d.ts.map