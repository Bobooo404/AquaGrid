import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { getBuildingStatus, getMonitoredBuildings, initialBuildings, generateAlerts, generateLogs } from "../data/mockData";
import type { Building, BuildingStatus, Alert, LogEntry, Tank, TankThresholdUpdate } from "../data/mockData";

function clamp(val: number, min: number, max: number) {
  return Math.min(max, Math.max(min, val));
}

function autoControl(building: Building): Building {
  const overhead = building.tanks.find((t) => t.type === "overhead");
  const ground = building.tanks.find((t) => t.type === "ground");
  if (!overhead || !ground) return building;

  const updated = { ...building };

  // Auto-start pump if overhead is low and ground has water
  const pumpToRun = building.pumps.find((pump) => !pump.manualOverride && pump.status === "running")
    ?? building.pumps.find((pump) => !pump.manualOverride && pump.status !== "fault");
  updated.pumps = building.pumps.map((pump) => {
    if (pump.manualOverride || pump.status === "fault") return pump;
    if (overhead.currentLevel < overhead.lowThreshold && ground.currentLevel > 10) {
      return { ...pump, status: pump.id === pumpToRun?.id ? "running" as const : "idle" as const };
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
      if (overhead.currentLevel < 40 && valve.status !== "open") {
        const changedAt = new Date();
        return { ...valve, status: "open" as const, lastUpdated: changedAt, lastOpenedAt: changedAt };
      }
      if (overhead.currentLevel > 90 && valve.status !== "closed") {
        const changedAt = new Date();
        return { ...valve, status: "closed" as const, lastUpdated: changedAt, lastClosedAt: changedAt };
      }
    }
    return valve;
  });

  return updated;
}

const emptyBuildings: Building[] = [];

export function useSimulation(selectedSite: string | null) {
  const [buildings, setBuildings] = useState<Building[]>(initialBuildings);
  const [alerts, setAlerts] = useState<Alert[]>(() => generateAlerts(initialBuildings));
  const [buildingStatusAlerts, setBuildingStatusAlerts] = useState<Alert[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [toasts, setToasts] = useState<{ id: string; message: string; type: "success" | "warning" | "error" }[]>([]);
  const [wsConnected, setWsConnected] = useState(false);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
  const monitoredBuildings = useMemo(
    () => (selectedSite ? getMonitoredBuildings(buildings) : emptyBuildings),
    [buildings, selectedSite],
  );
  const previousBuildingStatuses = useRef(new Map<string, BuildingStatus>());

  useEffect(() => {
    // Simulate WebSocket connection
    const connectTimeout = setTimeout(() => setWsConnected(true), 1500);
    return () => clearTimeout(connectTimeout);
  }, []);

  useEffect(() => {
    setLogs(generateLogs(initialBuildings));
  }, []);

  useEffect(() => {
    if (monitoredBuildings.length === 0) {
      setBuildingStatusAlerts([]);
      return;
    }

    const currentStatuses = new Map<string, BuildingStatus>();
    const statusLogs: LogEntry[] = [];
    monitoredBuildings.forEach((building) => {
      const status = getBuildingStatus(building);
      const previousStatus = previousBuildingStatuses.current.get(building.id);
      currentStatuses.set(building.id, status);

      if (previousStatus !== status) {
        statusLogs.push({
          id: `log-${building.id}-status-${Date.now()}-${status}`,
          buildingId: building.id,
          buildingName: building.name,
          type: "system",
          event: previousStatus
            ? `Building status changed to ${status.toUpperCase()}`
            : `Building status reported: ${status.toUpperCase()}`,
          details: previousStatus
            ? `Status changed from ${previousStatus.toUpperCase()} to ${status.toUpperCase()}`
            : `Current building status is ${status.toUpperCase()}`,
          timestamp: new Date(),
        });
      }
    });

    previousBuildingStatuses.current = currentStatuses;
    if (statusLogs.length > 0) {
      setLogs((previous) => [...statusLogs, ...previous].slice(0, 100));
    }

    setBuildingStatusAlerts((previousAlerts) =>
      monitoredBuildings.flatMap((building) => {
        const status = currentStatuses.get(building.id);
        if (!status || status === "normal") return [];

        const existingAlert = previousAlerts.find((alert) => alert.buildingId === building.id);
        const sameStatus = existingAlert?.type === `Building Status · ${status.toUpperCase()}`;
        return [{
          id: `building-status-${building.id}`,
          buildingId: building.id,
          buildingName: building.name,
          severity: status === "critical" ? "critical" : "warning",
          type: `Building Status · ${status.toUpperCase()}`,
          message: `${building.name} requires attention: building status is ${status}.`,
          timestamp: sameStatus && existingAlert ? existingAlert.timestamp : new Date(),
          acknowledged: sameStatus && existingAlert ? existingAlert.acknowledged : false,
        }];
      }),
    );
  }, [monitoredBuildings]);

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
              currentLevel:
                tank.name.toLowerCase() === "flushing"
                  ? tank.currentLevel
                  : clamp(tank.currentLevel + delta, 0, 100),
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

  useEffect(() => {
    let phase = 2;
    const interval = setInterval(() => {
      phase = (phase + 1) % 3;
      setBuildings((previous) =>
        previous.map((building) => ({
          ...building,
          tanks: building.tanks.map((tank) => {
            if (tank.name.toLowerCase() !== "flushing") return tank;
            const currentLevel =
              phase === 0 ? tank.criticalThreshold : phase === 1 ? tank.lowThreshold : 100;
            return { ...tank, currentLevel };
          }),
        })),
      );
    }, 10000);

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
    setBuildingStatusAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a)));
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

  const toggleValve = useCallback((buildingId: string, valveId: string, status: "open" | "closed") => {
    const changedAt = new Date();
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
                      status,
                      lastUpdated: changedAt,
                      ...(status === "open"
                        ? { lastOpenedAt: changedAt }
                        : { lastClosedAt: changedAt }),
                    }
              ),
            }
      )
    );
    // addToast("Valve override applied", "success");
  }, [addToast]);

  const updateThresholds = useCallback((buildingId: string, updates: TankThresholdUpdate[]) => {
    setBuildings((prev) =>
      prev.map((building) => {
        if (building.id !== buildingId) return building;
        return {
          ...building,
          tanks: building.tanks.map((tank) => {
            const update = updates.find((item) => item.tankId === tank.id);
            return update
              ? { ...tank, lowThreshold: update.low, criticalThreshold: update.critical }
              : tank;
          }),
        };
      }),
    );
  }, []);

  return {
    buildings,
    alerts: [...alerts, ...buildingStatusAlerts],
    logs,
    toasts,
    wsConnected,
    selectedBuildingId,
    setSelectedBuildingId,
    dismissToast,
    acknowledgeAlert,
    togglePump,
    toggleValve,
    updateThresholds,
    addToast,
  };
}
