'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Search, CheckCircle2, Clock, Users, ChevronDown, ChevronUp } from 'lucide-react';
import type { Policy } from '@/types/compliance';

interface PolicyLibraryProps {
  policies: Policy[];
}

export default function PolicyLibrary({ policies }: PolicyLibraryProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [expandedPolicy, setExpandedPolicy] = useState<string | null>(null);

  const filteredPolicies = policies.filter((p) => {
    if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q);
    }
    return true;
  });

  const categories = [...new Set(policies.map((p) => p.category))];

  const categoryLabels: Record<string, string> = {
    hipaa: 'HIPAA',
    osha: 'OSHA',
    clinical: 'Clinical',
    administrative: 'Administrative',
    emergency: 'Emergency',
    infection_control: 'Infection Control',
    hr: 'HR',
    financial: 'Financial',
  };

  const statusColors: Record<string, string> = {
    active: 'bg-emerald-50 text-emerald-600',
    draft: 'bg-blue-50 text-blue-600',
    under_review: 'bg-amber-50 text-amber-600',
    archived: 'bg-gray-100 text-gray-500',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
            <FileText className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h2 className="text-lg font-body font-bold text-rani-navy">Policy Library</h2>
            <p className="text-xs font-body text-rani-muted">{policies.length} policies on file</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rani-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search policies..."
              className="w-full h-9 pl-9 pr-4 rounded-lg bg-rani-cream/60 border border-rani-border/50 text-sm font-body focus:outline-none focus:ring-2 focus:ring-rani-gold/30"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-9 px-3 rounded-lg border border-rani-border text-sm font-body focus:outline-none focus:ring-2 focus:ring-rani-gold/30"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{categoryLabels[c] || c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Policies */}
      <div className="space-y-3">
        {filteredPolicies.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-8 text-center">
            <FileText className="w-10 h-10 text-rani-muted mx-auto mb-3" />
            <p className="text-sm font-body text-rani-muted">No policies match your filters</p>
          </div>
        ) : (
          filteredPolicies.map((policy) => {
            const isExpanded = expandedPolicy === policy.id;
            const acknowledged = policy.acknowledgments.length;
            const needsReview = new Date(policy.nextReviewDate) <= new Date();

            return (
              <motion.div
                key={policy.id}
                layout
                className={`bg-white/80 backdrop-blur-sm rounded-xl border overflow-hidden ${
                  needsReview ? 'border-amber-200' : 'border-rani-border'
                }`}
              >
                <button
                  onClick={() => setExpandedPolicy(isExpanded ? null : policy.id)}
                  className="w-full text-left px-5 py-4 flex items-center justify-between hover:bg-rani-cream/20 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="w-5 h-5 text-rani-muted flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-body font-medium text-rani-navy truncate">{policy.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-body text-rani-muted capitalize">
                          {categoryLabels[policy.category] || policy.category}
                        </span>
                        <span className="text-[10px] font-body text-rani-muted">v{policy.version}</span>
                        <span className={`text-[10px] font-body font-medium px-1.5 py-0.5 rounded-full ${statusColors[policy.status]}`}>
                          {policy.status.replace('_', ' ')}
                        </span>
                        {needsReview && (
                          <span className="text-[10px] font-body font-medium px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                            Review Due
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                    <div className="flex items-center gap-1 text-xs font-body text-rani-muted">
                      <Users className="w-3 h-3" />
                      {acknowledged}
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-rani-muted" /> : <ChevronDown className="w-4 h-4 text-rani-muted" />}
                  </div>
                </button>

                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="px-5 pb-5 space-y-4 border-t border-rani-border/30"
                  >
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
                      <div>
                        <p className="text-[10px] font-body text-rani-muted uppercase">Effective Date</p>
                        <p className="text-sm font-body text-rani-navy">{policy.effectiveDate}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-body text-rani-muted uppercase">Last Review</p>
                        <p className="text-sm font-body text-rani-navy">{policy.lastReviewDate}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-body text-rani-muted uppercase">Next Review</p>
                        <p className={`text-sm font-body ${needsReview ? 'text-red-600 font-medium' : 'text-rani-navy'}`}>
                          {policy.nextReviewDate}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-body text-rani-muted uppercase">Approved By</p>
                        <p className="text-sm font-body text-rani-navy">{policy.approvedBy}</p>
                      </div>
                    </div>

                    {/* Acknowledgments */}
                    {policy.acknowledgments.length > 0 && (
                      <div>
                        <p className="text-[10px] font-body font-semibold uppercase tracking-wider text-rani-muted mb-2">
                          Staff Acknowledgments ({policy.acknowledgments.length})
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {policy.acknowledgments.map((ack) => (
                            <div key={ack.staffId} className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 rounded-lg">
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                              <span className="text-[10px] font-body text-emerald-700">{ack.staffName}</span>
                              <span className="text-[10px] font-body text-emerald-500">{ack.acknowledgedDate}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Change Log */}
                    {policy.changeLog.length > 0 && (
                      <div>
                        <p className="text-[10px] font-body font-semibold uppercase tracking-wider text-rani-muted mb-2">
                          Version History
                        </p>
                        <div className="space-y-1.5">
                          {policy.changeLog.slice(0, 5).map((change, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs font-body text-rani-muted">
                              <Clock className="w-3 h-3 flex-shrink-0" />
                              <span className="font-medium">v{change.version}</span>
                              <span>{change.changes}</span>
                              <span className="ml-auto text-[10px]">{change.date}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
