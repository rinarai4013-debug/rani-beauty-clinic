'use client';

/**
 * Staff Consultation Pipeline — Unified Inbox
 *
 * /dashboard/consultations
 *
 * Merges Mastermind sessions + Airtable Client Intakes into one operational view.
 * Activity timeline, source badges, automation-aware status.
 */

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useSWR, { mutate as globalMutate } from 'swr';
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
  Activity,
  Zap,
  FormInput,
  Bot,
  Send,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import type { ClinicStatus, MastermindPhase, ActivityLogEntry } from '@/types/mastermind';
import type { UnifiedConsultation } from '@/app/api/dashboard/consultations/route';

// ── DATA FETCHING ──

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  const json = await res.json();
  return json.data;
};

function useUnifiedConsultations() {
  const { data, error, isLoading, mutate } = useSWR<UnifiedConsultation[]>(
    '/api/dashboard/consultations',
    fetcher,
    { refreshInterval: 30000, dedupingInterval: 10000 }
  );
  return { consultations: data || [], error, isLoading, mutate };
}

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

const SOURCE_CONFIG = {
  mastermind: { label: 'Aura Scan', color: '#C9A96E', bg: 'rgba(201,169,110,0.1)', icon: Zap },
  intake_form: { label: 'Contact Form', color: '#6366F1', bg: 'rgba(99,102,241,0.1)', icon: FormInput },
} as const;

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

function formatTimelineTime(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// ── MAIN PAGE ──

export default function ConsultationPipelinePage() {
  const { consultations, isLoading, mutate } = useUnifiedConsultations();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ClinicStatus | 'all'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filteredConsultations = useMemo(() => {
    let list = [...consultations];

    if (statusFilter !== 'all') {
      list = list.filter(c => c.clinicStatus === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(c =>
        c.patientName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.id.toLowerCase().includes(q)
      );
    }

    // Sort: newest first, prioritize "new" status
    list.sort((a, b) => {
      if (a.clinicStatus === 'new' && b.clinicStatus !== 'new') return -1;
      if (b.clinicStatus === 'new' && a.clinicStatus !== 'new') return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return list;
  }, [consultations, statusFilter, searchQuery]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: consultations.length };
    for (const c of consultations) {
      counts[c.clinicStatus] = (counts[c.clinicStatus] || 0) + 1;
    }
    return counts;
  }, [consultations]);

  const selectedConsultation = useMemo(
    () => consultations.find(c => c.id === selectedId) || null,
    [consultations, selectedId]
  );

  // Conversion funnel metrics
  const funnel = useMemo(() => {
    const total = consultations.length;
    if (total === 0) return null;
    const contacted = consultations.filter(c => ['contacted', 'booked', 'closed'].includes(c.clinicStatus)).length;
    const booked = consultations.filter(c => c.clinicStatus === 'booked').length;
    const withPlan = consultations.filter(c => c.hasPlan).length;
    return {
      total,
      contacted,
      booked,
      withPlan,
      contactRate: Math.round((contacted / total) * 100),
      bookRate: total > 0 ? Math.round((booked / total) * 100) : 0,
      planRate: total > 0 ? Math.round((withPlan / total) * 100) : 0,
    };
  }, [consultations]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAFAF8' }}>
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1
              className="text-2xl font-bold"
              style={{ fontFamily: 'var(--font-heading), Playfair Display, serif', color: '#0F1D2C' }}
            >
              Consultation Pipeline
            </h1>
            <p className="text-sm mt-1" style={{ color: '#0F1D2C80' }}>
              {consultations.length} consultation{consultations.length !== 1 ? 's' : ''} &middot; {statusCounts.new || 0} need attention
            </p>
          </div>
        </div>

        {/* Conversion Funnel */}
        {funnel && funnel.total > 0 && (
          <div
            className="flex items-center gap-2 p-3 rounded-xl mb-4 overflow-x-auto hide-scrollbar"
            style={{ backgroundColor: '#fff', border: '1px solid #0F1D2C08' }}
          >
            <TrendingUp className="w-4 h-4 flex-shrink-0" style={{ color: '#C9A96E' }} />
            <FunnelStep label="Submitted" value={funnel.total} />
            <ArrowRight className="w-3 h-3 flex-shrink-0" style={{ color: '#0F1D2C20' }} />
            <FunnelStep label="Plan Ready" value={funnel.withPlan} rate={funnel.planRate} />
            <ArrowRight className="w-3 h-3 flex-shrink-0" style={{ color: '#0F1D2C20' }} />
            <FunnelStep label="Contacted" value={funnel.contacted} rate={funnel.contactRate} />
            <ArrowRight className="w-3 h-3 flex-shrink-0" style={{ color: '#0F1D2C20' }} />
            <FunnelStep label="Booked" value={funnel.booked} rate={funnel.bookRate} color="#059669" />
          </div>
        )}

        {/* Search */}
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
        ) : filteredConsultations.length === 0 ? (
          <div className="text-center py-20">
            <Filter className="w-8 h-8 mx-auto mb-3" style={{ color: '#0F1D2C20' }} />
            <p className="text-sm" style={{ color: '#0F1D2C50' }}>
              {searchQuery ? 'No consultations match your search' : 'No consultations yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredConsultations.map(c => (
              <ConsultationRow
                key={c.id}
                consultation={c}
                isSelected={selectedId === c.id}
                onSelect={() => setSelectedId(selectedId === c.id ? null : c.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail Drawer */}
      <AnimatePresence>
        {selectedConsultation && (
          <ConsultationDetailDrawer
            consultation={selectedConsultation}
            onClose={() => setSelectedId(null)}
            onMutate={() => { mutate(); globalMutate('/api/mastermind/sessions'); }}
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

// ── FUNNEL STEP ──

function FunnelStep({ label, value, rate, color }: { label: string; value: number; rate?: number; color?: string }) {
  return (
    <div className="flex items-center gap-1.5 flex-shrink-0">
      <span className="text-sm font-bold" style={{ color: color || '#0F1D2C' }}>{value}</span>
      <div className="flex flex-col">
        <span className="text-[10px] leading-tight font-medium" style={{ color: '#0F1D2C80' }}>{label}</span>
        {rate !== undefined && (
          <span className="text-[9px] leading-tight" style={{ color: color || '#0F1D2C50' }}>{rate}%</span>
        )}
      </div>
    </div>
  );
}

// ── CONSULTATION ROW ──

function ConsultationRow({
  consultation: c,
  isSelected,
  onSelect,
}: {
  consultation: UnifiedConsultation;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const statusConfig = CLINIC_STATUS_CONFIG[c.clinicStatus];
  const StatusIcon = statusConfig.icon;
  const sourceConfig = SOURCE_CONFIG[c.source];
  const SourceIcon = sourceConfig.icon;

  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full text-left rounded-xl p-4 transition-all hover:shadow-md group"
      style={{
        backgroundColor: '#fff',
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
              {c.patientName || 'Unknown Patient'}
            </span>
            <span
              className="text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0"
              style={{ backgroundColor: statusConfig.bg, color: statusConfig.color }}
            >
              {statusConfig.label}
            </span>
            {/* Source badge */}
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 flex items-center gap-0.5"
              style={{ backgroundColor: sourceConfig.bg, color: sourceConfig.color }}
            >
              <SourceIcon className="w-2.5 h-2.5" />
              {sourceConfig.label}
            </span>
            {c.hasPlan && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0"
                style={{ backgroundColor: 'rgba(5,150,105,0.1)', color: '#059669' }}
              >
                Plan Ready
              </span>
            )}
            {c.hasShareLink && (
              <Link2 className="w-3 h-3 flex-shrink-0" style={{ color: '#C9A96E' }} />
            )}
          </div>

          {/* Contact + time */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs" style={{ color: '#0F1D2C60' }}>
            {c.phone && (
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3" /> {c.phone}
              </span>
            )}
            {c.email && (
              <span className="flex items-center gap-1 truncate max-w-[200px]">
                <Mail className="w-3 h-3" /> {c.email}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> {formatDate(c.createdAt)}
            </span>
          </div>

          {/* Concerns */}
          {c.concerns.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {c.concerns.slice(0, 3).map(concern => (
                <span
                  key={concern}
                  className="text-[10px] px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: '#0F1D2C06', color: '#0F1D2C60' }}
                >
                  {formatConcern(concern)}
                </span>
              ))}
              {c.concerns.length > 3 && (
                <span className="text-[10px] px-1" style={{ color: '#0F1D2C40' }}>
                  +{c.concerns.length - 3}
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
  consultation: c,
  onClose,
  onMutate,
}: {
  consultation: UnifiedConsultation;
  onClose: () => void;
  onMutate: () => void;
}) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [sendingPlan, setSendingPlan] = useState(false);
  const [planSent, setPlanSent] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState('');

  const isMastermind = c.source === 'mastermind';
  const sourceConfig = SOURCE_CONFIG[c.source];

  const handleStatusChange = useCallback(async (status: ClinicStatus) => {
    if (!isMastermind || !c.sessionId) return;
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/mastermind/sessions/${c.sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: { type: 'SET_CLINIC_STATUS', status } }),
      });
      if (res.ok) onMutate();
    } catch (err) {
      console.error('[Consultations] Status update failed:', err);
    } finally {
      setUpdatingStatus(false);
    }
  }, [isMastermind, c.sessionId, onMutate]);

  const handleSaveNotes = useCallback(async () => {
    if (!notesDraft.trim() || !isMastermind || !c.sessionId) return;
    try {
      const res = await fetch(`/api/mastermind/sessions/${c.sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: { type: 'SET_CLINIC_NOTES', notes: notesDraft.trim() } }),
      });
      if (res.ok) onMutate();
    } catch (err) {
      console.error('[Consultations] Notes save failed:', err);
    }
    setShowNotes(false);
  }, [notesDraft, isMastermind, c.sessionId, onMutate]);

  const handleGenerateShareLink = useCallback(async () => {
    if (!isMastermind || !c.sessionId) return;
    setGeneratingLink(true);
    try {
      const res = await fetch('/api/mastermind/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: c.sessionId }),
      });
      const data = await res.json();
      if (data.success && data.token) {
        await fetch(`/api/mastermind/sessions/${c.sessionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: { type: 'SET_SHARE_TOKEN', token: data.token } }),
        });
        onMutate();
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
  }, [isMastermind, c.sessionId, onMutate]);

  const handleCopyShareLink = useCallback(async () => {
    if (!c.shareToken) return;
    const url = `https://ranibeautyclinic.com/my-plan/${c.shareToken}`;
    await navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }, [c.shareToken]);

  const handleSendPlan = useCallback(async () => {
    if (!isMastermind || !c.sessionId || !c.email) return;
    setSendingPlan(true);
    try {
      const res = await fetch('/api/mastermind/plan-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: c.sessionId }),
      });
      const data = await res.json();
      if (data.success) {
        setPlanSent(true);
        onMutate();
        setTimeout(() => setPlanSent(false), 3000);
      } else {
        console.error('[Consultations] Send plan failed:', data.error);
      }
    } catch (err) {
      console.error('[Consultations] Send plan error:', err);
    } finally {
      setSendingPlan(false);
    }
  }, [isMastermind, c.sessionId, c.email, onMutate]);

  return (
    <DrawerShell onClose={onClose}>
      {/* Patient Header */}
      <div className="px-6 pt-5 pb-4 border-b" style={{ borderColor: '#0F1D2C08' }}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2
                className="text-lg font-bold"
                style={{ fontFamily: 'var(--font-heading), Playfair Display, serif', color: '#0F1D2C' }}
              >
                {c.patientName || 'Unknown Patient'}
              </h2>
              <span
                className="text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1"
                style={{ backgroundColor: sourceConfig.bg, color: sourceConfig.color }}
              >
                <sourceConfig.icon className="w-2.5 h-2.5" />
                {sourceConfig.label}
              </span>
            </div>
            <p className="text-xs" style={{ color: '#0F1D2C50' }}>
              Submitted {formatFullDate(c.createdAt)} &middot; {c.id}
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-black/5">
            <X className="w-5 h-5" style={{ color: '#0F1D2C40' }} />
          </button>
        </div>

        {/* Contact actions */}
        <div className="flex flex-wrap gap-2 mb-3">
          {c.phone && (
            <a
              href={`tel:${c.phone.replace(/\D/g, '')}`}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors hover:opacity-80"
              style={{ backgroundColor: '#059669', color: '#fff' }}
            >
              <Phone className="w-3.5 h-3.5" />
              Call
            </a>
          )}
          {c.email && (
            <a
              href={`mailto:${c.email}`}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors hover:opacity-80"
              style={{ backgroundColor: '#3B82F6', color: '#fff' }}
            >
              <Mail className="w-3.5 h-3.5" />
              Email
            </a>
          )}
          {c.hasShareLink ? (
            <button
              type="button"
              onClick={handleCopyShareLink}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors hover:opacity-80"
              style={{ backgroundColor: '#C9A96E', color: '#fff' }}
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedLink ? 'Copied!' : 'Copy Plan Link'}
            </button>
          ) : (isMastermind && c.hasPlan) ? (
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
          {c.hasShareLink && (
            <a
              href={`/my-plan/${c.shareToken}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors hover:opacity-80"
              style={{ backgroundColor: '#0F1D2C08', color: '#0F1D2C80' }}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View Plan
            </a>
          )}
          {/* Send/Resend plan email */}
          {isMastermind && (c.hasPlan || c.hasShareLink) && c.email && (
            <button
              type="button"
              onClick={handleSendPlan}
              disabled={sendingPlan}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors hover:opacity-80 disabled:opacity-50"
              style={{ backgroundColor: planSent ? '#059669' : '#6366F1', color: '#fff' }}
            >
              {sendingPlan ? (
                <div className="w-3.5 h-3.5 border border-white border-t-transparent rounded-full animate-spin" />
              ) : planSent ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              {planSent ? 'Sent!' : c.hasShareLink ? 'Resend Plan' : 'Send Plan'}
            </button>
          )}
        </div>

        {/* Status selector — only editable for mastermind sessions */}
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider mb-1.5" style={{ color: '#0F1D2C40' }}>
            Follow-up Status {!isMastermind && <span className="normal-case">(auto-detected)</span>}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {ALL_STATUSES.map(st => {
              const cfg = CLINIC_STATUS_CONFIG[st];
              const isActive = c.clinicStatus === st;
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => isMastermind && handleStatusChange(st)}
                  disabled={updatingStatus || !isMastermind}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all disabled:opacity-50"
                  style={{
                    backgroundColor: isActive ? cfg.bg : 'transparent',
                    color: isActive ? cfg.color : '#0F1D2C40',
                    border: isActive ? `1px solid ${cfg.color}30` : '1px solid #0F1D2C10',
                    cursor: isMastermind ? 'pointer' : 'default',
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
        {/* Aura Score (mastermind only) */}
        {c.auraScore != null && (
          <DetailSection title="Aura Score">
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-xl flex flex-col items-center justify-center"
                style={{ backgroundColor: 'rgba(201,169,110,0.1)' }}
              >
                <span className="text-lg font-bold" style={{ color: '#C9A96E' }}>
                  {c.auraScore}
                </span>
                {c.auraGrade && (
                  <span className="text-[9px] font-medium" style={{ color: '#C9A96E80' }}>
                    {c.auraGrade}
                  </span>
                )}
              </div>
            </div>
          </DetailSection>
        )}

        {/* Concerns */}
        {c.concerns.length > 0 && (
          <DetailSection title="Primary Concerns">
            <div className="flex flex-wrap gap-1.5">
              {c.concerns.map(concern => (
                <span
                  key={concern}
                  className="text-xs px-2.5 py-1 rounded-lg"
                  style={{ backgroundColor: '#0F1D2C06', color: '#0F1D2C80' }}
                >
                  {formatConcern(concern)}
                </span>
              ))}
            </div>
          </DetailSection>
        )}

        {/* Goals & Preferences */}
        {(c.goals || c.timeline || c.budget) && (
          <DetailSection title="Goals & Preferences">
            <div className="space-y-2 text-xs" style={{ color: '#0F1D2C80' }}>
              {c.goals && (
                <div>
                  <span className="font-medium" style={{ color: '#0F1D2C' }}>Goals:</span>{' '}
                  {c.goals}
                </div>
              )}
              <div className="flex gap-4">
                {c.timeline && (
                  <div>
                    <span className="font-medium" style={{ color: '#0F1D2C' }}>Timeline:</span>{' '}
                    {formatConcern(c.timeline)}
                  </div>
                )}
                {c.budget && (
                  <div>
                    <span className="font-medium" style={{ color: '#0F1D2C' }}>Budget:</span>{' '}
                    {formatConcern(c.budget)}
                  </div>
                )}
              </div>
            </div>
          </DetailSection>
        )}

        {/* AI Insights (for intake records processed by n8n) */}
        {c.source === 'intake_form' && (c.aiPlan || c.aiNextStep) && (
          <DetailSection title="AI Insights">
            <div className="space-y-2.5">
              {c.aiNextStep && (
                <div className="flex items-start gap-2 text-xs p-3 rounded-lg" style={{ backgroundColor: 'rgba(99,102,241,0.06)' }}>
                  <Bot className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: '#6366F1' }} />
                  <div>
                    <p className="font-medium mb-0.5" style={{ color: '#0F1D2C' }}>Suggested Next Step</p>
                    <p style={{ color: '#0F1D2C80' }}>{c.aiNextStep}</p>
                  </div>
                </div>
              )}
              {c.aiPlan && (
                <div className="text-xs p-3 rounded-lg" style={{ backgroundColor: '#0F1D2C04', color: '#0F1D2C80' }}>
                  <p className="font-medium mb-1" style={{ color: '#0F1D2C' }}>AI Program Plan</p>
                  <p className="leading-relaxed whitespace-pre-wrap">{c.aiPlan}</p>
                </div>
              )}
              {c.treatmentValue && (
                <div className="flex items-center gap-2 text-xs">
                  <span style={{ color: '#0F1D2C50' }}>Estimated Treatment Value:</span>
                  <span className="font-bold" style={{ color: '#059669' }}>{c.treatmentValue}</span>
                </div>
              )}
            </div>
          </DetailSection>
        )}

        {/* Intake Summary */}
        {c.intakeSummary && (
          <DetailSection title={c.source === 'intake_form' ? 'Intake Summary' : 'Provider Summary'}>
            <p className="text-xs leading-relaxed whitespace-pre-wrap p-3 rounded-lg" style={{ backgroundColor: '#0F1D2C04', color: '#0F1D2C80' }}>
              {c.intakeSummary}
            </p>
          </DetailSection>
        )}

        {/* Pipeline Phase (mastermind only) */}
        {c.pipelinePhase && isMastermind && (
          <DetailSection title="Pipeline Status">
            <div className="flex items-center gap-2 text-xs">
              <span
                className="px-2.5 py-1 rounded-lg font-medium"
                style={{ backgroundColor: '#0F1D2C08', color: '#0F1D2C' }}
              >
                {PHASE_LABELS[c.pipelinePhase as MastermindPhase] || c.pipelinePhase}
              </span>
              {c.selectedPackage && (
                <span style={{ color: '#0F1D2C50' }}>
                  &middot; Selected: {c.selectedPackage}
                </span>
              )}
            </div>
          </DetailSection>
        )}

        {/* Activity Timeline */}
        {c.activityLog.length > 0 && (
          <DetailSection title="Activity Timeline">
            <ActivityTimeline entries={c.activityLog} />
          </DetailSection>
        )}

        {/* Staff Notes (mastermind only) */}
        {isMastermind && (
          <DetailSection title="Staff Notes">
            {c.sessionId && (() => {
              // Notes are stored on the session, but we don't have them in UnifiedConsultation
              // For now, show add/edit UI that dispatches to the session
              return showNotes ? (
                <div>
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
                  onClick={() => { setNotesDraft(''); setShowNotes(true); }}
                  className="text-xs font-medium"
                  style={{ color: '#C9A96E' }}
                >
                  + Add notes
                </button>
              );
            })()}
          </DetailSection>
        )}

        {/* Actions */}
        <DetailSection title="Actions">
          <div className="space-y-1.5">
            {isMastermind && c.sessionId && (
              <ActionLink
                href={`/dashboard/mastermind/${c.sessionId}`}
                icon={FileText}
                label="Open in Mastermind Editor"
                sublabel="Full session editor with all phases"
              />
            )}
            {isMastermind && c.sessionId && c.pipelinePhase && ['approved', 'simulation_ready', 'presenting'].includes(c.pipelinePhase) && (
              <ActionLink
                href={`/dashboard/mastermind/${c.sessionId}/present`}
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

// ── ACTIVITY TIMELINE ──

const TIMELINE_ICONS: Record<string, { icon: typeof Clock; color: string }> = {
  submitted: { icon: FormInput, color: '#3B82F6' },
  scan_completed: { icon: Zap, color: '#C9A96E' },
  plan_generated: { icon: FileText, color: '#059669' },
  status_changed: { icon: Eye, color: '#8B5CF6' },
  note_updated: { icon: MessageSquare, color: '#D97706' },
  share_link_generated: { icon: Link2, color: '#C9A96E' },
  completed: { icon: Check, color: '#059669' },
  ai_processed: { icon: Bot, color: '#6366F1' },
  auto_responded: { icon: Mail, color: '#059669' },
  plan_sent: { icon: Send, color: '#6366F1' },
  booking_synced: { icon: CalendarCheck, color: '#059669' },
};

function ActivityTimeline({ entries }: { entries: ActivityLogEntry[] }) {
  // Show newest first
  const sorted = [...entries].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="relative">
      {/* Vertical line */}
      <div
        className="absolute left-[11px] top-2 bottom-2 w-px"
        style={{ backgroundColor: '#0F1D2C10' }}
      />
      <div className="space-y-3">
        {sorted.map((entry, i) => {
          const cfg = TIMELINE_ICONS[entry.action] || { icon: Activity, color: '#6B7280' };
          const EntryIcon = cfg.icon;
          return (
            <div key={`${entry.timestamp}-${i}`} className="flex items-start gap-3 relative">
              <div
                className="w-[23px] h-[23px] rounded-full flex items-center justify-center flex-shrink-0 z-10"
                style={{ backgroundColor: `${cfg.color}15`, border: `2px solid #FAFAF8` }}
              >
                <EntryIcon className="w-2.5 h-2.5" style={{ color: cfg.color }} />
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <p className="text-xs leading-snug" style={{ color: '#0F1D2C' }}>
                  {entry.detail}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px]" style={{ color: '#0F1D2C40' }}>
                    {formatTimelineTime(entry.timestamp)}
                  </span>
                  {entry.actor && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#0F1D2C06', color: '#0F1D2C50' }}>
                      {entry.actor}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
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

// ── ACTION LINK ──

function ActionLink({
  href, icon: Icon, label, sublabel, external,
}: {
  href: string; icon: typeof FileText; label: string; sublabel: string; external?: boolean;
}) {
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
