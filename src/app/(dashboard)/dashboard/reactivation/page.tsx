'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  UserMinus, Phone, MessageSquare, Mail, Send, DollarSign,
  Users, Clock, CreditCard, Heart, CheckSquare, Square,
} from 'lucide-react';
import { useReactivationList } from '@/hooks/useDashboardData';
import { DashboardErrorBoundary, KPIRowSkeleton, PanelSkeleton, SkeletonBar, InlineError } from '@/components/dashboard/shared';
import DashboardEmptyState from '@/components/dashboard/shared/DashboardEmptyState';
import type { ReactivationClient, ReactivationSegment, ReactivationData } from '@/app/api/dashboard/reactivation/route';

const SEGMENTS: { key: ReactivationSegment; label: string; icon: React.ElementType }[] = [
  { key: 'lapsed-30-60', label: 'Lapsed 30-60d', icon: Clock },
  { key: 'lapsed-60-90', label: 'Lapsed 60-90d', icon: Clock },
  { key: 'lapsed-90-plus', label: 'Lapsed 90+d', icon: UserMinus },
  { key: 'one-visit-wonder', label: 'One-Visit Wonders', icon: Users },
  { key: 'membership-at-risk', label: 'Membership At Risk', icon: Heart },
];

export default function ReactivationPage() {
  return (
    <DashboardErrorBoundary pageName="Reactivation">
      <ReactivationContent />
    </DashboardErrorBoundary>
  );
}

function ReactivationContent() {
  const { data: raw, isLoading, error, mutate } = useReactivationList() as {
    data: ReactivationData | undefined;
    isLoading: boolean;
    error: unknown;
    mutate: () => void;
  };

  const [activeTab, setActiveTab] = useState<ReactivationSegment>('lapsed-30-60');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);

  const clients = useMemo(
    () => raw?.segments[activeTab] || [],
    [raw, activeTab]
  );

  const recoverableForSelected = useMemo(() => {
    if (!raw) return 0;
    const avgTicket = raw.summary.avgTicket;
    return selectedIds.size > 0 ? avgTicket * selectedIds.size : avgTicket * clients.length;
  }, [raw, selectedIds, clients]);

  // Reset selection when tab changes
  const handleTabChange = (seg: ReactivationSegment) => {
    setActiveTab(seg);
    setSelectedIds(new Set());
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === clients.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(clients.map(c => c.id)));
    }
  };

  const handleSendCampaign = async () => {
    const targets = clients.filter(c => selectedIds.has(c.id));
    if (targets.length === 0) return;

    setSending(true);
    try {
      // Send each client to the reactivation template endpoint and log to Messages Log
      await Promise.all(
        targets.map(async (client) => {
          // Generate reactivation template
          const templateRes = await fetch('/api/templates/reactivation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              firstName: client.name.split(' ')[0],
              lastService: client.lastService,
              daysSinceLastVisit: client.daysSinceLastVisit,
              membershipTier: client.membershipTier,
              ltv: client.totalSpend,
            }),
          });

          if (!templateRes.ok) return;
          const template = await templateRes.json();

          // Log to Messages Log via API
          await fetch('/api/dashboard/reactivation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              clientId: client.id,
              clientName: client.name,
              channel: 'SMS',
              subject: `Reactivation: ${template.tier}`,
              body: template.sms,
            }),
          });
        })
      );

      setSelectedIds(new Set());
      mutate();
    } catch (err) {
      console.error('Failed to send reactivation campaign:', err);
    } finally {
      setSending(false);
    }
  };

  /* ── Error ── */
  if (error) {
    return <InlineError message="Failed to load reactivation data" onRetry={() => mutate()} />;
  }

  /* ── Loading ── */
  if (isLoading) {
    return (
      <div className="space-y-6 sm:space-y-8">
        <div className="animate-pulse space-y-2">
          <SkeletonBar className="h-7 w-56" />
          <SkeletonBar className="h-3 w-96" />
        </div>
        <KPIRowSkeleton count={4} />
        <PanelSkeleton rows={6} />
      </div>
    );
  }

  const summary = raw?.summary;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-heading text-rani-navy">Reactivation List</h1>
        <p className="text-xs sm:text-sm font-body text-rani-muted mt-1">
          Win back lapsed clients with targeted outreach - sorted by highest value first
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={<Users className="w-4 h-4" />} label="Total Lapsed" value={String(summary?.totalClients || 0)} />
        <StatCard icon={<DollarSign className="w-4 h-4" />} label="Recoverable Revenue" value={`$${recoverableForSelected.toLocaleString()}`} sub={selectedIds.size > 0 ? `${selectedIds.size} selected` : 'All in segment'} />
        <StatCard icon={<CreditCard className="w-4 h-4" />} label="Avg Ticket" value={`$${summary?.avgTicket || 0}`} />
        <StatCard icon={<CheckSquare className="w-4 h-4" />} label="Selected" value={String(selectedIds.size)} sub={selectedIds.size > 0 ? 'Ready to send' : 'Select clients below'} />
      </div>

      {/* Segment Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
        {SEGMENTS.map(seg => {
          const count = summary?.bySegment[seg.key] || 0;
          const isActive = activeTab === seg.key;
          return (
            <button
              key={seg.key}
              onClick={() => handleTabChange(seg.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-body whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-rani-navy text-white'
                  : 'bg-white text-rani-navy hover:bg-rani-cream border border-rani-border'
              }`}
            >
              <seg.icon className="w-3.5 h-3.5" />
              {seg.label}
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                isActive ? 'bg-white/20 text-white' : 'bg-rani-cream text-rani-muted'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Bulk Action Bar */}
      {clients.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between p-3 bg-white rounded-xl border border-rani-border"
        >
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-1.5 text-xs font-body text-rani-muted hover:text-rani-navy transition-colors"
            >
              {selectedIds.size === clients.length ? (
                <CheckSquare className="w-4 h-4 text-rani-gold" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              {selectedIds.size === clients.length ? 'Deselect All' : 'Select All'}
            </button>
            <span className="text-xs text-rani-muted">
              {selectedIds.size} of {clients.length} selected
            </span>
          </div>
          <button
            onClick={handleSendCampaign}
            disabled={selectedIds.size === 0 || sending}
            className="flex items-center gap-1.5 px-4 py-2 bg-rani-gold text-rani-navy rounded-lg text-xs sm:text-sm font-body font-medium hover:bg-rani-gold/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            {sending ? 'Sending...' : 'Send Reactivation Campaign'}
          </button>
        </motion.div>
      )}

      {/* Client Table */}
      {clients.length === 0 ? (
        <DashboardEmptyState
          icon="users"
          title="No lapsed clients in this segment"
          description="Great news - no clients are lapsing in this time range!"
        />
      ) : (
        <div className="bg-white rounded-xl border border-rani-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-rani-cream/50 border-b border-rani-border">
                  <th className="p-3 text-left w-10">
                    <button onClick={toggleSelectAll} className="flex items-center">
                      {selectedIds.size === clients.length ? (
                        <CheckSquare className="w-4 h-4 text-rani-gold" />
                      ) : (
                        <Square className="w-4 h-4 text-rani-muted" />
                      )}
                    </button>
                  </th>
                  <th className="p-3 text-left font-body font-medium text-rani-navy">Client</th>
                  <th className="p-3 text-left font-body font-medium text-rani-navy hidden sm:table-cell">Phone</th>
                  <th className="p-3 text-left font-body font-medium text-rani-navy hidden md:table-cell">Last Visit</th>
                  <th className="p-3 text-left font-body font-medium text-rani-navy">Days Lapsed</th>
                  <th className="p-3 text-right font-body font-medium text-rani-navy hidden lg:table-cell">Total Spend</th>
                  <th className="p-3 text-left font-body font-medium text-rani-navy hidden xl:table-cell">Last Service</th>
                  <th className="p-3 text-left font-body font-medium text-rani-navy hidden xl:table-cell">Suggested Offer</th>
                  <th className="p-3 text-center font-body font-medium text-rani-navy">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rani-border">
                {clients.map((client) => (
                  <ClientRow
                    key={client.id}
                    client={client}
                    selected={selectedIds.has(client.id)}
                    onToggle={() => toggleSelect(client.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function ClientRow({
  client,
  selected,
  onToggle,
}: {
  client: ReactivationClient;
  selected: boolean;
  onToggle: () => void;
}) {
  const lapsedColor =
    client.daysSinceLastVisit >= 90
      ? 'text-red-600 bg-red-50'
      : client.daysSinceLastVisit >= 60
        ? 'text-amber-600 bg-amber-50'
        : 'text-blue-600 bg-blue-50';

  return (
    <tr className={`transition-colors ${selected ? 'bg-rani-gold/5' : 'hover:bg-rani-cream/30'}`}>
      <td className="p-3">
        <button onClick={onToggle} className="flex items-center">
          {selected ? (
            <CheckSquare className="w-4 h-4 text-rani-gold" />
          ) : (
            <Square className="w-4 h-4 text-rani-muted" />
          )}
        </button>
      </td>
      <td className="p-3">
        <div className="font-body font-medium text-rani-navy">{client.name}</div>
        <div className="text-xs text-rani-muted sm:hidden">{client.phone}</div>
      </td>
      <td className="p-3 font-body text-rani-navy hidden sm:table-cell">{client.phone || ' - '}</td>
      <td className="p-3 font-body text-rani-muted hidden md:table-cell">
        {new Date(client.lastVisitDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
      </td>
      <td className="p-3">
        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${lapsedColor}`}>
          {client.daysSinceLastVisit}d
        </span>
      </td>
      <td className="p-3 text-right font-body font-medium text-rani-navy hidden lg:table-cell">
        ${client.totalSpend.toLocaleString()}
      </td>
      <td className="p-3 font-body text-rani-muted text-xs hidden xl:table-cell max-w-[150px] truncate">
        {client.lastService}
      </td>
      <td className="p-3 font-body text-rani-muted text-xs hidden xl:table-cell max-w-[200px] truncate">
        {client.suggestedOffer}
      </td>
      <td className="p-3">
        <div className="flex items-center justify-center gap-1">
          {client.phone && (
            <>
              <a
                href={`tel:${client.phone}`}
                className="p-1.5 rounded-lg hover:bg-rani-cream text-rani-muted hover:text-rani-navy transition-colors"
                title="Call"
              >
                <Phone className="w-3.5 h-3.5" />
              </a>
              <a
                href={`sms:${client.phone}`}
                className="p-1.5 rounded-lg hover:bg-rani-cream text-rani-muted hover:text-rani-navy transition-colors"
                title="Text"
              >
                <MessageSquare className="w-3.5 h-3.5" />
              </a>
            </>
          )}
          {client.email && (
            <a
              href={`mailto:${client.email}`}
              className="p-1.5 rounded-lg hover:bg-rani-cream text-rani-muted hover:text-rani-navy transition-colors"
              title="Email"
            >
              <Mail className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </td>
    </tr>
  );
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-rani-border p-4">
      <div className="flex items-center gap-2 text-rani-muted mb-1">
        {icon}
        <span className="text-xs font-body">{label}</span>
      </div>
      <div className="text-xl font-heading text-rani-navy">{value}</div>
      {sub && <div className="text-[10px] font-body text-rani-muted mt-0.5">{sub}</div>}
    </div>
  );
}
