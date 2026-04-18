'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Shield, ShieldCheck, HardHat, Award, FileSignature, Pill,
  Cpu, AlertOctagon, Eye, FileText, Calendar, ChevronRight,
} from 'lucide-react';
import ComplianceDashboard from '@/components/dashboard/compliance/ComplianceDashboard';
import type { ComplianceScore } from '@/types/compliance';

const NAV_ITEMS = [
  { href: '/dashboard/compliance/hipaa', label: 'HIPAA', icon: Shield, color: 'bg-rani-gold/10 text-rani-gold-accessible' },
  { href: '/dashboard/compliance/osha', label: 'OSHA', icon: HardHat, color: 'bg-orange-100 text-orange-600' },
  { href: '/dashboard/compliance/licenses', label: 'Licenses', icon: Award, color: 'bg-purple-100 text-purple-600' },
  { href: '/dashboard/compliance/consents', label: 'Consents', icon: FileSignature, color: 'bg-blue-100 text-blue-600' },
  { href: '/dashboard/compliance/substances', label: 'DEA', icon: Pill, color: 'bg-red-100 text-red-600' },
  { href: '/dashboard/compliance/devices', label: 'Devices', icon: Cpu, color: 'bg-indigo-100 text-indigo-600' },
  { href: '/dashboard/compliance/incidents', label: 'Incidents', icon: AlertOctagon, color: 'bg-rose-100 text-rose-600' },
  { href: '/dashboard/compliance/audit', label: 'Audit Trail', icon: Eye, color: 'bg-gray-100 text-gray-600' },
  { href: '/dashboard/compliance/policies', label: 'Policies', icon: FileText, color: 'bg-teal-100 text-teal-600' },
];

export default function ComplianceOverviewPage() {
  const [complianceData, setComplianceData] = useState<ComplianceScore | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/dashboard/compliance');
        if (res.ok) {
          const data = await res.json();
          setComplianceData(data);
        }
      } catch {
        // Fallback demo data
        setComplianceData({
          overall: 82,
          categories: {
            hipaa: { score: 88, issues: 2, label: 'HIPAA' },
            osha: { score: 85, issues: 1, label: 'OSHA' },
            licensing: { score: 92, issues: 0, label: 'Licensing' },
            dea: { score: 78, issues: 3, label: 'DEA/Controlled Substances' },
            devices: { score: 80, issues: 2, label: 'Device Compliance' },
            consents: { score: 75, issues: 4, label: 'Consent Management' },
            policies: { score: 85, issues: 1, label: 'Policies' },
            training: { score: 80, issues: 2, label: 'Training' },
          },
          status: 'compliant',
          upcomingDeadlines: [
            { id: '1', type: 'license_renewal', title: 'RN License Renewal - Jane Doe', dueDate: '2026-04-15', daysUntilDue: 21, assignee: 'Jane Doe', severity: 'warning', category: 'Licensing' },
            { id: '2', type: 'device_maintenance', title: 'Sofwave Annual Maintenance', dueDate: '2026-04-20', daysUntilDue: 26, severity: 'info', category: 'Devices' },
            { id: '3', type: 'training_due', title: 'Annual HIPAA Training - All Staff', dueDate: '2026-04-30', daysUntilDue: 36, severity: 'warning', category: 'Training' },
          ],
          overdueItems: [
            { id: '4', type: 'dea_reconciliation', title: 'Lidocaine Schedule IV Reconciliation', dueDate: '2026-03-20', daysUntilDue: -5, severity: 'critical', category: 'DEA' },
          ],
        });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-rani-navy font-heading">
          Compliance & Documentation
        </h1>
        <p className="text-gray-500 mt-1">
          HIPAA, OSHA, WA State regulations, DEA, FDA device compliance
        </p>
      </div>

      {/* Quick Navigation */}
      <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon, color }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/80 border border-rani-border hover:border-rani-gold/30 hover:shadow-md transition-all group"
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-body font-semibold text-rani-muted group-hover:text-rani-navy uppercase tracking-wider">
              {label}
            </span>
          </Link>
        ))}
      </div>

      {/* Dashboard */}
      {loading ? (
        <div className="bg-white/80 rounded-xl border border-rani-border p-8 text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-40 bg-rani-border/30 rounded-lg" />
            <div className="grid grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-20 bg-rani-border/30 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      ) : complianceData ? (
        <ComplianceDashboard complianceScore={complianceData} />
      ) : null}
    </div>
  );
}
