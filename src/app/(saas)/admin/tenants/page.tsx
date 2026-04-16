'use client';

import { useState } from 'react';
import TenantTable, { Tenant } from '@/components/saas/TenantTable';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';

const allTenants: Tenant[] = [
  { id: 't_001', name: 'Glow Medical Spa', slug: 'glow-medical', email: 'admin@glowmedspa.com', plan: 'growth', status: 'active', mrr: 499, aiCalls: 3240, lastActive: '2026-03-24T10:30:00Z', createdAt: '2025-10-15', location: 'Seattle, WA' },
  { id: 't_002', name: 'Radiance Aesthetics', slug: 'radiance', email: 'hello@radianceaesthetics.com', plan: 'enterprise', status: 'active', mrr: 999, aiCalls: 8760, lastActive: '2026-03-24T09:15:00Z', createdAt: '2025-09-01', location: 'Portland, OR' },
  { id: 't_003', name: 'Luxe Skin Studio', slug: 'luxe-skin', email: 'ops@luxeskinstudio.com', plan: 'starter', status: 'trial', mrr: 0, aiCalls: 420, lastActive: '2026-03-23T16:45:00Z', createdAt: '2026-03-10', location: 'San Francisco, CA' },
  { id: 't_004', name: 'Derma Elite Clinic', slug: 'derma-elite', email: 'admin@dermaelite.com', plan: 'growth', status: 'active', mrr: 499, aiCalls: 5100, lastActive: '2026-03-24T08:00:00Z', createdAt: '2025-11-20', location: 'Austin, TX' },
  { id: 't_005', name: 'Bella Vita Med Spa', slug: 'bella-vita', email: 'info@bellavitamedspa.com', plan: 'growth', status: 'suspended', mrr: 499, aiCalls: 0, lastActive: '2026-02-28T14:00:00Z', createdAt: '2025-12-01', location: 'Miami, FL' },
  { id: 't_006', name: 'Pure Aesthetics', slug: 'pure-aesthetics', email: 'team@pureaesthetics.com', plan: 'starter', status: 'churned', mrr: 0, aiCalls: 0, lastActive: '2026-01-15T12:00:00Z', createdAt: '2025-08-15', location: 'Denver, CO' },
  { id: 't_007', name: 'Zen Medspa & Wellness', slug: 'zen-medspa', email: 'hello@zenmedspa.com', plan: 'enterprise', status: 'active', mrr: 999, aiCalls: 12300, lastActive: '2026-03-24T11:00:00Z', createdAt: '2025-09-15', location: 'Los Angeles, CA' },
  { id: 't_008', name: 'Aura Skin Clinic', slug: 'aura-skin', email: 'admin@auraskin.com', plan: 'starter', status: 'active', mrr: 199, aiCalls: 1560, lastActive: '2026-03-23T18:30:00Z', createdAt: '2026-01-05', location: 'Chicago, IL' },
  { id: 't_009', name: 'Ethereal Med Aesthetics', slug: 'ethereal', email: 'hello@etherealmed.com', plan: 'growth', status: 'active', mrr: 499, aiCalls: 4200, lastActive: '2026-03-24T07:00:00Z', createdAt: '2025-11-01', location: 'New York, NY' },
  { id: 't_010', name: 'Serenity Skin Lab', slug: 'serenity', email: 'ops@serenityskinlab.com', plan: 'starter', status: 'trial', mrr: 0, aiCalls: 180, lastActive: '2026-03-22T14:00:00Z', createdAt: '2026-03-18', location: 'Nashville, TN' },
  { id: 't_011', name: 'Velvet Touch Clinic', slug: 'velvet-touch', email: 'info@velvettouch.com', plan: 'enterprise', status: 'active', mrr: 999, aiCalls: 9800, lastActive: '2026-03-24T06:30:00Z', createdAt: '2025-10-01', location: 'Dallas, TX' },
  { id: 't_012', name: 'Bloom Med Spa', slug: 'bloom', email: 'team@bloommedspa.com', plan: 'growth', status: 'active', mrr: 499, aiCalls: 6100, lastActive: '2026-03-24T10:00:00Z', createdAt: '2025-12-15', location: 'Atlanta, GA' },
];

const planDistribution = [
  { name: 'Starter', value: 15, color: '#6B7280' },
  { name: 'Growth', value: 22, color: '#3B82F6' },
  { name: 'Enterprise', value: 10, color: '#7C3AED' },
];

const statusDistribution = [
  { name: 'Active', value: 34, color: '#059669' },
  { name: 'Trial', value: 8, color: '#3B82F6' },
  { name: 'Suspended', value: 3, color: '#F59E0B' },
  { name: 'Churned', value: 2, color: '#EF4444' },
];

export default function TenantsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tenant Management</h1>
          <p className="text-sm text-gray-500 mt-1">47 total clinics on the platform</p>
        </div>
        <button className="px-4 py-2.5 bg-[#0F1D2C] text-white text-sm font-medium rounded-xl hover:bg-[#1A2A3C] transition-colors">
          + Add Tenant
        </button>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Plan Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={planDistribution}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {planDistribution.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={((value: number, name: string) => [`${value} clinics`, name]) as never}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Status Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={statusDistribution}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {statusDistribution.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={((value: number, name: string) => [`${value} clinics`, name]) as never}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tenant Table */}
      <TenantTable tenants={allTenants} />
    </div>
  );
}
