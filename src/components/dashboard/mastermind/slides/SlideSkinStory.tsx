'use client';

import { motion } from 'framer-motion';
import type { ZoneAnalysis } from '@/types/mastermind';

// ── Simplified face diagram with zone highlights ──
function FaceDiagram({ topZones }: { topZones: ZoneAnalysis[] }) {
  // Map zone IDs to approximate SVG positions on a face outline
  const zonePositions: Record<string, { x: number; y: number }> = {
    forehead: { x: 150, y: 60 },
    glabella: { x: 150, y: 90 },
    periorbital_left: { x: 115, y: 110 },
    periorbital_right: { x: 185, y: 110 },
    temples_left: { x: 80, y: 100 },
    temples_right: { x: 220, y: 100 },
    cheeks_left: { x: 100, y: 160 },
    cheeks_right: { x: 200, y: 160 },
    nasolabial_left: { x: 125, y: 185 },
    nasolabial_right: { x: 175, y: 185 },
    lips: { x: 150, y: 210 },
    marionette_left: { x: 120, y: 230 },
    marionette_right: { x: 180, y: 230 },
    jawline: { x: 150, y: 260 },
    chin: { x: 150, y: 245 },
    neck: { x: 150, y: 290 },
    decolletage: { x: 150, y: 320 },
  };

  const severityColor = (score: number) => {
    if (score >= 75) return '#7EC8A0';
    if (score >= 50) return '#F5C842';
    return '#E8634F';
  };

  return (
    <svg viewBox="0 0 300 340" className="w-full max-w-[280px] mx-auto">
      {/* Face outline */}
      <ellipse cx="150" cy="160" rx="90" ry="120" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
      {/* Neck */}
      <path d="M 120 270 Q 120 300 130 320 L 170 320 Q 180 300 180 270" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

      {/* Zone highlights */}
      {topZones.map((zone, i) => {
        const pos = zonePositions[zone.zone];
        if (!pos) return null;
        const color = severityColor(zone.overallScore);

        return (
          <motion.g key={zone.zone}>
            {/* Pulsing glow */}
            <motion.circle
              cx={pos.x}
              cy={pos.y}
              r="18"
              fill={`${color}15`}
              stroke={color}
              strokeWidth="1"
              initial={{ r: 10, opacity: 0 }}
              animate={{ r: 18, opacity: 0.8 }}
              transition={{ delay: 0.8 + i * 0.4, duration: 0.6, ease: 'easeOut' }}
            />
            <motion.circle
              cx={pos.x}
              cy={pos.y}
              r="4"
              fill={color}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.0 + i * 0.4, duration: 0.4 }}
            />
          </motion.g>
        );
      })}
    </svg>
  );
}

interface ZoneCard {
  zone: ZoneAnalysis;
  index: number;
}

function ZoneDetail({ zone, index }: ZoneCard) {
  const severity = zone.overallScore >= 75 ? 'Good' : zone.overallScore >= 50 ? 'Moderate' : 'Needs Attention';
  const severityColor = zone.overallScore >= 75 ? '#7EC8A0' : zone.overallScore >= 50 ? '#F5C842' : '#E8634F';
  const topConcern = zone.concerns[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.2 + index * 0.35, duration: 0.6, ease: 'easeOut' }}
      className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-5 backdrop-blur-sm"
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-white font-semibold text-base" style={{ fontFamily: 'Playfair Display, serif' }}>
          {zone.zoneName}
        </h4>
        <span
          className="text-xs px-2.5 py-1 rounded-full font-medium"
          style={{
            background: `${severityColor}20`,
            color: severityColor,
            fontFamily: 'Montserrat, sans-serif',
          }}
        >
          {severity}
        </span>
      </div>
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl font-bold text-white tabular-nums" style={{ fontFamily: 'Playfair Display, serif' }}>
          {zone.overallScore}
        </span>
        <span className="text-white/40 text-sm">/100</span>
      </div>
      {topConcern && (
        <p className="text-sm text-white/50" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          Primary: <span className="text-white/70">{topConcern.type}</span>
        </p>
      )}
    </motion.div>
  );
}

interface SlideSkinStoryProps {
  zoneAnalysis: ZoneAnalysis[];
  patientFacingSummary: string;
}

export default function SlideSkinStory({ zoneAnalysis, patientFacingSummary }: SlideSkinStoryProps) {
  // Get top 3 concern zones by lowest score (most need attention)
  const topZones = [...zoneAnalysis]
    .sort((a, b) => a.overallScore - b.overallScore)
    .slice(0, 3);

  return (
    <div className="relative flex flex-col h-full w-full bg-[#0F1D2C] px-8 py-10 overflow-hidden">
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-2xl md:text-3xl text-[#C9A96E] tracking-[0.15em] uppercase mb-6 text-center"
        style={{ fontFamily: 'Montserrat, sans-serif' }}
      >
        Your Skin Story
      </motion.h2>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 items-center max-w-5xl mx-auto w-full">
        {/* Face diagram */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="flex justify-center"
        >
          <FaceDiagram topZones={topZones} />
        </motion.div>

        {/* Zone details */}
        <div className="space-y-4">
          {topZones.map((zone, i) => (
            <ZoneDetail key={zone.zone} zone={zone} index={i} />
          ))}
        </div>
      </div>

      {/* AI narrative */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.5, duration: 0.8 }}
        className="mt-6 max-w-3xl mx-auto text-center"
      >
        <p className="text-sm text-white/40 uppercase tracking-wider mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          Your skin is telling us...
        </p>
        <p className="text-base md:text-lg text-white/70 leading-relaxed italic" style={{ fontFamily: 'Playfair Display, serif' }}>
          &ldquo;{patientFacingSummary}&rdquo;
        </p>
      </motion.div>
    </div>
  );
}
