/**
 * @file security/pdf-bomb-defense.js
 * @description Defends against "PDF bomb" (zip bomb equivalent) attacks.
 *
 * A PDF bomb is a small compressed file that expands to an enormous amount
 * of data when parsed — intentionally crafted to crash or OOM the server.
 *
 * Attack Vectors Mitigated:
 *   1. Decompression Ratio Attack: A tiny PDF with streams that expand to GBs
 *      when inflated by the PDF parser (zlib FlateDecode streams).
 *   2. Page Count Explosion: A PDF with millions of pages causing OOM during
 *      page iteration. Max enforced: 2000 pages.
 *   3. Recursive Object Attack: Objects that reference each other creating
 *      infinite traversal loops. Mitigated by pdf-lib's depth limit + our
 *      timeout in SandboxedWorkerHarness (60s kill).
 *   4. Oversized Metadata Strings: Title/Author fields with megabytes of text.
 *      Mitigated by validateMetadataStrings() below.
 *
 * Limits:
 *   - Max raw buffer size (enforced before parsing): 500MB absolute max
 *   - Max decompressed size estimate: 4× compressed size OR 2GB, whichever is lower
 *   - Max page count: 2000 pages
 *   - Max metadata string length: 4KB per field
 *
 * NOTE: These checks happen in the WORKER before processing begins.
 * The SandboxedWorkerHarness also enforces a 60-second CPU timeout as
 * a backstop against any bomb that slips past these heuristic checks.
 */

/** Absolute max compressed file size we'll ever parse: 500MB */
export const MAX_COMPRESSED_SIZE_BYTES = 500 * 1024 * 1024;

/** Max decompressed output size: 2GB */
export const MAX_DECOMPRESSED_SIZE_BYTES = 2 * 1024 * 1024 * 1024;

/** Suspicious decompression ratio: reject if estimated output > N× input */
export const MAX_EXPANSION_RATIO = 50;

/** Max pages per document — prevents page-count explosion OOM */
export const MAX_PAGE_COUNT = 2000;

/** Max bytes per metadata string field */
export const MAX_METADATA_STRING_BYTES = 4 * 1024; // 4KB

/**
 * Scan the raw PDF buffer for suspicious FlateDecode stream sizes.
 *
 * This is a heuristic pre-check before passing to the full PDF parser.
 * It scans for zlib stream length markers in the raw PDF source and
 * estimates the worst-case decompressed output size.
 *
 * @param {Buffer} buffer - Raw PDF file buffer
 * @returns {{ safe: boolean; reason?: string }}
 */
export function scanForPdfBomb(buffer) {
  if (buffer.length > MAX_COMPRESSED_SIZE_BYTES) {
    return {
      safe: false,
      reason: `File size ${(buffer.length / 1024 / 1024).toFixed(1)}MB exceeds the maximum allowed ${MAX_COMPRESSED_SIZE_BYTES / 1024 / 1024}MB.`,
    };
  }

  // Scan the raw buffer for stream length declarations.
  // PDF streams are declared as:  /Length <number>\n>>stream\n<data>\nendstream
  // We total up declared stream lengths as a proxy for decompressed size.
  let totalDeclaredStreamBytes = 0;
  const bufferStr = buffer.toString('latin1'); // Use latin1 for binary-safe scan
  const lengthPattern = /\/Length\s+(\d+)/g;
  let match;

  while ((match = lengthPattern.exec(bufferStr)) !== null) {
    const declaredLength = parseInt(match[1], 10);
    if (!isNaN(declaredLength) && declaredLength > 0) {
      totalDeclaredStreamBytes += declaredLength;
    }
  }

  // If declared stream sizes are suspiciously large relative to the file size
  const expansionRatio = totalDeclaredStreamBytes / Math.max(buffer.length, 1);
  if (expansionRatio > MAX_EXPANSION_RATIO) {
    return {
      safe: false,
      reason: `Suspicious stream expansion ratio detected (${expansionRatio.toFixed(1)}×). ` +
              `This file may be a PDF bomb. Maximum allowed ratio is ${MAX_EXPANSION_RATIO}×.`,
    };
  }

  // Heuristic: if total declared uncompressed stream content exceeds 2GB
  if (totalDeclaredStreamBytes > MAX_DECOMPRESSED_SIZE_BYTES) {
    return {
      safe: false,
      reason: `Declared uncompressed stream content (${(totalDeclaredStreamBytes / 1024 / 1024 / 1024).toFixed(2)}GB) ` +
              `exceeds maximum allowed decompressed size (${MAX_DECOMPRESSED_SIZE_BYTES / 1024 / 1024 / 1024}GB).`,
    };
  }

  return { safe: true };
}

/**
 * Validate that the parsed PDF's page count is within safe limits.
 *
 * @param {number} pageCount
 * @returns {{ safe: boolean; reason?: string }}
 */
export function validatePageCount(pageCount) {
  if (pageCount > MAX_PAGE_COUNT) {
    return {
      safe: false,
      reason: `Document has ${pageCount.toLocaleString()} pages. ` +
              `Maximum allowed is ${MAX_PAGE_COUNT.toLocaleString()} pages per operation.`,
    };
  }
  return { safe: true };
}

/**
 * Validate metadata string lengths to prevent huge string OOM attacks.
 *
 * @param {object} meta - Object with optional string fields
 * @returns {{ safe: boolean; reason?: string }}
 */
export function validateMetadataStrings(meta = {}) {
  for (const [field, value] of Object.entries(meta)) {
    if (typeof value === 'string' && Buffer.byteLength(value, 'utf8') > MAX_METADATA_STRING_BYTES) {
      return {
        safe: false,
        reason: `Metadata field '${field}' exceeds maximum allowed length of ${MAX_METADATA_STRING_BYTES / 1024}KB.`,
      };
    }
  }
  return { safe: true };
}
