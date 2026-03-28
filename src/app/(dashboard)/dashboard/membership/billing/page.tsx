'use client';

import { useState } from 'react';
import { DollarSign, AlertTriangle, CreditCard, Clock, RefreshCw } from 'lucide-react';
import { DashboardErrorBoundary, InlineError, ChartSkeleton, StatRowSkeleton } from '@/components/dashboard/shared';
import DunningTimeline from '@/components/dashboard/membership/DunningTimeline';
import { useDashboardData } from '@/hooks/useDashboardData';
import type { MemberBilling } from '@/lib/membership/billing';

interface BillingData {
  summary: {
    totalActive: number;
    totalPaused: number;
    totalSuspended: number;
    totalPastDue: number;
    totalMRR: number;
    failedPayments: number;
    expiringCards: number;
    inGracePeriod: number;
  };
  failedPaymentMembers: (MemberBilling & { clientName: string })[];
  expiringCardMembers: (MemberBilling & { clientName: string })[];
  recentInvoices: {
    id: string;
    clientName: string;
    amount: number;
    status: string;
    date: string;
  }[];
}

export default function MembershipBillingPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'failed' | 'invoices'>('overview');
  const { data, isLoading, error, mutate } = useDashboardData<BillingData>(
    '/membership?action=billing',
    { refreshInterval: 60000 },
  );

  return (
    <DashboardErrorBoundary pageName="Membership Billing">
      <div className="space-y-6 sm:space-y-8">
        <div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-rani-gold" />
            <h1 className="text-xl sm:text-2xl font-heading text-rani-navy">Billing</h1>
          </div>
          <p className="text-xs sm:text-sm font-body text-rani-muted mt-1">
            Membership billing overview, failed payments, and dunning management
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-rani-cream rounded-lg p-1 w-fit">
          {[
            { id: 'overview' as const, label: 'Overview' },
            { id: 'failed' as const, label: 'Failed Payments' },
            { id: 'invoices' as const, label: 'Invoices' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-body font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-rani-navy shadow-sm'
                  : 'text-rani-muted hover:text-rani-text'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {error ? (
          <InlineError message="Failed to load billing data" onRetry={() => mutate()} />
        ) : isLoading || !data ? (
          <div className="space-y-6"><StatRowSkeleton /><ChartSkeleton /></div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Total MRR', value: `$${data.summary.totalMRR.toLocaleString()}`, icon: DollarSign, color: 'text-rani-gold bg-amber-50' },
                { label: 'Failed Payments', value: data.summary.failedPayments.toString(), icon: AlertTriangle, color: data.summary.failedPayments > 0 ? 'text-red-600 bg-red-50' : 'text-emerald-600 bg-emerald-50' },
                { label: 'Expiring Cards', value: data.summary.expiringCards.toString(), icon: CreditCard, color: data.summary.expiringCards > 0 ? 'text-amber-600 bg-amber-50' : 'text-emerald-600 bg-emerald-50' },
                { label: 'In Grace Period', value: data.summary.inGracePeriod.toString(), icon: Clock, color: data.summary.inGracePeriod > 0 ? 'text-orange-600 bg-orange-50' : 'text-emerald-600 bg-emerald-50' },
              ].map((card) => (
                <div key={card.label} className="bg-white rounded-xl border border-rani-border p-3 sm:p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`p-1.5 rounded-lg ${card.color.split(' ')[1]}`}>
                      <card.icon className={`w-3.5 h-3.5 ${card.color.split(' ')[0]}`} />
                    </div>
                    <span className="text-[10px] font-body text-rani-muted uppercase tracking-wide">{card.label}</span>
                  </div>
                  <p className="text-lg font-heading font-bold text-rani-navy">{card.value}</p>
                </div>
              ))}
            </div>

            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Status breakdown */}
                <div className="bg-white rounded-xl border border-rani-border p-4 sm:p-6">
                  <h3 className="text-sm font-heading font-semibold text-rani-navy mb-4">Member Status</h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Active', count: data.summary.totalActive, color: 'bg-emerald-500' },
                      { label: 'Past Due', count: data.summary.totalPastDue, color: 'bg-amber-500' },
                      { label: 'Paused', count: data.summary.totalPaused, color: 'bg-gray-400' },
                      { label: 'Suspended', count: data.summary.totalSuspended, color: 'bg-red-500' },
                    ].map((item) => {
                      const total = data.summary.totalActive + data.summary.totalPastDue + data.summary.totalPaused + data.summary.totalSuspended;
                      const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
                      return (
                        <div key={item.label} className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${item.color}`} />
                          <span className="text-sm font-body text-rani-text flex-1">{item.label}</span>
                          <span className="text-sm font-body font-semibold text-rani-navy">{item.count}</span>
                          <span className="text-xs font-body text-rani-muted w-10 text-right">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <DunningTimeline
                  currentStep={0}
                  membersInDunning={data.summary.failedPayments}
                />
              </div>
            )}

            {activeTab === 'failed' && (
              <div className="bg-white rounded-xl border border-rani-border overflow-hidden">
                <div className="p-4 border-b border-rani-border">
                  <h3 className="text-sm font-heading font-semibold text-rani-navy">Failed Payment Members</h3>
                </div>
                {data.failedPaymentMembers.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-sm font-body text-rani-muted">No failed payments — all billing healthy</p>
                  </div>
                ) : (
                  <div className="divide-y divide-rani-border">
                    {data.failedPaymentMembers.map((member) => (
                      <div key={member.memberId} className="p-4 flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-body font-semibold text-rani-navy">{member.clientName}</h4>
                          <p className="text-xs font-body text-rani-muted">
                            {member.failedPaymentCount} failed attempt(s) · ${member.monthlyRate}/mo
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-body font-bold ${
                            member.failedPaymentCount >= 3 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {member.failedPaymentCount >= 3 ? 'SUSPEND' : `Retry ${member.failedPaymentCount}`}
                          </span>
                          <button className="flex items-center gap-1 px-2 py-1 rounded text-xs font-body font-medium text-rani-gold hover:bg-rani-cream transition-colors">
                            <RefreshCw className="w-3 h-3" />
                            Retry
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'invoices' && (
              <div className="bg-white rounded-xl border border-rani-border overflow-hidden">
                <div className="p-4 border-b border-rani-border">
                  <h3 className="text-sm font-heading font-semibold text-rani-navy">Recent Invoices</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-rani-cream/50">
                        <th className="text-left p-3 font-body font-medium text-rani-muted">Member</th>
                        <th className="text-left p-3 font-body font-medium text-rani-muted">Amount</th>
                        <th className="text-left p-3 font-body font-medium text-rani-muted">Status</th>
                        <th className="text-left p-3 font-body font-medium text-rani-muted">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-rani-border">
                      {(data.recentInvoices || []).map((inv) => (
                        <tr key={inv.id}>
                          <td className="p-3 font-body text-rani-navy">{inv.clientName}</td>
                          <td className="p-3 font-body font-semibold text-rani-navy">${inv.amount}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-body font-bold ${
                              inv.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                              inv.status === 'failed' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {inv.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="p-3 font-body text-rani-muted text-xs">
                            {new Date(inv.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardErrorBoundary>
  );
}
