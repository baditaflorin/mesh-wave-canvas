import { useEffect, useState } from "react";
import { MeshShell } from "@baditaflorin/mesh-common";
import { WaveCanvas } from "./features/wave/WaveCanvas";
import { SettingsExtras } from "./features/settings/SettingsExtras";
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
    <MeshShell
      config={appConfig}
      roomId={roomId}
      onRoomChange={setRoomId}
      settingsExtras={
        <SettingsExtras
          myIndex={myIndex}
          onMyIndexChange={setMyIndex}
          totalPhones={totalPhones}
          onTotalPhonesChange={setTotalPhones}
          speed={speed}
          onSpeedChange={setSpeed}
        />
      }
    >
      <WaveCanvas
        roomId={roomId}
        myIndex={Math.min(myIndex, totalPhones - 1)}
        totalPhones={totalPhones}
        speedPxPerSec={speed}
      />
    </MeshShell>
  );
}
