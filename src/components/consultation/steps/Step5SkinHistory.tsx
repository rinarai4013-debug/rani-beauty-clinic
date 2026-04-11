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
                    isActive ? 'text-[#C9A96E]' : 'text-[#0F1D2C]/40'
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
    </div>
  );
}
