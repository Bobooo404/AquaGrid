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
  Construction,
} from "lucide-react";
import {
  getBuildingStatus,
  getMonitoredBuildings,
  getPipelineInstallationStatus,
  type Building,
  type Alert,
  type InstallationStatus,
  type MonitoredBuilding,
} from "../data/mockData";
import TankVisual from "../components/TankVisual";

interface DashboardProps {
  buildings: Building[];
  alerts: Alert[];
  selectedSite: string | null;
  onSelectBuilding: (id: string, name: string) => void;
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  bg,
  sub,
  animateValue = true,
}: {
  label: string;
  value: number | string;
  icon: typeof Building2;
  color: string;
  bg: string;
  sub?: string;
  animateValue?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const numRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (ref.current) {
      animate(ref.current, { translateY: [20, 0], opacity: [0, 1], duration: 500, ease: "outQuart" });
    }
  }, []);

  useEffect(() => {
    if (numRef.current && typeof value === "number" && animateValue) {
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
  }, [value, animateValue]);

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
          <span ref={numRef}>
            {typeof value === "number" && animateValue ? 0 : value}
          </span>
        </div>
        {sub && <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{sub}</div>}
      </div>
    </div>
  );
}

function PipelineIndicator({
  type,
  active,
}: {
  type: "clean" | "recycled" | "sewage";
  active: boolean;
}) {
  const colors = {
    clean:    { stroke: "var(--accent-cyan)" },
    recycled: { stroke: "#10b981" },
    sewage:   { stroke: "#8b5cf6" },
  };
  const c = colors[type];
  return (
    <div className="flex items-center gap-1">
      <svg width="16" height="8" className="shrink-0">
        <line
          x1="0" y1="4" x2="16" y2="4"
          stroke={active ? c.stroke : "var(--border-strong)"}
          strokeWidth="2"
          strokeDasharray={active ? "4 3" : "none"}
          className={active ? (type === "sewage" ? "flow-sewage" : type === "recycled" ? "flow-recycled" : "flow-active") : ""}
        />
      </svg>
    </div>
  );
}

function InstallationIndicator({ status }: { status: InstallationStatus }) {
  const isUnderInstallation = status === "under-installation";
  const isNotInstalled = status === "not-installed";
  return (
    <div
      className="flex min-w-0 items-center gap-1 whitespace-nowrap text-[8px] font-mono"
      style={{
        color: isUnderInstallation
          ? "var(--warning-text)"
          : isNotInstalled
            ? "var(--text-muted)"
            : "var(--success-text)",
      }}
    >
      {status !== "installed" && <Construction size={12} className="shrink-0" />}
      <span>{isUnderInstallation ? "UNDER INSTALLATION" : isNotInstalled ? "NOT INSTALLED" : "INSTALLED"}</span>
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
            buildingName={building.name}
            type={tank.type}
            size="md"
            installationStatus={tank.installationStatus}
          />
        ))}
      </div>

      {/* Valve and pipeline status legend */}
      <div className="grid min-w-0 gap-y-1">
        {building.valves.map((valve) => {
          const installationStatus = getPipelineInstallationStatus(building, valve.pipelineType);
          const active =
            installationStatus === "installed" &&
            building.valves.some(
              (item) => item.pipelineType === valve.pipelineType && item.status === "open",
            );
          return (
            <div
              key={valve.id}
              className="grid min-w-0 grid-cols-[12px_minmax(0,1fr)_42px_minmax(0,112px)_24px] items-center gap-x-1"
              style={{ minHeight: 25 }}
            >
              <Circle
                size={8}
                style={{
                  color: valve.status === "open" ? "#10b981" : valve.status === "stuck" ? "#ef4444" : "var(--border-strong)",
                  fill: valve.status === "open" ? "#10b981" : valve.status === "stuck" ? "#ef4444" : "var(--border-strong)",
                }}
              />
              <span className="min-w-0 break-words text-[10px] font-mono leading-tight" style={{ color: "var(--text-primary)" }}>
                {valve.name}
              </span>
              <span
                className="text-[10px] font-mono font-bold"
                style={{
                  color: valve.status === "open" ? "#10b981" : valve.status === "stuck" ? "#ef4444" : "var(--text-secondary)",
                }}
              >
                {valve.status === "stuck" ? "STUCK" : valve.status.toUpperCase()}
              </span>
              <InstallationIndicator status={installationStatus} />
              <PipelineIndicator type={valve.pipelineType} active={active} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function hasInstalledTank(building: Building) {
  return building.tanks.some(
    (tank) => !tank.installationStatus || tank.installationStatus === "installed",
  );
}

function alertIsForInstalledEquipment(alert: Alert, building: MonitoredBuilding) {
  if (alert.buildingId === building.id) {
    return alert.type.startsWith("Building Status") && getBuildingStatus(building) !== "normal";
  }
  if (alert.buildingId !== building.sourceBuildingId) return false;

  const tank = building.tanks.find((item) => alert.id.includes(item.id));
  if (tank) return !tank.installationStatus || tank.installationStatus === "installed";

  const pump = building.pumps.find((item) => alert.id.includes(item.id));
  if (pump) return hasInstalledTank(building);

  const valve = building.valves.find((item) => alert.id.includes(item.id));
  return Boolean(
    valve &&
    hasInstalledTank(building) &&
    getPipelineInstallationStatus(building, valve.pipelineType) === "installed",
  );
}

export default function Dashboard({ buildings, alerts, selectedSite, onSelectBuilding }: DashboardProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");

  const availableBuildings = useMemo<MonitoredBuilding[]>(
    () => (selectedSite ? getMonitoredBuildings(buildings) : []),
    [buildings, selectedSite],
  );

  const visibleBuildings = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return availableBuildings;
    return availableBuildings.filter((b) => b.name.toLowerCase().includes(query));
  }, [availableBuildings, search]);

  const uniqueSourceBuildings = Array.from(
    new Map(availableBuildings.map((building) => [building.sourceBuildingId, building])).values(),
  );
  const activePumps = selectedSite ? 1 : 0;
  const tanksBelowThreshold = uniqueSourceBuildings.reduce(
    (total, building) =>
      total +
      building.tanks.filter(
        (tank) =>
          (!tank.installationStatus || tank.installationStatus === "installed") &&
          tank.currentLevel <= tank.lowThreshold,
      ).length,
    0,
  );
  const unreadAlerts = alerts.filter(
    (alert) =>
      !alert.acknowledged &&
      availableBuildings.some((building) => alertIsForInstalledEquipment(alert, building)),
  ).length;

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
        <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
          Real-time overview · {availableBuildings.length} buildings monitored
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Buildings"    value={visibleBuildings.length} icon={Building2} color="var(--accent-blue)" bg="var(--bg-subtle)" sub="In current view" />
        <StatCard label="Active Pumps" value={activePumps}          icon={RotateCw}     color="var(--accent-cyan)" bg="var(--info-surface)" sub="Running now" animateValue={false} />
        <StatCard label="Low Tanks"    value={tanksBelowThreshold}  icon={Droplet}      color="var(--warning-text)" bg="var(--warning-surface)" sub="Below threshold" />
        <StatCard label="Active Alerts" value={unreadAlerts}        icon={AlertTriangle} color="var(--danger-text)" bg="var(--danger-surface)" sub="Unacknowledged" />
      </div>

      {/* Search bar */}
      {selectedSite && (
        <div className="flex justify-end" style={{ marginTop: "4%" }}>
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
      )}

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
        <h2 className="text-xs font-semibold uppercase tracking-widest font-mono mb-4" style={{ color: "var(--text-muted)" }}>Building Status</h2>
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
