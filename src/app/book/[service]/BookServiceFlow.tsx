'use client';

import Link from 'next/link';
import { ArrowRight, CalendarDays, CheckCircle2, CircleDollarSign, Clock3, PhoneCall, ShieldCheck, Sparkles } from 'lucide-react';
import { getServiceById } from '@/lib/booking/services';
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

function formatPhoneHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}

export default function BookServiceFlow({ serviceId }: { serviceId: string }) {
  const service = getServiceById(serviceId);

  if (!service) {
    return null;
  }

  const combinedServices = service.canCombineWith
    .map((id) => getServiceById(id))
    .filter(Boolean)
    .slice(0, 3);

  const bookingUrl = BOOKING_URL;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <section className="rounded-lg border border-[#E7E0D4] bg-white p-6 shadow-sm">
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
      </section>

      <aside className="rounded-lg border border-[#E7E0D4] bg-[#0F1D2C] p-6 text-white shadow-sm">
        <div className="rounded-md bg-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#E7D2A7]">
          Booking command center
        </div>

        <h2 className="mt-4 text-2xl font-semibold">Book in Mangomint</h2>
        <p className="mt-3 text-sm leading-6 text-white/80">
          Your live calendar, availability, and final appointment confirmation happen in Mangomint. This keeps your front desk, provider schedules, and client reminders aligned in one place.
        </p>

        <div className="mt-5 space-y-3 rounded-lg bg-white/5 p-4 text-sm text-white/85">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#E7D2A7]" />
            <span>Choose your real-time slot in the hosted booking calendar.</span>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#E7D2A7]" />
            <span>Deposits and cancellation expectations stay consistent with clinic policy.</span>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#E7D2A7]" />
            <span>High-ticket services can still be closed with Cherry or PatientFi after consult.</span>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <a
            href={bookingUrl}
            target="_blank"
            rel="noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-md bg-[#C9A96E] px-4 py-3 text-sm font-semibold text-[#0F1D2C] transition hover:bg-[#d5b981]"
          >
            Open live booking
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
            Until direct Mangomint write-back is fully implemented, this hosted booking path is the safest way to keep the website, front desk, and provider calendars perfectly aligned.
          </p>
        </div>
      </aside>
    </div>
  );
}
