'use client';

import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, Award, Gift } from 'lucide-react';

interface CompensationBreakdownProps {
  baseSalary: number;
  serviceCommission: number;
  productCommission: number;
  membershipBonuses: number;
  performanceBonuses: number;
  tips: number;
  grossPay: number;
  estimatedTaxes: number;
  netPay: number;
  commissionTier: string;
  commissionRate: number;
}

export default function CompensationBreakdown({
  baseSalary, serviceCommission, productCommission, membershipBonuses,
  performanceBonuses, tips, grossPay, estimatedTaxes, netPay, commissionTier, commissionRate,
}: CompensationBreakdownProps) {
  const items = [
    { label: 'Base Salary', value: baseSalary, icon: DollarSign, color: '#0F1D2C' },
    { label: 'Service Commission', value: serviceCommission, icon: TrendingUp, color: '#C9A96E', subtitle: `${commissionTier} @ ${(commissionRate * 100).toFixed(0)}%` },
    { label: 'Product Commission', value: productCommission, icon: TrendingUp, color: '#6B7280' },
    { label: 'Membership Bonuses', value: membershipBonuses, icon: Award, color: '#059669' },
    { label: 'Performance Bonuses', value: performanceBonuses, icon: Award, color: '#7C3AED' },
    { label: 'Tips', value: tips, icon: Gift, color: '#EC4899' },
  ];

  return (
    <div className="space-y-4">
      {items.map((item, i) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${item.color}15` }}>
              <item.icon className="w-4 h-4" style={{ color: item.color }} />
            </div>
            <div>
              <p className="text-sm font-body text-rani-navy">{item.label}</p>
              {item.subtitle && <p className="text-xs text-rani-muted font-body">{item.subtitle}</p>}
            </div>
          </div>
          <span className="font-display font-semibold text-rani-navy">
            ${item.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </motion.div>
      ))}

      <div className="border-t border-gray-200 pt-3 mt-3 space-y-2">
        <div className="flex justify-between">
          <span className="font-body font-semibold text-rani-navy">Gross Pay</span>
          <span className="font-display font-bold text-rani-navy text-lg">
            ${grossPay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="font-body text-rani-muted">Est. Tax Withholding</span>
          <span className="font-body text-red-500">
            -${estimatedTaxes.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex justify-between border-t border-gray-100 pt-2">
          <span className="font-body font-semibold text-rani-navy">Est. Net Pay</span>
          <span className="font-display font-bold text-green-600 text-lg">
            ${netPay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    </div>
  );
}
