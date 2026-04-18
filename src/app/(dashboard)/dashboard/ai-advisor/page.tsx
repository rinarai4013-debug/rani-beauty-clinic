'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles, User, Brain, Target, Shield, DollarSign,
  Clock, ChevronRight, AlertTriangle, MessageCircle,
} from 'lucide-react';
import { TreatmentPlanCard, ObjectionHandler, CopilotSuggestion, SkinScoreRadar, OutcomePrediction as OutcomePredictionComponent } from '@/components/ai';
import { DashboardErrorBoundary, PanelSkeleton } from '@/components/dashboard/shared';
import { useAIAdvisor } from '@/hooks/useAITreatmentData';
import type { SkinConcern, BudgetTier, PainTolerance, DowntimeAvailability, FitzpatrickType } from '@/types/ai-treatment';

const CONCERN_OPTIONS: Array<{ value: SkinConcern; label: string }> = [
  { value: 'wrinkles', label: 'Wrinkles & Fine Lines' },
  { value: 'volume_loss', label: 'Volume Loss' },
  { value: 'acne', label: 'Acne' },
  { value: 'scarring', label: 'Scarring' },
  { value: 'pigmentation', label: 'Pigmentation / Dark Spots' },
  { value: 'redness', label: 'Redness' },
  { value: 'texture', label: 'Skin Texture' },
  { value: 'pores', label: 'Large Pores' },
  { value: 'laxity', label: 'Skin Laxity / Sagging' },
  { value: 'double_chin', label: 'Double Chin' },
  { value: 'body_contouring', label: 'Body Contouring' },
  { value: 'hair_removal', label: 'Unwanted Hair' },
  { value: 'dark_circles', label: 'Dark Under-Eye Circles' },
  { value: 'lip_enhancement', label: 'Lip Enhancement' },
  { value: 'neck_chest_aging', label: 'Neck / Chest Aging' },
];

export default function AIAdvisorPage() {
  const [clientName, setClientName] = useState('');
  const [age, setAge] = useState(35);
  const [skinType, setSkinType] = useState<FitzpatrickType>(2);
  const [concerns, setConcerns] = useState<SkinConcern[]>([]);
  const [budget, setBudget] = useState<BudgetTier>('value');
  const [painTolerance, setPainTolerance] = useState<PainTolerance>('moderate');
  const [downtime, setDowntime] = useState<DowntimeAvailability>('minimal');
  const [pregnant, setPregnant] = useState(false);
  const [bloodThinners, setBloodThinners] = useState(false);
  const [autoimmune, setAutoimmune] = useState(false);

  const { data, isLoading, error, generate } = useAIAdvisor();

  const handleGenerate = useCallback(() => {
    if (concerns.length === 0 || !clientName) return;
    generate({
      name: clientName,
      age,
      gender: 'female',
      skinType,
      concerns,
      budget,
      painTolerance,
      downtimeAvailability: downtime,
      medicalHistory: {
        pregnant,
        breastfeeding: false,
        bloodThinners,
        autoimmune,
        keloidHistory: false,
        activeSkinInfection: false,
        recentSunExposure: false,
        isotretinoin: false,
        allergies: [],
        medications: [],
        conditions: [],
      },
    });
  }, [clientName, age, skinType, concerns, budget, painTolerance, downtime, pregnant, bloodThinners, autoimmune, generate]);

  const toggleConcern = (c: SkinConcern) => {
    setConcerns(prev =>
      prev.includes(c) ? prev.filter(x => x !== c) : prev.length < 5 ? [...prev, c] : prev
    );
  };

  return (
    <DashboardErrorBoundary>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-playfair text-[#0F1D2C] flex items-center gap-2">
              <Brain className="w-6 h-6 text-rani-gold-accessible" />
              AI Treatment Advisor
            </h1>
            <p className="text-sm text-[#0F1D2C]/60 font-montserrat mt-1">
              Generate personalized treatment plans during consultations
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Panel */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-xl border border-[#F8F6F1] p-5 space-y-4">
              <h3 className="font-montserrat font-semibold text-[#0F1D2C] flex items-center gap-2">
                <User className="w-4 h-4 text-rani-gold-accessible" />
                Client Profile
              </h3>

              <div>
                <label className="text-xs font-montserrat text-[#0F1D2C]/50 block mb-1">Client Name</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  className="w-full border border-[#F8F6F1] rounded-lg px-3 py-2 text-sm font-montserrat focus:border-[#C9A96E] focus:outline-none"
                  placeholder="Enter client name"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-montserrat text-[#0F1D2C]/50 block mb-1">Age</label>
                  <input
                    type="number"
                    value={age}
                    onChange={e => setAge(Number(e.target.value))}
                    className="w-full border border-[#F8F6F1] rounded-lg px-3 py-2 text-sm font-montserrat focus:border-[#C9A96E] focus:outline-none"
                    min={18} max={90}
                  />
                </div>
                <div>
                  <label className="text-xs font-montserrat text-[#0F1D2C]/50 block mb-1">Fitzpatrick Type</label>
                  <select
                    value={skinType}
                    onChange={e => setSkinType(Number(e.target.value) as FitzpatrickType)}
                    className="w-full border border-[#F8F6F1] rounded-lg px-3 py-2 text-sm font-montserrat focus:border-[#C9A96E] focus:outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6].map(t => (
                      <option key={t} value={t}>Type {t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-montserrat text-[#0F1D2C]/50 block mb-2">
                  Concerns (select up to 5)
                </label>
                <div className="flex flex-wrap gap-2">
                  {CONCERN_OPTIONS.map(c => (
                    <button
                      key={c.value}
                      onClick={() => toggleConcern(c.value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-montserrat transition-all ${
                        concerns.includes(c.value)
                          ? 'bg-[#C9A96E] text-white'
                          : 'bg-[#F8F6F1] text-[#0F1D2C]/60 hover:bg-[#C9A96E]/10'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-montserrat text-[#0F1D2C]/50 block mb-1">Budget</label>
                  <select
                    value={budget}
                    onChange={e => setBudget(e.target.value as BudgetTier)}
                    className="w-full border border-[#F8F6F1] rounded-lg px-2 py-2 text-xs font-montserrat focus:border-[#C9A96E] focus:outline-none"
                  >
                    <option value="essential">Essential</option>
                    <option value="value">Value</option>
                    <option value="luxury">Luxury</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-montserrat text-[#0F1D2C]/50 block mb-1">Pain</label>
                  <select
                    value={painTolerance}
                    onChange={e => setPainTolerance(e.target.value as PainTolerance)}
                    className="w-full border border-[#F8F6F1] rounded-lg px-2 py-2 text-xs font-montserrat focus:border-[#C9A96E] focus:outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="moderate">Moderate</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-montserrat text-[#0F1D2C]/50 block mb-1">Downtime</label>
                  <select
                    value={downtime}
                    onChange={e => setDowntime(e.target.value as DowntimeAvailability)}
                    className="w-full border border-[#F8F6F1] rounded-lg px-2 py-2 text-xs font-montserrat focus:border-[#C9A96E] focus:outline-none"
                  >
                    <option value="none">None</option>
                    <option value="minimal">Minimal</option>
                    <option value="moderate">Moderate</option>
                    <option value="flexible">Flexible</option>
                  </select>
                </div>
              </div>

              {/* Medical flags */}
              <div>
                <label className="text-xs font-montserrat text-[#0F1D2C]/50 block mb-2">
                  <Shield className="w-3 h-3 inline mr-1" /> Medical History
                </label>
                <div className="space-y-2">
                  {[
                    { label: 'Pregnant', value: pregnant, set: setPregnant },
                    { label: 'Blood Thinners', value: bloodThinners, set: setBloodThinners },
                    { label: 'Autoimmune', value: autoimmune, set: setAutoimmune },
                  ].map(item => (
                    <label key={item.label} className="flex items-center gap-2 text-sm font-montserrat text-[#0F1D2C]/70">
                      <input
                        type="checkbox"
                        checked={item.value}
                        onChange={e => item.set(e.target.checked)}
                        className="rounded border-[#C9A96E] text-rani-gold-accessible focus:ring-[#C9A96E]"
                      />
                      {item.label}
                    </label>
                  ))}
                </div>
              </div>

              <motion.button
                onClick={handleGenerate}
                disabled={concerns.length === 0 || !clientName || isLoading}
                className="w-full py-3 bg-[#0F1D2C] text-white font-montserrat font-semibold rounded-xl hover:bg-[#1a2d40] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <Sparkles className="w-4 h-4" />
                {isLoading ? 'Generating...' : 'Generate Treatment Plan'}
              </motion.button>
            </div>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-2 space-y-4">
            {isLoading && <PanelSkeleton />}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm font-montserrat">
                <AlertTriangle className="w-4 h-4 inline mr-2" />
                Failed to generate treatment plan. Please try again.
              </div>
            )}

            {data && !isLoading && (
              <>
                {data.skinAnalysis && (
                  <div className="bg-white rounded-xl border border-[#F8F6F1] p-5">
                    <h3 className="font-montserrat font-semibold text-[#0F1D2C] mb-4">Skin Health Score</h3>
                    <div className="flex items-center gap-6">
                      <SkinScoreRadar dimensions={data.skinAnalysis.skinHealthScore.dimensions} size={200} />
                      <div>
                        <div className="text-4xl font-playfair font-bold text-[#0F1D2C]">
                          {data.skinAnalysis.skinHealthScore.overall}
                        </div>
                        <div className="text-sm text-[#0F1D2C]/50 font-montserrat">/ 100</div>
                        <div className="text-sm text-rani-gold-accessible font-montserrat mt-2">
                          {data.skinAnalysis.benchmarkComparison.percentile}th percentile
                        </div>
                        <div className="text-xs text-[#0F1D2C]/40 font-montserrat">
                          vs. {data.skinAnalysis.benchmarkComparison.ageGroup}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {data.treatmentPlan && (
                  <TreatmentPlanCard plan={data.treatmentPlan} />
                )}

                {data.outcomePrediction && (
                  <OutcomePredictionComponent prediction={data.outcomePrediction} />
                )}

                {data.copilot && (
                  <>
                    <div className="bg-white rounded-xl border border-[#F8F6F1] p-5">
                      <h3 className="font-montserrat font-semibold text-[#0F1D2C] mb-4 flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-rani-gold-accessible" />
                        Consultation Copilot
                      </h3>
                      <CopilotSuggestion suggestions={data.copilot.suggestions} />
                    </div>

                    <div className="bg-white rounded-xl border border-[#F8F6F1] p-5">
                      <h3 className="font-montserrat font-semibold text-[#0F1D2C] mb-4">Objection Handlers</h3>
                      <ObjectionHandler handlers={data.copilot.objectionHandlers} />
                    </div>
                  </>
                )}
              </>
            )}

            {!data && !isLoading && !error && (
              <div className="bg-white rounded-xl border border-[#F8F6F1] p-12 text-center">
                <Brain className="w-12 h-12 text-rani-gold-accessible/30 mx-auto mb-4" />
                <h3 className="text-lg font-playfair text-[#0F1D2C] mb-2">Ready to Advise</h3>
                <p className="text-sm text-[#0F1D2C]/50 font-montserrat">
                  Fill in the client profile and click Generate to create a personalized treatment plan.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardErrorBoundary>
  );
}
