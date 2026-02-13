import { Svg, Path, Circle, G, Text as SvgText } from "@react-pdf/renderer";

interface Props {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  colour: string;
  label?: string;
  showLabel?: boolean;
}

export function PdfDonutChart({
  percentage,
  size = 120,
  strokeWidth = 14,
  colour,
  label,
  showLabel = true,
}: Props) {
  const center = size / 2;
  const radius = center - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(Math.max(percentage, 0), 100);
  const arcLength = (pct / 100) * circumference;

  // Create arc path
  const startAngle = -90;
  const endAngle = startAngle + (pct / 100) * 360;
  const startRad = (startAngle * Math.PI) / 180;
  const endRad = (endAngle * Math.PI) / 180;

  const x1 = center + radius * Math.cos(startRad);
  const y1 = center + radius * Math.sin(startRad);
  const x2 = center + radius * Math.cos(endRad);
  const y2 = center + radius * Math.sin(endRad);
  const largeArc = pct > 50 ? 1 : 0;

  const bgPath = `M ${center} ${strokeWidth / 2} A ${radius} ${radius} 0 1 1 ${center - 0.001} ${strokeWidth / 2}`;
  const arcPath =
    pct >= 100
      ? bgPath
      : `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Background circle */}
      <Circle
        cx={center}
        cy={center}
        r={radius}
        stroke="#E2E8F0"
        strokeWidth={strokeWidth}
        fill="none"
      />
      {/* Score arc */}
      {pct > 0 && (
        <Path
          d={arcPath}
          stroke={colour}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
        />
      )}
      {/* Center text */}
      <SvgText
        x={center}
        y={center - 4}
        textAnchor="middle"
        style={{ fontSize: size * 0.22, fontWeight: 700, color: colour }}
        fill={colour}
      >
        {pct}%
      </SvgText>
      {showLabel && label && (
        <SvgText
          x={center}
          y={center + size * 0.14}
          textAnchor="middle"
          style={{ fontSize: size * 0.1, color: colour }}
          fill={colour}
        >
          {label}
        </SvgText>
      )}
    </Svg>
  );
}
