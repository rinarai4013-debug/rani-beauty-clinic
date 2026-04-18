'use client';

import { motion } from 'framer-motion';
import { Users, MessageSquare, Mail, Phone, Send } from 'lucide-react';
import type { WinBackCampaign } from '@/lib/revenue/retention-machine';

interface WinBackCampaignCardProps {
  campaign: WinBackCampaign;
  onLaunch?: (campaign: WinBackCampaign) => void;
}

export default function WinBackCampaignCard({ campaign, onLaunch }: WinBackCampaignCardProps) {
  const tierConfig: Record<string, { color: string; icon: React.ElementType }> = {
    '30-day': { color: 'border-blue-200 bg-blue-50/30', icon: MessageSquare },
    '60-day': { color: 'border-amber-200 bg-amber-50/30', icon: Mail },
    '90-day': { color: 'border-red-200 bg-red-50/30', icon: Phone },
  };

  const config = tierConfig[campaign.tier] || tierConfig['30-day'];
  const ChannelIcon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border p-4 ${config.color}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <ChannelIcon className="w-4 h-4 text-rani-navy" />
          <h4 className="font-heading text-rani-navy text-sm">
            {campaign.tier === '30-day' ? 'Gentle Nudge (30-60d)' :
             campaign.tier === '60-day' ? 'Warm Outreach (60-90d)' :
             'Win-Back Push (90d+)'}
          </h4>
        </div>
        <span className="text-xs font-body font-medium text-rani-gold">
          ${campaign.totalEstimatedRecovery.toLocaleString()} recoverable
        </span>
      </div>

      <div className="flex items-center gap-4 mb-3">
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-rani-muted" />
          <span className="text-xs font-body text-rani-muted">{campaign.clients.length} clients</span>
        </div>
        <span className="text-xs font-body text-rani-muted capitalize">
          via {campaign.campaign.channel}
        </span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-body ${
          campaign.campaign.urgency === 'gentle' ? 'bg-blue-100 text-blue-700' :
          campaign.campaign.urgency === 'moderate' ? 'bg-amber-100 text-amber-700' :
          'bg-red-100 text-red-700'
        }`}>
          {campaign.campaign.urgency}
        </span>
      </div>

      <div className="bg-white/60 rounded-lg p-3 mb-3">
        <p className="text-xs font-body text-rani-text italic">&ldquo;{campaign.campaign.message}&rdquo;</p>
        {campaign.campaign.offer && (
          <p className="text-xs font-body text-rani-gold-accessible mt-1.5 font-medium">
            Offer: {campaign.campaign.offer}
          </p>
        )}
      </div>

      {/* Top clients */}
      <div className="flex flex-wrap gap-1 mb-3">
        {campaign.clients.slice(0, 5).map((client, i) => (
          <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-white/80 text-rani-text font-body">
            {client.clientName} ({client.winBackProbability}%)
          </span>
        ))}
        {campaign.clients.length > 5 && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/80 text-rani-muted font-body">
            +{campaign.clients.length - 5} more
          </span>
        )}
      </div>

      {onLaunch && (
        <button
          onClick={() => onLaunch(campaign)}
          className="w-full py-2 rounded-lg bg-rani-navy text-white text-xs font-body font-medium hover:bg-rani-navy/90 transition-colors flex items-center justify-center gap-1.5"
        >
          <Send className="w-3.5 h-3.5" />
          Launch Campaign
        </button>
      )}
    </motion.div>
  );
}
