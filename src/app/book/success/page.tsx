import Link from 'next/link';
import { CheckCircle2, PhoneCall } from 'lucide-react';
import { Metadata } from 'next';
import { CLINIC_PHONE } from '@/data/clinic-config';

export const metadata: Metadata = {
  title: 'Booking Request Received | Rani Beauty Clinic',
  description: 'Your booking request has been received. We will confirm your appointment and next steps shortly.',
};

function formatPhoneHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}

export default function BookingSuccessPage() {
  return (
    <main className="min-h-screen bg-[#FAF8F5] px-4 py-16">
      <div className="mx-auto max-w-3xl rounded-lg border border-[#E7E0D4] bg-white p-8 shadow-sm">
        <div className="flex items-center gap-3 text-[#3E6B3A]">
          <CheckCircle2 className="h-8 w-8" />
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em]">Booking received</p>
            <h1 className="text-3xl font-semibold text-[#0F1D2C]">We’ve got your request</h1>
          </div>
        </div>

        <p className="mt-6 text-base leading-7 text-[#4B5563]">
          Your appointment details are being finalized. If your booking came through the hosted Mangomint flow,
          you should also receive confirmation and reminder messages directly from the clinic.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-[#EEE7DC] bg-[#FCFBF9] p-4">
            <p className="text-sm font-medium text-[#0F1D2C]">Next step</p>
            <p className="mt-2 text-sm text-[#6B7280]">Watch for your confirmation, reminder, and any deposit instructions.</p>
          </div>
          <div className="rounded-lg border border-[#EEE7DC] bg-[#FCFBF9] p-4">
            <p className="text-sm font-medium text-[#0F1D2C]">Need help?</p>
            <p className="mt-2 text-sm text-[#6B7280]">If you need to change anything, call the clinic and we’ll help you quickly.</p>
          </div>
          <div className="rounded-lg border border-[#EEE7DC] bg-[#FCFBF9] p-4">
            <p className="text-sm font-medium text-[#0F1D2C]">Want a full plan?</p>
            <p className="mt-2 text-sm text-[#6B7280]">High-ticket and multi-service treatments can move into a consult + financing flow.</p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/book"
            className="rounded-md bg-[#0F1D2C] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#17293b]"
          >
            Book another service
          </Link>
          <a
            href={formatPhoneHref(CLINIC_PHONE)}
            className="inline-flex items-center gap-2 rounded-md border border-[#E6DAC6] px-4 py-3 text-sm font-semibold text-[#0F1D2C] transition hover:bg-[#FCFBF9]"
          >
            <PhoneCall className="h-4 w-4" />
            Call the clinic
          </a>
        </div>
      </div>
    </main>
  );
}
