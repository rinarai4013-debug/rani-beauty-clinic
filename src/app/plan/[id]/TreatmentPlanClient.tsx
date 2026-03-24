'use client';

import { useEffect, useState, useMemo } from 'react';
import { trackAnalyticsEvent } from '@/lib/analytics/events';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';

const PhotoSimulationEmbed = dynamic(
  () => import('@/components/photo-simulation/PhotoSimulationEmbed'),
  { ssr: false, loading: () => null }
);
import {
  Sparkles,
  Star,
  CheckCircle2,
  Clock,
  Shield,
  Heart,
  TrendingUp,
  Calendar,
  Phone,
  MapPin,
  Mail,
  ChevronRight,
  Award,
  Zap,
  Target,
  ArrowRight,
  CreditCard,
  Gift,
  User,
  Activity,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   AI Parsing Engine (extracted for testability)
   ═══════════════════════════════════════════════════════════════ */

import {
  SERVICE_CATALOG,
  matchService,
  parseCostBreakdown,
  parseProgramPlan,
  parseTimeline,
  extractTotalValue,
  buildPackagesFromAI,
  buildFallbackPackages,
} from '@/lib/treatment-plan/parser';

import type {
  PlanData,
  ParsedTreatment,
  ParsedPhase,
  LineItem,
  TreatmentPackage,
} from '@/lib/treatment-plan/parser';

/* ═══════════════════════════════════════════════════════════════
   Animation variants
   ═══════════════════════════════════════════════════════════════ */

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay, ease: 'easeOut' as const },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (delay: number) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, delay, ease: 'easeOut' as const },
  }),
};

/* AI parsing functions (SERVICE_CATALOG, matchService, parseCostBreakdown,
   parseProgramPlan, parseTimeline, extractTotalValue, buildPackagesFromAI,
   buildFallbackPackages) are now in @/lib/treatment-plan/parser.ts */


/* ═══════════════════════════════════════════════════════════════
   Roadmap Builder (AI-Parsed)
   ═══════════════════════════════════════════════════════════════ */

interface Appointment {
  number: number;
  weekLabel: string;
  date: string;
  dayOfWeek: string;
  time: string;
  treatments: string[];
  duration: string;
  notes?: string;
}

interface Phase {
  phase: number;
  title: string;
  duration: string;
  description: string;
  icon: typeof Sparkles;
  appointments: Appointment[];
}

function getNextClinicDate(startDate: Date, weekOffset: number, preferredDay: number): Date {
  const d = new Date(startDate);
  d.setDate(d.getDate() + weekOffset * 7);
  const currentDay = d.getDay();
  let diff = preferredDay - currentDay;
  if (diff < 0) diff += 7;
  d.setDate(d.getDate() + diff);
  if (d.getDay() === 0) d.setDate(d.getDate() + 1);
  return d;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function buildRoadmapFromAI(plan: PlanData): Phase[] {
  const { phases: parsedPhases } = parseProgramPlan(plan.programPlan);
  const timelineEntries = parseTimeline(plan.timeline);

  const startDate = new Date();
  if (startDate.getDay() === 0) startDate.setDate(startDate.getDate() + 1);
  if (startDate.getDay() === 6) startDate.setDate(startDate.getDate() + 2);

  const times = ['10:00 AM', '11:30 AM', '1:00 PM', '2:30 PM', '4:00 PM'];
  const preferredDays = [2, 3, 4, 2, 5, 3]; // Tue, Wed, Thu cycling
  const phaseIcons = [Target, Zap, TrendingUp, Star];

  let globalApptNum = 0;

  // If we have parsed phases from programPlan, use those
  if (parsedPhases.length > 0) {
    return parsedPhases.map((pp, phaseIdx) => {
      // Parse week range to get offset
      const weekMatch = pp.weekRange.match(/(\d+)/);
      const startWeek = weekMatch ? parseInt(weekMatch[1], 10) - 1 : phaseIdx * 4;

      // Build appointments for each treatment in this phase
      const appointments: Appointment[] = [];

      pp.treatments.forEach((treatment, tIdx) => {
        globalApptNum++;
        const weekOffset = startWeek + tIdx;
        const dayPref = preferredDays[(globalApptNum - 1) % preferredDays.length];
        const d = getNextClinicDate(startDate, weekOffset, dayPref);
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        // Estimate duration from matched service
        const match = matchService(treatment);
        const duration = match?.catalog.duration || '60 min';

        // Truncate verbose treatment descriptions to a clean name
        let treatmentName = treatment;
        // Remove leading "Phase X" references and narrative verbs
        treatmentName = treatmentName.replace(/^Phase\s*\d+\s*/i, '').trim();
        treatmentName = treatmentName.replace(/^(introduces|deploys|utilizes|begins|starts|initiates|applies|combines|features|includes|delivers|provides|targets)\s+/i, '').trim();
        // Remove verbose qualifiers
        treatmentName = treatmentName.replace(/\s+specifically\s+calibrated\s+for\s+/i, ' — ').trim();
        if (treatmentName.length > 80) {
          // Try to extract just the service name (first sentence or up to first comma/parenthesis)
          const shortMatch = treatmentName.match(/^([^,(]+)/);
          treatmentName = shortMatch ? shortMatch[1].trim() : treatmentName.substring(0, 80) + '...';
        }
        // Capitalize first letter
        if (treatmentName.length > 0) {
          treatmentName = treatmentName.charAt(0).toUpperCase() + treatmentName.slice(1);
        }

        appointments.push({
          number: globalApptNum,
          weekLabel: `Week ${weekOffset + 1}`,
          date: formatDate(d),
          dayOfWeek: dayNames[d.getDay()],
          time: times[(globalApptNum - 1) % times.length],
          treatments: [treatmentName],
          duration,
        });
      });

      return {
        phase: phaseIdx + 1,
        title: pp.title,
        duration: pp.weekRange,
        description: pp.description,
        icon: phaseIcons[phaseIdx % phaseIcons.length],
        appointments,
      };
    });
  }

  // If we have timeline entries, convert those to phases
  if (timelineEntries.length > 0) {
    // Group timeline entries into 3-4 phases
    const chunkSize = Math.ceil(timelineEntries.length / 3);
    const chunks = [
      timelineEntries.slice(0, chunkSize),
      timelineEntries.slice(chunkSize, chunkSize * 2),
      timelineEntries.slice(chunkSize * 2),
    ].filter(c => c.length > 0);

    const phaseNames = ['Foundation & Prep', 'Active Treatment', 'Enhancement & Results', 'Maintenance'];

    return chunks.map((chunk, i) => {
      const appointments: Appointment[] = chunk.map((entry) => {
        globalApptNum++;
        const weekMatch = entry.week.match(/(\d+)/);
        const weekOffset = weekMatch ? parseInt(weekMatch[1], 10) - 1 : globalApptNum * 2;
        const dayPref = preferredDays[(globalApptNum - 1) % preferredDays.length];
        const d = getNextClinicDate(startDate, weekOffset, dayPref);
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        return {
          number: globalApptNum,
          weekLabel: entry.week,
          date: formatDate(d),
          dayOfWeek: dayNames[d.getDay()],
          time: times[(globalApptNum - 1) % times.length],
          treatments: [entry.description],
          duration: '60 min',
        };
      });

      return {
        phase: i + 1,
        title: phaseNames[i] || `Phase ${i + 1}`,
        duration: chunk.length > 1 ? `${chunk[0].week} – ${chunk[chunk.length - 1].week}` : chunk[0].week,
        description: 'Targeted treatments designed for your specific goals.',
        icon: phaseIcons[i % phaseIcons.length],
        appointments,
      };
    });
  }

  // Final fallback — build from packages/treatments found
  const parsedTreatments = parseCostBreakdown(plan.costBreakdown);
  const treatmentNames = parsedTreatments.length > 0
    ? parsedTreatments.map(t => `${t.name}${t.sessions > 1 ? ` — Session 1 of ${t.sessions}` : ''}`)
    : ['Comprehensive Consultation + First Treatment'];

  return [
    {
      phase: 1,
      title: 'Assessment & First Treatment',
      duration: 'Week 1-2',
      description: 'Your comprehensive consultation and initial treatment session to establish your baseline and begin your transformation.',
      icon: Target,
      appointments: [{
        number: 1,
        weekLabel: 'Week 1',
        date: formatDate(getNextClinicDate(startDate, 0, 2)),
        dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][getNextClinicDate(startDate, 0, 2).getDay()],
        time: '10:00 AM',
        treatments: ['Comprehensive Consultation', treatmentNames[0] || 'Initial Assessment'],
        duration: '90 min',
      }],
    },
    {
      phase: 2,
      title: 'Active Treatment Phase',
      duration: 'Week 3-8',
      description: 'Your core treatment series targeting your primary concerns with advanced clinical protocols.',
      icon: Zap,
      appointments: treatmentNames.slice(0, 4).map((t, idx) => {
        globalApptNum = idx + 2;
        const d = getNextClinicDate(startDate, 2 + idx * 2, preferredDays[idx % preferredDays.length]);
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return {
          number: globalApptNum,
          weekLabel: `Week ${3 + idx * 2}`,
          date: formatDate(d),
          dayOfWeek: dayNames[d.getDay()],
          time: times[idx % times.length],
          treatments: [t],
          duration: matchService(t)?.catalog.duration || '60 min',
        };
      }),
    },
    {
      phase: 3,
      title: 'Enhancement & Results',
      duration: 'Week 9-14',
      description: 'Advanced treatments to enhance and build on your initial results. Collagen remodeling reaches peak effect.',
      icon: TrendingUp,
      appointments: [{
        number: globalApptNum + 1,
        weekLabel: 'Week 10',
        date: formatDate(getNextClinicDate(startDate, 10, 3)),
        dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][getNextClinicDate(startDate, 10, 3).getDay()],
        time: '2:30 PM',
        treatments: ['Follow-up assessment + Enhancement session'],
        duration: '75 min',
      }],
    },
    {
      phase: 4,
      title: 'Maintenance & Longevity',
      duration: 'Ongoing',
      description: 'Monthly maintenance to sustain and protect your results. Your treatment coordinator will customize each visit.',
      icon: Star,
      appointments: [{
        number: globalApptNum + 2,
        weekLabel: 'Monthly',
        date: formatDate(getNextClinicDate(startDate, 18, 3)),
        dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][getNextClinicDate(startDate, 18, 3).getDay()],
        time: '11:30 AM',
        treatments: ['Monthly maintenance session + Progress evaluation'],
        duration: '60 min',
        notes: 'Enroll in Glow Membership for best value',
      }],
    },
  ];
}

/* ═══════════════════════════════════════════════════════════════
   Shimmer / Skeleton Component
   ═══════════════════════════════════════════════════════════════ */

function Shimmer({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-shimmer rounded bg-gradient-to-r from-transparent via-white/20 to-transparent bg-[length:200%_100%] ${className}`}
      style={{ backgroundSize: '200% 100%' }}
    />
  );
}

function LoadingSkeleton({ label }: { label: string }) {
  return (
    <div className="space-y-3">
      <p className="text-sm uppercase tracking-widest text-[#C9A96E] font-semibold">{label}</p>
      <Shimmer className="h-4 w-full bg-[#0F1D2C]/10" />
      <Shimmer className="h-4 w-3/4 bg-[#0F1D2C]/10" />
      <Shimmer className="h-4 w-5/6 bg-[#0F1D2C]/10" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Score Ring Component
   ═══════════════════════════════════════════════════════════════ */

function ScoreRing({
  score,
  maxScore = 100,
  label,
  color,
  size = 140,
}: {
  score: number;
  maxScore?: number;
  label: string;
  color: string;
  size?: number;
}) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / maxScore) * circumference;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(201,169,110,0.15)"
            strokeWidth="8"
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            whileInView={{ strokeDashoffset: circumference - progress }}
            viewport={{ once: true }}
            transition={{ duration: 1.5, delay: 0.3, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-heading text-3xl font-bold text-[#0F1D2C]">
            {score}
          </span>
        </div>
      </div>
      <span className="text-xs font-semibold uppercase tracking-widest text-[#0F1D2C]/60">
        {label}
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Section Divider
   ═══════════════════════════════════════════════════════════════ */

function SectionDivider() {
  return (
    <div className="flex items-center justify-center py-8 print:py-4">
      <div className="h-px w-16 bg-gradient-to-r from-transparent to-[#C9A96E]/40" />
      <div className="mx-4 h-1.5 w-1.5 rotate-45 bg-[#C9A96E]" />
      <div className="h-px w-16 bg-gradient-to-l from-transparent to-[#C9A96E]/40" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   AI Plan Summary — Structured display of program plan
   ═══════════════════════════════════════════════════════════════ */

function PlanSummary({ plan }: { plan: PlanData }) {
  const { phases, highlights } = useMemo(() => parseProgramPlan(plan.programPlan), [plan.programPlan]);
  const totalValue = extractTotalValue(plan);
  const parsedTreatments = useMemo(() => parseCostBreakdown(plan.costBreakdown), [plan.costBreakdown]);
  const totalSessions = parsedTreatments.reduce((s, t) => s + t.sessions, 0);

  if (!plan.programPlan) {
    return <LoadingSkeleton label="Building Your Treatment Plan..." />;
  }

  return (
    <div className="space-y-6">
      {/* Plan highlights / overview */}
      {highlights.length > 0 && (
        <div className="space-y-3">
          {highlights.map((h, i) => (
            <p key={i} className="text-[#0F1D2C]/80 leading-relaxed text-base md:text-lg">
              {h}
            </p>
          ))}
        </div>
      )}

      {/* If no highlights, show a brief structured summary */}
      {highlights.length === 0 && phases.length > 0 && (
        <p className="text-[#0F1D2C]/80 leading-relaxed text-base md:text-lg">
          Your personalized program includes {phases.length} phases designed to address your specific concerns
          {parsedTreatments.length > 0 && ` with ${parsedTreatments.length} targeted treatments`}. Each phase builds
          on the results of the previous one for optimal outcomes.
        </p>
      )}

      {/* Phase summary pills */}
      {phases.length > 1 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {phases.map((p, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-[#F8F6F1] border border-[#C9A96E]/10">
              <div className="w-7 h-7 rounded-lg bg-[#C9A96E]/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-[#C9A96E]">{i + 1}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#0F1D2C]">{p.title}</p>
                <p className="text-xs text-[#0F1D2C]/50">{p.weekRange}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Key metrics row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-[#C9A96E]/10">
        <div className="text-center p-4 rounded-xl bg-[#F8F6F1]">
          <p className="font-heading text-2xl text-[#0F1D2C]">
            {totalValue > 0 ? `$${totalValue.toLocaleString()}` : '—'}
          </p>
          <p className="text-[10px] uppercase tracking-widest text-[#0F1D2C]/40 mt-1">Plan Value</p>
        </div>
        <div className="text-center p-4 rounded-xl bg-[#F8F6F1]">
          <p className="font-heading text-2xl text-[#0F1D2C]">
            {totalSessions > 0 ? totalSessions : parsedTreatments.length > 0 ? parsedTreatments.length : '—'}
          </p>
          <p className="text-[10px] uppercase tracking-widest text-[#0F1D2C]/40 mt-1">Sessions</p>
        </div>
        <div className="text-center p-4 rounded-xl bg-[#F8F6F1]">
          <p className="font-heading text-2xl text-[#0F1D2C]">
            {phases.length > 0 ? `${phases.length}` : '3-4'}
          </p>
          <p className="text-[10px] uppercase tracking-widest text-[#0F1D2C]/40 mt-1">Phases</p>
        </div>
        <div className="text-center p-4 rounded-xl bg-[#F8F6F1]">
          <p className="font-heading text-2xl text-[#C9A96E]">90%+</p>
          <p className="text-[10px] uppercase tracking-widest text-[#0F1D2C]/40 mt-1">Confidence</p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════════════ */

export default function TreatmentPlanClient({ planId }: { planId: string }) {
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requiresCode, setRequiresCode] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [isExpired, setIsExpired] = useState(false);
  const [expiredMessage, setExpiredMessage] = useState('');

  const trackEvent = (action: string, tier?: string, value?: number) => {
    fetch(`/api/plan/${planId}/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, tier, timestamp: new Date().toISOString() }),
    }).catch(() => {});

    const eventMap: Record<string, Parameters<typeof trackAnalyticsEvent>[0]> = {
      viewed: 'plan_viewed',
      selected_tier: 'plan_tier_selected',
      financing_click: 'plan_financing_clicked',
      financing_apply: 'plan_financing_clicked',
    };
    const analyticsEvent = eventMap[action];
    if (analyticsEvent) {
      trackAnalyticsEvent(analyticsEvent, { planId, tier, value });
    }
  };

  const fetchPlanWithCode = async (code?: string) => {
    setLoading(true);
    setCodeError('');
    try {
      const codeParam = code || accessCode;
      const url = codeParam
        ? `/api/plan/${planId}?code=${encodeURIComponent(codeParam)}`
        : `/api/plan/${planId}`;
      const res = await fetch(url);
      const data = await res.json();

      if (res.status === 403 && data.error === 'ACCESS_CODE_REQUIRED') {
        setRequiresCode(true);
        setLoading(false);
        // Check URL for code param (from email link)
        const urlCode = new URLSearchParams(window.location.search).get('code');
        if (urlCode && !code) {
          setAccessCode(urlCode);
          fetchPlanWithCode(urlCode);
          return;
        }
        return;
      }

      if (res.status === 410 && data.error === 'PLAN_EXPIRED') {
        setIsExpired(true);
        setExpiredMessage(data.message || 'This treatment plan has expired.');
        setLoading(false);
        return;
      }

      if (!res.ok) {
        if (res.status === 403) {
          setCodeError('Invalid access code. Please check and try again.');
          setLoading(false);
          return;
        }
        throw new Error(data.error || 'Failed to load plan');
      }

      setPlan(data.plan);
      setRequiresCode(false);
      trackEvent('viewed');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlanWithCode();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId]);

  const packages = useMemo(() => (plan ? buildPackagesFromAI(plan) : []), [plan]);
  const roadmap = useMemo(() => (plan ? buildRoadmapFromAI(plan) : []), [plan]);

  // ─── Loading State ───
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F6F1] flex items-center justify-center">
        <div className="text-center space-y-6">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="mx-auto w-12 h-12 border-2 border-[#C9A96E] border-t-transparent rounded-full"
          />
          <div>
            <p className="font-heading text-xl text-[#0F1D2C]">Preparing Your Plan</p>
            <p className="text-sm text-[#0F1D2C]/50 mt-1">Crafting your personalized treatment roadmap...</p>
          </div>
        </div>
      </div>
    );
  }

  // ─── Access Code Gate ───
  if (requiresCode) {
    return (
      <div className="min-h-screen bg-[#F8F6F1] flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center space-y-6"
        >
          <div className="mx-auto w-16 h-16 rounded-full bg-[#C9A96E]/10 flex items-center justify-center">
            <Shield className="w-8 h-8 text-[#C9A96E]" />
          </div>
          <h1 className="font-heading text-2xl text-[#0F1D2C]">Enter Your Access Code</h1>
          <p className="text-[#0F1D2C]/60 text-sm leading-relaxed">
            Your treatment plan is protected. Enter the 6-digit code from your email or text message.
          </p>
          <div className="space-y-3">
            <input
              type="text"
              maxLength={6}
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyDown={(e) => { if (e.key === 'Enter' && accessCode.length === 6) fetchPlanWithCode(); }}
              placeholder="000000"
              className="w-full text-center text-2xl tracking-[0.5em] font-mono px-4 py-4 border-2 border-[#C9A96E]/30 rounded-xl bg-white focus:border-[#C9A96E] focus:ring-2 focus:ring-[#C9A96E]/20 outline-none transition-colors text-[#0F1D2C]"
            />
            {codeError && (
              <p className="text-red-500 text-sm">{codeError}</p>
            )}
            <button
              onClick={() => fetchPlanWithCode()}
              disabled={accessCode.length !== 6 || loading}
              className="w-full px-6 py-3 bg-[#0F1D2C] text-white rounded-xl font-semibold tracking-wide hover:bg-[#1A2A3C] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'View My Plan'}
            </button>
          </div>
          <p className="text-[#0F1D2C]/40 text-xs">
            Didn&apos;t receive a code? Call us at{' '}
            <a href="tel:+14255394440" className="text-[#C9A96E] hover:underline">(425) 539-4440</a>
          </p>
        </motion.div>
      </div>
    );
  }

  // ─── Expired State ───
  if (isExpired) {
    return (
      <div className="min-h-screen bg-[#F8F6F1] flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md text-center space-y-6"
        >
          <div className="mx-auto w-16 h-16 rounded-full bg-[#0F1D2C]/5 flex items-center justify-center">
            <Clock className="w-8 h-8 text-[#0F1D2C]/40" />
          </div>
          <h1 className="font-heading text-2xl text-[#0F1D2C]">Plan Expired</h1>
          <p className="text-[#0F1D2C]/60 text-sm leading-relaxed">
            {expiredMessage || 'This treatment plan link has expired for your security. Contact us to receive a refreshed plan.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="tel:+14255394440"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#0F1D2C] text-white rounded-lg text-sm font-semibold tracking-wide hover:bg-[#1A2A3C] transition-colors"
            >
              <Phone className="w-4 h-4" />
              Call (425) 539-4440
            </a>
            <a
              href="https://booking.mangomint.com/ranibeautyclinic1"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-[#C9A96E]/30 text-[#0F1D2C] rounded-lg text-sm font-semibold hover:border-[#C9A96E] transition-colors"
            >
              Book New Consultation
            </a>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── Error State ───
  if (error || !plan) {
    return (
      <div className="min-h-screen bg-[#F8F6F1] flex items-center justify-center px-6">
        <div className="max-w-md text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-[#0F1D2C]/5 flex items-center justify-center">
            <Shield className="w-8 h-8 text-[#0F1D2C]/40" />
          </div>
          <h1 className="font-heading text-2xl text-[#0F1D2C]">Plan Not Found</h1>
          <p className="text-[#0F1D2C]/60 text-sm leading-relaxed">
            {error || 'We could not locate this treatment plan. Please check your link or contact us for assistance.'}
          </p>
          <a
            href="tel:+14255394440"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#0F1D2C] text-white rounded-lg text-sm font-semibold tracking-wide hover:bg-[#1A2A3C] transition-colors"
          >
            <Phone className="w-4 h-4" />
            Call Us: (425) 539-4440
          </a>
        </div>
      </div>
    );
  }

  const currentScore = plan.skinHealthScore ?? 62;
  const projectedScore = plan.projectedScore ?? 89;
  const mangomintBookingUrl = 'https://booking.mangomint.com/ranibeautyclinic1';
  const cherryFinancingUrl = 'https://patient.withcherry.com/apply/rani-beauty-clinic';
  const patientfiUrl = 'https://app.patientfi.com/v2/rani-beauty-clinic/apply';

  return (
    <>
      {/* ─── Print Styles ─── */}
      <style jsx global>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          nav, footer, .no-print, .mobile-cta { display: none !important; }
          .print-break { page-break-before: always; }
          .print-avoid-break { page-break-inside: avoid; }
          * { animation: none !important; transition: none !important; }
        }
      `}</style>

      <div className="min-h-screen bg-[#F8F6F1] font-body text-[#0F1D2C]">
        {/* ═══════════════════════════════════════════════════════════
           HERO SECTION
           ═══════════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden bg-[#0F1D2C] text-white">
          <div className="absolute inset-0 opacity-[0.03]">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 25% 25%, #C9A96E 1px, transparent 1px), radial-gradient(circle at 75% 75%, #C9A96E 1px, transparent 1px)',
                backgroundSize: '60px 60px',
              }}
            />
          </div>

          <div className="h-1 bg-gradient-to-r from-[#C9A96E]/0 via-[#C9A96E] to-[#C9A96E]/0" />

          <div className="relative max-w-4xl mx-auto px-6 py-16 md:py-24 text-center">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0}
              className="mb-8"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#C9A96E]">
                Rani Beauty Clinic
              </p>
              <div className="mt-2 mx-auto w-12 h-px bg-[#C9A96E]/40" />
            </motion.div>

            <motion.h1
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0.15}
              className="font-heading text-3xl md:text-5xl lg:text-6xl leading-tight"
            >
              Your Personalized
              <br />
              <span className="text-[#C9A96E]">Treatment Roadmap</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0.3}
              className="mt-6 text-lg md:text-xl text-white/70 max-w-xl mx-auto leading-relaxed"
            >
              Prepared exclusively for{' '}
              <span className="text-[#C9A96E] font-semibold">{plan.clientName}</span>
            </motion.p>

            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0.4}
              className="mt-4 text-xs uppercase tracking-widest text-white/40"
            >
              Created {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </motion.p>
          </div>

          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 60" fill="none" className="w-full">
              <path d="M0 60V30C240 0 480 0 720 15C960 30 1200 30 1440 0V60H0Z" fill="#F8F6F1" />
            </svg>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
           SKIN HEALTH SCORE
           ═══════════════════════════════════════════════════════════ */}
        <section className="max-w-4xl mx-auto px-6 py-12 md:py-16 print-avoid-break">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
            className="text-center mb-10"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C9A96E] mb-3">
              Your Skin Health Assessment
            </p>
            <h2 className="font-heading text-2xl md:text-3xl text-[#0F1D2C]">
              Where You Are &mdash; Where You&apos;re Going
            </h2>
          </motion.div>

          <motion.div
            variants={scaleIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0.15}
            className="bg-white rounded-2xl shadow-sm border border-[#C9A96E]/10 p-8 md:p-12"
          >
            <div className="flex flex-col md:flex-row items-center justify-center gap-12 md:gap-20">
              <ScoreRing score={currentScore} label="Current Score" color="#0F1D2C" />
              <div className="hidden md:flex flex-col items-center gap-2">
                <ArrowRight className="w-8 h-8 text-[#C9A96E]" />
                <span className="text-[10px] uppercase tracking-widest text-[#C9A96E] font-semibold">
                  Your Journey
                </span>
              </div>
              <div className="flex md:hidden items-center gap-2 -my-2">
                <div className="h-8 w-px bg-[#C9A96E]/30" />
                <ChevronRight className="w-5 h-5 text-[#C9A96E]" />
                <div className="h-8 w-px bg-[#C9A96E]/30" />
              </div>
              <ScoreRing score={projectedScore} label="Projected Score" color="#C9A96E" />
            </div>

            <div className="mt-8 pt-6 border-t border-[#C9A96E]/10 text-center">
              <p className="text-sm text-[#0F1D2C]/60 leading-relaxed max-w-lg mx-auto">
                Based on your intake assessment, following our recommended plan could improve your overall
                skin health score by{' '}
                <span className="font-semibold text-[#C9A96E]">
                  {projectedScore - currentScore} points
                </span>{' '}
                within the first 90 days.
              </p>
            </div>
          </motion.div>
        </section>

        <SectionDivider />

        {/* ═══════════════════════════════════════════════════════════
           PHOTO SIMULATION — Projected Results Visualization
           ═══════════════════════════════════════════════════════════ */}
        <section className="max-w-4xl mx-auto px-6 py-12 md:py-16 print-avoid-break no-print">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
            className="text-center mb-10"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C9A96E] mb-3">
              Visualize Your Transformation
            </p>
            <h2 className="font-heading text-2xl md:text-3xl text-[#0F1D2C]">
              See Your Projected Results
            </h2>
            <p className="mt-3 text-sm text-[#0F1D2C]/50 max-w-lg mx-auto">
              Upload a photo to see an illustrative preview of how your recommended treatments could enhance your appearance.
            </p>
          </motion.div>

          <motion.div
            variants={scaleIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0.15}
            className="bg-white rounded-2xl shadow-sm border border-[#C9A96E]/10 p-6 md:p-10"
          >
            <PhotoSimulationEmbed
              treatmentInterests={plan.treatmentInterests}
              skinConcerns={plan.skinConcerns}
            />
          </motion.div>
        </section>

        <SectionDivider />

        {/* ═══════════════════════════════════════════════════════════
           WHAT WE FOUND
           ═══════════════════════════════════════════════════════════ */}
        <section className="max-w-4xl mx-auto px-6 py-12 print-avoid-break">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
            className="text-center mb-10"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C9A96E] mb-3">
              Clinical Insights
            </p>
            <h2 className="font-heading text-2xl md:text-3xl text-[#0F1D2C]">
              What We Found
            </h2>
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0.1}
            className="bg-white rounded-2xl shadow-sm border border-[#C9A96E]/10 p-8 md:p-10"
          >
            {plan.intakeSummary ? (
              <div className="space-y-6">
                <p className="text-[#0F1D2C]/80 leading-relaxed text-base md:text-lg">
                  {plan.intakeSummary}
                </p>

                {plan.skinConcerns.length > 0 && (
                  <div className="pt-4 border-t border-[#C9A96E]/10">
                    <p className="text-xs font-semibold uppercase tracking-widest text-[#0F1D2C]/40 mb-3">
                      Primary Concerns Identified
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {plan.skinConcerns.map((concern, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F8F6F1] rounded-full text-xs font-medium text-[#0F1D2C]/70 border border-[#C9A96E]/15"
                        >
                          <Activity className="w-3 h-3 text-[#C9A96E]" />
                          {concern}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[#C9A96E]/10">
                  {plan.skinType && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#C9A96E]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Sparkles className="w-4 h-4 text-[#C9A96E]" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-[#0F1D2C]/40">Skin Type</p>
                        <p className="text-sm text-[#0F1D2C]/70 mt-0.5">{plan.skinType}</p>
                      </div>
                    </div>
                  )}
                  {plan.treatmentHistory && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#C9A96E]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Clock className="w-4 h-4 text-[#C9A96E]" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-[#0F1D2C]/40">Treatment History</p>
                        <p className="text-sm text-[#0F1D2C]/70 mt-0.5">{plan.treatmentHistory}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <LoadingSkeleton label="Generating Your Analysis..." />
            )}
          </motion.div>
        </section>

        <SectionDivider />

        {/* ═══════════════════════════════════════════════════════════
           YOUR TREATMENT PLAN (AI Program Plan — PARSED)
           ═══════════════════════════════════════════════════════════ */}
        <section className="max-w-4xl mx-auto px-6 py-12 print-break print-avoid-break">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
            className="text-center mb-10"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C9A96E] mb-3">
              Your Custom Protocol
            </p>
            <h2 className="font-heading text-2xl md:text-3xl text-[#0F1D2C]">
              Your Treatment Plan
            </h2>
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0.1}
            className="bg-white rounded-2xl shadow-sm border border-[#C9A96E]/10 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-[#0F1D2C] to-[#1A2A3C] px-8 py-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#C9A96E]/20 flex items-center justify-center">
                  <Award className="w-5 h-5 text-[#C9A96E]" />
                </div>
                <div>
                  <h3 className="font-heading text-lg text-white">
                    Personalized Aesthetic Program
                  </h3>
                  <p className="text-xs text-white/50 mt-0.5">
                    Designed for {plan.firstName}&apos;s unique profile
                  </p>
                </div>
              </div>
            </div>

            <div className="p-8 md:p-10">
              <PlanSummary plan={plan} />
            </div>
          </motion.div>
        </section>

        <SectionDivider />

        {/* ═══════════════════════════════════════════════════════════
           TREATMENT ROADMAP — Appointment Schedule
           ═══════════════════════════════════════════════════════════ */}
        <section className="max-w-4xl mx-auto px-6 py-12 print-break print-avoid-break">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
            className="text-center mb-12"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C9A96E] mb-3">
              Your Appointment Schedule
            </p>
            <h2 className="font-heading text-2xl md:text-3xl text-[#0F1D2C]">
              Treatment Roadmap
            </h2>
            <p className="mt-3 text-sm text-[#0F1D2C]/50 max-w-lg mx-auto">
              Your personalized appointment schedule. Dates are suggested starting points — we&apos;ll confirm exact times when you book.
            </p>
          </motion.div>

          <div className="space-y-10">
            {roadmap.map((phase, i) => {
              const Icon = phase.icon;
              return (
                <motion.div
                  key={phase.phase}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  custom={i * 0.1}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-[#C9A96E]/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-[#C9A96E]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#C9A96E] bg-[#C9A96E]/10 px-2 py-0.5 rounded">
                          Phase {phase.phase}
                        </span>
                        <span className="text-[10px] uppercase tracking-widest text-[#0F1D2C]/40">
                          {phase.duration}
                        </span>
                      </div>
                      <h3 className="font-heading text-lg text-[#0F1D2C] mt-0.5">{phase.title}</h3>
                    </div>
                  </div>

                  <p className="text-sm text-[#0F1D2C]/55 leading-relaxed mb-4 ml-[52px]">
                    {phase.description}
                  </p>

                  <div className="space-y-3 ml-[52px]">
                    {phase.appointments.map((appt) => (
                      <div
                        key={appt.number}
                        className="bg-white rounded-xl border border-[#C9A96E]/10 p-4 md:p-5 shadow-sm"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs font-bold text-white bg-[#0F1D2C] px-2 py-0.5 rounded">
                                Appt {appt.number}
                              </span>
                              <span className="text-xs text-[#0F1D2C]/50">
                                {appt.duration}
                              </span>
                            </div>
                            <ul className="space-y-1">
                              {appt.treatments.map((t, ti) => (
                                <li key={ti} className="flex items-start gap-2">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-[#C9A96E] flex-shrink-0 mt-0.5" />
                                  <span className="text-sm text-[#0F1D2C]/75 font-medium">{t}</span>
                                </li>
                              ))}
                            </ul>
                            {appt.notes && (
                              <p className="mt-2 text-xs text-[#C9A96E] bg-[#C9A96E]/5 rounded-lg px-3 py-1.5 inline-block">
                                {appt.notes}
                              </p>
                            )}
                          </div>

                          <div className="sm:text-right flex-shrink-0">
                            <p className="text-sm font-semibold text-[#0F1D2C]">
                              {appt.dayOfWeek}, {appt.date}
                            </p>
                            <p className="text-xs text-[#0F1D2C]/50">
                              {appt.time}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        <SectionDivider />

        {/* ═══════════════════════════════════════════════════════════
           TREATMENT PACKAGES (Good / Better / Best) with Pay Buttons
           ═══════════════════════════════════════════════════════════ */}
        <section className="max-w-5xl mx-auto px-6 py-12 print-break print-avoid-break">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
            className="text-center mb-12"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C9A96E] mb-3">
              Choose Your Path
            </p>
            <h2 className="font-heading text-2xl md:text-3xl text-[#0F1D2C]">
              Treatment Packages
            </h2>
            <p className="mt-3 text-sm text-[#0F1D2C]/50 max-w-lg mx-auto">
              Each package is tailored to your specific needs. All include a comprehensive consultation and
              personalized aftercare protocol.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {packages.map((pkg, i) => (
              <motion.div
                key={pkg.tier}
                variants={scaleIn}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i * 0.1}
                className={`relative rounded-2xl border overflow-hidden flex flex-col ${
                  pkg.highlight
                    ? 'border-[#C9A96E] shadow-lg shadow-[#C9A96E]/10 bg-white'
                    : 'border-[#C9A96E]/15 bg-white'
                }`}
              >
                {pkg.highlight && (
                  <div className="bg-[#C9A96E] text-white text-[10px] font-bold uppercase tracking-widest text-center py-1.5">
                    Most Popular
                  </div>
                )}

                <div className="p-6 md:p-8 flex-1 flex flex-col">
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#C9A96E]">
                    {pkg.tier}
                  </p>
                  <h3 className="font-heading text-xl text-[#0F1D2C] mt-1">{pkg.name}</h3>

                  <div className="mt-4 mb-1">
                    <span className="font-heading text-3xl text-[#0F1D2C]">
                      ${pkg.price.toLocaleString()}
                    </span>
                    {pkg.savings && (
                      <span className="ml-2 text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                        {pkg.savings}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#0F1D2C]/40 mb-6">
                    or ${pkg.monthlyPayment}/mo with Cherry
                  </p>

                  {/* Line-item pricing */}
                  <div className="space-y-2.5 flex-1">
                    {pkg.lineItems.map((item, j) => (
                      <div key={j} className="flex items-start justify-between gap-2 text-sm">
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#C9A96E] flex-shrink-0 mt-0.5" />
                          <span className="text-[#0F1D2C]/70">
                            {item.service}
                            {item.qty > 1 && (
                              <span className="text-[#0F1D2C]/40"> x{item.qty}</span>
                            )}
                          </span>
                        </div>
                        <span className="text-[#0F1D2C]/50 font-medium whitespace-nowrap">
                          ${item.total.toLocaleString()}
                        </span>
                      </div>
                    ))}

                    {pkg.extras.map((extra, j) => (
                      <div key={`e-${j}`} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#C9A96E]/50 flex-shrink-0 mt-0.5" />
                        <span className="text-[#0F1D2C]/45 text-xs">{extra}</span>
                      </div>
                    ))}

                    <div className="pt-2 mt-2 border-t border-[#C9A96E]/10 flex justify-between text-sm font-semibold">
                      <span className="text-[#0F1D2C]/60">{pkg.sessions} treatments</span>
                      <span className="text-[#0F1D2C]">${pkg.price.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Dual CTA Buttons */}
                  <div className="mt-8 space-y-2.5">
                    {/* Book Consultation / Select */}
                    <a
                      href={mangomintBookingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => trackEvent('selected_tier', pkg.tier, pkg.price)}
                      className={`block text-center py-3 rounded-lg text-sm font-semibold uppercase tracking-wider transition-all duration-300 ${
                        pkg.highlight
                          ? 'bg-[#C9A96E] text-white hover:bg-[#B8964F] shadow-sm'
                          : 'bg-[#0F1D2C] text-white hover:bg-[#1A2A3C]'
                      }`}
                    >
                      Book Consultation
                    </a>

                    {/* Financing Options */}
                    <div className="flex gap-2">
                      <a
                        href={patientfiUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => trackEvent('financing_click_patientfi', pkg.tier)}
                        className="flex-1 block text-center py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider border border-[#C9A96E]/30 text-[#C9A96E] hover:bg-[#C9A96E]/5 transition-all duration-300"
                      >
                        <span className="flex items-center justify-center gap-1.5">
                          <CreditCard className="w-3.5 h-3.5" />
                          PatientFi
                        </span>
                      </a>
                      <a
                        href={cherryFinancingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => trackEvent('financing_click_cherry', pkg.tier)}
                        className="flex-1 block text-center py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider border border-[#C9A96E]/30 text-[#C9A96E] hover:bg-[#C9A96E]/5 transition-all duration-300"
                      >
                        <span className="flex items-center justify-center gap-1.5">
                          <CreditCard className="w-3.5 h-3.5" />
                          Cherry
                        </span>
                      </a>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        <SectionDivider />

        {/* ═══════════════════════════════════════════════════════════
           EXPECTED RESULTS
           ═══════════════════════════════════════════════════════════ */}
        <section className="max-w-4xl mx-auto px-6 py-12 print-avoid-break">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
            className="text-center mb-10"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C9A96E] mb-3">
              What to Expect
            </p>
            <h2 className="font-heading text-2xl md:text-3xl text-[#0F1D2C]">
              Expected Results
            </h2>
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0.1}
            className="bg-white rounded-2xl shadow-sm border border-[#C9A96E]/10 p-8 md:p-10"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: Calendar,
                  title: 'Week 2-4',
                  description: 'Initial improvement in skin texture and radiance. Hydration levels improve visibly. Skin feels smoother to the touch.',
                },
                {
                  icon: TrendingUp,
                  title: 'Month 2-3',
                  description: 'Significant visible changes. Collagen remodeling begins. Concerns like fine lines, uneven tone, and texture show marked improvement.',
                },
                {
                  icon: Star,
                  title: 'Month 4-6',
                  description: 'Optimal results achieved. Full collagen maturation delivers peak improvement. Maintenance protocol preserves lasting results.',
                },
              ].map((result, i) => {
                const Icon = result.icon;
                return (
                  <div key={i} className="text-center md:text-left">
                    <div className="w-12 h-12 mx-auto md:mx-0 rounded-xl bg-[#C9A96E]/10 flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5 text-[#C9A96E]" />
                    </div>
                    <h3 className="font-heading text-lg text-[#0F1D2C] mb-2">{result.title}</h3>
                    <p className="text-sm text-[#0F1D2C]/60 leading-relaxed">{result.description}</p>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 pt-6 border-t border-[#C9A96E]/10 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#F8F6F1] rounded-full">
                <Shield className="w-4 h-4 text-[#C9A96E]" />
                <span className="text-xs font-semibold text-[#0F1D2C]/60">
                  Confidence Level: 90%+ based on clinical protocols and your skin profile
                </span>
              </div>
            </div>
          </motion.div>
        </section>

        <SectionDivider />

        {/* ═══════════════════════════════════════════════════════════
           FINANCING OPTIONS
           ═══════════════════════════════════════════════════════════ */}
        <section className="max-w-4xl mx-auto px-6 py-12 print-avoid-break">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
            className="text-center mb-10"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C9A96E] mb-3">
              Flexible Payment Options
            </p>
            <h2 className="font-heading text-2xl md:text-3xl text-[#0F1D2C]">
              Financing Made Simple
            </h2>
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0.1}
            className="bg-gradient-to-br from-[#0F1D2C] to-[#1A2A3C] rounded-2xl p-8 md:p-12 text-white overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#C9A96E]/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#C9A96E]/5 rounded-full blur-3xl" />

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#C9A96E]/20 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-[#C9A96E]" />
                </div>
                <div>
                  <h3 className="font-heading text-lg">Cherry Financing</h3>
                  <p className="text-xs text-white/50">0% APR available for qualified applicants</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {packages.map((pkg) => (
                  <div
                    key={pkg.tier}
                    className={`rounded-xl p-5 ${
                      pkg.highlight ? 'bg-[#C9A96E]/15 border border-[#C9A96E]/30' : 'bg-white/5 border border-white/10'
                    }`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-widest text-[#C9A96E] mb-1">
                      {pkg.tier}
                    </p>
                    <p className="font-heading text-2xl mb-0.5">
                      ${pkg.monthlyPayment}
                      <span className="text-sm text-white/50">/mo</span>
                    </p>
                    <p className="text-xs text-white/40">
                      ${pkg.price.toLocaleString()} over {pkg.price <= 2000 ? 6 : pkg.price <= 4000 ? 12 : 18} months
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-col sm:flex-row items-center gap-4 pt-6 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#C9A96E]" />
                  <span className="text-sm text-white/70">No hard credit check</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#C9A96E]" />
                  <span className="text-sm text-white/70">Instant approval</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#C9A96E]" />
                  <span className="text-sm text-white/70">0% APR plans available</span>
                </div>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href={patientfiUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackEvent('financing_apply_patientfi')}
                  className="inline-flex items-center gap-2 px-8 py-3 bg-[#C9A96E] text-[#0F1D2C] rounded-lg text-sm font-bold uppercase tracking-wider hover:bg-[#B8964F] transition-all duration-300"
                >
                  <CreditCard className="w-4 h-4" />
                  Apply with PatientFi
                </a>
                <a
                  href={cherryFinancingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackEvent('financing_apply_cherry')}
                  className="inline-flex items-center gap-2 px-6 py-3 border border-[#C9A96E]/30 text-white/80 rounded-lg text-sm font-semibold uppercase tracking-wider hover:border-[#C9A96E] hover:text-white transition-all duration-300"
                >
                  <CreditCard className="w-4 h-4" />
                  Apply with Cherry
                </a>
              </div>
            </div>
          </motion.div>
        </section>

        <SectionDivider />

        {/* ═══════════════════════════════════════════════════════════
           RESERVE YOUR PLAN CTA
           ═══════════════════════════════════════════════════════════ */}
        <section className="max-w-4xl mx-auto px-6 py-12 print-avoid-break">
          <motion.div
            variants={scaleIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
            className="relative bg-white rounded-2xl shadow-lg border border-[#C9A96E]/20 overflow-hidden"
          >
            <div className="h-1 bg-gradient-to-r from-[#C9A96E]/0 via-[#C9A96E] to-[#C9A96E]/0" />

            <div className="p-8 md:p-12 text-center">
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#C9A96E]/10 mb-6"
              >
                <Gift className="w-8 h-8 text-[#C9A96E]" />
              </motion.div>

              <h2 className="font-heading text-2xl md:text-3xl text-[#0F1D2C] mb-3">
                Reserve Your Treatment Plan
              </h2>
              <p className="text-[#0F1D2C]/60 text-base max-w-lg mx-auto mb-2">
                Secure your spot with a $250 fully-refundable consultation deposit.
                This guarantees your pricing and priority scheduling.
              </p>
              <p className="text-xs text-[#0F1D2C]/40 mb-8">
                Your deposit is applied to any treatment package you choose.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                  href={mangomintBookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackEvent('selected_tier', 'Deposit')}
                  className="inline-flex items-center gap-3 px-10 py-4 bg-[#C9A96E] text-white rounded-xl text-base font-semibold uppercase tracking-wider hover:bg-[#B8964F] transition-all duration-300 shadow-lg shadow-[#C9A96E]/20 hover:shadow-[#C9A96E]/30 hover:scale-[1.02]"
                >
                  Reserve with $250 Deposit
                  <ArrowRight className="w-5 h-5" />
                </a>

                <a
                  href={patientfiUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackEvent('financing_apply_patientfi')}
                  className="inline-flex items-center gap-2 px-8 py-4 border-2 border-[#C9A96E]/30 text-[#0F1D2C] rounded-xl text-sm font-semibold uppercase tracking-wider hover:border-[#C9A96E] hover:bg-[#C9A96E]/5 transition-all duration-300"
                >
                  <CreditCard className="w-4 h-4 text-[#C9A96E]" />
                  Apply with PatientFi
                </a>
                <a
                  href={cherryFinancingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackEvent('financing_apply_cherry')}
                  className="inline-flex items-center gap-2 px-6 py-3 border border-[#C9A96E]/20 text-[#0F1D2C]/60 rounded-xl text-xs font-semibold uppercase tracking-wider hover:border-[#C9A96E]/40 hover:text-[#0F1D2C] transition-all duration-300"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  Or Apply with Cherry
                </a>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4 text-xs text-[#0F1D2C]/40">
                <span className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  Fully refundable
                </span>
                <span className="flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5" />
                  No obligation
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Locks in your pricing
                </span>
              </div>
            </div>
          </motion.div>
        </section>

        <SectionDivider />

        {/* ═══════════════════════════════════════════════════════════
           YOUR TREATMENT ARCHITECT
           ═══════════════════════════════════════════════════════════ */}
        <section className="max-w-4xl mx-auto px-6 py-12 print-avoid-break">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
            className="bg-white rounded-2xl shadow-sm border border-[#C9A96E]/10 p-8 md:p-10"
          >
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
              <div className="flex-shrink-0 w-28 h-28 rounded-2xl bg-gradient-to-br from-[#C9A96E]/20 to-[#0F1D2C]/5 flex items-center justify-center">
                <Sparkles className="w-12 h-12 text-[#C9A96E]/60" />
              </div>

              <div className="text-center md:text-left">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C9A96E] mb-1">
                  Why Rani Beauty Clinic
                </p>
                <h3 className="font-heading text-xl text-[#0F1D2C]">Rani Beauty Clinic</h3>
                <p className="text-sm text-[#0F1D2C]/50 mt-0.5 mb-4">
                  Physician-Supervised Medical Aesthetics &bull; Renton, WA
                </p>
                <p className="text-sm text-[#0F1D2C]/65 leading-relaxed max-w-lg">
                  With seven years of experience and over 10,000 successful treatments and transformations,
                  our physician-supervised team delivers natural, lasting results. Every treatment plan is
                  crafted with clinical precision, advanced technology, and your unique goals in mind.
                </p>

                <div className="mt-4 flex flex-wrap items-center justify-center md:justify-start gap-3">
                  {['7+ Years Experience', '10,000+ Transformations', 'Physician-Supervised', 'All Skin Types'].map(
                    (badge) => (
                      <span
                        key={badge}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F8F6F1] rounded-full text-[10px] font-semibold uppercase tracking-wider text-[#0F1D2C]/50 border border-[#C9A96E]/10"
                      >
                        <CheckCircle2 className="w-3 h-3 text-[#C9A96E]" />
                        {badge}
                      </span>
                    )
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
           NEXT STEP (from AI)
           ═══════════════════════════════════════════════════════════ */}
        {plan.suggestedNextStep && (
          <>
            <SectionDivider />
            <section className="max-w-4xl mx-auto px-6 py-8 print-avoid-break">
              <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={0}
                className="bg-[#C9A96E]/5 rounded-2xl border border-[#C9A96E]/15 p-6 md:p-8"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#C9A96E]/15 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-[#C9A96E]" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-[#C9A96E] mb-1">
                      Suggested Next Step
                    </p>
                    <p className="text-[#0F1D2C]/75 leading-relaxed">{plan.suggestedNextStep}</p>
                  </div>
                </div>
              </motion.div>
            </section>
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════
           FOOTER
           ═══════════════════════════════════════════════════════════ */}
        <footer className="bg-[#0F1D2C] text-white mt-12">
          <div className="max-w-4xl mx-auto px-6 py-12 md:py-16">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C9A96E] mb-4">
                  Contact
                </p>
                <div className="space-y-3">
                  <a
                    href="tel:+14255394440"
                    className="flex items-center gap-2.5 text-sm text-white/70 hover:text-[#C9A96E] transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    (425) 539-4440
                  </a>
                  <a
                    href="mailto:info@ranibeautyclinic.com"
                    className="flex items-center gap-2.5 text-sm text-white/70 hover:text-[#C9A96E] transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    info@ranibeautyclinic.com
                  </a>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C9A96E] mb-4">
                  Location
                </p>
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-white/40 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-white/70 leading-relaxed">
                    401 Olympia Ave NE #101
                    <br />
                    Renton, WA 98056
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C9A96E] mb-4">
                  Hours
                </p>
                <div className="space-y-1.5 text-sm text-white/70">
                  <p>Mon - Fri: 10am - 7pm</p>
                  <p>Saturday: 10am - 5pm</p>
                  <p>Sunday: Closed</p>
                </div>
              </div>
            </div>

            <div className="mt-10 pt-6 border-t border-white/10 text-center">
              <p className="text-[11px] text-white/30 leading-relaxed max-w-2xl mx-auto">
                This treatment plan is a personalized recommendation based on your intake assessment and is not a
                guarantee of results. Individual results may vary. All treatments are performed under physician
                supervision. Pricing is valid for 30 days from the date shown above. Financing subject to credit
                approval through Cherry Technologies, Inc.
              </p>
              <p className="mt-4 text-[10px] text-white/20 uppercase tracking-widest">
                &copy; {new Date().getFullYear()} Rani Beauty Clinic. All Rights Reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
