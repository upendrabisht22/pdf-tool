/**
 * @file types.ts
 * @description Canonical domain models, state machines, and contracts for the Document Utility Platform.
 */

// ============================================================================
// 1. OPERATION TYPES
// ============================================================================

export type OperationType =
  | 'merge-pdf'
  | 'split-pdf'
  | 'compress-pdf'
  | 'rotate-pdf'
  | 'reorder-pdf'
  | 'delete-pages'
  | 'extract-pages'
  | 'image-to-pdf'
  | 'pdf-to-image'
  | 'word-to-pdf'
  | 'pdf-to-word'
  | 'excel-to-pdf'
  | 'pdf-to-excel'
  | 'powerpoint-to-pdf'
  | 'ppt-to-pdf'
  | 'sign-pdf'
  | 'flatten-pdf'
  | 'redact-pdf'
  | 'ocr-pdf'
  | 'compare-pdf'
  | 'watermark-pdf'
  | 'page-numbers-pdf'
  | 'protect-pdf'
  | 'unlock-pdf'
  | 'repair-pdf'
  | 'strip-metadata-pdf'
  | 'ai-summarize'
  | 'ai-ask'
  | 'ai-extract-table'
  | 'pdf-to-markdown'
  | 'markdown-to-pdf'
  | 'gst-invoice-pdf'
  | 'pipeline';

// ============================================================================
// 2. JOB STATE MACHINE
// ============================================================================

export type JobStatus =
  | 'CREATED'
  | 'QUEUED'
  | 'PROCESSING'
  | 'VALIDATING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'EXPIRED';

export const VALID_JOB_TRANSITIONS: Record<JobStatus, readonly JobStatus[]> = {
  CREATED: ['QUEUED', 'EXPIRED', 'CANCELLED'],
  QUEUED: ['PROCESSING', 'CANCELLED', 'EXPIRED'],
  PROCESSING: ['VALIDATING', 'FAILED', 'CANCELLED'],
  VALIDATING: ['COMPLETED', 'FAILED', 'CANCELLED'],
  COMPLETED: ['EXPIRED'],
  FAILED: ['QUEUED', 'EXPIRED'], // Allows retry
  CANCELLED: ['EXPIRED'],
  EXPIRED: [],
};

// ============================================================================
// 3. FILE ENTITIES & METADATA
// ============================================================================

export interface FileMetadata {
  id: string;
  ownerId?: string | null;
  sessionId?: string | null;
  originalFilename: string;
  sanitizedFilename: string;
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
  sha256Hash: string;
  pageCount?: number | null;
  createdAt: Date;
  expiresAt: Date;
  isDeleted: boolean;
}

export interface ValidatedFile {
  fileId: string;
  storageKey: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  detectedFormat: string;
  pageCount?: number;
}

// ============================================================================
// 4. OPERATION OPTIONS SPECIFICATIONS
// ============================================================================

export interface MergePdfOptions {
  preserveBookmarks?: boolean;
  normalizePageSizes?: boolean;
}

export interface SplitPdfOptions {
  mode: 'all-pages' | 'ranges' | 'fixed-chunks';
  ranges?: string[]; // e.g. ["1-3", "4-5", "6"]
  chunkSize?: number;
}

export interface CompressPdfOptions {
  level: 'extreme' | 'recommended' | 'low';
  targetDpi?: number;
  imageQualityPercent?: number;
}

export interface RotatePdfOptions {
  rotation: 90 | 180 | 270;
  targetPages: 'all' | 'odd' | 'even' | number[];
}

export interface ReorderDeletePagesOptions {
  pageOrder: number[]; // 1-indexed page array in desired order. Omitted pages are deleted.
}

export interface ExtractPagesOptions {
  pages: number[]; // 1-indexed page numbers to extract
  combineIntoSingleFile?: boolean;
}

export interface ImageToPdfOptions {
  pageSize: 'A4' | 'LETTER' | 'FIT_IMAGE' | 'AUTO';
  orientation: 'portrait' | 'landscape' | 'auto';
  marginPx?: number;
}

export interface PdfToImageOptions {
  format: 'png' | 'jpeg' | 'webp';
  dpi: number;
  pages?: number[] | 'all';
}

// ============================================================================
// Sprint A Operation Options
// ============================================================================

export type WatermarkPosition =
  | 'center'
  | 'top-left' | 'top-center' | 'top-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right'
  | 'diagonal';

export interface WatermarkPdfOptions {
  text: string;
  /** Font size in points. Default: 48 */
  fontSize?: number;
  /** Opacity 0.0 – 1.0. Default: 0.3 */
  opacity?: number;
  /** Hex color string. Default: '#888888' */
  color?: string;
  /** Degrees counter-clockwise. Default: 45 for diagonal, 0 for fixed positions */
  rotation?: number;
  position?: WatermarkPosition;
  /** Apply to all pages or specific 1-indexed page numbers */
  pages?: 'all' | number[];
}

export type PageNumberPosition =
  | 'bottom-center'
  | 'bottom-right'
  | 'bottom-left'
  | 'top-center'
  | 'top-right'
  | 'top-left';

export interface PageNumbersPdfOptions {
  position?: PageNumberPosition;
  /** Template. Use {page} and {total}. Default: '{page}' */
  template?: string;
  fontSize?: number;
  /** Hex color. Default: '#000000' */
  color?: string;
  /** Starting page number. Default: 1 */
  startAt?: number;
  /** Margin from edge in points. Default: 20 */
  margin?: number;
}

export interface ProtectPdfOptions {
  /** Password required to open the document */
  userPassword: string;
  /** Optional owner password for permission control */
  ownerPassword?: string;
  /** Permissions to restrict. Default: allow all */
  permissions?: {
    allowPrinting?: boolean;
    allowCopying?: boolean;
    allowModifying?: boolean;
    allowAnnotating?: boolean;
  };
}

export interface UnlockPdfOptions {
  /** Password to remove from document */
  password: string;
}

export interface RepairPdfOptions {
  /** If true, strips non-standard extensions to maximise recoverability. Default: true */
  aggressiveRecovery?: boolean;
}

export interface StripMetadataPdfOptions {
  /** Strip author, creator, producer. Default: true */
  stripAuthorInfo?: boolean;
  /** Strip creation and modification dates. Default: true */
  stripDates?: boolean;
  /** Strip custom metadata streams (XMP). Default: true */
  stripXmp?: boolean;
  /** Strip document ID. Default: true */
  stripDocumentId?: boolean;
}

// ============================================================================
// Sprint C Operation Options (Office to PDF)
// ============================================================================

export interface WordToPdfOptions {
  /** Page orientation override. Default: 'auto' (respects docx layout) */
  orientation?: 'auto' | 'portrait' | 'landscape';
  /** Target PDF standard format */
  pdfStandard?: 'default' | 'pdf-a-1b' | 'pdf-a-2b';
  /** Whether to export tracked changes and comments */
  includeComments?: boolean;
}

export interface ExcelToPdfOptions {
  /** Fit all columns or sheets to single page width. Default: false */
  fitToPageWidth?: boolean;
  /** Page orientation. Default: 'landscape' for wide spreadsheets */
  orientation?: 'auto' | 'portrait' | 'landscape';
  /** Print gridlines even if hidden. Default: true */
  renderGridlines?: boolean;
  /** Specific sheet names or indices to render (default: all visible sheets) */
  sheets?: 'all' | (string | number)[];
}

export interface PowerPointToPdfOptions {
  /** Include hidden slides. Default: false */
  includeHiddenSlides?: boolean;
  /** Layout mode. Default: 'slides' */
  layout?: 'slides' | 'handouts-3' | 'handouts-6' | 'notes';
  /** High quality vector export. Default: true */
  highQuality?: boolean;
}

// ============================================================================
// Sprint D Operation Options (PDF to Image, E-Signatures, Flatten)
// ============================================================================

export type SignatureType = 'text' | 'initials' | 'stamp';

export interface SignaturePlacement {
  /** 1-indexed page number to place the signature on */
  page: number;
  /** X position from left edge of page in points */
  x: number;
  /** Y position from bottom edge of page in points */
  y: number;
  /** Width of the signature block in points. Default: 150 */
  width?: number;
  /** Height of the signature block in points. Default: 50 */
  height?: number;
}

export interface SignPdfOptions {
  /** Type of signature to apply */
  type: SignatureType;
  /**
   * Full name text to render as a signature.
   * Used for both 'text' (cursive style) and 'initials' (abbreviated) types.
   */
  name: string;
  /** Optional signing date string to appear below the signature. Default: today's date (ISO) */
  date?: string;
  /** Optional label text below signature e.g. 'Director, Sales'. Default: '' */
  title?: string;
  /** One or more signature placements on specific pages */
  placements: SignaturePlacement[];
  /** Hex color of signature ink. Default: '#1a3a6b' (professional navy blue) */
  color?: string;
  /** Whether to add a thin rounded border box around each signature block. Default: true */
  showBorder?: boolean;
  /** Whether to add a date line under signature. Default: true */
  showDate?: boolean;
}

export interface FlattenPdfOptions {
  /**
   * Whether to flatten interactive form fields (AcroForm) into static content.
   * Filled form data becomes part of the visual page — cannot be edited again.
   * Default: true
   */
  flattenForms?: boolean;
  /**
   * Whether to flatten annotations (comments, highlights, stamps).
   * Default: true
   */
  flattenAnnotations?: boolean;
  /**
   * Whether to flatten digital signature widgets into static visual marks.
   * Note: This removes cryptographic signature validity.
   * Default: false
   */
  flattenSignatures?: boolean;
}

// ============================================================================
// Sprint E Operation Options (PDF to Word/Excel, Redaction)
// ============================================================================

export interface PdfToWordOptions {
  /** Layout reconstruction mode: 'flowing' (editable text) or 'exact' (fixed frames). Default: 'flowing' */
  preserveLayout?: 'flowing' | 'exact';
  /** Whether to extract and embed vector graphics & images. Default: true */
  includeImages?: boolean;
  /** Specific page range or 'all'. Default: 'all' */
  pages?: 'all' | number[];
}

export interface PdfToExcelOptions {
  /** Table extraction algorithm: 'auto' | 'lines' | 'whitespace'. Default: 'auto' */
  detectionMode?: 'auto' | 'lines' | 'whitespace';
  /** Put each page into a separate worksheet tab. Default: true */
  separateSheetsPerPage?: boolean;
  /** Automatically format numerical/currency cells. Default: true */
  formatNumbers?: boolean;
  /** Specific page range or 'all'. Default: 'all' */
  pages?: 'all' | number[];
}

export interface RedactionBox {
  /** 1-indexed page number */
  page: number;
  /** X coordinate from bottom-left origin in points */
  x: number;
  /** Y coordinate from bottom-left origin in points */
  y: number;
  /** Box width in points */
  width: number;
  /** Box height in points */
  height: number;
  /** Overlay fill color. Default: '#000000' (solid black) */
  color?: string;
  /** Optional text replacement over redacted box e.g. '[REDACTED]'. Default: '' */
  replacementLabel?: string;
}

export interface RedactPdfOptions {
  /** Specific coordinate bounding boxes to permanently redact */
  boxes: RedactionBox[];
  /**
   * Whether to sanitize metadata, search index, and outlines so redacted terms
   * cannot be searched or copied from document properties.
   * Default: true
   */
  sanitizeMetadata?: boolean;
  /**
   * Whether to scrub underlying text streams and vector glyphs beneath the box
   * (Zero-leak production guarantee).
   * Default: true
   */
  zeroLeakScrub?: boolean;
}

// ============================================================================
// Sprint F Operation Options (OCR, PDF Compare / Diff)
// ============================================================================

export interface OcrPdfOptions {
  /** Language model for optical character recognition. Default: 'eng' */
  language?: 'eng' | 'hin' | 'spa' | 'fra' | 'deu' | 'ara' | 'chi_sim' | string;
  /** Output type: 'searchable-pdf' (Sandwich PDF with invisible text), 'text', or 'json-hocr' */
  outputType?: 'searchable-pdf' | 'text' | 'json';
  /** Target resolution DPI for preprocessing rasterization. Default: 300 */
  dpi?: number;
  /** Automatically deskew and rotate pages before recognition. Default: true */
  autoRotate?: boolean;
  /** Clean speckles and background scanner artifacts. Default: true */
  despeckle?: boolean;
  /** Specific page numbers to OCR or 'all'. Default: 'all' */
  pages?: 'all' | number[];
}

export interface ComparePdfOptions {
  /** Comparison mode: 'visual-diff' (colored overlay) | 'side-by-side' | 'summary-only' */
  mode?: 'visual-diff' | 'side-by-side' | 'summary-only';
  /** Highlight color for added content in modified doc. Default: '#00E5FF' (cyan) */
  colorAdded?: string;
  /** Highlight color for removed content from base doc. Default: '#FF0055' (crimson) */
  colorRemoved?: string;
  /** Difference detection sensitivity threshold (0.01 - 1.0). Default: 0.1 */
  sensitivityThreshold?: number;
}

// ============================================================================
// Sprint G Operation Options (AI Intelligence & Workflow Pipeline)
// ============================================================================

export interface AiSummarizeOptions {
  /** Target summary length: 'brief' (1 paragraph) | 'executive' (bullets + metrics) | 'deep' (full section analysis) */
  mode?: 'brief' | 'executive' | 'deep';
  /** Focus area: 'all' | 'financials' | 'legal-obligations' | 'action-items' */
  focusArea?: 'all' | 'financials' | 'legal-obligations' | 'action-items';
  /** Target language for summary. Default: 'en' */
  targetLanguage?: string;
  /** Max words in summary output. Default: 500 */
  maxWordCount?: number;
  /** BYOK: User's Gemini API key for live summarization. When absent, falls back to offline heuristics. */
  apiKey?: string;
}

export interface AiCitation {
  pageNumber: number;
  snippetText: string;
  relevanceScore: number;
}

export interface AiAskOptions {
  /** User question or query against document */
  question: string;
  /** Require grounded page citations in answer. Default: true */
  requireCitations?: boolean;
  /** Top-K relevant chunks to retrieve for context. Default: 4 */
  topKChunks?: number;
  /** Specific page range to restrict search to */
  pageRange?: 'all' | number[];
  /** BYOK: User's Gemini API key for live Q&A. When absent, falls back to offline BM25 heuristics. */
  apiKey?: string;
}

export interface AiExtractTableOptions {
  /** Target schema definition (field names and expected data types) */
  schema?: Record<string, 'string' | 'number' | 'date' | 'boolean'>;
  /** Output format: 'json' | 'csv' | 'markdown' */
  format?: 'json' | 'csv' | 'markdown';
  /** BYOK: User's Gemini API key for multimodal vision table extraction fallback. */
  apiKey?: string;
}

export interface PdfToMarkdownOptions {
  extractTables?: boolean;
  includePageBreaks?: boolean;
  headingSensitivity?: 'low' | 'medium' | 'high';
}

export interface MarkdownToPdfOptions {
  theme?: 'github' | 'academic' | 'modern' | 'minimal';
  pageSize?: 'A4' | 'Letter';
}

export interface GstInvoiceItem {
  id: string;
  description: string;
  hsn?: string;
  qty: number;
  rate: number;
  discountPct?: number;
  gstRate: number; // 0, 5, 12, 18, 28
}

export interface GstInvoiceOptions {
  seller: {
    name: string;
    gstin?: string;
    pan?: string;
    address: string;
    state: string;
    stateCode?: string;
    phone?: string;
    email?: string;
  };
  buyer: {
    name: string;
    gstin?: string;
    address: string;
    state: string;
    stateCode?: string;
    placeOfSupply?: string;
  };
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  reverseCharge?: boolean;
  taxType?: 'intra' | 'inter' | 'auto';
  currency?: string;
  items: GstInvoiceItem[];
  bankDetails?: {
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    branch?: string;
    upiId?: string;
  };
  notes?: string;
  terms?: string;
  theme?: 'modern' | 'corporate' | 'emerald' | 'minimal';
}

export interface PipelineStep {
  operation: OperationType;
  options: Record<string, unknown>;
}

export interface PipelineOptions {
  /** Ordered list of operations to execute sequentially on the document */
  steps: PipelineStep[];
  /** Stop pipeline immediately if any intermediate step fails. Default: true */
  stopOnError?: boolean;
}

export interface OperationOptionsMap {
  'merge-pdf': MergePdfOptions;
  'split-pdf': SplitPdfOptions;
  'compress-pdf': CompressPdfOptions;
  'rotate-pdf': RotatePdfOptions;
  'reorder-pdf': ReorderDeletePagesOptions;
  'delete-pages': ReorderDeletePagesOptions;
  'extract-pages': ExtractPagesOptions;
  'image-to-pdf': ImageToPdfOptions;
  'pdf-to-image': PdfToImageOptions;
  'watermark-pdf': WatermarkPdfOptions;
  'page-numbers-pdf': PageNumbersPdfOptions;
  'protect-pdf': ProtectPdfOptions;
  'unlock-pdf': UnlockPdfOptions;
  'repair-pdf': RepairPdfOptions;
  'strip-metadata-pdf': StripMetadataPdfOptions;
  'word-to-pdf': WordToPdfOptions;
  'excel-to-pdf': ExcelToPdfOptions;
  'powerpoint-to-pdf': PowerPointToPdfOptions;
  'ppt-to-pdf': PowerPointToPdfOptions;
  'sign-pdf': SignPdfOptions;
  'flatten-pdf': FlattenPdfOptions;
  'pdf-to-word': PdfToWordOptions;
  'pdf-to-excel': PdfToExcelOptions;
  'redact-pdf': RedactPdfOptions;
  'ocr-pdf': OcrPdfOptions;
  'compare-pdf': ComparePdfOptions;
  'ai-summarize': AiSummarizeOptions;
  'ai-ask': AiAskOptions;
  'ai-extract-table': AiExtractTableOptions;
  'pdf-to-markdown': PdfToMarkdownOptions;
  'markdown-to-pdf': MarkdownToPdfOptions;
  'gst-invoice-pdf': GstInvoiceOptions;
  'pipeline': PipelineOptions;
}

// ============================================================================
// 5. JOB PAYLOAD & EXECUTION CONTEXT
// ============================================================================

export interface JobPayload<TOptions = Record<string, unknown>> {
  id: string;
  idempotencyKey?: string;
  userId?: string | null;
  sessionId: string;
  operation: OperationType;
  inputFiles: ValidatedFile[];
  options: TOptions;
  status: JobStatus;
  progressPercent: number;
  attemptCount: number;
  maxRetries: number;
  createdAt: Date;
  startedAt?: Date | null;
  completedAt?: Date | null;
  expiresAt: Date;
  outputFileIds?: string[];
  error?: {
    code: string;
    message: string;
    userAction: string;
    retryable: boolean;
  } | null;
}

export interface WorkerExecutionContext {
  jobId: string;
  workerId: string;
  timeoutMs: number;
  maxMemoryBytes: number;
  tempWorkingDir: string;
  isCancelled: () => boolean;
  onProgress: (percent: number, message?: string) => Promise<void>;
  /** Optional structured logger. Processors should degrade gracefully if absent. */
  log?: (level: 'info' | 'warn' | 'error', message: string, meta?: Record<string, unknown>) => void;
}

export interface ProcessingResult {
  outputFiles: {
    filename: string;
    mimeType: string;
    buffer?: Buffer | Uint8Array;
    localFilePath?: string;
    pageCount?: number;
  }[];
  metrics: {
    durationMs: number;
    inputSizeBytes: number;
    outputSizeBytes: number;
    compressionRatio?: number;
    /** For repair operations: how many pages were successfully recovered */
    pagesRecovered?: number;
    totalPageCount?: number;
  };
}

// ============================================================================
// 6. TIERS, ENTITLEMENTS & QUOTAS
// ============================================================================

export type UserTier = 'ANONYMOUS' | 'FREE' | 'PRO' | 'BUSINESS' | 'ENTERPRISE';

export interface TierQuotaLimits {
  tier: UserTier;
  maxUploadSizeBytes: number;
  maxFilesPerJob: number;
  maxPagesPerDocument: number;
  maxJobsPerHour: number;
  maxConcurrentJobs: number;
  retentionHours: number;
  hasOcrAccess: boolean;
  hasAiAccess: boolean;
  hasPriorityQueue: boolean;
}

export const TIER_LIMITS: Record<UserTier, TierQuotaLimits> = {
  ANONYMOUS: {
    tier: 'ANONYMOUS',
    maxUploadSizeBytes: 50 * 1024 * 1024, // 50MB
    maxFilesPerJob: 10,
    maxPagesPerDocument: 100,
    maxJobsPerHour: 10,
    maxConcurrentJobs: 2,
    retentionHours: 2,
    hasOcrAccess: false,
    hasAiAccess: false,
    hasPriorityQueue: false,
  },
  FREE: {
    tier: 'FREE',
    maxUploadSizeBytes: 100 * 1024 * 1024, // 100MB
    maxFilesPerJob: 20,
    maxPagesPerDocument: 250,
    maxJobsPerHour: 25,
    maxConcurrentJobs: 3,
    retentionHours: 24,
    hasOcrAccess: true,
    hasAiAccess: false,
    hasPriorityQueue: false,
  },
  PRO: {
    tier: 'PRO',
    maxUploadSizeBytes: 500 * 1024 * 1024, // 500MB
    maxFilesPerJob: 100,
    maxPagesPerDocument: 2000,
    maxJobsPerHour: 200,
    maxConcurrentJobs: 10,
    retentionHours: 168, // 7 days
    hasOcrAccess: true,
    hasAiAccess: true,
    hasPriorityQueue: true,
  },
  BUSINESS: {
    tier: 'BUSINESS',
    maxUploadSizeBytes: 2 * 1024 * 1024 * 1024, // 2GB
    maxFilesPerJob: 500,
    maxPagesPerDocument: 10000,
    maxJobsPerHour: 1000,
    maxConcurrentJobs: 25,
    retentionHours: 720, // 30 days
    hasOcrAccess: true,
    hasAiAccess: true,
    hasPriorityQueue: true,
  },
  ENTERPRISE: {
    tier: 'ENTERPRISE',
    maxUploadSizeBytes: 5 * 1024 * 1024 * 1024, // 5GB
    maxFilesPerJob: 2000,
    maxPagesPerDocument: 50000,
    maxJobsPerHour: 10000,
    maxConcurrentJobs: 100,
    retentionHours: 8760, // 365 days
    hasOcrAccess: true,
    hasAiAccess: true,
    hasPriorityQueue: true,
  },
};
