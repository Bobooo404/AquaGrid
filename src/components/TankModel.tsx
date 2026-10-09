import { useId } from "react";

interface TankModelProps {
  /** 0-100 fill level; null renders an empty (not-installed) tank */
  level: number | null;
  width?: number;
  waterColor?: string;
  thresholds?: { low: number; critical: number } | null;
  ariaLabel?: string;
  flowActive?: boolean;
}

const VB_W = 168;
const VB_H = 252;

const BODY = "M30 66 A54 14 0 0 0 138 66 L138 200 A54 14 0 0 1 30 200 Z";

const WATER_TOP = 76;
const WATER_TRACK = 136;
const GAUGE_TOP = 88;
const GAUGE_TRACK = 110;
const RING_Y = [96, 152, 190, 206];
const GAUGE_MAJORS = [100, 75, 50, 25, 0];
const GAUGE_MINORS = [87.5, 62.5, 37.5, 12.5];

const EASE = "transform 800ms cubic-bezier(0.65, 0, 0.35, 1)";
const GLOW = "drop-shadow(0 0 2.5px var(--tank-accent-glow))";

const clamp = (value: number) => Math.min(100, Math.max(0, value));
const waterShift = (level: number) => ((100 - clamp(level)) / 100) * WATER_TRACK;
const gaugeShift = (level: number) => ((100 - clamp(level)) / 100) * GAUGE_TRACK;
const gaugeY = (pct: number) => GAUGE_TOP + ((100 - clamp(pct)) / 100) * GAUGE_TRACK;
const waterY = (pct: number) => WATER_TOP + ((100 - clamp(pct)) / 100) * WATER_TRACK;

const bandPath = (y: number, t: number) =>
  `M30 ${y} A54 14 0 0 0 138 ${y} L138 ${y + t} A54 14 0 0 1 30 ${y + t} Z`;

export default function TankModel({
  level,
  width = 72,
  waterColor = "#0ea5e9",
  thresholds = null,
  ariaLabel,
  flowActive = false,
}: TankModelProps) {
  const raw = useId().replace(/:/g, "");
  const id = (name: string) => `t3d-${name}-${raw}`;
  const height = Math.round((width * VB_H) / VB_W);

  const label =
    ariaLabel ??
    (level === null
      ? "Water tank, empty"
      : `Water tank, ${Math.round(clamp(level))} percent full`);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      role="img"
      aria-label={label}
    >
      <defs>
        <clipPath id={id("body")}>
          <path d={BODY} />
        </clipPath>
        <clipPath id={id("strip")}>
          <rect x={36} y={GAUGE_TOP} width={8} height={GAUGE_TRACK} rx={4} />
        </clipPath>

        <linearGradient id={id("wall")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" style={{ stopColor: "var(--tank-body-d)" }} />
          <stop offset="6%" style={{ stopColor: "var(--tank-body-a)" }} />
          <stop offset="28%" style={{ stopColor: "var(--tank-body-b)" }} />
          <stop offset="60%" style={{ stopColor: "var(--tank-body-c)" }} />
          <stop offset="86%" style={{ stopColor: "var(--tank-body-d)" }} />
          <stop offset="97%" style={{ stopColor: "var(--tank-rim)" }} />
          <stop offset="100%" style={{ stopColor: "var(--tank-body-c)" }} />
        </linearGradient>

        <radialGradient id={id("dome")} cx="0.32" cy="0.26" r="0.9">
          <stop offset="0%" style={{ stopColor: "var(--tank-body-a)" }} />
          <stop offset="55%" style={{ stopColor: "var(--tank-body-b)" }} />
          <stop offset="100%" style={{ stopColor: "var(--tank-body-c)" }} />
        </radialGradient>

        <linearGradient id={id("metal")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" style={{ stopColor: "var(--tank-metal-b)" }} />
          <stop offset="18%" style={{ stopColor: "var(--tank-metal-a)" }} />
          <stop offset="45%" style={{ stopColor: "var(--tank-metal-b)" }} />
          <stop offset="78%" style={{ stopColor: "var(--tank-metal-c)" }} />
          <stop offset="100%" style={{ stopColor: "var(--tank-metal-b)" }} />
        </linearGradient>

        <linearGradient id={id("gloss")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#000000" stopOpacity="0.16" />
          <stop offset="8%" stopColor="#ffffff" stopOpacity="0.16" />
          <stop offset="22%" stopColor="#ffffff" stopOpacity="0.3" />
          <stop offset="42%" stopColor="#ffffff" stopOpacity="0.04" />
          <stop offset="64%" stopColor="#000000" stopOpacity="0.06" />
          <stop offset="90%" stopColor="#000000" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.1" />
        </linearGradient>

        <linearGradient id={id("water")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={waterColor} stopOpacity="0.95" />
          <stop offset="100%" stopColor={waterColor} stopOpacity="0.55" />
        </linearGradient>

        <linearGradient id={id("strip")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" style={{ stopColor: "var(--tank-accent)" }} />
          <stop offset="100%" style={{ stopColor: "var(--tank-accent)" }} stopOpacity="0.5" />
        </linearGradient>

        <radialGradient id={id("shadow")} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" style={{ stopColor: "var(--tank-shadow)" }} />
          <stop offset="65%" style={{ stopColor: "var(--tank-shadow)" }} stopOpacity="0.55" />
          <stop offset="100%" style={{ stopColor: "var(--tank-shadow)" }} stopOpacity="0" />
        </radialGradient>

        <radialGradient id={id("backdrop")} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" style={{ stopColor: "var(--tank-backdrop)" }} stopOpacity="0.6" />
          <stop offset="60%" style={{ stopColor: "var(--tank-backdrop)" }} stopOpacity="0.25" />
          <stop offset="100%" style={{ stopColor: "var(--tank-backdrop)" }} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Studio backdrop */}
      <ellipse cx={84} cy={122} rx={76} ry={104} fill={`url(#${id("backdrop")})`} />

      {/* Ground shadow / ambient occlusion */}
      <ellipse cx={84} cy={243} rx={52} ry={6.5} fill={`url(#${id("shadow")})`} />

      {/* Support legs */}
      <g fill={`url(#${id("metal")})`}>
        <path d="M46 202 L57 202 L54 237 L43 237 Z" />
        <path d="M111 202 L122 202 L125 237 L114 237 Z" />
        <rect x={39} y={235} width={20} height={7} rx={3} />
        <rect x={109} y={235} width={20} height={7} rx={3} />
      </g>

      {/* Tank body */}
      <g clipPath={`url(#${id("body")})`}>
        <rect x={26} y={62} width={116} height={164} fill={`url(#${id("wall")})`} />

        {level !== null && (
          <g style={{ transform: `translateY(${waterShift(level)}px)`, transition: EASE }}>
            <rect
              x={26}
              y={WATER_TOP}
              width={116}
              height={WATER_TRACK + 30}
              fill={`url(#${id("water")})`}
            />
            <ellipse cx={84} cy={WATER_TOP} rx={54} ry={12} fill={waterColor} />
            <ellipse
              className="tank-shimmer"
              cx={84}
              cy={WATER_TOP}
              rx={36}
              ry={5}
              fill="#ffffff"
              opacity={0.35}
            />
          </g>
        )}

        {level !== null && thresholds && (
          <g>
            <line
              x1={34}
              y1={waterY(thresholds.low)}
              x2={134}
              y2={waterY(thresholds.low)}
              stroke="#f59e0b"
              strokeWidth={1.2}
              strokeDasharray="5 4"
              opacity={0.85}
            />
            <line
              x1={34}
              y1={waterY(thresholds.critical)}
              x2={134}
              y2={waterY(thresholds.critical)}
              stroke="#ef4444"
              strokeWidth={1.2}
              strokeDasharray="5 4"
              opacity={0.85}
            />
          </g>
        )}

        {/* Reinforcement rings */}
        <g>
          {RING_Y.map((y) => (
            <path
              key={y}
              d={bandPath(y, 5)}
              fill={`url(#${id("metal")})`}
              stroke="var(--tank-edge)"
              strokeWidth={0.5}
              strokeOpacity={0.4}
            />
          ))}
        </g>

        {/* Cylindrical depth / studio gloss */}
        <path d={BODY} fill={`url(#${id("gloss")})`} />

        {/* Glowing level indicator strip */}
        <g>
          <rect
            x={36}
            y={GAUGE_TOP}
            width={8}
            height={GAUGE_TRACK}
            rx={4}
            fill="var(--tank-track)"
            stroke="var(--tank-edge)"
            strokeWidth={0.7}
            strokeOpacity={0.55}
          />
          {level !== null && (
            <g clipPath={`url(#${id("strip")})`}>
              <g style={{ transform: `translateY(${gaugeShift(level)}px)`, transition: EASE }}>
                <rect
                  x={36}
                  y={GAUGE_TOP}
                  width={8}
                  height={GAUGE_TRACK}
                  fill={`url(#${id("strip")})`}
                  style={{ filter: GLOW }}
                />
              </g>
            </g>
          )}
          <circle
            cx={40}
            cy={83}
            r={2.2}
            className="tank-led"
            fill="var(--tank-accent)"
            style={{ filter: GLOW }}
          />
          <circle cx={40} cy={203} r={2.2} fill="var(--tank-accent)" opacity={0.4} />
        </g>

        {/* Holographic measurement markings */}
        <g stroke="var(--tank-accent)">
          <line x1={134} y1={GAUGE_TOP} x2={134} y2={GAUGE_TOP + GAUGE_TRACK} strokeWidth={1} opacity={0.3} />
          {GAUGE_MAJORS.map((v) => (
            <line
              key={`maj-${v}`}
              x1={124}
              y1={gaugeY(v)}
              x2={134}
              y2={gaugeY(v)}
              strokeWidth={1.3}
              opacity={0.7}
            />
          ))}
          {GAUGE_MINORS.map((v) => (
            <line
              key={`min-${v}`}
              x1={129}
              y1={gaugeY(v)}
              x2={134}
              y2={gaugeY(v)}
              strokeWidth={1}
              opacity={0.35}
            />
          ))}
        </g>
        {level !== null && (
          <g
            style={{ transform: `translateY(${gaugeShift(level)}px)`, transition: EASE }}
          >
            <path
              d={`M121 ${GAUGE_TOP} L113 ${GAUGE_TOP - 4.5} L113 ${GAUGE_TOP + 4.5} Z`}
              fill="var(--tank-accent)"
              style={{ filter: GLOW }}
            />
          </g>
        )}

        {/* Futuristic status panel */}
        <g>
          <rect
            x={62}
            y={158}
            width={44}
            height={22}
            rx={6}
            fill={`url(#${id("metal")})`}
            stroke="var(--tank-edge)"
            strokeWidth={0.7}
            strokeOpacity={0.6}
          />
          <rect
            x={67}
            y={163}
            width={20}
            height={12}
            rx={4}
            fill="var(--tank-void)"
            stroke="var(--tank-accent)"
            strokeWidth={0.8}
            strokeOpacity={0.5}
          />
          <rect x={67} y={163} width={20} height={12} rx={4} fill="var(--tank-accent)" opacity={0.12} />
          <rect x={90} y={164} width={11} height={1.4} rx={0.7} fill="var(--tank-edge)" opacity={0.4} />
          <rect x={90} y={167} width={7} height={1.4} rx={0.7} fill="var(--tank-edge)" opacity={0.3} />
          <circle
            cx={94}
            cy={172}
            r={2}
            className="tank-led"
            fill="var(--tank-accent)"
            style={{ filter: GLOW }}
          />
          <circle cx={101} cy={172} r={2} fill="var(--tank-edge)" opacity={0.55} />
        </g>
      </g>

      {/* Top rim band */}
      <path
        d={bandPath(66, 7)}
        fill={`url(#${id("metal")})`}
        stroke="var(--tank-edge)"
        strokeWidth={0.7}
        strokeOpacity={0.6}
      />

      {/* Shell outline + rim lighting */}
      <path
        d={BODY}
        fill="none"
        stroke="var(--tank-edge)"
        strokeWidth={1.6}
        strokeLinejoin="round"
        opacity={0.9}
      />
      <path d="M30 66 L30 200" stroke="var(--tank-rim)" strokeWidth={1.2} opacity={0.5} />
      <path d="M138 66 L138 200" stroke="var(--tank-rim)" strokeWidth={1.2} opacity={0.55} />

      {/* Domed top */}
      <path
        d="M30 66 A54 26 0 0 1 138 66 Z"
        fill={`url(#${id("dome")})`}
        stroke="var(--tank-edge)"
        strokeWidth={1.4}
        strokeLinejoin="round"
      />

      {/* Central access hatch with status ring */}
      <g>
        <ellipse
          cx={84}
          cy={45}
          rx={15}
          ry={5}
          fill={`url(#${id("metal")})`}
          stroke="var(--tank-edge)"
          strokeWidth={0.8}
        />
        <ellipse cx={84} cy={45.5} rx={11} ry={3.4} fill="var(--tank-void)" />
        <ellipse
          cx={84}
          cy={45.5}
          rx={11}
          ry={3.4}
          fill="none"
          stroke="var(--tank-accent)"
          strokeWidth={1.1}
          className="pulse-glow"
          style={{ filter: GLOW }}
        />
        <rect x={79.5} y={41.8} width={9} height={2} rx={1} fill="var(--tank-metal-b)" />
      </g>

      {/* Inlet pipe + valve + flow */}
      <g>
        <path
          d="M46 18 L46 47"
          stroke={`url(#${id("metal")})`}
          strokeWidth={7}
          strokeLinecap="round"
          fill="none"
        />
        {flowActive && (
          <path
            d="M46 20 L46 44"
            className="flow-active"
            stroke="var(--tank-accent)"
            strokeWidth={2.2}
            fill="none"
            opacity={0.85}
            style={{ filter: GLOW }}
          />
        )}
        <rect x={37} y={11} width={18} height={5} rx={1.5} fill={`url(#${id("metal")})`} stroke="var(--tank-edge)" strokeWidth={0.6} />
        <rect x={40} y={7} width={12} height={4} rx={1.5} fill={`url(#${id("metal")})`} />
        <rect x={39.5} y={26} width={13} height={11} rx={3} fill={`url(#${id("metal")})`} stroke="var(--tank-edge)" strokeWidth={0.6} />
        <circle cx={46} cy={24} r={4.5} fill="none" stroke="var(--tank-metal-b)" strokeWidth={1.6} />
        <path d="M42 24 h8 M46 20 v8" stroke="var(--tank-metal-b)" strokeWidth={1.1} />
        <circle cx={46} cy={24} r={1.4} fill="var(--tank-edge)" />
      </g>

      {/* Outlet pipe + valve + flow */}
      <g>
        <path
          d="M137 188 L151 188 L151 213"
          stroke={`url(#${id("metal")})`}
          strokeWidth={7}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {flowActive && (
          <path
            d="M139 188 L151 188 L151 211"
            className="flow-active"
            stroke="var(--tank-accent)"
            strokeWidth={2.2}
            fill="none"
            opacity={0.85}
            style={{ filter: GLOW }}
          />
        )}
        <rect x={133} y={182} width={7} height={12} rx={1.5} fill={`url(#${id("metal")})`} stroke="var(--tank-edge)" strokeWidth={0.6} />
        <rect x={145} y={193} width={12} height={9} rx={3} fill={`url(#${id("metal")})`} stroke="var(--tank-edge)" strokeWidth={0.6} />
        <circle cx={151} cy={197.5} r={4.2} fill="none" stroke="var(--tank-metal-b)" strokeWidth={1.5} />
        <path d="M147.3 197.5 h7.4 M151 193.8 v7.4" stroke="var(--tank-metal-b)" strokeWidth={1} />
        <circle cx={151} cy={197.5} r={1.3} fill="var(--tank-edge)" />
        <rect x={144} y={211} width={14} height={5} rx={1.5} fill={`url(#${id("metal")})`} stroke="var(--tank-edge)" strokeWidth={0.6} />
        <ellipse cx={151} cy={219} rx={9} ry={2.5} fill={`url(#${id("shadow")})`} />
      </g>

      {/* Level readout */}
      {level !== null && (
        <text
          x={84}
          y={127}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={27}
          fontWeight={700}
          fill="var(--tank-label)"
          stroke="var(--tank-label-stroke)"
          strokeWidth={4}
          paintOrder="stroke"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          {`${Math.round(clamp(level))}%`}
        </text>
      )}
    </svg>
  );
}
