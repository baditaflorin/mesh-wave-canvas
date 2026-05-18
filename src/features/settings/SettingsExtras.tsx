type Props = {
  myIndex: number;
  onMyIndexChange: (next: number) => void;
  totalPhones: number;
  onTotalPhonesChange: (next: number) => void;
  speed: number;
  onSpeedChange: (next: number) => void;
};

export function SettingsExtras({
  myIndex,
  onMyIndexChange,
  totalPhones,
  onTotalPhonesChange,
  speed,
  onSpeedChange,
}: Props) {
  return (
    <>
      <label>
        <span>This phone's position (1 = leftmost)</span>
        <input
          type="number"
          min={1}
          max={totalPhones}
          value={myIndex + 1}
          onChange={(e) =>
            onMyIndexChange(Math.max(0, Math.min(totalPhones - 1, Number(e.target.value) - 1)))
          }
        />
      </label>

      <label>
        <span>Total phones in row</span>
        <input
          type="number"
          min={1}
          max={20}
          value={totalPhones}
          onChange={(e) => onTotalPhonesChange(Math.max(1, Math.min(20, Number(e.target.value))))}
        />
      </label>

      <label>
        <span>Wave speed (px/s) ({speed})</span>
        <input
          type="range"
          min={100}
          max={1500}
          step={50}
          value={speed}
          onChange={(e) => onSpeedChange(Number(e.target.value))}
        />
      </label>
    </>
  );
}
