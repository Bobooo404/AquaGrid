import TankModel from "./TankModel";
import type { InstallationStatus } from "../data/mockData";

interface TankVisualProps {
  level: number; // 0-100
  capacity: number;
  name: string;
  buildingName: string;
  type: "overhead" | "ground";
  size?: "sm" | "md" | "lg";
  showVolume?: boolean;
  installationStatus?: InstallationStatus;
}

const sizeMap = {
  sm: { w: 54 },
  md: { w: 72 },
  lg: { w: 108 },
};

export default function TankVisual({
  level,
  capacity,
  name,
  buildingName,
  size = "md",
  showVolume = true,
  installationStatus = "installed",
}: TankVisualProps) {
  const { w } = sizeMap[size];
  const isInstalled = installationStatus === "installed";
  const tankAnimationLevel = isInstalled ? (level <= 20 ? 10 : level >= 80 ? 80 : 20) : null;

  const liters = Math.round((level / 100) * capacity);
  const litersStr =
    liters >= 1000 ? `${(liters / 1000).toFixed(1)}L` : `${liters}L`;
  const capacityStr = `${Math.round(capacity).toLocaleString()}L`;

  return (
    <div className="flex min-w-0 flex-col items-center gap-1.5">
      <span className="text-[13px] font-mono font-bold uppercase tracking-wider" style={{ color: "var(--text-primary)" }}>{name}</span>
      <div className="relative">
        <TankModel
          level={tankAnimationLevel}
          width={w}
          flowActive={
            isInstalled &&
            buildingName === "Building D1" &&
            name.trim().toLowerCase() === "flushing"
          }
          ariaLabel={`${name} tank ${
            isInstalled
              ? `${Math.round(level)} percent full`
              : installationStatus === "under-installation"
                ? "under installation"
                : "empty"
          }`}
        />
      </div>
      {showVolume && isInstalled && (
        <div className="flex flex-col items-center gap-0.5 text-center leading-tight">
          <span className="text-sm font-mono font-bold" style={{ color: "var(--text-primary)" }}>
            {litersStr}
          </span>
          <span className="text-[10px] font-mono font-semibold" style={{ color: "var(--text-secondary)" }}>
            Capacity {capacityStr}
          </span>
        </div>
      )}
      {!isInstalled && (
        <span
          className="mt-1 block w-full text-center text-[10px] font-mono font-bold uppercase leading-tight"
          style={{
            color:
              installationStatus === "under-installation"
                ? "var(--warning-text)"
                : "var(--text-muted)",
            whiteSpace: "pre-line",
          }}
        >
          {installationStatus === "under-installation" ? "Under\nInstallation" : "Not\nInstalled"}
        </span>
      )}
    </div>
  );
}
