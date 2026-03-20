'use client';

/**
 * Analytics Hooks — Supplementary tracking hooks.
 *
 * NOTE: Scroll depth, CTA clicks, rage clicks, hesitation, section attention,
 * intent scoring, and booking widget detection are already handled by
 * BehavioralTracker (src/lib/analytics/behavioral-tracking.ts).
 *
 * These hooks cover the GAPS not handled by the behavioral engine:
 * - Time on page milestones
 * - Phone link (tel:) click tracking
 * - Service page view auto-firing
 */

import { useEffect, useRef } from 'react';
import { trackAnalyticsEvent } from './events';

/* ──────────────────────────────────────────────────────────────
   useTimeOnPage — fires time_on_page at 30s, 60s, 120s, 300s
   Uses visibility API to pause when tab is hidden.
   Not covered by BehavioralTracker.
   ────────────────────────────────────────────────────────────── */

export function useTimeOnPage() {
  useEffect(() => {
    const milestones = [30, 60, 120, 300];
    const fired = new Set<number>();
    let elapsed = 0;
    let lastTick = Date.now();
    let visible = !document.hidden;

    const tick = () => {
      if (!visible) {
        lastTick = Date.now();
        return;
      }

      const now = Date.now();
      elapsed += (now - lastTick) / 1000;
      lastTick = now;

      for (const milestone of milestones) {
        if (elapsed >= milestone && !fired.has(milestone)) {
          fired.add(milestone);
          trackAnalyticsEvent('time_on_page', { seconds: milestone });
        }
      }
    };

    const interval = setInterval(tick, 5000);

    const onVisibilityChange = () => {
      visible = !document.hidden;
      lastTick = Date.now();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);
}

/* ──────────────────────────────────────────────────────────────
   usePhoneLinkTracking — auto-tracks tel: link clicks
   BehavioralTracker tracks CTA clicks generically but doesn't
   fire a dedicated phone_click event with phone_number param.
   ────────────────────────────────────────────────────────────── */

export function usePhoneLinkTracking() {
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a');
      if (!target) return;

      const href = target.getAttribute('href');
      if (!href || !href.startsWith('tel:')) return;

      const section = target.closest('nav') ? 'navbar'
        : target.closest('footer') ? 'footer'
        : target.closest('[data-cta-location]')?.getAttribute('data-cta-location')
        || 'page_body';

      trackAnalyticsEvent('phone_click', {
        phone_number: href.replace('tel:', ''),
        click_location: section,
      });
    };

    document.addEventListener('click', handleClick, { capture: true });
    return () => document.removeEventListener('click', handleClick, { capture: true });
  }, []);
}

/* ──────────────────────────────────────────────────────────────
   useServicePageTracking — auto-fires service_page_view
   Call on any /services/[slug] or /wellness/[slug] page.
   ────────────────────────────────────────────────────────────── */

export function useServicePageTracking(serviceName: string, serviceCategory?: string) {
  const hasFired = useRef(false);

  useEffect(() => {
    if (hasFired.current) return;
    hasFired.current = true;

    trackAnalyticsEvent('service_page_view', {
      service_name: serviceName,
      service_category: serviceCategory,
    });
  }, [serviceName, serviceCategory]);
}
