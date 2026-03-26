'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Pill, AlertTriangle, CheckCircle2, Clock, FileWarning, RotateCcw } from 'lucide-react';
import type { ControlledSubstance, SubstanceReconciliation, WasteLog } from '@/types/compliance';

type TabKey = 'inventory' | 'reconciliation' | 'waste';

interface DEAReconciliationProps {
  substances: ControlledSubstance[];
  reconciliations: SubstanceReconciliation[];
  wasteLogs: WasteLog[];
  score: number;
}

export default function DEAReconciliation({
  substances, reconciliations, wasteLogs, score,
}: DEAReconciliationProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('inventory');

  const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
    { key: 'inventory', label: 'Inventory', icon: Pill },
    { key: 'reconciliation', label: 'Reconciliation', icon: RotateCcw },
    { key: 'waste', label: 'Waste Log', icon: FileWarning },
  ];

  const scheduleColors: Record<string, string> = {
    II: 'bg-red-100 text-red-700',
    III: 'bg-orange-100 text-orange-700',
    IV: 'bg-amber-100 text-amber-700',
    V: 'bg-blue-100 text-blue-700',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <Pill className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-body font-bold text-rani-navy">DEA Controlled Substances</h2>
              <p className="text-xs font-body text-rani-muted">
                {substances.length} tracked substance{substances.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <span className={`text-2xl font-body font-bold ${score >= 80 ? 'text-emerald-600' : score >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
            {score}%
          </span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Substances', value: substances.length, icon: Pill },
          { label: 'Discrepancies', value: reconciliations.filter((r) => r.status === 'discrepancy').length, icon: AlertTriangle },
          { label: 'Reconciliations', value: reconciliations.length, icon: CheckCircle2 },
          { label: 'Waste Events', value: wasteLogs.length, icon: FileWarning },
        ].map((stat) => (
          <div key={stat.label} className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4">
            <stat.icon className="w-4 h-4 text-rani-muted mb-2" />
            <p className="text-xl font-body font-bold text-rani-navy">{stat.value}</p>
            <p className="text-[10px] font-body text-rani-muted uppercase">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-body font-medium transition-all ${
              activeTab === key
                ? 'bg-rani-navy text-white'
                : 'bg-white border border-rani-border text-rani-muted hover:text-rani-navy'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border overflow-hidden">
        {activeTab === 'inventory' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-rani-border/40">
                  <th className="px-4 py-3 text-left text-[10px] font-body font-semibold uppercase tracking-wider text-rani-muted">Substance</th>
                  <th className="px-4 py-3 text-center text-[10px] font-body font-semibold uppercase tracking-wider text-rani-muted">Schedule</th>
                  <th className="px-4 py-3 text-center text-[10px] font-body font-semibold uppercase tracking-wider text-rani-muted">Qty</th>
                  <th className="px-4 py-3 text-center text-[10px] font-body font-semibold uppercase tracking-wider text-rani-muted hidden sm:table-cell">Lot #</th>
                  <th className="px-4 py-3 text-center text-[10px] font-body font-semibold uppercase tracking-wider text-rani-muted hidden md:table-cell">Expires</th>
                  <th className="px-4 py-3 text-center text-[10px] font-body font-semibold uppercase tracking-wider text-rani-muted">Last Recon</th>
                  <th className="px-4 py-3 text-center text-[10px] font-body font-semibold uppercase tracking-wider text-rani-muted">Status</th>
                </tr>
              </thead>
              <tbody>
                {substances.map((s) => {
                  const statusColors: Record<string, string> = {
                    in_stock: 'bg-emerald-50 text-emerald-600',
                    low: 'bg-amber-50 text-amber-600',
                    expired: 'bg-red-50 text-red-600',
                    recalled: 'bg-red-100 text-red-700',
                    destroyed: 'bg-gray-100 text-gray-500',
                  };
                  return (
                    <tr key={s.id} className="border-b border-rani-border/10 hover:bg-rani-cream/20">
                      <td className="px-4 py-3">
                        <p className="text-sm font-body font-medium text-rani-navy">{s.name}</p>
                        <p className="text-[10px] font-body text-rani-muted">{s.genericName} - {s.strength}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-[10px] font-body font-bold px-2 py-0.5 rounded-full ${scheduleColors[s.schedule]}`}>
                          Sch. {s.schedule}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm font-body font-medium text-rani-navy">
                        {s.currentQuantity} {s.unit}
                      </td>
                      <td className="px-4 py-3 text-center text-xs font-body text-rani-muted hidden sm:table-cell">{s.lotNumber}</td>
                      <td className="px-4 py-3 text-center text-xs font-body text-rani-muted hidden md:table-cell">{s.expirationDate}</td>
                      <td className="px-4 py-3 text-center text-xs font-body text-rani-muted">{s.lastReconciliationDate}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-[10px] font-body font-medium px-2 py-0.5 rounded-full ${statusColors[s.status]}`}>
                          {s.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {substances.length === 0 && (
              <p className="p-6 text-sm font-body text-rani-muted text-center">No controlled substances tracked</p>
            )}
          </div>
        )}

        {activeTab === 'reconciliation' && (
          <div className="divide-y divide-rani-border/20">
            {reconciliations.length === 0 ? (
              <p className="p-6 text-sm font-body text-rani-muted text-center">No reconciliations performed</p>
            ) : (
              reconciliations.map((r) => (
                <div key={r.id} className={`p-4 ${r.status === 'discrepancy' ? 'bg-red-50/50' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        {r.status === 'matched' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : r.status === 'discrepancy' ? (
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                        ) : (
                          <Clock className="w-4 h-4 text-amber-500" />
                        )}
                        <p className="text-sm font-body font-medium text-rani-navy">{r.substanceName}</p>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs font-body text-rani-muted">
                        <span>Expected: {r.expectedCount}</span>
                        <span>Actual: {r.actualCount}</span>
                        {r.discrepancy !== 0 && (
                          <span className="text-red-600 font-medium">
                            Discrepancy: {r.discrepancy > 0 ? '+' : ''}{r.discrepancy}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] font-body text-rani-muted mt-1">
                        By: {r.performedBy} | Witness: {r.witnessedBy}
                      </p>
                    </div>
                    <span className="text-xs font-body text-rani-muted">{r.date}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'waste' && (
          <div className="divide-y divide-rani-border/20">
            {wasteLogs.length === 0 ? (
              <p className="p-6 text-sm font-body text-rani-muted text-center">No waste events logged</p>
            ) : (
              wasteLogs.map((w) => (
                <div key={w.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-body font-medium text-rani-navy">
                        {w.substanceName}
                        <span className={`ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${scheduleColors[w.schedule]}`}>
                          Sch. {w.schedule}
                        </span>
                      </p>
                      <div className="flex items-center gap-4 mt-1 text-xs font-body text-rani-muted">
                        <span>Qty: {w.quantityWasted} {w.unit}</span>
                        <span>Reason: {w.reason.replace(/_/g, ' ')}</span>
                        <span>Method: {w.method.replace(/_/g, ' ')}</span>
                      </div>
                      <p className="text-[10px] font-body text-rani-muted mt-1">
                        Wasted by: {w.wastedBy} | Witnessed by: {w.witnessedBy}
                      </p>
                    </div>
                    <span className="text-xs font-body text-rani-muted">{w.date}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
