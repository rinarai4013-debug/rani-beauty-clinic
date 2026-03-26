'use client';

import { useEffect, useState } from 'react';
import { ClipboardList, CreditCard, Crown } from 'lucide-react';
import PlanProgress, { type TreatmentPlan } from '@/components/portal/PlanProgress';

interface PackageInfo {
  name: string;
  totalSessions: number;
  sessionsUsed: number;
  sessionsRemaining: number;
  expiresAt?: string;
}

interface MembershipInfo {
  tier: string;
  monthlyPrice: number;
  status: string;
  startDate: string;
  benefits: string[];
}

interface PlanData {
  activePlan: TreatmentPlan | null;
  packages: PackageInfo[];
  membership: MembershipInfo | null;
  recommendedNext: string[];
}

export default function PlanPage() {
  const [data, setData] = useState<PlanData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/patient/plan');
        const json = await res.json();
        setData(json);
      } catch (e) {
        console.error('Failed to load plan:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-gray-200 rounded-lg" />
        <div className="h-64 bg-gray-100 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl text-rani-navy">Treatment Plan</h1>
        <p className="text-sm text-rani-muted mt-1">
          Your personalized treatment journey and package details.
        </p>
      </div>

      {/* Active plan */}
      {data?.activePlan ? (
        <PlanProgress plan={data.activePlan} />
      ) : (
        <div className="rounded-2xl border border-dashed border-rani-border bg-white/50 p-8 text-center">
          <ClipboardList className="mx-auto h-10 w-10 text-rani-muted/30" />
          <p className="mt-3 text-sm text-rani-muted">No active treatment plan</p>
          <p className="text-xs text-rani-muted/60 mt-1">
            Ask your provider to create a personalized plan during your next visit.
          </p>
        </div>
      )}

      {/* Packages */}
      {data?.packages && data.packages.length > 0 && (
        <section>
          <h2 className="text-xs font-medium text-rani-muted uppercase tracking-wider mb-3">
            Active Packages
          </h2>
          <div className="space-y-3">
            {data.packages.map((pkg, i) => (
              <div
                key={i}
                className="rounded-2xl border border-rani-border bg-white p-5"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-heading text-base text-rani-navy">{pkg.name}</h3>
                    <p className="text-sm text-rani-muted mt-0.5">
                      {pkg.sessionsUsed} of {pkg.totalSessions} sessions completed
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-heading font-bold text-rani-navy">
                      {pkg.sessionsRemaining}
                    </p>
                    <p className="text-[10px] text-rani-muted uppercase">Remaining</p>
                  </div>
                </div>
                <div className="mt-3 h-2 rounded-full bg-rani-cream overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-rani-navy to-rani-gold transition-all"
                    style={{
                      width: `${(pkg.sessionsUsed / pkg.totalSessions) * 100}%`,
                    }}
                  />
                </div>
                {pkg.expiresAt && (
                  <p className="mt-2 text-xs text-rani-muted">
                    Expires {new Date(pkg.expiresAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Membership */}
      {data?.membership && (
        <section>
          <h2 className="text-xs font-medium text-rani-muted uppercase tracking-wider mb-3">
            Membership
          </h2>
          <div className="rounded-2xl bg-gradient-to-br from-rani-navy to-rani-navy-light p-6 text-white">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-rani-gold" />
                  <h3 className="font-heading text-lg font-bold">{data.membership.tier}</h3>
                </div>
                <p className="text-sm text-white/60 mt-1">
                  ${data.membership.monthlyPrice}/month &middot;{' '}
                  <span className={data.membership.status === 'Active' ? 'text-emerald-400' : 'text-yellow-400'}>
                    {data.membership.status}
                  </span>
                </p>
              </div>
              <CreditCard className="h-6 w-6 text-white/30" />
            </div>
            {data.membership.benefits.length > 0 && (
              <ul className="mt-4 space-y-1.5">
                {data.membership.benefits.map((b, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-white/70">
                    <span className="h-1 w-1 rounded-full bg-rani-gold" />
                    {b}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}

      {/* Recommended next */}
      {data?.recommendedNext && data.recommendedNext.length > 0 && (
        <section>
          <h2 className="text-xs font-medium text-rani-muted uppercase tracking-wider mb-3">
            Recommended Next
          </h2>
          <div className="rounded-2xl border border-rani-gold/20 bg-rani-gold/5 p-5">
            <p className="text-sm text-rani-text leading-relaxed">
              Based on your treatment history, your provider recommends:
            </p>
            <ul className="mt-3 space-y-2">
              {data.recommendedNext.map((rec, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-rani-navy font-medium">
                  <span className="h-5 w-5 rounded-full bg-rani-navy text-[10px] text-rani-gold font-bold flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  );
}
