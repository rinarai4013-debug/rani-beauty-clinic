'use client';

import { useState } from 'react';
import Link from 'next/link';
import MRRChart from '@/components/saas/MRRChart';
import TenantTable from '@/components/saas/TenantTable';

// KPI data
const kpis = [
  {
    label: 'Total Tenants',
    value: '47',
    change: '+8',
    changeLabel: 'this month',
    positive: true,
    icon: '🏢',
  },
  {
    label: 'Monthly Recurring Revenue',
    value: '$42,800',
    change: '+23.7%',
    changeLabel: 'vs last month',
    positive: true,
    icon: '💰',
  },
  {
    label: 'Churn Rate',
    value: '3.2%',
    change: '-0.8%',
    changeLabel: 'vs last month',
    positive: true,
    icon: '📉',
  },
  {
    label: 'New Signups',
    value: '12',
    change: '+4',
    changeLabel: 'vs last month',
    positive: true,
    icon: '🚀',
  },
];

const systemHealth = [
  { service: 'Airtable API', status: 'operational' as const, latency: '45ms', uptime: '99.98%' },
  { service: 'Stripe Billing', status: 'operational' as const, latency: '120ms', uptime: '99.99%' },
  { service: 'Claude AI API', status: 'operational' as const, latency: '890ms', uptime: '99.95%' },
  { service: 'Vapi Voice AI', status: 'operational' as const, latency: '210ms', uptime: '99.90%' },
  { service: 'Twilio SMS', status: 'operational' as const, latency: '95ms', uptime: '99.97%' },
  { service: 'n8n Workflows', status: 'degraded' as const, latency: '1.2s', uptime: '99.80%' },
];

const recentActivity = [
  { time: '2 min ago', text: 'Zen Medspa upgraded to Enterprise', type: 'upgrade' },
  { time: '15 min ago', text: 'Luxe Skin Studio started free trial', type: 'signup' },
  { time: '1 hour ago', text: 'Failed payment: Bella Vita Med Spa', type: 'alert' },
  { time: '2 hours ago', text: 'Derma Elite hit 5,000 AI calls this month', type: 'milestone' },
  { time: '3 hours ago', text: 'Glow Medical Spa renewed annual plan', type: 'renewal' },
  { time: '5 hours ago', text: 'Pure Aesthetics account churned', type: 'churn' },
];

const activityColors: Record<string, string> = {
  upgrade: 'text-purple-600 bg-purple-50',
  signup: 'text-blue-600 bg-blue-50',
  alert: 'text-red-600 bg-red-50',
  milestone: 'text-amber-600 bg-amber-50',
  renewal: 'text-emerald-600 bg-emerald-50',
  churn: 'text-red-600 bg-red-50',
};

const activityIcons: Record<string, string> = {
  upgrade: '⬆️',
  signup: '✨',
  alert: '⚠️',
  milestone: '🎯',
  renewal: '🔄',
  churn: '💔',
};

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Platform Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          RaniOS super-admin overview. Last updated: just now
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{kpi.icon}</span>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  kpi.positive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                }`}
              >
                {kpi.change}
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
            <p className="text-xs text-gray-500 mt-1">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* MRR Chart + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MRRChart data={[
            { month: 'Sep 25', mrr: 12400, newMRR: 2800, churnedMRR: 600, expansionMRR: 400 },
            { month: 'Oct 25', mrr: 15800, newMRR: 4200, churnedMRR: 800, expansionMRR: 600 },
            { month: 'Nov 25', mrr: 19600, newMRR: 4800, churnedMRR: 1000, expansionMRR: 800 },
            { month: 'Dec 25', mrr: 23200, newMRR: 4600, churnedMRR: 1000, expansionMRR: 1200 },
            { month: 'Jan 26', mrr: 28400, newMRR: 6200, churnedMRR: 1000, expansionMRR: 1400 },
            { month: 'Feb 26', mrr: 34600, newMRR: 7400, churnedMRR: 1200, expansionMRR: 1600 },
            { month: 'Mar 26', mrr: 42800, newMRR: 9800, churnedMRR: 1600, expansionMRR: 2000 },
          ]} />
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {recentActivity.map((activity, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs ${activityColors[activity.type]}`}>
                  {activityIcons[activity.type]}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 leading-snug">{activity.text}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* System Health */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900">System Health</h3>
          <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2.5 py-1 rounded-full">
            5/6 Operational
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {systemHealth.map((svc) => (
            <div
              key={svc.service}
              className={`flex items-center justify-between p-3 rounded-xl ${
                svc.status === 'operational' ? 'bg-gray-50' : 'bg-amber-50 border border-amber-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    svc.status === 'operational' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
                  }`}
                />
                <span className="text-sm font-medium text-gray-700">{svc.service}</span>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">{svc.latency}</p>
                <p className="text-[10px] text-gray-400">{svc.uptime}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tenant List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900">Tenants</h3>
          <Link
            href="/admin/tenants"
            className="text-xs text-[#0F1D2C] font-medium hover:underline"
          >
            View All
          </Link>
        </div>
        <TenantTable tenants={[]} />
      </div>
    </div>
  );
}
