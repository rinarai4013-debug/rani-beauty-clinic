'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import QuickBooksConnect from '@/components/dashboard/finance/QuickBooksConnect';
import SyncStatus from '@/components/dashboard/finance/SyncStatus';
import PnLChart from '@/components/dashboard/finance/PnLChart';
import ExpenseBreakdown from '@/components/dashboard/finance/ExpenseBreakdown';
import CashFlowChart from '@/components/dashboard/finance/CashFlowChart';
import PayrollSummary from '@/components/dashboard/finance/PayrollSummary';
import BudgetVsActual from '@/components/dashboard/finance/BudgetVsActual';

function StatusBanner() {
  const searchParams = useSearchParams();
  const connected = searchParams.get('connected');
  const error = searchParams.get('error');

  if (connected === 'true') {
    return (
      <div className="mb-6 rounded-lg bg-green-50 border border-green-200 p-4 text-sm text-green-800">
        Successfully connected to QuickBooks Online. You can now sync your financial data.
      </div>
    );
  }

  if (error) {
    const errorMessages: Record<string, string> = {
      access_denied: 'QuickBooks connection was cancelled. You can try again when ready.',
      missing_params: 'OAuth callback was missing required parameters. Please try connecting again.',
      invalid_state: 'Security validation failed. Please try connecting again.',
    };

    return (
      <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-800">
        {errorMessages[error] || `Connection error: ${error}`}
      </div>
    );
  }

  return null;
}

export default function QuickBooksPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#0F1D2C] font-serif">
          QuickBooks Integration
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Financial data synced from QuickBooks Online
        </p>
      </div>

      {/* Status Banner */}
      <Suspense fallback={null}>
        <StatusBanner />
      </Suspense>

      {/* Connection + Sync */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <QuickBooksConnect />
        <SyncStatus />
      </div>

      {/* Financial Reports */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <PnLChart />
        <ExpenseBreakdown />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <CashFlowChart />
        <BudgetVsActual />
      </div>

      {/* Payroll */}
      <PayrollSummary />
    </div>
  );
}
