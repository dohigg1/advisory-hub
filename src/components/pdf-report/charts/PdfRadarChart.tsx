import { Svg, Polygon, Line, G, Text as SvgText, Circle } from "@react-pdf/renderer";

interface RadarItem {
  label: string;
  value: number;
}

interface Props {
  items: RadarItem[];
  size?: number;
  colour: string;
}

export function PdfRadarChart({ items, size = 280, colour }: Props) {
  if (items.length < 3) return null;

  const center = size / 2;
  const radius = center - 40;
  const levels = 4;
  const n = items.length;

  const getPoint = (index: number, value: number) => {
    const angle = (Math.PI * 2 * index) / n - Math.PI / 2;
    const r = (value / 100) * radius;
    return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) };
  };

  // Grid levels
  const gridPolygons = Array.from({ length: levels }, (_, level) => {
    const pct = ((level + 1) / levels) * 100;
    const pts = Array.from({ length: n }, (_, i) => {
      const p = getPoint(i, pct);
      return `${p.x},${p.y}`;
    }).join(" ");
    return pts;
  });

  // Axis lines
  const axes = Array.from({ length: n }, (_, i) => {
    const p = getPoint(i, 100);
    return { x2: p.x, y2: p.y };
  });

  // Data polygon
  const dataPoints = items.map((item, i) => {
    const p = getPoint(i, item.value);
    return `${p.x},${p.y}`;
  }).join(" ");

  // Label positions
  const labels = items.map((item, i) => {
    const p = getPoint(i, 115);
    return { ...p, label: item.label };
  });

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Grid */}
      {gridPolygons.map((pts, i) => (
        <Polygon
          key={`grid-${i}`}
          points={pts}
          stroke="#CBD5E1"
          strokeWidth={0.5}
          fill="none"
        />
      ))}

      {/* Axes */}
      {axes.map((a, i) => (
        <Line
          key={`axis-${i}`}
          x1={center}
          y1={center}
          x2={a.x2}
          y2={a.y2}
          stroke="#CBD5E1"
          strokeWidth={0.5}
        />
      ))}

      {/* Data area */}
      <Polygon
        points={dataPoints}
        stroke={colour}
        strokeWidth={2}
        fill={colour}
        fillOpacity={0.2}
      />

      {/* Data points */}
      {items.map((item, i) => {
        const p = getPoint(i, item.value);
        return (
          <Circle
            key={`dot-${i}`}
            cx={p.x}
            cy={p.y}
            r={3}
            fill={colour}
          />
        );
      })}

      {/* Labels */}
      {labels.map((l, i) => (
        <SvgText
          key={`label-${i}`}
          x={l.x}
          y={l.y}
          textAnchor="middle"
          style={{ fontSize: 7.5, color: "#475569" }}
          fill="#475569"
        >
          {l.label}
        </SvgText>
      ))}
    </Svg>
  );
}
