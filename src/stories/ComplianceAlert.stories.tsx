import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ComplianceAlertProps {
  alerts: {
    id: string;
    type: 'consent-expiring' | 'labs-overdue' | 'gfe-needed' | 'documentation-missing' | 'controlled-substance' | 'prescription-expiring';
    severity: 'critical' | 'warning' | 'info';
    patientName: string;
    message: string;
    dueDate?: string;
    actionRequired: string;
  }[];
}

// ─── Component ───────────────────────────────────────────────────────────────

const severityConfig = {
  critical: { bg: 'bg-red-50 border-red-200', icon: 'text-red-500', badge: 'bg-red-100 text-red-800', dot: 'bg-red-500' },
  warning: { bg: 'bg-yellow-50 border-yellow-200', icon: 'text-yellow-500', badge: 'bg-yellow-100 text-yellow-800', dot: 'bg-yellow-500' },
  info: { bg: 'bg-blue-50 border-blue-200', icon: 'text-blue-500', badge: 'bg-blue-100 text-blue-800', dot: 'bg-blue-500' },
};

const typeLabels: Record<string, string> = {
  'consent-expiring': 'Consent',
  'labs-overdue': 'Labs',
  'gfe-needed': 'GFE',
  'documentation-missing': 'Docs',
  'controlled-substance': 'DEA',
  'prescription-expiring': 'Rx',
};

function ComplianceAlert({ alerts }: ComplianceAlertProps) {
  const criticalCount = alerts.filter((a) => a.severity === 'critical').length;
  const warningCount = alerts.filter((a) => a.severity === 'warning').length;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden max-w-lg">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-[#0F1D2C]" style={{ fontFamily: 'Playfair Display, serif' }}>
            Compliance Alerts
          </h3>
          <div className="flex gap-2">
            {criticalCount > 0 && (
              <span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-0.5 rounded-full">
                {criticalCount} critical
              </span>
            )}
            {warningCount > 0 && (
              <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-0.5 rounded-full">
                {warningCount} warnings
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Alert List */}
      <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
        {alerts.map((alert) => {
          const config = severityConfig[alert.severity];
          return (
            <div key={alert.id} className={`px-5 py-3 ${config.bg} border-l-4`}>
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${config.dot} animate-pulse`} />
                  <span className="font-semibold text-sm text-[#0F1D2C]">{alert.patientName}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${config.badge}`}>
                    {typeLabels[alert.type]}
                  </span>
                </div>
                {alert.dueDate && (
                  <span className="text-xs text-gray-400">{alert.dueDate}</span>
                )}
              </div>
              <p className="text-xs text-gray-600 mb-2 ml-4">{alert.message}</p>
              <div className="flex items-center justify-between ml-4">
                <span className="text-xs text-gray-500 italic">{alert.actionRequired}</span>
                <button className="text-xs bg-white border border-gray-200 px-2.5 py-1 rounded-lg font-medium text-[#0F1D2C] hover:bg-gray-50">
                  Resolve
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 bg-gray-50 flex items-center justify-between">
        <span className="text-xs text-gray-500">{alerts.length} total alerts</span>
        <button className="text-xs text-rani-gold-accessible font-medium">View All</button>
      </div>
    </div>
  );
}

// ─── Stories ──────────────────────────────────────────────────────────────────

const meta: Meta<typeof ComplianceAlert> = {
  title: 'Dashboard/ComplianceAlert',
  component: ComplianceAlert,
  parameters: { layout: 'padded', backgrounds: { default: 'dashboard' } },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ComplianceAlert>;

export const Default: Story = {
  args: {
    alerts: [
      { id: '1', type: 'labs-overdue', severity: 'critical', patientName: 'Michael R.', message: 'Quarterly labs overdue by 2 weeks. GLP-1 refill cannot be processed without current labs.', dueDate: 'Due Mar 12', actionRequired: 'Contact patient to schedule labs' },
      { id: '2', type: 'consent-expiring', severity: 'warning', patientName: 'Jennifer L.', message: 'GLP-1 treatment consent expires in 14 days. Must be renewed before next injection.', dueDate: 'Expires Apr 9', actionRequired: 'Schedule consent renewal' },
      { id: '3', type: 'gfe-needed', severity: 'critical', patientName: 'Sarah M.', message: 'Good Faith Exam not completed. Required before first GLP-1 injection can be administered.', actionRequired: 'Schedule GFE appointment' },
      { id: '4', type: 'controlled-substance', severity: 'warning', patientName: 'David P.', message: 'Testosterone is Schedule III. 90-day prescription review due.', dueDate: 'Due Apr 5', actionRequired: 'Provider review and documentation' },
      { id: '5', type: 'documentation-missing', severity: 'info', patientName: 'Emily T.', message: 'Progress photos not taken at last visit. Consent on file allows documentation.', actionRequired: 'Take photos at next visit' },
    ],
  },
};

export const AllClear: Story = {
  args: {
    alerts: [
      { id: '1', type: 'prescription-expiring', severity: 'info', patientName: 'Rachel H.', message: 'Semaglutide prescription renewal needed in 30 days.', dueDate: 'Apr 25', actionRequired: 'Routine renewal at next visit' },
    ],
  },
};

export const CriticalOnly: Story = {
  args: {
    alerts: [
      { id: '1', type: 'labs-overdue', severity: 'critical', patientName: 'Lisa K.', message: 'Quarterly labs overdue by 3 weeks. Treatment on hold until labs completed.', dueDate: 'Due Mar 5', actionRequired: 'Urgent: contact patient today' },
      { id: '2', type: 'gfe-needed', severity: 'critical', patientName: 'Tom J.', message: 'GFE expired. Cannot continue hormone therapy without renewal.', actionRequired: 'Schedule emergency GFE' },
      { id: '3', type: 'controlled-substance', severity: 'critical', patientName: 'Karen B.', message: 'DEA documentation incomplete for testosterone prescription. Must be resolved within 48 hours.', dueDate: 'Due Mar 28', actionRequired: 'Provider must complete documentation today' },
    ],
  },
};
