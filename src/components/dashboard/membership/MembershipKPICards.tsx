'use client';

import { DollarSign, Users, TrendingDown, TrendingUp, ArrowUp, ArrowDown } from 'lucide-react';

interface KPICardData {
  label: string;
  value: string;
  change?: number;
  changeLabel?: string;
  icon: typeof DollarSign;
  iconColor: string;
}

interface MembershipKPICardsProps {
  mrr: number;
  mrrGrowth: number;
  activeMembers: number;
  churnRate: number;
  netRevenueRetention: number;
  averageLTV: number;
}

export default function MembershipKPICards({
  mrr,
  mrrGrowth,
  activeMembers,
  churnRate,
  netRevenueRetention,
  averageLTV,
}: MembershipKPICardsProps) {
  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

  const cards: KPICardData[] = [
    {
      label: 'MRR',
      value: formatCurrency(mrr),
      change: mrrGrowth,
      changeLabel: 'vs last month',
      icon: DollarSign,
      iconColor: 'text-rani-gold-accessible bg-amber-50',
    },
    {
      label: 'Active Members',
      value: activeMembers.toLocaleString(),
      icon: Users,
      iconColor: 'text-blue-600 bg-blue-50',
    },
    {
      label: 'Monthly Churn',
      value: `${churnRate}%`,
      icon: TrendingDown,
      iconColor: churnRate > 5 ? 'text-red-600 bg-red-50' : churnRate > 3 ? 'text-amber-600 bg-amber-50' : 'text-emerald-600 bg-emerald-50',
    },
    {
      label: 'Net Revenue Retention',
      value: `${netRevenueRetention}%`,
      icon: TrendingUp,
      iconColor: netRevenueRetention >= 100 ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50',
    },
    {
      label: 'Average LTV',
      value: formatCurrency(averageLTV),
      icon: DollarSign,
      iconColor: 'text-purple-600 bg-purple-50',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
      {cards.map((card) => (
        <div key={card.label} className="bg-white rounded-xl border border-rani-border p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className={`p-1.5 rounded-lg ${card.iconColor.split(' ')[1]}`}>
              <card.icon className={`w-3.5 h-3.5 ${card.iconColor.split(' ')[0]}`} />
            </div>
            <span className="text-[10px] sm:text-xs font-body text-rani-muted uppercase tracking-wide">
              {card.label}
            </span>
          </div>
          <p className="text-lg sm:text-xl font-heading font-bold text-rani-navy">{card.value}</p>
          {card.change !== undefined && (
            <div className="flex items-center gap-1 mt-1">
              {card.change >= 0 ? (
                <ArrowUp className="w-3 h-3 text-emerald-500" />
              ) : (
                <ArrowDown className="w-3 h-3 text-red-500" />
              )}
              <span className={`text-[10px] font-body font-medium ${
                card.change >= 0 ? 'text-emerald-600' : 'text-red-600'
              }`}>
                {Math.abs(card.change)}% {card.changeLabel}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
