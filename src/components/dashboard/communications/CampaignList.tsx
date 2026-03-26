'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, Copy, Edit, Trash2, Eye, Send, Clock,
  Pause, BarChart3, Users, Mail, Phone, MessageSquare,
} from 'lucide-react';
import DeliveryStatusBadge from './DeliveryStatusBadge';
import type { Campaign, CampaignStatus, CampaignType } from '@/types/communications';

interface CampaignListProps {
  campaigns: Campaign[];
  onCreateNew: () => void;
  onEdit: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onViewDetails: (id: string) => void;
}

const STATUS_BADGE: Record<CampaignStatus, { label: string; bg: string; text: string }> = {
  draft: { label: 'Draft', bg: 'bg-gray-50', text: 'text-gray-600' },
  scheduled: { label: 'Scheduled', bg: 'bg-blue-50', text: 'text-blue-600' },
  sending: { label: 'Sending', bg: 'bg-amber-50', text: 'text-amber-600' },
  sent: { label: 'Sent', bg: 'bg-emerald-50', text: 'text-emerald-600' },
  paused: { label: 'Paused', bg: 'bg-orange-50', text: 'text-orange-600' },
  cancelled: { label: 'Cancelled', bg: 'bg-red-50', text: 'text-red-500' },
  completed: { label: 'Completed', bg: 'bg-emerald-50', text: 'text-emerald-700' },
};

const TYPE_LABEL: Record<CampaignType, string> = {
  promotional: 'Promotional',
  educational: 'Educational',
  reactivation: 'Reactivation',
  event: 'Event',
  seasonal: 'Seasonal',
  birthday: 'Birthday',
};

export default function CampaignList({
  campaigns,
  onCreateNew,
  onEdit,
  onDuplicate,
  onDelete,
  onViewDetails,
}: CampaignListProps) {
  const [filter, setFilter] = useState<CampaignStatus | 'all'>('all');

  const filtered = filter === 'all'
    ? campaigns
    : campaigns.filter(c => c.status === filter);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {(['all', 'draft', 'scheduled', 'sending', 'completed'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-[11px] font-body font-medium transition-colors capitalize ${
                filter === f
                  ? 'bg-rani-navy text-white'
                  : 'bg-gray-50 text-rani-muted hover:bg-gray-100'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <button
          onClick={onCreateNew}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rani-navy text-white text-xs font-body font-semibold
                     hover:bg-rani-navy-light transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          New Campaign
        </button>
      </div>

      {/* Campaign Cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="w-10 h-10 text-rani-muted/20 mx-auto mb-2" />
          <p className="text-sm font-body text-rani-muted">No campaigns found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((campaign) => {
            const statusConfig = STATUS_BADGE[campaign.status];
            return (
              <motion.div
                key={campaign.id}
                whileHover={{ y: -1, boxShadow: '0 4px 20px rgba(15, 29, 44, 0.06)' }}
                className="bg-white rounded-xl border border-rani-border p-4 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-body font-semibold text-rani-navy truncate">
                        {campaign.name}
                      </h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-body font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                        {statusConfig.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] font-body text-rani-muted">
                      <span className="capitalize">{TYPE_LABEL[campaign.type]}</span>
                      <span className="text-rani-border">|</span>
                      <span className="flex items-center gap-1">
                        {campaign.channel === 'sms' && <Phone className="w-3 h-3" />}
                        {campaign.channel === 'email' && <Mail className="w-3 h-3" />}
                        {campaign.channel === 'both' && <MessageSquare className="w-3 h-3" />}
                        {campaign.channel === 'both' ? 'SMS + Email' : campaign.channel.toUpperCase()}
                      </span>
                      <span className="text-rani-border">|</span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {campaign.audienceSize.toLocaleString()} recipients
                      </span>
                      {campaign.scheduledAt && (
                        <>
                          <span className="text-rani-border">|</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(campaign.scheduledAt).toLocaleDateString('en-US', {
                              month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                            })}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => onViewDetails(campaign.id)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                      title="View details"
                    >
                      <Eye className="w-3.5 h-3.5 text-rani-muted" />
                    </button>
                    <button
                      onClick={() => onEdit(campaign.id)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-3.5 h-3.5 text-rani-muted" />
                    </button>
                    <button
                      onClick={() => onDuplicate(campaign.id)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                      title="Duplicate"
                    >
                      <Copy className="w-3.5 h-3.5 text-rani-muted" />
                    </button>
                    <button
                      onClick={() => onDelete(campaign.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rani-muted hover:text-red-500" />
                    </button>
                  </div>
                </div>

                {/* Performance Metrics (for sent campaigns) */}
                {(campaign.status === 'sent' || campaign.status === 'completed') && campaign.metrics.totalSent > 0 && (
                  <div className="mt-3 pt-3 border-t border-rani-border/50">
                    <div className="grid grid-cols-5 gap-3">
                      <MetricMini label="Sent" value={campaign.metrics.totalSent.toLocaleString()} />
                      <MetricMini label="Delivered" value={`${campaign.metrics.deliveryRate.toFixed(1)}%`} />
                      <MetricMini label="Opened" value={`${campaign.metrics.openRate.toFixed(1)}%`} />
                      <MetricMini label="Clicked" value={`${campaign.metrics.clickRate.toFixed(1)}%`} />
                      <MetricMini
                        label="Revenue"
                        value={`$${campaign.metrics.revenueAttributed.toLocaleString()}`}
                        highlight
                      />
                    </div>
                  </div>
                )}

                {/* A/B Test Badge */}
                {campaign.abTest?.enabled && (
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-body font-medium bg-purple-50 text-purple-600">
                      <BarChart3 className="w-3 h-3" />
                      A/B Test
                      {campaign.abTest.winner && ` - Winner: ${campaign.abTest.winner}`}
                    </span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MetricMini({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <span className="text-[10px] font-body text-rani-muted">{label}</span>
      <p className={`text-xs font-body font-semibold ${highlight ? 'text-rani-success' : 'text-rani-navy'}`}>
        {value}
      </p>
    </div>
  );
}
