/**
 * @file processors/pdf-to-office.ts
 * @description Production-grade PDF to Office document reconstruction engine.
 *
 * PDF→Word Architecture (3-Tier Priority Cascade):
 *   Tier 1 (Best):  Python pdf2docx engine  → Exact fonts, native tables, barcodes as images
 *   Tier 2 (Good):  LibreOffice soffice      → Headless conversion + layout optimization
 *   Tier 3 (Basic): JS OpenXML builder       → Pure text extraction fallback
 *
 * PDF→Excel Architecture:
 *   - LibreOffice headless or JS OpenXML fallback.
 *
 * The Word→PDF direction (office-to-pdf.ts) is a completely separate file and is NOT affected.
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { PDFDocument } from 'pdf-lib';
import {
  PdfToWordOptions,
  PdfToExcelOptions,
  PlatformError,
  ProcessingResult,
  ValidatedFile,
  WorkerExecutionContext,
  validatePdfSafety,
} from '@doc-platform/core';
import { DocumentProcessor, ResourceEstimate } from '@doc-platform/providers';

/**
 * Run soffice via callback-based execFile — resolves even when stderr has content.
 */
function runSoffice(
  bin: string,
  args: string[],
  opts: { cwd?: string; timeout?: number; maxBuffer?: number }
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    execFile(bin, args, opts, (err, stdout, stderr) => {
      if (err && (err as any).code === 'ENOENT') {
        reject(new Error(`Binary not found: ${bin}`));
      } else if (err && (err as any).killed) {
        reject(new Error(`LibreOffice timed out after ${opts.timeout}ms`));
      } else {
        resolve({ stdout: stdout || '', stderr: stderr || '' });
      }
    });
  });
}

// Candidate paths for LibreOffice binary (Windows absolute paths first)
const LIBREOFFICE_PATHS = [
  'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
  'C:\\Program Files\\LibreOffice\\program\\soffice.com',
  'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe',
  'soffice',
  'libreoffice',
  '/usr/bin/soffice',
  '/usr/bin/libreoffice',
  '/usr/local/bin/soffice',
];

async function getSoffice(): Promise<string | null> {
  for (const candidate of LIBREOFFICE_PATHS) {
    try {
      if (path.isAbsolute(candidate)) {
        await fs.access(candidate);
        return candidate;
      } else {
        await runSoffice(candidate, ['--version'], { timeout: 3000 });
        return candidate;
      }
    } catch {
      // Continue search
    }
  }
  return null;
}

/**
 * Extract all text from a PDF buffer using unpdf (PDF.js engine).
 * Returns array of strings, one per page.
 */
async function extractPdfTextByPage(inputBuffer: Buffer): Promise<string[]> {
  try {
    const { getDocumentProxy } = await import('unpdf');
    const proxy = await getDocumentProxy(new Uint8Array(inputBuffer));
    const pages: string[] = [];
    const numPages = proxy.numPages;

    for (let i = 1; i <= numPages; i++) {
      try {
        const page = await proxy.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = (textContent.items as Array<{ str?: string }>)
          .map(item => item.str || '')
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();
        pages.push(pageText);
      } catch {
        pages.push('');
      }
    }
    return pages;
  } catch {
    return [];
  }
}

/** Escape special XML characters in text content */
function xmlEscape(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ============================================================================
// CRC32 for ZIP
// ============================================================================
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * Minimal OpenXML ZIP container builder for pure in-memory DOCX / XLSX output.
 */
function createOpenXmlZip(files: Record<string, string | Buffer>): Buffer {
  const entries: Buffer[] = [];
  const cdEntries: Buffer[] = [];
  let offset = 0;

  for (const [filename, content] of Object.entries(files)) {
    const nameBuf = Buffer.from(filename, 'utf8');
    const dataBuf = Buffer.isBuffer(content) ? content : Buffer.from(content, 'utf8');

    const lfh = Buffer.alloc(30);
    lfh.writeUInt32LE(0x04034b50, 0);
    lfh.writeUInt16LE(20, 4);
    lfh.writeUInt16LE(0, 6);
    lfh.writeUInt16LE(0, 8);
    lfh.writeUInt16LE(0, 10);
    lfh.writeUInt16LE(0, 12);
    lfh.writeUInt32LE(crc32(dataBuf), 14);
    lfh.writeUInt32LE(dataBuf.length, 18);
    lfh.writeUInt32LE(dataBuf.length, 22);
    lfh.writeUInt16LE(nameBuf.length, 26);
    lfh.writeUInt16LE(0, 28);

    entries.push(lfh, nameBuf, dataBuf);

    const cdh = Buffer.alloc(46);
    cdh.writeUInt32LE(0x02014b50, 0);
    cdh.writeUInt16LE(20, 4);
    cdh.writeUInt16LE(20, 6);
    cdh.writeUInt16LE(0, 8);
    cdh.writeUInt16LE(0, 10);
    cdh.writeUInt16LE(0, 12);
    cdh.writeUInt16LE(0, 14);
    cdh.writeUInt32LE(crc32(dataBuf), 16);
    cdh.writeUInt32LE(dataBuf.length, 20);
    cdh.writeUInt32LE(dataBuf.length, 24);
    cdh.writeUInt16LE(nameBuf.length, 28);
    cdh.writeUInt16LE(0, 30);
    cdh.writeUInt16LE(0, 32);
    cdh.writeUInt16LE(0, 34);
    cdh.writeUInt16LE(0, 36);
    cdh.writeUInt32LE(0, 38);
    cdh.writeUInt32LE(offset, 42);

    cdEntries.push(cdh, nameBuf);
    offset += lfh.length + nameBuf.length + dataBuf.length;
  }

  const cdOffset = offset;
  const cdSize = cdEntries.reduce((sum, b) => sum + b.length, 0);

  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(Object.keys(files).length, 8);
  eocd.writeUInt16LE(Object.keys(files).length, 10);
  eocd.writeUInt32LE(cdSize, 12);
  eocd.writeUInt32LE(cdOffset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...entries, ...cdEntries, eocd]);
}

/**
 * Universal ZIP Central Directory parser to decompress entries from DOCX.
 */
function readZipEntries(buf: Buffer): Record<string, Buffer> {
  const entries: Record<string, Buffer> = {};
  if (buf.length < 22) return entries;

  let eocdPos = -1;
  for (let i = buf.length - 22; i >= 0; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocdPos = i;
      break;
    }
  }
  if (eocdPos === -1) return entries;

  const cdOffset = buf.readUInt32LE(eocdPos + 16);
  const cdSize = buf.readUInt32LE(eocdPos + 12);
  let pos = cdOffset;

  while (pos < cdOffset + cdSize && pos < buf.length - 46) {
    if (buf.readUInt32LE(pos) !== 0x02014b50) break;
    const compMethod = buf.readUInt16LE(pos + 10);
    const compSize = buf.readUInt32LE(pos + 20);
    const nameLen = buf.readUInt16LE(pos + 28);
    const extraLen = buf.readUInt16LE(pos + 30);
    const commentLen = buf.readUInt16LE(pos + 32);
    const localHeaderOffset = buf.readUInt32LE(pos + 42);
    const filename = buf.subarray(pos + 46, pos + 46 + nameLen).toString('utf8');

    if (localHeaderOffset + 30 <= buf.length) {
      const localNameLen = buf.readUInt16LE(localHeaderOffset + 26);
      const localExtraLen = buf.readUInt16LE(localHeaderOffset + 28);
      const dataStart = localHeaderOffset + 30 + localNameLen + localExtraLen;
      const compData = buf.subarray(dataStart, dataStart + compSize);

      let decompressed: Buffer | null = null;
      if (compMethod === 8) {
        try { decompressed = zlib.inflateRawSync(compData); } catch {}
      } else if (compMethod === 0) {
        decompressed = Buffer.from(compData);
      }

      if (decompressed) {
        entries[filename] = decompressed;
      }
    }
    pos += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}

/**
 * Optimizes the generated DOCX package so textboxes automatically expand to fit 100% of their text,
 * preventing any character clipping while preserving original fonts, layout, and binary images.
 */
function optimizeDocxFontsAndLayout(docxBuf: Buffer): Buffer {
  try {
    const entries = readZipEntries(docxBuf);
    if (!entries['word/document.xml']) return docxBuf;

    let docXml = entries['word/document.xml'].toString('utf8');

    // Replace noAutofit with spAutoFit across all text frames so text is never truncated
    docXml = docXml.replace(/<a:noAutofit\/>/g, '<a:spAutoFit/>');

    // Set wrap to none so text flows naturally without forced square boundary clipping
    docXml = docXml.replace(/wrap="square"/g, 'wrap="none"');

    entries['word/document.xml'] = Buffer.from(docXml, 'utf8');

    // Rebuild zip preserving raw binary buffers for images
    const zipFiles: Record<string, Buffer> = {};
    for (const [k, v] of Object.entries(entries)) {
      zipFiles[k] = v;
    }
    return createOpenXmlZip(zipFiles);
  } catch {
    return docxBuf;
  }
}

/**
 * Builds a valid Microsoft Word OpenXML (.docx) structure with real extracted text.
 */
function buildDocxPackage(pageTexts: string[], docTitle: string): Buffer {
  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`;

  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  const wordRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
        <w:sz w:val="22"/>
        <w:lang w:val="en-IN"/>
      </w:rPr>
    </w:rPrDefault>
  </w:docDefaults>
  <w:style w:type="paragraph" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:pPr><w:spacing w:after="160" w:line="259" w:lineRule="auto"/></w:pPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:basedOn w:val="Normal"/>
    <w:rPr><w:b/><w:sz w:val="28"/><w:color w:val="2E4057"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="PageHeader">
    <w:name w:val="Page Header"/>
    <w:basedOn w:val="Normal"/>
    <w:rPr><w:b/><w:color w:val="555555"/><w:sz w:val="18"/></w:rPr>
  </w:style>
</w:styles>`;

  let bodyXml = '';

  // Document title paragraph
  bodyXml += `    <w:p>
      <w:pPr><w:pStyle w:val="Heading1"/></w:pPr>
      <w:r><w:t>${xmlEscape(docTitle)}</w:t></w:r>
    </w:p>\n`;

  for (let pageIdx = 0; pageIdx < pageTexts.length; pageIdx++) {
    const pageText = pageTexts[pageIdx];

    if (pageTexts.length > 1) {
      bodyXml += `    <w:p>
      <w:pPr><w:pStyle w:val="PageHeader"/></w:pPr>
      <w:r><w:t>--- Page ${pageIdx + 1} of ${pageTexts.length} ---</w:t></w:r>
    </w:p>\n`;
    }

    if (!pageText || pageText.trim() === '') {
      bodyXml += `    <w:p>
      <w:r><w:rPr><w:color w:val="999999"/><w:i/></w:rPr>
        <w:t>[Page ${pageIdx + 1}: No extractable text. This may be a scanned image-based PDF. Use the OCR tool instead.]</w:t>
      </w:r>
    </w:p>\n`;
      continue;
    }

    // Group text into paragraph chunks (~200 chars each for readability)
    const words = pageText.split(/\s+/);
    const paragraphs: string[] = [];
    let current = '';
    for (const word of words) {
      if ((current + ' ' + word).length > 200) {
        if (current) paragraphs.push(current.trim());
        current = word;
      } else {
        current = current ? current + ' ' + word : word;
      }
    }
    if (current.trim()) paragraphs.push(current.trim());

    for (const para of paragraphs) {
      bodyXml += `    <w:p>
      <w:pPr><w:spacing w:after="120"/></w:pPr>
      <w:r><w:t xml:space="preserve">${xmlEscape(para)}</w:t></w:r>
    </w:p>\n`;
    }
  }

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
${bodyXml}
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
    </w:sectPr>
  </w:body>
</w:document>`;

  return createOpenXmlZip({
    '[Content_Types].xml': contentTypes,
    '_rels/.rels': rels,
    'word/_rels/document.xml.rels': wordRels,
    'word/styles.xml': stylesXml,
    'word/document.xml': documentXml,
  });
}

/**
 * Builds a valid Microsoft Excel OpenXML (.xlsx) with extracted PDF text as table rows.
 */
function buildXlsxPackage(pageTexts: string[], docTitle: string): Buffer {
  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`;

  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

  const workbookRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>`;

  const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Extracted Data" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`;

  let rowIndex = 1;
  let sheetRows = '';

  // Header row
  sheetRows += `    <row r="${rowIndex}">
      <c r="A${rowIndex}" t="inlineStr"><is><t>Extracted Content</t></is></c>
      <c r="B${rowIndex}" t="inlineStr"><is><t>Source Page</t></is></c>
    </row>\n`;
  rowIndex++;

  // Source document name row
  sheetRows += `    <row r="${rowIndex}">
      <c r="A${rowIndex}" t="inlineStr"><is><t>${xmlEscape(docTitle)}</t></is></c>
      <c r="B${rowIndex}" t="inlineStr"><is><t>Document</t></is></c>
    </row>\n`;
  rowIndex++;

  for (let pageIdx = 0; pageIdx < pageTexts.length; pageIdx++) {
    const pageText = pageTexts[pageIdx];
    if (!pageText || pageText.trim() === '') continue;

    // Split on spaces ≥3, tabs, or pipe chars for column-like segmentation
    const lines = pageText
      .split(/\s{3,}|\t|\|/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const line of lines) {
      sheetRows += `    <row r="${rowIndex}">
      <c r="A${rowIndex}" t="inlineStr"><is><t>${xmlEscape(line)}</t></is></c>
      <c r="B${rowIndex}"><v>${pageIdx + 1}</v></c>
    </row>\n`;
      rowIndex++;
    }
  }

  const sheet1Xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>
${sheetRows}
  </sheetData>
</worksheet>`;

  return createOpenXmlZip({
    '[Content_Types].xml': contentTypes,
    '_rels/.rels': rels,
    'xl/_rels/workbook.xml.rels': workbookRels,
    'xl/workbook.xml': workbookXml,
    'xl/worksheets/sheet1.xml': sheet1Xml,
  });
}

// ============================================================================
// TIER 1: PYTHON pdf2docx ENGINE
// ============================================================================

/** Cached Python binary path (null = not yet checked, '' = not found) */
let _cachedPythonBin: string | null = null;

/**
 * Find a working Python 3 binary. Result is cached after first successful lookup.
 */
async function getPythonBin(): Promise<string | null> {
  if (_cachedPythonBin !== null) return _cachedPythonBin || null;

  const candidates = process.platform === 'win32'
    ? ['python', 'python3', 'py -3']
    : ['python3', 'python'];

  for (const candidate of candidates) {
    try {
      const result = await new Promise<string>((resolve, reject) => {
        execFile(candidate, ['--version'], { timeout: 5000 }, (err, stdout, stderr) => {
          if (err) reject(err);
          else resolve((stdout || stderr || '').trim());
        });
      });
      // Verify it's Python 3.x
      if (result.includes('Python 3')) {
        _cachedPythonBin = candidate;
        console.log(`[PdfToWord] Python binary found: ${candidate} (${result})`);
        return candidate;
      }
    } catch {
      // Continue to next candidate
    }
  }

  _cachedPythonBin = ''; // Mark as "searched but not found"
  console.warn('[PdfToWord] No Python 3 binary found — Tier 1 engine unavailable');
  return null;
}

/**
 * Resolve the path to pdf_to_docx_engine.py relative to this package.
 */
function getPythonScriptPath(): string {
  // In compiled JS: packages/workers/dist/processors/pdf-to-office.js
  // Script is at:   packages/workers/scripts/pdf_to_docx_engine.py
  const thisFile = typeof __filename !== 'undefined'
    ? __filename
    : fileURLToPath(import.meta.url);
  return path.resolve(path.dirname(thisFile), '..', '..', 'scripts', 'pdf_to_docx_engine.py');
}

/**
 * Tier 1: Convert PDF→DOCX using the Python pdf2docx engine.
 * Returns the DOCX buffer on success, null on failure.
 *
 * Production guards:
 *   - 60s timeout with force-kill on Windows (taskkill /F /T /PID)
 *   - Stderr captured and logged (not exposed to user)
 *   - Returns null on any failure → falls through to Tier 2
 */
async function convertViaPython(
  inputPdfPath: string,
  outputDocxPath: string,
  timeoutMs: number = 60000
): Promise<Buffer | null> {
  const pythonBin = await getPythonBin();
  if (!pythonBin) return null;

  const scriptPath = getPythonScriptPath();

  // Check script exists
  try {
    await fs.access(scriptPath);
  } catch {
    console.warn(`[PdfToWord] Python script not found at: ${scriptPath}`);
    return null;
  }

  return new Promise((resolve) => {
    const child = execFile(
      pythonBin,
      [scriptPath, inputPdfPath, outputDocxPath],
      {
        timeout: timeoutMs,
        maxBuffer: 10 * 1024 * 1024,
        cwd: path.dirname(inputPdfPath),
      },
      async (err, _stdout, stderr) => {
        // Log Python stderr for debugging (never exposed to user)
        if (stderr) {
          const lines = stderr.trim().split('\n');
          for (const line of lines) {
            console.log(`[PdfToWord:Python] ${line}`);
          }
        }

        if (err) {
          const errMsg = err instanceof Error ? err.message : String(err);
          console.error(`[PdfToWord] Python engine error: ${errMsg}`);

          // Force-kill on Windows if timed out (taskkill for entire process tree)
          if ((err as any).killed && child.pid && process.platform === 'win32') {
            try {
              execFile('taskkill', ['/F', '/T', '/PID', String(child.pid)], () => {});
            } catch { /* best effort */ }
          }

          resolve(null);
          return;
        }

        // Verify output file exists and has content
        try {
          const stat = await fs.stat(outputDocxPath);
          if (stat.size > 0) {
            const buf = await fs.readFile(outputDocxPath);
            resolve(buf);
          } else {
            console.warn('[PdfToWord] Python engine produced empty output');
            resolve(null);
          }
        } catch {
          console.warn('[PdfToWord] Python engine output file not found');
          resolve(null);
        }
      }
    );
  });
}

// ============================================================================
// PDF TO WORD PROCESSOR (3-TIER CASCADE)
// ============================================================================

export class PdfToWordProcessor implements DocumentProcessor<PdfToWordOptions> {
  readonly operation = 'pdf-to-word' as const;

  async validateInput(inputFiles: ValidatedFile[], _options: PdfToWordOptions): Promise<void> {
    if (!inputFiles || inputFiles.length !== 1) {
      throw new PlatformError('INVALID_INPUT', {
        message: 'PDF to Word requires exactly 1 input PDF.',
      });
    }
  }

  estimateResourceCost(inputFiles: ValidatedFile[], _options: PdfToWordOptions): ResourceEstimate {
    const size = inputFiles[0]?.sizeBytes || 0;
    return {
      estimatedDurationMs: Math.max(1200, Math.round(size / 8000)),
      estimatedMemoryBytes: Math.max(64 * 1024 * 1024, Math.round(size * 4)),
      isHeavyOperation: true,
    };
  }

  async process(
    inputBuffers: Buffer[],
    _options: PdfToWordOptions,
    context: WorkerExecutionContext
  ): Promise<ProcessingResult> {
    const startTime = Date.now();
    const inputBuffer = inputBuffers[0];
    validatePdfSafety(inputBuffer);

    await context.onProgress(10, 'Inspecting PDF document structure...');
    const pdfDoc = await PDFDocument.load(inputBuffer, { ignoreEncryption: true });
    const pageCount = pdfDoc.getPageCount();

    // Create temp working directory for all conversion tiers
    const tempDir = context.tempWorkingDir || (await fs.mkdtemp(path.join(process.cwd(), 'scratch_wrd_')));
    const inPath = path.join(tempDir, `doc_${context.jobId}.pdf`);
    await fs.writeFile(inPath, inputBuffer);

    let outputBuffer: Buffer | null = null;
    let conversionTier = 'none';

    try {
      // ── Tier 1: Python pdf2docx engine (best quality) ───────────────────
      await context.onProgress(20, 'Attempting high-fidelity conversion engine...');
      const pyOutPath = path.join(tempDir, `doc_${context.jobId}_py.docx`);
      outputBuffer = await convertViaPython(inPath, pyOutPath, 60000);

      if (outputBuffer) {
        conversionTier = 'python-pdf2docx';
        console.log(`[PdfToWord] Tier 1 (Python pdf2docx) succeeded: ${outputBuffer.length} bytes`);
        await context.onProgress(90, 'High-fidelity conversion complete.');
      }

      // ── Tier 2: LibreOffice soffice (fallback) ─────────────────────────
      if (!outputBuffer) {
        await context.onProgress(40, 'Falling back to LibreOffice conversion...');
        const sofficePath = await getSoffice();

        if (sofficePath) {
          try {
            await runSoffice(sofficePath, [
              '--headless',
              '--invisible',
              '--nologo',
              '--nodefault',
              '--infilter=writer_pdf_import',
              '--convert-to',
              'docx',
              '--outdir',
              tempDir,
              inPath,
            ], { cwd: tempDir, timeout: 30000, maxBuffer: 10 * 1024 * 1024 });
          } catch (err: unknown) {
            const errMsg = err instanceof Error ? err.message : String(err);
            console.error(`[PdfToWord] Tier 2 soffice error: ${errMsg}`);
          }

          const expectedOutPath = path.join(tempDir, `doc_${context.jobId}.docx`);
          let foundDocxPath: string | null = null;

          try {
            await fs.access(expectedOutPath);
            foundDocxPath = expectedOutPath;
          } catch {
            try {
              const files = await fs.readdir(tempDir);
              const docxFile = files.find(f => f.toLowerCase().endsWith('.docx'));
              if (docxFile) foundDocxPath = path.join(tempDir, docxFile);
            } catch { /* ignore */ }
          }

          if (foundDocxPath) {
            outputBuffer = await fs.readFile(foundDocxPath);
            outputBuffer = optimizeDocxFontsAndLayout(outputBuffer);
            conversionTier = 'libreoffice';
            console.log(`[PdfToWord] Tier 2 (LibreOffice) succeeded: ${outputBuffer.length} bytes`);
            await context.onProgress(90, 'LibreOffice conversion complete.');
          }
        }
      }

      // ── Tier 3: JS OpenXML builder (last resort) ───────────────────────
      if (!outputBuffer) {
        await context.onProgress(60, 'Using text extraction fallback...');
        const pageTexts = await extractPdfTextByPage(inputBuffer);
        outputBuffer = buildDocxPackage(pageTexts, 'Converted Document');
        conversionTier = 'js-openxml';
        console.log(`[PdfToWord] Tier 3 (JS OpenXML) fallback: ${outputBuffer.length} bytes`);
        await context.onProgress(90, 'Text extraction conversion complete.');
      }

    } finally {
      // Always clean up temp directory
      try { await fs.rm(tempDir, { recursive: true, force: true }); } catch { /* best effort */ }
    }

    await context.onProgress(100, `PDF converted to Word (.docx) successfully [${conversionTier}].`);

    return {
      outputFiles: [
        {
          filename: 'converted_document.docx',
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          buffer: outputBuffer,
          pageCount,
        },
      ],
      metrics: {
        durationMs: Date.now() - startTime,
        inputSizeBytes: inputBuffer.length,
        outputSizeBytes: outputBuffer.length,
        totalPageCount: pageCount,
      },
    };
  }
}

// ============================================================================
// PDF TO EXCEL PROCESSOR
// ============================================================================

export class PdfToExcelProcessor implements DocumentProcessor<PdfToExcelOptions> {
  readonly operation = 'pdf-to-excel' as const;

  async validateInput(inputFiles: ValidatedFile[], _options: PdfToExcelOptions): Promise<void> {
    if (!inputFiles || inputFiles.length !== 1) {
      throw new PlatformError('INVALID_INPUT', {
        message: 'PDF to Excel requires exactly 1 input PDF.',
      });
    }
  }

  estimateResourceCost(inputFiles: ValidatedFile[], _options: PdfToExcelOptions): ResourceEstimate {
    const size = inputFiles[0]?.sizeBytes || 0;
    return {
      estimatedDurationMs: Math.max(1200, Math.round(size / 8000)),
      estimatedMemoryBytes: Math.max(64 * 1024 * 1024, Math.round(size * 4)),
      isHeavyOperation: true,
    };
  }

  async process(
    inputBuffers: Buffer[],
    _options: PdfToExcelOptions,
    context: WorkerExecutionContext
  ): Promise<ProcessingResult> {
    const startTime = Date.now();
    const inputBuffer = inputBuffers[0];
    validatePdfSafety(inputBuffer);

    await context.onProgress(15, 'Detecting tabular structures and text lines...');
    const pdfDoc = await PDFDocument.load(inputBuffer, { ignoreEncryption: true });
    const pageCount = pdfDoc.getPageCount();

    await context.onProgress(30, 'Extracting text content from all PDF pages...');
    const pageTexts = await extractPdfTextByPage(inputBuffer);

    await context.onProgress(55, 'Structuring rows and columns into Excel worksheet...');
    const sofficePath = await getSoffice();
    let outputBuffer: Buffer;

    if (sofficePath) {
      const tempDir = context.tempWorkingDir || (await fs.mkdtemp(path.join(process.cwd(), 'scratch_xls_')));
      const inPath = path.join(tempDir, `calc_${context.jobId}.pdf`);

      await fs.writeFile(inPath, inputBuffer);

      try {
        await runSoffice(sofficePath, [
          '--headless',
          '--invisible',
          '--nologo',
          '--nodefault',
          '--convert-to',
          'xlsx',
          '--outdir',
          tempDir,
          inPath,
        ], { cwd: tempDir, timeout: 30000, maxBuffer: 10 * 1024 * 1024 });
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error(`[PdfToExcel] soffice HARD FAIL: ${errMsg}`);
      }

      const expectedOutPath = path.join(tempDir, `calc_${context.jobId}.xlsx`);
      let foundXlsxPath: string | null = null;

      try {
        await fs.access(expectedOutPath);
        foundXlsxPath = expectedOutPath;
      } catch {
        try {
          const files = await fs.readdir(tempDir);
          const xlsxFile = files.find(f => f.toLowerCase().endsWith('.xlsx'));
          if (xlsxFile) foundXlsxPath = path.join(tempDir, xlsxFile);
        } catch { /* ignore */ }
      }

      if (foundXlsxPath) {
        outputBuffer = await fs.readFile(foundXlsxPath);
      } else {
        outputBuffer = buildXlsxPackage(pageTexts, 'Extracted Data');
      }

      try { await fs.rm(tempDir, { recursive: true, force: true }); } catch { /* best effort */ }
    } else {
      outputBuffer = buildXlsxPackage(pageTexts, 'Extracted Data');
    }

    await context.onProgress(100, 'PDF converted to Excel (.xlsx) successfully.');

    return {
      outputFiles: [
        {
          filename: 'extracted_tables.xlsx',
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          buffer: outputBuffer,
          pageCount,
        },
      ],
      metrics: {
        durationMs: Date.now() - startTime,
        inputSizeBytes: inputBuffer.length,
        outputSizeBytes: outputBuffer.length,
        totalPageCount: pageCount,
      },
    };
  }
}
