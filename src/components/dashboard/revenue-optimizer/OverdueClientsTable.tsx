'use client';

import { AlertTriangle, Phone, Mail, MessageSquare } from 'lucide-react';
import type { OverdueClientGap } from '@/lib/revenue/gap-finder';

interface OverdueClientsTableProps {
  clients: OverdueClientGap[];
  onContact?: (_client: OverdueClientGap) => void;
}

export default function OverdueClientsTable({ clients, onContact }: OverdueClientsTableProps) {
  const urgencyConfig: Record<string, { color: string; label: string }> = {
    'due-soon': { color: 'bg-blue-100 text-blue-700', label: 'Due Soon' },
    'overdue': { color: 'bg-amber-100 text-amber-700', label: 'Overdue' },
    'significantly-overdue': { color: 'bg-orange-100 text-orange-700', label: 'Overdue+' },
    'at-risk': { color: 'bg-red-100 text-red-700', label: 'At Risk' },
  };

  const contactIcons: Record<string, React.ElementType> = {
    sms: MessageSquare,
    email: Mail,
    phone: Phone,
  };

  if (clients.length === 0) {
    return <div className="text-center py-6 text-rani-muted text-sm font-body">All clients are on schedule!</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left py-2 px-3 text-xs font-body font-medium text-rani-muted uppercase">Client</th>
            <th className="text-left py-2 px-3 text-xs font-body font-medium text-rani-muted uppercase">Service</th>
            <th className="text-center py-2 px-3 text-xs font-body font-medium text-rani-muted uppercase">Status</th>
            <th className="text-right py-2 px-3 text-xs font-body font-medium text-rani-muted uppercase">Days Overdue</th>
            <th className="text-right py-2 px-3 text-xs font-body font-medium text-rani-muted uppercase">Revenue</th>
            <th className="text-center py-2 px-3 text-xs font-body font-medium text-rani-muted uppercase">Action</th>
          </tr>
        </thead>
        <tbody>
          {clients.slice(0, 20).map((client, i) => {
            const urgency = urgencyConfig[client.urgency];
            const ContactIcon = contactIcons[client.contactMethod] || MessageSquare;
            return (
              <tr key={`${client.clientId}-${client.lastService}-${i}`} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="py-2.5 px-3">
                  <p className="font-body font-medium text-rani-navy">{client.clientName}</p>
                  {client.preferredProvider && (
                    <p className="text-xs text-rani-muted font-body">w/ {client.preferredProvider}</p>
                  )}
                </td>
                <td className="py-2.5 px-3">
                  <p className="font-body text-rani-text">{client.lastService}</p>
                  <p className="text-xs text-rani-muted font-body">
                    Last: {new Date(client.lastVisitDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </td>
                <td className="py-2.5 px-3 text-center">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-body ${urgency?.color}`}>
                    {urgency?.label}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-right font-heading text-rani-navy">
                  {client.daysOverdue > 0 ? `${client.daysOverdue}d` : '--'}
                </td>
                <td className="py-2.5 px-3 text-right font-heading text-rani-navy">
                  ${client.estimatedRevenue.toLocaleString()}
                </td>
                <td className="py-2.5 px-3 text-center">
                  {onContact ? (
                    <button
                      onClick={() => onContact(client)}
                      className="p-1.5 rounded-lg bg-rani-gold/10 text-rani-gold hover:bg-rani-gold/20 transition-colors"
                    >
                      <ContactIcon className="w-4 h-4" />
                    </button>
                  ) : (
                    <ContactIcon className="w-4 h-4 text-rani-muted mx-auto" />
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
