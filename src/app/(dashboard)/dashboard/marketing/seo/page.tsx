'use client';

import { motion } from 'framer-motion';
import { Search, RefreshCw } from 'lucide-react';
import KPICard from '@/components/dashboard/cards/KPICard';
import { KeywordRankChart, SEOHealthScore, CoreWebVitalsCard } from '@/components/dashboard/marketing';
import { DashboardErrorBoundary, PanelSkeleton } from '@/components/dashboard/shared';
import { useDashboardData } from '@/hooks/useDashboardData';
import type {
  KeywordRanking, TechnicalSEOHealth, CoreWebVitals,
  LocalSEOScore, SEOSummary, ContentGap,
} from '@/lib/marketing/seo-monitor';

interface SEODashboardData {
  summary: SEOSummary;
  keywordRankings: KeywordRanking[];
  technicalHealth: TechnicalSEOHealth;
  coreWebVitals: CoreWebVitals;
  localSEO: LocalSEOScore;
  contentGaps: ContentGap[];
}

const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

export default function SEOPage() {
  const { data, isLoading, retry } = useDashboardData<SEODashboardData>('/marketing/seo', {
    refreshInterval: 300000,
  });

  const summary = data?.summary;

  return (
    <DashboardErrorBoundary pageName="SEO Monitor">
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6 sm:space-y-8">
        <motion.div variants={item} className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-heading text-rani-navy">SEO Dashboard</h1>
            <p className="text-xs sm:text-sm font-body text-rani-muted mt-1">
              Keyword rankings, technical health, and local SEO performance
            </p>
          </div>
          <button onClick={retry} className="p-2 rounded-lg border border-rani-border/30 hover:bg-rani-cream transition-colors">
            <RefreshCw className="w-4 h-4 text-rani-muted" />
          </button>
        </motion.div>

        {/* KPIs */}
        <motion.div variants={item}>
          {isLoading ? (
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-6 animate-pulse">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-rani-cream rounded-xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-6">
              <KPICard
                title="Keywords Tracked"
                value={summary?.totalKeywordsTracked ?? 0}
                icon="target"
              />
              <KPICard
                title="Top 10 Rankings"
                value={summary?.top10Count ?? 0}
                trend={{
                  value: (summary?.keywordsImproved ?? 0) - (summary?.keywordsDeclined ?? 0),
                  direction: (summary?.keywordsImproved ?? 0) > (summary?.keywordsDeclined ?? 0) ? 'up' : 'down',
                  label: `${summary?.keywordsImproved ?? 0} improved, ${summary?.keywordsDeclined ?? 0} declined`,
                }}
              />
              <KPICard
                title="Avg Position"
                value={summary?.avgPosition ?? 0}
              />
              <KPICard
                title="Local SEO Score"
                value={data?.localSEO?.overallScore ?? 0}
                suffix="/100"
              />
            </div>
          )}
        </motion.div>

        {/* Technical health + CWV */}
        <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SEOHealthScore
            health={data?.technicalHealth || { overallScore: 0, checks: [], criticalIssues: 0, warnings: 0, passed: 0 }}
            loading={isLoading}
          />
          <CoreWebVitalsCard
            vitals={data?.coreWebVitals || {
              lcp: { value: 0, rating: 'good', threshold: 2500 },
              fid: { value: 0, rating: 'good', threshold: 100 },
              cls: { value: 0, rating: 'good', threshold: 0.1 },
              inp: { value: 0, rating: 'good', threshold: 200 },
              ttfb: { value: 0, rating: 'good', threshold: 800 },
              overallScore: 0,
              lastUpdated: new Date().toISOString(),
            }}
            loading={isLoading}
          />
        </motion.div>

        {/* Keyword rankings */}
        <motion.div variants={item}>
          <KeywordRankChart keywords={data?.keywordRankings || []} loading={isLoading} />
        </motion.div>

        {/* Local SEO + Content Gaps */}
        <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Local SEO */}
          <div className="rounded-xl border border-rani-border/30 bg-white p-5 shadow-sm">
            <h3 className="font-heading text-sm font-semibold text-rani-navy mb-4">
              Local SEO ({data?.localSEO?.overallScore ?? 0}/100)
            </h3>
            {isLoading ? <PanelSkeleton /> : (
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs font-body mb-1">
                    <span className="text-rani-navy">GMB Optimization</span>
                    <span className="text-rani-muted">{data?.localSEO?.gmbOptimization?.score ?? 0}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-rani-cream overflow-hidden">
                    <div className="h-full rounded-full bg-rani-gold" style={{ width: `${data?.localSEO?.gmbOptimization?.score ?? 0}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-body mb-1">
                    <span className="text-rani-navy">Citations</span>
                    <span className="text-rani-muted">
                      {data?.localSEO?.citations?.consistent ?? 0}/{(data?.localSEO?.citations?.totalCitations ?? 0) + (data?.localSEO?.citations?.missing ?? 0)} consistent
                    </span>
                  </div>
                </div>
                {/* GMB incomplete items */}
                {(data?.localSEO?.gmbOptimization?.items || [])
                  .filter(i => i.status !== 'complete')
                  .slice(0, 5)
                  .map(gmbItem => (
                    <p key={gmbItem.name} className="text-[11px] font-body text-rani-muted">
                      <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${
                        gmbItem.priority === 'high' ? 'bg-red-400' : gmbItem.priority === 'medium' ? 'bg-amber-400' : 'bg-slate-300'
                      }`} />
                      {gmbItem.name}: {gmbItem.detail}
                    </p>
                  ))}
              </div>
            )}
          </div>

          {/* Content gaps */}
          <div className="rounded-xl border border-rani-border/30 bg-white p-5 shadow-sm">
            <h3 className="font-heading text-sm font-semibold text-rani-navy mb-4">Content Gaps</h3>
            {isLoading ? <PanelSkeleton /> : (
              <div className="space-y-2">
                {(data?.contentGaps || []).slice(0, 8).map((gap, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-rani-border/10 last:border-0">
                    <div>
                      <span className="text-xs font-body text-rani-navy font-medium">{gap.keyword}</span>
                      <span className="text-[10px] font-body text-rani-muted ml-2">
                        Vol: {gap.searchVolume} &middot; Diff: {gap.difficulty}
                      </span>
                    </div>
                    <span className={`text-[10px] font-body px-2 py-0.5 rounded-full ${
                      gap.priority === 'high' ? 'bg-red-100 text-red-600' :
                      gap.priority === 'medium' ? 'bg-amber-100 text-amber-600' :
                      'bg-slate-100 text-slate-500'
                    }`}>
                      {gap.priority}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Recommendations */}
        {summary?.recommendations && summary.recommendations.length > 0 && (
          <motion.div variants={item}>
            <div className="rounded-xl border border-rani-border/30 bg-white p-5 shadow-sm">
              <h3 className="font-heading text-sm font-semibold text-rani-navy mb-3">SEO Recommendations</h3>
              <div className="space-y-1.5">
                {summary.recommendations.map((rec, i) => (
                  <p key={i} className="text-xs font-body text-rani-muted">
                    <span className="text-rani-gold mr-1">{i + 1}.</span> {rec}
                  </p>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </DashboardErrorBoundary>
  );
}
