'use client';

import { useState, useCallback, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import { ArrowLeft, Save, CheckCircle, Loader2 } from 'lucide-react';
import ChartingHeader from '@/components/dashboard/charting/ChartingHeader';
import ComplianceBanner from '@/components/dashboard/charting/ComplianceBanner';
import InjectionLogForm from '@/components/dashboard/charting/InjectionLogForm';
import SoapNoteForm from '@/components/dashboard/charting/SoapNoteForm';
import ConsultationForm from '@/components/dashboard/charting/ConsultationForm';
import ProgramNoteForm from '@/components/dashboard/charting/ProgramNoteForm';
import BodyTreatmentForm from '@/components/dashboard/charting/BodyTreatmentForm';
import LabDrawForm from '@/components/dashboard/charting/LabDrawForm';
import type { ChartTemplateType } from '@/lib/charting/templates';
import type { ValidationError, ComplianceCheck } from '@/lib/charting/engine';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function ChartDetailPage() {
  const params = useParams();
  const router = useRouter();
  const recordId = params.id as string;

  const { data, error, mutate } = useSWR(
    recordId ? `/api/dashboard/charting?id=${recordId}` : null,
    fetcher,
    { refreshInterval: 0 }
  );

  const [chartData, setChartData] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [signing, setSigning] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [localValidation, setLocalValidation] = useState<ComplianceCheck | null>(null);

  const chart = data?.chart;
  const serverValidation: ComplianceCheck | null = data?.validation || null;
  const validation = localValidation || serverValidation;

  // Initialize local data from server
  useEffect(() => {
    if (chart?.data && Object.keys(chartData).length === 0) {
      setChartData(chart.data);
    }
  }, [chart?.data]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFieldChange = useCallback((fieldId: string, value: unknown) => {
    setChartData((prev) => ({ ...prev, [fieldId]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    if (!chart) return;
    setSaving(true);
    try {
      const res = await fetch('/api/dashboard/charting', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recordId,
          data: chartData,
          templateType: chart.templateType,
        }),
      });
      const result = await res.json();
      if (result.success) {
        setLastSaved(new Date().toLocaleTimeString());
        setLocalValidation(result.validation);
        mutate();
      }
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  }, [chart, chartData, recordId, mutate]);

  const handleSign = useCallback(async () => {
    if (!chart) return;
    setSigning(true);
    try {
      const res = await fetch('/api/dashboard/charting', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recordId,
          data: chartData,
          templateType: chart.templateType,
          status: 'signed',
        }),
      });
      const result = await res.json();
      if (result.success) {
        setLastSaved(new Date().toLocaleTimeString());
        setLocalValidation(result.validation);
        mutate();
      } else if (result.validation) {
        setLocalValidation(result.validation);
      }
    } catch (err) {
      console.error('Sign failed:', err);
    } finally {
      setSigning(false);
    }
  }, [chart, chartData, recordId, mutate]);

  // Auto-save every 30 seconds if there are changes
  useEffect(() => {
    const interval = setInterval(() => {
      if (chart && Object.keys(chartData).length > 0 && chart.status === 'draft') {
        handleSave();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [chart, chartData, handleSave]);

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500">Failed to load chart.</p>
        <button
          onClick={() => router.push('/dashboard/charting')}
          className="mt-4 text-[#C9A96E] hover:underline"
        >
          Back to Charts
        </button>
      </div>
    );
  }

  if (!chart) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#C9A96E]" />
      </div>
    );
  }

  const isReadOnly = chart.status === 'signed' || chart.status === 'reviewed';
  const templateType = chart.templateType as ChartTemplateType;
  const errors: ValidationError[] = validation?.errors || [];

  // Select the right form component
  const FormComponent = {
    injection_log: InjectionLogForm,
    soap_note: SoapNoteForm,
    consultation: ConsultationForm,
    program_note: ProgramNoteForm,
    body_treatment: BodyTreatmentForm,
    lab_draw: LabDrawForm,
  }[templateType];

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => router.push('/dashboard/charting')}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-[#C9A96E] transition"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Charts
      </button>

      {/* Header */}
      <ChartingHeader
        templateType={templateType}
        clientName={chart.clientName}
        providerName={chart.providerName}
        appointmentDate={chart.appointmentDate}
        chartId={chart.chartId}
        status={chart.status}
      />

      {/* Compliance Banner */}
      {validation && (
        <ComplianceBanner
          isCompliant={validation.isCompliant}
          blocksCheckout={validation.blocksCheckout}
          completionPercentage={validation.completionPercentage}
          missingRequired={validation.missingRequired}
          status={chart.status}
        />
      )}

      {/* Form */}
      {FormComponent && (
        <FormComponent
          data={chartData}
          errors={errors}
          onChange={handleFieldChange}
          readOnly={isReadOnly}
        />
      )}

      {/* Action Bar */}
      {!isReadOnly && (
        <div className="sticky bottom-0 z-10 rounded-xl border border-gray-200 bg-white p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {lastSaved && (
                <span>Last saved: {lastSaved}</span>
              )}
              {validation && (
                <span className="ml-4">
                  {validation.completionPercentage}% complete
                  {validation.errors.length > 0 && (
                    <span className="text-red-500 ml-1">
                      ({validation.errors.length} issue{validation.errors.length !== 1 ? 's' : ''})
                    </span>
                  )}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Draft
              </button>
              <button
                onClick={handleSign}
                disabled={signing || !validation?.isCompliant}
                className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {signing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                Sign & Complete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
