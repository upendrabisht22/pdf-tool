# ADR-0004: Zero-Login, BYOK (Bring Your Own Key) & Community-Supported Architecture

**Date:** 2026-08-27  
**Status:** ACCEPTED  
**Deciders:** Product & Engineering Lead  
**Phase:** 9  

---

## 1. Context & Problem Statement

Earlier planning explored a traditional mandatory user sign-up and PostgreSQL database system. However, real-world user feedback, global adoption metrics (especially in emerging markets), and privacy standards indicated key friction points:
1. **User Friction**: Casual visitors, students, and professionals wanting a fast PDF merge or conversion bounce when hit with forced login screens.
2. **Server Cost & API Bill Shock**: Providing centralized server-side LLM calls for free invites scraping and unmanageable API bills.
3. **Database Maintenance Overhead**: Requiring database configuration (`DATABASE_URL`, OAuth callbacks) hinders fast, frictionless single-container deployments.

---

## 2. Decision: 100% Zero-Login + BYOK Client-First Model

We adopted a **Zero-Login, BYOK (Bring Your Own Key), and Community-Supported** architecture across the platform:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            DOCPLATFORM TIERS                                │
├───────────────────────────────┬─────────────────────────────────────────────┤
│ 1. Free PDF Tools             │ • Merge, Split, Compress, Rotate, Protect...│
│    (No Login, No Key, $0)     │ • 100% In-Browser. Costs you $0 server fees.│
├───────────────────────────────┼─────────────────────────────────────────────┤
│ 2. Free AI Tools with BYOK    │ • User clicks "AI Summarize" or "Ask PDF"   │
│    ("Bring Your Own Key")     │ • Keys saved exclusively in localStorage    │
│                               │ • Costs $0! Google gives them free tier.    │
├───────────────────────────────┼─────────────────────────────────────────────┤
│ 3. Community Supporter / Tip  │ • Voluntary BuyMeACoffee / UPI tip jar      │
│    (Voluntary $3, $5, $15)    │ • Funds edge CDN & open-source development  │
└───────────────────────────────┴─────────────────────────────────────────────┘
```

---

## 3. Key Design Invariants

### 1. In-Browser Local-First Processing
- Standard PDF operations (Merge, Split, Rotate, Delete, Compress, Watermark, Protect) execute directly in the user's browser via WebAssembly (`pdf-lib`, WASM).
- **Privacy Guarantee**: Document binary data never leaves the client's device.
- **Server Cost**: $0 compute cost for all standard operations.

### 2. BYOK (Bring Your Own Key) for AI
- High-intensity AI operations (`Ask PDF` / RAG with page citations, `Hierarchical Summarizer`, `AI Table Extractor`) require a Google Gemini API Key.
- Users obtain a free key from Google AI Studio (15 free requests/min).
- The key is stored **exclusively in the browser's `localStorage` (`dp_user_gemini_key`)**.
- The server never logs or permanently stores user API keys.

### 3. Community-Supported Monetization (No Subscription Wall)
- The `/pricing` route was transformed into a **100% Free & Open Transparency Page**.
- Users can voluntarily tip ($3 Coffee, $5 Supporter, $15 Sponsor) via external tip jars (BuyMeACoffee / UPI).
- Zero recurring subscription gates or paywalls.

### 4. Abuse Protection & Rate Limiting
- Active per-IP rate limiting (`applyRateLimit`) and PDF bomb inspection (`scanForPdfBomb`) remain active on all public API endpoints to protect worker nodes from automated spam.

---

## 4. Consequences & Benefits

### Positive
- **Zero Barrier to Entry**: Instant user satisfaction with zero registration friction.
- **Zero API Bill Risk**: LLM costs are borne by the user's own free Google AI quota.
- **Minimal Operational Cost**: The entire platform can run on a $0-$5/month server.
- **Maximum Privacy**: Eliminates database PII breach risks.

### Trade-offs
- Users must generate a free Gemini key once to use AI tools (guided with 1-click help in the UI).
- Revenue relies on voluntary community tips and custom enterprise deployment contracts rather than forced recurring subscriptions.
