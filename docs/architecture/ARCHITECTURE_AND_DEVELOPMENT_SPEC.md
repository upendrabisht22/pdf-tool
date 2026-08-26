# SYSTEM ARCHITECTURE & DEVELOPER SPECIFICATION
**Document Utility & Infrastructure Platform**

*Version: 2.0 (Phase 8 Production Baseline)*  
*Document Target: AI Agents & Engineering Team Reference*  
*Standard: Zero-Ambiguity Engineering Invariants*

---

## 1. HIGH-LEVEL ARCHITECTURAL TOPOLOGY

The platform is architected as a **strictly decoupled 5-tier topology**. No tier is allowed to violate boundary rules.

```
┌────────────────────────────────────────────────────────────────────────────────┐
│ 1. EXPERIENCE LAYER                                                           │
│  - Web Application UI (Clean Light Mode, Floating Capsule Navbar, Bento Grids) │
│  - Embeddable Widget SDK (<script src=".../widget.js"> iframe / shadow DOM)    │
│  - Multilingual Localized Routes (/es/merge-pdf, /fr/compress-pdf, etc.)      │
│  - Local-First Browser WASM Engine (PDF-lib client-side execution)             │
└──────────────────────────────────────┬─────────────────────────────────────────┘
                                       │ HTTP / JSON / SSE
┌──────────────────────────────────────▼─────────────────────────────────────────┐
│ 2. CONTROL PLANE API (`apps/web/server.js`)                                   │
│  - Security Guards: Rate Limiter (Sliding Window), PDF Bomb Defense, TTL Daemon│
│  - Auth & Scope Middleware: Bearer JWT & HMAC-SHA256 API Keys (dpk_*)         │
│  - File Upload Presigner: Direct-to-Storage presigned URL generation          │
│  - Job Orchestrator: Idempotency keys, lifecycle state machine               │
│  - Telemetry: Append-only usage events & immutable audit logs                 │
│  - Webhook Dispatcher: Signed event publisher with exponential backoff        │
└──────────────────────────────────────┬─────────────────────────────────────────┘
                                       │ Leases / Acks
┌──────────────────────────────────────▼─────────────────────────────────────────┐
│ 3. JOB QUEUE & STATE MACHINE (`packages/providers/src/queue`)                  │
│  - Local Dev: `InMemoryQueueProvider` (In-process queue with lease tokens)     │
│  - Cloud Prod: `RedisQueueProvider` (Redis + BullMQ distributed worker queue)  │
│  - Invariants: At-least-once delivery, heartbeat lease renewal, max 3 retries  │
└──────────────────────────────────────┬─────────────────────────────────────────┘
                                       │ Task Assignment
┌──────────────────────────────────────▼─────────────────────────────────────────┐
│ 4. ISOLATED WORKER POOL (`packages/workers`)                                  │
│  - `SandboxedWorkerHarness`: 60s CPU timeout budget, memory caps, auto-cleanup │
│  - 27 Dedicated Processors: Merge, Split, Compress, Rotate, OCR, Sign, Redact, │
│    Word/Excel/PPT Conversions, AI RAG Ask, AI Summarize, Multi-Step Pipelines │
│  - Output Validator: Strict magic-byte, structure, and integrity checks       │
└──────────────────────────────────────┬─────────────────────────────────────────┘
                                       │ Object Put / Get
┌──────────────────────────────────────▼─────────────────────────────────────────┐
│ 5. STORAGE & PERSISTENCE LAYER                                                 │
│  - Local Dev: `LocalStorageProvider` (`apps/web/.storage/`)                   │
│  - Cloud Prod: `R2StorageProvider` (Cloudflare R2 / AWS S3 S3-compatible)     │
│  - Database Prod: PostgreSQL (Prisma / Drizzle) for Users, Keys, Webhooks     │
└────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. DIRECTORY STRUCTURE & COMPONENT OWNERSHIP

Where code, configuration, and data MUST be placed:

```
c:\Users\Upendra\Desktop\pdff\
├── apps/
│   └── web/                                # Control Plane Server & Client App
│       ├── api/                            # Modular Route Handlers
│       │   ├── api-key-auth.js             # API key auth & scope verification
│       │   ├── api-key-store.js            # Key generation (HMAC-SHA256) & validation
│       │   ├── developer-routes.js         # /api/v1/developer/* endpoints
│       │   ├── usage-routes.js             # /api/v1/usage & /api/v1/audit-log routes
│       │   ├── usage-store.js              # Usage events & audit log in-memory/DB store
│       │   ├── webhook-routes.js           # /api/v1/webhooks/* endpoints
│       │   └── webhook-store.js            # Webhook registry, signing & dispatch engine
│       ├── public/                         # Static Frontend Assets
│       │   ├── app.js                      # Client application logic & tool registry
│       │   ├── styles.css                  # Production design system (Capsule navbar, FAQs)
│       │   └── widget.js                   # Phase 8 Embeddable JS Widget SDK
│       ├── security/                       # Zero-Trust Security Middleware
│       │   ├── file-size-guard.js          # Per-tier payload & batch size enforcement
│       │   ├── job-ttl.js                  # Automated file cleanup background daemon
│       │   ├── pdf-bomb-defense.js         # Decompression bomb & page count inspection
│       │   └── rate-limiter.js             # Sliding-window IP rate limiter
│       ├── server.js                       # Primary HTTP Server & Worker loop
│       └── test/                           # Web application test suites
│           ├── sprint-b.test.js            # Security guards test suite
│           ├── sprint-h.test.js            # Phase 7 Developer API & Webhooks test suite
│           └── sprint-i.test.js            # Phase 8 Growth & i18n test suite
│
├── docs/                                   # Architecture & Project Documentation
│   ├── PROJECT_STATE.md                    # Master execution roadmap & current status
│   └── architecture/
│       ├── ARCHITECTURE_AND_DEVELOPMENT_SPEC.md # This document
│       └── adr/                            # Architecture Decision Records
│           ├── ADR-0001-initial-architecture-baseline.md
│           ├── ADR-0002-developer-api-and-webhook-platform.md
│           └── ADR-0003-growth-platform-and-widget-sdk.md
│
├── packages/
│   ├── core/                               # Canonical Domain Models & Types
│   │   └── src/
│   │       ├── api-types.ts                # Phase 7 API, Webhook, Usage, Audit types
│   │       ├── errors.ts                   # Standard PlatformError taxonomy
│   │       ├── i18n.ts                     # Phase 8 Internationalization dictionaries
│   │       ├── index.ts                    # Core package barrel exports
│   │       ├── seo.ts                      # JSON-LD Schema generators & Tool registry
│   │       ├── types.ts                    # Canonical Job State Machine & Tier Limits
│   │       └── validation.ts               # Magic byte & MIME validators
│   │
│   ├── providers/                          # Pluggable Infrastructure Adapters
│   │   └── src/
│   │       ├── auth/                       # DefaultAuthProvider (Session resolution)
│   │       ├── processor/                  # DocumentProcessor base contract
│   │       ├── queue/                      # InMemoryQueueProvider / RedisQueueProvider
│   │       └── storage/                    # LocalStorageProvider / R2StorageProvider
│   │
│   └── workers/                            # Sandboxed Document Processors
│       └── src/
│           ├── ai/                         # AI Summarize, Ask (RAG), Table Extract
│           ├── core/                       # Merge, Split, Compress, Rotate, Image2Pdf
│           ├── office/                     # Word, Excel, PowerPoint -> PDF
│           ├── operations/                 # Watermark, PageNums, Protect, Repair, Redact
│           ├── pdf-to-office/              # PDF -> Word, PDF -> Excel, PDF -> Image
│           ├── pipeline/                   # Sequential multi-step workflow engine
│           ├── sandbox.ts                  # SandboxedWorkerHarness execution budget
│           └── validator.ts                # Output document integrity verification
```

---

## 3. DATA STORAGE & PERSISTENCE STRATEGY

### A. Local Development vs. Cloud Production Mapping

| Domain Entity | Local Development | Cloud Production Target | Migration Effort |
| :--- | :--- | :--- | :--- |
| **API Keys** | `api-key-store.js` (`Map<string, ApiKeyRecord>`) | PostgreSQL `api_keys` table | Swap store functions to Drizzle/Prisma query |
| **Webhooks** | `webhook-store.js` (`Map<string, WebhookRecord>`) | PostgreSQL `webhooks` & `webhook_deliveries` | Swap store functions to Drizzle/Prisma query |
| **Audit Logs** | `usage-store.js` (Bounded circular array) | PostgreSQL `audit_logs` (Append-only) | Swap store functions to Drizzle/Prisma insert |
| **Usage Events** | `usage-store.js` (Bounded circular array) | PostgreSQL / ClickHouse `usage_events` | Swap store functions to Drizzle/Prisma insert |
| **Uploaded Files** | `LocalStorageProvider` (`apps/web/.storage`) | Cloudflare R2 / AWS S3 via presigned URLs | Set `R2_BUCKET`, `R2_ACCESS_KEY` in `.env` |
| **Job Queue** | `InMemoryQueueProvider` (In-process queue) | Redis + BullMQ (`RedisQueueProvider`) | Set `REDIS_URL` in `.env` |
| **User Identity** | `DefaultAuthProvider` (Session headers / JWT) | Supabase Auth / Clerk / NextAuth JWT | Set Auth Provider in `.env` |

### B. Security & Cryptographic Invariants
1. **API Keys**: Raw secrets (`dpk_<base64url>`) are displayed **EXACTLY ONCE** upon creation. Only the SHA-256 hex digest is persisted. Key validation MUST use `crypto.timingSafeEqual`.
2. **Webhook Signatures**: Payloads are signed via HMAC-SHA256 with the webhook's unique secret (`whsec_*`). Header: `X-DocPlatform-Signature: sha256=<digest>`.
3. **Zero Data Retention for Anonymous Users**: Output files are automatically deleted by the `job-ttl.js` daemon after 2 hours.

---

## 4. MULTILINGUAL & SEO GROWTH ARCHITECTURE (PHASE 8)

### Supported Locales
* `en` — English (Default, canonical `/`)
* `es` — Spanish (`/es/...`)
* `fr` — French (`/fr/...`)
* `de` — German (`/de/...`)
* `hi` — Hindi (`/hi/...`)
* `ja` — Japanese (`/ja/...`)

### Programmatic Route Pattern
Every tool has a localized SEO landing page:
`/:lang?/:tool` $\rightarrow$ (e.g. `/es/merge-pdf`, `/fr/compress-pdf`, `/hi/word-to-pdf`)

### SEO Tags Generated
* Dynamic `<title>` & `<meta name="description">` in target language.
* `<link rel="alternate" hreflang="xx" href="...">` for all 6 supported locales.
* Canonical `<link rel="canonical" href="...">`.
* JSON-LD Structured Data: `SoftwareApplication`, `HowTo`, and `FAQPage`.
* Dynamically generated `/sitemap.xml` listing all 160+ URL combinations.

---

## 5. EMBEDDABLE WIDGET SDK SPECIFICATION (PHASE 8)

External websites can embed tools using:
```html
<script src="https://docplatform.com/widget.js" 
        data-tool="merge-pdf" 
        data-theme="light" 
        data-api-key="dpk_your_key_here">
</script>
<div id="docplatform-widget"></div>
```

The widget:
1. Renders a secure, isolated iframe or custom element.
2. Uses `window.postMessage` with origin validation for parent-child communication.
3. Automatically adapts to parent container width and inherits light/dark theme attributes.
4. Directly processes files via WASM or the DocPlatform Developer API.
