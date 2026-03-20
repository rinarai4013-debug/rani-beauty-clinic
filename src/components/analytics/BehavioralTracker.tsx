'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { initBehavioralTracking } from '@/lib/analytics/behavioral-tracking';

/**
 * BehavioralTracker — Client component that initializes the behavioral
 * intelligence engine on every page navigation.
 *
 * Tracks: scroll depth, rage clicks, hesitation, CTA clicks, booking attempts,
 * section attention, user segmentation, and intent scoring.
 *
 * All data flows to: Microsoft Clarity (custom tags), GA4 (events), GTM (dataLayer).
 */
export default function BehavioralTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Skip dashboard pages
    if (pathname?.startsWith('/dashboard')) return;

    const cleanup = initBehavioralTracking();
    return cleanup;
  }, [pathname]);

  return null;
}
