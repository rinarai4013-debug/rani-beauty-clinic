'use client';

import { motion } from 'framer-motion';
import { BookOpen, Search, AlertTriangle, CheckCircle, Database, FileText, Tag, Clock } from 'lucide-react';
import KPICard from '@/components/dashboard/cards/KPICard';
import ProgressBar from '@/components/dashboard/charts/ProgressBar';
import ProgressRing from '@/components/dashboard/charts/ProgressRing';
import { DashboardErrorBoundary, KPIRowSkeleton, PanelSkeleton, ChartSkeleton, TableSkeleton, SkeletonBar } from '@/components/dashboard/shared';
import DashboardEmptyState from '@/components/dashboard/shared/DashboardEmptyState';
import { InlineError } from '@/components/dashboard/shared';
import { useDashboardData } from '@/hooks/useDashboardData';
import type { KnowledgeBaseStats } from '@/lib/rag/knowledge-base';

interface KBResponse {
  success: boolean;
  data: KnowledgeBaseStats;
}

const CATEGORY_ICONS: Record<string, { icon: React.ElementType; color: string }> = {
  treatment_protocol: { icon: FileText, color: 'text-blue-500' },
  aftercare: { icon: CheckCircle, color: 'text-green-500' },
  faq: { icon: Search, color: 'text-purple-500' },
  consultation_script: { icon: BookOpen, color: 'text-indigo-500' },
  pricing: { icon: Tag, color: 'text-amber-500' },
  policy: { icon: FileText, color: 'text-gray-500' },
  contraindication: { icon: AlertTriangle, color: 'text-red-500' },
  product_info: { icon: Database, color: 'text-cyan-500' },
  training: { icon: BookOpen, color: 'text-orange-500' },
  compliance: { icon: CheckCircle, color: 'text-emerald-500' },
};

const PRIORITY_COLORS: Record<string, string> = {
  high: 'bg-red-50 text-red-700 border-red-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  low: 'bg-green-50 text-green-700 border-green-200',
};

const HEALTH_COLORS: Record<string, string> = {
  healthy: 'bg-green-50 text-green-700',
  stale: 'bg-amber-50 text-amber-700',
  needs_update: 'bg-red-50 text-red-700',
};

export default function KnowledgeBasePage() {
  const { data: raw, isLoading, error, mutate } = useDashboardData<KBResponse>('/knowledge-base');
  const data = raw?.data;

  const totalDocs = data?.totalDocuments || 0;
  const coverage = data?.coverageScore || 0;
  const gaps = data?.knowledgeGaps || [];
  const byCategory = data?.byCategory || {};
  const byService = data?.byService || {};
  const indexHealth = data?.indexHealth || 'needs_update';
  const highGaps = gaps.filter(g => g.priority === 'high').length;

  const hasNoData = !isLoading && !data;

  return (
    <DashboardErrorBoundary pageName="RAG Knowledge Base">
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-heading text-rani-navy">RAG Knowledge Base</h1>
          <p className="text-xs sm:text-sm font-body text-rani-muted mt-1">Treatment protocols, aftercare guides, FAQs, and clinic knowledge for AI-powered responses</p>
        </div>

        {/* Hero KPIs */}
        {error ? (
          <InlineError message="Failed to load knowledge base data" onRetry={() => mutate()} />
        ) : isLoading ? (
          <KPIRowSkeleton />
        ) : hasNoData ? (
          <DashboardEmptyState
            icon="brain"
            title="No knowledge base data available"
            description="Connect your Pinecone vector database and upload treatment documents to power AI responses."
          />
        ) : (
          <>
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-6">
              <KPICard title="Coverage Score" value={coverage} suffix="/100" icon="zap" size="hero" />
              <KPICard title="Total Documents" value={totalDocs} icon="file-text" />
              <KPICard title="Knowledge Gaps" value={gaps.length} icon="alert-triangle" />
              <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-5 flex flex-col justify-center">
                <p className="text-[10px] font-body font-semibold text-rani-muted uppercase tracking-wider mb-2">Index Health</p>
                <span className={`inline-block w-fit px-3 py-1.5 rounded-full text-xs sm:text-sm font-body font-semibold capitalize ${HEALTH_COLORS[indexHealth]}`}>
                  {indexHealth.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* Coverage Ring + Categories */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Coverage by Category */}
              <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-5">
                <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
                  Documents by Category
                </h3>
                {Object.keys(byCategory).length === 0 ? (
                  <DashboardEmptyState
                    icon="file"
                    title="No documents categorized"
                    description="Upload knowledge base documents to see category breakdown."
                    compact
                  />
                ) : (
                  <div className="space-y-3">
                    {Object.entries(byCategory).map(([category, count], i) => {
                      const info = CATEGORY_ICONS[category] || { icon: FileText, color: 'text-gray-500' };
                      const Icon = info.icon;
                      return (
                        <motion.div
                          key={category}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-center gap-3"
                        >
                          <Icon className={`w-4 h-4 ${info.color} flex-shrink-0`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between mb-1">
                              <span className="text-xs font-body font-medium text-rani-navy capitalize truncate mr-2">{category.replace(/_/g, ' ')}</span>
                              <span className="text-xs font-body font-semibold text-rani-navy flex-shrink-0">{count}</span>
                            </div>
                            <ProgressBar current={count as number} target={5} showPercentage={false} height={4} colorMode="gold" />
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Coverage by Service */}
              <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-5">
                <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
                  Documents by Service
                </h3>
                {Object.keys(byService).length === 0 ? (
                  <DashboardEmptyState
                    icon="file"
                    title="No service documents found"
                    description="Upload service-specific knowledge documents to see coverage."
                    compact
                  />
                ) : (
                  <div className="space-y-3">
                    {Object.entries(byService).map(([service, count], i) => (
                      <motion.div
                        key={service}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center justify-between p-3 rounded-lg bg-rani-cream/30 border border-rani-border/50"
                      >
                        <span className="text-xs font-body font-semibold text-rani-navy truncate mr-2">{service}</span>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs font-body font-semibold text-rani-navy">{count} docs</span>
                          <ProgressRing value={(count as number / 5) * 100} size={32} strokeWidth={3} colorMode="gold" />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Knowledge Gaps */}
            {gaps.length > 0 && (
              <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider truncate mr-2">
                    Knowledge Gaps ({gaps.length})
                  </h3>
                  {highGaps > 0 && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-red-50 text-red-700 font-semibold flex-shrink-0">
                      {highGaps} high priority
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {gaps.map((gap, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className={`p-3 rounded-lg border ${PRIORITY_COLORS[gap.priority]}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="text-xs font-body font-semibold truncate">{gap.area}</span>
                      </div>
                      <p className="text-[10px] font-body opacity-80">{gap.description}</p>
                      <p className="text-[10px] font-body mt-1 opacity-60 italic">{gap.suggestedAction}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Pinecone Status */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-rani-navy to-rani-navy-light rounded-xl p-4 sm:p-6 text-white"
            >
              <h3 className="text-xs sm:text-sm font-body font-semibold uppercase tracking-wider text-rani-gold mb-3">
                Vector Database Status
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-[10px] font-body text-white/40 uppercase">Provider</p>
                  <p className="text-xs sm:text-sm font-body font-semibold text-white">Pinecone</p>
                </div>
                <div>
                  <p className="text-[10px] font-body text-white/40 uppercase">Index</p>
                  <p className="text-xs sm:text-sm font-body font-semibold text-white truncate">rani-knowledge-base</p>
                </div>
                <div>
                  <p className="text-[10px] font-body text-white/40 uppercase">Embedding Model</p>
                  <p className="text-xs sm:text-sm font-body font-semibold text-white truncate">text-embedding-3-small (1536d)</p>
                </div>
              </div>
              <p className="text-[10px] sm:text-xs font-body text-white/60 mt-3">
                Knowledge base powers: AI Chat Widget, Consult Co-pilot, Phone Agent FAQ responses
              </p>
            </motion.div>
          </>
        )}
      </div>
    </DashboardErrorBoundary>
  );
}
