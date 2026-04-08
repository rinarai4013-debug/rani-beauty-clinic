'use client';

import { Shield, Star, Award } from 'lucide-react';

const TRUST_SIGNALS = [
  {
    icon: Shield,
    label: 'Physician-Supervised',
  },
  {
    icon: Star,
    label: '200+ Verified Five-Star Reviews',
  },
  {
    icon: Award,
    label: '4,500+ Treatments',
  },
] as const;

export default function WizardTrustBar() {
  return (
    <div className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-[#C9A96E]/20">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-center gap-6 md:gap-10">
        {TRUST_SIGNALS.map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="flex items-center gap-1.5 text-[#0F1D2C]/70"
          >
            <Icon className="w-4 h-4 text-[#C9A96E] flex-shrink-0" />
            <span className="text-[11px] md:text-xs font-body font-medium whitespace-nowrap">
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
