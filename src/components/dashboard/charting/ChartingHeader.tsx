'use client';

import { User, Calendar, Stethoscope, FileText } from 'lucide-react';
import { type ChartTemplateType, CHART_TEMPLATES } from '@/lib/charting/templates';

interface ChartingHeaderProps {
  templateType: ChartTemplateType;
  clientName: string;
  providerName: string;
  appointmentDate: string;
  appointmentTime?: string;
  serviceName?: string;
  chartId?: string;
  status: string;
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-amber-100 text-amber-800',
  complete: 'bg-blue-100 text-blue-800',
  signed: 'bg-emerald-100 text-emerald-800',
  reviewed: 'bg-purple-100 text-purple-800',
  amended: 'bg-orange-100 text-orange-800',
};

export default function ChartingHeader({
  templateType,
  clientName,
  providerName,
  appointmentDate,
  appointmentTime,
  serviceName,
  chartId,
  status,
}: ChartingHeaderProps) {
  const template = CHART_TEMPLATES[templateType];
  const displayDate = appointmentDate
    ? new Date(appointmentDate + 'T12:00:00').toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  return (
    <div className="rounded-xl border border-[#C9A96E]/20 bg-gradient-to-r from-[#0F1D2C] to-[#1a2d42] p-6 text-white">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileText className="h-5 w-5 text-[#C9A96E]" />
            <h2 className="text-xl font-bold font-[Playfair_Display]">
              {template?.name || 'Chart'}
            </h2>
          </div>
          {chartId && (
            <p className="text-xs text-[#C9A96E]/60 font-mono">{chartId}</p>
          )}
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
            STATUS_COLORS[status] || 'bg-gray-100 text-gray-800'
          }`}
        >
          {status}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-[#C9A96E]" />
          <div>
            <p className="text-xs text-white/50">Client</p>
            <p className="text-sm font-semibold">{clientName || ' - '}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Stethoscope className="h-4 w-4 text-[#C9A96E]" />
          <div>
            <p className="text-xs text-white/50">Provider</p>
            <p className="text-sm font-semibold">{providerName || ' - '}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-[#C9A96E]" />
          <div>
            <p className="text-xs text-white/50">Date</p>
            <p className="text-sm font-semibold">
              {displayDate}
              {appointmentTime && ` at ${appointmentTime}`}
            </p>
          </div>
        </div>

        {serviceName && (
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#C9A96E]" />
            <div>
              <p className="text-xs text-white/50">Service</p>
              <p className="text-sm font-semibold">{serviceName}</p>
            </div>
          </div>
        )}
      </div>

      {template?.requiresMedicalDirectorReview && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-purple-500/20 px-3 py-2 text-sm">
          <Stethoscope className="h-4 w-4 text-purple-300" />
          <span className="text-purple-200">
            Requires Dr. Landfield review (Medical Director)
          </span>
        </div>
      )}
    </div>
  );
}
