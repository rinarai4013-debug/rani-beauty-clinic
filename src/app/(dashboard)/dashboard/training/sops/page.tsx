'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ClipboardList, Search, FileText, Calendar, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { SOPS, SOP_CATEGORIES, SOP_CATEGORY_COLORS } from '@/data/training/sops';
import type { SOP } from '@/data/training/sops';

type CategoryKey = SOP['category'] | 'all';

export default function SOPLibraryPage() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSOPs = SOPS.filter(sop => {
    const matchesCategory = selectedCategory === 'all' || sop.category === selectedCategory;
    const matchesSearch = searchQuery === '' ||
      sop.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sop.steps.some(s => s.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const categories = Object.entries(SOP_CATEGORIES) as [SOP['category'], string][];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/training"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-2"
        >
          <ArrowLeft className="w-4 h-4" /> Training Center
        </Link>
        <h1 className="text-2xl font-bold text-[#0F1D2C] font-['Playfair_Display']">
          Standard Operating Procedures
        </h1>
        <p className="text-gray-500 mt-1">
          {SOPS.length} SOPs across {categories.length} categories - your guide to consistent, luxury operations
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search SOPs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A96E]/30 focus:border-[#C9A96E]"
        />
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
            selectedCategory === 'all'
              ? 'bg-[#0F1D2C] text-white'
              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          All SOPs
          <span className={`px-1.5 py-0.5 rounded-full text-xs ${
            selectedCategory === 'all' ? 'bg-white/20' : 'bg-gray-100'
          }`}>
            {SOPS.length}
          </span>
        </button>
        {categories.map(([key, label]) => {
          const count = SOPS.filter(s => s.category === key).length;
          return (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                selectedCategory === key
                  ? 'text-white shadow-md'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
              style={selectedCategory === key ? { backgroundColor: SOP_CATEGORY_COLORS[key] } : {}}
            >
              {label}
              <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                selectedCategory === key ? 'bg-white/20' : 'bg-gray-100'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* SOP cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredSOPs.map((sop, idx) => (
          <motion.div
            key={sop.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Link href={`/dashboard/training/sops/${sop.id}`}>
              <div className="bg-white rounded-xl border border-gray-200 p-6 hover:border-[#C9A96E]/40 hover:shadow-md transition-all cursor-pointer group">
                <div className="flex items-start justify-between mb-3">
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full text-white"
                    style={{ backgroundColor: SOP_CATEGORY_COLORS[sop.category] }}
                  >
                    {SOP_CATEGORIES[sop.category]}
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#C9A96E] transition-colors" />
                </div>

                <h3 className="text-lg font-semibold text-[#0F1D2C] mb-2 font-['Playfair_Display']">
                  {sop.title}
                </h3>

                <div className="flex items-center gap-4 text-xs text-gray-400 mb-3">
                  <span className="flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" />
                    {sop.steps.length} steps
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Updated {new Date(sop.lastUpdated).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>

                {/* Preview first 2 steps */}
                <div className="space-y-1.5">
                  {sop.steps.slice(0, 2).map(step => (
                    <p key={step.step} className="text-xs text-gray-500 flex gap-2">
                      <span className="font-bold text-gray-400 shrink-0">{step.step}.</span>
                      <span className="line-clamp-1">{step.description}</span>
                    </p>
                  ))}
                  {sop.steps.length > 2 && (
                    <p className="text-xs text-[#C9A96E] font-medium">
                      +{sop.steps.length - 2} more steps...
                    </p>
                  )}
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {filteredSOPs.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No SOPs match your search.</p>
        </div>
      )}
    </div>
  );
}
