import { useState, useEffect, useCallback } from "react";
import { initialBuildings, generateAlerts, generateLogs } from "../data/mockData";
import type { Building, Alert, LogEntry, Tank } from "../data/mockData";

function clamp(val: number, min: number, max: number) {
  return Math.min(max, Math.max(min, val));
}

function autoControl(building: Building): Building {
  const overhead = building.tanks.find((t) => t.type === "overhead");
  const ground = building.tanks.find((t) => t.type === "ground");
  if (!overhead || !ground) return building;

  const updated = { ...building };

  // Auto-start pump if overhead is low and ground has water
  updated.pumps = building.pumps.map((pump) => {
    if (pump.manualOverride || pump.status === "fault") return pump;
    if (overhead.currentLevel < overhead.lowThreshold && ground.currentLevel > 10) {
      return { ...pump, status: "running" as const };
    }
    if (overhead.currentLevel >= 95) {
      return { ...pump, status: "idle" as const };
    }
    return pump;
  });

  // Auto-open/close valves based on overhead level
  updated.valves = building.valves.map((valve) => {
    if (valve.manualOverride || valve.status === "stuck") return valve;
    if (valve.pipelineType === "clean") {
      if (overhead.currentLevel < 40) return { ...valve, status: "open" as const };
      if (overhead.currentLevel > 90) return { ...valve, status: "closed" as const };
    }
    return valve;
  });

  return updated;
}

export function useSimulation() {
  const [buildings, setBuildings] = useState<Building[]>(initialBuildings);
  const [alerts, setAlerts] = useState<Alert[]>(() => generateAlerts(initialBuildings));
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [toasts, setToasts] = useState<{ id: string; message: string; type: "success" | "warning" | "error" }[]>([]);
  const [wsConnected, setWsConnected] = useState(false);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);

  useEffect(() => {
    // Simulate WebSocket connection
    const connectTimeout = setTimeout(() => setWsConnected(true), 1500);
    return () => clearTimeout(connectTimeout);
  }, []);

  useEffect(() => {
    setLogs(generateLogs(initialBuildings));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setBuildings((prev) => {
        const updated = prev.map((building) => {
          const running = building.pumps.filter((p) => p.status === "running").length;
          const newTanks = building.tanks.map((tank): Tank => {
            let delta = 0;
            if (tank.type === "ground") {
              // Ground tank slowly loses water (usage), gains from supply
              delta = (Math.random() - 0.52) * 1.2;
              if (running > 0) delta -= 0.3 * running; // pump takes water from ground
            } else {
              // Overhead tank gains water from pumps, loses to usage
              delta = running > 0 ? (Math.random() * 0.8 + 0.2) : (Math.random() - 0.7) * 0.6;
            }
            return {
              ...tank,
              currentLevel: clamp(tank.currentLevel + delta, 0, 100),
            };
          });

          const updatedBuilding: Building = {
            ...building,
            tanks: newTanks,
            lastUpdated: new Date(),
          };

          return autoControl(updatedBuilding);
        });

        return updated;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const addToast = useCallback((message: string, type: "success" | "warning" | "error") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const acknowledgeAlert = useCallback((alertId: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a)));
    // addToast("Alert acknowledged", "success");
  }, [addToast]);

  const togglePump = useCallback((buildingId: string, pumpId: string) => {
    setBuildings((prev) =>
      prev.map((b) =>
        b.id !== buildingId
          ? b
          : {
              ...b,
              pumps: b.pumps.map((p) =>
                p.id !== pumpId
                  ? p
                  : {
                      ...p,
                      manualOverride: true,
                      status: p.status === "running" ? "idle" : "running",
                    }
              ),
            }
      )
    );
    // addToast("Pump override applied", "success");
  }, [addToast]);

  const toggleValve = useCallback((buildingId: string, valveId: string) => {
    setBuildings((prev) =>
      prev.map((b) =>
        b.id !== buildingId
          ? b
          : {
              ...b,
              valves: b.valves.map((v) =>
                v.id !== valveId
                  ? v
                  : {
                      ...v,
                      manualOverride: true,
                      status: v.status === "open" ? "closed" : "open",
                    }
              ),
            }
      )
    );
    // addToast("Valve override applied", "success");
  }, [addToast]);

  return {
    buildings,
    alerts,
    logs,
    toasts,
    wsConnected,
    selectedBuildingId,
    setSelectedBuildingId,
    dismissToast,
    acknowledgeAlert,
    togglePump,
    toggleValve,
    addToast,
  };
}
