'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import IncidentReportForm from '@/components/dashboard/compliance/IncidentReportForm';

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/dashboard/compliance?section=incidents')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.incidents) setIncidents(data.incidents);
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
          <h1 className="text-2xl font-bold text-[#0F1D2C] font-['Playfair_Display']">Incident Reporting</h1>
          <p className="text-gray-500 mt-0.5 text-sm">OSHA incidents, adverse events, and near-miss reporting</p>
        </div>
      </div>
      <IncidentReportForm incidents={incidents} />
    </div>
  );
}
