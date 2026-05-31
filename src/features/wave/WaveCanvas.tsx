import { useEffect, useMemo, useRef, useState } from "react";
import { createRoomSync } from "../sync/yjsRoom";
import { createClockSync } from "../sync/clockSync";
import { maybeFetchTurnCredentials } from "../sync/iceConfig";

type Ripple = {
  id: string;
  originIndex: number;
  // Coordinates are normalized 0-1 along the SHARED virtual canvas.
  // The shared canvas is `totalPhones` units wide and 1 unit tall.
  x: number;
  y: number;
  t0: number;
  hue: number;
};

type Props = {
  roomId: string;
  myIndex: number;
  totalPhones: number;
  speedPxPerSec: number;
};

const RIPPLE_LIFETIME_MS = 6000;

export function WaveCanvas({ roomId, myIndex, totalPhones, speedPxPerSec }: Props) {
  const [armed, setArmed] = useState(false);
  const [peers, setPeers] = useState(0);
  const [rippleCount, setRippleCount] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ripplesRef = useRef<Ripple[]>([]);

  const mesh = useMemo(() => {
    if (!armed) return null;
    const room = createRoomSync(roomId);
    const clock = createClockSync(room.provider);
    const ripples = room.doc.getArray<Ripple>("ripples");
    return { room, clock, ripples };
  }, [armed, roomId]);

  useEffect(() => {
    if (!armed) return;
    void maybeFetchTurnCredentials();
  }, [armed]);

  useEffect(() => {
    return () => {
      mesh?.clock.destroy();
      mesh?.room.provider?.destroy();
    };
  }, [mesh]);

  useEffect(() => {
    if (!mesh) return undefined;
    const update = () => {
      ripplesRef.current = mesh.ripples.toArray();
      // Reflect the shared-array length reactively. This fires on every Yjs
      // change — including ripples a remote peer pushed — so the HUD count
      // and the `data-ripple-count` test hook update the instant a peer's
      // tap crosses the mesh, not only on the incidental 500ms peer-poll
      // re-render.
      setRippleCount(ripplesRef.current.length);
    };
    mesh.ripples.observe(update);
    update();
    return () => mesh.ripples.unobserve(update);
  }, [mesh]);

  useEffect(() => {
    if (!mesh) return undefined;
    const i = setInterval(() => setPeers(mesh.clock.peerCount()), 500);
    return () => clearInterval(i);
  }, [mesh]);

  // Render loop
  useEffect(() => {
    if (!mesh) return undefined;
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;

    let frame = 0;
    let lastSize = { w: 0, h: 0 };

    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (w !== lastSize.w || h !== lastSize.h) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        ctx.scale(dpr, dpr);
        lastSize = { w, h };
      }

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#080816";
      ctx.fillRect(0, 0, w, h);

      const t = mesh.clock.meshNow();
      const alive: Ripple[] = [];
      // Shared canvas: totalPhones phones, each w wide.
      const sharedWidth = totalPhones * w;

      for (const r of ripplesRef.current) {
        const age = t - r.t0;
        if (age > RIPPLE_LIFETIME_MS) continue;
        alive.push(r);
        if (age < 0) continue;

        const radius = (age / 1000) * speedPxPerSec;
        // Position in the shared virtual canvas:
        const sharedX = r.x * sharedWidth;
        const sharedY = r.y * h;
        // My phone occupies pixels [myIndex*w, (myIndex+1)*w] in the shared canvas.
        const myOriginX = myIndex * w;
        const localX = sharedX - myOriginX;
        const localY = sharedY;

        // Skip if ripple cannot possibly touch our viewport
        const minDist = Math.min(Math.abs(localX - 0), Math.abs(localX - w), 0);
        if (radius < -Math.max(w, h) - Math.abs(localX) && localX < -radius - w) continue;

        const fade = 1 - age / RIPPLE_LIFETIME_MS;
        for (let ring = 0; ring < 4; ring++) {
          const ringRadius = radius - ring * 60;
          if (ringRadius <= 0) continue;
          const ringFade = fade * (1 - ring * 0.18);
          ctx.beginPath();
          ctx.arc(localX, localY, ringRadius, 0, Math.PI * 2);
          ctx.strokeStyle = `hsla(${r.hue}, 85%, ${55 + ring * 5}%, ${0.45 * ringFade})`;
          ctx.lineWidth = 2.5;
          ctx.stroke();
        }
        // bright center while young
        if (age < 800) {
          ctx.beginPath();
          const centerR = 14 * (1 - age / 800);
          ctx.arc(localX, localY, centerR, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${r.hue}, 90%, 70%, ${0.6 * fade})`;
          ctx.fill();
        }

        void minDist; // for future culling work
      }

      // Phone edge markers — left and right strips show neighbor index
      ctx.fillStyle = "rgba(255,255,255,0.04)";
      ctx.fillRect(0, 0, 2, h);
      ctx.fillRect(w - 2, 0, 2, h);

      frame = requestAnimationFrame(draw);
    };

    draw();

    // Trim dead ripples occasionally
    const gc = setInterval(() => {
      if (!mesh) return;
      const t = mesh.clock.meshNow();
      const dead = mesh.ripples.toArray().filter((r) => t - r.t0 > RIPPLE_LIFETIME_MS).length;
      if (dead > 0) {
        mesh.room.doc.transact(() => {
          // Delete the first `dead` items (the oldest)
          mesh.ripples.delete(0, dead);
        });
      }
    }, 5000);

    return () => {
      cancelAnimationFrame(frame);
      clearInterval(gc);
    };
  }, [mesh, myIndex, totalPhones, speedPxPerSec]);

  const onTap = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!mesh) return;
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const localX = e.clientX - rect.left;
    const localY = e.clientY - rect.top;
    const w = rect.width;
    const h = rect.height;
    const sharedWidth = totalPhones * w;
    const sharedX = (myIndex * w + localX) / sharedWidth;
    const sharedY = localY / h;
    const ripple: Ripple = {
      id: crypto.randomUUID(),
      originIndex: myIndex,
      x: sharedX,
      y: sharedY,
      t0: mesh.clock.meshNow(),
      hue: Math.floor(Math.random() * 360),
    };
    mesh.ripples.push([ripple]);
  };

  if (!armed) {
    return (
      <div className="wave-arm">
        <h1>mesh-wave-canvas</h1>
        <p>
          Arrange your phones in a row, left to right. Set each phone's index in Settings (this one
          is <strong>{myIndex + 1}</strong> of <strong>{totalPhones}</strong>). Tap any phone and a
          ripple expands across all phones as if they were one continuous canvas.
        </p>
        <button type="button" className="wave-arm-button" onClick={() => setArmed(true)}>
          Connect to mesh
        </button>
      </div>
    );
  }

  return (
    <div className="wave-stage" data-ripple-count={rippleCount}>
      <canvas ref={canvasRef} className="wave-canvas" onPointerDown={onTap} />
      <div className="wave-hud">
        phone {myIndex + 1} / {totalPhones} · {peers + 1} connected · {rippleCount} ripples
      </div>
    </div>
  );
}
