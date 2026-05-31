import { expect, test } from "@playwright/test";
import { openTwoPeers } from "@baditaflorin/mesh-common/testing";
import { readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8")) as {
  name: string;
};
const storagePrefix = pkg.name;

/**
 * Load-bearing cross-peer test for the advertised core action:
 *   "Tap one phone and a ripple expands across all phones."
 *
 * The ripple is recorded into a shared `Y.Array("ripples")` on the room doc.
 * If a tap wrote to local React `useState` instead of the shared Yjs array,
 * peer B would never see the ripple and this test would FAIL — that is exactly
 * the bug class this assertion guards against.
 *
 * We assert on `[data-ripple-count]`, which the WaveCanvas drives from the Yjs
 * `ripples.observe` callback (fires on every shared-array change, including
 * ripples a remote peer pushed). So a rising count on peer B proves the ripple
 * datum (origin / t0 / id) crossed the mesh — not pixel animation.
 */
test("peer A's tap creates a ripple that peer B observes in the shared doc", async ({
  browser,
  baseURL,
}) => {
  const { a, b, cleanup } = await openTwoPeers(browser, baseURL ?? "", { storagePrefix });
  try {
    // Both peers must arm ("Connect to mesh") to create the room + Y.Array.
    const armA = a.getByRole("button", { name: /connect to mesh/i });
    const armB = b.getByRole("button", { name: /connect to mesh/i });
    await expect(armA).toBeVisible();
    await expect(armB).toBeVisible();
    await armA.click();
    await armB.click();

    // The wave stage carries the live shared-ripple count.
    const stageA = a.locator(".wave-stage");
    const stageB = b.locator(".wave-stage");
    await expect(stageA).toBeVisible();
    await expect(stageB).toBeVisible();

    // Baseline: no ripples have been created in the shared doc yet.
    await expect(stageB).toHaveAttribute("data-ripple-count", "0");

    // Peer A taps its canvas — this pushes a ripple into Y.Array("ripples").
    await a.locator(".wave-canvas").click({ position: { x: 80, y: 80 } });

    // The author (peer A) reflects its own ripple immediately.
    await expect(stageA).toHaveAttribute("data-ripple-count", "1");

    // THE load-bearing cross-peer assertion: the ripple datum must propagate
    // through the shared Yjs doc to peer B. Fails if the tap went to local
    // useState instead of room.doc's Y.Array.
    await expect(stageB).toHaveAttribute("data-ripple-count", "1", { timeout: 10_000 });

    // A second tap from A increments the shared count on B too — confirms the
    // sync is continuous, not a one-shot fluke.
    await a.locator(".wave-canvas").click({ position: { x: 160, y: 120 } });
    await expect(stageB).toHaveAttribute("data-ripple-count", "2", { timeout: 10_000 });

    // And a ripple originated by peer B is seen by peer A — bidirectional.
    await b.locator(".wave-canvas").click({ position: { x: 100, y: 60 } });
    await expect(stageA).toHaveAttribute("data-ripple-count", "3", { timeout: 10_000 });
  } finally {
    await cleanup();
  }
});
