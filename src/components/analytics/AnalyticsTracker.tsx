'use client';

/**
 * AnalyticsTracker - Supplementary passive tracking.
 *
 * Covers gaps NOT handled by BehavioralTracker:
 * - Time on page milestones (30s, 60s, 120s, 300s)
 * - Phone link (tel:) click tracking with phone_click event
 *
 * BehavioralTracker already handles: scroll depth, CTA clicks,
 * rage clicks, hesitation, section attention, intent scoring,
 * booking widget detection, visitor tagging.
 */

import { useTimeOnPage, usePhoneLinkTracking } from '@/lib/analytics/hooks';

export default function AnalyticsTracker() {
  useTimeOnPage();
  usePhoneLinkTracking();

  return null;
}
