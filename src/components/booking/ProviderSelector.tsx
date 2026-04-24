'use client';

import type { ProviderSchedule } from '@/lib/booking/types';
import { DEFAULT_PROVIDERS } from '@/lib/booking/availability';

interface ProviderSelectorProps {
  providers?: ProviderSchedule[];
  selectedProviderId: string | null;
  onSelect: (_providerId: string | null) => void;
  serviceId?: string;
}

export default function ProviderSelector({
  providers = DEFAULT_PROVIDERS,
  selectedProviderId,
  onSelect,
  serviceId,
}: ProviderSelectorProps) {
  const qualifiedProviders = serviceId
    ? providers.filter(p => p.qualifiedServices.includes(serviceId))
    : providers;

  return (
    <div className="space-y-3">
      {/* No preference option */}
      <button
        onClick={() => onSelect(null)}
        className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
          selectedProviderId === null
            ? 'border-[#C9A96E] bg-[#C9A96E]/5'
            : 'border-[#E8E4DF] hover:border-[#C9A96E]/50'
        }`}
      >
        <div className="w-12 h-12 rounded-full bg-[#F8F6F1] flex items-center justify-center text-[#6B7280]">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
          </svg>
        </div>
        <div className="text-left">
          <p className="font-medium text-[#0F1D2C]">No Preference</p>
          <p className="text-sm text-[#6B7280]">Show me the first available time with any provider</p>
        </div>
      </button>

      {/* Provider options */}
      {qualifiedProviders.map(provider => (
        <button
          key={provider.providerId}
          onClick={() => onSelect(provider.providerId)}
          className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
            selectedProviderId === provider.providerId
              ? 'border-[#C9A96E] bg-[#C9A96E]/5'
              : 'border-[#E8E4DF] hover:border-[#C9A96E]/50'
          }`}
        >
          <div className="w-12 h-12 rounded-full bg-[#0F1D2C] flex items-center justify-center text-[#C9A96E] font-bold text-lg font-[family-name:var(--font-heading)]">
            {provider.providerName.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div className="text-left">
            <p className="font-medium text-[#0F1D2C]">{provider.providerName}</p>
            <p className="text-sm text-[#6B7280] capitalize">{provider.role.replace('-', ' ')}</p>
          </div>
        </button>
      ))}

      {qualifiedProviders.length === 0 && (
        <p className="text-sm text-[#6B7280] text-center py-4">
          No providers available for this service.
        </p>
      )}
    </div>
  );
}
