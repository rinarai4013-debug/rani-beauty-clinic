'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight, ChevronLeft, Send, Calendar, Users,
  FileText, Sparkles, Eye, Check, Beaker,
} from 'lucide-react';
import AudienceBuilder from './AudienceBuilder';
import type {
  Campaign,
  CampaignType,
  AudienceFilter,
  ABTest,
  MessageChannel,
} from '@/types/communications';

interface CampaignBuilderProps {
  onSubmit: (campaign: Partial<Campaign>) => void;
  onCancel: () => void;
  initialData?: Partial<Campaign>;
}

const STEPS = [
  { id: 'basics', label: 'Name & Type' },
  { id: 'audience', label: 'Audience' },
  { id: 'content', label: 'Content' },
  { id: 'ab_test', label: 'A/B Test' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'review', label: 'Review' },
] as const;

const CAMPAIGN_TYPES: { value: CampaignType; label: string; description: string }[] = [
  { value: 'promotional', label: 'Promotional', description: 'Special offers and deals' },
  { value: 'educational', label: 'Educational', description: 'Treatment information and tips' },
  { value: 'reactivation', label: 'Reactivation', description: 'Win back lapsed clients' },
  { value: 'event', label: 'Event', description: 'Event invitations and announcements' },
  { value: 'seasonal', label: 'Seasonal', description: 'Seasonal specials and themes' },
  { value: 'birthday', label: 'Birthday', description: 'Birthday greetings and offers' },
];

export default function CampaignBuilder({
  onSubmit,
  onCancel,
  initialData,
}: CampaignBuilderProps) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState(initialData?.name ?? '');
  const [type, setType] = useState<CampaignType>(initialData?.type ?? 'promotional');
  const [channel, setChannel] = useState<MessageChannel | 'both'>(initialData?.channel ?? 'both');
  const [subject, setSubject] = useState(initialData?.subject ?? '');
  const [body, setBody] = useState(initialData?.body ?? '');
  const [audienceFilter, setAudienceFilter] = useState<AudienceFilter>(
    initialData?.audienceFilter ?? {
      groups: [],
      logic: 'AND',
      excludeUnsubscribed: true,
      excludeRecentlyContacted: true,
    }
  );
  const [abEnabled, setAbEnabled] = useState(initialData?.abTest?.enabled ?? false);
  const [abVariantB, setAbVariantB] = useState(initialData?.abTest?.variantB?.body ?? '');
  const [abSubjectB, setAbSubjectB] = useState(initialData?.abTest?.variantB?.subject ?? '');
  const [abSplit, setAbSplit] = useState(initialData?.abTest?.splitPercent ?? 50);
  const [abMetric, setAbMetric] = useState<ABTest['winnerMetric']>(
    initialData?.abTest?.winnerMetric ?? 'open_rate'
  );
  const [scheduledAt, setScheduledAt] = useState(initialData?.scheduledAt ?? '');
  const [sendNow, setSendNow] = useState(true);

  const currentStep = STEPS[step];

  const handleNext = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleSubmit = () => {
    const campaign: Partial<Campaign> = {
      name,
      type,
      channel,
      subject: channel !== 'sms' ? subject : undefined,
      body,
      audienceFilter,
      scheduledAt: sendNow ? undefined : scheduledAt,
      status: sendNow ? 'sending' : 'scheduled',
      isDrip: false,
    };

    if (abEnabled) {
      campaign.abTest = {
        enabled: true,
        splitPercent: abSplit,
        variantA: { subject, body, label: 'Variant A' },
        variantB: { subject: abSubjectB, body: abVariantB, label: 'Variant B' },
        winnerMetric: abMetric,
      };
    }

    onSubmit(campaign);
  };

  const canProceed = () => {
    switch (currentStep.id) {
      case 'basics': return name.trim().length > 0;
      case 'audience': return true;
      case 'content': return body.trim().length > 0;
      case 'ab_test': return !abEnabled || abVariantB.trim().length > 0;
      case 'schedule': return sendNow || scheduledAt.length > 0;
      case 'review': return true;
      default: return true;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-rani-border overflow-hidden">
      {/* Step Indicator */}
      <div className="px-4 py-3 border-b border-rani-border bg-gray-50/50">
        <div className="flex items-center gap-1">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <button
                onClick={() => i <= step && setStep(i)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-body font-medium transition-colors ${
                  i === step
                    ? 'bg-rani-navy text-white'
                    : i < step
                      ? 'bg-emerald-50 text-emerald-600 cursor-pointer'
                      : 'text-rani-muted'
                }`}
              >
                {i < step ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <span className="w-4 h-4 rounded-full border flex items-center justify-center text-[9px]">
                    {i + 1}
                  </span>
                )}
                <span className="hidden sm:inline">{s.label}</span>
              </button>
              {i < STEPS.length - 1 && (
                <ChevronRight className="w-3 h-3 text-rani-border mx-0.5" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="p-5 min-h-[400px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Step 1: Basics */}
            {currentStep.id === 'basics' && (
              <div className="space-y-5">
                <div>
                  <label className="block text-[11px] font-body font-semibold uppercase tracking-wider text-rani-muted mb-1.5">
                    Campaign Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Spring Renewal Campaign"
                    className="w-full px-3 py-2 rounded-lg border border-rani-border text-sm font-body
                               placeholder:text-rani-muted focus:outline-none focus:ring-2 focus:ring-rani-gold/30"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-body font-semibold uppercase tracking-wider text-rani-muted mb-2">
                    Campaign Type
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {CAMPAIGN_TYPES.map(ct => (
                      <button
                        key={ct.value}
                        onClick={() => setType(ct.value)}
                        className={`p-3 rounded-lg border text-left transition-colors ${
                          type === ct.value
                            ? 'border-rani-navy bg-rani-navy/5'
                            : 'border-rani-border hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-xs font-body font-semibold text-rani-navy">{ct.label}</span>
                        <p className="text-[10px] font-body text-rani-muted mt-0.5">{ct.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-body font-semibold uppercase tracking-wider text-rani-muted mb-2">
                    Channel
                  </label>
                  <div className="flex gap-2">
                    {(['sms', 'email', 'both'] as const).map(ch => (
                      <button
                        key={ch}
                        onClick={() => setChannel(ch)}
                        className={`px-4 py-2 rounded-lg border text-xs font-body font-medium capitalize transition-colors ${
                          channel === ch
                            ? 'border-rani-navy bg-rani-navy text-white'
                            : 'border-rani-border text-rani-text hover:bg-gray-50'
                        }`}
                      >
                        {ch === 'both' ? 'SMS + Email' : ch.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Audience */}
            {currentStep.id === 'audience' && (
              <div>
                <h3 className="text-sm font-body font-semibold text-rani-navy mb-3">
                  Define Your Audience
                </h3>
                <AudienceBuilder
                  filter={audienceFilter}
                  onChange={setAudienceFilter}
                />
              </div>
            )}

            {/* Step 3: Content */}
            {currentStep.id === 'content' && (
              <div className="space-y-4">
                {(channel === 'email' || channel === 'both') && (
                  <div>
                    <label className="block text-[11px] font-body font-semibold uppercase tracking-wider text-rani-muted mb-1.5">
                      Subject Line
                    </label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Email subject..."
                      className="w-full px-3 py-2 rounded-lg border border-rani-border text-sm font-body
                                 placeholder:text-rani-muted focus:outline-none focus:ring-2 focus:ring-rani-gold/30"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-[11px] font-body font-semibold uppercase tracking-wider text-rani-muted mb-1.5">
                    Message Body
                  </label>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Write your campaign message..."
                    rows={8}
                    className="w-full px-3 py-2 rounded-lg border border-rani-border text-sm font-body
                               placeholder:text-rani-muted focus:outline-none focus:ring-2 focus:ring-rani-gold/30 resize-none"
                  />
                  <p className="text-[10px] font-body text-rani-muted mt-1">
                    Available variables: {'{{clientName}}'}, {'{{serviceName}}'}, {'{{providerName}}'}, {'{{clinicName}}'}
                  </p>
                </div>
              </div>
            )}

            {/* Step 4: A/B Test */}
            {currentStep.id === 'ab_test' && (
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={abEnabled}
                    onChange={(e) => setAbEnabled(e.target.checked)}
                    className="w-4 h-4 rounded border-rani-border text-rani-navy focus:ring-rani-gold/30"
                  />
                  <div>
                    <span className="text-sm font-body font-semibold text-rani-navy flex items-center gap-1.5">
                      <Beaker className="w-4 h-4" />
                      Enable A/B Testing
                    </span>
                    <p className="text-[11px] font-body text-rani-muted">
                      Split your audience to test different content variations
                    </p>
                  </div>
                </label>

                <AnimatePresence>
                  {abEnabled && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4 pt-3 border-t border-rani-border/50"
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-body font-semibold text-rani-navy mb-1.5">
                            Variant A (Original)
                          </label>
                          <div className="p-3 rounded-lg bg-gray-50 border border-rani-border">
                            <p className="text-xs font-body text-rani-text">{body.slice(0, 100)}...</p>
                          </div>
                        </div>
                        <div>
                          <label className="block text-[11px] font-body font-semibold text-rani-navy mb-1.5">
                            Variant B
                          </label>
                          {(channel === 'email' || channel === 'both') && (
                            <input
                              type="text"
                              value={abSubjectB}
                              onChange={(e) => setAbSubjectB(e.target.value)}
                              placeholder="Subject B..."
                              className="w-full px-2 py-1.5 rounded-md border border-rani-border text-xs font-body mb-2
                                         placeholder:text-rani-muted focus:outline-none focus:ring-1 focus:ring-rani-gold/30"
                            />
                          )}
                          <textarea
                            value={abVariantB}
                            onChange={(e) => setAbVariantB(e.target.value)}
                            placeholder="Write variant B message..."
                            rows={3}
                            className="w-full px-2 py-1.5 rounded-md border border-rani-border text-xs font-body
                                       placeholder:text-rani-muted focus:outline-none focus:ring-1 focus:ring-rani-gold/30 resize-none"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div>
                          <label className="block text-[11px] font-body font-semibold text-rani-muted mb-1">
                            Split
                          </label>
                          <select
                            value={abSplit}
                            onChange={(e) => setAbSplit(Number(e.target.value))}
                            className="text-xs font-body px-2 py-1.5 rounded-md border border-rani-border focus:ring-1 focus:ring-rani-gold/30"
                          >
                            <option value={50}>50/50</option>
                            <option value={70}>70/30</option>
                            <option value={80}>80/20</option>
                            <option value={90}>90/10</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-body font-semibold text-rani-muted mb-1">
                            Winner Metric
                          </label>
                          <select
                            value={abMetric}
                            onChange={(e) => setAbMetric(e.target.value as ABTest['winnerMetric'])}
                            className="text-xs font-body px-2 py-1.5 rounded-md border border-rani-border focus:ring-1 focus:ring-rani-gold/30"
                          >
                            <option value="open_rate">Open Rate</option>
                            <option value="click_rate">Click Rate</option>
                            <option value="conversion_rate">Conversion Rate</option>
                          </select>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Step 5: Schedule */}
            {currentStep.id === 'schedule' && (
              <div className="space-y-4">
                <div className="flex gap-3">
                  <button
                    onClick={() => setSendNow(true)}
                    className={`flex-1 p-4 rounded-lg border text-left transition-colors ${
                      sendNow
                        ? 'border-rani-navy bg-rani-navy/5'
                        : 'border-rani-border hover:bg-gray-50'
                    }`}
                  >
                    <Send className="w-5 h-5 text-rani-navy mb-1" />
                    <span className="text-sm font-body font-semibold text-rani-navy block">Send Now</span>
                    <span className="text-[11px] font-body text-rani-muted">Send immediately after review</span>
                  </button>
                  <button
                    onClick={() => setSendNow(false)}
                    className={`flex-1 p-4 rounded-lg border text-left transition-colors ${
                      !sendNow
                        ? 'border-rani-navy bg-rani-navy/5'
                        : 'border-rani-border hover:bg-gray-50'
                    }`}
                  >
                    <Calendar className="w-5 h-5 text-rani-navy mb-1" />
                    <span className="text-sm font-body font-semibold text-rani-navy block">Schedule</span>
                    <span className="text-[11px] font-body text-rani-muted">Pick a future date and time</span>
                  </button>
                </div>

                {!sendNow && (
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-rani-border text-sm font-body
                               focus:outline-none focus:ring-2 focus:ring-rani-gold/30"
                  />
                )}
              </div>
            )}

            {/* Step 6: Review */}
            {currentStep.id === 'review' && (
              <div className="space-y-4">
                <h3 className="text-sm font-body font-semibold text-rani-navy">Campaign Summary</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <ReviewItem label="Name" value={name} />
                    <ReviewItem label="Type" value={type} />
                    <ReviewItem label="Channel" value={channel === 'both' ? 'SMS + Email' : channel.toUpperCase()} />
                    <ReviewItem label="Schedule" value={sendNow ? 'Send immediately' : scheduledAt} />
                    <ReviewItem label="A/B Test" value={abEnabled ? 'Enabled' : 'Disabled'} />
                    <ReviewItem label="Segments" value={`${audienceFilter.groups.length} group(s)`} />
                  </div>
                  <div className="rounded-lg border border-rani-border p-3">
                    <span className="text-[11px] font-body font-semibold uppercase tracking-wider text-rani-muted">
                      Preview
                    </span>
                    {subject && (
                      <p className="text-xs font-body font-semibold text-rani-navy mt-2">{subject}</p>
                    )}
                    <p className="text-xs font-body text-rani-text mt-1 whitespace-pre-wrap">{body}</p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-rani-border bg-gray-50/50">
        <button
          onClick={step === 0 ? onCancel : handleBack}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-body font-medium text-rani-muted hover:text-rani-text transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          {step === 0 ? 'Cancel' : 'Back'}
        </button>
        {step === STEPS.length - 1 ? (
          <button
            onClick={handleSubmit}
            className="flex items-center gap-2 px-6 py-2 rounded-lg bg-rani-navy text-white text-xs font-body font-semibold
                       hover:bg-rani-navy-light transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            {sendNow ? 'Send Campaign' : 'Schedule Campaign'}
          </button>
        ) : (
          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-rani-navy text-white text-xs font-body font-semibold
                       hover:bg-rani-navy-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-[10px] font-body font-semibold uppercase tracking-wider text-rani-muted">{label}</span>
      <p className="text-xs font-body text-rani-navy capitalize">{value}</p>
    </div>
  );
}
