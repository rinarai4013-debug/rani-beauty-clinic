'use client';

import { motion } from 'framer-motion';
import type { AuraConcern } from '@/types/mastermind';

interface ConcernCardsProps {
  concerns: AuraConcern[];
}

function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'mild': return '#059669';
    case 'moderate': return '#C9A96E';
    case 'severe': return '#DC2626';
    default: return '#6B7280';
  }
}

function getUrgencyBadge(urgency: string): { bg: string; text: string } {
  switch (urgency) {
    case 'high': return { bg: 'bg-red-50 border-red-200', text: 'text-red-700' };
    case 'medium': return { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700' };
    default: return { bg: 'bg-green-50 border-green-200', text: 'text-green-700' };
  }
}

export default function ConcernCards({ concerns }: ConcernCardsProps) {
  const sorted = [...concerns].sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-4">
      <h3 className="font-heading text-lg text-[#0F1D2C]">
        Detected Concerns
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sorted.map((concern, i) => {
          const urgencyStyle = getUrgencyBadge(concern.urgency);
          return (
            <motion.div
              key={concern.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className="p-4 rounded-2xl border border-[#E8E4DF] bg-white hover:shadow-md transition-shadow"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: getSeverityColor(concern.severity) }}
                  />
                  <h4 className="font-body text-sm font-semibold text-[#0F1D2C] capitalize">
                    {concern.concern.replace(/_/g, ' ')}
                  </h4>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full font-body text-xs font-medium border ${urgencyStyle.bg} ${urgencyStyle.text}`}
                >
                  {concern.urgency}
                </span>
              </div>

              {/* Score bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-body text-xs text-[#0F1D2C]/40">Severity</span>
                  <span className="font-body text-xs font-semibold text-[#0F1D2C]">
                    {concern.score}/100
                  </span>
                </div>
                <div className="h-2 rounded-full bg-[#F8F6F1] overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${concern.score}%` }}
                    transition={{ delay: i * 0.1 + 0.3, duration: 0.6 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: getSeverityColor(concern.severity) }}
                  />
                </div>
              </div>

              {/* Description */}
              <p className="font-body text-xs text-[#0F1D2C]/60 leading-relaxed">
                {concern.description}
              </p>

              {/* Zones */}
              {concern.zones.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {concern.zones.map((zone) => (
                    <span
                      key={zone}
                      className="px-2 py-0.5 rounded-md bg-[#F8F6F1] font-body text-xs text-[#0F1D2C]/50"
                    >
                      {zone.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
