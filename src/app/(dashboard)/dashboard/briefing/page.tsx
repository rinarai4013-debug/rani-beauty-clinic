'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Calendar, BarChart3, FileText, Zap } from 'lucide-react';
import BriefingPreview from '@/components/dashboard/briefing/BriefingPreview';
import BriefingHistory from '@/components/dashboard/briefing/BriefingHistory';
import BriefingSettings from '@/components/dashboard/briefing/BriefingSettings';

type BriefingType = 'mega' | 'daily' | 'weekly' | 'monthly';

const tabs: { id: BriefingType; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: 'mega', label: 'Mega Briefing', icon: <Zap className="w-4 h-4" />, desc: 'Full intelligence report' },
  { id: 'daily', label: 'Daily', icon: <Mail className="w-4 h-4" />, desc: 'Simple daily recap' },
  { id: 'weekly', label: 'Weekly', icon: <Calendar className="w-4 h-4" />, desc: 'Monday morning rollup' },
  { id: 'monthly', label: 'Monthly', icon: <BarChart3 className="w-4 h-4" />, desc: '1st of each month' },
];

const SECTIONS = [
  'Financial Snapshot',
  'Clinic Operations',
  'Marketing Performance',
  'Competitive Intelligence',
  'Industry News',
  'Polymarket & Macro',
  'AI Insights & Recommendations',
  'Action Items',
];

export default function BriefingPage() {
  const [activeType, setActiveType] = useState<BriefingType>('mega');

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-[#0F1D2C] flex items-center justify-center">
            <FileText className="w-5 h-5 text-[#C9A96E]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-heading text-rani-navy">CEO Intelligence Briefings</h1>
            <p className="text-sm text-gray-500">
              Automated daily intelligence reports sent at 6 AM PST to info@ranibeautyclinic.com
            </p>
          </div>
        </div>
      </div>

      {/* Mega Briefing Sections Overview */}
      {activeType === 'mega' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-[#0F1D2C] to-[#1A2B3C] rounded-lg p-4 sm:p-6"
        >
          <h3 className="text-[#C9A96E] font-semibold text-sm mb-3 tracking-wider uppercase">
            8 Intelligence Sections
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {SECTIONS.map((section, i) => (
              <div key={section} className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#C9A96E] text-[#0F1D2C] text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </span>
                <span className="text-white/80 text-xs">{section}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 text-[#C9A96E]/70 text-xs">
            Sources: Airtable (revenue, schedule, alerts) + Meta Ads + Google Ads + Polymarket + RSS feeds + Competitor tracking
          </div>
        </motion.div>
      )}

      {/* Type Selector */}
      <div className="flex gap-3 overflow-x-auto">
        {tabs.map((tab) => (
          <motion.button
            key={tab.id}
            onClick={() => setActiveType(tab.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`flex-1 min-w-[120px] p-4 rounded-lg border-2 transition-all ${
              activeType === tab.id
                ? tab.id === 'mega'
                  ? 'border-[#C9A96E] bg-gradient-to-br from-[#FDF8F0] to-[#F8F0E0]'
                  : 'border-[#C9A96E] bg-[#FDF8F0]'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className={activeType === tab.id ? 'text-[#C9A96E]' : 'text-gray-400'}>
                {tab.icon}
              </span>
              <span className={`text-sm font-semibold ${activeType === tab.id ? 'text-[#0F1D2C]' : 'text-gray-600'}`}>
                {tab.label}
              </span>
            </div>
            <p className="text-xs text-gray-500">{tab.desc}</p>
          </motion.button>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Preview - takes 2 columns */}
        <div className="lg:col-span-2">
          <BriefingPreview type={activeType} />
        </div>

        {/* Sidebar - settings and history */}
        <div className="space-y-6">
          <BriefingSettings onSendTest={() => {}} />
          <BriefingHistory />
        </div>
      </div>
    </div>
  );
}
