type ChartPoint = {
  label: string;
  sales: number;
  bills: number;
};

export function AnalyticsChart({ data }: { data: ChartPoint[] }) {
  const maxSales = Math.max(...data.map((point) => point.sales), 1);
  const width = 760;
  const height = 260;
  const points = data.length
    ? data.map((point, index) => {
        const x = data.length === 1 ? width / 2 : 34 + (index * (width - 68)) / (data.length - 1);
        const y = height - 28 - (point.sales / maxSales) * (height - 70);
        return { ...point, x, y };
      })
    : [];
  const linePoints = points.map((point) => `${point.x},${point.y}`).join(" ");
  const areaPoints = points.length
    ? `34,${height - 28} ${linePoints} ${width - 34},${height - 28}`
    : "";

  return (
    <div className="h-[260px] rounded-[18px] bg-white/42 p-4">
      {points.length ? (
        <svg className="h-full w-full" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
          {[55, 100, 145, 190, 235].map((y) => (
            <line key={y} x1="30" x2="735" y1={y} y2={y} stroke="#d8e8e5" strokeDasharray="4 6" />
          ))}
          <defs>
            <linearGradient id="salesArea" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#14b8a6" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon points={areaPoints} fill="url(#salesArea)" />
          <polyline points={linePoints} fill="none" stroke="#0f766e" strokeWidth="3" />
          {points.map((point) => (
            <g key={point.label}>
              <circle cx={point.x} cy={point.y} r="5" fill="#f8fffd" stroke="#0f766e" strokeWidth="3" />
              <text x={point.x} y={height - 6} textAnchor="middle" fontSize="11" fill="#647876">
                {point.label}
              </text>
            </g>
          ))}
        </svg>
      ) : (
        <div className="flex h-full items-center justify-center text-sm font-bold text-[#647876]">
          No finalized bills for this filter yet.
        </div>
      )}
    </div>
  );
}
