'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  HardHat, Syringe, FlaskConical, AlertOctagon, ShieldCheck,
  CheckSquare, XSquare, ClipboardList, Package,
} from 'lucide-react';
import type { SharpsDisposalLog, SDSSheet, IncidentReport, PPEInventory } from '@/types/compliance';

type TabKey = 'checklist' | 'incidents' | 'sharps' | 'sds' | 'ppe';

interface OSHAPanelProps {
  sharpsLogs: SharpsDisposalLog[];
  sdsSheets: SDSSheet[];
  incidents: IncidentReport[];
  ppeInventory: PPEInventory[];
  score: number;
  checklist: { id: string; category: string; item: string; required: boolean; status: 'pass' | 'fail' | 'na' | 'pending' }[];
}

export default function OSHAPanel({
  sharpsLogs, sdsSheets, incidents, ppeInventory, score, checklist,
}: OSHAPanelProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('checklist');

  const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
    { key: 'checklist', label: 'Inspection', icon: ClipboardList },
    { key: 'incidents', label: 'Incidents', icon: AlertOctagon },
    { key: 'sharps', label: 'Sharps', icon: Syringe },
    { key: 'sds', label: 'SDS Library', icon: FlaskConical },
    { key: 'ppe', label: 'PPE', icon: Package },
  ];

  const checklistByCategory = checklist.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof checklist>);

  return (
    <div className="space-y-6">
      {/* Score Header */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <HardHat className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-lg font-body font-bold text-rani-navy">OSHA Compliance</h2>
              <p className="text-xs font-body text-rani-muted">Workplace safety and hazard management</p>
            </div>
          </div>
          <div className="text-right">
            <span className={`text-2xl font-body font-bold ${score >= 80 ? 'text-emerald-600' : score >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
              {score}%
            </span>
            <p className="text-[10px] font-body text-rani-muted uppercase">Compliance Score</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-body font-medium transition-all whitespace-nowrap ${
              activeTab === key
                ? 'bg-rani-navy text-white'
                : 'bg-white border border-rani-border text-rani-muted hover:text-rani-navy hover:bg-rani-cream'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border overflow-hidden">
        {activeTab === 'checklist' && (
          <div className="p-4 space-y-6">
            {Object.entries(checklistByCategory).map(([category, items]) => (
              <div key={category}>
                <h3 className="text-xs font-body font-semibold uppercase tracking-wider text-rani-muted mb-3">
                  {category}
                </h3>
                <div className="space-y-2">
                  {items.map((item) => {
                    const StatusIcon = item.status === 'pass' ? CheckSquare : item.status === 'fail' ? XSquare : ClipboardList;
                    const statusColor = item.status === 'pass' ? 'text-emerald-500' : item.status === 'fail' ? 'text-red-500' : 'text-gray-400';
                    return (
                      <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-rani-cream/30">
                        <StatusIcon className={`w-5 h-5 ${statusColor} flex-shrink-0`} />
                        <span className="text-sm font-body text-rani-text flex-1">{item.item}</span>
                        {item.required && (
                          <span className="text-[10px] font-body font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                            Required
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'incidents' && (
          <div className="divide-y divide-rani-border/30">
            {incidents.length === 0 ? (
              <div className="p-6 text-center">
                <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-body text-rani-muted">No incidents reported</p>
              </div>
            ) : (
              incidents.map((incident) => {
                const severityColors: Record<string, string> = {
                  minor: 'bg-blue-50 text-blue-600',
                  moderate: 'bg-amber-50 text-amber-600',
                  serious: 'bg-orange-50 text-orange-600',
                  critical: 'bg-red-50 text-red-600',
                };
                return (
                  <div key={incident.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-body font-medium text-rani-navy">{incident.description}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className={`text-[10px] font-body font-medium px-2 py-0.5 rounded-full ${severityColors[incident.severity]}`}>
                            {incident.severity}
                          </span>
                          <span className="text-xs font-body text-rani-muted">{incident.type.replace(/_/g, ' ')}</span>
                          <span className="text-xs font-body text-rani-muted">{incident.status}</span>
                          {incident.oshaRecordable && (
                            <span className="text-[10px] font-body font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                              OSHA Recordable
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-xs font-body text-rani-muted flex-shrink-0 ml-4">{incident.date}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'sharps' && (
          <div className="divide-y divide-rani-border/30">
            {sharpsLogs.length === 0 ? (
              <p className="p-6 text-sm font-body text-rani-muted text-center">No sharps containers logged</p>
            ) : (
              sharpsLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm font-body font-medium text-rani-navy">{log.containerId} - {log.location}</p>
                    <p className="text-xs font-body text-rani-muted">Last checked: {log.lastCheckedDate}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${log.fillLevel >= 75 ? 'bg-red-500' : log.fillLevel >= 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${log.fillLevel}%` }}
                      />
                    </div>
                    <span className="text-xs font-body font-medium text-rani-muted w-10">{log.fillLevel}%</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'sds' && (
          <div className="divide-y divide-rani-border/30">
            {sdsSheets.length === 0 ? (
              <p className="p-6 text-sm font-body text-rani-muted text-center">No SDS sheets on file</p>
            ) : (
              sdsSheets.map((sheet) => {
                const isExpired = new Date(sheet.expirationDate) <= new Date();
                return (
                  <div key={sheet.id} className="flex items-center justify-between p-4">
                    <div>
                      <p className="text-sm font-body font-medium text-rani-navy">{sheet.productName}</p>
                      <p className="text-xs font-body text-rani-muted">{sheet.manufacturer} - {sheet.location}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {sheet.signalWord !== 'none' && (
                        <span className={`text-[10px] font-body font-medium px-2 py-0.5 rounded-full ${
                          sheet.signalWord === 'danger' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                        }`}>
                          {sheet.signalWord}
                        </span>
                      )}
                      <span className={`text-[10px] font-body font-medium px-2 py-0.5 rounded-full ${
                        isExpired ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                      }`}>
                        {isExpired ? 'Expired' : 'Current'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'ppe' && (
          <div className="divide-y divide-rani-border/30">
            {ppeInventory.length === 0 ? (
              <p className="p-6 text-sm font-body text-rani-muted text-center">No PPE items tracked</p>
            ) : (
              ppeInventory.map((item) => {
                const statusColors: Record<string, string> = {
                  adequate: 'bg-emerald-50 text-emerald-600',
                  low: 'bg-amber-50 text-amber-600',
                  critical: 'bg-red-50 text-red-600',
                  ordered: 'bg-blue-50 text-blue-600',
                };
                return (
                  <div key={item.id} className="flex items-center justify-between p-4">
                    <div>
                      <p className="text-sm font-body font-medium text-rani-navy">{item.itemName}</p>
                      <p className="text-xs font-body text-rani-muted">
                        Stock: {item.currentStock} / Min: {item.minimumStock} - {item.location}
                      </p>
                    </div>
                    <span className={`text-[10px] font-body font-medium px-2 py-0.5 rounded-full ${statusColors[item.status]}`}>
                      {item.status}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
