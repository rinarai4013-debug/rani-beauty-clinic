'use client';

import React from 'react';
import { TREATMENT_PRESETS } from '@/lib/photo-simulation/filter-presets';
import { Check } from 'lucide-react';

interface TreatmentEffectSelectorProps {
  selectedPresets: string[];
  onToggle: (preset: string) => void;
  intensity: number; // 0-1
  onIntensityChange: (v: number) => void;
}

export default function TreatmentEffectSelector({
  selectedPresets,
  onToggle,
  intensity,
  onIntensityChange,
}: TreatmentEffectSelectorProps) {
  const presetEntries = Object.entries(TREATMENT_PRESETS);

  return (
    <div className="space-y-5">
      {/* Treatment preset cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {presetEntries.map(([key, preset]) => {
          const isActive = selectedPresets.includes(key);
          return (
            <button
              key={key}
              onClick={() => onToggle(key)}
              className={`
                relative flex items-start gap-3 rounded-xl p-4 text-left
                transition-all duration-200 border
                ${
                  isActive
                    ? 'border-[#C9A96E] bg-[#C9A96E]/5 shadow-sm'
                    : 'border-[#0F1D2C]/10 bg-white hover:border-[#C9A96E]/40 hover:bg-[#F8F6F1]/50'
                }
              `}
            >
              {/* Checkbox */}
              <div
                className={`
                  flex-shrink-0 mt-0.5 h-5 w-5 rounded-md flex items-center justify-center
                  transition-colors border
                  ${
                    isActive
                      ? 'bg-[#C9A96E] border-[#C9A96E]'
                      : 'bg-white border-[#0F1D2C]/20'
                  }
                `}
              >
                {isActive && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
              </div>

              {/* Label + description */}
              <div className="min-w-0">
                <p
                  className={`text-sm font-medium ${
                    isActive ? 'text-[#0F1D2C]' : 'text-[#0F1D2C]/70'
                  }`}
                >
                  {preset.label}
                </p>
                <p className="text-xs text-[#0F1D2C]/45 mt-0.5">{preset.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Intensity slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-[#0F1D2C]/70">
            Effect Strength
          </label>
          <span className="text-sm font-medium text-rani-gold-accessible">
            {Math.round(intensity * 100)}%
          </span>
        </div>

        <div className="relative">
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={Math.round(intensity * 100)}
            onChange={(e) => onIntensityChange(Number(e.target.value) / 100)}
            className="
              w-full h-2 rounded-full appearance-none cursor-pointer
              bg-[#0F1D2C]/10
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-5
              [&::-webkit-slider-thumb]:h-5
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-[#C9A96E]
              [&::-webkit-slider-thumb]:shadow-md
              [&::-webkit-slider-thumb]:cursor-pointer
              [&::-webkit-slider-thumb]:border-2
              [&::-webkit-slider-thumb]:border-white
              [&::-moz-range-thumb]:w-5
              [&::-moz-range-thumb]:h-5
              [&::-moz-range-thumb]:rounded-full
              [&::-moz-range-thumb]:bg-[#C9A96E]
              [&::-moz-range-thumb]:shadow-md
              [&::-moz-range-thumb]:cursor-pointer
              [&::-moz-range-thumb]:border-2
              [&::-moz-range-thumb]:border-white
            "
            style={{
              background: `linear-gradient(to right, #C9A96E 0%, #C9A96E ${intensity * 100}%, rgba(15,29,44,0.1) ${intensity * 100}%, rgba(15,29,44,0.1) 100%)`,
            }}
          />
        </div>

        <div className="flex justify-between text-xs text-[#0F1D2C]/30">
          <span>Subtle</span>
          <span>Dramatic</span>
        </div>
      </div>
    </div>
  );
}
