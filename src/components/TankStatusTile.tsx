import { type ReactNode } from "react";
import TankModel from "./TankModel";
import {
  formatTimestamp,
  PIPELINE_STATUS_META,
  TANK_STATUS_META,
  VALVE_STATUS_META,
  type TankKind,
  type TankStatusData,
} from "../data/tankStatus";

interface TankStatusTileProps {
  type: TankKind;
  data: TankStatusData;
  flowEnabled?: boolean;
}

const RENDER_W = 162;

function StatusDot({ color }: { color: string }) {
  return (
    <span
      className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
      style={{ background: color, boxShadow: `0 0 6px ${color}` }}
    />
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div
      className="flex flex-col gap-2 pt-4"
      style={{ borderTop: "1px dashed var(--border)" }}
    >
      <div
        className="text-xs font-mono font-bold uppercase tracking-widest"
        style={{ color: "var(--text-secondary)" }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function Row({
  label,
  value,
  children,
  color,
}: {
  label: string;
  value?: ReactNode;
  children?: ReactNode;
  color?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span
        className="text-[11px] font-mono uppercase tracking-wider"
        style={{ color: "var(--text-secondary)" }}
      >
        {label}
      </span>
      <span
        className="flex items-center gap-1.5 text-right text-[13.65px] font-mono font-semibold"
        style={{ color: color ?? "var(--text-primary)" }}
      >
        {value ?? children}
      </span>
    </div>
  );
}

function ThresholdChip({
  label,
  value,
  color,
  background,
  border,
}: {
  label: string;
  value: string;
  color: string;
  background: string;
  border: string;
}) {
  return (
    <div
      className="flex flex-col items-center gap-1 rounded-lg px-1.5 py-2 text-center"
      style={{ background, border: `1px solid ${border}` }}
    >
      <span
        className="w-full text-center text-[10px] font-mono font-bold uppercase tracking-wider"
        style={{ color }}
      >
        {label}
      </span>
      <span className="w-full text-center text-[13.65px] font-mono font-bold" style={{ color }}>
        {value}
      </span>
    </div>
  );
}

export default function TankStatusTile({ type, data, flowEnabled = false }: TankStatusTileProps) {
  const meta = TANK_STATUS_META[data.status];
  const level = data.levelPercentage;
  const installed = data.installationStatus === "installed" && level !== null;
  const tankAnimationLevel = installed ? (level <= 20 ? 10 : level >= 80 ? 80 : 20) : null;
  const showThresholdValues = data.installationStatus === "installed";
  const waterColor = meta.water ?? "#0ea5e9";

  const pipelineMeta = PIPELINE_STATUS_META[data.pipeline.status];
  const valveMeta = VALVE_STATUS_META[data.valve.status];

  const capacityLabel = data.capacity > 0 ? `${Math.round(data.capacity).toLocaleString()} L` : "—";
  const statusLabel =
    data.status === "under-installation"
      ? "Under Installation"
      : data.status === "not-installed"
        ? "Not Installed"
        : installed
          ? meta.label
          : "Empty";
  const volumeLabel =
    data.currentVolume === null ? statusLabel : `${data.currentVolume.toLocaleString()} L`;
  const flowLabel = data.pipeline.flowRate === null ? "—" : `${data.pipeline.flowRate} L/min`;
  const controlModeLabel = data.valve.controlMode ? data.valve.controlMode.toUpperCase() : "—";

  return (
    <article
      data-tank-type={type}
      className="flex h-full overflow-hidden rounded-2xl"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        boxShadow: "0 1px 8px var(--surface-shadow-soft)",
      }}
    >
      <div
        style={{
          width: 3,
          flexShrink: 0,
          background: `linear-gradient(180deg, ${meta.color}, transparent 85%)`,
        }}
      />

      <div className="grid min-w-0 flex-1 grid-cols-1 gap-5 p-5 md:grid-cols-[200px_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <h3
            className="text-sm font-mono font-bold uppercase tracking-widest"
            style={{ color: "var(--text-primary)" }}
          >
            {data.name} Tank
          </h3>
          {installed && (
            <span
              className="flex shrink-0 items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-wider whitespace-nowrap"
              style={{ background: meta.surface, color: meta.color, border: `1px solid ${meta.border}` }}
            >
              <StatusDot color={meta.color} />
              {meta.label}
            </span>
          )}
        </div>

        <div className="flex justify-center">
          <div className="relative">
            <TankModel
              level={tankAnimationLevel}
              width={RENDER_W}
              waterColor={waterColor}
              thresholds={installed ? data.thresholds : null}
              flowActive={flowEnabled && installed}
              ariaLabel={`${data.name} tank ${
                installed ? `${Math.round(level)} percent full` : meta.label
              }`}
            />

          </div>
        </div>

        <div className="flex flex-col items-center gap-0.5 text-center">
          <div
            className="text-base font-mono font-bold uppercase tracking-widest"
            style={{ color: meta.color }}
          >
            {statusLabel}
          </div>
          <div className="text-[13.65px] font-mono font-medium" style={{ color: "var(--text-primary)" }}>
            {installed ? (
              <>
                {volumeLabel} <span style={{ color: "var(--text-muted)" }}>/</span> {capacityLabel}
              </>
            ) : capacityLabel}
          </div>
        </div>
        </div>

        <div className="grid min-w-0 grid-cols-1 content-start gap-x-6 gap-y-4 sm:grid-cols-2">
        <Section title="Valve">
          <Row
            label="Status"
            color={valveMeta.color}
            value={
              <>
                <StatusDot color={valveMeta.color} />
                {data.valve.status === "unavailable" ? "—" : valveMeta.label}
              </>
            }
          />
          <Row label="Control mode">{controlModeLabel}</Row>
          <Row label="Last open">
            {data.valve.lastOpenedAt ? formatTimestamp(data.valve.lastOpenedAt) : "—"}
          </Row>
          <Row label="Last close">
            {data.valve.lastClosedAt ? formatTimestamp(data.valve.lastClosedAt) : "—"}
          </Row>
        </Section>

        <Section title="Pipeline">
          <Row
            label="Status"
            color={pipelineMeta.color}
            value={
              <>
                <StatusDot color={pipelineMeta.color} />
                {pipelineMeta.label}
              </>
            }
          />
          <Row
            label="Flow"
            color={data.pipeline.flowRate === null ? "var(--text-muted)" : undefined}
          >
            {flowLabel}
          </Row>
          <Row label="Last open">
            {data.pipeline.lastOpenedAt ? formatTimestamp(data.pipeline.lastOpenedAt) : "—"}
          </Row>
          <Row label="Last close">
            {data.pipeline.lastClosedAt ? formatTimestamp(data.pipeline.lastClosedAt) : "—"}
          </Row>
        </Section>

        <Section title="Thresholds">
          <div className="grid grid-cols-4 gap-1.5">
            <ThresholdChip
              label="Level"
              value={showThresholdValues && level !== null ? `${Math.round(level)}%` : "-"}
              color={meta.color}
              background={meta.surface}
              border={meta.border}
            />
            <ThresholdChip
              label="Low"
              value={showThresholdValues ? `${data.thresholds.low}%` : "-"}
              color="var(--warning-text)"
              background="var(--warning-surface)"
              border="var(--warning-border)"
            />
            <ThresholdChip
              label="Critical"
              value={showThresholdValues ? `${data.thresholds.critical}%` : "-"}
              color="var(--danger-text)"
              background="var(--danger-surface)"
              border="var(--danger-border)"
            />
            <ThresholdChip
              label="Max"
              value={showThresholdValues ? `${data.thresholds.max}%` : "-"}
              color="var(--accent-blue)"
              background="var(--info-surface)"
              border="var(--border-strong)"
            />
          </div>
        </Section>
        </div>
      </div>
    </article>
  );
}
