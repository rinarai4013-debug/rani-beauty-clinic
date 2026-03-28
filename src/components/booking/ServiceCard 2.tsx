'use client';

import Link from 'next/link';
import type { BookableService } from '@/lib/booking/types';

interface ServiceCardProps {
  service: BookableService;
  showPrice?: boolean;
  isSelected?: boolean;
  onSelect?: (serviceId: string) => void;
}

export default function ServiceCard({ service, showPrice = true, isSelected = false, onSelect }: ServiceCardProps) {
  const handleClick = () => {
    if (onSelect) {
      onSelect(service.id);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`w-full text-left p-6 rounded-2xl border-2 transition-all duration-300 hover:shadow-lg ${
        isSelected
          ? 'border-[#C9A96E] bg-[#C9A96E]/5 shadow-md'
          : 'border-[#E8E4DF] bg-white hover:border-[#C9A96E]/50'
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold text-[#0F1D2C] font-[family-name:var(--font-heading)]">
          {service.name}
        </h3>
        {showPrice && (
          <span className="text-lg font-bold text-[#C9A96E]">
            {service.price > 0 ? `$${service.price}` : 'Complimentary'}
          </span>
        )}
      </div>

      <div className="flex items-center gap-4 text-sm text-[#6B7280] mb-3">
        <span className="flex items-center gap-1">
          <ClockIcon />
          {service.duration} min
        </span>
        {service.requiresConsultation && (
          <span className="text-xs bg-[#F3D6BE] text-[#0F1D2C] px-2 py-0.5 rounded-full">
            Consultation required
          </span>
        )}
        {service.depositRequired > 0 && (
          <span className="text-xs text-[#6B7280]">
            ${service.depositRequired} deposit
          </span>
        )}
      </div>

      {isSelected && (
        <div className="mt-3 flex items-center gap-2 text-sm text-[#C9A96E] font-medium">
          <CheckIcon />
          Selected
        </div>
      )}
    </button>
  );
}

function ClockIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}
