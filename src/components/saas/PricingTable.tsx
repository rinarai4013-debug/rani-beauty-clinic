'use client';

import { useState } from 'react';

interface PricingTier {
  name: string;
  slug: string;
  price: number;
  description: string;
  highlight?: boolean;
  badge?: string;
  features: string[];
  limits: {
    aiCalls: string;
    smsCredits: string;
    teamMembers: string;
    integrations: string;
  };
  cta: string;
}

interface PricingTableProps {
  onSelect?: (_tier: string) => void;
  annual?: boolean;
}

const tiers: PricingTier[] = [
  {
    name: 'Starter',
    slug: 'starter',
    price: 199,
    description: 'Essential AI tools for solo practitioners and small clinics getting started with automation.',
    features: [
      'AI Intake Intelligence',
      'Smart appointment scheduling',
      'Automated follow-up sequences',
      'Client CRM with lead tracking',
      'Basic KPI dashboard',
      'Google review monitoring',
      'Email support',
    ],
    limits: {
      aiCalls: '1,000/mo',
      smsCredits: '500/mo',
      teamMembers: 'Up to 3',
      integrations: '2 integrations',
    },
    cta: 'Start Free Trial',
  },
  {
    name: 'Growth',
    slug: 'growth',
    price: 499,
    description: 'Full AI operations suite for growing medspas ready to scale with intelligent automation.',
    highlight: true,
    badge: 'Most Popular',
    features: [
      'Everything in Starter, plus:',
      'All 8 AI prediction engines',
      'Dynamic pricing intelligence',
      'P&L financial intelligence',
      'Schedule optimizer',
      'Meta Ads AI manager',
      'AI consult co-pilot',
      'Social media content engine',
      'Inventory auto-management',
      'Custom branded client portal',
      'Priority support + onboarding',
    ],
    limits: {
      aiCalls: '10,000/mo',
      smsCredits: '2,000/mo',
      teamMembers: 'Up to 10',
      integrations: '5 integrations',
    },
    cta: 'Start Free Trial',
  },
  {
    name: 'Enterprise',
    slug: 'enterprise',
    price: 999,
    description: 'Unlimited AI power for multi-location operations and high-volume clinics demanding peak performance.',
    features: [
      'Everything in Growth, plus:',
      'AI phone receptionist (Vapi)',
      'RAG knowledge base',
      'Multi-location management',
      'White-label client portal',
      'Custom n8n workflow builder',
      'API access for integrations',
      'Dedicated success manager',
      'Custom AI model training',
      'SLA guarantee (99.9% uptime)',
      'Quarterly business reviews',
    ],
    limits: {
      aiCalls: 'Unlimited',
      smsCredits: '10,000/mo',
      teamMembers: 'Unlimited',
      integrations: 'Unlimited',
    },
    cta: 'Contact Sales',
  },
];

export default function PricingTable({ onSelect, annual: initialAnnual }: PricingTableProps) {
  const [annual, setAnnual] = useState(initialAnnual ?? true);

  const getPrice = (base: number) => (annual ? Math.round(base * 0.8) : base);

  return (
    <div>
      {/* Toggle */}
      <div className="flex items-center justify-center gap-4 mb-10">
        <span className={`text-sm font-medium ${!annual ? 'text-gray-900' : 'text-gray-500'}`}>
          Monthly
        </span>
        <button
          onClick={() => setAnnual(!annual)}
          className={`relative w-14 h-7 rounded-full transition-colors ${
            annual ? 'bg-[#0F1D2C]' : 'bg-gray-300'
          }`}
        >
          <span
            className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
              annual ? 'translate-x-7' : 'translate-x-0.5'
            }`}
          />
        </button>
        <span className={`text-sm font-medium ${annual ? 'text-gray-900' : 'text-gray-500'}`}>
          Annual
        </span>
        {annual && (
          <span className="bg-emerald-100 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full">
            Save 20%
          </span>
        )}
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {tiers.map((tier) => (
          <div
            key={tier.slug}
            className={`relative rounded-2xl p-8 transition-all ${
              tier.highlight
                ? 'bg-[#0F1D2C] text-white ring-2 ring-[#F3D6BE] scale-[1.02] shadow-2xl'
                : 'bg-white text-gray-900 border border-gray-200 shadow-sm hover:shadow-lg'
            }`}
          >
            {tier.badge && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#F3D6BE] text-[#0F1D2C] text-xs font-bold px-4 py-1 rounded-full">
                {tier.badge}
              </span>
            )}

            <div className="mb-6">
              <h3 className={`text-xl font-bold ${tier.highlight ? 'text-[#F3D6BE]' : ''}`}>
                {tier.name}
              </h3>
              <p className={`text-sm mt-2 leading-relaxed ${tier.highlight ? 'text-white/70' : 'text-gray-500'}`}>
                {tier.description}
              </p>
            </div>

            <div className="mb-6">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">${getPrice(tier.price)}</span>
                <span className={`text-sm ${tier.highlight ? 'text-white/60' : 'text-gray-500'}`}>
                  /mo
                </span>
              </div>
              {annual && (
                <p className={`text-xs mt-1 ${tier.highlight ? 'text-white/50' : 'text-gray-400'}`}>
                  Billed annually (${getPrice(tier.price) * 12}/yr)
                </p>
              )}
            </div>

            {/* Limits */}
            <div className={`grid grid-cols-2 gap-2 mb-6 p-3 rounded-xl ${tier.highlight ? 'bg-white/10' : 'bg-gray-50'}`}>
              {Object.entries(tier.limits).map(([key, val]) => (
                <div key={key}>
                  <p className={`text-[10px] uppercase tracking-wider ${tier.highlight ? 'text-white/40' : 'text-gray-400'}`}>
                    {key === 'aiCalls' ? 'AI Calls' : key === 'smsCredits' ? 'SMS' : key === 'teamMembers' ? 'Team' : 'Integrations'}
                  </p>
                  <p className={`text-xs font-semibold ${tier.highlight ? 'text-white/90' : 'text-gray-700'}`}>{val}</p>
                </div>
              ))}
            </div>

            {/* Features */}
            <ul className="space-y-2.5 mb-8">
              {tier.features.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  {f.includes('Everything in') ? (
                    <span className={`text-xs font-semibold ${tier.highlight ? 'text-[#F3D6BE]' : 'text-[#0F1D2C]'}`}>{f}</span>
                  ) : (
                    <>
                      <svg
                        className={`w-4 h-4 mt-0.5 flex-shrink-0 ${tier.highlight ? 'text-[#F3D6BE]' : 'text-emerald-500'}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className={tier.highlight ? 'text-white/80' : 'text-gray-600'}>{f}</span>
                    </>
                  )}
                </li>
              ))}
            </ul>

            <button
              onClick={() => onSelect?.(tier.slug)}
              className={`w-full py-3 rounded-xl text-sm font-bold transition-all ${
                tier.highlight
                  ? 'bg-[#F3D6BE] text-[#0F1D2C] hover:bg-[#F8E5D5] shadow-lg'
                  : 'bg-[#0F1D2C] text-white hover:bg-[#1A2A3C]'
              }`}
            >
              {tier.cta}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
