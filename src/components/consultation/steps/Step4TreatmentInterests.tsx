'use client';

import { motion } from 'framer-motion';
import {
  Sparkles,
  Zap,
  Target,
  TrendingUp,
  Droplets,
  Sun,
  Heart,
  Activity,
  Palette,
} from 'lucide-react';
import { SERVICE_CATEGORIES } from '@/data/services/unified-catalog';
import type { LucideIcon } from 'lucide-react';

interface StepProps {
  formData: Record<string, any>;
  onUpdate: (field: string, value: any) => void;
  errors: Record<string, string>;
}

// Map icon name strings from SERVICE_CATEGORIES to actual Lucide components
const ICON_MAP: Record<string, LucideIcon> = {
  Sparkles,
  Zap,
  Target,
  TrendingUp,
  Droplets,
  Sun,
  Heart,
  Activity,
  Palette,
};

// Categories to display in the wizard (subset from SERVICE_CATEGORIES)
const WIZARD_CATEGORY_IDS = [
  'facial',
  'laser-hair-removal',
  'rf-microneedling',
  'skin-tightening',
  'chemical-peel',
  'laser',
  'wellness',
  'weight-management',
  'skincare',
];

// Brief descriptions for each category
const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  facial: 'HydraFacials, express facials, and advanced skin treatments',
  'laser-hair-removal': 'Permanent hair reduction for face and body',
  'rf-microneedling': 'Collagen-boosting skin renewal with radiofrequency',
  'skin-tightening': 'Non-invasive lifting and firming with Sofwave',
  'chemical-peel': 'Medical-grade peels for radiant, renewed skin',
  laser: 'Targeted laser treatments for pigment, acne, and more',
  wellness: 'Vitamin and wellness injection treatments',
  'weight-management': 'GLP-1 weight loss programs with medical oversight',
  skincare: 'Prescription-grade skincare for at-home results',
};

export default function Step4TreatmentInterests({
  formData,
  onUpdate,
  errors,
}: StepProps) {
  const selectedTreatments: string[] = formData.treatmentInterests || [];

  const toggleTreatment = (id: string) => {
    const updated = selectedTreatments.includes(id)
      ? selectedTreatments.filter((t) => t !== id)
      : [...selectedTreatments, id];
    onUpdate('treatmentInterests', updated);
  };

  // Filter SERVICE_CATEGORIES to only wizard-relevant ones, preserving order
  const categories = WIZARD_CATEGORY_IDS.map((id) =>
    SERVICE_CATEGORIES.find((cat) => cat.id === id)
  ).filter(Boolean) as typeof SERVICE_CATEGORIES;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="px-4 py-8 md:py-12 max-w-3xl mx-auto"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="font-heading text-2xl md:text-3xl text-[#0F1D2C] mb-2"
        >
          What treatments interest you?
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="font-body text-sm text-[#0F1D2C]/60"
        >
          Select all that appeal to you &mdash; we&apos;ll recommend the best
          combination
        </motion.p>
      </div>

      {errors.treatmentInterests && (
        <p className="font-body text-xs text-red-500 text-center mb-4">
          {errors.treatmentInterests}
        </p>
      )}

      {/* Category Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category, index) => {
          const selected = selectedTreatments.includes(category.id);
          const Icon = ICON_MAP[category.icon] || Sparkles;
          const description = CATEGORY_DESCRIPTIONS[category.id] || '';

          return (
            <motion.button
              key={category.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + index * 0.05, duration: 0.4 }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => toggleTreatment(category.id)}
              className={`
                relative flex flex-col items-start gap-3 p-5 rounded-2xl border-2 text-left transition-all duration-200 cursor-pointer
                ${
                  selected
                    ? 'border-[#C9A96E] bg-[#C9A96E]/5 shadow-md shadow-[#C9A96E]/10'
                    : 'border-[#0F1D2C]/8 bg-white hover:border-[#C9A96E]/40 hover:bg-[#F8F6F1] hover:shadow-sm'
                }
              `}
            >
              {/* Selection indicator */}
              {selected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#C9A96E] flex items-center justify-center"
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

              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                  selected
                    ? 'bg-[#C9A96E]/15 text-rani-gold-accessible'
                    : 'bg-[#0F1D2C]/5 text-[#0F1D2C]/50'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>

              <div className="pr-6">
                <h3
                  className={`font-body text-sm font-semibold mb-1 ${
                    selected ? 'text-[#0F1D2C]' : 'text-[#0F1D2C]/80'
                  }`}
                >
                  {category.label}
                </h3>
                <p
                  className={`font-body text-xs leading-relaxed ${
                    selected ? 'text-[#0F1D2C]/60' : 'text-[#0F1D2C]/40'
                  }`}
                >
                  {description}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Selected count */}
      {selectedTreatments.length > 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="font-body text-xs text-rani-gold-accessible text-center mt-6"
        >
          {selectedTreatments.length} treatment
          {selectedTreatments.length !== 1 ? 's' : ''} selected &mdash;
          we&apos;ll create your personalized plan
        </motion.p>
      )}
    </motion.div>
  );
}
