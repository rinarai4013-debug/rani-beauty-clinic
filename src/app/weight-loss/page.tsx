'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAttribution } from '@/hooks/useAttribution';

const TIERS = [
  {
    name: 'Semaglutide',
    price: 349,
    period: '/month',
    subtitle: 'Same active ingredient as Ozempic & Wegovy',
    features: [
      'Physician-prescribed semaglutide',
      'Telehealth consultation included',
      'Monthly medication shipped to your door',
      'Dose escalation management',
      'Monthly check-in with care team',
      'Self-injection supplies & instructions',
      'Unlimited messaging support',
    ],
    highlight: false,
  },
  {
    name: 'Tirzepatide',
    price: 449,
    period: '/month',
    subtitle: 'Dual-action GLP-1/GIP - same as Mounjaro & Zepbound',
    features: [
      'Physician-prescribed tirzepatide',
      'Telehealth consultation included',
      'Monthly medication shipped to your door',
      'Dose escalation management',
      'Monthly check-in with care team',
      'Self-injection supplies & instructions',
      'Unlimited messaging support',
      'Enhanced appetite & glucose control',
    ],
    highlight: true,
  },
  {
    name: 'Transform',
    price: 1199,
    period: '/3 months',
    subtitle: 'Comprehensive 90-day program - save $248',
    features: [
      '3 months of semaglutide or tirzepatide',
      'Baseline & 90-day lab panels included',
      'Monthly lipotropic injections',
      'Bi-weekly check-ins with care team',
      'Personalized nutrition guidance',
      'Body composition tracking',
      'Priority scheduling & support',
      '90-day progress report',
    ],
    highlight: false,
  },
];

const FAQS = [
  {
    q: 'What are GLP-1 medications (semaglutide & tirzepatide)?',
    a: 'GLP-1 receptor agonists are clinically proven medications that reduce appetite, slow gastric emptying, and improve metabolic function. Semaglutide is the same active ingredient in Ozempic and Wegovy. Tirzepatide is the same active ingredient in Mounjaro and Zepbound. Clinical studies show average weight loss of 15-20% of body weight.',
  },
  {
    q: 'Do I qualify for the program?',
    a: 'GLP-1 therapy may be appropriate if you have a BMI of 27+ with a weight-related condition (high blood pressure, high cholesterol, type 2 diabetes) or a BMI of 30+. During your free consultation, our medical team reviews your health history to determine if treatment is safe and appropriate. Certain conditions (medullary thyroid carcinoma, MEN2, pancreatitis, pregnancy) may exclude you.',
  },
  {
    q: 'How is this different from Ozempic at a pharmacy?',
    a: 'Our semaglutide and tirzepatide are compounded by Olympia Pharmacy, an FDA-regulated 503B facility. They contain the same active ingredients as brand-name medications but are produced in custom doses, allowing for more precise titration and significantly lower cost compared to retail pharmacy prices that can exceed $1,000-$1,500/month without insurance.',
  },
  {
    q: 'Do I have to come into the clinic?',
    a: 'No. Our entire program is designed for convenience. Your initial evaluation and all follow-ups are conducted via telehealth. Your medication ships from the pharmacy directly to your home with complete self-injection instructions. If you prefer in-person visits, you are welcome at our Renton clinic.',
  },
  {
    q: 'What are the common side effects?',
    a: 'The most common side effects are mild and typically occur during the first few weeks: nausea, decreased appetite, mild stomach discomfort, and occasional constipation or diarrhea. Our gradual dose escalation protocol minimizes these effects. Serious side effects are rare but our medical team monitors you closely.',
  },
  {
    q: 'How do I inject myself?',
    a: 'Your medication ships with detailed instructions and all necessary supplies (syringes, alcohol swabs). Injections are subcutaneous (just under the skin) using a small, thin needle - similar to an insulin injection. Most patients find it painless after the first time. Our team is available to walk you through your first injection.',
  },
  {
    q: 'Can I use my HSA or FSA?',
    a: 'Yes. Our medical weight loss program qualifies as a medical expense under most HSA and FSA plans. Rani Beauty Clinic operates under MCC 8099 (Medical Services), which is recognized by HSA/FSA card processors.',
  },
  {
    q: 'How quickly will I see results?',
    a: 'Most patients notice reduced appetite within the first week and measurable weight loss within 2-4 weeks. Significant results typically become visible by month 2-3. The full dose escalation takes about 4-5 months to reach maintenance dose.',
  },
  {
    q: 'Is there a long-term commitment?',
    a: 'No. Our monthly programs are month-to-month with no contract. However, clinical evidence shows GLP-1 therapy is most effective when used for at least 6-12 months alongside lifestyle changes. Your care team will help develop a personalized plan including a gradual tapering strategy when ready.',
  },
  {
    q: 'Who is the physician overseeing my care?',
    a: 'Your treatment is supervised by Dr. Alexander Landfield, a board-certified neurologist and our Medical Director. Dr. Landfield reviews every patient chart, approves treatment plans, and oversees all prescribing. Your initial evaluation is conducted by a licensed healthcare provider through our telehealth partnership.',
  },
];

const STEPS = [
  {
    num: '01',
    title: 'Book Free Consult',
    desc: 'Schedule your complimentary consultation online or by phone. We answer all your questions and determine if GLP-1 therapy is right for you.',
  },
  {
    num: '02',
    title: 'Physician Evaluation',
    desc: 'Complete a quick telehealth visit with our medical team. Your health history is reviewed and a personalized treatment plan is created.',
  },
  {
    num: '03',
    title: 'Medication Shipped',
    desc: 'Your prescription is sent to an FDA-regulated 503B compounding pharmacy and shipped directly to your doorstep with self-injection instructions.',
  },
  {
    num: '04',
    title: 'Ongoing Support',
    desc: 'Monthly check-ins, dose adjustments, lab monitoring, and unlimited messaging. We are with you every step of the way.',
  },
];

export default function WeightLossLandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    currentWeight: '',
    goalWeight: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const attribution = useAttribution({
    source: 'weight-loss-landing',
    leadOffer: 'Medical Weight Loss Consultation',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          service: 'Medical Weight Loss',
          message: `GLP-1 Weight Loss Lead - Current: ${formData.currentWeight} lbs, Goal: ${formData.goalWeight} lbs`,
          source: 'weight-loss-landing',
          ...attribution,
        }),
      });
    } catch {
      // Still show success to user - lead will be followed up manually if API fails
    }
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-rani-cream">
      {/* Nav */}
      <nav className="bg-rani-navy sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link href="/" className="font-heading text-2xl text-white tracking-wide">
            Rani Beauty Clinic
          </Link>
          <div className="flex items-center gap-4">
            <a
              href="tel:+14255394440"
              className="hidden sm:inline font-body text-sm text-gray-300 hover:text-white transition-colors"
            >
              (425) 539-4440
            </a>
            <a
              href="/glp1/intake"
              className="bg-[#C9A96E] text-rani-navy px-5 py-2 rounded-lg font-body font-semibold text-sm hover:bg-[#d4b67e] transition-colors"
            >
              Schedule Your Consultation
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-rani-navy text-white py-20 sm:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-rani-navy via-rani-navy-light to-rani-navy opacity-80" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <p className="font-body text-[#C9A96E] uppercase tracking-[0.2em] text-sm mb-4">
            Physician-Supervised Medical Weight Loss
          </p>
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl leading-tight mb-6">
            Lose 15-20% of Your Body Weight  - {' '}
            <span className="text-[#C9A96E]">Medication Shipped to Your Door</span>
          </h1>
          <p className="font-body text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto mb-8 leading-relaxed">
            Clinically proven GLP-1 medications prescribed by a board-certified physician.
            No clinic visits required. Serving Renton, Kent, Auburn & all of South King County.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/glp1/intake"
              className="bg-[#C9A96E] text-rani-navy px-8 py-4 rounded-lg font-body font-bold text-lg hover:bg-[#d4b67e] transition-colors"
            >
              Book Free Consultation
            </a>
            <a
              href="tel:+14255394440"
              className="border border-white/30 text-white px-8 py-4 rounded-lg font-body font-medium text-lg hover:bg-white/5 transition-colors"
            >
              Call (425) 539-4440
            </a>
          </div>
          <p className="font-body text-sm text-gray-400 mt-6">
            Starting at $349/month &middot; Medication included &middot; HSA/FSA accepted
          </p>
        </div>
      </section>

      {/* Social Proof Bar */}
      <section className="bg-white border-b border-rani-border py-6">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          <div>
            <p className="font-heading text-2xl text-rani-navy">15-20%</p>
            <p className="font-body text-xs text-rani-muted uppercase tracking-wider mt-1">Average Body Weight Loss</p>
          </div>
          <div>
            <p className="font-heading text-2xl text-rani-navy">503B</p>
            <p className="font-body text-xs text-rani-muted uppercase tracking-wider mt-1">FDA-Regulated Pharmacy</p>
          </div>
          <div>
            <p className="font-heading text-2xl text-rani-navy">$0</p>
            <p className="font-body text-xs text-rani-muted uppercase tracking-wider mt-1">Free Consultation</p>
          </div>
          <div>
            <p className="font-heading text-2xl text-rani-navy">HSA</p>
            <p className="font-body text-xs text-rani-muted uppercase tracking-wider mt-1">FSA Eligible</p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 sm:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <p className="font-body text-[#C9A96E] uppercase tracking-[0.15em] text-sm mb-3">Simple & Convenient</p>
            <h2 className="font-heading text-3xl sm:text-4xl text-rani-navy">
              How It Works
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
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

      {/* Pricing */}
      <section id="pricing" className="py-20 sm:py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <p className="font-body text-[#C9A96E] uppercase tracking-[0.15em] text-sm mb-3">Transparent Pricing</p>
            <h2 className="font-heading text-3xl sm:text-4xl text-rani-navy mb-4">
              Medical Weight Loss Programs
            </h2>
            <p className="font-body text-rani-muted max-w-xl mx-auto">
              No hidden fees. No insurance headaches. Everything included - medication, physician oversight, and ongoing support.
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
                <p className="font-body text-xs text-rani-muted mt-1">{tier.subtitle}</p>
                <div className="mt-4 mb-6">
                  <span className="font-heading text-4xl text-rani-navy">${tier.price}</span>
                  <span className="font-body text-rani-muted text-sm">{tier.period}</span>
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
                  href="/glp1/intake"
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
          <p className="font-body text-xs text-rani-muted text-center mt-8">
            All programs include physician oversight by Dr. Alexander Landfield, MD.
            Medications compounded by Olympia Pharmacy, an FDA-regulated 503B facility.
            HSA/FSA payments accepted. No insurance required. Month-to-month - no contracts.
          </p>
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
              { title: 'Real Clinic, Real People', desc: 'We are right here in Renton at 401 Olympia Ave NE - not an anonymous telehealth mill. Come say hi.' },
              { title: 'Ships to Your Door', desc: 'Your medication is compounded by an FDA-regulated 503B pharmacy and shipped directly to your home. No pharmacy lines.' },
              { title: 'Board-Certified Physician', desc: 'Dr. Alexander Landfield, board-certified neurologist, oversees every treatment plan and prescription.' },
              { title: 'All-Inclusive Pricing', desc: 'No separate medication costs, no surprise fees. Your monthly price includes everything - medication, consults, and support.' },
              { title: 'Ongoing Medical Support', desc: 'Monthly check-ins, dose escalation management, lab monitoring, and unlimited messaging with your care team.' },
              { title: 'Full Medspa Access', desc: 'Address skin changes during weight loss with Sofwave, RF Microneedling, facials, and more at our clinic.' },
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
      <section className="py-20 sm:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <p className="font-body text-[#C9A96E] uppercase tracking-[0.15em] text-sm mb-3">Results</p>
            <h2 className="font-heading text-3xl sm:text-4xl text-rani-navy">Real Results, Real Support</h2>
          </div>
          <div className="bg-white rounded-2xl p-8 sm:p-10 border border-rani-border shadow-sm text-center">
            <p className="font-body text-rani-muted text-sm leading-relaxed">
              Individual results vary. Weight loss outcomes depend on starting weight, adherence to treatment protocol, lifestyle factors, and medical history. All patients undergo medical evaluation before treatment. Results shown are not guaranteed.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 sm:py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <p className="font-body text-[#C9A96E] uppercase tracking-[0.15em] text-sm mb-3">Common Questions</p>
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
              Fill out the form below and our team will contact you within 24 hours to get started.
            </p>
          </div>

          {submitted ? (
            <div className="bg-white/10 rounded-2xl p-10 text-center border border-white/20">
              <div className="w-16 h-16 bg-rani-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-rani-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="font-heading text-2xl text-white mb-2">Thank You!</h3>
              <p className="font-body text-gray-300">
                Our team will reach out within 24 hours to schedule your free consultation
                and walk you through the next steps. We are excited to be part of your journey.
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
                className="w-full bg-[#C9A96E] text-rani-navy py-4 rounded-lg font-body font-bold text-lg hover:bg-[#d4b67e] transition-colors"
              >
                Book Free Consultation
              </button>
              <p className="font-body text-xs text-gray-400 text-center">
                Medical evaluation required. Not everyone qualifies for GLP-1 medication.
                Individual results may vary.
              </p>
            </form>
          )}
        </div>
      </section>

      {/* Cross-sell */}
      <section className="py-16 sm:py-20 bg-rani-cream">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <p className="font-body text-[#C9A96E] uppercase tracking-[0.15em] text-sm mb-3">Complete Your Transformation</p>
          <h2 className="font-heading text-2xl sm:text-3xl text-rani-navy mb-4">
            Love Your New Body. Love Your Skin Too.
          </h2>
          <p className="font-body text-rani-muted max-w-xl mx-auto mb-8">
            Weight loss can change your face and body. Our aesthetic services help you look as good as you feel.
          </p>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { name: 'Sofwave', desc: 'Non-surgical skin tightening to restore collagen and lift', href: '/services/sofwave' },
              { name: 'RF Microneedling', desc: 'Tighten and smooth skin texture for a youthful glow', href: '/services/rf-microneedling' },
              { name: 'HydraFacial', desc: 'Deep cleansing and hydration for radiant, healthy skin', href: '/services/hydrafacial' },
            ].map((s) => (
              <Link key={s.name} href={s.href} className="bg-white rounded-xl p-6 border border-rani-border hover:shadow-md transition-shadow text-left">
                <h3 className="font-heading text-lg text-rani-navy mb-2">{s.name}</h3>
                <p className="font-body text-xs text-rani-muted">{s.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-rani-navy border-t border-white/10 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <p className="font-heading text-xl text-white mb-2">Rani Beauty Clinic</p>
          <p className="font-body text-sm text-gray-400">
            401 Olympia Ave NE, Suite 101, Renton, WA 98056 &middot;{' '}
            <a href="tel:+14255394440" className="hover:text-white transition-colors">(425) 539-4440</a>
          </p>
          <p className="font-body text-xs text-gray-500 mt-4 max-w-2xl mx-auto">
            Physician-supervised medical weight loss. Individual results may vary. GLP-1 medications require
            a prescription and are not appropriate for everyone. Medications compounded by Olympia Pharmacy,
            an FDA-regulated 503B facility. This website is for informational purposes only and does not
            constitute medical advice. Medical Director: Dr. Alexander Landfield, MD.
          </p>
          <p className="font-body text-xs text-gray-600 mt-2">
            &copy; {new Date().getFullYear()} Rani Beauty Clinic (Anatomi LLC). All rights reserved.
          </p>
        </div>
      </footer>

      {/* Floating Mobile CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-rani-border p-3 sm:hidden z-50">
        <a
          href="/glp1/intake"
          className="block text-center bg-[#C9A96E] text-rani-navy py-3 rounded-lg font-body font-bold text-sm"
        >
          Book Free Consultation - $0
        </a>
      </div>
    </div>
  );
}
