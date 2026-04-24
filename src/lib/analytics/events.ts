/**
 * Unified analytics event dispatcher for GA4 + Meta Pixel + GTM dataLayer.
 * Safe to call on server (no-ops) and client (fires events).
 *
 * Architecture: All events flow through this single dispatcher.
 * - GA4: window.gtag('event', ...)
 * - GTM: window.dataLayer.push({ event: ... })
 * - Meta Pixel: window.fbq('track', ...) with mapped standard events
 */

import type { AnalyticsEventName, AnalyticsEventParams } from '@/types/analytics';

/* ── Meta Pixel Event Mapping ────────────────────────────────── */

const metaEventMap: Record<string, string> = {
  // Revenue
  plan_viewed: 'ViewContent',
  plan_tier_selected: 'AddToCart',
  plan_checkout_started: 'InitiateCheckout',
  plan_checkout_completed: 'Purchase',
  plan_financing_clicked: 'Lead',
  membership_signup: 'Subscribe',
  // Conversion
  lead_submitted: 'Lead',
  contact_form_submitted: 'Lead',
  consultation_booked: 'Schedule',
  booking_completed: 'Schedule',
  // Intent
  cta_click: 'Lead',
  booking_widget_opened: 'Schedule',
  quiz_completed: 'CompleteRegistration',
  service_page_view: 'ViewContent',
  phone_click: 'Contact',
  // Metabolic protocol checkout
  metabolic_intake_submitted: 'Lead',
  metabolic_fulfillment_selected: 'Lead',
  peptide_intake_submitted: 'Lead',
  peptide_fulfillment_selected: 'Lead',
  metabolic_checkout_started: 'InitiateCheckout',
  peptide_checkout_started: 'InitiateCheckout',
  metabolic_checkout_held_for_provider_review: 'Lead',
  peptide_checkout_held_for_provider_review: 'Lead',
};

/* ── Device Type Helper ──────────────────────────────────────── */

function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';
  const w = window.innerWidth;
  if (w < 768) return 'mobile';
  if (w < 1024) return 'tablet';
  return 'desktop';
}

/* ── Page Type Helper ────────────────────────────────────────── */

function getPageType(): string {
  if (typeof window === 'undefined') return 'unknown';
  const p = window.location.pathname;
  if (p === '/') return 'homepage';
  if (p.startsWith('/services/')) return 'service_page';
  if (p.startsWith('/wellness/')) return 'wellness_page';
  if (p.startsWith('/blog/')) return 'blog_post';
  if (p.startsWith('/results/')) return 'results_page';
  if (p.startsWith('/locations/')) return 'location_page';
  if (p.startsWith('/concerns/')) return 'concern_page';
  if (p.startsWith('/cost/')) return 'cost_page';
  if (p.startsWith('/guides/')) return 'guide_page';
  if (p.startsWith('/plan/')) return 'treatment_plan';
  if (p === '/pricing') return 'pricing_page';
  if (p === '/membership') return 'membership_page';
  if (p === '/quiz') return 'quiz_page';
  if (p === '/contact') return 'contact_page';
  if (p === '/get-started') return 'get_started_page';
  if (p === '/about') return 'about_page';
  if (p === '/team') return 'team_page';
  if (p === '/compare') return 'compare_page';
  if (p === '/safety') return 'safety_page';
  if (p === '/technology') return 'technology_page';
  return 'other';
}

/* ── UTM Capture ─────────────────────────────────────────────── */

let cachedUtm: Record<string, string> | null = null;

export function getUtmParams(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  if (cachedUtm) return cachedUtm;

  const params = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = {};
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']) {
    const val = params.get(key);
    if (val) utm[key] = val;
  }

  // Persist UTMs to sessionStorage so they survive page navigations
  if (Object.keys(utm).length > 0) {
    try {
      sessionStorage.setItem('rani_utm', JSON.stringify(utm));
    } catch {
      // SSR or private browsing - ignore
    }
  } else {
    try {
      const stored = sessionStorage.getItem('rani_utm');
      if (stored) return (cachedUtm = JSON.parse(stored));
    } catch {
      // ignore
    }
  }

  cachedUtm = utm;
  return utm;
}

/* ── Main Dispatcher ─────────────────────────────────────────── */

export function trackAnalyticsEvent(
  name: AnalyticsEventName,
  params: AnalyticsEventParams = {}
) {
  if (typeof window === 'undefined') return;

  // Auto-enrich with context
  const enriched: AnalyticsEventParams = {
    page_path: window.location.pathname,
    page_title: document.title,
    page_type: getPageType(),
    device_type: getDeviceType(),
    ...getUtmParams(),
    ...params,
  };

  // GA4 via gtag
  if (window.gtag) {
    window.gtag('event', name, enriched);
  }

  // GTM dataLayer
  if (window.dataLayer) {
    window.dataLayer.push({ event: name, ...enriched });
  }

  // Meta Pixel
  if (window.fbq) {
    const metaEvent = metaEventMap[name];
    if (metaEvent) {
      window.fbq('track', metaEvent, {
        content_name: enriched.service_name || enriched.tier || name,
        content_category: enriched.page_type || 'general',
        value: enriched.value || enriched.booking_value,
        currency: enriched.currency || 'USD',
      });
    }
  }

  // Debug logging in development
  if (process.env.NODE_ENV === 'development') {
    console.warn(`[Analytics] ${name}`, enriched);
  }
}

/* ── Convenience Helpers ─────────────────────────────────────── */

/** Track a CTA click with full context */
export function trackCTAClick(
  ctaText: string,
  ctaLocation: string,
  ctaDestination: string
) {
  trackAnalyticsEvent('cta_click', {
    cta_text: ctaText,
    cta_location: ctaLocation,
    cta_destination: ctaDestination,
  });
}

/** Track a phone click */
export function trackPhoneClick(location: string) {
  trackAnalyticsEvent('phone_click', {
    phone_number: '(425) 539-4440',
    click_location: location,
  });
}

/** Track booking widget open */
export function trackBookingOpen(location: string) {
  trackAnalyticsEvent('booking_widget_opened', {
    trigger_location: location,
  });
}

/** Track chat widget open */
export function trackChatOpen(location: string) {
  trackAnalyticsEvent('chat_opened', {
    trigger_location: location,
  });
}

/** Track outbound link click */
export function trackOutboundClick(url: string, clickText: string) {
  try {
    const domain = new URL(url).hostname;
    trackAnalyticsEvent('outbound_click', {
      click_url: url,
      click_text: clickText,
      link_domain: domain,
    });
  } catch {
    // Invalid URL - skip
  }
}

export function trackBookingStarted(service: string, source: string) {
  trackAnalyticsEvent("booking_started", { service, source });
  if (typeof window !== "undefined") {
    window.fbq?.("track", "InitiateCheckout", { content_name: service });
    window.dataLayer?.push({ event: "booking_started", service, source });
  }
}

export function trackBookingCompleted(service: string, value: number) {
  trackAnalyticsEvent("booking_completed", { service, value });
  if (typeof window !== "undefined") {
    window.fbq?.("track", "Schedule", { content_name: service, value, currency: "USD" });
    window.dataLayer?.push({ event: "purchase", ecommerce: { transaction_id: `bk_${Date.now()}`, value, currency: "USD", items: [{ item_name: service }] } });
  }
}

export function trackFormInteraction(formName: string, action: "focus" | "blur" | "submit" | "abandon", field?: string) {
  const eventName = `form_${action}`;
  if (typeof window !== "undefined") {
    window.gtag?.("event", eventName, { form_name: formName, field_name: field });
    window.dataLayer?.push({ event: eventName, form_name: formName, field_name: field });
    if (action === "submit") window.fbq?.("track", "Lead", { content_name: formName });
  }
}

export function trackPhoneCall(source: string) {
  trackAnalyticsEvent("phone_click", { source });
  if (typeof window !== "undefined") {
    window.fbq?.("track", "Contact", { content_name: "phone_call", content_category: source });
    window.dataLayer?.push({ event: "phone_call_click", source });
  }
}

/* ── Metabolic Protocol Checkout Helpers ─────────────────────── */

/**
 * Fired when an eligible patient proceeds to metabolic checkout.
 * No PII — track/tier/fulfillment only.
 */
export function trackMetabolicCheckoutStarted(
  track: string,
  tier: string,
  fulfillmentPreference: string,
) {
  trackAnalyticsEvent('metabolic_checkout_started', {
    recommended_track: track,
    protocol_tier: tier,
    fulfillment_preference: fulfillmentPreference,
  });
}

/**
 * Fired when a provider-review-required patient submits handoff.
 * Checkout is held — not started.
 */
export function trackMetabolicCheckoutHeld(track: string, tier: string) {
  trackAnalyticsEvent('metabolic_checkout_held_for_provider_review', {
    recommended_track: track,
    protocol_tier: tier,
    hold_reason: 'provider_review_required',
  });
}

/**
 * Fired when an eligible patient proceeds to peptide checkout.
 */
export function trackPeptideCheckoutStarted(tier: string) {
  trackAnalyticsEvent('peptide_checkout_started', {
    protocol_tier: tier,
    recommended_track: 'peptides',
  });
}

/**
 * Fired when a provider-review-required patient submits peptide handoff.
 * Checkout is held — not started.
 */
export function trackPeptideCheckoutHeld(tier: string) {
  trackAnalyticsEvent('peptide_checkout_held_for_provider_review', {
    protocol_tier: tier,
    recommended_track: 'peptides',
    hold_reason: 'provider_review_required',
  });
}

/**
 * Fired when a metabolic intake is submitted for handoff processing.
 * Fires for all non-ineligible paths. No PII.
 */
export function trackMetabolicIntakeSubmitted(track: string, intakeStatus: string) {
  trackAnalyticsEvent('metabolic_intake_submitted', {
    recommended_track: track,
    intake_status: intakeStatus,
  });
}

/**
 * Fired when the patient's fulfillment preference is confirmed at handoff.
 * No PII.
 */
export function trackMetabolicFulfillmentSelected(track: string, fulfillmentPreference: string) {
  trackAnalyticsEvent('metabolic_fulfillment_selected', {
    recommended_track: track,
    fulfillment_preference: fulfillmentPreference,
  });
}

/**
 * Fired when a peptide intake is submitted for handoff processing. No PII.
 */
export function trackPeptideIntakeSubmitted(intakeStatus: string) {
  trackAnalyticsEvent('peptide_intake_submitted', {
    recommended_track: 'peptides',
    intake_status: intakeStatus,
  });
}

/**
 * Fired when the patient's fulfillment preference is confirmed for peptide handoff. No PII.
 */
export function trackPeptideFulfillmentSelected(fulfillmentPreference: string) {
  trackAnalyticsEvent('peptide_fulfillment_selected', {
    recommended_track: 'peptides',
    fulfillment_preference: fulfillmentPreference,
  });
}

// Re-export types for convenience
export type { AnalyticsEventName, AnalyticsEventParams };

