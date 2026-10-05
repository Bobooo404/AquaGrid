import { useState } from "react";
import { ArrowLeft, RotateCw, Circle, Sliders, AlertTriangle } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import type { Building } from "../data/mockData";
import TankVisual from "../components/TankVisual";

interface BuildingDetailProps {
  building: Building;
  onBack: () => void;
  onTogglePump: (buildingId: string, pumpId: string) => void;
  onToggleValve: (buildingId: string, valveId: string) => void;
}

function generateHistory(level: number) {
  const now = Date.now();
  return Array.from({ length: 30 }, (_, i) => ({
    time: new Date(now - (29 - i) * 60000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    overhead: Math.max(0, Math.min(100, level + (Math.random() - 0.5) * 20 - (29 - i) * 0.3)),
    ground: Math.max(0, Math.min(100, 70 + (Math.random() - 0.5) * 15)),
  }));
}

const pipelineColors: Record<string, string> = {
  clean: "var(--accent-cyan)",
  recycled: "#10b981",
  sewage: "#8b5cf6",
};

export default function BuildingDetail({ building, onBack, onTogglePump, onToggleValve }: BuildingDetailProps) {
  const [confirmPump, setConfirmPump] = useState<string | null>(null);
  const [confirmValve, setConfirmValve] = useState<string | null>(null);
  const [thresholds, setThresholds] = useState({
    overheadLow:  building.tanks[0]?.lowThreshold ?? 30,
    overheadCrit: building.tanks[0]?.criticalThreshold ?? 15,
    groundLow:    building.tanks[1]?.lowThreshold ?? 25,
    groundCrit:   building.tanks[1]?.criticalThreshold ?? 10,
  });

  const overhead = building.tanks.find((t) => t.type === "overhead")!;
  const ground   = building.tanks.find((t) => t.type === "ground")!;
  const history  = generateHistory(overhead?.currentLevel ?? 50);

  const cardStyle = { background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "0 1px 8px rgba(14,165,233,0.06)" };
  const rowStyle  = { background: "var(--bg-primary)", border: "1px solid var(--border)" };

  return (
    <div className="flex flex-col gap-6 p-6 h-full overflow-y-auto" style={{ background: "var(--bg-primary)" }}>
      {/* Header */}
      <div className="flex items-center gap-4 flex-wrap">
        <button onClick={onBack} className="flex items-center gap-2 text-sm transition-colors hover:opacity-80" style={{ color: "var(--accent-cyan)" }}>
          <ArrowLeft size={16} /> Back
        </button>
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{building.name}</h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>{building.location} · {building.floors} floors</p>
        </div>
        <div className="ml-auto text-xs font-mono" style={{ color: "var(--text-muted)" }}>
          Last updated: {building.lastUpdated.toLocaleTimeString()}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="flex flex-col gap-4 lg:col-span-1">
          {/* Tanks */}
          <div className="rounded-2xl p-6" style={cardStyle}>
            <h2 className="text-xs font-mono uppercase tracking-widest mb-4" style={{ color: "var(--text-muted)" }}>Tank Levels</h2>
            <div className="flex items-end justify-center gap-12">
              {overhead && <TankVisual level={overhead.currentLevel} capacity={overhead.capacity} name="Overhead" type="overhead" size="lg" />}
              {ground   && <TankVisual level={ground.currentLevel}   capacity={ground.capacity}   name="Ground"   type="ground"   size="lg" />}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
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

          {/* Pumps */}
          <div className="rounded-2xl p-5" style={cardStyle}>
            <h2 className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>Pump Controls</h2>
            <div className="flex flex-col gap-2">
              {building.pumps.map((pump) => (
                <div key={pump.id} className="rounded-xl p-3 flex items-center justify-between" style={rowStyle}>
                  <div className="flex items-center gap-2">
                    <RotateCw size={14}
                      className={pump.status === "running" ? "pump-running" : ""}
                      style={{ color: pump.status === "fault" ? "#ef4444" : pump.status === "running" ? "var(--accent-cyan)" : "var(--border-strong)" }}
                    />
                    <div>
                      <div className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{pump.name}</div>
                      <div className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>{pump.flowRate} L/min · {pump.runtime}h today</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {pump.manualOverride && <span className="text-xs font-mono" style={{ color: "var(--warning-text)" }}>MANUAL</span>}
                    <button
                      onClick={() => setConfirmPump(pump.id)}
                      disabled={pump.status === "fault"}
                      className="px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all"
                      style={{
                        background: pump.status === "running" ? "var(--danger-surface)" : pump.status === "fault" ? "var(--bg-neutral)" : "var(--bg-subtle)",
                        color:      pump.status === "running" ? "var(--danger-text)" : pump.status === "fault" ? "#cbd5e1" : "var(--accent-blue)",
                        border:     `1px solid ${pump.status === "running" ? "var(--danger-border)" : pump.status === "fault" ? "var(--border-neutral)" : "var(--border-strong)"}`,
                        cursor: pump.status === "fault" ? "not-allowed" : "pointer",
                      }}
                    >
                      {pump.status === "running" ? "STOP" : pump.status === "fault" ? "FAULT" : "START"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Valves */}
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
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4 lg:col-span-2">
          {/* Chart */}
          <div className="rounded-2xl p-5" style={cardStyle}>
            <h2 className="text-xs font-mono uppercase tracking-widest mb-4" style={{ color: "var(--text-muted)" }}>Tank Level History (Last 30 min)</h2>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="time" tick={{ fill: "var(--text-muted)", fontSize: 10, fontFamily: "monospace" }} interval={4} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: "var(--text-muted)", fontSize: 10, fontFamily: "monospace" }} axisLine={{ stroke: "var(--border)" }} tickLine={false} tickFormatter={(v) => `${v}%`} />
                <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border-strong)", borderRadius: 12, fontSize: 12 }} labelStyle={{ color: "var(--text-secondary)", fontFamily: "monospace" }} />
                <Legend wrapperStyle={{ fontSize: 11, fontFamily: "monospace" }} />
                <Line type="monotone" dataKey="overhead" stroke="var(--accent-cyan)" strokeWidth={2} dot={false} name="Overhead %" />
                <Line type="monotone" dataKey="ground"   stroke="#10b981" strokeWidth={2} dot={false} name="Ground %" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Pipelines */}
          <div className="rounded-2xl p-5" style={cardStyle}>
            <h2 className="text-xs font-mono uppercase tracking-widest mb-4" style={{ color: "var(--text-muted)" }}>Pipeline Status</h2>
            <div className="grid grid-cols-3 gap-3">
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
                      {pl.type.toUpperCase()}
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

          {/* Thresholds */}
          <div className="rounded-2xl p-5" style={cardStyle}>
            <h2 className="text-xs font-mono uppercase tracking-widest mb-4 flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
              <Sliders size={14} /> Threshold Settings
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Overhead Low %", key: "overheadLow", color: "var(--warning-text)", bg: "var(--warning-surface)", border: "var(--warning-border)" },
                { label: "Overhead Critical %", key: "overheadCrit", color: "var(--danger-text)", bg: "var(--danger-surface)", border: "var(--danger-border)" },
                { label: "Ground Low %", key: "groundLow", color: "var(--warning-text)", bg: "var(--warning-surface)", border: "var(--warning-border)" },
                { label: "Ground Critical %", key: "groundCrit", color: "var(--danger-text)", bg: "var(--danger-surface)", border: "var(--danger-border)" },
              ].map((field) => (
                <div key={field.key}>
                  <label className="text-xs font-mono mb-1 block" style={{ color: "var(--text-muted)" }}>{field.label}</label>
                  <input
                    type="number"
                    value={thresholds[field.key as keyof typeof thresholds]}
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
        </div>
      </div>

      {/* Confirm Modal */}
      {(confirmPump || confirmValve) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(30,58,138,0.15)", backdropFilter: "blur(4px)" }}>
          <div className="rounded-2xl p-6 max-w-sm w-full mx-4 alert-enter" style={{ background: "var(--bg-card)", border: "1px solid var(--border-strong)", boxShadow: "0 16px 48px rgba(14,165,233,0.15)" }}>
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle size={20} style={{ color: "var(--warning-text)" }} />
              <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>Manual Override</h3>
            </div>
            <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
              {confirmPump
                ? `Toggle pump override for "${building.pumps.find((p) => p.id === confirmPump)?.name}"?`
                : `Toggle valve override for "${building.valves.find((v) => v.id === confirmValve)?.name}"?`}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { setConfirmPump(null); setConfirmValve(null); }}
                className="flex-1 px-4 py-2 rounded-xl text-sm font-mono hover:bg-blue-50 transition-colors"
                style={{ background: "var(--bg-primary)", border: "1px solid var(--border-strong)", color: "var(--text-secondary)" }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (confirmPump) onTogglePump(building.id, confirmPump);
                  if (confirmValve) onToggleValve(building.id, confirmValve);
                  setConfirmPump(null); setConfirmValve(null);
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
