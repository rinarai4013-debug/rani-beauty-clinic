'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { calculateROI, segmentClinic, SEGMENT_RECOMMENDED_PLAN } from '@/lib/saas/sales-funnel';
import { formatCurrency } from '@/lib/saas/self-serve-billing';

export default function ROICalculatorPage() {
  const [providerCount, setProviderCount] = useState(3);
  const [currentSoftware, setCurrentSoftware] = useState('none');
  const [avgRevenue, setAvgRevenue] = useState(15000);
  const [calculated, setCalculated] = useState(false);

  const roi = useMemo(
    () => calculateROI(providerCount, currentSoftware, avgRevenue),
    [providerCount, currentSoftware, avgRevenue]
  );

  const segment = segmentClinic(providerCount);
  const recommendedPlan = SEGMENT_RECOMMENDED_PLAN[segment];

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

      <div className="pt-28 pb-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#0F1D2C]/5 rounded-full mb-6">
              <span className="text-sm text-[#0F1D2C] font-medium">ROI Calculator</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-[#0F1D2C]">
              What Could RaniOS Save Your Clinic?
            </h1>
            <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
              Adjust the sliders to match your clinic and see a personalized ROI projection.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Calculator Inputs */}
            <div className="space-y-8">
              <div>
                <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-3">
                  <span>Number of Providers</span>
                  <span className="text-lg font-bold text-[#0F1D2C]">{providerCount}</span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={20}
                  value={providerCount}
                  onChange={(e) => { setProviderCount(Number(e.target.value)); setCalculated(true); }}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#0F1D2C]"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>1</span><span>10</span><span>20</span>
                </div>
              </div>

              <div>
                <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-3">
                  <span>Average Revenue per Provider</span>
                  <span className="text-lg font-bold text-[#0F1D2C]">{formatCurrency(avgRevenue)}/mo</span>
                </label>
                <input
                  type="range"
                  min={5000}
                  max={50000}
                  step={1000}
                  value={avgRevenue}
                  onChange={(e) => { setAvgRevenue(Number(e.target.value)); setCalculated(true); }}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#0F1D2C]"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>$5K</span><span>$25K</span><span>$50K</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Software</label>
                <select
                  value={currentSoftware}
                  onChange={(e) => { setCurrentSoftware(e.target.value); setCalculated(true); }}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:border-[#0F1D2C] focus:outline-none focus:ring-1 focus:ring-[#0F1D2C]"
                >
                  <option value="none">None / Paper / Spreadsheets</option>
                  <option value="jane">Jane App</option>
                  <option value="mindbody">Mindbody</option>
                  <option value="vagaro">Vagaro</option>
                  <option value="boulevard">Boulevard</option>
                  <option value="mangomint">Mangomint</option>
                  <option value="zenoti">Zenoti</option>
                  <option value="aesthetic_record">Aesthetic Record</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Your Clinic Profile</p>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Segment</span>
                    <span className="text-sm font-medium text-[#0F1D2C] capitalize">{segment} clinic</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Recommended Plan</span>
                    <span className="text-sm font-medium text-[#0F1D2C] capitalize">{recommendedPlan}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Monthly Revenue</span>
                    <span className="text-sm font-medium text-[#0F1D2C]">{formatCurrency(providerCount * avgRevenue)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Results */}
            <div>
              {/* Hero Metric */}
              <div className="bg-gradient-to-br from-[#0F1D2C] to-[#1A2A3C] rounded-2xl p-8 text-center mb-6">
                <p className="text-[#F3D6BE] text-sm font-bold uppercase tracking-wider mb-2">Projected Annual Savings</p>
                <p className="text-4xl sm:text-5xl font-bold text-white">
                  {formatCurrency(roi.roi.annualSavings)}
                </p>
                <p className="text-white/50 text-sm mt-2">
                  {roi.roi.roiPercentage}% ROI | Payback in {roi.roi.paybackDays} days
                </p>
              </div>

              {/* Cost Breakdown */}
              <div className="bg-red-50 rounded-xl border border-red-100 p-5 mb-4">
                <p className="text-xs font-bold text-red-800 uppercase tracking-wider mb-3">Current Monthly Costs</p>
                <div className="space-y-2">
                  {[
                    { label: 'Current software', value: roi.currentCosts.software },
                    { label: 'Manual labor', value: roi.currentCosts.manualLabor },
                    { label: 'Lost revenue (no-shows/churn)', value: roi.currentCosts.lostRevenue },
                    { label: 'Marketing waste', value: roi.currentCosts.marketingWaste },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between">
                      <span className="text-sm text-red-700">{item.label}</span>
                      <span className="text-sm font-medium text-red-900">{formatCurrency(item.value)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between pt-2 border-t border-red-200">
                    <span className="text-sm font-bold text-red-900">Total Monthly Cost</span>
                    <span className="text-sm font-bold text-red-900">{formatCurrency(roi.currentCosts.total)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-5 mb-4">
                <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-3">With RaniOS</p>
                <div className="space-y-2">
                  {[
                    { label: 'RaniOS subscription', value: roi.withRaniOS.subscriptionCost },
                    { label: 'Labor savings', value: -roi.withRaniOS.laborSavings },
                    { label: 'Revenue recovered', value: -roi.withRaniOS.revenueGain },
                    { label: 'Marketing savings', value: -roi.withRaniOS.marketingSavings },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between">
                      <span className="text-sm text-emerald-700">{item.label}</span>
                      <span className="text-sm font-medium text-emerald-900">
                        {item.value > 0 ? formatCurrency(item.value) : `-${formatCurrency(Math.abs(item.value))}`}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between pt-2 border-t border-emerald-200">
                    <span className="text-sm font-bold text-emerald-900">Monthly Net Benefit</span>
                    <span className="text-sm font-bold text-emerald-900">{formatCurrency(roi.roi.monthlySavings)}</span>
                  </div>
                </div>
              </div>

              <Link
                href="/marketing#lead-form"
                className="block w-full text-center py-3.5 bg-[#0F1D2C] text-white rounded-xl font-bold hover:bg-[#1A2A3C] transition-colors shadow-lg shadow-[#0F1D2C]/20"
              >
                Start Free Trial — See Real Savings
              </Link>
              <p className="text-xs text-gray-400 text-center mt-2">
                Results based on industry averages. Your actual savings may vary.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
