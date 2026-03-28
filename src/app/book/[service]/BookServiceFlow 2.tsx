'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import BookingSteps from '@/components/booking/BookingSteps';
import ProviderSelector from '@/components/booking/ProviderSelector';
import DatePicker from '@/components/booking/DatePicker';
import TimeSlotPicker from '@/components/booking/TimeSlotPicker';
import BookingSummary from '@/components/booking/BookingSummary';
import { useAvailability, useBooking } from '@/hooks/useBooking';
import { getServiceById } from '@/lib/booking/services';
import type { TimeSlot } from '@/lib/booking/types';

const BOOKING_STEPS = ['Select Service', 'Choose Time', 'Confirm', 'Intake', 'Complete'];

interface Props {
  serviceId: string;
}

export default function BookServiceFlow({ serviceId }: Props) {
  const router = useRouter();
  const service = getServiceById(serviceId) ?? null;
  const { createBooking } = useBooking();

  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { availability, isLoading } = useAvailability(
    serviceId,
    selectedDate,
    selectedProvider ?? undefined,
  );

  const handleBook = async () => {
    if (!selectedSlot || !service) return;

    setIsBooking(true);
    setError(null);

    try {
      const result = await createBooking({
        serviceId,
        providerId: selectedSlot.providerId,
        roomId: selectedSlot.roomId,
        date: selectedSlot.date,
        startTime: selectedSlot.startTime,
        source: 'online',
      });

      if (result.success && result.appointment) {
        router.push(`/book/confirm?appointmentId=${result.appointment.id}`);
      } else {
        setError(result.error ?? 'Booking failed. Please try a different time.');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsBooking(false);
    }
  };

  if (!service) return null;

  return (
    <div>
      <BookingSteps currentStep={1} steps={BOOKING_STEPS} />

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left: Selection flow */}
        <div className="lg:col-span-2 space-y-8">
          {/* Provider Selection */}
          <div>
            <h2 className="text-xl font-semibold text-[#0F1D2C] font-[family-name:var(--font-heading)] mb-4">
              Choose Your Provider
            </h2>
            <ProviderSelector
              selectedProviderId={selectedProvider}
              onSelect={id => { setSelectedProvider(id); setSelectedSlot(null); }}
              serviceId={serviceId}
            />
          </div>

          {/* Date Selection */}
          <div>
            <h2 className="text-xl font-semibold text-[#0F1D2C] font-[family-name:var(--font-heading)] mb-4">
              Select a Date
            </h2>
            <DatePicker
              selectedDate={selectedDate}
              onSelect={date => { setSelectedDate(date); setSelectedSlot(null); }}
            />
          </div>

          {/* Time Selection */}
          {selectedDate && (
            <div>
              <h2 className="text-xl font-semibold text-[#0F1D2C] font-[family-name:var(--font-heading)] mb-4">
                Available Times
              </h2>
              <TimeSlotPicker
                slots={availability?.slots ?? []}
                selectedSlot={selectedSlot}
                onSelect={setSelectedSlot}
                isLoading={isLoading}
              />

              {availability?.isFullyBooked && availability?.nextAvailableDate && (
                <p className="text-sm text-[#6B7280] mt-4">
                  This date is fully booked. Next available:{' '}
                  <button
                    onClick={() => setSelectedDate(availability.nextAvailableDate!)}
                    className="text-[#C9A96E] font-medium hover:underline"
                  >
                    {availability.nextAvailableDate}
                  </button>
                </p>
              )}
            </div>
          )}

          {/* Book button */}
          {selectedSlot && (
            <div className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
                  {error}
                </div>
              )}

              {service.preInstructions.length > 0 && (
                <div className="bg-[#F8F6F1] rounded-xl p-4">
                  <h3 className="text-sm font-medium text-[#0F1D2C] mb-2">Preparation Instructions</h3>
                  <ul className="space-y-1 text-sm text-[#6B7280]">
                    {service.preInstructions.map((inst, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-[#C9A96E] mt-0.5">&#8226;</span>
                        {inst}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                onClick={handleBook}
                disabled={isBooking}
                className="w-full py-4 rounded-xl bg-[#C9A96E] text-white text-lg font-bold hover:bg-[#b89558] disabled:opacity-50 transition-all shadow-lg"
              >
                {isBooking ? 'Booking...' : `Book ${service.name}`}
              </button>

              {service.cancellationPolicy === 'strict' && (
                <p className="text-xs text-center text-[#6B7280]">
                  This service requires 48 hours notice for cancellation or rescheduling.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right: Summary sidebar */}
        <div className="lg:col-span-1">
          <BookingSummary
            service={service}
            slot={selectedSlot}
            date={selectedDate}
          />
        </div>
      </div>
    </div>
  );
}
