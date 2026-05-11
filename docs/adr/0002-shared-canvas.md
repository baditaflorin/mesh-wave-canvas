---
status: accepted
date: 2026-05-11
---

# 0002 — Shared virtual canvas geometry

## Context

Three to ten phones lying side-by-side, all rendering parts of "one big picture." The naïve way is to send per-edge handoff events ("ripple exited my right edge at y=0.4 at time T"). That requires every phone to know its neighbors and synchronize handoffs.

## Decision

Skip handoff messaging entirely. Instead, model **one shared virtual canvas** of size `(totalPhones × screenWidth, screenHeight)`. Every ripple is stored once with normalized shared-canvas coordinates:

```ts
type Ripple = {
  x: number;          // 0..1 across the SHARED canvas
  y: number;          // 0..1 down the SHARED canvas
  t0: number;         // mesh-time origin
  hue: number;
  originIndex: number;
  id: string;
};
```

Each phone renders the same ripple from its own viewport:

```
localX = x * (totalPhones * screenWidth) - myIndex * screenWidth
localY = y * screenHeight
radius = (meshNow - t0) * speedPxPerSec
```

If the resulting `(localX, localY)` is offscreen but `radius` is large enough to touch the viewport, only the visible arc renders. No clipping logic needed — the 2D context's draw call does it naturally.

## Consequences

- **Trivially correct.** As long as every phone agrees on `totalPhones` and on each phone's `myIndex`, the geometry stitches itself.
- **No handoff bug class.** Two phones can never "drop" or "double" a ripple at the seam.
- **Phones don't have to be configured pairwise.** Each phone only knows its index in the row.
- **Limitation.** This models a 1D row. A 2D grid would need `(rowIndex, colIndex)` plus a vertical dimension. Out of scope for v1.
- **All ripples broadcast everywhere.** Phone 1 receives ripple events from phone 10 even though they'll never draw to its viewport (10× screenWidth away from origin). That's fine — events are tiny (~100 bytes each).

## Alternatives considered

- **Edge handoff messages.** Rejected — extra protocol, easy to break, doesn't help.
- **A leader phone that broadcasts "tick" events.** Rejected — already have mesh clock, don't need a leader.
- **A grid topology in v1.** Rejected — adds complexity for an effect users mostly want in a line. Easy to add later by promoting `(myIndex)` to `(row, col)`.
