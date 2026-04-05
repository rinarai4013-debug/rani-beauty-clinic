'use client';

/**
 * Staff Consultation Pipeline
 *
 * /dashboard/consultations
 *
 * Operational page for clinic staff to manage consultation follow-ups.
 * Lists all submitted consultations with status, actions, and detail drawer.
 */

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Phone,
  Mail,
  ExternalLink,
  Copy,
  Check,
  ChevronRight,
  Clock,
  Eye,
  MessageSquare,
  CalendarCheck,
  XCircle,
  Filter,
  Link2,
  Sparkles,
  FileText,
  X,
} from 'lucide-react';
import { useMastermindSessions, useMastermindSession } from '@/hooks/useMastermindSessions';
import type { MastermindSession, MastermindPhase, ClinicStatus } from '@/types/mastermind';

// ── CONSTANTS ──

const CLINIC_STATUS_CONFIG: Record<ClinicStatus, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  new: { label: 'New', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)', icon: Sparkles },
  reviewed: { label: 'Reviewed', color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)', icon: Eye },
  contacted: { label: 'Contacted', color: '#D97706', bg: 'rgba(217,119,6,0.12)', icon: MessageSquare },
  booked: { label: 'Booked', color: '#059669', bg: 'rgba(5,150,105,0.12)', icon: CalendarCheck },
  no_response: { label: 'No Response', color: '#EF4444', bg: 'rgba(239,68,68,0.12)', icon: XCircle },
  closed: { label: 'Closed', color: '#6B7280', bg: 'rgba(107,114,128,0.12)', icon: Check },
};

const ALL_STATUSES: ClinicStatus[] = ['new', 'reviewed', 'contacted', 'booked', 'no_response', 'closed'];

function getEffectiveClinicStatus(s: MastermindSession): ClinicStatus {
  if (s.clinicStatus) return s.clinicStatus;
  if (s.bookedAppointmentId) return 'booked';
  if (s.phase === 'completed') return 'reviewed';
  return 'new';
}

function hasPlanReady(s: MastermindSession): boolean {
  return !!s.mastermindPlan;
}

function hasShareLink(s: MastermindSession): boolean {
  return !!s.shareToken;
}

function getPhone(s: MastermindSession): string {
  return (s.intakeData?.phone as string) || '';
}

function getEmail(s: MastermindSession): string {
  return s.patientEmail || (s.intakeData?.email as string) || '';
}

function getConcerns(s: MastermindSession): string[] {
  const concerns = s.intakeData?.skinConcerns;
  if (Array.isArray(concerns)) return concerns as string[];
  return [];
}

function getGoals(s: MastermindSession): string {
  return (s.intakeData?.goals as string) || '';
}

function getTimeline(s: MastermindSession): string {
  return (s.intakeData?.timeline as string) || '';
}

function getBudget(s: MastermindSession): string {
  return (s.intakeData?.budget as string) || '';
}

function getTargetAreas(s: MastermindSession): string[] {
  const areas = s.intakeData?.targetAreas;
  if (Array.isArray(areas)) return areas as string[];
  return [];
}

function formatConcern(c: string): string {
  return c.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);

  if (diffH < 1) return 'Just now';
  if (diffH < 24) return `${diffH}h ago`;
  if (diffD === 1) return 'Yesterday';
  if (diffD < 7) return `${diffD}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatFullDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// ── PHASE LABELS ──

const PHASE_LABELS: Record<MastermindPhase, string> = {
  intake: 'Intake',
  scanning: 'Scanning',
  scan_complete: 'Scan Done',
  generating_plan: 'Generating',
  plan_ready: 'Plan Ready',
  provider_review: 'In Review',
  approved: 'Approved',
  simulating: 'Simulating',
  simulation_ready: 'Sim Ready',
  presenting: 'Presenting',
  completed: 'Completed',
};

// ── MAIN PAGE ──

export default function ConsultationPipelinePage() {
  const { sessions, isLoading, mutate } = useMastermindSessions();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ClinicStatus | 'all'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Filter & sort
  const filteredSessions = useMemo(() => {
    let list = [...sessions];

    // Status filter
    if (statusFilter !== 'all') {
      list = list.filter(s => getEffectiveClinicStatus(s) === statusFilter);
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(s =>
        s.patientName.toLowerCase().includes(q) ||
        getEmail(s).toLowerCase().includes(q) ||
        getPhone(s).includes(q) ||
        s.id.toLowerCase().includes(q)
      );
    }

    // Sort: newest first, but prioritize "new" status
    list.sort((a, b) => {
      const aStatus = getEffectiveClinicStatus(a);
      const bStatus = getEffectiveClinicStatus(b);
      if (aStatus === 'new' && bStatus !== 'new') return -1;
      if (bStatus === 'new' && aStatus !== 'new') return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return list;
  }, [sessions, statusFilter, searchQuery]);

  // Status counts
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: sessions.length };
    for (const s of sessions) {
      const st = getEffectiveClinicStatus(s);
      counts[st] = (counts[st] || 0) + 1;
    }
    return counts;
  }, [sessions]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAFAF8' }}>
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1
              className="text-2xl font-bold"
              style={{ fontFamily: 'var(--font-heading), Playfair Display, serif', color: '#0F1D2C' }}
            >
              Consultation Pipeline
            </h1>
            <p className="text-sm mt-1" style={{ color: '#0F1D2C80' }}>
              {sessions.length} consultation{sessions.length !== 1 ? 's' : ''} &middot; {statusCounts.new || 0} need attention
            </p>
          </div>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#0F1D2C40' }} />
            <input
              type="text"
              placeholder="Search by name, email, phone, or ID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 transition-shadow"
              style={{
                borderColor: '#0F1D2C15',
                backgroundColor: '#fff',
                color: '#0F1D2C',
                fontFamily: 'var(--font-body), Montserrat, sans-serif',
              }}
            />
          </div>
        </div>

        {/* Status tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 hide-scrollbar">
          <StatusTab
            label="All"
            count={statusCounts.all || 0}
            active={statusFilter === 'all'}
            onClick={() => setStatusFilter('all')}
            color="#0F1D2C"
          />
          {ALL_STATUSES.map(st => (
            <StatusTab
              key={st}
              label={CLINIC_STATUS_CONFIG[st].label}
              count={statusCounts[st] || 0}
              active={statusFilter === st}
              onClick={() => setStatusFilter(st)}
              color={CLINIC_STATUS_CONFIG[st].color}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pb-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-[#C9A96E] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm mt-3" style={{ color: '#0F1D2C50' }}>Loading consultations...</p>
            </div>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="text-center py-20">
            <Filter className="w-8 h-8 mx-auto mb-3" style={{ color: '#0F1D2C20' }} />
            <p className="text-sm" style={{ color: '#0F1D2C50' }}>
              {searchQuery ? 'No consultations match your search' : 'No consultations yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredSessions.map(session => (
              <ConsultationRow
                key={session.id}
                session={session}
                isSelected={selectedId === session.id}
                onSelect={() => setSelectedId(selectedId === session.id ? null : session.id)}
                onMutate={mutate}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail Drawer */}
      <AnimatePresence>
        {selectedId && (
          <ConsultationDetailDrawer
            sessionId={selectedId}
            onClose={() => setSelectedId(null)}
            onMutate={mutate}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── STATUS TAB ──

function StatusTab({
  label, count, active, onClick, color,
}: {
  label: string; count: number; active: boolean; onClick: () => void; color: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all"
      style={{
        backgroundColor: active ? `${color}12` : 'transparent',
        color: active ? color : '#0F1D2C60',
        border: active ? `1px solid ${color}25` : '1px solid transparent',
        fontFamily: 'var(--font-body), Montserrat, sans-serif',
      }}
    >
      {label}
      {count > 0 && (
        <span
          className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
          style={{
            backgroundColor: active ? `${color}20` : '#0F1D2C08',
            color: active ? color : '#0F1D2C40',
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}

// ── CONSULTATION ROW ──

function ConsultationRow({
  session: s,
  isSelected,
  onSelect,
  onMutate,
}: {
  session: MastermindSession;
  isSelected: boolean;
  onSelect: () => void;
  onMutate: () => void;
}) {
  const clinicStatus = getEffectiveClinicStatus(s);
  const statusConfig = CLINIC_STATUS_CONFIG[clinicStatus];
  const StatusIcon = statusConfig.icon;
  const concerns = getConcerns(s);
  const phone = getPhone(s);
  const email = getEmail(s);

  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full text-left rounded-xl p-4 transition-all hover:shadow-md group"
      style={{
        backgroundColor: isSelected ? '#fff' : '#fff',
        border: isSelected ? '1px solid #C9A96E40' : '1px solid #0F1D2C08',
        boxShadow: isSelected ? '0 4px 20px rgba(201,169,110,0.1)' : 'none',
      }}
    >
      <div className="flex items-start gap-3">
        {/* Status indicator */}
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ backgroundColor: statusConfig.bg }}
        >
          <StatusIcon className="w-4 h-4" style={{ color: statusConfig.color }} />
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="font-semibold text-sm truncate"
              style={{ color: '#0F1D2C', fontFamily: 'var(--font-body), Montserrat, sans-serif' }}
            >
              {s.patientName || 'Unknown Patient'}
            </span>
            <span
              className="text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0"
              style={{ backgroundColor: statusConfig.bg, color: statusConfig.color }}
            >
              {statusConfig.label}
            </span>
            {hasPlanReady(s) && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0"
                style={{ backgroundColor: 'rgba(5,150,105,0.1)', color: '#059669' }}
              >
                Plan Ready
              </span>
            )}
            {hasShareLink(s) && (
              <Link2 className="w-3 h-3 flex-shrink-0" style={{ color: '#C9A96E' }} />
            )}
          </div>

          {/* Contact + concerns */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs" style={{ color: '#0F1D2C60' }}>
            {phone && (
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3" /> {phone}
              </span>
            )}
            {email && (
              <span className="flex items-center gap-1 truncate max-w-[200px]">
                <Mail className="w-3 h-3" /> {email}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> {formatDate(s.createdAt)}
            </span>
          </div>

          {/* Concerns */}
          {concerns.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {concerns.slice(0, 3).map(c => (
                <span
                  key={c}
                  className="text-[10px] px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: '#0F1D2C06', color: '#0F1D2C60' }}
                >
                  {formatConcern(c)}
                </span>
              ))}
              {concerns.length > 3 && (
                <span className="text-[10px] px-1" style={{ color: '#0F1D2C40' }}>
                  +{concerns.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Arrow */}
        <ChevronRight
          className="w-4 h-4 flex-shrink-0 mt-2 transition-transform group-hover:translate-x-0.5"
          style={{ color: '#0F1D2C20' }}
        />
      </div>
    </button>
  );
}

// ── DETAIL DRAWER ──

function ConsultationDetailDrawer({
  sessionId,
  onClose,
  onMutate,
}: {
  sessionId: string;
  onClose: () => void;
  onMutate: () => void;
}) {
  const { session, dispatch, isLoading } = useMastermindSession(sessionId);
  const [copiedLink, setCopiedLink] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState('');

  const s = session;

  const handleStatusChange = useCallback(async (status: ClinicStatus) => {
    setUpdatingStatus(true);
    await dispatch({ type: 'SET_CLINIC_STATUS', status });
    onMutate();
    setUpdatingStatus(false);
  }, [dispatch, onMutate]);

  const handleSaveNotes = useCallback(async () => {
    if (!notesDraft.trim()) return;
    await dispatch({ type: 'SET_CLINIC_NOTES', notes: notesDraft.trim() });
    onMutate();
    setShowNotes(false);
  }, [dispatch, notesDraft, onMutate]);

  const handleGenerateShareLink = useCallback(async () => {
    if (!s) return;
    setGeneratingLink(true);
    try {
      const res = await fetch('/api/mastermind/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: s.id }),
      });
      const data = await res.json();
      if (data.success && data.token) {
        await dispatch({ type: 'SET_SHARE_TOKEN', token: data.token });
        onMutate();
        // Copy to clipboard
        const url = data.shareUrl || `https://ranibeautyclinic.com/my-plan/${data.token}`;
        await navigator.clipboard.writeText(url);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      }
    } catch (err) {
      console.error('[Consultations] Share link generation failed:', err);
    } finally {
      setGeneratingLink(false);
    }
  }, [s, dispatch, onMutate]);

  const handleCopyShareLink = useCallback(async () => {
    if (!s?.shareToken) return;
    const url = `https://ranibeautyclinic.com/my-plan/${s.shareToken}`;
    await navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }, [s?.shareToken]);

  if (isLoading || !s) {
    return (
      <DrawerShell onClose={onClose}>
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-[#C9A96E] border-t-transparent rounded-full animate-spin" />
        </div>
      </DrawerShell>
    );
  }

  const clinicStatus = getEffectiveClinicStatus(s);
  const statusConfig = CLINIC_STATUS_CONFIG[clinicStatus];
  const phone = getPhone(s);
  const email = getEmail(s);
  const concerns = getConcerns(s);
  const goals = getGoals(s);
  const timeline = getTimeline(s);
  const budget = getBudget(s);
  const targetAreas = getTargetAreas(s);
  const auraScore = s.auraScanResult?.auraScore;
  const plan = s.mastermindPlan;

  return (
    <DrawerShell onClose={onClose}>
      {/* Patient Header */}
      <div className="px-6 pt-5 pb-4 border-b" style={{ borderColor: '#0F1D2C08' }}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <h2
              className="text-lg font-bold"
              style={{ fontFamily: 'var(--font-heading), Playfair Display, serif', color: '#0F1D2C' }}
            >
              {s.patientName || 'Unknown Patient'}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: '#0F1D2C50' }}>
              Submitted {formatFullDate(s.createdAt)} &middot; {s.id}
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-black/5">
            <X className="w-5 h-5" style={{ color: '#0F1D2C40' }} />
          </button>
        </div>

        {/* Contact actions */}
        <div className="flex gap-2 mb-3">
          {phone && (
            <a
              href={`tel:${phone.replace(/\D/g, '')}`}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors hover:opacity-80"
              style={{ backgroundColor: '#059669', color: '#fff' }}
            >
              <Phone className="w-3.5 h-3.5" />
              Call
            </a>
          )}
          {email && (
            <a
              href={`mailto:${email}`}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors hover:opacity-80"
              style={{ backgroundColor: '#3B82F6', color: '#fff' }}
            >
              <Mail className="w-3.5 h-3.5" />
              Email
            </a>
          )}
          {hasShareLink(s) ? (
            <button
              type="button"
              onClick={handleCopyShareLink}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors hover:opacity-80"
              style={{ backgroundColor: '#C9A96E', color: '#fff' }}
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedLink ? 'Copied!' : 'Copy Plan Link'}
            </button>
          ) : hasPlanReady(s) ? (
            <button
              type="button"
              onClick={handleGenerateShareLink}
              disabled={generatingLink}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors hover:opacity-80 disabled:opacity-50"
              style={{ backgroundColor: '#C9A96E', color: '#fff' }}
            >
              {generatingLink ? (
                <div className="w-3.5 h-3.5 border border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Link2 className="w-3.5 h-3.5" />
              )}
              Generate Plan Link
            </button>
          ) : null}
          {hasShareLink(s) && (
            <a
              href={`/my-plan/${s.shareToken}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors hover:opacity-80"
              style={{ backgroundColor: '#0F1D2C08', color: '#0F1D2C80' }}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View Plan
            </a>
          )}
        </div>

        {/* Status selector */}
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider mb-1.5" style={{ color: '#0F1D2C40' }}>
            Follow-up Status
          </p>
          <div className="flex flex-wrap gap-1.5">
            {ALL_STATUSES.map(st => {
              const cfg = CLINIC_STATUS_CONFIG[st];
              const isActive = clinicStatus === st;
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => handleStatusChange(st)}
                  disabled={updatingStatus}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all disabled:opacity-50"
                  style={{
                    backgroundColor: isActive ? cfg.bg : 'transparent',
                    color: isActive ? cfg.color : '#0F1D2C40',
                    border: isActive ? `1px solid ${cfg.color}30` : '1px solid #0F1D2C10',
                  }}
                >
                  {cfg.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
        {/* Aura Score (if available) */}
        {auraScore && (
          <DetailSection title="Aura Score">
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-xl flex flex-col items-center justify-center"
                style={{ backgroundColor: 'rgba(201,169,110,0.1)' }}
              >
                <span className="text-lg font-bold" style={{ color: '#C9A96E' }}>
                  {auraScore.overall}
                </span>
                <span className="text-[9px] font-medium" style={{ color: '#C9A96E80' }}>
                  {auraScore.grade}
                </span>
              </div>
              <div className="text-xs space-y-0.5" style={{ color: '#0F1D2C70' }}>
                <p>Skin Age: <strong style={{ color: '#0F1D2C' }}>{auraScore.skinAge}</strong> (actual: {auraScore.chronologicalAge})</p>
                <p>Delta: <strong style={{ color: auraScore.skinAgeDelta <= 0 ? '#059669' : '#EF4444' }}>
                  {auraScore.skinAgeDelta > 0 ? '+' : ''}{auraScore.skinAgeDelta} years
                </strong></p>
                <p>Percentile: <strong style={{ color: '#0F1D2C' }}>{auraScore.percentile}th</strong></p>
              </div>
            </div>
          </DetailSection>
        )}

        {/* Concerns */}
        {concerns.length > 0 && (
          <DetailSection title="Primary Concerns">
            <div className="flex flex-wrap gap-1.5">
              {concerns.map(c => (
                <span
                  key={c}
                  className="text-xs px-2.5 py-1 rounded-lg"
                  style={{ backgroundColor: '#0F1D2C06', color: '#0F1D2C80' }}
                >
                  {formatConcern(c)}
                </span>
              ))}
            </div>
          </DetailSection>
        )}

        {/* Target Areas */}
        {targetAreas.length > 0 && (
          <DetailSection title="Target Areas">
            <div className="flex flex-wrap gap-1.5">
              {targetAreas.map(a => (
                <span
                  key={a}
                  className="text-xs px-2.5 py-1 rounded-lg"
                  style={{ backgroundColor: '#0F1D2C06', color: '#0F1D2C80' }}
                >
                  {formatConcern(a)}
                </span>
              ))}
            </div>
          </DetailSection>
        )}

        {/* Goals & Preferences */}
        {(goals || timeline || budget) && (
          <DetailSection title="Goals & Preferences">
            <div className="space-y-2 text-xs" style={{ color: '#0F1D2C80' }}>
              {goals && (
                <div>
                  <span className="font-medium" style={{ color: '#0F1D2C' }}>Goals:</span>{' '}
                  {goals}
                </div>
              )}
              <div className="flex gap-4">
                {timeline && (
                  <div>
                    <span className="font-medium" style={{ color: '#0F1D2C' }}>Timeline:</span>{' '}
                    {formatConcern(timeline)}
                  </div>
                )}
                {budget && (
                  <div>
                    <span className="font-medium" style={{ color: '#0F1D2C' }}>Budget:</span>{' '}
                    {formatConcern(budget)}
                  </div>
                )}
              </div>
            </div>
          </DetailSection>
        )}

        {/* Plan Summary */}
        {plan && (
          <DetailSection title="Treatment Plan">
            {plan.aiSummary?.providerFacing && (
              <p className="text-xs mb-3 leading-relaxed" style={{ color: '#0F1D2C80' }}>
                {plan.aiSummary.providerFacing}
              </p>
            )}
            <div className="space-y-1.5">
              {plan.recommendations.primary.map(t => (
                <TreatmentRow key={t.id} name={t.treatmentName} category={t.category} sessions={t.sessionsRequired} cost={t.totalEstimate} priority="essential" />
              ))}
              {plan.recommendations.complementary.map(t => (
                <TreatmentRow key={t.id} name={t.treatmentName} category={t.category} sessions={t.sessionsRequired} cost={t.totalEstimate} priority="recommended" />
              ))}
            </div>
            {/* Packages */}
            {plan.packages.length > 0 && (
              <div className="mt-3 pt-3 border-t" style={{ borderColor: '#0F1D2C08' }}>
                <p className="text-[10px] font-medium uppercase tracking-wider mb-2" style={{ color: '#0F1D2C40' }}>
                  Packages
                </p>
                <div className="space-y-1">
                  {plan.packages.map(pkg => (
                    <div
                      key={pkg.tier}
                      className="flex items-center justify-between text-xs px-3 py-2 rounded-lg"
                      style={{
                        backgroundColor: pkg.highlighted ? 'rgba(201,169,110,0.08)' : '#0F1D2C04',
                        border: pkg.highlighted ? '1px solid rgba(201,169,110,0.2)' : '1px solid transparent',
                      }}
                    >
                      <div>
                        <span className="font-medium" style={{ color: '#0F1D2C' }}>{pkg.name}</span>
                        <span className="ml-2" style={{ color: '#0F1D2C50' }}>{pkg.sessions} sessions</span>
                      </div>
                      <span className="font-bold" style={{ color: '#0F1D2C' }}>
                        ${pkg.price.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </DetailSection>
        )}

        {/* Pipeline Phase */}
        <DetailSection title="Pipeline Status">
          <div className="flex items-center gap-2 text-xs">
            <span
              className="px-2.5 py-1 rounded-lg font-medium"
              style={{ backgroundColor: '#0F1D2C08', color: '#0F1D2C' }}
            >
              {PHASE_LABELS[s.phase]}
            </span>
            {s.providerReview && (
              <span style={{ color: '#0F1D2C50' }}>
                &middot; {s.providerReview.approvalStatus === 'approved' ? 'Approved' : 'Pending review'} by {s.providerReview.providerName}
              </span>
            )}
          </div>
        </DetailSection>

        {/* Staff Notes */}
        <DetailSection title="Staff Notes">
          {s.clinicNotes ? (
            <div className="text-xs leading-relaxed p-3 rounded-lg" style={{ backgroundColor: '#0F1D2C04', color: '#0F1D2C80' }}>
              {s.clinicNotes}
            </div>
          ) : null}
          {showNotes ? (
            <div className="mt-2">
              <textarea
                value={notesDraft}
                onChange={e => setNotesDraft(e.target.value)}
                placeholder="Add notes about this consultation..."
                className="w-full text-xs p-3 rounded-lg border resize-none focus:outline-none focus:ring-2"
                style={{ borderColor: '#0F1D2C15', minHeight: 80, fontFamily: 'var(--font-body), Montserrat, sans-serif' }}
                rows={3}
              />
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={handleSaveNotes}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium"
                  style={{ backgroundColor: '#0F1D2C', color: '#fff' }}
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setShowNotes(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium"
                  style={{ backgroundColor: '#0F1D2C08', color: '#0F1D2C60' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => { setNotesDraft(s.clinicNotes || ''); setShowNotes(true); }}
              className="text-xs font-medium mt-1"
              style={{ color: '#C9A96E' }}
            >
              {s.clinicNotes ? 'Edit notes' : '+ Add notes'}
            </button>
          )}
        </DetailSection>

        {/* Quick Links */}
        <DetailSection title="Actions">
          <div className="space-y-1.5">
            <ActionLink
              href={`/dashboard/mastermind/${s.id}`}
              icon={FileText}
              label="Open in Mastermind Editor"
              sublabel="Full session editor with all phases"
            />
            {(s.phase === 'approved' || s.phase === 'simulation_ready' || s.phase === 'presenting') && (
              <ActionLink
                href={`/dashboard/mastermind/${s.id}/present`}
                icon={Sparkles}
                label="Launch Presentation"
                sublabel="Full-screen consultation presentation"
              />
            )}
            <ActionLink
              href="https://app.mangomint.com/876418/booking"
              icon={CalendarCheck}
              label="Open Mangomint Booking"
              sublabel="Book appointment for this patient"
              external
            />
          </div>
        </DetailSection>
      </div>
    </DrawerShell>
  );
}

// ── DRAWER SHELL ──

function DrawerShell({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex justify-end"
      style={{ backgroundColor: 'rgba(15,29,44,0.3)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="w-full max-w-lg h-full flex flex-col shadow-2xl"
        style={{ backgroundColor: '#FAFAF8' }}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

// ── DETAIL SECTION ──

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p
        className="text-[10px] font-medium uppercase tracking-wider mb-2"
        style={{ color: '#0F1D2C40' }}
      >
        {title}
      </p>
      {children}
    </div>
  );
}

// ── TREATMENT ROW ──

function TreatmentRow({
  name, category, sessions, cost, priority,
}: {
  name: string; category: string; sessions: number; cost: number; priority: string;
}) {
  return (
    <div
      className="flex items-center justify-between text-xs px-3 py-2 rounded-lg"
      style={{ backgroundColor: '#0F1D2C04' }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{
            backgroundColor: priority === 'essential' ? '#059669' : priority === 'recommended' ? '#D97706' : '#9CA3AF',
          }}
        />
        <span className="font-medium truncate" style={{ color: '#0F1D2C' }}>{name}</span>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0 ml-2" style={{ color: '#0F1D2C50' }}>
        <span>{sessions}x</span>
        <span className="font-medium" style={{ color: '#0F1D2C' }}>${cost.toLocaleString()}</span>
      </div>
    </div>
  );
}

// ── ACTION LINK ──

function ActionLink({
  href, icon: Icon, label, sublabel, external,
}: {
  href: string; icon: typeof FileText; label: string; sublabel: string; external?: boolean;
}) {
  const Tag = external ? 'a' : 'a';
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors hover:bg-black/[0.03] group"
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: '#0F1D2C06' }}
      >
        <Icon className="w-4 h-4" style={{ color: '#0F1D2C40' }} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium" style={{ color: '#0F1D2C' }}>{label}</p>
        <p className="text-[10px]" style={{ color: '#0F1D2C40' }}>{sublabel}</p>
      </div>
      <ExternalLink className="w-3 h-3 ml-auto flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#0F1D2C30' }} />
    </a>
  );
}
