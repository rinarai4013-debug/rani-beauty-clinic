'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import HIPAAPanel from '@/components/dashboard/compliance/HIPAAPanel';

export default function HIPAAPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch('/api/dashboard/compliance?section=hipaa')
      .then((r) => r.ok ? r.json() : null)
      .then(setData)
      .catch(() => setData({
        trainingRecords: [],
        baas: [],
        breaches: [],
        accessLogs: [],
        score: 88,
      }));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/compliance" className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-rani-cream transition-colors">
          <ChevronLeft className="w-4 h-4 text-rani-muted" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#0F1D2C] font-['Playfair_Display']">HIPAA Management</h1>
          <p className="text-gray-500 mt-0.5 text-sm">Privacy, security, training, and breach management</p>
        </div>
      </div>
      {data && <HIPAAPanel {...data} />}
    </div>
  );
}
