'use client';

import Link from 'next/link';

const METRICS = [
  { label: 'Revenue Growth', before: '$45K/mo', after: '$78K/mo', improvement: '+73%' },
  { label: 'No-Show Rate', before: '14%', after: '4%', improvement: '-71%' },
  { label: 'Client Retention', before: '62%', after: '89%', improvement: '+44%' },
  { label: 'Hours Saved Weekly', before: '0', after: '22 hrs', improvement: '22h freed' },
  { label: 'Lead Response Time', before: '4.2 hours', after: '< 2 min', improvement: '-97%' },
  { label: 'Rebooking Rate', before: '38%', after: '67%', improvement: '+76%' },
];

const TIMELINE = [
  { week: 'Week 1', title: 'Setup & Migration', desc: 'Connected Airtable, Mangomint, and Square. Imported 2,181 clients and historical data. Team trained on dashboard basics.' },
  { week: 'Week 2', title: 'AI Engines Activated', desc: 'Enabled churn prediction, no-show scoring, and the AI consult co-pilot. First automated follow-up sequences launched.' },
  { week: 'Week 3', title: 'Marketing Automation Live', desc: 'Social media AI generating weekly content. Meta Ads AI optimizing campaigns. Automated reactivation reaching lapsed clients.' },
  { week: 'Month 2', title: 'Full Intelligence Suite', desc: 'Dynamic pricing, P&L intelligence, and inventory auto-management online. Team fully adopted gamification leaderboard.' },
  { week: 'Month 3', title: 'Measurable Impact', desc: 'Revenue up 73%. No-shows down 71%. 22 hours/week saved on manual tasks. AI phone agent handling after-hours calls.' },
];

const FEATURES_USED = [
  { name: 'Churn Prediction', impact: 'Identified 47 at-risk clients, reactivated 31 with automated campaigns' },
  { name: 'No-Show AI', impact: 'Reduced no-shows from 14% to 4% with predictive deposit requirements' },
  { name: 'Consult Co-Pilot', impact: 'Increased treatment plan acceptance rate from 42% to 68%' },
  { name: 'Schedule Optimizer', impact: 'Found $4,200/month in revenue from schedule gaps' },
  { name: 'Social Media AI', impact: 'Generated 52 posts/month, saving 8+ hours of content creation' },
  { name: 'AI Phone Agent', impact: 'Captured 23 after-hours leads/month that were previously lost' },
];

export default function CaseStudyPage() {
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
          <Link href="/marketing#lead-form" className="px-5 py-2.5 text-sm font-bold text-white bg-[#0F1D2C] rounded-xl hover:bg-[#1A2A3C] transition-colors">
            Start Free Trial
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-28 pb-16 px-4 bg-gradient-to-b from-[#FAF8F5] to-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#0F1D2C]/5 rounded-full mb-6">
            <span className="text-sm text-[#0F1D2C] font-medium">Case Study</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0F1D2C] leading-tight">
            How Rani Beauty Clinic Grew Revenue{' '}
            <span className="text-[#C9A96E]">73%</span> With AI
          </h1>
          <p className="mt-6 text-lg text-gray-500 max-w-2xl mx-auto">
            A luxury medspa in Renton, WA went from manual operations to a fully AI-automated
            clinic in 90 days — and the numbers speak for themselves.
          </p>
        </div>
      </section>

      {/* Key Metrics */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-[#0F1D2C] text-center mb-10">Results at a Glance</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {METRICS.map((m) => (
              <div key={m.label} className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">{m.label}</p>
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-sm text-gray-400 line-through">{m.before}</span>
                  <span className="text-xl font-bold text-[#0F1D2C]">{m.after}</span>
                </div>
                <span className="inline-block text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  {m.improvement}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Clinic Profile */}
      <section className="py-16 px-4 bg-[#0F1D2C]">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-10">
            <div>
              <p className="text-[#F3D6BE] text-sm font-bold uppercase tracking-wider mb-3">The Clinic</p>
              <h2 className="text-2xl font-bold text-white mb-4">Rani Beauty Clinic</h2>
              <p className="text-white/60 text-sm leading-relaxed mb-6">
                A physician-supervised luxury medspa in Renton, WA specializing in
                injectables, laser treatments, facials, and wellness services.
                Founded by Rina with a mission to bring medical-grade aesthetics
                to the Pacific Northwest.
              </p>
              <div className="space-y-3">
                {[
                  { label: 'Location', value: 'Renton, WA' },
                  { label: 'Providers', value: '2 (Owner + Provider)' },
                  { label: 'Services', value: '15+ treatments' },
                  { label: 'Clients', value: '2,181+' },
                  { label: 'Monthly Revenue', value: '$78K (post-RaniOS)' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-white/40 text-sm">{item.label}</span>
                    <span className="text-white font-medium text-sm">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[#F3D6BE] text-sm font-bold uppercase tracking-wider mb-3">The Challenge</p>
              <ul className="space-y-3">
                {[
                  'Manual intake processing taking 20+ minutes per client',
                  'No visibility into which clients were about to churn',
                  'Inconsistent follow-up after consultations and treatments',
                  'Marketing content creation taking 10+ hours per week',
                  'No-shows costing $3,000+ monthly in lost revenue',
                  'After-hours calls going to voicemail (lost leads)',
                ].map((challenge, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-5 h-5 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                    </span>
                    <span className="text-white/70 text-sm">{challenge}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Implementation Timeline */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-[#0F1D2C] text-center mb-10">Implementation Timeline</h2>
          <div className="space-y-6">
            {TIMELINE.map((item, i) => (
              <div key={i} className="flex gap-5">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 bg-[#0F1D2C] rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-[#F3D6BE] text-xs font-bold">{i + 1}</span>
                  </div>
                  {i < TIMELINE.length - 1 && <div className="w-px h-full bg-gray-200 mt-2" />}
                </div>
                <div className="pb-6">
                  <p className="text-xs font-bold text-[#C9A96E] uppercase tracking-wider">{item.week}</p>
                  <h3 className="text-base font-bold text-[#0F1D2C] mt-1">{item.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Impact */}
      <section className="py-16 px-4 bg-[#FAF8F5]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-[#0F1D2C] text-center mb-10">Feature-by-Feature Impact</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {FEATURES_USED.map((f) => (
              <div key={f.name} className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="text-sm font-bold text-[#0F1D2C] mb-2">{f.name}</h3>
                <p className="text-sm text-gray-500">{f.impact}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-gradient-to-br from-[#0F1D2C] to-[#1A2A3C]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready for Your Transformation?</h2>
          <p className="text-white/60 mb-8">
            See what RaniOS can do for your clinic with a personalized ROI projection.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/marketing/roi" className="px-8 py-3.5 text-base font-bold text-[#0F1D2C] bg-[#F3D6BE] rounded-xl hover:bg-[#e8c5a9] transition-colors">
              Calculate Your ROI
            </Link>
            <Link href="/marketing#lead-form" className="px-8 py-3.5 text-base font-bold text-white border-2 border-white/20 rounded-xl hover:border-white/40 transition-colors">
              Start Free Trial
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
