'use client';

import { format, parseISO } from 'date-fns';
import type { WaitlistEntry } from '@/lib/booking/types';

interface WaitlistTableProps {
  entries: WaitlistEntry[];
  onNotify?: (entryId: string) => void;
  onRemove?: (entryId: string) => void;
  onConvert?: (entryId: string) => void;
}

export default function WaitlistTable({ entries, onNotify, onRemove, onConvert }: WaitlistTableProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-12 text-[#6B7280]">
        <p className="text-lg font-medium mb-2">No waitlist entries</p>
        <p className="text-sm">Clients who are waiting for openings will appear here.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#E8E4DF]">
            <th className="text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider py-3 px-4">Client</th>
            <th className="text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider py-3 px-4">Service</th>
            <th className="text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider py-3 px-4">Priority</th>
            <th className="text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider py-3 px-4">Preference</th>
            <th className="text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider py-3 px-4">Added</th>
            <th className="text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider py-3 px-4">Status</th>
            <th className="text-right text-xs font-medium text-[#6B7280] uppercase tracking-wider py-3 px-4">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#F8F6F1]">
          {entries.map(entry => (
            <tr key={entry.id} className="hover:bg-[#F8F6F1]/50">
              <td className="py-3 px-4">
                <p className="font-medium text-[#0F1D2C] text-sm">{entry.clientName}</p>
                <p className="text-xs text-[#6B7280]">{entry.clientEmail}</p>
              </td>
              <td className="py-3 px-4 text-sm text-[#0F1D2C]">{entry.serviceName}</td>
              <td className="py-3 px-4">
                <PriorityBadge priority={entry.priority} />
              </td>
              <td className="py-3 px-4">
                <div className="flex flex-wrap gap-1">
                  {entry.timePreference.map(pref => (
                    <span key={pref} className="text-xs bg-[#F8F6F1] text-[#6B7280] px-2 py-0.5 rounded-full">
                      {pref}
                    </span>
                  ))}
                </div>
              </td>
              <td className="py-3 px-4 text-xs text-[#6B7280]">
                {format(parseISO(entry.createdAt), 'MMM d, yyyy')}
              </td>
              <td className="py-3 px-4">
                <StatusBadge status={entry.status} />
              </td>
              <td className="py-3 px-4 text-right">
                <div className="flex justify-end gap-2">
                  {entry.status === 'active' && onNotify && (
                    <button
                      onClick={() => onNotify(entry.id)}
                      className="text-xs px-3 py-1 rounded-lg bg-[#0F1D2C] text-white hover:bg-[#1a2d40]"
                    >
                      Notify
                    </button>
                  )}
                  {entry.status === 'notified' && onConvert && (
                    <button
                      onClick={() => onConvert(entry.id)}
                      className="text-xs px-3 py-1 rounded-lg bg-[#C9A96E] text-white hover:bg-[#b89558]"
                    >
                      Book
                    </button>
                  )}
                  {onRemove && (
                    <button
                      onClick={() => onRemove(entry.id)}
                      className="text-xs px-3 py-1 rounded-lg border border-[#E8E4DF] text-[#6B7280] hover:border-red-300 hover:text-red-500"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    vip: 'bg-purple-100 text-purple-700',
    member: 'bg-[#C9A96E]/10 text-[#C9A96E]',
    standard: 'bg-gray-100 text-gray-600',
  };

  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors[priority] ?? colors.standard}`}>
      {priority.toUpperCase()}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: 'bg-blue-100 text-blue-700',
    notified: 'bg-amber-100 text-amber-700',
    booked: 'bg-green-100 text-green-700',
    expired: 'bg-gray-100 text-gray-500',
    cancelled: 'bg-red-100 text-red-600',
  };

  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors[status] ?? colors.active}`}>
      {status}
    </span>
  );
}
