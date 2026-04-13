'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface FaceMapPickerProps {
  selectedAreas: string[];
  onToggle: (area: string) => void;
}

interface FaceZone {
  id: string;
  label: string;
  // SVG element definition
  element: 'ellipse' | 'path' | 'rect';
  props: Record<string, unknown>;
  // Label position
  labelX: number;
  labelY: number;
}

const FACE_ZONES: FaceZone[] = [
  {
    id: 'forehead',
    label: 'Forehead',
    element: 'ellipse',
    props: { cx: 150, cy: 78, rx: 52, ry: 24 },
    labelX: 150,
    labelY: 78,
  },
  {
    id: 'under-eyes',
    label: 'Under Eyes',
    element: 'path',
    props: {
      d: 'M 108 130 Q 120 140 132 130 M 168 130 Q 180 140 192 130',
    },
    labelX: 150,
    labelY: 122,
  },
  {
    id: 'cheeks',
    label: 'Cheeks',
    element: 'path',
    props: {
      d: 'M 88 148 Q 80 170 92 190 Q 108 195 118 180 Q 122 165 115 148 Z M 212 148 Q 220 170 208 190 Q 192 195 182 180 Q 178 165 185 148 Z',
    },
    labelX: 150,
    labelY: 168,
  },
  {
    id: 'nose',
    label: 'Nose',
    element: 'path',
    props: {
      d: 'M 145 115 L 142 160 Q 138 170 132 172 Q 145 178 150 178 Q 155 178 168 172 Q 162 170 158 160 L 155 115 Z',
    },
    labelX: 150,
    labelY: 152,
  },
  {
    id: 'lips',
    label: 'Lips',
    element: 'path',
    props: {
      d: 'M 128 200 Q 138 193 150 195 Q 162 193 172 200 Q 165 210 150 212 Q 135 210 128 200 Z',
    },
    labelX: 150,
    labelY: 203,
  },
  {
    id: 'chin',
    label: 'Chin',
    element: 'ellipse',
    props: { cx: 150, cy: 232, rx: 28, ry: 16 },
    labelX: 150,
    labelY: 232,
  },
  {
    id: 'jawline',
    label: 'Jawline',
    element: 'path',
    props: {
      d: 'M 82 195 Q 78 210 82 225 Q 95 250 120 258 Q 140 260 150 258 Q 160 260 180 258 Q 205 250 218 225 Q 222 210 218 195 Q 215 210 210 222 Q 198 242 175 250 Q 155 254 150 254 Q 145 254 125 250 Q 102 242 90 222 Q 85 210 82 195 Z',
    },
    labelX: 150,
    labelY: 255,
  },
];

export default function FaceMapPicker({
  selectedAreas,
  onToggle,
}: FaceMapPickerProps) {
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);

  const isSelected = (id: string) => selectedAreas.includes(id);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center"
    >
      <svg
        viewBox="0 0 300 300"
        className="w-full max-w-[280px] md:max-w-[320px]"
        role="img"
        aria-label="Face map for selecting treatment areas"
      >
        {/* Face outline */}
        <ellipse
          cx="150"
          cy="160"
          rx="80"
          ry="100"
          fill="none"
          stroke="#0F1D2C"
          strokeWidth="1.5"
          opacity="0.25"
        />

        {/* Hairline arc */}
        <path
          d="M 72 130 Q 70 80 90 55 Q 110 35 150 30 Q 190 35 210 55 Q 230 80 228 130"
          fill="none"
          stroke="#0F1D2C"
          strokeWidth="1.5"
          opacity="0.2"
        />

        {/* Ears */}
        <path
          d="M 70 135 Q 62 140 60 155 Q 60 170 68 175"
          fill="none"
          stroke="#0F1D2C"
          strokeWidth="1.2"
          opacity="0.2"
        />
        <path
          d="M 230 135 Q 238 140 240 155 Q 240 170 232 175"
          fill="none"
          stroke="#0F1D2C"
          strokeWidth="1.2"
          opacity="0.2"
        />

        {/* Eyes (non-interactive, decorative) */}
        <ellipse
          cx="120"
          cy="128"
          rx="14"
          ry="8"
          fill="none"
          stroke="#0F1D2C"
          strokeWidth="1"
          opacity="0.2"
        />
        <ellipse
          cx="180"
          cy="128"
          rx="14"
          ry="8"
          fill="none"
          stroke="#0F1D2C"
          strokeWidth="1"
          opacity="0.2"
        />

        {/* Eyebrows */}
        <path
          d="M 102 115 Q 115 108 135 112"
          fill="none"
          stroke="#0F1D2C"
          strokeWidth="1.2"
          opacity="0.2"
        />
        <path
          d="M 198 115 Q 185 108 165 112"
          fill="none"
          stroke="#0F1D2C"
          strokeWidth="1.2"
          opacity="0.2"
        />

        {/* Interactive zones */}
        {FACE_ZONES.map((zone) => {
          const selected = isSelected(zone.id);
          const hovered = hoveredZone === zone.id;

          const zoneProps = {
            ...zone.props,
            fill: selected
              ? 'rgba(201, 169, 110, 0.3)'
              : hovered
              ? 'rgba(201, 169, 110, 0.12)'
              : 'transparent',
            stroke: selected
              ? '#C9A96E'
              : hovered
              ? 'rgba(201, 169, 110, 0.5)'
              : 'transparent',
            strokeWidth: selected ? 2 : 1.5,
            className: 'cursor-pointer transition-all duration-200',
            onClick: () => onToggle(zone.id),
            onMouseEnter: () => setHoveredZone(zone.id),
            onMouseLeave: () => setHoveredZone(null),
            role: 'button',
            'aria-label': `${zone.label} ${selected ? '(selected)' : ''}`,
            tabIndex: 0,
            onKeyDown: (e: React.KeyboardEvent) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onToggle(zone.id);
              }
            },
          };

          const ellipseProps = zoneProps as React.SVGProps<SVGEllipseElement>;
          const pathProps = zoneProps as React.SVGProps<SVGPathElement>;

          return (
            <g key={zone.id}>
              {zone.element === 'ellipse' && (
                <ellipse {...ellipseProps} />
              )}
              {zone.element === 'path' && <path {...pathProps} />}

              {/* Zone label - show on hover or when selected */}
              {(hovered || selected) && (
                <text
                  x={zone.labelX}
                  y={zone.id === 'jawline' ? zone.labelY + 4 : zone.labelY - (zone.id === 'under-eyes' ? 8 : 0)}
                  textAnchor="middle"
                  fill={selected ? '#C9A96E' : '#0F1D2C'}
                  fontSize="9"
                  fontFamily="Montserrat, sans-serif"
                  fontWeight="500"
                  opacity={selected ? 1 : 0.6}
                  pointerEvents="none"
                >
                  {zone.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Selected areas summary */}
      {selectedAreas.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap gap-2 justify-center mt-4"
        >
          {selectedAreas.map((area) => {
            const zone = FACE_ZONES.find((z) => z.id === area);
            return (
              <button
                key={area}
                onClick={() => onToggle(area)}
                className="font-body text-xs px-3 py-1.5 rounded-full bg-[#C9A96E]/10 text-[#C9A96E] border border-[#C9A96E]/30 hover:bg-[#C9A96E]/20 transition-colors"
              >
                {zone?.label} &times;
              </button>
            );
          })}
        </motion.div>
      )}
    </motion.div>
  );
}
