import { Metadata } from 'next';
import IntakePageClient from './IntakePageClient';

export const metadata: Metadata = {
  title: 'Digital Intake Form | Rani Beauty Clinic',
  description: 'Complete your digital intake form before your appointment at Rani Beauty Clinic.',
};

export default function IntakePage() {
  return (
    <main className="min-h-screen bg-[#FAF8F5]">
      <section className="bg-[#0F1D2C] text-white py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-heading)] mb-3">
            Digital Intake Form
          </h1>
          <p className="text-gray-300 max-w-xl mx-auto">
            Please complete this form before your appointment. Your information is kept
            strictly confidential under HIPAA guidelines.
          </p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-12">
        <IntakePageClient />
      </section>
    </main>
  );
}
