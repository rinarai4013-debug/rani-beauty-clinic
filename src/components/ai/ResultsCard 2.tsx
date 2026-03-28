'use client';

import { motion } from 'framer-motion';
import type { TreatmentPlan, SkinAnalysis } from '@/types/ai-treatment';

interface ResultsCardProps {
  skinAnalysis: SkinAnalysis;
  treatmentPlan: TreatmentPlan;
  onBookConsultation: () => void;
}

export default function ResultsCard({ skinAnalysis, treatmentPlan, onBookConsultation }: ResultsCardProps) {
  const score = skinAnalysis.skinHealthScore.overall;
  const dims = skinAnalysis.skinHealthScore.dimensions;

  const scoreColor = score >= 70 ? 'text-green-600' : score >= 50 ? 'text-amber-600' : 'text-red-600';
  const scoreLabel = score >= 70 ? 'Excellent' : score >= 50 ? 'Good' : 'Needs Attention';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-lg border border-[#F8F6F1] overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0F1D2C] to-[#1a2d40] p-6 md:p-8 text-center">
        <h2 className="text-2xl md:text-3xl font-playfair text-white mb-2">Your Skin Analysis</h2>
        <p className="text-[#C9A96E] font-montserrat">Personalized for you by Rani Beauty Clinic</p>
      </div>

      {/* Skin Score */}
      <div className="p-6 md:p-8 text-center border-b border-[#F8F6F1]">
        <div className="inline-flex items-center justify-center w-28 h-28 rounded-full border-4 border-[#C9A96E] mb-4">
          <div>
            <div className={`text-4xl font-playfair font-bold ${scoreColor}`}>{score}</div>
            <div className="text-xs text-[#0F1D2C]/50 font-montserrat">/ 100</div>
          </div>
        </div>
        <h3 className={`text-xl font-montserrat font-semibold ${scoreColor}`}>{scoreLabel}</h3>
        <p className="text-sm text-[#0F1D2C]/60 mt-1 font-montserrat">
          {skinAnalysis.benchmarkComparison.percentile}th percentile for {skinAnalysis.benchmarkComparison.ageGroup}
        </p>
      </div>

      {/* Dimension Scores */}
      <div className="p-6 md:p-8 border-b border-[#F8F6F1]">
        <h3 className="text-lg font-playfair text-[#0F1D2C] mb-4">Skin Health Dimensions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(dims).map(([key, value]) => (
            <div key={key} className="text-center">
              <div className="text-2xl font-montserrat font-semibold text-[#0F1D2C]">{value}</div>
              <div className="text-xs text-[#0F1D2C]/50 font-montserrat capitalize">{key}</div>
              <div className="mt-1 h-1.5 bg-[#F8F6F1] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#C9A96E] rounded-full transition-all duration-500"
                  style={{ width: `${value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Recommendation */}
      <div className="p-6 md:p-8 border-b border-[#F8F6F1]">
        <h3 className="text-lg font-playfair text-[#0F1D2C] mb-3">Your #1 Recommended Treatment</h3>
        <div className="bg-[#C9A96E]/5 rounded-xl p-4 border border-[#C9A96E]/20">
          <div className="flex justify-between items-start mb-2">
            <h4 className="text-lg font-montserrat font-semibold text-[#0F1D2C]">{treatmentPlan.primary.treatment}</h4>
            <span className="bg-[#C9A96E] text-white text-xs font-montserrat px-2 py-1 rounded-full">
              {treatmentPlan.primary.fitScore}% match
            </span>
          </div>
          <p className="text-sm text-[#0F1D2C]/70 font-montserrat mb-3">{treatmentPlan.primary.reasoning}</p>
          <div className="grid grid-cols-3 gap-2 text-center text-xs font-montserrat">
            <div className="bg-white rounded-lg p-2">
              <div className="font-semibold text-[#0F1D2C]">${treatmentPlan.primary.price}</div>
              <div className="text-[#0F1D2C]/50">per session</div>
            </div>
            <div className="bg-white rounded-lg p-2">
              <div className="font-semibold text-[#0F1D2C]">{treatmentPlan.primary.downtime}</div>
              <div className="text-[#0F1D2C]/50">downtime</div>
            </div>
            <div className="bg-white rounded-lg p-2">
              <div className="font-semibold text-[#0F1D2C]">{treatmentPlan.primary.sessions}</div>
              <div className="text-[#0F1D2C]/50">session{treatmentPlan.primary.sessions > 1 ? 's' : ''}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Alternatives */}
      {treatmentPlan.alternatives.length > 0 && (
        <div className="p-6 md:p-8 border-b border-[#F8F6F1]">
          <h3 className="text-lg font-playfair text-[#0F1D2C] mb-3">Alternative Options</h3>
          <div className="space-y-3">
            {treatmentPlan.alternatives.slice(0, 3).map((alt, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-[#F8F6F1]/50 rounded-lg">
                <div>
                  <span className="font-montserrat font-medium text-[#0F1D2C] text-sm">{alt.treatment}</span>
                  <span className="text-xs text-[#0F1D2C]/50 ml-2">{alt.fitScore}% match</span>
                </div>
                <span className="text-sm font-montserrat text-[#0F1D2C]/70">${alt.price}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cost Estimate */}
      <div className="p-6 md:p-8 border-b border-[#F8F6F1]">
        <h3 className="text-lg font-playfair text-[#0F1D2C] mb-3">Investment Estimate</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xl font-montserrat font-bold text-[#0F1D2C]">${treatmentPlan.costEstimate.initialTreatment}</div>
            <div className="text-xs text-[#0F1D2C]/50 font-montserrat">Initial Plan</div>
          </div>
          <div>
            <div className="text-xl font-montserrat font-bold text-[#0F1D2C]">${treatmentPlan.costEstimate.fullPlan}</div>
            <div className="text-xs text-[#0F1D2C]/50 font-montserrat">Full Plan</div>
          </div>
          <div>
            <div className="text-xl font-montserrat font-bold text-[#0F1D2C]">${treatmentPlan.costEstimate.annualMaintenance}</div>
            <div className="text-xs text-[#0F1D2C]/50 font-montserrat">Annual Maint.</div>
          </div>
        </div>
        {treatmentPlan.costEstimate.paymentOptions.some(p => p.type === 'financing') && (
          <p className="text-center text-sm text-[#C9A96E] font-montserrat mt-3">
            Financing available from ${treatmentPlan.costEstimate.paymentOptions.find(p => p.type === 'financing')?.perMonth}/month
          </p>
        )}
      </div>

      {/* CTA */}
      <div className="p-6 md:p-8 text-center">
        <motion.button
          onClick={onBookConsultation}
          className="w-full md:w-auto px-10 py-4 bg-[#C9A96E] text-white font-montserrat font-semibold rounded-xl hover:bg-[#B08E5A] transition-colors text-lg"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Book Your Free Consultation
        </motion.button>
        <p className="text-xs text-[#0F1D2C]/40 font-montserrat mt-3">
          Your personalized treatment plan will be finalized during your consultation
        </p>
      </div>
    </motion.div>
  );
}
