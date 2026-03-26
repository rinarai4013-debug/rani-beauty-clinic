'use client';

import { motion } from 'framer-motion';
import { Award, AlertTriangle, Clock, CheckCircle2, BookOpen } from 'lucide-react';
import type { ProviderLicense } from '@/types/compliance';

interface LicenseTrackerProps {
  licenses: ProviderLicense[];
  score: number;
}

export default function LicenseTracker({ licenses, score }: LicenseTrackerProps) {
  const now = new Date();

  function getDaysUntilExpiry(expDate: string): number {
    return Math.ceil((new Date(expDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  function getStatusBadge(license: ProviderLicense) {
    const days = getDaysUntilExpiry(license.expirationDate);
    if (days <= 0) return { label: 'EXPIRED', color: 'bg-red-100 text-red-700' };
    if (days <= 30) return { label: `${days}d left`, color: 'bg-red-50 text-red-600' };
    if (days <= 90) return { label: `${days}d left`, color: 'bg-amber-50 text-amber-600' };
    return { label: 'Active', color: 'bg-emerald-50 text-emerald-600' };
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Award className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-body font-bold text-rani-navy">License & Credential Tracker</h2>
              <p className="text-xs font-body text-rani-muted">Provider licenses, CE credits, and renewal tracking</p>
            </div>
          </div>
          <span className={`text-2xl font-body font-bold ${score >= 80 ? 'text-emerald-600' : score >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
            {score}%
          </span>
        </div>
      </div>

      {/* License Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {licenses.map((license) => {
          const days = getDaysUntilExpiry(license.expirationDate);
          const badge = getStatusBadge(license);
          const ceProgress = license.ceCreditsRequired > 0
            ? Math.min(100, Math.round((license.ceCreditsCompleted / license.ceCreditsRequired) * 100))
            : 100;

          return (
            <motion.div
              key={license.id}
              whileHover={{ y: -2 }}
              className={`bg-white/80 backdrop-blur-sm rounded-xl border p-5 ${
                days <= 0 ? 'border-red-200' : days <= 30 ? 'border-amber-200' : 'border-rani-border'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-sm font-body font-bold text-rani-navy">{license.providerName}</h3>
                  <p className="text-xs font-body text-rani-muted">{license.licenseType}</p>
                </div>
                <span className={`text-[10px] font-body font-medium px-2 py-0.5 rounded-full ${badge.color}`}>
                  {badge.label}
                </span>
              </div>

              <div className="space-y-2 text-xs font-body text-rani-muted">
                <div className="flex justify-between">
                  <span>License #</span>
                  <span className="font-medium text-rani-navy">{license.licenseNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Type</span>
                  <span className="capitalize">{license.providerType.replace(/_/g, ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Expiration</span>
                  <span className={days <= 30 ? 'text-red-600 font-medium' : ''}>{license.expirationDate}</span>
                </div>
                <div className="flex justify-between">
                  <span>State</span>
                  <span>{license.state}</span>
                </div>
              </div>

              {/* CE Credits */}
              {license.ceCreditsRequired > 0 && (
                <div className="mt-4 pt-3 border-t border-rani-border/30">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-body text-rani-muted flex items-center gap-1">
                      <BookOpen className="w-3 h-3" /> CE Credits
                    </span>
                    <span className="text-xs font-body font-medium text-rani-navy">
                      {license.ceCreditsCompleted}/{license.ceCreditsRequired}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${ceProgress >= 100 ? 'bg-emerald-500' : ceProgress >= 50 ? 'bg-rani-gold' : 'bg-red-500'}`}
                      style={{ width: `${ceProgress}%` }}
                    />
                  </div>
                  <p className="text-[10px] font-body text-rani-muted mt-1">
                    Deadline: {license.ceDeadline}
                  </p>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {licenses.length === 0 && (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-8 text-center">
          <Award className="w-10 h-10 text-rani-muted mx-auto mb-3" />
          <p className="text-sm font-body text-rani-muted">No licenses tracked yet</p>
        </div>
      )}
    </div>
  );
}
