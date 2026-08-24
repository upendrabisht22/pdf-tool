# Antigravity Multi-Agent Global Rule Directive
*Auto-loaded Workspace Rule for all AI Subagents*

All subagents operating in this repository must strictly adhere to the canonical rules defined in [rules.md](file:///c:/Users/Upendra/Desktop/pdff/rules.md) and the master specifications in [MASTER AI ENGINEERING PROMPT](file:///c:/Users/Upendra/Desktop/pdff/MASTER%20AI%20ENGINEERING%20PROMPT%20%E2%80%94%20Production-Grade%20Document%20Utility%20Platform.md).

### Non-Negotiable Tenets for AI Agents:
1. **Never generate toy or demo code**: Every implementation must be modular, strongly typed, and resilient to failure.
2. **Strict Layer Decoupling**: Experience Layer $\to$ Control Plane $\to$ Job/Workflow Queue $\to$ Sandboxed Workers $\to$ Storage Layer.
3. **Provider Abstraction**: Never import third-party SDKs directly into business domains. Use typed provider interfaces (`StorageProvider`, `QueueProvider`, `DocumentProcessor`, etc.).
4. **Context & State Continuity**:
   - Before doing any architectural work, read [docs/PROJECT_STATE.md](file:///c:/Users/Upendra/Desktop/pdff/docs/PROJECT_STATE.md).
   - Document any architectural decisions in `docs/architecture/adr/ADR-XXXX-<title>.md`.
   - Before ending a session, record your actions in `docs/sessions/YYYY-MM-DD/<session-id>.md` and update `docs/PROJECT_STATE.md`.
5. **Zero Trust & File Safety**: Magic-byte checking, sandboxed resource limits, signed short-lived URLs, auto-deletion lifecycle.
