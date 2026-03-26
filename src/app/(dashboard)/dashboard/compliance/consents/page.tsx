'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import ConsentBuilder from '@/components/dashboard/compliance/ConsentBuilder';
import { CONSENT_TEMPLATES } from '@/data/compliance/consents';

export default function ConsentsPage() {
  const [recentConsents, setRecentConsents] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/dashboard/compliance?section=consents')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.recentConsents) setRecentConsents(data.recentConsents);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/compliance" className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-rani-cream transition-colors">
          <ChevronLeft className="w-4 h-4 text-rani-muted" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#0F1D2C] font-['Playfair_Display']">Consent Management</h1>
          <p className="text-gray-500 mt-0.5 text-sm">{CONSENT_TEMPLATES.length} treatment-specific consent templates</p>
        </div>
      </div>
      <ConsentBuilder
        templates={CONSENT_TEMPLATES.filter((t) => t.status === 'active')}
        recentConsents={recentConsents}
      />
    </div>
  );
}
