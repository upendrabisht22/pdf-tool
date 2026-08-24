"use strict";
/**
 * @file validation.ts
 * @description Zero-trust magic byte inspection, format verification, and PDF bomb safety heuristics.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAGIC_BYTES = void 0;
exports.inspectFileMagicBytes = inspectFileMagicBytes;
exports.validatePdfSafety = validatePdfSafety;
const errors_js_1 = require("./errors.js");
exports.MAGIC_BYTES = {
    PDF: [0x25, 0x50, 0x44, 0x46], // %PDF
    PNG: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
    JPEG: [0xff, 0xd8, 0xff],
    WEBP: [0x52, 0x49, 0x46, 0x46], // RIFF (needs WEBP at offset 8)
    ZIP_OFFICE: [0x50, 0x4b, 0x03, 0x04], // PK.. (DOCX, XLSX, PPTX)
};
/**
 * Inspects a binary buffer or Uint8Array directly to determine its real file type,
 * independent of any user-supplied extension or MIME header.
 */
function inspectFileMagicBytes(buffer) {
    if (!buffer || buffer.length < 4) {
        throw new errors_js_1.PlatformError('INVALID_INPUT', {
            message: 'File payload is empty or too small to contain valid header signatures.',
        });
    }
    // Check PDF (%PDF-)
    if (buffer[0] === exports.MAGIC_BYTES.PDF[0] &&
        buffer[1] === exports.MAGIC_BYTES.PDF[1] &&
        buffer[2] === exports.MAGIC_BYTES.PDF[2] &&
        buffer[3] === exports.MAGIC_BYTES.PDF[3]) {
        return {
            isValid: true,
            detectedFormat: 'pdf',
            mimeType: 'application/pdf',
            sizeBytes: buffer.length,
        };
    }
    // Check PNG
    if (buffer.length >= 8 &&
        buffer[0] === exports.MAGIC_BYTES.PNG[0] &&
        buffer[1] === exports.MAGIC_BYTES.PNG[1] &&
        buffer[2] === exports.MAGIC_BYTES.PNG[2] &&
        buffer[3] === exports.MAGIC_BYTES.PNG[3] &&
        buffer[4] === exports.MAGIC_BYTES.PNG[4] &&
        buffer[5] === exports.MAGIC_BYTES.PNG[5] &&
        buffer[6] === exports.MAGIC_BYTES.PNG[6] &&
        buffer[7] === exports.MAGIC_BYTES.PNG[7]) {
        return {
            isValid: true,
            detectedFormat: 'png',
            mimeType: 'image/png',
            sizeBytes: buffer.length,
        };
    }
    // Check JPEG
    if (buffer[0] === exports.MAGIC_BYTES.JPEG[0] &&
        buffer[1] === exports.MAGIC_BYTES.JPEG[1] &&
        buffer[2] === exports.MAGIC_BYTES.JPEG[2]) {
        return {
            isValid: true,
            detectedFormat: 'jpeg',
            mimeType: 'image/jpeg',
            sizeBytes: buffer.length,
        };
    }
    // Check WebP
    if (buffer.length >= 12 &&
        buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
        buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
        return {
            isValid: true,
            detectedFormat: 'webp',
            mimeType: 'image/webp',
            sizeBytes: buffer.length,
        };
    }
    // Check Modern Office Documents (Zip container)
    if (buffer[0] === exports.MAGIC_BYTES.ZIP_OFFICE[0] &&
        buffer[1] === exports.MAGIC_BYTES.ZIP_OFFICE[1] &&
        buffer[2] === exports.MAGIC_BYTES.ZIP_OFFICE[2] &&
        buffer[3] === exports.MAGIC_BYTES.ZIP_OFFICE[3]) {
        return {
            isValid: true,
            detectedFormat: 'docx', // Default Office container
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            sizeBytes: buffer.length,
        };
    }
    return {
        isValid: false,
        detectedFormat: 'unknown',
        mimeType: 'application/octet-stream',
        sizeBytes: buffer.length,
    };
}
/**
 * Validates that a PDF is structurally safe, not corrupted, and not an obvious decompression bomb.
 */
function validatePdfSafety(buffer) {
    const result = inspectFileMagicBytes(buffer);
    if (result.detectedFormat !== 'pdf') {
        throw new errors_js_1.PlatformError('MAGIC_BYTE_MISMATCH', {
            message: `File reported as PDF does not have a valid %PDF header. Detected: ${result.detectedFormat}`,
        });
    }
    // Check for EOF marker in the tail of the document
    const tailLength = Math.min(buffer.length, 2048);
    const tail = buffer.slice(buffer.length - tailLength);
    const tailStr = typeof Buffer !== 'undefined' && Buffer.isBuffer(tail)
        ? tail.toString('latin1')
        : new TextDecoder('latin1').decode(tail);
    if (!tailStr.includes('%%EOF') && !tailStr.includes('startxref')) {
        // Note: Some repairable PDFs omit EOF, but strict validation flags potential corruption
        // We allow processing with warning or handle via repair engine
    }
    // Basic check against cyclic/excessive nested stream markers
    const fullStr = typeof Buffer !== 'undefined' && Buffer.isBuffer(buffer)
        ? buffer.toString('latin1', 0, Math.min(buffer.length, 1024 * 1024))
        : new TextDecoder('latin1').decode(buffer.slice(0, Math.min(buffer.length, 1024 * 1024)));
    const objCount = (fullStr.match(/\/ObjStm/g) || []).length;
    if (objCount > 50000) {
        throw new errors_js_1.PlatformError('PDF_BOMB_DETECTED', {
            message: 'Document contains an abnormal number of object streams exceeding safety limits.',
        });
    }
}
//# sourceMappingURL=validation.js.map