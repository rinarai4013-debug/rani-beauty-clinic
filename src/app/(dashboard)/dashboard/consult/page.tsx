'use client';

import { motion } from 'framer-motion';
import {
  User, MessageCircle, Target, Shield, TrendingUp, Clock,
  CheckCircle, AlertTriangle, Star, DollarSign, ChevronRight, Sparkles,
} from 'lucide-react';
import KPICard from '@/components/dashboard/cards/KPICard';
import ProgressBar from '@/components/dashboard/charts/ProgressBar';
import ProgressRing from '@/components/dashboard/charts/ProgressRing';
import { DashboardErrorBoundary, KPIRowSkeleton, PanelSkeleton, ChartSkeleton, TableSkeleton, SkeletonBar } from '@/components/dashboard/shared';
import DashboardEmptyState from '@/components/dashboard/shared/DashboardEmptyState';
import { InlineError } from '@/components/dashboard/shared';
import { useConsultCopilot } from '@/hooks/useDashboardData';
import type { ConsultCopilotResult } from '@/lib/consult/copilot-engine';

interface ConsultResponse {
  success: boolean;
  data: ConsultCopilotResult;
}

const SEGMENT_COLORS: Record<string, string> = {
  vip: 'bg-rani-gold/10 text-rani-gold border-rani-gold/30',
  regular: 'bg-blue-50 text-blue-700 border-blue-200',
  new: 'bg-green-50 text-green-700 border-green-200',
  at_risk: 'bg-red-50 text-red-700 border-red-200',
};

const TIMING_COLORS: Record<string, string> = {
  opening: 'bg-blue-500',
  during: 'bg-amber-500',
  closing: 'bg-green-500',
};

const PRIORITY_STYLES: Record<string, string> = {
  must_say: 'bg-red-50 text-red-700 border-red-200',
  should_say: 'bg-amber-50 text-amber-700 border-amber-200',
  nice_to_say: 'bg-green-50 text-green-700 border-green-200',
};

export default function ConsultCopilotPage() {
  const { data: raw, isLoading } = useConsultCopilot() as { data: ConsultResponse | undefined; isLoading: boolean };
  const data = raw?.data;

  const briefing = data?.clientBriefing;
  const plan = data?.treatmentPlan;
  const talkingPoints = data?.talkingPoints || [];
  const objections = data?.objectionHandlers || [];
  const crossSells = data?.crossSellOpportunities || [];
  const closing = data?.closingStrategy;
  const followUp = data?.followUpPlan;
  const consultScore = data?.consultScore || 0;

  const totalInvestment = plan?.primary
    ? plan.primary.totalInvestment + (plan.alternatives?.reduce((s, a) => s + a.totalInvestment, 0) || 0)
    : 0;

  const hasNoData = !isLoading && !data;

  return (
    <DashboardErrorBoundary pageName="AI Consult Co-pilot">
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-heading text-rani-navy">AI Consult Co-pilot</h1>
          <p className="text-xs sm:text-sm font-body text-rani-muted mt-1">Real-time treatment recommendations, objection handling, and closing strategies</p>
        </div>

        {/* Hero KPIs */}
        {isLoading ? (
          <KPIRowSkeleton />
        ) : hasNoData ? (
          <DashboardEmptyState
            icon="brain"
            title="No consult data available"
            description="Run a consult session to generate AI-powered treatment recommendations and closing strategies."
          />
        ) : (
          <>
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-6">
              <KPICard title="Consult Score" value={consultScore} suffix="/100" icon="zap" size="hero" />
              <KPICard title="Talking Points" value={talkingPoints.length} icon="message-circle" />
              <KPICard title="Cross-Sells" value={crossSells.length} icon="trending-up" />
              <KPICard title="Client LTV" value={briefing?.ltv || 0} prefix="$" icon="dollar-sign" />
            </div>

            {/* Client Briefing */}
            {briefing && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-rani-navy to-rani-navy-light rounded-xl p-4 sm:p-6 text-white"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs sm:text-sm font-body font-semibold uppercase tracking-wider text-rani-gold">
                    Client Intelligence Briefing
                  </h3>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase border flex-shrink-0 ${SEGMENT_COLORS[briefing.segment]}`}>
                    {briefing.segment.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-body text-white/80 mb-4">{briefing.summary}</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Key Insights */}
                  <div>
                    <p className="text-[10px] font-body text-white/40 uppercase mb-2">Key Insights</p>
                    <div className="space-y-1">
                      {briefing.keyInsights.map((insight, i) => (
                        <div key={i} className="flex items-start gap-1.5">
                          <Sparkles className="w-3 h-3 text-rani-gold mt-0.5 flex-shrink-0" />
                          <span className="text-xs font-body text-white/70">{insight}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Opportunities */}
                  <div>
                    <p className="text-[10px] font-body text-white/40 uppercase mb-2">Opportunities</p>
                    <div className="space-y-1">
                      {briefing.opportunities.map((opp, i) => (
                        <div key={i} className="flex items-start gap-1.5">
                          <TrendingUp className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                          <span className="text-xs font-body text-white/70">{opp}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Risk Flags */}
                  <div>
                    <p className="text-[10px] font-body text-white/40 uppercase mb-2">Risk Flags</p>
                    <div className="space-y-1">
                      {briefing.riskFlags.length > 0 ? briefing.riskFlags.map((flag, i) => (
                        <div key={i} className="flex items-start gap-1.5">
                          <AlertTriangle className="w-3 h-3 text-red-400 mt-0.5 flex-shrink-0" />
                          <span className="text-xs font-body text-white/70">{flag}</span>
                        </div>
                      )) : (
                        <div className="flex items-center gap-1.5">
                          <CheckCircle className="w-3 h-3 text-green-400" />
                          <span className="text-xs font-body text-white/70">No risk flags detected</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Treatment Plan + Talking Points */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Treatment Plan */}
              {plan && (
                <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-5">
                  <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
                    Recommended Treatment Plan
                  </h3>

                  {/* Primary Recommendation */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-3 sm:p-4 rounded-lg bg-rani-gold/5 border-2 border-rani-gold/20 mb-3"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="w-4 h-4 text-rani-gold flex-shrink-0" />
                      <span className="text-xs font-body font-semibold text-rani-gold uppercase">Primary</span>
                    </div>
                    <p className="text-sm font-body font-semibold text-rani-navy truncate">{plan.primary.service}</p>
                    <p className="text-xs font-body text-rani-muted mt-1">{plan.primary.reason}</p>
                    <div className="grid grid-cols-3 gap-2 mt-3 text-[10px] font-body">
                      <div>
                        <span className="text-rani-muted">Price</span>
                        <p className="font-semibold text-rani-navy">${plan.primary.price}</p>
                      </div>
                      <div>
                        <span className="text-rani-muted">Sessions</span>
                        <p className="font-semibold text-rani-navy">{plan.primary.sessions}</p>
                      </div>
                      <div>
                        <span className="text-rani-muted">Total</span>
                        <p className="font-semibold text-green-600">${plan.primary.totalInvestment.toLocaleString()}</p>
                      </div>
                    </div>
                    <p className="text-[10px] font-body text-rani-muted mt-2">Results: {plan.primary.results}</p>
                    {plan.primary.financingEligible && plan.primary.financingMonthly && (
                      <div className="mt-2 px-2 py-1 rounded bg-blue-50 text-[10px] font-body text-blue-700">
                        Cherry Financing: ${plan.primary.financingMonthly}/mo
                      </div>
                    )}
                  </motion.div>

                  {/* Alternatives */}
                  {plan.alternatives.map((alt, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + i * 0.05 }}
                      className="p-3 rounded-lg bg-rani-cream/30 border border-rani-border/50 mb-2"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-body font-semibold text-rani-navy truncate mr-2">{alt.service}</span>
                        <span className="text-xs font-body font-semibold text-rani-navy flex-shrink-0">${alt.price}</span>
                      </div>
                      <p className="text-[10px] font-body text-rani-muted">{alt.reason}</p>
                    </motion.div>
                  ))}

                  {/* Packages */}
                  {plan.packages.length > 0 && (
                    <div className="mt-4">
                      <p className="text-[10px] font-body font-semibold text-rani-muted uppercase mb-2">Package Suggestions</p>
                      {plan.packages.map((pkg, i) => (
                        <div key={i} className="p-3 rounded-lg bg-green-50/50 border border-green-200/50 mb-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-body font-semibold text-rani-navy truncate mr-2">{pkg.name}</span>
                            <span className="text-[10px] font-body font-semibold text-green-600 flex-shrink-0">Save ${pkg.savings}</span>
                          </div>
                          <p className="text-[10px] font-body text-rani-muted">{pkg.pitch}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Timeline */}
                  {plan.timeline.length > 0 && (
                    <div className="mt-4">
                      <p className="text-[10px] font-body font-semibold text-rani-muted uppercase mb-2">Treatment Timeline</p>
                      <div className="space-y-2">
                        {plan.timeline.map((step, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-rani-gold/10 flex items-center justify-center text-[10px] font-heading text-rani-gold flex-shrink-0">
                              W{step.week}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-body font-semibold text-rani-navy truncate">{step.treatment}</p>
                              <p className="text-[10px] font-body text-rani-muted">{step.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Talking Points */}
              <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-5">
                <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
                  Talking Points
                </h3>
                {talkingPoints.length === 0 ? (
                  <DashboardEmptyState
                    icon="message"
                    title="No talking points yet"
                    description="Talking points will appear once a consult session is generated."
                    compact
                  />
                ) : (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {['opening', 'during', 'closing'].map(timing => {
                      const timingPoints = talkingPoints.filter(tp => tp.timing === timing);
                      if (timingPoints.length === 0) return null;
                      return (
                        <div key={timing}>
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`w-2 h-2 rounded-full ${TIMING_COLORS[timing]}`} />
                            <span className="text-[10px] font-body font-semibold text-rani-muted uppercase">{timing}</span>
                          </div>
                          {timingPoints.map((point, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, x: -5 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.03 }}
                              className="p-3 rounded-lg bg-rani-cream/30 border border-rani-border/50 mb-2 ml-4"
                            >
                              <div className="flex items-center justify-between mb-1 gap-2">
                                <span className="text-xs font-body font-semibold text-rani-navy truncate">{point.topic}</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium flex-shrink-0 ${PRIORITY_STYLES[point.priority]}`}>
                                  {point.priority.replace('_', ' ')}
                                </span>
                              </div>
                              <p className="text-xs font-body text-rani-text italic">&ldquo;{point.script}&rdquo;</p>
                            </motion.div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Objection Handlers + Cross-Sells */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Objection Handlers */}
              {objections.length > 0 && (
                <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-5">
                  <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
                    Objection Handlers
                  </h3>
                  <div className="space-y-3">
                    {objections.map((obj, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="p-3 rounded-lg bg-rani-cream/30 border border-rani-border/50"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Shield className="w-3.5 h-3.5 text-rani-gold flex-shrink-0" />
                          <span className="text-xs font-body font-semibold text-red-600 truncate">&ldquo;{obj.objection}&rdquo;</span>
                        </div>
                        <p className="text-xs font-body text-rani-text">{obj.response}</p>
                        <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded bg-purple-50 text-purple-600 font-medium">
                          {obj.technique}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cross-Sell Opportunities */}
              {crossSells.length > 0 && (
                <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-5">
                  <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
                    Cross-Sell Opportunities
                  </h3>
                  <div className="space-y-3">
                    {crossSells.map((cs, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="p-3 rounded-lg bg-rani-cream/30 border border-rani-border/50"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-body font-semibold text-rani-navy truncate mr-2">{cs.service}</span>
                          <span className="text-xs font-body font-semibold text-green-600 flex-shrink-0">+${cs.addOnPrice}</span>
                        </div>
                        <p className="text-[10px] font-body text-rani-muted mb-2">{cs.reason}</p>
                        <p className="text-xs font-body text-rani-text italic">&ldquo;{cs.script}&rdquo;</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[10px] font-body text-rani-muted flex-shrink-0">Conversion Likelihood:</span>
                          <ProgressBar current={cs.conversionLikelihood} target={100} showPercentage={false} height={4} colorMode="gold" />
                          <span className="text-[10px] font-body font-semibold text-rani-navy flex-shrink-0">{cs.conversionLikelihood}%</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Closing Strategy + Follow-Up */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Closing Strategy */}
              {closing && (
                <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-5">
                  <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
                    Closing Strategy
                  </h3>
                  <div className="p-3 sm:p-4 rounded-lg bg-rani-gold/5 border border-rani-gold/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-4 h-4 text-rani-gold flex-shrink-0" />
                      <span className="text-xs font-body font-semibold text-rani-gold uppercase">{closing.approach} Close</span>
                    </div>
                    <p className="text-xs font-body text-rani-text italic">&ldquo;{closing.script}&rdquo;</p>

                    {closing.financingPitch && (
                      <div className="mt-3 p-2 rounded bg-blue-50 border border-blue-100">
                        <p className="text-[10px] font-body font-semibold text-blue-700 uppercase mb-1">Financing Option</p>
                        <p className="text-xs font-body text-blue-600 italic">&ldquo;{closing.financingPitch}&rdquo;</p>
                      </div>
                    )}

                    {closing.membershipPitch && (
                      <div className="mt-2 p-2 rounded bg-purple-50 border border-purple-100">
                        <p className="text-[10px] font-body font-semibold text-purple-700 uppercase mb-1">Membership Pitch</p>
                        <p className="text-xs font-body text-purple-600 italic">&ldquo;{closing.membershipPitch}&rdquo;</p>
                      </div>
                    )}

                    <div className="mt-3 p-2 rounded bg-rani-cream/50 border border-rani-border/30">
                      <p className="text-[10px] font-body font-semibold text-rani-muted uppercase mb-1">Alternative Close</p>
                      <p className="text-xs font-body text-rani-text italic">&ldquo;{closing.alternativeClose}&rdquo;</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Follow-Up Plan */}
              {followUp && (
                <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-5">
                  <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
                    Follow-Up Plan
                  </h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Same Day', text: followUp.sameDay, icon: Clock, color: 'text-blue-500' },
                      { label: 'Next Day', text: followUp.nextDay, icon: ChevronRight, color: 'text-green-500' },
                      { label: 'One Week', text: followUp.oneWeek, icon: ChevronRight, color: 'text-amber-500' },
                      { label: 'If No Book', text: followUp.ifNoBook, icon: AlertTriangle, color: 'text-red-500' },
                    ].map((step, i) => (
                      <motion.div
                        key={step.label}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className="flex items-start gap-3 p-3 rounded-lg bg-rani-cream/30 border border-rani-border/50"
                      >
                        <step.icon className={`w-4 h-4 mt-0.5 ${step.color} flex-shrink-0`} />
                        <div className="min-w-0">
                          <p className="text-xs font-body font-semibold text-rani-navy">{step.label}</p>
                          <p className="text-xs font-body text-rani-text mt-0.5">{step.text}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardErrorBoundary>
  );
}
