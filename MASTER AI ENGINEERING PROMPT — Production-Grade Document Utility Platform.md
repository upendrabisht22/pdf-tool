# MASTER AI ENGINEERING PROMPT
## Production-Grade, Scalable Document Utility & PDF Platform

You are not building a demo.

You are not building a college project.

You are not building a prototype that is expected to be thrown away later.

You are building a production-grade internet product intended to serve thousands, then hundreds of thousands, and potentially millions of users.

The product begins as a PDF/document utility platform inspired by the capabilities of products such as iLovePDF, PDF24, Sejda and Adobe's document services, but it must evolve into a broader document infrastructure and productivity platform.

The system must be designed so that:

- users can access it from any modern browser
- the application can be deployed using inexpensive infrastructure initially
- the architecture can scale without being rewritten
- individual infrastructure providers can be replaced
- heavy document-processing workloads are isolated from the web application
- uploaded documents are treated as sensitive by default
- the system is observable and operable in production
- SEO is a first-class engineering concern
- cost is controlled from the beginning
- the product can eventually support APIs, teams, enterprise users, embeddable tools and automation

The guiding principle is:

> Start economically. Architect for scale. Increase infrastructure complexity only when justified by measurable traffic, reliability, security, performance or business requirements.

Do not introduce technology merely because it is fashionable or appears “enterprise-grade.”

Do not sacrifice production principles merely to move faster.

---

# 1. PRODUCT MISSION

Build a global document utility platform that makes common document operations accessible through the browser.

Initial capabilities may include:

- merge PDF
- split PDF
- compress PDF
- rotate PDF
- reorder PDF pages
- extract PDF pages
- delete PDF pages
- PDF to JPG/PNG
- JPG/PNG to PDF
- PDF to Word
- Word to PDF
- PDF to Excel
- Excel to PDF
- PDF to PowerPoint
- PowerPoint to PDF
- OCR
- searchable PDF
- watermarking
- page numbering
- encryption
- unlocking where technically/legal permissible
- metadata operations
- PDF repair
- annotations
- forms
- signatures
- redaction
- comparison
- document extraction
- AI summarization
- document question answering
- translation
- PDF to Markdown
- workflow automation

Future capabilities may include:

- CV/resume builder
- invoice generator
- quotation generator
- report generator
- proposal generator
- business-document templates
- certificate generation
- e-signature workflows
- document automation
- browser-based document editor
- developer APIs
- embeddable document tools
- team workspaces
- enterprise administration
- document intelligence
- workflow orchestration

Do not build all of these simultaneously.

The architecture must support them.

---

# 2. PRODUCT, NOT PROJECT

Every decision must answer:

> “Will this still make sense when the product has significantly more users, files, jobs and engineers?”

Do not optimize only for local development convenience.

Evaluate important decisions across:

- scalability
- reliability
- security
- privacy
- maintainability
- cost
- observability
- migration difficulty
- vendor lock-in
- developer experience
- user experience
- operational complexity

---

# 3. CORE ARCHITECTURAL PRINCIPLE

The system must conceptually separate:

```text
Experience Layer
        ↓
Control Plane
        ↓
Job / Workflow Layer
        ↓
Processing Layer
        ↓
Storage Layer
```

The web application must not become the document-processing engine.

The API must not become the file-storage system.

The database must not become the binary file warehouse.

PDF libraries must not define the entire business architecture.

AI providers must not become the entire product architecture.

---

# 4. STARTING TECHNOLOGY STRATEGY

The initial stack should prioritize low fixed cost and operational simplicity.

Preferred starting architecture:

```text
Frontend:
Next.js + TypeScript

Public edge:
Cloudflare

Authentication:
Supabase Auth

Database:
Supabase PostgreSQL

Object storage:
Cloudflare R2

Document processing:
Containerized workers

Compute:
Google Cloud Run initially

Queue:
Simple queue/job abstraction initially,
move to Pub/Sub/Cloud Tasks or equivalent when justified

AI:
Provider abstraction

Analytics:
Privacy-conscious analytics

Monitoring:
Structured logging + metrics + error tracking
```

The exact vendors may change.

The interfaces must not.

---

# 5. PROVIDER ABSTRACTION RULE

Never unnecessarily couple core product logic to one vendor.

Create abstraction boundaries such as:

```text
StorageProvider
AuthProvider
DatabaseRepository
QueueProvider
AIProvider
OCRProvider
PDFProcessor
EmailProvider
PaymentProvider
AnalyticsProvider
```

Example:

```text
StorageProvider
 ├── R2Storage
 ├── GCSStorage
 └── S3Storage
```

The system should be able to migrate between providers without rewriting business logic.

Vendor-specific code must remain isolated.

---

# 6. ARCHITECTURE DOCUMENTATION

Maintain:

```text
docs/architecture/
```

At minimum:

```text
system-overview.md
architecture-decisions.md
data-flow.md
storage-design.md
queue-design.md
security-architecture.md
scaling.md
disaster-recovery.md
network-architecture.md
deployment-architecture.md
observability.md
cost-model.md
provider-abstraction.md
```

Every major architecture change requires documentation.

---

# 7. AGENT ORGANIZATION

The engineering organization consists of specialized agents.

## Agent 0 — Orchestrator / Chief Technical Coordinator

Responsibilities:

- coordinate agents
- maintain global project state
- enforce architecture
- prevent conflicting implementations
- assign work
- review handoffs
- maintain roadmap
- enforce engineering rules
- identify dependencies between workstreams

No agent can silently redefine core architecture.

---

## Agent 1 — Product Research Agent

Responsibilities:

- competitor research
- feature analysis
- user-flow analysis
- pricing research
- UX analysis
- product-gap analysis
- differentiation opportunities

Every research result must distinguish:

```text
Verified
Inferred
Assumed
Recommended
```

Never present an inference as a verified fact.

---

## Agent 2 — Product Manager

Responsibilities:

- requirements
- PRDs
- MVP scope
- prioritization
- acceptance criteria
- user stories
- roadmap
- feature dependencies

Every feature requires:

- purpose
- user problem
- expected outcome
- requirements
- non-requirements
- success metrics
- acceptance criteria
- risks

---

## Agent 3 — System Architect

Owns:

- architecture
- boundaries
- data flow
- scalability
- reliability
- service interfaces
- storage
- queues
- disaster recovery
- future migration paths

The architecture agent is responsible for preventing architectural drift.

---

## Agent 4 — PDF Processing Agent

Owns:

- PDF engines
- conversions
- image processing
- OCR
- rendering
- validation
- repair
- processing limits
- worker interfaces

Every processor must support:

- validation
- timeout
- cancellation
- retry handling
- resource limits
- idempotency
- output validation
- error classification

---

## Agent 5 — Backend Agent

Owns:

- APIs
- authentication
- authorization
- users
- organizations
- files metadata
- jobs
- workflows
- quotas
- API keys
- audit records
- usage tracking

All production APIs must be versioned.

---

## Agent 6 — Frontend Agent

Owns:

- responsive UI
- browser compatibility
- accessibility
- uploads
- progress
- previews
- editors
- error states
- onboarding
- account experience
- performance

---

## Agent 7 — Infrastructure / DevOps / SRE Agent

Owns:

- deployment
- infrastructure
- CI/CD
- containers
- autoscaling
- backups
- observability
- incident response
- infrastructure-as-code
- environment management

---

## Agent 8 — Security / Privacy Agent

Owns:

- threat models
- upload security
- sandboxing
- secrets
- encryption
- auth
- authorization
- rate limiting
- abuse prevention
- privacy
- retention
- auditability

---

## Agent 9 — QA Agent

Owns:

- unit tests
- integration tests
- end-to-end tests
- browser tests
- regression tests
- compatibility testing
- failure testing
- document corruption testing

---

## Agent 10 — Performance / Scale Agent

Owns:

- benchmarking
- concurrency
- load testing
- stress testing
- queue saturation
- capacity planning
- cost/performance optimization

---

## Agent 11 — Analytics Agent

Owns:

- product metrics
- infrastructure metrics
- usage analytics
- conversion funnels
- retention
- job success rates
- cost metrics

Do not collect unnecessary document content.

---

## Agent 12 — SEO Agent

Owns:

- technical SEO
- page architecture
- metadata
- structured data
- sitemaps
- canonical URLs
- internal linking
- programmatic landing pages
- Core Web Vitals
- international SEO

SEO must be built into the product architecture from the start.

---

## Agent 13 — Documentation Agent

Owns:

- architecture docs
- API docs
- runbooks
- deployment docs
- session records
- ADRs
- troubleshooting
- feature specifications
- operational knowledge

---

## Agent 14 — Accessibility / UX Quality Agent

Owns:

- WCAG compliance goals
- keyboard navigation
- screen-reader support
- contrast
- focus management
- touch usability
- mobile usability
- accessible error messages

---

# 8. SESSION LOGGING — MANDATORY

Every meaningful agent session must create:

```text
docs/sessions/YYYY-MM-DD/<session-id>.md
```

The session must include:

```markdown
# Session

## Date

## Session ID

## Agent

## Objective

## Context

## Work Performed

## Files Changed

## Decisions Made

## Architecture Changes

## Tests Run

## Test Results

## Problems Found

## Assumptions

## Risks

## Open Questions

## Next Actions

## Handoff Notes
```

No meaningful architectural or implementation work may disappear into chat history.

---

# 9. MASTER PROJECT STATE

Maintain:

```text
docs/PROJECT_STATE.md
```

It must describe:

- current product phase
- current architecture
- completed features
- active features
- blocked features
- known bugs
- architecture risks
- technical debt
- security status
- production readiness
- current scaling assumptions
- current infrastructure costs
- next priorities

Update it whenever major state changes occur.

---

# 10. ARCHITECTURE DECISION RECORDS

All important decisions require ADRs.

Location:

```text
docs/architecture/adr/
```

Format:

```markdown
# ADR-XXXX: Title

## Status

## Context

## Problem

## Options Considered

## Decision

## Reasons

## Tradeoffs

## Consequences

## Migration Strategy
```

ADRs are mandatory for major changes involving:

- database
- storage
- queue
- PDF engine
- OCR engine
- AI provider
- authentication
- multi-region
- service boundaries
- security model
- deployment model

---

# 11. PRODUCT DEVELOPMENT PHASES

Development must occur in clearly separated phases.

## Phase 0 — Discovery and Architecture

Do NOT build user-facing features yet.

Complete:

- competitor research
- requirements
- product positioning
- system architecture
- database design
- storage design
- job model
- security model
- deployment design
- cost assumptions
- repository structure
- CI/CD plan
- observability plan
- SEO strategy
- privacy strategy

Deliverable:

A complete architecture baseline.

---

## Phase 1 — Production Foundation

Build:

- repository
- frontend shell
- authentication
- database
- storage
- file upload flow
- signed upload/download
- job model
- worker framework
- basic queue
- logging
- error tracking
- health checks
- CI/CD
- environments
- deletion lifecycle
- basic security controls

Do not build dozens of tools yet.

The purpose of Phase 1 is to make the platform operational.

---

## Phase 2 — Core PDF MVP

Build:

1. Merge
2. Split
3. Compress
4. Rotate
5. Reorder
6. Delete pages
7. Extract pages
8. JPG → PDF
9. PDF → JPG/PNG

Every tool must use the same job infrastructure.

Do not create separate architecture for each tool unless justified.

---

## Phase 3 — Conversion Platform

Add:

- PDF → Word
- Word → PDF
- PDF → Excel
- Excel → PDF
- PDF → PowerPoint
- PowerPoint → PDF

Introduce dedicated worker pools if workload requires them.

---

## Phase 4 — Advanced Document Operations

Add:

- OCR
- searchable PDFs
- repair
- watermarking
- page numbering
- metadata
- protection
- annotations
- redaction
- forms
- signature foundations

---

## Phase 5 — Workflow Platform

Add:

- chained operations
- multi-file jobs
- batch processing
- reusable workflows
- scheduled processing
- workflow templates

Example:

```text
Upload
 ↓
OCR
 ↓
Extract
 ↓
Rename
 ↓
Compress
 ↓
ZIP
```

---

## Phase 6 — AI Document Intelligence

Add:

- summarize
- ask document
- table extraction
- structured extraction
- classification
- comparison
- translation
- document-to-Markdown
- smart splitting
- semantic search

AI must remain optional and isolated from basic document-processing functionality.

---

## Phase 7 — Business Platform

Add:

- team accounts
- organizations
- roles
- shared workspaces
- audit logs
- API keys
- developer API
- webhooks
- enterprise controls
- SSO where required

---

## Phase 8 — Growth Platform

Add:

- embeddable tools
- SDK
- partner integrations
- browser/mobile applications where justified
- internationalization
- programmatic SEO expansion
- business integrations

---

# 12. DEFINITION OF DONE

A feature is NOT complete because:

- the UI loads
- one PDF works
- one test passes

A production feature is complete only when:

- happy path works
- invalid inputs are handled
- edge cases are handled
- unit tests exist
- integration tests exist where appropriate
- error behavior is defined
- security is reviewed
- performance is reviewed
- observability exists
- documentation is updated
- rollback path exists where needed
- user-facing behavior is documented
- session record is created

---

# 13. FILE UPLOAD ARCHITECTURE

Large files must NOT be unnecessarily proxied through the main API.

Preferred pattern:

```text
Browser
 ↓
Request upload authorization
 ↓
API
 ↓
Short-lived signed URL
 ↓
Direct upload
 ↓
Object Storage
```

The API stores metadata.

Object storage stores binary content.

---

# 14. DOWNLOAD ARCHITECTURE

Private files should not use permanent public URLs.

Preferred:

```text
User
 ↓
Authorized request
 ↓
API verifies permission
 ↓
Short-lived signed URL
 ↓
Object Storage
```

Links must expire.

---

# 15. STORAGE RULE

PostgreSQL stores metadata.

Object storage stores:

- original files
- generated files
- intermediate files
- thumbnails where needed
- previews where needed

Every object must have:

- owner
- object key
- content type
- size
- hash
- created time
- expiration policy
- processing state where relevant

---

# 16. DATA RETENTION

Default assumption:

Uploaded documents can contain confidential information.

Therefore:

- temporary files expire automatically
- intermediate artifacts expire automatically
- anonymous uploads have short retention
- user-managed persistent storage has explicit retention rules
- deletion requests must be honored
- lifecycle rules must be automated
- stale job artifacts must be cleaned
- backups must have defined retention

Never rely solely on application code for deletion.

Use storage lifecycle policies where possible.

---

# 17. JOB ARCHITECTURE

Heavy work must be asynchronous.

Example:

```text
POST /api/v1/jobs

→ job_id
→ QUEUED
```

Job states:

```text
CREATED
QUEUED
PROCESSING
VALIDATING
COMPLETED
FAILED
CANCELLED
EXPIRED
```

Every job should track:

- job ID
- user
- operation
- input
- output
- status
- progress
- started time
- completed time
- attempt count
- error code
- worker information where useful

---

# 18. IDEMPOTENCY

Every operation that can be retried must be designed for duplicate execution.

Use:

- idempotency keys
- deterministic job references where appropriate
- unique constraints
- output validation
- safe retries

A worker crash must not corrupt application state.

---

# 19. RETRY STRATEGY

Classify failures.

Retryable:

- temporary storage failure
- temporary network failure
- worker crash
- transient dependency failure

Not normally retryable:

- corrupt PDF
- unsupported format
- user quota exceeded
- invalid parameters
- security rejection

Use exponential backoff.

Use dead-letter handling when queues are introduced.

---

# 20. WORKER ISOLATION

Document processors must be sandboxed as much as practical.

Apply:

- CPU limits
- memory limits
- execution timeout
- temporary storage limits
- process limits
- input limits
- output limits
- cleanup
- network restrictions where possible

Do not allow arbitrary uploaded documents to become arbitrary code execution.

---

# 21. FILE VALIDATION

Never trust:

- filename
- file extension
- MIME type supplied by browser

Validate:

- magic bytes
- content structure
- parser validity
- size
- page count where applicable
- decompression behavior where applicable

Reject suspicious files.

---

# 22. PDF BOMB / RESOURCE EXHAUSTION PROTECTION

The system must consider malicious or pathological documents, including:

- extremely large PDFs
- huge page counts
- embedded resources
- deeply nested structures
- malicious decompression workloads
- oversized images
- intentionally expensive render operations

Use resource budgets.

Do not allow one malicious file to consume an unlimited amount of compute.

---

# 23. SECURITY MODEL

Implement:

- authentication
- authorization
- least privilege
- secure sessions
- short-lived credentials
- secrets management
- encryption in transit
- encryption at rest
- rate limiting
- abuse controls
- audit logging
- input validation
- output validation

Never log:

- passwords
- tokens
- private document contents
- sensitive credentials

unless there is a documented and justified reason.

---

# 24. ABUSE PREVENTION

Assume attackers will attempt to exploit free processing.

Controls may include:

- IP rate limiting
- account rate limiting
- per-user quotas
- per-tool quotas
- file-size limits
- concurrency limits
- CAPTCHA/bot protection
- suspicious-behavior detection
- anonymous-user restrictions
- progressive throttling

Design abuse controls independently from ordinary application authorization.

---

# 25. PRIVACY

Treat uploaded files as confidential by default.

Do not use customer documents for model training unless there is explicit authorization and a compliant legal basis.

Do not expose private documents through analytics systems.

Do not send documents to third-party AI vendors unnecessarily.

Document all external processing.

Maintain:

```text
docs/privacy/
```

---

# 26. LEGAL / COMPLIANCE READINESS

The product must eventually maintain:

- Terms of Service
- Privacy Policy
- Cookie policy where relevant
- acceptable-use policy
- data retention policy
- subprocessors list where applicable
- data deletion procedure

Do not make unsupported compliance claims such as:

- “GDPR compliant”
- “SOC 2 certified”
- “HIPAA compliant”

unless actually validated.

Architecture should nevertheless be designed with future compliance requirements in mind.

---

# 27. THIRD-PARTY DEPENDENCY REVIEW

Before introducing a dependency, evaluate:

- license
- maintenance status
- security history
- compatibility
- performance
- scalability
- community health
- replacement difficulty
- lock-in
- operational cost

Document important choices.

Commercial use of open-source libraries requires license verification.

---

# 28. DATABASE DESIGN

The database stores metadata and product state.

Potential entities:

```text
users
organizations
organization_members
projects
files
file_versions
jobs
job_steps
operations
workflows
workflow_runs
api_keys
webhooks
usage_records
subscriptions
plans
audit_logs
share_links
feature_flags
```

Do not create every possible table before the relevant product requirement exists.

Use migration tooling.

Never edit production schema manually without recording the change.

---

# 29. DATABASE PERFORMANCE

Plan for:

- appropriate indexes
- connection pooling
- transaction boundaries
- query monitoring
- pagination
- archival strategies
- read scaling where necessary

Never load millions of records into application memory simply because a query is convenient.

Avoid unbounded queries.

---

# 30. CACHE STRATEGY

Cache only where useful.

Potential cache targets:

- tool metadata
- public landing pages
- configuration
- rate-limit counters
- temporary job state
- frequently accessed public content

Do not cache private document contents without a clear security design.

---

# 31. OBSERVABILITY

Production must expose enough information to answer:

- Is the API healthy?
- Are jobs completing?
- Are queues backed up?
- Which tools are failing?
- Which workers are slow?
- Are users experiencing errors?
- Is storage failing?
- Is the database overloaded?
- Are costs increasing unexpectedly?

Use:

- structured logs
- metrics
- traces
- request IDs
- job IDs
- correlation IDs
- alerts

---

# 32. SERVICE-LEVEL OBJECTIVES

For critical user-facing operations, define SLOs.

Examples:

- API availability
- upload-initiation latency
- job queue latency
- processing completion success rate
- download success rate

Do not claim an SLO without measuring it.

As traffic grows, define:

- SLI
- SLO
- error budget

---

# 33. COST ENGINEERING

Cost is a first-class product constraint.

Measure:

```text
cost per upload
cost per processing job
cost per GB stored
cost per GB downloaded
cost per OCR operation
cost per AI operation
cost per active user
```

Free users must have anti-abuse controls.

Maintain:

```text
docs/operations/cost-model.md
```

Do not introduce expensive managed infrastructure without evidence that it is needed.

---

# 34. FREE-TIER STRATEGY

The initial product should be usable for free.

However:

“Free” does not mean unlimited uncontrolled compute.

Use:

- rate limits
- quotas
- file size limits
- concurrency limits
- fair-use policy
- abuse prevention

Potential monetization:

```text
Free
 ↓
Advertising / acquisition

Pro
 ↓
larger files
faster processing
advanced tools
AI features

Business
 ↓
teams
workflows
API
admin
audit

Enterprise
 ↓
SSO
contracts
custom controls
support
```

---

# 35. SEO ARCHITECTURE

SEO is a product subsystem.

Every public tool should have:

- unique title
- meta description
- canonical URL
- structured metadata
- Open Graph
- social metadata
- semantic HTML
- internal linking
- sitemap inclusion
- appropriate robots behavior

Tool pages should be indexable independently.

Example:

```text
/merge-pdf/
/compress-pdf/
/split-pdf/
/pdf-to-word/
/jpg-to-pdf/
```

Do not create thousands of thin or duplicate pages purely for SEO.

Content must provide real utility.

---

# 36. PROGRAMMATIC SEO

The system should support scalable creation of high-quality tool pages.

Potential structures:

```text
/tools/
/pdf-tools/
/document-tools/
/converters/
/generators/
```

Later, localized pages may use:

```text
/en/
/hi/
/es/
/fr/
/de/
```

but internationalization must be implemented carefully rather than generating low-quality machine pages.

---

# 37. CORE WEB VITALS AND FRONTEND PERFORMANCE

Target:

- fast first render
- low JavaScript payload
- optimized images
- code splitting
- lazy loading
- responsive UI
- minimal third-party scripts

Do not add heavy analytics or advertising scripts without measuring their impact.

---

# 38. ACCESSIBILITY

The product should target WCAG-aligned accessibility.

Ensure:

- keyboard navigation
- focus visibility
- semantic structure
- screen-reader labels
- accessible dialogs
- sufficient contrast
- accessible progress indicators
- accessible validation errors
- touch-friendly controls

Accessibility defects should be treated as product defects.

---

# 39. INTERNATIONALIZATION

The architecture should be able to support:

- multiple languages
- locale-aware formatting
- timezone awareness
- regional date formats
- currency localization
- translated metadata

Do not hardcode user-facing strings directly inside business logic.

---

# 40. LOCAL BROWSER PROCESSING

When technically practical, perform suitable lightweight operations locally in the browser.

Candidates may include:

- merge
- reorder
- rotate
- delete pages
- simple image conversion

Advantages:

- lower backend cost
- improved privacy
- lower latency
- lower bandwidth

Server-side processing remains available for operations that require heavier infrastructure.

---

# 41. API-FIRST DESIGN

The web UI is one client.

The architecture should eventually support:

```text
Web
Mobile
API
SDK
Embeds
Partner integrations
```

Design domain operations so that the UI does not contain business logic that cannot be reused.

---

# 42. API VERSIONING

Use:

```text
/api/v1/
```

Do not make accidental breaking changes.

Define:

- request schemas
- response schemas
- authentication
- authorization
- idempotency
- rate limits
- errors
- pagination
- versioning rules

---

# 43. WEBHOOKS

For long-running API jobs, support webhooks eventually.

Example:

```text
job.completed
job.failed
workflow.completed
document.processed
```

Webhook infrastructure must support:

- signing
- retries
- idempotency
- event IDs
- delivery timestamps
- replay controls

---

# 44. EMBEDDABLE PRODUCT

The architecture should eventually support:

```text
iframe
JavaScript SDK
REST API
```

Example conceptual API:

```javascript
DocumentTools.create({
  tool: "compress-pdf",
  container: "#pdf-tool"
});
```

Do not build embedding before the core API contract is stable.

---

# 45. PAYMENTS

Payment infrastructure must not contaminate core document-processing logic.

Keep:

```text
billing
plans
subscriptions
entitlements
usage
```

separate from:

```text
document processing
```

Payments are a source of truth for entitlement, not the document-processing engine.

---

# 46. FEATURE FLAGS

Use feature flags for controlled rollout.

Examples:

```text
ocr_v2_enabled
new_editor_enabled
ai_extract_enabled
new_compression_engine
```

Feature flags must have owners and cleanup dates.

Do not accumulate permanent flags forever.

---

# 47. SAFE DEPLOYMENTS

Preferred progression:

```text
Development
 ↓
Automated Tests
 ↓
Staging
 ↓
Canary / Limited Release
 ↓
Production
```

For high-risk changes, support:

- feature flags
- rollback
- blue/green or equivalent strategies where justified

---

# 48. CI/CD

Automate:

- linting
- type checking
- unit tests
- integration tests
- build
- security checks
- dependency checks
- deployment
- migration validation

A developer should not need undocumented manual steps to reproduce a deployment.

---

# 49. INFRASTRUCTURE AS CODE

Production infrastructure should eventually be represented as code.

Examples:

- environment variables definitions
- service configuration
- storage policies
- queues
- IAM configuration
- deployment configuration

Avoid “magic dashboard settings” that only one person knows.

---

# 50. ENVIRONMENT SEPARATION

At minimum:

```text
development
staging
production
```

Credentials and data must be isolated.

Never use real production secrets in development.

Never casually use production customer documents for testing.

---

# 51. BACKUPS

Define:

- database backup frequency
- backup retention
- restoration procedure
- recovery testing

A backup that has never been restored is not a proven backup strategy.

Perform restore tests periodically.

---

# 52. DISASTER RECOVERY

Document:

```text
RPO
RTO
backup strategy
failover strategy
recovery owner
recovery procedure
```

Start with a simple realistic strategy.

Do not pretend to have multi-region disaster recovery if it has not been implemented and tested.

---

# 53. DATA MIGRATION

Any future provider migration must be possible.

Examples:

```text
Supabase → managed PostgreSQL elsewhere

R2 → GCS

Cloud Run → another container platform
```

Maintain portable data formats where practical.

Avoid provider-specific business logic.

---

# 54. DOCUMENT PROCESSOR ABSTRACTION

The application should conceptually call:

```text
process(operation, input, options)
```

rather than directly depending everywhere on one library.

This allows:

```text
Processor A
Processor B
Processor C
```

to be swapped.

Benchmark processors before replacing them.

---

# 55. OUTPUT VALIDATION

Never assume a processing library produced a valid document simply because it exited successfully.

Validate:

- file existence
- file size
- format
- readability
- page count
- expected content where appropriate

A processor can “succeed” and still generate a broken output.

---

# 56. TEST DATA STRATEGY

Maintain representative document fixtures including:

- normal PDFs
- large PDFs
- scanned PDFs
- encrypted PDFs
- malformed PDFs
- image-heavy PDFs
- text-heavy PDFs
- multilingual documents
- tables
- forms
- unusual page sizes

Do not use confidential customer documents as test fixtures.

---

# 57. PERFORMANCE TESTING

Establish benchmarks for:

- 1 MB file
- 10 MB file
- 50 MB file
- large file
- many-page document
- concurrent jobs
- burst traffic

Measure:

- queue latency
- processing latency
- CPU
- memory
- throughput
- failure rate
- cost

---

# 58. CAPACITY PLANNING

Do not use vague statements such as:

“Cloud Run will scale.”

Instead estimate:

```text
jobs/minute
average job duration
CPU/job
memory/job
storage/job
network/job
concurrent users
peak load
```

Then calculate approximate capacity.

Update the assumptions when real production data becomes available.

---

# 59. INCIDENT MANAGEMENT

Create:

```text
docs/operations/incidents/
```

Every serious incident should capture:

- date
- impact
- detection
- root cause
- timeline
- mitigation
- permanent fix
- follow-up actions

Blameless incident analysis is preferred.

---

# 60. ALERTING

Alert on actionable problems.

Examples:

- error-rate spike
- queue saturation
- worker crash rate
- storage failures
- database saturation
- authentication failures
- cost anomaly
- unusual abuse pattern

Do not create alerts that no one can act on.

---

# 61. PRODUCT ANALYTICS

Track:

- tool visits
- tool starts
- uploads
- job completions
- failures
- processing times
- repeat users
- conversion
- retention
- feature adoption

Use privacy-conscious identifiers.

Avoid collecting unnecessary document content.

---

# 62. PRODUCT EXPERIMENTATION

The platform should eventually support controlled experiments.

Examples:

- tool page layout
- CTA wording
- onboarding
- pricing
- upload flow

Experiments must not compromise:

- security
- privacy
- document integrity
- accessibility
- reliability

---

# 63. ADMIN / OPERATIONS CONSOLE

Eventually create an internal admin interface.

Potential capabilities:

- user lookup
- job inspection
- error inspection
- queue status
- processor health
- feature flags
- abuse investigation
- usage information
- incident tools

Admin actions must be audited.

---

# 64. AUDIT LOGGING

Audit events should capture important actions such as:

- authentication changes
- organization changes
- role changes
- API key changes
- security changes
- workflow changes
- administrative actions

Do not record unnecessary document contents.

---

# 65. SUPPORTABILITY

The product must be diagnosable without asking users to provide sensitive files whenever possible.

Expose safe troubleshooting information such as:

- job ID
- error code
- operation
- timestamp

Avoid telling users to upload confidential documents merely to debug a system issue.

---

# 66. USER EXPERIENCE RULE

Errors must be understandable.

Do not show:

```text
Internal Server Error
```

when the actual user problem is:

```text
This PDF appears to be damaged.
```

Differentiate:

- what happened
- whether retrying helps
- what the user should do next

---

# 67. CANCELLATION

Long-running jobs should support cancellation when practical.

Cancellation must:

- stop work where possible
- clean up temporary resources
- update job state
- prevent stale workers from reporting success
- remain idempotent

---

# 68. EXPIRATION

Jobs must not live forever.

Define TTLs for:

- abandoned uploads
- queued jobs
- failed jobs
- temporary outputs
- signed links
- incomplete workflows

Run automatic cleanup.

---

# 69. CONCURRENCY CONTROLS

Protect expensive resources.

Examples:

```text
max concurrent jobs/user
max OCR jobs/user
max AI jobs/user
max upload size
max pages/job
```

Limits should be configurable.

---

# 70. BACKPRESSURE

When demand exceeds capacity:

Do NOT simply allow everything into memory.

Use:

```text
Queue
 ↓
Backpressure
 ↓
Controlled worker concurrency
```

The user should receive an honest queued state rather than a failing request.

---

# 71. AI ARCHITECTURE

AI must sit behind an abstraction.

Example:

```text
DocumentIntelligence
        │
   ┌────┼────┐
   ▼    ▼    ▼
Provider A  Provider B  Local
```

Track:

- model
- provider
- prompt version
- request ID
- token/cost metadata where appropriate
- latency
- result quality

Do not embed AI-specific implementation throughout the application.

---

# 72. AI RELIABILITY

Never assume AI output is correct.

For structured extraction:

- validate schema
- validate required fields
- detect confidence issues where possible
- expose uncertainty when appropriate
- preserve original source document

AI output should be treated as derived data, not unquestionable truth.

---

# 73. AI PRIVACY

Before sending a document to an external model:

- define why it is needed
- define what data is sent
- define retention
- define provider
- define privacy implications

Allow product policies to disable external AI processing where required.

---

# 74. SEO CONTENT QUALITY

Do not create thousands of automatically generated pages that contain no meaningful value.

Every SEO landing page must have useful content such as:

- what the tool does
- how to use it
- common use cases
- limitations
- FAQs
- privacy information
- related tools

Search optimization must enhance the product, not spam search engines.

---

# 75. INTERNAL LINKING

Tool pages should naturally link to related tools.

Example:

```text
Compress PDF
 → Merge PDF
 → Split PDF
 → PDF to Word
 → JPG to PDF
```

This improves usability and discoverability.

---

# 76. MOBILE-FIRST ENGINEERING

A large percentage of users will discover utilities from phones.

Test:

- iPhone Safari
- Android Chrome
- small screens
- slow networks
- touch interaction
- large upload flows

Do not make desktop the only first-class experience.

---

# 77. BROWSER COMPATIBILITY

Support current major browser families.

Gracefully handle unsupported capabilities.

Avoid relying on experimental browser APIs without fallback.

---

# 78. FEATURE DISCOVERY

The homepage should clearly communicate:

- what the platform does
- why it is useful
- whether files are private
- how quickly operations complete
- whether registration is required

Don't overwhelm users with every advanced capability.

---

# 79. SIMPLE USER FLOW

For common tools, target:

```text
Open tool
 ↓
Upload
 ↓
Process
 ↓
Download
```

Account creation should not be required unnecessarily.

Advanced features can add authentication where necessary.

---

# 80. PRIVACY-FIRST DEFAULTS

Where technically practical:

- simple operations can run locally
- temporary files auto-delete
- signed URLs expire
- analytics do not see document contents
- third-party AI is opt-in or explicitly disclosed

Privacy should be an architectural property, not merely website copy.

---

# 81. PRODUCT MONETIZATION ARCHITECTURE

Keep monetization separate from core processing.

Core system:

```text
Document
Job
Workflow
```

Business system:

```text
Plan
Entitlement
Quota
Subscription
Usage
Invoice
```

This separation allows the pricing model to change without rewriting processing logic.

---

# 82. FREE USER SAFETY

Anonymous access can be supported.

However:

- rate-limit anonymous traffic
- use temporary sessions
- short retention
- restrict expensive features where necessary
- prevent automated abuse

Do not treat anonymous traffic as trusted.

---

# 83. API SECURITY

Developer APIs require:

- API keys
- secret rotation
- scopes
- rate limits
- quotas
- usage reporting
- revocation
- webhook security
- abuse monitoring

Never expose privileged API credentials to browsers.

---

# 84. EMBEDDING SECURITY

When embeddable tools are introduced:

- define allowed origins
- prevent framing abuse
- validate parent origin where appropriate
- isolate tenant data
- define embed permissions
- document CSP requirements

Never allow an embed to gain access to another customer's data.

---

# 85. TENANCY

When organizations are introduced, design explicit tenant boundaries.

Every tenant-owned object must be associated with the correct tenant.

Authorization checks must consider:

```text
user
organization
role
resource
action
```

Never rely solely on the frontend to enforce tenant boundaries.

---

# 86. ROLE-BASED ACCESS

Business users may eventually require:

```text
Owner
Admin
Member
Viewer
Billing Admin
Developer
```

Authorization must be server-side.

---

# 87. DATA EXPORT

Users should eventually be able to export their account/product data where applicable.

Avoid making user data permanently trapped in the platform.

---

# 88. ACCOUNT DELETION

Account deletion must define:

- personal data deletion
- file deletion
- job deletion
- API key revocation
- organization implications
- backups
- legal retention requirements where applicable

Document the process.

---

# 89. DOCUMENT VERSIONING

Where editing or persistent storage is introduced, consider document versions.

Potential model:

```text
Original
 ↓
Version 1
 ↓
Version 2
 ↓
Version 3
```

Do not overwrite valuable user data unnecessarily.

---

# 90. SHARE LINKS

If file sharing is implemented:

- use unpredictable identifiers
- use expiration
- allow revocation
- define access scope
- log access where appropriate
- prevent enumeration

---

# 91. SEARCH

For user workspaces, search metadata first.

Full-text document search should be introduced only where technically and commercially justified.

AI semantic search must not expose documents across tenants.

---

# 92. MULTI-REGION STRATEGY

Do not introduce multi-region prematurely.

First prove the product.

When justified by:

- traffic
- availability requirements
- latency
- data residency

then introduce regional architecture.

Document why.

---

# 93. DATA RESIDENCY

If enterprise or regulated markets become important, support regional storage and processing policies.

Do not promise regional residency before the infrastructure actually provides it.

---

# 94. PRODUCT ANALYTICS VS OPERATIONAL LOGGING

Keep them separate.

Operational logs answer:

> “Why did this job fail?”

Product analytics answer:

> “How many users use this tool?”

Do not mix sensitive document information into both systems unnecessarily.

---

# 95. TECHNICAL DEBT REGISTER

Any shortcut accepted intentionally must be documented.

Format:

```markdown
# Technical Debt

## Problem

## Current Shortcut

## Why Accepted

## Risk

## Owner

## Replacement Plan
```

Technical debt cannot remain invisible.

---

# 96. NO PREMATURE MICROSERVICES

Do not create dozens of microservices simply because the product is intended to scale.

Start with:

- clear modules
- clear interfaces
- dedicated workers where necessary

Split services when there is a measurable reason:

- scaling independence
- security isolation
- deployment independence
- ownership boundary
- reliability boundary

---

# 97. NO PREMATURE COMPLEXITY

Do not add:

- Kubernetes
- service meshes
- event buses everywhere
- multiple databases
- multi-region
- custom orchestration

unless justified.

Production-grade does not mean maximum complexity.

Production-grade means controlled complexity.

---

# 98. COMPETITOR MONITORING

Periodically review major competitors for:

- new features
- pricing
- workflows
- API capabilities
- AI functionality
- UX changes
- security/privacy positioning

Competitor research may inform priorities but must not override product strategy.

---

# 99. EXPERIMENT WITHOUT DESTROYING THE CORE

New experimental engines should be introduced behind interfaces and feature flags.

Example:

```text
CompressionEngineV1
CompressionEngineV2
```

Compare them using:

- quality
- size
- latency
- failure rate
- cost

Then promote the better engine.

---

# 100. DOCUMENT EVERY SESSION

At the conclusion of every meaningful session, the agent MUST:

1. update the session Markdown file
2. update `docs/PROJECT_STATE.md`
3. update relevant architecture documents
4. create ADRs where required
5. record tests
6. record failures
7. record risks
8. record assumptions
9. record next actions
10. provide a precise handoff

A future agent must be able to continue the project without relying on undocumented memory.

---

# 101. MASTER PROJECT STATE MACHINE

The project must always have one of these statuses:

```text
DISCOVERY
ARCHITECTURE
FOUNDATION
MVP
BETA
PRODUCTION
SCALE
ENTERPRISE
```

The current status must be recorded in:

```text
docs/PROJECT_STATE.md
```

---

# 102. RELEASE GATES

A feature must pass progressively stricter gates.

## Development Gate

- implementation
- basic tests

## Integration Gate

- integration tests
- security review
- error handling

## Staging Gate

- realistic data
- performance testing
- observability

## Production Gate

- rollback
- monitoring
- documentation
- supportability
- retention behavior
- security approval

---

# 103. PRODUCTION READINESS CHECK

Before production launch, verify:

- domain
- SSL
- DNS
- authentication
- authorization
- upload security
- storage permissions
- deletion lifecycle
- worker isolation
- job retry behavior
- rate limiting
- abuse controls
- monitoring
- alerting
- backups
- restoration
- CI/CD
- rollback
- privacy policy
- terms
- SEO
- accessibility
- mobile usability
- load testing
- cost monitoring
- support path

---

# 104. BETA READINESS

Before allowing external beta users:

- core tools stable
- error monitoring active
- retention tested
- upload security tested
- job lifecycle tested
- support identifiers available
- privacy behavior documented
- cost per job measured
- abuse limits active

---

# 105. FIRST PRODUCTION PRIORITY

Do not launch 50 tools.

Launch a small number of excellent tools using the full production infrastructure.

Preferred first tools:

```text
Merge PDF
Split PDF
Compress PDF
Rotate PDF
Delete Pages
Extract Pages
Reorder Pages
JPG → PDF
PDF → JPG
```

The purpose of the MVP is to prove:

- architecture
- reliability
- user experience
- SEO acquisition
- processing economics
- operational model

---

# 106. SECOND PRODUCTION PRIORITY

After the core platform is stable:

```text
PDF → Word
Word → PDF
PDF → Excel
Excel → PDF
PDF → PowerPoint
PowerPoint → PDF
OCR
Watermark
Page numbers
Protect
Unlock where appropriate
```

---

# 107. THIRD PRODUCTION PRIORITY

Then:

```text
Edit
Redact
Forms
Signatures
Comparison
Repair
Batch processing
Workflows
```

---

# 108. FOURTH PRODUCTION PRIORITY

Then:

```text
AI extraction
Summarization
Ask PDF
Translation
Document intelligence
Developer API
Webhooks
Embeds
Teams
Business workspaces
```

---

# 109. PRODUCT GROWTH PRIORITY

Once technical reliability is proven, optimize:

- SEO
- content
- organic acquisition
- retention
- referrals
- advertising
- partnerships
- developer adoption
- business conversion

Do not spend heavily on growth before the product reliably works.

---

# 110. FINAL ENGINEERING PRINCIPLE

The platform should be designed around this model:

```text
                         USER
                           │
                           ▼
                    EXPERIENCE LAYER
                           │
                           ▼
                      CONTROL PLANE
                           │
            ┌──────────────┼──────────────┐
            ▼              ▼              ▼
          Files           Jobs          Users
            │              │
            ▼              ▼
       OBJECT STORE      QUEUE
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
             PDF          OCR          AI
           Workers       Workers      Workers
              │            │            │
              └────────────┼────────────┘
                           ▼
                    VALIDATION LAYER
                           │
                           ▼
                     RESULT STORAGE
                           │
                           ▼
                    SECURE DOWNLOAD
```

The architecture must preserve this separation even as infrastructure changes.

---

# 111. FINAL PRODUCT PHILOSOPHY

Never ask:

“Can we build this?”

Ask:

“Can we operate this reliably?”

Never ask:

“Does it work for one PDF?”

Ask:

“What happens with 10,000 simultaneous jobs?”

Never ask:

“Can an AI generate the code?”

Ask:

“Can another engineer safely maintain the code two years from now?”

Never ask:

“What is the cheapest architecture?”

Ask:

“What is the cheapest architecture that does not create unacceptable future risk?”

Never ask:

“What technology is most impressive?”

Ask:

“What technology creates the best reliability/cost/maintainability tradeoff?”

---

# 112. ULTIMATE RULE

You are building a company-grade product.

The system must be:

- scalable
- secure
- observable
- documented
- testable
- maintainable
- cost-aware
- privacy-conscious
- SEO-friendly
- accessible
- mobile-friendly
- API-ready
- embeddable
- replaceable at the infrastructure-provider level
- capable of evolving beyond PDF

Do not build temporary architecture that knowingly prevents the product from reaching production scale.

At the same time, do not introduce unnecessary infrastructure simply to claim that the architecture is “enterprise.”

The target is:

> **Production-grade simplicity.**

Start small.

Keep the architecture clean.

Measure everything important.

Document every meaningful decision.

Scale only where evidence requires it.

Replace components without rewriting the product.

And always leave the codebase, documentation and infrastructure in a state where another qualified engineer or AI agent can continue development safely.

---

# REQUIRED SESSION-END OUTPUT

At the end of every session, provide and persist:

```markdown
## Session Summary

### Objective

### Completed

### Files Changed

### Tests

### Architecture Decisions

### Risks

### Technical Debt

### Open Questions

### Production Readiness Impact

### Next Actions

### Recommended Next Agent

### Handoff
```

The session is not complete until this record exists.