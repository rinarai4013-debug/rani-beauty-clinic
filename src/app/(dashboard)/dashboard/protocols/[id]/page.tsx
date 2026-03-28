'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ProtocolViewer } from '@/components/ai';
import { DashboardErrorBoundary, PanelSkeleton } from '@/components/dashboard/shared';
import { useProtocol } from '@/hooks/useAITreatmentData';

export default function ProtocolDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: protocol, isLoading, error } = useProtocol(id);

  return (
    <DashboardErrorBoundary>
      <div className="space-y-4">
        <Link
          href="/dashboard/protocols"
          className="inline-flex items-center gap-2 text-sm font-montserrat text-[#0F1D2C]/60 hover:text-[#C9A96E] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Protocols
        </Link>

        {isLoading && <PanelSkeleton />}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm font-montserrat">
            Protocol not found or failed to load.
          </div>
        )}

        {protocol && <ProtocolViewer protocol={protocol} />}
      </div>
    </DashboardErrorBoundary>
  );
}
