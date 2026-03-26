'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calculator, Users, Megaphone, MapPin, Wrench } from 'lucide-react';
import { DashboardErrorBoundary } from '@/components/dashboard/shared';
import ROICalculator from '@/components/dashboard/finance/ROICalculator';
import { analyzeStaffHiring, analyzeMarketingROI, analyzeLeaseVsBuy, type StaffHiringModel, type MarketingChannelModel, type LeaseVsBuyInput } from '@/lib/finance/investment-analyzer';

type Tab = 'equipment' | 'hiring' | 'marketing' | 'lease_buy';

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: 'equipment', label: 'Equipment ROI', icon: Calculator },
  { key: 'hiring', label: 'Hiring ROI', icon: Users },
  { key: 'marketing', label: 'Marketing ROI', icon: Megaphone },
  { key: 'lease_buy', label: 'Lease vs Buy', icon: Wrench },
];

export default function InvestmentsPage() {
  return (
    <DashboardErrorBoundary pageName="Investment Analyzer">
      <InvestmentsContent />
    </DashboardErrorBoundary>
  );
}

function InvestmentsContent() {
  const [activeTab, setActiveTab] = useState<Tab>('equipment');

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-xl sm:text-2xl font-heading text-rani-navy">Investment Analyzer</h1>
        <p className="text-xs sm:text-sm font-body text-rani-muted mt-1">ROI calculators for equipment, hiring, marketing, and lease decisions</p>
      </div>

      {/* Tab navigation */}
      <div className="flex flex-wrap gap-2">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-body font-medium transition-all ${
                isActive
                  ? 'bg-rani-navy text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-rani-muted hover:border-rani-gold hover:text-rani-navy'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        {activeTab === 'equipment' && <EquipmentTab />}
        {activeTab === 'hiring' && <HiringTab />}
        {activeTab === 'marketing' && <MarketingTab />}
        {activeTab === 'lease_buy' && <LeaseVsBuyTab />}
      </motion.div>
    </div>
  );
}

function EquipmentTab() {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-5">
      <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">Equipment ROI Calculator</h3>
      <ROICalculator
        defaults={{
          name: 'Sofwave Device',
          cost: 150000,
          installationCost: 5000,
          trainingCost: 8000,
          monthlyMaintenance: 500,
          usefulLifeYears: 7,
          salvageValue: 15000,
          estimatedTreatmentsPerMonth: 25,
          revenuePerTreatment: 3000,
          costPerTreatment: 200,
          requiredStaffHoursPerTreatment: 1.5,
          staffCostPerHour: 50,
        }}
      />
    </div>
  );
}

function HiringTab() {
  const [model, setModel] = useState<StaffHiringModel>({
    role: 'Injection Specialist',
    annualSalary: 85000,
    benefits: 12000,
    trainingCost: 5000,
    rampUpMonths: 3,
    expectedRevenuePerHour: 300,
    hoursPerWeek: 35,
    utilizationTarget: 0.75,
  });

  const result = analyzeStaffHiring(model);

  const update = (field: keyof StaffHiringModel, value: number) => {
    setModel(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-5 space-y-6">
      <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider">Hiring ROI Calculator</h3>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SliderInput label="Annual Salary" value={model.annualSalary} min={40000} max={200000} step={5000} prefix="$" onChange={v => update('annualSalary', v)} />
        <SliderInput label="Benefits (Annual)" value={model.benefits} min={0} max={30000} step={1000} prefix="$" onChange={v => update('benefits', v)} />
        <SliderInput label="Revenue/Hour" value={model.expectedRevenuePerHour} min={100} max={600} step={25} prefix="$" onChange={v => update('expectedRevenuePerHour', v)} />
        <SliderInput label="Hours/Week" value={model.hoursPerWeek} min={10} max={45} step={5} onChange={v => update('hoursPerWeek', v)} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <ResultBox label="Annual Revenue" value={`$${result.expectedAnnualRevenue.toLocaleString()}`} />
        <ResultBox label="Annual Profit" value={`$${result.expectedAnnualProfit.toLocaleString()}`} color={result.expectedAnnualProfit >= 0 ? 'text-green-600' : 'text-red-500'} />
        <ResultBox label="ROI" value={`${result.roi}%`} color={result.roi >= 30 ? 'text-green-600' : result.roi >= 0 ? 'text-amber-600' : 'text-red-500'} />
        <ResultBox label="Payback" value={result.paybackMonths > 0 ? `${result.paybackMonths} months` : 'N/A'} />
      </div>

      {/* Utilization sensitivity */}
      <div>
        <h4 className="text-xs font-body font-semibold text-rani-navy mb-2">Utilization Sensitivity</h4>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {result.utilizationSensitivity.map(s => (
            <div key={s.utilization} className={`p-2 rounded-lg text-center ${s.annualProfit >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
              <p className="text-[10px] text-rani-muted font-body">{Math.round(s.utilization * 100)}%</p>
              <p className={`text-xs font-body font-semibold ${s.annualProfit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                ${(s.annualProfit / 1000).toFixed(0)}K
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className={`p-4 rounded-xl border ${result.roi >= 30 ? 'border-green-200 bg-green-50' : result.roi >= 0 ? 'border-amber-200 bg-amber-50' : 'border-red-200 bg-red-50'}`}>
        <p className="text-sm font-body text-rani-navy">{result.recommendation}</p>
      </div>
    </div>
  );
}

function MarketingTab() {
  const [channels] = useState<MarketingChannelModel[]>([
    { channel: 'Meta Ads', monthlySpend: 3000, leadsPerMonth: 60, conversionRate: 0.15, avgFirstVisitRevenue: 350, avgClientLTV: 4200, timeToFirstBooking: 7 },
    { channel: 'Google Ads', monthlySpend: 2000, leadsPerMonth: 40, conversionRate: 0.20, avgFirstVisitRevenue: 450, avgClientLTV: 5000, timeToFirstBooking: 5 },
    { channel: 'Instagram Organic', monthlySpend: 500, leadsPerMonth: 15, conversionRate: 0.10, avgFirstVisitRevenue: 300, avgClientLTV: 3800, timeToFirstBooking: 14 },
    { channel: 'Referrals', monthlySpend: 200, leadsPerMonth: 10, conversionRate: 0.50, avgFirstVisitRevenue: 400, avgClientLTV: 6000, timeToFirstBooking: 3 },
  ]);

  const result = analyzeMarketingROI(channels);

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-5 space-y-6">
      <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider">Marketing Channel ROI</h3>

      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 px-3 font-heading font-semibold text-rani-navy text-xs">Channel</th>
              <th className="text-right py-2 px-3 font-heading font-semibold text-rani-navy text-xs">Spend</th>
              <th className="text-right py-2 px-3 font-heading font-semibold text-rani-navy text-xs">CAC</th>
              <th className="text-right py-2 px-3 font-heading font-semibold text-rani-navy text-xs">LTV:CAC</th>
              <th className="text-right py-2 px-3 font-heading font-semibold text-rani-navy text-xs">Annual ROI</th>
              <th className="text-left py-2 px-3 font-heading font-semibold text-rani-navy text-xs">Action</th>
            </tr>
          </thead>
          <tbody>
            {result.channels.map(c => (
              <tr key={c.channel} className="border-b border-gray-100">
                <td className="py-2.5 px-3 font-body font-medium text-rani-navy">{c.channel}</td>
                <td className="py-2.5 px-3 text-right font-body text-rani-muted">${c.monthlySpend.toLocaleString()}/mo</td>
                <td className="py-2.5 px-3 text-right font-body text-rani-navy">${c.cac}</td>
                <td className="py-2.5 px-3 text-right">
                  <span className={`font-body font-semibold ${c.ltvCacRatio >= 3 ? 'text-green-600' : c.ltvCacRatio >= 1 ? 'text-amber-600' : 'text-red-500'}`}>
                    {c.ltvCacRatio}x
                  </span>
                </td>
                <td className="py-2.5 px-3 text-right font-body font-semibold text-rani-navy">{c.annualROI}%</td>
                <td className="py-2.5 px-3 text-xs font-body text-rani-muted">{c.recommendation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <ResultBox label="Best Channel" value={result.bestChannel} />
        <ResultBox label="Blended ROI" value={`${result.blendedROI}%`} color={result.blendedROI >= 100 ? 'text-green-600' : 'text-rani-navy'} />
      </div>
    </div>
  );
}

function LeaseVsBuyTab() {
  const [input, setInput] = useState<LeaseVsBuyInput>({
    assetName: 'Laser Device',
    purchasePrice: 80000,
    leaseMonthlyCost: 2200,
    leaseTermMonths: 48,
    leaseBuyoutPrice: 5000,
    maintenanceIfOwned: 3000,
    maintenanceIfLeased: 0,
    usefulLifeYears: 7,
    salvageValue: 10000,
    taxRate: 0.24,
    discountRate: 0.08,
  });

  const result = analyzeLeaseVsBuy(input);

  const update = (field: keyof LeaseVsBuyInput, value: number) => {
    setInput(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-5 space-y-6">
      <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider">Lease vs Buy Analysis</h3>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SliderInput label="Purchase Price" value={input.purchasePrice} min={10000} max={300000} step={5000} prefix="$" onChange={v => update('purchasePrice', v)} />
        <SliderInput label="Lease Payment" value={input.leaseMonthlyCost} min={200} max={8000} step={100} prefix="$" suffix="/mo" onChange={v => update('leaseMonthlyCost', v)} />
        <SliderInput label="Lease Term" value={input.leaseTermMonths} min={12} max={84} step={6} suffix=" months" onChange={v => update('leaseTermMonths', v)} />
        <SliderInput label="Salvage Value" value={input.salvageValue} min={0} max={50000} step={1000} prefix="$" onChange={v => update('salvageValue', v)} />
      </div>

      {/* Recommendation */}
      <div className={`p-5 rounded-xl border-2 ${result.recommendation === 'buy' ? 'border-green-300 bg-green-50' : 'border-blue-300 bg-blue-50'}`}>
        <p className="text-lg font-heading font-semibold text-rani-navy capitalize mb-1">
          Recommendation: {result.recommendation}
        </p>
        <p className="text-sm font-body text-rani-muted">{result.reasoning}</p>
      </div>

      {/* Comparison table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 px-3 font-heading font-semibold text-rani-navy text-xs">Factor</th>
              <th className="text-right py-2 px-3 font-heading font-semibold text-blue-600 text-xs">Lease</th>
              <th className="text-right py-2 px-3 font-heading font-semibold text-green-600 text-xs">Buy</th>
            </tr>
          </thead>
          <tbody>
            {result.comparison.map(row => (
              <tr key={row.factor} className="border-b border-gray-100">
                <td className="py-2.5 px-3 font-body text-rani-muted">{row.factor}</td>
                <td className="py-2.5 px-3 text-right font-body text-rani-navy">{row.lease}</td>
                <td className="py-2.5 px-3 text-right font-body text-rani-navy">{row.buy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Shared components
function SliderInput({ label, value, min, max, step, prefix, suffix, onChange }: {
  label: string; value: number; min: number; max: number; step: number; prefix?: string; suffix?: string; onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-body text-rani-muted">{label}</label>
        <span className="text-xs font-body font-semibold text-rani-navy">{prefix ?? ''}{value.toLocaleString()}{suffix ?? ''}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-rani-gold" />
    </div>
  );
}

function ResultBox({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="p-3 rounded-lg bg-rani-cream/50">
      <p className="text-[10px] text-rani-muted font-body">{label}</p>
      <p className={`text-lg font-heading font-semibold ${color ?? 'text-rani-navy'}`}>{value}</p>
    </div>
  );
}
