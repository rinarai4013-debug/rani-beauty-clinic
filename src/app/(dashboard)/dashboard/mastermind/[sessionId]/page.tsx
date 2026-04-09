'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Sparkles,
  Loader2,
  Presentation,
  Check,
  FileText,
  Send,
  Calendar,
  Trash2,
  Clock,
  User,
  StickyNote,
  ChevronRight,
  Scan,
  ClipboardCheck,
  Eye,
  Image,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Phone,
  Shield,
  Pill,
  Heart,
  Sun,
  Moon,
  Download,
  ExternalLink,
  History,
  Upload,
  Camera,
} from 'lucide-react';
import Link from 'next/link';
import { useMastermindSession } from '@/hooks/useMastermindSessions';
import ScanResultsPanel from '@/components/dashboard/mastermind/ScanResultsPanel';
import AuraImportPanel from '@/components/dashboard/mastermind/AuraImportPanel';
import PlanEditor from '@/components/dashboard/mastermind/PlanEditor';
import CopilotSidebar from '@/components/dashboard/mastermind/CopilotSidebar';
import type { MastermindPhase } from '@/types/mastermind';

// ── PHASE DEFINITIONS ──

interface PhaseDefinition {
  key: MastermindPhase;
  label: string;
  icon: typeof Scan;
  stepIndex: number;
}

const WORKFLOW_PHASES: PhaseDefinition[] = [
  { key: 'intake', label: 'Intake', icon: ClipboardCheck, stepIndex: 0 },
  { key: 'scan_complete', label: 'Scan', icon: Scan, stepIndex: 1 },
  { key: 'plan_ready', label: 'Plan', icon: FileText, stepIndex: 2 },
  { key: 'provider_review', label: 'Review', icon: Eye, stepIndex: 3 },
  { key: 'simulation_ready', label: 'Simulation', icon: Image, stepIndex: 4 },
  { key: 'presenting', label: 'Present', icon: Presentation, stepIndex: 5 },
  { key: 'completed', label: 'Complete', icon: CheckCircle2, stepIndex: 6 },
];

// Map every possible phase to its step index
const PHASE_TO_STEP: Record<MastermindPhase, number> = {
  intake: 0,
  scanning: 1,
  scan_complete: 1,
  generating_plan: 2,
  plan_ready: 2,
  provider_review: 3,
  approved: 4,
  simulating: 4,
  simulation_ready: 4,
  presenting: 5,
  completed: 6,
};

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

// ── LOADING MESSAGES ──

const LOADING_MESSAGES: Record<string, { title: string; subtitle: string }> = {
  scanning: {
    title: 'AI is analyzing skin...',
    subtitle: 'The Aura Engine is mapping facial zones, detecting concerns, and calculating your patient\'s skin age.',
  },
  generating_plan: {
    title: 'Generating personalized plan...',
    subtitle: 'Building treatment recommendations, sequencing, and package options tailored to this patient.',
  },
  simulating: {
    title: 'Creating your future self...',
    subtitle: 'Projecting treatment outcomes and generating before/after comparisons.',
  },
};

// ── TABS ──

type ContentTab = 'scan' | 'plan' | 'simulation' | 'copilot' | 'notes';

export default function MastermindSessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  const {
    session,
    isLoading,
    mutate,
    dispatch,
    validate,
    hasScan,
    hasPlan,
    hasSimulation,
  } = useMastermindSession(sessionId);

  const [activeTab, setActiveTab] = useState<ContentTab>('scan');
  const [actionLoading, setActionLoading] = useState(false);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [quickNote, setQuickNote] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [photoUploading, setPhotoUploading] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // ── PHOTO UPLOAD HANDLER ──
  const handlePhotoUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) return;
      setPhotoUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/photo/upload', { method: 'POST', body: formData });
        if (!res.ok) throw new Error('Upload failed');
        const json = await res.json();
        const dataUrl = json.imageBase64 || json.dataUrl || json.url;
        if (dataUrl) {
          await dispatch({ type: 'SET_SOURCE_PHOTO', url: dataUrl });
        }
      } catch (err) {
        console.error('Photo upload failed:', err);
      } finally {
        setPhotoUploading(false);
        if (photoInputRef.current) photoInputRef.current.value = '';
      }
    },
    [dispatch]
  );

  // Auto-select best tab based on phase
  useEffect(() => {
    if (!session) return;
    const step = PHASE_TO_STEP[session.phase];
    if (step <= 1 && hasScan) setActiveTab('scan');
    else if (step >= 2 && step <= 3 && hasPlan) setActiveTab('plan');
    else if (step >= 4 && hasSimulation) setActiveTab('simulation');
    else if (hasScan) setActiveTab('scan');
  }, [session?.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleValidate = useCallback(() => validate(), [validate]);

  // ── ACTION HANDLERS ──

  const runAction = useCallback(
    async (fn: () => Promise<void>) => {
      setActionLoading(true);
      try {
        await fn();
      } catch (err) {
        console.error('Action failed:', err);
      } finally {
        setActionLoading(false);
      }
    },
    []
  );

  const handleRunScan = useCallback(
    () =>
      runAction(async () => {
        await dispatch({ type: 'SET_PHASE', phase: 'scanning' });
        await fetch(`/api/mastermind/scan`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });
      }),
    [dispatch, runAction, sessionId]
  );

  const handleGeneratePlan = useCallback(
    () =>
      runAction(async () => {
        await dispatch({ type: 'SET_PHASE', phase: 'generating_plan' });
        await fetch(`/api/mastermind/plan`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });
      }),
    [dispatch, runAction, sessionId]
  );

  const handleBeginReview = useCallback(
    () =>
      runAction(async () => {
        await dispatch({ type: 'SET_PHASE', phase: 'provider_review' });
      }),
    [dispatch, runAction]
  );

  const handleApprovePlan = useCallback(
    () =>
      runAction(async () => {
        if (!session?.providerReview) {
          await dispatch({
            type: 'SET_PROVIDER_REVIEW',
            review: {
              providerId: 'pending_auth',
              providerName: 'Provider',
              modifications: [],
              clinicalNotes: quickNote ? [quickNote] : [],
              approvalStatus: 'pending',
            },
          });
        }
        await dispatch({ type: 'SET_APPROVAL_STATUS', status: 'approved' });
      }),
    [dispatch, runAction, session?.providerReview, quickNote]
  );

  const handleRequestChanges = useCallback(
    () =>
      runAction(async () => {
        await dispatch({ type: 'SET_APPROVAL_STATUS', status: 'modified' });
        await dispatch({ type: 'SET_PHASE', phase: 'plan_ready' });
      }),
    [dispatch, runAction]
  );

  const handleGenerateSimulation = useCallback(
    () =>
      runAction(async () => {
        await dispatch({ type: 'SET_PHASE', phase: 'simulating' });
        await fetch(`/api/mastermind/simulate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });
      }),
    [dispatch, runAction, sessionId]
  );

  const handleStartPresentation = useCallback(
    () =>
      runAction(async () => {
        await dispatch({ type: 'SET_PHASE', phase: 'presenting' });
        router.push(`/dashboard/mastermind/${sessionId}/present`);
      }),
    [dispatch, runAction, router, sessionId]
  );

  const handleMarkComplete = useCallback(
    () =>
      runAction(async () => {
        await dispatch({ type: 'COMPLETE' });
      }),
    [dispatch, runAction]
  );

  const handleDeleteSession = useCallback(async () => {
    try {
      await fetch(`/api/mastermind/sessions/${sessionId}`, { method: 'DELETE' });
      router.push('/dashboard/mastermind');
    } catch (err) {
      console.error('Delete failed:', err);
    }
  }, [sessionId, router]);

  // ── COMPUTED ──

  const currentStep = session ? PHASE_TO_STEP[session.phase] : 0;
  const isTransitionalPhase =
    session?.phase === 'scanning' ||
    session?.phase === 'generating_plan' ||
    session?.phase === 'simulating';
  const loadingMsg = session ? LOADING_MESSAGES[session.phase] : null;

  const timeSinceCreation = useMemo(() => {
    if (!session) return '';
    const diff = Date.now() - new Date(session.createdAt).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }, [session?.createdAt]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── LOADING STATE ──

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]" style={{ background: 'linear-gradient(135deg, #0F1D2C 0%, #162638 50%, #0F1D2C 100%)' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-2 border-[#C9A96E]/20" />
            <motion.div
              className="absolute inset-0 w-16 h-16 rounded-full border-2 border-transparent border-t-[#C9A96E]"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
          </div>
          <div className="flex flex-col items-center gap-2">
            <p className="font-body text-sm text-white/40">Loading session...</p>
            {/* Skeleton shimmer */}
            <div className="flex gap-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-16 h-2 rounded-full"
                  style={{ background: 'linear-gradient(90deg, rgba(201,169,110,0.05), rgba(201,169,110,0.15), rgba(201,169,110,0.05))', backgroundSize: '200% 100%' }}
                  animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── NOT FOUND ──

  if (!session) {
    return (
      <div className="p-6 text-center py-16" style={{ background: 'linear-gradient(135deg, #0F1D2C 0%, #162638 50%, #0F1D2C 100%)' }}>
        <h2 className="font-[family-name:var(--font-heading)] text-xl text-white mb-2">
          Session Not Found
        </h2>
        <p className="font-body text-sm text-white/50 mb-4">
          This consultation session may have been deleted or doesn&apos;t exist.
        </p>
        <Link
          href="/dashboard/mastermind"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white font-body text-sm"
          style={{ background: 'linear-gradient(135deg, #C9A96E, #B8944F)' }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Queue
        </Link>
      </div>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const intake = session.intakeData as (Record<string, any> | null);
  const scan = session.auraScanResult;
  const flags = scan?.medicalFlags || [];

  // Calculate age
  const age = intake?.dob
    ? Math.floor(
        (Date.now() - new Date(intake.dob as string).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
      )
    : null;

  return (
    <div className="h-full flex flex-col relative" style={{ background: 'linear-gradient(135deg, #0F1D2C 0%, #162638 50%, #0F1D2C 100%)' }}>
      {/* Subtle gold radial glow */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] pointer-events-none" style={{ background: 'radial-gradient(ellipse at top right, rgba(201,169,110,0.08) 0%, transparent 70%)' }} />
      {/* ════════════════════════════════════════════════════════════
          HEADER
         ════════════════════════════════════════════════════════════ */}
      <div className="px-6 py-4 shrink-0 relative z-10" style={{ background: 'rgba(15,29,44,0.7)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(201,169,110,0.1)' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/mastermind"
              className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-white/10"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <ArrowLeft className="w-4 h-4 text-white/60" />
            </Link>
            <div>
              <h1 className="font-[family-name:var(--font-heading)] text-lg text-white">
                {session.patientName || 'Consultation'}
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-body text-xs text-white/40">
                  {PHASE_LABELS[session.phase]}
                </span>
                {scan && (
                  <>
                    <span className="text-white/20">&middot;</span>
                    <span className="font-body text-xs text-[#C9A96E] font-medium">
                      Aura Score: {scan.auraScore.overall}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCopilotOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[#C9A96E]/30 text-[#C9A96E] font-body text-xs font-medium hover:bg-[#C9A96E]/20 transition-all"
              style={{ background: 'rgba(201,169,110,0.1)', boxShadow: '0 0 15px rgba(201,169,110,0.1)' }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">AI Copilot</span>
            </button>
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 text-white/60 font-body text-xs font-medium hover:bg-white/10 transition-colors lg:hidden"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            >
              <StickyNote className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ── PHASE PROGRESS BAR ── */}
        <div className="relative">
          <div className="flex items-center justify-between">
            {WORKFLOW_PHASES.map((phase, idx) => {
              const Icon = phase.icon;
              const isComplete = currentStep > phase.stepIndex;
              const isCurrent = currentStep === phase.stepIndex;
              const isFuture = currentStep < phase.stepIndex;

              return (
                <div key={phase.key} className="flex items-center flex-1 last:flex-initial">
                  <div className="flex flex-col items-center relative z-10">
                    {/* Pulsing ring for active step */}
                    {isCurrent && (
                      <motion.div
                        className="absolute top-0 left-1/2 -translate-x-1/2 w-9 h-9 rounded-full"
                        style={{ border: '2px solid rgba(201,169,110,0.4)' }}
                        animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      />
                    )}
                    <motion.div
                      initial={false}
                      animate={{
                        scale: isCurrent ? 1.1 : 1,
                      }}
                      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                      className="w-9 h-9 rounded-full flex items-center justify-center"
                      style={{
                        background: isComplete
                          ? 'linear-gradient(135deg, #059669, #047857)'
                          : isCurrent
                            ? 'linear-gradient(135deg, #C9A96E, #B8944F)'
                            : 'rgba(255,255,255,0.08)',
                        boxShadow: isComplete
                          ? '0 0 12px rgba(5,150,105,0.3)'
                          : isCurrent
                            ? '0 0 20px rgba(201,169,110,0.4)'
                            : 'none',
                        border: isFuture ? '1px solid rgba(255,255,255,0.1)' : 'none',
                      }}
                    >
                      {isComplete ? (
                        <Check className="w-4 h-4 text-white" />
                      ) : (
                        <Icon
                          className={`w-4 h-4 ${
                            isCurrent ? 'text-white' : 'text-white/25'
                          }`}
                        />
                      )}
                    </motion.div>
                    <span
                      className={`font-body text-xs mt-1.5 whitespace-nowrap ${
                        isCurrent
                          ? 'text-[#C9A96E] font-semibold'
                          : isComplete
                            ? 'text-[#059669] font-medium'
                            : 'text-white/25'
                      }`}
                    >
                      {phase.label}
                    </span>
                    {isCurrent && isTransitionalPhase && (
                      <motion.div
                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#C9A96E]"
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                    )}
                  </div>
                  {/* Connector line */}
                  {idx < WORKFLOW_PHASES.length - 1 && (
                    <div className="flex-1 h-0.5 mx-2 mt-[-1.25rem] relative">
                      <div className="absolute inset-0 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
                      <motion.div
                        initial={false}
                        animate={{
                          scaleX: isComplete ? 1 : isCurrent ? 0.5 : 0,
                        }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="absolute inset-0 origin-left rounded-full"
                        style={{
                          background: isComplete
                            ? 'linear-gradient(90deg, #059669, #059669)'
                            : 'linear-gradient(90deg, #C9A96E, rgba(201,169,110,0.2))',
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════
          PHASE ACTION BAR
         ════════════════════════════════════════════════════════════ */}
      <AnimatePresence mode="wait">
        {isTransitionalPhase && loadingMsg ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="px-6 py-4 relative z-10"
            style={{ background: 'linear-gradient(90deg, rgba(201,169,110,0.1), rgba(201,169,110,0.03), transparent)', borderBottom: '1px solid rgba(201,169,110,0.15)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
          >
            <div className="flex items-center gap-4">
              <div className="relative">
                <motion.div
                  className="w-10 h-10 rounded-full border-2 border-[#C9A96E]/30"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                />
                <Sparkles className="w-4 h-4 text-[#C9A96E] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <div>
                <p className="font-body text-sm font-semibold text-white">
                  {loadingMsg.title}
                </p>
                <p className="font-body text-xs text-white/50 mt-0.5">
                  {loadingMsg.subtitle}
                </p>
              </div>
              <motion.div
                className="ml-auto flex gap-1"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full bg-[#C9A96E]"
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
              </motion.div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="actions"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="px-6 py-3 flex items-center gap-3 flex-wrap relative z-10"
            style={{ background: 'rgba(15,29,44,0.6)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            {/* Intake phase */}
            {session.phase === 'intake' && (
              <>
                {!session.sourcePhotoUrl && (
                  <ActionButton
                    onClick={() => photoInputRef.current?.click()}
                    loading={photoUploading}
                    icon={Upload}
                    label="Upload Photo"
                    variant="secondary"
                  />
                )}
                <ActionButton
                  onClick={handleRunScan}
                  loading={actionLoading}
                  icon={Scan}
                  label="Run Aura Scan"
                  variant="primary"
                />
              </>
            )}

            {/* Scan complete */}
            {session.phase === 'scan_complete' && (
              <ActionButton
                onClick={handleGeneratePlan}
                loading={actionLoading}
                icon={FileText}
                label="Generate Treatment Plan"
                variant="primary"
              />
            )}

            {/* Plan ready */}
            {session.phase === 'plan_ready' && (
              <ActionButton
                onClick={handleBeginReview}
                loading={actionLoading}
                icon={Eye}
                label="Begin Provider Review"
                variant="primary"
              />
            )}

            {/* Provider review */}
            {session.phase === 'provider_review' && (
              <>
                <ActionButton
                  onClick={handleApprovePlan}
                  loading={actionLoading}
                  icon={CheckCircle2}
                  label="Approve Plan"
                  variant="success"
                />
                <ActionButton
                  onClick={handleRequestChanges}
                  loading={actionLoading}
                  icon={ArrowLeft}
                  label="Request Changes"
                  variant="secondary"
                />
              </>
            )}

            {/* Approved */}
            {session.phase === 'approved' && (
              <ActionButton
                onClick={handleGenerateSimulation}
                loading={actionLoading}
                icon={Image}
                label="Generate Simulation"
                variant="primary"
              />
            )}

            {/* Simulation ready */}
            {session.phase === 'simulation_ready' && (
              <ActionButton
                onClick={handleStartPresentation}
                loading={actionLoading}
                icon={Presentation}
                label="Start Presentation"
                variant="gold"
              />
            )}

            {/* Presenting */}
            {session.phase === 'presenting' && (
              <>
                <ActionButton
                  onClick={() => router.push('/dashboard/mastermind')}
                  loading={false}
                  icon={ArrowLeft}
                  label="Back to Dashboard"
                  variant="secondary"
                />
                <ActionButton
                  onClick={handleMarkComplete}
                  loading={actionLoading}
                  icon={CheckCircle2}
                  label="Mark Complete"
                  variant="success"
                />
              </>
            )}

            {/* Completed */}
            {session.phase === 'completed' && (
              <>
                {session.pdfUrl && (
                  <a
                    href={session.pdfUrl}
                    download
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-body text-xs font-medium hover:opacity-90 transition-all"
                    style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download PDF
                  </a>
                )}
                <ActionButton
                  onClick={async () => {
                    await fetch(`/api/mastermind/sessions/${sessionId}/send`, {
                      method: 'POST',
                    });
                  }}
                  loading={actionLoading}
                  icon={Send}
                  label="Send to Patient"
                  variant="gold"
                />
                <ActionButton
                  onClick={async () => {
                    window.open('https://app.mangomint.com/876418/appointments/new', '_blank');
                  }}
                  loading={false}
                  icon={Calendar}
                  label="Book Appointment"
                  variant="secondary"
                />
              </>
            )}

            {/* Phase indicator pill */}
            <div className="ml-auto">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-body text-xs text-white/50" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div
                  className={`w-2 h-2 rounded-full ${
                    session.phase === 'completed'
                      ? 'bg-[#059669]'
                      : isTransitionalPhase
                        ? 'bg-[#C9A96E] animate-pulse'
                        : 'bg-[#0F1D2C]/30'
                  }`}
                />
                {PHASE_LABELS[session.phase]}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════════════════════════
          MAIN CONTENT
         ════════════════════════════════════════════════════════════ */}
      <div className="flex-1 overflow-hidden flex relative z-10">
        {/* ── LEFT: PATIENT OVERVIEW + TABS ── */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Patient Overview Card */}
          <div className="px-6 pt-5 pb-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -2 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="rounded-2xl p-5 transition-all duration-300"
              style={{
                background: 'rgba(15,29,44,0.6)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(201,169,110,0.1)',
                boxShadow: '0 4px 30px rgba(0,0,0,0.2)',
              }}
            >
              <div className="flex items-start gap-5">
                {/* Photo / Avatar — clickable to upload */}
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic,application/pdf,.pdf"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
                <div className="shrink-0">
                  {session.sourcePhotoUrl ? (
                    <button
                      onClick={() => photoInputRef.current?.click()}
                      className="w-16 h-16 rounded-2xl overflow-hidden relative group cursor-pointer"
                      style={{ border: '2px solid rgba(201,169,110,0.4)', boxShadow: '0 0 15px rgba(201,169,110,0.15)' }}
                      title="Click to change photo"
                    >
                      <img
                        src={session.sourcePhotoUrl}
                        alt={session.patientName}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Camera className="w-5 h-5 text-white" />
                      </div>
                    </button>
                  ) : (
                    <button
                      onClick={() => photoInputRef.current?.click()}
                      disabled={photoUploading}
                      className="w-16 h-16 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-105"
                      style={{ background: 'linear-gradient(135deg, rgba(201,169,110,0.2), rgba(201,169,110,0.05))', border: '2px dashed rgba(201,169,110,0.4)', boxShadow: '0 0 15px rgba(201,169,110,0.1)' }}
                      title="Upload patient photo"
                    >
                      {photoUploading ? (
                        <Loader2 className="w-5 h-5 text-[#C9A96E]/70 animate-spin" />
                      ) : (
                        <>
                          <Camera className="w-5 h-5 text-[#C9A96E]/50" />
                          <span className="text-[8px] text-[#C9A96E]/40 mt-0.5 font-medium">PHOTO</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Core Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="font-[family-name:var(--font-heading)] text-lg text-white">
                      {session.patientName || 'Unknown Patient'}
                    </h2>
                    {age && (
                      <span className="font-body text-xs text-white/50 px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        Age {age}
                      </span>
                    )}
                    {scan && (
                      <span className="px-2 py-0.5 rounded-full font-body text-xs font-medium text-[#C9A96E]" style={{ background: 'rgba(201,169,110,0.12)' }}>
                        Fitzpatrick {scan.skinAnalysis.fitzpatrickType}
                      </span>
                    )}
                  </div>

                  {/* Contact Row */}
                  <div className="flex items-center gap-4 mt-2">
                    {session.patientEmail && (
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-white/25" />
                        <span className="font-body text-xs text-white/50">
                          {session.patientEmail}
                        </span>
                      </div>
                    )}
                    {intake?.phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-white/25" />
                        <span className="font-body text-xs text-white/50">
                          {intake.phone as string}
                        </span>
                      </div>
                    )}
                    {intake?.contactPreference && (
                      <span className="font-body text-xs text-white/30">
                        Prefers: {intake.contactPreference as string}
                      </span>
                    )}
                    {intake?.referralSource && (
                      <span className="font-body text-xs text-white/30">
                        Via: {(intake.referralSource as string).replace(/-/g, ' ')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Medical Flags (compact) */}
                {flags.length > 0 && (
                  <div className="shrink-0 flex flex-col gap-1">
                    {flags.slice(0, 3).map((flag, i) => (
                      <motion.span
                        key={i}
                        animate={flag.severity === 'critical' || flag.severity === 'warning' ? { opacity: [1, 0.7, 1] } : {}}
                        transition={{ duration: 2, repeat: Infinity }}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-body text-xs font-medium ${
                          flag.severity === 'critical'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : flag.severity === 'warning'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}
                      >
                        <AlertTriangle className="w-3 h-3" />
                        {flag.flag}
                      </motion.span>
                    ))}
                    {flags.length > 3 && (
                      <span className="font-body text-xs text-red-400 font-medium pl-1">
                        +{flags.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Detail Rows */}
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                {/* Concerns */}
                {intake?.skinConcerns && (
                  <div className="col-span-2">
                    <p className="font-body text-xs text-white/30 mb-1.5">Concerns</p>
                    <div className="flex flex-wrap gap-1">
                      {(intake.skinConcerns as string[]).slice(0, 6).map((concern) => (
                        <span
                          key={concern}
                          className="px-2 py-0.5 rounded-full font-body text-xs text-white/50"
                          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
                        >
                          {concern.replace(/-/g, ' ')}
                        </span>
                      ))}
                      {(intake.skinConcerns as string[]).length > 6 && (
                        <span className="font-body text-xs text-white/30 self-center">
                          +{(intake.skinConcerns as string[]).length - 6}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Treatment Interests */}
                {intake?.treatmentInterests && (
                  <div className="col-span-2">
                    <p className="font-body text-xs text-white/30 mb-1.5">
                      Treatment Interests
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {(intake.treatmentInterests as string[]).slice(0, 4).map((interest) => (
                        <span
                          key={interest}
                          className="px-2 py-0.5 rounded-full font-body text-xs text-[#C9A96E]"
                          style={{ background: 'rgba(201,169,110,0.12)', border: '1px solid rgba(201,169,110,0.2)' }}
                        >
                          {interest.replace(/-/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skincare Routine */}
                {(intake?.skincareAM || intake?.skincarePM) && (
                  <div className="col-span-2">
                    <p className="font-body text-xs text-white/30 mb-1.5">Skincare Routine</p>
                    <div className="flex gap-3">
                      {intake?.skincareAM && (
                        <div className="flex items-center gap-1">
                          <Sun className="w-3 h-3 text-amber-400" />
                          <span className="font-body text-xs text-white/50 truncate max-w-[120px]">
                            {intake.skincareAM as string}
                          </span>
                        </div>
                      )}
                      {intake?.skincarePM && (
                        <div className="flex items-center gap-1">
                          <Moon className="w-3 h-3 text-indigo-400" />
                          <span className="font-body text-xs text-white/50 truncate max-w-[120px]">
                            {intake.skincarePM as string}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Medical Info */}
                {(intake?.conditions || intake?.allergies || intake?.medications) && (
                  <div className="col-span-2">
                    <p className="font-body text-xs text-white/30 mb-1.5">Medical</p>
                    <div className="flex flex-wrap gap-2">
                      {intake?.conditions && (
                        <div className="flex items-center gap-1">
                          <Heart className="w-3 h-3 text-red-400" />
                          <span className="font-body text-xs text-white/50">
                            {Array.isArray(intake.conditions)
                              ? (intake.conditions as string[]).join(', ')
                              : intake.conditions as string}
                          </span>
                        </div>
                      )}
                      {intake?.allergies && (
                        <div className="flex items-center gap-1">
                          <Shield className="w-3 h-3 text-amber-500" />
                          <span className="font-body text-xs text-white/50">
                            {Array.isArray(intake.allergies)
                              ? (intake.allergies as string[]).join(', ')
                              : intake.allergies as string}
                          </span>
                        </div>
                      )}
                      {intake?.medications && (
                        <div className="flex items-center gap-1">
                          <Pill className="w-3 h-3 text-blue-500" />
                          <span className="font-body text-xs text-white/50">
                            {Array.isArray(intake.medications)
                              ? (intake.medications as string[]).join(', ')
                              : intake.medications as string}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Budget & Timeline */}
                {intake?.budget && (
                  <div className="p-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <p className="font-body text-xs text-white/30">Budget</p>
                    <p className="font-body text-xs font-medium text-white capitalize mt-0.5">
                      {intake.budget as string}
                    </p>
                  </div>
                )}
                {intake?.timeline && (
                  <div className="p-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <p className="font-body text-xs text-white/30">Timeline</p>
                    <p className="font-body text-xs font-medium text-white capitalize mt-0.5">
                      {intake.timeline as string}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* ── TAB BAR ── */}
          <div className="px-6">
            <div className="flex" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {(
                [
                  { id: 'scan' as const, label: 'Scan Results', icon: Scan, available: true },
                  { id: 'plan' as const, label: 'Treatment Plan', icon: FileText, available: true },
                  {
                    id: 'simulation' as const,
                    label: 'Simulation',
                    icon: Image,
                    available: hasSimulation,
                  },
                  { id: 'copilot' as const, label: 'Copilot', icon: Sparkles, available: true },
                  {
                    id: 'notes' as const,
                    label: 'Notes & History',
                    icon: History,
                    available: true,
                  },
                ] as const
              ).map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => tab.available && setActiveTab(tab.id)}
                    disabled={!tab.available}
                    className={`flex items-center gap-1.5 px-4 py-3 font-body text-xs font-medium transition-colors relative ${
                      !tab.available
                        ? 'text-white/15 cursor-not-allowed'
                        : isActive
                          ? 'text-[#C9A96E]'
                          : 'text-white/40 hover:text-white/60'
                    }`}
                    style={isActive ? { textShadow: '0 0 12px rgba(201,169,110,0.4)' } : {}}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="contentTab"
                        className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full"
                        style={{ background: 'linear-gradient(90deg, #C9A96E, #B8944F)', boxShadow: '0 0 8px rgba(201,169,110,0.5)' }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── TAB CONTENT ── */}
          <div className="flex-1 overflow-y-auto px-6 py-5 scrollbar-luxury">
            <AnimatePresence mode="wait">
              {activeTab === 'scan' && (
                <motion.div
                  key="scan"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                >
                  {/* Aura Device Import — always available to (re)import */}
                  <AuraImportPanel
                    session={session}
                    onImportComplete={() => mutate()}
                  />
                  <ScanResultsPanel session={session} />
                </motion.div>
              )}

              {activeTab === 'plan' && (
                <motion.div
                  key="plan"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                >
                  <PlanEditor
                    session={session}
                    onValidate={handleValidate}
                    onDispatch={dispatch}
                  />
                </motion.div>
              )}

              {activeTab === 'simulation' && (
                <motion.div
                  key="simulation"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                >
                  <SimulationTab session={session} />
                </motion.div>
              )}

              {activeTab === 'copilot' && (
                <motion.div
                  key="copilot"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                >
                  <CopilotFullWidth session={session} />
                </motion.div>
              )}

              {activeTab === 'notes' && (
                <motion.div
                  key="notes"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                >
                  <NotesHistoryTab session={session} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── RIGHT: QUICK ACTION SIDEBAR ── */}
        <motion.div
          initial={false}
          animate={{ width: sidebarOpen ? 280 : 0, opacity: sidebarOpen ? 1 : 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="hidden lg:block overflow-hidden shrink-0"
          style={{ borderLeft: '1px solid rgba(201,169,110,0.1)', background: 'rgba(15,29,44,0.5)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
        >
          <div className="w-[280px] h-full overflow-y-auto p-4 space-y-5 scrollbar-luxury">
            {/* Status Badge */}
            <div>
              <h3 className="font-body text-xs font-semibold text-white/50 uppercase tracking-wide mb-2">
                Session
              </h3>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-body text-xs font-medium ${
                    session.phase === 'completed'
                      ? 'text-[#059669]'
                      : isTransitionalPhase
                        ? 'text-[#C9A96E]'
                        : 'text-white/60'
                  }`}
                  style={{
                    background: session.phase === 'completed'
                      ? 'rgba(5,150,105,0.12)'
                      : isTransitionalPhase
                        ? 'rgba(201,169,110,0.12)'
                        : 'rgba(255,255,255,0.06)',
                    border: `1px solid ${session.phase === 'completed' ? 'rgba(5,150,105,0.2)' : isTransitionalPhase ? 'rgba(201,169,110,0.2)' : 'rgba(255,255,255,0.08)'}`,
                  }}
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${
                      session.phase === 'completed'
                        ? 'bg-[#059669]'
                        : isTransitionalPhase
                          ? 'bg-[#C9A96E] animate-pulse'
                          : 'bg-white/30'
                    }`}
                  />
                  {PHASE_LABELS[session.phase]}
                </span>
              </div>
            </div>

            {/* Time */}
            <div className="flex items-center gap-2 text-white/40">
              <Clock className="w-3.5 h-3.5" />
              <span className="font-body text-xs">Created {timeSinceCreation}</span>
            </div>

            {/* Aura Score */}
            {scan && (
              <motion.div
                className="p-4 rounded-xl relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(201,169,110,0.12), rgba(201,169,110,0.03))',
                  border: '1px solid rgba(201,169,110,0.2)',
                  boxShadow: '0 0 20px rgba(201,169,110,0.08)',
                }}
              >
                {/* Animated gauge arc */}
                <div className="flex items-center gap-3">
                  <div className="relative w-14 h-14 shrink-0">
                    <svg viewBox="0 0 56 56" className="w-14 h-14 -rotate-90">
                      <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
                      <motion.circle
                        cx="28" cy="28" r="24" fill="none"
                        stroke="url(#auraGradient)"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 24}`}
                        initial={{ strokeDashoffset: 2 * Math.PI * 24 }}
                        animate={{ strokeDashoffset: 2 * Math.PI * 24 * (1 - scan.auraScore.overall / 100) }}
                        transition={{ duration: 1.5, ease: 'easeOut' }}
                      />
                      <defs>
                        <linearGradient id="auraGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#C9A96E" />
                          <stop offset="100%" stopColor="#E8D5A8" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center font-[family-name:var(--font-heading)] text-sm font-bold text-white">
                      {scan.auraScore.overall}
                    </span>
                  </div>
                  <div>
                    <p className="font-body text-xs text-white/40">Aura Score</p>
                    <p className="font-body text-sm font-semibold text-[#C9A96E]">
                      {scan.auraScore.grade}
                    </p>
                    <p className="font-body text-xs text-white/35 mt-0.5">
                      Skin age: {scan.auraScore.skinAge} ({scan.auraScore.skinAgeDelta > 0 ? '+' : ''}{scan.auraScore.skinAgeDelta}y)
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Provider Assignment */}
            <div>
              <h3 className="font-body text-xs font-semibold text-white/50 uppercase tracking-wide mb-2">
                Provider
              </h3>
              <select
                className="w-full px-3 py-2 rounded-xl font-body text-xs text-white outline-none focus:ring-2 focus:ring-[#C9A96E]/20"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                defaultValue={session.providerReview?.providerName || ''}
              >
                <option value="" style={{ background: '#0F1D2C' }}>Unassigned</option>
                <option value="Mom" style={{ background: '#0F1D2C' }}>Mom (Provider)</option>
                <option value="Rina" style={{ background: '#0F1D2C' }}>Rina (CEO)</option>
              </select>
            </div>

            {/* Quick Notes */}
            <div>
              <h3 className="font-body text-xs font-semibold text-white/50 uppercase tracking-wide mb-2">
                Quick Note
              </h3>
              <textarea
                value={quickNote}
                onChange={(e) => setQuickNote(e.target.value)}
                placeholder="Add a note..."
                rows={3}
                className="w-full px-3 py-2 rounded-xl font-body text-xs text-white placeholder:text-white/20 outline-none focus:ring-2 focus:ring-[#C9A96E]/20 resize-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>

            {/* Quick Actions */}
            <div className="space-y-2">
              <h3 className="font-body text-xs font-semibold text-white/50 uppercase tracking-wide mb-2">
                Quick Actions
              </h3>

              <button
                type="button"
                onClick={async () => {
                  await fetch(`/api/mastermind/sessions/${sessionId}/send`, {
                    method: 'POST',
                  });
                }}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl font-body text-xs text-white/70 hover:bg-white/10 transition-all text-left"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <Send className="w-3.5 h-3.5 text-[#C9A96E]" />
                Send to Patient
              </button>

              <button
                type="button"
                onClick={() =>
                  window.open(
                    'https://app.mangomint.com/876418/appointments/new',
                    '_blank'
                  )
                }
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl font-body text-xs text-white/70 hover:bg-white/10 transition-all text-left"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <Calendar className="w-3.5 h-3.5 text-[#C9A96E]" />
                Book in Mangomint
                <ExternalLink className="w-3 h-3 ml-auto text-white/20" />
              </button>
            </div>

            {/* Danger Zone */}
            <div className="pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              {!showDeleteConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl font-body text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                  style={{ border: '1px solid rgba(239,68,68,0.2)' }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Session
                </button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-3 rounded-xl space-y-2"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
                >
                  <p className="font-body text-xs text-red-400 font-medium">
                    Delete this session permanently?
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleDeleteSession}
                      className="flex-1 py-2 rounded-lg bg-red-600 text-white font-body text-xs font-medium hover:bg-red-700 transition-colors"
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 py-2 rounded-lg text-red-400 font-body text-xs font-medium hover:bg-red-500/10 transition-colors"
                      style={{ border: '1px solid rgba(239,68,68,0.2)' }}
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── COPILOT SIDEBAR (Overlay) ── */}
      <CopilotSidebar
        session={session}
        isOpen={copilotOpen}
        onClose={() => setCopilotOpen(false)}
      />
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// ACTION BUTTON COMPONENT
// ════════════════════════════════════════════════════════════

interface ActionButtonProps {
  onClick: () => Promise<void> | void;
  loading: boolean;
  icon: typeof Scan;
  label: string;
  variant: 'primary' | 'secondary' | 'success' | 'gold';
}

function ActionButton({ onClick, loading, icon: Icon, label, variant }: ActionButtonProps) {
  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      background: 'linear-gradient(135deg, #C9A96E, #B8944F)',
      color: 'white',
      boxShadow: '0 2px 12px rgba(201,169,110,0.3)',
      border: 'none',
    },
    secondary: {
      background: 'transparent',
      color: '#C9A96E',
      border: '1px solid rgba(201,169,110,0.3)',
    },
    success: {
      background: 'linear-gradient(135deg, #059669, #047857)',
      color: 'white',
      boxShadow: '0 2px 12px rgba(5,150,105,0.3)',
      border: 'none',
    },
    gold: {
      background: 'linear-gradient(135deg, #C9A96E, #E8D5A8, #C9A96E)',
      backgroundSize: '200% 100%',
      color: '#0F1D2C',
      boxShadow: '0 2px 20px rgba(201,169,110,0.35)',
      border: 'none',
    },
  };

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={loading}
      whileHover={{ scale: 1.03, boxShadow: variant === 'secondary' ? '0 0 15px rgba(201,169,110,0.15)' : undefined }}
      whileTap={{ scale: 0.97 }}
      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-body text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${variant === 'secondary' ? 'hover:bg-[#C9A96E]/10' : ''}`}
      style={variantStyles[variant]}
    >
      {loading ? (
        <motion.div className="flex gap-0.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1 h-1 rounded-full bg-current"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </motion.div>
      ) : (
        <Icon className="w-3.5 h-3.5" />
      )}
      {!loading && label}
    </motion.button>
  );
}

// ════════════════════════════════════════════════════════════
// SIMULATION TAB
// ════════════════════════════════════════════════════════════

function SimulationTab({ session }: { session: NonNullable<ReturnType<typeof useMastermindSession>['session']> }) {
  const sim = session.simulationComparison;
  const [activeView, setActiveView] = useState<'with' | 'without'>('with');
  const [selectedFrame, setSelectedFrame] = useState(0);

  if (!sim) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-[#F8F6F1] flex items-center justify-center mb-4">
          <Image className="w-8 h-8 text-[#0F1D2C]/20" />
        </div>
        <h3 className="font-body text-sm font-medium text-[#0F1D2C]/60">
          No Simulation Yet
        </h3>
        <p className="font-body text-xs text-[#0F1D2C]/40 mt-1">
          Approve the treatment plan first, then generate a simulation.
        </p>
      </div>
    );
  }

  const currentPath = activeView === 'with' ? sim.withTreatment : sim.withoutTreatment;
  const frame = currentPath.frames[selectedFrame];

  return (
    <div className="space-y-6">
      {/* View Toggle */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveView('with')}
          className={`px-4 py-2 rounded-xl font-body text-xs font-medium transition-all ${
            activeView === 'with'
              ? 'bg-[#059669]/10 text-[#059669] border border-[#059669]/20'
              : 'bg-[#F8F6F1] text-[#0F1D2C]/40 border border-transparent'
          }`}
        >
          With Treatment
        </button>
        <button
          type="button"
          onClick={() => setActiveView('without')}
          className={`px-4 py-2 rounded-xl font-body text-xs font-medium transition-all ${
            activeView === 'without'
              ? 'bg-red-50 text-red-600 border border-red-200'
              : 'bg-[#F8F6F1] text-[#0F1D2C]/40 border border-transparent'
          }`}
        >
          Without Treatment
        </button>
      </div>

      {/* Main Frame */}
      {frame && (
        <motion.div
          key={`${activeView}-${selectedFrame}`}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl border border-[#E8E4DF] overflow-hidden bg-white"
        >
          <div className="aspect-[4/3] bg-[#0F1D2C]/5 relative">
            {frame.imageDataUrl ? (
              <img
                src={frame.imageDataUrl}
                alt={frame.description}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Image className="w-12 h-12 text-[#0F1D2C]/10" />
              </div>
            )}
            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
              <div className="bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2">
                <p className="font-body text-xs text-[#0F1D2C]/50">{frame.timepoint}</p>
                <p className="font-[family-name:var(--font-heading)] text-lg font-bold text-[#0F1D2C]">
                  Score: {frame.auraScoreProjection}
                </p>
              </div>
              <div className="bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2">
                <p className="font-body text-xs text-[#0F1D2C]/50">Skin Age</p>
                <p className="font-body text-sm font-semibold text-[#0F1D2C]">
                  {frame.skinAgeProjection}
                </p>
              </div>
            </div>
          </div>
          <div className="p-4">
            <p className="font-body text-sm text-[#0F1D2C]/70">{frame.description}</p>
          </div>
        </motion.div>
      )}

      {/* Timeline Scrubber */}
      <div className="flex gap-2">
        {currentPath.frames.map((f, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setSelectedFrame(i)}
            className={`flex-1 py-2 rounded-xl font-body text-xs font-medium transition-all ${
              i === selectedFrame
                ? 'bg-[#C9A96E] text-white shadow-sm'
                : 'bg-[#F8F6F1] text-[#0F1D2C]/40 hover:bg-[#E8E4DF]'
            }`}
          >
            {f.timepoint}
          </button>
        ))}
      </div>

      {/* Comparison Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-[#059669]/5 border border-[#059669]/10 text-center">
          <p className="font-body text-xs text-[#0F1D2C]/40">Score Delta</p>
          <p className="font-[family-name:var(--font-heading)] text-xl font-bold text-[#059669]">
            +{sim.comparison.auraScoreDelta}
          </p>
        </div>
        <div className="p-3 rounded-xl bg-[#C9A96E]/5 border border-[#C9A96E]/10 text-center">
          <p className="font-body text-xs text-[#0F1D2C]/40">Years Younger</p>
          <p className="font-[family-name:var(--font-heading)] text-xl font-bold text-[#C9A96E]">
            {Math.abs(sim.comparison.skinAgeDelta)}
          </p>
        </div>
        <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-center">
          <p className="font-body text-xs text-[#0F1D2C]/40">Cost of 1yr Delay</p>
          <p className="font-[family-name:var(--font-heading)] text-xl font-bold text-red-600">
            +${(sim.costOfDelay.costIfDelayed1Year - sim.costOfDelay.currentPlanCost).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Key Differentiators */}
      {sim.comparison.keyDifferentiators.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-body text-xs font-semibold text-[#0F1D2C]/70 uppercase tracking-wide">
            Key Differentiators
          </h3>
          {sim.comparison.keyDifferentiators.map((diff, i) => (
            <div
              key={i}
              className="flex items-start gap-2 p-2.5 rounded-lg bg-[#F8F6F1] border border-[#E8E4DF]"
            >
              <ChevronRight className="w-3.5 h-3.5 text-[#C9A96E] mt-0.5 shrink-0" />
              <p className="font-body text-xs text-[#0F1D2C]/60">{diff}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// COPILOT FULL WIDTH (Tab View)
// ════════════════════════════════════════════════════════════

function CopilotFullWidth({ session }: { session: NonNullable<ReturnType<typeof useMastermindSession>['session']> }) {
  const [activeSection, setActiveSection] = useState<'suggestions' | 'objections' | 'closing'>('suggestions');

  const scan = session.auraScanResult;
  const plan = session.mastermindPlan;

  if (!scan || !plan) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Sparkles className="w-12 h-12 text-[#C9A96E]/20 mb-4" />
        <h3 className="font-body text-sm font-medium text-[#0F1D2C]/60">
          AI Copilot Ready
        </h3>
        <p className="font-body text-xs text-[#0F1D2C]/40 mt-1">
          Complete the Aura Scan and generate a plan to activate AI-powered consultation assistance.
        </p>
      </div>
    );
  }

  // Generate contextual data
  const suggestions = generateCopilotSuggestions(session);
  const objections = generateCopilotObjections(session);
  const closingTechniques = generateCopilotClosing(session);

  const sections = [
    { id: 'suggestions' as const, label: 'Suggestions', count: suggestions.length },
    { id: 'objections' as const, label: 'Objection Handlers', count: objections.length },
    { id: 'closing' as const, label: 'Closing Techniques', count: closingTechniques.length },
  ];

  return (
    <div className="space-y-5">
      {/* Section Toggle */}
      <div className="flex gap-2">
        {sections.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setActiveSection(s.id)}
            className={`px-4 py-2 rounded-xl font-body text-xs font-medium transition-all ${
              activeSection === s.id
                ? 'bg-[#C9A96E]/10 text-[#C9A96E] border border-[#C9A96E]/20'
                : 'bg-[#F8F6F1] text-[#0F1D2C]/40 border border-transparent hover:bg-[#E8E4DF]'
            }`}
          >
            {s.label}
            <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#C9A96E]/20 text-[#C9A96E] text-xs">
              {s.count}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {activeSection === 'suggestions' &&
          suggestions.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-4 rounded-xl border border-[#C9A96E]/20 bg-[#C9A96E]/5"
            >
              <p className="font-body text-sm font-semibold text-[#0F1D2C] mb-1.5">
                {s.title}
              </p>
              <p className="font-body text-xs text-[#0F1D2C]/60 leading-relaxed">
                {s.suggestion}
              </p>
            </motion.div>
          ))}

        {activeSection === 'objections' &&
          objections.map((o, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-4 rounded-xl border border-[#E8E4DF] bg-white"
            >
              <p className="font-body text-sm font-semibold text-[#DC2626] mb-1.5">
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

        {activeSection === 'closing' &&
          closingTechniques.map((c, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-4 rounded-xl border border-[#059669]/20 bg-[#059669]/5"
            >
              <p className="font-body text-sm font-semibold text-[#059669] mb-1.5">
                {c.name}
              </p>
              <p className="font-body text-xs text-[#0F1D2C]/60 leading-relaxed">
                {c.script}
              </p>
            </motion.div>
          ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// NOTES & HISTORY TAB
// ════════════════════════════════════════════════════════════

function NotesHistoryTab({ session }: { session: NonNullable<ReturnType<typeof useMastermindSession>['session']> }) {
  const review = session.providerReview;
  const modifications = review?.modifications || [];
  const clinicalNotes = review?.clinicalNotes || [];

  const timeline = useMemo(() => {
    const events: { time: string; label: string; detail: string; type: 'phase' | 'mod' | 'note' }[] = [];

    events.push({
      time: session.createdAt,
      label: 'Session Created',
      detail: `Consultation for ${session.patientName}`,
      type: 'phase',
    });

    if (session.auraScanResult) {
      events.push({
        time: session.auraScanResult.timestamp,
        label: 'Aura Scan Completed',
        detail: `Score: ${session.auraScanResult.auraScore.overall} (${session.auraScanResult.auraScore.grade})`,
        type: 'phase',
      });
    }

    if (session.mastermindPlan) {
      events.push({
        time: session.mastermindPlan.generatedAt,
        label: 'Treatment Plan Generated',
        detail: `${session.mastermindPlan.recommendations.primary.length + session.mastermindPlan.recommendations.complementary.length} treatments recommended`,
        type: 'phase',
      });
    }

    modifications.forEach((mod) => {
      events.push({
        time: mod.timestamp,
        label: `Plan ${mod.type.replace(/_/g, ' ')}`,
        detail: mod.details,
        type: 'mod',
      });
    });

    if (review?.approvedAt) {
      events.push({
        time: review.approvedAt,
        label: 'Plan Approved',
        detail: `By ${review.providerName}`,
        type: 'phase',
      });
    }

    events.push({
      time: session.updatedAt,
      label: 'Last Updated',
      detail: PHASE_LABELS[session.phase],
      type: 'phase',
    });

    return events.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  }, [session, review, modifications]);

  return (
    <div className="space-y-6">
      {/* Clinical Notes */}
      <div>
        <h3 className="font-body text-xs font-semibold text-[#0F1D2C]/70 uppercase tracking-wide mb-3">
          Clinical Notes
        </h3>
        {clinicalNotes.length > 0 ? (
          <div className="space-y-2">
            {clinicalNotes.map((note, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-white border border-[#E8E4DF]"
              >
                <p className="font-body text-sm text-[#0F1D2C]/70">{note}</p>
                <p className="font-body text-xs text-[#0F1D2C]/30 mt-1">
                  {review?.providerName || 'Provider'}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="font-body text-xs text-[#0F1D2C]/30 italic">
            No clinical notes added yet.
          </p>
        )}
      </div>

      {/* AI Summary */}
      {session.mastermindPlan?.aiSummary && (
        <div>
          <h3 className="font-body text-xs font-semibold text-[#0F1D2C]/70 uppercase tracking-wide mb-3">
            AI Summary (Provider)
          </h3>
          <div className="p-4 rounded-xl bg-[#C9A96E]/5 border border-[#C9A96E]/10">
            <p className="font-body text-xs text-[#0F1D2C]/60 leading-relaxed">
              {session.mastermindPlan.aiSummary.providerFacing}
            </p>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div>
        <h3 className="font-body text-xs font-semibold text-[#0F1D2C]/70 uppercase tracking-wide mb-3">
          Session History
        </h3>
        <div className="space-y-0">
          {timeline.map((event, i) => (
            <div key={i} className="flex gap-3 pb-4 last:pb-0">
              <div className="flex flex-col items-center">
                <div
                  className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
                    event.type === 'phase'
                      ? 'bg-[#0F1D2C]/20'
                      : event.type === 'mod'
                        ? 'bg-[#C9A96E]'
                        : 'bg-blue-400'
                  }`}
                />
                {i < timeline.length - 1 && (
                  <div className="w-px flex-1 bg-[#E8E4DF] mt-1" />
                )}
              </div>
              <div className="pb-2">
                <p className="font-body text-sm font-medium text-[#0F1D2C]">
                  {event.label}
                </p>
                <p className="font-body text-xs text-[#0F1D2C]/50 mt-0.5">
                  {event.detail}
                </p>
                <p className="font-body text-xs text-[#0F1D2C]/25 mt-0.5">
                  {new Date(event.time).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// COPILOT DATA GENERATORS (static, matching CopilotSidebar)
// ════════════════════════════════════════════════════════════

interface CopilotSuggestion {
  title: string;
  suggestion: string;
}

function generateCopilotSuggestions(session: NonNullable<ReturnType<typeof useMastermindSession>['session']>): CopilotSuggestion[] {
  const suggestions: CopilotSuggestion[] = [];
  const scan = session.auraScanResult;
  const plan = session.mastermindPlan;
  if (!scan || !plan) return suggestions;

  if (scan.auraScore.overall < 60) {
    suggestions.push({
      title: 'Aggressive Treatment Path',
      suggestion: `With an Aura Score of ${scan.auraScore.overall}, this patient would benefit from a comprehensive treatment approach. Consider emphasizing the Transform or Elite package to maximize results.`,
    });
  }

  if (scan.auraScore.skinAgeDelta > 5) {
    suggestions.push({
      title: 'Skin Age Opportunity',
      suggestion: `The patient's skin age is ${scan.auraScore.skinAgeDelta} years older than their chronological age. This creates a compelling visual story -- show the projected improvement to close.`,
    });
  }

  const topConcern = scan.detectedConcerns[0];
  if (topConcern) {
    suggestions.push({
      title: `Focus on ${topConcern.concern.replace(/_/g, ' ')}`,
      suggestion: `This is the patient's #1 concern with a severity score of ${topConcern.score}/100. Lead with treatments addressing this to build trust before discussing the full plan.`,
    });
  }

  suggestions.push({
    title: 'Package Positioning',
    suggestion: 'Present all three tiers but verbally walk through the Transform package first. It offers the best value-to-results ratio and is the natural recommendation for most patients.',
  });

  return suggestions;
}

interface CopilotObjection {
  objection: string;
  response: string;
  technique: string;
}

function generateCopilotObjections(session: NonNullable<ReturnType<typeof useMastermindSession>['session']>): CopilotObjection[] {
  const handlers: CopilotObjection[] = [];
  const plan = session.mastermindPlan;
  if (!plan) return handlers;

  const totalCost = [
    ...plan.recommendations.primary,
    ...plan.recommendations.complementary,
  ].reduce((sum, t) => sum + t.totalEstimate, 0);

  handlers.push({
    objection: "That's more than I expected to spend.",
    response: `I understand. Many of our patients feel that way initially. The Transform package is actually ${plan.packages.find((p) => p.highlighted)?.discount || 15}% less than booking these treatments individually. And with our financing, that's just $${Math.round(totalCost / 12)}/month.`,
    technique: 'Reframe + Value Comparison',
  });

  handlers.push({
    objection: 'I need to think about it.',
    response: "Absolutely -- this is an important decision. What I'd suggest is booking just the first treatment today so we can lock in your results timeline. Your skin age is only going to increase if we wait.",
    technique: 'Urgency + Trial Close',
  });

  handlers.push({
    objection: 'Does this actually work?',
    response: "Great question. These are all FDA-cleared treatments backed by clinical studies. But more importantly -- you just saw your own scan results. We're not guessing -- we know exactly what your skin needs.",
    technique: 'Evidence + Personalization',
  });

  handlers.push({
    objection: "I'm worried about the pain/downtime.",
    response: "I hear you. That's why we've sequenced your treatments to minimize downtime. Your initial treatments have zero downtime, and by the time we get to the more intensive procedures, you'll be comfortable.",
    technique: 'Acknowledge + Sequential Comfort',
  });

  return handlers;
}

interface CopilotClosing {
  name: string;
  script: string;
}

function generateCopilotClosing(session: NonNullable<ReturnType<typeof useMastermindSession>['session']>): CopilotClosing[] {
  const techniques: CopilotClosing[] = [];
  const scan = session.auraScanResult;
  const plan = session.mastermindPlan;
  if (!scan || !plan) return techniques;

  techniques.push({
    name: 'Assumptive Close',
    script: `"Based on everything we've discussed and your scan results, the Transform package is the clear path to your goals. Let me get you scheduled for your first treatment -- do you prefer mornings or afternoons?"`,
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
