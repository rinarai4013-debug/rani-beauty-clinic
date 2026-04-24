'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import type { ServiceCategory } from '@/data/services/unified-catalog';
import { SERVICE_CATEGORIES } from '@/data/services/unified-catalog';

interface CatalogSearchProps {
  query: string;
  category: ServiceCategory | 'all';
  onSearch: (_q: string) => void;
  onCategoryChange: (_cat: ServiceCategory | 'all') => void;
}

export default function CatalogSearch({
  query,
  category,
  onSearch,
  onCategoryChange,
}: CatalogSearchProps) {
  const [localQuery, setLocalQuery] = useState(query);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onSearch(localQuery);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [localQuery, onSearch]);

  // Sync external query changes
  useEffect(() => {
    setLocalQuery(query);
  }, [query]);

  const allCategories: { id: ServiceCategory | 'all'; label: string }[] = [
    { id: 'all', label: 'All' },
    ...SERVICE_CATEGORIES.map((c) => ({ id: c.id, label: c.label })),
  ];

  return (
    <div className="space-y-3">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          placeholder="Search services..."
          className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-gray-200 bg-white text-sm text-[#0F1D2C] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]/40 focus:border-[#C9A96E] transition-colors"
        />
        {localQuery && (
          <button
            onClick={() => {
              setLocalQuery('');
              onSearch('');
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Category tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-thin">
        {allCategories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onCategoryChange(cat.id)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              category === cat.id
                ? 'bg-[#0F1D2C] text-[#C9A96E]'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>
    </div>
  );
}
