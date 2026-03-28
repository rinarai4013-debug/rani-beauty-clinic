'use client';

import { AlertTriangle, Clock, RefreshCw, XCircle, Mail, Ban } from 'lucide-react';
import { DUNNING_SEQUENCE, type DunningStep } from '@/lib/membership/billing';

interface DunningTimelineProps {
  currentStep: number;
  failureDate?: string;
  membersInDunning: number;
}

const STEP_ICONS: Record<DunningStep['type'], typeof AlertTriangle> = {
  payment_failed: AlertTriangle,
  retry_1: RefreshCw,
  retry_2: RefreshCw,
  retry_3: RefreshCw,
  final_warning: Mail,
  suspended: Ban,
};

const STEP_COLORS: Record<DunningStep['type'], string> = {
  payment_failed: 'border-amber-400 bg-amber-50 text-amber-700',
  retry_1: 'border-orange-400 bg-orange-50 text-orange-700',
  retry_2: 'border-orange-500 bg-orange-50 text-orange-800',
  retry_3: 'border-red-400 bg-red-50 text-red-700',
  final_warning: 'border-red-500 bg-red-50 text-red-800',
  suspended: 'border-red-600 bg-red-100 text-red-900',
};

export default function DunningTimeline({ currentStep, failureDate, membersInDunning }: DunningTimelineProps) {
  return (
    <div className="bg-white rounded-xl border border-rani-border p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-heading font-semibold text-rani-navy">Dunning Pipeline</h3>
        <span className="text-xs font-body text-rani-muted">
          {membersInDunning} member{membersInDunning !== 1 ? 's' : ''} in dunning
        </span>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-[18px] top-8 bottom-4 w-0.5 bg-gray-200" />

        <div className="space-y-4">
          {DUNNING_SEQUENCE.map((step, idx) => {
            const Icon = STEP_ICONS[step.type];
            const isActive = idx === currentStep;
            const isPast = idx < currentStep;
            const isFuture = idx > currentStep;

            return (
              <div
                key={step.step}
                className={`relative flex items-start gap-3 pl-1 ${isFuture ? 'opacity-40' : ''}`}
              >
                {/* Step icon */}
                <div
                  className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center border-2 ${
                    isActive ? STEP_COLORS[step.type] :
                    isPast ? 'border-gray-300 bg-gray-100 text-gray-400' :
                    'border-gray-200 bg-white text-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>

                {/* Step content */}
                <div className="flex-1 pb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-body font-medium ${
                      isActive ? 'text-rani-navy' : 'text-rani-muted'
                    }`}>
                      Day {step.dayAfterFailure}
                    </span>
                    {isActive && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-body font-semibold bg-amber-100 text-amber-700">
                        CURRENT
                      </span>
                    )}
                  </div>
                  <p className={`text-xs font-body mt-0.5 ${
                    isActive ? 'text-rani-text' : 'text-rani-muted'
                  }`}>
                    {step.action}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
