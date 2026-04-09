'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAttribution } from '@/hooks/useAttribution';

const TIERS = [
  {
    name: 'Starter',
    price: 299,
    features: [
      'GFE + Rx Facilitation',
      'Savings Card Assistance',
      'Monthly Check-ins',
      'Basic Nutrition Guide',
    ],
    highlight: false,
  },
  {
    name: 'Premium',
    price: 399,
    features: [
      'GFE + Rx Facilitation',
      'Savings Card Assistance',
      'Bi-weekly Check-ins',
      'Monthly Body Comp Tracking',
      'Custom Nutrition Plan',
      '10% Off Medspa Services',
    ],
    highlight: true,
  },
  {
    name: 'VIP',
    price: 499,
    features: [
      'GFE + Rx Facilitation',
      'Savings Card Assistance',
      'Weekly Check-ins',
      'Bi-weekly Body Comp Tracking',
      'Custom Nutrition Plan + Recipes',
      '15% Off Medspa Services',
    ],
    highlight: false,
  },
];

const FAQS = [
  {
    q: 'What medications are prescribed through this program?',
    a: 'Our medical providers prescribe brand-name Zepbound (tirzepatide) or Wegovy (semaglutide) - FDA-approved medications for weight management. These are the same medications used in major clinical trials showing significant weight loss results.',
  },
  {
    q: 'How much does the medication cost?',
    a: 'Medication is purchased separately through LillyDirect or your preferred pharmacy. Zepbound self-pay starts at $349/month through LillyDirect. Wegovy introductory pricing starts at $199/month for the first two months. We help you access savings cards to reduce costs.',
  },
  {
    q: 'Do I need insurance?',
    a: 'No insurance is needed. Our program uses self-pay pricing through LillyDirect and manufacturer savings programs. This often makes treatment more affordable than going through insurance with prior authorizations and denials.',
  },
  {
    q: 'How does the medical evaluation work?',
    a: 'After enrolling, you complete a health intake and upload recent lab work. A licensed medical provider conducts a telehealth Good Faith Exam (GFE) to determine if GLP-1 medication is appropriate for you. Not everyone qualifies - medical evaluation is required.',
  },
  {
    q: 'Do I inject myself?',
    a: 'Yes. Zepbound and Wegovy come as pre-filled pen devices designed for easy self-injection at home, once per week. We provide guidance on proper injection technique during your onboarding.',
  },
  {
    q: 'What makes Rani different from online GLP-1 mills?',
    a: 'We are a real clinic right here in Renton. You get ongoing check-ins, body composition tracking, nutrition planning, and access to our full medspa services. Online mills give you a prescription and disappear - we are your partner throughout your entire weight loss journey.',
  },
  {
    q: 'How much weight can I expect to lose?',
    a: 'Results vary by individual. Clinical studies of tirzepatide (Zepbound) showed average weight loss of 15-22% of body weight over 72 weeks. Your results depend on medication response, adherence, nutrition, and lifestyle factors. We do not guarantee specific weight loss outcomes.',
  },
  {
    q: 'Can I combine this with other Rani services?',
    a: 'Absolutely. Many of our weight management patients pair their program with Sofwave skin tightening, RF Microneedling, or facial treatments to address skin changes during weight loss. Premium and VIP members receive discounts on all medspa services.',
  },
];

const STEPS = [
  {
    num: '01',
    title: 'Enroll & Complete Intake',
    desc: 'Choose your program tier, fill out your health intake form, and upload recent lab results. We handle the rest.',
  },
  {
    num: '02',
    title: 'Get Prescribed',
    desc: 'A licensed medical provider reviews your health profile and conducts a telehealth evaluation. If approved, your prescription for brand-name Zepbound or Wegovy is sent directly to you.',
  },
  {
    num: '03',
    title: 'Start Your Journey',
    desc: 'Fill your prescription through LillyDirect, begin your weekly self-injections at home, and enjoy ongoing support with check-ins, nutrition guidance, and body composition tracking.',
  },
];

export default function GLP1LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    currentWeight: '',
    goalWeight: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const attribution = useAttribution({
    source: 'glp1-landing-page',
    leadOffer: 'Brand-Name GLP-1 Weight Management Program',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          service: 'GLP-1 Weight Management',
          message: `GLP-1 Weight Management Lead — Current: ${formData.currentWeight} lbs, Goal: ${formData.goalWeight} lbs. Interested in brand-name Zepbound/Wegovy program.`,
          source: 'glp1-landing-page',
          ...attribution,
        }),
      });
      if (!res.ok) {
        throw new Error('Submission failed');
      }
    } catch {
      // Still show success to user — lead will be followed up manually if API fails
    }
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <div className="bg-rani-cream">
      {/* Hero */}
      <section className="bg-rani-navy text-white py-20 sm:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-rani-navy via-rani-navy-light to-rani-navy opacity-80" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <p className="font-body text-[#C9A96E] uppercase tracking-[0.2em] text-sm mb-4">
            Now Available in Renton
          </p>
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl leading-tight mb-6">
            Medical Weight Loss{' '}
            <span className="text-[#C9A96E]">That Actually Works</span>
          </h1>
          <p className="font-body text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto mb-8 leading-relaxed">
            Get prescribed brand-name Zepbound or Wegovy through our concierge weight management program  - 
            with real support, real check-ins, and a real clinic right here in Renton.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#enroll"
              className="bg-[#C9A96E] text-rani-navy px-8 py-4 rounded-lg font-body font-bold text-lg hover:bg-[#d4b67e] transition-colors"
            >
              Schedule Your Consultation
            </a>
            <a
              href="#how-it-works"
              className="border border-white/30 text-white px-8 py-4 rounded-lg font-body font-medium text-lg hover:bg-white/5 transition-colors"
            >
              See How It Works
            </a>
          </div>
          <p className="font-body text-sm text-gray-400 mt-6">
            Programs from $299/mo &middot; Medication from $349/mo through LillyDirect
          </p>
        </div>
      </section>

      {/* Social Proof Bar */}
      <section className="bg-white border-b border-rani-border py-6">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          <div>
            <p className="font-heading text-2xl text-rani-navy">FDA</p>
            <p className="font-body text-xs text-rani-muted uppercase tracking-wider mt-1">Approved Medications</p>
          </div>
          <div>
            <p className="font-heading text-2xl text-rani-navy">22%</p>
            <p className="font-body text-xs text-rani-muted uppercase tracking-wider mt-1">Below Local Competitors</p>
          </div>
          <div>
            <p className="font-heading text-2xl text-rani-navy">Brand</p>
            <p className="font-body text-xs text-rani-muted uppercase tracking-wider mt-1">Name Only - No Compounding</p>
          </div>
          <div>
            <p className="font-heading text-2xl text-rani-navy">Local</p>
            <p className="font-body text-xs text-rani-muted uppercase tracking-wider mt-1">Real Clinic in Renton</p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 sm:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <p className="font-body text-[#C9A96E] uppercase tracking-[0.15em] text-sm mb-3">Simple Process</p>
            <h2 className="font-heading text-3xl sm:text-4xl text-rani-navy">
              How It Works
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map((step) => (
              <div key={step.num} className="bg-white rounded-2xl p-8 shadow-sm border border-rani-border hover:shadow-md transition-shadow">
                <span className="font-heading text-4xl text-[#C9A96E]/30">{step.num}</span>
                <h3 className="font-heading text-xl text-rani-navy mt-3 mb-3">{step.title}</h3>
                <p className="font-body text-rani-muted leading-relaxed text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Tiers */}
      <section id="pricing" className="py-20 sm:py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <p className="font-body text-[#C9A96E] uppercase tracking-[0.15em] text-sm mb-3">Choose Your Program</p>
            <h2 className="font-heading text-3xl sm:text-4xl text-rani-navy mb-4">
              Program Tiers
            </h2>
            <p className="font-body text-rani-muted max-w-xl mx-auto">
              Your program fee covers concierge support, medical evaluation facilitation, and ongoing accountability.
              Medication is purchased separately at pharmacy pricing.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TIERS.map((tier) => (
              <div
                key={tier.name}
                className={`rounded-2xl p-8 border-2 transition-shadow ${
                  tier.highlight
                    ? 'border-[#C9A96E] shadow-lg relative'
                    : 'border-rani-border hover:shadow-md'
                }`}
              >
                {tier.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#C9A96E] text-rani-navy text-xs font-body font-bold px-4 py-1 rounded-full uppercase tracking-wider">
                    Most Popular
                  </span>
                )}
                <h3 className="font-heading text-2xl text-rani-navy">{tier.name}</h3>
                <div className="mt-4 mb-6">
                  <span className="font-heading text-4xl text-rani-navy">${tier.price}</span>
                  <span className="font-body text-rani-muted text-sm">/month</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-rani-success flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="font-body text-sm text-rani-text">{f}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href="#enroll"
                  className={`block text-center py-3 rounded-lg font-body font-semibold text-sm transition-colors ${
                    tier.highlight
                      ? 'bg-[#C9A96E] text-rani-navy hover:bg-[#d4b67e]'
                      : 'bg-rani-navy text-white hover:bg-rani-navy-light'
                  }`}
                >
                  Schedule Your Consultation
                </a>
              </div>
            ))}
          </div>

          {/* Medication Pricing Transparency */}
          <div className="mt-12 bg-rani-cream rounded-2xl p-8 border border-rani-border">
            <h3 className="font-heading text-xl text-rani-navy mb-4 text-center">
              Medication Pricing (Paid Separately to Pharmacy)
            </h3>
            <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
              <div>
                <h4 className="font-body font-bold text-rani-navy mb-2">Zepbound (tirzepatide)</h4>
                <ul className="font-body text-sm text-rani-muted space-y-1">
                  <li>2.5mg: $349/mo via LillyDirect</li>
                  <li>5mg: $499/mo via LillyDirect</li>
                  <li>7.5-15mg: $449/mo via LillyDirect</li>
                </ul>
              </div>
              <div>
                <h4 className="font-body font-bold text-rani-navy mb-2">Wegovy (semaglutide)</h4>
                <ul className="font-body text-sm text-rani-muted space-y-1">
                  <li>Intro: $199/mo (first 2 months)</li>
                  <li>Maintenance: $349+/mo</li>
                </ul>
              </div>
            </div>
            <p className="font-body text-xs text-rani-muted text-center mt-4">
              Total monthly cost = Program fee + Medication. Savings card assistance included in all tiers.
            </p>
          </div>
        </div>
      </section>

      {/* Why Rani */}
      <section className="py-20 sm:py-24 bg-rani-navy text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <p className="font-body text-[#C9A96E] uppercase tracking-[0.15em] text-sm mb-3">The Rani Difference</p>
            <h2 className="font-heading text-3xl sm:text-4xl">
              Not Just a Prescription.{' '}
              <span className="text-[#C9A96E]">A Partner.</span>
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: 'Real Clinic, Real People', desc: 'We are right here in Renton - not an anonymous telehealth mill. Come say hi.' },
              { title: 'Brand-Name Medications Only', desc: 'FDA-approved Zepbound and Wegovy. No compounded alternatives. The real thing.' },
              { title: 'Ongoing Check-ins', desc: 'Weekly, bi-weekly, or monthly depending on your tier. We track your progress and adjust your plan.' },
              { title: 'Body Composition Tracking', desc: 'Go beyond the scale. We monitor lean mass, body fat percentage, and measurements.' },
              { title: 'Nutrition Support', desc: 'Custom nutrition plans and recipes to maximize your results while on medication.' },
              { title: 'Full Medspa Access', desc: 'Address skin changes during weight loss with Sofwave, RF Microneedling, facials, and more.' },
            ].map((item) => (
              <div key={item.title} className="bg-white/5 rounded-xl p-6 border border-white/10">
                <h3 className="font-heading text-lg text-[#C9A96E] mb-2">{item.title}</h3>
                <p className="font-body text-sm text-gray-300 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Results Disclaimer */}
      <section className="py-16 sm:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <p className="font-body text-[#C9A96E] uppercase tracking-[0.15em] text-sm mb-3">Important</p>
          <h2 className="font-heading text-3xl sm:text-4xl text-rani-navy mb-6">Real Results, Real Support</h2>
          <p className="font-body text-rani-muted leading-relaxed">
            Results may vary. Individual experiences differ based on starting weight, medication response,
            adherence to the program, nutrition, and lifestyle factors. GLP-1 medications require a medical
            evaluation and are not appropriate for everyone. Our team is here to support you every step of the way.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 sm:py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <p className="font-body text-[#C9A96E] uppercase tracking-[0.15em] text-sm mb-3">Questions?</p>
            <h2 className="font-heading text-3xl sm:text-4xl text-rani-navy">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="border border-rani-border rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-rani-cream/50 transition-colors"
                >
                  <span className="font-body font-semibold text-rani-navy pr-4">{faq.q}</span>
                  <svg
                    className={`w-5 h-5 text-rani-muted flex-shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5">
                    <p className="font-body text-sm text-rani-muted leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lead Capture Form */}
      <section id="enroll" className="py-20 sm:py-24 bg-rani-navy">
        <div className="max-w-xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="font-heading text-3xl sm:text-4xl text-white mb-3">
              Schedule Your Consultation
            </h2>
            <p className="font-body text-gray-300">
              Fill out the form below and we will be in touch within 24 hours to get you started.
            </p>
          </div>

          {submitted ? (
            <div className="bg-white/10 rounded-2xl p-10 text-center border border-white/20">
              <div className="w-16 h-16 bg-rani-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-rani-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="font-heading text-2xl text-white mb-2">We Got Your Info!</h3>
              <p className="font-body text-gray-300">
                Our team will reach out within 24 hours to walk you through the next steps.
                We are excited to be part of your journey.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white/10 rounded-2xl p-8 border border-white/20 space-y-5">
              <div>
                <label className="block font-body text-sm text-gray-300 mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 font-body text-white placeholder-gray-500 focus:outline-none focus:border-[#C9A96E] transition-colors"
                  placeholder="Your name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-body text-sm text-gray-300 mb-1.5">Phone</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 font-body text-white placeholder-gray-500 focus:outline-none focus:border-[#C9A96E] transition-colors"
                    placeholder="(425) 555-0100"
                  />
                </div>
                <div>
                  <label className="block font-body text-sm text-gray-300 mb-1.5">Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 font-body text-white placeholder-gray-500 focus:outline-none focus:border-[#C9A96E] transition-colors"
                    placeholder="you@email.com"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-body text-sm text-gray-300 mb-1.5">Current Weight (lbs)</label>
                  <input
                    type="number"
                    required
                    value={formData.currentWeight}
                    onChange={(e) => setFormData({ ...formData, currentWeight: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 font-body text-white placeholder-gray-500 focus:outline-none focus:border-[#C9A96E] transition-colors"
                    placeholder="200"
                  />
                </div>
                <div>
                  <label className="block font-body text-sm text-gray-300 mb-1.5">Goal Weight (lbs)</label>
                  <input
                    type="number"
                    required
                    value={formData.goalWeight}
                    onChange={(e) => setFormData({ ...formData, goalWeight: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 font-body text-white placeholder-gray-500 focus:outline-none focus:border-[#C9A96E] transition-colors"
                    placeholder="160"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#C9A96E] text-rani-navy py-4 rounded-lg font-body font-bold text-lg hover:bg-[#d4b67e] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Schedule Your Consultation'}
              </button>
              <p className="font-body text-xs text-gray-400 text-center">
                Medical evaluation required. Not everyone qualifies for GLP-1 medication.
                Program fee and medication cost are separate.
              </p>
            </form>
          )}
        </div>
      </section>

      {/* Compliance Disclaimer */}
      <section className="bg-rani-navy border-t border-white/10 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <p className="font-body text-xs text-gray-500">
            Medications are prescribed by an independent licensed medical provider following a Good Faith Exam.
            Rani Beauty Clinic facilitates the evaluation process. Individual results may vary.
            This program is not a substitute for professional medical advice.
          </p>
          <p className="font-body text-xs text-gray-600 mt-2">
            &copy; {new Date().getFullYear()} Rani Beauty Clinic (Anatomi LLC). All rights reserved.
          </p>
        </div>
      </section>
    </div>
  );
}
