/**
 * @file seo.ts
 * @description Programmatic SEO schemas, OpenGraph helpers, and JSON-LD structured data generators.
 */

export interface ToolSeoConfig {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  keywords: string[];
  features: string[];
  howToSteps: { name: string; text: string }[];
  faqs: { question: string; answer: string }[];
}

export const TOOL_REGISTRY: Record<string, ToolSeoConfig> = {
  'merge-pdf': {
    slug: 'merge-pdf',
    title: 'Merge PDF Online',
    metaTitle: 'Merge PDF Online — Combine Multiple PDF Files Free | DocPlatform',
    metaDescription: 'Combine multiple PDF files into one secure document in seconds. Instant local browser processing with zero cloud data storage and complete privacy.',
    canonicalUrl: 'https://docplatform.app/merge-pdf',
    keywords: ['merge pdf', 'combine pdf', 'join pdf files', 'pdf merger free', 'combine pdf online'],
    features: [
      'Zero-upload client-side processing for ultimate speed and privacy',
      'Drag-and-drop file reordering with live page preview',
      'Preserves high-resolution images, bookmarks, and form fields',
      '100% free with no file limits or watermarks',
    ],
    howToSteps: [
      { name: 'Upload PDFs', text: 'Select and drag your PDF documents into the drop zone.' },
      { name: 'Arrange Order', text: 'Drag files or pages to set your desired reading order.' },
      { name: 'Merge & Download', text: 'Click "Merge PDF" to combine instantly and download your unified document.' },
    ],
    faqs: [
      { question: 'Is my data safe when merging PDFs?', answer: 'Yes. Lightweight merges are processed locally right in your browser. Your files never leave your computer unless you explicitly choose cloud processing.' },
      { question: 'How many PDF files can I combine at once?', answer: 'You can merge up to 50 files simultaneously for free.' },
      { question: 'Will combining PDFs reduce document quality?', answer: 'No. The original vector fidelity, fonts, and embedded images are preserved with zero degradation.' },
    ],
  },
  'split-pdf': {
    slug: 'split-pdf',
    title: 'Split PDF Online',
    metaTitle: 'Split PDF Online — Extract & Separate Pages Free | DocPlatform',
    metaDescription: 'Split a PDF into individual pages or extract specific page ranges instantly. Fast, private, and secure document extraction.',
    canonicalUrl: 'https://docplatform.app/split-pdf',
    keywords: ['split pdf', 'extract pdf pages', 'separate pdf', 'pdf splitter online'],
    features: [
      'Split by custom page ranges (e.g. 1-5, 8, 11-14)',
      'Extract every single page into separate standalone files',
      'Instant client-side extraction with zero lag',
    ],
    howToSteps: [
      { name: 'Upload PDF', text: 'Drop your PDF file into the splitter.' },
      { name: 'Select Pages', text: 'Choose your desired page ranges or split every page.' },
      { name: 'Download', text: 'Download your extracted PDF files individually or as a ZIP archive.' },
    ],
    faqs: [
      { question: 'Can I extract non-consecutive pages?', answer: 'Yes! Simply specify ranges like 1-3, 5, 8-10 in the split configuration.' },
    ],
  },
  'compress-pdf': {
    slug: 'compress-pdf',
    title: 'Compress PDF Online',
    metaTitle: 'Compress PDF Online — Reduce PDF File Size Free | DocPlatform',
    metaDescription: 'Reduce your PDF file size while maintaining crystal clear text and image quality. Choose from Extreme, Recommended, or Low compression levels.',
    canonicalUrl: 'https://docplatform.app/compress-pdf',
    keywords: ['compress pdf', 'reduce pdf size', 'shrink pdf', 'pdf compressor online free'],
    features: [
      'Three intelligent compression levels tailored for email and web',
      'Smart vector preservation ensuring crisp, readable typography',
      'Real-time compression ratio and size savings calculator',
    ],
    howToSteps: [
      { name: 'Upload PDF', text: 'Select the PDF file you want to shrink.' },
      { name: 'Choose Preset', text: 'Select Extreme, Recommended, or High Quality compression.' },
      { name: 'Download', text: 'Get your lightweight PDF ready for email and sharing.' },
    ],
    faqs: [
      { question: 'How much can I reduce my PDF size?', answer: 'Most PDFs are reduced between 40% and 85% depending on embedded images and fonts.' },
    ],
  },
  'rotate-pdf': {
    slug: 'rotate-pdf',
    title: 'Rotate PDF Online',
    metaTitle: 'Rotate PDF Online — Permanently Rotate PDF Pages 90° / 180° | DocPlatform',
    metaDescription: 'Rotate individual or all pages in your PDF document permanently. Rotate clockwise, counterclockwise, or upside-down with instant browser preview.',
    canonicalUrl: 'https://docplatform.app/rotate-pdf',
    keywords: ['rotate pdf', 'rotate pdf pages', 'turn pdf permanently', 'rotate pdf online'],
    features: [
      'Rotate individual pages or entire documents 90°, 180°, or 270°',
      'Interactive visual thumbnail rotation',
      'Permanent orientation saving',
    ],
    howToSteps: [
      { name: 'Upload PDF', text: 'Drag your PDF into the rotation canvas.' },
      { name: 'Rotate Pages', text: 'Click rotate on specific thumbnails or rotate all pages at once.' },
      { name: 'Save', text: 'Download your correctly oriented PDF document.' },
    ],
    faqs: [
      { question: 'Is the rotation permanent?', answer: 'Yes, when downloaded, the new page orientation is permanently encoded into the PDF structure.' },
    ],
  },
  'delete-pdf-pages': {
    slug: 'delete-pdf-pages',
    title: 'Delete PDF Pages',
    metaTitle: 'Delete PDF Pages Online — Remove Unwanted Pages Free | DocPlatform',
    metaDescription: 'Easily select and remove unwanted pages from your PDF file. Download a clean, optimized document in seconds.',
    canonicalUrl: 'https://docplatform.app/delete-pdf-pages',
    keywords: ['delete pdf pages', 'remove pages from pdf', 'cut pdf pages'],
    features: [
      'Visual page grid selection for one-click deletion',
      'Undo and restore capability before exporting',
      'Zero server upload required for local files',
    ],
    howToSteps: [
      { name: 'Upload PDF', text: 'Upload the document you want to edit.' },
      { name: 'Select Pages', text: 'Click the trash icon on the pages you want to remove.' },
      { name: 'Export', text: 'Click "Save Changes" to download your trimmed PDF.' },
    ],
    faqs: [
      { question: 'Can I delete multiple pages at once?', answer: 'Yes, select as many pages as you want to discard.' },
    ],
  },
  'jpg-to-pdf': {
    slug: 'jpg-to-pdf',
    title: 'JPG to PDF Converter',
    metaTitle: 'JPG to PDF Converter — Convert Images to PDF Online Free | DocPlatform',
    metaDescription: 'Convert JPG, PNG, and WebP images into a single organized PDF document. Set margins, orientation, and page size easily.',
    canonicalUrl: 'https://docplatform.app/jpg-to-pdf',
    keywords: ['jpg to pdf', 'image to pdf', 'convert png to pdf', 'photos to pdf'],
    features: [
      'Combine multiple image formats (JPG, PNG, WebP) into one document',
      'Automatic orientation adjustment (Portrait or Landscape)',
      'Custom margin and page size controls (A4, Letter, Fit Image)',
    ],
    howToSteps: [
      { name: 'Upload Images', text: 'Drag and drop one or more images into the converter.' },
      { name: 'Adjust Settings', text: 'Choose page size, orientation, and margin preferences.' },
      { name: 'Generate PDF', text: 'Download your compiled PDF document instantly.' },
    ],
    faqs: [
      { question: 'Can I reorder my images before converting?', answer: 'Yes, drag and drop the image thumbnails to reorder them in any sequence.' },
    ],
  },
  'pdf-to-jpg': {
    slug: 'pdf-to-jpg',
    title: 'PDF to JPG Converter',
    metaTitle: 'PDF to JPG Converter — Convert PDF Pages to High-Res Images | DocPlatform',
    metaDescription: 'Extract all pages from your PDF and convert them into high-resolution JPG or PNG images. Instant download individually or as a ZIP.',
    canonicalUrl: 'https://docplatform.app/pdf-to-jpg',
    keywords: ['pdf to jpg', 'convert pdf to image', 'pdf to png', 'extract images from pdf'],
    features: [
      'High-DPI rendering for ultra-crisp image output',
      'Export to JPG, PNG, or modern WebP format',
      'Batch download all extracted pages in a single ZIP',
    ],
    howToSteps: [
      { name: 'Upload PDF', text: 'Select the PDF document to convert.' },
      { name: 'Choose Format', text: 'Pick JPG or PNG and select your desired DPI resolution.' },
      { name: 'Download', text: 'Download individual images or get all pages in a ZIP archive.' },
    ],
    faqs: [
      { question: 'What is the maximum image resolution?', answer: 'We support standard 150 DPI for web and 300 DPI for high-resolution print reproduction.' },
    ],
  },
  'word-to-pdf': {
    slug: 'word-to-pdf',
    title: 'Word to PDF Converter',
    metaTitle: 'Word to PDF Converter — Convert DOCX & DOC to PDF Online Free | DocPlatform',
    metaDescription: 'Convert Microsoft Word documents (DOCX, DOC, RTF) to flawless vector PDF files. 100% font fidelity, Hindi ligatures, Urdu RTL, and table borders preserved.',
    canonicalUrl: 'https://docplatform.app/word-to-pdf',
    keywords: ['word to pdf', 'convert docx to pdf', 'convert doc to pdf online', 'free word to pdf'],
    features: [
      'Universal font rendering with HarfBuzz engine (Devanagari, Arabic, Latin)',
      'Preserves margins, headings, bullet lists, and complex table layouts',
      'Supports DOCX, DOC, RTF, ODT, and TXT files',
    ],
    howToSteps: [
      { name: 'Upload Word File', text: 'Select or drag your .docx or .doc file into the converter.' },
      { name: 'Convert', text: 'Our engine compiles the document layout into clean vector PDF.' },
      { name: 'Download PDF', text: 'Download your high-resolution PDF instantly.' },
    ],
    faqs: [
      { question: 'Are non-English scripts supported?', answer: 'Yes! Our LibreOffice + HarfBuzz engine has universal Unicode fonts installed for Hindi, Urdu, Arabic, Spanish, French, and currencies.' },
    ],
  },
  'excel-to-pdf': {
    slug: 'excel-to-pdf',
    title: 'Excel to PDF Converter',
    metaTitle: 'Excel to PDF Converter — Convert XLSX & XLS Spreadsheets to PDF | DocPlatform',
    metaDescription: 'Convert Excel spreadsheets (XLSX, XLS, CSV) into clean PDF tables with automatic column fitting, landscape orientation, and gridlines.',
    canonicalUrl: 'https://docplatform.app/excel-to-pdf',
    keywords: ['excel to pdf', 'convert xlsx to pdf', 'spreadsheet to pdf online'],
    features: [
      'Fit wide spreadsheets to page width automatically',
      'Preserves currency symbols (₹, $, €, £) and number formatting',
      'Renders cell borders, custom colors, and data tables perfectly',
    ],
    howToSteps: [
      { name: 'Upload Excel', text: 'Upload your .xlsx or .xls spreadsheet.' },
      { name: 'Choose Settings', text: 'Select orientation and fit-to-page options.' },
      { name: 'Download PDF', text: 'Download your formatted tabular PDF report.' },
    ],
    faqs: [
      { question: 'Will my table fit on a single page width?', answer: 'Yes, enable "Fit to Page Width" to scale wide columns into a clean printable page.' },
    ],
  },
  'pdf-to-word': {
    slug: 'pdf-to-word',
    title: 'PDF to Word Converter',
    metaTitle: 'PDF to Word Converter — Convert PDF to Editable DOCX Online Free | DocPlatform',
    metaDescription: 'Convert PDF documents into fully editable Microsoft Word (.docx) files with flowing text, paragraph styles, and table reconstruction.',
    canonicalUrl: 'https://docplatform.app/pdf-to-word',
    keywords: ['pdf to word', 'convert pdf to docx', 'editable pdf to word', 'pdf to doc'],
    features: [
      'Reconstructs editable paragraph flows, bullet lists, and headings',
      'Extracts tables into native Word table structures',
      'Maintains document fonts and visual layout',
    ],
    howToSteps: [
      { name: 'Upload PDF', text: 'Select your PDF document.' },
      { name: 'Reconstruct', text: 'Our engine extracts text streams and rebuilds OpenXML DOCX.' },
      { name: 'Download Word', text: 'Open and edit the converted .docx file in Microsoft Word or Google Docs.' },
    ],
    faqs: [
      { question: 'Can I edit the converted Word file?', answer: 'Yes! The output is a standard OpenXML DOCX file compatible with Microsoft Word, LibreOffice, and Google Docs.' },
    ],
  },
  'pdf-to-excel': {
    slug: 'pdf-to-excel',
    title: 'PDF to Excel Converter',
    metaTitle: 'PDF to Excel Converter — Extract Tables from PDF to XLSX | DocPlatform',
    metaDescription: 'Extract tabular data from PDF statements, receipts, and reports into clean Microsoft Excel (.xlsx) spreadsheets.',
    canonicalUrl: 'https://docplatform.app/pdf-to-excel',
    keywords: ['pdf to excel', 'extract tables from pdf', 'convert pdf to xlsx'],
    features: [
      'Smart gridline and cell boundary detection',
      'Converts each page into an organized worksheet tab',
      'Preserves financial numbers and decimal precision',
    ],
    howToSteps: [
      { name: 'Upload PDF', text: 'Drop your statement or table-heavy PDF.' },
      { name: 'Extract Tables', text: 'The parser detects table structures and maps cell coordinates.' },
      { name: 'Download Excel', text: 'Download your .xlsx workbook ready for analysis.' },
    ],
    faqs: [
      { question: 'Does it support scanned tables?', answer: 'For scanned PDFs, run our OCR tool first or choose AI Table Extraction for unstructured invoices.' },
    ],
  },
  'watermark-pdf': {
    slug: 'watermark-pdf',
    title: 'Watermark PDF Online',
    metaTitle: 'Watermark PDF Online — Add Custom Text & Stamp Watermarks | DocPlatform',
    metaDescription: 'Add custom text stamps and watermarks to your PDF pages with adjustable opacity, angle, color, and page range.',
    canonicalUrl: 'https://docplatform.app/watermark-pdf',
    keywords: ['watermark pdf', 'add watermark to pdf', 'stamp pdf online', 'pdf watermark free'],
    features: [
      'Custom opacity, font size, angle, and diagonal positioning',
      'Apply to all pages or specific page ranges',
      'Instant client-side visual preview',
    ],
    howToSteps: [
      { name: 'Upload PDF', text: 'Select your document.' },
      { name: 'Customize Watermark', text: 'Type your text (e.g. DRAFT, CONFIDENTIAL) and adjust opacity.' },
      { name: 'Download', text: 'Download your watermarked document.' },
    ],
    faqs: [
      { question: 'Can I choose which pages get watermarked?', answer: 'Yes, specify target pages like "1-3, 5" or choose "All Pages".' },
    ],
  },
  'protect-pdf': {
    slug: 'protect-pdf',
    title: 'Protect PDF with Password',
    metaTitle: 'Protect PDF Online — Password Protect & Encrypt PDF Files | DocPlatform',
    metaDescription: 'Encrypt your PDF documents with AES-256 password protection and restrict printing, copying, or modification.',
    canonicalUrl: 'https://docplatform.app/protect-pdf',
    keywords: ['protect pdf', 'password protect pdf', 'encrypt pdf online', 'lock pdf'],
    features: [
      'Strong AES encryption standards',
      'Granular permission locks for printing, copying, and editing',
      '100% private in-browser encryption',
    ],
    howToSteps: [
      { name: 'Upload PDF', text: 'Select the file to lock.' },
      { name: 'Set Password', text: 'Enter a strong password to secure the document.' },
      { name: 'Encrypt & Download', text: 'Download your encrypted PDF.' },
    ],
    faqs: [
      { question: 'Can anyone open the file without the password?', answer: 'No. The document cannot be viewed or decrypted without entering the correct password.' },
    ],
  },
  'unlock-pdf': {
    slug: 'unlock-pdf',
    title: 'Unlock PDF Online',
    metaTitle: 'Unlock PDF Online — Remove Password from Protected PDF | DocPlatform',
    metaDescription: 'Remove password security and permission restrictions from your authorized PDF files for unrestricted access.',
    canonicalUrl: 'https://docplatform.app/unlock-pdf',
    keywords: ['unlock pdf', 'remove pdf password', 'decrypt pdf online'],
    features: [
      'Removes viewing passwords and editing restrictions',
      'Instant local browser decryption with zero server lag',
      'Completely private and confidential',
    ],
    howToSteps: [
      { name: 'Upload Locked PDF', text: 'Drop your password-protected PDF.' },
      { name: 'Enter Password', text: 'Provide the document password to authorize decryption.' },
      { name: 'Download Unlocked', text: 'Download the unrestricted PDF.' },
    ],
    faqs: [
      { question: 'Can I unlock a PDF without knowing the password?', answer: 'No. To maintain legal compliance and privacy, you must provide the authorized password.' },
    ],
  },
  'redact-pdf': {
    slug: 'redact-pdf',
    title: 'Redact PDF Online',
    metaTitle: 'Redact PDF Online — Permanently Black Out Sensitive Data & PII | DocPlatform',
    metaDescription: 'Permanently remove and blackout sensitive text, credit cards, SSNs, and confidential information with zero-leak security guarantees.',
    canonicalUrl: 'https://docplatform.app/redact-pdf',
    keywords: ['redact pdf', 'black out pdf text', 'sanitize pdf', 'pdf redaction tool'],
    features: [
      'True permanent redaction: underlying text & vector glyphs are scrubbed',
      'Clears overlapping annotation popups and form fields',
      'Sanitizes document metadata, search indexes, and XMP streams',
    ],
    howToSteps: [
      { name: 'Upload PDF', text: 'Select your confidential document.' },
      { name: 'Mark Areas', text: 'Highlight sensitive boxes to black out.' },
      { name: 'Permanently Redact', text: 'Download your sanitized, leak-proof PDF.' },
    ],
    faqs: [
      { question: 'Can someone copy the text underneath the black box?', answer: 'No! Our Zero-Leak engine completely purges the underlying vector text stream from the PDF byte structure.' },
    ],
  },
  'ocr-pdf': {
    slug: 'ocr-pdf',
    title: 'OCR PDF Online',
    metaTitle: 'OCR PDF Online — Convert Scanned PDFs to Searchable Documents | DocPlatform',
    metaDescription: 'Convert scanned PDF documents and camera images into searchable vector PDFs with an invisible selectable text layer.',
    canonicalUrl: 'https://docplatform.app/ocr-pdf',
    keywords: ['ocr pdf', 'searchable pdf', 'scanned pdf to text', 'ocr online free'],
    features: [
      'Sandwich PDF generation: original visual clarity with invisible searchable text',
      'Multilingual OCR models (English, Hindi, Spanish, French, German, Arabic)',
      'Export to Searchable PDF, Plain Text, or structured JSON',
    ],
    howToSteps: [
      { name: 'Upload Scanned PDF', text: 'Upload your scan or camera document.' },
      { name: 'Select Language', text: 'Pick your document language for optimal recognition.' },
      { name: 'Download Searchable PDF', text: 'Search, select, and copy text directly in your PDF.' },
    ],
    faqs: [
      { question: 'What is a Searchable PDF?', answer: 'A Searchable PDF preserves the exact visual appearance of your scan while placing an invisible text layer behind the image, enabling Ctrl+F search and text selection.' },
    ],
  },
  'compare-pdf': {
    slug: 'compare-pdf',
    title: 'Compare PDF Documents',
    metaTitle: 'Compare PDF Online — Visual Diff & Side-by-Side Comparison | DocPlatform',
    metaDescription: 'Compare two versions of a PDF document to highlight visual changes, removed clauses, and added text automatically.',
    canonicalUrl: 'https://docplatform.app/compare-pdf',
    keywords: ['compare pdf', 'pdf diff tool', 'compare two pdf files online', 'pdf visual difference'],
    features: [
      'Visual Diff Overlay: Removals in crimson (#FF0055), Additions in cyan (#00E5FF)',
      'Side-by-Side dual-pane comparison report with synchronized page views',
      'Automated change count and difference metric calculation',
    ],
    howToSteps: [
      { name: 'Upload Two Files', text: 'Select Document A (Original) and Document B (Modified).' },
      { name: 'Choose Diff Mode', text: 'Pick Visual Overlay or Side-by-Side dual-pane.' },
      { name: 'View & Download', text: 'Review the comparison report with highlighted modifications.' },
    ],
    faqs: [
      { question: 'How many files can I compare?', answer: 'Select exactly 2 PDF documents (Original vs Modified) to generate the comparison report.' },
    ],
  },
  'ai-summarize': {
    slug: 'ai-summarize',
    title: 'AI PDF Summarizer',
    metaTitle: 'AI PDF Summarizer — Instant Executive Summaries & Key Findings | DocPlatform',
    metaDescription: 'Summarize 100+ page contracts, financial filings, and research papers with grounded AI map-reduce intelligence.',
    canonicalUrl: 'https://docplatform.app/ai-summarize',
    keywords: ['ai pdf summarizer', 'summarize pdf online', 'ai document summary', 'chat with pdf'],
    features: [
      'Hierarchical map-reduce: analyzes full long documents without truncation',
      'Executive Overviews, Key Findings, Risk Liabilities, and Numerical Tables',
      'Export summary as Markdown or structured text',
    ],
    howToSteps: [
      { name: 'Upload PDF', text: 'Upload any report, contract, or textbook.' },
      { name: 'Choose Focus', text: 'Select Executive, Financial, or Legal focus area.' },
      { name: 'Generate Summary', text: 'Get instant structured takeaways and action items.' },
    ],
    faqs: [
      { question: 'Does it truncate large documents?', answer: 'No. Our hierarchical map-reduce engine processes every page independently before synthesizing the final executive summary.' },
    ],
  },
  'ai-ask': {
    slug: 'ai-ask',
    title: 'AI Document Q&A (Chat with PDF)',
    metaTitle: 'AI Document Q&A — Ask Questions with Grounded Page Citations | DocPlatform',
    metaDescription: 'Ask any question to your document and receive accurate answers with verifiable [Page X] citations and zero hallucinations.',
    canonicalUrl: 'https://docplatform.app/ai-ask',
    keywords: ['chat with pdf', 'ask pdf ai', 'pdf question answering', 'ai document search'],
    features: [
      'Hybrid Vector + BM25 retrieval for high-precision fact retrieval',
      'Grounded citations: every answer references exact page numbers and source quotes',
      'Zero-hallucination constraint architecture',
    ],
    howToSteps: [
      { name: 'Upload Document', text: 'Select your PDF document.' },
      { name: 'Ask a Question', text: 'Type your query (e.g. "What are the termination penalties?").' },
      { name: 'Get Answer', text: 'Receive verified answers with clickable page citations.' },
    ],
    faqs: [
      { question: 'How does it prevent hallucinations?', answer: 'The model is strictly constrained to retrieved context chunks and must provide direct source quotes for every claim.' },
    ],
  },
  'draw-signature': {
    slug: 'draw-signature',
    title: 'Draw & Compress Signature (<30 KB)',
    metaTitle: 'Draw & Compress Signature Online — Free Govt Exam & Portal Ready | DocPlatform',
    metaDescription: 'Draw your official digital signature or compress signature photos under 20KB, 30KB, or 50KB for UPSC, SSC, Defense, and Govt exam portal uploads.',
    canonicalUrl: 'https://docplatform.app/draw-signature',
    keywords: ['draw signature', 'compress signature under 30kb', 'signature photo resize for exam', 'online signature pad', 'signature under 20kb'],
    features: [
      'Interactive online signature drawing board with ink color & stroke controls',
      'One-click compression strictly under 20 KB, 30 KB, or 50 KB',
      'Clean white background JPG or transparent PNG export',
      'Govt, Army, UPSC, and SSC exam form ready',
    ],
    howToSteps: [
      { name: 'Draw or Upload', text: 'Draw your signature on screen or upload a photo of your signature.' },
      { name: 'Select Size Limit', text: 'Choose your target size preset (e.g. Under 30 KB JPG).' },
      { name: 'Download', text: 'Instantly download your portal-ready compressed signature.' },
    ],
    faqs: [
      { question: 'Will my signature file be under 30 KB?', answer: 'Yes! The compressor algorithm automatically optimizes and guarantees the output image size is strictly below your selected limit.' },
    ],
  },
  'pdf-to-markdown': {
    slug: 'pdf-to-markdown',
    title: 'PDF to Markdown (.md) Converter',
    metaTitle: 'Convert PDF to Markdown Online — Free Structured MD with Tables | DocPlatform',
    metaDescription: 'Convert PDF documents to clean GitHub Flavored Markdown (.md) with preserved headings, bullet lists, code blocks, and formatted tables for LLMs, RAG, and docs.',
    canonicalUrl: 'https://docplatform.app/pdf-to-markdown',
    keywords: ['pdf to markdown', 'convert pdf to md', 'pdf to markdown online', 'pdf table to markdown', 'pdf to md for llm', 'pdf to markdown free'],
    features: [
      'Preserves structural headings (H1, H2, H3), bold text, and lists',
      'Converts vector tables into clean Markdown tables (| Col 1 | Col 2 |)',
      'Optimized for LLM prompts, RAG vector search, and documentation',
      '100% private local in-browser processing with zero cloud data retention',
    ],
    howToSteps: [
      { name: 'Upload PDF', text: 'Select or drag your PDF document into the converter.' },
      { name: 'Configure Options', text: 'Choose table formatting and heading sensitivity.' },
      { name: 'Convert & Copy/Download', text: 'Instantly download your clean .md file or copy Markdown to clipboard.' },
    ],
    faqs: [
      { question: 'Does this converter preserve tables in Markdown?', answer: 'Yes! Complex tables are parsed and rendered as clean GitHub-Flavored Markdown tables.' },
      { question: 'Can I use the output for LLM prompts and RAG?', answer: 'Absolutely. The extracted Markdown is structured specifically for token efficiency in LLM context windows.' },
    ],
  },
  'markdown-to-pdf': {
    slug: 'markdown-to-pdf',
    title: 'Markdown to PDF Converter',
    metaTitle: 'Convert Markdown to PDF Online — High-Fidelity Vector Document | DocPlatform',
    metaDescription: 'Convert Markdown (.md) files or documentation into print-ready, beautifully styled PDF documents with syntax highlighting, tables, and typography.',
    canonicalUrl: 'https://docplatform.app/markdown-to-pdf',
    keywords: ['markdown to pdf', 'convert md to pdf', 'md to pdf online', 'markdown document to pdf', 'markdown print pdf'],
    features: [
      'Clean typography with GitHub Modern, Academic, and Minimal themes',
      'Supports code blocks, blockquotes, math syntax, and tables',
      'Configurable page sizes (A4, US Letter) with clean margins',
      'Instant client-side vector PDF generation',
    ],
    howToSteps: [
      { name: 'Upload or Paste Markdown', text: 'Drop your .md file or paste raw Markdown into the editor.' },
      { name: 'Select Theme', text: 'Choose your preferred styling theme (Modern, Academic, Minimal).' },
      { name: 'Download PDF', text: 'Download your high-resolution vector PDF in seconds.' },
    ],
    faqs: [
      { question: 'Are code blocks styled properly?', answer: 'Yes, code blocks include clean monospaced styling and formatting.' },
    ],
  },
  'gst-invoice-pdf': {
    slug: 'gst-invoice-pdf',
    title: 'GST & Tax Invoice Generator',
    metaTitle: 'Free GST Invoice Generator Online — Tax Compliant Invoice with UPI QR | DocPlatform',
    metaDescription: 'Create, customize, and download professional GST-compliant tax invoices with automatic CGST/SGST/IGST tax calculation, amount in words, and dynamic UPI QR codes.',
    canonicalUrl: 'https://docplatform.app/gst-invoice-pdf',
    keywords: ['gst invoice generator', 'free tax invoice maker', 'gst bill generator online', 'invoice with upi qr code', 'indian gst invoice maker'],
    features: [
      'Automatic CGST, SGST, and IGST calculation with HSN/SAC code support',
      'Embedded dynamic UPI payment QR code for instant mobile scan-and-pay',
      'Automated Amount in Words conversion (Rupees Lakhs & Crores)',
      '100% private in-browser generation — zero financial data sent to servers',
    ],
    howToSteps: [
      { name: 'Enter Business & Client Details', text: 'Add seller and buyer info, GSTIN numbers, and invoice date.' },
      { name: 'Add Line Items', text: 'Add items, rates, and GST rates — totals and taxes calculate automatically.' },
      { name: 'Download PDF', text: 'Download your professional, print-ready GST tax invoice with UPI QR code.' },
    ],
    faqs: [
      { question: 'Does this invoice comply with Indian GST laws?', answer: 'Yes. It contains all mandatory fields including GSTIN, HSN codes, state codes, intra/inter-state tax split, and reverse charge options.' },
      { question: 'Can customers pay via the QR code on the invoice?', answer: 'Yes! The dynamic UPI QR code encodes your VPA and the exact invoice amount, allowing instant scan-and-pay via GPay, PhonePe, Paytm, or BHIM.' },
    ],
  },
  'pos-billing': {
    slug: 'pos-billing',
    title: 'Minimal POS Billing & Thermal Slip Maker',
    metaTitle: 'Free Minimal POS Billing & Thermal Receipt Maker | DocPlatform',
    metaDescription: 'Generate clean retail counter bills and standard 80mm thermal receipt slips with itemized pricing, discounts, tax, and scannable UPI QR payment.',
    canonicalUrl: 'https://docplatform.app/pos-billing',
    keywords: ['pos billing', 'thermal receipt maker', 'retail counter billing', 'thermal bill generator', 'pos receipt online free'],
    features: [
      'Compact 80mm & 58mm thermal printer roll format ready for direct printing',
      'Dynamic UPI QR code for instant counter scan-and-pay',
      'Itemized pricing with discount %, tax %, and real-time total calculations',
      '100% private in-browser generation with zero cloud storage',
    ],
    howToSteps: [
      { name: 'Enter Store & Order Info', text: 'Set your merchant/store name, cashier ID, and receipt order number.' },
      { name: 'Add Bill Items', text: 'Quickly enter items, quantities, and rates with auto-calculating subtotals.' },
      { name: 'Print or Download', text: 'Click Print Thermal Slip or Download PDF for instant paperless receipt generation.' },
    ],
    faqs: [
      { question: 'Can I print this on a standard thermal POS printer?', answer: 'Yes! The layout is optimized for standard 80mm thermal receipt printers as well as standard office printers.' },
      { question: 'Can customers pay directly using the receipt QR code?', answer: 'Yes! Simply enter your UPI ID and the receipt generates a dynamic NPCI UPI QR code with the exact bill amount.' },
    ],
  },
  'clean-billing': {
    slug: 'clean-billing',
    title: 'Minimal POS Billing & Thermal Slip Maker',
    metaTitle: 'Free Minimal POS Billing & Thermal Receipt Maker | DocPlatform',
    metaDescription: 'Generate clean retail counter bills and standard 80mm thermal receipt slips with itemized pricing, discounts, tax, and scannable UPI QR payment.',
    canonicalUrl: 'https://docplatform.app/clean-billing',
    keywords: ['pos billing', 'clean billing', 'thermal receipt maker', 'retail counter billing'],
    features: [
      'Compact 80mm & 58mm thermal printer roll format ready for direct printing',
      'Dynamic UPI QR code for instant counter scan-and-pay',
      'Itemized pricing with discount %, tax %, and real-time total calculations',
      '100% private in-browser generation with zero cloud storage',
    ],
    howToSteps: [
      { name: 'Enter Store & Order Info', text: 'Set your merchant/store name, cashier ID, and receipt order number.' },
      { name: 'Add Bill Items', text: 'Quickly enter items, quantities, and rates with auto-calculating subtotals.' },
      { name: 'Print or Download', text: 'Click Print Thermal Slip or Download PDF for instant paperless receipt generation.' },
    ],
    faqs: [
      { question: 'Is clean billing free?', answer: 'Yes, 100% free with unlimited receipts and zero sign-up required.' },
    ],
  },
  'tax-receipt': {
    slug: 'tax-receipt',
    title: 'Tax Receipt & 80G Donation Receipt Maker',
    metaTitle: 'Free Tax Receipt & 80G Donation Receipt Generator | DocPlatform',
    metaDescription: 'Create official Section 80G donation receipts, charitable trust tax deduction slips, and income tax deduction certificates with Rupee words and digital seal.',
    canonicalUrl: 'https://docplatform.app/tax-receipt',
    keywords: ['tax receipt maker', '80g donation receipt', 'charity tax receipt generator', 'donation receipt online', 'income tax 80g certificate'],
    features: [
      'Compliant with Section 80G and 12A trust receipt guidelines',
      'Automated Amount in Words conversion in Indian numbering (Rupees Lakhs & Crores)',
      'Statutory tax exemption declaration clause with Trust PAN and 80G URN',
      'Official seal, stamp, and authorized signatory signature block',
    ],
    howToSteps: [
      { name: 'Enter Trust / NGO Info', text: 'Provide organization name, registration number, 80G URN, and address.' },
      { name: 'Enter Donor Details', text: 'Add donor name, PAN number, address, and donation amount.' },
      { name: 'Download PDF', text: 'Download official certificate-grade tax deduction receipt instantly.' },
    ],
    faqs: [
      { question: 'Is this receipt valid for claiming income tax deduction?', answer: 'Yes, when issued by an eligible registered trust with valid 80G registration numbers and donor PAN.' },
    ],
  },
  'estimate-maker': {
    slug: 'estimate-maker',
    title: 'Estimates & Quotation Maker',
    metaTitle: 'Free Business Estimate & Quotation Maker Online | DocPlatform',
    metaDescription: 'Generate professional project estimates, client sales quotations, and proforma proposals with scope of work, validity timelines, and acceptance sign-offs.',
    canonicalUrl: 'https://docplatform.app/estimate-maker',
    keywords: ['estimate maker', 'quotation generator', 'project estimate pdf', 'sales quote maker', 'proforma quote online'],
    features: [
      'Professional agency and business proposal format with project title and scope',
      'Line items table with deliverables, units, quantities, and rates',
      'Configurable validity timeline and commercial payment terms',
      'Client acceptance signature block for quick formal sign-off',
    ],
    howToSteps: [
      { name: 'Enter Business & Client Details', text: 'Add your business branding and client recipient info.' },
      { name: 'Define Scope & Deliverables', text: 'Add line items, units, quantities, and pricing.' },
      { name: 'Download Proposal PDF', text: 'Download a clean, high-resolution vector PDF quotation ready to send.' },
    ],
    faqs: [
      { question: 'Can I add custom payment terms to the quote?', answer: 'Yes! You can specify delivery timelines, advance payment requirements, and terms directly on the estimate.' },
    ],
  },
  'flatten-pdf': {
    slug: 'flatten-pdf',
    title: 'Flatten PDF Online',
    metaTitle: 'Flatten PDF Online — Lock Form Fields & Annotations Free | DocPlatform',
    metaDescription: 'Flatten interactive PDF forms, annotations, and markup layers into non-editable, read-only static pages.',
    canonicalUrl: 'https://docplatform.app/flatten-pdf',
    keywords: ['flatten pdf', 'make pdf read only', 'lock form fields pdf', 'flatten annotations'],
    features: [
      'Bakes interactive AcroForm text fields into immutable vector content',
      'Flattens digital signatures, highlight annotations, and comments',
      'Prevents tampering or post-signing form alterations',
    ],
    howToSteps: [
      { name: 'Upload PDF', text: 'Drop your fillable PDF form or marked-up document.' },
      { name: 'Flatten', text: 'Our engine renders all form values directly into the page geometry.' },
      { name: 'Download', text: 'Download your static, tamper-proof PDF.' },
    ],
    faqs: [
      { question: 'Can form fields still be edited after flattening?', answer: 'No. Flattening converts active form inputs into permanent vector page elements, making them impossible to alter.' },
    ],
  },
  'repair-pdf': {
    slug: 'repair-pdf',
    title: 'Repair PDF Online',
    metaTitle: 'Repair PDF Online — Fix Corrupted & Broken PDF Files Free | DocPlatform',
    metaDescription: 'Recover and restore corrupted, unreadable, or broken PDF documents with automatic XRef reconstruction and stream decompression.',
    canonicalUrl: 'https://docplatform.app/repair-pdf',
    keywords: ['repair pdf', 'fix corrupted pdf', 'restore broken pdf', 'recover damaged pdf file'],
    features: [
      'Reconstructs damaged cross-reference (XRef) tables and trailers',
      'Recovers readable content from truncated or broken byte streams',
      '100% private local repair with zero data retention',
    ],
    howToSteps: [
      { name: 'Upload Corrupted PDF', text: 'Select the broken or unreadable PDF file.' },
      { name: 'Analyze & Repair', text: 'The engine parses corrupted byte offsets and reconstructs valid PDF structures.' },
      { name: 'Download Restored PDF', text: 'Download your recovered, fully readable document.' },
    ],
    faqs: [
      { question: 'Can all damaged PDFs be repaired?', answer: 'Our multi-stage recovery fixes standard byte corruption, broken XRefs, and stream errors. Files with completely overwritten bytes may only be partially recovered.' },
    ],
  },
  'page-numbers-pdf': {
    slug: 'page-numbers-pdf',
    title: 'Add Page Numbers to PDF',
    metaTitle: 'Add Page Numbers to PDF Online — Custom Numbering & Headers | DocPlatform',
    metaDescription: 'Insert automated page numbers and headers/footers to your PDF documents with customizable positioning, font size, and numbering formats.',
    canonicalUrl: 'https://docplatform.app/page-numbers-pdf',
    keywords: ['page numbers pdf', 'add page numbers to pdf', 'number pdf pages online', 'pdf header footer'],
    features: [
      'Custom placement: Top-Left, Top-Center, Top-Right, Bottom-Left, Bottom-Center, Bottom-Right',
      'Format styles: "1", "Page 1", "Page 1 of N", and Roman numerals',
      'Exclude cover page and set custom starting page numbers',
    ],
    howToSteps: [
      { name: 'Upload PDF', text: 'Select your document.' },
      { name: 'Choose Position & Format', text: 'Pick header or footer alignment and numbering style.' },
      { name: 'Download Numbered PDF', text: 'Download your cleanly paginated document.' },
    ],
    faqs: [
      { question: 'Can I skip numbering on the first page?', answer: 'Yes, check "Exclude First Page" to keep cover pages clean.' },
    ],
  },
  'strip-metadata-pdf': {
    slug: 'strip-metadata-pdf',
    title: 'Privacy Scanner & Strip PDF Metadata',
    metaTitle: 'Privacy Scanner & Strip PDF Metadata — Purge Tracking & PII | DocPlatform',
    metaDescription: 'Sanitize PDF files by permanently removing hidden author names, timestamps, software history, GPS tags, and embedded metadata.',
    canonicalUrl: 'https://docplatform.app/strip-metadata-pdf',
    keywords: ['strip pdf metadata', 'pdf privacy scanner', 'remove author from pdf', 'sanitize pdf online'],
    features: [
      'Purges standard Info dictionary (Author, Creator, Producer, ModDate)',
      'Removes XMP metadata streams and hidden software footprints',
      '100% private local client-side sanitation',
    ],
    howToSteps: [
      { name: 'Upload PDF', text: 'Drop your document into the Privacy Scanner.' },
      { name: 'Scan & Strip', text: 'Review hidden metadata and click "Sanitize Document".' },
      { name: 'Download Clean PDF', text: 'Download a clean document with zero tracking fingerprints.' },
    ],
    faqs: [
      { question: 'Does stripping metadata change document text or formatting?', answer: 'No. Only hidden metadata streams and tracking properties are removed. All visible text and layouts remain identical.' },
    ],
  },
  'ai-extract-table': {
    slug: 'ai-extract-table',
    title: 'Extract Tables from PDF (AI Table Extractor)',
    metaTitle: 'AI PDF Table Extractor — Extract Tables to Excel & JSON | DocPlatform',
    metaDescription: 'Extract complex and unstructured tabular data from PDF invoices, statements, and reports into structured Excel (.xlsx), CSV, and JSON.',
    canonicalUrl: 'https://docplatform.app/ai-extract-table',
    keywords: ['extract tables from pdf', 'ai table extractor', 'pdf table to excel', 'convert pdf table to json'],
    features: [
      'Combines Python coordinate layout parsing with AI table reconstruction',
      'Extracts structured CSV, clean Excel (.xlsx), and JSON data',
      'Handles borderless tables, multi-line cells, and financial statements',
    ],
    howToSteps: [
      { name: 'Upload PDF', text: 'Select your tabular document or invoice.' },
      { name: 'Extract Tables', text: 'The engine identifies row/column boundaries and cell alignments.' },
      { name: 'Download Data', text: 'Download as Excel workbook, CSV, or raw JSON.' },
    ],
    faqs: [
      { question: 'Does it work on borderless tables?', answer: 'Yes! Our geometric analysis detects text alignment gaps even when tables have no visible border lines.' },
    ],
  },
  'extract-pages': {
    slug: 'extract-pages',
    title: 'Extract PDF Pages Online',
    metaTitle: 'Extract PDF Pages Online — Save Specific Pages Free | DocPlatform',
    metaDescription: 'Extract specific pages or page ranges from any PDF document into a clean, unified new file.',
    canonicalUrl: 'https://docplatform.app/extract-pages',
    keywords: ['extract pdf pages', 'save specific pages pdf', 'extract pages online'],
    features: [
      'Extract single pages or custom ranges (e.g. 1-3, 5, 8-10)',
      'Instant client-side vector extraction with zero quality loss',
      'Preserves original bookmarks and links',
    ],
    howToSteps: [
      { name: 'Upload PDF', text: 'Drop your document into the extractor.' },
      { name: 'Enter Pages', text: 'Specify the page numbers to extract.' },
      { name: 'Save', text: 'Download your extracted PDF.' },
    ],
    faqs: [
      { question: 'Can I extract non-consecutive pages?', answer: 'Yes! Simply separate individual pages or ranges with commas.' },
    ],
  },
};

// Aliases for friendly routing slugs
if (TOOL_REGISTRY['ai-ask']) {
  TOOL_REGISTRY['chat-with-pdf'] = {
    ...TOOL_REGISTRY['ai-ask'],
    slug: 'chat-with-pdf',
    canonicalUrl: 'https://docplatform.app/chat-with-pdf',
  };
}
if (TOOL_REGISTRY['pos-billing']) {
  TOOL_REGISTRY['clean-billing'] = {
    ...TOOL_REGISTRY['pos-billing'],
    slug: 'clean-billing',
    canonicalUrl: 'https://docplatform.app/clean-billing',
  };
}
if (TOOL_REGISTRY['gst-invoice-pdf']) {
  TOOL_REGISTRY['gst-invoice'] = {
    ...TOOL_REGISTRY['gst-invoice-pdf'],
    slug: 'gst-invoice',
    canonicalUrl: 'https://docplatform.app/gst-invoice',
  };
}

/**
 * Generates JSON-LD Structured Data for Google Search Engine Optimization
 */
export function generateToolJsonLd(config: ToolSeoConfig) {
  const webAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: config.title,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'All',
    url: config.canonicalUrl,
    description: config.metaDescription,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };

  const howToSchema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: `How to ${config.title}`,
    step: config.howToSteps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
    })),
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: config.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return {
    webAppSchema,
    howToSchema,
    faqSchema,
  };
}
