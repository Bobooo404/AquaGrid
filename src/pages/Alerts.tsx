import { useState } from "react";
import { AlertTriangle, CheckCircle2, Info, CheckCheck } from "lucide-react";
import type { Alert } from "../data/mockData";

interface AlertsPageProps {
  alerts: Alert[];
  onAcknowledge: (id: string) => void;
}

const severityConfig = {
  critical: { color: "var(--danger-text)", bg: "var(--danger-surface)",  border: "var(--danger-border)", icon: AlertTriangle, label: "CRITICAL" },
  warning:  { color: "var(--warning-text)", bg: "var(--warning-surface)",  border: "var(--warning-border)", icon: AlertTriangle, label: "WARNING"  },
  info:     { color: "var(--accent-cyan)", bg: "var(--bg-subtle)",  border: "var(--border-strong)", icon: Info,          label: "INFO"     },
};

type DateRange = "all" | "today" | "yesterday" | "week" | "month";

const dateRanges: { id: DateRange; label: string }[] = [
  { id: "all", label: "All" },
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "week", label: "Last Week" },
  { id: "month", label: "Last Month" },
];

const DAY_MS = 86400000;

function inDateRange(ts: Date, range: DateRange): boolean {
  if (range === "all") return true;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const t = ts.getTime();
  const todayStart = startOfToday.getTime();
  switch (range) {
    case "today":    return t >= todayStart;
    case "yesterday": return t >= todayStart - DAY_MS && t < todayStart;
    case "week":     return t >= todayStart - 7 * DAY_MS && t < todayStart - DAY_MS;
    case "month":    return t >= todayStart - 30 * DAY_MS && t < todayStart - 7 * DAY_MS;
    default:         return true;
  }
}

export default function AlertsPage({ alerts, onAcknowledge }: AlertsPageProps) {
  const [filter, setFilter] = useState<"all" | "critical" | "warning" | "info">("all");
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [showAcknowledged, setShowAcknowledged] = useState(false);

  const filtered = alerts.filter((a) => {
    if (!showAcknowledged && a.acknowledged) return false;
    if (filter !== "all" && a.severity !== filter) return false;
    if (!inDateRange(a.timestamp, dateRange)) return false;
    return true;
  });

  const critCount = alerts.filter((a) => a.severity === "critical" && !a.acknowledged).length;
  const warnCount = alerts.filter((a) => a.severity === "warning"  && !a.acknowledged).length;

  return (
    <div className="flex flex-col gap-6 p-6 h-full overflow-y-auto" style={{ background: "var(--bg-primary)" }}>
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Active Alerts</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            {critCount} critical · {warnCount} warnings · {alerts.filter((a) => !a.acknowledged).length} total unread
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer select-none" style={{ color: "var(--text-secondary)" }}>
          <input type="checkbox" checked={showAcknowledged} onChange={(e) => setShowAcknowledged(e.target.checked)} className="rounded" />
          Show acknowledged
        </label>
      </div>

      {/* Severity dropdown */}
      <div className="flex items-center gap-3">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as typeof filter)}
          className="text-sm cursor-pointer"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            color: "var(--text-primary)",
            borderRadius: 10,
            padding: "6px 12px",
            fontSize: 13,
            outline: "none",
          }}
        >
          <option value="all">All Severities</option>
          <option value="critical">Critical</option>
          <option value="warning">Warning</option>
          <option value="info">Info</option>
        </select>
      </div>

      {/* Date range bar */}
      <div className="flex items-center gap-2 flex-wrap">
        {dateRanges.map((r) => {
          const active = dateRange === r.id;
          const count = alerts.filter((a) => inDateRange(a.timestamp, r.id)).length;
          return (
            <button
              key={r.id}
              onClick={() => setDateRange(r.id)}
              className="px-4 py-1.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-2"
              style={{
                background: active ? "var(--accent-blue)" : "var(--bg-card)",
                color: active ? "#fff" : "var(--text-muted)",
                border: `1px solid ${active ? "var(--accent-blue)" : "var(--border)"}`,
              }}
            >
              {r.label}
              <span
                className="px-1.5 py-0.5 rounded-md text-[10px]"
                style={{
                  background: active ? "rgba(255,255,255,0.2)" : "var(--bg-subtle)",
                  color: active ? "#fff" : "var(--text-secondary)",
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Alerts list */}
      <div className="flex flex-col gap-3">
        {filtered.length === 0 ? (
          <div className="rounded-2xl p-12 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <CheckCircle2 size={32} className="mx-auto mb-3" style={{ color: "#10b981" }} />
            <div className="font-semibold" style={{ color: "var(--text-primary)" }}>All clear</div>
            <div className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>No alerts match your current filter</div>
          </div>
        ) : (
          filtered.map((alert) => {
            const cfg = severityConfig[alert.severity];
            const Icon = cfg.icon;
            return (
              <div
                key={alert.id}
                className="alert-enter rounded-2xl p-4 flex items-start gap-4 transition-all"
                style={{
                  background: cfg.bg,
                  border: `1px solid ${cfg.border}`,
                  opacity: alert.acknowledged ? 0.55 : 1,
                  boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
                }}
              >
                <div className="flex-shrink-0 mt-0.5 relative">
                  <Icon size={18} style={{ color: cfg.color }} />
                  {!alert.acknowledged && alert.severity === "critical" && (
                    <div className="absolute inset-0 rounded-full ripple" style={{ border: `1px solid ${cfg.color}`, opacity: 0.4 }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg"
                      style={{ background: `${cfg.color}15`, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                      {cfg.label}
                    </span>
                    <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>{alert.type}</span>
                    <span style={{ color: "var(--border-strong)" }}>·</span>
                    <span className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>{alert.buildingName}</span>
                  </div>
                  <p className="text-sm mt-1 font-medium" style={{ color: "var(--text-primary)" }}>{alert.message}</p>
                  <div className="text-xs font-mono mt-1" style={{ color: "var(--text-muted)" }}>
                    {alert.timestamp.toLocaleString()}
                  </div>
                </div>
                {!alert.acknowledged ? (
                  <button
                    onClick={() => onAcknowledge(alert.id)}
                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all hover:opacity-80"
                    style={{ background: "var(--success-surface)", color: "var(--success-text)", border: "1px solid var(--success-border)" }}
                  >
                    <CheckCheck size={12} /> ACK
                  </button>
                ) : (
                  <span className="flex-shrink-0 text-xs font-mono flex items-center gap-1" style={{ color: "#10b981" }}>
                    <CheckCircle2 size={12} /> Done
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
