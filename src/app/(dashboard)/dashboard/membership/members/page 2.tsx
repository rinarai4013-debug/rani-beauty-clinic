'use client';

import { useState } from 'react';
import { Users, Search, Filter, Download } from 'lucide-react';
import { DashboardErrorBoundary, InlineError, StatRowSkeleton } from '@/components/dashboard/shared';
import MemberCard from '@/components/dashboard/membership/MemberCard';
import { useDashboardData } from '@/hooks/useDashboardData';
import type { MembershipTier, MembershipStatus } from '@/lib/membership/plans';

interface MemberListItem {
  memberId: string;
  clientId: string;
  clientName: string;
  email: string;
  tier: MembershipTier;
  status: MembershipStatus;
  joinDate: string;
  monthlyRate: number;
  creditUsageRate: number;
  churnRisk: 'low' | 'moderate' | 'high' | 'critical';
  churnScore: number;
  lastVisitDate?: string;
}

interface MemberListData {
  members: MemberListItem[];
  total: number;
  tierCounts: Record<MembershipTier, number>;
  statusCounts: Record<MembershipStatus, number>;
}

export default function MemberListPage() {
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<MembershipTier | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<MembershipStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'churn' | 'credits' | 'date'>('name');

  const { data, isLoading, error, mutate } = useDashboardData<MemberListData>(
    '/membership?action=members',
    { refreshInterval: 120000 },
  );

  const filteredMembers = (data?.members || [])
    .filter(m => {
      if (search && !m.clientName.toLowerCase().includes(search.toLowerCase()) && !m.email.toLowerCase().includes(search.toLowerCase())) return false;
      if (tierFilter !== 'all' && m.tier !== tierFilter) return false;
      if (statusFilter !== 'all' && m.status !== statusFilter) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'churn': return b.churnScore - a.churnScore;
        case 'credits': return a.creditUsageRate - b.creditUsageRate;
        case 'date': return new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime();
        default: return a.clientName.localeCompare(b.clientName);
      }
    });

  return (
    <DashboardErrorBoundary pageName="Members">
      <div className="space-y-6 sm:space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-rani-gold" />
              <h1 className="text-xl sm:text-2xl font-heading text-rani-navy">Members</h1>
            </div>
            <p className="text-xs font-body text-rani-muted mt-1">
              {data ? `${data.total} total members` : 'Loading...'}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rani-muted" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-rani-border text-sm font-body placeholder:text-rani-muted focus:outline-none focus:border-rani-gold"
            />
          </div>
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value as MembershipTier | 'all')}
            className="px-3 py-2 rounded-lg border border-rani-border text-sm font-body text-rani-navy bg-white"
          >
            <option value="all">All Tiers</option>
            <option value="halo">Halo</option>
            <option value="glow">Glow</option>
            <option value="elite">Elite</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as MembershipStatus | 'all')}
            className="px-3 py-2 rounded-lg border border-rani-border text-sm font-body text-rani-navy bg-white"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="past_due">Past Due</option>
            <option value="suspended">Suspended</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-3 py-2 rounded-lg border border-rani-border text-sm font-body text-rani-navy bg-white"
          >
            <option value="name">Sort: Name</option>
            <option value="churn">Sort: Churn Risk</option>
            <option value="credits">Sort: Credit Usage</option>
            <option value="date">Sort: Join Date</option>
          </select>
        </div>

        {error ? (
          <InlineError message="Failed to load members" onRetry={() => mutate()} />
        ) : isLoading ? (
          <div className="space-y-3">{[1, 2, 3].map(i => <StatRowSkeleton key={i} />)}</div>
        ) : (
          <>
            <p className="text-xs font-body text-rani-muted">
              Showing {filteredMembers.length} of {data?.total || 0} members
            </p>
            <div className="space-y-3">
              {filteredMembers.map((member) => (
                <MemberCard
                  key={member.memberId}
                  {...member}
                  onClick={() => window.location.href = `/dashboard/membership/members/${member.memberId}`}
                />
              ))}
              {filteredMembers.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-sm font-body text-rani-muted">No members match your filters</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardErrorBoundary>
  );
}
