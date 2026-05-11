# Privacy threat model — mesh-wave-canvas

## What other peers in the same room can see

- Every ripple: `{ x, y, t0, hue, originIndex, id }`. Coordinates are normalized in the shared virtual canvas; they tell other peers where on the row of phones you tapped, nothing more.
- Clock-sync timestamps.
- Yjs awareness `clientID`.

## What stays local

- Your settings (room ID, phone index, total phones, wave speed).
- The rendered visual.

## What the signaling server sees

The room name and encrypted SDP offers/answers.

## What the TURN server sees

Encrypted DTLS/SRTP bytes if peers can't connect directly.
