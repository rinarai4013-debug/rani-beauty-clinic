'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  email: string;
  plan: 'starter' | 'growth' | 'enterprise';
  status: 'active' | 'trial' | 'suspended' | 'churned';
  mrr: number;
  aiCalls: number;
  lastActive: string;
  createdAt: string;
  location: string;
}

interface TenantTableProps {
  tenants: Tenant[];
  onStatusChange?: (id: string, status: Tenant['status']) => void;
}

const statusConfig: Record<Tenant['status'], { label: string; bg: string; text: string; dot: string }> = {
  active: { label: 'Active', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  trial: { label: 'Trial', bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  suspended: { label: 'Suspended', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  churned: { label: 'Churned', bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
};

const planConfig: Record<Tenant['plan'], { label: string; color: string }> = {
  starter: { label: 'Starter', color: 'text-gray-600' },
  growth: { label: 'Growth', color: 'text-blue-600' },
  enterprise: { label: 'Enterprise', color: 'text-purple-600' },
};

const defaultTenants: Tenant[] = [
  { id: 't_001', name: 'Glow Medical Spa', slug: 'glow-medical', email: 'admin@glowmedspa.com', plan: 'growth', status: 'active', mrr: 499, aiCalls: 3240, lastActive: '2026-03-24T10:30:00Z', createdAt: '2025-10-15', location: 'Seattle, WA' },
  { id: 't_002', name: 'Radiance Aesthetics', slug: 'radiance', email: 'hello@radianceaesthetics.com', plan: 'enterprise', status: 'active', mrr: 999, aiCalls: 8760, lastActive: '2026-03-24T09:15:00Z', createdAt: '2025-09-01', location: 'Portland, OR' },
  { id: 't_003', name: 'Luxe Skin Studio', slug: 'luxe-skin', email: 'ops@luxeskinstudio.com', plan: 'starter', status: 'trial', mrr: 0, aiCalls: 420, lastActive: '2026-03-23T16:45:00Z', createdAt: '2026-03-10', location: 'San Francisco, CA' },
  { id: 't_004', name: 'Derma Elite Clinic', slug: 'derma-elite', email: 'admin@dermaelite.com', plan: 'growth', status: 'active', mrr: 499, aiCalls: 5100, lastActive: '2026-03-24T08:00:00Z', createdAt: '2025-11-20', location: 'Austin, TX' },
  { id: 't_005', name: 'Bella Vita Med Spa', slug: 'bella-vita', email: 'info@bellavitamedspa.com', plan: 'growth', status: 'suspended', mrr: 499, aiCalls: 0, lastActive: '2026-02-28T14:00:00Z', createdAt: '2025-12-01', location: 'Miami, FL' },
  { id: 't_006', name: 'Pure Aesthetics', slug: 'pure-aesthetics', email: 'team@pureaesthetics.com', plan: 'starter', status: 'churned', mrr: 0, aiCalls: 0, lastActive: '2026-01-15T12:00:00Z', createdAt: '2025-08-15', location: 'Denver, CO' },
  { id: 't_007', name: 'Zen Medspa & Wellness', slug: 'zen-medspa', email: 'hello@zenmedspa.com', plan: 'enterprise', status: 'active', mrr: 999, aiCalls: 12300, lastActive: '2026-03-24T11:00:00Z', createdAt: '2025-09-15', location: 'Los Angeles, CA' },
  { id: 't_008', name: 'Aura Skin Clinic', slug: 'aura-skin', email: 'admin@auraskin.com', plan: 'starter', status: 'active', mrr: 199, aiCalls: 1560, lastActive: '2026-03-23T18:30:00Z', createdAt: '2026-01-05', location: 'Chicago, IL' },
];

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export default function TenantTable({ tenants = defaultTenants, onStatusChange }: TenantTableProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<Tenant['status'] | 'all'>('all');
  const [planFilter, setPlanFilter] = useState<Tenant['plan'] | 'all'>('all');
  const [sortField, setSortField] = useState<'name' | 'mrr' | 'lastActive' | 'aiCalls'>('lastActive');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const filtered = useMemo(() => {
    let result = [...tenants];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) => t.name.toLowerCase().includes(q) || t.email.toLowerCase().includes(q) || t.location.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') result = result.filter((t) => t.status === statusFilter);
    if (planFilter !== 'all') result = result.filter((t) => t.plan === planFilter);
    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortField === 'mrr') cmp = a.mrr - b.mrr;
      else if (sortField === 'aiCalls') cmp = a.aiCalls - b.aiCalls;
      else cmp = new Date(a.lastActive).getTime() - new Date(b.lastActive).getTime();
      return sortDir === 'desc' ? -cmp : cmp;
    });
    return result;
  }, [tenants, search, statusFilter, planFilter, sortField, sortDir]);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ field }: { field: typeof sortField }) => (
    <span className="ml-1 text-gray-400">
      {sortField === field ? (sortDir === 'desc' ? '↓' : '↑') : '↕'}
    </span>
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Filters */}
      <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search tenants..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F1D2C]/20 focus:border-[#0F1D2C]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0F1D2C]/20"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="trial">Trial</option>
          <option value="suspended">Suspended</option>
          <option value="churned">Churned</option>
        </select>
        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value as any)}
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0F1D2C]/20"
        >
          <option value="all">All Plans</option>
          <option value="starter">Starter</option>
          <option value="growth">Growth</option>
          <option value="enterprise">Enterprise</option>
        </select>
        <span className="text-xs text-gray-500">{filtered.length} tenant{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50/50">
              <th className="text-left px-4 py-3 font-medium text-gray-500">
                <button onClick={() => handleSort('name')} className="flex items-center hover:text-gray-900">
                  Clinic <SortIcon field="name" />
                </button>
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Plan</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">
                <button onClick={() => handleSort('mrr')} className="flex items-center ml-auto hover:text-gray-900">
                  MRR <SortIcon field="mrr" />
                </button>
              </th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">
                <button onClick={() => handleSort('aiCalls')} className="flex items-center ml-auto hover:text-gray-900">
                  AI Calls <SortIcon field="aiCalls" />
                </button>
              </th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">
                <button onClick={() => handleSort('lastActive')} className="flex items-center ml-auto hover:text-gray-900">
                  Last Active <SortIcon field="lastActive" />
                </button>
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((tenant) => {
              const status = statusConfig[tenant.status];
              const plan = planConfig[tenant.plan];
              return (
                <tr key={tenant.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3.5">
                    <div>
                      <Link
                        href={`/admin/tenants/${tenant.id}`}
                        className="font-medium text-gray-900 hover:text-[#0F1D2C] hover:underline"
                      >
                        {tenant.name}
                      </Link>
                      <p className="text-xs text-gray-500 mt-0.5">{tenant.location}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                      {status.label}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`text-xs font-semibold ${plan.color}`}>{plan.label}</span>
                  </td>
                  <td className="px-4 py-3.5 text-right font-medium text-gray-900">
                    {tenant.mrr > 0 ? `$${tenant.mrr}` : '--'}
                  </td>
                  <td className="px-4 py-3.5 text-right text-gray-600">
                    {tenant.aiCalls > 0 ? tenant.aiCalls.toLocaleString() : '--'}
                  </td>
                  <td className="px-4 py-3.5 text-right text-gray-500 text-xs">
                    {timeAgo(tenant.lastActive)}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <Link
                      href={`/admin/tenants/${tenant.id}`}
                      className="text-xs text-[#0F1D2C] font-medium hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-400 text-sm">
                  No tenants match your filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
