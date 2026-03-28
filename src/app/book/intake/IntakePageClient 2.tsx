'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import IntakeFormRenderer from '@/components/booking/IntakeFormRenderer';
import { useIntakeForm } from '@/hooks/useBooking';

export default function IntakePageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientId = searchParams.get('clientId') ?? 'new-client';
  const appointmentId = searchParams.get('appointmentId') ?? undefined;
  const serviceId = searchParams.get('serviceId') ?? undefined;

  const { form, progress, requiredConsents, updateField, signConsent, submitForm, isLoading } = useIntakeForm(
    clientId,
    appointmentId,
    serviceId,
  );

  const handleSubmit = async () => {
    if (!form) return;
    await submitForm(form.id, form.sections);
    router.push('/book/success');
  };

  if (isLoading || !form || !progress || !requiredConsents) {
    return (
      <div className="space-y-6">
        <div className="h-4 bg-gray-100 rounded-full animate-pulse" />
        <div className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <IntakeFormRenderer
      form={form}
      progress={progress}
      requiredConsents={requiredConsents as import('@/lib/booking/intake').ConsentFormTemplate[]}
      onUpdateField={(sectionId, fieldId, value) => updateField(form.id, sectionId, fieldId, value)}
      onSignConsent={(type, sig) => signConsent(form.id, type, sig)}
      onSubmit={handleSubmit}
    />
  );
}
