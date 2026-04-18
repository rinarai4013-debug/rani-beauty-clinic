'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, FileText, DollarSign, Clock, ChevronRight, Filter } from 'lucide-react';
import { DashboardErrorBoundary } from '@/components/dashboard/shared';
import { useProtocols } from '@/hooks/useAITreatmentData';

const CATEGORY_LABELS: Record<string, string> = {
  injectable_neurotoxin: 'Botox / Neurotoxin',
  injectable_filler: 'Dermal Fillers',
  rf_microneedling: 'RF Microneedling',
  skin_tightening: 'Sofwave',
  laser_hair_removal: 'Laser Hair Removal',
  chemical_peel: 'Chemical Peels',
  facial: 'HydraFacial',
  glp1: 'GLP-1 Weight Loss',
  peptide_therapy: 'Peptide Therapy',
  nad_injection: 'NAD+ Injection',
  hrt: 'Hormone Therapy',
};

export default function ProtocolsPage() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const { data, isLoading } = useProtocols();

  const protocols = data?.protocols || [];
  const categories = data?.categories || [];

  const filtered = useMemo(() => {
    return protocols.filter(p => {
      const matchesSearch = search === '' ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.indication.some((i: string) => i.toLowerCase().includes(search.toLowerCase()));
      const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [protocols, search, categoryFilter]);

  return (
    <DashboardErrorBoundary>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-playfair text-[#0F1D2C] flex items-center gap-2">
            <FileText className="w-6 h-6 text-rani-gold-accessible" />
            Clinical Protocol Library
          </h1>
          <p className="text-sm text-[#0F1D2C]/60 font-montserrat mt-1">
            {protocols.length} detailed treatment protocols
          </p>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0F1D2C]/30" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search protocols by name or indication..."
              className="w-full pl-10 pr-4 py-2.5 border border-[#F8F6F1] rounded-xl text-sm font-montserrat focus:border-[#C9A96E] focus:outline-none"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0F1D2C]/30" />
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="pl-10 pr-8 py-2.5 border border-[#F8F6F1] rounded-xl text-sm font-montserrat focus:border-[#C9A96E] focus:outline-none appearance-none bg-white"
            >
              <option value="all">All Categories</option>
              {categories.map((cat: { category: string; count: number; label: string }) => (
                <option key={cat.category} value={cat.category}>
                  {cat.label} ({cat.count})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Category Chips */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-4 py-1.5 rounded-full text-xs font-montserrat transition-all ${
              categoryFilter === 'all' ? 'bg-[#0F1D2C] text-white' : 'bg-[#F8F6F1] text-[#0F1D2C]/60 hover:bg-[#C9A96E]/10'
            }`}
          >
            All ({protocols.length})
          </button>
          {categories.map((cat: { category: string; count: number; label: string }) => (
            <button
              key={cat.category}
              onClick={() => setCategoryFilter(cat.category)}
              className={`px-4 py-1.5 rounded-full text-xs font-montserrat transition-all ${
                categoryFilter === cat.category ? 'bg-[#C9A96E] text-white' : 'bg-[#F8F6F1] text-[#0F1D2C]/60 hover:bg-[#C9A96E]/10'
              }`}
            >
              {cat.label} ({cat.count})
            </button>
          ))}
        </div>

        {/* Protocol List */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-[#F8F6F1] p-4 animate-pulse">
                <div className="h-5 bg-[#F8F6F1] rounded w-1/3 mb-2" />
                <div className="h-4 bg-[#F8F6F1] rounded w-2/3 mb-3" />
                <div className="flex gap-4">
                  <div className="h-3 bg-[#F8F6F1] rounded w-16" />
                  <div className="h-3 bg-[#F8F6F1] rounded w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((protocol) => (
              <Link key={protocol.id} href={`/dashboard/protocols/${protocol.id}`}>
                <motion.div
                  className="bg-white rounded-xl border border-[#F8F6F1] p-4 hover:shadow-md hover:border-[#C9A96E]/30 transition-all cursor-pointer group"
                  whileHover={{ y: -1 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-montserrat text-rani-gold-accessible uppercase tracking-wide">
                          {CATEGORY_LABELS[protocol.category] || protocol.category}
                        </span>
                        <span className="text-xs text-[#0F1D2C]/30">v{protocol.version}</span>
                      </div>
                      <h3 className="font-montserrat font-semibold text-[#0F1D2C] group-hover:text-[#C9A96E] transition-colors truncate">
                        {protocol.name}
                      </h3>
                      <p className="text-xs text-[#0F1D2C]/50 font-montserrat mt-1 line-clamp-1">
                        {protocol.indication.join(' | ')}
                      </p>
                      <div className="flex gap-4 mt-2 text-xs font-montserrat text-[#0F1D2C]/40">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {protocol.technique.duration} min
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" /> ${protocol.pricing.basePrice}
                          {protocol.pricing.priceRange ? `–$${protocol.pricing.priceRange.max}` : ''}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[#0F1D2C]/20 group-hover:text-[#C9A96E] transition-colors" />
                  </div>
                </motion.div>
              </Link>
            ))}

            {filtered.length === 0 && (
              <div className="text-center py-12">
                <FileText className="w-10 h-10 text-[#0F1D2C]/10 mx-auto mb-3" />
                <p className="text-sm text-[#0F1D2C]/40 font-montserrat">No protocols found matching your search.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardErrorBoundary>
  );
}
