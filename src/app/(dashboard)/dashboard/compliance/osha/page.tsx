'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import OSHAPanel from '@/components/dashboard/compliance/OSHAPanel';

export default function OSHAPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch('/api/dashboard/compliance?section=osha')
      .then((r) => r.ok ? r.json() : null)
      .then(setData)
      .catch(() => setData({
        sharpsLogs: [],
        sdsSheets: [],
        incidents: [],
        ppeInventory: [],
        score: 85,
        checklist: [],
      }));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/compliance" className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-rani-cream transition-colors">
          <ChevronLeft className="w-4 h-4 text-rani-muted" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#0F1D2C] font-['Playfair_Display']">OSHA Management</h1>
          <p className="text-gray-500 mt-0.5 text-sm">Workplace safety, hazard communication, and incident tracking</p>
        </div>
      </div>
      {data && <OSHAPanel {...data} />}
    </div>
  );
}
