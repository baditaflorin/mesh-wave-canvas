# mesh-wave-canvas

[![Live](https://img.shields.io/badge/live-baditaflorin.github.io%2Fmesh--wave--canvas-5EAFFF?style=flat-square)](https://baditaflorin.github.io/mesh-wave-canvas/)
[![Version](https://img.shields.io/github/package-json/v/baditaflorin/mesh-wave-canvas?style=flat-square&color=6a6a8a)](https://github.com/baditaflorin/mesh-wave-canvas/blob/main/package.json)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)
[![No backend](https://img.shields.io/badge/backend-none-1a160a?style=flat-square)](docs/adr/0001-deployment-mode.md)

> Peer-to-peer mesh: arrange phones in a row; tap one and a ripple expands across all phones as if they were one continuous canvas.

**Live:** https://baditaflorin.github.io/mesh-wave-canvas/

Lay 3+ phones side by side, left to right. Tell each one its position in Settings (`1`, `2`, `3`, …) and the total count. Tap any phone. A ripple expands from your touch point, crosses the gap into the next phone, and keeps going — as if all the phones were one big screen.

## How it works

The phones share a **single virtual canvas** that is `totalPhones × screenWidth` wide and `1 × screenHeight` tall. Every tap is recorded into a shared `Y.Array` with normalized coordinates `(x, y)` in that virtual space, plus `t0 = meshNow()` and a hue.

On every animation frame, each phone:

1. Picks up the live ripple list.
2. For each ripple, computes the local pixel coordinate by translating the shared-space center against this phone's slice (`localX = x * sharedWidth − myIndex * screenWidth`).
3. Draws concentric circles at the computed center with `radius = (meshNow − t0) × speed`. If the center is offscreen but the expanding radius reaches the viewport, only the visible arc is drawn — naturally giving you "ripple flowing in from the left."

Because the mesh clock is shared and the geometry is shared, every phone draws the ripple at the same wall-clock-instant in the same shared-space position. The ripple flows across the gap with no extra coordination.

## Privacy threat model

See [docs/privacy.md](docs/privacy.md). Wire payload: per-ripple `{ x, y, t0, hue, originIndex, id }`. No identity, no location, nothing sensitive.

## Architecture

- **Mode A** — pure GitHub Pages.
- **WebRTC** — Yjs + y-webrtc with self-hosted signaling and TURN.
- **2D canvas** — no WebGL needed; 4 concentric circles per ripple is cheap.

## Run it locally

```bash
git clone https://github.com/baditaflorin/mesh-wave-canvas.git
cd mesh-wave-canvas
npm install
npm run dev
```

## Self-hosted infrastructure

| Repo                                                                   | Endpoint                               | Role                      |
| ---------------------------------------------------------------------- | -------------------------------------- | ------------------------- |
| [signaling-server](https://github.com/baditaflorin/signaling-server)   | `wss://turn.0docker.com/ws`            | y-webrtc protocol fan-out |
| [turn-token-server](https://github.com/baditaflorin/turn-token-server) | `https://turn.0docker.com/credentials` | HMAC TURN creds           |
| [coturn-hetzner](https://github.com/baditaflorin/coturn-hetzner)       | `turn:turn.0docker.com:3479`           | TURN relay                |

## ADRs

- [0001 — Deployment mode](docs/adr/0001-deployment-mode.md)
- [0002 — Shared virtual canvas geometry](docs/adr/0002-shared-canvas.md)
- [0003 — Why 2D canvas, not WebGL](docs/adr/0003-render.md)
- [0010 — GitHub Pages publishing](docs/adr/0010-pages-publishing.md)

## License

[MIT](LICENSE) © 2026 Florin Badita
