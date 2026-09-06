"use client";

import { useMemo, useState } from "react";

export type ChartPoint = {
  label: string;
  sales: number;
  bills: number;
};

export function AnalyticsChart({
  data = [],
  height = 260,
  accentColor = "#0f766e",
  secondaryColor = "#14b8a6",
}: {
  data: ChartPoint[];
  height?: number;
  accentColor?: string;
  secondaryColor?: string;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [chartMode, setChartMode] = useState<"area" | "bar">("area");

  const trendData = useMemo(() => {
    if (data && data.length > 0) return data;
    return [
      { label: "10 AM", sales: 0, bills: 0 },
      { label: "12 PM", sales: 0, bills: 0 },
      { label: "02 PM", sales: 0, bills: 0 },
      { label: "04 PM", sales: 0, bills: 0 },
      { label: "06 PM", sales: 0, bills: 0 },
      { label: "08 PM", sales: 0, bills: 0 },
    ];
  }, [data]);

  const maxSales = useMemo(() => {
    const max = Math.max(...trendData.map((d) => d.sales), 0);
    return max === 0 ? 1000 : Math.ceil(max * 1.15);
  }, [trendData]);

  const peakPoint = useMemo(() => {
    return trendData.reduce((prev, current) => (current.sales > prev.sales ? current : prev), trendData[0]);
  }, [trendData]);

  const totalSales = useMemo(() => {
    return trendData.reduce((sum, d) => sum + d.sales, 0);
  }, [trendData]);

  const width = 760;
  const paddingLeft = 50;
  const paddingRight = 25;
  const paddingTop = 20;
  const paddingBottom = 35;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const points = useMemo(() => {
    const totalPoints = trendData.length;
    return trendData.map((d, i) => {
      const x =
        totalPoints === 1
          ? paddingLeft + chartWidth / 2
          : paddingLeft + (i * chartWidth) / (totalPoints - 1);
      const y = paddingTop + chartHeight - (d.sales / maxSales) * chartHeight;
      return { ...d, x, y, index: i };
    });
  }, [trendData, chartWidth, chartHeight, maxSales]);

  // Smooth Bezier Curve Path
  const linePath = useMemo(() => {
    if (points.length === 0) return "";
    if (points.length === 1) return `M ${points[0].x},${points[0].y}`;

    let d = `M ${points[0].x},${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      const controlX = (current.x + next.x) / 2;
      d += ` C ${controlX},${current.y} ${controlX},${next.y} ${next.x},${next.y}`;
    }
    return d;
  }, [points]);

  const areaPath = useMemo(() => {
    if (!linePath || points.length === 0) return "";
    const lastPoint = points[points.length - 1];
    const firstPoint = points[0];
    const bottomY = paddingTop + chartHeight;
    return `${linePath} L ${lastPoint.x},${bottomY} L ${firstPoint.x},${bottomY} Z`;
  }, [linePath, points, paddingTop, chartHeight]);

  const yTicks = useMemo(() => {
    const count = 4;
    const ticks = [];
    for (let i = 0; i <= count; i++) {
      const value = Math.round((maxSales / count) * i);
      const y = paddingTop + chartHeight - (i * chartHeight) / count;
      ticks.push({ value, y });
    }
    return ticks;
  }, [maxSales, chartHeight, paddingTop]);

  const activeHoverPoint = hoveredIndex !== null ? points[hoveredIndex] : null;

  return (
    <div className="relative w-full rounded-[20px] border border-[#d8e8e5] bg-gradient-to-b from-white/90 to-[#f4faf9]/80 p-4 shadow-sm backdrop-blur-xl">
      {/* Header Summary */}
      <div className="mb-3 flex items-center justify-between border-b border-[#d8e8e5]/60 pb-2.5">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#647876]">Total Sales</span>
            <div className="font-display text-lg font-bold text-[#10201f]">
              INR {totalSales.toLocaleString("en-IN")}
            </div>
          </div>
          <div className="h-6 w-[1px] bg-[#d8e8e5]" />
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#647876]">Peak Trend</span>
            <div className="font-mono text-xs font-bold text-[#0f766e]">
              INR {peakPoint.sales.toLocaleString("en-IN")}{" "}
              <span className="font-normal text-[#647876]">({peakPoint.label})</span>
            </div>
          </div>
        </div>

        <div className="flex items-center rounded-lg bg-[#d8e8e5]/50 p-0.5 border border-[#d8e8e5]">
          <button
            type="button"
            onClick={() => setChartMode("area")}
            className={`rounded-md px-2 py-0.5 text-xs font-bold transition ${
              chartMode === "area" ? "bg-white text-[#0f766e] shadow-xs" : "text-[#647876]"
            }`}
          >
            Spline
          </button>
          <button
            type="button"
            onClick={() => setChartMode("bar")}
            className={`rounded-md px-2 py-0.5 text-xs font-bold transition ${
              chartMode === "bar" ? "bg-white text-[#0f766e] shadow-xs" : "text-[#647876]"
            }`}
          >
            Bar
          </button>
        </div>
      </div>

      <div className="relative h-[230px] w-full">
        <svg
          className="h-full w-full overflow-visible"
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="frSalesGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={secondaryColor} stopOpacity="0.3" />
              <stop offset="100%" stopColor={accentColor} stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="frBarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={secondaryColor} stopOpacity="0.9" />
              <stop offset="100%" stopColor={accentColor} stopOpacity="0.7" />
            </linearGradient>
          </defs>

          {yTicks.map((tick, idx) => (
            <g key={idx}>
              <line
                x1={paddingLeft}
                y1={tick.y}
                x2={width - paddingRight}
                y2={tick.y}
                stroke="#d8e8e5"
                strokeDasharray="4 6"
                strokeWidth={1}
              />
              <text
                x={paddingLeft - 6}
                y={tick.y + 4}
                textAnchor="end"
                fontSize="10"
                className="fill-[#647876] font-mono font-medium"
              >
                ₹{tick.value >= 1000 ? `${(tick.value / 1000).toFixed(1)}k` : tick.value}
              </text>
            </g>
          ))}

          {chartMode === "area" && (
            <>
              <path d={areaPath} fill="url(#frSalesGrad)" />
              <path
                d={linePath}
                fill="none"
                stroke={accentColor}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {points.map((pt) => {
                const isHovered = hoveredIndex === pt.index;
                return (
                  <g
                    key={pt.index}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredIndex(pt.index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    {isHovered && (
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="9"
                        fill={accentColor}
                        fillOpacity="0.2"
                        className="animate-ping"
                      />
                    )}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? "6" : "4"}
                      fill="#ffffff"
                      stroke={accentColor}
                      strokeWidth={isHovered ? "3" : "2"}
                    />
                  </g>
                );
              })}
            </>
          )}

          {chartMode === "bar" && (
            <g>
              {points.map((pt) => {
                const isHovered = hoveredIndex === pt.index;
                const barWidth = Math.min(32, chartWidth / points.length - 8);
                const barX = pt.x - barWidth / 2;
                const barY = pt.y;
                const barHeight = paddingTop + chartHeight - pt.y;

                return (
                  <g
                    key={pt.index}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredIndex(pt.index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    <rect
                      x={barX}
                      y={barY}
                      width={barWidth}
                      height={Math.max(barHeight, 4)}
                      rx="5"
                      fill={isHovered ? accentColor : "url(#frBarGrad)"}
                      className="transition-all duration-150 hover:opacity-90"
                    />
                  </g>
                );
              })}
            </g>
          )}

          {points.map((pt) => (
            <text
              key={`x-label-${pt.index}`}
              x={pt.x}
              y={height - 8}
              textAnchor="middle"
              fontSize="10"
              className={`transition-all font-semibold ${
                hoveredIndex === pt.index ? "fill-[#0f766e] font-bold" : "fill-[#647876]"
              }`}
            >
              {pt.label}
            </text>
          ))}

          {activeHoverPoint && (
            <line
              x1={activeHoverPoint.x}
              y1={paddingTop}
              x2={activeHoverPoint.x}
              y2={paddingTop + chartHeight}
              stroke={accentColor}
              strokeDasharray="3 3"
              strokeWidth={1.5}
            />
          )}
        </svg>

        {activeHoverPoint && (
          <div
            className="pointer-events-none absolute z-30 transform -translate-x-1/2 -translate-y-full rounded-xl border border-[#d8e8e5] bg-white p-2.5 shadow-lg backdrop-blur-md transition-all duration-150"
            style={{
              left: `${(activeHoverPoint.x / width) * 100}%`,
              top: `${(activeHoverPoint.y / height) * 100 - 10}%`,
            }}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#647876]">
              {activeHoverPoint.label}
            </div>
            <div className="font-display mt-0.5 text-sm font-bold text-[#10201f]">
              INR {activeHoverPoint.sales.toLocaleString("en-IN")}
            </div>
            <div className="mt-0.5 flex items-center gap-1 text-[11px] text-[#0f766e] font-semibold">
              <span>{activeHoverPoint.bills} bills</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
