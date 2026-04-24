'use client';

import { AlertTriangle, Phone, Clock, DollarSign } from 'lucide-react';
import type { PipelineLead } from '@/types/crm';
import { PIPELINE_STAGE_LABELS } from '@/types/crm';

interface StaleLeadAlertProps {
  leads: PipelineLead[];
  onAction?: (_leadId: string, _action: 'call' | 'email' | 'mark_lost') => void;
}

export default function StaleLeadAlert({ leads, onAction }: StaleLeadAlertProps) {
  if (leads.length === 0) return null;

  return (
    <div className="bg-red-50/80 backdrop-blur-sm rounded-xl border border-red-200 p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-4 h-4 text-red-600" />
        <h3 className="text-sm font-body font-semibold text-red-800 uppercase tracking-wider">
          Stale Leads Requiring Action
          <span className="text-red-500 font-normal ml-1">({leads.length})</span>
        </h3>
      </div>

      <div className="space-y-2">
        {leads.slice(0, 5).map(lead => (
          <div key={lead.id} className="flex items-center justify-between bg-white rounded-lg border border-red-200 p-3">
            <div>
              <h4 className="text-xs font-semibold text-rani-navy">{lead.clientName}</h4>
              <div className="flex items-center gap-2 text-[10px] text-rani-muted mt-0.5">
                <span>{PIPELINE_STAGE_LABELS[lead.stage]}</span>
                <span className="flex items-center gap-0.5 text-red-600">
                  <Clock className="w-3 h-3" />
                  {lead.daysInStage}d inactive
                </span>
                <span className="flex items-center gap-0.5">
                  <DollarSign className="w-3 h-3" />
                  ${lead.estimatedValue.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="flex gap-1.5">
              <button
                className="text-[10px] font-medium text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded"
                onClick={() => onAction?.(lead.id, 'call')}
              >
                <Phone className="w-3 h-3 inline mr-0.5" />
                Call
              </button>
              <button
                className="text-[10px] font-medium text-gray-600 hover:text-gray-800 bg-gray-50 px-2 py-1 rounded"
                onClick={() => onAction?.(lead.id, 'mark_lost')}
              >
                Close
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
