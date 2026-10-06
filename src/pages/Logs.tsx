import { useState, useCallback } from "react";
import { Download, Activity, Zap, Circle, AlertTriangle, User } from "lucide-react";
import type { LogEntry } from "../data/mockData";

interface LogsPageProps {
  logs: LogEntry[];
}

const typeConfig = {
  system: { color: "var(--accent-blue)", bg: "var(--bg-subtle)", border: "var(--border-strong)", icon: Activity,      label: "SYSTEM" },
  pump:   { color: "var(--accent-cyan)", bg: "var(--info-surface)", border: "#7dd3fc", icon: Zap,           label: "PUMP"   },
  valve:  { color: "#10b981", bg: "var(--success-surface)", border: "var(--success-border)", icon: Circle,        label: "VALVE"  },
  alert:  { color: "var(--warning-text)", bg: "var(--warning-surface)", border: "var(--warning-border)", icon: AlertTriangle, label: "ALERT"  },
  user:   { color: "#7c3aed", bg: "var(--purple-surface)", border: "#c4b5fd", icon: User,          label: "USER"   },
};

const inputStyle = {
  background: "var(--bg-card)",
  border: "1px solid var(--border)",
  color: "var(--text-primary)",
  borderRadius: 10,
  padding: "6px 12px",
  fontSize: 13,
  outline: "none",
} as const;

export default function LogsPage({ logs }: LogsPageProps) {
  const [typeFilter, setBuildingFilter2] = useState<string>("all");
  const [buildingFilter, setBuildingFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const buildings = Array.from(new Set(logs.map((l) => l.buildingName))).sort();

  const filtered = logs.filter((l) => {
    if (typeFilter !== "all" && l.type !== typeFilter) return false;
    if (buildingFilter !== "all" && l.buildingName !== buildingFilter) return false;
    if (search && !l.event.toLowerCase().includes(search.toLowerCase()) && !l.buildingName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const exportCSV = useCallback(() => {
    const header = "Timestamp,Building,Type,Event,Details\n";
    const rows = filtered.map((l) =>
      `"${l.timestamp.toISOString()}","${l.buildingName}","${l.type}","${l.event}","${l.details}"`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aquaflow-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filtered]);

  return (
    <div className="flex flex-col gap-6 p-6 h-full overflow-y-auto" style={{ background: "var(--bg-primary)" }}>
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Event Logs</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>{filtered.length} entries · Last 7 days</p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-mono font-bold transition-all hover:opacity-90 text-white"
          style={{ background: "linear-gradient(90deg, var(--accent-cyan), var(--accent-blue))" }}
        >
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search logs..."
          style={{ ...inputStyle, minWidth: 180 }}
        />
        <select value={typeFilter} onChange={(e) => setBuildingFilter2(e.target.value)} style={inputStyle}>
          <option value="all">All Types</option>
          {Object.keys(typeConfig).map((t) => (
            <option key={t} value={t}>{typeConfig[t as keyof typeof typeConfig].label}</option>
          ))}
        </select>
        <select value={buildingFilter} onChange={(e) => setBuildingFilter(e.target.value)} style={inputStyle}>
          <option value="all">All Buildings</option>
          {buildings.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "0 1px 8px var(--surface-shadow-soft)" }}>
        <div
          className="grid text-xs font-mono uppercase tracking-wider px-5 py-3"
          style={{ gridTemplateColumns: "140px 1fr 80px 1fr", borderBottom: "1px solid var(--border)", background: "var(--bg-primary)", color: "var(--text-muted)" }}
        >
          <span>Timestamp</span><span>Event</span><span>Type</span><span>Building</span>
        </div>
        <div className="max-h-[600px] overflow-y-auto">
          {filtered.map((log) => {
            const cfg = typeConfig[log.type];
            const Icon = cfg.icon;
            return (
              <div
                key={log.id}
                className="grid px-5 py-3 text-sm items-center hover:bg-blue-50 transition-colors"
                style={{ gridTemplateColumns: "140px 1fr 80px 1fr", borderBottom: "1px solid var(--bg-primary)" }}
              >
                <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                  {log.timestamp.toLocaleDateString([], { month: "short", day: "2-digit" })}{" "}
                  {log.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
                <span className="pr-4 font-medium" style={{ color: "var(--text-primary)" }}>{log.event}</span>
                <span>
                  <span className="flex items-center gap-1 text-xs font-mono px-1.5 py-0.5 rounded-lg w-fit"
                    style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                    <Icon size={10} /> {cfg.label}
                  </span>
                </span>
                <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{log.buildingName}</span>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="px-5 py-12 text-center text-sm" style={{ color: "var(--text-muted)" }}>No log entries match your filter</div>
          )}
        </div>
      </div>
    </div>
  );
}
