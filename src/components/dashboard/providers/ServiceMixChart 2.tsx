'use client';

import { motion } from 'framer-motion';

interface ServiceMixChartProps {
  services: { service: string; count: number; revenue: number; percentOfTotal: number }[];
  maxItems?: number;
}

const COLORS = ['#C9A96E', '#0F1D2C', '#6B7280', '#D4A574', '#1E3A5F', '#9CA3AF', '#B8860B', '#2C5F8A'];

export default function ServiceMixChart({ services, maxItems = 8 }: ServiceMixChartProps) {
  const displayed = services.slice(0, maxItems);

  return (
    <div className="space-y-3">
      {displayed.map((service, i) => (
        <div key={service.service} className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-sm font-body text-rani-navy truncate max-w-[200px]">{service.service}</span>
            <div className="flex items-center gap-3">
              <span className="text-xs font-body text-rani-muted">{service.count} appts</span>
              <span className="text-sm font-display font-semibold text-rani-navy">
                ${service.revenue.toLocaleString()}
              </span>
            </div>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: COLORS[i % COLORS.length] }}
              initial={{ width: 0 }}
              animate={{ width: `${service.percentOfTotal}%` }}
              transition={{ duration: 0.6, delay: i * 0.05 }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
