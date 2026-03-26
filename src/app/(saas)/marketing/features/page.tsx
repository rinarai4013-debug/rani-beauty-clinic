'use client';

import Link from 'next/link';

const engineSections = [
  {
    id: 'intake',
    title: 'AI Intake Intelligence',
    subtitle: 'Know your client before they walk in',
    description: 'Every intake form is automatically analyzed by AI to extract risk flags, generate personalized treatment plans with cost breakdowns, and create consult scripts. Your provider walks into the room fully briefed.',
    features: [
      'Automatic risk flag extraction (allergies, contraindications, medications)',
      'AI-generated treatment plans with Good/Better/Best tiers',
      'Cost breakdowns and timeline estimates',
      'Consult scripts with talking points and objection handlers',
      'Processing status tracking (New, Processed, Responded)',
    ],
    metric: '35% higher consultation conversion rate',
    color: 'from-blue-500 to-blue-700',
  },
  {
    id: 'churn',
    title: 'Churn Prediction Engine',
    subtitle: 'Save clients before they leave',
    description: 'Five-factor analysis continuously scores every client on churn risk. When someone starts slipping away, automated reactivation campaigns bring them back with perfectly timed, personalized messaging.',
    features: [
      '5-factor scoring: recency, frequency, monetary, membership, engagement',
      'Risk classification: low, medium, high, critical',
      'Automated 3-tier reactivation campaigns (30, 60, 90 days lapsed)',
      'Bulk at-risk client ranking by urgency',
      'Personalized reactivation messaging per client segment',
    ],
    metric: '60% client reactivation rate',
    color: 'from-emerald-500 to-emerald-700',
  },
  {
    id: 'pricing',
    title: 'Dynamic Pricing Intelligence',
    subtitle: 'Price every service for maximum margin',
    description: 'Six pricing strategies analyze real-time demand, competitor rates, and your margins to recommend optimal pricing. Know exactly when to run promotions and when to hold firm.',
    features: [
      'Demand-based pricing with seasonal multipliers',
      'Competitor-reactive rate monitoring',
      'Cost-plus margin analysis per service',
      'Bundle optimization for treatment packages',
      'Promotional strategy recommendations',
    ],
    metric: '12% average revenue increase per service',
    color: 'from-amber-500 to-amber-700',
  },
  {
    id: 'schedule',
    title: 'Schedule Optimizer',
    subtitle: 'Fill every gap, maximize every hour',
    description: 'AI continuously scans your calendar to detect gaps, resolve conflicts, balance provider workloads, and identify revenue opportunities hiding in your schedule.',
    features: [
      'Gap detection with revenue potential scoring',
      'Conflict resolution (double bookings, room conflicts, equipment)',
      'Provider workload balancing across the day',
      'Revenue opportunity identification (upgrades, add-ons)',
      'Schedule efficiency scoring (0-100)',
    ],
    metric: '18% improvement in schedule utilization',
    color: 'from-violet-500 to-violet-700',
  },
  {
    id: 'consult',
    title: 'AI Consult Co-pilot',
    subtitle: 'Close more treatment plans, confidently',
    description: 'Before every consultation, AI generates a complete intelligence briefing: client history, recommended treatments, talking points prioritized by impact, objection handlers, and closing strategies.',
    features: [
      'Pre-consult client intelligence briefings',
      'Treatment plan building with concern-to-service matching',
      'Prioritized talking points (must-say, should-say, nice-to-say)',
      '6 objection handlers (feel-felt-found, reframe, social proof, etc.)',
      '5 closing strategies with financing and membership pitches',
    ],
    metric: '40% increase in treatment plan acceptance',
    color: 'from-pink-500 to-pink-700',
  },
  {
    id: 'social',
    title: 'Social Media Content Engine',
    subtitle: 'Never scramble for content again',
    description: 'Auto-generate weekly content calendars with day-specific themes, optimized hashtag strategies, and engagement-scored posts. From Motivation Monday to Transformation Tuesday, your feed stays fresh.',
    features: [
      'Weekly content calendars with themed daily posts',
      'Monthly content themes with 4-week rotation',
      'Content scoring (0-100) based on engagement potential',
      'Hashtag strategy: branded, location, industry, service-specific',
      'Optimal posting times per platform',
    ],
    metric: '3x content output with 45% less effort',
    color: 'from-cyan-500 to-cyan-700',
  },
  {
    id: 'ads',
    title: 'Meta Ads AI Manager',
    subtitle: 'Make every ad dollar count',
    description: 'Campaign grading, ad copy generation, budget optimization, and creative fatigue detection. Full-funnel analysis from impressions to bookings shows exactly where your marketing dollars go.',
    features: [
      'Campaign performance grading (A+ to F)',
      'AI-generated ad copy variants per service',
      'Budget allocation optimization (scale/maintain/cut/pause)',
      'Creative fatigue detection and refresh recommendations',
      'Full funnel analysis: Impressions to Bookings',
    ],
    metric: '2.4x improvement in ROAS',
    color: 'from-indigo-500 to-indigo-700',
  },
  {
    id: 'phone',
    title: 'AI Phone Receptionist',
    subtitle: 'Never miss a call again',
    description: 'Voice AI handles calls 24/7 with your brand voice. Books appointments, answers service questions, handles after-hours inquiries, and escalates when a human touch is needed.',
    features: [
      '6 intelligent call flows (booking, inquiry, FAQ, after-hours, escalation)',
      'Custom brand voice and compliance-aware responses',
      'Real-time booking conversion tracking',
      'Call analytics: volume, intents, peak times, satisfaction',
      '8 escalation rules (medical emergency, complaints, billing, etc.)',
    ],
    metric: '30 hours/month saved, 24/7 availability',
    color: 'from-red-500 to-red-700',
  },
];

const integrations = [
  { name: 'Mangomint', category: 'Booking', desc: 'Real-time appointment sync, client data' },
  { name: 'Square', category: 'Payments', desc: 'POS transactions, revenue tracking' },
  { name: 'Stripe', category: 'Billing', desc: 'Subscription management, invoicing' },
  { name: 'Twilio', category: 'SMS', desc: 'Automated messaging, reminders' },
  { name: 'Resend', category: 'Email', desc: 'Transactional emails, campaigns' },
  { name: 'Airtable', category: 'Database', desc: 'Client CRM, operational data' },
  { name: 'n8n', category: 'Automation', desc: '19+ workflow templates' },
  { name: 'Vapi', category: 'Voice AI', desc: 'Phone receptionist, call handling' },
  { name: 'Pinecone', category: 'Vector DB', desc: 'RAG knowledge base, semantic search' },
  { name: 'Meta', category: 'Advertising', desc: 'Campaign management, ad optimization' },
  { name: 'Google', category: 'Reviews', desc: 'Review monitoring, response generation' },
  { name: 'Typeform', category: 'Forms', desc: 'Client intake forms, surveys' },
];

export default function FeaturesPage() {
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
            <Link href="/marketing/features" className="text-sm text-gray-900 font-semibold">Features</Link>
            <Link href="/marketing/pricing" className="text-sm text-gray-600 hover:text-gray-900">Pricing</Link>
            <Link href="/marketing/demo" className="text-sm text-gray-600 hover:text-gray-900">Demo</Link>
          </div>
          <Link href="/marketing/demo" className="px-5 py-2.5 text-sm font-bold text-white bg-[#0F1D2C] rounded-xl hover:bg-[#1A2A3C] transition-colors">
            Start Free Trial
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#FAF8F5] to-white">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-[#0F1D2C] mb-4">
            8 AI engines. One platform.
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Each engine is purpose-built for medical spa operations. Together, they form the most comprehensive AI operations suite in aesthetics.
          </p>
        </div>
      </section>

      {/* Engine Sections */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-20">
          {engineSections.map((engine, i) => (
            <div
              key={engine.id}
              id={engine.id}
              className={`flex flex-col ${i % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-8 items-center`}
            >
              {/* Info */}
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full mb-4">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Engine #{i + 1}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-[#0F1D2C] mb-2">{engine.title}</h2>
                <p className="text-lg text-[#0F1D2C]/60 font-medium mb-4">{engine.subtitle}</p>
                <p className="text-sm text-gray-600 leading-relaxed mb-6">{engine.description}</p>
                <ul className="space-y-2 mb-6">
                  {engine.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-xl">
                  <span className="text-xs font-bold text-emerald-700">{engine.metric}</span>
                </div>
              </div>

              {/* Visual placeholder */}
              <div className="flex-1 w-full">
                <div className={`bg-gradient-to-br ${engine.color} rounded-2xl p-8 h-64 lg:h-80 flex items-center justify-center relative overflow-hidden`}>
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-4 left-4 w-40 h-40 border border-white/30 rounded-2xl" />
                    <div className="absolute bottom-4 right-4 w-32 h-32 border border-white/20 rounded-full" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-white/10 rounded-3xl rotate-12" />
                  </div>
                  <div className="text-center relative z-10">
                    <p className="text-white/90 font-bold text-xl mb-2">{engine.title}</p>
                    <p className="text-white/60 text-sm">Interactive preview coming soon</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Integrations */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#FAF8F5]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#0F1D2C]">Integrations</h2>
            <p className="text-gray-500 mt-2">RaniOS connects with the tools you already use.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {integrations.map((integ) => (
              <div key={integ.name} className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-600">
                      {integ.name.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{integ.name}</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">{integ.category}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500">{integ.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Automation Showcase */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#0F1D2C]">19 Pre-Built Automation Workflows</h2>
            <p className="text-gray-500 mt-2">Every workflow is tested, production-ready, and customizable.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { category: 'Lead Management', count: 5, items: ['Intake Intelligence (1 min poll)', 'Immediate Lead Response', 'No-Booking Follow-up Ladder', 'Consult Outcome Tracking', 'Pre-Consult Preparation'] },
              { category: 'Operations', count: 7, items: ['Booking Sync (Mangomint)', 'Post-Treatment Follow-up', 'Membership Engine', 'Client Status Keeper', 'Alert Engine', 'KPI Aggregation', 'Provider Performance'] },
              { category: 'Engagement', count: 7, items: ['Reactivation Campaigns', 'Review Commander', 'Post-Consult Close', 'Document Architect', 'Financing Trigger', 'Intake to CRM', 'Aura Scan Processor'] },
            ].map((group) => (
              <div key={group.category} className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-[#0F1D2C]">{group.category}</h3>
                  <span className="text-xs text-gray-400">{group.count} workflows</span>
                </div>
                <ul className="space-y-2">
                  {group.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="w-1.5 h-1.5 bg-[#0F1D2C] rounded-full flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[#0F1D2C]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-4">See all features in action</h2>
          <p className="text-white/60 mb-6">Book a personalized demo and see how RaniOS fits your practice.</p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/marketing/demo"
              className="px-8 py-4 text-base font-bold text-[#0F1D2C] bg-[#F3D6BE] rounded-2xl hover:bg-[#F8E5D5] transition-all"
            >
              Book a Demo
            </Link>
            <Link
              href="/marketing/pricing"
              className="px-8 py-4 text-base font-bold text-white border-2 border-white/20 rounded-2xl hover:border-white/40 transition-all"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
