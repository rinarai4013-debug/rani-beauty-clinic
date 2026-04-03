'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, MessageSquare, Target, Shield, DollarSign } from 'lucide-react';
import type { MastermindSession } from '@/types/mastermind';

interface CopilotSidebarProps {
  session: MastermindSession;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * AI Copilot sidebar for provider assistance during plan review.
 * Generates suggestions, objection handlers, and closing techniques
 * based on the session's scan + plan data.
 */
export default function CopilotSidebar({
  session,
  isOpen,
  onClose,
}: CopilotSidebarProps) {
  const [activeTab, setActiveTab] = useState<'suggestions' | 'objections' | 'closing'>('suggestions');

  const scan = session.auraScanResult;
  const plan = session.mastermindPlan;

  // Generate contextual suggestions from session data
  const suggestions = generateSuggestions(session);
  const objectionHandlers = generateObjectionHandlers(session);
  const closingTechniques = generateClosingTechniques(session);

  const tabs = [
    { id: 'suggestions' as const, label: 'Suggestions', icon: Target, count: suggestions.length },
    { id: 'objections' as const, label: 'Objections', icon: Shield, count: objectionHandlers.length },
    { id: 'closing' as const, label: 'Closing', icon: DollarSign, count: closingTechniques.length },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/10 z-40 lg:hidden"
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#E8E4DF]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#C9A96E]" />
                <h2 className="font-body text-sm font-semibold text-[#0F1D2C]">
                  AI Copilot
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-[#F8F6F1] flex items-center justify-center hover:bg-[#E8E4DF] transition-colors"
              >
                <X className="w-3.5 h-3.5 text-[#0F1D2C]/60" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[#E8E4DF]">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 font-body text-xs font-medium transition-colors relative ${
                      activeTab === tab.id
                        ? 'text-[#C9A96E]'
                        : 'text-[#0F1D2C]/40 hover:text-[#0F1D2C]/60'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                    {tab.count > 0 && (
                      <span className="w-4 h-4 rounded-full bg-[#C9A96E]/20 text-[#C9A96E] font-body text-xs flex items-center justify-center">
                        {tab.count}
                      </span>
                    )}
                    {activeTab === tab.id && (
                      <motion.div
                        layoutId="copilotTab"
                        className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#C9A96E] rounded-full"
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {activeTab === 'suggestions' &&
                suggestions.map((s, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-3 rounded-xl border border-[#C9A96E]/20 bg-[#C9A96E]/5"
                  >
                    <p className="font-body text-xs font-semibold text-[#0F1D2C] mb-1">
                      {s.title}
                    </p>
                    <p className="font-body text-xs text-[#0F1D2C]/60 leading-relaxed">
                      {s.suggestion}
                    </p>
                  </motion.div>
                ))}

              {activeTab === 'objections' &&
                objectionHandlers.map((o, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-3 rounded-xl border border-[#E8E4DF]"
                  >
                    <p className="font-body text-xs font-semibold text-[#DC2626] mb-1">
                      &ldquo;{o.objection}&rdquo;
                    </p>
                    <p className="font-body text-xs text-[#0F1D2C]/60 leading-relaxed mb-2">
                      {o.response}
                    </p>
                    <p className="font-body text-xs text-[#C9A96E] italic">
                      Technique: {o.technique}
                    </p>
                  </motion.div>
                ))}

              {activeTab === 'closing' &&
                closingTechniques.map((c, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-3 rounded-xl border border-[#059669]/20 bg-[#059669]/5"
                  >
                    <p className="font-body text-xs font-semibold text-[#059669] mb-1">
                      {c.name}
                    </p>
                    <p className="font-body text-xs text-[#0F1D2C]/60 leading-relaxed">
                      {c.script}
                    </p>
                  </motion.div>
                ))}

              {/* Empty state */}
              {((activeTab === 'suggestions' && suggestions.length === 0) ||
                (activeTab === 'objections' && objectionHandlers.length === 0) ||
                (activeTab === 'closing' && closingTechniques.length === 0)) && (
                <div className="text-center py-8">
                  <MessageSquare className="w-8 h-8 text-[#0F1D2C]/20 mx-auto mb-2" />
                  <p className="font-body text-xs text-[#0F1D2C]/40">
                    Complete the scan and plan to get AI-powered assistance.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── GENERATOR FUNCTIONS (static, no API) ──

interface Suggestion {
  title: string;
  suggestion: string;
}

function generateSuggestions(session: MastermindSession): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const scan = session.auraScanResult;
  const plan = session.mastermindPlan;

  if (!scan || !plan) return suggestions;

  // Score-based suggestions
  if (scan.auraScore.overall < 60) {
    suggestions.push({
      title: 'Aggressive Treatment Path',
      suggestion: `With an Aura Score of ${scan.auraScore.overall}, this patient would benefit from a comprehensive treatment approach. Consider emphasizing the Transform or Elite package to maximize results.`,
    });
  }

  // Skin age gap
  if (scan.auraScore.skinAgeDelta > 5) {
    suggestions.push({
      title: 'Skin Age Opportunity',
      suggestion: `The patient's skin age is ${scan.auraScore.skinAgeDelta} years older than their chronological age. This creates a compelling visual story — show the projected improvement to close.`,
    });
  }

  // Concern-specific
  const topConcern = scan.detectedConcerns[0];
  if (topConcern) {
    suggestions.push({
      title: `Focus on ${topConcern.concern.replace(/_/g, ' ')}`,
      suggestion: `This is the patient's #1 concern with a severity score of ${topConcern.score}/100. Lead with treatments addressing this to build trust before discussing the full plan.`,
    });
  }

  // Package suggestion
  suggestions.push({
    title: 'Package Positioning',
    suggestion: 'Present all three tiers but verbally walk through the Transform package first. It offers the best value-to-results ratio and is the natural recommendation for most patients.',
  });

  return suggestions;
}

interface ObjectionHandler {
  objection: string;
  response: string;
  technique: string;
}

function generateObjectionHandlers(session: MastermindSession): ObjectionHandler[] {
  const handlers: ObjectionHandler[] = [];
  const plan = session.mastermindPlan;

  if (!plan) return handlers;

  const totalCost = [
    ...plan.recommendations.primary,
    ...plan.recommendations.complementary,
  ].reduce((sum, t) => sum + t.totalEstimate, 0);

  handlers.push({
    objection: "That's more than I expected to spend.",
    response: `I understand. Many of our patients feel that way initially. The Transform package is actually ${plan.packages.find(p => p.highlighted)?.discount || 15}% less than booking these treatments individually. And with our financing, that's just $${Math.round(totalCost / 12)}/month — less than most skincare subscriptions.`,
    technique: 'Reframe + Value Comparison',
  });

  handlers.push({
    objection: "I need to think about it.",
    response: "Absolutely — this is an important decision. What I'd suggest is booking just the first treatment today so we can lock in your results timeline. Your skin age is only going to increase if we wait, and as we showed, treatment costs go up the longer we delay.",
    technique: 'Urgency + Trial Close',
  });

  handlers.push({
    objection: "Does this actually work?",
    response: "Great question. These are all FDA-cleared treatments backed by clinical studies. But more importantly — you just saw your own scan results. We're not guessing — we know exactly what your skin needs and what to expect.",
    technique: 'Evidence + Personalization',
  });

  handlers.push({
    objection: "I'm worried about the pain/downtime.",
    response: "I hear you. That's why we've sequenced your treatments to minimize downtime. Your initial treatments have zero downtime, and by the time we get to the more intensive procedures, you'll be comfortable with the process.",
    technique: 'Acknowledge + Sequential Comfort',
  });

  return handlers;
}

interface ClosingTechnique {
  name: string;
  script: string;
}

function generateClosingTechniques(session: MastermindSession): ClosingTechnique[] {
  const techniques: ClosingTechnique[] = [];
  const scan = session.auraScanResult;
  const plan = session.mastermindPlan;

  if (!scan || !plan) return techniques;

  techniques.push({
    name: 'Assumptive Close',
    script: `"Based on everything we've discussed and your scan results, the Transform package is the clear path to your goals. Let me get you scheduled for your first treatment — do you prefer mornings or afternoons?"`,
  });

  techniques.push({
    name: 'Choice Close',
    script: `"You've seen the three options. Most patients in your situation choose either the Transform or Elite package. Which one feels right for you?"`,
  });

  techniques.push({
    name: 'Future Pacing',
    script: `"Imagine looking in the mirror six months from now with an Aura Score of ${scan.predictiveMetrics.withTreatment.sixMonths.auraScore} instead of ${scan.auraScore.overall}. That's the version of yourself we can help you become. Shall we get started?"`,
  });

  return techniques;
}
