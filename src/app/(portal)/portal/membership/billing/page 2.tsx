'use client';

import { useEffect, useState } from 'react';
import { CreditCard, Plus, Trash2, Star, Calendar, Shield } from 'lucide-react';

interface BillingData {
  paymentMethods: {
    id: string;
    brand: string;
    last4: string;
    expiryMonth: number;
    expiryYear: number;
    isDefault: boolean;
  }[];
  currentPlan: {
    tier: string;
    monthlyRate: number;
    billingCycle: string;
    nextBillingDate: string;
  };
  invoices: {
    id: string;
    amount: number;
    status: string;
    date: string;
    description: string;
  }[];
  canPause: boolean;
  pauseMonthsRemaining: number;
}

export default function PortalBillingPage() {
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/patient/membership/billing');
        const json = await res.json();
        setData(json);
      } catch (e) {
        console.error('Failed to load billing:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-gray-200 rounded-lg" />
        <div className="h-32 bg-gray-100 rounded-2xl" />
        <div className="h-48 bg-gray-100 rounded-2xl" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <CreditCard className="w-5 h-5 text-rani-gold" />
        <h1 className="text-xl font-heading font-bold text-rani-navy">Billing & Payments</h1>
      </div>

      {/* Current plan */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-heading font-semibold text-rani-navy">Current Plan</h3>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-body font-bold bg-emerald-100 text-emerald-700 capitalize">
            {data.currentPlan.billingCycle}
          </span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-heading font-bold text-rani-navy">
            ${data.currentPlan.monthlyRate}
          </span>
          <span className="text-sm font-body text-gray-500">/mo</span>
        </div>
        <div className="flex items-center gap-1 mt-2 text-xs font-body text-gray-500">
          <Calendar className="w-3.5 h-3.5" />
          Next billing: {new Date(data.currentPlan.nextBillingDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </div>
      </div>

      {/* Payment methods */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-heading font-semibold text-rani-navy">Payment Methods</h3>
          <button className="flex items-center gap-1 text-xs font-body font-medium text-rani-gold hover:text-rani-gold/80">
            <Plus className="w-3.5 h-3.5" />
            Add Card
          </button>
        </div>
        <div className="space-y-3">
          {data.paymentMethods.map((method) => (
            <div key={method.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-7 bg-gray-200 rounded flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-gray-500" />
                </div>
                <div>
                  <p className="text-sm font-body font-medium text-gray-900">
                    {method.brand} ending in {method.last4}
                  </p>
                  <p className="text-xs font-body text-gray-500">
                    Expires {method.expiryMonth}/{method.expiryYear}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {method.isDefault && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-body font-bold bg-blue-100 text-blue-700">
                    <Star className="w-3 h-3" /> Default
                  </span>
                )}
                {!method.isDefault && (
                  <button className="text-xs font-body text-gray-500 hover:text-gray-700">Set Default</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Billing history */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h3 className="text-sm font-heading font-semibold text-rani-navy">Billing History</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {data.invoices.map((inv) => (
            <div key={inv.id} className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-body font-medium text-gray-900">{inv.description}</p>
                <p className="text-xs font-body text-gray-500">
                  {new Date(inv.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-body font-bold ${
                  inv.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                  inv.status === 'failed' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {inv.status.toUpperCase()}
                </span>
                <span className="text-sm font-body font-semibold text-gray-900">${inv.amount}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Membership actions */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h3 className="text-sm font-heading font-semibold text-rani-navy mb-4">Membership Actions</h3>
        <div className="space-y-3">
          {data.canPause && (
            <button className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-500" />
                <div className="text-left">
                  <p className="text-sm font-body font-medium text-gray-900">Pause Membership</p>
                  <p className="text-xs font-body text-gray-500">
                    {data.pauseMonthsRemaining} pause month(s) remaining this year
                  </p>
                </div>
              </div>
            </button>
          )}
          <button className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-500" />
              <div className="text-left">
                <p className="text-sm font-body font-medium text-gray-900">Switch to Annual Billing</p>
                <p className="text-xs font-body text-gray-500">Save 2 months per year</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
