'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CalendarDays, CheckCircle2, CircleDollarSign, Clock3, PhoneCall, ShieldCheck, Sparkles } from 'lucide-react';
import BookingSummary from '@/components/booking/BookingSummary';
import TimeSlotPicker from '@/components/booking/TimeSlotPicker';
import { getServiceById } from '@/lib/booking/services';
import type { TimeSlot } from '@/lib/booking/types';
import { BOOKING_URL, CLINIC_PHONE } from '@/data/clinic-config';

const categoryLabels: Record<string, string> = {
  injectables: 'Injectables',
  facial: 'Skin Treatments',
  'chemical-peel': 'Peels',
  laser: 'Laser',
  'rf-microneedling': 'RF Microneedling',
  'skin-tightening': 'Skin Tightening',
  'laser-hair-removal': 'Laser Hair Removal',
  wellness: 'Wellness',
  consultation: 'Consultation',
};

interface AvailabilityResponse {
  slots: TimeSlot[];
}

function formatPhoneHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}

function getDefaultBookingDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().split('T')[0];
}

function getMinBookingDate(): string {
  return new Date().toISOString().split('T')[0];
}

export default function BookServiceFlow({ serviceId }: { serviceId: string }) {
  const service = getServiceById(serviceId);
  const [selectedDate, setSelectedDate] = useState(getDefaultBookingDate);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [isLoadingSlots, setIsLoadingSlots] = useState(true);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [waitlistState, setWaitlistState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [waitlistError, setWaitlistError] = useState<string | null>(null);
  const [waitlistName, setWaitlistName] = useState('');
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistPhone, setWaitlistPhone] = useState('');

  useEffect(() => {
    if (!service) return;

    let active = true;
    setIsLoadingSlots(true);
    setAvailabilityError(null);
    setSelectedSlot(null);

    fetch(`/api/booking/availability?serviceId=${encodeURIComponent(service.id)}&date=${encodeURIComponent(selectedDate)}&includeEmergencySlots=false`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error('Failed to load availability');
        }
        return res.json() as Promise<AvailabilityResponse>;
      })
      .then((data) => {
        if (!active) return;
        setSlots(data.slots || []);
      })
      .catch(() => {
        if (!active) return;
        setSlots([]);
        setAvailabilityError('Live slot recommendations are temporarily unavailable. You can still book directly in Mangomint.');
      })
      .finally(() => {
        if (!active) return;
        setIsLoadingSlots(false);
      });

    return () => {
      active = false;
    };
  }, [selectedDate, service]);

  const combinedServices = useMemo(
    () =>
      service?.canCombineWith
        .map((id) => getServiceById(id))
        .filter(Boolean)
        .slice(0, 3) || [],
    [service],
  );

  if (!service) {
    return null;
  }

  const bookingUrl = BOOKING_URL;
  const primaryButtonLabel = selectedSlot ? `Book ${selectedSlot.startTime} in Mangomint` : 'Open live booking';

  async function handleWaitlistSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setWaitlistState('saving');
    setWaitlistError(null);

    try {
      const res = await fetch('/api/booking/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: `web-${Date.now()}`,
          clientName: waitlistName,
          clientEmail: waitlistEmail,
          clientPhone: waitlistPhone,
          serviceId: service.id,
          serviceName: service.name,
          dateRangeStart: selectedDate,
          dateRangeEnd: selectedDate,
          timePreference: [],
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to join waitlist');
      }

      setWaitlistState('saved');
    } catch {
      setWaitlistState('error');
      setWaitlistError('We could not save the waitlist request right now. Please call the clinic.');
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <section className="space-y-6">
        <div className="rounded-lg border border-[#E7E0D4] bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-2 text-sm text-[#7C6F60]">
            <span className="rounded-full bg-[#F4EEE4] px-3 py-1 font-medium text-[#8A6B2F]">
              {categoryLabels[service.category] || service.category}
            </span>
            {service.requiresConsultation ? (
              <span className="rounded-full bg-[#EEF4F7] px-3 py-1 font-medium text-[#0F4C5C]">
                Consultation-first
              </span>
            ) : null}
            {service.depositRequired > 0 ? (
              <span className="rounded-full bg-[#F7F3EE] px-3 py-1 font-medium text-[#6C4E2B]">
                ${service.depositRequired} deposit
              </span>
            ) : (
              <span className="rounded-full bg-[#F3F7F1] px-3 py-1 font-medium text-[#3E6B3A]">
                No deposit required
              </span>
            )}
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-[#EEE7DC] bg-[#FCFBF9] p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-[#0F1D2C]">
                <Clock3 className="h-4 w-4 text-[#C9A96E]" />
                Visit length
              </div>
              <p className="mt-2 text-2xl font-semibold text-[#0F1D2C]">{service.duration} min</p>
            </div>
            <div className="rounded-lg border border-[#EEE7DC] bg-[#FCFBF9] p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-[#0F1D2C]">
                <CircleDollarSign className="h-4 w-4 text-[#C9A96E]" />
                Starting at
              </div>
              <p className="mt-2 text-2xl font-semibold text-[#0F1D2C]">${service.price}</p>
            </div>
            <div className="rounded-lg border border-[#EEE7DC] bg-[#FCFBF9] p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-[#0F1D2C]">
                <CalendarDays className="h-4 w-4 text-[#C9A96E]" />
                Rebooking rhythm
              </div>
              <p className="mt-2 text-2xl font-semibold text-[#0F1D2C]">{service.rebookingIntervalDays}d</p>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-[#0F1D2C]">Choose your ideal date</h2>
                <p className="mt-1 text-sm text-[#6B7280]">
                  We’ll show the strongest live slot recommendations first, then send you into Mangomint for final confirmation.
                </p>
              </div>
              <input
                type="date"
                min={getMinBookingDate()}
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                className="rounded-md border border-[#E6DAC6] bg-white px-3 py-2 text-sm text-[#0F1D2C]"
              />
            </div>

            <div className="mt-5 rounded-lg border border-[#EEE7DC] bg-[#FCFBF9] p-4">
              {availabilityError ? (
                <p className="text-sm text-[#8A5A44]">{availabilityError}</p>
              ) : (
                <TimeSlotPicker
                  slots={slots}
                  selectedSlot={selectedSlot}
                  onSelect={setSelectedSlot}
                  isLoading={isLoadingSlots}
                />
              )}
            </div>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div>
              <h2 className="text-lg font-semibold text-[#0F1D2C]">Before your visit</h2>
              <ul className="mt-3 space-y-3">
                {service.preInstructions.map((item) => (
                  <li key={item} className="flex gap-3 text-sm text-[#4B5563]">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#C9A96E]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-[#0F1D2C]">Aftercare</h2>
              <ul className="mt-3 space-y-3">
                {service.postInstructions.map((item) => (
                  <li key={item} className="flex gap-3 text-sm text-[#4B5563]">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#0F4C5C]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {combinedServices.length > 0 ? (
            <div className="mt-6 rounded-lg border border-[#EEE7DC] bg-[#FCFBF9] p-5">
              <div className="flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-[#8A6B2F]">
                <Sparkles className="h-4 w-4" />
                Layer this visit
              </div>
              <p className="mt-2 text-sm text-[#4B5563]">
                These pairings can increase average ticket and help you leave with a full treatment plan, not a one-off visit.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {combinedServices.map((combined) => (
                  <Link
                    key={combined!.id}
                    href={`/book/${combined!.id}`}
                    className="rounded-md border border-[#E6DAC6] bg-white px-3 py-2 text-sm font-medium text-[#0F1D2C] hover:border-[#C9A96E]"
                  >
                    {combined!.name}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          {slots.length === 0 && !isLoadingSlots ? (
            <div className="rounded-lg border border-[#E7E0D4] bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-[#0F1D2C]">Join the waitlist</h3>
              <p className="mt-2 text-sm text-[#6B7280]">
                If this date is full, we can prioritize you when a premium slot opens.
              </p>

              {waitlistState === 'saved' ? (
                <div className="mt-4 rounded-md bg-[#F3F7F1] px-4 py-3 text-sm text-[#3E6B3A]">
                  You’re on the waitlist. Front desk can now work this opening if a slot clears.
                </div>
              ) : (
                <form onSubmit={handleWaitlistSubmit} className="mt-4 grid gap-3 md:grid-cols-2">
                  <input
                    required
                    value={waitlistName}
                    onChange={(event) => setWaitlistName(event.target.value)}
                    placeholder="Full name"
                    className="rounded-md border border-[#E6DAC6] px-3 py-2 text-sm text-[#0F1D2C]"
                  />
                  <input
                    required
                    type="email"
                    value={waitlistEmail}
                    onChange={(event) => setWaitlistEmail(event.target.value)}
                    placeholder="Email"
                    className="rounded-md border border-[#E6DAC6] px-3 py-2 text-sm text-[#0F1D2C]"
                  />
                  <input
                    required
                    value={waitlistPhone}
                    onChange={(event) => setWaitlistPhone(event.target.value)}
                    placeholder="Phone"
                    className="rounded-md border border-[#E6DAC6] px-3 py-2 text-sm text-[#0F1D2C] md:col-span-2"
                  />
                  {waitlistError ? (
                    <p className="text-sm text-[#8A5A44] md:col-span-2">{waitlistError}</p>
                  ) : null}
                  <button
                    type="submit"
                    disabled={waitlistState === 'saving'}
                    className="rounded-md bg-[#0F1D2C] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#17293b] md:col-span-2"
                  >
                    {waitlistState === 'saving' ? 'Saving...' : 'Join waitlist'}
                  </button>
                </form>
              )}
            </div>
          ) : null}
        </div>
      </section>

      <aside className="space-y-6">
        <BookingSummary service={service} slot={selectedSlot} date={selectedDate} />

        <section className="rounded-lg border border-[#E7E0D4] bg-[#0F1D2C] p-6 text-white shadow-sm">
          <div className="rounded-md bg-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#E7D2A7]">
            Booking command center
          </div>

          <h2 className="mt-4 text-2xl font-semibold">Book in Mangomint</h2>
          <p className="mt-3 text-sm leading-6 text-white/80">
            Your final appointment confirmation, reminders, and front-desk visibility all happen in Mangomint. We use the live hosted flow so your calendar stays aligned.
          </p>

          <div className="mt-5 space-y-3 rounded-lg bg-white/5 p-4 text-sm text-white/85">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#E7D2A7]" />
              <span>Choose your recommended slot above so you know what to aim for in the hosted calendar.</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#E7D2A7]" />
              <span>Deposits and cancellation rules stay consistent with clinic policy.</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#E7D2A7]" />
              <span>High-ticket closes can still move into Cherry or PatientFi after consult.</span>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <a
              href={bookingUrl}
              target="_blank"
              rel="noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-md bg-[#C9A96E] px-4 py-3 text-sm font-semibold text-[#0F1D2C] transition hover:bg-[#d5b981]"
            >
              {primaryButtonLabel}
              <ArrowRight className="h-4 w-4" />
            </a>

            <a
              href={formatPhoneHref(CLINIC_PHONE)}
              className="flex w-full items-center justify-center gap-2 rounded-md border border-white/20 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/5"
            >
              <PhoneCall className="h-4 w-4" />
              Call to book
            </a>
          </div>

          <div className="mt-6 rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-white/80">
            <p className="font-semibold text-white">Operator note</p>
            <p className="mt-2">
              Until direct Mangomint write-back is fully implemented, this hosted path is the safest way to keep the website, front desk, and provider calendars perfectly aligned.
            </p>
          </div>
        </section>
      </aside>
    </div>
  );
}
