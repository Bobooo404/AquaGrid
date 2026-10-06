import { useEffect, useMemo, useRef, useState } from "react";
import { animate, stagger } from "animejs";
import {
  Building2,
  AlertTriangle,
  Droplet,
  ArrowRight,
  RotateCw,
  Circle,
  Search,
} from "lucide-react";
import type { Building, Alert } from "../data/mockData";
import TankVisual from "../components/TankVisual";

interface DashboardProps {
  buildings: Building[];
  alerts: Alert[];
  selectedSite: string | null;
  onSelectBuilding: (id: string, name: string) => void;
}

type DisplayBuilding = Building & { sourceBuildingId: string };

const displayBuildingNames = ["Building D1", "Building D2", "Building F1", "Building F2"];

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  bg,
  sub,
}: {
  label: string;
  value: number | string;
  icon: typeof Building2;
  color: string;
  bg: string;
  sub?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const numRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (ref.current) {
      animate(ref.current, { translateY: [20, 0], opacity: [0, 1], duration: 500, ease: "outQuart" });
    }
  }, []);

  useEffect(() => {
    if (numRef.current && typeof value === "number") {
      const obj = { val: 0 };
      animate(obj, {
        val: value,
        duration: 800,
        ease: "outQuart",
        onUpdate() {
          if (numRef.current) numRef.current.textContent = String(Math.round(obj.val));
        },
      });
    }
  }, [value]);

  return (
    <div
      ref={ref}
      className="rounded-2xl p-5 flex items-center gap-4"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "0 2px 10px var(--surface-shadow-soft)", opacity: 0 }}
    >
      <div
        className="flex items-center justify-center rounded-xl flex-shrink-0"
        style={{ width: 48, height: 48, background: bg }}
      >
        <Icon size={22} style={{ color }} />
      </div>
      <div>
        <div className="text-xs uppercase tracking-widest font-mono mb-0.5" style={{ color: "var(--text-muted)" }}>{label}</div>
        <div className="text-2xl font-bold font-mono" style={{ color: "var(--text-primary)" }}>
          <span ref={numRef}>{typeof value === "number" ? 0 : value}</span>
        </div>
        {sub && <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{sub}</div>}
      </div>
    </div>
  );
}

function PipelineIndicator({ type, active }: { type: "clean" | "recycled" | "sewage"; active: boolean }) {
  const colors = {
    clean:    { stroke: "var(--accent-cyan)", label: "CW" },
    recycled: { stroke: "#10b981", label: "RW" },
    sewage:   { stroke: "#8b5cf6", label: "FW" },
  };
  const c = colors[type];
  return (
    <div className="flex items-center gap-1">
      <svg width="24" height="8">
        <line
          x1="0" y1="4" x2="24" y2="4"
          stroke={active ? c.stroke : "var(--border-strong)"}
          strokeWidth="2"
          strokeDasharray={active ? "4 3" : "none"}
          className={active ? (type === "sewage" ? "flow-sewage" : type === "recycled" ? "flow-recycled" : "flow-active") : ""}
        />
      </svg>
      <span className="text-xs font-mono" style={{ color: active ? c.stroke : "var(--border-strong)" }}>{c.label}</span>
    </div>
  );
}
function BuildingCard({ building, onSelect }: { building: Building; onSelect: () => void }) {
  const statusTanks = building.tanks.slice(0, 3);

  return (
    <div
      onClick={onSelect}
      className="rounded-2xl p-5 cursor-pointer group transition-all duration-200 hover:shadow-lg"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-strong)",
        boxShadow: "0 2px 10px var(--surface-shadow-soft)",
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{building.name}</h3>
          </div>
      </div>
        <button className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-xs font-medium" style={{ color: "var(--accent-cyan)" }}>
          Detail <ArrowRight size={12} />
        </button>
      </div>

      {/* Tanks */}
      <div className="grid grid-cols-3 gap-3 mb-5 rounded-xl p-3 tank-bank">
        {statusTanks.map((tank) => (
          <TankVisual
            key={tank.id}
            level={tank.currentLevel}
            capacity={tank.capacity}
            name={tank.name}
            type={tank.type}
            size="md"
          />
        ))}
      </div>

      {/* Status row */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1 items-start">
          {building.valves.map((valve) => (
            <div key={valve.id} className="flex items-center gap-1">
              <Circle
                size={8}
                style={{
                  color: valve.status === "open" ? "#10b981" : valve.status === "stuck" ? "#ef4444" : "var(--border-strong)",
                  fill:  valve.status === "open" ? "#10b981" : valve.status === "stuck" ? "#ef4444" : "var(--border-strong)",
                }}
              />
              <span className="text-xs font-mono" style={{ color: "var(--text-muted)", fontSize: 10 }}>
                {valve.name} · {valve.status === "stuck" ? "STUCK" : valve.status.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-1 items-end">
          {building.pipelines.map((pl) => (
            <PipelineIndicator key={pl.id} type={pl.type} active={pl.isActive} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard({ buildings, alerts, selectedSite, onSelectBuilding }: DashboardProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");

  const availableBuildings = useMemo<DisplayBuilding[]>(
    () =>
      selectedSite
        ? displayBuildingNames.map((name, index) => {
            const source = buildings[index % buildings.length];
            return {
              ...source,
              id: `disp-${name.toLowerCase()}`,
              name,
              sourceBuildingId: source.id,
            };
          })
        : [],
    [buildings, selectedSite],
  );

  const visibleBuildings = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return availableBuildings;
    return availableBuildings.filter((b) => b.name.toLowerCase().includes(query));
  }, [availableBuildings, search]);

  const activePumps = visibleBuildings.reduce((acc, b) => acc + b.pumps.filter((p) => p.status === "running").length, 0);
  const tanksBelowThreshold = visibleBuildings.reduce((acc, b) => acc + b.tanks.filter((t) => t.currentLevel <= t.lowThreshold).length, 0);
  const unreadAlerts = alerts.filter((a) => !a.acknowledged).length;

  useEffect(() => {
    setSearch("");
  }, [selectedSite]);

  useEffect(() => {
    if (gridRef.current) {
      animate(gridRef.current.querySelectorAll(".building-card-anim"), {
        translateY: [30, 0],
        opacity: [0, 1],
        delay: stagger(80),
        duration: 500,
        ease: "outQuart",
      });
    }
  }, [selectedSite, search]);

  return (
    <div className="flex flex-col gap-6 p-6 h-full overflow-y-auto" style={{ background: "var(--bg-primary)" }}>
      <div>
        <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>System Dashboard</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>Real-time overview · {visibleBuildings.length} buildings monitored</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Buildings"    value={visibleBuildings.length} icon={Building2} color="var(--accent-blue)" bg="var(--bg-subtle)" sub="All online" />
        <StatCard label="Active Pumps" value={activePumps}          icon={RotateCw}     color="var(--accent-cyan)" bg="var(--info-surface)" sub="Running now" />
        <StatCard label="Low Tanks"    value={tanksBelowThreshold}  icon={Droplet}      color="var(--warning-text)" bg="var(--warning-surface)" sub="Below threshold" />
        <StatCard label="Active Alerts" value={unreadAlerts}        icon={AlertTriangle} color="var(--danger-text)" bg="var(--danger-surface)" sub="Unacknowledged" />
      </div>

      {/* Buildings grid */}
      {!selectedSite ? (
        <div
          className="rounded-2xl p-12 flex flex-col items-center justify-center text-center gap-3"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-strong)" }}
        >
          <Building2 size={32} style={{ color: "var(--text-muted)" }} />
          <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            No site selected
          </div>
          <p className="text-xs max-w-xs" style={{ color: "var(--text-muted)" }}>
            Select a site from the dropdown in the top bar to view its building status.
          </p>
        </div>
      ) : (
      <div>
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="text-xs font-semibold uppercase tracking-widest font-mono" style={{ color: "var(--text-muted)" }}>Building Status</h2>
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)", width: 200 }}
          >
            <Search size={14} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search buildings..."
              className="bg-transparent text-sm outline-none w-full"
              style={{ color: "var(--text-primary)" }}
            />
          </div>
        </div>
        {visibleBuildings.length === 0 ? (
          <div
            className="rounded-2xl p-10 text-center text-sm"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
          >
            No buildings match "{search}"
          </div>
        ) : (
        <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {visibleBuildings.map((b) => (
            <div key={b.id} className="building-card-anim" style={{ opacity: 0 }}>
              <BuildingCard
                building={b}
                onSelect={() => onSelectBuilding(b.sourceBuildingId, b.name)}
              />
            </div>
          ))}
        </div>
        )}
      </div>
      )}
    </div>
  );
}
