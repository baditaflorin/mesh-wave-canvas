# Privacy threat model — mesh-wave-canvas

## What other peers in the same room can see

- Every ripple: `{ x, y, t0, hue, originIndex, id }`. Coordinates are normalized in the shared virtual canvas; they tell other peers where on the row of phones you tapped, nothing more.
- Clock-sync timestamps.
- Yjs awareness `clientID`.

## What stays local

- Your settings (room ID, phone index, total phones, wave speed).
- The rendered visual.

## What the signaling server sees

The room name, and SDP offers/answers **in plaintext at the application
layer**. `wss://` protects both in transit (a network eavesdropper between a
client and the signaling server can't read them), but the signaling server
itself — `turn.0docker.com`, operated as part of this fleet's own
infrastructure — can.

y-webrtc (the library this app uses) supports application-layer encryption of
signaling payloads via `WebrtcProvider`'s `password` option: it derives an
AES-GCM key with PBKDF2 and encrypts every signaling message with it, so the
signaling server sees only ciphertext. `createRoomSync` in
`src/features/sync/yjsRoom.ts` does not set this option, so `room.key` is
`null` and `y-webrtc`'s own `encrypt()`/`decrypt()` (see its `src/crypto.js`)
are no-ops that pass data through unchanged — confirmed by reading that
library's source, not assumed. Earlier revisions of this doc claimed the SDP
was "encrypted," which overstated what the code does; this section now
describes the verified, current behavior.

## What the TURN server sees

Encrypted DTLS/SRTP bytes if peers can't connect directly.
