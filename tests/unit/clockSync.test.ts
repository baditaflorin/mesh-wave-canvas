import { describe, expect, it, vi } from "vitest";
import type { WebrtcProvider } from "y-webrtc";
import { createClockSync } from "../../src/features/sync/clockSync";

/**
 * A peer's awareness state is untrusted input — any peer connected to the
 * room (including via devtools, not just this app's own UI) can publish
 * arbitrary JSON there. These tests cover the fix for a malformed/malicious
 * `clock.t` (NaN/Infinity) poisoning the shared mesh-time computation for
 * every peer. See the comment in src/features/sync/clockSync.ts for the full
 * failure chain this guards against.
 */

type FakeAwarenessAPI = {
  clientID: number;
  setLocalStateField: (key: string, value: unknown) => void;
  getStates: () => Map<number, Record<string, unknown>>;
  on: (event: string, cb: () => void) => void;
  off: (event: string, cb: () => void) => void;
};

function makeFakeProvider(): { provider: WebrtcProvider; awareness: FakeAwarenessAPI } {
  const states = new Map<number, Record<string, unknown>>();
  const listeners = new Set<() => void>();
  const awareness: FakeAwarenessAPI = {
    clientID: 0,
    setLocalStateField: vi.fn(),
    getStates: () => states,
    on: (_event, cb) => listeners.add(cb),
    off: (_event, cb) => listeners.delete(cb),
  };
  const provider = { awareness } as unknown as WebrtcProvider;

  const setPeerState = (id: number, state: Record<string, unknown>) => {
    states.set(id, state);
    listeners.forEach((cb) => cb());
  };

  return { provider, awareness: { ...awareness, setPeerState } as unknown as FakeAwarenessAPI };
}

describe("createClockSync", () => {
  it("computes a finite meshNow() from well-formed peer offsets", () => {
    const { provider, awareness } = makeFakeProvider();
    const clock = createClockSync(provider);

    const now = Date.now();
    (
      awareness as unknown as { setPeerState: (id: number, s: Record<string, unknown>) => void }
    ).setPeerState(1, { clock: { t: now + 100 } });
    (
      awareness as unknown as { setPeerState: (id: number, s: Record<string, unknown>) => void }
    ).setPeerState(2, { clock: { t: now - 100 } });

    expect(Number.isFinite(clock.meshNow())).toBe(true);
    clock.destroy();
  });

  it("ignores a peer publishing a non-finite clock.t (NaN) instead of poisoning the median", () => {
    const { provider, awareness } = makeFakeProvider();
    const clock = createClockSync(provider);
    const setPeerState = (
      awareness as unknown as { setPeerState: (id: number, s: Record<string, unknown>) => void }
    ).setPeerState;

    const now = Date.now();
    // Two well-formed peers plus one malicious/malformed peer. With the old
    // `typeof clock?.t === "number"` guard, NaN passes (typeof NaN ===
    // "number"), gets stored as a sample, and — because this makes the
    // sample set even-length — the median average pulls in the NaN and
    // meshNow() returns NaN for every subsequent frame.
    setPeerState(1, { clock: { t: now + 50 } });
    setPeerState(2, { clock: { t: NaN } });

    const result = clock.meshNow();
    expect(Number.isFinite(result)).toBe(true);
    // Only the one well-formed sample should count.
    expect(clock.peerCount()).toBe(1);
    clock.destroy();
  });

  it("ignores a peer publishing Infinity", () => {
    const { provider, awareness } = makeFakeProvider();
    const clock = createClockSync(provider);
    const setPeerState = (
      awareness as unknown as { setPeerState: (id: number, s: Record<string, unknown>) => void }
    ).setPeerState;

    setPeerState(1, { clock: { t: Infinity } });

    expect(Number.isFinite(clock.meshNow())).toBe(true);
    expect(clock.peerCount()).toBe(0);
    clock.destroy();
  });
});
