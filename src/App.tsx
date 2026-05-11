import { useEffect, useState } from "react";
import { WaveCanvas } from "./features/wave/WaveCanvas";
import { SettingsDrawer } from "./features/settings/SettingsDrawer";
import { appConfig } from "./shared/config";

const STORAGE = {
  room: `${appConfig.storagePrefix}:room`,
  myIndex: `${appConfig.storagePrefix}:myIndex`,
  totalPhones: `${appConfig.storagePrefix}:totalPhones`,
  speed: `${appConfig.storagePrefix}:speed`,
};

export function App() {
  const [roomId, setRoomId] = useState(() => localStorage.getItem(STORAGE.room) ?? "default");
  const [myIndex, setMyIndex] = useState(() =>
    Math.max(0, Number(localStorage.getItem(STORAGE.myIndex) ?? "0")),
  );
  const [totalPhones, setTotalPhones] = useState(() =>
    Math.max(1, Number(localStorage.getItem(STORAGE.totalPhones) ?? "3")),
  );
  const [speed, setSpeed] = useState(() =>
    Math.max(50, Number(localStorage.getItem(STORAGE.speed) ?? "500")),
  );
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE.room, roomId);
  }, [roomId]);
  useEffect(() => {
    localStorage.setItem(STORAGE.myIndex, String(myIndex));
  }, [myIndex]);
  useEffect(() => {
    localStorage.setItem(STORAGE.totalPhones, String(totalPhones));
  }, [totalPhones]);
  useEffect(() => {
    localStorage.setItem(STORAGE.speed, String(speed));
  }, [speed]);

  return (
    <div className="app-root">
      <WaveCanvas
        roomId={roomId}
        myIndex={Math.min(myIndex, totalPhones - 1)}
        totalPhones={totalPhones}
        speedPxPerSec={speed}
      />

      <button
        type="button"
        className="settings-fab"
        onClick={() => setSettingsOpen(true)}
        aria-label="Open settings"
      >
        ⚙
      </button>

      <div className="self-ref">
        <a href={appConfig.repositoryUrl} target="_blank" rel="noreferrer">
          source
        </a>
        <span aria-hidden="true">·</span>
        <a href={appConfig.paypalUrl} target="_blank" rel="noreferrer">
          tip ♥
        </a>
        <span aria-hidden="true">·</span>
        <span>
          v{appConfig.version} · {appConfig.commit}
        </span>
      </div>

      <SettingsDrawer
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        roomId={roomId}
        onRoomChange={setRoomId}
        myIndex={myIndex}
        onMyIndexChange={setMyIndex}
        totalPhones={totalPhones}
        onTotalPhonesChange={setTotalPhones}
        speed={speed}
        onSpeedChange={setSpeed}
      />
    </div>
  );
}
