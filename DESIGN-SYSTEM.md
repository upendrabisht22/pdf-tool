# Architectural Minimalist Blueprint — Design System & Engineering Guide

A precision design system and UI specification engineered for high-utility web tools, developer utilities, and modern SaaS applications. 

---

## 1. Design Philosophy & Archetype

This system follows the **Architectural Minimalist Blueprint** archetype. Rather than relying on generic bubbly shadows, oversized rounded corners, or pastel gradients, it draws from technical architectural drawings and industrial precision:

- **Dashed Framing**: Bounded layout containers using vertical and horizontal dashed borders (`border-dashed`).
- **Sharp Geometry**: `0px` border radii (`rounded-none`) across all cards, buttons, badges, and inputs.
- **Atmospheric Linework**: Subtle vector background grid patterns giving the impression of drafting paper or technical schematics.
- **High-Contrast Editorial Typography**: Pairing a high-contrast editorial serif for headlines with a clean monospace font for all technical labels, navigation, and metrics.
- **Electric Accent Pop**: A single vibrant brand accent (Electric Violet `#7b61ff` / `#6366f1`) against deep slate/charcoal in dark mode and pure white in light mode.

---

## 2. Typography Hierarchy & Font Pairings

The design system requires **three distinct type families**, each fulfilling a specific functional tier:

| Role | Font Family | Weights | Usage |
| :--- | :--- | :--- | :--- |
| **Display / Headlines** | [`Instrument Serif`](https://fonts.google.com/specimen/Instrument+Serif) | 400 (Normal & Italic) | Main hero headings, section statements, callout titles (`leading-[1.08]`). |
| **Monospace / UI Controls** | [`JetBrains Mono`](https://fonts.google.com/specimen/JetBrains+Mono) | 400, 500, 600, 700 | Navigation links, tool names, buttons, badges, metadata, counters, and footer links. |
| **Body Copy** | [`Plus Jakarta Sans`](https://fonts.google.com/specimen/Plus+Jakarta+Sans) | 400, 500, 600 | Informational paragraphs, documentation, tool descriptions, and modal explanations. |

### Font Import Snippet

Include this in your `<head>` or CSS root:

```html
<!-- Google Fonts Preconnect & Stylesheet -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
```

Or inside your CSS file:

```css
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

.hero-display {
  font-family: 'Instrument Serif', Georgia, serif;
  letter-spacing: -0.02em;
}

.mono-copy {
  font-family: 'JetBrains Mono', monospace;
}

body {
  font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
}
```

---

## 3. Color Tokens & Theme System (CSS Variables)

The system supports high-contrast **Dark Mode (default)** and crisp **Pure White Light Mode**, dynamically toggled via the `data-theme` attribute on `<html>`.

```css
:root, [data-theme="dark"] {
  /* Dark Mode Canvas */
  --bg: #09090b;               /* Primary dark canvas */
  --bg-subtle: #121215;        /* Subtle secondary surface */
  --bg-elevated: #18181b;      /* Interactive card surface */
  --bg-glass: rgba(9, 9, 11, 0.92);

  /* Architectural Borders */
  --border: #27272a;           /* Dashed grid and card border */
  --border-hover: #3f3f46;     /* Card hover border */
  --border-dashed: #27272a;

  /* Typography Tones */
  --text-primary: #fafafa;     /* High-contrast headings and active links */
  --text-secondary: #a1a1aa;   /* Body text and descriptions */
  --text-muted: #71717a;       /* Badges, copyright, and subtle labels */

  /* Electric Violet Accent */
  --accent: #7b61ff;
  --accent-hover: #6b50f6;
  --accent-foreground: #ffffff;
  --accent-subtle: rgba(123, 97, 255, 0.12);
}

[data-theme="light"] {
  /* Clean White Light Mode */
  --bg: #ffffff;               /* Crisp pure white canvas */
  --bg-subtle: #fafafa;        /* Very light tint for hovers */
  --bg-elevated: #ffffff;      /* Pure white card backgrounds */
  --bg-glass: rgba(255, 255, 255, 0.94);

  /* Architectural Borders */
  --border: #e4e4e7;           /* Subtle light zinc border */
  --border-hover: #d4d4d8;
  --border-dashed: #e4e4e7;

  /* Typography Tones */
  --text-primary: #09090b;     /* Deep charcoal for headings */
  --text-secondary: #71717a;   /* Medium zinc for descriptions */
  --text-muted: #a1a1aa;

  /* Electric Violet Accent */
  --accent: #7b61ff;
  --accent-hover: #6b50f6;
  --accent-foreground: #ffffff;
  --accent-subtle: rgba(123, 97, 255, 0.08);
}
```

### Zero-Flicker Theme Toggle Script

Place this inline in your `<head>` to prevent flash of unstyled theme (FOUT):

```javascript
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
```

---

## 4. Architectural Structural Blueprint

### 1. The Centered Framed Container
All content is bound within a centered container (`max-w-5xl` / 1024px) flanked by vertical dashed borders:

```html
<div class="mx-auto max-w-5xl border-x border-dashed border-[var(--border)]">
  <!-- Content Sections -->
</div>
```

### 2. Architectural Linework Background (Drafting Grid)
A subtle mathematical grid pattern placed behind sections:

```css
.linework {
  background-image: 
    linear-gradient(to right, var(--border) 1px, transparent 1px),
    linear-gradient(to bottom, var(--border) 1px, transparent 1px);
  background-size: 32px 32px;
  opacity: 0.35;
  pointer-events: none;
}
```

### 3. Blueprint Tool Grid
A responsive auto-fitting grid of sharp, bordered cards that never leave ugly empty gap slabs:

```css
.blueprint-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
  background-color: transparent;
}

.tool-blueprint-card {
  background-color: var(--bg-elevated);
  border: 1px solid var(--border);
  padding: 1.15rem 1.25rem;
  text-decoration: none;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 110px;
  transition: all 0.18s ease;
  position: relative;
}

.tool-blueprint-card:hover {
  background-color: var(--bg-subtle);
  border-color: var(--accent);
}

.tool-blueprint-card:hover .tool-arrow {
  transform: translate(2px, -2px);
  color: var(--accent);
}
```

---

## 5. Signature Animations & Micro-Interactions

### The Sliding Fill CTA Button (`.paper-cta-btn`)
An interactive button where hovering smoothly wipes an electric violet background fill from left to right while translating an angled arrow:

```html
<a href="/target" class="paper-cta-btn group">
  <span class="cta-fill"></span>
  <span class="cta-content">
    <span>Get Started</span>
    <svg class="cta-arrow" viewBox="0 0 18 18" fill="currentColor">
      <path d="M8.47 11.72L12.78 9.53L8.47 5.22" stroke="currentColor" stroke-width="2"/>
    </svg>
  </span>
</a>
```

```css
.paper-cta-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  overflow: hidden;
  border: 1px solid var(--accent);
  background-color: transparent;
  color: var(--text-primary);
  padding: 0.65rem 1.35rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  font-weight: 500;
  text-decoration: none;
  transition: color 0.25s ease;
  cursor: pointer;
}

.paper-cta-btn .cta-fill {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: 0;
  background-color: var(--accent);
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1;
}

.paper-cta-btn:hover .cta-fill {
  width: 100%;
}

.paper-cta-btn .cta-content {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.paper-cta-btn:hover {
  color: #ffffff;
}

.paper-cta-btn .cta-arrow {
  transition: transform 0.2s ease;
}

.paper-cta-btn:hover .cta-arrow {
  transform: translate(2px, -2px);
}
```

### Corner Crosshairs / Architectural Brackets (`┌ ┐ └ ┘`)
Creates technical blueprint framing around callout banners:

```css
.paper-cta-box {
  position: relative;
  border: 1px dashed var(--border);
  padding: 3rem 2rem;
}

.corner-bracket-tl {
  position: absolute;
  top: -1px;
  left: -1px;
  width: 8px;
  height: 8px;
  border-top: 2px solid var(--accent);
  border-left: 2px solid var(--accent);
}

.corner-bracket-tr {
  position: absolute;
  top: -1px;
  right: -1px;
  width: 8px;
  height: 8px;
  border-top: 2px solid var(--accent);
  border-right: 2px solid var(--accent);
}

.corner-bracket-bl {
  position: absolute;
  bottom: -1px;
  left: -1px;
  width: 8px;
  height: 8px;
  border-bottom: 2px solid var(--accent);
  border-left: 2px solid var(--accent);
}

.corner-bracket-br {
  position: absolute;
  bottom: -1px;
  right: -1px;
  width: 8px;
  height: 8px;
  border-bottom: 2px solid var(--accent);
  border-right: 2px solid var(--accent);
}
```

---

## 6. Smooth Scrolling with GSAP ScrollSmoother

To deliver a tactile, high-end editorial feel akin to architectural magazines and design studios, the system utilizes **GSAP ScrollSmoother** alongside **ScrollTrigger** for hardware-accelerated, inertial physics scrolling.

### Core Architectural DOM Structure

Because ScrollSmoother applies 3D CSS transforms to create the smoothing momentum, child elements inside the content container cannot use `position: fixed` relative to the viewport. Therefore, the layout strictly separates fixed viewport overlays from the scrollable canvas:

```html
<!-- 1. Fixed Elements (Outside the smooth-wrapper) -->
<header class="site-header" style="position: fixed; top: 0; left: 0; right: 0; z-index: 50;">
  ...
</header>

<!-- Modals & Overlays (Outside the smooth-wrapper) -->
<div id="modal-backdrop" style="position: fixed;"></div>
<div id="modal-content" style="position: fixed;"></div>

<!-- 2. ScrollSmoother Hierarchy -->
<div id="smooth-wrapper">
  <div id="smooth-content" style="padding-top: 51px;">
    <!-- Main Content & Sections -->
    <main>...</main>

    <!-- Footer -->
    <footer>...</footer>
  </div>
</div>
```

### CSS Requirements

```css
#smooth-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 1;
}

#smooth-content {
  width: 100%;
  min-height: 100%;
  overflow: visible;
  position: relative;
  display: flex;
  flex-direction: column;
}

.site-header {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  width: 100% !important;
  z-index: 50 !important;
}
```

### Initialization & Configuration

```javascript
// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

// Initialize ScrollSmoother instance
const smoother = ScrollSmoother.create({
  wrapper: '#smooth-wrapper',
  content: '#smooth-content',
  smooth: 1.15,               // Seconds to catch up to native scroll momentum
  effects: true,              // Enables data-speed and data-lag attributes
  smoothTouch: 0.1,           // Light dampening on touch screens
  normalizeScroll: false,     // Preserves native browser input handling
  ignoreMobileResize: true    // Prevents jumpy reflow on mobile URL bar toggle
});

// Smooth anchor navigation
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      smoother.scrollTo(target, true, 'top 65px');
    }
  });
});
```

### Dynamic Content & Modal Coordination

1. **DOM Resizing & Filtering**: When content expands dynamically (e.g. dropzones, invoices, or search filters), invoke `ScrollTrigger.refresh()` so ScrollSmoother recalculates the scroll boundaries:
   ```javascript
   if (typeof ScrollTrigger !== 'undefined') {
     ScrollTrigger.refresh();
   }
   ```
2. **Modal Pause**: To prevent background scroll leaks while interactive dialogs are active:
   ```javascript
   // On modal open
   if (window.smoother) window.smoother.paused(true);

   // On modal close
   if (window.smoother) window.smoother.paused(false);
   ```

---

## 7. Complete Reusable Boilerplate Starter

Copy and paste this minimal boilerplate into any new project to instantly have this exact aesthetic:

```html
<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Minimalist Blueprint App</title>

  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">

  <style>
    :root, [data-theme="dark"] {
      --bg: #09090b;
      --bg-subtle: #121215;
      --bg-elevated: #18181b;
      --border: #27272a;
      --text-primary: #fafafa;
      --text-secondary: #a1a1aa;
      --text-muted: #71717a;
      --accent: #7b61ff;
    }
    [data-theme="light"] {
      --bg: #ffffff;
      --bg-subtle: #fafafa;
      --bg-elevated: #ffffff;
      --border: #e4e4e7;
      --text-primary: #09090b;
      --text-secondary: #71717a;
      --text-muted: #a1a1aa;
      --accent: #7b61ff;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      color: var(--text-primary);
      font-family: 'Plus Jakarta Sans', sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .hero-display { font-family: 'Instrument Serif', Georgia, serif; }
    .mono-copy { font-family: 'JetBrains Mono', monospace; }

    .blueprint-frame {
      max-width: 64rem;
      margin: 0 auto;
      width: 100%;
      border-left: 1px dashed var(--border);
      border-right: 1px dashed var(--border);
    }
  </style>

  <script>
    (function() {
      const saved = localStorage.getItem('app_theme') || 'dark';
      document.documentElement.setAttribute('data-theme', saved);
    })();
    function toggleTheme() {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('app_theme', next);
    }
  </script>
</head>
<body>

  <!-- Sticky Blueprint Header -->
  <header style="position: sticky; top: 0; z-index: 50; border-bottom: 1px dashed var(--border); background: var(--bg);">
    <div class="blueprint-frame" style="height: 52px; display: flex; align-items: center; justify-content: space-between; padding: 0 1.5rem;">
      <span class="hero-display" style="font-size: 1.25rem; font-weight: 700;">MyProject</span>
      <nav class="mono-copy" style="display: flex; gap: 1rem; font-size: 0.75rem;">
        <a href="#features" style="color: var(--text-secondary); text-decoration: none;">Features</a>
        <a href="#tools" style="color: var(--text-secondary); text-decoration: none;">Tools</a>
        <button onclick="toggleTheme()" style="background: none; border: 1px solid var(--border); color: var(--text-secondary); padding: 0.2rem 0.5rem; cursor: pointer;">Theme</button>
      </nav>
    </div>
  </header>

  <!-- Hero Section -->
  <main class="blueprint-frame" style="padding: 4rem 1.5rem; border-bottom: 1px dashed var(--border);">
    <h1 class="hero-display" style="font-size: 4rem; line-height: 1.1; color: var(--text-secondary);">
      Everything you need, <br>
      <span style="color: var(--text-primary);">crafted with precision.</span>
    </h1>
    <p class="mono-copy" style="font-size: 0.8rem; color: var(--text-muted); margin-top: 1rem;">
      No tracking. No bloat. Pure client-side execution.
    </p>
  </main>

</body>
</html>
```
