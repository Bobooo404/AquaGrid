import { useState } from "react";
import { ArrowLeft, Circle, Sliders, AlertTriangle } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import type { Building, Tank } from "../data/mockData";
import type { Role } from "../auth/auth";
import TankVisual from "../components/TankVisual";

interface BuildingDetailProps {
  building: Building;
  role: Role;
  onBack: () => void;
  onToggleValve: (buildingId: string, valveId: string) => void;
}

const tankSeriesColors = ["var(--accent-cyan)", "#10b981", "#f59e0b", "#8b5cf6"];

function generateHistory(tanks: Tank[]) {
  const now = Date.now();
  return Array.from({ length: 30 }, (_, i) => {
    const point: Record<string, string | number> = {
      time: new Date(now - (29 - i) * 60000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    tanks.forEach((tank, index) => {
      const drift = index === 0 ? -0.3 : index === 1 ? -0.15 : -0.2;
      const spread = 20 - index * 4;
      point[tank.id] = Math.max(
        0,
        Math.min(100, tank.currentLevel + (Math.random() - 0.5) * spread - (29 - i) * drift),
      );
    });
    return point;
  });
}

const pipelineColors: Record<string, string> = {
  clean: "var(--accent-cyan)",
  recycled: "#10b981",
  sewage: "#8b5cf6",
};

export default function BuildingDetail({ building, role, onBack, onToggleValve }: BuildingDetailProps) {
  const isAdmin = role === "admin";
  const [confirmValve, setConfirmValve] = useState<string | null>(null);
  const [thresholds, setThresholds] = useState<Record<string, number>>(() =>
    Object.fromEntries(
      building.tanks.flatMap((tank) => [
        [`${tank.id}-low`, tank.lowThreshold],
        [`${tank.id}-crit`, tank.criticalThreshold],
      ]),
    ),
  );

  const history = generateHistory(building.tanks);

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

      {!isAdmin && (
        <div
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-mono"
          style={{ background: "var(--info-surface)", border: "1px solid var(--border-strong)", color: "var(--accent-blue)" }}
        >
          Read-only view · showing tank levels and pipeline status
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
      {/* Tanks */}
      <div className="rounded-2xl p-6" style={cardStyle}>
        <h2 className="text-xs font-mono uppercase tracking-widest mb-4" style={{ color: "var(--text-muted)" }}>Tank Levels</h2>
        <div className="grid grid-cols-3 items-end gap-2">
          {building.tanks.map((t) => (
            <TankVisual key={t.id} level={t.currentLevel} capacity={t.capacity} name={t.name} type={t.type} size="md" showVolume={false} />
          ))}
        </div>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {building.tanks.map((t) => (
            <div key={t.id} className="rounded-xl p-3" style={rowStyle}>
              <div className="text-xs font-mono mb-1" style={{ color: "var(--text-muted)" }}>{t.name}</div>
              <div className="text-lg font-bold font-mono" style={{ color: "var(--text-primary)" }}>{Math.round(t.currentLevel)}%</div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                {Math.round((t.currentLevel / 100) * t.capacity).toLocaleString()}L / {t.capacity.toLocaleString()}L
              </div>
              <div className="mt-2 flex gap-1 flex-wrap">
                <span className="text-xs font-mono px-1 py-0.5 rounded-lg" style={{ background: "var(--warning-surface)", color: "var(--warning-text)", border: "1px solid var(--warning-border)" }}>
                  Low: {t.lowThreshold}%
                </span>
                <span className="text-xs font-mono px-1 py-0.5 rounded-lg" style={{ background: "var(--danger-surface)", color: "var(--danger-text)", border: "1px solid var(--danger-border)" }}>
                  Crit: {t.criticalThreshold}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pipelines */}
      <div className="rounded-2xl p-5" style={cardStyle}>
        <h2 className="text-xs font-mono uppercase tracking-widest mb-4" style={{ color: "var(--text-muted)" }}>Pipeline Status</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {building.pipelines.map((pl) => (
            <div key={pl.id} className="rounded-xl p-4 flex flex-col gap-3"
              style={{
                background: pl.isActive ? `${pipelineColors[pl.type]}0d` : "var(--bg-neutral)",
                border: `1px solid ${pl.isActive ? pipelineColors[pl.type] + "40" : "var(--border-neutral)"}`,
              }}
            >
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: pipelineColors[pl.type], opacity: pl.isActive ? 1 : 0.3 }} />
                <span className="text-xs font-mono font-bold" style={{ color: pipelineColors[pl.type] }}>
                  {pl.type === "sewage" ? "FLUSHING" : pl.type.toUpperCase()}
                </span>
              </div>
              <div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>{pl.name}</div>
                <div className="text-sm font-mono font-bold mt-1" style={{ color: "var(--text-primary)" }}>
                  {pl.isActive ? `${pl.flowRate} L/min` : "INACTIVE"}
                </div>
              </div>
              <svg width="100%" height="12">
                <line x1="0" y1="6" x2="100%" y2="6"
                  stroke={pl.isActive ? pipelineColors[pl.type] : "var(--border)"}
                  strokeWidth="2.5"
                  strokeDasharray={pl.isActive ? "6 4" : "none"}
                  className={pl.isActive ? (pl.type === "sewage" ? "flow-sewage" : pl.type === "recycled" ? "flow-recycled" : "flow-active") : ""}
                />
              </svg>
            </div>
          ))}
        </div>
      </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* Tank Level History - stretched full width */}
        {isAdmin && (
        <div className="rounded-2xl p-5" style={cardStyle}>
          <h2 className="text-xs font-mono uppercase tracking-widest mb-4" style={{ color: "var(--text-muted)" }}>Tank Level History (Last 30 min)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="time" tick={{ fill: "var(--text-muted)", fontSize: 10, fontFamily: "monospace" }} interval={4} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: "var(--text-muted)", fontSize: 10, fontFamily: "monospace" }} axisLine={{ stroke: "var(--border)" }} tickLine={false} tickFormatter={(v) => `${v}%`} />
              <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border-strong)", borderRadius: 12, fontSize: 12 }} labelStyle={{ color: "var(--text-secondary)", fontFamily: "monospace" }} />
              <Legend wrapperStyle={{ fontSize: 11, fontFamily: "monospace" }} />
              {building.tanks.map((tank, index) => (
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Valve Controls */}
          {isAdmin && (
          <div className="rounded-2xl p-5" style={cardStyle}>
            <h2 className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>Valve Controls</h2>
            <div className="flex flex-col gap-2">
              {building.valves.map((valve) => (
                <div key={valve.id} className="rounded-xl p-3 flex items-center justify-between" style={rowStyle}>
                  <div className="flex items-center gap-2">
                    <Circle size={10} style={{
                      color: valve.status === "open" ? "#10b981" : valve.status === "stuck" ? "#ef4444" : "var(--border-strong)",
                      fill:  valve.status === "open" ? "#10b981" : valve.status === "stuck" ? "#ef4444" : "var(--border-strong)",
                    }} />
                    <div>
                      <div className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{valve.name}</div>
                      <div className="text-xs font-mono" style={{ color: pipelineColors[valve.pipelineType] }}>
                        {valve.pipelineType.toUpperCase()}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setConfirmValve(valve.id)}
                    disabled={valve.status === "stuck"}
                    className="px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all"
                    style={{
                      background: valve.status === "open" ? "var(--danger-surface)" : valve.status === "stuck" ? "var(--danger-surface)" : "var(--success-surface)",
                      color:      valve.status === "open" ? "var(--danger-text)" : valve.status === "stuck" ? "var(--danger-text)" : "var(--success-text)",
                      border:     `1px solid ${valve.status === "open" ? "var(--danger-border)" : valve.status === "stuck" ? "var(--danger-border)" : "var(--success-border)"}`,
                      cursor: valve.status === "stuck" ? "not-allowed" : "pointer",
                    }}
                  >
                    {valve.status === "stuck" ? "STUCK" : valve.status === "open" ? "CLOSE" : "OPEN"}
                  </button>
                </div>
              ))}
            </div>
          </div>
          )}

        {/* Thresholds */}
          {isAdmin && (
          <div className="rounded-2xl p-5" style={cardStyle}>
            <h2 className="text-xs font-mono uppercase tracking-widest mb-4 flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
              <Sliders size={14} /> Threshold Settings
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {building.tanks.flatMap((tank) => [
                { label: `${tank.name} Low %`, key: `${tank.id}-low`, color: "var(--warning-text)", bg: "var(--warning-surface)", border: "var(--warning-border)" },
                { label: `${tank.name} Critical %`, key: `${tank.id}-crit`, color: "var(--danger-text)", bg: "var(--danger-surface)", border: "var(--danger-border)" },
              ]).map((field) => (
                <div key={field.key}>
                  <label className="text-xs font-mono mb-1 block" style={{ color: "var(--text-muted)" }}>{field.label}</label>
                  <input
                    type="number"
                    value={thresholds[field.key] ?? 0}
                    onChange={(e) => setThresholds((prev) => ({ ...prev, [field.key]: Number(e.target.value) }))}
                    min="0" max="100"
                    className="w-full px-3 py-2 rounded-xl text-sm font-mono outline-none"
                    style={{ background: field.bg, border: `1px solid ${field.border}`, color: field.color }}
                  />
                </div>
              ))}
            </div>
            <button
              className="mt-4 px-4 py-2 rounded-xl text-sm font-mono font-bold text-white transition-all hover:opacity-90"
              style={{ background: "linear-gradient(90deg, var(--accent-cyan), var(--accent-blue))" }}
            >
              Save Thresholds
            </button>
          </div>
          )}
        </div>
      </div>

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
                  if (confirmValve) onToggleValve(building.id, confirmValve);
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
