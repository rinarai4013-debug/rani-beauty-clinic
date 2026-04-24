'use client';

import { motion } from 'framer-motion';
import {
  Flame,
  Clock,
  Sun,
  TrendingDown,
  Scissors,
  Palette,
  Activity,
  Circle,
} from 'lucide-react';
import FaceMapPicker from '../FaceMapPicker';

interface StepProps {
  formData: Record<string, any>;
  onUpdate: (_field: string, _value: any) => void;
  errors: Record<string, string>;
}

const CONCERN_OPTIONS = [
  { id: 'acne', label: 'Acne & Breakouts', icon: Flame },
  { id: 'aging', label: 'Aging & Fine Lines', icon: Clock },
  { id: 'pigmentation', label: 'Dark Spots & Pigmentation', icon: Sun },
  { id: 'laxity', label: 'Skin Laxity & Sagging', icon: TrendingDown },
  { id: 'unwanted-hair', label: 'Unwanted Hair', icon: Scissors },
  { id: 'dull-skin', label: 'Dull Skin & Texture', icon: Palette },
  { id: 'body-contouring', label: 'Body Contouring', icon: Activity },
  { id: 'sun-damage', label: 'Sun Damage', icon: Sun },
  { id: 'large-pores', label: 'Large Pores', icon: Circle },
];

export default function Step3SkinConcerns({
  formData,
  onUpdate,
  errors,
}: StepProps) {
  const selectedConcerns: string[] = formData.skinConcerns || [];
  const selectedAreas: string[] = formData.targetAreas || [];

  const toggleConcern = (id: string) => {
    const updated = selectedConcerns.includes(id)
      ? selectedConcerns.filter((c) => c !== id)
      : [...selectedConcerns, id];
    onUpdate('skinConcerns', updated);
  };

  const toggleArea = (area: string) => {
    const updated = selectedAreas.includes(area)
      ? selectedAreas.filter((a) => a !== area)
      : [...selectedAreas, area];
    onUpdate('targetAreas', updated);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="px-4 py-8 md:py-12 max-w-3xl mx-auto"
    >
      {/* Section 1: Concerns */}
      <div className="mb-12">
        <div className="text-center mb-8">
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="font-heading text-2xl md:text-3xl text-[#0F1D2C] mb-2"
          >
            What are your top skin concerns?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="font-body text-sm text-[#0F1D2C]/60"
          >
            Select all that apply &mdash; this helps us build your custom plan
          </motion.p>
        </div>

        {errors.skinConcerns && (
          <p className="font-body text-xs text-red-500 text-center mb-4">
            {errors.skinConcerns}
          </p>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {CONCERN_OPTIONS.map((concern, index) => {
            const selected = selectedConcerns.includes(concern.id);
            const Icon = concern.icon;

            return (
              <motion.button
                key={concern.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + index * 0.04, duration: 0.4 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => toggleConcern(concern.id)}
                className={`
                  relative flex flex-col items-center gap-2.5 p-5 rounded-2xl border-2 transition-all duration-200 cursor-pointer
                  ${
                    selected
                      ? 'border-[#C9A96E] bg-[#C9A96E]/5 shadow-sm'
                      : 'border-[#0F1D2C]/8 bg-white hover:border-[#C9A96E]/40 hover:bg-[#F8F6F1]'
                  }
                `}
              >
                {/* Selection indicator */}
                {selected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-[#C9A96E] flex items-center justify-center"
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
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    selected
                      ? 'bg-[#C9A96E]/15 text-[#C9A96E]'
                      : 'bg-[#0F1D2C]/5 text-[#0F1D2C]/50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span
                  className={`font-body text-xs md:text-sm font-medium text-center leading-tight ${
                    selected ? 'text-[#0F1D2C]' : 'text-[#0F1D2C]/70'
                  }`}
                >
                  {concern.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-4 mb-12">
        <div className="flex-1 h-px bg-[#C9A96E]/15" />
        <span className="font-body text-xs text-[#0F1D2C]/30 uppercase tracking-wider">
          and
        </span>
        <div className="flex-1 h-px bg-[#C9A96E]/15" />
      </div>

      {/* Section 2: Face Map */}
      <div>
        <div className="text-center mb-6">
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="font-heading text-2xl md:text-3xl text-[#0F1D2C] mb-2"
          >
            Where would you like to focus?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="font-body text-sm text-[#0F1D2C]/60"
          >
            Tap the areas on the face you&apos;d like to treat
          </motion.p>
        </div>

        {errors.targetAreas && (
          <p className="font-body text-xs text-red-500 text-center mb-4">
            {errors.targetAreas}
          </p>
        )}

        <FaceMapPicker selectedAreas={selectedAreas} onToggle={toggleArea} />
      </div>
    </motion.div>
  );
}
