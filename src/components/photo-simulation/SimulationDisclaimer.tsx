'use client';

import React from 'react';
import { Info } from 'lucide-react';

/**
 * Legal disclaimer for photo simulation results.
 * Navy-styled info box.
 */
export default function SimulationDisclaimer() {
  return (
    <div className="rounded-xl bg-[#0F1D2C] px-5 py-4 flex gap-3 items-start">
      <Info className="h-5 w-5 text-[#C9A96E] flex-shrink-0 mt-0.5" />
      <p className="text-xs leading-relaxed text-white/70">
        This visualization is illustrative only and does not represent guaranteed
        results. Individual outcomes vary based on skin type, health factors, and
        treatment adherence. Consult with our medical team for a personalized
        assessment.
      </p>
    </div>
  );
}
