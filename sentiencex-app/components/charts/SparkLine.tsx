"use client";

interface SparkLineProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}

export default function SparkLine({
  data,
  color = "oklch(72% 0.19 200)", // teal default
  width = 120,
  height = 40,
}: SparkLineProps) {
  if (!data || data.length < 2) return null;

  // Calculate coordinates
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min === 0 ? 1 : max - min;

  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * width;
    // Invert y because (0,0) is top-left
    const y = height - ((val - min) / range) * (height - 8) - 4;
    return { x, y };
  });

  const pathD = `M ${points[0].x} ${points[0].y} ` + 
    points.slice(1).map((p) => `L ${p.x} ${p.y}`).join(" ");

  const fillD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`grad-${color.replace(/\s+/g, "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.2} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      
      {/* Area fill */}
      <path
        d={fillD}
        fill={`url(#grad-${color.replace(/\s+/g, "")})`}
        stroke="none"
      />

      {/* Stroke path */}
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Pulse dot on last element */}
      <circle
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r={3}
        fill={color}
        className="animate-pulse"
      />
    </svg>
  );
}
