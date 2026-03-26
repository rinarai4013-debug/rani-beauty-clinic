'use client';

import { useState, useMemo } from 'react';

interface ROIBreakdown {
  label: string;
  current: number;
  withRaniOS: number;
  savings: number;
  description: string;
}

export default function ROICalculator() {
  const [monthlyRevenue, setMonthlyRevenue] = useState(80000);
  const [providers, setProviders] = useState(3);
  const [frontDeskStaff, setFrontDeskStaff] = useState(2);

  const roi = useMemo(() => {
    const noShowRate = 0.15;
    const noShowReduction = 0.6;
    const noShowSavings = monthlyRevenue * noShowRate * noShowReduction;

    const reactivationRate = 0.12;
    const reactivationValue = monthlyRevenue * reactivationRate;

    const adminHoursPerWeek = frontDeskStaff * 15;
    const automatedHours = adminHoursPerWeek * 0.7;
    const adminSavings = automatedHours * 4 * 25;

    const upsellIncrease = monthlyRevenue * 0.08;

    const reviewRevenueImpact = monthlyRevenue * 0.03;

    const totalMonthlySavings = noShowSavings + reactivationRate * monthlyRevenue * 0.3 + adminSavings + upsellIncrease + reviewRevenueImpact;
    const planCost = monthlyRevenue > 150000 ? 999 : monthlyRevenue > 50000 ? 499 : 199;
    const netROI = totalMonthlySavings - planCost;

    const breakdown: ROIBreakdown[] = [
      {
        label: 'No-Show Reduction',
        current: monthlyRevenue * noShowRate,
        withRaniOS: monthlyRevenue * noShowRate * (1 - noShowReduction),
        savings: noShowSavings,
        description: 'AI-powered no-show prediction reduces missed appointments by 60%',
      },
      {
        label: 'Client Reactivation',
        current: 0,
        withRaniOS: reactivationValue * 0.3,
        savings: reactivationValue * 0.3,
        description: 'Automated reactivation campaigns re-engage 30% of lapsed clients',
      },
      {
        label: 'Admin Time Saved',
        current: adminHoursPerWeek * 4 * 25,
        withRaniOS: adminHoursPerWeek * 4 * 25 * 0.3,
        savings: adminSavings,
        description: `${Math.round(automatedHours * 4)} hours/month automated for your team`,
      },
      {
        label: 'AI Upsell Revenue',
        current: 0,
        withRaniOS: upsellIncrease,
        savings: upsellIncrease,
        description: 'AI consult co-pilot increases average ticket by 8%',
      },
      {
        label: 'Review Impact',
        current: 0,
        withRaniOS: reviewRevenueImpact,
        savings: reviewRevenueImpact,
        description: 'Automated review management drives 3% more bookings',
      },
    ];

    return { breakdown, totalMonthlySavings, planCost, netROI, roi: Math.round((netROI / planCost) * 100) };
  }, [monthlyRevenue, providers, frontDeskStaff]);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
      <div className="bg-[#0F1D2C] p-8 text-white">
        <h3 className="text-2xl font-bold mb-2">ROI Calculator</h3>
        <p className="text-white/60 text-sm">See how much RaniOS can save your medspa each month.</p>
      </div>

      <div className="p-8">
        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Revenue</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
              <input
                type="number"
                value={monthlyRevenue}
                onChange={(e) => setMonthlyRevenue(Math.max(0, Number(e.target.value)))}
                className="w-full pl-7 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F1D2C]/20 focus:border-[#0F1D2C]"
              />
            </div>
            <input
              type="range"
              min={10000}
              max={500000}
              step={5000}
              value={monthlyRevenue}
              onChange={(e) => setMonthlyRevenue(Number(e.target.value))}
              className="w-full mt-2 accent-[#0F1D2C]"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>$10K</span>
              <span>$500K</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Providers</label>
            <input
              type="number"
              min={1}
              max={50}
              value={providers}
              onChange={(e) => setProviders(Math.max(1, Number(e.target.value)))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F1D2C]/20 focus:border-[#0F1D2C]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Front Desk Staff</label>
            <input
              type="number"
              min={1}
              max={20}
              value={frontDeskStaff}
              onChange={(e) => setFrontDeskStaff(Math.max(1, Number(e.target.value)))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F1D2C]/20 focus:border-[#0F1D2C]"
            />
          </div>
        </div>

        {/* Results Header */}
        <div className="bg-gradient-to-r from-[#0F1D2C] to-[#1A2A3C] rounded-2xl p-6 mb-6 text-white">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-white/50 uppercase tracking-wider mb-1">Monthly Savings</p>
              <p className="text-2xl font-bold text-[#F3D6BE]">
                ${Math.round(roi.totalMonthlySavings).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-white/50 uppercase tracking-wider mb-1">RaniOS Cost</p>
              <p className="text-2xl font-bold">${roi.planCost}/mo</p>
            </div>
            <div>
              <p className="text-xs text-white/50 uppercase tracking-wider mb-1">ROI</p>
              <p className="text-2xl font-bold text-emerald-400">{roi.roi}%</p>
            </div>
          </div>
        </div>

        {/* Breakdown */}
        <div className="space-y-3">
          {roi.breakdown.map((item) => (
            <div key={item.label} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{item.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
              </div>
              <div className="text-right ml-4">
                <p className="text-sm font-bold text-emerald-600">
                  +${Math.round(item.savings).toLocaleString()}/mo
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Annual Impact */}
        <div className="mt-6 p-5 rounded-xl border-2 border-dashed border-[#F3D6BE] bg-[#FAF8F5]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[#0F1D2C]">Annual Net Impact</p>
              <p className="text-xs text-gray-500 mt-0.5">Total value added to your practice per year</p>
            </div>
            <p className="text-3xl font-bold text-[#0F1D2C]">
              ${Math.round(roi.netROI * 12).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
