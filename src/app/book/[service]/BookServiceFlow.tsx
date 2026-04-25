'use client';

/**
 * BookServiceFlow
 *
 * Service-specific booking surface. Previously a stub that returned null (P0 bug ·
 * every `/book/<slug>` page rendered blank). Now wraps MangomintEmbedWidget and
 * passes the current service slug so Mangomint can pre-select the service.
 *
 * The service slug from the URL is mapped to a Mangomint serviceId via the
 * bookable services catalog in `/lib/booking/services.ts`. If the slug does not
 * resolve to a known service, the widget falls back to the full Mangomint
 * booking flow so the user is never stranded.
 */

import React from 'react';
import { useParams } from 'next/navigation';
import MangomintEmbedWidget from '@/components/booking/MangomintEmbedWidget';
import { getServiceById } from '@/lib/booking/services';

export default function BookServiceFlow() {
  const params = useParams<{ service?: string }>();
  const slug = params?.service;
  const service = slug ? getServiceById(slug) : null;

  // Mangomint's embed URL accepts serviceId as a query param. Our local slug is
  // the Mangomint serviceId today · when Mangomint's numeric IDs differ, replace
  // the line below with a slug→numeric-ID lookup.
  const mangomintServiceId = service?.id || slug;

  return (
    <>
      <MangomintEmbedWidget
        mode={mangomintServiceId ? 'service' : 'full'}
        serviceId={mangomintServiceId}
        heading={service ? `Book your ${service.name}` : 'Book your appointment'}
        subheading={
          service
            ? `${service.duration} minutes \u00b7 $${service.price}${
                service.depositRequired && service.depositRequired > 0
                  ? ` \u00b7 $${service.depositRequired} deposit`
                  : ''
              }. Select a time below.`
            : 'Select a service, time, and provider below.'
        }
        className="shadow-xl"
      />

      <p className="text-xs text-gray-500 text-center mt-4">
        All prices shown before Washington State sales tax ({`\u2248`}10.1%).
        Membership billing and deposits are taxable under WA RCW 82.04.050.
      </p>

      {service && service.requiresConsultation && (
        <div className="mt-6 rounded-md border border-[#C9A96E]/40 bg-[#FAF8F5] px-6 py-4 text-sm text-[#0F1D2C]">
          <strong className="font-semibold">Consultation required.</strong>{' '}
          {service.name} requires a brief consultation before treatment. You can
          book the consultation here \u00b7 we will confirm your treatment date after
          the consult. Deposit ($
          {service.depositRequired || 50}) credits toward your treatment.
        </div>
      )}
    </>
  );
}
