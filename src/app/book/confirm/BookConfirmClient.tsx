'use client';

import { useEffect } from 'react';
import { clinicInfo } from '@/data/clinic-info';

/**
 * Booking confirmation is handled by Mangomint's hosted flow.
 * Redirect users who land here to the real booking widget.
 */
export default function BookConfirmClient() {
  useEffect(() => {
    window.location.href = clinicInfo.booking.url;
  }, []);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <p className="font-body text-sm text-rani-muted">
        Redirecting to booking...
      </p>
    </div>
  );
}
