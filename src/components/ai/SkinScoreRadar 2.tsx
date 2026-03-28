'use client';

import type { SkinDimensions } from '@/types/ai-treatment';

interface SkinScoreRadarProps {
  dimensions: SkinDimensions;
  size?: number;
}

const DIMENSION_LABELS: Record<keyof SkinDimensions, string> = {
  hydration: 'Hydration',
  elasticity: 'Elasticity',
  texture: 'Texture',
  tone: 'Tone',
  clarity: 'Clarity',
  firmness: 'Firmness',
  radiance: 'Radiance',
  protection: 'Protection',
};

export default function SkinScoreRadar({ dimensions, size = 280 }: SkinScoreRadarProps) {
  const center = size / 2;
  const radius = (size / 2) - 40;
  const entries = Object.entries(dimensions) as Array<[keyof SkinDimensions, number]>;
  const angleStep = (2 * Math.PI) / entries.length;

  // Generate polygon points for the data
  const dataPoints = entries.map(([, value], i) => {
    const angle = (i * angleStep) - (Math.PI / 2); // Start from top
    const r = (value / 100) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  });

  const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  // Generate grid lines
  const gridLevels = [20, 40, 60, 80, 100];

  // Generate label positions
  const labels = entries.map(([key], i) => {
    const angle = (i * angleStep) - (Math.PI / 2);
    const labelR = radius + 25;
    return {
      key,
      x: center + labelR * Math.cos(angle),
      y: center + labelR * Math.sin(angle),
      value: dimensions[key],
    };
  });

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Grid circles */}
        {gridLevels.map((level) => {
          const r = (level / 100) * radius;
          const points = entries.map((_, i) => {
            const angle = (i * angleStep) - (Math.PI / 2);
            return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
          });
          return (
            <polygon
              key={level}
              points={points.join(' ')}
              fill="none"
              stroke="#F8F6F1"
              strokeWidth="1"
            />
          );
        })}

        {/* Axis lines */}
        {entries.map((_, i) => {
          const angle = (i * angleStep) - (Math.PI / 2);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={center + radius * Math.cos(angle)}
              y2={center + radius * Math.sin(angle)}
              stroke="#F8F6F1"
              strokeWidth="1"
            />
          );
        })}

        {/* Data polygon */}
        <path
          d={dataPath}
          fill="rgba(201, 169, 110, 0.15)"
          stroke="#C9A96E"
          strokeWidth="2"
        />

        {/* Data points */}
        {dataPoints.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="4"
            fill="#C9A96E"
            stroke="white"
            strokeWidth="2"
          />
        ))}

        {/* Labels */}
        {labels.map((label) => (
          <text
            key={label.key}
            x={label.x}
            y={label.y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-[9px] font-montserrat fill-[#0F1D2C]/60"
          >
            {DIMENSION_LABELS[label.key]}
          </text>
        ))}
      </svg>
    </div>
  );
}
