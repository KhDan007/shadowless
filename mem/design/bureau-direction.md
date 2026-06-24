---
name: bureau-direction
description: Shadowless visual direction — Bureau / Forensic Dossier. Token philosophy, signature elements, and what to never reintroduce.
type: design
---
Aesthetic: a real intelligence workstation (Bloomberg / Palantir Foundry / Are.na), not a sci-fi movie HUD. Operated, not designed.

Typography
- Body: JetBrains Mono (--font-body). Mono everywhere by default — this is the single biggest "not AI" move.
- Chrome/UI: Geist (--font-sans), used sparingly with -0.01em tracking.
- Dossier marks: Instrument Serif italic (--font-serif). Use for section labels via `.dossier-label` and `.slug`.
- BANNED: Inter, Poppins, any default-sans for body.

Color
- Warm off-black surfaces (#0e0d0b → #24211b). Blue-slate is forbidden.
- Paper cream foreground (#e8e2d4 dark / #14130f light).
- Single accent: signal-green (--accent-signal). #22c55e dark, #15803d light. Cybersecurity register; phosphor-clean, not neon.
- Risk ramp: low #4ade80 (safe green) → medium #eab308 (amber) → high #f97316 (orange) → critical #dc2626 (red, confirmed bad).

Geometry & material
- --radius: 0. No rounded corners anywhere.
- Hairline borders (--panel-border #2a2723 dark / #c9bfa8 light).
- Global paper-grain noise via body::before at 3.5% opacity.
- No box-shadow glows. Shadows are not part of the system.

Motion
- steps() functions only for repeating animations. No eased breathing.
- .pulse-emerald is now a 2-step amber mark tick (kept for backcompat, not visually a pulse).
- .scan-sweep is now a caret tick on the right edge, not a sweeping highlight.

Signature elements
- .slug — case-file id in mono with amber left bar. Use as `<span class="slug">SH-2026-0624-A1</span>`.
- .dossier-label — serif italic small label for section marks.

Migration debt
- Many components use hardcoded hex (bg-[#0b0e14], border-[#1f2630], text-[#4edea3]). When touching a component, replace with semantic tokens: bg-background, bg-card, border-border, text-foreground, text-muted-foreground, text-primary, etc.
