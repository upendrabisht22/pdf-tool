# ADR-0001: Initial Architectural Baseline & Decoupled Layer Model

## Status
**ACCEPTED** (2026-08-24)

## Context
We are building a scalable, production-grade document utility and document infrastructure platform. Typical online PDF tools suffer from monolithic entanglements where the web API handles heavy document parsing, uploads are proxied through API servers creating bottlenecks, and vendor-specific SDKs (e.g. Supabase, AWS, Cloudflare, OpenAI) are hardcoded into business logic.

## Problem
How do we ensure the codebase remains modular, secure, cost-effective from day one, and capable of scaling to millions of users without requiring rewrites or vendor lock-in?

## Options Considered
1. **Monolithic Next.js Server Actions with Direct Processing**: Easy to start, but API servers crash under heavy PDF workloads, memory exhausts rapidly, and scaling compute scales the web layer unnecessarily.
2. **Microservices from Day 1**: High operational overhead, premature deployment complexity, slow developer velocity during early phases.
3. **Decoupled Modular Architecture (Monorepo with Layer Separation)**: Experience Layer, Control Plane, Job Queue Layer, Isolated Worker Processors, and Storage Layer separated cleanly via abstract interfaces, sharing typed core packages.

## Decision
We adopt **Option 3**: A decoupled layered architecture within a modular monorepo.

### Architectural Invariants:
1. **Direct-to-Storage Uploads**: Web clients upload directly to Cloudflare R2 (or S3-compatible storage) using short-lived presigned URLs. Binary payloads never proxy through the control plane API.
2. **Asynchronous Job Workers**: All server-side document transformations run as isolated worker jobs managed through a pluggable queue abstraction (`QueueProvider`).
3. **Provider Abstraction**: All infrastructure (Storage, Auth, Queue, Database, PDF Engine, OCR, AI) is accessed through typed abstract interfaces.
4. **Local-First Browser Processing**: Simple operations (merge small files, rotate, reorder, delete page) execute client-side via WASM when practical to maximize privacy, minimize latency, and reduce cloud costs.
5. **Zero-Trust File Pipeline**: Magic-byte inspection, strict resource limits (memory, CPU, execution timeout), and output verification on all jobs.

## Consequences & Tradeoffs
- **Pros**:
  - Near-zero initial hosting cost using serverless edge/containers and free/cheap tiers.
  - Zero vendor lock-in; swapping R2 for S3 or Supabase for AWS RDS requires only changing one provider adapter.
  - Web UI stays fast and responsive regardless of worker load.
  - Seamless collaboration across human engineers and AI agents.
- **Cons / Mitigation**:
  - Requires writing provider interfaces up front instead of calling vendor SDKs directly. (Mitigated by establishing clear contracts in `packages/providers/`).

## Migration Strategy
Any new provider (e.g. migrating queue from in-process/Redis to Google Cloud Tasks) will implement `QueueProvider` interface without touching Control Plane or Worker business logic.
