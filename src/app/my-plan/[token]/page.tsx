'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import type { PatientPlanData } from '@/types/patient-plan';

// ── Design Tokens ──

const COLORS = {
  cream: '#FAF8F5',
  creamDark: '#F3EDE6',
  navy: '#0F1D2C',
  gold: '#C9A96E',
  goldLight: '#D4BA87',
  goldDark: '#B8944F',
  white: '#FFFFFF',
  divider: '#E8E2D9',
} as const;

const NAV_SECTIONS = [
  { id: 'analysis', label: 'Analysis' },
  { id: 'journey', label: 'Journey' },
  { id: 'packages', label: 'Packages' },
  { id: 'aftercare', label: 'Aftercare' },
] as const;

// ── Sticky Navigation Bar ──

function StickyNav({ token }: { token: string }) {
  const [visible, setVisible] = useState(false);
  const [activeSection, setActiveSection] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 400);

      // Determine active section
      const sections = NAV_SECTIONS.map((s) => {
        const el = document.getElementById(s.id);
        if (!el) return { id: s.id, top: Infinity };
        return { id: s.id, top: el.getBoundingClientRect().top };
      });
      const current = sections
        .filter((s) => s.top <= 200)
        .sort((a, b) => b.top - a.top)[0];
      setActiveSection(current?.id || '');
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <motion.nav
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -60, opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-lg"
      style={{
        backgroundColor: `${COLORS.navy}E8`,
        borderBottom: `1px solid ${COLORS.gold}20`,
      }}
    >
      <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-12">
        <span
          className="text-sm font-bold tracking-[0.15em]"
          style={{ color: COLORS.gold, fontFamily: 'var(--font-heading), Playfair Display, serif' }}
        >
          RANI
        </span>

        <div className="flex items-center gap-1">
          {NAV_SECTIONS.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200"
              style={{
                color: activeSection === section.id ? COLORS.gold : `${COLORS.white}60`,
                backgroundColor: activeSection === section.id ? `${COLORS.gold}15` : 'transparent',
                fontFamily: 'var(--font-body), Montserrat, sans-serif',
              }}
            >
              {section.label}
            </a>
          ))}

          <span className="w-px h-4 mx-1" style={{ backgroundColor: `${COLORS.white}15` }} />

          <a
            href={`/my-plan/${token}/print`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 hover:bg-white/5"
            style={{
              color: `${COLORS.white}60`,
              fontFamily: 'var(--font-body), Montserrat, sans-serif',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            Print
          </a>
        </div>
      </div>
    </motion.nav>
  );
}

// ── Trust Badge ──

function TrustBadge() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.0, duration: 0.6 }}
      className="flex items-center justify-center gap-3 flex-wrap"
    >
      <div
        className="flex items-center gap-2 px-4 py-2 rounded-full text-xs"
        style={{
          backgroundColor: `${COLORS.white}08`,
          border: `1px solid ${COLORS.white}12`,
          color: `${COLORS.white}60`,
          fontFamily: 'var(--font-body), Montserrat, sans-serif',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={COLORS.gold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <polyline points="9 12 11 14 15 10" />
        </svg>
        Physician-Supervised Care
      </div>
      <div
        className="flex items-center gap-2 px-4 py-2 rounded-full text-xs"
        style={{
          backgroundColor: `${COLORS.white}08`,
          border: `1px solid ${COLORS.white}12`,
          color: `${COLORS.white}60`,
          fontFamily: 'var(--font-body), Montserrat, sans-serif',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={COLORS.gold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
        AI-Powered Analysis
      </div>
    </motion.div>
  );
}

// ── Animated Section Wrapper ──

function Section({
  children,
  className = '',
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.section
      ref={ref}
      id={id}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

// ── Aura Score Gauge ──

function AuraGauge({
  score,
  grade,
  label,
}: {
  score: number;
  grade: string;
  label: string;
}) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    let frame: number;
    const duration = 2000;
    const start = performance.now();

    function animate(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(eased * score));
      if (progress < 1) frame = requestAnimationFrame(animate);
    }

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [isInView, score]);

  const circumference = 2 * Math.PI * 90;
  const offset = circumference - (animatedScore / 100) * circumference;

  // Color based on score
  const getScoreColor = (s: number) => {
    if (s >= 80) return '#4CAF50';
    if (s >= 60) return COLORS.gold;
    if (s >= 40) return '#FF9800';
    return '#F44336';
  };

  return (
    <div ref={ref} className="relative inline-flex items-center justify-center">
      <svg width="220" height="220" viewBox="0 0 220 220">
        {/* Background ring */}
        <circle
          cx="110"
          cy="110"
          r="90"
          fill="none"
          stroke={COLORS.divider}
          strokeWidth="8"
        />
        {/* Score ring */}
        <circle
          cx="110"
          cy="110"
          r="90"
          fill="none"
          stroke={getScoreColor(animatedScore)}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 110 110)"
          style={{ transition: 'stroke 0.3s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-5xl font-bold tabular-nums"
          style={{ fontFamily: 'var(--font-heading), Playfair Display, serif', color: COLORS.navy }}
        >
          {animatedScore}
        </span>
        <span
          className="text-sm font-medium mt-1 tracking-wide uppercase"
          style={{ color: COLORS.gold, fontFamily: 'var(--font-body), Montserrat, sans-serif' }}
        >
          {label}
        </span>
        <span
          className="inline-flex items-center justify-center mt-2 px-3 py-0.5 rounded-full text-xs font-bold tracking-widest"
          style={{
            backgroundColor: `${getScoreColor(score)}15`,
            color: getScoreColor(score),
            border: `1px solid ${getScoreColor(score)}30`,
          }}
        >
          {grade}
        </span>
      </div>
    </div>
  );
}

// ── Severity Badge ──

function SeverityBadge({ severity }: { severity: string }) {
  const config = {
    mild: { bg: '#E8F5E9', color: '#2E7D32', label: 'Mild' },
    moderate: { bg: '#FFF3E0', color: '#E65100', label: 'Moderate' },
    severe: { bg: '#FFEBEE', color: '#C62828', label: 'Severe' },
  }[severity] || { bg: '#F5F5F5', color: '#616161', label: severity };

  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: config.bg, color: config.color }}
    >
      {config.label}
    </span>
  );
}

// ── Package Card ──

function PackageCard({
  pkg,
  onSelect,
}: {
  pkg: PatientPlanData['packages'][0];
  onSelect: (tier: string) => void;
}) {
  const isHighlighted = pkg.highlighted;

  return (
    <motion.div
      whileHover={{ y: -6, boxShadow: `0 24px 64px rgba(15, 29, 44, 0.14)` }}
      className={`relative flex flex-col rounded-2xl overflow-hidden ${isHighlighted ? 'gold-border-animated' : ''}`}
      style={{
        backgroundColor: COLORS.white,
        border: isHighlighted ? `2px solid ${COLORS.gold}` : `1px solid ${COLORS.divider}`,
      }}
    >
      {isHighlighted && (
        <div
          className="text-center py-2 text-xs font-bold tracking-widest uppercase"
          style={{ backgroundColor: COLORS.gold, color: COLORS.white }}
        >
          Most Popular
        </div>
      )}

      <div className="p-6 flex-1 flex flex-col">
        {/* Header */}
        <div className="mb-4">
          <h3
            className="text-xl font-bold mb-1 font-heading"
            style={{ color: COLORS.navy }}
          >
            {pkg.name}
          </h3>
          <p className="text-sm" style={{ color: `${COLORS.navy}80` }}>
            {pkg.subtitle}
          </p>
        </div>

        {/* Pricing */}
        <div className="mb-4">
          <div className="flex items-baseline gap-2">
            <span
              className="text-3xl font-bold"
              style={{ fontFamily: 'var(--font-heading), Playfair Display, serif', color: COLORS.navy }}
            >
              ${pkg.price.toLocaleString()}
            </span>
            {pkg.discount > 0 && (
              <span className="text-sm line-through" style={{ color: `${COLORS.navy}40` }}>
                ${pkg.originalPrice.toLocaleString()}
              </span>
            )}
          </div>
          {pkg.discount > 0 && (
            <p className="text-xs mt-1" style={{ color: COLORS.gold }}>
              Save ${pkg.savingsVsStandalone.toLocaleString()} ({pkg.discount}% off)
            </p>
          )}
          <p className="text-xs mt-1.5" style={{ color: `${COLORS.navy}60` }}>
            or ${pkg.monthlyPayment12}/mo for 12 months
          </p>
        </div>

        {/* Line items */}
        <div className="mb-4 flex-1">
          <p
            className="text-xs font-bold uppercase tracking-wider mb-2"
            style={{ color: `${COLORS.navy}50` }}
          >
            {pkg.sessions} Sessions Included
          </p>
          <ul className="space-y-1.5">
            {pkg.lineItems.map((item, i) => (
              <li key={i} className="flex items-center gap-2 text-sm" style={{ color: COLORS.navy }}>
                <span style={{ color: COLORS.gold }}>&#10003;</span>
                <span>
                  {item.service} {item.qty > 1 ? `x${item.qty}` : ''}
                </span>
              </li>
            ))}
          </ul>

          {pkg.extras.length > 0 && (
            <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${COLORS.divider}` }}>
              <p
                className="text-xs font-bold uppercase tracking-wider mb-1.5"
                style={{ color: `${COLORS.navy}50` }}
              >
                Bonus Extras
              </p>
              {pkg.extras.map((extra, i) => (
                <p key={i} className="text-xs" style={{ color: COLORS.gold }}>
                  + {extra}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Best for */}
        <p className="text-xs mb-4 italic" style={{ color: `${COLORS.navy}60` }}>
          Best for: {pkg.bestFor}
        </p>

        {/* CTA */}
        <button
          type="button"
          onClick={() => onSelect(pkg.tier)}
          className="w-full py-3.5 min-h-[44px] rounded-xl text-sm font-bold tracking-wide transition-all duration-300 hover:shadow-lg"
          style={{
            backgroundColor: isHighlighted ? COLORS.gold : 'transparent',
            color: isHighlighted ? COLORS.white : COLORS.gold,
            border: `2px solid ${COLORS.gold}`,
          }}
          onMouseEnter={(e) => {
            if (!isHighlighted) {
              e.currentTarget.style.backgroundColor = COLORS.gold;
              e.currentTarget.style.color = COLORS.white;
            }
          }}
          onMouseLeave={(e) => {
            if (!isHighlighted) {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = COLORS.gold;
            }
          }}
        >
          I&apos;m Interested in This Package
        </button>
      </div>
    </motion.div>
  );
}

// ── Interest Modal ──

function InterestModal({
  isOpen,
  selectedTier,
  token,
  onClose,
}: {
  isOpen: boolean;
  selectedTier: string;
  token: string;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/mastermind/share/interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          name,
          phone,
          packageTier: selectedTier,
          message: message || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        return;
      }

      setSubmitted(true);
    } catch {
      setError('Network error. Please try again or call us directly.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center px-4"
        style={{ backgroundColor: 'rgba(15, 29, 44, 0.6)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md rounded-2xl p-8 shadow-2xl"
          style={{ backgroundColor: COLORS.white }}
          onClick={(e) => e.stopPropagation()}
        >
          {submitted ? (
            <div className="text-center py-6">
              <div
                className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{ backgroundColor: `${COLORS.gold}15` }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M20 6L9 17L4 12"
                    stroke={COLORS.gold}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3
                className="text-xl font-bold mb-2"
                style={{ fontFamily: 'var(--font-heading), Playfair Display, serif', color: COLORS.navy }}
              >
                Thank You!
              </h3>
              <p className="text-sm mb-6" style={{ color: `${COLORS.navy}70` }}>
                Our team will reach out to you shortly to discuss the{' '}
                <strong>{selectedTier}</strong> package and schedule your first appointment.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl text-sm font-medium"
                style={{ backgroundColor: COLORS.navy, color: COLORS.white }}
              >
                Close
              </button>
            </div>
          ) : (
            <>
              <h3
                className="text-xl font-bold mb-1"
                style={{ fontFamily: 'var(--font-heading), Playfair Display, serif', color: COLORS.navy }}
              >
                Express Your Interest
              </h3>
              <p className="text-sm mb-6" style={{ color: `${COLORS.navy}60` }}>
                Tell us a bit about yourself and we&apos;ll be in touch about the{' '}
                <strong style={{ color: COLORS.gold }}>{selectedTier}</strong> package.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    className="block text-xs font-medium mb-1.5 uppercase tracking-wider"
                    style={{ color: `${COLORS.navy}60` }}
                  >
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                    style={{
                      backgroundColor: COLORS.cream,
                      color: COLORS.navy,
                      border: `1px solid ${COLORS.divider}`,
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = COLORS.gold)}
                    onBlur={(e) => (e.currentTarget.style.borderColor = COLORS.divider)}
                    placeholder="Sarah Johnson"
                  />
                </div>

                <div>
                  <label
                    className="block text-xs font-medium mb-1.5 uppercase tracking-wider"
                    style={{ color: `${COLORS.navy}60` }}
                  >
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                    style={{
                      backgroundColor: COLORS.cream,
                      color: COLORS.navy,
                      border: `1px solid ${COLORS.divider}`,
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = COLORS.gold)}
                    onBlur={(e) => (e.currentTarget.style.borderColor = COLORS.divider)}
                    placeholder="(425) 000-0000"
                  />
                </div>

                <div>
                  <label
                    className="block text-xs font-medium mb-1.5 uppercase tracking-wider"
                    style={{ color: `${COLORS.navy}60` }}
                  >
                    Message <span style={{ color: `${COLORS.navy}30` }}>(optional)</span>
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all resize-none"
                    style={{
                      backgroundColor: COLORS.cream,
                      color: COLORS.navy,
                      border: `1px solid ${COLORS.divider}`,
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = COLORS.gold)}
                    onBlur={(e) => (e.currentTarget.style.borderColor = COLORS.divider)}
                    placeholder="Any questions or preferred appointment times..."
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-xl">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 min-h-[48px] rounded-xl text-sm font-bold tracking-wide transition-all duration-300 disabled:opacity-60 hover:shadow-lg"
                  style={{ backgroundColor: COLORS.gold, color: COLORS.white }}
                >
                  {submitting ? 'Sending...' : 'Send My Interest'}
                </button>
              </form>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Treatment Timeline ──

function TreatmentTimeline({
  sequencing,
  treatments,
  customPlan,
}: {
  sequencing: PatientPlanData['sequencing'];
  treatments: PatientPlanData['treatments'];
  customPlan?: PatientPlanData['customPlan'];
}) {
  const customItems = customPlan?.items
    .filter((item) => item.selected)
    .sort((a, b) => a.scheduledDay - b.scheduledDay || a.treatmentName.localeCompare(b.treatmentName)) || [];

  if (customItems.length > 0) {
    return (
      <div className="space-y-4">
        <div
          className="rounded-2xl p-5 luxury-card"
          style={{
            backgroundColor: COLORS.white,
            border: `1px solid ${COLORS.divider}`,
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold tracking-[0.2em] uppercase" style={{ color: COLORS.gold }}>
                Exact Plan Selected
              </p>
              <h4 className="font-heading text-xl font-bold mt-1" style={{ color: COLORS.navy }}>
                {customPlan?.selectedSessionCount || 0} planned sessions
              </h4>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wide" style={{ color: `${COLORS.navy}45` }}>
                Estimated investment
              </p>
              <p className="font-heading text-3xl font-bold" style={{ color: COLORS.navy }}>
                ${(customPlan?.selectedTotal || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {customItems.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.06 }}
            className="rounded-xl p-5 treatment-card-accent luxury-card"
            style={{
              backgroundColor: COLORS.white,
              border: `1px solid ${COLORS.divider}`,
            }}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold tracking-[0.18em] uppercase mb-1" style={{ color: COLORS.gold }}>
                  Day {item.scheduledDay} &middot; {formatPatientDate(item.scheduledDate)}
                </p>
                <h5
                  className="font-bold text-lg"
                  style={{
                    fontFamily: 'var(--font-heading), Playfair Display, serif',
                    color: COLORS.navy,
                  }}
                >
                  {item.treatmentName}
                </h5>
              </div>
              <span
                className="text-xs px-2.5 py-1 rounded-full shrink-0 font-medium"
                style={{
                  backgroundColor: `${COLORS.gold}15`,
                  color: COLORS.gold,
                }}
              >
                {item.sessions} {item.sessions === 1 ? 'session' : 'sessions'}
              </span>
            </div>

            <div className="grid sm:grid-cols-3 gap-3 mt-4 text-sm">
              <div className="rounded-lg p-3" style={{ backgroundColor: COLORS.cream }}>
                <p className="text-xs uppercase tracking-wide" style={{ color: `${COLORS.navy}45` }}>
                  Per session
                </p>
                <p className="font-bold" style={{ color: COLORS.navy }}>${item.perSession.toLocaleString()}</p>
              </div>
              <div className="rounded-lg p-3" style={{ backgroundColor: COLORS.cream }}>
                <p className="text-xs uppercase tracking-wide" style={{ color: `${COLORS.navy}45` }}>
                  Line estimate
                </p>
                <p className="font-bold" style={{ color: COLORS.navy }}>${item.totalEstimate.toLocaleString()}</p>
              </div>
              <div className="rounded-lg p-3" style={{ backgroundColor: COLORS.cream }}>
                <p className="text-xs uppercase tracking-wide" style={{ color: `${COLORS.navy}45` }}>
                  Priority
                </p>
                <p className="font-bold capitalize" style={{ color: COLORS.navy }}>{item.priority}</p>
              </div>
            </div>

            {item.targetAreas.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {item.targetAreas.map((area) => (
                  <span
                    key={area}
                    className="text-xs px-3 py-1.5 rounded-full"
                    style={{
                      backgroundColor: `${COLORS.navy}07`,
                      color: `${COLORS.navy}80`,
                      border: `1px solid ${COLORS.divider}`,
                    }}
                  >
                    {area}
                  </span>
                ))}
              </div>
            )}

            {item.notes && (
              <p className="text-sm italic mt-4" style={{ color: `${COLORS.navy}65` }}>
                {item.notes}
              </p>
            )}
          </motion.div>
        ))}
      </div>
    );
  }

  // Create a lookup map for treatment details
  const allTreatments = [
    ...treatments.primary,
    ...treatments.complementary,
    ...treatments.maintenance,
  ];
  const treatmentByName = new Map(allTreatments.map((t) => [t.treatmentName, t]));

  return (
    <div className="space-y-8">
      {sequencing.map((phase, idx) => (
        <div key={idx} className="relative">
          {/* Phase connector */}
          {idx < sequencing.length - 1 && (
            <div
              className="absolute left-6 top-14 bottom-0 w-px"
              style={{ backgroundColor: COLORS.divider }}
            />
          )}

          {/* Phase header */}
          <div className="flex items-center gap-4 mb-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shrink-0"
              style={{
                backgroundColor: `${COLORS.gold}15`,
                color: COLORS.gold,
                fontFamily: 'var(--font-heading), Playfair Display, serif',
              }}
            >
              {phase.phase}
            </div>
            <div>
              <h4
                className="font-bold text-lg font-heading"
                style={{
                  color: COLORS.navy,
                }}
              >
                {phase.phaseName}
              </h4>
              <p className="text-sm" style={{ color: `${COLORS.navy}60` }}>
                {phase.duration}
              </p>
            </div>
          </div>

          {/* Treatment cards within phase */}
          <div className="ml-6 pl-10 space-y-3">
            {/* Deduplicate treatments by name within a phase */}
            {Array.from(
              new Map(
                phase.treatments.map((t) => [t.treatmentName, t])
              ).values()
            ).map((t, tIdx) => {
              const detail = treatmentByName.get(t.treatmentName);
              return (
                <motion.div
                  key={tIdx}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: tIdx * 0.1 }}
                  className="rounded-xl p-5 treatment-card-accent luxury-card"
                  style={{
                    backgroundColor: COLORS.white,
                    border: `1px solid ${COLORS.divider}`,
                  }}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h5
                      className="font-bold"
                      style={{
                        fontFamily: 'var(--font-heading), Playfair Display, serif',
                        color: COLORS.navy,
                      }}
                    >
                      {t.treatmentName}
                    </h5>
                    {detail && (
                      <span
                        className="text-xs px-2.5 py-1 rounded-full shrink-0 font-medium"
                        style={{
                          backgroundColor: `${COLORS.gold}15`,
                          color: COLORS.gold,
                        }}
                      >
                        {detail.sessionsRequired}{' '}
                        {detail.sessionsRequired === 1 ? 'session' : 'sessions'}
                      </span>
                    )}
                  </div>

                  {detail && (
                    <div className="space-y-2">
                      <p className="text-sm leading-relaxed" style={{ color: `${COLORS.navy}80` }}>
                        {detail.aiReasoning}
                      </p>
                      <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs" style={{ color: `${COLORS.navy}50` }}>
                        {detail.intervalBetweenSessions && (
                          <span>Spacing: {detail.intervalBetweenSessions}</span>
                        )}
                        {detail.timeToResults && (
                          <span>Results in: {detail.timeToResults}</span>
                        )}
                        {detail.downtime && (
                          <span>Downtime: {detail.downtime}</span>
                        )}
                      </div>
                      {detail.expectedImprovement && (
                        <p className="text-xs italic" style={{ color: COLORS.gold }}>
                          Expected: {detail.expectedImprovement}
                        </p>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}

            {/* Phase milestone */}
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium"
              style={{ backgroundColor: `${COLORS.gold}08`, color: COLORS.gold }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                  fill={COLORS.gold}
                />
              </svg>
              Milestone: {phase.expectedMilestone}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function formatPatientDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date TBD';
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// ── Main Page Component ──

export default function PatientPlanPage() {
  const params = useParams();
  const token = params.token as string;

  const [data, setData] = useState<PatientPlanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState('');

  // Fetch patient data
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/mastermind/share/${token}`);
        const json = await res.json();

        if (!res.ok) {
          setError(json.error || 'Unable to load your treatment plan.');
          return;
        }

        setData(json.data);
      } catch {
        setError('Unable to connect. Please check your internet connection and try again.');
      } finally {
        setLoading(false);
      }
    }

    if (token) load();
  }, [token]);

  const handlePackageSelect = useCallback((tier: string) => {
    setSelectedTier(tier);
    setModalOpen(true);
  }, []);

  // ── Loading State ──
  if (loading) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center patient-hero-gradient"
      >
        {/* Subtle gold radial glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-[0.08]"
          style={{ background: `radial-gradient(circle, ${COLORS.gold} 0%, transparent 70%)` }}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 mb-10"
        >
          <div
            className="text-3xl font-bold tracking-[0.25em]"
            style={{ fontFamily: 'var(--font-heading), Playfair Display, serif', color: COLORS.gold }}
          >
            RANI
          </div>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="h-px mt-3"
            style={{ background: `linear-gradient(90deg, transparent, ${COLORS.gold}, transparent)` }}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="relative z-10 flex flex-col items-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
            className="w-10 h-10 rounded-full mb-5"
            style={{ border: `2px solid ${COLORS.gold}25`, borderTopColor: COLORS.gold }}
          />
          <p
            className="text-sm tracking-[0.15em] uppercase"
            style={{ color: `${COLORS.white}50`, fontFamily: 'var(--font-body), Montserrat, sans-serif' }}
          >
            Preparing your plan
          </p>
        </motion.div>
      </div>
    );
  }

  // ── Error State ──
  if (error || !data) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-6"
        style={{ backgroundColor: COLORS.cream }}
      >
        <div className="text-center max-w-md">
          <div
            className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
            style={{ backgroundColor: `${COLORS.gold}10` }}
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke={COLORS.gold} strokeWidth="2" />
              <path d="M12 8V12M12 16H12.01" stroke={COLORS.gold} strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <h1
            className="text-2xl font-bold mb-3"
            style={{ fontFamily: 'var(--font-heading), Playfair Display, serif', color: COLORS.navy }}
          >
            Link Expired or Invalid
          </h1>
          <p className="text-sm mb-8 leading-relaxed" style={{ color: `${COLORS.navy}60` }}>
            {error || 'This treatment plan link is no longer available.'}
          </p>
          <a
            href="https://ranibeautyclinic.com"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all"
            style={{ backgroundColor: COLORS.navy, color: COLORS.white }}
          >
            Visit Rani Beauty Clinic
          </a>
          <p className="text-xs mt-6" style={{ color: `${COLORS.navy}40` }}>
            Need help? Call us at{' '}
            <a href="tel:+14255394440" style={{ color: COLORS.gold }}>
              (425) 539-4440
            </a>
          </p>
        </div>
      </div>
    );
  }

  // ── Date formatting ──
  const consultDate = data.consultationDate
    ? new Date(data.consultationDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Recent';

  const firstName = (data.patientName || 'there').split(' ')[0] || 'Your';
  const skinAgeDelta = data.auraScore?.skinAgeDelta ?? 0;
  const skinAgeDirection = skinAgeDelta > 0 ? '+' : '';

  // Sort concerns by severity for top 3
  const severityOrder = { severe: 0, moderate: 1, mild: 2 };
  const topConcerns = [...(data.concerns || [])]
    .sort(
      (a, b) =>
        (severityOrder[a.severity as keyof typeof severityOrder] ?? 3) -
        (severityOrder[b.severity as keyof typeof severityOrder] ?? 3)
    )
    .slice(0, 3);

  // Sort packages: Start, Transform, Elite
  const tierOrder = { Start: 0, Transform: 1, Elite: 2 };
  const sortedPackages = [...(data.packages || [])].sort(
    (a, b) =>
      (tierOrder[a.tier as keyof typeof tierOrder] ?? 0) -
      (tierOrder[b.tier as keyof typeof tierOrder] ?? 0)
  );

  return (
    <div className="min-h-screen paper-texture patient-portal-scroll" style={{ backgroundColor: COLORS.cream }}>
      <AnimatePresence>
        <StickyNav token={token} />
      </AnimatePresence>

      {/* ────────────────── SECTION 1: HERO ────────────────── */}
      <section
        className="relative overflow-hidden patient-hero-gradient"
      >
        {/* Subtle gold radial glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-[0.06]"
          style={{
            background: `radial-gradient(circle, ${COLORS.gold} 0%, transparent 70%)`,
          }}
        />
        {/* Second subtle gold accent - offset */}
        <div
          className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-[0.03]"
          style={{
            background: `radial-gradient(circle, ${COLORS.gold} 0%, transparent 60%)`,
          }}
        />

        <div className="relative max-w-4xl mx-auto px-6 py-16 md:py-24 text-center">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-10"
          >
            <Image
              src="/images/logo-gold.png"
              alt="Rani Beauty Clinic"
              width={180}
              height={60}
              className="mx-auto"
              priority
              onError={(e) => {
                // Text fallback if logo doesn't load
                const target = e.currentTarget;
                target.style.display = 'none';
                const fallback = target.nextElementSibling;
                if (fallback instanceof HTMLElement) fallback.style.display = 'block';
              }}
            />
            <span
              className="hidden text-2xl tracking-[0.2em] font-bold"
              style={{
                fontFamily: 'var(--font-heading), Playfair Display, serif',
                color: COLORS.gold,
              }}
            >
              RANI
            </span>
          </motion.div>

          {/* Patient Name + Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight tracking-wide font-heading"
              style={{
                color: COLORS.white,
                letterSpacing: '0.04em',
              }}
            >
              {firstName}&apos;s Personalized
              <br />
              <span style={{ color: COLORS.gold }}>Treatment Plan</span>
            </h1>
            {/* Gold separator line */}
            <div className="gold-separator mb-6" />
            <p className="text-sm tracking-widest uppercase mb-10" style={{ color: `${COLORS.white}50` }}>
              Prepared on {consultDate}
            </p>
          </motion.div>

          {/* Aura Score Gauge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mb-8"
          >
            <div className="aura-gauge-glow">
              <AuraGauge
                score={data.auraScore.overall}
                grade={data.auraScore.grade}
                label={data.auraScore.label}
              />
            </div>
          </motion.div>

          {/* Skin age stat */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="flex items-center justify-center gap-3 flex-wrap"
          >
            <div
              className="px-5 py-2.5 rounded-full text-sm"
              style={{
                backgroundColor: `${COLORS.white}08`,
                border: `1px solid ${COLORS.white}15`,
                color: COLORS.white,
              }}
            >
              <span style={{ color: `${COLORS.white}60` }}>Skin Age:</span>{' '}
              <strong>{data.auraScore.skinAge}</strong>
            </div>
            <div
              className="px-5 py-2.5 rounded-full text-sm"
              style={{
                backgroundColor: `${COLORS.white}08`,
                border: `1px solid ${COLORS.white}15`,
                color: COLORS.white,
              }}
            >
              <span style={{ color: `${COLORS.white}60` }}>Actual Age:</span>{' '}
              <strong>{data.auraScore.chronologicalAge}</strong>
            </div>
            <div
              className="px-5 py-2.5 rounded-full text-sm font-medium"
              style={{
                backgroundColor: skinAgeDelta > 0 ? '#F4433610' : '#4CAF5010',
                border: `1px solid ${skinAgeDelta > 0 ? '#F4433625' : '#4CAF5025'}`,
                color: skinAgeDelta > 0 ? '#EF5350' : '#66BB6A',
              }}
            >
              {skinAgeDirection}{skinAgeDelta} years
            </div>
          </motion.div>

          {/* Trust Signals */}
          <div className="mt-8">
            <TrustBadge />
          </div>
        </div>
      </section>

      {/* ────────────────── SECTION 2: SKIN ANALYSIS ────────────────── */}
      <Section className="max-w-4xl mx-auto px-6 py-20 md:py-28" id="analysis">
        <div className="text-center mb-14">
          <p
            className="text-xs font-bold tracking-[0.25em] uppercase mb-3"
            style={{ color: COLORS.gold }}
          >
            Your Skin Analysis
          </p>
          <div className="gold-separator mb-4" />
          <h2
            className="text-2xl md:text-3xl font-bold font-heading"
            style={{ color: COLORS.navy }}
          >
            What We Discovered
          </h2>
        </div>

        {/* Top Concerns */}
        <div className="grid gap-4 md:grid-cols-3 mb-10">
          {topConcerns.map((concern, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="rounded-2xl p-6 luxury-card"
              style={{
                backgroundColor: COLORS.white,
                border: `1px solid ${COLORS.divider}`,
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <h4
                  className="font-bold capitalize font-heading"
                  style={{
                    color: COLORS.navy,
                  }}
                >
                  {concern.concern.replace(/_/g, ' ')}
                </h4>
                <SeverityBadge severity={concern.severity} />
              </div>
              <p className="text-sm leading-relaxed" style={{ color: `${COLORS.navy}70` }}>
                {concern.description}
              </p>
              {concern.zones.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {concern.zones.slice(0, 4).map((zone) => (
                    <span
                      key={zone}
                      className="text-xs px-2 py-0.5 rounded-full capitalize"
                      style={{
                        backgroundColor: `${COLORS.gold}10`,
                        color: COLORS.gold,
                      }}
                    >
                      {zone.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Zone Summary */}
        {data.zones.length > 0 && (
          <div
            className="rounded-2xl p-6 mb-10 luxury-card"
            style={{
              backgroundColor: COLORS.white,
              border: `1px solid ${COLORS.divider}`,
            }}
          >
            <h4
              className="font-bold mb-4 font-heading"
              style={{ color: COLORS.navy }}
            >
              Zone-by-Zone Summary
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {data.zones
                .filter((z) => z.concerns.length > 0)
                .slice(0, 8)
                .map((zone, i) => (
                  <div
                    key={i}
                    className="rounded-xl p-3 text-center"
                    style={{ backgroundColor: COLORS.cream }}
                  >
                    <p className="text-xs font-medium capitalize mb-1" style={{ color: `${COLORS.navy}60` }}>
                      {zone.zoneName}
                    </p>
                    <p
                      className="text-lg font-bold"
                      style={{
                        fontFamily: 'var(--font-heading), Playfair Display, serif',
                        color: zone.overallScore >= 70 ? '#4CAF50' : zone.overallScore >= 40 ? COLORS.gold : '#F44336',
                      }}
                    >
                      {zone.overallScore}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Predictive Insight */}
        {data.predictiveMetrics && (
          <div
            className="rounded-2xl p-6 md:p-8"
            style={{
              background: `linear-gradient(135deg, ${COLORS.navy} 0%, #1A2D3F 100%)`,
            }}
          >
            <p className="text-xs font-bold tracking-[0.2em] uppercase mb-3" style={{ color: COLORS.gold }}>
              Predictive Insight
            </p>
            <p
              className="text-lg md:text-xl font-bold leading-relaxed"
              style={{
                fontFamily: 'var(--font-heading), Playfair Display, serif',
                color: COLORS.white,
              }}
            >
              Without treatment, your skin age is projected to reach{' '}
              <span style={{ color: '#EF5350' }}>
                {data.predictiveMetrics.withoutIntervention.threeYears.skinAge}
              </span>{' '}
              by{' '}
              {new Date(
                Date.now() + 3 * 365.25 * 24 * 60 * 60 * 1000
              ).getFullYear()}
              .
            </p>
            <p className="text-sm mt-4" style={{ color: `${COLORS.white}60` }}>
              With your personalized treatment plan, we project your skin age could
              improve to{' '}
              <strong style={{ color: '#66BB6A' }}>
                {data.predictiveMetrics.withTreatment.oneYear.skinAge}
              </strong>{' '}
              within 12 months.
            </p>
          </div>
        )}
      </Section>

      {/* ────────────────── SECTION 3: TREATMENT JOURNEY ────────────────── */}
      <Section
        className="py-20 md:py-28"
        id="journey"
      >
        <div
          className="max-w-4xl mx-auto px-6"
        >
          <div className="text-center mb-14">
            <p
              className="text-xs font-bold tracking-[0.25em] uppercase mb-3"
              style={{ color: COLORS.gold }}
            >
              Your Treatment Journey
            </p>
            <div className="gold-separator mb-4" />
            <h2
              className="text-2xl md:text-3xl font-bold font-heading"
              style={{ color: COLORS.navy }}
            >
              A Roadmap to Your Best Skin
            </h2>
          </div>

          {/* AI Summary */}
          {data.summary.patientFacing && (
            <div
              className="rounded-2xl p-6 md:p-8 mb-10 luxury-card"
              style={{
                backgroundColor: COLORS.white,
                border: `1px solid ${COLORS.divider}`,
              }}
            >
              <p
                className="text-sm md:text-base leading-relaxed"
                style={{ color: `${COLORS.navy}90` }}
              >
                {data.summary.patientFacing}
              </p>
              {data.summary.keyHighlights.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {data.summary.keyHighlights.map((h, i) => (
                    <span
                      key={i}
                      className="text-xs px-3 py-1.5 rounded-full"
                      style={{
                        backgroundColor: `${COLORS.gold}10`,
                        color: COLORS.gold,
                        border: `1px solid ${COLORS.gold}20`,
                      }}
                    >
                      {h}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Visual Timeline */}
          {(data.sequencing.length > 0 || (data.customPlan?.items.some((item) => item.selected) ?? false)) && (
            <TreatmentTimeline
              sequencing={data.sequencing}
              treatments={data.treatments}
              customPlan={data.customPlan}
            />
          )}
        </div>
      </Section>

      {/* ────────────────── SECTION 4: PACKAGES ────────────────── */}
      <Section
        className="py-20 md:py-28"
        id="packages"
      >
        <div style={{ backgroundColor: `${COLORS.creamDark}` }} className="py-20 md:py-28">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-14">
              <p
                className="text-xs font-bold tracking-[0.25em] uppercase mb-3"
                style={{ color: COLORS.gold }}
              >
                Your Packages
              </p>
              <div className="gold-separator mb-4" />
              <h2
                className="text-2xl md:text-3xl font-bold mb-3 font-heading"
                style={{ color: COLORS.navy }}
              >
                Choose Your Transformation
              </h2>
              <p className="text-sm max-w-lg mx-auto" style={{ color: `${COLORS.navy}60` }}>
                Every package is tailored to your unique skin profile.
                Flexible monthly financing available on all options.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {sortedPackages.map((pkg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                >
                  <PackageCard
                    pkg={pkg}
                    onSelect={handlePackageSelect}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ────────────────── SECTION 5: AFTERCARE PREVIEW ────────────────── */}
      {data.aftercare.length > 0 && (
        <Section className="max-w-4xl mx-auto px-6 py-20 md:py-28" id="aftercare">
          <div className="text-center mb-14">
            <p
              className="text-xs font-bold tracking-[0.25em] uppercase mb-3"
              style={{ color: COLORS.gold }}
            >
              Aftercare Preview
            </p>
            <div className="gold-separator mb-4" />
            <h2
              className="text-2xl md:text-3xl font-bold font-heading"
              style={{ color: COLORS.navy }}
            >
              What to Expect After Treatment
            </h2>
          </div>

          <div className="space-y-4">
            {data.aftercare.map((ac, i) => (
              <motion.details
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group rounded-2xl overflow-hidden luxury-card"
                style={{
                  backgroundColor: COLORS.white,
                  border: `1px solid ${COLORS.divider}`,
                }}
              >
                <summary
                  className="flex items-center justify-between px-6 py-5 cursor-pointer list-none min-h-[44px]"
                  style={{ color: COLORS.navy }}
                >
                  <h4
                    className="font-bold font-heading"
                  >
                    {ac.treatmentName}
                  </h4>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="transition-transform group-open:rotate-180"
                  >
                    <path d="M6 9L12 15L18 9" stroke={COLORS.gold} strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </summary>
                <div className="px-6 pb-6">
                  {/* Immediate aftercare */}
                  {ac.immediateAftercare.length > 0 && (
                    <div className="mb-4">
                      <p
                        className="text-xs font-bold uppercase tracking-wider mb-2"
                        style={{ color: `${COLORS.navy}50` }}
                      >
                        Immediately After
                      </p>
                      <ul className="space-y-1.5">
                        {ac.immediateAftercare.map((item, j) => (
                          <li key={j} className="flex items-start gap-2 text-sm" style={{ color: `${COLORS.navy}80` }}>
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: COLORS.gold }} />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Week one guidance */}
                  {ac.weekOneGuidance.length > 0 && (
                    <div className="mb-4">
                      <p
                        className="text-xs font-bold uppercase tracking-wider mb-2"
                        style={{ color: `${COLORS.navy}50` }}
                      >
                        Week One
                      </p>
                      <ul className="space-y-1.5">
                        {ac.weekOneGuidance.map((item, j) => (
                          <li key={j} className="flex items-start gap-2 text-sm" style={{ color: `${COLORS.navy}80` }}>
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: COLORS.gold }} />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Products */}
                  {ac.productsRecommended.length > 0 && (
                    <div>
                      <p
                        className="text-xs font-bold uppercase tracking-wider mb-2"
                        style={{ color: `${COLORS.navy}50` }}
                      >
                        Recommended Products
                      </p>
                      <div className="space-y-2">
                        {ac.productsRecommended.map((prod, j) => (
                          <div
                            key={j}
                            className="flex items-start gap-3 text-sm rounded-xl p-3"
                            style={{ backgroundColor: COLORS.cream }}
                          >
                            <span style={{ color: COLORS.gold }} className="font-bold">Rx</span>
                            <div>
                              <p className="font-medium" style={{ color: COLORS.navy }}>
                                {prod.product}
                              </p>
                              <p className="text-xs mt-0.5" style={{ color: `${COLORS.navy}60` }}>
                                {prod.reason}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <p
                    className="text-xs italic mt-4 pt-4"
                    style={{ color: `${COLORS.navy}40`, borderTop: `1px solid ${COLORS.divider}` }}
                  >
                    Your provider will give you detailed instructions at your appointment.
                  </p>
                </div>
              </motion.details>
            ))}
          </div>
        </Section>
      )}

      {/* ────────────────── SECTION 6: SIMULATION ────────────────── */}
      {data.simulation && (
        <Section
          className="py-20 md:py-28"
          id="simulation"
        >
          <div style={{ backgroundColor: `${COLORS.creamDark}` }} className="py-20 md:py-28">
            <div className="max-w-4xl mx-auto px-6">
              <div className="text-center mb-14">
                <p
                  className="text-xs font-bold tracking-[0.25em] uppercase mb-3"
                  style={{ color: COLORS.gold }}
                >
                  Before & After Preview
                </p>
                <div className="gold-separator mb-4" />
                <h2
                  className="text-2xl md:text-3xl font-bold mb-3 font-heading"
                  style={{ color: COLORS.navy }}
                >
                  Projected Results With Treatment
                </h2>
                <p className="text-sm" style={{ color: `${COLORS.navy}50` }}>
                  AI-projected outcomes over 12 months
                </p>
              </div>

              {/* Comparison frames */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {/* With Treatment */}
                <div
                  className="rounded-2xl overflow-hidden luxury-card"
                  style={{
                    backgroundColor: COLORS.white,
                    border: `1px solid ${COLORS.divider}`,
                  }}
                >
                  <div
                    className="px-5 py-3 text-center text-sm font-bold tracking-wide"
                    style={{ backgroundColor: `${COLORS.gold}10`, color: COLORS.gold }}
                  >
                    With Treatment
                  </div>
                  <div className="p-5">
                    {data.simulation.withTreatment.frames.length > 0 && (
                      <div className="aspect-square relative rounded-xl overflow-hidden mb-4 bg-gray-100">
                        {/* F-11: only render the image as a "photo" when it's a real face simulation.
                            For data-projection frames, fall through to the score-card UI below. */}
                        {data.simulation.withTreatment.frames[
                          data.simulation.withTreatment.frames.length - 1
                        ].imageDataUrl &&
                        data.simulation.withTreatment.frames[
                          data.simulation.withTreatment.frames.length - 1
                        ].kind === 'photo-simulation' ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={
                              data.simulation.withTreatment.frames[
                                data.simulation.withTreatment.frames.length - 1
                              ].imageDataUrl
                            }
                            alt="Projected result with treatment"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-6"
                            style={{ background: `linear-gradient(135deg, ${COLORS.navy}08 0%, ${COLORS.gold}12 100%)` }}>
                            {(() => {
                              const frames = data.simulation.withTreatment.frames;
                              const first = frames[0];
                              const last = frames[frames.length - 1];
                              return (
                                <>
                                  <div className="text-center mb-4">
                                    <p className="text-xs font-bold tracking-[0.2em] uppercase mb-1" style={{ color: COLORS.gold }}>
                                      Projected at {last.timepoint}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-6">
                                    <div className="text-center">
                                      <div className="w-20 h-20 rounded-full flex items-center justify-center mb-2"
                                        style={{ backgroundColor: `${COLORS.gold}18`, border: `2px solid ${COLORS.gold}` }}>
                                        <span className="text-2xl font-bold" style={{ color: COLORS.gold }}>{last.auraScoreProjection}</span>
                                      </div>
                                      <p className="text-[10px] font-bold tracking-wider uppercase" style={{ color: `${COLORS.navy}60` }}>Aura Score</p>
                                      <p className="text-xs font-semibold" style={{ color: '#22C55E' }}>
                                        +{last.auraScoreProjection - first.auraScoreProjection} pts
                                      </p>
                                    </div>
                                    <div className="text-center">
                                      <div className="w-20 h-20 rounded-full flex items-center justify-center mb-2"
                                        style={{ backgroundColor: `${COLORS.navy}08`, border: `2px solid ${COLORS.navy}30` }}>
                                        <span className="text-2xl font-bold" style={{ color: COLORS.navy }}>{last.skinAgeProjection}</span>
                                      </div>
                                      <p className="text-[10px] font-bold tracking-wider uppercase" style={{ color: `${COLORS.navy}60` }}>Skin Age</p>
                                      <p className="text-xs font-semibold" style={{ color: '#22C55E' }}>
                                        {last.skinAgeProjection - first.skinAgeProjection} yrs
                                      </p>
                                    </div>
                                  </div>
                                  <p className="text-xs mt-4 text-center" style={{ color: `${COLORS.navy}50` }}>
                                    {last.description}
                                  </p>
                                </>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    )}
                    <p className="text-sm leading-relaxed" style={{ color: `${COLORS.navy}70` }}>
                      {data.simulation.withTreatment.narrative}
                    </p>
                  </div>
                </div>

                {/* Without Treatment */}
                <div
                  className="rounded-2xl overflow-hidden luxury-card"
                  style={{
                    backgroundColor: COLORS.white,
                    border: `1px solid ${COLORS.divider}`,
                  }}
                >
                  <div
                    className="px-5 py-3 text-center text-sm font-bold tracking-wide"
                    style={{ backgroundColor: '#F4433610', color: '#EF5350' }}
                  >
                    Without Treatment
                  </div>
                  <div className="p-5">
                    {data.simulation.withoutTreatment.frames.length > 0 && (
                      <div className="aspect-square relative rounded-xl overflow-hidden mb-4 bg-gray-100">
                        {data.simulation.withoutTreatment.frames[
                          data.simulation.withoutTreatment.frames.length - 1
                        ].imageDataUrl &&
                        data.simulation.withoutTreatment.frames[
                          data.simulation.withoutTreatment.frames.length - 1
                        ].kind === 'photo-simulation' ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={
                              data.simulation.withoutTreatment.frames[
                                data.simulation.withoutTreatment.frames.length - 1
                              ].imageDataUrl
                            }
                            alt="Projected result without treatment"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-6"
                            style={{ background: `linear-gradient(135deg, #EF535008 0%, #FF980012 100%)` }}>
                            {(() => {
                              const frames = data.simulation.withoutTreatment.frames;
                              const first = frames[0];
                              const last = frames[frames.length - 1];
                              return (
                                <>
                                  <div className="text-center mb-4">
                                    <p className="text-xs font-bold tracking-[0.2em] uppercase mb-1" style={{ color: '#EF5350' }}>
                                      Projected at {last.timepoint}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-6">
                                    <div className="text-center">
                                      <div className="w-20 h-20 rounded-full flex items-center justify-center mb-2"
                                        style={{ backgroundColor: '#EF535012', border: '2px solid #EF5350' }}>
                                        <span className="text-2xl font-bold" style={{ color: '#EF5350' }}>{last.auraScoreProjection}</span>
                                      </div>
                                      <p className="text-[10px] font-bold tracking-wider uppercase" style={{ color: `${COLORS.navy}60` }}>Aura Score</p>
                                      <p className="text-xs font-semibold" style={{ color: '#EF5350' }}>
                                        {last.auraScoreProjection - first.auraScoreProjection} pts
                                      </p>
                                    </div>
                                    <div className="text-center">
                                      <div className="w-20 h-20 rounded-full flex items-center justify-center mb-2"
                                        style={{ backgroundColor: '#FF980012', border: '2px solid #FF9800' }}>
                                        <span className="text-2xl font-bold" style={{ color: '#FF9800' }}>{last.skinAgeProjection}</span>
                                      </div>
                                      <p className="text-[10px] font-bold tracking-wider uppercase" style={{ color: `${COLORS.navy}60` }}>Skin Age</p>
                                      <p className="text-xs font-semibold" style={{ color: '#EF5350' }}>
                                        +{last.skinAgeProjection - first.skinAgeProjection} yrs
                                      </p>
                                    </div>
                                  </div>
                                  <p className="text-xs mt-4 text-center" style={{ color: `${COLORS.navy}50` }}>
                                    {last.description}
                                  </p>
                                </>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    )}
                    <p className="text-sm leading-relaxed" style={{ color: `${COLORS.navy}70` }}>
                      {data.simulation.withoutTreatment.narrative}
                    </p>
                  </div>
                </div>
              </div>

              {/* Key differentiators */}
              {data.simulation.comparison.keyDifferentiators.length > 0 && (
                <div
                  className="rounded-2xl p-6 text-center"
                  style={{
                    backgroundColor: COLORS.white,
                    border: `1px solid ${COLORS.divider}`,
                  }}
                >
                  <div className="flex items-center justify-center gap-8 flex-wrap">
                    <div>
                      <p className="text-3xl font-bold" style={{ fontFamily: 'var(--font-heading), Playfair Display, serif', color: '#4CAF50' }}>
                        +{data.simulation.comparison.auraScoreDelta}
                      </p>
                      <p className="text-xs mt-1" style={{ color: `${COLORS.navy}50` }}>
                        Aura Score improvement
                      </p>
                    </div>
                    <div
                      className="w-px h-10"
                      style={{ backgroundColor: COLORS.divider }}
                    />
                    <div>
                      <p className="text-3xl font-bold" style={{ fontFamily: 'var(--font-heading), Playfair Display, serif', color: '#4CAF50' }}>
                        -{Math.abs(data.simulation.comparison.skinAgeDelta)}
                      </p>
                      <p className="text-xs mt-1" style={{ color: `${COLORS.navy}50` }}>
                        Years off skin age
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2 mt-5">
                    {data.simulation.comparison.keyDifferentiators.map((diff, i) => (
                      <span
                        key={i}
                        className="text-xs px-3 py-1.5 rounded-full"
                        style={{
                          backgroundColor: `${COLORS.gold}10`,
                          color: COLORS.gold,
                        }}
                      >
                        {diff}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Section>
      )}

      {/* ────────────────── SECTION 7: READY TO BEGIN ────────────────── */}
      <section
        className="relative overflow-hidden patient-hero-gradient"
      >
        <div
          className="absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full opacity-[0.04]"
          style={{
            background: `radial-gradient(circle, ${COLORS.gold} 0%, transparent 70%)`,
          }}
        />

        <div className="relative max-w-3xl mx-auto px-6 py-20 md:py-28 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <p
              className="text-xs font-bold tracking-[0.25em] uppercase mb-4"
              style={{ color: COLORS.gold }}
            >
              Ready to Begin?
            </p>
            <div className="gold-separator mb-5" />
            <h2
              className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 leading-tight font-heading"
              style={{
                color: COLORS.white,
              }}
            >
              Your Transformation
              <br />
              Starts Today
            </h2>
            <p className="text-sm mb-10 max-w-md mx-auto leading-relaxed" style={{ color: `${COLORS.white}60` }}>
              Our team is ready to help you begin your journey to exceptional skin.
              Schedule your first treatment or reach out with any questions.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <a
                href="https://app.mangomint.com/876418/booking"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-4 min-h-[48px] rounded-xl text-sm font-bold tracking-wide transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
                style={{
                  backgroundColor: COLORS.gold,
                  color: COLORS.white,
                }}
              >
                Schedule Your First Treatment
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
              <a
                href="tel:+14255394440"
                className="inline-flex items-center gap-2 px-8 py-4 min-h-[48px] rounded-xl text-sm font-bold tracking-wide transition-all duration-300 hover:bg-white/5"
                style={{
                  backgroundColor: 'transparent',
                  color: COLORS.white,
                  border: `1px solid ${COLORS.white}25`,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M22 16.92V19.92C22 20.48 21.56 20.93 21 20.97C20.76 20.99 20.52 21 20.28 21C10.78 21 3 13.22 3 3.72C3 3.48 3.01 3.24 3.03 3C3.07 2.44 3.52 2 4.08 2H7.08C7.58 2 8.01 2.37 8.08 2.86C8.14 3.33 8.25 3.78 8.41 4.22C8.56 4.62 8.45 5.07 8.14 5.36L6.69 6.81C8.35 9.79 10.81 12.25 13.79 13.91L15.24 12.46C15.53 12.17 15.97 12.06 16.38 12.21C16.82 12.37 17.28 12.48 17.74 12.54C18.24 12.61 18.61 13.04 18.61 13.54V16.54C18.61 16.54 22 16.92 22 16.92Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                I Have Questions
              </a>
            </div>

            {/* Contact Info */}
            <div className="space-y-2 text-sm" style={{ color: `${COLORS.white}50` }}>
              <p className="font-bold tracking-wide" style={{ color: COLORS.gold }}>
                Rani Beauty Clinic
              </p>
              <p>401 Olympia Ave NE, Suite 101, Renton, WA 98056</p>
              <p>
                <a href="tel:+14255394440" className="hover:underline">(425) 539-4440</a>
                {' '}&middot;{' '}
                <a href="mailto:info@ranibeautyclinic.com" className="hover:underline">info@ranibeautyclinic.com</a>
              </p>
              <p>Mon&ndash;Fri 9 AM &ndash; 6 PM &middot; Sat 10 AM &ndash; 4 PM</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ────────────────── FOOTER ────────────────── */}
      <footer
        className="text-center py-10 px-6"
        style={{ backgroundColor: COLORS.navy }}
      >
        <div className="gold-separator mb-6" style={{ opacity: 0.3 }} />
        <p
          className="text-lg font-bold tracking-[0.2em] mb-4"
          style={{ fontFamily: 'var(--font-heading), Playfair Display, serif', color: `${COLORS.gold}40` }}
        >
          RANI
        </p>
        <p className="text-xs tracking-widest uppercase mb-3" style={{ color: `${COLORS.gold}40` }}>
          Physician-Supervised Aesthetic Medicine
        </p>
        <p className="text-xs leading-relaxed" style={{ color: `${COLORS.white}20` }}>
          This plan was prepared exclusively for {data.patientName}.
          <br />
          Results may vary. This is a projected treatment plan and not a guarantee of outcomes.
          <br />
          &copy; {new Date().getFullYear()} Rani Beauty Clinic. All rights reserved.
        </p>
      </footer>

      {/* ────────────────── INTEREST MODAL ────────────────── */}
      <InterestModal
        isOpen={modalOpen}
        selectedTier={selectedTier}
        token={token}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
