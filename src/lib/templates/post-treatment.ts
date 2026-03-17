/**
 * Post-Treatment Follow-Up Templates
 *
 * Automated SMS and email sequences triggered by Mangomint "Sale Completed" webhook.
 * n8n workflow W17 (post-treatment-trigger) uses these templates.
 *
 * Sequence:
 * 1. Immediate (0h) — Thank you + aftercare link
 * 2. 24 hours — Check-in + aftercare reminder
 * 3. 72 hours — Review request
 * 4. 7 days — Results check + rebook nudge
 * 5. 30 days — Rebook reminder + membership pitch
 */

export interface TemplateVars {
  firstName: string;
  serviceName: string;
  providerName: string;
  appointmentDate: string;
  nextRecommendedService?: string;
  membershipTier?: string;
  reviewLink?: string;
  bookingLink?: string;
  aftercareLink?: string;
}

interface Template {
  sms: string;
  emailSubject: string;
  emailBody: string;
}

const BOOKING_URL = 'https://www.ranibeautyclinic.com/contact';
const REVIEW_URL = 'https://g.page/r/ranibeautyclinic/review';
const CLINIC_PHONE = '(425) 207-8883';

function fillTemplate(template: string, vars: TemplateVars): string {
  return template
    .replace(/{{firstName}}/g, vars.firstName)
    .replace(/{{serviceName}}/g, vars.serviceName)
    .replace(/{{providerName}}/g, vars.providerName)
    .replace(/{{appointmentDate}}/g, vars.appointmentDate)
    .replace(/{{nextRecommendedService}}/g, vars.nextRecommendedService || 'your next treatment')
    .replace(/{{membershipTier}}/g, vars.membershipTier || '')
    .replace(/{{reviewLink}}/g, vars.reviewLink || REVIEW_URL)
    .replace(/{{bookingLink}}/g, vars.bookingLink || BOOKING_URL)
    .replace(/{{aftercareLink}}/g, vars.aftercareLink || 'https://www.ranibeautyclinic.com/safety')
    .replace(/{{clinicPhone}}/g, CLINIC_PHONE);
}

// ── SEQUENCE TEMPLATES ──

const IMMEDIATE: Template = {
  sms: `Thank you for your {{serviceName}} today, {{firstName}}! We loved having you at Rani Beauty Clinic. Here are your aftercare instructions: {{aftercareLink}} Questions? Text us anytime or call {{clinicPhone}}.`,
  emailSubject: `Your {{serviceName}} Aftercare — Rani Beauty Clinic`,
  emailBody: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #0F1D2C; padding: 32px; text-align: center;">
    <h1 style="color: #C9A96E; margin: 0; font-size: 28px; font-family: 'Playfair Display', Georgia, serif;">Thank You, {{firstName}}</h1>
    <p style="color: rgba(255,255,255,0.6); margin: 8px 0 0; font-size: 14px;">Your {{serviceName}} with {{providerName}}</p>
  </div>
  <div style="padding: 32px; background-color: #ffffff;">
    <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
      We hope you're feeling amazing after today's treatment! Here's what to keep in mind for the best results:
    </p>
    <a href="{{aftercareLink}}" style="display: inline-block; background-color: #C9A96E; color: #0F1D2C; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin: 16px 0;">
      View Aftercare Instructions
    </a>
    <p style="color: #666; font-size: 14px; line-height: 1.5; margin: 16px 0 0;">
      If you have any questions or concerns, don't hesitate to reach out. We're here for you.
    </p>
    <p style="color: #333; font-size: 14px; margin: 24px 0 0;">
      With love,<br/>
      <strong>{{providerName}}</strong> &amp; the Rani Beauty Clinic Team
    </p>
  </div>
  <div style="background-color: #F8F6F1; padding: 16px; text-align: center;">
    <p style="margin: 0; color: #888; font-size: 12px;">Rani Beauty Clinic &middot; 401 Olympia Ave NE #101, Renton, WA 98056</p>
    <p style="margin: 4px 0 0; color: #888; font-size: 12px;">{{clinicPhone}} &middot; ranibeautyclinic.com</p>
  </div>
</div>`,
};

const TWENTY_FOUR_HOURS: Template = {
  sms: `Hi {{firstName}}, it's Rani Beauty Clinic! How are you feeling after your {{serviceName}} yesterday? Remember to follow your aftercare tips: {{aftercareLink}} Any questions? We're a text away.`,
  emailSubject: `How are you feeling, {{firstName}}?`,
  emailBody: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #0F1D2C; padding: 28px; text-align: center;">
    <h1 style="color: #C9A96E; margin: 0; font-size: 24px; font-family: 'Playfair Display', Georgia, serif;">24-Hour Check-In</h1>
  </div>
  <div style="padding: 32px; background-color: #ffffff;">
    <p style="color: #333; font-size: 16px; line-height: 1.6;">Hi {{firstName}},</p>
    <p style="color: #333; font-size: 16px; line-height: 1.6;">
      Just checking in after your {{serviceName}} yesterday with {{providerName}}. It's normal to experience some mild effects — here's a quick reminder of what to expect:
    </p>
    <ul style="color: #555; font-size: 14px; line-height: 1.8; padding-left: 20px;">
      <li>Mild redness or sensitivity is normal for 24-48 hours</li>
      <li>Avoid direct sun exposure and apply SPF 30+</li>
      <li>Stay hydrated and follow your aftercare instructions</li>
    </ul>
    <p style="color: #333; font-size: 14px; margin-top: 16px;">
      If anything feels off, text us or call <a href="tel:+14252078883" style="color: #C9A96E;">{{clinicPhone}}</a>.
    </p>
  </div>
  <div style="background-color: #F8F6F1; padding: 16px; text-align: center;">
    <p style="margin: 0; color: #888; font-size: 12px;">Rani Beauty Clinic &middot; Renton, WA</p>
  </div>
</div>`,
};

const SEVENTY_TWO_HOURS: Template = {
  sms: `Hi {{firstName}}! We'd love to hear how your {{serviceName}} experience was at Rani. Your feedback helps us serve you better. Leave a quick review: {{reviewLink}} Thank you!`,
  emailSubject: `{{firstName}}, how was your experience at Rani?`,
  emailBody: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #0F1D2C; padding: 28px; text-align: center;">
    <h1 style="color: #C9A96E; margin: 0; font-size: 24px; font-family: 'Playfair Display', Georgia, serif;">We'd Love Your Feedback</h1>
  </div>
  <div style="padding: 32px; background-color: #ffffff; text-align: center;">
    <p style="color: #333; font-size: 16px; line-height: 1.6;">Hi {{firstName}},</p>
    <p style="color: #333; font-size: 16px; line-height: 1.6;">
      You visited us a few days ago for your {{serviceName}}, and we'd love to know how it went!
    </p>
    <p style="font-size: 32px; margin: 16px 0;">&#11088;&#11088;&#11088;&#11088;&#11088;</p>
    <a href="{{reviewLink}}" style="display: inline-block; background-color: #C9A96E; color: #0F1D2C; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
      Leave a Google Review
    </a>
    <p style="color: #888; font-size: 13px; margin-top: 16px;">It takes less than 30 seconds and means the world to us.</p>
  </div>
  <div style="background-color: #F8F6F1; padding: 16px; text-align: center;">
    <p style="margin: 0; color: #888; font-size: 12px;">Rani Beauty Clinic &middot; Renton, WA</p>
  </div>
</div>`,
};

const SEVEN_DAYS: Template = {
  sms: `Hi {{firstName}}, it's been a week since your {{serviceName}} at Rani! How are your results looking? Ready for {{nextRecommendedService}}? Book your next visit: {{bookingLink}}`,
  emailSubject: `One week later — how are your results, {{firstName}}?`,
  emailBody: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #0F1D2C; padding: 28px; text-align: center;">
    <h1 style="color: #C9A96E; margin: 0; font-size: 24px; font-family: 'Playfair Display', Georgia, serif;">Your 7-Day Results Check</h1>
  </div>
  <div style="padding: 32px; background-color: #ffffff;">
    <p style="color: #333; font-size: 16px; line-height: 1.6;">Hi {{firstName}},</p>
    <p style="color: #333; font-size: 16px; line-height: 1.6;">
      It's been a week since your {{serviceName}} — by now, you should be seeing the full results of your treatment.
    </p>
    <p style="color: #333; font-size: 16px; line-height: 1.6;">
      To maintain and build on these results, we recommend scheduling {{nextRecommendedService}} as your next step.
    </p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="{{bookingLink}}" style="display: inline-block; background-color: #C9A96E; color: #0F1D2C; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
        Book Your Next Visit
      </a>
    </div>
    <p style="color: #888; font-size: 13px;">Consistency is key to achieving your best results.</p>
  </div>
  <div style="background-color: #F8F6F1; padding: 16px; text-align: center;">
    <p style="margin: 0; color: #888; font-size: 12px;">Rani Beauty Clinic &middot; Renton, WA</p>
  </div>
</div>`,
};

const THIRTY_DAYS: Template = {
  sms: `Hi {{firstName}}, it's been a month since your last visit to Rani! Time to keep your glow going. Book your next treatment and ask about our Angel Glow Up membership for exclusive savings: {{bookingLink}}`,
  emailSubject: `{{firstName}}, it's time to rebook at Rani`,
  emailBody: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #0F1D2C; padding: 28px; text-align: center;">
    <h1 style="color: #C9A96E; margin: 0; font-size: 24px; font-family: 'Playfair Display', Georgia, serif;">Keep Your Glow Going</h1>
  </div>
  <div style="padding: 32px; background-color: #ffffff;">
    <p style="color: #333; font-size: 16px; line-height: 1.6;">Hi {{firstName}},</p>
    <p style="color: #333; font-size: 16px; line-height: 1.6;">
      It's been about a month since your last treatment, and we want to make sure you're keeping up your results!
    </p>
    <div style="background-color: #F8F6F1; border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid #C9A96E;">
      <p style="color: #0F1D2C; font-size: 14px; font-weight: 600; margin: 0 0 8px;">Angel Glow Up Membership</p>
      <p style="color: #555; font-size: 14px; line-height: 1.5; margin: 0;">
        Starting at $199/mo, get monthly treatments, exclusive pricing, and priority booking. Members save 20-40% on all services.
      </p>
    </div>
    <div style="text-align: center; margin: 24px 0;">
      <a href="{{bookingLink}}" style="display: inline-block; background-color: #C9A96E; color: #0F1D2C; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
        Book Now
      </a>
    </div>
  </div>
  <div style="background-color: #F8F6F1; padding: 16px; text-align: center;">
    <p style="margin: 0; color: #888; font-size: 12px;">Rani Beauty Clinic &middot; 401 Olympia Ave NE #101, Renton, WA 98056</p>
  </div>
</div>`,
};

// ── EXPORTS ──

export const POST_TREATMENT_SEQUENCE = [
  { name: 'immediate', delayHours: 0, template: IMMEDIATE },
  { name: '24h-checkin', delayHours: 24, template: TWENTY_FOUR_HOURS },
  { name: '72h-review', delayHours: 72, template: SEVENTY_TWO_HOURS },
  { name: '7d-results', delayHours: 168, template: SEVEN_DAYS },
  { name: '30d-rebook', delayHours: 720, template: THIRTY_DAYS },
] as const;

/**
 * Get a rendered template for a specific step in the sequence.
 */
export function getPostTreatmentTemplate(
  stepName: string,
  vars: TemplateVars
): { sms: string; emailSubject: string; emailBody: string } | null {
  const step = POST_TREATMENT_SEQUENCE.find(s => s.name === stepName);
  if (!step) return null;

  return {
    sms: fillTemplate(step.template.sms, vars),
    emailSubject: fillTemplate(step.template.emailSubject, vars),
    emailBody: fillTemplate(step.template.emailBody, vars),
  };
}

/**
 * Get all templates for a client (for preview/testing).
 */
export function getAllPostTreatmentTemplates(vars: TemplateVars) {
  return POST_TREATMENT_SEQUENCE.map(step => ({
    name: step.name,
    delayHours: step.delayHours,
    sms: fillTemplate(step.template.sms, vars),
    emailSubject: fillTemplate(step.template.emailSubject, vars),
    emailBody: fillTemplate(step.template.emailBody, vars),
  }));
}

// ── SERVICE-SPECIFIC AFTERCARE LINKS ──

export const AFTERCARE_LINKS: Record<string, string> = {
  'Botox': 'https://www.ranibeautyclinic.com/services/botox#aftercare',
  'Filler': 'https://www.ranibeautyclinic.com/services/dermal-fillers#aftercare',
  'HydraFacial': 'https://www.ranibeautyclinic.com/services/hydrafacial#aftercare',
  'Laser Hair Removal': 'https://www.ranibeautyclinic.com/services/laser-hair-removal#aftercare',
  'PicoWay': 'https://www.ranibeautyclinic.com/services/picoway#aftercare',
  'RF Microneedling': 'https://www.ranibeautyclinic.com/services/rf-microneedling#aftercare',
  'VI Peel': 'https://www.ranibeautyclinic.com/services/vi-peel#aftercare',
  'PRX-T33': 'https://www.ranibeautyclinic.com/services/prx-t33#aftercare',
  'Sofwave': 'https://www.ranibeautyclinic.com/services/sofwave#aftercare',
};

/**
 * Get the aftercare link for a service, falling back to the general safety page.
 */
export function getAftercareLinkForService(serviceName: string): string {
  for (const [key, link] of Object.entries(AFTERCARE_LINKS)) {
    if (serviceName.toLowerCase().includes(key.toLowerCase())) {
      return link;
    }
  }
  return 'https://www.ranibeautyclinic.com/safety';
}

// ── NEXT RECOMMENDED SERVICE MAP ──

export const NEXT_TREATMENT_MAP: Record<string, string> = {
  'HydraFacial': 'a follow-up HydraFacial or VI Peel',
  'VI Peel': 'a maintenance HydraFacial',
  'Botox': 'a Botox touch-up (typically 3-4 months)',
  'Filler': 'a filler maintenance visit',
  'Laser Hair Removal': 'your next laser session (4-6 weeks)',
  'RF Microneedling': 'your next RF Microneedling session',
  'PicoWay': 'your next PicoWay session',
  'PRX-T33': 'a follow-up PRX-T33 treatment',
  'Sofwave': 'your annual Sofwave maintenance session',
  'GLP-1': 'your monthly GLP-1 check-in',
};

export function getNextRecommendedService(serviceName: string): string {
  for (const [key, next] of Object.entries(NEXT_TREATMENT_MAP)) {
    if (serviceName.toLowerCase().includes(key.toLowerCase())) {
      return next;
    }
  }
  return 'your next treatment';
}
