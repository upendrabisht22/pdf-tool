/**
 * @file validation.ts
 * @description Zero-trust magic byte inspection, format verification, and PDF bomb safety heuristics.
 */
export interface FileValidationResult {
    isValid: boolean;
    detectedFormat: 'pdf' | 'png' | 'jpeg' | 'webp' | 'docx' | 'xlsx' | 'pptx' | 'unknown';
    mimeType: string;
    sizeBytes: number;
}
export declare const MAGIC_BYTES: {
    readonly PDF: readonly [37, 80, 68, 70];
    readonly PNG: readonly [137, 80, 78, 71, 13, 10, 26, 10];
    readonly JPEG: readonly [255, 216, 255];
    readonly WEBP: readonly [82, 73, 70, 70];
    readonly ZIP_OFFICE: readonly [80, 75, 3, 4];
};
/**
 * Inspects a binary buffer or Uint8Array directly to determine its real file type,
 * independent of any user-supplied extension or MIME header.
 */
export declare function inspectFileMagicBytes(buffer: Uint8Array | Buffer): FileValidationResult;
/**
 * Validates that a PDF is structurally safe, not corrupted, and not an obvious decompression bomb.
 */
export declare function validatePdfSafety(buffer: Uint8Array | Buffer): void;
//# sourceMappingURL=validation.d.ts.map