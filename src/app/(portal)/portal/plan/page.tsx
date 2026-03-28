'use client';

import { useEffect, useState } from 'react';
import {
  Sparkles,
  Calendar,
  CreditCard,
  Shield,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Crown,
  Star,
  Gem,
  CheckCircle2,
  Clock,
  DollarSign,
  ExternalLink,
  Loader2,
  FileText,
} from 'lucide-react';
import PlanProgress, { type TreatmentPlan } from '@/components/portal/PlanProgress';
import PhotoSimulation from '@/components/photo-simulation/PhotoSimulation';
import { clinicInfo } from '@/data/clinic-info';

interface PlanDetails {
  planName: string;
  planTier: string;
  planValue: number;
  servicesIncluded: string;
  status: string;
  createdDate: string;
}

interface PackageTier {
  tier: string;
  name: string;
  price: number;
  sessions: number;
  discount: string;
}

interface PlanResponse {
  activePlan: TreatmentPlan | null;
  planDetails: PlanDetails | null;
  packages: PackageTier[];
}

interface ServicePhase {
  phase: number;
  name: string;
  services: string[];
  duration: string;
  description?: string;
}

const tierIcons: Record<string, React.ReactNode> = {
  Essential: <Star className="w-5 h-5" />,
  Recommended: <Crown className="w-5 h-5" />,
  Platinum: <Gem className="w-5 h-5" />,
};

const tierAccents: Record<string, string> = {
  Essential: 'border-rani-border',
  Recommended: 'border-rani-gold ring-1 ring-rani-gold/20',
  Platinum: 'border-rani-gold ring-2 ring-rani-gold/30',
};

export default function PlanPage() {
  const [data, setData] = useState<PlanResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSimulation, setShowSimulation] = useState(false);
  const [expandedPhase, setExpandedPhase] = useState<number | null>(0);

  useEffect(() => {
    async function fetchPlan() {
      try {
        const res = await fetch('/api/patient/plan');
        if (!res.ok) throw new Error('Failed to load treatment plan');
        const json: PlanResponse = await res.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    }
    fetchPlan();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 text-rani-gold animate-spin" />
        <p className="font-body text-rani-muted text-sm">Loading your treatment plan...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
          <FileText className="w-6 h-6 text-red-400" />
        </div>
        <p className="font-body text-rani-navy text-sm">{error}</p>
      </div>
    );
  }

  if (!data?.activePlan && !data?.planDetails) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-rani-cream flex items-center justify-center">
          <Sparkles className="w-7 h-7 text-rani-gold" />
        </div>
        <div>
          <h2 className="font-heading text-2xl text-rani-navy mb-2">
            No Active Treatment Plan
          </h2>
          <p className="font-body text-rani-muted text-sm max-w-md">
            Your personalized treatment journey starts with a consultation. Let our team design a
            plan tailored to your unique goals.
          </p>
        </div>
        <a
          href={clinicInfo.booking.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-rani-navy text-white font-body text-sm font-medium px-6 py-3 rounded-lg hover:bg-rani-navy/90 transition-colors"
        >
          Book a Consultation
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    );
  }

  const phases: ServicePhase[] = (() => {
    if (!data.planDetails?.servicesIncluded) return [];
    try {
      return JSON.parse(data.planDetails.servicesIncluded);
    } catch {
      return [];
    }
  })();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-10">
      {/* Header */}
      <div>
        <h1 className="font-heading text-3xl sm:text-4xl text-rani-navy mb-2">
          Your Treatment Plan
        </h1>
        {data.planDetails && (
          <div className="flex flex-wrap items-center gap-3 font-body text-sm text-rani-muted">
            <span className="inline-flex items-center gap-1.5 bg-rani-cream text-rani-navy px-3 py-1 rounded-full text-xs font-medium">
              <Crown className="w-3.5 h-3.5 text-rani-gold" />
              {data.planDetails.planTier}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Started {new Date(data.planDetails.createdDate).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
        )}
      </div>

      {/* Plan Progress */}
      {data.activePlan && (
        <section>
          <PlanProgress plan={data.activePlan} />
        </section>
      )}

      {/* Photo Simulation Toggle */}
      <section className="bg-white rounded-xl border border-rani-border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-xl text-rani-navy mb-1">Photo Simulation</h2>
            <p className="font-body text-sm text-rani-muted">
              Visualize your projected results based on your treatment plan.
            </p>
          </div>
          <button
            onClick={() => setShowSimulation(!showSimulation)}
            className="font-body text-sm font-medium text-rani-gold hover:text-rani-gold/80 transition-colors flex items-center gap-1"
          >
            {showSimulation ? 'Hide' : 'View Simulation'}
            {showSimulation ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
        {showSimulation && (
          <div className="mt-6 border-t border-rani-border pt-6">
            <PhotoSimulation mode="full" />
          </div>
        )}
      </section>

      {/* Treatment Phases */}
      {phases.length > 0 && (
        <section>
          <h2 className="font-heading text-2xl text-rani-navy mb-5">Treatment Phases</h2>
          <div className="space-y-3">
            {phases.map((phase, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl border border-rani-border overflow-hidden"
              >
                <button
                  onClick={() => setExpandedPhase(expandedPhase === idx ? null : idx)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-rani-cream flex items-center justify-center font-body text-sm font-semibold text-rani-navy">
                      {phase.phase}
                    </div>
                    <div>
                      <h3 className="font-heading text-lg text-rani-navy">{phase.name}</h3>
                      <p className="font-body text-xs text-rani-muted flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {phase.duration}
                      </p>
                    </div>
                  </div>
                  {expandedPhase === idx ? (
                    <ChevronUp className="w-5 h-5 text-rani-muted" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-rani-muted" />
                  )}
                </button>
                {expandedPhase === idx && (
                  <div className="px-6 pb-5 border-t border-rani-border pt-4">
                    {phase.description && (
                      <p className="font-body text-sm text-rani-muted mb-3">{phase.description}</p>
                    )}
                    <ul className="space-y-2">
                      {phase.services.map((service, sIdx) => (
                        <li
                          key={sIdx}
                          className="flex items-center gap-2 font-body text-sm text-rani-navy"
                        >
                          <CheckCircle2 className="w-4 h-4 text-rani-gold flex-shrink-0" />
                          {service}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Package Comparison */}
      {data.packages && data.packages.length > 0 && (
        <section>
          <h2 className="font-heading text-2xl text-rani-navy mb-2">Package Options</h2>
          <p className="font-body text-sm text-rani-muted mb-6">
            Choose the package that aligns with your goals and budget.
          </p>
          <div className="grid sm:grid-cols-3 gap-4">
            {data.packages.map((pkg) => {
              const isRecommended = pkg.tier === 'Recommended';
              return (
                <div
                  key={pkg.tier}
                  className={`relative bg-white rounded-xl border-2 p-6 flex flex-col ${
                    tierAccents[pkg.tier] || 'border-rani-border'
                  }`}
                >
                  {isRecommended && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-rani-gold text-white font-body text-xs font-semibold px-3 py-1 rounded-full">
                      Most Popular
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-3 text-rani-navy">
                    {tierIcons[pkg.tier] || <Star className="w-5 h-5" />}
                    <h3 className="font-heading text-lg">{pkg.name}</h3>
                  </div>
                  <div className="mb-4">
                    <span className="font-heading text-3xl text-rani-navy">
                      ${pkg.price.toLocaleString()}
                    </span>
                  </div>
                  <ul className="space-y-2 mb-6 flex-1">
                    <li className="flex items-center gap-2 font-body text-sm text-rani-navy">
                      <CheckCircle2 className="w-4 h-4 text-rani-gold flex-shrink-0" />
                      {pkg.sessions} sessions included
                    </li>
                    {pkg.discount && (
                      <li className="flex items-center gap-2 font-body text-sm text-rani-navy">
                        <CheckCircle2 className="w-4 h-4 text-rani-gold flex-shrink-0" />
                        {pkg.discount} savings
                      </li>
                    )}
                  </ul>
                  <a
                    href={clinicInfo.booking.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`block text-center font-body text-sm font-medium py-2.5 rounded-lg transition-colors ${
                      isRecommended
                        ? 'bg-rani-navy text-white hover:bg-rani-navy/90'
                        : 'bg-rani-cream text-rani-navy hover:bg-rani-cream/70'
                    }`}
                  >
                    Select Package
                  </a>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Financing */}
      <section className="bg-white rounded-xl border border-rani-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-rani-cream flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-rani-gold" />
          </div>
          <div>
            <h2 className="font-heading text-xl text-rani-navy">Flexible Financing</h2>
            <p className="font-body text-sm text-rani-muted">
              Make your treatment plan affordable with monthly payments.
            </p>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4 mb-5">
          <a
            href={clinicInfo.financing.cherry.applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between bg-rani-cream rounded-lg px-5 py-4 group hover:ring-1 hover:ring-rani-gold/30 transition-all"
          >
            <div>
              <p className="font-body text-sm font-semibold text-rani-navy">Cherry</p>
              <p className="font-body text-xs text-rani-muted">0% APR options available</p>
            </div>
            <ExternalLink className="w-4 h-4 text-rani-muted group-hover:text-rani-gold transition-colors" />
          </a>
          <a
            href={clinicInfo.financing.patientfi.applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between bg-rani-cream rounded-lg px-5 py-4 group hover:ring-1 hover:ring-rani-gold/30 transition-all"
          >
            <div>
              <p className="font-body text-sm font-semibold text-rani-navy">PatientFi</p>
              <p className="font-body text-xs text-rani-muted">Flexible payment plans</p>
            </div>
            <ExternalLink className="w-4 h-4 text-rani-muted group-hover:text-rani-gold transition-colors" />
          </a>
        </div>
        <div className="flex items-center gap-2 bg-green-50 rounded-lg px-4 py-3">
          <Shield className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="font-body text-sm text-green-800">
            <span className="font-semibold">HSA / FSA Accepted</span> — Use your pre-tax health
            savings for eligible treatments.
          </p>
        </div>
      </section>

      {/* Book Next Treatment CTA */}
      <section className="bg-rani-navy rounded-xl p-8 text-center">
        <Sparkles className="w-8 h-8 text-rani-gold mx-auto mb-4" />
        <h2 className="font-heading text-2xl text-white mb-2">Ready for Your Next Session?</h2>
        <p className="font-body text-sm text-white/70 mb-6 max-w-md mx-auto">
          Stay on track with your treatment plan. Book your next appointment and continue your
          transformation journey.
        </p>
        <a
          href={clinicInfo.booking.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-rani-gold text-white font-body text-sm font-semibold px-8 py-3 rounded-lg hover:bg-rani-gold/90 transition-colors"
        >
          Book Next Treatment
          <ArrowRight className="w-4 h-4" />
        </a>
      </section>
    </div>
  );
}
