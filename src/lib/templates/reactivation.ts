/**
 * Reactivation Campaign Templates
 *
 * Used by n8n WF8 (Reactivation Campaigns — Monday 10AM) to send
 * personalized win-back messages to lapsed clients.
 *
 * Three tiers based on lapse duration:
 * 1. Lapsed 30 — Gentle nudge, lowest urgency
 * 2. Lapsed 60 — More compelling offer
 * 3. Lapsed 90 — Last chance, strongest offer
 */

export interface ReactivationVars {
  firstName: string;
  lastService: string;
  daysSinceLastVisit: number;
  membershipTier?: string;
  ltv: number;
}

interface ReactivationTemplate {
  sms: string;
  emailSubject: string;
  emailBody: string;
}

const BOOKING_URL = 'https://www.ranibeautyclinic.com/contact';
const CLINIC_PHONE = '(425) 207-8883';

function fill(template: string, vars: ReactivationVars): string {
  return template
    .replace(/{{firstName}}/g, vars.firstName)
    .replace(/{{lastService}}/g, vars.lastService || 'your last treatment')
    .replace(/{{daysSinceLastVisit}}/g, String(vars.daysSinceLastVisit))
    .replace(/{{bookingUrl}}/g, BOOKING_URL)
    .replace(/{{clinicPhone}}/g, CLINIC_PHONE);
}

// ── LAPSED 30 DAYS ──
const LAPSED_30: ReactivationTemplate = {
  sms: `Hi {{firstName}}! It's been about a month since we last saw you at Rani Beauty Clinic. We'd love to see you again! Book your next visit and keep your results going strong: {{bookingUrl}}`,
  emailSubject: `We miss you, {{firstName}}!`,
  emailBody: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #0F1D2C; padding: 32px; text-align: center;">
    <h1 style="color: #C9A96E; margin: 0; font-size: 28px; font-family: 'Playfair Display', Georgia, serif;">We Miss You!</h1>
  </div>
  <div style="padding: 32px; background-color: #ffffff;">
    <p style="color: #333; font-size: 16px; line-height: 1.6;">Hi {{firstName}},</p>
    <p style="color: #333; font-size: 16px; line-height: 1.6;">
      It's been about a month since your last visit for {{lastService}}, and we wanted to check in. Consistency is the secret to getting the best results from your treatments.
    </p>
    <p style="color: #333; font-size: 16px; line-height: 1.6;">
      We'd love to see you again and help you continue your transformation journey.
    </p>
    <div style="text-align: center; margin: 28px 0;">
      <a href="{{bookingUrl}}" style="display: inline-block; background-color: #C9A96E; color: #0F1D2C; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
        Book Your Next Visit
      </a>
    </div>
  </div>
  <div style="background-color: #F8F6F1; padding: 16px; text-align: center;">
    <p style="margin: 0; color: #888; font-size: 12px;">Rani Beauty Clinic &middot; 401 Olympia Ave NE #101, Renton, WA 98056</p>
  </div>
</div>`,
};

// ── LAPSED 60 DAYS ──
const LAPSED_60: ReactivationTemplate = {
  sms: `{{firstName}}, it's been 2 months since we last saw you! We have exciting new treatments and offerings. Come see what's new — we'd love to welcome you back: {{bookingUrl}}`,
  emailSubject: `{{firstName}}, come see what's new at Rani`,
  emailBody: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #0F1D2C; padding: 32px; text-align: center;">
    <h1 style="color: #C9A96E; margin: 0; font-size: 28px; font-family: 'Playfair Display', Georgia, serif;">A Lot Has Changed</h1>
    <p style="color: rgba(255,255,255,0.6); margin: 8px 0 0; font-size: 14px;">And we want you to experience it</p>
  </div>
  <div style="padding: 32px; background-color: #ffffff;">
    <p style="color: #333; font-size: 16px; line-height: 1.6;">Hi {{firstName}},</p>
    <p style="color: #333; font-size: 16px; line-height: 1.6;">
      It's been about two months since your {{lastService}}, and a lot has happened at Rani Beauty Clinic! We've added new treatments, upgraded our technology, and have some incredible new offerings we think you'll love.
    </p>
    <div style="background-color: #F8F6F1; border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid #C9A96E;">
      <p style="color: #0F1D2C; font-size: 14px; font-weight: 600; margin: 0 0 8px;">Welcome Back Special</p>
      <p style="color: #555; font-size: 14px; line-height: 1.5; margin: 0;">
        Book a complimentary skin consultation and let us create an updated treatment plan tailored to your current goals.
      </p>
    </div>
    <div style="text-align: center; margin: 28px 0;">
      <a href="{{bookingUrl}}" style="display: inline-block; background-color: #C9A96E; color: #0F1D2C; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
        Book Free Consultation
      </a>
    </div>
  </div>
  <div style="background-color: #F8F6F1; padding: 16px; text-align: center;">
    <p style="margin: 0; color: #888; font-size: 12px;">Rani Beauty Clinic &middot; Renton, WA &middot; {{clinicPhone}}</p>
  </div>
</div>`,
};

// ── LAPSED 90 DAYS ──
const LAPSED_90: ReactivationTemplate = {
  sms: `{{firstName}}, we haven't seen you in a while and we miss you at Rani! We'd love to welcome you back with a special offer. Call or text us: {{clinicPhone}} or book online: {{bookingUrl}}`,
  emailSubject: `We'd love to welcome you back, {{firstName}}`,
  emailBody: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #0F1D2C; padding: 32px; text-align: center;">
    <h1 style="color: #C9A96E; margin: 0; font-size: 28px; font-family: 'Playfair Display', Georgia, serif;">We'd Love to See You Again</h1>
  </div>
  <div style="padding: 32px; background-color: #ffffff;">
    <p style="color: #333; font-size: 16px; line-height: 1.6;">Hi {{firstName}},</p>
    <p style="color: #333; font-size: 16px; line-height: 1.6;">
      It's been a little while since you visited us, and we genuinely miss having you at Rani. Whatever your reason for stepping away, we want you to know that we're here whenever you're ready.
    </p>
    <p style="color: #333; font-size: 16px; line-height: 1.6;">
      We'd love to offer you a fresh start with a complimentary consultation to reassess your goals and create a new treatment plan that works for where you are today.
    </p>
    <div style="background-color: #F8F6F1; border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid #C9A96E;">
      <p style="color: #0F1D2C; font-size: 14px; font-weight: 600; margin: 0 0 8px;">Your Welcome Back Package</p>
      <ul style="color: #555; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
        <li>Complimentary skin consultation</li>
        <li>Updated treatment plan</li>
        <li>Exclusive returning client pricing</li>
      </ul>
    </div>
    <div style="text-align: center; margin: 28px 0;">
      <a href="{{bookingUrl}}" style="display: inline-block; background-color: #C9A96E; color: #0F1D2C; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
        Book Your Comeback Visit
      </a>
      <p style="margin: 12px 0 0; color: #888; font-size: 13px;">
        Or call us directly: <a href="tel:+14252078883" style="color: #C9A96E;">{{clinicPhone}}</a>
      </p>
    </div>
  </div>
  <div style="background-color: #F8F6F1; padding: 16px; text-align: center;">
    <p style="margin: 0; color: #888; font-size: 12px;">Rani Beauty Clinic &middot; 401 Olympia Ave NE #101, Renton, WA 98056</p>
  </div>
</div>`,
};

// ── EXPORTS ──

export const REACTIVATION_TEMPLATES = {
  'lapsed-30': LAPSED_30,
  'lapsed-60': LAPSED_60,
  'lapsed-90': LAPSED_90,
} as const;

export type ReactivationTier = keyof typeof REACTIVATION_TEMPLATES;

/**
 * Get the appropriate reactivation template based on days since last visit.
 */
export function getReactivationTier(daysSinceLastVisit: number): ReactivationTier {
  if (daysSinceLastVisit >= 90) return 'lapsed-90';
  if (daysSinceLastVisit >= 60) return 'lapsed-60';
  return 'lapsed-30';
}

/**
 * Get a rendered reactivation template for a specific tier.
 */
export function getReactivationTemplate(
  tier: ReactivationTier,
  vars: ReactivationVars
): { sms: string; emailSubject: string; emailBody: string } {
  const template = REACTIVATION_TEMPLATES[tier];
  return {
    sms: fill(template.sms, vars),
    emailSubject: fill(template.emailSubject, vars),
    emailBody: fill(template.emailBody, vars),
  };
}

/**
 * Auto-select tier and render template based on days since last visit.
 */
export function getAutoReactivationTemplate(vars: ReactivationVars) {
  const tier = getReactivationTier(vars.daysSinceLastVisit);
  return {
    tier,
    ...getReactivationTemplate(tier, vars),
  };
}
