import { useState } from "react";
import { Search, Bell, Wifi, WifiOff, ChevronDown, Sun, Moon, Menu } from "lucide-react";
import type { Alert } from "../data/mockData";
import aquagridLogo from "../assets/aquagrid-logo.png";
import type { AuthUser } from "../auth/auth";

interface NavbarProps {
  alerts: Alert[];
  wsConnected: boolean;
  selectedSite: string | null;
  onSelectSite: (site: string) => void;
  darkMode: boolean;
  onToggleDark: () => void;
  onToggleSidebar: () => void;
  user: AuthUser;
}

const sites = ["Majestique Towers, Kharadi", "Option 2", "Option 3", "Option 4"];

export default function Navbar({
  alerts,
  wsConnected,
  selectedSite,
  onSelectSite,
  darkMode,
  onToggleDark,
  onToggleSidebar,
  user,
}: NavbarProps) {
  const [buildingOpen, setBuildingOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [alertsOpen, setAlertsOpen] = useState(false);

  const unread = alerts.filter((a) => !a.acknowledged).length;
  const filtered = sites.filter((site) => site.toLowerCase().includes(search.toLowerCase()));

  return (
    <header
      className="flex items-center gap-4 px-4 h-14 flex-shrink-0 relative z-50"
      style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border)", boxShadow: "0 1px 6px rgba(14,165,233,0.07)" }}
    >
      <button onClick={onToggleSidebar} className="md:hidden p-1" style={{ color: "var(--text-secondary)" }}>
        <Menu size={20} />
      </button>

      {/* Building selector */}
      <div className="relative">
        <button
          onClick={() => { setBuildingOpen((o) => !o); setAlertsOpen(false); }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm transition-colors hover:bg-blue-50"
          style={{
            background: "var(--bg-subtle)",
            border: "1px solid var(--border-strong)",
            color: "var(--text-primary)",
            minWidth: 160,
          }}
        >
          <span className="truncate">{selectedSite ?? "Select Site"}</span>
          <ChevronDown size={14} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
        </button>
        {buildingOpen && (
          <div
            className="absolute top-full mt-1 left-0 rounded-2xl overflow-hidden z-50"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              minWidth: 220,
              boxShadow: "0 8px 32px rgba(14,165,233,0.12)",
            }}
          >
            <div className="p-2">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search sites..."
                className="w-full px-3 py-1.5 rounded-lg text-sm outline-none"
                style={{ background: "var(--bg-primary)", border: "1px solid var(--border-strong)", color: "var(--text-primary)" }}
                autoFocus
              />
            </div>
            <div className="max-h-48 overflow-y-auto">
              {filtered.map((site) => (
                <button
                  key={site}
                  onClick={() => { onSelectSite(site); setBuildingOpen(false); setSearch(""); }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 transition-colors"
                  style={{ color: selectedSite === site ? "var(--accent-blue)" : "var(--text-primary)" }}
                >
                  <div className="font-medium">{site}</div>
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="px-4 py-3 text-sm text-muted">No sites found</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Global search */}
      <div className="hidden sm:flex flex-1 max-w-xs items-center gap-2 px-3 py-1.5 rounded-xl"
        style={{ background: "var(--bg-primary)", border: "1px solid var(--border)" }}
      >
        <Search size={14} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
        <input
          className="bg-transparent text-sm outline-none w-full"
          style={{ color: "var(--text-primary)" }}
          placeholder="Search..."
        />
      </div>

      <div className="ml-auto flex items-center gap-3">
        {/* WS status */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono">
          {wsConnected ? (
            <><Wifi size={12} className="text-emerald-500" /><span className="text-emerald-600 font-semibold">LIVE</span></>
          ) : (
            <><WifiOff size={12} style={{ color: "var(--text-muted)" }} /><span style={{ color: "var(--text-muted)" }}>CONNECTING</span></>
          )}
        </div>

        {/* Theme toggle */}
        <button
          onClick={onToggleDark}
          className="p-1.5 rounded-lg hover:bg-blue-50 transition-colors"
          style={{ color: "var(--text-secondary)" }}
          title={darkMode ? "Switch to light theme" : "Switch to dark theme"}
          aria-label={darkMode ? "Switch to light theme" : "Switch to dark theme"}
        >
          {darkMode ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Alerts bell */}
        <div className="relative">
          <button
            onClick={() => { setAlertsOpen((o) => !o); setBuildingOpen(false); }}
            className="relative p-1.5 rounded-lg hover:bg-blue-50 transition-colors"
            style={{ color: "var(--text-secondary)" }}
          >
            <Bell size={16} />
            {unread > 0 && (
              <span
                className="absolute -top-1 -right-1 flex items-center justify-center text-white rounded-full pulse-glow"
                style={{ width: 16, height: 16, fontSize: 9, fontWeight: 700, background: "#ef4444" }}
              >
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </button>
          {alertsOpen && (
            <div
              className="absolute right-0 top-full mt-1 rounded-2xl overflow-hidden z-50"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                width: 320,
                boxShadow: "0 8px 32px rgba(14,165,233,0.12)",
              }}
            >
              <div className="px-4 py-3 text-sm font-semibold" style={{ color: "var(--text-primary)", borderBottom: "1px solid var(--border)" }}>
                Active Alerts ({unread} unread)
              </div>
              <div className="max-h-80 overflow-y-auto">
                {alerts.slice(0, 8).map((alert) => (
                  <div
                    key={alert.id}
                    className="px-4 py-3 hover:bg-blue-50 transition-colors"
                    style={{ borderBottom: "1px solid var(--bg-subtle)", opacity: alert.acknowledged ? 0.5 : 1 }}
                  >
                    <div className="flex items-start gap-2">
                      <div
                        className="flex-shrink-0 w-2 h-2 rounded-full mt-1.5"
                        style={{
                          background: alert.severity === "critical" ? "#ef4444" : alert.severity === "warning" ? "#f59e0b" : "var(--accent-cyan)",
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold truncate" style={{ color: "var(--text-primary)" }}>{alert.buildingName}</div>
                        <div className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{alert.message}</div>
                        <div className="text-xs mt-0.5 font-mono" style={{ color: "var(--text-muted)" }}>
                          {alert.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {alerts.length === 0 && (
                  <div className="px-4 py-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>No active alerts</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Role + Avatar */}
        <span
          className="hidden sm:inline text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-1 rounded-lg"
          title={`${user.name} · ${user.email}`}
          style={
            user.role === "admin"
              ? { background: "var(--warning-surface)", color: "var(--warning-text)", border: "1px solid var(--warning-border)" }
              : { background: "var(--info-surface)", color: "var(--accent-blue)", border: "1px solid var(--border-strong)" }
          }
        >
          {user.role}
        </span>
        <div
          className="flex items-center justify-center rounded-full overflow-hidden cursor-pointer flex-shrink-0"
          style={{
            width: 32,
            height: 32,
            background: "var(--bg-subtle)",
            border: `1px solid ${user.role === "admin" ? "var(--warning-border)" : "var(--border-strong)"}`,
            padding: 3,
          }}
          title={`${user.name} (${user.role})`}
        >
          <img
            src={aquagridLogo}
            alt={user.name}
            className="w-full h-full rounded-full object-contain"
          />
        </div>
      </div>
    </header>
  );
}
