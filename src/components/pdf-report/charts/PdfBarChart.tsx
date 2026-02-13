import { Svg, Rect, G, Text as SvgText, Line } from "@react-pdf/renderer";

interface BarItem {
  label: string;
  value: number;
  colour: string;
}

interface Props {
  items: BarItem[];
  width?: number;
  barHeight?: number;
}

export function PdfBarChart({ items, width = 460, barHeight = 22 }: Props) {
  const labelWidth = 130;
  const chartWidth = width - labelWidth - 50;
  const rowHeight = barHeight + 12;
  const height = items.length * rowHeight + 10;

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {items.map((item, i) => {
        const y = i * rowHeight + 5;
        const barW = Math.max((item.value / 100) * chartWidth, 2);
        return (
          <G key={i}>
            {/* Label */}
            <SvgText
              x={labelWidth - 8}
              y={y + barHeight / 2 + 4}
              textAnchor="end"
              style={{ fontSize: 9, color: "#475569" }}
              fill="#475569"
            >
              {item.label}
            </SvgText>
            {/* Background bar */}
            <Rect
              x={labelWidth}
              y={y}
              width={chartWidth}
              height={barHeight}
              rx={4}
              fill="#F1F5F9"
            />
            {/* Value bar */}
            <Rect
              x={labelWidth}
              y={y}
              width={barW}
              height={barHeight}
              rx={4}
              fill={item.colour}
            />
            {/* Score text */}
            <SvgText
              x={labelWidth + chartWidth + 8}
              y={y + barHeight / 2 + 4}
              style={{ fontSize: 10, fontWeight: 600, color: "#334155" }}
              fill="#334155"
            >
              {item.value}%
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );
}
