# Session 001: Wcode Official Razorpay UPI Merchant QR Integration
**Date**: September 23, 2026  
**Status**: COMPLETED & VERIFIED  
**Author**: Antigravity Pair Programming Agent  

---

## 1. Executive Summary & User Directive
- **Context**: The user requested removing external tip jar links (BuyMeACoffee) and third-party fee models, replacing them with their official verified Razorpay UPI Merchant QR poster issued for **"Wcode - PDF TOOL"**.
- **Crucial Safety Guardrail**:
  - The user explicitly instructed **not** to touch or configure live Razorpay server API keys (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`), which could jeopardize or cause conflict with their active SaaS product (`wcode.in`).
  - Instead, the platform directly embeds the official verified merchant QR standee provided by Razorpay, with an extracted high-intent UPI URI deep link for smartphone users.

---

## 2. Decoded Merchant Parameters
From the user-provided Razorpay QR standee image (`media_1790175168727.jpg`), OpenCV QR analysis decoded the following UPI payload:
- **UPI Deep Link**: `upi://pay?cu=INR&mc=8241&mode=19&pa=wcode883153.rzp@rxairtel&tn=Payment%20To%20Wcode&tr=TfWAYAYsmincbzqrv2`
- **Merchant VPA (UPI ID)**: `wcode883153.rzp@rxairtel`
- **Merchant Code**: `8241`
- **Settlement Beneficiary**: `Wcode (PDF TOOL)`
- **Payment Processor**: Razorpay UPI

---

## 3. Implementation Details

### A. Asset Pipeline
- Saved user's official Razorpay poster card into the static asset repository:
  - `apps/web/public/images/wcode-upi-qr.png`
  - `apps/web/public/images/wcode-razorpay-qr.jpg`

### B. Support Modal UI (`apps/web/views/layout.js`)
- Replaced the BuyMeACoffee $3/$5/$15 tier selector with:
  1. **Merchant Verification Badges**:
     - `VERIFIED MERCHANT: WCODE (PDF TOOL)` (emerald badge)
     - `POWERED BY RAZORPAY UPI` (azure badge)
  2. **High-Contrast Scannable QR Card**:
     - Centered display of the official Razorpay poster card with dark blueprint backdrop, rounded border, and elevation shadow.
  3. **One-Click VPA Copy Box**:
     - Displays `wcode883153.rzp@rxairtel` with a clipboard copy button that gives instant "Copied!" feedback and auto-resets.
  4. **Direct Intent CTAs**:
     - Mobile UPI deep-link button (`upi://pay?...`) allowing instant 1-tap checkout via Google Pay, PhonePe, Paytm, or BHIM.
     - "Save Official QR Poster" download anchor for offline saving.

### C. Responsive Modal Layout (`apps/web/public/styles.css`)
- Added `max-height: 90vh; overflow-y: auto;` with slim blueprint scrollbars to `.support-modal` and `.byok-modal` to ensure zero vertical clipping on compact laptop screens or mobile devices.

### D. Static Image Routing & Download Attachment (`apps/web/server.js`)
- Added explicit static routes for:
  - `/images/*` (`.png`, `.jpg`, `.jpeg`, `.webp`, `.svg`) with proper MIME types.
  - `/download-qr` endpoint returning `Content-Disposition: attachment; filename="wcode-pdf-tool-upi-qr.jpg"` ensuring instant browser download without 404 or popup blocking.
  - `/widget.js` static SDK endpoint.

### E. Pricing Section Alignment (`apps/web/views/static-pages.js`)
- Completely removed `$3+` fixed tip mention from the Community Supporter card.
- Replaced with open **"Any / pay what you wish"** and clear messaging:
  - *"Pay whatever amount feels right — zero minimums, zero limits"*
  - *"Keeps all 39 PDF & document tools 100% free with zero paywalls"*
  - *"Direct settlement to verified merchant Wcode (PDF Tool)"*
  - CTA button: `☕ Support with Any Amount` opening the verified Razorpay UPI QR modal.

### F. Post-Processing Support Banner & Toast (`apps/web/views/app-page.js`, `progress-tracker.js`, `styles.css`)
- **In-Page Banner**: Added the dedicated `[ COMMUNITY SUPPORTED • RUNNING 100% FREE FOR YOU ]` card inside the `#result-card` right above `NEXT RECOMMENDED ACTIONS`. Explains that edge servers run 100% free with zero ads and provides a direct `☕ Support via UPI (Pay What You Want)` button opening the Razorpay modal.
- **Floating Notification Toast**: Whenever a document finishes processing in any tool, a subtle bottom-right toast (`#support-toast-notification`) slides in:
  - *"Document Ready! ⚡ Servers run 100% free with zero ads. Help support edge hosting with a quick tip."*
  - Action button: `☕ Tip via UPI` triggers the verified merchant modal.
  - Auto-dismisses after 10 seconds or on manual close / workspace reset.

---

## 4. Verification & Quality Gates
- **Backlink Audit**: Ran `node apps/web/test/backlink-audit.js` — 39 / 39 routes HTTP 200, 100% catalog/mega-menu alignment.
- **Image & Download Endpoints**: Tested `/images/wcode-upi-qr.png` (200), `/images/wcode-razorpay-qr.jpg` (200), and `/download-qr` (200 with attachment header).
- **Post-Process Support Callouts**: Verified banner presence in `#result-card` above recommended actions and dynamic toast invocation in `showResult()`.
- **Zero API Risk**: Verified no server secrets or environment variables were added or altered.
