'use client';

import { useEffect, useState } from 'react';
import { Calendar, Sparkles, Star, Users, ExternalLink, MessageSquare } from 'lucide-react';
import AppointmentCard, { type PortalAppointment } from '@/components/portal/AppointmentCard';
import LoyaltyCard from '@/components/portal/LoyaltyCard';
import PlanProgress, { type TreatmentPlan } from '@/components/portal/PlanProgress';
import type { LoyaltyTier } from '@/lib/loyalty/engine';

interface PatientSession {
  id: string;
  email: string;
  name: string;
}

interface PortalHomeData {
  patient: PatientSession;
  nextAppointment: PortalAppointment | null;
  activePlan: TreatmentPlan | null;
  loyalty: {
    tier: LoyaltyTier;
    pointsBalance: number;
    tierProgress: number;
    nextTier: LoyaltyTier | null;
    pointsToNextTier: number;
  };
  referralCount: number;
}

const MANGOMINT_BOOKING_URL = 'https://ranibeautyclinic.mangomint.com';

export default function PortalHomePage() {
  const [data, setData] = useState<PortalHomeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [meRes, apptRes, planRes, loyaltyRes, refRes] = await Promise.all([
          fetch('/api/patient/auth/me'),
          fetch('/api/patient/appointments?limit=1&upcoming=true'),
          fetch('/api/patient/plan'),
          fetch('/api/patient/loyalty'),
          fetch('/api/patient/referrals'),
        ]);

        const me = await meRes.json();
        const appts = await apptRes.json();
        const plan = await planRes.json();
        const loyalty = await loyaltyRes.json();
        const referrals = await refRes.json();

        setData({
          patient: me.patient,
          nextAppointment: appts.upcoming?.[0] || null,
          activePlan: plan.activePlan || null,
          loyalty: loyalty.account || {
            tier: 'Silver' as LoyaltyTier,
            pointsBalance: 0,
            tierProgress: 0,
            nextTier: 'Gold' as LoyaltyTier,
            pointsToNextTier: 2000,
          },
          referralCount: referrals.stats?.completed || 0,
        });
      } catch (error) {
        console.error('Failed to load portal data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return <PortalHomeSkeleton />;
  }

  const firstName = data?.patient?.name?.split(' ')[0] || 'there';

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl text-rani-navy">
          Welcome back, {firstName}
        </h1>
        <p className="text-sm text-rani-muted mt-1">
          Here&apos;s your beauty journey at a glance.
        </p>
      </div>

      {/* Top row: Next appointment + Loyalty */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Next appointment */}
        <div>
          <h2 className="text-xs font-medium text-rani-muted uppercase tracking-wider mb-3">
            Next Appointment
          </h2>
          {data?.nextAppointment ? (
            <AppointmentCard appointment={data.nextAppointment} variant="upcoming" />
          ) : (
            <div className="rounded-2xl border border-dashed border-rani-border bg-white/50 p-6 text-center">
              <Calendar className="mx-auto h-8 w-8 text-rani-muted/30" />
              <p className="mt-3 text-sm text-rani-muted">No upcoming appointments</p>
              <a
                href={MANGOMINT_BOOKING_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-rani-navy hover:text-rani-gold transition-colors"
              >
                Book now
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          )}
        </div>

        {/* Loyalty card */}
        <div>
          <h2 className="text-xs font-medium text-rani-muted uppercase tracking-wider mb-3">
            Loyalty Rewards
          </h2>
          {data?.loyalty && (
            <a href="/portal/loyalty" className="block">
              <LoyaltyCard
                patientName={data.patient?.name || ''}
                tier={data.loyalty.tier}
                pointsBalance={data.loyalty.pointsBalance}
                tierProgress={data.loyalty.tierProgress}
                nextTier={data.loyalty.nextTier}
                pointsToNextTier={data.loyalty.pointsToNextTier}
                compact
              />
            </a>
          )}
        </div>
      </div>

      {/* Treatment plan progress */}
      {data?.activePlan && (
        <div>
          <h2 className="text-xs font-medium text-rani-muted uppercase tracking-wider mb-3">
            Treatment Plan Progress
          </h2>
          <a href="/portal/plan" className="block">
            <PlanProgress plan={data.activePlan} compact />
          </a>
        </div>
      )}

      {/* Quick actions */}
      <div>
        <h2 className="text-xs font-medium text-rani-muted uppercase tracking-wider mb-3">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <QuickAction
            href={MANGOMINT_BOOKING_URL}
            icon={Calendar}
            label="Book"
            sublabel="New appointment"
            external
          />
          <QuickAction
            href="/portal/referrals"
            icon={Users}
            label="Refer"
            sublabel="Earn $50"
          />
          <QuickAction
            href="/portal/loyalty"
            icon={Star}
            label="Rewards"
            sublabel={`${data?.loyalty?.pointsBalance || 0} pts`}
          />
          <QuickAction
            href="https://g.page/r/CYgSsKdNaF8vEBM/review"
            icon={MessageSquare}
            label="Review"
            sublabel="Earn 100 pts"
            external
          />
        </div>
      </div>
    </div>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
  sublabel,
  external,
}: {
  href: string;
  icon: typeof Calendar;
  label: string;
  sublabel: string;
  external?: boolean;
}) {
  const Tag = external ? 'a' : 'a';
  return (
    <Tag
      href={href}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className="group rounded-2xl border border-rani-border bg-white p-4 text-center hover:border-rani-gold/40 hover:shadow-sm transition-all"
    >
      <div className="mx-auto h-10 w-10 rounded-full bg-rani-cream flex items-center justify-center group-hover:bg-rani-gold/10 transition-colors">
        <Icon className="h-5 w-5 text-rani-navy group-hover:text-rani-gold transition-colors" />
      </div>
      <p className="mt-2 text-sm font-medium text-rani-navy">{label}</p>
      <p className="text-[11px] text-rani-muted">{sublabel}</p>
    </Tag>
  );
}

function PortalHomeSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-8 w-64 bg-gray-200 rounded-lg" />
        <div className="h-4 w-48 bg-gray-100 rounded mt-2" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-40 bg-gray-100 rounded-2xl" />
        <div className="h-40 bg-gray-100 rounded-2xl" />
      </div>
      <div className="h-24 bg-gray-100 rounded-2xl" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
