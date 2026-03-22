'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Clock, Check } from 'lucide-react';
import {
  UNIFIED_CATALOG,
  CATEGORY_LABELS,
  SERVICE_CATEGORIES,
  type ServiceCategory,
  type UnifiedService,
} from '@/data/services/unified-catalog';

interface ServiceCardGridProps {
  selectedIds: string[];
  onToggle: (id: string) => void;
  filter?: ServiceCategory;
}

function formatPrice(service: UnifiedService): string {
  return `$${service.price.toLocaleString()}`;
}

function formatDuration(minutes: number): string {
  if (minutes === 0) return '';
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default function ServiceCardGrid({
  selectedIds,
  onToggle,
  filter,
}: ServiceCardGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<
    ServiceCategory | 'all'
  >(filter || 'all');

  const filteredServices = useMemo(() => {
    let services = UNIFIED_CATALOG;

    // Category filter
    if (filter) {
      services = services.filter((s) => s.category === filter);
    } else if (activeCategory !== 'all') {
      services = services.filter((s) => s.category === activeCategory);
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      services = services.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.category.includes(q)
      );
    }

    return services;
  }, [searchQuery, activeCategory, filter]);

  // Get categories that have services (for filter bar)
  const availableCategories = useMemo(() => {
    if (filter) return []; // No filter bar when pre-filtered
    const cats = new Set(UNIFIED_CATALOG.map((s) => s.category));
    return SERVICE_CATEGORIES.filter((c) => cats.has(c.id));
  }, [filter]);

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0F1D2C]/30" />
          <input
            type="text"
            placeholder="Search treatments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="
              w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F8F6F1] border border-[#C9A96E]/20
              font-body text-sm text-[#0F1D2C] placeholder:text-[#0F1D2C]/30
              focus:border-[#C9A96E] focus:ring-2 focus:ring-[#C9A96E]/20 outline-none
              transition-all duration-200
            "
          />
        </div>

        {/* Category Filter Chips */}
        {availableCategories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveCategory('all')}
              className={`
                px-3 py-1.5 rounded-full font-body text-xs font-medium transition-all duration-200
                ${
                  activeCategory === 'all'
                    ? 'bg-[#0F1D2C] text-white'
                    : 'bg-[#F8F6F1] text-[#0F1D2C]/60 hover:bg-[#0F1D2C]/10 border border-[#0F1D2C]/10'
                }
              `}
            >
              All
            </button>
            {availableCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`
                  px-3 py-1.5 rounded-full font-body text-xs font-medium transition-all duration-200
                  ${
                    activeCategory === cat.id
                      ? 'bg-[#0F1D2C] text-white'
                      : 'bg-[#F8F6F1] text-[#0F1D2C]/60 hover:bg-[#0F1D2C]/10 border border-[#0F1D2C]/10'
                  }
                `}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Results Count */}
      <p className="font-body text-xs text-[#0F1D2C]/40">
        {filteredServices.length} treatment{filteredServices.length !== 1 ? 's' : ''}
        {selectedIds.length > 0 && (
          <span className="text-[#C9A96E] font-medium">
            {' '}
            &middot; {selectedIds.length} selected
          </span>
        )}
      </p>

      {/* Service Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        <AnimatePresence mode="popLayout">
          {filteredServices.map((service, i) => {
            const isSelected = selectedIds.includes(service.id);
            return (
              <motion.button
                key={service.id}
                type="button"
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: Math.min(i * 0.02, 0.3), duration: 0.25 }}
                onClick={() => onToggle(service.id)}
                className={`
                  relative flex flex-col p-3 rounded-2xl border-2 text-left transition-all duration-300 cursor-pointer
                  ${
                    isSelected
                      ? 'border-[#C9A96E] bg-[#C9A96E]/5 shadow-md'
                      : 'border-[#0F1D2C]/8 bg-white hover:border-[#C9A96E]/30 hover:shadow-sm'
                  }
                `}
              >
                {/* Category Badge */}
                <span
                  className={`
                    inline-flex self-start px-2 py-0.5 rounded-full font-body text-[10px] font-medium mb-2
                    ${
                      isSelected
                        ? 'bg-[#C9A96E]/15 text-[#C9A96E]'
                        : 'bg-[#F8F6F1] text-[#0F1D2C]/40'
                    }
                  `}
                >
                  {CATEGORY_LABELS[service.category] || service.category}
                </span>

                {/* Service Name */}
                <h4
                  className={`font-body text-sm font-semibold leading-tight mb-2 transition-colors duration-300 ${
                    isSelected ? 'text-[#0F1D2C]' : 'text-[#0F1D2C]/80'
                  }`}
                >
                  {service.name}
                </h4>

                {/* Price & Duration */}
                <div className="mt-auto flex items-center justify-between pt-2 border-t border-[#0F1D2C]/5">
                  <span
                    className={`font-body text-sm font-bold ${
                      isSelected ? 'text-[#C9A96E]' : 'text-[#0F1D2C]/70'
                    }`}
                  >
                    {formatPrice(service)}
                  </span>
                  {service.duration > 0 && (
                    <span className="flex items-center gap-1 font-body text-[10px] text-[#0F1D2C]/40">
                      <Clock className="w-3 h-3" />
                      {formatDuration(service.duration)}
                    </span>
                  )}
                </div>

                {/* Selected Indicator */}
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: 'spring',
                      stiffness: 300,
                      damping: 20,
                    }}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#C9A96E] flex items-center justify-center shadow-sm"
                  >
                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredServices.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center py-12"
        >
          <Search className="w-8 h-8 text-[#0F1D2C]/20 mb-3" />
          <p className="font-body text-sm text-[#0F1D2C]/40">
            No treatments match your search
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setActiveCategory('all');
            }}
            className="mt-2 font-body text-xs text-[#C9A96E] hover:underline"
          >
            Clear filters
          </button>
        </motion.div>
      )}
    </div>
  );
}
