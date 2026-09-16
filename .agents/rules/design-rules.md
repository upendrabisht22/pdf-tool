---
trigger: always_on
---

# FRONTEND & UI DESIGN DIRECTIVES

## 1. Absolute Bans (The "AI Slop" Filter)
- NEVER default to system fonts or generic fonts (Arial, Inter, Roboto).
- NEVER default to pure white backgrounds (`#ffffff`) when copying screenshots. Use contextual neutrals like slate, zinc, cream, or rich dark mode tones (`#090d16`, `#0f172a`).
- NEVER use standard blue/purple gradients on plain white cards.

## 2. Typography Rules
- Every UI must define 2 distinct typography pairings:
  - Display/Headers: Syne, Space Grotesk, Cabinet Grotesk, Bricolage Grotesque, or JetBrains Mono.
  - Body: Plus Jakarta Sans, Outfit, DM Sans, or Geist Sans.
- Use explicit font hierarchy: `tracking-tight` on headings, higher contrast on sizes.

## 3. Screenshot Parsing Directive (Visual Re-interpretation)
- When reading visual screenshots:
  - Do NOT blindly extract white hex codes (`#ffffff`) unless explicitly asked.
  - Extract spatial layout, component structure, and padding ratios ONLY.
  - Re-skin the extracted layout using our project's custom color variables and dark/glassmorphic surface tones.

## 4. Surfaces & Atmosphere
- Use deliberate depth: subtle borders (`border-white/10` or `border-zinc-200`), layered backdrop blurs (`backdrop-blur-md`), or noise textures instead of floating shadows.