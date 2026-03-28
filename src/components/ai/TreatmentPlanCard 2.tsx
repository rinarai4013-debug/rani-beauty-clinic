'use client';

import { motion } from 'framer-motion';
import { Clock, DollarSign, Zap, Calendar, Shield, TrendingUp } from 'lucide-react';
import type { TreatmentPlan } from '@/types/ai-treatment';

interface TreatmentPlanCardProps {
  plan: TreatmentPlan;
  compact?: boolean;
}

export default function TreatmentPlanCard({ plan, compact = false }: TreatmentPlanCardProps) {
  const primary = plan.primary;

  if (compact) {
    return (
      <div className="bg-white rounded-xl border border-[#F8F6F1] p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-montserrat font-semibold text-[#0F1D2C]">{primary.treatment}</h4>
          <span className="text-sm font-montserrat text-[#C9A96E] font-semibold">{primary.fitScore}%</span>
        </div>
        <p className="text-sm text-[#0F1D2C]/60 font-montserrat">{primary.reasoning}</p>
        <div className="flex gap-4 mt-3 text-xs font-montserrat text-[#0F1D2C]/50">
          <span>${primary.price}</span>
          <span>{primary.downtime} downtime</span>
          <span>{primary.sessions} session{primary.sessions > 1 ? 's' : ''}</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-md border border-[#F8F6F1] overflow-hidden"
    >
      {/* Primary Treatment */}
      <div className="p-6 border-b border-[#F8F6F1]">
        <div className="flex items-start justify-between mb-3">
          <div>
            <span className="text-xs font-montserrat text-[#C9A96E] uppercase tracking-wide">Recommended Treatment</span>
            <h3 className="text-xl font-playfair text-[#0F1D2C] mt-1">{primary.treatment}</h3>
          </div>
          <div className="bg-[#C9A96E]/10 rounded-lg px-3 py-1">
            <span className="text-[#C9A96E] font-montserrat font-bold text-lg">{primary.fitScore}%</span>
            <span className="text-xs text-[#C9A96E]/70 block text-center">match</span>
          </div>
        </div>
        <p className="text-sm text-[#0F1D2C]/70 font-montserrat">{primary.reasoning}</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="w-4 h-4 text-[#C9A96E]" />
            <span className="font-montserrat text-[#0F1D2C]">${primary.price}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-[#C9A96E]" />
            <span className="font-montserrat text-[#0F1D2C]">{primary.downtime}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Zap className="w-4 h-4 text-[#C9A96E]" />
            <span className="font-montserrat text-[#0F1D2C] capitalize">{primary.painLevel} pain</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-[#C9A96E]" />
            <span className="font-montserrat text-[#0F1D2C]">{primary.sessions} session{primary.sessions > 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      {/* Timeline */}
      {plan.timeline.milestones.length > 0 && (
        <div className="p-6 border-b border-[#F8F6F1]">
          <h4 className="text-sm font-montserrat font-semibold text-[#0F1D2C] mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#C9A96E]" />
            Your Treatment Timeline
          </h4>
          <div className="space-y-3">
            {plan.timeline.milestones.map((m, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-[#C9A96E]" />
                  {i < plan.timeline.milestones.length - 1 && <div className="w-0.5 h-full bg-[#C9A96E]/20 mt-1" />}
                </div>
                <div className="pb-3">
                  <div className="text-xs font-montserrat text-[#C9A96E]">
                    {m.weekNumber === 0 ? 'Start' : `Week ${m.weekNumber}`}
                  </div>
                  <div className="text-sm font-montserrat font-medium text-[#0F1D2C]">{m.treatment}</div>
                  <div className="text-xs text-[#0F1D2C]/50 font-montserrat">{m.expectedOutcome}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Combinations */}
      {plan.combinations.length > 0 && (
        <div className="p-6 border-b border-[#F8F6F1]">
          <h4 className="text-sm font-montserrat font-semibold text-[#0F1D2C] mb-3">Power Combinations</h4>
          {plan.combinations.slice(0, 2).map((combo, i) => (
            <div key={i} className="bg-[#F8F6F1]/50 rounded-lg p-3 mb-2">
              <div className="font-montserrat font-medium text-sm text-[#0F1D2C]">{combo.name}</div>
              <p className="text-xs text-[#0F1D2C]/60 font-montserrat mt-1">{combo.synergy}</p>
              {combo.savingsVsSeparate > 0 && (
                <span className="text-xs text-green-600 font-montserrat mt-1 inline-block">
                  Save ${combo.savingsVsSeparate} vs. separate
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Contraindication warnings */}
      {plan.contraindications.length > 0 && (
        <div className="p-6 border-b border-[#F8F6F1]">
          <h4 className="text-sm font-montserrat font-semibold text-[#0F1D2C] mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-500" />
            Important Notes
          </h4>
          {plan.contraindications.map((c, i) => (
            <div key={i} className={`p-3 rounded-lg mb-2 text-sm font-montserrat ${
              c.severity === 'absolute' ? 'bg-red-50 text-red-700' :
              c.severity === 'relative' ? 'bg-amber-50 text-amber-700' :
              'bg-blue-50 text-blue-700'
            }`}>
              <strong>{c.medicalFactor}:</strong> {c.recommendation}
            </div>
          ))}
        </div>
      )}

      {/* Cost Summary */}
      <div className="p-6 bg-[#F8F6F1]/30">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-[#0F1D2C]/50 font-montserrat">Estimated Investment</div>
            <div className="text-2xl font-playfair font-bold text-[#0F1D2C]">
              ${plan.costEstimate.fullPlan.toLocaleString()}
            </div>
          </div>
          <div className="text-right text-sm font-montserrat text-[#0F1D2C]/60">
            <div>Annual maintenance: ${plan.costEstimate.annualMaintenance.toLocaleString()}</div>
            {plan.costEstimate.paymentOptions.find(p => p.type === 'financing') && (
              <div className="text-[#C9A96E]">
                From ${plan.costEstimate.paymentOptions.find(p => p.type === 'financing')?.perMonth}/mo financing
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
