import { useMemo, useState } from "react";
import { ArrowLeft, Circle, Sliders, AlertTriangle } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  type Building,
  type Tank,
  type TankThresholdUpdate,
} from "../data/mockData";
import type { Role } from "../auth/auth";
import TankGrid from "../components/TankGrid";

interface BuildingDetailProps {
  building: Building;
  role: Role;
  onBack: () => void;
  onToggleValve: (buildingId: string, valveId: string, status: "open" | "closed") => void;
  onSaveThresholds: (buildingId: string, updates: TankThresholdUpdate[]) => void;
}

const tankSeriesColors = ["var(--accent-cyan)", "#10b981", "#f59e0b", "#8b5cf6"];

type HistoryRange = "30min" | "day" | "week" | "month" | "year";

const HISTORY_RANGES: {
  key: HistoryRange;
  label: string;
  period: string;
  points: number;
  stepMs: number;
  interval: number;
  spread: number;
  slope: number;
}[] = [
  { key: "30min", label: "30 Min", period: "Last 30 min", points: 30, stepMs: 60_000, interval: 4, spread: 20, slope: 0.3 },
  { key: "day", label: "Day", period: "Last Day", points: 24, stepMs: 3_600_000, interval: 2, spread: 24, slope: 0.8 },
  { key: "week", label: "Week", period: "Last Week", points: 7, stepMs: 86_400_000, interval: 0, spread: 30, slope: 1.5 },
  { key: "month", label: "Month", period: "Last Month", points: 30, stepMs: 86_400_000, interval: 4, spread: 34, slope: 0.7 },
  { key: "year", label: "Year", period: "Last Year", points: 12, stepMs: 2_629_800_000, interval: 0, spread: 40, slope: 1.2 },
];

const getRangeConfig = (key: HistoryRange) => HISTORY_RANGES.find((range) => range.key === key) ?? HISTORY_RANGES[1];

const hashString = (value: string) => {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const seededRandom = (seed: number) => {
  let state = seed;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
};

const formatRangeTime = (range: HistoryRange, date: Date) => {
  if (range === "30min" || range === "day") {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  if (range === "week") return date.toLocaleDateString([], { weekday: "short" });
  if (range === "month") return date.toLocaleDateString([], { day: "2-digit", month: "short" });
  return date.toLocaleDateString([], { month: "short" });
};

function generateHistory(tanks: Tank[], range: HistoryRange) {
  const config = getRangeConfig(range);
  const now = Date.now();
  return Array.from({ length: config.points }, (_, i) => {
    const timestamp = now - (config.points - 1 - i) * config.stepMs;
    const point: Record<string, string | number> = {
      time: formatRangeTime(range, new Date(timestamp)),
    };
    tanks.forEach((tank, index) => {
      const random = seededRandom(hashString(`${tank.id}|${range}|${i}`));
      const trend = (i - (config.points - 1)) * config.slope * (index % 2 === 0 ? 1 : -1);
      const spread = Math.max(4, config.spread - index * 4);
      const level = Math.max(
        0,
        Math.min(100, tank.currentLevel + trend + (random() - 0.5) * spread),
      );
      point[tank.id] = Number(level.toPrecision(3));
    });
    return point;
  });
}

export default function BuildingDetail({
  building,
  role,
  onBack,
  onToggleValve,
  onSaveThresholds,
}: BuildingDetailProps) {
  const isAdmin = role === "admin";
  const [confirmValve, setConfirmValve] = useState<string | null>(null);
  const [confirmThresholdSave, setConfirmThresholdSave] = useState(false);
  const [thresholdsSaved, setThresholdsSaved] = useState(false);
  const [historyRange, setHistoryRange] = useState<HistoryRange>("day");
  const [thresholds, setThresholds] = useState<Record<string, number>>(() =>
    Object.fromEntries(
      building.tanks.flatMap((tank) => [
        [`${tank.id}-low`, tank.lowThreshold],
        [`${tank.id}-crit`, tank.criticalThreshold],
      ]),
    ),
  );

  const installedTanks = useMemo(
    () =>
      building.tanks.filter(
        (tank) => !tank.installationStatus || tank.installationStatus === "installed",
      ),
    [building.tanks],
  );
  const tankForValve = (valveName: string) =>
    building.tanks.find(
      (tank) => tank.name.toLowerCase() === valveName.replace(/\s+valve$/i, "").toLowerCase(),
    );
  const history = useMemo(
    () => generateHistory(installedTanks, historyRange),
    [installedTanks, historyRange],
  );

  const saveThresholds = () => {
    const updates: TankThresholdUpdate[] = building.tanks.map((tank) => ({
      tankId: tank.id,
      low: thresholds[`${tank.id}-low`] ?? tank.lowThreshold,
      critical: thresholds[`${tank.id}-crit`] ?? tank.criticalThreshold,
    }));
    if (updates.length === 0) return;
    onSaveThresholds(building.id, updates);
    setThresholdsSaved(true);
    window.setTimeout(() => setThresholdsSaved(false), 2500);
  };

  const cardStyle = { background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "0 1px 8px var(--surface-shadow-soft)" };
  const rowStyle  = { background: "var(--bg-primary)", border: "1px solid var(--border)" };

  return (
    <div className="flex flex-col gap-6 p-6 h-full overflow-y-auto" style={{ background: "var(--bg-primary)" }}>
      {/* Header */}
      <div>
        <button onClick={onBack} className="flex items-center gap-2 text-sm transition-colors hover:opacity-80 w-fit px-3 py-1.5 rounded-xl" style={{ background: "var(--info-surface)", color: "var(--accent-cyan)" }}>
          <ArrowLeft size={16} /> Back
        </button>
        <div className="flex items-center justify-between gap-4 flex-wrap mt-3">
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{building.name}</h1>
          <div className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
            Last updated: {building.lastUpdated.toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Tank status */}
      <div className="flex flex-col gap-3">
        <h2 className="text-xs font-mono uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Tank Status</h2>
        <TankGrid building={building} />
      </div>

      {/* Valve Controls */}
      {isAdmin && (
      <div className="h-full rounded-2xl p-5" style={cardStyle}>
        <h2 className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>Valve Controls</h2>
        <div className="flex flex-col gap-2">
          {building.valves.map((valve) => {
            const installationStatus = tankForValve(valve.name)?.installationStatus ?? "installed";
            const isInstallLocked = installationStatus !== "installed";
            const statusLabel = isInstallLocked
              ? installationStatus === "under-installation" ? "UNDER INSTALLATION" : "NOT INSTALLED"
              : valve.status === "stuck"
                ? "STUCK"
                : valve.status === "open"
                  ? "CLOSE"
                  : "OPEN";
            return (
              <div key={valve.id} className="w-full rounded-xl p-3" style={rowStyle}>
                <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[1.1fr_0.8fr_0.8fr_1fr] xl:items-center">
                  <div className="min-w-0">
                    <div className="text-[10px] font-mono uppercase mb-1" style={{ color: "var(--text-muted)" }}>Valve Name</div>
                    <div className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                      {valve.name.replace(/\s+valve$/i, "")}
                      <br />
                      valve
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-mono uppercase mb-1" style={{ color: "var(--text-muted)" }}>Current Status</div>
                    <div className="flex items-center gap-1.5 text-xs font-mono font-bold" style={{
                      color: valve.status === "open" ? "#10b981" : valve.status === "stuck" ? "var(--danger-text)" : "var(--text-secondary)",
                    }}>
                      <Circle size={7} fill="currentColor" />
                      {valve.status.toUpperCase()}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-mono uppercase mb-1" style={{ color: "var(--text-muted)" }}>Control Mode</div>
                    <div className="text-xs font-mono" style={{ color: "var(--text-secondary)" }}>
                      {valve.manualOverride ? "MANUAL" : "AUTO"}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-mono uppercase mb-2" style={{ color: "var(--text-muted)" }}>Click to Open/Close</div>
                    <button
                      onClick={() => setConfirmValve(valve.id)}
                      disabled={valve.status === "stuck" || isInstallLocked}
                      className="w-full min-w-0 whitespace-normal break-words px-1 py-2 rounded-lg text-xs font-mono font-bold leading-tight transition-all sm:px-3"
                      style={{
                        background: isInstallLocked || valve.status === "stuck"
                          ? "var(--bg-neutral)"
                          : valve.status === "open"
                            ? "var(--close-surface)"
                            : "var(--success-surface)",
                        color: isInstallLocked
                          ? "var(--text-muted)"
                          : valve.status === "open"
                            ? "var(--close-text)"
                            : valve.status === "stuck"
                              ? "var(--danger-text)"
                              : "var(--success-text)",
                        border: `1px solid ${
                          isInstallLocked
                            ? "var(--border)"
                            : valve.status === "open"
                              ? "var(--close-border)"
                              : valve.status === "stuck"
                                ? "var(--danger-border)"
                                : "var(--success-border)"
                        }`,
                        cursor: valve.status === "stuck" || isInstallLocked ? "not-allowed" : "pointer",
                      }}
                      title={isInstallLocked ? "Valve controls are unavailable until the tank is installed" : undefined}
                    >
                      {statusLabel}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        </div>
      )}

      {isAdmin && (
      <div className="flex flex-col gap-6">
        {/* Tank Level History - stretched full width */}
        {installedTanks.length > 0 && (
        <div className="order-2 rounded-2xl p-5" style={cardStyle}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xs font-mono uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                Tank Level History
              </h2>
              <p className="mt-0.5 text-[10px] font-mono uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                {getRangeConfig(historyRange).period}
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {HISTORY_RANGES.map((range) => {
                const isActive = range.key === historyRange;
                return (
                  <button
                    key={range.key}
                    onClick={() => setHistoryRange(range.key)}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-colors"
                    style={{
                      background: isActive ? "var(--info-surface)" : "var(--bg-subtle)",
                      color: isActive ? "var(--accent-cyan)" : "var(--text-muted)",
                      border: `1px solid ${isActive ? "var(--accent-cyan)" : "var(--border-strong)"}`,
                      cursor: "pointer",
                    }}
                  >
                    {range.label}
                  </button>
                );
              })}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="time" tick={{ fill: "var(--text-muted)", fontSize: 10, fontFamily: "monospace" }} interval={getRangeConfig(historyRange).interval} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
              <YAxis domain={[0, 80]} ticks={[0, 20, 40, 60, 80]} tick={{ fill: "var(--text-muted)", fontSize: 10, fontFamily: "monospace" }} axisLine={{ stroke: "var(--border)" }} tickLine={false} tickFormatter={(v) => `${v}%`} />
              <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border-strong)", borderRadius: 12, fontSize: 12 }} labelStyle={{ color: "var(--text-secondary)", fontFamily: "monospace" }} />
              <Legend wrapperStyle={{ fontSize: 11, fontFamily: "monospace" }} />
              {installedTanks.map((tank, index) => (
                <Line
                  key={tank.id}
                  type="monotone"
                  dataKey={tank.id}
                  stroke={tankSeriesColors[index % tankSeriesColors.length]}
                  strokeWidth={2}
                  dot={false}
                  name={`${tank.name} %`}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
        )}
        {installedTanks.length === 0 && (
          <div className="order-2 rounded-2xl p-5 text-sm" style={{ ...cardStyle, color: "var(--text-muted)" }}>
            Tank history is unavailable because no tanks are installed in this building.
          </div>
        )}

        {/* Thresholds */}
        <div className="order-1 rounded-2xl p-5" style={cardStyle}>
            <h2 className="text-[12.36px] font-mono uppercase tracking-widest mb-4 flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
              <Sliders size={14} /> Threshold Settings
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {building.tanks.flatMap((tank) => [
                { label: `${tank.name} Low %`, key: `${tank.id}-low`, color: "var(--warning-text)", bg: "var(--warning-surface)", border: "var(--warning-border)" },
                { label: `${tank.name} Critical %`, key: `${tank.id}-crit`, color: "var(--danger-text)", bg: "var(--danger-surface)", border: "var(--danger-border)" },
              ]).map((field) => (
                <div key={field.key}>
                  <label className="text-[12.36px] font-mono mb-1 block" style={{ color: "var(--text-muted)" }}>{field.label}</label>
                  <input
                    type="number"
                    value={thresholds[field.key] ?? 0}
                    onChange={(e) => setThresholds((prev) => ({ ...prev, [field.key]: Number(e.target.value) }))}
                    min="0" max="100"
                    className="w-full px-3 py-2 rounded-xl text-[14.42px] font-mono outline-none"
                    style={{ background: field.bg, border: `1px solid ${field.border}`, color: field.color }}
                  />
                </div>
              ))}
            </div>
            {building.tanks.length > 0 ? (
              <div className="mt-4 flex items-center gap-3 flex-wrap">
                <button
                  onClick={() => setConfirmThresholdSave(true)}
                  className="px-4 py-2 rounded-xl text-[14.42px] font-mono font-bold text-white transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(90deg, var(--accent-cyan), var(--accent-blue))" }}
                >
                  Save Thresholds
                </button>
                {thresholdsSaved && (
                  <span className="text-[12.36px] font-mono" style={{ color: "var(--success-text)" }}>
                    Thresholds applied · tank status updated
                  </span>
                )}
              </div>
            ) : (
              <p className="text-[14.42px]" style={{ color: "var(--text-muted)" }}>
                Threshold settings are unavailable because no tanks are installed.
              </p>
            )}
          </div>
        </div>
      )}

      {isAdmin && confirmThresholdSave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(30,58,138,0.15)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-sm mx-4 rounded-2xl p-6 alert-enter" style={{ background: "var(--bg-card)", border: "1px solid var(--border-strong)", boxShadow: "0 16px 48px var(--surface-shadow-strong)" }}>
            <h3 className="text-base font-semibold mb-2" style={{ color: "var(--text-primary)" }}>Save changes?</h3>
            <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
              Apply the updated tank thresholds?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setThresholds(Object.fromEntries(
                    building.tanks.flatMap((tank) => [
                      [`${tank.id}-low`, tank.lowThreshold],
                      [`${tank.id}-crit`, tank.criticalThreshold],
                    ]),
                  ));
                  setConfirmThresholdSave(false);
                }}
                className="flex-1 px-4 py-2 rounded-xl text-sm font-mono transition-colors"
                style={{ background: "var(--bg-primary)", border: "1px solid var(--border-strong)", color: "var(--text-secondary)" }}
              >
                No
              </button>
              <button
                onClick={() => {
                  saveThresholds();
                  setConfirmThresholdSave(false);
                }}
                className="flex-1 px-4 py-2 rounded-xl text-sm font-mono font-bold text-white transition-all hover:opacity-90"
                style={{ background: "linear-gradient(90deg, var(--accent-cyan), var(--accent-blue))" }}
              >
                Yes, save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {isAdmin && confirmValve && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(30,58,138,0.15)", backdropFilter: "blur(4px)" }}>
          <div className="rounded-2xl p-6 max-w-sm w-full mx-4 alert-enter" style={{ background: "var(--bg-card)", border: "1px solid var(--border-strong)", boxShadow: "0 16px 48px var(--surface-shadow-strong)" }}>
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle size={20} style={{ color: "var(--warning-text)" }} />
              <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>Manual Override</h3>
            </div>
            <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
              {`Toggle valve override for "${building.valves.find((v) => v.id === confirmValve)?.name}"?`}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmValve(null)}
                className="flex-1 px-4 py-2 rounded-xl text-sm font-mono hover:bg-blue-50 transition-colors"
                style={{ background: "var(--bg-primary)", border: "1px solid var(--border-strong)", color: "var(--text-secondary)" }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (confirmValve) {
                    const valve = building.valves.find((item) => item.id === confirmValve);
                    if (valve) onToggleValve(building.id, confirmValve, valve.status === "open" ? "closed" : "open");
                  }
                  setConfirmValve(null);
                }}
                className="flex-1 px-4 py-2 rounded-xl text-sm font-mono font-bold text-white transition-all hover:opacity-90"
                style={{ background: "linear-gradient(90deg, var(--accent-cyan), var(--accent-blue))" }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
