'use client';

import { useState } from 'react';
import { Search, Download, Filter, Eye, ShieldAlert, Info, AlertTriangle } from 'lucide-react';
import type { AuditEntry } from '@/types/compliance';

interface AuditLogProps {
  entries: AuditEntry[];
  total: number;
  onExport?: () => void;
}

export default function AuditLog({ entries, total, onExport }: AuditLogProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  const filteredEntries = entries.filter((e) => {
    if (categoryFilter !== 'all' && e.category !== categoryFilter) return false;
    if (severityFilter !== 'all' && e.severity !== severityFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        e.details.toLowerCase().includes(q) ||
        e.userName.toLowerCase().includes(q) ||
        e.action.toLowerCase().includes(q) ||
        e.resourceType.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const severityIcons: Record<string, React.ElementType> = {
    info: Info,
    warning: AlertTriangle,
    critical: ShieldAlert,
  };

  const severityColors: Record<string, string> = {
    info: 'text-blue-500 bg-blue-50',
    warning: 'text-amber-500 bg-amber-50',
    critical: 'text-red-500 bg-red-50',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rani-navy/10 flex items-center justify-center">
              <Eye className="w-5 h-5 text-rani-navy" />
            </div>
            <div>
              <h2 className="text-lg font-body font-bold text-rani-navy">Audit Trail</h2>
              <p className="text-xs font-body text-rani-muted">{total} total entries</p>
            </div>
          </div>
          {onExport && (
            <button
              onClick={onExport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-body font-medium text-rani-muted hover:text-rani-navy hover:bg-rani-cream border border-rani-border transition-all"
            >
              <Download className="w-3.5 h-3.5" /> Export
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rani-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search audit trail..."
              className="w-full h-9 pl-9 pr-4 rounded-lg bg-rani-cream/60 border border-rani-border/50 text-sm font-body focus:outline-none focus:ring-2 focus:ring-rani-gold/30"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-9 px-3 rounded-lg border border-rani-border text-sm font-body focus:outline-none focus:ring-2 focus:ring-rani-gold/30"
          >
            <option value="all">All Categories</option>
            <option value="hipaa">HIPAA</option>
            <option value="osha">OSHA</option>
            <option value="licensing">Licensing</option>
            <option value="dea">DEA</option>
            <option value="device">Devices</option>
            <option value="consent">Consents</option>
            <option value="policy">Policies</option>
            <option value="auth">Auth</option>
            <option value="incident">Incidents</option>
          </select>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="h-9 px-3 rounded-lg border border-rani-border text-sm font-body focus:outline-none focus:ring-2 focus:ring-rani-gold/30"
          >
            <option value="all">All Severity</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      {/* Entries */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border overflow-hidden">
        <div className="divide-y divide-rani-border/20">
          {filteredEntries.length === 0 ? (
            <p className="p-6 text-sm font-body text-rani-muted text-center">No audit entries match your filters</p>
          ) : (
            filteredEntries.map((entry) => {
              const SevIcon = severityIcons[entry.severity] || Info;
              return (
                <div key={entry.id} className="px-4 py-3 hover:bg-rani-cream/20 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${severityColors[entry.severity]}`}>
                      <SevIcon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-body text-rani-navy">{entry.details}</p>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="text-[10px] font-body text-rani-muted">{entry.userName} ({entry.userRole})</span>
                        <span className="text-[10px] font-body px-1.5 py-0.5 rounded bg-rani-cream text-rani-muted">{entry.action}</span>
                        <span className="text-[10px] font-body px-1.5 py-0.5 rounded bg-rani-cream text-rani-muted">{entry.category}</span>
                        <span className="text-[10px] font-body text-rani-muted">{entry.ipAddress}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-body text-rani-muted flex-shrink-0 whitespace-nowrap">
                      {new Date(entry.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
