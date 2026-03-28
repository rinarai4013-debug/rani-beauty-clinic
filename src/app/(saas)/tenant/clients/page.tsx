/**
 * Tenant Dashboard — Client Management Page
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTenantClients, useTenantSegments, useTenantAtRiskClients } from '@/hooks/useTenantDashboard';
import type { ClientListFilters, ClientSortField, SortDirection } from '@/lib/saas/tenant-dashboard/clients';

export default function TenantClientsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [sort, setSort] = useState<{ field: ClientSortField; direction: SortDirection }>({ field: 'lastVisit', direction: 'desc' });
  const [page, setPage] = useState(1);
  const [view, setView] = useState<'list' | 'segments' | 'at-risk'>('list');

  const filters: ClientListFilters = {
    search: search || undefined,
    status: statusFilter.length > 0 ? statusFilter as ClientListFilters['status'] : undefined,
  };

  const { data: clientData, isLoading } = useTenantClients({ filters, sort, page, pageSize: 25 });
  const { data: segments } = useTenantSegments();
  const { data: atRisk } = useTenantAtRiskClients();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Clients</h2>
          <p className="text-sm text-gray-500 mt-1">
            {clientData?.total ?? 0} total clients
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setView('list')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${view === 'list' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
          >
            All Clients
          </button>
          <button
            onClick={() => setView('segments')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${view === 'segments' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
          >
            Segments
          </button>
          <button
            onClick={() => setView('at-risk')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${view === 'at-risk' ? 'bg-red-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
          >
            At Risk ({atRisk?.length ?? 0})
          </button>
        </div>
      </div>

      {view === 'list' && (
        <>
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search clients by name, email, or phone..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              onChange={(e) => {
                setStatusFilter(e.target.value ? [e.target.value] : []);
                setPage(1);
              }}
              className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="lead">Lead</option>
              <option value="lapsed">Lapsed</option>
              <option value="vip">VIP</option>
              <option value="churned">Churned</option>
            </select>
            <select
              onChange={(e) => {
                const [field, dir] = e.target.value.split(':') as [ClientSortField, SortDirection];
                setSort({ field, direction: dir });
              }}
              className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white"
            >
              <option value="lastVisit:desc">Last Visit (Recent)</option>
              <option value="lastVisit:asc">Last Visit (Oldest)</option>
              <option value="totalSpend:desc">Spend (High to Low)</option>
              <option value="totalSpend:asc">Spend (Low to High)</option>
              <option value="name:asc">Name (A-Z)</option>
              <option value="churnRisk:desc">Churn Risk (High)</option>
            </select>
          </div>

          {/* Client List */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center text-gray-400">Loading clients...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Client</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Segment</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Total Spend</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Visits</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Last Visit</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Churn Risk</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {clientData?.clients?.map((client) => (
                      <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <Link href={`/tenant/clients/${client.id}`} className="text-sm font-medium text-gray-900 hover:text-blue-600">
                              {client.name}
                            </Link>
                            <p className="text-xs text-gray-500">{client.email}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={client.status} />
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-gray-600 capitalize">{client.segment.replace(/_/g, ' ')}</span>
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                          ${client.totalSpend.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-gray-600">
                          {client.visitCount}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {client.lastVisit ? new Date(client.lastVisit).toLocaleDateString() : 'Never'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <ChurnBadge risk={client.churnRisk} />
                        </td>
                        <td className="px-4 py-3">
                          <Link href={`/tenant/clients/${client.id}`} className="text-sm text-blue-600 hover:text-blue-800">
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {clientData && clientData.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Page {clientData.page} of {clientData.totalPages} ({clientData.total} total)
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page <= 1}
                    className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(Math.min(clientData.totalPages, page + 1))}
                    disabled={page >= clientData.totalPages}
                    className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {view === 'segments' && segments && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {segments.map((seg) => (
            <div key={seg.segment} className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 capitalize">{seg.segment.replace(/_/g, ' ')}</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">{seg.count}</p>
              <p className="text-xs text-gray-500 mt-1">{seg.percentage}% of clients</p>
              <div className="flex justify-between mt-3 text-xs text-gray-500">
                <span>Avg Spend: ${seg.avgSpend.toLocaleString()}</span>
                <span>Avg Visits: {seg.avgVisits}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {view === 'at-risk' && atRisk && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-red-50 border-b border-red-100">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-red-700 uppercase">Client</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-red-700 uppercase">Churn Risk</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-red-700 uppercase">Total Spend</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-red-700 uppercase">Last Visit</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {atRisk.map((client) => (
                  <tr key={client.id} className="hover:bg-red-50/50">
                    <td className="px-4 py-3">
                      <Link href={`/tenant/clients/${client.id}`} className="text-sm font-medium text-gray-900 hover:text-blue-600">
                        {client.name}
                      </Link>
                      <p className="text-xs text-gray-500">{client.email}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <ChurnBadge risk={client.churnRisk} />
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium">${client.totalSpend.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {client.lastVisit ? new Date(client.lastVisit).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/tenant/clients/${client.id}`} className="text-sm text-blue-600 hover:text-blue-800">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    lead: 'bg-blue-100 text-blue-800',
    lapsed: 'bg-yellow-100 text-yellow-800',
    vip: 'bg-purple-100 text-purple-800',
    churned: 'bg-red-100 text-red-800',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
      {status}
    </span>
  );
}

function ChurnBadge({ risk }: { risk: number }) {
  const color = risk >= 75 ? 'text-red-600 bg-red-50' : risk >= 50 ? 'text-orange-600 bg-orange-50' : risk >= 25 ? 'text-yellow-600 bg-yellow-50' : 'text-green-600 bg-green-50';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${color}`}>
      {risk}%
    </span>
  );
}
