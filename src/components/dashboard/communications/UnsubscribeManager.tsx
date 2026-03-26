'use client';

import { useState } from 'react';
import { Ban, UserPlus, Search, AlertTriangle } from 'lucide-react';

interface UnsubscribedClient {
  clientId: string;
  clientName: string;
  email?: string;
  phone?: string;
  unsubscribedAt: string;
  reason?: string;
}

interface ResubscribeRequest {
  clientId: string;
  clientName?: string;
  requestedAt: string;
}

interface UnsubscribeManagerProps {
  unsubscribedClients: UnsubscribedClient[];
  resubscribeRequests: ResubscribeRequest[];
  onResubscribe: (clientId: string) => void;
  onApproveResubscribe: (clientId: string) => void;
  onDenyResubscribe: (clientId: string) => void;
}

export default function UnsubscribeManager({
  unsubscribedClients,
  resubscribeRequests,
  onResubscribe,
  onApproveResubscribe,
  onDenyResubscribe,
}: UnsubscribeManagerProps) {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'unsubscribed' | 'requests'>('unsubscribed');

  const filteredClients = unsubscribedClients.filter(c =>
    c.clientName.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  );

  return (
    <div className="bg-white rounded-xl border border-rani-border overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-rani-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-body font-semibold text-rani-navy">Unsubscribe Manager</h3>
          <span className="text-[11px] font-body text-rani-muted">
            {unsubscribedClients.length} unsubscribed | {resubscribeRequests.length} pending requests
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            <button
              onClick={() => setTab('unsubscribed')}
              className={`px-3 py-1 rounded-full text-[11px] font-body font-medium transition-colors ${
                tab === 'unsubscribed' ? 'bg-rani-navy text-white' : 'bg-gray-50 text-rani-muted hover:bg-gray-100'
              }`}
            >
              Unsubscribed ({unsubscribedClients.length})
            </button>
            <button
              onClick={() => setTab('requests')}
              className={`px-3 py-1 rounded-full text-[11px] font-body font-medium transition-colors ${
                tab === 'requests' ? 'bg-rani-navy text-white' : 'bg-gray-50 text-rani-muted hover:bg-gray-100'
              }`}
            >
              Re-subscribe Requests ({resubscribeRequests.length})
            </button>
          </div>

          {tab === 'unsubscribed' && (
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-rani-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full pl-8 pr-3 py-1.5 rounded-md border border-rani-border text-xs font-body
                           placeholder:text-rani-muted focus:outline-none focus:ring-1 focus:ring-rani-gold/30"
              />
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-h-96 overflow-y-auto">
        {tab === 'unsubscribed' ? (
          filteredClients.length === 0 ? (
            <div className="p-8 text-center">
              <Ban className="w-8 h-8 text-rani-muted/20 mx-auto mb-2" />
              <p className="text-sm font-body text-rani-muted">No unsubscribed clients</p>
            </div>
          ) : (
            <div>
              {filteredClients.map(client => (
                <div
                  key={client.clientId}
                  className="flex items-center justify-between px-4 py-3 border-b border-rani-border/50 last:border-0"
                >
                  <div>
                    <p className="text-sm font-body font-medium text-rani-navy">{client.clientName}</p>
                    <p className="text-[11px] font-body text-rani-muted">
                      {client.email || client.phone} | Unsubscribed {new Date(client.unsubscribedAt).toLocaleDateString()}
                    </p>
                    {client.reason && (
                      <p className="text-[10px] font-body text-rani-muted mt-0.5">Reason: {client.reason}</p>
                    )}
                  </div>
                  <button
                    onClick={() => onResubscribe(client.clientId)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rani-border text-[11px] font-body font-medium
                               text-rani-text hover:bg-gray-50 transition-colors"
                  >
                    <UserPlus className="w-3 h-3" />
                    Re-subscribe
                  </button>
                </div>
              ))}
            </div>
          )
        ) : (
          resubscribeRequests.length === 0 ? (
            <div className="p-8 text-center">
              <UserPlus className="w-8 h-8 text-rani-muted/20 mx-auto mb-2" />
              <p className="text-sm font-body text-rani-muted">No pending requests</p>
            </div>
          ) : (
            <div>
              {resubscribeRequests.map(req => (
                <div
                  key={req.clientId}
                  className="flex items-center justify-between px-4 py-3 border-b border-rani-border/50 last:border-0"
                >
                  <div>
                    <p className="text-sm font-body font-medium text-rani-navy">
                      {req.clientName || req.clientId}
                    </p>
                    <p className="text-[11px] font-body text-rani-muted">
                      Requested {new Date(req.requestedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onApproveResubscribe(req.clientId)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-body font-medium
                                 hover:bg-emerald-100 transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => onDenyResubscribe(req.clientId)}
                      className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-[11px] font-body font-medium
                                 hover:bg-red-100 transition-colors"
                    >
                      Deny
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* CAN-SPAM Notice */}
      <div className="px-4 py-2 border-t border-rani-border bg-amber-50/50">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
          <p className="text-[10px] font-body text-amber-700">
            CAN-SPAM: Unsubscribe requests must be processed within 10 business days. Re-subscribing requires client consent.
          </p>
        </div>
      </div>
    </div>
  );
}
