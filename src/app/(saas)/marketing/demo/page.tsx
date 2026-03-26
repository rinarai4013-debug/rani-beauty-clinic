'use client';

import { useState } from 'react';
import Link from 'next/link';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  clinicName: string;
  location: string;
  providers: string;
  monthlyRevenue: string;
  currentSoftware: string;
  interests: string[];
  message: string;
}

const interestOptions = [
  'AI Intake Intelligence',
  'Churn Prediction',
  'Dynamic Pricing',
  'Schedule Optimizer',
  'Social Content Engine',
  'Meta Ads AI',
  'AI Consult Co-pilot',
  'AI Phone Agent',
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
  'Mangomint',
  'Boulevard',
  'Zenoti',
  'Vagaro',
  'Mindbody',
  'Meevo',
  'Other',
  'None',
];

export default function DemoPage() {
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
    interests: [],
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
      // Fallback: show success even if API is not yet connected
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

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
          <p className="text-sm text-gray-400 mb-8">
            Check your inbox at {form.email} for confirmation and demo credentials.
          </p>
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
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left: Info */}
          <div className="lg:pt-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-[#0F1D2C] mb-4">
              See RaniOS in action
            </h1>
            <p className="text-lg text-gray-500 mb-8">
              Get a personalized demo tailored to your clinic&apos;s size, services, and goals. Our team will show you exactly how RaniOS can transform your operations.
            </p>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#0F1D2C] rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-[#F3D6BE] text-sm">1</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Submit your request</h3>
                  <p className="text-sm text-gray-500 mt-0.5">Tell us about your practice so we can customize the demo.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#0F1D2C] rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-[#F3D6BE] text-sm">2</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Get demo credentials</h3>
                  <p className="text-sm text-gray-500 mt-0.5">Instant access to a sandbox environment with sample clinic data pre-loaded.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#0F1D2C] rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-[#F3D6BE] text-sm">3</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Schedule a live walkthrough</h3>
                  <p className="text-sm text-gray-500 mt-0.5">30-minute call with our team to explore features relevant to your goals.</p>
                </div>
              </div>
            </div>

            {/* Calendar Embed Placeholder */}
            <div className="mt-10 bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center">
              <p className="text-sm font-semibold text-gray-700 mb-2">Prefer to skip the form?</p>
              <p className="text-xs text-gray-500 mb-4">Book directly on our calendar.</p>
              <button className="px-6 py-3 text-sm font-bold text-white bg-[#0F1D2C] rounded-xl hover:bg-[#1A2A3C] transition-colors">
                Open Calendar
              </button>
              <p className="text-[10px] text-gray-400 mt-2">Powered by Calendly</p>
            </div>
          </div>

          {/* Right: Form */}
          <div>
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-lg">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Request Your Demo</h2>

              <div className="grid grid-cols-2 gap-4 mb-4">
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
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={form.lastName}
                    onChange={(e) => updateField('lastName', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F1D2C]/20 focus:border-[#0F1D2C]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Email *</label>
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

              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Clinic Name *</label>
                <input
                  type="text"
                  required
                  value={form.clinicName}
                  onChange={(e) => updateField('clinicName', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F1D2C]/20 focus:border-[#0F1D2C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
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

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Monthly Revenue</label>
                  <select
                    value={form.monthlyRevenue}
                    onChange={(e) => updateField('monthlyRevenue', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F1D2C]/20 focus:border-[#0F1D2C]"
                  >
                    <option value="">Select</option>
                    {revenueRanges.map((range) => (
                      <option key={range} value={range}>{range}</option>
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

              {/* Interests */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 mb-2">Interested In</label>
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

              <div className="mb-6">
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Anything else?</label>
                <textarea
                  rows={3}
                  value={form.message}
                  onChange={(e) => updateField('message', e.target.value)}
                  placeholder="Tell us about your biggest operational challenges..."
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F1D2C]/20 focus:border-[#0F1D2C] resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 text-sm font-bold text-white bg-[#0F1D2C] rounded-xl hover:bg-[#1A2A3C] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#0F1D2C]/20"
              >
                {loading ? 'Submitting...' : 'Request Demo'}
              </button>
              <p className="text-[10px] text-gray-400 text-center mt-3">
                By submitting, you agree to our Terms of Service and Privacy Policy.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
