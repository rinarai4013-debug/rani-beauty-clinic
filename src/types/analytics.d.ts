/* ──────────────────────────────────────────────────────────────
   Analytics Type Definitions — Rani Beauty Clinic
   Extends Window for GA4 / GTM / Meta Pixel / Clarity
   ────────────────────────────────────────────────────────────── */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: Record<string, unknown>[];
    fbq?: (...args: unknown[]) => void;
    clarity?: (...args: unknown[]) => void;
  }
}

/* ── Event Names ─────────────────────────────────────────────── */

/** Behavioral events — automatic, no user intent */
export type BehavioralEvent =
  | 'page_view'
  | 'scroll_depth'
  | 'time_on_page'
  | 'outbound_click'
  | 'rage_click'
  | 'hesitation_detected'
  | 'behavioral_confusion_signal'
  | 'page_abandonment'
  | 'session_start_enriched';

/** Intent signals — user showing interest */
export type IntentEvent =
  | 'service_page_view'
  | 'pricing_interaction'
  | 'cta_click'
  | 'phone_click'
  | 'chat_opened'
  | 'quiz_started'
  | 'quiz_step_completed'
  | 'quiz_completed'
  | 'membership_page_view'
  | 'results_gallery_view'
  | 'booking_widget_opened'
  | 'consultation_form_opened';

/** Conversion events — measurable actions */
export type ConversionEvent =
  | 'lead_submitted'
  | 'contact_form_submitted'
  | 'consultation_booked'
  | 'booking_started'
  | 'booking_completed';

/** Revenue events — tied to dollar values */
export type RevenueEvent =
  | 'plan_viewed'
  | 'plan_tier_selected'
  | 'plan_checkout_started'
  | 'plan_checkout_completed'
  | 'plan_financing_clicked'
  | 'membership_signup';

export type AnalyticsEventName =
  | BehavioralEvent
  | IntentEvent
  | ConversionEvent
  | RevenueEvent;

/* ── Event Parameters ────────────────────────────────────────── */

export interface AnalyticsEventParams {
  // Identity (auto-populated by tracking hooks)
  page_path?: string;
  page_title?: string;
  page_type?: string;
  device_type?: 'mobile' | 'tablet' | 'desktop';
  traffic_source?: string;

  // UTM
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;

  // Behavioral
  percent?: number;
  seconds?: number;
  click_text?: string;
  click_url?: string;
  click_location?: string;
  click_type?: string;
  link_domain?: string;

  // Intent
  service_name?: string;
  service_category?: string;
  price_shown?: number;
  interaction_type?: string;
  cta_text?: string;
  cta_location?: string;
  cta_destination?: string;
  trigger_location?: string;
  phone_number?: string;
  step_number?: number;
  step_name?: string;
  answer?: string;
  result_type?: string;
  recommended_services?: string;
  service_type?: string;

  // Conversion
  form_type?: string;
  service_interest?: string;
  lead_source?: string;
  source?: string;
  booking_source?: string;
  consultation_type?: string;
  deposit_amount?: number;

  // Revenue
  planId?: string;
  plan_id?: string;
  tier?: string;
  value?: number;
  currency?: string;
  booking_value?: number;
  membership_tier?: string;
  monthly_value?: number;
  payment_method?: string;
  provider?: string;

  // Generic catch-all
  [key: string]: string | number | boolean | undefined;
}
