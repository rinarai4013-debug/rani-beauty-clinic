'use client';

import { useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles, Loader2, Presentation } from 'lucide-react';
import Link from 'next/link';
import { isReadyForPresentation } from '@/lib/mastermind/index';
import { useMastermindSession } from '@/hooks/useMastermindSessions';
import PatientOverview from '@/components/dashboard/mastermind/PatientOverview';
import ScanResultsPanel from '@/components/dashboard/mastermind/ScanResultsPanel';
import PlanEditor from '@/components/dashboard/mastermind/PlanEditor';
import CopilotSidebar from '@/components/dashboard/mastermind/CopilotSidebar';
import type { MastermindPhase } from '@/types/mastermind';

const PHASE_LABELS: Record<MastermindPhase, string> = {
  intake: 'Intake',
  scanning: 'Scanning',
  scan_complete: 'Scan Complete',
  generating_plan: 'Generating Plan',
  plan_ready: 'Plan Ready',
  provider_review: 'In Review',
  approved: 'Approved',
  simulating: 'Simulating',
  simulation_ready: 'Ready',
  presenting: 'Presenting',
  completed: 'Completed',
};

export default function MastermindSessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  const { session, isLoading, dispatch, validate, hasScan, hasPlan } =
    useMastermindSession(sessionId);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<'patient' | 'scan' | 'plan'>('scan');

  const canPresent = session ? isReadyForPresentation(session) : false;

  const handleValidate = useCallback(() => validate(), [validate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 text-[#C9A96E] animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="p-6 text-center py-16">
        <h2 className="font-[family-name:var(--font-heading)] text-xl text-[#0F1D2C] mb-2">
          Session Not Found
        </h2>
        <p className="font-body text-sm text-[#0F1D2C]/50 mb-4">
          This consultation session may have been deleted or doesn&apos;t exist.
        </p>
        <Link
          href="/dashboard/mastermind"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0F1D2C] text-white font-body text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Queue
        </Link>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#E8E4DF] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/mastermind"
            className="w-8 h-8 rounded-full bg-[#F8F6F1] flex items-center justify-center hover:bg-[#E8E4DF] transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-[#0F1D2C]/60" />
          </Link>
          <div>
            <h1 className="font-[family-name:var(--font-heading)] text-lg text-[#0F1D2C]">
              {session.patientName || 'Consultation'}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-body text-xs text-[#0F1D2C]/40">
                {PHASE_LABELS[session.phase]}
              </span>
              {session.auraScanResult && (
                <>
                  <span className="text-[#0F1D2C]/20">&middot;</span>
                  <span className="font-body text-xs text-[#C9A96E] font-medium">
                    Aura Score: {session.auraScanResult.auraScore.overall}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canPresent && (
            <button
              type="button"
              onClick={() => router.push(`/dashboard/mastermind/${sessionId}/present`)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0F1D2C] text-white font-body text-xs font-medium hover:bg-[#0F1D2C]/90 transition-colors"
            >
              <Presentation className="w-3.5 h-3.5" />
              Present
            </button>
          )}
          <button
            type="button"
            onClick={() => setCopilotOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#C9A96E]/10 border border-[#C9A96E]/20 text-[#C9A96E] font-body text-xs font-medium hover:bg-[#C9A96E]/20 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI Copilot
          </button>
        </div>
      </div>

      {/* Mobile Tab Switcher */}
      <div className="flex border-b border-[#E8E4DF] lg:hidden">
        {[
          { id: 'patient' as const, label: 'Patient' },
          { id: 'scan' as const, label: 'Scan', disabled: !hasScan },
          { id: 'plan' as const, label: 'Plan', disabled: !hasPlan },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => !tab.disabled && setActivePanel(tab.id)}
            disabled={tab.disabled}
            className={`flex-1 py-3 font-body text-xs font-medium text-center transition-colors relative ${
              tab.disabled
                ? 'text-[#0F1D2C]/20 cursor-not-allowed'
                : activePanel === tab.id
                  ? 'text-[#C9A96E]'
                  : 'text-[#0F1D2C]/50'
            }`}
          >
            {tab.label}
            {activePanel === tab.id && (
              <motion.div
                layoutId="sessionTab"
                className="absolute bottom-0 left-4 right-4 h-0.5 bg-[#C9A96E] rounded-full"
              />
            )}
          </button>
        ))}
      </div>

      {/* 3-Panel Layout */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full grid grid-cols-1 lg:grid-cols-12 divide-x divide-[#E8E4DF]">
          {/* Left: Patient Overview (25%) */}
          <div
            className={`lg:col-span-3 overflow-y-auto p-4 ${
              activePanel !== 'patient' ? 'hidden lg:block' : ''
            }`}
          >
            <PatientOverview session={session} />
          </div>

          {/* Center: Scan Results (40%) */}
          <div
            className={`lg:col-span-5 overflow-y-auto p-4 ${
              activePanel !== 'scan' ? 'hidden lg:block' : ''
            }`}
          >
            <ScanResultsPanel session={session} />
          </div>

          {/* Right: Plan Editor (35%) */}
          <div
            className={`lg:col-span-4 overflow-y-auto p-4 ${
              activePanel !== 'plan' ? 'hidden lg:block' : ''
            }`}
          >
            <PlanEditor
              session={session}
              onValidate={handleValidate}
              onDispatch={dispatch}
            />
          </div>
        </div>
      </div>

      {/* Copilot Sidebar */}
      <CopilotSidebar
        session={session}
        isOpen={copilotOpen}
        onClose={() => setCopilotOpen(false)}
      />
    </div>
  );
}
