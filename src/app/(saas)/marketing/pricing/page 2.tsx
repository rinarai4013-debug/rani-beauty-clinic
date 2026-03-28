'use client';

import { useState } from 'react';
import Link from 'next/link';

// =============================================================================
// Marketing Pricing Page
// Three tier cards, feature comparison, FAQ accordion, ROI calculator, CTA
// =============================================================================

interface PricingTier {
  name: string;
  slug: string;
  price: number;
  annualPrice: number;
  tagline: string;
  popular: boolean;
  features: string[];
  limits: { label: string; value: string }[];
  cta: string;
}

const tiers: PricingTier[] = [
  {
    name: 'Starter',
    slug: 'starter',
    price: 199,
    annualPrice: 169,
    tagline: 'For solo practitioners and small clinics getting started with AI.',
    popular: false,
    features: [
      'AI Intake Intelligence',
      'Treatment Recommendations',
      'Automated Follow-up Sequences',
      'Review Monitoring and Responses',
      'Basic KPI Dashboard',
      'Client CRM with Lead Tracking',
      'Gamified Operations Dashboard',
      'Email Support',
    ],
    limits: [
      { label: 'Providers', value: 'Up to 3' },
      { label: 'Clients', value: 'Up to 500' },
      { label: 'AI Calls', value: '5,000/mo' },
      { label: 'Integrations', value: '5' },
    ],
    cta: 'Start Free Trial',
  },
  {
    name: 'Pro',
    slug: 'pro',
    price: 499,
    annualPrice: 424,
    tagline: 'For growing practices that want the full AI-powered operations suite.',
    popular: true,
    features: [
      'Everything in Starter, plus:',
      'Churn Prediction Engine',
      'Dynamic Pricing Intelligence',
      'Revenue Anomaly Detection',
      'AI Consult Co-pilot',
      'Schedule Optimizer',
      'Inventory Auto-Management',
      'Social Media Content Engine',
      'P&L Financial Intelligence',
      'Meta Ads AI Manager',
      'Provider Performance Analytics',
      'Custom Branded Client Portal',
      'Priority Support',
      'Onboarding Assistance',
    ],
    limits: [
      { label: 'Providers', value: 'Up to 10' },
      { label: 'Clients', value: 'Up to 5,000' },
      { label: 'AI Calls', value: '25,000/mo' },
      { label: 'Integrations', value: '15' },
    ],
    cta: 'Start Free Trial',
  },
  {
    name: 'Enterprise',
    slug: 'enterprise',
    price: 999,
    annualPrice: 849,
    tagline: 'For multi-location practices and groups requiring full platform control.',
    popular: false,
    features: [
      'Everything in Pro, plus:',
      'RAG Knowledge Base',
      'Custom AI Model Training',
      'AI Phone Receptionist',
      'Custom n8n Workflows',
      'Multi-location Analytics',
      'White-Label Portal',
      'API Access',
      'SLA Guarantee (99.9%)',
      'Dedicated Success Manager',
      'Quarterly Business Reviews',
      'Custom Integrations',
    ],
    limits: [
      { label: 'Providers', value: 'Unlimited' },
      { label: 'Clients', value: 'Unlimited' },
      { label: 'AI Calls', value: '100,000/mo' },
      { label: 'Integrations', value: 'Unlimited' },
    ],
    cta: 'Contact Sales',
  },
];

const comparisonFeatures = [
  { category: 'AI Intelligence', features: [
    { name: 'AI Intake Intelligence', starter: true, pro: true, enterprise: true },
    { name: 'Churn Prediction Engine', starter: false, pro: true, enterprise: true },
    { name: 'Dynamic Pricing Intelligence', starter: false, pro: true, enterprise: true },
    { name: 'Revenue Anomaly Detection', starter: false, pro: true, enterprise: true },
    { name: 'AI Consult Co-pilot', starter: false, pro: true, enterprise: true },
    { name: 'Treatment Recommendations', starter: true, pro: true, enterprise: true },
    { name: 'RAG Knowledge Base', starter: false, pro: false, enterprise: true },
    { name: 'Custom AI Model Training', starter: false, pro: false, enterprise: true },
  ]},
  { category: 'Automation', features: [
    { name: 'Automated Follow-up Sequences', starter: true, pro: true, enterprise: true },
    { name: 'Review Monitoring and Responses', starter: true, pro: true, enterprise: true },
    { name: 'Schedule Optimizer', starter: false, pro: true, enterprise: true },
    { name: 'Inventory Auto-Management', starter: false, pro: true, enterprise: true },
    { name: 'Social Media Content Engine', starter: false, pro: true, enterprise: true },
    { name: 'AI Phone Receptionist', starter: false, pro: false, enterprise: true },
    { name: 'Custom n8n Workflows', starter: false, pro: false, enterprise: true },
  ]},
  { category: 'Analytics and Reporting', features: [
    { name: 'Basic KPI Dashboard', starter: true, pro: true, enterprise: true },
    { name: 'P&L Financial Intelligence', starter: false, pro: true, enterprise: true },
    { name: 'Meta Ads AI Manager', starter: false, pro: true, enterprise: true },
    { name: 'Provider Performance Analytics', starter: false, pro: true, enterprise: true },
    { name: 'Multi-location Analytics', starter: false, pro: false, enterprise: true },
  ]},
  { category: 'Platform', features: [
    { name: 'Client CRM with Lead Tracking', starter: true, pro: true, enterprise: true },
    { name: 'Gamified Operations Dashboard', starter: true, pro: true, enterprise: true },
    { name: 'Custom Branded Client Portal', starter: false, pro: true, enterprise: true },
    { name: 'White-Label Portal', starter: false, pro: false, enterprise: true },
    { name: 'API Access', starter: false, pro: false, enterprise: true },
    { name: 'SLA Guarantee (99.9%)', starter: false, pro: false, enterprise: true },
  ]},
  { category: 'Support', features: [
    { name: 'Email Support', starter: true, pro: true, enterprise: true },
    { name: 'Priority Support', starter: false, pro: true, enterprise: true },
    { name: 'Onboarding Assistance', starter: false, pro: true, enterprise: true },
    { name: 'Dedicated Success Manager', starter: false, pro: false, enterprise: true },
    { name: 'Quarterly Business Reviews', starter: false, pro: false, enterprise: true },
  ]},
];

const faqs = [
  {
    q: 'Can I switch plans at any time?',
    a: 'Yes. Upgrade instantly and get prorated credit for your current billing period. Downgrades take effect at the next billing cycle. No penalties or lock-in contracts.',
  },
  {
    q: 'Is there a setup fee?',
    a: 'No setup fees on any plan. Pro and Enterprise plans include free onboarding, data migration, and a dedicated setup call with our team.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept all major credit cards via Stripe. Enterprise customers can also pay by invoice with Net 30 terms.',
  },
  {
    q: 'Do you offer discounts for multiple locations?',
    a: 'Yes. Multi-location practices get volume discounts starting at 15% off for 3+ locations. Contact sales for custom pricing tailored to your organization.',
  },
  {
    q: 'What happens when my trial ends?',
    a: 'You choose a plan to continue, or your account is paused (not deleted). Your data is preserved for 90 days so you can reactivate anytime without losing anything.',
  },
  {
    q: 'Are there any overage charges?',
    a: 'No surprise bills. If you approach your plan limits, we notify you and recommend an upgrade. We never charge overages without your explicit consent.',
  },
  {
    q: 'How long is the free trial?',
    a: '14 days with full access to all features of your chosen plan. No credit card required to start. You only enter payment info when you decide to continue.',
  },
  {
    q: 'Can I get a custom plan for my needs?',
    a: 'Absolutely. Enterprise customers can work with our team to create a custom plan. We can adjust limits, add specific integrations, or build custom workflows for your practice.',
  },
];

const socialProof = [
  { metric: '47+', label: 'Clinics Running on RaniOS' },
  { metric: '$42.8K', label: 'Monthly Recurring Revenue' },
  { metric: '96%', label: 'Customer Satisfaction Score' },
  { metric: '14 days', label: 'Average Time to Value' },
];

export default function PricingPage() {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showComparison, setShowComparison] = useState(false);

  // ROI Calculator
  const [roiProviders, setRoiProviders] = useState(3);
  const [roiRevenue, setRoiRevenue] = useState(75000);

  const roiSavings = {
    adminHours: Math.round(roiProviders * 12),
    noShowReduction: Math.round(roiRevenue * 0.08),
    revenueIncrease: Math.round(roiRevenue * 0.15),
    total: Math.round(roiRevenue * 0.15 + roiRevenue * 0.08 + roiProviders * 12 * 45),
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/marketing" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#0F1D2C] rounded-lg flex items-center justify-center">
              <span className="text-[#F3D6BE] font-bold text-sm">R</span>
            </div>
            <span className="text-lg font-bold text-[#0F1D2C]">RaniOS</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="/marketing/features" className="text-sm text-gray-600 hover:text-gray-900">Features</Link>
            <Link href="/marketing/pricing" className="text-sm text-gray-900 font-semibold">Pricing</Link>
            <Link href="/marketing/demo" className="text-sm text-gray-600 hover:text-gray-900">Demo</Link>
            <Link href="/marketing/affiliates" className="text-sm text-gray-600 hover:text-gray-900">Affiliates</Link>
          </div>
          <Link href="/marketing/demo" className="px-5 py-2.5 text-sm font-bold text-white bg-[#0F1D2C] rounded-xl hover:bg-[#1A2A3C] transition-colors">
            Start Free Trial
          </Link>
        </div>
      </nav>

      {/* Header */}
      <section className="pt-32 pb-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#FAF8F5] to-white">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-[#0F1D2C] mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-8">
            Every plan includes a 14-day free trial. No credit card required. Cancel anytime.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-3 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setBilling('monthly')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                billing === 'monthly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling('annual')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                billing === 'annual' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
            >
              Annual <span className="text-emerald-600 text-xs font-bold ml-1">Save 15%</span>
            </button>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((tier) => {
            const price = billing === 'annual' ? tier.annualPrice : tier.price;
            return (
              <div
                key={tier.slug}
                className={`relative bg-white rounded-2xl border p-6 transition-all ${
                  tier.popular
                    ? 'border-[#0F1D2C] shadow-xl scale-[1.02]'
                    : 'border-gray-200 shadow-sm hover:shadow-md'
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#0F1D2C] text-[#F3D6BE] text-xs font-bold rounded-full">
                    Most Popular
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-900">{tier.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">{tier.tagline}</p>
                </div>
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-[#0F1D2C]">${price}</span>
                    <span className="text-sm text-gray-400">/month</span>
                  </div>
                  {billing === 'annual' && (
                    <p className="text-xs text-emerald-600 mt-1">
                      Billed annually (${price * 12}/yr)
                    </p>
                  )}
                </div>

                {/* Limits */}
                <div className="grid grid-cols-2 gap-2 mb-6">
                  {tier.limits.map((limit) => (
                    <div key={limit.label} className="p-2 bg-gray-50 rounded-lg text-center">
                      <p className="text-xs font-bold text-gray-900">{limit.value}</p>
                      <p className="text-[10px] text-gray-500">{limit.label}</p>
                    </div>
                  ))}
                </div>

                {/* Features */}
                <ul className="space-y-2 mb-6">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      {feature.includes('Everything in') ? (
                        <span className="text-xs font-semibold text-[#C9A96E] mt-0.5">{feature}</span>
                      ) : (
                        <>
                          <svg className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-xs text-gray-600">{feature}</span>
                        </>
                      )}
                    </li>
                  ))}
                </ul>

                <Link
                  href={tier.slug === 'enterprise' ? '/marketing/demo' : '/marketing/demo'}
                  className={`block w-full py-3 text-sm font-bold text-center rounded-xl transition-all ${
                    tier.popular
                      ? 'bg-[#0F1D2C] text-white hover:bg-[#1A2A3C] shadow-lg shadow-[#0F1D2C]/20'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tier.cta}
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-[#FAF8F5]">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {socialProof.map((item) => (
            <div key={item.label}>
              <p className="text-2xl font-bold text-[#0F1D2C]">{item.metric}</p>
              <p className="text-xs text-gray-500 mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-[#0F1D2C]">Feature Comparison</h2>
            <p className="text-gray-500 mt-2">Detailed breakdown of what&apos;s included in each plan.</p>
          </div>

          <div className="text-center mb-6">
            <button
              onClick={() => setShowComparison(!showComparison)}
              className="px-6 py-2.5 text-sm font-medium text-[#0F1D2C] border border-[#0F1D2C] rounded-xl hover:bg-[#0F1D2C]/5 transition-colors"
            >
              {showComparison ? 'Hide Comparison Table' : 'Show Full Comparison'}
            </button>
          </div>

          {showComparison && (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              {/* Header */}
              <div className="grid grid-cols-4 bg-gray-50 border-b border-gray-200">
                <div className="p-4" />
                <div className="p-4 text-center">
                  <p className="text-sm font-bold text-gray-600">Starter</p>
                  <p className="text-xs text-gray-400">${billing === 'annual' ? '169' : '199'}/mo</p>
                </div>
                <div className="p-4 text-center bg-[#0F1D2C]/5">
                  <p className="text-sm font-bold text-[#0F1D2C]">Pro</p>
                  <p className="text-xs text-gray-400">${billing === 'annual' ? '424' : '499'}/mo</p>
                </div>
                <div className="p-4 text-center">
                  <p className="text-sm font-bold text-gray-600">Enterprise</p>
                  <p className="text-xs text-gray-400">${billing === 'annual' ? '849' : '999'}/mo</p>
                </div>
              </div>

              {comparisonFeatures.map((cat) => (
                <div key={cat.category}>
                  <div className="px-4 py-3 bg-gray-50/50 border-b border-gray-100">
                    <p className="text-xs font-bold text-[#0F1D2C] uppercase tracking-wider">{cat.category}</p>
                  </div>
                  {cat.features.map((f) => (
                    <div key={f.name} className="grid grid-cols-4 border-b border-gray-100 last:border-b-0">
                      <div className="p-3 text-sm text-gray-700">{f.name}</div>
                      {(['starter', 'pro', 'enterprise'] as const).map((plan) => (
                        <div key={plan} className={`p-3 flex justify-center ${plan === 'pro' ? 'bg-[#0F1D2C]/[0.02]' : ''}`}>
                          {f[plan] ? (
                            <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <span className="w-5 h-5 flex items-center justify-center text-gray-300 text-sm">-</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ROI Calculator */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#FAF8F5]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#0F1D2C]">Calculate Your ROI</h2>
            <p className="text-gray-500 mt-2">See exactly how much RaniOS can save your practice.</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Inputs */}
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Number of Providers: <span className="font-bold text-[#0F1D2C]">{roiProviders}</span>
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={20}
                    value={roiProviders}
                    onChange={(e) => setRoiProviders(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#0F1D2C]"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                    <span>1</span>
                    <span>20</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Monthly Revenue: <span className="font-bold text-[#0F1D2C]">${roiRevenue.toLocaleString()}</span>
                  </label>
                  <input
                    type="range"
                    min={10000}
                    max={500000}
                    step={5000}
                    value={roiRevenue}
                    onChange={(e) => setRoiRevenue(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#0F1D2C]"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                    <span>$10K</span>
                    <span>$500K</span>
                  </div>
                </div>
              </div>

              {/* Results */}
              <div className="space-y-3">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Admin Hours Saved / Month</span>
                    <span className="text-sm font-bold text-gray-900">{roiSavings.adminHours} hrs</span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5">At $45/hr = ${(roiSavings.adminHours * 45).toLocaleString()}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">No-Show Reduction</span>
                    <span className="text-sm font-bold text-gray-900">${roiSavings.noShowReduction.toLocaleString()}</span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5">8% recovery from predictive alerts</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Revenue Increase</span>
                    <span className="text-sm font-bold text-gray-900">${roiSavings.revenueIncrease.toLocaleString()}</span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5">15% from AI recommendations and retention</p>
                </div>
                <div className="p-4 bg-[#0F1D2C] rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/70">Total Monthly Impact</span>
                    <span className="text-lg font-bold text-[#F3D6BE]">${roiSavings.total.toLocaleString()}</span>
                  </div>
                  <p className="text-[10px] text-white/50 mt-0.5">
                    {Math.round(roiSavings.total / 499)}x return on Pro plan investment
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#0F1D2C]">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="text-sm font-semibold text-gray-900">{faq.q}</span>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ml-4 ${openFaq === i ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5">
                    <p className="text-sm text-gray-600 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[#0F1D2C]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Ready to transform your practice?</h2>
          <p className="text-white/60 mb-6">Start your 14-day free trial today. No credit card required.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/marketing/demo"
              className="px-8 py-4 text-base font-bold text-[#0F1D2C] bg-[#F3D6BE] rounded-2xl hover:bg-[#F8E5D5] transition-all shadow-xl"
            >
              Start Your Free Trial
            </Link>
            <Link
              href="/marketing/demo"
              className="px-8 py-4 text-base font-medium text-white/80 border border-white/20 rounded-2xl hover:bg-white/5 transition-all"
            >
              Schedule a Demo
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
