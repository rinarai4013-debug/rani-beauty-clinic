'use client';

import { useState } from 'react';

interface Feature {
  icon: string;
  title: string;
  description: string;
  category: 'intelligence' | 'automation' | 'engagement' | 'analytics';
  highlight?: boolean;
}

const features: Feature[] = [
  {
    icon: '🧠',
    title: 'AI Intake Intelligence',
    description: 'Automatically analyze new client intake forms, extract risk flags, generate personalized treatment plans, and create consult scripts before the client walks in.',
    category: 'intelligence',
    highlight: true,
  },
  {
    icon: '📊',
    title: 'Churn Prediction Engine',
    description: 'Five-factor analysis identifies at-risk clients before they leave. Automated reactivation campaigns bring them back with personalized messaging.',
    category: 'intelligence',
  },
  {
    icon: '💰',
    title: 'Dynamic Pricing Intelligence',
    description: 'Six pricing strategies analyze demand, competition, and margins to recommend optimal pricing for every service in real time.',
    category: 'intelligence',
  },
  {
    icon: '🗓️',
    title: 'Schedule Optimizer',
    description: 'Detect gaps, resolve conflicts, balance provider workloads, and identify revenue opportunities in your appointment calendar.',
    category: 'automation',
  },
  {
    icon: '📱',
    title: 'Social Media Engine',
    description: 'Auto-generate weekly content calendars with day-specific themes, optimized hashtags, and scored posts ready to publish.',
    category: 'engagement',
  },
  {
    icon: '🎯',
    title: 'Meta Ads AI Manager',
    description: 'Campaign grading, ad copy generation, budget optimization, and creative fatigue detection. Full-funnel analysis from impressions to bookings.',
    category: 'engagement',
    highlight: true,
  },
  {
    icon: '🤝',
    title: 'AI Consult Co-pilot',
    description: 'Pre-consult intelligence briefings, treatment plan building, objection handlers, cross-sell opportunities, and closing strategies.',
    category: 'intelligence',
  },
  {
    icon: '📦',
    title: 'Inventory Auto-Manager',
    description: 'Smart reorder points, waste analysis, par level optimization, and supplier performance tracking. Never run out of product again.',
    category: 'automation',
  },
  {
    icon: '📞',
    title: 'AI Phone Receptionist',
    description: 'Voice AI handles calls 24/7 with your brand voice. Books appointments, answers FAQs, and escalates when needed.',
    category: 'automation',
    highlight: true,
  },
  {
    icon: '📈',
    title: 'P&L Intelligence',
    description: 'Auto expense categorization, service profitability analysis, cash flow projections, and financial health scoring.',
    category: 'analytics',
  },
  {
    icon: '⭐',
    title: 'Review Commander',
    description: 'Monitor Google reviews in real time, auto-generate professional responses, and track sentiment trends.',
    category: 'engagement',
  },
  {
    icon: '🔮',
    title: 'Revenue Anomaly Detection',
    description: 'Five detection methods spot revenue problems before they become crises. Target deviation, rolling averages, and pattern analysis.',
    category: 'analytics',
  },
];

const categories = [
  { key: 'all', label: 'All Features' },
  { key: 'intelligence', label: 'AI Intelligence' },
  { key: 'automation', label: 'Automation' },
  { key: 'engagement', label: 'Engagement' },
  { key: 'analytics', label: 'Analytics' },
] as const;

export default function FeatureGrid() {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const filtered = activeCategory === 'all' ? features : features.filter((f) => f.category === activeCategory);

  return (
    <div>
      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 justify-center mb-10">
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
              activeCategory === cat.key
                ? 'bg-[#0F1D2C] text-white shadow-lg'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {filtered.map((feature) => (
          <div
            key={feature.title}
            className={`group relative rounded-2xl p-6 transition-all hover:shadow-xl hover:-translate-y-1 ${
              feature.highlight
                ? 'bg-gradient-to-br from-[#0F1D2C] to-[#1A2A3C] text-white'
                : 'bg-white border border-gray-200 text-gray-900'
            }`}
          >
            <span className="text-3xl mb-4 block">{feature.icon}</span>
            <h3 className={`text-lg font-bold mb-2 ${feature.highlight ? 'text-[#F3D6BE]' : ''}`}>
              {feature.title}
            </h3>
            <p className={`text-sm leading-relaxed ${feature.highlight ? 'text-white/70' : 'text-gray-500'}`}>
              {feature.description}
            </p>
            <div
              className={`absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl transition-all opacity-0 group-hover:opacity-100 ${
                feature.highlight ? 'bg-[#F3D6BE]' : 'bg-[#0F1D2C]'
              }`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
