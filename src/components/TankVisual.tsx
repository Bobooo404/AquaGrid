import { useEffect, useId, useRef } from "react";
import { animate } from "animejs";

interface TankVisualProps {
  level: number; // 0-100
  capacity: number;
  name: string;
  type: "overhead" | "ground";
  size?: "sm" | "md" | "lg";
  showVolume?: boolean;
}

export default function TankVisual({ level, capacity, name, size = "md", showVolume = true }: TankVisualProps) {
  const fillRef = useRef<SVGRectElement>(null);
  const tankId = useId().replace(/:/g, "");
  const clipId = `tank-clip-${tankId}`;

  const sizeMap = {
    sm: { w: 69.34, h: 90, rx: 5 },
    md: { w: 84.05, h: 106, rx: 6 },
    lg: { w: 138.68, h: 180, rx: 8 },
  };
  const { w, h, rx } = sizeMap[size];

  const fillColor = "#0ea5e9";
  const fillHeight = (level / 100) * (h - 6);
  const fillY = h - 3 - fillHeight;

  useEffect(() => {
    if (!fillRef.current) return;
    animate(fillRef.current, {
      height: fillHeight,
      y: fillY,
      duration: 800,
      ease: "inOutQuart",
    });
  }, [level, fillHeight, fillY]);

  const liters = Math.round((level / 100) * capacity);
  const litersStr =
    liters >= 1000 ? `${(liters / 1000).toFixed(1)}kL` : `${liters}L`;

  return (
    <div className="flex flex-col items-center gap-1.5 min-w-0">
      <span className="text-xs text-secondary font-mono font-bold uppercase tracking-wider">{name}</span>
      <div className="relative">
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
          <defs>
            <clipPath id={clipId}>
              <rect x="3" y="3" width={w - 6} height={h - 6} rx={rx - 2} />
            </clipPath>
          </defs>

          {/* Tank outline */}
          <rect
            x="1" y="1" width={w - 2} height={h - 2} rx={rx}
            fill="var(--bg-neutral)"
            stroke="var(--border-neutral)"
            strokeWidth="2"
          />

          {/* Water fill */}
          <rect
            ref={fillRef}
            x="3"
            y={fillY}
            width={w - 6}
            height={fillHeight}
            fill={fillColor}
            clipPath={`url(#${clipId})`}
          />

          {/* Clear water level */}
          {level > 2 && (
            <line x1="3" y1={fillY} x2={w - 3} y2={fillY} stroke="#0284c7" strokeWidth="2" />
          )}

          {/* Percentage text */}
          <text
            x={w / 2} y={h / 2 + 5}
            textAnchor="middle"
            fill={fillY <= h / 2 ? "#ffffff" : "#1e3a5f"}
            fontSize={size === "lg" ? 18 : size === "md" ? 13 : 10}
            fontWeight="700"
            fontFamily="'JetBrains Mono', monospace"
          >
            {Math.round(level)}%
          </text>
        </svg>
      </div>
      {showVolume && (
        <span className="text-xs font-mono font-semibold" style={{ color: fillColor }}>
          {litersStr}
        </span>
      )}
    </div>
  );
}
