'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { AuraDeviceAnalysis, ScoringMode, SkinAnalysisCategory } from '@/types/mastermind';
import AnalysisCard from './AnalysisCard';
import ScoringToggle from './ScoringToggle';

interface SkinAnalysisGridProps {
  analysis: AuraDeviceAnalysis;
  patientPhotos?: string[]; // Photo URLs for each analysis view
  onCategoryClick?: (_category: SkinAnalysisCategory) => void;
}

/**
 * 2x3 grid matching the AURA scanner layout:
 * Row 1: Neutral | Wrinkles | Texture
 * Row 2: Brown Spots | Red Areas | Pores
 */
export default function SkinAnalysisGrid({
  analysis,
  patientPhotos = [],
  onCategoryClick,
}: SkinAnalysisGridProps) {
  const [scoringMode, setScoringMode] = useState<ScoringMode>(analysis.scoringMode);

  // Build the "Neutral" pseudo-card (no score, just baseline photo)
  const neutralCard = {
    category: 'neutral' as SkinAnalysisCategory,
    label: 'Neutral',
    absoluteScore: 0,
    peerScore: 0,
    severity: 'mild' as const,
    description: 'Baseline photo — no analysis overlay.',
  };

  // Arrange in AURA scanner order
  const wrinkles = analysis.categories.find(c => c.category === 'wrinkles');
  const texture = analysis.categories.find(c => c.category === 'texture');
  const brownSpots = analysis.categories.find(c => c.category === 'brownSpots');
  const redAreas = analysis.categories.find(c => c.category === 'redAreas');
  const pores = analysis.categories.find(c => c.category === 'pores');

  const row1 = [neutralCard, wrinkles, texture].filter(Boolean);
  const row2 = [brownSpots, redAreas, pores].filter(Boolean);
  const allCards = [...row1, ...row2];

  return (
    <div className="space-y-5">
      {/* Header: Scoring toggle + Skin Score */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="font-heading text-lg text-[#0F1D2C]">
            Skin Analysis
          </h3>
          {scoringMode === 'peerComparative' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C9A96E]/10 border border-[#C9A96E]/20"
            >
              <span className="font-body text-xs text-[#0F1D2C]/60">Skin Score</span>
              <span className="font-body text-sm font-bold text-[#C9A96E]">
                {analysis.compositeSkinScore.toFixed(1)}
              </span>
            </motion.div>
          )}
        </div>
        <ScoringToggle mode={scoringMode} onChange={setScoringMode} />
      </div>

      {/* Scoring legend */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#F8F6F1] border border-[#E8E4DF]">
        {scoringMode === 'absolute' ? (
          <>
            <span className="font-body text-xs text-[#0F1D2C]/60">mild</span>
            <div className="flex-1 h-2 rounded-full bg-gradient-to-r from-green-400 via-yellow-400 to-red-500" />
            <span className="font-body text-xs text-[#0F1D2C]/60">severe</span>
            <span className="font-body text-xs text-[#0F1D2C]/40 ml-2">not related to age, gender or skin type</span>
          </>
        ) : (
          <>
            <span className="font-body text-xs text-[#059669] font-medium">better</span>
            <div className="flex-1 h-2 rounded-full bg-gradient-to-r from-green-400 via-yellow-400 to-red-500" />
            <span className="font-body text-xs text-[#DC2626] font-medium">worse</span>
            <span className="font-body text-xs text-[#0F1D2C]/40 ml-2">compared to same age, gender &amp; skin type</span>
          </>
        )}
      </div>

      {/* 2x3 Grid */}
      <div className="grid grid-cols-3 gap-4">
        {allCards.map((card, i) => (
          <AnalysisCard
            key={card!.category}
            category={card!}
            scoringMode={scoringMode}
            photoUrl={patientPhotos[i]}
            index={i}
            onClick={
              card!.category !== 'neutral' as string
                ? () => onCategoryClick?.(card!.category as SkinAnalysisCategory)
                : undefined
            }
          />
        ))}
      </div>
    </div>
  );
}
