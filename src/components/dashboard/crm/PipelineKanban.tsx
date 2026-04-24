'use client';

import { motion } from 'framer-motion';
import { Clock, DollarSign, User, AlertTriangle, Phone, Mail, MoreHorizontal } from 'lucide-react';
import type { PipelineLead, PipelineStage } from '@/types/crm';
import { PIPELINE_STAGE_LABELS, PIPELINE_STAGE_COLORS } from '@/types/crm';

interface PipelineKanbanProps {
  stages: {
    stage: PipelineStage;
    label: string;
    leads: PipelineLead[];
    count: number;
    totalValue: number;
  }[];
  onLeadClick?: (_lead: PipelineLead) => void;
  onStageDrop?: (_leadId: string, _toStage: PipelineStage) => void;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
}

function LeadCard({ lead, onClick }: { lead: PipelineLead; onClick?: (_lead: PipelineLead) => void }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-lg border p-3 cursor-pointer hover:shadow-md transition-shadow ${
        lead.isStale ? 'border-red-300 bg-red-50/50' : 'border-rani-border'
      }`}
      onClick={() => onClick?.(lead)}
      draggable
      onDragStart={(e) => {
        (e as unknown as DragEvent).dataTransfer?.setData('leadId', lead.id);
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-sm font-semibold text-rani-navy truncate max-w-[160px]">{lead.clientName}</h4>
        <button className="text-rani-muted hover:text-rani-navy p-0.5" aria-label="More options">
          <MoreHorizontal className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-1.5 text-[10px] text-rani-muted mb-2">
        {lead.email && <Mail className="w-3 h-3" />}
        {lead.phone && <Phone className="w-3 h-3" />}
        <span className="ml-auto">{lead.source}</span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-rani-navy">{formatCurrency(lead.estimatedValue)}</span>
        <div className="flex items-center gap-1">
          {lead.isStale && (
            <span className="flex items-center gap-0.5 text-[10px] text-red-600">
              <AlertTriangle className="w-3 h-3" />
              Stale
            </span>
          )}
          <span className="flex items-center gap-0.5 text-[10px] text-rani-muted">
            <Clock className="w-3 h-3" />
            {lead.daysInStage}d
          </span>
        </div>
      </div>

      {lead.score > 0 && (
        <div className="mt-2">
          <div className="flex items-center justify-between text-[10px] text-rani-muted mb-0.5">
            <span>Lead Score</span>
            <span className="font-medium">{lead.score}</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1">
            <div
              className={`h-1 rounded-full ${
                lead.score >= 70 ? 'bg-green-500' : lead.score >= 40 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${lead.score}%` }}
            />
          </div>
        </div>
      )}

      {lead.assignedTo && (
        <div className="mt-2 flex items-center gap-1 text-[10px] text-rani-muted">
          <User className="w-3 h-3" />
          <span>{lead.assignedTo}</span>
        </div>
      )}
    </motion.div>
  );
}

export default function PipelineKanban({ stages, onLeadClick, onStageDrop }: PipelineKanbanProps) {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('bg-blue-50/50');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('bg-blue-50/50');
  };

  const handleDrop = (e: React.DragEvent, stage: PipelineStage) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-blue-50/50');
    const leadId = e.dataTransfer.getData('leadId');
    if (leadId && onStageDrop) {
      onStageDrop(leadId, stage);
    }
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-4 min-h-[500px]">
      {stages.map((stageData) => (
        <div
          key={stageData.stage}
          className="flex-shrink-0 w-[260px] bg-gray-50/80 rounded-xl border border-rani-border"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, stageData.stage)}
        >
          {/* Stage Header */}
          <div className="p-3 border-b border-rani-border">
            <div className="flex items-center justify-between mb-1">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PIPELINE_STAGE_COLORS[stageData.stage]}`}>
                {stageData.label}
              </span>
              <span className="text-xs font-medium text-rani-muted bg-white px-1.5 py-0.5 rounded">
                {stageData.count}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-rani-muted">
              <DollarSign className="w-3 h-3" />
              <span>{formatCurrency(stageData.totalValue)}</span>
            </div>
          </div>

          {/* Lead Cards */}
          <div className="p-2 space-y-2 max-h-[600px] overflow-y-auto">
            {stageData.leads.length === 0 ? (
              <p className="text-xs text-rani-muted text-center py-4">No leads</p>
            ) : (
              stageData.leads.map((lead) => (
                <LeadCard key={lead.id} lead={lead} onClick={onLeadClick} />
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
