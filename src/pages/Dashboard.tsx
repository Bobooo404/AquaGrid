import { useEffect, useMemo, useRef, useState } from "react";
import { animate, stagger } from "animejs";
import {
  Building2,
  AlertTriangle,
  Droplet,
  ArrowRight,
  ChevronDown,
  RotateCw,
  Circle,
} from "lucide-react";
import type { Building, Alert } from "../data/mockData";
import TankVisual from "../components/TankVisual";

interface DashboardProps {
  buildings: Building[];
  alerts: Alert[];
  selectedSite: string | null;
  onSelectBuilding: (id: string) => void;
}

type DisplayBuilding = Building & { sourceBuildingId: string };

const majesticBuildingNames = Array.from(
  { length: 10 },
  (_, index) => `Building ${String.fromCharCode(65 + index)}`,
);

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
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "0 2px 10px rgba(14,165,233,0.07)", opacity: 0 }}
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
    sewage:   { stroke: "#8b5cf6", label: "SW" },
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
  const hasFault  = building.pumps.some((p) => p.status === "fault") || building.valves.some((v) => v.status === "stuck");
  const isCritical = building.tanks.some((t) => t.currentLevel <= t.criticalThreshold);
  const isWarning  = building.tanks.some((t) => t.currentLevel <= t.lowThreshold);

  return (
    <div
      onClick={onSelect}
      className="rounded-2xl p-5 cursor-pointer group transition-all duration-200 hover:shadow-lg"
      style={{
        background: "var(--bg-card)",
        border: hasFault || isCritical
          ? "1px solid var(--danger-border)"
          : isWarning
          ? "1px solid var(--warning-border)"
          : "1px solid var(--border-strong)",
        boxShadow: hasFault || isCritical
          ? "0 2px 12px rgba(239,68,68,0.08)"
          : "0 2px 10px rgba(14,165,233,0.06)",
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{building.name}</h3>
            {(hasFault || isCritical) && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-xs font-mono" style={{ background: "var(--danger-surface)", color: "var(--danger-text)", border: "1px solid var(--danger-border)" }}>
                <AlertTriangle size={10} /> ALERT
              </span>
            )}
          </div>
          <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{building.location} · {building.floors}F</div>
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
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            {building.pumps.map((pump) => (
              <div key={pump.id} className="flex items-center gap-1">
                <RotateCw
                  size={12}
                  className={pump.status === "running" ? "pump-running" : ""}
                  style={{ color: pump.status === "fault" ? "#ef4444" : pump.status === "running" ? "var(--accent-cyan)" : "var(--border-strong)" }}
                />
                <span
                  className="text-xs font-mono px-1.5 py-0.5 rounded-lg"
                  style={{
                    background: pump.status === "running" ? "var(--bg-subtle)" : pump.status === "fault" ? "var(--danger-surface)" : "var(--bg-neutral)",
                    color:      pump.status === "running" ? "var(--accent-cyan)" : pump.status === "fault" ? "#ef4444" : "#94a3b8",
                    border:     `1px solid ${pump.status === "running" ? "var(--border-strong)" : pump.status === "fault" ? "var(--danger-border)" : "var(--border-neutral)"}`,
                    fontSize: 10,
                  }}
                >
                  {pump.status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {building.valves.slice(0, 3).map((valve) => (
              <div key={valve.id} className="flex items-center gap-1">
                <Circle
                  size={8}
                  style={{
                    color: valve.status === "open" ? "#10b981" : valve.status === "stuck" ? "#ef4444" : "var(--border-strong)",
                    fill:  valve.status === "open" ? "#10b981" : valve.status === "stuck" ? "#ef4444" : "var(--border-strong)",
                  }}
                />
                <span className="text-xs font-mono" style={{ color: "var(--text-muted)", fontSize: 10 }}>
                  {valve.status === "stuck" ? "STUCK" : valve.status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
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
  const [buildingFilter, setBuildingFilter] = useState("all");
  const [buildingFilterOpen, setBuildingFilterOpen] = useState(false);

  const majesticBuildings = useMemo<DisplayBuilding[]>(
    () =>
      majesticBuildingNames.map((name, index) => {
        const source = buildings[index % buildings.length];
        return {
          ...source,
          id: `maj-${name.slice(-1).toLowerCase()}`,
          name,
          location: "Majestique Towers",
          sourceBuildingId: source.id,
        };
      }),
    [buildings],
  );

  const availableBuildings = useMemo<DisplayBuilding[]>(
    () =>
      selectedSite === "Majestique Towers, Kharadi"
        ? majesticBuildings
        : buildings.map((building) => ({ ...building, sourceBuildingId: building.id })),
    [buildings, majesticBuildings, selectedSite],
  );

  const visibleBuildings = useMemo(() => {
    if (buildingFilter === "all") return availableBuildings;

    const selected = availableBuildings.find((building) => building.id === buildingFilter);
    if (!selected) return availableBuildings;

    if (selectedSite === "Majestique Towers, Kharadi" && selected.name === "Building D") {
      return ["D1", "D2"].map((suffix) => ({
        ...selected,
        id: `maj-${suffix.toLowerCase()}`,
        name: `${suffix} Status`,
      }));
    }

    return [selected];
  }, [availableBuildings, buildingFilter, selectedSite]);

  const activePumps = visibleBuildings.reduce((acc, b) => acc + b.pumps.filter((p) => p.status === "running").length, 0);
  const tanksBelowThreshold = visibleBuildings.reduce((acc, b) => acc + b.tanks.filter((t) => t.currentLevel <= t.lowThreshold).length, 0);
  const unreadAlerts = alerts.filter((a) => !a.acknowledged).length;

  useEffect(() => {
    setBuildingFilter("all");
    setBuildingFilterOpen(false);
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
  }, [buildingFilter, selectedSite]);

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
      <div>
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="text-xs font-semibold uppercase tracking-widest font-mono" style={{ color: "var(--text-muted)" }}>Building Status</h2>
          <div className="relative">
            <button
              onClick={() => setBuildingFilterOpen((open) => !open)}
              className="flex items-center justify-between gap-3 px-3 py-1.5 rounded-xl text-sm transition-colors hover:bg-blue-50"
              style={{
                minWidth: 150,
                background: "var(--bg-card)",
                border: "1px solid var(--border-strong)",
                color: "var(--text-primary)",
              }}
            >
              <span>{buildingFilter === "all"
                ? "All Buildings"
                : availableBuildings.find((building) => building.id === buildingFilter)?.name}
              </span>
              <ChevronDown size={14} style={{ color: "var(--text-muted)" }} />
            </button>
            {buildingFilterOpen && (
              <div
                className="absolute right-0 top-full mt-1 rounded-xl overflow-hidden z-40 max-h-64 overflow-y-auto"
                style={{
                  minWidth: 170,
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  boxShadow: "0 8px 24px rgba(14,165,233,0.12)",
                }}
              >
                <button
                  onClick={() => { setBuildingFilter("all"); setBuildingFilterOpen(false); }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 transition-colors"
                  style={{ color: buildingFilter === "all" ? "var(--accent-blue)" : "var(--text-primary)" }}
                >
                  All Buildings
                </button>
                {availableBuildings.map((building) => (
                  <button
                    key={building.id}
                    onClick={() => { setBuildingFilter(building.id); setBuildingFilterOpen(false); }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 transition-colors"
                    style={{ color: buildingFilter === building.id ? "var(--accent-blue)" : "var(--text-primary)" }}
                  >
                    {building.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {visibleBuildings.map((b) => (
            <div key={b.id} className="building-card-anim" style={{ opacity: 0 }}>
              <BuildingCard
                building={b}
                onSelect={() => {
                  if (selectedSite === "Majestique Towers, Kharadi" && b.name === "Building D") {
                    setBuildingFilter(b.id);
                    return;
                  }
                  onSelectBuilding(b.sourceBuildingId);
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
