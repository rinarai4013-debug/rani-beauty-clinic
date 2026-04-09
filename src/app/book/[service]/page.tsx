import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import BookServiceFlow from './BookServiceFlow';
import { getServiceById } from '@/lib/booking/services';

interface Props {
  params: { service: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const service = getServiceById(params.service);
  if (!service) return { title: 'Service Not Found' };

  return {
    title: `Book ${service.name} | Rani Beauty Clinic`,
    description: `Book your ${service.name} appointment at Rani Beauty Clinic. ${service.duration} minutes, starting at $${service.price}.`,
  };
}

export default function BookServicePage({ params }: Props) {
  const service = getServiceById(params.service);
  if (!service) notFound();

  return (
    <main className="min-h-screen bg-[#FAF8F5]">
      <section className="bg-[#0F1D2C] text-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <a href="/book" className="text-sm text-[#C9A96E] hover:underline mb-4 inline-block">
            &larr; Back to services
          </a>
          <h1 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-heading)]">
            Book <span className="text-[#C9A96E]">{service.name}</span>
          </h1>
          <p className="text-gray-300 mt-2">
            {service.duration} minutes &middot; ${service.price}
            {service.depositRequired > 0 && ` &middot; $${service.depositRequired} deposit`}
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-12">
        <BookServiceFlow />
      </section>
    </main>
  );
}
