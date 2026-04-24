'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertOctagon, Plus, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import type { IncidentReport } from '@/types/compliance';

interface IncidentReportFormProps {
  incidents: IncidentReport[];
  onSubmit?: (_data: Omit<IncidentReport, 'id' | 'status'>) => void;
}

const INCIDENT_TYPES: { value: IncidentReport['type']; label: string }[] = [
  { value: 'injury', label: 'Injury' },
  { value: 'exposure', label: 'Exposure' },
  { value: 'near_miss', label: 'Near Miss' },
  { value: 'needlestick', label: 'Needlestick' },
  { value: 'chemical_spill', label: 'Chemical Spill' },
  { value: 'slip_fall', label: 'Slip/Fall' },
  { value: 'adverse_event', label: 'Adverse Event' },
  { value: 'property_damage', label: 'Property Damage' },
];

const SEVERITY_OPTIONS: { value: IncidentReport['severity']; label: string; color: string }[] = [
  { value: 'minor', label: 'Minor', color: 'border-blue-300 bg-blue-50 text-blue-700' },
  { value: 'moderate', label: 'Moderate', color: 'border-amber-300 bg-amber-50 text-amber-700' },
  { value: 'serious', label: 'Serious', color: 'border-orange-300 bg-orange-50 text-orange-700' },
  { value: 'critical', label: 'Critical', color: 'border-red-300 bg-red-50 text-red-700' },
];

export default function IncidentReportForm({ incidents, onSubmit }: IncidentReportFormProps) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    type: 'near_miss' as IncidentReport['type'],
    severity: 'minor' as IncidentReport['severity'],
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    location: '',
    reportedBy: '',
    involvedParties: '',
    description: '',
    immediateAction: '',
    correctiveActions: '',
    witnessNames: '',
    oshaRecordable: false,
  });

  const openIncidents = incidents.filter((i) => i.status !== 'resolved' && i.status !== 'closed');
  const recentIncidents = incidents.slice(0, 10);

  const severityColors: Record<string, string> = {
    minor: 'bg-blue-50 text-blue-600',
    moderate: 'bg-amber-50 text-amber-600',
    serious: 'bg-orange-50 text-orange-600',
    critical: 'bg-red-50 text-red-600',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <AlertOctagon className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-body font-bold text-rani-navy">Incident Reporting</h2>
              <p className="text-xs font-body text-rani-muted">
                {openIncidents.length} open incident{openIncidents.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-body font-medium hover:bg-red-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Report Incident
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5 space-y-4"
        >
          <h3 className="text-sm font-body font-semibold text-rani-navy">New Incident Report</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-body font-medium text-rani-muted block mb-1">Incident Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full h-9 px-3 rounded-lg border border-rani-border text-sm font-body focus:outline-none focus:ring-2 focus:ring-rani-gold/30"
              >
                {INCIDENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-body font-medium text-rani-muted block mb-1">Severity</label>
              <div className="flex gap-2">
                {SEVERITY_OPTIONS.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setFormData({ ...formData, severity: s.value })}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-body font-medium border transition-all ${
                      formData.severity === s.value ? s.color : 'border-rani-border text-rani-muted hover:bg-rani-cream'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-body font-medium text-rani-muted block mb-1">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border border-rani-border text-sm font-body focus:outline-none focus:ring-2 focus:ring-rani-gold/30"
              />
            </div>

            <div>
              <label className="text-xs font-body font-medium text-rani-muted block mb-1">Time</label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border border-rani-border text-sm font-body focus:outline-none focus:ring-2 focus:ring-rani-gold/30"
              />
            </div>

            <div>
              <label className="text-xs font-body font-medium text-rani-muted block mb-1">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Treatment room, lobby, etc."
                className="w-full h-9 px-3 rounded-lg border border-rani-border text-sm font-body focus:outline-none focus:ring-2 focus:ring-rani-gold/30"
              />
            </div>

            <div>
              <label className="text-xs font-body font-medium text-rani-muted block mb-1">Reported By</label>
              <input
                type="text"
                value={formData.reportedBy}
                onChange={(e) => setFormData({ ...formData, reportedBy: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border border-rani-border text-sm font-body focus:outline-none focus:ring-2 focus:ring-rani-gold/30"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-body font-medium text-rani-muted block mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-rani-border text-sm font-body focus:outline-none focus:ring-2 focus:ring-rani-gold/30 resize-none"
              placeholder="Describe the incident in detail..."
            />
          </div>

          <div>
            <label className="text-xs font-body font-medium text-rani-muted block mb-1">Immediate Action Taken</label>
            <textarea
              value={formData.immediateAction}
              onChange={(e) => setFormData({ ...formData, immediateAction: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-rani-border text-sm font-body focus:outline-none focus:ring-2 focus:ring-rani-gold/30 resize-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="oshaRecordable"
              checked={formData.oshaRecordable}
              onChange={(e) => setFormData({ ...formData, oshaRecordable: e.target.checked })}
              className="rounded border-rani-border"
            />
            <label htmlFor="oshaRecordable" className="text-sm font-body text-rani-text">OSHA Recordable</label>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-lg text-sm font-body text-rani-muted hover:bg-rani-cream transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-rani-navy text-white rounded-lg text-sm font-body font-medium hover:bg-[#1a2d42] transition-colors"
            >
              Submit Report
            </button>
          </div>
        </motion.div>
      )}

      {/* Recent Incidents */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border overflow-hidden">
        <div className="px-4 py-3 border-b border-rani-border/30">
          <h3 className="text-xs font-body font-semibold uppercase tracking-wider text-rani-muted">
            Recent Incidents
          </h3>
        </div>
        <div className="divide-y divide-rani-border/20">
          {recentIncidents.length === 0 ? (
            <div className="p-6 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-body text-rani-muted">No incidents reported</p>
            </div>
          ) : (
            recentIncidents.map((incident) => {
              const StatusIcon = incident.status === 'resolved' || incident.status === 'closed'
                ? CheckCircle2
                : incident.severity === 'critical' || incident.severity === 'serious'
                  ? AlertTriangle
                  : Clock;
              const statusIconColor = incident.status === 'resolved' || incident.status === 'closed'
                ? 'text-emerald-500'
                : incident.severity === 'critical'
                  ? 'text-red-500'
                  : 'text-amber-500';

              return (
                <div key={incident.id} className="p-4 hover:bg-rani-cream/20 transition-colors">
                  <div className="flex items-start gap-3">
                    <StatusIcon className={`w-5 h-5 ${statusIconColor} flex-shrink-0 mt-0.5`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-body font-medium text-rani-navy">{incident.description}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={`text-[10px] font-body font-medium px-2 py-0.5 rounded-full ${severityColors[incident.severity]}`}>
                          {incident.severity}
                        </span>
                        <span className="text-xs font-body text-rani-muted">{incident.type.replace(/_/g, ' ')}</span>
                        <span className="text-xs font-body text-rani-muted">{incident.location}</span>
                        <span className="text-xs font-body text-rani-muted">{incident.date}</span>
                      </div>
                    </div>
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
