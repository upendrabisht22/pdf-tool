/**
 * DocPlatform Client Utilities Module
 * Shared helper functions for parsing, formatting, binary conversion, and file type detection.
 */

/**
 * Escapes HTML entities to prevent XSS.
 * @param {string} str
 * @returns {string}
 */
export function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Renders simple markdown into safe HTML for AI preview boxes.
 * Supports headings (#, ##, ###), lists (- or *), numbered lists, and bold/italic.
 * @param {string} md
 * @returns {string}
 */
export function renderSimpleMarkdown(md) {
  if (!md) return '';
  const lines = md.split('\n');
  const out = [];
  let inList = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('### ')) {
      if (inList) { out.push('</ul>'); inList = false; }
      out.push(`<h3>${escapeHtml(trimmed.slice(4))}</h3>`);
    } else if (trimmed.startsWith('## ')) {
      if (inList) { out.push('</ul>'); inList = false; }
      out.push(`<h2>${escapeHtml(trimmed.slice(3))}</h2>`);
    } else if (trimmed.startsWith('# ')) {
      if (inList) { out.push('</ul>'); inList = false; }
      out.push(`<h1>${escapeHtml(trimmed.slice(2))}</h1>`);
    } else if (trimmed === '---') {
      if (inList) { out.push('</ul>'); inList = false; }
      out.push('<hr>');
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      if (!inList) { out.push('<ul>'); inList = true; }
      const itemText = escapeHtml(trimmed.slice(2))
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>');
      out.push(`<li>${itemText}</li>`);
    } else if (/^\d+\.\s/.test(trimmed)) {
      if (inList) { out.push('</ul>'); inList = false; }
      const itemText = escapeHtml(trimmed.replace(/^\d+\.\s*/, ''))
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>');
      out.push(`<div>${itemText}</div>`);
    } else if (trimmed.length > 0) {
      if (inList) { out.push('</ul>'); inList = false; }
      const paraText = escapeHtml(trimmed)
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>');
      out.push(`<p>${paraText}</p>`);
    }
  }

  if (inList) out.push('</ul>');
  return out.join('\n');
}

/**
 * Converts an ArrayBuffer to a Base64 encoded string efficiently using chunks.
 * @param {ArrayBuffer} buffer
 * @returns {string}
 */
export function arrayBufferToBase64(buffer) {
  if (!buffer) return '';
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const len = bytes.byteLength;
  const chunkSize = 8192;
  for (let i = 0; i < len; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
    binary += String.fromCharCode.apply(null, chunk);
  }
  return btoa(binary);
}

/**
 * Parses user input page ranges like "1-3, 5, 7-9" into an ordered integer array.
 * @param {string} rangeStr
 * @param {number} totalPages
 * @returns {number[]}
 */
export function parsePageRanges(rangeStr, totalPages) {
  const pages = new Set();
  const parts = (rangeStr || '').split(/[,;\s]+/).filter(Boolean);
  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-');
      const start = Math.max(1, parseInt(startStr, 10) || 1);
      const end = Math.min(totalPages, parseInt(endStr, 10) || totalPages);
      for (let p = start; p <= end; p++) pages.add(p);
    } else {
      const p = parseInt(part, 10);
      if (p >= 1 && p <= totalPages) pages.add(p);
    }
  }
  return Array.from(pages).sort((a, b) => a - b);
}

/**
 * Inspects leading magic bytes to identify true file type with MIME fallback.
 * @param {File} file
 * @param {Uint8Array} bytes
 * @returns {'pdf'|'png'|'jpeg'|'webp'|'docx'|'office-legacy'|'markdown'|'unknown'}
 */
export function detectFileType(file, bytes) {
  if (!bytes || bytes.length < 4) return 'unknown';

  // 1. PDF Signature: %PDF
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
    return 'pdf';
  }

  // 2. PNG Signature: \x89PNG
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return 'png';
  }
  if (bytes[0] === 0x89 && bytes[1] === 0x50) {
    return 'png';
  }

  // 3. JPEG Signature: \xFF\xD8
  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    return 'jpeg';
  }

  // 4. WebP Signature: RIFF....WEBP
  if (bytes.length >= 12 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
      bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
    return 'webp';
  }
  if (bytes.length >= 4 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
    return 'webp';
  }

  // 5. OpenXML Office (DOCX, XLSX, PPTX): PK\x03\x04
  if (bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04) {
    return 'docx';
  }

  // 6. Legacy Office OLE2: \xD0\xCF\x11\xE0
  if (bytes[0] === 0xd0 && bytes[1] === 0xcf && bytes[2] === 0x11 && bytes[3] === 0xe0) {
    return 'office-legacy';
  }

  // 7. Fallback to MIME and extension
  const ext = (file.name || '').split('.').pop().toLowerCase();
  if (['png', 'jpg', 'jpeg', 'webp', 'bmp', 'gif', 'svg'].includes(ext) || (file.type && file.type.startsWith('image/'))) {
    return ext === 'png' ? 'png' : (ext === 'webp' ? 'webp' : 'jpeg');
  }
  if (ext === 'pdf' || file.type === 'application/pdf') {
    return 'pdf';
  }
  if (['docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt', 'rtf', 'odt'].includes(ext)) {
    return 'docx';
  }
  if (['md', 'markdown', 'txt'].includes(ext) || file.type === 'text/markdown' || file.type === 'text/plain') {
    return 'markdown';
  }

  return 'unknown';
}

/**
 * Strips extension from filename.
 * @param {string} filename
 * @returns {string}
 */
export function getBaseName(filename) {
  if (!filename) return 'document';
  return filename.replace(/\.[^/.]+$/, '');
}

/**
 * Generates clean output filename derived from staged files.
 * @param {Array} stagedFiles
 * @param {string} actionSuffix
 * @param {string} ext
 * @returns {string}
 */
export function getDerivedOutputFilename(stagedFiles, actionSuffix = 'processed', ext = 'pdf') {
  if (!stagedFiles || stagedFiles.length === 0) return `document_${actionSuffix}.${ext}`;
  const base = getBaseName(stagedFiles[0].name);
  return `${base}_${actionSuffix}.${ext}`;
}

// CommonJS compatibility export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    escapeHtml,
    renderSimpleMarkdown,
    arrayBufferToBase64,
    parsePageRanges,
    detectFileType,
    getBaseName,
    getDerivedOutputFilename
  };
}
