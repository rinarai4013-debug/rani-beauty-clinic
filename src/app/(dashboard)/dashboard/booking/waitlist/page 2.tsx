'use client';

import { useWaitlist } from '@/hooks/useBooking';
import WaitlistTable from '@/components/booking/WaitlistTable';

export default function WaitlistPage() {
  const { entries, stats, isLoading, removeFromWaitlist } = useWaitlist();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F1D2C] font-[family-name:var(--font-heading)]">
            Waitlist Management
          </h1>
          <p className="text-sm text-[#6B7280]">
            Manage clients waiting for appointment openings
          </p>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-5 gap-4">
          <StatCard label="Active" value={stats.totalActive} />
          <StatCard label="Notified" value={stats.totalNotified} />
          <StatCard label="Converted" value={stats.totalConverted} />
          <StatCard label="Expired" value={stats.totalExpired} />
          <StatCard label="Conversion Rate" value={`${stats.conversionRate}%`} />
        </div>
      )}

      {/* Top waitlisted services */}
      {stats && stats.topWaitlistedServices.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#E8E4DF] p-6">
          <h3 className="font-semibold text-[#0F1D2C] mb-4">Most Waitlisted Services</h3>
          <div className="flex gap-4">
            {stats.topWaitlistedServices.map(svc => (
              <div key={svc.serviceId} className="bg-[#F8F6F1] rounded-xl px-4 py-3">
                <p className="text-sm font-medium text-[#0F1D2C]">{svc.serviceName}</p>
                <p className="text-xs text-[#6B7280]">{svc.count} waiting</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Waitlist table */}
      <div className="bg-white rounded-2xl border border-[#E8E4DF]">
        {isLoading ? (
          <div className="h-48 animate-pulse bg-gray-50 rounded-2xl" />
        ) : (
          <WaitlistTable
            entries={entries ?? []}
            onRemove={removeFromWaitlist}
          />
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E8E4DF] p-4">
      <p className="text-xs text-[#6B7280]">{label}</p>
      <p className="text-2xl font-bold text-[#0F1D2C]">{value}</p>
    </div>
  );
}
