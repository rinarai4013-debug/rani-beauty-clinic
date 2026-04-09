'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Calculator, TrendingUp, Clock, DollarSign } from 'lucide-react';
import { analyzeEquipmentROI, type EquipmentInvestment } from '@/lib/finance/investment-analyzer';

interface ROICalculatorProps {
  defaults?: Partial<EquipmentInvestment>;
}

const DEFAULT_VALUES: EquipmentInvestment = {
  name: 'New Device',
  cost: 50000,
  installationCost: 2000,
  trainingCost: 3000,
  monthlyMaintenance: 200,
  usefulLifeYears: 7,
  salvageValue: 5000,
  estimatedTreatmentsPerMonth: 30,
  revenuePerTreatment: 400,
  costPerTreatment: 50,
  requiredStaffHoursPerTreatment: 1,
  staffCostPerHour: 40,
};

export default function ROICalculator({ defaults }: ROICalculatorProps) {
  const [inputs, setInputs] = useState<EquipmentInvestment>({ ...DEFAULT_VALUES, ...defaults });
  const result = analyzeEquipmentROI(inputs);

  const update = (field: keyof EquipmentInvestment, value: number) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  const paybackData = result.monthlyBreakdown
    .filter((_, i) => i < 24)
    .map(m => ({
      month: `M${m.month}`,
      profit: m.cumulativeProfit,
    }));

  return (
    <div className="space-y-6">
      {/* Input grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <InputField label="Equipment Cost" value={inputs.cost} onChange={v => update('cost', v)} prefix="$" />
        <InputField label="Install + Training" value={inputs.installationCost + inputs.trainingCost} onChange={v => { update('installationCost', v * 0.4); update('trainingCost', v * 0.6); }} prefix="$" />
        <InputField label="Monthly Maintenance" value={inputs.monthlyMaintenance} onChange={v => update('monthlyMaintenance', v)} prefix="$" />
        <InputField label="Useful Life (years)" value={inputs.usefulLifeYears} onChange={v => update('usefulLifeYears', v)} />
        <InputField label="Treatments/Month" value={inputs.estimatedTreatmentsPerMonth} onChange={v => update('estimatedTreatmentsPerMonth', v)} />
        <InputField label="Revenue/Treatment" value={inputs.revenuePerTreatment} onChange={v => update('revenuePerTreatment', v)} prefix="$" />
        <InputField label="Cost/Treatment" value={inputs.costPerTreatment} onChange={v => update('costPerTreatment', v)} prefix="$" />
        <InputField label="Staff $/hr" value={inputs.staffCostPerHour} onChange={v => update('staffCostPerHour', v)} prefix="$" />
      </div>

      {/* Results KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <ResultCard icon={DollarSign} label="Monthly Profit" value={`$${result.monthlyProfit.toLocaleString()}`} color={result.monthlyProfit >= 0 ? 'text-green-600' : 'text-red-500'} />
        <ResultCard icon={TrendingUp} label="Annual ROI" value={`${result.annualROI}%`} color={result.annualROI >= 25 ? 'text-green-600' : result.annualROI >= 0 ? 'text-amber-600' : 'text-red-500'} />
        <ResultCard icon={Clock} label="Payback Period" value={result.paybackMonths > 0 ? `${result.paybackMonths} months` : 'N/A'} color="text-rani-navy" />
        <ResultCard icon={Calculator} label="5-Year NPV" value={`$${result.fiveYearNPV.toLocaleString()}`} color={result.fiveYearNPV >= 0 ? 'text-green-600' : 'text-red-500'} />
      </div>

      {/* Payback chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h4 className="text-sm font-heading font-semibold text-rani-navy mb-3">Cumulative Profit (24 months)</h4>
        <div style={{ height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={paybackData} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#6B7280' }} interval={2} />
              <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 11, fill: '#6B7280' }} />
              <Tooltip formatter={((v: number) => [`$${v.toLocaleString()}`, 'Cumulative Profit']) as any} contentStyle={{ background: '#0F1D2C', border: 'none', borderRadius: '8px', color: '#fff', fontSize: 13 }} />
              <ReferenceLine y={0} stroke="#9CA3AF" strokeDasharray="3 3" />
              <Bar dataKey="profit" radius={[3, 3, 0, 0]}>
                {paybackData.map((entry, i) => (
                  <motion.rect key={i} fill={entry.profit >= 0 ? '#10B981' : '#EF4444'} fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recommendation */}
      <div className={`p-4 rounded-xl border ${result.annualROI >= 25 ? 'border-green-200 bg-green-50' : result.annualROI >= 0 ? 'border-amber-200 bg-amber-50' : 'border-red-200 bg-red-50'}`}>
        <p className="text-sm font-body text-rani-navy">{result.recommendation}</p>
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, prefix }: { label: string; value: number; onChange: (v: number) => void; prefix?: string }) {
  return (
    <div>
      <label className="block text-xs font-body text-rani-muted mb-1">{label}</label>
      <div className="relative">
        {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-rani-muted">{prefix}</span>}
        <input
          type="number"
          value={value}
          onChange={e => onChange(Number(e.target.value) || 0)}
          className={`w-full py-2 ${prefix ? 'pl-7' : 'pl-3'} pr-3 text-sm font-body border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rani-gold/40 focus:border-rani-gold text-rani-navy`}
        />
      </div>
    </div>
  );
}

function ResultCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string; color: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="p-3 rounded-xl bg-white border border-gray-200">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4 text-rani-gold" />
        <span className="text-xs font-body text-rani-muted">{label}</span>
      </div>
      <p className={`text-lg font-heading font-semibold ${color}`}>{value}</p>
    </motion.div>
  );
}
