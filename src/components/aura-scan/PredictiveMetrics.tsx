'use client';

import { motion } from 'framer-motion';
import type { PredictiveMetrics as PredictiveMetricsType } from '@/types/mastermind';

interface PredictiveMetricsProps {
  metrics: PredictiveMetricsType;
  currentScore: number;
}

export default function PredictiveMetrics({
  metrics,
  currentScore,
}: PredictiveMetricsProps) {
  const withTx = metrics.withTreatment;
  const withoutTx = metrics.withoutIntervention;

  return (
    <div className="space-y-5">
      <h3 className="font-heading text-lg text-[#0F1D2C]">
        Your Skin&apos;s Two Futures
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* WITH Treatment */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="p-5 rounded-2xl border-2 border-[#059669]/30 bg-gradient-to-br from-[#059669]/5 to-transparent"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-[#059669]/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-[#059669]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.281m5.94 2.28l-2.28 5.941" />
              </svg>
            </div>
            <h4 className="font-body text-sm font-semibold text-[#059669]">
              With Your Treatment Plan
            </h4>
          </div>

          <div className="space-y-3">
            {[
              { label: '3 months', data: withTx.threeMonths },
              { label: '6 months', data: withTx.sixMonths },
              { label: '1 year', data: withTx.oneYear },
            ].map((point, i) => (
              <div key={point.label} className="flex items-center justify-between">
                <span className="font-body text-xs text-[#0F1D2C]/60">{point.label}</span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <span className="font-body text-xs text-[#0F1D2C]/40">Score:</span>
                    <span className="font-body text-sm font-bold text-[#059669]">
                      {point.data.auraScore}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-body text-xs text-[#0F1D2C]/40">Skin Age:</span>
                    <span className="font-body text-sm font-bold text-[#059669]">
                      {point.data.skinAge}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 rounded-xl bg-[#059669]/10">
            <p className="font-body text-xs text-[#059669] font-medium text-center">
              Projected improvement: {currentScore} → {withTx.oneYear.auraScore}
              <span className="ml-1 font-bold">
                (+{withTx.oneYear.auraScore - currentScore} points)
              </span>
            </p>
          </div>
        </motion.div>

        {/* WITHOUT Treatment */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="p-5 rounded-2xl border-2 border-[#DC2626]/20 bg-gradient-to-br from-[#DC2626]/5 to-transparent"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-[#DC2626]/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-[#DC2626]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 014.306 6.43l.776 2.898m0 0l3.182-5.511m-3.182 5.51l-5.511-3.181" />
              </svg>
            </div>
            <h4 className="font-body text-sm font-semibold text-[#DC2626]">
              Without Treatment
            </h4>
          </div>

          <div className="space-y-3">
            {[
              { label: '6 months', data: withoutTx.sixMonths },
              { label: '1 year', data: withoutTx.oneYear },
              { label: '3 years', data: withoutTx.threeYears },
            ].map((point) => (
              <div key={point.label} className="flex items-center justify-between">
                <span className="font-body text-xs text-[#0F1D2C]/60">{point.label}</span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <span className="font-body text-xs text-[#0F1D2C]/40">Score:</span>
                    <span className="font-body text-sm font-bold text-[#DC2626]">
                      {point.data.auraScore}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-body text-xs text-[#0F1D2C]/40">Skin Age:</span>
                    <span className="font-body text-sm font-bold text-[#DC2626]">
                      {point.data.skinAge}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 rounded-xl bg-[#DC2626]/10">
            <p className="font-body text-xs text-[#DC2626] font-medium text-center">
              Projected decline: {currentScore} → {withoutTx.threeYears.auraScore}
              <span className="ml-1 font-bold">
                ({withoutTx.threeYears.auraScore - currentScore} points)
              </span>
            </p>
          </div>
        </motion.div>
      </div>

      {/* Risk Factors */}
      {metrics.riskFactors.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-body text-sm font-semibold text-[#0F1D2C]">Risk Factors</h4>
          <div className="flex flex-wrap gap-2">
            {metrics.riskFactors.map((risk) => (
              <div
                key={risk.factor}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#F8F6F1] border border-[#E8E4DF]"
              >
                <div className={`w-2 h-2 rounded-full ${risk.impact === 'high' ? 'bg-red-500' : risk.impact === 'medium' ? 'bg-amber-500' : 'bg-green-500'}`} />
                <div>
                  <span className="font-body text-xs font-medium text-[#0F1D2C]">{risk.factor}</span>
                  <span className="font-body text-xs text-[#0F1D2C]/40 ml-2">{risk.description}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
