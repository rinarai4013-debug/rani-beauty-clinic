'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Clock, CheckCircle2, AlertCircle, Loader2, Plus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMastermindSessions } from '@/hooks/useMastermindSessions';
import NewConsultationModal from '@/components/dashboard/mastermind/NewConsultationModal';
import type { MastermindPhase } from '@/types/mastermind';

const PHASE_CONFIG: Record<MastermindPhase, { label: string; color: string; icon: typeof Sparkles }> = {
  intake: { label: 'Intake', color: '#6B7280', icon: Clock },
  scanning: { label: 'Scanning', color: '#C9A96E', icon: Loader2 },
  scan_complete: { label: 'Scan Complete', color: '#C9A96E', icon: Sparkles },
  generating_plan: { label: 'Generating Plan', color: '#C9A96E', icon: Loader2 },
  plan_ready: { label: 'Plan Ready', color: '#2563EB', icon: Sparkles },
  provider_review: { label: 'In Review', color: '#D97706', icon: AlertCircle },
  approved: { label: 'Approved', color: '#059669', icon: CheckCircle2 },
  simulating: { label: 'Simulating', color: '#C9A96E', icon: Loader2 },
  simulation_ready: { label: 'Simulation Ready', color: '#059669', icon: Sparkles },
  presenting: { label: 'Presenting', color: '#7C3AED', icon: Sparkles },
  completed: { label: 'Completed', color: '#059669', icon: CheckCircle2 },
};

export default function MastermindQueuePage() {
  const { sessions, isLoading, mutate } = useMastermindSessions();
  const [showNewModal, setShowNewModal] = useState(false);
  const router = useRouter();

  const handleCreated = (sessionId: string) => {
    setShowNewModal(false);
    mutate(); // Refresh session list
    router.push(`/dashboard/mastermind/${sessionId}`);
  };

  return (
    <div className="p-6 space-y-6">
      {/* New Consultation Modal */}
      <NewConsultationModal
        open={showNewModal}
        onClose={() => setShowNewModal(false)}
        onCreated={handleCreated}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-heading)] text-2xl text-[#0F1D2C]">
            AI Mastermind
          </h1>
          <p className="font-body text-sm text-[#0F1D2C]/50 mt-1">
            Consultation sessions powered by Aura Skin Scan
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-body text-sm text-[#0F1D2C]/40">
            {sessions.length} session{sessions.length !== 1 ? 's' : ''}
          </span>
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0F1D2C] text-white font-body text-sm font-semibold hover:bg-[#0F1D2C]/90 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Consultation
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Awaiting Review', value: sessions.filter(s => s.phase === 'plan_ready' || s.phase === 'scan_complete').length, color: '#D97706' },
          { label: 'In Review', value: sessions.filter(s => s.phase === 'provider_review').length, color: '#2563EB' },
          { label: 'Approved', value: sessions.filter(s => s.phase === 'approved' || s.phase === 'simulation_ready').length, color: '#059669' },
          { label: 'Completed', value: sessions.filter(s => s.phase === 'completed').length, color: '#6B7280' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="p-4 rounded-xl bg-white border border-[#E8E4DF]"
          >
            <p className="font-body text-xs text-[#0F1D2C]/40">{stat.label}</p>
            <p className="font-[family-name:var(--font-heading)] text-2xl" style={{ color: stat.color }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Session List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#C9A96E]/10 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-[#C9A96E]" />
          </div>
          <h3 className="font-[family-name:var(--font-heading)] text-lg text-[#0F1D2C] mb-2">
            No Sessions Yet
          </h3>
          <p className="font-body text-sm text-[#0F1D2C]/50 max-w-md mx-auto mb-4">
            Start a consultation to run an AI-powered Aura Skin Scan and generate a personalized treatment plan.
          </p>
          <button
            onClick={() => setShowNewModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C9A96E] text-white font-body text-sm font-semibold hover:bg-[#C9A96E]/90 transition-all"
          >
            <Plus className="w-4 h-4" />
            New Consultation
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session, i) => {
            const phaseConfig = PHASE_CONFIG[session.phase] || PHASE_CONFIG.intake;
            const PhaseIcon = phaseConfig.icon;
            const auraScore = session.auraScanResult?.auraScore;

            return (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  href={`/dashboard/mastermind/${session.id}`}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-[#E8E4DF] hover:border-[#C9A96E]/40 hover:shadow-md transition-all group"
                >
                  {/* Aura Score Badge */}
                  <div className="w-14 h-14 rounded-full bg-[#F8F6F1] flex items-center justify-center shrink-0 border-2 border-[#E8E4DF] group-hover:border-[#C9A96E]/30 transition-colors">
                    {auraScore ? (
                      <span className="font-[family-name:var(--font-heading)] text-lg font-bold text-[#0F1D2C]">
                        {auraScore.overall}
                      </span>
                    ) : (
                      <Sparkles className="w-5 h-5 text-[#C9A96E]/40" />
                    )}
                  </div>

                  {/* Patient Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-body text-sm font-semibold text-[#0F1D2C] truncate">
                        {session.patientName || 'Unnamed Patient'}
                      </h3>
                      {auraScore && (
                        <span className="font-body text-xs text-[#C9A96E] font-medium">
                          {auraScore.grade}
                        </span>
                      )}
                    </div>
                    <p className="font-body text-xs text-[#0F1D2C]/40 truncate">
                      {session.patientEmail || 'No email'}
                    </p>
                  </div>

                  {/* Phase Badge */}
                  <div
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: phaseConfig.color + '15', color: phaseConfig.color }}
                  >
                    <PhaseIcon className="w-3.5 h-3.5" />
                    <span className="font-body text-xs font-medium">
                      {phaseConfig.label}
                    </span>
                  </div>

                  {/* Timestamp */}
                  <span className="font-body text-xs text-[#0F1D2C]/30 shrink-0 hidden md:block">
                    {new Date(session.updatedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
