'use client';

import { motion } from 'framer-motion';
import type { CategoryScore, ScoringMode } from '@/types/mastermind';

interface AnalysisCardProps {
  category: CategoryScore;
  scoringMode: ScoringMode;
  photoUrl?: string; // Patient photo URL (if available)
  index: number;
  onClick?: () => void;
}

function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'mild': return '#059669';
    case 'moderate': return '#C9A96E';
    case 'severe': return '#DC2626';
    default: return '#6B7280';
  }
}

function formatScore(score: number, mode: ScoringMode): string {
  if (mode === 'absolute') return score.toFixed(1);
  // Peer mode: show +/- relative to peers
  if (score <= 0) return score.toFixed(1);
  return `+${score.toFixed(1)}`;
}

function getScoreBadgeColor(score: number, mode: ScoringMode): string {
  if (mode === 'absolute') {
    if (score <= 1.5) return '#059669'; // green — mild
    if (score <= 3.0) return '#C9A96E'; // gold — moderate
    return '#DC2626'; // red — severe
  }
  // Peer mode: negative is better
  if (score <= -0.5) return '#059669';
  if (score <= 1.0) return '#C9A96E';
  return '#DC2626';
}

export default function AnalysisCard({
  category,
  scoringMode,
  photoUrl,
  index,
  onClick,
}: AnalysisCardProps) {
  const displayScore = scoringMode === 'absolute' ? category.absoluteScore : category.peerScore;
  const badgeColor = getScoreBadgeColor(displayScore, scoringMode);
  const severityColor = getSeverityColor(category.severity);

  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-[#E8E4DF] bg-white hover:border-[#C9A96E]/50 hover:shadow-md transition-all duration-300 cursor-pointer group"
    >
      {/* Category Label */}
      <h3 className="font-body text-sm font-semibold text-[#0F1D2C]">
        {category.label}
      </h3>

      {/* Face Image Placeholder */}
      <div className="relative w-full aspect-square rounded-xl bg-[#F8F6F1] overflow-hidden flex items-center justify-center">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt={`${category.label} analysis`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 rounded-full bg-[#0F1D2C]/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-[#0F1D2C]/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <span className="font-body text-xs text-[#0F1D2C]/30">Analysis view</span>
          </div>
        )}

        {/* Severity indicator overlay */}
        <div
          className="absolute top-2 right-2 w-3 h-3 rounded-full"
          style={{ backgroundColor: severityColor }}
        />
      </div>

      {/* Score Badge */}
      {category.label !== 'Neutral' && (
        <div className="flex items-center gap-1.5">
          <span className="font-body text-xs text-[#0F1D2C]/50">Score:</span>
          <span
            className="font-body text-sm font-bold px-2 py-0.5 rounded-md text-white"
            style={{ backgroundColor: badgeColor }}
          >
            {formatScore(displayScore, scoringMode)}
          </span>
        </div>
      )}

      {/* Hover hint */}
      <span className="font-body text-xs text-rani-gold-accessible opacity-0 group-hover:opacity-100 transition-opacity">
        View details
      </span>
    </motion.button>
  );
}
