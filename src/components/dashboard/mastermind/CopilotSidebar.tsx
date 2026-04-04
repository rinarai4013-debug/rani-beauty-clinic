'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  X,
  Send,
  MessageSquare,
  Target,
  Shield,
  DollarSign,
  Eye,
  Loader2,
  ChevronDown,
  Zap,
} from 'lucide-react';
import type { MastermindSession, MastermindPhase } from '@/types/mastermind';

// ── TYPES ──

interface CopilotSidebarProps {
  session: MastermindSession;
  isOpen: boolean;
  onClose: () => void;
}

type CopilotContext =
  | 'scan_review'
  | 'plan_discussion'
  | 'objection_handling'
  | 'closing'
  | 'general';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  context?: CopilotContext;
}

interface QuickAction {
  label: string;
  prompt: string;
  icon: React.ReactNode;
}

// ── PHASE TO CONTEXT MAP ──

function phaseToContext(phase: MastermindPhase): CopilotContext {
  switch (phase) {
    case 'scanning':
    case 'scan_complete':
      return 'scan_review';
    case 'generating_plan':
    case 'plan_ready':
    case 'provider_review':
      return 'plan_discussion';
    case 'approved':
    case 'simulating':
    case 'simulation_ready':
      return 'objection_handling';
    case 'presenting':
    case 'completed':
      return 'closing';
    default:
      return 'general';
  }
}

// ── QUICK ACTIONS BY CONTEXT ──

function getQuickActions(context: CopilotContext): QuickAction[] {
  switch (context) {
    case 'scan_review':
      return [
        {
          label: 'Explain score to patient',
          prompt:
            'Give me a script to explain this patient\'s Aura Score in a compelling, luxury way. Make it feel like a "clarity moment" — not a diagnosis.',
          icon: <Eye className="w-3 h-3" />,
        },
        {
          label: 'Key concerns to discuss',
          prompt:
            'What are the top 3 concerns I should highlight from this scan? Give me talking points for each, starting with the most visually impactful.',
          icon: <Target className="w-3 h-3" />,
        },
        {
          label: 'Treatment urgency',
          prompt:
            'Help me create urgency without fear. Compare what happens if we treat now vs. wait 6 months. Give me specific numbers and a script.',
          icon: <Zap className="w-3 h-3" />,
        },
      ];
    case 'plan_discussion':
      return [
        {
          label: 'Walk through the plan',
          prompt:
            'Give me a step-by-step walkthrough script for presenting this treatment plan. Start with clinical rationale, then results, then pricing.',
          icon: <MessageSquare className="w-3 h-3" />,
        },
        {
          label: 'Justify pricing',
          prompt:
            'How do I justify the pricing for this plan? Give me value comparisons, cost-per-result calculations, and a financing pitch with monthly numbers.',
          icon: <DollarSign className="w-3 h-3" />,
        },
        {
          label: 'Compare packages',
          prompt:
            'Walk me through how to present all three package tiers. Which should I recommend for this patient and why? Give me the verbal walkthrough.',
          icon: <Target className="w-3 h-3" />,
        },
      ];
    case 'objection_handling':
      return [
        {
          label: 'Too expensive',
          prompt:
            'The patient says it\'s too expensive. Give me a word-for-word response that reframes value without discounting. Include financing numbers.',
          icon: <DollarSign className="w-3 h-3" />,
        },
        {
          label: 'Need to think about it',
          prompt:
            'The patient says they need to think about it. Give me a response that creates authentic urgency and offers a trial close with just the first treatment.',
          icon: <Shield className="w-3 h-3" />,
        },
        {
          label: 'Is this safe?',
          prompt:
            'The patient is worried about safety. Give me a confidence-building response that references FDA clearance, clinical studies, and our expertise.',
          icon: <Shield className="w-3 h-3" />,
        },
        {
          label: 'Does it hurt?',
          prompt:
            'The patient is worried about pain. Give me a script that addresses comfort protocols and sequential comfort building for their specific treatments.',
          icon: <Shield className="w-3 h-3" />,
        },
        {
          label: 'How long until results?',
          prompt:
            'The patient wants to know when they\'ll see results. Give me specific timelines from their plan with milestone previews they can look forward to.',
          icon: <Eye className="w-3 h-3" />,
        },
      ];
    case 'closing':
      return [
        {
          label: 'Closing techniques',
          prompt:
            'Give me 3 closing techniques tailored to this specific patient. Include word-for-word scripts I can deliver naturally.',
          icon: <Target className="w-3 h-3" />,
        },
        {
          label: 'Financing pitch',
          prompt:
            'Create a compelling financing pitch for this patient. Break down their recommended package into monthly payments and compare to everyday expenses.',
          icon: <DollarSign className="w-3 h-3" />,
        },
        {
          label: 'Membership benefits',
          prompt:
            'Pitch our membership to this patient. What are the benefits they\'d care about most based on their profile? Give me the enrollment script.',
          icon: <Sparkles className="w-3 h-3" />,
        },
      ];
    case 'general':
    default:
      return [
        {
          label: 'Patient briefing',
          prompt:
            'Give me a quick pre-consultation briefing on this patient. Key concerns, budget, timeline, and what to lead with.',
          icon: <Eye className="w-3 h-3" />,
        },
        {
          label: 'Upsell opportunities',
          prompt:
            'Based on this patient\'s scan and concerns, what are the top cross-sell and upsell opportunities? Give me natural conversation bridges.',
          icon: <DollarSign className="w-3 h-3" />,
        },
        {
          label: 'Next steps',
          prompt:
            'What should be my next move with this patient based on where we are in the consultation? Give me a clear action plan.',
          icon: <Target className="w-3 h-3" />,
        },
      ];
  }
}

// ── SUGGESTED ACTIONS ──

function getSuggestedAction(session: MastermindSession): string | null {
  const scan = session.auraScanResult;
  const plan = session.mastermindPlan;
  const intake = session.intakeData;

  if (!scan) return null;

  const context = phaseToContext(session.phase);

  if (context === 'scan_review' && scan.auraScore.skinAgeDelta > 5) {
    return `Skin age is ${scan.auraScore.skinAgeDelta} years older than actual age. Lead with this visual gap to create motivation.`;
  }

  if (context === 'plan_discussion' && plan && plan.packages.length > 0) {
    const recommended = plan.packages.find(
      (p) => 'highlighted' in p && p.highlighted
    );
    if (recommended) {
      const budget = intake?.budget;
      const monthly12 = Math.round(recommended.totalPrice / 12);
      const monthly24 = Math.round(recommended.totalPrice / 24);
      return budget
        ? `Patient budget: ${budget} -- suggest the ${recommended.name} at $${recommended.totalPrice.toLocaleString()} with financing at $${monthly24}/mo (24mo) or $${monthly12}/mo (12mo)`
        : `Recommend ${recommended.name} at $${recommended.totalPrice.toLocaleString()} -- financing: $${monthly24}/mo (24mo) or $${monthly12}/mo (12mo)`;
    }
  }

  if (context === 'objection_handling' && scan.auraScore.overall < 60) {
    return `Low Aura Score (${scan.auraScore.overall}/100) creates strong urgency. Without treatment, projected to drop to ${scan.predictiveMetrics.withoutIntervention.sixMonths.auraScore} in 6 months.`;
  }

  if (context === 'closing' && plan) {
    const totalCost = [
      ...plan.recommendations.primary,
      ...plan.recommendations.complementary,
    ].reduce((sum, t) => sum + t.totalEstimate, 0);
    return `Total plan value: $${totalCost.toLocaleString()}. Use assumptive close: "Let's get you scheduled for your first session -- do you prefer mornings or afternoons?"`;
  }

  if (scan.auraScore.overall < 50) {
    return `Critical Aura Score (${scan.auraScore.overall}/100). Frame as an opportunity for dramatic transformation, not a problem.`;
  }

  return null;
}

// ── MAIN COMPONENT ──

export default function CopilotSidebar({
  session,
  isOpen,
  onClose,
}: CopilotSidebarProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeContext, setActiveContext] = useState<CopilotContext>(() =>
    phaseToContext(session.phase)
  );
  const [showQuickActions, setShowQuickActions] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Update context when session phase changes
  useEffect(() => {
    setActiveContext(phaseToContext(session.phase));
  }, [session.phase]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when sidebar opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // ── STREAMING FETCH ──

  const sendMessage = useCallback(
    async (prompt: string, ctx?: CopilotContext) => {
      if (!prompt.trim() || isStreaming) return;

      const context = ctx || activeContext;
      const userMsg: ChatMessage = {
        id: `user_${Date.now()}`,
        role: 'user',
        content: prompt.trim(),
        timestamp: new Date(),
        context,
      };

      const assistantMsgId = `asst_${Date.now()}`;
      const assistantMsg: ChatMessage = {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        context,
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setInputValue('');
      setIsStreaming(true);
      setShowQuickActions(false);

      // Abort any existing stream
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        const res = await fetch('/api/mastermind/copilot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: session.id,
            prompt,
            context,
          }),
          signal: abortController.signal,
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          throw new Error(errData?.error || `Request failed (${res.status})`);
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error('No response stream');

        const decoder = new TextDecoder();
        let accumulated = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          accumulated += chunk;

          // Update the assistant message with accumulated text
          const currentText = accumulated;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId ? { ...m, content: currentText } : m
            )
          );
        }

        // Final update
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId ? { ...m, content: accumulated } : m
          )
        );
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return;

        const errorMessage =
          err instanceof Error ? err.message : 'Failed to get response';
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content: `**Error:** ${errorMessage}. Please try again.`,
                }
              : m
          )
        );
      } finally {
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [activeContext, isStreaming, session.id]
  );

  // ── HANDLERS ──

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  const handleQuickAction = (action: QuickAction) => {
    sendMessage(action.prompt);
  };

  const handleContextSwitch = (ctx: CopilotContext) => {
    setActiveContext(ctx);
    setShowQuickActions(true);
  };

  // ── DERIVED DATA ──

  const quickActions = getQuickActions(activeContext);
  const suggestedAction = getSuggestedAction(session);

  const contextTabs: { id: CopilotContext; label: string; icon: typeof Target }[] = [
    { id: 'scan_review', label: 'Scan', icon: Eye },
    { id: 'plan_discussion', label: 'Plan', icon: Target },
    { id: 'objection_handling', label: 'Objections', icon: Shield },
    { id: 'closing', label: 'Close', icon: DollarSign },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md z-50 flex flex-col"
            style={{ background: '#0F1D2C' }}
          >
            {/* ── Header ── */}
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: '1px solid rgba(201, 169, 110, 0.2)' }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(201, 169, 110, 0.15)' }}
                >
                  <Sparkles className="w-4 h-4" style={{ color: '#C9A96E' }} />
                </div>
                <div>
                  <h2
                    className="text-sm font-semibold"
                    style={{ color: '#F8F6F1' }}
                  >
                    AI Copilot
                  </h2>
                  <p className="text-[10px]" style={{ color: '#C9A96E' }}>
                    {session.patientName || 'Patient'} &middot;{' '}
                    {activeContext.replace(/_/g, ' ')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
                style={{ background: 'rgba(248, 246, 241, 0.1)' }}
              >
                <X className="w-3.5 h-3.5" style={{ color: '#F8F6F1' }} />
              </button>
            </div>

            {/* ── Context Tabs ── */}
            <div
              className="flex px-2 py-1.5 gap-1"
              style={{ borderBottom: '1px solid rgba(201, 169, 110, 0.1)' }}
            >
              {contextTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeContext === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleContextSwitch(tab.id)}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-[11px] font-medium transition-all"
                    style={{
                      background: isActive
                        ? 'rgba(201, 169, 110, 0.15)'
                        : 'transparent',
                      color: isActive ? '#C9A96E' : 'rgba(248, 246, 241, 0.4)',
                    }}
                  >
                    <Icon className="w-3 h-3" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* ── Suggested Action Banner ── */}
            {suggestedAction && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-3 mt-3 p-2.5 rounded-lg"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(201, 169, 110, 0.15), rgba(201, 169, 110, 0.05))',
                  border: '1px solid rgba(201, 169, 110, 0.25)',
                }}
              >
                <div className="flex items-start gap-2">
                  <Zap
                    className="w-3.5 h-3.5 mt-0.5 flex-shrink-0"
                    style={{ color: '#C9A96E' }}
                  />
                  <div>
                    <p
                      className="text-[10px] font-semibold uppercase tracking-wider mb-0.5"
                      style={{ color: '#C9A96E' }}
                    >
                      Suggested Action
                    </p>
                    <p
                      className="text-xs leading-relaxed"
                      style={{ color: '#F8F6F1' }}
                    >
                      {suggestedAction}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Messages Area ── */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
              {/* Quick Actions (shown when no messages or toggled) */}
              {(messages.length === 0 || showQuickActions) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-2"
                >
                  {messages.length === 0 && (
                    <div className="text-center py-4">
                      <div
                        className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                        style={{ background: 'rgba(201, 169, 110, 0.1)' }}
                      >
                        <Sparkles
                          className="w-6 h-6"
                          style={{ color: '#C9A96E' }}
                        />
                      </div>
                      <p
                        className="text-sm font-medium mb-1"
                        style={{ color: '#F8F6F1' }}
                      >
                        Ready to assist
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: 'rgba(248, 246, 241, 0.5)' }}
                      >
                        Tap a quick action or ask anything about this
                        consultation.
                      </p>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    {quickActions.map((action, i) => (
                      <motion.button
                        key={action.label}
                        type="button"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => handleQuickAction(action)}
                        disabled={isStreaming}
                        className="w-full flex items-center gap-2.5 p-2.5 rounded-lg text-left transition-all group"
                        style={{
                          background: 'rgba(248, 246, 241, 0.04)',
                          border: '1px solid rgba(201, 169, 110, 0.15)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background =
                            'rgba(201, 169, 110, 0.1)';
                          e.currentTarget.style.borderColor =
                            'rgba(201, 169, 110, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background =
                            'rgba(248, 246, 241, 0.04)';
                          e.currentTarget.style.borderColor =
                            'rgba(201, 169, 110, 0.15)';
                        }}
                      >
                        <div
                          className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                          style={{ background: 'rgba(201, 169, 110, 0.15)' }}
                        >
                          <span style={{ color: '#C9A96E' }}>
                            {action.icon}
                          </span>
                        </div>
                        <span
                          className="text-xs font-medium"
                          style={{ color: '#F8F6F1' }}
                        >
                          {action.label}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Toggle quick actions when messages exist */}
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowQuickActions(!showQuickActions)}
                  className="w-full flex items-center justify-center gap-1 py-1 text-[10px] font-medium rounded"
                  style={{ color: 'rgba(201, 169, 110, 0.6)' }}
                >
                  <ChevronDown
                    className={`w-3 h-3 transition-transform ${showQuickActions ? 'rotate-180' : ''}`}
                  />
                  {showQuickActions ? 'Hide' : 'Show'} quick actions
                </button>
              )}

              {/* Chat Messages */}
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[88%] rounded-xl px-3 py-2.5 ${msg.role === 'user' ? 'rounded-br-sm' : 'rounded-bl-sm'}`}
                    style={
                      msg.role === 'user'
                        ? {
                            background:
                              'linear-gradient(135deg, #C9A96E, #B8944F)',
                            color: '#0F1D2C',
                          }
                        : {
                            background: 'rgba(248, 246, 241, 0.06)',
                            border: '1px solid rgba(248, 246, 241, 0.08)',
                            color: '#F8F6F1',
                          }
                    }
                  >
                    {msg.role === 'assistant' && msg.content === '' ? (
                      <div className="flex items-center gap-2 py-1">
                        <Loader2
                          className="w-3.5 h-3.5 animate-spin"
                          style={{ color: '#C9A96E' }}
                        />
                        <span
                          className="text-xs"
                          style={{ color: 'rgba(248, 246, 241, 0.5)' }}
                        >
                          Thinking...
                        </span>
                      </div>
                    ) : (
                      <div
                        className="text-xs leading-relaxed whitespace-pre-wrap copilot-message"
                        dangerouslySetInnerHTML={{
                          __html: formatMessageContent(msg.content),
                        }}
                      />
                    )}
                    <p
                      className="text-[9px] mt-1.5 opacity-40"
                      style={{
                        color:
                          msg.role === 'user' ? '#0F1D2C' : '#F8F6F1',
                      }}
                    >
                      {msg.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </motion.div>
              ))}

              {/* Scroll anchor */}
              <div ref={messagesEndRef} />
            </div>

            {/* ── Input Area ── */}
            <div
              className="px-3 pb-3 pt-2"
              style={{ borderTop: '1px solid rgba(201, 169, 110, 0.1)' }}
            >
              <form onSubmit={handleSubmit} className="flex gap-2">
                <div
                  className="flex-1 rounded-xl overflow-hidden"
                  style={{
                    background: 'rgba(248, 246, 241, 0.06)',
                    border: '1px solid rgba(201, 169, 110, 0.2)',
                  }}
                >
                  <textarea
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask the copilot anything..."
                    disabled={isStreaming}
                    rows={1}
                    className="w-full px-3 py-2.5 text-xs bg-transparent resize-none outline-none placeholder-opacity-40"
                    style={{
                      color: '#F8F6F1',
                      caretColor: '#C9A96E',
                    }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!inputValue.trim() || isStreaming}
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-all flex-shrink-0"
                  style={{
                    background:
                      inputValue.trim() && !isStreaming
                        ? 'linear-gradient(135deg, #C9A96E, #B8944F)'
                        : 'rgba(248, 246, 241, 0.06)',
                    opacity: inputValue.trim() && !isStreaming ? 1 : 0.4,
                  }}
                >
                  {isStreaming ? (
                    <Loader2
                      className="w-4 h-4 animate-spin"
                      style={{ color: '#C9A96E' }}
                    />
                  ) : (
                    <Send
                      className="w-4 h-4"
                      style={{
                        color:
                          inputValue.trim() ? '#0F1D2C' : '#F8F6F1',
                      }}
                    />
                  )}
                </button>
              </form>
              <p
                className="text-[9px] text-center mt-1.5"
                style={{ color: 'rgba(248, 246, 241, 0.3)' }}
              >
                AI-powered by Claude &middot; Rani Beauty Clinic
              </p>
            </div>
          </motion.div>

          {/* Inline styles for message formatting */}
          <style jsx global>{`
            .copilot-message strong {
              color: #C9A96E;
              font-weight: 600;
            }
            .copilot-message em {
              font-style: italic;
              opacity: 0.85;
            }
            .copilot-message ul,
            .copilot-message ol {
              margin: 4px 0;
              padding-left: 16px;
            }
            .copilot-message li {
              margin-bottom: 2px;
            }
            .copilot-message p {
              margin-bottom: 6px;
            }
            .copilot-message p:last-child {
              margin-bottom: 0;
            }
          `}</style>
        </>
      )}
    </AnimatePresence>
  );
}

// ── MESSAGE FORMATTING ──

function formatMessageContent(content: string): string {
  // Convert markdown-like patterns to HTML for display
  let html = content
    // Escape HTML first
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Bold: **text**
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic: *text*
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Bullet points: - item or * item at line start
    .replace(/^[-*]\s+(.+)$/gm, '<li>$1</li>')
    // Numbered lists: 1. item
    .replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>')
    // Wrap consecutive <li> in <ul>
    .replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>')
    // Headers: ### text
    .replace(
      /^###\s+(.+)$/gm,
      '<p style="color: #C9A96E; font-weight: 600; margin-top: 8px;">$1</p>'
    )
    // Paragraphs: double newline
    .replace(/\n\n/g, '</p><p>')
    // Single newlines within paragraphs
    .replace(/\n/g, '<br />');

  // Wrap in paragraph if not already wrapped
  if (!html.startsWith('<')) {
    html = `<p>${html}</p>`;
  }

  return html;
}
