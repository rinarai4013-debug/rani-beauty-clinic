/**
 * Post-Treatment Follow-Up Templates
 *
 * Automated SMS and email sequences triggered by Mangomint "Sale Completed" webhook.
 * n8n workflow W17 (post-treatment-trigger) uses these templates.
 *
 * Sequence:
 * 1. Immediate (0h) - Thank you + aftercare link
 * 2. 24 hours - Check-in + aftercare reminder
 * 3. 72 hours - Review request
 * 4. 7 days - Results check + rebook nudge
 * 5. 30 days - Rebook reminder + membership pitch
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
  sms: `hi beautiful! ✨ thank you so much for coming in today! here's your personalized aftercare guide for your {{serviceName}}: {{aftercareLink}} 💛 your skin is going to look even more amazing over the next few days! 🤍`,
  emailSubject: `your {{serviceName}} aftercare ✨ - Rani Beauty Clinic`,
  emailBody: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #0F1D2C; padding: 32px; text-align: center;">
    <h1 style="color: #C9A96E; margin: 0; font-size: 28px; font-family: 'Playfair Display', Georgia, serif;">thank you, {{firstName}} ✨</h1>
    <p style="color: rgba(255,255,255,0.6); margin: 8px 0 0; font-size: 14px;">your {{serviceName}} with {{providerName}}</p>
  </div>
  <div style="padding: 32px; background-color: #ffffff;">
    <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
      hi beautiful! 💛 thank you so much for coming in today - your skin is going to look even more amazing over the next few days! here's your personalized aftercare guide:
    </p>
    <a href="{{aftercareLink}}" style="display: inline-block; background-color: #C9A96E; color: #0F1D2C; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin: 16px 0;">
      View Aftercare Guide ✨
    </a>
    <p style="color: #666; font-size: 14px; line-height: 1.5; margin: 16px 0 0;">
      we're here if you need anything at all - just text or call us anytime 🤍
    </p>
    <p style="color: #333; font-size: 14px; margin: 24px 0 0;">
      with love,<br/>
      <strong>{{providerName}}</strong> &amp; the Rani Beauty Clinic Team ✨
    </p>
  </div>
  <div style="background-color: #F8F6F1; padding: 16px; text-align: center;">
    <p style="margin: 0; color: #888; font-size: 12px;">Rani Beauty Clinic &middot; 401 Olympia Ave NE #101, Renton, WA 98056</p>
    <p style="margin: 4px 0 0; color: #888; font-size: 12px;">{{clinicPhone}} &middot; ranibeautyclinic.com</p>
  </div>
</div>`,
};

const TWENTY_FOUR_HOURS: Template = {
  sms: `hey gorgeous! 💛 just checking in after your {{serviceName}} - how are you feeling? remember to follow your aftercare tips and drink lots of water ✨ we're here if you need anything! 🤍`,
  emailSubject: `how are you feeling, {{firstName}}? 💛`,
  emailBody: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #0F1D2C; padding: 28px; text-align: center;">
    <h1 style="color: #C9A96E; margin: 0; font-size: 24px; font-family: 'Playfair Display', Georgia, serif;">just checking in ✨</h1>
  </div>
  <div style="padding: 32px; background-color: #ffffff;">
    <p style="color: #333; font-size: 16px; line-height: 1.6;">hey gorgeous! 💛</p>
    <p style="color: #333; font-size: 16px; line-height: 1.6;">
      just checking in after your {{serviceName}} yesterday with {{providerName}} - how are you feeling? everything you're experiencing is totally normal ✨
    </p>
    <ul style="color: #555; font-size: 14px; line-height: 1.8; padding-left: 20px;">
      <li>mild redness or sensitivity is normal for 24-48 hours</li>
      <li>avoid direct sun exposure and apply SPF 30+</li>
      <li>stay hydrated and follow your aftercare guide</li>
    </ul>
    <p style="color: #333; font-size: 14px; margin-top: 16px;">
      we're here if you need anything at all - text us or call <a href="tel:+14252078883" style="color: #C9A96E;">{{clinicPhone}}</a> 🤍
    </p>
  </div>
  <div style="background-color: #F8F6F1; padding: 16px; text-align: center;">
    <p style="margin: 0; color: #888; font-size: 12px;">Rani Beauty Clinic &middot; Renton, WA</p>
  </div>
</div>`,
};

const SEVENTY_TWO_HOURS: Template = {
  sms: `hi angel! ✨ your skin should be starting to show those beautiful results by now 💛 we'd love to hear how you're feeling - and if you want to share your experience, here's a quick link: {{reviewLink}} 🤍 no pressure at all, we're just happy you trusted us with your glow`,
  emailSubject: `how's your glow, {{firstName}}? ✨`,
  emailBody: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #0F1D2C; padding: 28px; text-align: center;">
    <h1 style="color: #C9A96E; margin: 0; font-size: 24px; font-family: 'Playfair Display', Georgia, serif;">how's your glow? ✨</h1>
  </div>
  <div style="padding: 32px; background-color: #ffffff; text-align: center;">
    <p style="color: #333; font-size: 16px; line-height: 1.6;">hi angel! 💛</p>
    <p style="color: #333; font-size: 16px; line-height: 1.6;">
      your skin should be starting to show those beautiful results from your {{serviceName}} - we'd love to hear how you're feeling! ✨
    </p>
    <p style="font-size: 32px; margin: 16px 0;">&#11088;&#11088;&#11088;&#11088;&#11088;</p>
    <a href="{{reviewLink}}" style="display: inline-block; background-color: #C9A96E; color: #0F1D2C; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
      Share Your Experience 🤍
    </a>
    <p style="color: #888; font-size: 13px; margin-top: 16px;">no pressure at all - we're just happy you trusted us with your glow ✨</p>
  </div>
  <div style="background-color: #F8F6F1; padding: 16px; text-align: center;">
    <p style="margin: 0; color: #888; font-size: 12px;">Rani Beauty Clinic &middot; Renton, WA</p>
  </div>
</div>`,
};

const SEVEN_DAYS: Template = {
  sms: `hi beautiful! 💛 it's been a week since your {{serviceName}} and your results are probably looking amazing right now ✨ to keep this momentum going, your next session is recommended around {{nextRecommendedService}} - want us to get you on the schedule? {{bookingLink}} 🤍`,
  emailSubject: `your results are looking amazing, {{firstName}} ✨`,
  emailBody: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #0F1D2C; padding: 28px; text-align: center;">
    <h1 style="color: #C9A96E; margin: 0; font-size: 24px; font-family: 'Playfair Display', Georgia, serif;">one week glow check ✨</h1>
  </div>
  <div style="padding: 32px; background-color: #ffffff;">
    <p style="color: #333; font-size: 16px; line-height: 1.6;">hi beautiful! 💛</p>
    <p style="color: #333; font-size: 16px; line-height: 1.6;">
      it's been a week since your {{serviceName}} and your results are probably looking amazing right now ✨
    </p>
    <p style="color: #333; font-size: 16px; line-height: 1.6;">
      to keep this momentum going, we recommend {{nextRecommendedService}} as your next step in your glow journey 💛
    </p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="{{bookingLink}}" style="display: inline-block; background-color: #C9A96E; color: #0F1D2C; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
        Keep Your Glow Going ✨
      </a>
    </div>
    <p style="color: #888; font-size: 13px;">your skin is going to love this 🤍</p>
  </div>
  <div style="background-color: #F8F6F1; padding: 16px; text-align: center;">
    <p style="margin: 0; color: #888; font-size: 12px;">Rani Beauty Clinic &middot; Renton, WA</p>
  </div>
</div>`,
};

const THIRTY_DAYS: Template = {
  sms: `hey gorgeous! ✨ your {{serviceName}} results are at their peak right now - your next session is recommended to keep everything looking this perfect 💛 we also wanted to mention our membership which makes keeping your glow so much easier! {{bookingLink}} 🤍`,
  emailSubject: `your glow is at its peak, {{firstName}} ✨`,
  emailBody: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #0F1D2C; padding: 28px; text-align: center;">
    <h1 style="color: #C9A96E; margin: 0; font-size: 24px; font-family: 'Playfair Display', Georgia, serif;">keep your glow going ✨</h1>
  </div>
  <div style="padding: 32px; background-color: #ffffff;">
    <p style="color: #333; font-size: 16px; line-height: 1.6;">hey gorgeous! 💛</p>
    <p style="color: #333; font-size: 16px; line-height: 1.6;">
      your {{serviceName}} results are at their peak right now - your next session is recommended to keep everything looking this perfect ✨
    </p>
    <div style="background-color: #F8F6F1; border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid #C9A96E;">
      <p style="color: #0F1D2C; font-size: 14px; font-weight: 600; margin: 0 0 8px;">Angel Glow Up Membership ✨</p>
      <p style="color: #555; font-size: 14px; line-height: 1.5; margin: 0;">
        starting at $199/mo - monthly treatments, exclusive pricing, and priority booking. keeping your glow has never been easier 💛
      </p>
    </div>
    <div style="text-align: center; margin: 24px 0;">
      <a href="{{bookingLink}}" style="display: inline-block; background-color: #C9A96E; color: #0F1D2C; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
        Book Your Next Session 🤍
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
  'Botox': 'https://www.ranibeautyclinic.com/services/botox-dysport#aftercare',
  'Filler': 'https://www.ranibeautyclinic.com/services/dermal-fillers#aftercare',
  'HydraFacial': 'https://www.ranibeautyclinic.com/services/hydrafacial#aftercare',
  'Laser Hair Removal': 'https://www.ranibeautyclinic.com/services/laser-hair-removal#aftercare',
  'PicoWay': 'https://www.ranibeautyclinic.com/services/laser-hair-removal#aftercare',
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
