import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface RevenueOptimizerProps {
  opportunities: {
    id: string;
    type: 'upsell' | 'addon' | 'reactivation' | 'retention' | 'package';
    title: string;
    description: string;
    potentialRevenue: number;
    effort: 'low' | 'medium' | 'high';
    patientCount: number;
    priority: number;
  }[];
  totalPotential: number;
  monthlyTarget: number;
  currentRevenue: number;
}

// ─── Component ───────────────────────────────────────────────────────────────

const effortBadges: Record<string, string> = {
  low: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-red-100 text-red-700',
};

const typeBadges: Record<string, string> = {
  upsell: 'bg-purple-100 text-purple-700',
  addon: 'bg-blue-100 text-blue-700',
  reactivation: 'bg-orange-100 text-orange-700',
  retention: 'bg-teal-100 text-teal-700',
  package: 'bg-pink-100 text-pink-700',
};

function RevenueOptimizer({ opportunities, totalPotential, monthlyTarget, currentRevenue }: RevenueOptimizerProps) {
  const gapToTarget = monthlyTarget - currentRevenue;
  const progressPercent = Math.min(100, (currentRevenue / monthlyTarget) * 100);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden max-w-lg">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0F1D2C] to-[#1A2D3F] px-5 py-4">
        <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
          Revenue Optimizer
        </h3>
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-gray-300 mb-1">
            <span>${currentRevenue.toLocaleString()} of ${monthlyTarget.toLocaleString()} target</span>
            <span>{Math.round(progressPercent)}%</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2.5">
            <div className="bg-[#C9A96E] h-2.5 rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-400">Gap: <span className="text-white font-bold">${gapToTarget.toLocaleString()}</span></span>
            <span className="text-xs text-gray-400">Opportunity: <span className="text-[#C9A96E] font-bold">${totalPotential.toLocaleString()}</span></span>
          </div>
        </div>
      </div>

      {/* Opportunities */}
      <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
        {opportunities.sort((a, b) => b.priority - a.priority).map((opp, i) => (
          <div key={opp.id} className="px-5 py-3 hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-300 w-4">#{i + 1}</span>
                <h4 className="text-sm font-semibold text-[#0F1D2C]">{opp.title}</h4>
              </div>
              <span className="text-sm font-bold text-green-700">${opp.potentialRevenue.toLocaleString()}</span>
            </div>
            <p className="text-xs text-gray-500 ml-6 mb-2">{opp.description}</p>
            <div className="flex items-center gap-2 ml-6">
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${typeBadges[opp.type]}`}>{opp.type}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${effortBadges[opp.effort]}`}>{opp.effort} effort</span>
              <span className="text-[10px] text-gray-400">{opp.patientCount} patients</span>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 bg-gray-50 flex items-center justify-between">
        <span className="text-xs text-gray-500">{opportunities.length} opportunities identified</span>
        <button className="text-xs bg-[#C9A96E] text-white px-4 py-1.5 rounded-lg font-medium hover:bg-[#B8985E]">
          Execute Top 3
        </button>
      </div>
    </div>
  );
}

// ─── Stories ──────────────────────────────────────────────────────────────────

const meta: Meta<typeof RevenueOptimizer> = {
  title: 'Dashboard/RevenueOptimizer',
  component: RevenueOptimizer,
  parameters: { layout: 'padded', backgrounds: { default: 'dashboard' } },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof RevenueOptimizer>;

export const Default: Story = {
  args: {
    totalPotential: 18450,
    monthlyTarget: 85000,
    currentRevenue: 62300,
    opportunities: [
      { id: '1', type: 'addon', title: 'B12 Add-On for GLP-1 Patients', description: '18 active GLP-1 patients not currently receiving B12 injections. Average add-on per visit: $35.', potentialRevenue: 2520, effort: 'low', patientCount: 18, priority: 95 },
      { id: '2', type: 'reactivation', title: 'Lapsed Botox Patients (90+ Days)', description: '12 patients overdue for Botox retreatment. Average per visit: $450.', potentialRevenue: 5400, effort: 'medium', patientCount: 12, priority: 88 },
      { id: '3', type: 'package', title: 'VIP Transform Package Conversion', description: '4 GLP-1 patients on D3+ who qualify for VIP Transform upgrade.', potentialRevenue: 6000, effort: 'medium', patientCount: 4, priority: 82 },
      { id: '4', type: 'upsell', title: 'Wellness Injection Bundles', description: 'Offer monthly wellness packages to existing injection patients for 15% savings.', potentialRevenue: 2880, effort: 'low', patientCount: 24, priority: 75 },
      { id: '5', type: 'retention', title: 'At-Risk Membership Saves', description: '3 members showing churn signals. Proactive outreach with exclusive offer.', potentialRevenue: 1650, effort: 'high', patientCount: 3, priority: 70 },
    ],
  },
};

export const NearTarget: Story = {
  args: {
    totalPotential: 8200,
    monthlyTarget: 85000,
    currentRevenue: 79500,
    opportunities: [
      { id: '1', type: 'addon', title: 'Glutathione Add-On', description: '6 facial patients who would benefit from glow injection add-on.', potentialRevenue: 600, effort: 'low', patientCount: 6, priority: 90 },
      { id: '2', type: 'reactivation', title: 'HydraFacial Reactivation', description: '8 patients due for monthly HydraFacial.', potentialRevenue: 2200, effort: 'low', patientCount: 8, priority: 85 },
      { id: '3', type: 'upsell', title: 'Laser Package Conversion', description: '5 single-session laser patients ready for package commitment.', potentialRevenue: 5400, effort: 'medium', patientCount: 5, priority: 80 },
    ],
  },
};

export const BelowTarget: Story = {
  args: {
    totalPotential: 32000,
    monthlyTarget: 85000,
    currentRevenue: 41200,
    opportunities: [
      { id: '1', type: 'reactivation', title: 'Major Reactivation Campaign', description: '28 lapsed patients (60+ days). Targeted re-engagement with personalized offers.', potentialRevenue: 12600, effort: 'high', patientCount: 28, priority: 98 },
      { id: '2', type: 'package', title: 'GLP-1 Package Launch', description: 'New 3-month commitment packages with built-in wellness injections.', potentialRevenue: 8900, effort: 'medium', patientCount: 15, priority: 92 },
      { id: '3', type: 'addon', title: 'Cross-Category Add-Ons', description: 'Present complementary services to all patients this week.', potentialRevenue: 4500, effort: 'low', patientCount: 30, priority: 85 },
      { id: '4', type: 'retention', title: 'Membership Drive', description: 'Convert top 20 regular patients to monthly membership.', potentialRevenue: 6000, effort: 'high', patientCount: 20, priority: 80 },
    ],
  },
};
