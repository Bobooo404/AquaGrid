import {
  getPipelineInstallationStatus,
  type Building,
  type InstallationStatus,
  type PipelineType,
  type Tank,
} from "./mockData"

export type TankKind = "domestic" | "drinking" | "flushing"

export type TankSystemStatus =
  | "normal"
  | "low"
  | "critical"
  | "under-installation"
  | "not-installed"

export type TankPipelineStatus = "online" | "offline" | "under-installation" | "not-installed"

export type TankValveStatus = "open" | "closed" | "stuck" | "unavailable"

export type TankControlMode = "auto" | "manual"

export interface TankPipelineInfo {
  status: TankPipelineStatus
  installationStatus: InstallationStatus
  flowRate: number | null
  lastOpenedAt: Date | null
  lastClosedAt: Date | null
}

export interface TankValveInfo {
  id: string | null
  status: TankValveStatus
  controlMode: TankControlMode | null
  lastOpenedAt: Date | null
  lastClosedAt: Date | null
}

export interface TankThresholdInfo {
  low: number
  critical: number
  max: number
}

export interface TankStatusData {
  id: string
  kind: TankKind
  name: string
  levelPercentage: number | null
  currentVolume: number | null
  capacity: number
  status: TankSystemStatus
  installationStatus: InstallationStatus
  pipeline: TankPipelineInfo
  valve: TankValveInfo
  thresholds: TankThresholdInfo
  lastUpdated: Date
}

export interface TankStatusMeta {
  label: string
  color: string
  surface: string
  border: string
  water: string | null
}

export const TANK_KINDS: TankKind[] = ["domestic", "drinking", "flushing"]

export const TANK_LABELS: Record<TankKind, string> = {
  domestic: "Domestic",
  drinking: "Drinking",
  flushing: "Flushing",
}

export const MAX_TANK_THRESHOLD = 80
const LOW_TANK_THRESHOLD = 20

const PIPELINE_BY_KIND: Record<TankKind, PipelineType> = {
  domestic: "clean",
  drinking: "recycled",
  flushing: "sewage",
}

export const TANK_STATUS_META: Record<TankSystemStatus, TankStatusMeta> = {
  normal: {
    label: "Normal",
    color: "var(--success-text)",
    surface: "var(--success-surface)",
    border: "var(--success-border)",
    water: "#0ea5e9",
  },
  low: {
    label: "Low",
    color: "var(--warning-text)",
    surface: "var(--warning-surface)",
    border: "var(--warning-border)",
    water: "#0ea5e9",
  },
  critical: {
    label: "Critical",
    color: "var(--danger-text)",
    surface: "var(--danger-surface)",
    border: "var(--danger-border)",
    water: "#0ea5e9",
  },
  "under-installation": {
    label: "Under Installation",
    color: "var(--warning-text)",
    surface: "var(--warning-surface)",
    border: "var(--warning-border)",
    water: null,
  },
  "not-installed": {
    label: "Not Installed",
    color: "var(--text-muted)",
    surface: "var(--bg-subtle)",
    border: "var(--border-strong)",
    water: null,
  },
}

export const PIPELINE_STATUS_META: Record<TankPipelineStatus, { label: string; color: string }> = {
  online: { label: "Online", color: "var(--accent-cyan)" },
  offline: { label: "Offline", color: "var(--text-muted)" },
  "under-installation": { label: "Under Installation", color: "var(--warning-text)" },
  "not-installed": { label: "Not Installed", color: "var(--text-muted)" },
}

export const INSTALLATION_META: Record<InstallationStatus, { label: string; color: string }> = {
  installed: { label: "Installed", color: "var(--success-text)" },
  "under-installation": { label: "Under Installation", color: "var(--warning-text)" },
  "not-installed": { label: "Not Installed", color: "var(--text-muted)" },
}

export const VALVE_STATUS_META: Record<TankValveStatus, { label: string; color: string }> = {
  open: { label: "Open", color: "var(--success-text)" },
  closed: { label: "Closed", color: "var(--text-secondary)" },
  stuck: { label: "Stuck", color: "var(--danger-text)" },
  unavailable: { label: "N/A", color: "var(--text-muted)" },
}

const pad = (value: number) => String(value).padStart(2, "0")

export const formatTimestamp = (date: Date): string =>
  `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(
    date.getMinutes(),
  )}:${pad(date.getSeconds())}`

export function resolveTankStatus(
  tank: Pick<Tank, "currentLevel" | "lowThreshold" | "criticalThreshold"> & {
    installationStatus?: InstallationStatus
  },
): TankSystemStatus {
  if (tank.installationStatus === "under-installation") return "under-installation"
  if (tank.installationStatus === "not-installed") return "not-installed"
  if (tank.currentLevel <= tank.criticalThreshold) return "critical"
  if (tank.currentLevel <= tank.lowThreshold) return "low"
  return "normal"
}

const findTank = (building: Building, kind: TankKind): Tank | null =>
  building.tanks.find((tank) => tank.name.trim().toLowerCase() === kind) ?? null

const findValve = (building: Building, kind: TankKind, pipelineType: PipelineType) => {
  const named = building.valves.find(
    (valve) => valve.name.replace(/\s+valve$/i, "").trim().toLowerCase() === kind,
  )
  if (named) return named
  const shared = building.valves.filter((valve) => valve.pipelineType === pipelineType)
  return shared.length === 1 ? shared[0] : null
}

export function getTankStatusData(building: Building, kind: TankKind): TankStatusData {
  const tank = findTank(building, kind)
  const installationStatus: InstallationStatus = tank
    ? tank.installationStatus ?? "installed"
    : "not-installed"
  const installed = installationStatus === "installed"

  const pipelineType = PIPELINE_BY_KIND[kind]
  const pipeline = building.pipelines.find((item) => item.type === pipelineType) ?? null
  const pipelineInstallation: InstallationStatus = pipeline
    ? getPipelineInstallationStatus(building, pipelineType)
    : "not-installed"

  const valve = findValve(building, kind, pipelineType)
  const matchingPipelineValves = building.valves.filter((item) => item.pipelineType === pipelineType)
  const latestTimestamp = (dates: (Date | undefined)[]) =>
    dates.reduce<Date | null>(
      (latest, date) => (date && (!latest || date > latest) ? date : latest),
      null,
    )
  const openedAt = (item: Building["valves"][number]) =>
    item.lastOpenedAt ??
    (item.status === "open" ? item.lastUpdated : undefined)
  const closedAt = (item: Building["valves"][number]) =>
    item.lastClosedAt ??
    (item.status === "closed" ? item.lastUpdated : undefined)
  const pipelineValves =
    matchingPipelineValves.length > 0
      ? matchingPipelineValves
      : valve
        ? [valve]
        : []

  const pipelineStatus: TankPipelineStatus =
    pipelineInstallation !== "installed"
      ? pipelineInstallation
      : pipeline && pipeline.isActive && valve?.status === "open"
        ? "online"
        : "offline"

  const flowRate =
    pipeline && pipelineInstallation === "installed"
      ? pipelineStatus === "online"
        ? pipeline.flowRate
        : 0
      : null

  const status: TankSystemStatus = tank
    ? resolveTankStatus({ ...tank, installationStatus })
    : "not-installed"

  const levelPercentage = installed && tank ? tank.currentLevel : null
  const currentVolume =
    levelPercentage !== null && tank
      ? Math.round((levelPercentage / 100) * tank.capacity)
      : null

  return {
    id: tank?.id ?? `${building.id}-${kind}`,
    kind,
    name: tank?.name ?? TANK_LABELS[kind],
    levelPercentage,
    currentVolume,
    capacity: tank?.capacity ?? 0,
    status,
    installationStatus,
    pipeline: {
      status: pipelineStatus,
      installationStatus: pipelineInstallation,
      flowRate,
      lastOpenedAt:
        pipelineInstallation === "installed" ? latestTimestamp(pipelineValves.map(openedAt)) : null,
      lastClosedAt:
        pipelineInstallation === "installed" ? latestTimestamp(pipelineValves.map(closedAt)) : null,
    },
    valve: {
      id: valve?.id ?? null,
      status: valve?.status ?? "unavailable",
      controlMode: valve ? (valve.manualOverride ? "manual" : "auto") : null,
      lastOpenedAt: valve && installed ? openedAt(valve) ?? null : null,
      lastClosedAt: valve && installed ? closedAt(valve) ?? null : null,
    },
    thresholds: {
      low: LOW_TANK_THRESHOLD,
      critical: tank?.criticalThreshold ?? 0,
      max: MAX_TANK_THRESHOLD,
    },
    lastUpdated: building.lastUpdated,
  }
}

export const getTankStatusRows = (building: Building): TankStatusData[] =>
  TANK_KINDS.map((kind) => getTankStatusData(building, kind))
