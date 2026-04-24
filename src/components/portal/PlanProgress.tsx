'use client';

import { CheckCircle2, Circle, Clock, Sparkles } from 'lucide-react';

export interface PlanStep {
  id: string;
  treatment: string;
  description?: string;
  scheduledDate?: string;
  completedDate?: string;
  status: 'completed' | 'scheduled' | 'upcoming' | 'recommended';
  sessionNumber?: number;
  totalSessions?: number;
}

export interface TreatmentPlan {
  id: string;
  name: string;
  goal: string;
  startDate: string;
  estimatedEndDate?: string;
  steps: PlanStep[];
  overallProgress: number; // 0-100
}

interface PlanProgressProps {
  plan: TreatmentPlan;
  compact?: boolean;
}

export default function PlanProgress({ plan, compact = false }: PlanProgressProps) {
  const completedSteps = plan.steps.filter((s) => s.status === 'completed').length;
  const totalSteps = plan.steps.length;

  if (compact) {
    return (
      <div className="rounded-2xl border border-rani-border bg-white p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-heading text-base text-rani-navy">{plan.name}</h3>
            <p className="text-xs text-rani-muted mt-0.5">{plan.goal}</p>
          </div>
          <span className="text-sm font-medium text-rani-navy">
            {completedSteps}/{totalSteps}
          </span>
        </div>
        <div className="h-2 rounded-full bg-rani-cream overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-rani-navy to-rani-gold transition-all duration-700"
            style={{ width: `${plan.overallProgress}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-rani-muted">
          {plan.overallProgress}% complete
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-rani-border bg-white overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-rani-navy to-rani-navy-light p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-white/60 uppercase tracking-wider">Treatment Plan</p>
            <h3 className="mt-1 font-heading text-xl font-bold">{plan.name}</h3>
            <p className="mt-1 text-sm text-white/70">{plan.goal}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-heading font-bold text-rani-gold">
              {plan.overallProgress}%
            </p>
            <p className="text-xs text-white/50">Complete</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 h-2 rounded-full bg-white/20 overflow-hidden">
          <div
            className="h-full rounded-full bg-rani-gold transition-all duration-700"
            style={{ width: `${plan.overallProgress}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs text-white/50">
          <span>Started {formatDate(plan.startDate)}</span>
          {plan.estimatedEndDate && <span>Est. {formatDate(plan.estimatedEndDate)}</span>}
        </div>
      </div>

      {/* Steps */}
      <div className="p-6">
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[15px] top-0 bottom-0 w-px bg-rani-border" />

          <div className="space-y-5">
            {plan.steps.map((step, _i) => (
              <div key={step.id} className="relative flex items-start gap-4">
                {/* Status icon */}
                <div className="relative z-10 flex-shrink-0">
                  {step.status === 'completed' ? (
                    <CheckCircle2 className="h-8 w-8 text-rani-success" />
                  ) : step.status === 'scheduled' ? (
                    <Clock className="h-8 w-8 text-rani-gold" />
                  ) : step.status === 'recommended' ? (
                    <Sparkles className="h-8 w-8 text-rani-gold/40" />
                  ) : (
                    <Circle className="h-8 w-8 text-rani-border" />
                  )}
                </div>

                {/* Content */}
                <div className={`flex-1 pb-1 ${step.status === 'completed' ? '' : ''}`}>
                  <div className="flex items-center gap-2">
                    <h4
                      className={`text-sm font-medium ${
                        step.status === 'completed'
                          ? 'text-rani-text'
                          : step.status === 'scheduled'
                          ? 'text-rani-navy'
                          : 'text-rani-muted'
                      }`}
                    >
                      {step.treatment}
                    </h4>
                    {step.sessionNumber && step.totalSessions && (
                      <span className="text-[10px] rounded-full bg-rani-cream px-2 py-0.5 text-rani-muted">
                        {step.sessionNumber}/{step.totalSessions}
                      </span>
                    )}
                  </div>
                  {step.description && (
                    <p className="mt-0.5 text-xs text-rani-muted">{step.description}</p>
                  )}
                  {step.completedDate && (
                    <p className="mt-1 text-xs text-rani-success">
                      Completed {formatDate(step.completedDate)}
                    </p>
                  )}
                  {step.scheduledDate && step.status === 'scheduled' && (
                    <p className="mt-1 text-xs text-rani-gold">
                      Scheduled {formatDate(step.scheduledDate)}
                    </p>
                  )}
                  {step.status === 'recommended' && (
                    <p className="mt-1 text-xs text-rani-muted italic">Recommended next</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
