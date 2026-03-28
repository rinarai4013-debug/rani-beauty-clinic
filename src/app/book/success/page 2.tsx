import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Booking Complete | Rani Beauty Clinic',
};

export default function BookSuccessPage() {
  return (
    <main className="min-h-screen bg-[#FAF8F5] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Success icon */}
        <div className="w-20 h-20 bg-[#C9A96E] rounded-full flex items-center justify-center mx-auto mb-8">
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-[#0F1D2C] font-[family-name:var(--font-heading)] mb-4">
          You&apos;re All Set!
        </h1>

        <p className="text-[#6B7280] mb-8 text-lg">
          Your booking is confirmed and your intake form has been submitted.
          We&apos;ll send you reminders before your appointment.
        </p>

        <div className="bg-[#F8F6F1] rounded-2xl p-6 mb-8">
          <h2 className="font-semibold text-[#0F1D2C] mb-3">What happens next?</h2>
          <ul className="space-y-2 text-sm text-[#6B7280] text-left">
            <li className="flex items-start gap-2">
              <span className="text-[#C9A96E] font-bold">1.</span>
              You&apos;ll receive a confirmation email with appointment details
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#C9A96E] font-bold">2.</span>
              We&apos;ll send reminders at 7 days, 2 days, and the morning of your appointment
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#C9A96E] font-bold">3.</span>
              Arrive 10 minutes early for a seamless check-in experience
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#C9A96E] font-bold">4.</span>
              Our team will take exceptional care of you
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <Link
            href="/"
            className="block w-full py-3 rounded-xl bg-[#0F1D2C] text-white font-medium hover:bg-[#1a2d40] transition-colors"
          >
            Return to Homepage
          </Link>
          <Link
            href="/book"
            className="block w-full py-3 rounded-xl border-2 border-[#E8E4DF] text-[#0F1D2C] font-medium hover:border-[#C9A96E] transition-colors"
          >
            Book Another Service
          </Link>
        </div>

        <p className="text-xs text-[#6B7280] mt-8">
          Rani Beauty Clinic | 401 Olympia Ave NE #101, Renton, WA 98056
        </p>
      </div>
    </main>
  );
}
