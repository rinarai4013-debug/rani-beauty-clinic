'use client';

import { Plus } from 'lucide-react';
import type { UnifiedService } from '@/data/services/unified-catalog';
import { CATEGORY_LABELS } from '@/data/services/unified-catalog';

interface ServiceCatalogCardProps {
  service: UnifiedService;
  onAdd: (_service: UnifiedService) => void;
}

export default function ServiceCatalogCard({ service, onAdd }: ServiceCatalogCardProps) {
  return (
    <div className="group relative bg-white border border-gray-100 rounded-lg p-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold text-[#0F1D2C] truncate leading-tight">
            {service.name}
          </h4>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-sm font-bold text-[#C9A96E]">
              ${service.price.toLocaleString()}
            </span>
            <span className="text-xs text-gray-400">
              {service.duration} min
            </span>
          </div>
          <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#F8F6F1] text-gray-600 border border-gray-100">
            {CATEGORY_LABELS[service.category]}
          </span>
        </div>
        <button
          onClick={() => onAdd(service)}
          className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#0F1D2C] text-white flex items-center justify-center hover:bg-[#C9A96E] transition-colors opacity-0 group-hover:opacity-100"
          title="Add to plan"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
