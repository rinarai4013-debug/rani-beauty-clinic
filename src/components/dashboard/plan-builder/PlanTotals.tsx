'use client';

import { DollarSign, Layers, CreditCard } from 'lucide-react';
import type { GeneratedPackage } from '@/lib/plan-builder/types';

interface PlanTotalsProps {
  totalServices: number;
  totalValue: number;
  packages: GeneratedPackage[];
}

export default function PlanTotals({ totalServices, totalValue, packages }: PlanTotalsProps) {
  const recommendedPkg = packages.find((p) => p.highlighted);
  const cherryMonthly12 = recommendedPkg
    ? recommendedPkg.monthlyPayment12
    : totalValue > 0
      ? Math.ceil(totalValue / 12)
      : 0;
  const cherryMonthly24 = recommendedPkg
    ? recommendedPkg.monthlyPayment24
    : totalValue > 0
      ? Math.ceil(totalValue / 24)
      : 0;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <h3 className="text-sm font-semibold text-[#0F1D2C] mb-4">Plan Summary</h3>

      <div className="space-y-4">
        {/* Total services */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
            <Layers className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Services</p>
            <p className="text-lg font-bold text-[#0F1D2C] tabular-nums">{totalServices}</p>
          </div>
        </div>

        {/* Total value */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#C9A96E]/10 flex items-center justify-center">
            <DollarSign className="h-4 w-4 text-[#C9A96E]" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Estimated Value</p>
            <p className="text-lg font-bold text-[#0F1D2C] tabular-nums">
              ${totalValue.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Financing estimate */}
        {totalValue > 0 && (
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0 mt-0.5">
              <CreditCard className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Financing Options</p>
              <p className="text-sm font-bold text-[#0F1D2C] tabular-nums">
                ${cherryMonthly12}/mo <span className="text-xs font-normal text-gray-400">(12 mo)</span>
              </p>
              <p className="text-xs text-gray-400 tabular-nums">
                ${cherryMonthly24}/mo for 24 months
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                <a
                  href="https://patient.withcherry.com/apply/rani-beauty-clinic"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] font-medium text-[#C9A96E] hover:underline"
                >
                  Apply with Cherry
                </a>
                <span className="text-gray-300">|</span>
                <a
                  href="https://app.patientfi.com/v2/rani-beauty-clinic/apply"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] font-medium text-[#C9A96E] hover:underline"
                >
                  Apply with PatientFi
                </a>
              </div>
              <p className="text-[10px] text-gray-400 mt-1">No impact to your credit score</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
