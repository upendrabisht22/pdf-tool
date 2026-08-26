# ADR-0002: Developer API, Webhook Dispatcher & Audit Logging Baseline

## Status
**ACCEPTED** (2026-08-26)

## Context
Phase 7 introduces the B2B & Developer Platform enabling external clients, automated workflows, and team SaaS integrations to programmatically execute PDF jobs, receive asynchronous notifications, track quota usage, and review an immutable audit trail.

## Problem
How to implement a secure, low-latency, high-reliability API key management and webhook dispatch system that avoids security vulnerabilities (timing attacks, secret leaks) and operates cleanly in both local development and cloud production?

## Key Decisions

### 1. API Key Security & Constant-Time Verification
- **Key Format**: Prefix `dpk_` followed by 32 cryptographically random bytes (`base64url`).
- **Storage**: Raw secret is shown ONCE to the user at creation time and NEVER stored. Only the SHA-256 hex digest is persisted.
- **Verification**: Key validation uses `crypto.timingSafeEqual` to prevent timing oracle attacks.
- **Scopes**: Fine-grained access control (`jobs:read`, `jobs:write`, `files:read`, `files:write`, `webhooks:read`, `webhooks:write`, `usage:read`, `audit:read`).

### 2. Webhook Dispatch Engine & HMAC-SHA256 Payload Signing
- **Payload Signature**: Every outgoing webhook POST carries `X-DocPlatform-Signature: sha256=<hex>` computed via HMAC-SHA256 using the webhook's unique signing secret (same standard as GitHub/Stripe).
- **Retry Strategy**: Exponential backoff (0s, 1s, 2s) with a maximum of 3 delivery attempts and a 10s per-request timeout.
- **Health Tracking**: Consecutive failures are tracked; webhooks with $\ge 5$ consecutive failures automatically transition to `failing` status.
- **Delivery Log**: Bounded in-memory log of recent delivery attempts with HTTP status and latency metrics.

### 3. Append-Only Telemetry & Audit Logs
- **Usage Events**: Immutable records created upon every operation tracking duration, byte size, status code, and operation type.
- **Audit Trail**: Append-only log recording actor, IP, event type, and outcome. Updates and deletes are disallowed by design.

## Consequences & Verification
- 36 dedicated unit and integration tests passing (`apps/web/test/sprint-h.test.js`).
- Complete compatibility with existing 84 core, provider, and worker tests (120/120 total).
