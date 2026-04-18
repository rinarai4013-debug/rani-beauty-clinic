'use client';

import { motion } from 'framer-motion';
import {
  Droplets,
  Sun,
  CloudRain,
  Layers,
  Feather,
} from 'lucide-react';
import type { ReactNode } from 'react';

interface StepProps {
  formData: Record<string, any>;
  onUpdate: (field: string, value: any) => void;
  errors: Record<string, string>;
}

interface SkinTypeOption {
  id: string;
  label: string;
  description: string;
  icon: ReactNode;
}

const SKIN_TYPES: SkinTypeOption[] = [
  {
    id: 'normal',
    label: 'Normal',
    description: 'Balanced, few imperfections, barely visible pores',
    icon: <Sun className="w-6 h-6" />,
  },
  {
    id: 'dry',
    label: 'Dry',
    description: 'Tight, rough patches, flaking, less elasticity',
    icon: <CloudRain className="w-6 h-6" />,
  },
  {
    id: 'oily',
    label: 'Oily',
    description: 'Enlarged pores, shine, prone to breakouts',
    icon: <Droplets className="w-6 h-6" />,
  },
  {
    id: 'combination',
    label: 'Combination',
    description: 'Oily T-zone with dry or normal cheeks',
    icon: <Layers className="w-6 h-6" />,
  },
  {
    id: 'sensitive',
    label: 'Sensitive',
    description: 'Easily irritated, redness, reacts to products',
    icon: <Feather className="w-6 h-6" />,
  },
];

export default function Step5SkinHistory({
  formData,
  onUpdate,
  errors,
}: StepProps) {
  const selectedSkinType = formData.skinType || '';
  const showWeightFields = (formData.treatmentInterests || []).includes(
    'weight-management'
  );

  return (
    <div className="space-y-8">
      {/* Heading */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <h2 className="font-heading text-2xl md:text-3xl text-[#0F1D2C] mb-2">
          Tell Us About Your Skin Journey
        </h2>
        <p className="font-body text-sm text-[#0F1D2C]/60">
          Understanding your skin helps us craft the perfect treatment plan
        </p>
      </motion.div>

      {/* Skin Type Selector */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="space-y-3"
      >
        <label className="font-body text-sm font-medium text-[#0F1D2C]">
          What best describes your skin type?
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {SKIN_TYPES.map((type, i) => {
            const isActive = selectedSkinType === type.id;
            return (
              <motion.button
                key={type.id}
                type="button"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.05, duration: 0.35 }}
                onClick={() => onUpdate('skinType', type.id)}
                className={`
                  relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-300 cursor-pointer text-center
                  ${
                    isActive
                      ? 'border-[#C9A96E] bg-[#C9A96E]/5 shadow-md'
                      : 'border-[#0F1D2C]/10 bg-white hover:border-[#C9A96E]/40 hover:shadow-sm'
                  }
                `}
              >
                <div
                  className={`transition-colors duration-300 ${
                    isActive ? 'text-rani-gold-accessible' : 'text-[#0F1D2C]/40'
                  }`}
                >
                  {type.icon}
                </div>
                <span
                  className={`font-body text-sm font-semibold transition-colors duration-300 ${
                    isActive ? 'text-[#0F1D2C]' : 'text-[#0F1D2C]/70'
                  }`}
                >
                  {type.label}
                </span>
                <span className="font-body text-xs text-[#0F1D2C]/50 leading-tight">
                  {type.description}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="skinTypeIndicator"
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#C9A96E] flex items-center justify-center"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>
        {errors.skinType && (
          <p className="font-body text-xs text-red-500 mt-1">
            {errors.skinType}
          </p>
        )}
      </motion.div>

      {/* Previous Treatments */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="flex flex-col gap-1.5"
      >
        <label
          htmlFor="previousTreatments"
          className="font-body text-sm font-medium text-[#0F1D2C]"
        >
          Previous Treatments
        </label>
        <textarea
          id="previousTreatments"
          rows={3}
          placeholder="Have you had any professional skin treatments before? If so, what and when?"
          value={formData.previousTreatments || ''}
          onChange={(e) => onUpdate('previousTreatments', e.target.value)}
          className={`
            w-full px-4 py-3 rounded-xl bg-[#F8F6F1] border font-body text-sm text-[#0F1D2C]
            placeholder:text-[#0F1D2C]/30 transition-all duration-200 outline-none resize-none
            ${
              errors.previousTreatments
                ? 'border-red-400 focus:ring-2 focus:ring-red-200'
                : 'border-[#C9A96E]/20 focus:border-[#C9A96E] focus:ring-2 focus:ring-[#C9A96E]/20'
            }
          `}
        />
        {errors.previousTreatments && (
          <p className="font-body text-xs text-red-500">
            {errors.previousTreatments}
          </p>
        )}
      </motion.div>

      {/* Current Skincare Routine */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="flex flex-col gap-1.5"
      >
        <label
          htmlFor="skincareRoutine"
          className="font-body text-sm font-medium text-[#0F1D2C]"
        >
          Current Skincare Routine
        </label>
        <textarea
          id="skincareRoutine"
          rows={3}
          placeholder="What does your daily skincare routine look like?"
          value={formData.skincareRoutine || ''}
          onChange={(e) => onUpdate('skincareRoutine', e.target.value)}
          className={`
            w-full px-4 py-3 rounded-xl bg-[#F8F6F1] border font-body text-sm text-[#0F1D2C]
            placeholder:text-[#0F1D2C]/30 transition-all duration-200 outline-none resize-none
            ${
              errors.skincareRoutine
                ? 'border-red-400 focus:ring-2 focus:ring-red-200'
                : 'border-[#C9A96E]/20 focus:border-[#C9A96E] focus:ring-2 focus:ring-[#C9A96E]/20'
            }
          `}
        />
        {errors.skincareRoutine && (
          <p className="font-body text-xs text-red-500">
            {errors.skincareRoutine}
          </p>
        )}
      </motion.div>

      {/* Allergies or Sensitivities */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        className="flex flex-col gap-1.5"
      >
        <label
          htmlFor="allergies"
          className="font-body text-sm font-medium text-[#0F1D2C]"
        >
          Allergies or Sensitivities
        </label>
        <textarea
          id="allergies"
          rows={2}
          placeholder="Any allergies, sensitivities, or medications we should know about?"
          value={formData.allergies || ''}
          onChange={(e) => onUpdate('allergies', e.target.value)}
          className={`
            w-full px-4 py-3 rounded-xl bg-[#F8F6F1] border font-body text-sm text-[#0F1D2C]
            placeholder:text-[#0F1D2C]/30 transition-all duration-200 outline-none resize-none
            ${
              errors.allergies
                ? 'border-red-400 focus:ring-2 focus:ring-red-200'
                : 'border-[#C9A96E]/20 focus:border-[#C9A96E] focus:ring-2 focus:ring-[#C9A96E]/20'
            }
          `}
        />
        {errors.allergies && (
          <p className="font-body text-xs text-red-500">{errors.allergies}</p>
        )}
      </motion.div>

      {/* Conditional Weight Management Fields */}
      {showWeightFields && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-4 p-5 rounded-2xl border border-[#C9A96E]/20 bg-[#C9A96E]/5"
        >
          <p className="font-body text-sm font-medium text-[#0F1D2C]">
            Since you&apos;re interested in weight management, we need a bit
            more information:
          </p>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="currentMedications"
              className="font-body text-sm font-medium text-[#0F1D2C]"
            >
              Current Medications
            </label>
            <input
              id="currentMedications"
              type="text"
              placeholder="List any current medications"
              value={formData.currentMedications || ''}
              onChange={(e) =>
                onUpdate('currentMedications', e.target.value)
              }
              className={`
                w-full px-4 py-3 rounded-xl bg-white border font-body text-sm text-[#0F1D2C]
                placeholder:text-[#0F1D2C]/30 transition-all duration-200 outline-none
                ${
                  errors.currentMedications
                    ? 'border-red-400 focus:ring-2 focus:ring-red-200'
                    : 'border-[#C9A96E]/20 focus:border-[#C9A96E] focus:ring-2 focus:ring-[#C9A96E]/20'
                }
              `}
            />
            {errors.currentMedications && (
              <p className="font-body text-xs text-red-500">
                {errors.currentMedications}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="medicalConditions"
              className="font-body text-sm font-medium text-[#0F1D2C]"
            >
              Medical Conditions
            </label>
            <input
              id="medicalConditions"
              type="text"
              placeholder="Any medical conditions relevant to weight management"
              value={formData.medicalConditions || ''}
              onChange={(e) =>
                onUpdate('medicalConditions', e.target.value)
              }
              className={`
                w-full px-4 py-3 rounded-xl bg-white border font-body text-sm text-[#0F1D2C]
                placeholder:text-[#0F1D2C]/30 transition-all duration-200 outline-none
                ${
                  errors.medicalConditions
                    ? 'border-red-400 focus:ring-2 focus:ring-red-200'
                    : 'border-[#C9A96E]/20 focus:border-[#C9A96E] focus:ring-2 focus:ring-[#C9A96E]/20'
                }
              `}
            />
            {errors.medicalConditions && (
              <p className="font-body text-xs text-red-500">
                {errors.medicalConditions}
              </p>
            )}
          </div>
        </motion.div>
      )}

      {/* Medical History Section */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="space-y-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-[#C9A96E]/10 flex items-center justify-center">
            <svg className="w-4 h-4 text-rani-gold-accessible" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h3 className="font-body text-sm font-semibold text-[#0F1D2C]">
              Medical History
            </h3>
            <p className="font-body text-xs text-[#0F1D2C]/50">
              Helps us ensure your safety and recommend the best treatments
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {MEDICAL_FLAGS.map((flag) => (
            <button
              key={flag.id}
              type="button"
              onClick={() => onUpdate(flag.id, !formData[flag.id])}
              className={`
                flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all duration-200
                ${
                  formData[flag.id]
                    ? 'border-[#C9A96E] bg-[#C9A96E]/5'
                    : 'border-[#0F1D2C]/10 bg-white hover:border-[#C9A96E]/30'
                }
              `}
            >
              <div
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors
                  ${formData[flag.id] ? 'border-[#C9A96E] bg-[#C9A96E]' : 'border-[#0F1D2C]/20'}
                `}
              >
                {formData[flag.id] && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <div>
                <span className="font-body text-sm text-[#0F1D2C]">{flag.label}</span>
                {flag.note && (
                  <span className="font-body text-xs text-[#0F1D2C]/40 block">{flag.note}</span>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Isotretinoin End Date (conditional) */}
        {formData.isotretinoinHistory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="flex flex-col gap-1.5 pl-4 border-l-2 border-[#C9A96E]/30"
          >
            <label htmlFor="isotretinoinEndDate" className="font-body text-sm font-medium text-[#0F1D2C]">
              When did you stop taking isotretinoin?
            </label>
            <input
              id="isotretinoinEndDate"
              type="date"
              value={formData.isotretinoinEndDate || ''}
              onChange={(e) => onUpdate('isotretinoinEndDate', e.target.value)}
              className="w-full max-w-xs px-4 py-3 rounded-xl bg-[#F8F6F1] border border-[#C9A96E]/20 font-body text-sm text-[#0F1D2C] outline-none focus:border-[#C9A96E] focus:ring-2 focus:ring-[#C9A96E]/20"
            />
          </motion.div>
        )}

        {/* Smoking Status */}
        <div className="flex flex-col gap-1.5">
          <label className="font-body text-sm font-medium text-[#0F1D2C]">
            Smoking Status
          </label>
          <div className="flex gap-2">
            {(['never', 'former', 'current'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => onUpdate('smokingStatus', status)}
                className={`
                  px-4 py-2 rounded-xl border font-body text-sm transition-all duration-200
                  ${
                    formData.smokingStatus === status
                      ? 'border-[#C9A96E] bg-[#C9A96E]/10 text-[#0F1D2C] font-medium'
                      : 'border-[#0F1D2C]/10 text-[#0F1D2C]/60 hover:border-[#C9A96E]/30'
                  }
                `}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Sun Protection */}
        <div className="flex flex-col gap-1.5">
          <label className="font-body text-sm font-medium text-[#0F1D2C]">
            How often do you wear sunscreen?
          </label>
          <div className="flex flex-wrap gap-2">
            {([
              { value: 'never', label: 'Never' },
              { value: 'sometimes', label: 'Sometimes' },
              { value: 'usually', label: 'Usually' },
              { value: 'always', label: 'Always' },
            ] as const).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onUpdate('sunProtectionHabit', option.value)}
                className={`
                  px-4 py-2 rounded-xl border font-body text-sm transition-all duration-200
                  ${
                    formData.sunProtectionHabit === option.value
                      ? 'border-[#C9A96E] bg-[#C9A96E]/10 text-[#0F1D2C] font-medium'
                      : 'border-[#0F1D2C]/10 text-[#0F1D2C]/60 hover:border-[#C9A96E]/30'
                  }
                `}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ── Medical Flag Definitions ──

const MEDICAL_FLAGS = [
  { id: 'pregnant', label: 'Pregnant', note: undefined },
  { id: 'breastfeeding', label: 'Breastfeeding', note: undefined },
  { id: 'bloodThinners', label: 'On Blood Thinners', note: 'e.g. Warfarin, Aspirin' },
  { id: 'keloidHistory', label: 'Keloid Scarring History', note: undefined },
  { id: 'activeSkinInfection', label: 'Active Skin Infection', note: 'e.g. cold sore, eczema flare' },
  { id: 'recentSunExposure', label: 'Recent Sun Exposure', note: 'Significant exposure in last 2 weeks' },
  { id: 'isotretinoinHistory', label: 'Isotretinoin (Accutane)', note: 'Current or recent use' },
  { id: 'hasAutoimmune', label: 'Autoimmune Condition', note: 'e.g. Lupus, Psoriasis' },
] as const;
