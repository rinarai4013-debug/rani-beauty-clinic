import { Metadata } from 'next';
import BookServiceSelection from './BookServiceSelection';

export const metadata: Metadata = {
  title: 'Book an Appointment | Rani Beauty Clinic',
  description: 'Book your luxury aesthetic treatment at Rani Beauty Clinic in Renton, WA. Choose from injectables, HydraFacials, laser treatments, skin tightening, and wellness injections.',
};

export default function BookPage() {
  return (
    <main className="min-h-screen bg-[#FAF8F5]">
      {/* Hero */}
      <section className="bg-[#0F1D2C] text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold font-[family-name:var(--font-heading)] mb-4">
            Book Your <span className="text-[#C9A96E]">Transformation</span>
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Select a treatment to begin. Our luxury clinic in Renton, WA
            offers physician-supervised aesthetic services tailored to your unique goals.
          </p>
        </div>
      </section>

      {/* Service Selection */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <BookServiceSelection />
      </section>
    </main>
  );
}
