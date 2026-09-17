/**
 * DocPlatform Static Pages Views
 * Full HTML page templates for /pricing, /privacy, /terms, and /security.
 */

export function renderPricingPage({ renderNavbar, renderFooter, renderGsapScripts }) {
  return `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pricing & Transparency — DocPlatform</title>
  <meta name="description" content="DocPlatform is 100% free with zero login and complete in-browser privacy. Use AI tools with your own free Gemini key (BYOK) or support the project with a tip.">
  <link rel="canonical" href="https://docplatform.app/pricing">
  
  <!-- Preconnect & Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">

  <link rel="stylesheet" href="/styles.css?v=3.2">

  <!-- Tailwind CDN with DocPlatform Architectural Palette Extension -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: ['selector', '[data-theme="dark"]'],
      theme: {
        extend: {
          colors: {
            bg: 'var(--bg)',
            'bg-subtle': 'var(--bg-subtle)',
            'bg-elevated': 'var(--bg-elevated)',
            border: 'var(--border)',
            accent: 'var(--accent)',
            'accent-hover': 'var(--accent-hover)',
            'accent-foreground': 'var(--accent-foreground)',
            'text-primary': 'var(--text-primary)',
            'text-secondary': 'var(--text-secondary)',
            'text-muted': 'var(--text-muted)',
          },
          fontFamily: {
            display: ['"Instrument Serif"', 'Georgia', 'serif'],
            mono: ['"JetBrains Mono"', 'monospace'],
            sans: ['"Plus Jakarta Sans"', 'sans-serif'],
          }
        }
      }
    }
  </script>

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
<body class="min-h-screen flex flex-col bg-bg text-text-primary antialiased">
  ${renderNavbar('pricing')}

  <!-- GSAP ScrollSmoother Wrapper & Blueprint Canvas -->
  <div id="smooth-wrapper">
    <div id="smooth-content" style="padding-top: 51px;">
      <main class="w-full flex-1">
    <div class="mx-auto max-w-5xl border-x border-dashed border-border flex flex-col">
      
      <!-- Architectural Hero -->
      <div class="relative overflow-hidden border-b border-dashed border-border py-14 px-6 sm:px-10">
        <div class="linework pointer-events-none absolute inset-0"></div>

        <div class="relative z-10 max-w-3xl flex flex-col gap-3">
          <div class="flex items-center gap-3">
            <span class="mono-copy inline-flex items-center gap-1.5 border border-border bg-bg-elevated px-2.5 py-1 text-[11px] text-text-primary tracking-wide">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="#7b61ff" stroke="#7b61ff" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              ★ Zero Paywalls • 100% In-Browser
            </span>
            <div style="height: 1px; width: 120px; background: linear-gradient(to right, var(--border), transparent);"></div>
          </div>

          <h1 class="hero-display text-5xl sm:text-7xl text-text-secondary leading-[1.08]">
            <span>100% Free Forever.</span><br/>
            <span class="text-text-primary">Supported by Community.</span>
          </h1>

          <p class="mono-copy mt-2 text-xs leading-relaxed text-text-secondary max-w-xl">
            Zero subscriptions, no credit cards, zero forced signups. All core PDF tools run in your browser WebAssembly sandbox. Use AI tools with your own free Gemini key (BYOK), or support the project with a coffee tip.
          </p>
        </div>
      </div>

      <!-- 3-Tier Blueprint Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-dashed divide-border border-b border-dashed border-border">
        
        <!-- Tier 1: Free Core PDF -->
        <div class="p-7 sm:p-8 bg-bg flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between">
              <span class="mono-copy text-xs font-semibold text-text-primary flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7b61ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                Free Core PDF
              </span>
            </div>
            <p class="mono-copy text-[11px] text-text-secondary mt-1.5 leading-normal">
              Everyday document workflows with 100% client-side WebAssembly privacy.
            </p>

            <div class="mt-5 flex items-baseline gap-1.5">
              <span class="hero-display text-5xl text-text-primary font-bold">$0</span>
              <span class="mono-copy text-xs text-text-muted">/ forever</span>
            </div>
            <div class="mono-copy text-[10px] text-emerald-400 mt-1">100% Free • No Sign-In Required</div>

            <ul class="mono-copy text-xs text-text-secondary space-y-2.5 mt-6">
              <li class="flex items-center gap-2"><span class="text-[#7b61ff]">✓</span> <span>Up to 50MB file size per operation</span></li>
              <li class="flex items-center gap-2"><span class="text-[#7b61ff]">✓</span> <span>100% in-browser WASM sandbox</span></li>
              <li class="flex items-center gap-2"><span class="text-[#7b61ff]">✓</span> <span>Merge, Split, Rotate, Compress, Delete</span></li>
              <li class="flex items-center gap-2"><span class="text-[#7b61ff]">✓</span> <span>Watermark, Protect, Unlock & Redact</span></li>
              <li class="flex items-center gap-2"><span class="text-[#7b61ff]">✓</span> <span>Office conversions (Word, Excel)</span></li>
              <li class="flex items-center gap-2"><span class="text-[#7b61ff]">✓</span> <span>Zero watermarks on exports</span></li>
            </ul>
          </div>

          <div class="mt-8">
            <a href="/merge-pdf" class="paper-cta-btn group w-full justify-center">
              <span class="cta-fill"></span>
              <span class="relative z-10 flex items-center gap-1.5">
                <span>Use Free Tools</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </span>
            </a>
          </div>
        </div>

        <!-- Tier 2: AI Intelligence & OCR (BYOK) -->
        <div class="p-7 sm:p-8 bg-bg-elevated flex flex-col justify-between relative">
          <div>
            <div class="flex items-center justify-between">
              <span class="mono-copy text-xs font-semibold text-text-primary flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7b61ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                AI & OCR Studio
              </span>
              <span class="mono-copy text-[9px] uppercase tracking-wider px-2 py-0.5 border border-[#7b61ff]/40 text-[#7b61ff] bg-[#7b61ff]/10">BYOK</span>
            </div>
            <p class="mono-copy text-[11px] text-text-secondary mt-1.5 leading-normal">
              Grounded AI Q&A, summaries, and OCR powered by your free Gemini API key.
            </p>

            <div class="mt-5 flex items-baseline gap-1.5">
              <span class="hero-display text-5xl text-[#7b61ff] font-bold">$0</span>
              <span class="mono-copy text-xs text-text-muted">/ with your key</span>
            </div>
            <div class="mono-copy text-[10px] text-[#7b61ff] mt-1">Free Google Key • Zero Server Retention</div>

            <ul class="mono-copy text-xs text-text-secondary space-y-2.5 mt-6">
              <li class="flex items-center gap-2"><span class="text-[#7b61ff]">✓</span> <span>Grounded AI Q&A with page citations</span></li>
              <li class="flex items-center gap-2"><span class="text-[#7b61ff]">✓</span> <span>Executive summaries of 100+ pages</span></li>
              <li class="flex items-center gap-2"><span class="text-[#7b61ff]">✓</span> <span>AI Table Extractor (CSV, JSON, MD)</span></li>
              <li class="flex items-center gap-2"><span class="text-[#7b61ff]">✓</span> <span>Multilingual OCR text extraction</span></li>
              <li class="flex items-center gap-2"><span class="text-[#7b61ff]">✓</span> <span>Keys stored exclusively in localStorage</span></li>
              <li class="flex items-center gap-2"><span class="text-[#7b61ff]">✓</span> <span>Google provides free 15 req/min</span></li>
            </ul>
          </div>

          <div class="mt-8">
            <button type="button" onclick="openApiKeyModal()" class="paper-cta-btn group w-full justify-center">
              <span class="cta-fill"></span>
              <span class="relative z-10 flex items-center gap-1.5">
                <span>🔑 Add AI Key (Free)</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </span>
            </button>
          </div>
        </div>

        <!-- Tier 3: Community Supporter -->
        <div class="p-7 sm:p-8 bg-bg flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between">
              <span class="mono-copy text-xs font-semibold text-text-primary flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7b61ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>
                Community Supporter
              </span>
            </div>
            <p class="mono-copy text-[11px] text-text-secondary mt-1.5 leading-normal">
              Help us fund edge CDN bandwidth, domain hosting, and open maintenance.
            </p>

            <div class="mt-5 flex items-baseline gap-1.5">
              <span class="hero-display text-5xl text-text-primary font-bold">$3+</span>
              <span class="mono-copy text-xs text-text-muted">/ voluntary tip</span>
            </div>
            <div class="mono-copy text-[10px] text-amber-400 mt-1">One-Time Coffee Tip • Zero Recurring</div>

            <ul class="mono-copy text-xs text-text-secondary space-y-2.5 mt-6">
              <li class="flex items-center gap-2"><span class="text-[#7b61ff]">✓</span> <span>Keeps platform 100% free for everyone</span></li>
              <li class="flex items-center gap-2"><span class="text-[#7b61ff]">✓</span> <span>Funds edge CDN speed and server costs</span></li>
              <li class="flex items-center gap-2"><span class="text-[#7b61ff]">✓</span> <span>Direct support for independent privacy dev</span></li>
              <li class="flex items-center gap-2"><span class="text-[#7b61ff]">✓</span> <span>Priority feedback & feature suggestions</span></li>
              <li class="flex items-center gap-2"><span class="text-[#7b61ff]">✓</span> <span>Voluntary gratitude — no locked features</span></li>
              <li class="flex items-center gap-2"><span class="text-[#7b61ff]">✓</span> <span>Tip directly via BuyMeACoffee or UPI</span></li>
            </ul>
          </div>

          <div class="mt-8">
            <button type="button" onclick="openSupportModal()" class="paper-cta-btn group w-full justify-center">
              <span class="cta-fill"></span>
              <span class="relative z-10 flex items-center gap-1.5">
                <span>☕ Tip on BuyMeACoffee</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </span>
            </button>
          </div>
        </div>

      </div>

      <!-- Architectural Transparency Matrix -->
      <div class="p-6 sm:p-10 border-b border-dashed border-border bg-bg-subtle/20">
        <h2 class="hero-display text-2xl sm:text-3xl text-text-primary mb-2">Transparency & Security Architecture</h2>
        <p class="mono-copy text-xs text-text-secondary mb-6">How DocPlatform operates with complete zero-storage client integrity.</p>

        <div class="overflow-x-auto border border-dashed border-border">
          <table class="w-full text-left mono-copy text-xs divide-y divide-dashed divide-border">
            <thead class="bg-bg-elevated text-text-muted text-[10px] uppercase tracking-wider">
              <tr class="divide-x divide-dashed divide-border">
                <th class="p-3.5">Capability</th>
                <th class="p-3.5">Core PDF Tools</th>
                <th class="p-3.5">AI & OCR Engine</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-dashed divide-border text-text-secondary">
              <tr class="divide-x divide-dashed divide-border">
                <td class="p-3.5 font-medium text-text-primary">User Cost</td>
                <td class="p-3.5 text-emerald-400 font-semibold">$0 (Free Forever)</td>
                <td class="p-3.5 text-emerald-400 font-semibold">$0 (Free BYOK)</td>
              </tr>
              <tr class="divide-x divide-dashed divide-border">
                <td class="p-3.5 font-medium text-text-primary">Sign-in Required</td>
                <td class="p-3.5">None (Zero Login)</td>
                <td class="p-3.5">None (Local Key Storage)</td>
              </tr>
              <tr class="divide-x divide-dashed divide-border">
                <td class="p-3.5 font-medium text-text-primary">Execution Engine</td>
                <td class="p-3.5">100% In-Browser WASM</td>
                <td class="p-3.5">Client RAM + Gemini API</td>
              </tr>
              <tr class="divide-x divide-dashed divide-border">
                <td class="p-3.5 font-medium text-text-primary">Cloud Retention</td>
                <td class="p-3.5">0 bytes / 0 seconds</td>
                <td class="p-3.5">0 bytes stored on our server</td>
              </tr>
              <tr class="divide-x divide-dashed divide-border">
                <td class="p-3.5 font-medium text-text-primary">Watermarks</td>
                <td class="p-3.5">None (Clean Output)</td>
                <td class="p-3.5">None (Clean Output)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- FAQ Section -->
      <div class="p-6 sm:p-10">
        <h2 class="hero-display text-2xl sm:text-3xl text-text-primary mb-2">Frequently Asked Questions</h2>
        <p class="mono-copy text-xs text-text-secondary mb-6">Common questions regarding privacy, BYOK keys, and free limits.</p>

        <div class="space-y-4">
          <div class="border border-dashed border-border p-5 bg-bg-elevated">
            <h3 class="mono-copy text-xs font-semibold text-text-primary mb-1.5">Why is DocPlatform completely free with zero login?</h3>
            <p class="mono-copy text-xs text-text-secondary leading-relaxed">
              Because all document processing executes directly inside your local web browser using WebAssembly, our backend compute costs are virtually non-existent. We pass that complete freedom on to you.
            </p>
          </div>

          <div class="border border-dashed border-border p-5 bg-bg-elevated">
            <h3 class="mono-copy text-xs font-semibold text-text-primary mb-1.5">How does Bring Your Own Key (BYOK) work?</h3>
            <p class="mono-copy text-xs text-text-secondary leading-relaxed">
              To use AI Document Q&A, Summaries, and Table Extraction, you provide your own free Google Gemini API Key. Google provides a generous free tier (15 requests/minute). Your API key is stored exclusively in your browser's localStorage and is never saved to our database.
            </p>
          </div>

          <div class="border border-dashed border-border p-5 bg-bg-elevated">
            <h3 class="mono-copy text-xs font-semibold text-text-primary mb-1.5">Are my documents private and secure?</h3>
            <p class="mono-copy text-xs text-text-secondary leading-relaxed">
              Yes, 100%. For standard PDF operations, the WebAssembly engine runs directly on your device — your files are never uploaded to any remote server or cloud bucket.
            </p>
          </div>
        </div>
      </div>

      </main>

      ${renderFooter()}
    </div>
  </div>
  ${typeof renderGsapScripts === 'function' ? renderGsapScripts() : ''}
  <script type="module" src="/app.js?v=3.2"></script>
</body>
</html>`;
}

export function renderPrivacyPage({ renderNavbar, renderFooter, renderGsapScripts }) {
  return `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Privacy Architecture & Zero-Retention Policy — DocPlatform</title>
  <meta name="description" content="Learn how DocPlatform protects your documents with 100% in-browser processing, zero cloud retention, and local BYOK Gemini key privacy.">
  <link rel="canonical" href="https://docplatform.app/privacy">

  <!-- Preconnect & Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">

  <link rel="stylesheet" href="/styles.css?v=3.2">

  <!-- Tailwind CDN with DocPlatform Blueprint Configuration -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: ['selector', '[data-theme="dark"]'],
      theme: {
        extend: {
          colors: {
            bg: 'var(--bg)',
            'bg-subtle': 'var(--bg-subtle)',
            'bg-elevated': 'var(--bg-elevated)',
            border: 'var(--border)',
            accent: 'var(--accent)',
            'accent-hover': 'var(--accent-hover)',
            'accent-foreground': 'var(--accent-foreground)',
            'text-primary': 'var(--text-primary)',
            'text-secondary': 'var(--text-secondary)',
            'text-muted': 'var(--text-muted)',
          },
          fontFamily: {
            display: ['"Instrument Serif"', 'Georgia', 'serif'],
            mono: ['"JetBrains Mono"', 'monospace'],
            sans: ['"Plus Jakarta Sans"', 'sans-serif'],
          }
        }
      }
    }
  </script>

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
<body class="min-h-screen flex flex-col bg-bg text-text-primary antialiased">
  ${renderNavbar('')}

  <!-- GSAP ScrollSmoother Wrapper & Blueprint Canvas -->
  <div id="smooth-wrapper">
    <div id="smooth-content" style="padding-top: 51px;">
      <main class="w-full flex-1">
    <div class="mx-auto max-w-5xl border-x border-dashed border-border flex flex-col">
      
      <!-- Architectural Hero -->
      <div class="relative overflow-hidden border-b border-dashed border-border py-12 px-6 sm:px-10">
        <div class="linework pointer-events-none absolute inset-0"></div>

        <div class="relative z-10 max-w-3xl flex flex-col gap-3">
          <nav class="mono-copy flex items-center gap-1.5 text-xs text-text-muted" aria-label="Breadcrumb">
            <a href="/" class="hover:text-text-primary transition-colors">Home</a>
            <span class="text-border">/</span>
            <span class="text-text-primary font-medium">Privacy Architecture</span>
          </nav>

          <div class="flex items-center gap-3 mt-1">
            <span class="mono-copy inline-flex items-center gap-1.5 border border-border bg-bg-elevated px-2.5 py-1 text-[11px] text-text-primary tracking-wide">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#7b61ff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              ★ Zero Server Persistence • 100% Client-Side
            </span>
            <div style="height: 1px; width: 80px; background: linear-gradient(to right, var(--border), transparent);"></div>
          </div>

          <h1 class="hero-display text-4xl sm:text-6xl text-text-primary tracking-tight">Privacy Architecture</h1>
          <p class="mono-copy text-xs sm:text-sm text-text-secondary max-w-2xl leading-relaxed">
            Your documents belong to you. We believe privacy is a fundamental architecture requirement, not a paid tier feature.
          </p>
        </div>
      </div>

      <!-- Content Sections -->
      <div class="p-6 sm:p-10 space-y-6">
        
        <div class="border border-dashed border-border bg-bg-elevated p-6">
          <div class="mono-copy text-[10px] text-accent uppercase tracking-widest mb-1.5">[ PRINCIPLE_01 ]</div>
          <h2 class="mono-copy text-sm font-bold text-text-primary uppercase tracking-wide mb-3">1. 100% In-Browser Processing (Client-Side Privacy)</h2>
          <p class="mono-copy text-xs text-text-secondary leading-relaxed">
            For standard PDF operations (including Merge, Split, Rotate, Compress, Delete Pages, Image to PDF, and Password Protect), all processing executes entirely inside your browser via WebAssembly and JavaScript vector engines. Your document bytes never leave your device and are never transmitted to our servers or stored in any cloud bucket.
          </p>
        </div>

        <div class="border border-dashed border-border bg-bg-elevated p-6">
          <div class="mono-copy text-[10px] text-accent uppercase tracking-widest mb-1.5">[ PRINCIPLE_02 ]</div>
          <h2 class="mono-copy text-sm font-bold text-text-primary uppercase tracking-wide mb-3">2. Bring Your Own Key (BYOK) for AI Intelligence</h2>
          <p class="mono-copy text-xs text-text-secondary leading-relaxed">
            For AI Document Q&A, Summaries, and Table Extraction, you provide your own free Google Gemini API Key. Your key is stored exclusively in your browser's localStorage. It is never written to our database, never logged on any backend server, and never accessible by our team.
          </p>
        </div>

        <div class="border border-dashed border-border bg-bg-elevated p-6">
          <div class="mono-copy text-[10px] text-accent uppercase tracking-widest mb-1.5">[ PRINCIPLE_03 ]</div>
          <h2 class="mono-copy text-sm font-bold text-text-primary uppercase tracking-wide mb-3">3. Ephemeral Server Workers & 60-Minute Auto-Purge</h2>
          <p class="mono-copy text-xs text-text-secondary leading-relaxed">
            For heavy server conversions (such as high-fidelity Office to PDF or multilingual OCR), input files are held temporarily in ephemeral isolated scratch memory. Our automated Job-TTL Cleanup Daemon forcefully purges all inputs, outputs, and intermediate scratch files within 60 minutes of job completion.
          </p>
        </div>

        <div class="border border-dashed border-border bg-bg-elevated p-6">
          <div class="mono-copy text-[10px] text-accent uppercase tracking-widest mb-1.5">[ PRINCIPLE_04 ]</div>
          <h2 class="mono-copy text-sm font-bold text-text-primary uppercase tracking-wide mb-3">4. Zero Tracking, Cookies, or Data Monetization</h2>
          <p class="mono-copy text-xs text-text-secondary leading-relaxed">
            We do not use tracking cookies, we do not profile your reading habits, and we never sell or monetize user data. DocPlatform is sustained through voluntary community coffee tips and open-source sponsorship.
          </p>
        </div>

      </div>

      </main>

      ${renderFooter()}
    </div>
  </div>
  ${typeof renderGsapScripts === 'function' ? renderGsapScripts() : ''}
  <script type="module" src="/app.js?v=3.2"></script>
</body>
</html>`;
}

export function renderTermsPage({ renderNavbar, renderFooter, renderGsapScripts }) {
  return `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Terms of Service — DocPlatform</title>
  <meta name="description" content="Simple, transparent, and developer-friendly Terms of Service for DocPlatform.">
  <link rel="canonical" href="https://docplatform.app/terms">

  <!-- Preconnect & Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">

  <link rel="stylesheet" href="/styles.css?v=3.2">

  <!-- Tailwind CDN with DocPlatform Blueprint Configuration -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: ['selector', '[data-theme="dark"]'],
      theme: {
        extend: {
          colors: {
            bg: 'var(--bg)',
            'bg-subtle': 'var(--bg-subtle)',
            'bg-elevated': 'var(--bg-elevated)',
            border: 'var(--border)',
            accent: 'var(--accent)',
            'accent-hover': 'var(--accent-hover)',
            'accent-foreground': 'var(--accent-foreground)',
            'text-primary': 'var(--text-primary)',
            'text-secondary': 'var(--text-secondary)',
            'text-muted': 'var(--text-muted)',
          },
          fontFamily: {
            display: ['"Instrument Serif"', 'Georgia', 'serif'],
            mono: ['"JetBrains Mono"', 'monospace'],
            sans: ['"Plus Jakarta Sans"', 'sans-serif'],
          }
        }
      }
    }
  </script>

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
<body class="min-h-screen flex flex-col bg-bg text-text-primary antialiased">
  ${renderNavbar('')}

  <!-- GSAP ScrollSmoother Wrapper & Blueprint Canvas -->
  <div id="smooth-wrapper">
    <div id="smooth-content" style="padding-top: 51px;">
      <main class="w-full flex-1">
    <div class="mx-auto max-w-5xl border-x border-dashed border-border flex flex-col">
      
      <!-- Architectural Hero -->
      <div class="relative overflow-hidden border-b border-dashed border-border py-12 px-6 sm:px-10">
        <div class="linework pointer-events-none absolute inset-0"></div>

        <div class="relative z-10 max-w-3xl flex flex-col gap-3">
          <nav class="mono-copy flex items-center gap-1.5 text-xs text-text-muted" aria-label="Breadcrumb">
            <a href="/" class="hover:text-text-primary transition-colors">Home</a>
            <span class="text-border">/</span>
            <span class="text-text-primary font-medium">Terms of Service</span>
          </nav>

          <div class="flex items-center gap-3 mt-1">
            <span class="mono-copy inline-flex items-center gap-1.5 border border-border bg-bg-elevated px-2.5 py-1 text-[11px] text-text-primary tracking-wide">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#7b61ff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              ★ Zero Paywalls • Developer-Friendly Terms
            </span>
            <div style="height: 1px; width: 80px; background: linear-gradient(to right, var(--border), transparent);"></div>
          </div>

          <h1 class="hero-display text-4xl sm:text-6xl text-text-primary tracking-tight">Terms of Service</h1>
          <p class="mono-copy text-xs sm:text-sm text-text-secondary max-w-2xl leading-relaxed">
            Zero paywalls, zero hidden contracts. Straightforward terms for our free document platform.
          </p>
        </div>
      </div>

      <!-- Content Sections -->
      <div class="p-6 sm:p-10 space-y-6">
        
        <div class="border border-dashed border-border bg-bg-elevated p-6">
          <div class="mono-copy text-[10px] text-accent uppercase tracking-widest mb-1.5">[ SECTION_01 ]</div>
          <h2 class="mono-copy text-sm font-bold text-text-primary uppercase tracking-wide mb-3">1. Free & Zero-Login Commitment</h2>
          <p class="mono-copy text-xs text-text-secondary leading-relaxed">
            DocPlatform is provided free of charge for personal, educational, and commercial use. You are not required to create an account, register your email, or provide credit card information to use any core document processing feature.
          </p>
        </div>

        <div class="border border-dashed border-border bg-bg-elevated p-6">
          <div class="mono-copy text-[10px] text-accent uppercase tracking-widest mb-1.5">[ SECTION_02 ]</div>
          <h2 class="mono-copy text-sm font-bold text-text-primary uppercase tracking-wide mb-3">2. Acceptable Use Guidelines</h2>
          <p class="mono-copy text-xs text-text-secondary leading-relaxed">
            You agree not to use DocPlatform to process, generate, or distribute malicious code, illegal materials, or execute denial-of-service (DoS) attacks against our infrastructure. Batch rate limits are enforced at the network level to ensure fair availability for all community users.
          </p>
        </div>

        <div class="border border-dashed border-border bg-bg-elevated p-6">
          <div class="mono-copy text-[10px] text-accent uppercase tracking-widest mb-1.5">[ SECTION_03 ]</div>
          <h2 class="mono-copy text-sm font-bold text-text-primary uppercase tracking-wide mb-3">3. 100% User Ownership & Copyright</h2>
          <p class="mono-copy text-xs text-text-secondary leading-relaxed">
            You retain 100% full ownership, rights, and copyright to all documents and data you process using DocPlatform. We claim zero rights or ownership over your content.
          </p>
        </div>

        <div class="border border-dashed border-border bg-bg-elevated p-6">
          <div class="mono-copy text-[10px] text-accent uppercase tracking-widest mb-1.5">[ SECTION_04 ]</div>
          <h2 class="mono-copy text-sm font-bold text-text-primary uppercase tracking-wide mb-3">4. Disclaimer & Limitation of Liability</h2>
          <p class="mono-copy text-xs text-text-secondary leading-relaxed">
            DocPlatform is provided "as is" without warranty of any kind. While we employ rigorous automated testing and cryptographic verification, users are encouraged to maintain backups of critical original documents before performing irreversible batch modifications.
          </p>
        </div>

      </div>

      </main>

      ${renderFooter()}
    </div>
  </div>
  ${typeof renderGsapScripts === 'function' ? renderGsapScripts() : ''}
  <script type="module" src="/app.js?v=3.2"></script>
</body>
</html>`;
}

export function renderSecurityPage({ renderNavbar, renderFooter, renderGsapScripts }) {
  return `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Security Architecture & Whitepaper — DocPlatform</title>
  <meta name="description" content="Technical overview of DocPlatform's security model: AES-256 GCM encryption, zero-leak vector redaction, sandboxed worker isolation, and ephemeral TTL memory.">
  <link rel="canonical" href="https://docplatform.app/security">

  <!-- Preconnect & Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">

  <link rel="stylesheet" href="/styles.css?v=3.2">

  <!-- Tailwind CDN with DocPlatform Blueprint Configuration -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: ['selector', '[data-theme="dark"]'],
      theme: {
        extend: {
          colors: {
            bg: 'var(--bg)',
            'bg-subtle': 'var(--bg-subtle)',
            'bg-elevated': 'var(--bg-elevated)',
            border: 'var(--border)',
            accent: 'var(--accent)',
            'accent-hover': 'var(--accent-hover)',
            'accent-foreground': 'var(--accent-foreground)',
            'text-primary': 'var(--text-primary)',
            'text-secondary': 'var(--text-secondary)',
            'text-muted': 'var(--text-muted)',
          },
          fontFamily: {
            display: ['"Instrument Serif"', 'Georgia', 'serif'],
            mono: ['"JetBrains Mono"', 'monospace'],
            sans: ['"Plus Jakarta Sans"', 'sans-serif'],
          }
        }
      }
    }
  </script>

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
<body class="min-h-screen flex flex-col bg-bg text-text-primary antialiased">
  ${renderNavbar('')}

  <!-- GSAP ScrollSmoother Wrapper & Blueprint Canvas -->
  <div id="smooth-wrapper">
    <div id="smooth-content" style="padding-top: 51px;">
      <main class="w-full flex-1">
    <div class="mx-auto max-w-5xl border-x border-dashed border-border flex flex-col">
      
      <!-- Architectural Hero -->
      <div class="relative overflow-hidden border-b border-dashed border-border py-12 px-6 sm:px-10">
        <div class="linework pointer-events-none absolute inset-0"></div>

        <div class="relative z-10 max-w-3xl flex flex-col gap-3">
          <nav class="mono-copy flex items-center gap-1.5 text-xs text-text-muted" aria-label="Breadcrumb">
            <a href="/" class="hover:text-text-primary transition-colors">Home</a>
            <span class="text-border">/</span>
            <span class="text-text-primary font-medium">Security Whitepaper</span>
          </nav>

          <div class="flex items-center gap-3 mt-1">
            <span class="mono-copy inline-flex items-center gap-1.5 border border-border bg-bg-elevated px-2.5 py-1 text-[11px] text-text-primary tracking-wide">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#7b61ff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              ★ Cryptographic Verification • Sandboxed Workers
            </span>
            <div style="height: 1px; width: 80px; background: linear-gradient(to right, var(--border), transparent);"></div>
          </div>

          <h1 class="hero-display text-4xl sm:text-6xl text-text-primary tracking-tight">Security Whitepaper</h1>
          <p class="mono-copy text-xs sm:text-sm text-text-secondary max-w-2xl leading-relaxed">
            Engineered with defense-in-depth security, strict memory isolation, and zero-leak document redaction.
          </p>
        </div>
      </div>

      <!-- Content Sections -->
      <div class="p-6 sm:p-10 space-y-6">
        
        <div class="border border-dashed border-border bg-bg-elevated p-6">
          <div class="mono-copy text-[10px] text-accent uppercase tracking-widest mb-1.5">[ SPEC_01 ]</div>
          <h2 class="mono-copy text-sm font-bold text-text-primary uppercase tracking-wide mb-3">1. Cryptographic Standards (AES-256 GCM)</h2>
          <p class="mono-copy text-xs text-text-secondary leading-relaxed">
            DocPlatform implements true AES-256 GCM authenticated encryption with PBKDF2 key derivation for PDF protection. Document permissions (printing, extraction, modification) are enforced cryptographically with 128-bit/256-bit permission flags.
          </p>
        </div>

        <div class="border border-dashed border-border bg-bg-elevated p-6">
          <div class="mono-copy text-[10px] text-accent uppercase tracking-widest mb-1.5">[ SPEC_02 ]</div>
          <h2 class="mono-copy text-sm font-bold text-text-primary uppercase tracking-wide mb-3">2. Permanent Zero-Leak Vector Redaction</h2>
          <p class="mono-copy text-xs text-text-secondary leading-relaxed">
            Unlike naive tools that merely draw a visual black box over sensitive text while leaving the underlying text stream selectable, DocPlatform's Redaction engine scrubs the underlying vector character streams, removes cached form XObjects, and strips metadata dictionary trails to guarantee zero-leak redaction.
          </p>
        </div>

        <div class="border border-dashed border-border bg-bg-elevated p-6">
          <div class="mono-copy text-[10px] text-accent uppercase tracking-widest mb-1.5">[ SPEC_03 ]</div>
          <h2 class="mono-copy text-sm font-bold text-text-primary uppercase tracking-wide mb-3">3. Sandboxed Worker Isolation (SandboxedWorkerHarness)</h2>
          <p class="mono-copy text-xs text-text-secondary leading-relaxed">
            All server-side conversion tasks execute inside sandboxed child worker processes with strict 60-second execution CPU timeout budgets to neutralize decompression bombs, memory consumption caps enforced per worker lease, and automatic subprocess process-group termination (SIGKILL) on timeout.
          </p>
        </div>

        <div class="border border-dashed border-border bg-bg-elevated p-6">
          <div class="mono-copy text-[10px] text-accent uppercase tracking-widest mb-1.5">[ SPEC_04 ]</div>
          <h2 class="mono-copy text-sm font-bold text-text-primary uppercase tracking-wide mb-3">4. Automated Storage Hygiene (Job-TTL Daemon)</h2>
          <p class="mono-copy text-xs text-text-secondary leading-relaxed">
            Our background cleanup daemon continuously monitors the file storage layer and automatically purges all temporary files older than 60 minutes. No unencrypted document data is permanently archived.
          </p>
        </div>

      </div>

      </main>

      ${renderFooter()}
    </div>
  </div>
  ${typeof renderGsapScripts === 'function' ? renderGsapScripts() : ''}
  <script type="module" src="/app.js?v=3.2"></script>
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
