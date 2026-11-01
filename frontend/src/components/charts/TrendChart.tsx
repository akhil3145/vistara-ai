import React, { useId, useMemo, useState } from 'react';

export interface TrendPoint {
  timestamp: string;
  value: number;
}

interface TrendChartProps {
  points: TrendPoint[];
  formatValue: (value: number) => string;
  formatLabel: (value: string) => string;
  emptyLabel?: string;
  className?: string;
}

const W = 600;
const H = 220;
const PAD_L = 34;
const PAD_R = 16;
const PAD_T = 18;
const PAD_B = 28;

const buildSmoothPath = (coords: Array<{ x: number; y: number }>): string => {
  if (coords.length === 0) return '';
  if (coords.length === 1) {
    return `M ${coords[0].x} ${coords[0].y} L ${coords[0].x} ${coords[0].y}`;
  }

  let path = `M ${coords[0].x} ${coords[0].y}`;

  for (let i = 0; i < coords.length - 1; i += 1) {
    const current = coords[i];
    const next = coords[i + 1];
    const midX = (current.x + next.x) / 2;
    path += ` C ${midX} ${current.y}, ${midX} ${next.y}, ${next.x} ${next.y}`;
  }

  return path;
};

export const TrendChart: React.FC<TrendChartProps> = ({
  points,
  formatValue,
  formatLabel,
  emptyLabel = 'No trend data available',
  className = '',
}) => {
  const gradientId = useId().replaceAll(':', '');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const geometry = useMemo(() => {
    if (points.length === 0) return null;

    const values = points.map((point) => point.value);
    const rawMin = Math.min(...values);
    const rawMax = Math.max(...values);
    const span = Math.max(0.01, rawMax - rawMin);
    const min = Math.max(0, rawMin - span * 0.25);
    const max = Math.min(1, rawMax + span * 0.18);
    const range = Math.max(0.01, max - min);
    const plotW = W - PAD_L - PAD_R;
    const plotH = H - PAD_T - PAD_B;

    const coords = points.map((point, index) => {
      const x =
        points.length === 1
          ? PAD_L + plotW / 2
          : PAD_L + (index / (points.length - 1)) * plotW;
      const y = PAD_T + (1 - (point.value - min) / range) * plotH;
      return { x, y };
    });

    const linePath = buildSmoothPath(coords);
    const areaPath = `${linePath} L ${coords[coords.length - 1].x} ${
      H - PAD_B
    } L ${coords[0].x} ${H - PAD_B} Z`;

    const gridLines = [0, 0.25, 0.5, 0.75, 1].map((fraction) => ({
      y: PAD_T + fraction * plotH,
      value: max - fraction * range,
    }));

    return { coords, linePath, areaPath, gridLines };
  }, [points]);

  if (!geometry) {
    return (
      <div
        className={`flex h-56 flex-col items-center justify-center rounded-xl border border-dashed border-line bg-base/30 px-6 text-center ${className}`}
      >
        <p className="text-xs text-muted">{emptyLabel}</p>
      </div>
    );
  }

  const active =
    activeIndex !== null
      ? { point: points[activeIndex], coord: geometry.coords[activeIndex] }
      : null;

  return (
    <div className={`relative ${className}`}>
      <div className="relative h-56 w-full sm:h-60">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="h-full w-full overflow-visible"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={`area-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(32 201 176)" stopOpacity="0.32" />
              <stop offset="65%" stopColor="rgb(32 201 176)" stopOpacity="0.06" />
              <stop offset="100%" stopColor="rgb(32 201 176)" stopOpacity="0" />
            </linearGradient>
            <linearGradient id={`line-${gradientId}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgb(56 189 248)" />
              <stop offset="55%" stopColor="rgb(32 201 176)" />
              <stop offset="100%" stopColor="rgb(132 204 22)" />
            </linearGradient>
          </defs>

          {geometry.gridLines.map((line, index) => (
            <line
              key={index}
              x1={PAD_L}
              x2={W - PAD_R}
              y1={line.y}
              y2={line.y}
              stroke="rgb(var(--c-line))"
              strokeOpacity={index === 4 ? 0.9 : 0.45}
              strokeDasharray={index === 4 ? '0' : '3 7'}
              vectorEffect="non-scaling-stroke"
            />
          ))}

          <path d={geometry.areaPath} fill={`url(#area-${gradientId})`} />
          <path
            d={geometry.linePath}
            fill="none"
            stroke={`url(#line-${gradientId})`}
            strokeWidth="2.2"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />

          {active && (
            <line
              x1={active.coord.x}
              x2={active.coord.x}
              y1={PAD_T}
              y2={H - PAD_B}
              stroke="rgb(32 201 176)"
              strokeOpacity="0.45"
              strokeDasharray="3 4"
              vectorEffect="non-scaling-stroke"
            />
          )}
        </svg>

        {geometry.coords.map((coord, index) => {
          const isActive = activeIndex === index;
          return (
            <button
              key={`hotspot-${points[index].timestamp}-${index}`}
              type="button"
              aria-label={`${formatLabel(points[index].timestamp)}: ${formatValue(
                points[index].value,
              )}`}
              className="absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full focus:outline-none"
              style={{
                left: `${(coord.x / W) * 100}%`,
                top: `${(coord.y / H) * 100}%`,
                width: 22,
                height: 22,
              }}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
              onFocus={() => setActiveIndex(index)}
              onBlur={() => setActiveIndex(null)}
            >
              <span
                className={`absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border transition-all ${
                  isActive
                    ? 'h-3 w-3 border-accent bg-panel shadow-[0_0_0_3px_rgba(32,201,176,0.2)]'
                    : 'border-accent/70 bg-accent/80'
                }`}
              />
            </button>
          );
        })}

        <div className="pointer-events-none absolute inset-y-0 right-1 flex flex-col justify-between py-4 text-right font-mono text-[9px] text-faint">
          <span>{formatValue(geometry.gridLines[0].value)}</span>
          <span>{formatValue(geometry.gridLines[2].value)}</span>
          <span>{formatValue(geometry.gridLines[4].value)}</span>
        </div>

        {active && (
          <div
            className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-[115%] whitespace-nowrap rounded-lg border border-line bg-raised px-2.5 py-1.5 text-left shadow-lift"
            style={{
              left: `${(active.coord.x / W) * 100}%`,
              top: `${(active.coord.y / H) * 100}%`,
            }}
          >
            <p className="font-mono text-[10px] font-semibold text-accent">
              {formatValue(active.point.value)}
            </p>
            <p className="mt-0.5 text-[9px] text-faint">
              {formatLabel(active.point.timestamp)}
            </p>
          </div>
        )}
      </div>

      <div className="mt-1 flex items-center justify-between border-t border-line/70 pt-2 text-[9px] text-faint">
        <span>{formatLabel(points[0].timestamp)}</span>
        <span>{formatLabel(points[points.length - 1].timestamp)}</span>
      </div>
    </div>
  );
};
