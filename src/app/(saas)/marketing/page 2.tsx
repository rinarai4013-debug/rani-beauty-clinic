'use client';

import { useState } from 'react';
import Link from 'next/link';
import PricingTable from '@/components/saas/PricingTable';
import FeatureGrid from '@/components/saas/FeatureGrid';

const stats = [
  { value: '47+', label: 'Medspas Powered' },
  { value: '$42K', label: 'Monthly Revenue Managed' },
  { value: '189K', label: 'AI Calls This Month' },
  { value: '99.9%', label: 'Platform Uptime' },
];

const problems = [
  {
    icon: '😤',
    title: 'Drowning in manual tasks',
    description: 'Your front desk spends hours on follow-ups, reminders, and data entry instead of creating exceptional client experiences.',
  },
  {
    icon: '📉',
    title: 'Losing clients silently',
    description: 'By the time you notice a client has stopped coming, it is already too late. No system alerts you before they churn.',
  },
  {
    icon: '🎯',
    title: 'Flying blind on marketing',
    description: 'You spend thousands on ads without knowing which campaigns drive real bookings. Content creation is a weekly scramble.',
  },
  {
    icon: '💸',
    title: 'Revenue leaks everywhere',
    description: 'No-shows, missed upsells, unoptimized pricing, and gaps in your schedule silently drain your bottom line.',
  },
];

const testimonials = [
  {
    quote: 'RaniOS transformed how we operate. Our rebooking rate increased 22% in the first quarter, and the AI consult co-pilot helps our providers close 40% more treatment plans.',
    name: 'Dr. Sarah Mitchell',
    role: 'Owner, Radiance Aesthetics',
    location: 'Portland, OR',
    metric: '+22% rebooking rate',
  },
  {
    quote: 'The AI phone agent alone saves us 30 hours a month. Clients get instant answers at 2 AM, and we wake up to new bookings. The automation suite has completely transformed how we run a growing practice.',
    name: 'Jessica Park',
    role: 'Operations Director, Zen Medspa',
    location: 'Los Angeles, CA',
    metric: '30 hrs/mo saved',
  },
  {
    quote: 'I was skeptical about AI in aesthetics, but the intake intelligence feature blew me away. It analyzes intake forms before consultations and generates treatment plans that feel personalized.',
    name: 'Dr. Emily Chen',
    role: 'Medical Director, Glow Medical Spa',
    location: 'Seattle, WA',
    metric: '+35% conversion',
  },
];

const faqs = [
  {
    q: 'How long does onboarding take?',
    a: 'Most clinics are fully operational within 5-7 business days. Our success team handles data migration, integration setup, and team training.',
  },
  {
    q: 'Do I need to change my booking software?',
    a: 'No. RaniOS integrates with Mangomint, Boulevard, Zenoti, and other popular booking platforms. We work alongside your existing tools.',
  },
  {
    q: 'Is my clinic data secure?',
    a: 'Absolutely. We use AES-256 encryption at rest, TLS 1.3 in transit, SOC 2 Type II compliance, and HIPAA-compliant data handling. Your data never trains AI models.',
  },
  {
    q: 'What if I want to cancel?',
    a: 'No long-term contracts. Cancel anytime with 30 days notice. We will help you export all your data.',
  },
  {
    q: 'Can I try it before committing?',
    a: 'Yes. Every plan includes a 14-day free trial with full access to all features. No credit card required to start.',
  },
  {
    q: 'What kind of support is included?',
    a: 'All plans include email support. Growth plans get priority support and onboarding. Enterprise includes a dedicated success manager and quarterly business reviews.',
  },
];

export default function MarketingLandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [email, setEmail] = useState('');
  const [leadForm, setLeadForm] = useState({
    name: '',
    email: '',
    clinicName: '',
    providerCount: '',
    currentSoftware: 'none',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState('');

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');
    try {
      const res = await fetch('/api/saas/funnel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...leadForm,
          providerCount: Number(leadForm.providerCount),
        }),
      });
      if (!res.ok) throw new Error('Submission failed');
      setSubmitted(true);
    } catch {
      setFormError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/marketing" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#0F1D2C] rounded-lg flex items-center justify-center">
              <span className="text-[#F3D6BE] font-bold text-sm">R</span>
            </div>
            <span className="text-lg font-bold text-[#0F1D2C]">RaniOS</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="/marketing/features" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Features
            </Link>
            <Link href="/marketing/pricing" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Pricing
            </Link>
            <Link href="/marketing/demo" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Demo
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/marketing/demo"
              className="hidden sm:block px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              Log In
            </Link>
            <Link
              href="/marketing/demo"
              className="px-5 py-2.5 text-sm font-bold text-white bg-[#0F1D2C] rounded-xl hover:bg-[#1A2A3C] transition-colors shadow-lg shadow-[#0F1D2C]/20"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#FAF8F5] to-white" />
        <div className="max-w-5xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#0F1D2C]/5 rounded-full mb-6">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-sm text-[#0F1D2C] font-medium">Trusted by 47+ medical spas</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#0F1D2C] leading-tight tracking-tight">
            AI-Powered Operations{' '}
            <br className="hidden sm:block" />
            for Medical Spas
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Stop losing revenue to no-shows, manual tasks, and missed upsells.
            RaniOS gives your medspa an AI operations team that works 24/7.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/marketing/demo"
              className="px-8 py-4 text-base font-bold text-white bg-[#0F1D2C] rounded-2xl hover:bg-[#1A2A3C] transition-all shadow-xl shadow-[#0F1D2C]/20 hover:shadow-2xl hover:-translate-y-0.5"
            >
              Start Your Free Trial
            </Link>
            <Link
              href="/marketing/demo"
              className="px-8 py-4 text-base font-bold text-[#0F1D2C] bg-white rounded-2xl border-2 border-gray-200 hover:border-[#0F1D2C] transition-all"
            >
              Book a Demo
            </Link>
          </div>
          <p className="mt-4 text-xs text-gray-400">14-day free trial. No credit card required.</p>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-bold text-[#0F1D2C]">{stat.value}</p>
                <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem/Solution */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm font-bold text-[#0F1D2C] uppercase tracking-wider mb-3">The Problem</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0F1D2C]">
              Running a medspa shouldn&apos;t feel this hard
            </h2>
            <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
              Most medspa owners are incredible clinicians stuck managing operations with spreadsheets and guesswork.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {problems.map((problem) => (
              <div key={problem.title} className="p-6 rounded-2xl bg-gray-50 border border-gray-100 hover:border-gray-200 transition-colors">
                <span className="text-3xl mb-3 block">{problem.icon}</span>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{problem.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{problem.description}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-2 px-5 py-3 bg-[#0F1D2C] text-white rounded-2xl">
              <span className="text-lg">&#8595;</span>
              <span className="font-bold">RaniOS solves all of this with AI</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Showcase */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#FAF8F5]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm font-bold text-[#0F1D2C] uppercase tracking-wider mb-3">Features</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0F1D2C]">
              12 AI engines working for your clinic
            </h2>
            <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
              From intake to reactivation, every step of your patient journey is optimized by purpose-built AI.
            </p>
          </div>
          <FeatureGrid />
          <div className="text-center mt-10">
            <Link
              href="/marketing/features"
              className="inline-flex items-center gap-2 text-sm font-bold text-[#0F1D2C] hover:underline"
            >
              Explore all features in detail
              <span>&#8594;</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white" id="pricing">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm font-bold text-[#0F1D2C] uppercase tracking-wider mb-3">Pricing</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0F1D2C]">
              Plans that scale with your practice
            </h2>
            <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
              Start with what you need today. Upgrade as you grow. All plans include a 14-day free trial.
            </p>
          </div>
          <PricingTable />
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#0F1D2C]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm font-bold text-[#F3D6BE] uppercase tracking-wider mb-3">Testimonials</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Loved by medspa owners
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <svg key={j} className="w-4 h-4 text-[#F3D6BE]" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-white/80 text-sm leading-relaxed mb-4">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <div>
                    <p className="text-white font-semibold text-sm">{t.name}</p>
                    <p className="text-white/50 text-xs">{t.role}</p>
                  </div>
                  <span className="text-xs font-bold text-[#F3D6BE] bg-[#F3D6BE]/10 px-2.5 py-1 rounded-full">
                    {t.metric}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm font-bold text-[#0F1D2C] uppercase tracking-wider mb-3">FAQ</p>
            <h2 className="text-3xl font-bold text-[#0F1D2C]">Frequently asked questions</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-gray-200 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="text-sm font-semibold text-gray-900">{faq.q}</span>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${openFaq === i ? 'rotate-180' : ''}`}
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

      {/* Lead Capture Form */}
      <section id="lead-form" className="py-20 px-4 sm:px-6 lg:px-8 bg-[#FAF8F5]">
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-sm font-bold text-[#0F1D2C] uppercase tracking-wider mb-3">Get Started</p>
            <h2 className="text-3xl font-bold text-[#0F1D2C]">Start Your Free 14-Day Trial</h2>
            <p className="mt-3 text-gray-500">No credit card required. Set up in 10 minutes.</p>
          </div>
          {submitted ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-gray-900 font-semibold text-lg">Welcome aboard!</h3>
              <p className="text-gray-600 mt-2">Check your email for next steps and your demo link.</p>
            </div>
          ) : (
            <form onSubmit={handleLeadSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-lg space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-1.5">Your Name</label>
                  <input
                    type="text"
                    required
                    value={leadForm.name}
                    onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-[#0F1D2C] focus:outline-none focus:ring-1 focus:ring-[#0F1D2C]"
                    placeholder="Jane Smith"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-1.5">Email</label>
                  <input
                    type="email"
                    required
                    value={leadForm.email}
                    onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-[#0F1D2C] focus:outline-none focus:ring-1 focus:ring-[#0F1D2C]"
                    placeholder="jane@clinic.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-1.5">Clinic Name</label>
                <input
                  type="text"
                  required
                  value={leadForm.clinicName}
                  onChange={(e) => setLeadForm({ ...leadForm, clinicName: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-[#0F1D2C] focus:outline-none focus:ring-1 focus:ring-[#0F1D2C]"
                  placeholder="Glow Aesthetics"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-1.5"># of Providers</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={leadForm.providerCount}
                    onChange={(e) => setLeadForm({ ...leadForm, providerCount: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-[#0F1D2C] focus:outline-none focus:ring-1 focus:ring-[#0F1D2C]"
                    placeholder="3"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-1.5">Current Software</label>
                  <select
                    value={leadForm.currentSoftware}
                    onChange={(e) => setLeadForm({ ...leadForm, currentSoftware: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:border-[#0F1D2C] focus:outline-none focus:ring-1 focus:ring-[#0F1D2C]"
                  >
                    <option value="none">None / Paper</option>
                    <option value="spreadsheets">Spreadsheets</option>
                    <option value="jane">Jane App</option>
                    <option value="mindbody">Mindbody</option>
                    <option value="vagaro">Vagaro</option>
                    <option value="boulevard">Boulevard</option>
                    <option value="mangomint">Mangomint</option>
                    <option value="zenoti">Zenoti</option>
                    <option value="aesthetic_record">Aesthetic Record</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              {formError && <p className="text-red-500 text-sm">{formError}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#0F1D2C] text-white py-3.5 rounded-xl font-bold text-base hover:bg-[#1A2A3C] transition-colors disabled:opacity-50 shadow-lg shadow-[#0F1D2C]/20"
              >
                {submitting ? 'Submitting...' : 'Start Free 14-Day Trial'}
              </button>
              <p className="text-gray-400 text-xs text-center">
                No credit card required. Cancel anytime.
              </p>
            </form>
          )}
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#0F1D2C] to-[#1A2A3C]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to transform your medspa operations?
          </h2>
          <p className="text-lg text-white/60 mb-8">
            Join 47+ medical spas using AI to grow revenue, reduce overhead, and deliver exceptional client experiences.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/marketing/demo"
              className="px-8 py-4 text-base font-bold text-[#0F1D2C] bg-[#F3D6BE] rounded-2xl hover:bg-[#F8E5D5] transition-all shadow-xl"
            >
              Start Your Free Trial
            </Link>
            <Link
              href="/marketing/demo"
              className="px-8 py-4 text-base font-bold text-white border-2 border-white/20 rounded-2xl hover:border-white/40 transition-all"
            >
              Book a Live Demo
            </Link>
          </div>
          <p className="mt-4 text-xs text-white/30">14-day free trial. No credit card required. Cancel anytime.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-[#0F1D2C] border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 bg-[#F3D6BE] rounded-md flex items-center justify-center">
                  <span className="text-[#0F1D2C] font-bold text-[10px]">R</span>
                </div>
                <span className="text-white font-bold text-sm">RaniOS</span>
              </div>
              <p className="text-xs text-white/40 leading-relaxed">
                AI-powered operations platform built specifically for medical spas.
              </p>
            </div>
            <div>
              <p className="text-xs font-bold text-white/60 uppercase tracking-wider mb-3">Product</p>
              <div className="space-y-2">
                {['Features', 'Pricing', 'Integrations', 'Demo'].map((item) => (
                  <Link key={item} href={`/marketing/${item.toLowerCase()}`} className="block text-xs text-white/40 hover:text-white/70 transition-colors">
                    {item}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-white/60 uppercase tracking-wider mb-3">Company</p>
              <div className="space-y-2">
                {['About', 'Blog', 'Careers', 'Contact'].map((item) => (
                  <Link key={item} href="#" className="block text-xs text-white/40 hover:text-white/70 transition-colors">
                    {item}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-white/60 uppercase tracking-wider mb-3">Legal</p>
              <div className="space-y-2">
                {['Privacy Policy', 'Terms of Service', 'HIPAA', 'Security'].map((item) => (
                  <Link key={item} href="#" className="block text-xs text-white/40 hover:text-white/70 transition-colors">
                    {item}
                  </Link>
                ))}
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-white/5 text-center">
            <p className="text-xs text-white/30">
              &copy; {new Date().getFullYear()} RaniOS. All rights reserved. Built with care in Seattle, WA.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
