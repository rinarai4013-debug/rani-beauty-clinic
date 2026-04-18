'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, UserX, ChevronRight, TrendingDown } from 'lucide-react';
import { useAtRiskClients } from '@/hooks/useDashboardData';
import Link from 'next/link';

interface AtRiskClient {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  daysSinceLastVisit: number;
  ltv: number;
  urgency: 'critical' | 'high' | 'medium' | 'low';
  lastService: string;
  membershipTier: string;
}

const URGENCY_CONFIG = {
  critical: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    badge: 'bg-red-100 text-red-700',
    dot: 'bg-red-500',
    label: 'Churned',
  },
  high: {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    badge: 'bg-orange-100 text-orange-700',
    dot: 'bg-orange-500',
    label: '90+ Days',
  },
  medium: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    badge: 'bg-amber-100 text-amber-700',
    dot: 'bg-amber-500',
    label: '60+ Days',
  },
  low: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    badge: 'bg-yellow-100 text-yellow-700',
    dot: 'bg-yellow-500',
    label: '30+ Days',
  },
};

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

export default function AtRiskClientsPanel() {
  const { data, isLoading } = useAtRiskClients();
  const clients = (data as { clients?: AtRiskClient[] })?.clients || [];

  const criticalCount = clients.filter(c => c.urgency === 'critical').length;
  const highCount = clients.filter(c => c.urgency === 'high').length;
  const totalAtRisk = clients.length;
  const atRiskLTV = clients.reduce((sum, c) => sum + (c.ltv || 0), 0);

  if (isLoading) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-40" />
          <div className="h-24 bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5">
        <div className="flex items-center gap-2 mb-3">
          <TrendingDown className="w-4 h-4 text-rani-gold-accessible" />
          <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider">
            At-Risk Clients
          </h3>
        </div>
        <p className="text-sm font-body text-rani-muted">No at-risk clients detected. Your retention is strong.</p>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-rani-gold-accessible" />
          <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider">
            At-Risk Clients
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {criticalCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-body font-semibold">
              {criticalCount} Churned
            </span>
          )}
          {highCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-[10px] font-body font-semibold">
              {highCount} Critical
            </span>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-rani-cream/50 rounded-lg p-3 text-center">
          <p className="text-lg font-heading text-rani-navy">{totalAtRisk}</p>
          <p className="text-[10px] font-body text-rani-muted uppercase">At Risk</p>
        </div>
        <div className="bg-rani-cream/50 rounded-lg p-3 text-center">
          <p className="text-lg font-heading text-rani-navy">{formatCurrency(atRiskLTV)}</p>
          <p className="text-[10px] font-body text-rani-muted uppercase">LTV at Risk</p>
        </div>
      </div>

      {/* Client List */}
      <div className="space-y-2">
        {clients.slice(0, 5).map((client, i) => {
          const config = URGENCY_CONFIG[client.urgency];
          return (
            <motion.div
              key={client.id || i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                href={`/dashboard/clients/${client.id}`}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-all hover:shadow-sm ${config.bg} ${config.border}`}
              >
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${config.dot}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-body font-medium text-rani-navy truncate">{client.name}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-body font-semibold ${config.badge}`}>
                      {config.label}
                    </span>
                  </div>
                  <p className="text-xs font-body text-rani-muted truncate">
                    {client.daysSinceLastVisit}d ago &middot; {formatCurrency(client.ltv)} LTV
                    {client.lastService ? ` &middot; Last: ${client.lastService}` : ''}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-rani-muted flex-shrink-0" />
              </Link>
            </motion.div>
          );
        })}
      </div>

      {totalAtRisk > 5 && (
        <p className="text-center text-xs font-body text-rani-muted mt-3">
          +{totalAtRisk - 5} more at-risk clients
        </p>
      )}
    </div>
  );
}
