'use client';

import { useState } from 'react';
import Link from 'next/link';
import PricingTable from '@/components/saas/PricingTable';
import ROICalculator from '@/components/saas/ROICalculator';

const comparisonFeatures = [
  { category: 'AI Intelligence', features: [
    { name: 'AI Intake Intelligence', starter: true, growth: true, enterprise: true },
    { name: 'Churn Prediction Engine', starter: false, growth: true, enterprise: true },
    { name: 'Dynamic Pricing Intelligence', starter: false, growth: true, enterprise: true },
    { name: 'Revenue Anomaly Detection', starter: false, growth: true, enterprise: true },
    { name: 'AI Consult Co-pilot', starter: false, growth: true, enterprise: true },
    { name: 'Treatment Recommendations', starter: true, growth: true, enterprise: true },
    { name: 'RAG Knowledge Base', starter: false, growth: false, enterprise: true },
    { name: 'Custom AI Model Training', starter: false, growth: false, enterprise: true },
  ]},
  { category: 'Automation', features: [
    { name: 'Automated Follow-up Sequences', starter: true, growth: true, enterprise: true },
    { name: 'Review Monitoring & Responses', starter: true, growth: true, enterprise: true },
    { name: 'Schedule Optimizer', starter: false, growth: true, enterprise: true },
    { name: 'Inventory Auto-Management', starter: false, growth: true, enterprise: true },
    { name: 'Social Media Content Engine', starter: false, growth: true, enterprise: true },
    { name: 'AI Phone Receptionist', starter: false, growth: false, enterprise: true },
    { name: 'Custom n8n Workflows', starter: false, growth: false, enterprise: true },
  ]},
  { category: 'Analytics & Reporting', features: [
    { name: 'Basic KPI Dashboard', starter: true, growth: true, enterprise: true },
    { name: 'P&L Financial Intelligence', starter: false, growth: true, enterprise: true },
    { name: 'Meta Ads AI Manager', starter: false, growth: true, enterprise: true },
    { name: 'Provider Performance Analytics', starter: false, growth: true, enterprise: true },
    { name: 'Multi-location Analytics', starter: false, growth: false, enterprise: true },
  ]},
  { category: 'Platform', features: [
    { name: 'Client CRM with Lead Tracking', starter: true, growth: true, enterprise: true },
    { name: 'Gamified Operations Dashboard', starter: true, growth: true, enterprise: true },
    { name: 'Custom Branded Client Portal', starter: false, growth: true, enterprise: true },
    { name: 'White-Label Portal', starter: false, growth: false, enterprise: true },
    { name: 'API Access', starter: false, growth: false, enterprise: true },
    { name: 'SLA Guarantee (99.9%)', starter: false, growth: false, enterprise: true },
  ]},
  { category: 'Support', features: [
    { name: 'Email Support', starter: true, growth: true, enterprise: true },
    { name: 'Priority Support', starter: false, growth: true, enterprise: true },
    { name: 'Onboarding Assistance', starter: false, growth: true, enterprise: true },
    { name: 'Dedicated Success Manager', starter: false, growth: false, enterprise: true },
    { name: 'Quarterly Business Reviews', starter: false, growth: false, enterprise: true },
  ]},
];

const billingFaqs = [
  {
    q: 'Can I switch plans at any time?',
    a: 'Yes. Upgrade instantly and get prorated credit for your current billing period. Downgrades take effect at the next billing cycle.',
  },
  {
    q: 'Is there a setup fee?',
    a: 'No setup fees on any plan. Growth and Enterprise plans include free onboarding and data migration.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept all major credit cards via Stripe. Enterprise customers can also pay by invoice with Net 30 terms.',
  },
  {
    q: 'Do you offer discounts for multiple locations?',
    a: 'Yes. Multi-location practices get volume discounts starting at 15% off for 3+ locations. Contact sales for custom pricing.',
  },
  {
    q: 'What happens when my trial ends?',
    a: 'You choose a plan to continue, or your account is paused (not deleted). Your data is preserved for 90 days so you can reactivate anytime.',
  },
  {
    q: 'Are there any overage charges?',
    a: 'No surprise bills. If you approach your plan limits, we notify you and recommend an upgrade. We never charge overages without your consent.',
  },
];

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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
          </div>
          <Link href="/marketing/demo" className="px-5 py-2.5 text-sm font-bold text-white bg-[#0F1D2C] rounded-xl hover:bg-[#1A2A3C] transition-colors">
            Start Free Trial
          </Link>
        </div>
      </nav>

      {/* Header */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#FAF8F5] to-white">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-[#0F1D2C] mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Every plan includes a 14-day free trial. No credit card required.
            Cancel anytime.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8">
        <PricingTable />
      </section>

      {/* Feature Comparison Matrix */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#FAF8F5]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#0F1D2C]">Feature Comparison</h2>
            <p className="text-gray-500 mt-2">Detailed breakdown of what&apos;s included in each plan.</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            {/* Header */}
            <div className="grid grid-cols-4 bg-gray-50 border-b border-gray-200">
              <div className="p-4" />
              <div className="p-4 text-center">
                <p className="text-sm font-bold text-gray-600">Starter</p>
                <p className="text-xs text-gray-400">$199/mo</p>
              </div>
              <div className="p-4 text-center bg-[#0F1D2C]/5">
                <p className="text-sm font-bold text-[#0F1D2C]">Growth</p>
                <p className="text-xs text-gray-400">$499/mo</p>
              </div>
              <div className="p-4 text-center">
                <p className="text-sm font-bold text-gray-600">Enterprise</p>
                <p className="text-xs text-gray-400">$999/mo</p>
              </div>
            </div>

            {/* Feature rows */}
            {comparisonFeatures.map((cat) => (
              <div key={cat.category}>
                <div className="px-4 py-3 bg-gray-50/50 border-b border-gray-100">
                  <p className="text-xs font-bold text-[#0F1D2C] uppercase tracking-wider">{cat.category}</p>
                </div>
                {cat.features.map((f) => (
                  <div key={f.name} className="grid grid-cols-4 border-b border-gray-100 last:border-b-0">
                    <div className="p-3 text-sm text-gray-700">{f.name}</div>
                    {(['starter', 'growth', 'enterprise'] as const).map((plan) => (
                      <div key={plan} className={`p-3 flex justify-center ${plan === 'growth' ? 'bg-[#0F1D2C]/[0.02]' : ''}`}>
                        {f[plan] ? (
                          <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <span className="w-5 h-5 flex items-center justify-center text-gray-300">
                            &mdash;
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROI Calculator */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#0F1D2C]">Calculate Your ROI</h2>
            <p className="text-gray-500 mt-2">See exactly how much RaniOS can save your practice.</p>
          </div>
          <ROICalculator />
        </div>
      </section>

      {/* Billing FAQ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#FAF8F5]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#0F1D2C]">Billing FAQ</h2>
          </div>
          <div className="space-y-3">
            {billingFaqs.map((faq, i) => (
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
          <h2 className="text-2xl font-bold text-white mb-4">Ready to get started?</h2>
          <p className="text-white/60 mb-6">Start your 14-day free trial today. No credit card required.</p>
          <Link
            href="/marketing/demo"
            className="inline-block px-8 py-4 text-base font-bold text-[#0F1D2C] bg-[#F3D6BE] rounded-2xl hover:bg-[#F8E5D5] transition-all shadow-xl"
          >
            Start Your Free Trial
          </Link>
        </div>
      </section>
    </div>
  );
}
