'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ServiceCard from '@/components/booking/ServiceCard';
import BookingSteps from '@/components/booking/BookingSteps';
import { BOOKABLE_SERVICES, getBookableCategories, getServicesByCategory } from '@/lib/booking/services';

const BOOKING_STEPS = ['Select Service', 'Choose Time', 'Confirm', 'Intake', 'Complete'];

export default function BookServiceSelection() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const categories = getBookableCategories();

  const handleServiceSelect = (serviceId: string) => {
    router.push(`/book/${serviceId}`);
  };

  const displayedServices = selectedCategory
    ? getServicesByCategory(selectedCategory)
    : BOOKABLE_SERVICES.filter(s => s.isActive && s.price > 0);

  return (
    <div>
      <BookingSteps currentStep={0} steps={BOOKING_STEPS} />

      {/* Category filters */}
      <div className="flex flex-wrap gap-2 mb-8 justify-center">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-5 py-2.5 rounded-full text-sm font-medium transition-colors ${
            selectedCategory === null
              ? 'bg-[#0F1D2C] text-white'
              : 'bg-white border border-[#E8E4DF] text-[#6B7280] hover:border-[#C9A96E]'
          }`}
        >
          All Services
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-5 py-2.5 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === cat.id
                ? 'bg-[#0F1D2C] text-white'
                : 'bg-white border border-[#E8E4DF] text-[#6B7280] hover:border-[#C9A96E]'
            }`}
          >
            {cat.name} ({cat.count})
          </button>
        ))}
      </div>

      {/* Service grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {displayedServices.map(service => (
          <ServiceCard
            key={service.id}
            service={service}
            onSelect={handleServiceSelect}
          />
        ))}
      </div>

      {displayedServices.length === 0 && (
        <p className="text-center text-[#6B7280] py-12">
          No services available in this category.
        </p>
      )}
    </div>
  );
}
