/**
 * DocPlatform Static Pages Views
 * Full HTML page templates for /pricing, /privacy, /terms, and /security.
 */

export function renderPricingPage({ renderNavbar, renderFooter }) {
  return `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>100% Free Document Tools & Community Support — DocPlatform</title>
  <meta name="description" content="DocPlatform is 100% free with zero login and complete in-browser privacy. Use AI tools with your own free Gemini key (BYOK) or support the project with a tip.">
  <link rel="canonical" href="https://docplatform.app/pricing">
  <link rel="stylesheet" href="/styles.css?v=3.0">
  <script>
    (function() {
      const saved = localStorage.getItem('dp_theme') || 'dark';
      document.documentElement.setAttribute('data-theme', saved);
    })();
    function toggleTheme() {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('dp_theme', next);
    }
  </script>
</head>
<body>
  ${renderNavbar('pricing')}

  <main class="main-content" style="padding-top: 2rem;">
    <!-- Pricing Hero Section -->
    <section class="pricing-hero">
      <h1 class="pricing-title">
        100% Free Forever & <br>
        <span class="pricing-title-gradient">Community Supported</span>
      </h1>
      <p class="pricing-subtitle">
        Zero paywalls, zero subscriptions, and zero forced signups. All core PDF tools run in your browser for free. Use AI tools with your own free Gemini key (BYOK), and support our project with a coffee tip!
      </p>
    </section>

    <!-- Pricing Grid Cards (Free Core, BYOK AI, Community Supporter) -->
    <div class="pricing-grid">
      <!-- 1. Free Core PDF Tier -->
      <div class="pricing-card">
        <div class="pricing-header">
          <div class="plan-icon-box" style="background: #f1f5f9; color: #475569;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
          </div>
          <h2 class="plan-name">Free Core PDF</h2>
          <p class="plan-desc">For everyday document tasks with 100% client-side privacy.</p>
        </div>
        <div class="plan-price-box">
          <span class="plan-price">$0</span>
          <span class="plan-period">/ forever</span>
        </div>
        <p class="plan-billed-note">100% Free • No credit card • No sign-in required</p>
        <ul class="plan-features-list">
          <li class="plan-feature-item">
            <span class="plan-feature-check">✓</span>
            <span><strong>Up to 50MB</strong> file size per operation</span>
          </li>
          <li class="plan-feature-item">
            <span class="plan-feature-check">✓</span>
            <span><strong>100% In-Browser Privacy</strong> (Zero cloud upload)</span>
          </li>
          <li class="plan-feature-item">
            <span class="plan-feature-check">✓</span>
            <span>Merge, Split, Rotate, Delete, Compress & Reorder</span>
          </li>
          <li class="plan-feature-item">
            <span class="plan-feature-check">✓</span>
            <span>Watermark, Protect, Unlock, Sign & Redact</span>
          </li>
          <li class="plan-feature-item">
            <span class="plan-feature-check">✓</span>
            <span>Office to PDF & PDF to Office Vector Converters</span>
          </li>
          <li class="plan-feature-item">
            <span class="plan-feature-check">✓</span>
            <span><strong>Zero watermarks</strong> on output documents</span>
          </li>
        </ul>
        <button class="plan-cta-btn" onclick="window.location.href='/merge-pdf'">Use Free PDF Tools</button>
      </div>

      <!-- 2. Free AI Intelligence & OCR (BYOK) -->
      <div class="pricing-card popular">
        <div class="popular-tag">
          <span>★</span> BRING YOUR OWN KEY (BYOK)
        </div>
        <div class="pricing-header">
          <div class="plan-icon-box" style="background: #fee2e2; color: #e5322d;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
          </div>
          <h2 class="plan-name">AI Intelligence & OCR</h2>
          <p class="plan-desc">For researchers, lawyers, and students using AI Document Analysis.</p>
        </div>
        <div class="plan-price-box">
          <span class="plan-price">$0</span>
          <span class="plan-period">/ with your key</span>
        </div>
        <p class="plan-billed-note">Free Google Gemini API • Stored 100% in your browser</p>
        <ul class="plan-features-list">
          <li class="plan-feature-item">
            <span class="plan-feature-check">✓</span>
            <span><strong>Grounded AI Q&A (RAG)</strong> with verified [Page X] citations</span>
          </li>
          <li class="plan-feature-item">
            <span class="plan-feature-check">✓</span>
            <span><strong>Hierarchical Summarizer</strong> (100+ page contracts & books)</span>
          </li>
          <li class="plan-feature-item">
            <span class="plan-feature-check">✓</span>
            <span><strong>AI Table Extractor</strong> (Clean JSON, CSV & Markdown)</span>
          </li>
          <li class="plan-feature-item">
            <span class="plan-feature-check">✓</span>
            <span><strong>Multilingual OCR</strong> & Searchable Sandwich PDFs</span>
          </li>
          <li class="plan-feature-item">
            <span class="plan-feature-check">✓</span>
            <span>Zero vendor lock-in — your key, your complete data privacy</span>
          </li>
          <li class="plan-feature-item">
            <span class="plan-feature-check">✓</span>
            <span>Google provides free 15 requests/minute tier</span>
          </li>
        </ul>
        <button class="plan-cta-btn primary" onclick="openApiKeyModal()">Configure Free AI Key</button>
      </div>

      <!-- 3. Community Supporter / Tip Jar -->
      <div class="pricing-card">
        <div class="pricing-header">
          <div class="plan-icon-box" style="background: #e0e7ff; color: #4338ca;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>
          </div>
          <h2 class="plan-name">Community Supporter</h2>
          <p class="plan-desc">Help us cover domain, CDN bandwidth, and open maintenance.</p>
        </div>
        <div class="plan-price-box">
          <span class="plan-price">$3+</span>
          <span class="plan-period">/ voluntary tip</span>
        </div>
        <p class="plan-billed-note">One-time coffee tip • Zero recurring charges</p>
        <ul class="plan-features-list">
          <li class="plan-feature-item">
            <span class="plan-feature-check">✓</span>
            <span>Keeps DocPlatform <strong>100% free and open</strong> for everyone</span>
          </li>
          <li class="plan-feature-item">
            <span class="plan-feature-check">✓</span>
            <span>Supports continuous updates, new tools & optimizations</span>
          </li>
          <li class="plan-feature-item">
            <span class="plan-feature-check">✓</span>
            <span>Directly funds fast edge CDN bandwidth & server costs</span>
          </li>
          <li class="plan-feature-item">
            <span class="plan-feature-check">✓</span>
            <span>Support independent, privacy-first software development</span>
          </li>
          <li class="plan-feature-item">
            <span class="plan-feature-check">✓</span>
            <span>No account required — tip directly via BuyMeACoffee / UPI</span>
          </li>
        </ul>
        <button class="plan-cta-btn" onclick="openSupportModal()">☕ Support with a Tip</button>
      </div>
    </div>

    <!-- Feature Comparison Section -->
    <section class="comparison-section">
      <h2 class="comparison-title">Complete Transparency & Feature Overview</h2>
      <p class="comparison-subtitle">Every tool is accessible to everyone. Here is how DocPlatform operates.</p>

      <div class="table-responsive">
        <table class="comparison-table">
          <thead>
            <tr>
              <th style="width: 40%;">Platform Capability</th>
              <th style="width: 30%;">Core PDF Tools</th>
              <th style="width: 30%;">AI Intelligence & OCR</th>
            </tr>
          </thead>
          <tbody>
            <tr class="category-header">
              <td colspan="3">Document Privacy & Processing</td>
            </tr>
            <tr>
              <td>Cost to User</td>
              <td><strong style="color: #16a34a;">$0 (Free Forever)</strong></td>
              <td><strong style="color: #16a34a;">$0 (Free BYOK)</strong></td>
            </tr>
            <tr>
              <td>User Login / Sign-up Required</td>
              <td><span class="check-yes">✓</span> None (Zero Login)</td>
              <td><span class="check-yes">✓</span> None (Zero Login)</td>
            </tr>
            <tr>
              <td>Processing Engine</td>
              <td>100% In-Browser (WASM / JS)</td>
              <td>Client + Gemini AI / OCR</td>
            </tr>
            <tr>
              <td>Document Cloud Retention</td>
              <td>0s (Never leaves your browser)</td>
              <td>0s (Zero cloud retention)</td>
            </tr>
            <tr>
              <td>Watermarks on Output</td>
              <td><span class="check-yes">✓</span> None (Clean PDFs)</td>
              <td><span class="check-yes">✓</span> None (Clean Output)</td>
            </tr>

            <tr class="category-header">
              <td colspan="3">Supported Document Operations</td>
            </tr>
            <tr>
              <td>Core PDF (Merge, Split, Rotate, Delete, Extract, Compress)</td>
              <td><span class="check-yes">✓</span> Full Access</td>
              <td><span class="check-yes">✓</span> Full Access</td>
            </tr>
            <tr>
              <td>Security (Watermark, Password Protect, Unlock, Redact, Sign)</td>
              <td><span class="check-yes">✓</span> Full Access</td>
              <td><span class="check-yes">✓</span> Full Access</td>
            </tr>
            <tr>
              <td>Conversions (Word, Excel, PowerPoint ↔ PDF)</td>
              <td><span class="check-yes">✓</span> Full Access</td>
              <td><span class="check-yes">✓</span> Full Access</td>
            </tr>
            <tr>
              <td>Multilingual OCR (Sandwich Searchable PDF)</td>
              <td>Standard</td>
              <td><span class="check-yes">✓</span> Full Vector Layer</td>
            </tr>
            <tr>
              <td>Grounded AI Q&A (RAG with [Page X] Citations)</td>
              <td>—</td>
              <td><span class="check-yes">✓</span> With Free Gemini Key</td>
            </tr>
            <tr>
              <td>Hierarchical Summarizer & Table Extractor</td>
              <td>—</td>
              <td><span class="check-yes">✓</span> With Free Gemini Key</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Pricing FAQs Accordion -->
    <section class="faq-container" style="margin-bottom: 3rem;">
      <h2 style="font-size: 2.1rem; font-weight: 800; text-align: center; color: var(--text-hero); margin-bottom: 1.75rem; letter-spacing: -0.02em;">Frequently Asked Questions</h2>
      <div class="faq-item">
        <div class="faq-question">
          <span>Why is DocPlatform completely free with no login?</span>
          <div class="faq-icon">+</div>
        </div>
        <div class="faq-answer">
          We believe basic document tasks (like merging contracts, splitting pages, and compressing files) should be private, fast, and accessible to students, researchers, and professionals worldwide. Because our processing runs directly inside your local web browser, our server costs are nearly zero — so we pass that complete freedom on to you.
        </div>
      </div>
      <div class="faq-item">
        <div class="faq-question">
          <span>How does Bring Your Own Key (BYOK) work for AI tools?</span>
          <div class="faq-icon">+</div>
        </div>
        <div class="faq-answer">
          To use AI Document Q&A, Summaries, and Table Extraction, you provide your own free Google Gemini API Key. Google provides a generous free tier (15 requests/minute). Your API key is stored exclusively in your browser's localStorage and is never saved to our database.
        </div>
      </div>
      <div class="faq-item">
        <div class="faq-question">
          <span>Are my documents private and secure?</span>
          <div class="faq-icon">+</div>
        </div>
        <div class="faq-answer">
          Yes, 100%. For standard PDF operations, the WebAssembly engine runs directly on your device — your files are never uploaded to any remote server or cloud bucket. For AI tools, only the specific text chunks you analyze are sent to Google's API via your personal key.
        </div>
      </div>
      <div class="faq-item">
        <div class="faq-question">
          <span>How can I support the project?</span>
          <div class="faq-icon">+</div>
        </div>
        <div class="faq-answer">
          If DocPlatform saved you time, you can support our domain, CDN bandwidth, and open maintenance costs with a voluntary coffee tip ($3, $5, or $15) via BuyMeACoffee or UPI. We are deeply grateful for your support!
        </div>
      </div>
      <div class="faq-item">
        <div class="faq-question">
          <span>Do you offer custom enterprise deployment or developer assistance?</span>
          <div class="faq-icon">+</div>
        </div>
        <div class="faq-answer">
          Yes! If you represent a law firm, accounting enterprise, or healthcare organization that needs custom air-gapped on-premise deployments or custom AI integrations, you can reach our engineering team directly at support@docplatform.com.
        </div>
      </div>
    </section>
  </main>

  ${renderFooter()}
  <script type="module" src="/app.js?v=3.0"></script>
</body>
</html>`;
}

export function renderPrivacyPage({ renderNavbar, renderFooter }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Privacy Policy & Zero-Retention Architecture — DocPlatform</title>
  <meta name="description" content="Learn how DocPlatform protects your documents with 100% in-browser processing, zero cloud retention, and local BYOK Gemini key privacy.">
  <link rel="canonical" href="https://docplatform.app/privacy">
  <link rel="stylesheet" href="/styles.css?v=2.3">
</head>
<body>
  ${renderNavbar('')}

  <main class="main-content" style="padding-top: 2rem;">
    <nav class="breadcrumb-bar" aria-label="Breadcrumb">
      <a href="/">Home</a>
      <span class="breadcrumb-sep">/</span>
      <span class="breadcrumb-current">Privacy Policy</span>
    </nav>

    <section class="pricing-hero" style="margin-bottom: 2rem;">
      <h1 class="pricing-title">
        Privacy Policy & <br>
        <span class="pricing-title-gradient">Zero-Retention Guarantee</span>
      </h1>
      <p class="pricing-subtitle">
        Your documents belong to you. We believe privacy is a fundamental human right, not a paid tier feature.
      </p>
    </section>

    <div style="max-width: 860px; margin: 0 auto 5rem; background: #ffffff; border: 1px solid var(--border-subtle); border-radius: 16px; padding: 2.75rem 2.25rem; box-shadow: 0 4px 20px rgba(0,0,0,0.03); line-height: 1.8; color: var(--text-primary);">
      <div style="display: inline-flex; align-items: center; gap: 0.5rem; background: #dcfce7; color: #166534; padding: 0.35rem 0.9rem; border-radius: 9999px; font-weight: 700; font-size: 0.82rem; margin-bottom: 1.5rem;">
        <span>🔒</span> Zero Cloud Data Retention • Last Updated September 2026
      </div>

      <h2 style="font-size: 1.45rem; font-weight: 800; color: var(--text-hero); margin: 1.5rem 0 0.5rem;">1. 100% In-Browser Processing (Client-Side Privacy)</h2>
      <p>
        For standard PDF operations (including <strong>Merge, Split, Rotate, Compress, Delete Pages, Image to PDF, and Password Protect</strong>), all processing executes <strong>entirely inside your browser</strong> via WebAssembly and JavaScript vector engines. Your document bytes never leave your device and are never transmitted to our servers or stored in any cloud bucket.
      </p>

      <h2 style="font-size: 1.45rem; font-weight: 800; color: var(--text-hero); margin: 2rem 0 0.5rem;">2. Bring Your Own Key (BYOK) for AI Intelligence</h2>
      <p>
        For AI Document Q&A, Summaries, and Table Extraction, you provide your own free Google Gemini API Key. Your key is stored <strong>exclusively in your browser's localStorage</strong>. It is never written to our database, never logged, and never accessible by our team.
      </p>

      <h2 style="font-size: 1.45rem; font-weight: 800; color: var(--text-hero); margin: 2rem 0 0.5rem;">3. Ephemeral Server Workers & 60-Minute Auto-Purge</h2>
      <p>
        For heavy server conversions (such as high-fidelity Office to PDF or multilingual OCR), input files are held temporarily in ephemeral isolated scratch memory. Our automated <strong>Job-TTL Cleanup Daemon</strong> forcefully purges all inputs, outputs, and intermediate scratch files within <strong>60 minutes</strong> of job completion.
      </p>

      <h2 style="font-size: 1.45rem; font-weight: 800; color: var(--text-hero); margin: 2rem 0 0.5rem;">4. Zero Tracking, Cookies, or Data Monetization</h2>
      <p>
        We do not use tracking cookies, we do not profile your reading habits, and <strong>we never sell or monetize user data</strong>. DocPlatform is sustained through voluntary community coffee tips and open-source sponsorship.
      </p>

      <h2 style="font-size: 1.45rem; font-weight: 800; color: var(--text-hero); margin: 2rem 0 0.5rem;">5. Contact Our Privacy Team</h2>
      <p>
        If you have questions regarding our privacy architecture or require custom air-gapped on-premise deployments, contact us directly at <a href="mailto:support@docplatform.com" style="color: var(--brand-primary); font-weight: 700; text-decoration: underline;">support@docplatform.com</a>.
      </p>
    </div>
  </main>

  ${renderFooter()}
  <script type="module" src="/app.js?v=3.0"></script>
</body>
</html>`;
}

export function renderTermsPage({ renderNavbar, renderFooter }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Terms of Service — DocPlatform</title>
  <meta name="description" content="Simple, transparent, and developer-friendly Terms of Service for DocPlatform.">
  <link rel="canonical" href="https://docplatform.app/terms">
  <link rel="stylesheet" href="/styles.css?v=2.3">
</head>
<body>
  ${renderNavbar('')}

  <main class="main-content" style="padding-top: 2rem;">
    <nav class="breadcrumb-bar" aria-label="Breadcrumb">
      <a href="/">Home</a>
      <span class="breadcrumb-sep">/</span>
      <span class="breadcrumb-current">Terms of Service</span>
    </nav>

    <section class="pricing-hero" style="margin-bottom: 2rem;">
      <h1 class="pricing-title">
        Terms of <br>
        <span class="pricing-title-gradient">Service & Usage</span>
      </h1>
      <p class="pricing-subtitle">
        Zero paywalls, zero hidden contracts. Straightforward terms for our free document platform.
      </p>
    </section>

    <div style="max-width: 860px; margin: 0 auto 5rem; background: #ffffff; border: 1px solid var(--border-subtle); border-radius: 16px; padding: 2.75rem 2.25rem; box-shadow: 0 4px 20px rgba(0,0,0,0.03); line-height: 1.8; color: var(--text-primary);">
      <h2 style="font-size: 1.45rem; font-weight: 800; color: var(--text-hero); margin: 1rem 0 0.5rem;">1. Free & Zero-Login Commitment</h2>
      <p>
        DocPlatform is provided free of charge for personal, educational, and commercial use. You are not required to create an account, register your email, or provide credit card information to use any core document processing feature.
      </p>

      <h2 style="font-size: 1.45rem; font-weight: 800; color: var(--text-hero); margin: 2rem 0 0.5rem;">2. Acceptable Use Guidelines</h2>
      <p>
        You agree not to use DocPlatform to process, generate, or distribute malicious code, illegal materials, or execute denial-of-service (DoS) attacks against our infrastructure. Batch rate limits are enforced at the network level to ensure fair availability for all community users.
      </p>

      <h2 style="font-size: 1.45rem; font-weight: 800; color: var(--text-hero); margin: 2rem 0 0.5rem;">3. Intellectual Property</h2>
      <p>
        You retain 100% full ownership, rights, and copyright to all documents and data you process using DocPlatform. We claim zero rights or ownership over your content.
      </p>

      <h2 style="font-size: 1.45rem; font-weight: 800; color: var(--text-hero); margin: 2rem 0 0.5rem;">4. Disclaimer & Limitation of Liability</h2>
      <p>
        DocPlatform is provided "as is" without warranty of any kind, either express or implied. While we employ rigorous automated testing and cryptographic verification, users are encouraged to maintain backups of critical original documents before performing irreversible batch modifications.
      </p>

      <h2 style="font-size: 1.45rem; font-weight: 800; color: var(--text-hero); margin: 2rem 0 0.5rem;">5. Voluntary Community Support</h2>
      <p>
        Any tip or donation made via our coffee tip jar is voluntary gratitude and does not create an ongoing commercial contract or service-level commitment.
      </p>
    </div>
  </main>

  ${renderFooter()}
  <script type="module" src="/app.js?v=3.0"></script>
</body>
</html>`;
}

export function renderSecurityPage({ renderNavbar, renderFooter }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Security Architecture & Whitepaper — DocPlatform</title>
  <meta name="description" content="Technical overview of DocPlatform's security model: AES-256 GCM encryption, zero-leak vector redaction, sandboxed worker isolation, and ephemeral TTL memory.">
  <link rel="canonical" href="https://docplatform.app/security">
  <link rel="stylesheet" href="/styles.css?v=2.3">
</head>
<body>
  ${renderNavbar('')}

  <main class="main-content" style="padding-top: 2rem;">
    <nav class="breadcrumb-bar" aria-label="Breadcrumb">
      <a href="/">Home</a>
      <span class="breadcrumb-sep">/</span>
      <span class="breadcrumb-current">Security Whitepaper</span>
    </nav>

    <section class="pricing-hero" style="margin-bottom: 2rem;">
      <h1 class="pricing-title">
        Security Architecture & <br>
        <span class="pricing-title-gradient">Encryption Whitepaper</span>
      </h1>
      <p class="pricing-subtitle">
        Engineered with defense-in-depth security, strict memory isolation, and zero-leak document redaction.
      </p>
    </section>

    <div style="max-width: 860px; margin: 0 auto 5rem; background: #ffffff; border: 1px solid var(--border-subtle); border-radius: 16px; padding: 2.75rem 2.25rem; box-shadow: 0 4px 20px rgba(0,0,0,0.03); line-height: 1.8; color: var(--text-primary);">
      <h2 style="font-size: 1.45rem; font-weight: 800; color: var(--text-hero); margin: 1rem 0 0.5rem;">1. Cryptographic Standards (AES-256 GCM)</h2>
      <p>
        DocPlatform implements true AES-256 GCM authenticated encryption with PBKDF2 key derivation for PDF protection. Document permissions (printing, extraction, modification) are enforced cryptographically with 128-bit/256-bit permission flags.
      </p>

      <h2 style="font-size: 1.45rem; font-weight: 800; color: var(--text-hero); margin: 2rem 0 0.5rem;">2. Permanent Zero-Leak Vector Redaction</h2>
      <p>
        Unlike naive tools that merely draw a visual black box over sensitive text while leaving the underlying text stream selectable, DocPlatform's Redaction engine scrubs the underlying vector character streams, removes cached form XObjects, and strips metadata dictionary trails to guarantee <strong>zero-leak redaction</strong>.
      </p>

      <h2 style="font-size: 1.45rem; font-weight: 800; color: var(--text-hero); margin: 2rem 0 0.5rem;">3. Sandboxed Worker Isolation (SandboxedWorkerHarness)</h2>
      <p>
        All server-side conversion tasks execute inside sandboxed child worker processes with:
      </p>
      <ul style="padding-left: 1.5rem; margin: 0.75rem 0;">
        <li>Strict <strong>60-second execution CPU timeout budgets</strong> to neutralize decompression bombs (zip bombs).</li>
        <li>Memory consumption caps enforced per worker lease.</li>
        <li>Automatic subprocess process-group termination (SIGKILL) on timeout.</li>
      </ul>

      <h2 style="font-size: 1.45rem; font-weight: 800; color: var(--text-hero); margin: 2rem 0 0.5rem;">4. Automated Storage Hygiene (Job-TTL Daemon)</h2>
      <p>
        Our background cleanup daemon continuously monitors the file storage layer and automatically purges all temporary files older than <strong>60 minutes</strong>. No unencrypted document data is permanently archived.
      </p>

      <h2 style="font-size: 1.45rem; font-weight: 800; color: var(--text-hero); margin: 2rem 0 0.5rem;">5. Responsible Disclosure</h2>
      <p>
        If you discover a security vulnerability, please report it immediately to <a href="mailto:security@docplatform.com" style="color: var(--brand-primary); font-weight: 700; text-decoration: underline;">security@docplatform.com</a>. We review all security inquiries within 24 hours.
      </p>
    </div>
  </main>

  ${renderFooter()}
  <script type="module" src="/app.js?v=3.0"></script>
</body>
</html>`;
}

// CommonJS fallback
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    renderPricingPage,
    renderPrivacyPage,
    renderTermsPage,
    renderSecurityPage
  };
}
