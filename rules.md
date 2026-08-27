# PRODUCTION ENGINEERING RULES & OPERATIONAL PLAYBOOK
**Document Utility & Scalable Document Infrastructure Platform**
*Version: 1.0.0 — Canonical Ruleset for Human Engineers & AI Subagents*

---

## 1. CORE OPERATING PRINCIPLES & PHILOSOPHY

1. **Production-Grade Only**: No demo code, no college-tier scripts, no throwaway prototypes. Every component, interface, and function is designed to scale reliably from 10 to 1,000,000+ users.
2. **Start Economically, Architect for Scale**: Keep fixed infrastructure costs near zero at inception. Add complexity (e.g., dedicated clusters, multi-region) only when justified by measurable traffic, cost savings, or reliability data.
3. **Decoupled Architecture**:
   ```text
   Experience Layer (UI/Client)
           ↓
   Control Plane (Auth, Metadata, Billing, Signed URLs)
           ↓
   Job / Workflow Layer (Queue, State Machine, Idempotency, Backpressure)
           ↓
   Processing Layer (Sandboxed Workers, PDF/OCR/AI Engines)
           ↓
   Storage Layer (Object Store for Binaries, PostgreSQL for Metadata)
   ```
4. **Provider Neutrality**: Never tightly couple business logic to a third-party vendor (e.g., Supabase, Cloudflare R2, Google Cloud Run, Stripe, OpenAI). All external services must sit behind typed Provider Interfaces.
5. **No Outdated Codebases**: All dependencies must use current, LTS/stable, secure versions. Avoid deprecated APIs, abandoned libraries, and obsolete architectural patterns. Lockfile hygiene is strictly enforced.
6. **Flawless Multi-Agent Interoperability**: Every agent session must leave the repository in a fully verified, self-explanatory state. No context or architectural intent is allowed to evaporate into chat history.

---

## 2. MODULAR CODEBASE & REPOSITORY DIRECTORY LAYOUT

Every component must follow a strict modular domain architecture:

```text
/
├── .agents/                      # AI Agent customizations, skills, and meta-rules
│   └── rules/                    # Agent-specific behavioral directives
├── docs/                         # Canonical system documentation
│   ├── PROJECT_STATE.md          # Single source of truth for project phase, status & backlog
│   ├── architecture/             # Architecture documentation & deep dives
│   │   ├── adr/                  # Architecture Decision Records (ADR-0001, ADR-0002, ...)
│   │   ├── system-overview.md
│   │   ├── data-flow.md
│   │   ├── storage-design.md
│   │   ├── queue-design.md
│   │   ├── security-architecture.md
│   │   ├── provider-abstraction.md
│   │   └── cost-model.md
│   ├── privacy/                  # Data retention & privacy specifications
│   ├── operations/               # Runbooks, SLOs, alerts, and incident post-mortems
│   └── sessions/                 # Chronological agent session logs (YYYY-MM-DD/<id>.md)
├── apps/
│   ├── web/                      # Experience Layer (Next.js frontend + SEO landing pages)
│   │   ├── app/                  # App router pages & programmatic tool routes (/merge-pdf, etc.)
│   │   ├── components/           # Accessible, reusable UI components (design system)
│   │   └── lib/                  # Client-side helpers, browser-local processing workers
│   └── control-plane/            # API Control Plane (Fastify / Next API / Node.js)
│       ├── src/
│       │   ├── routes/           # Versioned endpoints (/api/v1/jobs, /api/v1/upload, etc.)
│       │   ├── controllers/      # Request handlers & schema validation
│       │   ├── services/         # Domain business logic (Jobs, Files, Quotas, Billing)
│       │   └── repositories/     # Data access layer (PostgreSQL metadata)
├── packages/
│   ├── core/                     # Shared domain models, types, error taxonomy, schemas (Zod)
│   ├── providers/                # Pluggable provider implementations behind abstract interfaces
│   │   ├── storage/              # R2Storage, S3Storage, GCSStorage, LocalStorage
│   │   ├── auth/                 # SupabaseAuth, FirebaseAuth, CustomJWTAuth
│   │   ├── queue/                # RedisQueue, CloudTasksQueue, InProcessQueue
│   │   ├── pdf-engine/           # PdfLibProcessor, MuPdfProcessor, QpdfProcessor
│   │   ├── ocr-engine/           # TesseractOcr, CloudVisionOcr
│   │   └── ai-engine/            # OpenAIProvider, AnthropicProvider, LocalProvider
│   └── workers/                  # Isolated document processing workers
│       ├── src/
│       │   ├── processors/       # Individual operation handlers (merge, split, compress, etc.)
│       │   ├── sandbox/          # Resource limits, timeout wrappers, process isolation
│       │   └── validator/        # Input magic-byte & output integrity validators
└── fixtures/                     # Standardized test document datasets (corrupt, large, encrypted, edge)
```

---

## 3. STRICT PROVIDER ABSTRACTION CONTRACTS

Core business logic must **never** import vendor SDKs directly. All external systems adhere to pure TypeScript abstract interfaces:

### 3.1 Storage Provider Contract
```typescript
export interface StorageProvider {
  createPresignedUploadUrl(key: string, options: PresignedUrlOptions): Promise<{ url: string; headers?: Record<string, string>; expiresAt: Date }>;
  createPresignedDownloadUrl(key: string, options: PresignedDownloadOptions): Promise<{ url: string; expiresAt: Date }>;
  getObjectStream(key: string): Promise<NodeJS.ReadableStream>;
  putObject(key: string, data: Buffer | Uint8Array | NodeJS.ReadableStream, metadata: ObjectMetadata): Promise<UploadResult>;
  deleteObject(key: string): Promise<void>;
  deleteObjects(keys: string[]): Promise<void>;
  headObject(key: string): Promise<ObjectMetadata | null>;
}
```

### 3.2 PDF / Document Processor Contract
```typescript
export interface DocumentProcessor<TOptions = Record<string, unknown>, TResult = ProcessingResult> {
  readonly operation: OperationType;
  validateInput(inputFiles: ValidatedFile[]): Promise<ValidationResult>;
  process(job: ProcessingJob<TOptions>, context: WorkerExecutionContext): Promise<TResult>;
  validateOutput(outputFilePath: string): Promise<OutputValidationResult>;
  estimateResourceCost(inputFiles: ValidatedFile[], options: TOptions): ResourceEstimate;
}
```

### 3.3 Job & Queue Provider Contract
```typescript
export interface QueueProvider {
  enqueueJob(job: JobPayload): Promise<EnqueueResult>;
  leaseJob(workerId: string, timeoutMs: number): Promise<LeasedJob | null>;
  ackJob(jobId: string, result: JobResultPayload): Promise<void>;
  nackJob(jobId: string, error: ProcessErrorPayload, retryable: boolean): Promise<void>;
  cancelJob(jobId: string): Promise<void>;
  getJobStatus(jobId: string): Promise<JobStatusPayload | null>;
}
```

---

## 4. ZERO-TRUST FILE PIPELINE & SECURITY MANDATES

1. **Never Trust Client Metadata**:
   - Ignore client-provided filenames, extensions, and `Content-Type` headers for security decisions.
   - Inspect raw binary magic bytes (`0x25 0x50 0x44 0x46` for PDF) and parse header structures before processing.
2. **Direct-to-Storage Uploads (No Binary API Proxying)**:
   - Client requests upload auth from Control Plane API.
   - API creates a record with status `PENDING_UPLOAD` and issues a short-lived presigned upload URL (TTL $\le$ 15 min).
   - Client uploads directly to Object Storage.
   - Client notifies API via `/api/v1/jobs` or webhook to initiate processing.
3. **No Permanent Public URLs**:
   - File downloads must use short-lived presigned download URLs (TTL $\le$ 15 min) after authorization verification.
4. **Sandboxed Worker Execution**:
   - Strict resource limits on each job: Max execution time (e.g. 60s default), Max memory (e.g. 512MB–2GB depending on plan), Max file size, Max page count.
   - Disallow arbitrary outbound network calls from worker sandboxes.
   - Immediate temporary file cleanup on disk upon job completion, failure, or cancellation.
5. **Malicious Document & PDF Bomb Protection**:
   - Limit nested object tree depths and uncompressed stream size multipliers.
   - Reject files exceeding decompression ratio safety limits.
6. **Data Retention & Auto-Deletion Lifecycle**:
   - Anonymous job artifacts: Auto-deleted within 1 to 2 hours via Object Store lifecycle TTL policies.
   - Registered free user jobs: Retained according to user preference, max 24 hours default.
   - Sensitive document contents must **never** be logged, sent to analytics, or used for model training without express consent.

---

## 5. JOB LIFECYCLE, STATE MACHINE & IDEMPOTENCY

### 5.1 Canonical Job States
```text
[CREATED] ──► [QUEUED] ──► [PROCESSING] ──► [VALIDATING] ──► [COMPLETED]
    │             │              │               │
    ▼             ▼              ▼               ▼
[EXPIRED]     [CANCELLED]    [FAILED]        [FAILED]
```

### 5.2 Idempotency Rules
- All job creation endpoints must support an `Idempotency-Key` header.
- Workers must check if the job output already exists and is validated before reprocessing.
- If a worker crashes and a job is re-leased, it must clean up intermediate artifacts and restart cleanly without corrupting the database.

### 5.3 Error Classification & Retries
| Error Type | Category | Action | Exponential Backoff? |
| :--- | :--- | :--- | :--- |
| Network timeout to Object Store | Transient | Retry (max 3) | Yes (1s, 4s, 16s) |
| Worker OOM / Pod termination | Transient | Retry (max 2) | Yes |
| Malformed / Encrypted PDF | Deterministic | Fail immediately | No retry |
| File size limit exceeded | Quota / Validation | Fail immediately | No retry |
| Security violation / Bomb | Security | Reject & Log alert | No retry |

---

## 6. CLIENT & BROWSER PROCESSING STRATEGY

1. **Local-First When Practical**:
   - Lightweight client operations (e.g., merge 2 small PDFs, rotate page, reorder, delete page) can run locally inside the browser using WebAssembly / Web Workers (e.g., `@pdf-lib` in WASM).
   - This eliminates bandwidth, cuts server compute cost to zero, and offers maximum user privacy.
2. **Seamless Server Fallback**:
   - If document size exceeds browser memory threshold, mobile device memory is constrained, or operation requires heavy OCR / format conversion (LibreOffice / Tesseract), transparently route to the Cloud Worker pipeline.

---

## 7. SEO, PERFORMANCE & ACCESSIBILITY RULES

1. **SEO as a Core Subsystem**:
   - Every public tool page (e.g. `/merge-pdf`, `/compress-pdf`, `/pdf-to-word`) must provide:
     - Canonical URLs, optimized title & description tags.
     - Structured JSON-LD schema (`WebApplication`, `HowTo`, `FAQPage`).
     - High-quality instructional content, feature specifications, FAQs, and privacy assurances.
     - Fast server-side rendering (SSR) or static generation (SSG).
2. **Core Web Vitals**:
   - LCP < 2.5s, INP < 200ms, CLS < 0.1.
   - Minimal third-party script bloat; zero layout shift during file upload drag-and-drop.
3. **Accessibility (WCAG 2.1 AA Compliant)**:
   - Full keyboard navigability (`Tab`, `Space`, `Enter`, `Escape` for modals).
   - Visible focus indicators on all interactive buttons and dropzones.
   - Screen-reader labels (`aria-label`, `aria-live` regions for upload & processing progress).
   - Color contrast ratio $\ge 4.5:1$ for normal text.

---

## 8. MULTI-AGENT COLLABORATION & CONTEXT PERSISTENCE RULES

Any AI agent operating in this codebase is bound by the following non-negotiable protocols:

### 8.1 Zero Loss of Architectural Context
1. **Mandatory Master State Check**:
   - Before executing code changes, every agent MUST inspect `docs/PROJECT_STATE.md` and read active ADRs in `docs/architecture/adr/`.
2. **Mandatory ADR Creation**:
   - Any architectural decision, engine choice, provider addition, or breaking change requires a new ADR in `docs/architecture/adr/ADR-XXXX-<title>.md` following standard format: Context, Problem, Options, Decision, Tradeoffs, Consequences, Migration.
3. **Mandatory Session Log**:
   - At the conclusion of every work session, the agent MUST write a session file to `docs/sessions/YYYY-MM-DD/<session-id>.md` and update `docs/PROJECT_STATE.md`.

### 8.2 Session Log Template
```markdown
# Session Log: YYYY-MM-DD-<short-id>

## 1. Objective
What was requested and what was the intended outcome.

## 2. Agent Role
(e.g., Agent 0 - Orchestrator, Agent 3 - System Architect, Agent 4 - PDF Engine, Agent 6 - Frontend)

## 3. Work Performed
- Itemized list of concrete actions taken.

## 4. Files Created / Modified
- [Relative path with markdown link] - Summary of changes

## 5. Architectural Decisions Made
- Key choices made (reference ADR number if applicable).

## 6. Verification & Test Results
- Automated commands executed and output status.
- Edge cases tested.

## 7. Open Questions, Technical Debt & Risks
- Document any shortcuts taken or deferred items.

## 8. Handoff Notes & Next Actions for Future Agents
- Explicit instructions for the next agent on exactly what to execute next.
```

### 8.3 Master Project State Machine
The overall platform status must always be explicitly declared in `docs/PROJECT_STATE.md` as one of:
`DISCOVERY` | `ARCHITECTURE` | `FOUNDATION` | `MVP` | `BETA` | `PRODUCTION` | `SCALE` | `ENTERPRISE`

---

## 9. DEFINITION OF DONE (DoD)

A task or feature is marked complete **ONLY** when:
- [ ] Happy path functions reliably across standard test files.
- [ ] Error conditions (malformed files, password-protected, oversized, network drop) produce structured, friendly user messages and proper HTTP error codes.
- [ ] Automated unit tests cover input validation, processor logic, and error handlers.
- [ ] Integration tests verify the end-to-end flow with realistic test fixtures.
- [ ] Sandboxing and resource budgets are enforced.
- [ ] No hardcoded secrets, API keys, or provider-specific coupling exist in domain modules.
- [ ] Observability (structured logging with correlation `job_id`, metric counters) is wired up.
- [ ] Relevant documentation (`docs/architecture/`, `docs/PROJECT_STATE.md`, ADRs) is updated.
- [ ] Session log is written to `docs/sessions/`.

---

## 10. ERROR CODES & SAFE DIAGNOSTICS TAXONOMY

All API and worker errors must return a standardized JSON error envelope:

```json
{
  "error": {
    "code": "FILE_CORRUPTED",
    "message": "The uploaded PDF appears to be corrupted or invalid.",
    "userAction": "Please verify the document opens in a standard PDF viewer and try uploading again.",
    "retryable": false,
    "jobId": "job_01h8x9y7z...",
    "timestamp": "2026-08-24T06:52:00.000Z"
  }
}
```

Never expose raw stack traces, internal database schema details, or server directory paths to the client.

---

## 11. DATABASE SECURITY, INJECTION DEFENSE & SESSION PROTECTION MANDATES

All database interactions, authentication mechanisms, and session lifecycles MUST strictly comply with these zero-compromise security protocols:

### 11.1 Absolute Ban on Raw String SQL (Zero SQL Injection Invariant)
1. **Parameterized Queries Only**:
   - Raw string concatenation (e.g., `SELECT * FROM users WHERE email = '` + email + `'`) is **STRICTLY PROHIBITED** across the entire codebase.
   - All database queries must use parameterized placeholders (`$1, $2, ...`) or type-safe ORM query builders (Drizzle ORM / Prisma).
2. **Strict Schema & Type Validation**:
   - Every input variable passed to a query must first pass strict runtime validation (e.g., email format, UUID regex, string length caps, sanitized text).

### 11.2 Session Hijacking & Fixation Defenses
1. **Cookie Hardening Standards**:
   - All session and authentication cookies MUST be set with:
     * `HttpOnly`: True (prevents JavaScript/XSS extraction of session tokens).
     * `Secure`: True in production (enforces HTTPS transmission).
     * `SameSite=Lax` or `Strict` (mitigates Cross-Site Request Forgery / CSRF).
2. **Session Token Entropy**:
   - Session identifiers must be generated using cryptographically secure random bytes with at least 256 bits of entropy (`crypto.randomBytes(32).toString('base64url')`).
3. **Session Rotation & Invalidation**:
   - Session tokens must be regenerated upon privilege changes (e.g., post-login, password update, tier upgrade).
   - Old sessions must be immediately revoked and purged from the database/session store.

### 11.3 Timing Attack & Side-Channel Defenses
1. **Constant-Time Verification**:
   - All password verification, API key hashes (`dpk_*`), and webhook signatures (`whsec_*`) must use constant-time comparison via `crypto.timingSafeEqual` or `bcrypt.compare`.
   - Never use standard `===` or `==` for secrets or HMAC hashes.

### 11.4 Multi-Tenant Data Isolation (Tenant Leakage Prevention)
1. **Enforced Tenant Filtering**:
   - Every query retrieving API keys, webhooks, jobs, documents, or usage logs MUST explicitly include the authenticated `ownerId` / `userId` in the `WHERE` clause.
   - Cross-tenant data access is strictly blocked at both the repository layer and database row-level security (RLS) policies.

### 11.5 Brute-Force & Credential Stuffing Defenses
1. **Auth Route Rate Limiting**:
   - Sign-in, Sign-up, and Password Reset routes are protected by dedicated sliding-window rate limiters (maximum 5 failed attempts per IP / email per 15 minutes before temporary lockout).

