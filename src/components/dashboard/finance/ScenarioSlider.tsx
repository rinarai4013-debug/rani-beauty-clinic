'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sliders, Plus, Minus, TrendingUp, DollarSign, Users, Megaphone } from 'lucide-react';
import type { ScenarioType } from '@/lib/finance/forecasting';

interface ScenarioConfig {
  type: ScenarioType;
  icon: React.ElementType;
  label: string;
  sliders: {
    key: string;
    label: string;
    min: number;
    max: number;
    step: number;
    defaultValue: number;
    prefix?: string;
    suffix?: string;
  }[];
}

const SCENARIOS: ScenarioConfig[] = [
  {
    type: 'add_provider',
    icon: Users,
    label: 'Add Provider',
    sliders: [
      { key: 'revenuePerHour', label: 'Revenue/Hour', min: 100, max: 500, step: 25, defaultValue: 250, prefix: '$' },
      { key: 'hoursPerWeek', label: 'Hours/Week', min: 8, max: 40, step: 4, defaultValue: 32 },
      { key: 'monthlySalary', label: 'Monthly Salary', min: 4000, max: 15000, step: 500, defaultValue: 8000, prefix: '$' },
    ],
  },
  {
    type: 'price_increase',
    icon: TrendingUp,
    label: 'Price Increase',
    sliders: [
      { key: 'percentIncrease', label: 'Increase', min: 2, max: 25, step: 1, defaultValue: 10, suffix: '%' },
    ],
  },
  {
    type: 'marketing_spend',
    icon: Megaphone,
    label: 'Marketing Spend',
    sliders: [
      { key: 'monthlyBudget', label: 'Monthly Budget', min: 500, max: 10000, step: 500, defaultValue: 3000, prefix: '$' },
      { key: 'expectedROAS', label: 'Expected ROAS', min: 1, max: 10, step: 0.5, defaultValue: 4, suffix: 'x' },
    ],
  },
  {
    type: 'add_service',
    icon: Plus,
    label: 'New Service',
    sliders: [
      { key: 'pricePoint', label: 'Price Point', min: 100, max: 5000, step: 50, defaultValue: 500, prefix: '$' },
      { key: 'monthlyBookings', label: 'Monthly Bookings', min: 5, max: 60, step: 5, defaultValue: 20 },
      { key: 'supplyCostPerUnit', label: 'Cost/Treatment', min: 20, max: 500, step: 10, defaultValue: 100, prefix: '$' },
      { key: 'equipmentCost', label: 'Equipment Cost', min: 0, max: 200000, step: 5000, defaultValue: 50000, prefix: '$' },
    ],
  },
];

interface ScenarioSliderProps {
  onScenarioChange: (_type: ScenarioType, _params: Record<string, number>) => void;
  activeScenario?: ScenarioType;
}

export default function ScenarioSlider({ onScenarioChange, activeScenario }: ScenarioSliderProps) {
  const [selected, setSelected] = useState<ScenarioType>(activeScenario ?? 'add_provider');
  const scenario = SCENARIOS.find(s => s.type === selected)!;
  const [values, setValues] = useState<Record<string, number>>(() => {
    const defaults: Record<string, number> = {};
    for (const s of scenario.sliders) {
      defaults[s.key] = s.defaultValue;
    }
    return defaults;
  });

  const handleSelect = (type: ScenarioType) => {
    setSelected(type);
    const sc = SCENARIOS.find(s => s.type === type)!;
    const defaults: Record<string, number> = {};
    for (const s of sc.sliders) {
      defaults[s.key] = s.defaultValue;
    }
    setValues(defaults);
    onScenarioChange(type, defaults);
  };

  const handleSliderChange = (key: string, value: number) => {
    const newValues = { ...values, [key]: value };
    setValues(newValues);
    onScenarioChange(selected, newValues);
  };

  return (
    <div className="space-y-4">
      {/* Scenario selector tabs */}
      <div className="flex flex-wrap gap-2">
        {SCENARIOS.map(s => {
          const Icon = s.icon;
          const isActive = selected === s.type;
          return (
            <button
              key={s.type}
              onClick={() => handleSelect(s.type)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-body font-medium transition-all ${
                isActive
                  ? 'bg-rani-navy text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-rani-muted hover:border-rani-gold hover:text-rani-navy'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Sliders */}
      <motion.div
        key={selected}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4 p-4 bg-white rounded-xl border border-gray-200"
      >
        <div className="flex items-center gap-2 mb-2">
          <Sliders className="w-4 h-4 text-rani-gold" />
          <h4 className="text-sm font-heading font-semibold text-rani-navy">{scenario.label} Parameters</h4>
        </div>

        {scenario.sliders.map(slider => (
          <div key={slider.key}>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-body text-rani-muted">{slider.label}</label>
              <span className="text-sm font-body font-semibold text-rani-navy">
                {slider.prefix ?? ''}{values[slider.key]?.toLocaleString()}{slider.suffix ?? ''}
              </span>
            </div>
            <input
              type="range"
              min={slider.min}
              max={slider.max}
              step={slider.step}
              value={values[slider.key] ?? slider.defaultValue}
              onChange={e => handleSliderChange(slider.key, Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-rani-gold"
            />
            <div className="flex justify-between text-[10px] text-rani-muted font-body mt-0.5">
              <span>{slider.prefix ?? ''}{slider.min.toLocaleString()}{slider.suffix ?? ''}</span>
              <span>{slider.prefix ?? ''}{slider.max.toLocaleString()}{slider.suffix ?? ''}</span>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
