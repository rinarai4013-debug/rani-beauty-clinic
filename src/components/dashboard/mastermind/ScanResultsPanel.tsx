'use client';

import { useState, useCallback } from 'react';
import type { MastermindSession, SkinAnalysisCategory, CategoryScore } from '@/types/mastermind';
import AuraScoreGauge from '@/components/aura-scan/AuraScoreGauge';
import SkinAnalysisGrid from '@/components/aura-scan/SkinAnalysisGrid';
import ZoneDetailPanel from '@/components/aura-scan/ZoneDetailPanel';

interface ScanResultsPanelProps {
  session: MastermindSession;
}

export default function ScanResultsPanel({ session }: ScanResultsPanelProps) {
  const scan = session.auraScanResult;
  const [selectedCategory, setSelectedCategory] = useState<CategoryScore | null>(null);

  const handleCategoryClick = useCallback(
    (category: SkinAnalysisCategory) => {
      if (!scan) return;
      const found = scan.auraDeviceAnalysis.categories.find(
        (c) => c.category === category
      );
      if (found) setSelectedCategory(found);
    },
    [scan]
  );

  if (!scan) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-[#F8F6F1] flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-[#0F1D2C]/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
          </svg>
        </div>
        <h3 className="font-body text-sm font-medium text-[#0F1D2C]/60">
          No Scan Results Yet
        </h3>
        <p className="font-body text-xs text-[#0F1D2C]/40 mt-1">
          The Aura Skin Scan has not been completed for this patient.
        </p>
      </div>
    );
  }

  const relatedConcerns = selectedCategory
    ? scan.detectedConcerns.filter(
        (c) =>
          c.concern === selectedCategory.category ||
          c.concern.replace(/_/g, '') === selectedCategory.category.toLowerCase()
      )
    : [];

  return (
    <div className="space-y-6">
      {/* Aura Score - Compact */}
      <div className="flex justify-center">
        <AuraScoreGauge score={scan.auraScore} size="sm" animate={false} />
      </div>

      {/* AURA-style Grid */}
      <SkinAnalysisGrid
        analysis={scan.auraDeviceAnalysis}
        onCategoryClick={handleCategoryClick}
      />

      {/* Top Concerns Quick List */}
      <div className="space-y-2">
        <h3 className="font-body text-xs font-semibold text-[#0F1D2C]/70 uppercase tracking-wide">
          Top Concerns
        </h3>
        {scan.detectedConcerns.slice(0, 4).map((concern) => (
          <div
            key={concern.id}
            className="flex items-center justify-between py-2 border-b border-[#E8E4DF] last:border-0"
          >
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor:
                    concern.severity === 'severe' ? '#DC2626' : concern.severity === 'moderate' ? '#C9A96E' : '#059669',
                }}
              />
              <span className="font-body text-xs text-[#0F1D2C] capitalize">
                {concern.concern.replace(/_/g, ' ')}
              </span>
            </div>
            <span className="font-body text-xs text-[#0F1D2C]/40">
              {concern.score}/100
            </span>
          </div>
        ))}
      </div>

      {/* Zone Detail Panel */}
      <ZoneDetailPanel
        category={selectedCategory}
        relatedConcerns={relatedConcerns}
        onClose={() => setSelectedCategory(null)}
      />
    </div>
  );
}
