import { Metadata } from 'next';
import { Suspense } from 'react';
import BookConfirmClient from './BookConfirmClient';

export const metadata: Metadata = {
  title: 'Confirm Booking | Rani Beauty Clinic',
};

export default function BookConfirmPage() {
  return (
    <main className="min-h-screen bg-[#FAF8F5] py-16 px-4">
      <div className="max-w-lg mx-auto">
        <Suspense
          fallback={
            <section className="rounded-3xl border border-[#E8E4DF] bg-white p-8 text-center shadow-xl">
              <p className="font-body text-sm text-[#6B7280]">Loading booking details...</p>
            </section>
          }
        >
          <BookConfirmClient />
        </Suspense>
      </div>
    </main>
  );
}
