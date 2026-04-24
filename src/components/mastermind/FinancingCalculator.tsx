'use client';

/**
 * FinancingCalculator — Interactive monthly payment selector
 *
 * Reads FinancingOption[] computed in useMastermindFlow from
 * calculateFinancingOptions() in mastermind/index.ts.
 * No internal computation — pure display + selection.
 */

import { motion } from 'framer-motion';
import { Calculator, Check } from 'lucide-react';
import type { FinancingOption } from '@/lib/mastermind/index';

interface FinancingCalculatorProps {
  amount: number;
  options: FinancingOption[];
  selectedOption: FinancingOption | null;
  onSelect: (_months: number | null) => void;
  variant?: 'light' | 'dark';
}

export default function FinancingCalculator({
  amount,
  options,
  selectedOption,
  onSelect,
  variant = 'light',
}: FinancingCalculatorProps) {
  const isDark = variant === 'dark';

  if (options.length === 0) return null;

  return (
    <div
      className={`rounded-2xl p-6 ${
        isDark
          ? 'bg-white/5 border border-white/10'
          : 'bg-[#F8F6F1] border border-[#0F1D2C]/5'
      }`}
    >
      <div className="flex items-center gap-2 mb-4">
        <Calculator className={`w-5 h-5 ${isDark ? 'text-[#C9A96E]' : 'text-[#0F1D2C]/60'}`} />
        <h3
          className={`font-[family-name:var(--font-heading)] text-lg ${
            isDark ? 'text-white' : 'text-[#0F1D2C]'
          }`}
        >
          Flexible Financing
        </h3>
      </div>

      <p className={`font-body text-xs mb-5 ${isDark ? 'text-white/40' : 'text-[#0F1D2C]/40'}`}>
        Make your transformation affordable with monthly payments.
        Select a term to see your payment.
      </p>

      {/* Pay in Full option */}
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={`w-full flex items-center justify-between rounded-xl px-4 py-3 mb-3 border-2 transition-all ${
          !selectedOption
            ? isDark
              ? 'border-[#C9A96E] bg-[#C9A96E]/10'
              : 'border-[#C9A96E] bg-[#C9A96E]/5'
            : isDark
              ? 'border-white/10 hover:border-white/20'
              : 'border-[#0F1D2C]/10 hover:border-[#0F1D2C]/20'
        }`}
      >
        <div className="text-left">
          <div className={`font-body text-sm font-medium ${isDark ? 'text-white' : 'text-[#0F1D2C]'}`}>
            Pay in Full
          </div>
          <div className={`font-body text-xs ${isDark ? 'text-white/40' : 'text-[#0F1D2C]/40'}`}>
            Best value — no interest
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`font-[family-name:var(--font-heading)] text-lg font-bold ${
              isDark ? 'text-[#C9A96E]' : 'text-[#0F1D2C]'
            }`}
          >
            ${amount.toLocaleString()}
          </span>
          {!selectedOption && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
              <Check className="w-5 h-5 text-[#C9A96E]" />
            </motion.div>
          )}
        </div>
      </button>

      {/* Financing Options */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {options.map((opt) => {
          const isSelected = selectedOption?.termMonths === opt.termMonths;

          return (
            <button
              key={opt.termMonths}
              type="button"
              onClick={() => onSelect(opt.termMonths)}
              className={`rounded-xl px-3 py-3 text-center border-2 transition-all ${
                isSelected
                  ? isDark
                    ? 'border-[#C9A96E] bg-[#C9A96E]/10'
                    : 'border-[#C9A96E] bg-[#C9A96E]/5'
                  : isDark
                    ? 'border-white/10 hover:border-white/20 bg-white/5'
                    : 'border-[#0F1D2C]/10 hover:border-[#0F1D2C]/20 bg-white'
              }`}
            >
              <div className={`font-body text-xs font-medium ${isDark ? 'text-white/60' : 'text-[#0F1D2C]/60'}`}>
                {opt.label}
              </div>
              <div
                className={`font-[family-name:var(--font-heading)] text-xl font-bold mt-1 ${
                  isSelected
                    ? 'text-[#C9A96E]'
                    : isDark
                      ? 'text-white'
                      : 'text-[#0F1D2C]'
                }`}
              >
                ${opt.monthlyPayment}
              </div>
              <div className={`font-body text-[10px] ${isDark ? 'text-white/30' : 'text-[#0F1D2C]/30'}`}>
                /month
              </div>
              {opt.apr > 0 && (
                <div className={`font-body text-[10px] mt-1 ${isDark ? 'text-white/20' : 'text-[#0F1D2C]/20'}`}>
                  {opt.apr}% APR
                </div>
              )}
              {opt.apr === 0 && (
                <div className="font-body text-[10px] mt-1 text-green-500 font-medium">
                  0% Interest
                </div>
              )}
              {isSelected && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="mt-1">
                  <Check className="w-4 h-4 text-[#C9A96E] mx-auto" />
                </motion.div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Summary */}
      {selectedOption && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="mt-4 pt-4 border-t border-white/5"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className={`font-body text-xs ${isDark ? 'text-white/40' : 'text-[#0F1D2C]/40'}`}>
                {selectedOption.label} financing
              </span>
              <div className={`font-body text-xs ${isDark ? 'text-white/20' : 'text-[#0F1D2C]/20'}`}>
                Total: ${selectedOption.totalCost.toLocaleString()}
                {selectedOption.apr > 0 &&
                  ` (${selectedOption.apr}% APR = $${(selectedOption.totalCost - amount).toLocaleString()} interest)`}
              </div>
            </div>
            <div className="text-right">
              <span className="font-[family-name:var(--font-heading)] text-2xl font-bold text-[#C9A96E]">
                ${selectedOption.monthlyPayment}
              </span>
              <span className={`font-body text-xs ${isDark ? 'text-white/30' : 'text-[#0F1D2C]/30'}`}>
                /mo
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Cherry / PatientFi note */}
      <p className={`font-body text-[10px] mt-3 ${isDark ? 'text-white/15' : 'text-[#0F1D2C]/15'}`}>
        Financing provided through Cherry or PatientFi. Subject to credit approval.
        Rates shown are estimates — actual terms may vary.
      </p>
    </div>
  );
}
