'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, AlertCircle, Clock, Star } from 'lucide-react';
import type { OutcomePrediction as OutcomePredictionType } from '@/types/ai-treatment';

interface OutcomePredictionProps {
  prediction: OutcomePredictionType;
}

export default function OutcomePrediction({ prediction }: OutcomePredictionProps) {
  const satisfactionColor = prediction.satisfactionLikelihood >= 8 ? 'text-green-600' : prediction.satisfactionLikelihood >= 6 ? 'text-amber-600' : 'text-red-600';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-md border border-[#F8F6F1] overflow-hidden"
    >
      <div className="p-6 border-b border-[#F8F6F1]">
        <h3 className="text-lg font-playfair text-[#0F1D2C] mb-1">Outcome Prediction</h3>
        <p className="text-sm text-[#0F1D2C]/50 font-montserrat">{prediction.treatmentName}</p>
      </div>

      {/* Satisfaction & Key Metrics */}
      <div className="p-6 grid grid-cols-3 gap-4 border-b border-[#F8F6F1]">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Star className="w-4 h-4 text-rani-gold-accessible" />
            <span className={`text-2xl font-montserrat font-bold ${satisfactionColor}`}>
              {prediction.satisfactionLikelihood}
            </span>
            <span className="text-sm text-[#0F1D2C]/40">/10</span>
          </div>
          <div className="text-xs text-[#0F1D2C]/50 font-montserrat">Satisfaction</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-montserrat font-bold text-[#0F1D2C] mb-1">
            {prediction.sessionsNeeded.recommended}
          </div>
          <div className="text-xs text-[#0F1D2C]/50 font-montserrat">Sessions</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-montserrat font-bold text-[#0F1D2C] mb-1">
            ${prediction.totalCostProjection.toLocaleString()}
          </div>
          <div className="text-xs text-[#0F1D2C]/50 font-montserrat">Total Cost</div>
        </div>
      </div>

      {/* Duration */}
      <div className="p-6 border-b border-[#F8F6F1]">
        <h4 className="text-sm font-montserrat font-semibold text-[#0F1D2C] mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-rani-gold-accessible" />
          Results Duration
        </h4>
        <div className="grid grid-cols-3 gap-3 text-center text-sm font-montserrat">
          <div className="bg-[#F8F6F1]/50 rounded-lg p-2">
            <div className="text-[#0F1D2C]/50 text-xs">Minimum</div>
            <div className="font-medium text-[#0F1D2C]">{prediction.resultsDuration.minimum}</div>
          </div>
          <div className="bg-[#C9A96E]/5 rounded-lg p-2 border border-[#C9A96E]/20">
            <div className="text-rani-gold-accessible text-xs">Typical</div>
            <div className="font-semibold text-[#0F1D2C]">{prediction.resultsDuration.typical}</div>
          </div>
          <div className="bg-[#F8F6F1]/50 rounded-lg p-2">
            <div className="text-[#0F1D2C]/50 text-xs">Maximum</div>
            <div className="font-medium text-[#0F1D2C]">{prediction.resultsDuration.maximum}</div>
          </div>
        </div>
      </div>

      {/* Side Effects */}
      <div className="p-6 border-b border-[#F8F6F1]">
        <h4 className="text-sm font-montserrat font-semibold text-[#0F1D2C] mb-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rani-gold-accessible" />
          Possible Side Effects
        </h4>
        <div className="space-y-2">
          {prediction.sideEffects.map((se, i) => (
            <div key={i} className="flex items-center justify-between text-sm font-montserrat">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  se.severity === 'mild' ? 'bg-green-400' :
                  se.severity === 'moderate' ? 'bg-amber-400' : 'bg-red-400'
                }`} />
                <span className="text-[#0F1D2C]/70">{se.effect}</span>
              </div>
              <span className="text-[#0F1D2C]/40 text-xs">{se.probability}% likelihood</span>
            </div>
          ))}
        </div>
      </div>

      {/* Outcome Factors */}
      <div className="p-6 border-b border-[#F8F6F1]">
        <h4 className="text-sm font-montserrat font-semibold text-[#0F1D2C] mb-3">Factors Affecting Your Results</h4>
        <div className="space-y-2">
          {prediction.outcomeFactors.map((f, i) => (
            <div key={i} className="flex items-start gap-2 text-sm font-montserrat">
              {f.impact === 'improves' ? (
                <TrendingUp className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              ) : f.impact === 'reduces' ? (
                <TrendingDown className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              ) : (
                <Minus className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              )}
              <div>
                <span className="font-medium text-[#0F1D2C]">{f.factor}</span>
                <p className="text-xs text-[#0F1D2C]/50">{f.recommendation}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Expectations */}
      <div className="p-6 bg-[#F8F6F1]/30">
        <h4 className="text-sm font-montserrat font-semibold text-[#0F1D2C] mb-2">Realistic Expectations</h4>
        <p className="text-sm font-montserrat text-[#0F1D2C]/70">{prediction.expectationCalibration.realisticOutcome}</p>
      </div>
    </motion.div>
  );
}
