'use client';

import { motion } from 'framer-motion';
import { Star, Clock, ChevronRight } from 'lucide-react';
import type { ProviderInfo } from '@/types/mobile';

interface ProviderCardProps {
  provider: ProviderInfo;
  selected?: boolean;
  onSelect?: (_providerId: string) => void;
}

export default function ProviderCard({ provider, selected, onSelect }: ProviderCardProps) {
  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect?.(provider.id)}
      className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
        selected
          ? 'bg-rani-navy/5 border-[#C9A96E] shadow-sm'
          : 'bg-white border-rani-border/30'
      }`}
    >
      {/* Avatar */}
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#C9A96E]/20 to-rani-cream flex items-center justify-center flex-shrink-0">
        {provider.avatar ? (
          <img
            src={provider.avatar}
            alt={provider.name}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <span className="text-lg font-heading font-bold text-[#C9A96E]">
            {provider.name.charAt(0)}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h4 className="font-heading text-rani-navy text-sm font-semibold">{provider.name}</h4>
        <p className="text-xs text-rani-muted font-body">{provider.title}</p>

        <div className="flex items-center gap-3 mt-1">
          <div className="flex items-center gap-1">
            <Star size={10} className="text-amber-400 fill-amber-400" />
            <span className="text-[10px] text-rani-text font-body">
              {provider.rating} ({provider.reviewCount})
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Clock size={10} className="text-[#C9A96E]" />
            <span className="text-[10px] text-rani-muted font-body">
              Next: {provider.nextAvailable}
            </span>
          </div>
        </div>
      </div>

      {selected ? (
        <div className="w-5 h-5 rounded-full bg-[#C9A96E] flex items-center justify-center flex-shrink-0">
          <div className="w-2 h-2 rounded-full bg-white" />
        </div>
      ) : (
        <ChevronRight size={16} className="text-rani-muted flex-shrink-0" />
      )}
    </motion.div>
  );
}
