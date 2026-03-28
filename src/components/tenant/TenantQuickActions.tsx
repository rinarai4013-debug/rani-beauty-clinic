/**
 * Tenant Quick Actions Component
 */

'use client';

import Link from 'next/link';
import type { QuickAction } from '@/lib/saas/tenant-dashboard/overview';

interface TenantQuickActionsProps {
  actions?: QuickAction[];
}

export function TenantQuickActions({ actions }: TenantQuickActionsProps) {
  if (!actions || actions.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Quick Actions</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {actions.map((action) => (
          <Link
            key={action.type}
            href={action.href}
            className="flex flex-col items-center gap-1.5 p-3 rounded-lg hover:bg-gray-50 transition-colors text-center"
          >
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
              <span className="text-xs font-bold">{action.icon.slice(0, 2)}</span>
            </div>
            <span className="text-xs font-medium text-gray-700">{action.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
