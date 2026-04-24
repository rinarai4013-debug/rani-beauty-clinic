'use client';

import { motion } from 'framer-motion';

interface BodyMapPickerProps {
  selectedAreas: string[];
  onToggle: (_area: string) => void;
}

interface BodyZone {
  id: string;
  label: string;
  path: string;
  labelX: number;
  labelY: number;
}

// Front-view body silhouette zones - SVG path data for each tappable area
const BODY_ZONES: BodyZone[] = [
  {
    id: 'face',
    label: 'Face',
    path: 'M85,28 C85,16 92,8 100,8 C108,8 115,16 115,28 C115,40 108,48 100,48 C92,48 85,40 85,28 Z',
    labelX: 100,
    labelY: 28,
  },
  {
    id: 'neck',
    label: 'Neck',
    path: 'M93,48 L107,48 L107,58 C107,60 105,62 100,62 C95,62 93,60 93,58 Z',
    labelX: 100,
    labelY: 55,
  },
  {
    id: 'chest',
    label: 'Chest',
    path: 'M72,62 L128,62 L132,68 L132,100 L68,100 L68,68 Z',
    labelX: 100,
    labelY: 81,
  },
  {
    id: 'arms',
    label: 'Arms',
    path: 'M68,62 L56,68 L48,100 L44,130 L52,132 L58,105 L64,82 L68,100 Z M132,62 L144,68 L152,100 L156,130 L148,132 L142,105 L136,82 L132,100 Z',
    labelX: 50,
    labelY: 96,
  },
  {
    id: 'abdomen',
    label: 'Abdomen',
    path: 'M68,100 L132,100 L130,140 L70,140 Z',
    labelX: 100,
    labelY: 120,
  },
  {
    id: 'back',
    label: 'Back',
    // Represented as a subtle overlay on the torso (conceptual - front view hint)
    path: 'M75,65 L82,62 L82,68 L75,72 Z M125,65 L118,62 L118,68 L125,72 Z',
    labelX: 158,
    labelY: 81,
  },
  {
    id: 'legs',
    label: 'Legs',
    path: 'M70,140 L88,140 L90,190 L94,240 L82,240 L78,190 L72,160 Z M130,140 L112,140 L110,190 L106,240 L118,240 L122,190 L128,160 Z',
    labelX: 100,
    labelY: 190,
  },
  {
    id: 'bikini',
    label: 'Bikini',
    path: 'M88,136 L112,136 L112,148 L108,155 L92,155 L88,148 Z',
    labelX: 100,
    labelY: 146,
  },
];

export default function BodyMapPicker({
  selectedAreas,
  onToggle,
}: BodyMapPickerProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center"
    >
      <svg
        viewBox="30 0 140 260"
        className="w-full max-w-[280px] h-auto"
        role="img"
        aria-label="Body map for selecting treatment areas"
      >
        {/* Body outline silhouette */}
        <path
          d="M100,8 C92,8 85,16 85,28 C85,40 92,48 93,48 L93,58 C93,60 95,62 82,62
            L72,62 L56,68 L48,100 L44,130 L52,132 L58,105 L64,82 L68,100 L68,140
            L72,160 L78,190 L82,240 L94,240 L90,190 L88,155 L92,155 L100,155
            L108,155 L112,155 L110,190 L106,240 L118,240 L122,190 L128,160 L132,140
            L132,100 L136,82 L142,105 L148,132 L156,130 L152,100 L144,68 L128,62
            L118,62 C105,62 107,60 107,58 L107,48 C108,48 115,40 115,28
            C115,16 108,8 100,8 Z"
          fill="none"
          stroke="#0F1D2C"
          strokeWidth="0.8"
          opacity="0.15"
        />

        {/* Interactive zones */}
        {BODY_ZONES.map((zone) => {
          const isSelected = selectedAreas.includes(zone.id);
          return (
            <g
              key={zone.id}
              className="cursor-pointer"
              role="button"
              tabIndex={0}
              aria-label={`${zone.label} ${isSelected ? '(selected)' : ''}`}
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onToggle(zone.id);
                }
              }}
            >
              {/* Tappable area */}
              <path
                d={zone.path}
                fill={isSelected ? '#C9A96E' : '#0F1D2C'}
                fillOpacity={isSelected ? 0.25 : 0.04}
                stroke={isSelected ? '#C9A96E' : '#0F1D2C'}
                strokeWidth={isSelected ? 1.5 : 0.5}
                strokeOpacity={isSelected ? 0.8 : 0.15}
                onClick={() => onToggle(zone.id)}
                className="transition-all duration-300 hover:fill-opacity-[0.15] hover:stroke-opacity-40"
                style={{ cursor: 'pointer' }}
              />

              {/* Label - only visible when selected */}
              {isSelected && (
                <g>
                  <rect
                    x={zone.labelX - 18}
                    y={zone.labelY - 6}
                    width={36}
                    height={12}
                    rx={6}
                    fill="#C9A96E"
                    opacity={0.9}
                  />
                  <text
                    x={zone.labelX}
                    y={zone.labelY + 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="white"
                    fontSize="6"
                    fontFamily="Montserrat, sans-serif"
                    fontWeight="600"
                  >
                    {zone.label}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>

      {/* Selected Areas Chips */}
      {selectedAreas.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap justify-center gap-2 mt-4"
        >
          {selectedAreas.map((area) => {
            const zone = BODY_ZONES.find((z) => z.id === area);
            return (
              <motion.button
                key={area}
                type="button"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                onClick={() => onToggle(area)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C9A96E]/10 border border-[#C9A96E]/30 text-[#0F1D2C] font-body text-xs font-medium hover:bg-[#C9A96E]/20 transition-colors duration-200"
              >
                {zone?.label || area}
                <svg
                  className="w-3 h-3 text-[#0F1D2C]/40"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </motion.button>
            );
          })}
        </motion.div>
      )}

      {/* Hint */}
      <p className="font-body text-xs text-[#0F1D2C]/40 mt-3 text-center">
        Tap areas to select or deselect treatment zones
      </p>
    </motion.div>
  );
}
