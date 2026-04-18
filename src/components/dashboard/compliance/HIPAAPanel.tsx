'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Shield, Users, FileText, AlertTriangle, Eye, BookOpen,
  ChevronRight, CheckCircle2, XCircle, Clock,
} from 'lucide-react';
import type {
  TrainingCompletion, BusinessAssociateAgreement, BreachNotification, PHIAccessLog,
} from '@/types/compliance';

type TabKey = 'training' | 'baas' | 'breaches' | 'access';

interface HIPAAPanelProps {
  trainingRecords: TrainingCompletion[];
  baas: BusinessAssociateAgreement[];
  breaches: BreachNotification[];
  accessLogs: PHIAccessLog[];
  score: number;
}

export default function HIPAAPanel({
  trainingRecords, baas, breaches, accessLogs, score,
}: HIPAAPanelProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('training');

  const tabs: { key: TabKey; label: string; icon: React.ElementType; count: number }[] = [
    { key: 'training', label: 'Training', icon: BookOpen, count: trainingRecords.length },
    { key: 'baas', label: 'BAAs', icon: FileText, count: baas.length },
    { key: 'breaches', label: 'Breaches', icon: AlertTriangle, count: breaches.length },
    { key: 'access', label: 'Access Audit', icon: Eye, count: accessLogs.length },
  ];

  return (
    <div className="space-y-6">
      {/* Score Header */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rani-gold/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-rani-gold-accessible" />
            </div>
            <div>
              <h2 className="text-lg font-body font-bold text-rani-navy">HIPAA Compliance</h2>
              <p className="text-xs font-body text-rani-muted">Privacy, security, and breach management</p>
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
        {tabs.map(({ key, label, icon: Icon, count }) => (
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
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              activeTab === key ? 'bg-white/20' : 'bg-rani-cream'
            }`}>{count}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border overflow-hidden">
        {activeTab === 'training' && (
          <div className="divide-y divide-rani-border/30">
            {trainingRecords.length === 0 ? (
              <p className="p-6 text-sm font-body text-rani-muted text-center">No training records</p>
            ) : (
              trainingRecords.slice(0, 20).map((record) => {
                const isExpired = new Date(record.expirationDate) <= new Date();
                return (
                  <div key={record.id} className="flex items-center justify-between p-4 hover:bg-rani-cream/30 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      {record.passed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-body font-medium text-rani-navy truncate">
                          {record.staffName}
                        </p>
                        <p className="text-xs font-body text-rani-muted">
                          {record.trainingType.replace(/_/g, ' ')} - Score: {record.score ?? 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <p className="text-xs font-body text-rani-muted">{record.completedDate}</p>
                      <span className={`text-[10px] font-body font-medium px-2 py-0.5 rounded-full ${
                        isExpired ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                      }`}>
                        {isExpired ? 'Expired' : `Exp: ${record.expirationDate}`}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'baas' && (
          <div className="divide-y divide-rani-border/30">
            {baas.length === 0 ? (
              <p className="p-6 text-sm font-body text-rani-muted text-center">No BAAs on file</p>
            ) : (
              baas.map((baa) => {
                const statusColors: Record<string, string> = {
                  active: 'bg-emerald-50 text-emerald-600',
                  expired: 'bg-red-50 text-red-600',
                  pending_renewal: 'bg-amber-50 text-amber-600',
                  terminated: 'bg-gray-100 text-gray-500',
                };
                return (
                  <div key={baa.id} className="flex items-center justify-between p-4 hover:bg-rani-cream/30 transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm font-body font-medium text-rani-navy">{baa.vendorName}</p>
                      <p className="text-xs font-body text-rani-muted truncate">{baa.serviceDescription}</p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <span className={`text-[10px] font-body font-medium px-2 py-0.5 rounded-full ${statusColors[baa.status] || ''}`}>
                        {baa.status.replace('_', ' ')}
                      </span>
                      <p className="text-[10px] font-body text-rani-muted mt-1">Exp: {baa.expirationDate}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'breaches' && (
          <div className="divide-y divide-rani-border/30">
            {breaches.length === 0 ? (
              <div className="p-6 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-body text-rani-muted">No breaches reported</p>
              </div>
            ) : (
              breaches.map((breach) => {
                const severityColors: Record<string, string> = {
                  low: 'bg-blue-50 text-blue-600',
                  medium: 'bg-amber-50 text-amber-600',
                  high: 'bg-orange-50 text-orange-600',
                  critical: 'bg-red-50 text-red-600',
                };
                return (
                  <div key={breach.id} className="p-4 hover:bg-rani-cream/30 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-body font-medium text-rani-navy">{breach.description}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className={`text-[10px] font-body font-medium px-2 py-0.5 rounded-full ${severityColors[breach.severity]}`}>
                            {breach.severity}
                          </span>
                          <span className="text-xs font-body text-rani-muted">
                            {breach.individualsAffected} affected
                          </span>
                          <span className="text-xs font-body text-rani-muted">
                            {breach.status}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-body text-rani-muted flex-shrink-0 ml-4">
                        {breach.discoveryDate}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'access' && (
          <div className="divide-y divide-rani-border/30">
            {accessLogs.length === 0 ? (
              <p className="p-6 text-sm font-body text-rani-muted text-center">No access logs</p>
            ) : (
              accessLogs.slice(0, 50).map((log) => (
                <div key={log.id} className="flex items-center justify-between p-4 hover:bg-rani-cream/30 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <Eye className="w-4 h-4 text-rani-muted flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-body text-rani-navy">
                        <span className="font-medium">{log.userName}</span>
                        {' '}{log.action}{' '}
                        <span className="text-rani-muted">{log.dataCategory}</span>
                        {' for '}
                        <span className="font-medium">{log.patientName}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <p className="text-[10px] font-body text-rani-muted">
                      {new Date(log.timestamp).toLocaleString()}
                    </p>
                    <p className="text-[10px] font-body text-rani-muted">{log.ipAddress}</p>
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
