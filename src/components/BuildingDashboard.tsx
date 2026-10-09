import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { Building } from "../data/mockData";
import TankGrid from "./TankGrid";

interface BuildingDashboardProps {
  buildings: Building[];
  title?: string;
}

export default function BuildingDashboard({ buildings, title = "Water Tank Monitoring" }: BuildingDashboardProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const activeId =
    selectedId && buildings.some((building) => building.id === selectedId)
      ? selectedId
      : buildings[0]?.id;
  const selected = activeId ? buildings.find((building) => building.id === activeId) : undefined;

  if (!selected) return null;

  return (
    <section
      className="flex flex-col gap-4 rounded-2xl p-5"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        boxShadow: "0 1px 8px var(--surface-shadow-soft)",
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2
            className="text-xs font-mono font-semibold uppercase tracking-widest"
            style={{ color: "var(--text-muted)" }}
          >
            {title}
          </h2>
          <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
            Domestic · Drinking · Flushing tanks for the selected building
          </p>
        </div>

        <div className="relative">
          <select
            value={selected.id}
            onChange={(event) => setSelectedId(event.target.value)}
            aria-label="Select building"
            className="cursor-pointer appearance-none rounded-xl py-2 pl-3 pr-9 text-xs font-mono font-bold uppercase tracking-wider outline-none transition-colors"
            style={{
              background: "var(--bg-subtle)",
              border: "1px solid var(--border-strong)",
              color: "var(--text-primary)",
            }}
          >
            {buildings.map((building) => (
              <option key={building.id} value={building.id} style={{ background: "var(--bg-card)", color: "var(--text-primary)" }}>
                {building.name}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--accent-cyan)" }}
          />
        </div>
      </div>

      <TankGrid key={selected.id} building={selected} className="alert-enter" />
    </section>
  );
}
