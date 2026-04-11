import Link from 'next/link';
import { ClipboardList, ShieldCheck } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pre-Visit Intake | Rani Beauty Clinic',
  description: 'Complete your intake and consent details before your visit to keep check-in smooth and on time.',
};

export default function BookingIntakePage() {
  return (
    <main className="min-h-screen bg-[#FAF8F5] px-4 py-16">
      <div className="mx-auto max-w-3xl rounded-lg border border-[#E7E0D4] bg-white p-8 shadow-sm">
        <div className="flex items-center gap-3">
          <ClipboardList className="h-8 w-8 text-[#C9A96E]" />
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8A6B2F]">Pre-visit intake</p>
            <h1 className="text-3xl font-semibold text-[#0F1D2C]">Complete your intake before arrival</h1>
          </div>
        </div>

        <p className="mt-6 text-base leading-7 text-[#4B5563]">
          This step helps the clinic move faster at check-in, catch contraindications early, and keep your appointment focused on treatment instead of paperwork.
        </p>

        <div className="mt-8 space-y-4">
          <div className="rounded-lg border border-[#EEE7DC] bg-[#FCFBF9] p-5">
            <div className="flex items-center gap-2 text-sm font-medium text-[#0F1D2C]">
              <ShieldCheck className="h-4 w-4 text-[#0F4C5C]" />
              What you’ll complete
            </div>
            <ul className="mt-3 space-y-2 text-sm text-[#6B7280]">
              <li>- contact and medical intake basics</li>
              <li>- treatment-specific consent forms</li>
              <li>- pre-visit notes that help the provider personalize your plan</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/contact"
            className="rounded-md bg-[#0F1D2C] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#17293b]"
          >
            Contact the clinic
          </Link>
          <Link
            href="/book"
            className="rounded-md border border-[#E6DAC6] px-4 py-3 text-sm font-semibold text-[#0F1D2C] transition hover:bg-[#FCFBF9]"
          >
            Back to booking
          </Link>
        </div>
      </div>
    </main>
  );
}
