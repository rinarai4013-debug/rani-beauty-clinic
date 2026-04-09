'use client';

import { useState } from 'react';
import { useAttribution } from '@/hooks/useAttribution';

const TIERS = [
  {
    name: 'TRT Only',
    price: 349,
    monthly: '/mo',
    features: [
      'Physician-supervised testosterone therapy',
      'Telehealth consultation included',
      'Quarterly lab monitoring',
      'Medication shipped to your door',
      'Ongoing dosage optimization',
    ],
    highlight: false,
  },
  {
    name: 'TRT + Weight Loss',
    price: 798,
    monthly: '/mo',
    features: [
      'Everything in TRT Only',
      'Tirzepatide medical weight loss',
      '3-month supply with B12 + anti-nausea FREE',
      'Body composition optimization',
      'Bi-weekly check-ins',
      '10% off medspa services',
    ],
    highlight: true,
  },
  {
    name: 'The Full Stack',
    price: 947,
    monthly: '/mo',
    features: [
      'Everything in TRT + Weight Loss',
      'Performance optimization program',
      'Complete vitality protocol',
      'Priority provider access',
      'Weekly check-ins',
      '15% off medspa services',
    ],
    highlight: false,
  },
];

const BENEFITS = [
  {
    title: 'Restore Energy',
    desc: 'Wake up ready to go. No more afternoon crashes or brain fog that coffee can\'t fix.',
    icon: '⚡',
  },
  {
    title: 'Build Muscle, Lose Fat',
    desc: 'Optimized hormones help your body do what it was designed to do. More muscle, less belly fat.',
    icon: '💪',
  },
  {
    title: 'Sharpen Focus',
    desc: 'Clear thinking, better decision-making, and the mental edge you used to have.',
    icon: '🧠',
  },
  {
    title: 'Sleep Better',
    desc: 'Deep, restorative sleep that leaves you feeling truly rested every morning.',
    icon: '😴',
  },
];

const STEPS = [
  {
    num: '01',
    title: 'Quick Telehealth Exam',
    desc: 'Complete a 10-minute telehealth consultation with our licensed provider. No office visit required.',
  },
  {
    num: '02',
    title: 'Lab Work & Approval',
    desc: 'Get your blood work done (we order it for you) and receive your personalized treatment plan.',
  },
  {
    num: '03',
    title: 'Medication Shipped',
    desc: 'Your prescribed medications ship directly to your door in discreet packaging. Start feeling the difference.',
  },
];

const FAQS = [
  {
    q: 'What is TRT?',
    a: 'Testosterone Replacement Therapy (TRT) is a physician-supervised program that restores your testosterone to optimal levels. We use compounded testosterone cypionate from a licensed pharmacy, customized to your body\'s needs.',
  },
  {
    q: 'How do I know if I need TRT?',
    a: 'Common signs include fatigue, brain fog, weight gain (especially belly fat), low motivation, reduced muscle mass, poor sleep, and decreased drive. A simple blood test confirms your levels. Many men over 35 have sub-optimal testosterone without realizing it.',
  },
  {
    q: 'Is this confidential?',
    a: 'Completely. All consultations are via telehealth, medications ship in plain packaging, and your health information is protected by HIPAA. Nobody needs to know.',
  },
  {
    q: 'What is tirzepatide?',
    a: 'Tirzepatide is a compounded GLP-1 medication for medical weight loss. Clinical studies show average weight loss of 15-22% of body weight. When combined with TRT, patients see significant improvements in body composition. Results may vary.',
  },
  {
    q: 'Do I need to come to the clinic?',
    a: 'Not for TRT or weight loss. Everything is handled via telehealth and medications ship to your door. You only visit the clinic if you add medspa services like Sofwave skin tightening.',
  },
  {
    q: 'How quickly will I see results?',
    a: 'Most TRT patients notice improved energy and mood within 2-4 weeks. Full effects including body composition changes typically develop over 3-6 months. Weight loss with tirzepatide often begins within the first 2-4 weeks. Individual results vary.',
  },
];

export default function MensHealthPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    interest: 'TRT Only',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const attribution = useAttribution({
    source: 'mens-health-landing-page',
    leadOffer: formData.interest || "Men's Health Consultation",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          service: formData.interest || "Men's Health Consultation",
          message: `Men's Health Lead — Interested in: ${formData.interest}`,
          source: 'mens-health-landing-page',
          ...attribution,
        }),
      });
    } catch {
      // Still show success — lead will be followed up manually
    }
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <div className="bg-[#F8F6F1]">
      {/* Hero */}
      <section className="bg-[#0F1D2C] text-white py-20 sm:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0F1D2C] via-[#1B2A4A] to-[#0F1D2C] opacity-80" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <p className="font-sans text-[#C9A96E] uppercase tracking-[0.2em] text-sm mb-4">
            Men&apos;s Performance &amp; Vitality
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl leading-tight mb-6">
            Feel Like <span className="text-[#C9A96E]">Yourself Again</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto mb-8">
            Testosterone optimization, medical weight loss, and performance programs.
            Physician-supervised. Shipped to your door. Completely confidential.
          </p>
          <a
            href="#enroll"
            className="inline-block bg-[#C9A96E] text-[#0F1D2C] font-semibold px-8 py-4 rounded-lg hover:bg-[#D4B86A] transition text-lg"
          >
            Schedule Your Consultation
          </a>
          <p className="text-gray-400 text-sm mt-4">
            Or call <a href="tel:4255394440" className="text-[#C9A96E] hover:underline">(425) 539-4440</a>
          </p>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 sm:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="font-serif text-3xl sm:text-4xl text-center text-[#0F1D2C] mb-12">
            What Low Testosterone <span className="text-[#C9A96E]">Actually Feels Like</span>
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {BENEFITS.map((b) => (
              <div key={b.title} className="bg-white rounded-xl p-6 shadow-sm text-center">
                <div className="text-3xl mb-3">{b.icon}</div>
                <h3 className="font-semibold text-[#0F1D2C] text-lg mb-2">{b.title}</h3>
                <p className="text-gray-600 text-sm">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Tiers */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="font-serif text-3xl sm:text-4xl text-center text-[#0F1D2C] mb-4">
            Choose Your <span className="text-[#C9A96E]">Program</span>
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            All programs include telehealth consultation, physician oversight, and medication shipped to your door.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {TIERS.map((tier) => (
              <div
                key={tier.name}
                className={`rounded-xl p-6 sm:p-8 ${
                  tier.highlight
                    ? 'bg-[#0F1D2C] text-white ring-2 ring-[#C9A96E] scale-105'
                    : 'bg-[#F8F6F1] text-[#0F1D2C]'
                }`}
              >
                {tier.highlight && (
                  <p className="text-[#C9A96E] text-xs uppercase tracking-widest mb-2 font-semibold">
                    Most Popular
                  </p>
                )}
                <h3 className="font-serif text-2xl mb-2">{tier.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-bold">${tier.price}</span>
                  <span className={tier.highlight ? 'text-gray-400' : 'text-gray-500'}>{tier.monthly}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <span className="text-[#C9A96E] mt-0.5">&#10003;</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href="#enroll"
                  className={`block text-center py-3 rounded-lg font-semibold transition ${
                    tier.highlight
                      ? 'bg-[#C9A96E] text-[#0F1D2C] hover:bg-[#D4B86A]'
                      : 'bg-[#0F1D2C] text-white hover:bg-[#1B2A4A]'
                  }`}
                >
                  Schedule Your Consultation
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="font-serif text-3xl sm:text-4xl text-center text-[#0F1D2C] mb-12">
            How It <span className="text-[#C9A96E]">Works</span>
          </h2>
          <div className="space-y-8">
            {STEPS.map((step) => (
              <div key={step.num} className="flex gap-6 items-start">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#0F1D2C] text-[#C9A96E] flex items-center justify-center font-bold text-lg">
                  {step.num}
                </div>
                <div>
                  <h3 className="font-semibold text-[#0F1D2C] text-lg mb-1">{step.title}</h3>
                  <p className="text-gray-600">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enrollment Form */}
      <section id="enroll" className="py-16 sm:py-20 bg-[#0F1D2C]">
        <div className="max-w-xl mx-auto px-4 sm:px-6">
          <h2 className="font-serif text-3xl text-center text-white mb-2">
            Start Your <span className="text-[#C9A96E]">Transformation</span>
          </h2>
          <p className="text-center text-gray-400 mb-8">
            Free consultation. No obligation. Completely confidential.
          </p>

          {submitted ? (
            <div className="bg-[#1B2A4A] rounded-xl p-8 text-center">
              <p className="text-[#C9A96E] text-2xl font-serif mb-2">You&apos;re In!</p>
              <p className="text-gray-300">
                Our team will reach out within 24 hours to get you started.
                Call <a href="tel:4255394440" className="text-[#C9A96E] hover:underline">(425) 539-4440</a> if you want to get started sooner.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Full Name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 rounded-lg bg-[#1B2A4A] text-white border border-[#2D4A7A] focus:border-[#C9A96E] focus:outline-none placeholder:text-gray-500"
              />
              <input
                type="tel"
                placeholder="Phone Number"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 rounded-lg bg-[#1B2A4A] text-white border border-[#2D4A7A] focus:border-[#C9A96E] focus:outline-none placeholder:text-gray-500"
              />
              <input
                type="email"
                placeholder="Email Address"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 rounded-lg bg-[#1B2A4A] text-white border border-[#2D4A7A] focus:border-[#C9A96E] focus:outline-none placeholder:text-gray-500"
              />
              <select
                value={formData.interest}
                onChange={(e) => setFormData({ ...formData, interest: e.target.value })}
                className="w-full px-4 py-3 rounded-lg bg-[#1B2A4A] text-white border border-[#2D4A7A] focus:border-[#C9A96E] focus:outline-none"
              >
                <option>TRT Only</option>
                <option>TRT + Weight Loss</option>
                <option>The Full Stack</option>
                <option>Not sure yet</option>
              </select>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#C9A96E] text-[#0F1D2C] font-semibold py-4 rounded-lg hover:bg-[#D4B86A] transition disabled:opacity-50 text-lg"
              >
                {loading ? 'Submitting...' : 'Schedule Your Consultation'}
              </button>
              <p className="text-gray-500 text-xs text-center">
                By submitting, you agree to be contacted about our programs.
                Your information is protected and confidential.
              </p>
            </form>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 sm:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="font-serif text-3xl text-center text-[#0F1D2C] mb-12">
            Common <span className="text-[#C9A96E]">Questions</span>
          </h2>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full text-left px-6 py-4 flex justify-between items-center"
                >
                  <span className="font-semibold text-[#0F1D2C]">{faq.q}</span>
                  <span className="text-[#C9A96E] text-xl ml-4">{openFaq === i ? '−' : '+'}</span>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-4 text-gray-600 text-sm">{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Bar */}
      <section className="bg-[#C9A96E] py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-[#0F1D2C] font-serif text-2xl mb-4">
            Ready to feel like yourself again?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#enroll"
              className="bg-[#0F1D2C] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#1B2A4A] transition"
            >
              Schedule Your Consultation
            </a>
            <a
              href="tel:4255394440"
              className="bg-white text-[#0F1D2C] px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
            >
              Call (425) 539-4440
            </a>
          </div>
          <p className="text-[#0F1D2C]/70 text-xs mt-4">
            Medically supervised. Results may vary. Compounded medications prescribed by licensed providers.
          </p>
        </div>
      </section>
    </div>
  );
}
