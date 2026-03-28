import { Metadata } from 'next';
import BookConfirmClient from './BookConfirmClient';

export const metadata: Metadata = {
  title: 'Confirm Booking | Rani Beauty Clinic',
};

export default function BookConfirmPage() {
  return (
    <main className="min-h-screen bg-[#FAF8F5] py-16 px-4">
      <div className="max-w-lg mx-auto">
        <BookConfirmClient />
      </div>
    </main>
  );
}
