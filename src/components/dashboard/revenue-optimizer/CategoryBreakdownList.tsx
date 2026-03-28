'use client';

import type { CategoryBreakdown } from '@/lib/revenue/opportunity-scorer';

interface CategoryBreakdownListProps {
  categories: CategoryBreakdown[];
}

const CATEGORY_LABELS: Record<string, string> = {
  'fill-empty-slot': 'Fill Empty Slots',
  'upsell-existing': 'Upsell Existing Clients',
  'rebook-overdue': 'Rebook Overdue Clients',
  'reactivate-dormant': 'Reactivate Dormant',
  'win-back-lapsed': 'Win Back Lapsed',
  'vip-retention': 'VIP Retention',
  'new-client-acquisition': 'New Client Acquisition',
  'price-optimization': 'Price Optimization',
  'package-conversion': 'Package Conversion',
  'membership-conversion': 'Membership Conversion',
};

export default function CategoryBreakdownList({ categories }: CategoryBreakdownListProps) {
  const maxValue = Math.max(...categories.map(c => c.expectedTotalValue), 1);

  return (
    <div className="space-y-3">
      {categories.map((cat, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-40 flex-shrink-0">
            <p className="text-xs font-body text-rani-navy font-medium">
              {CATEGORY_LABELS[cat.category] || cat.category}
            </p>
            <p className="text-[10px] font-body text-rani-muted">{cat.count} opportunities</p>
          </div>
          <div className="flex-1">
            <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-rani-navy to-rani-gold"
                style={{ width: `${(cat.expectedTotalValue / maxValue) * 100}%` }}
              />
            </div>
          </div>
          <div className="w-20 text-right flex-shrink-0">
            <p className="text-sm font-heading text-rani-navy">${cat.expectedTotalValue.toLocaleString()}</p>
            <p className="text-[10px] font-body text-rani-muted">{cat.avgScore} avg score</p>
          </div>
        </div>
      ))}
    </div>
  );
}
