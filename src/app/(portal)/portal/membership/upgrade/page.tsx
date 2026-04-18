'use client';

import { useState, useEffect } from 'react';
import { Crown, Check, Phone, Sparkles } from 'lucide-react';
import { clinicInfo } from '@/data/clinic-info';

interface Membership {
  tier: string | null;
  status: string;
}

const TIERS = [
  {
    name: 'Glow',
    price: 99,
    description: 'Perfect for maintaining your natural radiance with monthly essentials.',
    benefits: [
      '1 HydraFacial per month',
      '10% off all add-on treatments',
      'Complimentary skincare consultation',
      'Priority booking access',
      'Birthday month bonus treatment',
    ],
  },
  {
    name: 'Radiance',
    price: 199,
    popular: true,
    description: 'Our most popular plan for those committed to visible transformation.',
    benefits: [
      '1 HydraFacial + 1 chemical peel per month',
      '15% off all additional treatments',
      'Complimentary skincare consultation',
      'Priority booking access',
      'Birthday month bonus treatment',
      'Complimentary wellness injection monthly',
      'Exclusive member events',
    ],
  },
  {
    name: 'Elite',
    price: 349,
    description: 'The ultimate beauty membership for our most discerning clients.',
    benefits: [
      '2 premium treatments per month',
      '20% off all additional treatments',
      'Personal beauty concierge',
      'VIP priority booking',
      'Birthday month bonus treatment',
      'Complimentary wellness injection monthly',
      'Exclusive VIP events + product previews',
      'Complimentary annual Sofwave session',
      'Guest pass (1 per quarter)',
    ],
  },
];

export default function MembershipUpgradePage() {
  const [currentMembership, setCurrentMembership] = useState<Membership | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMembership() {
      try {
        const res = await fetch('/api/patient/membership');
        if (!res.ok) throw new Error('Failed to load membership');
        const data = await res.json();
        setCurrentMembership(data.membership ?? null);
      } catch {
        // Proceed without current membership data
      } finally {
        setLoading(false);
      }
    }
    fetchMembership();
  }, []);

  const currentTierIndex = currentMembership?.tier
    ? TIERS.findIndex((t) => t.name === currentMembership.tier)
    : -1;

  if (loading) {
    return (
      <div className="min-h-screen bg-rani-cream p-6 md:p-10">
        <div className="mx-auto max-w-5xl space-y-8">
          <div className="h-8 w-64 animate-pulse rounded bg-rani-navy/10" />
          <div className="grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 animate-pulse rounded-2xl bg-rani-navy/10" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-rani-cream p-6 md:p-10">
      <div className="mx-auto max-w-5xl space-y-10">
        {/* Header */}
        <div className="text-center">
          <Crown className="mx-auto mb-3 h-8 w-8 text-rani-gold-accessible" />
          <h1 className="font-serif text-3xl font-bold text-rani-navy">
            Membership Plans
          </h1>
          <p className="mx-auto mt-2 max-w-lg text-rani-navy/60">
            Unlock exclusive benefits, priority access, and savings on the treatments you love.
          </p>
        </div>

        {/* Tier Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          {TIERS.map((tier, idx) => {
            const isCurrent = idx === currentTierIndex;
            const isUpgrade = idx > currentTierIndex;
            const isDowngrade = currentTierIndex >= 0 && idx < currentTierIndex;

            return (
              <div
                key={tier.name}
                className={`relative flex flex-col rounded-2xl border-2 bg-white shadow-sm transition-shadow hover:shadow-md ${
                  tier.popular
                    ? 'border-rani-gold ring-2 ring-rani-gold/20'
                    : isCurrent
                    ? 'border-rani-navy ring-2 ring-rani-navy/20'
                    : 'border-rani-navy/10'
                }`}
              >
                {/* Badge */}
                {tier.popular && !isCurrent && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-rani-gold px-4 py-0.5 text-xs font-semibold text-white">
                    Most Popular
                  </span>
                )}
                {isCurrent && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-rani-navy px-4 py-0.5 text-xs font-semibold text-white">
                    Current Plan
                  </span>
                )}

                <div className="flex flex-1 flex-col p-6">
                  {/* Name & Price */}
                  <div className="mb-4">
                    <h2 className="text-xl font-bold text-rani-navy">{tier.name}</h2>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-rani-navy">${tier.price}</span>
                      <span className="text-sm text-rani-navy/50">/month</span>
                    </div>
                    <p className="mt-2 text-sm text-rani-navy/60">{tier.description}</p>
                  </div>

                  {/* Benefits */}
                  <ul className="flex-1 space-y-2.5">
                    {tier.benefits.map((benefit) => (
                      <li key={benefit} className="flex items-start gap-2 text-sm text-rani-navy/80">
                        <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-rani-gold" />
                        {benefit}
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <div className="mt-6">
                    {isCurrent ? (
                      <div className="flex items-center justify-center gap-2 rounded-xl bg-rani-navy/5 py-3 text-sm font-medium text-rani-navy">
                        <Sparkles className="h-4 w-4" />
                        Your Current Plan
                      </div>
                    ) : isUpgrade || currentTierIndex === -1 ? (
                      <a
                        href={clinicInfo.phoneTel}
                        className="flex items-center justify-center gap-2 rounded-xl bg-rani-navy py-3 text-sm font-semibold text-white transition-colors hover:bg-rani-navy/90"
                      >
                        <Phone className="h-4 w-4" />
                        {currentTierIndex === -1 ? 'Get Started' : 'Upgrade Now'}
                      </a>
                    ) : isDowngrade ? (
                      <div className="flex items-center justify-center rounded-xl border border-rani-navy/10 py-3 text-sm text-rani-navy/40">
                        Included in your plan
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Contact CTA */}
        <section className="rounded-2xl border border-rani-gold/20 bg-rani-gold/5 p-6 text-center">
          <h3 className="font-serif text-lg font-semibold text-rani-navy">
            Questions about memberships?
          </h3>
          <p className="mt-1 text-sm text-rani-navy/60">
            Our team is happy to help you find the perfect plan for your beauty goals.
          </p>
          <a
            href={clinicInfo.phoneTel}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-rani-navy px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-rani-navy/90"
          >
            <Phone className="h-4 w-4" />
            Call Us: {clinicInfo.phone}
          </a>
        </section>
      </div>
    </div>
  );
}
