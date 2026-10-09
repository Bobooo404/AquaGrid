export type PipelineType = "clean" | "recycled" | "sewage"
export type AlertSeverity = "critical" | "warning" | "info"
export type PumpStatus = "running" | "idle" | "fault"
export type ValveStatus = "open" | "closed" | "stuck"
export type InstallationStatus = "installed" | "under-installation" | "not-installed"

export interface Tank {
  id: string
  name: string
  type: "overhead" | "ground"
  capacity: number // liters
  currentLevel: number // 0-100 %
  lowThreshold: number
  criticalThreshold: number
  installationStatus?: InstallationStatus
}

export interface TankThresholdUpdate {
  tankId: string
  low: number
  critical: number
}

export interface Pump {
  id: string
  name: string
  status: PumpStatus
  flowRate: number // L/min
  runtime: number // hours today
  manualOverride: boolean
}

export interface Valve {
  id: string
  name: string
  pipelineType: PipelineType
  status: ValveStatus
  manualOverride: boolean
  lastUpdated?: Date
  lastOpenedAt?: Date
  lastClosedAt?: Date
}

export interface Pipeline {
  id: string
  name: string
  type: PipelineType
  isActive: boolean
  flowRate: number
}

export interface Building {
  id: string
  name: string
  location: string
  floors: number
  tanks: Tank[]
  pumps: Pump[]
  valves: Valve[]
  pipelines: Pipeline[]
  lastUpdated: Date
}

export type BuildingStatus = "critical" | "attention" | "normal"
export type MonitoredBuilding = Building & { sourceBuildingId: string }

export interface Alert {
  id: string
  buildingId: string
  buildingName: string
  severity: AlertSeverity
  type: string
  message: string
  timestamp: Date
  acknowledged: boolean
}

export interface LogEntry {
  id: string
  buildingId: string
  buildingName: string
  type: "system" | "pump" | "valve" | "alert" | "user"
  event: string
  details: string
  timestamp: Date
}

export const getPipelineInstallationStatus = (
  building: Building,
  pipelineType: PipelineType,
): InstallationStatus => {
  const tankNamesByPipeline: Record<PipelineType, string[]> = {
    clean: ["domestic", "drinking"],
    recycled: ["drinking"],
    sewage: ["flushing"],
  }
  const relevantTanks = building.tanks.filter((tank) =>
    tankNamesByPipeline[pipelineType].includes(tank.name.toLowerCase()),
  )
  if (relevantTanks.some((tank) => tank.installationStatus === "under-installation")) {
    return "under-installation"
  }
  if (relevantTanks.some((tank) => tank.installationStatus === "not-installed")) {
    return "not-installed"
  }
  return "installed"
}

export const applyDisplayStatus = (building: Building, name: string): Building => {
  const tanks = building.tanks.map((tank) => {
    if (tank.installationStatus) return tank
    if (name === "Building D1" && ["domestic", "drinking"].includes(tank.name.toLowerCase())) {
      return { ...tank, installationStatus: "under-installation" as const }
    }
    if (name === "Building D2") {
      return { ...tank, installationStatus: "under-installation" as const }
    }
    if (name === "Building F1" || name === "Building F2") {
      return { ...tank, installationStatus: "not-installed" as const }
    }
    return { ...tank, installationStatus: "installed" as const }
  })

  const valves = building.valves.map((valve) => {
    if (valve.manualOverride || valve.status === "stuck") return valve
    if (name === "Building D1") {
      const label = valve.name.replace(/\s+valve$/i, "").toLowerCase()
      if (label === "flushing") {
        return {
          ...valve,
          pipelineType: "sewage" as const,
          status: "open" as const,
        }
      }
      return { ...valve, status: "closed" as const }
    }
    if (name === "Building D2" || name === "Building F1" || name === "Building F2") {
      return { ...valve, status: "closed" as const }
    }
    return valve
  })

  return { ...building, name, tanks, valves }
}

const displayBuildingNames = ["Building D1", "Building D2", "Building F1", "Building F2"]

export const getMonitoredBuildings = (buildings: Building[]): MonitoredBuilding[] =>
  buildings.length === 0
    ? []
    : displayBuildingNames.map((name, index) => {
        const source = buildings[index % buildings.length]
        return {
          ...applyDisplayStatus(source, name),
          id: `disp-${name.toLowerCase()}`,
          sourceBuildingId: source.id,
        }
      })

export const getBuildingStatus = (building: Building): BuildingStatus => {
  const installedTanks = building.tanks.filter(
    (tank) => !tank.installationStatus || tank.installationStatus === "installed",
  );
  if (installedTanks.length === 0) return "normal";

  if (
    building.pumps.some((pump) => pump.status === "fault") ||
    installedTanks.some((tank) => tank.currentLevel <= tank.criticalThreshold)
  ) {
    return "critical";
  }
  if (
    building.valves.some((valve) =>
      valve.status === "stuck" &&
      getPipelineInstallationStatus(building, valve.pipelineType) === "installed",
    ) ||
    installedTanks.some((tank) => tank.currentLevel <= tank.lowThreshold)
  ) {
    return "attention"
  }
  return "normal"
}

const HOUR_MS = 3600000

const seedValveTimestamps = (building: Building): Building => {
  const base = building.lastUpdated.getTime()
  return {
    ...building,
    valves: building.valves.map((valve, index) => {
      const recent = (2 + index * 3) * HOUR_MS
      const older = (7 + index * 4) * HOUR_MS
      const [openedAgo, closedAgo] = valve.status === "closed" ? [older, recent] : [recent, older]
      return {
        ...valve,
        lastOpenedAt: valve.lastOpenedAt ?? new Date(base - openedAgo),
        lastClosedAt: valve.lastClosedAt ?? new Date(base - closedAgo),
      }
    }),
  }
}

const rawBuildings: Building[] = [
  {
    id: "b1",
    name: "Building A",
    location: "North Campus",
    floors: 6,
    tanks: [
      {
        id: "b1-ot",
        name: "Domestic",
        type: "overhead",
        capacity: 1000,
        currentLevel: 26,
        lowThreshold: 30,
        criticalThreshold: 15,
      },
      {
        id: "b1-gt",
        name: "Drinking",
        type: "ground",
        capacity: 1000,
        currentLevel: 85,
        lowThreshold: 25,
        criticalThreshold: 10,
      },
      {
        id: "b1-gt-2",
        name: "Flushing",
        type: "ground",
        capacity: 1000,
        currentLevel: 64,
        lowThreshold: 25,
        criticalThreshold: 10,
      },
    ],
    pumps: [
      {
        id: "b1-p1",
        name: "Main Pump",
        status: "running",
        flowRate: 450,
        runtime: 4.2,
        manualOverride: false,
      },
      {
        id: "b1-p2",
        name: "Booster Pump",
        status: "idle",
        flowRate: 280,
        runtime: 1.1,
        manualOverride: false,
      },
    ],
    valves: [
      {
        id: "b1-v1",
        name: "Domestic Valve",
        pipelineType: "clean",
        status: "open",
        manualOverride: false,
      },
      {
        id: "b1-v2",
        name: "Drinking Valve",
        pipelineType: "clean",
        status: "open",
        manualOverride: false,
      },
      {
        id: "b1-v3",
        name: "Flushing Valve",
        pipelineType: "recycled",
        status: "closed",
        manualOverride: false,
      },
    ],
    pipelines: [
      {
        id: "b1-pl1",
        name: "Clean Water Main",
        type: "clean",
        isActive: true,
        flowRate: 420,
      },
      {
        id: "b1-pl2",
        name: "Recycled Water",
        type: "recycled",
        isActive: false,
        flowRate: 0,
      },
      {
        id: "b1-pl3",
        name: "Flushing Drain",
        type: "sewage",
        isActive: true,
        flowRate: 180,
      },
    ],
    lastUpdated: new Date(),
  },
  {
    id: "b2",
    name: "Building B",
    location: "Business District",
    floors: 18,
    tanks: [
      {
        id: "b2-ot",
        name: "Domestic",
        type: "overhead",
        capacity: 1000,
        currentLevel: 23,
        lowThreshold: 30,
        criticalThreshold: 15,
      },
      {
        id: "b2-gt",
        name: "Drinking",
        type: "ground",
        capacity: 1000,
        currentLevel: 61,
        lowThreshold: 25,
        criticalThreshold: 10,
      },
      {
        id: "b2-gt-2",
        name: "Flushing",
        type: "ground",
        capacity: 1000,
        currentLevel: 76,
        lowThreshold: 25,
        criticalThreshold: 10,
      },
    ],
    pumps: [
      {
        id: "b2-p1",
        name: "Primary Pump",
        status: "running",
        flowRate: 680,
        runtime: 6.8,
        manualOverride: false,
      },
      {
        id: "b2-p2",
        name: "Standby Pump",
        status: "idle",
        flowRate: 680,
        runtime: 0,
        manualOverride: false,
      },
    ],
    valves: [
      {
        id: "b2-v1",
        name: "Domestic Valve",
        pipelineType: "clean",
        status: "open",
        manualOverride: false,
      },
      {
        id: "b2-v2",
        name: "Drinking Valve",
        pipelineType: "recycled",
        status: "open",
        manualOverride: false,
      },
      {
        id: "b2-v3",
        name: "Flushing Valve",
        pipelineType: "clean",
        status: "open",
        manualOverride: false,
      },
    ],
    pipelines: [
      {
        id: "b2-pl1",
        name: "Clean Water Main",
        type: "clean",
        isActive: true,
        flowRate: 660,
      },
      {
        id: "b2-pl2",
        name: "Recycled Water",
        type: "recycled",
        isActive: true,
        flowRate: 220,
      },
      {
        id: "b2-pl3",
        name: "Flushing Drain",
        type: "sewage",
        isActive: true,
        flowRate: 310,
      },
    ],
    lastUpdated: new Date(),
  },
  {
    id: "b3",
    name: "Building C",
    location: "Medical Campus",
    floors: 12,
    tanks: [
      {
        id: "b3-ot",
        name: "Domestic",
        type: "overhead",
        capacity: 1000,
        currentLevel: 91,
        lowThreshold: 40,
        criticalThreshold: 20,
      },
      {
        id: "b3-gt",
        name: "Drinking",
        type: "ground",
        capacity: 1000,
        currentLevel: 78,
        lowThreshold: 30,
        criticalThreshold: 15,
      },
      {
        id: "b3-gt-2",
        name: "Flushing",
        type: "ground",
        capacity: 1000,
        currentLevel: 83,
        lowThreshold: 30,
        criticalThreshold: 15,
      },
    ],
    pumps: [
      {
        id: "b3-p1",
        name: "Primary Pump A",
        status: "running",
        flowRate: 820,
        runtime: 8.5,
        manualOverride: false,
      },
      {
        id: "b3-p2",
        name: "Primary Pump B",
        status: "running",
        flowRate: 820,
        runtime: 8.5,
        manualOverride: false,
      },
      {
        id: "b3-p3",
        name: "Emergency Pump",
        status: "idle",
        flowRate: 1200,
        runtime: 0,
        manualOverride: false,
      },
    ],
    valves: [
      {
        id: "b3-v1",
        name: "Domestic Valve",
        pipelineType: "clean",
        status: "open",
        manualOverride: false,
      },
      {
        id: "b3-v2",
        name: "Drinking Valve",
        pipelineType: "clean",
        status: "open",
        manualOverride: false,
      },
      {
        id: "b3-v3",
        name: "Flushing Valve",
        pipelineType: "recycled",
        status: "closed",
        manualOverride: false,
      },
    ],
    pipelines: [
      {
        id: "b3-pl1",
        name: "Clean Water Main",
        type: "clean",
        isActive: true,
        flowRate: 800,
      },
      {
        id: "b3-pl2",
        name: "Recycled Water",
        type: "recycled",
        isActive: false,
        flowRate: 0,
      },
      {
        id: "b3-pl3",
        name: "Flushing Drain",
        type: "sewage",
        isActive: true,
        flowRate: 420,
      },
    ],
    lastUpdated: new Date(),
  },
  {
    id: "b4",
    name: "Building D",
    location: "Residential Zone",
    floors: 9,
    tanks: [
      {
        id: "b4-ot",
        name: "Domestic",
        type: "overhead",
        capacity: 1000,
        currentLevel: 11,
        lowThreshold: 30,
        criticalThreshold: 15,
      },
      {
        id: "b4-gt",
        name: "Drinking",
        type: "ground",
        capacity: 1000,
        currentLevel: 38,
        lowThreshold: 25,
        criticalThreshold: 10,
      },
      {
        id: "b4-gt-2",
        name: "Flushing",
        type: "ground",
        capacity: 1000,
        currentLevel: 52,
        lowThreshold: 25,
        criticalThreshold: 10,
      },
    ],
    pumps: [
      {
        id: "b4-p1",
        name: "Transfer Pump",
        status: "fault",
        flowRate: 0,
        runtime: 2.1,
        manualOverride: false,
      },
      {
        id: "b4-p2",
        name: "Backup Pump",
        status: "running",
        flowRate: 380,
        runtime: 3.4,
        manualOverride: true,
      },
    ],
    valves: [
      {
        id: "b4-v1",
        name: "Domestic Valve",
        pipelineType: "clean",
        status: "open",
        manualOverride: false,
      },
      {
        id: "b4-v2",
        name: "Drinking Valve",
        pipelineType: "recycled",
        status: "stuck",
        manualOverride: false,
      },
      {
        id: "b4-v3",
        name: "Flushing Valve",
        pipelineType: "clean",
        status: "open",
        manualOverride: false,
      },
    ],
    pipelines: [
      {
        id: "b4-pl1",
        name: "Clean Water Main",
        type: "clean",
        isActive: true,
        flowRate: 350,
      },
      {
        id: "b4-pl2",
        name: "Recycled Water",
        type: "recycled",
        isActive: false,
        flowRate: 0,
      },
      {
        id: "b4-pl3",
        name: "Flushing Drain",
        type: "sewage",
        isActive: true,
        flowRate: 210,
      },
    ],
    lastUpdated: new Date(),
  },
  {
    id: "b5",
    name: "Building E",
    location: "Science Park",
    floors: 4,
    tanks: [
      {
        id: "b5-ot",
        name: "Domestic",
        type: "overhead",
        capacity: 1000,
        currentLevel: 55,
        lowThreshold: 30,
        criticalThreshold: 15,
      },
      {
        id: "b5-gt",
        name: "Drinking",
        type: "ground",
        capacity: 1000,
        currentLevel: 67,
        lowThreshold: 25,
        criticalThreshold: 10,
      },
      {
        id: "b5-gt-2",
        name: "Flushing",
        type: "ground",
        capacity: 1000,
        currentLevel: 73,
        lowThreshold: 25,
        criticalThreshold: 10,
      },
    ],
    pumps: [
      {
        id: "b5-p1",
        name: "Lab Supply Pump",
        status: "idle",
        flowRate: 220,
        runtime: 0.8,
        manualOverride: false,
      },
    ],
    valves: [
      {
        id: "b5-v1",
        name: "Domestic Valve",
        pipelineType: "clean",
        status: "closed",
        manualOverride: false,
      },
      {
        id: "b5-v2",
        name: "Drinking Valve",
        pipelineType: "recycled",
        status: "open",
        manualOverride: false,
      },
      {
        id: "b5-v3",
        name: "Flushing Valve",
        pipelineType: "clean",
        status: "open",
        manualOverride: false,
      },
    ],
    pipelines: [
      {
        id: "b5-pl1",
        name: "Clean Water Main",
        type: "clean",
        isActive: false,
        flowRate: 0,
      },
      {
        id: "b5-pl2",
        name: "Recycled Water",
        type: "recycled",
        isActive: true,
        flowRate: 180,
      },
      {
        id: "b5-pl3",
        name: "Flushing Drain",
        type: "sewage",
        isActive: true,
        flowRate: 90,
      },
    ],
    lastUpdated: new Date(),
  },
]

export const initialBuildings: Building[] = rawBuildings.map(seedValveTimestamps)

const DAY_MS = 86400000
const MAX_ALERTS = 5
const bucketDaysBack = [0, 1, 4, 18] // today, yesterday, last week, last month
const alertTimestampCache = new Map<string, Date>()

const hashId = (id: string): number => {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0
  return Math.abs(h)
}

const dummyTimestamp = (id: string, index: number): Date => {
  const cached = alertTimestampCache.get(id)
  if (cached) return cached
  const now = new Date()
  const startOfToday = new Date(now)
  startOfToday.setHours(0, 0, 0, 0)
  const daysBack = bucketDaysBack[index % bucketDaysBack.length]
  const dayStart = startOfToday.getTime() - daysBack * DAY_MS
  const span = daysBack === 0 ? Math.max(now.getTime() - dayStart, 3600000) : DAY_MS
  const time = Math.min(dayStart + (hashId(id) % span), now.getTime())
  const ts = new Date(time)
  alertTimestampCache.set(id, ts)
  return ts
}

export const generateAlerts = (buildings: Building[]): Alert[] => {
  const alerts: Alert[] = []
  buildings.forEach((b) => {
    b.tanks.forEach((t) => {
      if (t.currentLevel <= t.criticalThreshold) {
        alerts.push({
          id: `alert-${b.id}-${t.id}-crit`,
          buildingId: b.id,
          buildingName: b.name,
          severity: "critical",
          type: "Low Level Critical",
          message: `${t.name} at ${t.currentLevel}% — CRITICAL threshold breached`,
          timestamp: new Date(),
          acknowledged: false,
        })
      } else if (t.currentLevel <= t.lowThreshold) {
        alerts.push({
          id: `alert-${b.id}-${t.id}-low`,
          buildingId: b.id,
          buildingName: b.name,
          severity: "warning",
          type: "Low Level Warning",
          message: `${t.name} at ${t.currentLevel}% — below low threshold`,
          timestamp: new Date(),
          acknowledged: false,
        })
      }
    })
    b.pumps.forEach((p) => {
      if (p.status === "fault") {
        alerts.push({
          id: `alert-${b.id}-${p.id}-fault`,
          buildingId: b.id,
          buildingName: b.name,
          severity: "critical",
          type: "Pump Failure",
          message: `${p.name} has faulted — immediate inspection required`,
          timestamp: new Date(),
          acknowledged: false,
        })
      }
    })
    b.valves.forEach((v) => {
      if (v.status === "stuck") {
        alerts.push({
          id: `alert-${b.id}-${v.id}-stuck`,
          buildingId: b.id,
          buildingName: b.name,
          severity: "warning",
          type: "Valve Stuck",
          message: `${v.name} is stuck — manual intervention needed`,
          timestamp: new Date(),
          acknowledged: false,
        })
      }
    })
  })
  const capped = alerts.slice(0, MAX_ALERTS)
  capped.forEach((a, i) => {
    a.timestamp = dummyTimestamp(a.id, i)
  })
  return capped.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
}

export const generateLogs = (buildings: Building[]): LogEntry[] => {
  const entries: LogEntry[] = []
  const events = [
    {
      type: "pump" as const,
      events: [
        "Pump started",
        "Pump stopped",
        "Pump speed adjusted",
        "Pump maintenance alert",
      ],
    },
    {
      type: "valve" as const,
      events: ["Valve opened", "Valve closed", "Valve position verified"],
    },
    {
      type: "system" as const,
      events: [
        "System health check",
        "Threshold updated",
        "Auto-control triggered",
        "Sensor calibration",
      ],
    },
    {
      type: "alert" as const,
      events: ["Alert acknowledged", "Alert escalated", "Alert cleared"],
    },
  ]
  for (let i = 0; i < 50; i++) {
    const b = buildings[Math.floor(Math.random() * buildings.length)]
    const ev = events[Math.floor(Math.random() * events.length)]
    const event = ev.events[Math.floor(Math.random() * ev.events.length)]
    entries.push({
      id: `log-${i}`,
      buildingId: b.id,
      buildingName: b.name,
      type: ev.type,
      event,
      details: `Automated system action — ${event.toLowerCase()} for building ${b.name}`,
      timestamp: new Date(Date.now() - Math.random() * 86400000 * 7),
    })
  }
  return entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
}
