'use client';

import { useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';

interface ExportPDFButtonProps {
  planData: {
    clientName: string;
    planName: string;
    phases: Array<{
      id: number;
      label: string;
      services: Array<{
        name: string;
        price: number;
        quantity: number;
        sessions: number;
        notes?: string;
      }>;
    }>;
    packages: Array<{
      tier: 'Start' | 'Transform' | 'Elite';
      name: string;
      price: number;
      originalPrice: number;
      discount: number;
      sessions: number;
      lineItems: Array<{ service: string; qty: number; unitPrice: number; total: number }>;
      monthlyPayment12: number;
      monthlyPayment24: number;
      highlighted: boolean;
      extras: string[];
    }>;
  };
  disabled?: boolean;
}

export default function ExportPDFButton({ planData, disabled }: ExportPDFButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    if (loading || disabled) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/dashboard/plan-builder/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planData }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Export failed' }));
        throw new Error(errData.error || 'Failed to generate plan document');
      }

      const { html } = await res.json();

      // Open HTML in new window and trigger print
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Pop-up blocked. Please allow pop-ups for this site.');
      }

      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();

      // Wait for fonts to load before printing
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 500);
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Export failed';
      setError(message);
      // Auto-clear error after 5s
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={handleExport}
        disabled={loading || disabled}
        className={`
          inline-flex items-center gap-2 font-body text-sm font-medium
          px-4 py-2.5 rounded-lg transition-all duration-200
          ${
            disabled
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : loading
                ? 'bg-rani-navy/80 text-white cursor-wait'
                : 'bg-rani-navy text-white hover:bg-rani-navy/90 active:scale-[0.98]'
          }
        `}
        title={disabled ? 'Add services to generate a plan' : 'Export treatment plan as PDF'}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <FileDown className="w-4 h-4" />
        )}
        {loading ? 'Generating...' : 'Export PDF'}
      </button>

      {error && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-red-50 text-red-700 text-xs font-body rounded-lg px-3 py-2 shadow-md z-10">
          {error}
        </div>
      )}
    </div>
  );
}
