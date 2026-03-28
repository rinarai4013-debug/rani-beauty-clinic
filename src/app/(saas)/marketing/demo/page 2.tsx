'use client';

import { useState } from 'react';
import Link from 'next/link';

// =============================================================================
// Marketing Demo Request Page
// Multi-step form, calendar embed placeholder, social proof sidebar, FAQ
// =============================================================================

type Step = 1 | 2 | 3 | 4;

interface FormData {
  // Step 1: Contact
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  // Step 2: Business Info
  clinicName: string;
  location: string;
  providers: string;
  monthlyRevenue: string;
  currentSoftware: string;
  vertical: string;
  // Step 3: Needs
  interests: string[];
  biggestChallenge: string;
  timeline: string;
  budgetAuthority: string;
  // Step 4: Demo Booking
  preferredDate: string;
  preferredTime: string;
  message: string;
}

const verticals = [
  'Med Spa / Aesthetics',
  'Dermatology',
  'Dental',
  'Wellness / Holistic',
  'Chiropractic',
  'Plastic Surgery',
  'Ophthalmology',
  'Veterinary',
  'Other',
];

const interestOptions = [
  'AI Intake Intelligence',
  'Churn Prediction',
  'Dynamic Pricing',
  'Schedule Optimizer',
  'Social Content Engine',
  'Meta Ads AI',
  'AI Consult Co-pilot',
  'AI Phone Agent',
  'P&L Intelligence',
  'Review Management',
  'Client Portal',
  'Full Platform Demo',
];

const revenueRanges = [
  'Under $30K/month',
  '$30K - $75K/month',
  '$75K - $150K/month',
  '$150K - $300K/month',
  '$300K+/month',
];

const softwareOptions = [
  'Mangomint', 'Boulevard', 'Zenoti', 'Vagaro', 'Mindbody',
  'Meevo', 'DrChrono', 'Jane App', 'Other', 'None',
];

const timelineOptions = [
  'Immediately (this month)',
  'Within 1-3 months',
  'Within 3-6 months',
  'Just researching',
];

const testimonials = [
  {
    quote: 'RaniOS paid for itself in the first month. Our no-show rate dropped 40% and revenue increased 22%.',
    name: 'Dr. Sarah Kim',
    title: 'Owner, Glow Med Spa',
    metric: '+22% Revenue',
  },
  {
    quote: 'The AI consult co-pilot alone saves me 2 hours per day. My close rate went from 60% to 85%.',
    name: 'Jessica Torres',
    title: 'Practice Manager, Nova Aesthetics',
    metric: '85% Close Rate',
  },
  {
    quote: 'Switched from Boulevard and the difference is night and day. The AI intelligence is on another level.',
    name: 'Dr. Michael Chen',
    title: 'Dermatologist, Clear Skin Studio',
    metric: '40% Less No-Shows',
  },
];

export default function DemoPage() {
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    clinicName: '',
    location: '',
    providers: '',
    monthlyRevenue: '',
    currentSoftware: '',
    vertical: '',
    interests: [],
    biggestChallenge: '',
    timeline: '',
    budgetAuthority: '',
    preferredDate: '',
    preferredTime: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const updateField = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleInterest = (interest: string) => {
    setForm((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const canAdvance = (): boolean => {
    switch (step) {
      case 1: return !!(form.firstName && form.email);
      case 2: return !!(form.clinicName);
      case 3: return form.interests.length > 0;
      case 4: return true;
      default: return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch('/api/saas/marketing/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  const stepLabels = ['Contact', 'Business', 'Needs', 'Book'];

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FAF8F5] to-white flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-[#0F1D2C] mb-3">Demo Request Received</h1>
          <p className="text-gray-500 mb-2">
            Thank you, {form.firstName}! Our team will reach out within 24 hours to schedule your personalized demo of RaniOS.
          </p>
          <p className="text-sm text-gray-400 mb-4">
            Check your inbox at {form.email} for confirmation and sandbox credentials.
          </p>
          <div className="bg-gray-50 rounded-xl p-4 mb-8 text-left">
            <p className="text-xs font-semibold text-gray-700 mb-2">What happens next:</p>
            <div className="space-y-2">
              {[
                'Confirmation email with sandbox access (instant)',
                'Personalized demo prep based on your answers (24h)',
                '30-minute live walkthrough with our team',
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-[10px] font-bold text-[#C9A96E] bg-[#C9A96E]/10 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-xs text-gray-600">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <Link
            href="/marketing"
            className="inline-block px-6 py-3 text-sm font-bold text-white bg-[#0F1D2C] rounded-xl hover:bg-[#1A2A3C] transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
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
            <Link href="/marketing/pricing" className="text-sm text-gray-600 hover:text-gray-900">Pricing</Link>
            <Link href="/marketing/demo" className="text-sm text-gray-900 font-semibold">Demo</Link>
            <Link href="/marketing/affiliates" className="text-sm text-gray-600 hover:text-gray-900">Affiliates</Link>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-12">
          {/* Left: Social Proof Sidebar */}
          <div className="lg:col-span-2 lg:pt-8 order-2 lg:order-1">
            <h1 className="text-3xl sm:text-4xl font-bold text-[#0F1D2C] mb-4">
              See RaniOS in action
            </h1>
            <p className="text-lg text-gray-500 mb-8">
              Get a personalized demo tailored to your clinic&apos;s size, services, and goals.
            </p>

            {/* Steps */}
            <div className="space-y-5 mb-10">
              {[
                { num: 1, title: 'Submit your request', desc: 'Tell us about your practice so we can customize the demo.' },
                { num: 2, title: 'Get sandbox credentials', desc: 'Instant access to a demo environment with sample clinic data.' },
                { num: 3, title: 'Live walkthrough', desc: '30-minute call to explore the features that matter most to you.' },
              ].map((s) => (
                <div key={s.num} className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-[#0F1D2C] rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-[#F3D6BE] text-sm font-bold">{s.num}</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">{s.title}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Testimonials */}
            <div className="space-y-4 mb-10">
              <h3 className="text-sm font-bold text-gray-900">What clinic owners are saying</h3>
              {testimonials.map((t, i) => (
                <div key={i} className="p-4 bg-gray-50 rounded-2xl">
                  <p className="text-xs text-gray-600 leading-relaxed mb-3">&quot;{t.quote}&quot;</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-gray-900">{t.name}</p>
                      <p className="text-[10px] text-gray-500">{t.title}</p>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                      {t.metric}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Calendar Placeholder */}
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center">
              <p className="text-sm font-semibold text-gray-700 mb-2">Prefer to skip the form?</p>
              <p className="text-xs text-gray-500 mb-4">Book directly on our calendar.</p>
              <button className="px-6 py-3 text-sm font-bold text-white bg-[#0F1D2C] rounded-xl hover:bg-[#1A2A3C] transition-colors">
                Open Calendar
              </button>
              <p className="text-[10px] text-gray-400 mt-2">Powered by Calendly</p>
            </div>
          </div>

          {/* Right: Multi-Step Form */}
          <div className="lg:col-span-3 order-1 lg:order-2">
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-lg">
              {/* Step Indicator */}
              <div className="flex items-center gap-2 mb-8">
                {stepLabels.map((label, i) => (
                  <div key={label} className="flex items-center gap-2 flex-1">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      i + 1 <= step ? 'bg-[#0F1D2C] text-white' : 'bg-gray-200 text-gray-500'
                    }`}>
                      {i + 1 < step ? (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        i + 1
                      )}
                    </div>
                    <span className={`text-xs font-medium hidden sm:block ${i + 1 <= step ? 'text-gray-900' : 'text-gray-400'}`}>
                      {label}
                    </span>
                    {i < stepLabels.length - 1 && (
                      <div className={`flex-1 h-0.5 rounded ${i + 1 < step ? 'bg-[#0F1D2C]' : 'bg-gray-200'}`} />
                    )}
                  </div>
                ))}
              </div>

              {/* Step 1: Contact Info */}
              {step === 1 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-gray-900 mb-2">Contact Information</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">First Name *</label>
                      <input
                        type="text"
                        required
                        value={form.firstName}
                        onChange={(e) => updateField('firstName', e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F1D2C]/20 focus:border-[#0F1D2C]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">Last Name</label>
                      <input
                        type="text"
                        value={form.lastName}
                        onChange={(e) => updateField('lastName', e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F1D2C]/20 focus:border-[#0F1D2C]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Work Email *</label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F1D2C]/20 focus:border-[#0F1D2C]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Phone</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F1D2C]/20 focus:border-[#0F1D2C]"
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Business Info */}
              {step === 2 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-gray-900 mb-2">About Your Practice</h2>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Clinic Name *</label>
                    <input
                      type="text"
                      required
                      value={form.clinicName}
                      onChange={(e) => updateField('clinicName', e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F1D2C]/20 focus:border-[#0F1D2C]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Practice Type</label>
                    <select
                      value={form.vertical}
                      onChange={(e) => updateField('vertical', e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F1D2C]/20 focus:border-[#0F1D2C]"
                    >
                      <option value="">Select type</option>
                      {verticals.map((v) => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">Location</label>
                      <input
                        type="text"
                        placeholder="City, State"
                        value={form.location}
                        onChange={(e) => updateField('location', e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F1D2C]/20 focus:border-[#0F1D2C]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">Providers</label>
                      <select
                        value={form.providers}
                        onChange={(e) => updateField('providers', e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F1D2C]/20 focus:border-[#0F1D2C]"
                      >
                        <option value="">Select</option>
                        <option value="1">1 (Solo)</option>
                        <option value="2-3">2-3</option>
                        <option value="4-7">4-7</option>
                        <option value="8-15">8-15</option>
                        <option value="15+">15+</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">Monthly Revenue</label>
                      <select
                        value={form.monthlyRevenue}
                        onChange={(e) => updateField('monthlyRevenue', e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F1D2C]/20 focus:border-[#0F1D2C]"
                      >
                        <option value="">Select</option>
                        {revenueRanges.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">Current Software</label>
                      <select
                        value={form.currentSoftware}
                        onChange={(e) => updateField('currentSoftware', e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F1D2C]/20 focus:border-[#0F1D2C]"
                      >
                        <option value="">Select</option>
                        {softwareOptions.map((sw) => (
                          <option key={sw} value={sw}>{sw}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Needs Assessment */}
              {step === 3 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-gray-900 mb-2">What Are You Looking For?</h2>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">Interested In *</label>
                    <div className="flex flex-wrap gap-2">
                      {interestOptions.map((interest) => (
                        <button
                          key={interest}
                          type="button"
                          onClick={() => toggleInterest(interest)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            form.interests.includes(interest)
                              ? 'bg-[#0F1D2C] text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {interest}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Biggest Operational Challenge</label>
                    <textarea
                      rows={3}
                      value={form.biggestChallenge}
                      onChange={(e) => updateField('biggestChallenge', e.target.value)}
                      placeholder="What takes the most time or causes the most frustration in your practice?"
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F1D2C]/20 focus:border-[#0F1D2C] resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">Decision Timeline</label>
                      <select
                        value={form.timeline}
                        onChange={(e) => updateField('timeline', e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F1D2C]/20 focus:border-[#0F1D2C]"
                      >
                        <option value="">Select</option>
                        {timelineOptions.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">Budget Authority</label>
                      <select
                        value={form.budgetAuthority}
                        onChange={(e) => updateField('budgetAuthority', e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F1D2C]/20 focus:border-[#0F1D2C]"
                      >
                        <option value="">Select</option>
                        <option value="owner">I am the owner/decision maker</option>
                        <option value="manager">Practice manager (need approval)</option>
                        <option value="evaluator">Evaluating for my team</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Demo Booking */}
              {step === 4 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-gray-900 mb-2">Schedule Your Demo</h2>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">Preferred Date</label>
                      <input
                        type="date"
                        value={form.preferredDate}
                        onChange={(e) => updateField('preferredDate', e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F1D2C]/20 focus:border-[#0F1D2C]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">Preferred Time</label>
                      <select
                        value={form.preferredTime}
                        onChange={(e) => updateField('preferredTime', e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F1D2C]/20 focus:border-[#0F1D2C]"
                      >
                        <option value="">Select time</option>
                        <option value="9am-10am">9:00 AM - 10:00 AM</option>
                        <option value="10am-11am">10:00 AM - 11:00 AM</option>
                        <option value="11am-12pm">11:00 AM - 12:00 PM</option>
                        <option value="1pm-2pm">1:00 PM - 2:00 PM</option>
                        <option value="2pm-3pm">2:00 PM - 3:00 PM</option>
                        <option value="3pm-4pm">3:00 PM - 4:00 PM</option>
                        <option value="4pm-5pm">4:00 PM - 5:00 PM</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Anything else you&apos;d like us to know?</label>
                    <textarea
                      rows={3}
                      value={form.message}
                      onChange={(e) => updateField('message', e.target.value)}
                      placeholder="Specific features to demo, questions you have, etc."
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F1D2C]/20 focus:border-[#0F1D2C] resize-none"
                    />
                  </div>

                  {/* Summary */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Request Summary</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><span className="text-gray-500">Name:</span> <span className="text-gray-900">{form.firstName} {form.lastName}</span></div>
                      <div><span className="text-gray-500">Email:</span> <span className="text-gray-900">{form.email}</span></div>
                      {form.clinicName && <div><span className="text-gray-500">Clinic:</span> <span className="text-gray-900">{form.clinicName}</span></div>}
                      {form.vertical && <div><span className="text-gray-500">Type:</span> <span className="text-gray-900">{form.vertical}</span></div>}
                      {form.interests.length > 0 && (
                        <div className="col-span-2">
                          <span className="text-gray-500">Interests:</span>{' '}
                          <span className="text-gray-900">{form.interests.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between mt-8">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={() => setStep((s) => (s - 1) as Step)}
                    className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Back
                  </button>
                ) : (
                  <div />
                )}
                {step < 4 ? (
                  <button
                    type="button"
                    disabled={!canAdvance()}
                    onClick={() => setStep((s) => (s + 1) as Step)}
                    className="px-6 py-2.5 text-sm font-bold text-white bg-[#0F1D2C] rounded-xl hover:bg-[#1A2A3C] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continue
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2.5 text-sm font-bold text-white bg-[#0F1D2C] rounded-xl hover:bg-[#1A2A3C] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#0F1D2C]/20"
                  >
                    {loading ? 'Submitting...' : 'Request Demo'}
                  </button>
                )}
              </div>

              <p className="text-[10px] text-gray-400 text-center mt-4">
                By submitting, you agree to our Terms of Service and Privacy Policy.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
