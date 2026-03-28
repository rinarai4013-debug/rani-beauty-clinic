'use client';

import { useState } from 'react';
import Link from 'next/link';

// =============================================================================
// Affiliate Program Marketing Page
// Commission structure, how it works, apply form, success stories, FAQ
// =============================================================================

const commissionTiers = [
  {
    name: 'Bronze',
    rate: '10%',
    requirement: '0-4 referrals',
    color: '#CD7F32',
    perks: [
      '10% recurring commission on all referrals',
      'Unique tracking link',
      'Basic promotional materials',
      'Monthly payout via PayPal or ACH',
      '90-day attribution window',
    ],
  },
  {
    name: 'Silver',
    rate: '15%',
    requirement: '5-14 referrals',
    color: '#C0C0C0',
    perks: [
      '15% recurring commission on all referrals',
      'Custom campaign tracking links',
      'Full promotional kit (banners, emails, social)',
      'Bi-weekly payouts',
      '90-day attribution window',
      'Priority affiliate support',
    ],
  },
  {
    name: 'Gold',
    rate: '20%',
    requirement: '15+ referrals',
    color: '#C9A96E',
    perks: [
      '20% recurring commission on all referrals',
      'Dedicated affiliate manager',
      'Co-branded landing pages',
      'Weekly payouts',
      '120-day attribution window',
      'Early access to new features',
      'Quarterly bonus incentives',
      'Speaking opportunity at events',
    ],
  },
];

const howItWorks = [
  {
    step: 1,
    title: 'Apply and get approved',
    description: 'Fill out the application below. We review within 48 hours and send your unique tracking link.',
  },
  {
    step: 2,
    title: 'Share with your network',
    description: 'Use your link, banners, email templates, and social posts to refer med spas, clinics, and practices.',
  },
  {
    step: 3,
    title: 'Earn recurring commissions',
    description: 'Get paid every month for as long as your referrals stay subscribed. Commissions increase as you refer more.',
  },
];

const successStories = [
  {
    name: 'Dr. Amanda Rodriguez',
    title: 'Aesthetic Medicine Consultant',
    referrals: 23,
    tier: 'Gold',
    monthlyEarnings: '$4,580',
    quote: 'I recommend RaniOS to every practice I consult with. The recurring commissions have become a meaningful part of my income.',
  },
  {
    name: 'Mark Thompson',
    title: 'Med Spa Business Coach',
    referrals: 12,
    tier: 'Silver',
    monthlyEarnings: '$2,245',
    quote: 'My clients love RaniOS and I love the passive income. Win-win. The promotional materials make sharing incredibly easy.',
  },
  {
    name: 'Lisa Park',
    title: 'Practice Management Consultant',
    referrals: 8,
    tier: 'Silver',
    monthlyEarnings: '$1,198',
    quote: 'Started referring RaniOS 4 months ago. Already earned more than I expected, and the platform basically sells itself.',
  },
];

const faqs = [
  {
    q: 'How does the commission work?',
    a: 'You earn a percentage of the monthly subscription fee for every referral that converts to a paid plan. Commissions are recurring, meaning you get paid every month for as long as the referred customer stays active.',
  },
  {
    q: 'When do I get paid?',
    a: 'Bronze affiliates are paid monthly. Silver affiliates get bi-weekly payouts. Gold affiliates receive weekly payouts. All payments are processed via PayPal or direct ACH transfer. Minimum payout threshold is $50.',
  },
  {
    q: 'How long is the attribution window?',
    a: 'Bronze and Silver tiers have a 90-day cookie window. Gold tier gets 120 days. If someone clicks your link and signs up within that window, you get credit for the referral.',
  },
  {
    q: 'Who can become an affiliate?',
    a: 'Anyone in the healthcare or beauty industry can apply. Consultants, coaches, practice managers, equipment reps, software reviewers, and industry influencers are all great fits. We review every application individually.',
  },
  {
    q: 'What promotional materials do you provide?',
    a: 'We provide banner ads (multiple sizes), email templates, social media post templates, one-pagers, comparison guides, and video testimonials. Gold affiliates also get co-branded landing pages.',
  },
  {
    q: 'Can I refer my own practice?',
    a: 'No, self-referrals are not eligible for commissions. The affiliate program is designed for referring other businesses to RaniOS.',
  },
];

const earningsExamples = [
  { referrals: 3, plan: 'Starter ($199)', rate: '10%', monthly: '$59.70', annual: '$716' },
  { referrals: 5, plan: 'Pro ($499)', rate: '15%', monthly: '$374.25', annual: '$4,491' },
  { referrals: 10, plan: 'Mixed', rate: '15%', monthly: '$748.50', annual: '$8,982' },
  { referrals: 20, plan: 'Mixed', rate: '20%', monthly: '$1,994', annual: '$23,928' },
];

interface ApplicationForm {
  name: string;
  email: string;
  website: string;
  company: string;
  audienceSize: string;
  audienceType: string;
  howPromote: string;
  referralEstimate: string;
}

export default function AffiliatesPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState<ApplicationForm>({
    name: '',
    email: '',
    website: '',
    company: '',
    audienceSize: '',
    audienceType: '',
    howPromote: '',
    referralEstimate: '',
  });

  const updateField = (field: keyof ApplicationForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
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
            <Link href="/marketing/pricing" className="text-sm text-gray-600 hover:text-gray-900">Pricing</Link>
            <Link href="/marketing/demo" className="text-sm text-gray-600 hover:text-gray-900">Demo</Link>
            <Link href="/marketing/affiliates" className="text-sm text-gray-900 font-semibold">Affiliates</Link>
          </div>
          <Link href="/marketing/demo" className="px-5 py-2.5 text-sm font-bold text-white bg-[#0F1D2C] rounded-xl hover:bg-[#1A2A3C] transition-colors">
            Start Free Trial
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#FAF8F5] to-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block px-3 py-1 bg-[#C9A96E]/10 text-[#C9A96E] text-xs font-bold rounded-full mb-4">
            Affiliate Program
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-[#0F1D2C] mb-4">
            Earn up to 20% recurring commissions
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-8">
            Refer med spas and clinics to RaniOS and earn commissions every month for as long as they stay. No cap on earnings.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => setShowForm(true)}
              className="px-8 py-4 text-base font-bold text-white bg-[#0F1D2C] rounded-2xl hover:bg-[#1A2A3C] transition-all shadow-xl"
            >
              Apply Now
            </button>
            <a
              href="#how-it-works"
              className="px-8 py-4 text-base font-medium text-gray-600 border border-gray-200 rounded-2xl hover:bg-gray-50 transition-all"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 bg-[#0F1D2C]">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: '20%', label: 'Max Commission Rate' },
            { value: '$4,580', label: 'Top Affiliate Earnings/Mo' },
            { value: '90 days', label: 'Attribution Window' },
            { value: '$0', label: 'Cost to Join' },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-2xl font-bold text-[#F3D6BE]">{stat.value}</p>
              <p className="text-xs text-white/60 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#0F1D2C]">How It Works</h2>
            <p className="text-gray-500 mt-2">Three simple steps to start earning recurring commissions.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {howItWorks.map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-14 h-14 bg-[#0F1D2C] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-[#F3D6BE] text-lg font-bold">{item.step}</span>
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Commission Tiers */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#FAF8F5]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#0F1D2C]">Commission Tiers</h2>
            <p className="text-gray-500 mt-2">The more you refer, the more you earn. Commissions are recurring.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {commissionTiers.map((tier) => (
              <div
                key={tier.name}
                className={`bg-white rounded-2xl border p-6 transition-all ${
                  tier.name === 'Gold'
                    ? 'border-[#C9A96E] shadow-xl scale-[1.02]'
                    : 'border-gray-200 shadow-sm'
                }`}
              >
                {tier.name === 'Gold' && (
                  <div className="text-center mb-3">
                    <span className="text-[10px] font-bold text-[#C9A96E] bg-[#C9A96E]/10 px-3 py-1 rounded-full">
                      Best Value
                    </span>
                  </div>
                )}
                <div className="text-center mb-4">
                  <div
                    className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center"
                    style={{ backgroundColor: `${tier.color}20` }}
                  >
                    <span className="text-lg font-bold" style={{ color: tier.color }}>
                      {tier.rate}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">{tier.name}</h3>
                  <p className="text-xs text-gray-500">{tier.requirement}</p>
                </div>

                <ul className="space-y-2">
                  {tier.perks.map((perk) => (
                    <li key={perk} className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-xs text-gray-600">{perk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Earnings Calculator */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#0F1D2C]">Earnings Examples</h2>
            <p className="text-gray-500 mt-2">See how quickly commissions add up with recurring revenue.</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="grid grid-cols-5 bg-gray-50 border-b border-gray-200 p-3">
              <span className="text-xs font-bold text-gray-500">Referrals</span>
              <span className="text-xs font-bold text-gray-500">Avg Plan</span>
              <span className="text-xs font-bold text-gray-500">Rate</span>
              <span className="text-xs font-bold text-gray-500">Monthly</span>
              <span className="text-xs font-bold text-gray-500">Annual</span>
            </div>
            {earningsExamples.map((ex, i) => (
              <div key={i} className="grid grid-cols-5 p-3 border-b border-gray-100 last:border-b-0">
                <span className="text-xs font-bold text-gray-900">{ex.referrals}</span>
                <span className="text-xs text-gray-600">{ex.plan}</span>
                <span className="text-xs text-gray-600">{ex.rate}</span>
                <span className="text-xs font-bold text-emerald-600">{ex.monthly}</span>
                <span className="text-xs font-bold text-gray-900">{ex.annual}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#FAF8F5]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#0F1D2C]">Affiliate Success Stories</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {successStories.map((story) => (
              <div key={story.name} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <p className="text-xs text-gray-600 leading-relaxed mb-4">&quot;{story.quote}&quot;</p>
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-sm font-bold text-gray-900">{story.name}</p>
                  <p className="text-[10px] text-gray-500">{story.title}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[10px] font-bold text-[#C9A96E] bg-[#C9A96E]/10 px-2 py-0.5 rounded-full">
                      {story.tier}
                    </span>
                    <span className="text-[10px] text-gray-500">{story.referrals} referrals</span>
                    <span className="text-[10px] font-bold text-emerald-600">{story.monthlyEarnings}/mo</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section id="apply" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#0F1D2C]">Apply to Join</h2>
            <p className="text-gray-500 mt-2">Applications are reviewed within 48 hours.</p>
          </div>

          {submitted ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-[#0F1D2C] mb-2">Application Submitted!</h3>
              <p className="text-gray-500 mb-6">
                Thank you, {form.name}! We&apos;ll review your application and get back to you at {form.email} within 48 hours.
              </p>
              <Link href="/marketing" className="text-sm font-bold text-[#0F1D2C] underline">
                Back to Home
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-lg">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => updateField('name', e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F1D2C]/20 focus:border-[#0F1D2C]"
                    />
                  </div>
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
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Company / Brand</label>
                    <input
                      type="text"
                      value={form.company}
                      onChange={(e) => updateField('company', e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F1D2C]/20 focus:border-[#0F1D2C]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Website / Social</label>
                    <input
                      type="text"
                      value={form.website}
                      onChange={(e) => updateField('website', e.target.value)}
                      placeholder="https://"
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F1D2C]/20 focus:border-[#0F1D2C]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Audience Size</label>
                    <select
                      value={form.audienceSize}
                      onChange={(e) => updateField('audienceSize', e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F1D2C]/20 focus:border-[#0F1D2C]"
                    >
                      <option value="">Select</option>
                      <option value="under-100">Under 100</option>
                      <option value="100-500">100-500</option>
                      <option value="500-2000">500-2,000</option>
                      <option value="2000-10000">2,000-10,000</option>
                      <option value="10000+">10,000+</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Audience Type</label>
                    <select
                      value={form.audienceType}
                      onChange={(e) => updateField('audienceType', e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F1D2C]/20 focus:border-[#0F1D2C]"
                    >
                      <option value="">Select</option>
                      <option value="clinic-owners">Clinic Owners</option>
                      <option value="practice-managers">Practice Managers</option>
                      <option value="physicians">Physicians/Providers</option>
                      <option value="industry-peers">Industry Peers</option>
                      <option value="mixed">Mixed Healthcare</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">How will you promote RaniOS?</label>
                  <textarea
                    rows={3}
                    value={form.howPromote}
                    onChange={(e) => updateField('howPromote', e.target.value)}
                    placeholder="Email list, social media, in-person consulting, blog, podcast..."
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F1D2C]/20 focus:border-[#0F1D2C] resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Estimated Monthly Referrals</label>
                  <select
                    value={form.referralEstimate}
                    onChange={(e) => updateField('referralEstimate', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F1D2C]/20 focus:border-[#0F1D2C]"
                  >
                    <option value="">Select</option>
                    <option value="1-2">1-2</option>
                    <option value="3-5">3-5</option>
                    <option value="6-10">6-10</option>
                    <option value="10+">10+</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-6 py-3.5 text-sm font-bold text-white bg-[#0F1D2C] rounded-xl hover:bg-[#1A2A3C] transition-all shadow-lg shadow-[#0F1D2C]/20"
              >
                Submit Application
              </button>
              <p className="text-[10px] text-gray-400 text-center mt-3">
                By applying, you agree to our Affiliate Terms of Service.
              </p>
            </form>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#FAF8F5]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#0F1D2C]">Affiliate FAQ</h2>
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
          <h2 className="text-2xl font-bold text-white mb-4">Start earning today</h2>
          <p className="text-white/60 mb-6">
            Join our affiliate program and earn recurring commissions for every practice you refer to RaniOS.
          </p>
          <button
            onClick={() => {
              setShowForm(true);
              document.getElementById('apply')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-8 py-4 text-base font-bold text-[#0F1D2C] bg-[#F3D6BE] rounded-2xl hover:bg-[#F8E5D5] transition-all shadow-xl"
          >
            Apply to the Affiliate Program
          </button>
        </div>
      </section>
    </div>
  );
}
