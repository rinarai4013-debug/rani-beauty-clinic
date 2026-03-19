'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, User, Target, MessageCircle, ShieldAlert, Sparkles,
  CheckCircle, DollarSign, Calendar, Loader2, TrendingUp,
  ChevronDown, ChevronUp,
} from 'lucide-react';
import type { AppointmentItem } from '@/types/dashboard';

interface ConsultPrepData {
  success: boolean;
  data: {
    clientBriefing: {
      summary: string;
      keyInsights: string[];
      riskFlags: string[];
      opportunities: string[];
      ltv: number;
      segment: 'vip' | 'regular' | 'new' | 'at_risk';
    };
    treatmentPlan: {
      primary: {
        service: string;
        reason: string;
        price: number;
        duration: number;
        sessions: number;
        totalInvestment: number;
        results: string;
        downtime: string;
        financingEligible: boolean;
        financingMonthly?: number;
      };
      alternatives: {
        service: string;
        price: number;
        sessions: number;
        totalInvestment: number;
        results: string;
      }[];
      packages: {
        name: string;
        services: string[];
        price: number;
        savings: number;
        pitch: string;
      }[];
    };
    talkingPoints: {
      topic: string;
      script: string;
      timing: 'opening' | 'during' | 'closing';
      priority: 'must_say' | 'should_say' | 'nice_to_say';
    }[];
    objectionHandlers: {
      objection: string;
      response: string;
      technique: string;
    }[];
    closingStrategy: {
      approach: string;
      script: string;
      financingPitch?: string;
      membershipPitch?: string;
      alternativeClose: string;
    };
    consultScore: number;
  };
}

interface ConsultPrepSlideOverProps {
  appointment: AppointmentItem | null;
  onClose: () => void;
}

const SEGMENT_CONFIG = {
  vip: { label: 'VIP', bg: 'bg-rani-gold/20 text-rani-navy', icon: Sparkles },
  regular: { label: 'Regular', bg: 'bg-blue-100 text-blue-700', icon: User },
  new: { label: 'New Client', bg: 'bg-green-100 text-green-700', icon: User },
  at_risk: { label: 'At Risk', bg: 'bg-red-100 text-red-700', icon: ShieldAlert },
};

const PRIORITY_CONFIG = {
  must_say: { label: 'Must Say', bg: 'bg-red-100 text-red-700' },
  should_say: { label: 'Should Say', bg: 'bg-amber-100 text-amber-700' },
  nice_to_say: { label: 'Nice to Say', bg: 'bg-green-100 text-green-700' },
};

export default function ConsultPrepSlideOver({ appointment, onClose }: ConsultPrepSlideOverProps) {
  const [prepData, setPrepData] = useState<ConsultPrepData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>('briefing');

  useEffect(() => {
    if (!appointment) {
      setPrepData(null);
      return;
    }

    const fetchPrepData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/dashboard/consult', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client: {
              name: appointment.clientName,
              previousServices: [],
              totalSpend: 0,
              visitCount: 0,
              membershipStatus: 'none',
            },
            concerns: ['skin rejuvenation'],
            consultType: appointment.isNewClient ? 'new_client' : 'existing_client',
            budget: 'unknown',
            timeAvailable: appointment.duration || 30,
          }),
        });
        if (!res.ok) throw new Error('Failed to fetch consult prep');
        const json = await res.json();
        setPrepData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load consult prep');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrepData();
  }, [appointment]);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  if (!appointment) return null;

  const d = prepData?.data;

  return (
    <AnimatePresence>
      {appointment && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
          />

          {/* Slide-over panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full sm:w-[480px] bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="bg-rani-navy p-5 flex-shrink-0">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-rani-gold" />
                  <h2 className="text-lg font-heading text-white">Consult Prep</h2>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-rani-gold/20 flex items-center justify-center">
                  <User className="w-5 h-5 text-rani-gold" />
                </div>
                <div>
                  <p className="text-sm font-body font-semibold text-white">{appointment.clientName}</p>
                  <p className="text-xs font-body text-white/60">
                    {appointment.time} &middot; {appointment.service} &middot; {appointment.duration}min
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-64 gap-3">
                  <Loader2 className="w-8 h-8 text-rani-navy animate-spin" />
                  <p className="text-sm font-body text-rani-muted">Preparing consult intelligence...</p>
                </div>
              ) : error ? (
                <div className="p-5">
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm font-body text-red-700">
                    {error}
                  </div>
                </div>
              ) : d ? (
                <div className="p-4 space-y-3">
                  {/* Consult Score */}
                  <div className="flex items-center gap-3 p-3 bg-rani-cream rounded-xl">
                    <div className="w-12 h-12 rounded-full bg-rani-navy flex items-center justify-center">
                      <span className="text-sm font-heading font-bold text-rani-gold">{d.consultScore}</span>
                    </div>
                    <div>
                      <p className="text-xs font-body text-rani-muted uppercase tracking-wider">Consult Score</p>
                      <p className="text-sm font-body font-medium text-rani-navy">
                        {d.consultScore >= 80 ? 'High conversion potential' : d.consultScore >= 60 ? 'Good potential' : 'Build rapport first'}
                      </p>
                    </div>
                    {d.clientBriefing.segment && (
                      <span className={`ml-auto px-2 py-1 rounded-full text-[10px] font-body font-semibold ${SEGMENT_CONFIG[d.clientBriefing.segment].bg}`}>
                        {SEGMENT_CONFIG[d.clientBriefing.segment].label}
                      </span>
                    )}
                  </div>

                  {/* Client Briefing */}
                  <CollapsibleSection
                    title="Client Briefing"
                    icon={<User className="w-3.5 h-3.5" />}
                    isOpen={expandedSection === 'briefing'}
                    onToggle={() => toggleSection('briefing')}
                  >
                    <p className="text-sm font-body text-rani-navy leading-relaxed mb-3">
                      {d.clientBriefing.summary}
                    </p>
                    {d.clientBriefing.keyInsights.length > 0 && (
                      <div className="space-y-1.5 mb-3">
                        {d.clientBriefing.keyInsights.map((insight, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs font-body text-rani-navy/80">
                            <TrendingUp className="w-3 h-3 text-rani-success mt-0.5 flex-shrink-0" />
                            <span>{insight}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {d.clientBriefing.riskFlags.length > 0 && (
                      <div className="space-y-1.5 mb-3">
                        {d.clientBriefing.riskFlags.map((flag, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs font-body text-red-600">
                            <ShieldAlert className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            <span>{flag}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {d.clientBriefing.opportunities.length > 0 && (
                      <div className="space-y-1.5">
                        {d.clientBriefing.opportunities.map((opp, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs font-body text-rani-navy/80">
                            <Sparkles className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" />
                            <span>{opp}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-3 pt-2 border-t border-rani-border">
                      <DollarSign className="w-3 h-3 text-rani-success" />
                      <span className="text-xs font-body text-rani-muted">Est. Annual LTV:</span>
                      <span className="text-xs font-body font-semibold text-rani-navy">${d.clientBriefing.ltv.toLocaleString()}</span>
                    </div>
                  </CollapsibleSection>

                  {/* Treatment Plan */}
                  <CollapsibleSection
                    title="Treatment Plan"
                    icon={<Target className="w-3.5 h-3.5" />}
                    isOpen={expandedSection === 'treatment'}
                    onToggle={() => toggleSection('treatment')}
                  >
                    {/* Primary */}
                    <div className="bg-rani-cream rounded-lg p-3 mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-body font-semibold text-rani-navy">{d.treatmentPlan.primary.service}</span>
                        <span className="text-sm font-body font-bold text-rani-navy">${d.treatmentPlan.primary.price}</span>
                      </div>
                      <p className="text-xs font-body text-rani-muted mb-2">{d.treatmentPlan.primary.results}</p>
                      <div className="flex items-center gap-3 text-[10px] font-body text-rani-muted">
                        <span>{d.treatmentPlan.primary.duration}min</span>
                        <span>{d.treatmentPlan.primary.sessions} session{d.treatmentPlan.primary.sessions > 1 ? 's' : ''}</span>
                        <span>Total: ${d.treatmentPlan.primary.totalInvestment.toLocaleString()}</span>
                        {d.treatmentPlan.primary.financingEligible && (
                          <span className="text-rani-success">Financing OK</span>
                        )}
                      </div>
                    </div>

                    {/* Alternatives */}
                    {d.treatmentPlan.alternatives.length > 0 && (
                      <div className="space-y-2 mb-3">
                        <p className="text-[10px] font-body text-rani-muted uppercase tracking-wider">Alternatives</p>
                        {d.treatmentPlan.alternatives.map((alt, i) => (
                          <div key={i} className="flex items-center justify-between p-2 rounded-lg border border-rani-border">
                            <div>
                              <span className="text-xs font-body font-medium text-rani-navy">{alt.service}</span>
                              <p className="text-[10px] font-body text-rani-muted">{alt.sessions} session{alt.sessions > 1 ? 's' : ''}</p>
                            </div>
                            <span className="text-xs font-body font-semibold text-rani-navy">${alt.price}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Packages */}
                    {d.treatmentPlan.packages.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-body text-rani-muted uppercase tracking-wider">Package Pitch</p>
                        {d.treatmentPlan.packages.map((pkg, i) => (
                          <div key={i} className="bg-rani-gold/10 border border-rani-gold/30 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-body font-semibold text-rani-navy">{pkg.name}</span>
                              <div className="text-right">
                                <span className="text-xs font-body font-bold text-rani-navy">${pkg.price}</span>
                                <span className="text-[10px] font-body text-rani-success ml-1">Save ${pkg.savings}</span>
                              </div>
                            </div>
                            <p className="text-xs font-body text-rani-navy/70 leading-relaxed">{pkg.pitch}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CollapsibleSection>

                  {/* Talking Points */}
                  <CollapsibleSection
                    title="Talking Points"
                    icon={<MessageCircle className="w-3.5 h-3.5" />}
                    isOpen={expandedSection === 'talking'}
                    onToggle={() => toggleSection('talking')}
                  >
                    {['opening', 'during', 'closing'].map(timing => {
                      const points = d.talkingPoints.filter(tp => tp.timing === timing);
                      if (points.length === 0) return null;
                      return (
                        <div key={timing} className="mb-3 last:mb-0">
                          <p className="text-[10px] font-body text-rani-muted uppercase tracking-wider mb-2">
                            {timing === 'opening' ? 'Opening' : timing === 'during' ? 'During Consult' : 'Closing'}
                          </p>
                          <div className="space-y-2">
                            {points.map((tp, i) => (
                              <div key={i} className="p-2.5 rounded-lg border border-rani-border bg-white">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-body font-semibold text-rani-navy">{tp.topic}</span>
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-body font-semibold ${PRIORITY_CONFIG[tp.priority].bg}`}>
                                    {PRIORITY_CONFIG[tp.priority].label}
                                  </span>
                                </div>
                                <p className="text-xs font-body text-rani-navy/70 leading-relaxed italic">
                                  &ldquo;{tp.script}&rdquo;
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </CollapsibleSection>

                  {/* Objection Handlers */}
                  <CollapsibleSection
                    title="Objection Handlers"
                    icon={<ShieldAlert className="w-3.5 h-3.5" />}
                    isOpen={expandedSection === 'objections'}
                    onToggle={() => toggleSection('objections')}
                  >
                    <div className="space-y-2">
                      {d.objectionHandlers.map((oh, i) => (
                        <div key={i} className="p-2.5 rounded-lg border border-rani-border bg-white">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-body font-semibold text-red-600">
                              &ldquo;{oh.objection}&rdquo;
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-body font-semibold bg-blue-100 text-blue-700">
                              {oh.technique}
                            </span>
                          </div>
                          <p className="text-xs font-body text-rani-navy/70 leading-relaxed">
                            {oh.response}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CollapsibleSection>

                  {/* Closing Strategy */}
                  <CollapsibleSection
                    title="Closing Strategy"
                    icon={<CheckCircle className="w-3.5 h-3.5" />}
                    isOpen={expandedSection === 'closing'}
                    onToggle={() => toggleSection('closing')}
                  >
                    <div className="space-y-3">
                      <div className="p-3 bg-rani-navy/5 rounded-lg">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-body font-semibold bg-rani-navy text-white uppercase">
                            {d.closingStrategy.approach}
                          </span>
                        </div>
                        <p className="text-xs font-body text-rani-navy/80 leading-relaxed italic">
                          &ldquo;{d.closingStrategy.script}&rdquo;
                        </p>
                      </div>
                      {d.closingStrategy.financingPitch && (
                        <div className="p-2.5 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-[10px] font-body text-green-700 font-semibold uppercase mb-1">Financing Bridge</p>
                          <p className="text-xs font-body text-green-800/80 leading-relaxed italic">
                            &ldquo;{d.closingStrategy.financingPitch}&rdquo;
                          </p>
                        </div>
                      )}
                      {d.closingStrategy.membershipPitch && (
                        <div className="p-2.5 bg-rani-gold/10 border border-rani-gold/30 rounded-lg">
                          <p className="text-[10px] font-body text-rani-navy font-semibold uppercase mb-1">Membership Pitch</p>
                          <p className="text-xs font-body text-rani-navy/70 leading-relaxed italic">
                            &ldquo;{d.closingStrategy.membershipPitch}&rdquo;
                          </p>
                        </div>
                      )}
                      <div className="p-2.5 border border-rani-border rounded-lg">
                        <p className="text-[10px] font-body text-rani-muted font-semibold uppercase mb-1">Alternative Close</p>
                        <p className="text-xs font-body text-rani-navy/70 leading-relaxed italic">
                          &ldquo;{d.closingStrategy.alternativeClose}&rdquo;
                        </p>
                      </div>
                    </div>
                  </CollapsibleSection>
                </div>
              ) : null}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function CollapsibleSection({
  title,
  icon,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-rani-border overflow-hidden">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full p-3 text-left hover:bg-rani-cream/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-rani-navy">{icon}</span>
          <span className="text-xs font-body font-semibold text-rani-navy uppercase tracking-wider">{title}</span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-3.5 h-3.5 text-rani-muted" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-rani-muted" />
        )}
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
