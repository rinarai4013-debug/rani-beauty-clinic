'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  MessageSquare, Send, Mail, Phone, Users, BarChart3,
  Calendar, Clock, TrendingUp, AlertTriangle, Inbox,
  Megaphone, FileText, Settings, ArrowRight,
} from 'lucide-react';
import StatCard, { StatCardRow } from '@/components/dashboard/shared/StatCard';
import { DashboardErrorBoundary, InlineError } from '@/components/dashboard/shared';
import {
  useInbox,
  useCampaigns,
  useCommunicationAnalytics,
} from '@/hooks/useDashboardData';

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

interface QuickLinkProps {
  href: string;
  icon: typeof MessageSquare;
  title: string;
  description: string;
  badge?: string;
}

function QuickLink({ href, icon: Icon, title, description, badge }: QuickLinkProps) {
  return (
    <Link href={href}>
      <motion.div
        whileHover={{ y: -2, boxShadow: '0 8px 30px rgba(15, 29, 44, 0.06)' }}
        className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 transition-all cursor-pointer group"
      >
        <div className="flex items-start justify-between mb-2">
          <div className="w-9 h-9 rounded-lg bg-rani-gold/10 flex items-center justify-center">
            <Icon className="w-4.5 h-4.5 text-rani-gold" />
          </div>
          {badge && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-body font-semibold bg-red-500 text-white">
              {badge}
            </span>
          )}
        </div>
        <h3 className="text-sm font-body font-semibold text-rani-navy mb-0.5">{title}</h3>
        <p className="text-[11px] font-body text-rani-muted">{description}</p>
        <div className="flex items-center gap-1 mt-2 text-[11px] font-body font-medium text-rani-gold group-hover:text-rani-navy transition-colors">
          Open <ArrowRight className="w-3 h-3" />
        </div>
      </motion.div>
    </Link>
  );
}

export default function CommunicationsPage() {
  const { data: inboxData, isLoading: inboxLoading, error: inboxError } = useInbox();
  const { data: campaignData, isLoading: campLoading } = useCampaigns();
  const { data: analyticsData, isLoading: analyticsLoading, error: analyticsError, mutate } = useCommunicationAnalytics();

  // Extract summary data
  const inbox = inboxData as { conversations?: Array<{ unreadCount: number; status: string; priority: string }>; stats?: Record<string, number> } | undefined;
  const campaigns = campaignData as { campaigns?: Array<{ status: string; metrics: { revenueAttributed: number } }> } | undefined;
  const analytics = analyticsData as { data?: { totalSent: number; avgOpenRate: number; avgClickRate: number; totalRevenueAttributed: number } } | undefined;

  const unreadCount = inbox?.conversations?.reduce((sum, c) => sum + (c.unreadCount || 0), 0) ?? 0;
  const activeConvos = inbox?.conversations?.filter(c => c.status === 'active').length ?? 0;
  const urgentCount = inbox?.conversations?.filter(c => c.priority === 'urgent' || c.priority === 'high').length ?? 0;
  const activeCampaigns = campaigns?.campaigns?.filter(c => c.status === 'sending' || c.status === 'scheduled').length ?? 0;

  const totalSent = analytics?.data?.totalSent ?? 0;
  const avgOpenRate = analytics?.data?.avgOpenRate ?? 0;
  const avgClickRate = analytics?.data?.avgClickRate ?? 0;
  const totalRevenue = analytics?.data?.totalRevenueAttributed ?? 0;

  return (
    <DashboardErrorBoundary pageName="Communication Hub">
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="space-y-6 sm:space-y-8"
      >
        {/* Page Header */}
        <motion.div variants={item}>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
            <div>
              <h1 className="text-xl sm:text-2xl font-heading text-rani-navy">Communication Hub</h1>
              <p className="text-xs sm:text-sm font-body text-rani-muted mt-1">
                Manage all client communications - SMS, email, campaigns, and conversations
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard/communications/preferences"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rani-border text-xs font-body font-medium
                           text-rani-muted hover:bg-gray-50 transition-colors"
              >
                <Settings className="w-3.5 h-3.5" />
                Settings
              </Link>
            </div>
          </div>
        </motion.div>

        {/* KPI Row */}
        <motion.div variants={item}>
          {analyticsError ? (
            <InlineError message="Failed to load communication metrics" onRetry={() => mutate()} />
          ) : (
            <StatCardRow columns={4}>
              <StatCard
                title="Messages Sent (30d)"
                value={totalSent}
                format="number"
                icon={Send}
                loading={analyticsLoading}
              />
              <StatCard
                title="Avg Open Rate"
                value={avgOpenRate}
                format="percent"
                icon={Mail}
                loading={analyticsLoading}
              />
              <StatCard
                title="Avg Click Rate"
                value={avgClickRate}
                format="percent"
                icon={TrendingUp}
                loading={analyticsLoading}
              />
              <StatCard
                title="Revenue Attributed"
                value={totalRevenue}
                format="currency"
                icon="dollar"
                loading={analyticsLoading}
              />
            </StatCardRow>
          )}
        </motion.div>

        {/* Quick Links */}
        <motion.div variants={item}>
          <h2 className="text-sm font-body font-semibold text-rani-navy mb-3">Quick Access</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            <QuickLink
              href="/dashboard/communications/inbox"
              icon={Inbox}
              title="Inbox"
              description="View and respond to client conversations"
              badge={unreadCount > 0 ? `${unreadCount} unread` : undefined}
            />
            <QuickLink
              href="/dashboard/communications/campaigns"
              icon={Megaphone}
              title="Campaigns"
              description="Create and manage marketing campaigns"
              badge={activeCampaigns > 0 ? `${activeCampaigns} active` : undefined}
            />
            <QuickLink
              href="/dashboard/communications/templates"
              icon={FileText}
              title="Templates"
              description="Browse and manage message templates"
            />
            <QuickLink
              href="/dashboard/communications/analytics"
              icon={BarChart3}
              title="Analytics"
              description="Communication performance and insights"
            />
          </div>
        </motion.div>

        {/* Activity Summary */}
        <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Conversations */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-body font-semibold text-rani-navy">Recent Conversations</h3>
              <Link
                href="/dashboard/communications/inbox"
                className="text-[11px] font-body font-medium text-rani-gold hover:text-rani-navy transition-colors"
              >
                View All
              </Link>
            </div>

            {inboxLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-gray-100 rounded w-24" />
                      <div className="h-3 bg-gray-100 rounded w-48" />
                    </div>
                  </div>
                ))}
              </div>
            ) : inboxError ? (
              <InlineError message="Failed to load conversations" onRetry={() => {}} />
            ) : (
              <div className="space-y-2">
                {(inbox?.conversations ?? []).slice(0, 5).map((conv: Record<string, unknown>, i: number) => (
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-rani-border/30 last:border-0">
                    <div className="w-8 h-8 rounded-full bg-rani-gold/10 flex items-center justify-center flex-shrink-0">
                      {(conv.channel as string) === 'sms'
                        ? <Phone className="w-4 h-4 text-rani-gold" />
                        : <Mail className="w-4 h-4 text-rani-gold" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-body font-medium text-rani-navy truncate">
                        {conv.clientName as string}
                      </p>
                      <p className="text-[11px] font-body text-rani-muted truncate">
                        {conv.lastMessage as string}
                      </p>
                    </div>
                    {(conv.unreadCount as number) > 0 && (
                      <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0">
                        {conv.unreadCount as number}
                      </span>
                    )}
                  </div>
                ))}
                {(!inbox?.conversations || inbox.conversations.length === 0) && (
                  <p className="text-xs font-body text-rani-muted text-center py-4">No recent conversations</p>
                )}
              </div>
            )}
          </div>

          {/* Upcoming Campaigns */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-body font-semibold text-rani-navy">Upcoming Campaigns</h3>
              <Link
                href="/dashboard/communications/campaigns"
                className="text-[11px] font-body font-medium text-rani-gold hover:text-rani-navy transition-colors"
              >
                View All
              </Link>
            </div>

            {campLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse space-y-1.5">
                    <div className="h-3 bg-gray-100 rounded w-36" />
                    <div className="h-3 bg-gray-100 rounded w-48" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {(campaigns?.campaigns ?? [])
                  .filter(c => c.status === 'scheduled' || c.status === 'sending')
                  .slice(0, 5)
                  .map((camp: Record<string, unknown>, i: number) => (
                    <div key={i} className="py-2 border-b border-rani-border/30 last:border-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-body font-medium text-rani-navy">{camp.name as string}</p>
                        <span className={`text-[10px] font-body font-medium px-2 py-0.5 rounded-full ${
                          camp.status === 'sending'
                            ? 'bg-amber-50 text-amber-600'
                            : 'bg-blue-50 text-blue-600'
                        }`}>
                          {(camp.status as string) === 'sending' ? 'Sending' : 'Scheduled'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[11px] font-body text-rani-muted">
                        <Users className="w-3 h-3" />
                        <span>{((camp as Record<string, unknown>).audienceSize as number)?.toLocaleString() ?? 0} recipients</span>
                        {camp.scheduledAt && (
                          <>
                            <Calendar className="w-3 h-3 ml-2" />
                            <span>{new Date(camp.scheduledAt as string).toLocaleDateString()}</span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                {(!campaigns?.campaigns || campaigns.campaigns.filter(c => c.status === 'scheduled' || c.status === 'sending').length === 0) && (
                  <p className="text-xs font-body text-rani-muted text-center py-4">No upcoming campaigns</p>
                )}
              </div>
            )}
          </div>
        </motion.div>

        {/* Smart Suggestions */}
        <motion.div variants={item}>
          <div className="bg-rani-gold/5 rounded-xl border border-rani-gold/20 p-4">
            <h3 className="text-sm font-body font-semibold text-rani-navy mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rani-gold" />
              Action Items
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {unreadCount > 0 && (
                <Link href="/dashboard/communications/inbox" className="text-xs font-body text-rani-text hover:text-rani-navy transition-colors">
                  Reply to {unreadCount} unread message{unreadCount !== 1 ? 's' : ''}
                </Link>
              )}
              {urgentCount > 0 && (
                <Link href="/dashboard/communications/inbox" className="text-xs font-body text-red-600 font-semibold">
                  {urgentCount} urgent conversation{urgentCount !== 1 ? 's' : ''} need attention
                </Link>
              )}
              <Link href="/dashboard/communications/campaigns" className="text-xs font-body text-rani-text hover:text-rani-navy transition-colors">
                Review campaign performance
              </Link>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </DashboardErrorBoundary>
  );
}
