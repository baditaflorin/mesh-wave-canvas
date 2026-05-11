---
status: accepted
date: 2026-05-11
---

# 0003 — Why 2D canvas, not WebGL

## Context

A field of expanding ripples is the classic "WebGL fragment shader" demo. We could ship a 50-line shader that computes the entire visual analytically. Or 30 lines of plain `CanvasRenderingContext2D.arc`.

## Decision

Use the **2D canvas**.

- Each ripple = 4 concentric `ctx.arc()` strokes with fading alpha.
- One bright filled circle in the center while `age < 800 ms`.
- 1 fill + 4 strokes × ~10 ripples × 60 fps = 60 fps with budget to spare on a 2018 phone.

## Consequences

- 2 kB of code instead of 8 kB of shaders + WebGL boilerplate.
- Works in every browser since 2013. No COOP/COEP, no `OffscreenCanvas`.
- "Better" effects (interference patterns, water-shader fakes) are not possible at this fidelity. We don't need them — the experience is about ripples flowing across the seam between phones, not about a single phone's visual depth.

## Alternatives considered

- **WebGL fragment shader.** Saved for `mesh-mirror` or a future v2 of this app. Genuinely beautiful but overkill here.
- **SVG.** Rejected — 4 strokes per ripple × N ripples × 60 fps would thrash the DOM.
