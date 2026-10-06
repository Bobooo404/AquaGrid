import { useEffect, useRef } from "react";
import { animate } from "animejs";
import {
  LayoutDashboard,
  Building2,
  Bell,
  ScrollText,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import aquagridLogo from "../assets/aquagrid-logo.png";
import type { AuthUser } from "../auth/auth";

type Page = "dashboard" | "buildings" | "alerts" | "logs" | "management";

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  collapsed: boolean;
  onToggle: () => void;
  alertCount: number;
  user: AuthUser;
  onLogout: () => void;
}

const navItems: { id: Page; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "buildings", label: "Buildings", icon: Building2 },
  { id: "alerts", label: "Alerts", icon: Bell },
  { id: "logs", label: "Event Logs", icon: ScrollText },
  { id: "management", label: "Management", icon: Settings },
];

export default function Sidebar({ currentPage, onNavigate, collapsed, onToggle, alertCount, user, onLogout }: SidebarProps) {
  const logoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logoRef.current) {
      animate(logoRef.current, {
        scale: [0.8, 1],
        opacity: [0, 1],
        duration: 600,
        ease: "outBack",
      });
    }
  }, []);

  return (
    <aside
      className="relative flex flex-col h-full transition-all duration-300"
      style={{
        width: collapsed ? "64px" : "220px",
        background: "var(--bg-card)",
        borderRight: "1px solid var(--border)",
        boxShadow: "2px 0 12px rgba(14,165,233,0.06)",
      }}
    >
      {/* Logo */}
      <div
        ref={logoRef}
        className="flex items-center gap-3 px-4 py-5"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div
          className="flex-shrink-0 flex items-center justify-center overflow-hidden rounded-xl"
          style={{ width: 36, height: 36, background: "var(--bg-subtle)", border: "1px solid var(--border-strong)", padding: 3 }}
        >
          <img
            src={aquagridLogo}
            alt="AquaGrid"
            className="w-full h-full object-contain"
            style={{ maxWidth: "100%", maxHeight: "100%" }}
          />
        </div>
        {!collapsed && (
          <div>
            <div className="text-sm font-bold tracking-tight" style={{ color: "var(--text-primary)", fontFamily: "'JetBrains Mono', monospace" }}>
              AquaGrid
            </div>
            <div className="text-xs" style={{ color: "var(--text-muted)" }}></div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 flex flex-col gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200"
              style={{
                background: active ? "var(--bg-subtle)" : "transparent",
                border: active ? "1px solid var(--border-strong)" : "1px solid transparent",
                color: active ? "var(--accent-blue)" : "var(--text-secondary)",
              }}
              title={collapsed ? item.label : undefined}
            >
              <div className="relative flex-shrink-0">
                <Icon size={18} />
                {item.id === "alerts" && alertCount > 0 && (
                  <span
                    className="absolute -top-1.5 -right-1.5 flex items-center justify-center text-white rounded-full pulse-glow"
                    style={{
                      width: 14, height: 14,
                      fontSize: 8,
                      fontWeight: 700,
                      background: "#ef4444",
                    }}
                  >
                    {alertCount > 9 ? "9+" : alertCount}
                  </span>
                )}
              </div>
              {!collapsed && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
              {active && (
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-r"
                  style={{ background: "var(--accent-blue)" }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* User / bottom */}
      <div style={{ borderTop: "1px solid var(--border)" }} className="p-3 flex flex-col gap-2">
        <div
          className="flex items-center gap-2 px-2 py-2 rounded-xl"
          title={collapsed ? `${user.name} · ${user.email}` : undefined}
        >
          <div
            className="flex-shrink-0 flex items-center justify-center rounded-full overflow-hidden"
            style={{ width: 28, height: 28, background: "var(--bg-subtle)", border: "1px solid var(--border-strong)", padding: 2 }}
          >
            <img
              src={aquagridLogo}
              alt={user.name}
              className="w-full h-full rounded-full object-contain"
            />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold truncate" style={{ color: "var(--text-primary)" }}>{user.name}</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className="text-[9px] font-mono font-bold uppercase px-1.5 py-px rounded"
                  style={
                    user.role === "admin"
                      ? { background: "var(--warning-surface)", color: "var(--warning-text)", border: "1px solid var(--warning-border)" }
                      : { background: "var(--info-surface)", color: "var(--accent-blue)", border: "1px solid var(--border-strong)" }
                  }
                >
                  {user.role}
                </span>
                <span className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{user.email}</span>
              </div>
            </div>
          )}
        </div>
        {!collapsed && (
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm hover:bg-red-50 hover:text-red-500 transition-colors"
            style={{ color: "var(--text-muted)" }}
          >
            <LogOut size={14} />
            <span className="text-xs">Logout</span>
          </button>
        )}
        {collapsed && (
          <button
            onClick={onLogout}
            title="Logout"
            aria-label="Logout"
            className="flex items-center justify-center px-2 py-2 rounded-xl hover:bg-red-50 transition-colors"
            style={{ color: "var(--text-muted)" }}
          >
            <LogOut size={16} />
          </button>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-16 flex items-center justify-center rounded-full z-10 transition-all hover:scale-110"
        style={{
          width: 24, height: 24,
          background: "var(--bg-card)",
          border: "1px solid var(--border-strong)",
          color: "var(--text-secondary)",
          boxShadow: "0 2px 6px rgba(14,165,233,0.12)",
        }}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  );
}
