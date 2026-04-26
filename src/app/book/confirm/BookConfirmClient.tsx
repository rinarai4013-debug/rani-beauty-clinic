'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowRight, CalendarCheck, Phone, ShieldCheck } from 'lucide-react';

import { clinicInfo } from '@/data/clinic-info';

export default function BookConfirmClient() {
  const searchParams = useSearchParams();
  const serviceId = searchParams.get('serviceId');
  const date = searchParams.get('date');
  const time = searchParams.get('time') || searchParams.get('startTime');
  const mangomintUrl = serviceId
    ? `${clinicInfo.booking.url}?serviceId=${encodeURIComponent(serviceId)}`
    : clinicInfo.booking.url;

  return (
    <section className="rounded-3xl border border-[#E8E4DF] bg-white p-8 shadow-xl">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#C9A96E]/15">
        <CalendarCheck className="h-8 w-8 text-[#9B7A28]" />
      </div>

      <h1 className="text-center font-heading text-3xl font-bold text-[#0F1D2C]">
        Finish Your Booking
      </h1>
      <p className="mt-3 text-center font-body text-sm leading-relaxed text-[#6B7280]">
        We have your requested booking details. Final appointment confirmation
        happens in Mangomint so the clinic calendar, reminders, and deposits stay in sync.
      </p>

      {(serviceId || date || time) && (
        <dl className="mt-6 rounded-2xl bg-[#FAF8F5] p-5 text-sm">
          {serviceId && (
            <div className="flex justify-between gap-4 py-2">
              <dt className="text-[#6B7280]">Service</dt>
              <dd className="font-semibold text-[#0F1D2C]">{serviceId.replace(/-/g, ' ')}</dd>
            </div>
          )}
          {date && (
            <div className="flex justify-between gap-4 py-2">
              <dt className="text-[#6B7280]">Requested date</dt>
              <dd className="font-semibold text-[#0F1D2C]">{date}</dd>
            </div>
          )}
          {time && (
            <div className="flex justify-between gap-4 py-2">
              <dt className="text-[#6B7280]">Requested time</dt>
              <dd className="font-semibold text-[#0F1D2C]">{time}</dd>
            </div>
          )}
        </dl>
      )}

      <div className="mt-8 space-y-3">
        <a
          href={mangomintUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-full bg-[#C9A96E] px-6 py-3.5 font-body font-bold text-[#0F1D2C] transition hover:bg-[#B8963D]"
        >
          Confirm in Mangomint <ArrowRight className="h-4 w-4" />
        </a>
        <a
          href={clinicInfo.phoneTel}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-[#E8E4DF] px-6 py-3.5 font-body font-semibold text-[#0F1D2C] transition hover:border-[#C9A96E]"
        >
          <Phone className="h-4 w-4" /> Call the clinic
        </a>
        <Link
          href="/get-started#consultation"
          className="flex w-full items-center justify-center gap-2 rounded-full border border-[#E8E4DF] px-6 py-3.5 font-body font-semibold text-[#0F1D2C] transition hover:border-[#C9A96E]"
        >
          <ShieldCheck className="h-4 w-4" /> Complete AI intake instead
        </Link>
      </div>
    </section>
  );
}
