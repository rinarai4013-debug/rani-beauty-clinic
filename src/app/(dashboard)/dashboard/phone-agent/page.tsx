'use client';

import { motion } from 'framer-motion';
import { Phone, PhoneIncoming, PhoneMissed, Clock, TrendingUp, AlertTriangle, Star, ArrowRight, Mic, Brain, Shield } from 'lucide-react';
import KPICard from '@/components/dashboard/cards/KPICard';
import ProgressBar from '@/components/dashboard/charts/ProgressBar';
import ProgressRing from '@/components/dashboard/charts/ProgressRing';
import { useDashboardData } from '@/hooks/useDashboardData';
import type { PhoneAgentSetup, CallFlow, AgentRecommendation } from '@/lib/phone/vapi-agent';

interface PhoneAgentResponse {
  success: boolean;
  data: PhoneAgentSetup;
}

const INTENT_COLORS: Record<string, string> = {
  'Book Appointment': 'bg-green-50 text-green-700 border-green-200',
  'Service Inquiry': 'bg-blue-50 text-blue-700 border-blue-200',
  'Confirm/Reschedule': 'bg-amber-50 text-amber-700 border-amber-200',
  'Pricing Question': 'bg-purple-50 text-purple-700 border-purple-200',
  'General FAQ': 'bg-gray-50 text-gray-700 border-gray-200',
};

const PRIORITY_COLORS: Record<string, string> = {
  high: 'bg-red-50 text-red-700 border-red-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  low: 'bg-green-50 text-green-700 border-green-200',
};

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  voice: Mic,
  flow: ArrowRight,
  knowledge: Brain,
  performance: TrendingUp,
  hours: Clock,
};

export default function PhoneAgentPage() {
  const { data: raw, isLoading } = useDashboardData<PhoneAgentResponse>('/phone-agent');
  const data = raw?.data;

  const analytics = data?.analytics;
  const metrics = data?.performanceMetrics;
  const flows = data?.callFlows || [];
  const recs = data?.recommendations || [];
  const assistant = data?.assistantConfig;

  const totalCalls = analytics?.totalCalls || 0;
  const answered = analytics?.answeredCalls || 0;
  const missed = analytics?.missedCalls || 0;
  const avgDuration = analytics?.avgDuration || 0;
  const bookingConversion = analytics?.bookingConversion || 0;
  const satisfaction = analytics?.satisfaction || 0;
  const topIntents = analytics?.topIntents || [];
  const peakTimes = analytics?.peakCallTimes || [];
  const callsByDay = analytics?.callsByDay || [];

  const answerRate = totalCalls > 0 ? Math.round((answered / totalCalls) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading text-rani-navy">AI Phone Agent</h1>
        <p className="text-sm font-body text-rani-muted mt-1">Vapi-powered AI receptionist — handles calls, books appointments, and answers questions 24/7</p>
      </div>

      {/* Hero KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <KPICard title="Total Calls" value={totalCalls} icon="phone" size="hero" />
        <KPICard title="Answer Rate" value={answerRate} suffix="%" icon="check-circle" />
        <KPICard title="Booking Conversion" value={bookingConversion} suffix="%" icon="trending-up" />
        <KPICard title="Satisfaction" value={satisfaction} suffix="/100" icon="star" />
      </div>

      {/* Performance Metrics + Call Volume by Day */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Metrics */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5">
          <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
            Performance Metrics
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-body text-rani-muted">First Response Time</span>
              <span className="text-sm font-body font-semibold text-rani-navy">{((metrics?.firstResponseTime || 0) / 1000).toFixed(1)}s</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-body text-rani-muted">Resolution Rate</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-body font-semibold text-rani-navy">{(metrics?.resolutionRate || 0).toFixed(1)}%</span>
                <ProgressRing value={metrics?.resolutionRate || 0} size={28} strokeWidth={3} colorMode="gold" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-body text-rani-muted">Transfer Rate</span>
              <span className="text-sm font-body font-semibold text-rani-navy">{(metrics?.transferRate || 0).toFixed(1)}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-body text-rani-muted">Avg Handle Time</span>
              <span className="text-sm font-body font-semibold text-rani-navy">{Math.round((metrics?.avgHandleTime || 0) / 60)}m {(metrics?.avgHandleTime || 0) % 60}s</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-body text-rani-muted">Cost per Call</span>
              <span className="text-sm font-body font-semibold text-green-600">${(metrics?.costPerCall || 0).toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-body text-rani-muted">Call Quality Score</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-body font-semibold text-rani-navy">{metrics?.callQualityScore || 0}/100</span>
                <ProgressRing value={metrics?.callQualityScore || 0} size={28} strokeWidth={3} colorMode="gold" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-body text-rani-muted">Sentiment Score</span>
              <span className="text-sm font-body font-semibold text-rani-navy">{metrics?.sentimentScore || 0}/100</span>
            </div>
          </div>
        </div>

        {/* Call Volume by Day */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5">
          <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
            Call Volume by Day
          </h3>
          <div className="space-y-3">
            {callsByDay.map((dayData, i) => {
              const maxCount = Math.max(...callsByDay.map(d => d.count));
              return (
                <motion.div
                  key={dayData.day}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div className="flex justify-between mb-1">
                    <span className="text-xs font-body font-medium text-rani-navy">{dayData.day}</span>
                    <span className="text-xs font-body font-semibold text-rani-navy">{dayData.count} calls</span>
                  </div>
                  <ProgressBar current={dayData.count} target={maxCount} showPercentage={false} height={6} colorMode="gold" />
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Call Intents + Peak Call Times */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Intents */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5">
          <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
            Top Call Intents
          </h3>
          <div className="space-y-3">
            {topIntents.map((intent, i) => (
              <motion.div
                key={intent.intent}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`p-3 rounded-lg border ${INTENT_COLORS[intent.intent] || 'bg-gray-50 text-gray-700 border-gray-200'}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-body font-semibold">{intent.intent}</span>
                  <span className="text-[10px] font-body font-semibold">{intent.percentage}% of calls</span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-body opacity-70">
                  <span>{intent.count} calls · Avg {Math.round(intent.avgDuration / 60)}m {intent.avgDuration % 60}s</span>
                  <span className="font-semibold">{intent.conversionRate}% convert</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Peak Call Times */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5">
          <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
            Peak Call Times
          </h3>
          <div className="space-y-2">
            {peakTimes.map((timeSlot, i) => {
              const maxCalls = Math.max(...peakTimes.map(t => t.count));
              const isPeak = timeSlot.count > maxCalls * 0.7;
              return (
                <motion.div
                  key={timeSlot.hour}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-3"
                >
                  <span className="text-xs font-body font-medium text-rani-muted w-16">
                    {timeSlot.hour > 12 ? `${timeSlot.hour - 12}:00 PM` : `${timeSlot.hour}:00 AM`}
                  </span>
                  <div className="flex-1">
                    <ProgressBar
                      current={timeSlot.count}
                      target={maxCalls}
                      showPercentage={false}
                      height={8}
                      colorMode={isPeak ? 'gold' : 'gold'}
                    />
                  </div>
                  <span className={`text-xs font-body font-semibold w-10 text-right ${isPeak ? 'text-rani-gold' : 'text-rani-navy'}`}>
                    {timeSlot.count}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Call Flows */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5">
        <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
          Call Flows ({flows.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {flows.map((flow, i) => (
            <motion.div
              key={flow.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-4 rounded-lg bg-rani-cream/30 border border-rani-border/50"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-body font-semibold text-rani-navy">{flow.name}</h4>
                <span className="text-[10px] px-2 py-0.5 rounded bg-rani-navy/5 text-rani-muted font-body">
                  {flow.estimatedDuration}
                </span>
              </div>
              <p className="text-[10px] font-body text-rani-muted mb-3">{flow.trigger}</p>
              <div className="space-y-1.5">
                {flow.steps.slice(0, 4).map((step) => (
                  <div key={step.order} className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-rani-gold/20 text-rani-gold flex items-center justify-center text-[8px] font-semibold flex-shrink-0 mt-0.5">
                      {step.order}
                    </span>
                    <span className="text-[10px] font-body text-rani-navy/70 capitalize">{step.action.replace(/_/g, ' ')}</span>
                  </div>
                ))}
                {flow.steps.length > 4 && (
                  <p className="text-[9px] font-body text-rani-muted pl-6">+{flow.steps.length - 4} more steps</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* AI Recommendations */}
      {recs.length > 0 && (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5">
          <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
            AI Recommendations ({recs.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recs.map((rec, i) => {
              const Icon = CATEGORY_ICONS[rec.category] || TrendingUp;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`p-3 rounded-lg border ${PRIORITY_COLORS[rec.priority]}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="text-xs font-body font-semibold">{rec.title}</span>
                  </div>
                  <p className="text-[10px] font-body opacity-80">{rec.description}</p>
                  <p className="text-[10px] font-body mt-1 opacity-60 italic">{rec.expectedImpact}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Vapi Configuration Status */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-rani-navy to-rani-navy-light rounded-xl p-6 text-white"
      >
        <h3 className="text-sm font-body font-semibold uppercase tracking-wider text-rani-gold mb-3">
          Vapi Assistant Configuration
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <p className="text-[10px] font-body text-white/40 uppercase">Platform</p>
            <p className="text-sm font-body font-semibold text-white">Vapi.ai</p>
          </div>
          <div>
            <p className="text-[10px] font-body text-white/40 uppercase">Voice</p>
            <p className="text-sm font-body font-semibold text-white">{assistant?.voice?.voiceId || 'aura-luna-en'}</p>
          </div>
          <div>
            <p className="text-[10px] font-body text-white/40 uppercase">Model</p>
            <p className="text-sm font-body font-semibold text-white">{assistant?.model?.model || 'gpt-4o-mini'}</p>
          </div>
          <div>
            <p className="text-[10px] font-body text-white/40 uppercase">Max Call Duration</p>
            <p className="text-sm font-body font-semibold text-white">{(assistant?.maxDurationSeconds || 600) / 60} minutes</p>
          </div>
        </div>
        <p className="text-xs font-body text-white/60 mt-3">
          AI Phone Agent handles: appointment booking, service inquiries, rescheduling, FAQs, and after-hours calls
        </p>
      </motion.div>
    </div>
  );
}
