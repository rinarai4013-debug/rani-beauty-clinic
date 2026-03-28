'use client';

import type { ScenarioModel } from '@/lib/revenue/forecasting-v2';

interface ScenarioComparisonTableProps {
  scenarios: ScenarioModel[];
  baseline: number;
}

export default function ScenarioComparisonTable({ scenarios, baseline }: ScenarioComparisonTableProps) {
  const feasibilityColors: Record<string, string> = {
    high: 'bg-emerald-100 text-emerald-700',
    moderate: 'bg-amber-100 text-amber-700',
    aggressive: 'bg-red-100 text-red-700',
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left py-2 px-3 text-xs font-body font-medium text-rani-muted uppercase">Scenario</th>
            <th className="text-right py-2 px-3 text-xs font-body font-medium text-rani-muted uppercase">Monthly</th>
            <th className="text-right py-2 px-3 text-xs font-body font-medium text-rani-muted uppercase">Annual</th>
            <th className="text-right py-2 px-3 text-xs font-body font-medium text-rani-muted uppercase">Delta</th>
            <th className="text-center py-2 px-3 text-xs font-body font-medium text-rani-muted uppercase">Feasibility</th>
          </tr>
        </thead>
        <tbody>
          {/* Baseline */}
          <tr className="border-b border-gray-100 bg-gray-50/50">
            <td className="py-2.5 px-3">
              <p className="font-body font-medium text-rani-navy">Current Baseline</p>
            </td>
            <td className="py-2.5 px-3 text-right font-heading text-rani-navy">${baseline.toLocaleString()}</td>
            <td className="py-2.5 px-3 text-right font-heading text-rani-navy">${(baseline * 12).toLocaleString()}</td>
            <td className="py-2.5 px-3 text-right text-rani-muted font-body">--</td>
            <td className="py-2.5 px-3 text-center">--</td>
          </tr>
          {scenarios.map((scenario, i) => (
            <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
              <td className="py-2.5 px-3">
                <p className="font-body font-medium text-rani-navy">{scenario.name}</p>
                <p className="text-xs text-rani-muted font-body mt-0.5">{scenario.description}</p>
              </td>
              <td className="py-2.5 px-3 text-right font-heading text-rani-navy">
                ${scenario.monthlyRevenue.toLocaleString()}
              </td>
              <td className="py-2.5 px-3 text-right font-heading text-rani-navy">
                ${scenario.annualRevenue.toLocaleString()}
              </td>
              <td className="py-2.5 px-3 text-right">
                <span className="text-emerald-600 font-heading">
                  +${scenario.delta.toLocaleString()}
                </span>
                <span className="text-xs text-rani-muted font-body block">+{scenario.deltaPercent}%</span>
              </td>
              <td className="py-2.5 px-3 text-center">
                <span className={`text-xs px-2 py-0.5 rounded-full font-body ${feasibilityColors[scenario.feasibility]}`}>
                  {scenario.feasibility}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
