'use client';

import { motion } from 'framer-motion';
import { Sparkles, ShoppingBag, UserPlus, Droplets, Crown } from 'lucide-react';
import type { RealTimeSuggestion } from '@/types/ai-treatment';

interface CopilotSuggestionProps {
  suggestions: RealTimeSuggestion[];
  onSelect?: (_suggestion: RealTimeSuggestion) => void;
}

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string }> = {
  treatment: { icon: Sparkles, color: 'border-[#C9A96E]/30 bg-[#C9A96E]/5' },
  addon: { icon: ShoppingBag, color: 'border-blue-200 bg-blue-50' },
  upgrade: { icon: Crown, color: 'border-purple-200 bg-purple-50' },
  skincare: { icon: Droplets, color: 'border-green-200 bg-green-50' },
  membership: { icon: UserPlus, color: 'border-amber-200 bg-amber-50' },
};

export default function CopilotSuggestion({ suggestions, onSelect }: CopilotSuggestionProps) {
  return (
    <div className="space-y-3">
      {suggestions.map((sug, i) => {
        const config = TYPE_CONFIG[sug.type] || TYPE_CONFIG.treatment;
        const Icon = config.icon;

        return (
          <motion.div
            key={sug.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`border rounded-xl p-4 cursor-pointer hover:shadow-md transition-all ${config.color}`}
            onClick={() => onSelect?.(sug)}
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <Icon className="w-4 h-4 text-[#C9A96E]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h4 className="font-montserrat font-semibold text-sm text-[#0F1D2C] truncate">{sug.title}</h4>
                  <span className="text-xs font-montserrat text-[#C9A96E] font-semibold flex-shrink-0">
                    {sug.relevanceScore}%
                  </span>
                </div>
                <p className="text-sm font-montserrat text-[#0F1D2C]/60">{sug.suggestion}</p>
                <p className="text-xs font-montserrat text-[#0F1D2C]/40 mt-1">{sug.reasoning}</p>
                <div className="mt-2">
                  <span className={`text-xs font-montserrat px-2 py-0.5 rounded-full ${
                    sug.timing === 'now' ? 'bg-green-100 text-green-700' :
                    sug.timing === 'later_in_consult' ? 'bg-amber-100 text-amber-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {sug.timing === 'now' ? 'Suggest Now' : sug.timing === 'later_in_consult' ? 'Later in Consult' : 'Follow-Up'}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
