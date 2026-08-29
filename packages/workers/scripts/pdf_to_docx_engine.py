#!/usr/bin/env python3
"""
pdf_to_docx_engine.py — Production-Grade PDF→DOCX Conversion Engine

Architecture:
  1. Uses pdf2docx (PyMuPDF/MuPDF engine) for high-fidelity layout reconstruction:
     - Native Word tables from PDF vector grid lines
     - Exact font families, sizes, colors from PDF font dictionary
     - Embedded images (logos, QR codes, photos) as inline Word images
     - Page dimensions and margins matching original PDF
  2. Post-processes barcode / custom font spans:
     - Detects non-standard fonts (IDAutomation, Code39, Code128, etc.)
     - Renders bounding box at 300 DPI as crisp PNG
     - Replaces raw text run in DOCX with inline image
  3. Returns exit code 0 on success, 1 on failure

Usage:
  python pdf_to_docx_engine.py <input.pdf> <output.docx>

Production Guards:
  - 55-second internal timeout (self-kills before Node's 60s limit)
  - Memory guard: skips barcode post-processing for files >50MB
  - Graceful degradation: if barcode replacement fails, returns unmodified pdf2docx output
"""

import sys
import os
import io
import signal
import time
import traceback

# ── Internal timeout guard (55s) ─────────────────────────────────────────────
MAX_EXECUTION_SECONDS = 55
_start_time = time.time()

def _check_timeout():
    """Raise TimeoutError if we've exceeded our execution budget."""
    elapsed = time.time() - _start_time
    if elapsed > MAX_EXECUTION_SECONDS:
        raise TimeoutError(f"Internal timeout after {elapsed:.1f}s")

# ── Known barcode / symbol / non-standard font patterns ──────────────────────
BARCODE_FONT_PATTERNS = [
    'idautomation', 'code39', 'code128', 'code93', 'ean13', 'ean8',
    'upc', 'interleaved', 'codabar', 'postnet', 'msi', 'plessey',
    'datamatrix', 'qrcode', 'aztec', 'pdf417', 'barcode', 'bc_',
    'libre barcode', 'c39', 'c128',
]

def _is_barcode_font(font_name: str) -> bool:
    """Check if a font name matches known barcode/symbol font patterns."""
    lower = font_name.lower()
    # Strip standard PDF font subset prefix (e.g. "ABCDEE+FontName")
    if '+' in lower:
        lower = lower.split('+', 1)[1]
    return any(pattern in lower for pattern in BARCODE_FONT_PATTERNS)


def _convert_pdf2docx(input_path: str, output_path: str) -> bool:
    """
    Step 1: Run pdf2docx conversion for high-fidelity layout reconstruction.
    Returns True if output file was created successfully.
    """
    try:
        from pdf2docx import Converter
        cv = Converter(input_path)
        cv.convert(output_path, start=0, end=None)
        cv.close()
        return os.path.exists(output_path) and os.path.getsize(output_path) > 0
    except Exception as e:
        print(f"[pdf2docx] Conversion error: {e}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        return False


def _detect_barcode_spans(input_path: str):
    """
    Step 2: Scan PDF for barcode / custom font text spans.
    Returns list of dicts with barcode crop info.
    """
    barcode_crops = []
    try:
        import pymupdf
        doc = pymupdf.open(input_path)

        for page_num in range(len(doc)):
            _check_timeout()
            page = doc[page_num]
            blocks = page.get_text('dict')['blocks']

            for block in blocks:
                if 'lines' not in block:
                    continue
                for line in block['lines']:
                    for span in line['spans']:
                        font_name = span.get('font', '')
                        text = span.get('text', '')

                        if not _is_barcode_font(font_name):
                            continue

                        # Skip empty or whitespace-only spans
                        if not text.strip():
                            continue

                        bbox = span['bbox']
                        rect = pymupdf.Rect(bbox)

                        # Expand slightly for clean margins
                        expanded = pymupdf.Rect(
                            rect.x0 - 2, rect.y0 - 2,
                            rect.x1 + 2, rect.y1 + 2
                        )

                        # Render at 300 DPI for crisp output
                        pix = page.get_pixmap(clip=expanded, dpi=300)
                        img_bytes = pix.tobytes('png')

                        barcode_crops.append({
                            'text': text,
                            'font': font_name,
                            'img_bytes': img_bytes,
                            'w_inch': expanded.width / 72.0,
                            'h_inch': expanded.height / 72.0,
                            'page': page_num,
                        })

        doc.close()
    except TimeoutError:
        raise
    except Exception as e:
        print(f"[barcode-detect] Scan error (non-fatal): {e}", file=sys.stderr)

    return barcode_crops


def _replace_barcodes_in_docx(docx_path: str, barcode_crops: list) -> bool:
    """
    Step 3: Post-process the DOCX to replace barcode text runs with inline images.
    Returns True if any replacements were made.
    """
    if not barcode_crops:
        return False

    replacements_made = False
    try:
        from docx import Document
        from docx.shared import Inches

        doc = Document(docx_path)

        for crop in barcode_crops:
            _check_timeout()
            target_text = crop['text']

            # Search in tables (most common location for barcodes in structured PDFs)
            for table in doc.tables:
                for row in table.rows:
                    for cell in row.cells:
                        if target_text not in cell.text:
                            continue
                        for para in cell.paragraphs:
                            for run in para.runs:
                                run_font = (run.font.name or '').lower()
                                if target_text in run.text or _is_barcode_font(run_font):
                                    run.text = ''
                                    img_stream = io.BytesIO(crop['img_bytes'])
                                    run.add_picture(
                                        img_stream,
                                        width=Inches(crop['w_inch']),
                                        height=Inches(crop['h_inch'])
                                    )
                                    replacements_made = True

            # Search in paragraphs (standalone barcodes outside tables)
            for para in doc.paragraphs:
                if target_text not in para.text:
                    continue
                for run in para.runs:
                    run_font = (run.font.name or '').lower()
                    if target_text in run.text or _is_barcode_font(run_font):
                        run.text = ''
                        img_stream = io.BytesIO(crop['img_bytes'])
                        run.add_picture(
                            img_stream,
                            width=Inches(crop['w_inch']),
                            height=Inches(crop['h_inch'])
                        )
                        replacements_made = True

        if replacements_made:
            doc.save(docx_path)

    except TimeoutError:
        raise
    except Exception as e:
        print(f"[barcode-replace] Post-processing error (non-fatal): {e}", file=sys.stderr)
        # Non-fatal: the docx without barcode images is still valid

    return replacements_made


def main():
    if len(sys.argv) != 3:
        print(f"Usage: {sys.argv[0]} <input.pdf> <output.docx>", file=sys.stderr)
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2]

    if not os.path.exists(input_path):
        print(f"Error: Input file not found: {input_path}", file=sys.stderr)
        sys.exit(1)

    input_size = os.path.getsize(input_path)
    print(f"[engine] Input: {input_path} ({input_size} bytes)", file=sys.stderr)

    # ── Step 1: pdf2docx conversion ──────────────────────────────────────────
    print("[engine] Step 1/3: Running pdf2docx layout reconstruction...", file=sys.stderr)
    success = _convert_pdf2docx(input_path, output_path)
    if not success:
        print("[engine] FATAL: pdf2docx conversion failed", file=sys.stderr)
        sys.exit(1)

    _check_timeout()

    # ── Step 2: Barcode detection (skip for very large files) ────────────────
    MAX_SIZE_FOR_BARCODE_SCAN = 50 * 1024 * 1024  # 50MB
    if input_size > MAX_SIZE_FOR_BARCODE_SCAN:
        print(f"[engine] Step 2/3: Skipping barcode scan (file too large: {input_size} bytes)", file=sys.stderr)
        barcode_crops = []
    else:
        print("[engine] Step 2/3: Scanning for barcode/custom font spans...", file=sys.stderr)
        barcode_crops = _detect_barcode_spans(input_path)
        print(f"[engine] Found {len(barcode_crops)} barcode span(s)", file=sys.stderr)

    _check_timeout()

    # ── Step 3: Barcode replacement ──────────────────────────────────────────
    if barcode_crops:
        print("[engine] Step 3/3: Replacing barcode text with inline images...", file=sys.stderr)
        replaced = _replace_barcodes_in_docx(output_path, barcode_crops)
        print(f"[engine] Barcode replacement: {'done' if replaced else 'no matches found'}", file=sys.stderr)
    else:
        print("[engine] Step 3/3: No barcodes to replace, skipping.", file=sys.stderr)

    # ── Verify output ────────────────────────────────────────────────────────
    if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
        output_size = os.path.getsize(output_path)
        elapsed = time.time() - _start_time
        print(f"[engine] SUCCESS: {output_path} ({output_size} bytes, {elapsed:.1f}s)", file=sys.stderr)
        sys.exit(0)
    else:
        print("[engine] FATAL: Output file missing or empty", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    try:
        main()
    except TimeoutError as e:
        print(f"[engine] TIMEOUT: {e}", file=sys.stderr)
        sys.exit(2)
    except Exception as e:
        print(f"[engine] UNHANDLED ERROR: {e}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        sys.exit(1)
