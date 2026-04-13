'use client';

import type { CSSProperties } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, ArrowRight } from 'lucide-react';
import type { CareerLevel, CareerPath } from '@/types/providers';

interface CareerPathVisualizationProps {
  careerPath: CareerPath;
}

const LEVEL_LABELS: Record<CareerLevel, string> = {
  associate: 'Associate',
  provider: 'Provider',
  senior: 'Senior Provider',
  lead: 'Lead Provider',
  director: 'Director',
};

const LEVEL_COLORS: Record<CareerLevel, string> = {
  associate: '#9CA3AF',
  provider: '#3B82F6',
  senior: '#C9A96E',
  lead: '#7C3AED',
  director: '#0F1D2C',
};

export default function CareerPathVisualization({ careerPath }: CareerPathVisualizationProps) {
  const levels: CareerLevel[] = ['associate', 'provider', 'senior', 'lead', 'director'];
  const currentIndex = levels.indexOf(careerPath.currentLevel);

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <h3 className="font-display font-semibold text-rani-navy mb-4">Career Path</h3>

      {/* Level progression */}
      <div className="flex items-center justify-between mb-6 overflow-x-auto">
        {levels.map((level, i) => {
          const isPast = i < currentIndex;
          const isCurrent = i === currentIndex;
          const isFuture = i > currentIndex;
          const color = LEVEL_COLORS[level];

          return (
            <div key={level} className="flex items-center">
              <div className="flex flex-col items-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isPast ? 'bg-green-100' : isCurrent ? 'ring-2 ring-offset-2' : 'bg-gray-100'
                  }`}
                  style={
                    isCurrent
                      ? ({ backgroundColor: `${color}20`, boxShadow: `0 0 0 2px ${color}` } as CSSProperties)
                      : isPast ? {} : {}
                  }
                >
                  {isPast ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <Circle className={`w-4 h-4 ${isCurrent ? '' : 'text-gray-300'}`} style={isCurrent ? { color } : {}} />
                  )}
                </motion.div>
                <span className={`text-[10px] mt-1 font-body text-center whitespace-nowrap ${
                  isCurrent ? 'font-semibold text-rani-navy' : isFuture ? 'text-gray-300' : 'text-rani-muted'
                }`}>
                  {LEVEL_LABELS[level]}
                </span>
              </div>
              {i < levels.length - 1 && (
                <ArrowRight className={`w-4 h-4 mx-1 ${i < currentIndex ? 'text-green-400' : 'text-gray-200'}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Next level requirements */}
      {careerPath.nextLevel && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-body font-semibold text-rani-navy">
              Path to {LEVEL_LABELS[careerPath.nextLevel]}
            </h4>
            <span className="text-xs font-body text-rani-gold font-semibold">{careerPath.progressPercent}% complete</span>
          </div>

          <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
            <motion.div
              className="h-full rounded-full bg-rani-gold"
              initial={{ width: 0 }}
              animate={{ width: `${careerPath.progressPercent}%` }}
              transition={{ duration: 0.8 }}
            />
          </div>

          <div className="space-y-2">
            {careerPath.requirements.map((req, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${req.met ? 'bg-green-50' : 'bg-gray-50'}`}>
                  {req.met ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                  ) : (
                    <Circle className="w-3 h-3 text-gray-300" />
                  )}
                </div>
                <span className={`font-body ${req.met ? 'text-rani-muted line-through' : 'text-rani-navy'}`}>
                  {req.description}
                </span>
              </div>
            ))}
          </div>

          {careerPath.estimatedPromotion && (
            <p className="text-xs text-rani-muted font-body mt-3 pt-2 border-t border-gray-50">
              Estimated promotion: {new Date(careerPath.estimatedPromotion).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </p>
          )}
        </div>
      )}

      {!careerPath.nextLevel && (
        <p className="text-sm text-rani-muted font-body text-center py-4">
          Highest level reached — congratulations!
        </p>
      )}
    </div>
  );
}
