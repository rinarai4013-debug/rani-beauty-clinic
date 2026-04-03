'use client';

import { motion } from 'framer-motion';
import { Target } from 'lucide-react';
import { useDashboardData } from '@/hooks/useDashboardData';

interface Challenge {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  xpReward: number;
  emoji: string;
  completed: boolean;
}

export default function DailyChallenges() {
  const { data, isLoading } = useDashboardData<{ challenges: Challenge[] }>('/gamification/challenges', {
    refreshInterval: 30000,
  });
  const challenges = data?.challenges ?? [];

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-4 h-4 text-rani-gold" />
        <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider">
          Daily Challenges
        </h3>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-rani-cream/50 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : challenges.length === 0 ? (
        <p className="text-sm font-body text-rani-muted italic">Loading challenges...</p>
      ) : (
        <div className="space-y-3">
          {challenges.map((challenge, i) => (
            <motion.div
              key={challenge.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`p-3 rounded-lg border ${challenge.completed ? 'bg-green-50 border-green-200' : 'bg-rani-cream/50 border-rani-border'}`}
            >
              <div className="flex items-start gap-3">
                <span className="text-lg">{challenge.completed ? '\u2705' : challenge.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm font-body font-medium ${challenge.completed ? 'text-green-700 line-through' : 'text-rani-text'}`}>
                      {challenge.title}
                    </p>
                    <span className="text-xs font-body text-rani-gold font-semibold">
                      +{challenge.xpReward} XP
                    </span>
                  </div>
                  <p className="text-xs font-body text-rani-muted mt-0.5">{challenge.description}</p>
                  {/* Progress bar */}
                  {!challenge.completed && (
                    <div className="mt-2">
                      <div className="flex justify-between text-[10px] font-body text-rani-muted mb-1">
                        <span>{challenge.current} / {challenge.target}</span>
                        <span>{Math.round((challenge.current / challenge.target) * 100)}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min((challenge.current / challenge.target) * 100, 100)}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          className="h-full bg-gradient-to-r from-rani-gold to-rani-gold-light rounded-full"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
