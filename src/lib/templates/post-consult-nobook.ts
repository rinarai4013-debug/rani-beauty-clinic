/**
 * Post-Consult No-Book Follow-Up Templates
 *
 * 3-email sequence for clients who had a consultation but did NOT book
 * a treatment. Triggered by n8n W16 (Post-Consult Close) when no
 * appointment is detected within 48 hours of the consult.
 *
 * Sequence:
 * 1. 48h after consult - Recap + financing options (Cherry 0% APR)
 * 2. 5 days - Before/after results + FAQ responses
 * 3. 10 days - Personal follow-up + limited-time incentive
 *
 * IMPORTANT: Never use the word "infusion" - always say "injection."
 */

export interface PostConsultNoBookVars {
  firstName: string;
  treatmentName: string;
  providerName: string;
  consultDate: string;           // "March 15, 2026"
  costEstimate: string;          // "$2,750-$4,500"
  monthlyPayment?: string;       // "$229/mo" (Cherry financing)
  concerns: string;              // primary concern discussed
  treatmentPlan?: string;        // summary of what was discussed
}

interface Template {
  sms: string;
  emailSubject: string;
  emailBody: string;
}

const BOOKING_URL = 'https://www.ranibeautyclinic.com/contact';
const CLINIC_PHONE = '(425) 207-8883';
const CLINIC_ADDRESS = '401 Olympia Ave NE, Suite 101, Renton, WA 98056';
const CHERRY_URL = 'https://www.withcherry.com';
const PATIENTFI_URL = 'https://app.patientfi.com/v2/rani-beauty-clinic/apply';

function fill(template: string, vars: PostConsultNoBookVars): string {
  return template
    .replace(/{{firstName}}/g, vars.firstName)
    .replace(/{{treatmentName}}/g, vars.treatmentName)
    .replace(/{{providerName}}/g, vars.providerName)
    .replace(/{{consultDate}}/g, vars.consultDate)
    .replace(/{{costEstimate}}/g, vars.costEstimate)
    .replace(/{{monthlyPayment}}/g, vars.monthlyPayment || 'affordable monthly payments')
    .replace(/{{concerns}}/g, vars.concerns)
    .replace(/{{treatmentPlan}}/g, vars.treatmentPlan || '')
    .replace(/{{bookingUrl}}/g, BOOKING_URL)
    .replace(/{{clinicPhone}}/g, CLINIC_PHONE)
    .replace(/{{clinicAddress}}/g, CLINIC_ADDRESS)
    .replace(/{{cherryUrl}}/g, CHERRY_URL)
    .replace(/{{patientfiUrl}}/g, PATIENTFI_URL);
}

// ── EMAIL 1: 48H - RECAP + FINANCING ──

const EMAIL_1_RECAP_FINANCING: Template = {
  sms: `Hi {{firstName}}, it was wonderful meeting you at Rani! We wanted to follow up on your {{treatmentName}} consultation with {{providerName}}. Did you know we offer 0% APR financing? Starting at {{monthlyPayment}}. Apply: {{patientfiUrl}} Questions? Text us anytime or book: {{bookingUrl}}`,
  emailSubject: `Following Up on Your {{treatmentName}} Consultation, {{firstName}}`,
  emailBody: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #0F1D2C; padding: 32px; text-align: center;">
    <h1 style="color: #C9A96E; margin: 0; font-size: 28px; font-family: 'Playfair Display', Georgia, serif;">Great Seeing You, {{firstName}}</h1>
    <p style="color: rgba(255,255,255,0.6); margin: 8px 0 0; font-size: 14px;">Your consultation recap from {{consultDate}}</p>
  </div>
  <div style="padding: 32px; background-color: #ffffff;">
    <p style="color: #333; font-size: 16px; line-height: 1.6;">Hi {{firstName}},</p>
    <p style="color: #333; font-size: 16px; line-height: 1.6;">
      Thank you for taking the time to come in and discuss your goals with {{providerName}}. We truly enjoyed learning about what you're looking to achieve and putting together a plan for your {{treatmentName}} journey.
    </p>

    <div style="background-color: #F8F6F1; border-radius: 12px; padding: 24px; margin: 24px 0; border-left: 4px solid #C9A96E;">
      <p style="color: #0F1D2C; font-size: 16px; font-weight: 600; margin: 0 0 12px; font-family: 'Playfair Display', Georgia, serif;">Your Treatment Summary</p>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 6px 0; color: #888; font-size: 14px; width: 130px;">Treatment</td>
          <td style="padding: 6px 0; color: #0F1D2C; font-size: 14px; font-weight: 600;">{{treatmentName}}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #888; font-size: 14px;">Provider</td>
          <td style="padding: 6px 0; color: #0F1D2C; font-size: 14px; font-weight: 600;">{{providerName}}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #888; font-size: 14px;">Investment</td>
          <td style="padding: 6px 0; color: #0F1D2C; font-size: 14px; font-weight: 600;">{{costEstimate}}</td>
        </tr>
      </table>
    </div>

    <div style="background-color: #fff8e7; border: 1px solid #C9A96E33; border-radius: 12px; padding: 24px; margin: 24px 0;">
      <p style="color: #0F1D2C; font-size: 16px; font-weight: 600; margin: 0 0 12px; font-family: 'Playfair Display', Georgia, serif;">Flexible Financing Available</p>
      <p style="color: #555; font-size: 14px; line-height: 1.6; margin: 0 0 12px;">
        We partner with <strong>PatientFi</strong> and <strong>Cherry</strong> to offer flexible payment plans that fit your budget:
      </p>
      <ul style="color: #555; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
        <li><strong>0% APR financing</strong> available on qualifying plans</li>
        <li>Monthly payments starting at <strong>{{monthlyPayment}}</strong></li>
        <li>Quick approval - check your rate in 30 seconds with no impact to your credit score</li>
        <li>No hidden fees, no surprises</li>
      </ul>
      <div style="margin-top: 16px; text-align: center;">
        <a href="{{patientfiUrl}}" style="display: inline-block; background-color: #C9A96E; color: #0F1D2C; padding: 10px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 13px; margin-right: 8px;">Apply with PatientFi</a>
        <a href="{{cherryUrl}}" style="display: inline-block; border: 1px solid #C9A96E; color: #C9A96E; padding: 10px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 13px;">Apply with Cherry</a>
      </div>
    </div>

    <p style="color: #333; font-size: 16px; line-height: 1.6;">
      If cost was a consideration, we want you to know there are options. Your transformation journey shouldn't be limited by budget when there are smart ways to invest in yourself.
    </p>

    <div style="text-align: center; margin: 28px 0;">
      <a href="{{bookingUrl}}" style="display: inline-block; background-color: #C9A96E; color: #0F1D2C; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
        Book Your Treatment
      </a>
      <p style="margin: 12px 0 0; color: #888; font-size: 13px;">
        Or call us: <a href="tel:+14252078883" style="color: #C9A96E;">{{clinicPhone}}</a>
      </p>
    </div>
  </div>
  <div style="background-color: #F8F6F1; padding: 16px; text-align: center;">
    <p style="margin: 0; color: #888; font-size: 12px;">Rani Beauty Clinic &middot; {{clinicAddress}}</p>
    <p style="margin: 4px 0 0; color: #888; font-size: 12px;">{{clinicPhone}} &middot; ranibeautyclinic.com</p>
  </div>
</div>`,
};

// ── EMAIL 2: 5 DAYS - BEFORE/AFTER + FAQ ──

const EMAIL_2_RESULTS_FAQ: Template = {
  sms: `Hi {{firstName}}, still thinking about {{treatmentName}}? We totally get it. Our clients see amazing results and we'd love to show you what's possible. Have questions? Text us anytime: {{clinicPhone}}`,
  emailSubject: `See What {{treatmentName}} Results Look Like, {{firstName}}`,
  emailBody: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #0F1D2C; padding: 32px; text-align: center;">
    <h1 style="color: #C9A96E; margin: 0; font-size: 28px; font-family: 'Playfair Display', Georgia, serif;">Results That Speak for Themselves</h1>
  </div>
  <div style="padding: 32px; background-color: #ffffff;">
    <p style="color: #333; font-size: 16px; line-height: 1.6;">Hi {{firstName}},</p>
    <p style="color: #333; font-size: 16px; line-height: 1.6;">
      We know you're still considering your {{treatmentName}} treatment, and we want to help you feel confident in your decision. Our clients who chose this treatment have seen transformative results.
    </p>

    <div style="background-color: #F8F6F1; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
      <p style="color: #0F1D2C; font-size: 18px; font-weight: 600; margin: 0 0 4px; font-family: 'Playfair Display', Georgia, serif;">Client Transformations</p>
      <p style="color: #888; font-size: 13px; margin: 0 0 16px;">Ask us for before &amp; after photos during your next visit</p>
      <div style="display: inline-block; background-color: #C9A96E22; border-radius: 8px; padding: 12px 24px;">
        <p style="color: #0F1D2C; font-size: 24px; font-weight: 700; margin: 0;">95%</p>
        <p style="color: #888; font-size: 12px; margin: 0;">Client satisfaction rate</p>
      </div>
    </div>

    <div style="margin: 24px 0;">
      <p style="color: #0F1D2C; font-size: 16px; font-weight: 600; margin: 0 0 16px; font-family: 'Playfair Display', Georgia, serif;">Common Questions We Hear</p>

      <div style="border-bottom: 1px solid #eee; padding: 16px 0;">
        <p style="color: #0F1D2C; font-size: 14px; font-weight: 600; margin: 0 0 6px;">How long do results last?</p>
        <p style="color: #555; font-size: 14px; line-height: 1.5; margin: 0;">Results vary by treatment, but most of our {{treatmentName}} clients enjoy lasting results with a recommended maintenance schedule that {{providerName}} will customize for you.</p>
      </div>

      <div style="border-bottom: 1px solid #eee; padding: 16px 0;">
        <p style="color: #0F1D2C; font-size: 14px; font-weight: 600; margin: 0 0 6px;">What about downtime?</p>
        <p style="color: #555; font-size: 14px; line-height: 1.5; margin: 0;">Most treatments at Rani are designed with your lifestyle in mind. We'll give you a clear timeline so you can plan around any minimal downtime.</p>
      </div>

      <div style="padding: 16px 0;">
        <p style="color: #0F1D2C; font-size: 14px; font-weight: 600; margin: 0 0 6px;">Can I combine treatments?</p>
        <p style="color: #555; font-size: 14px; line-height: 1.5; margin: 0;">Absolutely. Many clients pair {{treatmentName}} with complementary services for enhanced results. {{providerName}} discussed options during your consult - we can revisit anytime.</p>
      </div>
    </div>

    <div style="text-align: center; margin: 28px 0;">
      <a href="{{bookingUrl}}" style="display: inline-block; background-color: #C9A96E; color: #0F1D2C; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
        Book Your Treatment
      </a>
    </div>
  </div>
  <div style="background-color: #F8F6F1; padding: 16px; text-align: center;">
    <p style="margin: 0; color: #888; font-size: 12px;">Rani Beauty Clinic &middot; {{clinicAddress}}</p>
  </div>
</div>`,
};

// ── EMAIL 3: 10 DAYS - PERSONAL FOLLOW-UP ──

const EMAIL_3_PERSONAL_FOLLOWUP: Template = {
  sms: `{{firstName}}, {{providerName}} at Rani wanted to personally check in. We'd love to help you start your {{treatmentName}} journey. Is there anything holding you back that we can help with? Text or call: {{clinicPhone}}`,
  emailSubject: `A Personal Note from {{providerName}}, {{firstName}}`,
  emailBody: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #0F1D2C; padding: 32px; text-align: center;">
    <h1 style="color: #C9A96E; margin: 0; font-size: 28px; font-family: 'Playfair Display', Georgia, serif;">A Personal Note</h1>
    <p style="color: rgba(255,255,255,0.6); margin: 8px 0 0; font-size: 14px;">From {{providerName}} at Rani Beauty Clinic</p>
  </div>
  <div style="padding: 32px; background-color: #ffffff;">
    <p style="color: #333; font-size: 16px; line-height: 1.6;">Hi {{firstName}},</p>
    <p style="color: #333; font-size: 16px; line-height: 1.6;">
      I wanted to reach out personally. I really enjoyed our consultation on {{consultDate}} and discussing how {{treatmentName}} could help address your concerns around {{concerns}}.
    </p>
    <p style="color: #333; font-size: 16px; line-height: 1.6;">
      I understand that making this decision takes time, and I respect that completely. I just want you to know that whenever you're ready, your treatment plan is here - and so am I.
    </p>

    <div style="background-color: #F8F6F1; border-radius: 12px; padding: 24px; margin: 24px 0;">
      <p style="color: #0F1D2C; font-size: 14px; font-weight: 600; margin: 0 0 12px;">Here's what I can offer to make it easier:</p>
      <ul style="color: #555; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
        <li>A second consultation at no charge if you'd like to discuss anything further</li>
        <li>0% APR financing through PatientFi or Cherry - starting at {{monthlyPayment}}</li>
        <li>Priority scheduling to get you the appointment time that works best</li>
      </ul>
    </div>

    <p style="color: #333; font-size: 16px; line-height: 1.6;">
      If something about the treatment plan didn't feel right, or if you have new questions, I'd genuinely love to hear from you. Your comfort and confidence matter more than anything.
    </p>

    <div style="text-align: center; margin: 28px 0;">
      <a href="{{bookingUrl}}" style="display: inline-block; background-color: #C9A96E; color: #0F1D2C; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
        Book When You're Ready
      </a>
      <p style="margin: 12px 0 0; color: #888; font-size: 13px;">
        Or reach me directly: <a href="tel:+14252078883" style="color: #C9A96E;">{{clinicPhone}}</a>
      </p>
    </div>

    <p style="color: #333; font-size: 14px; margin-top: 24px;">
      Warmly,<br/>
      <strong>{{providerName}}</strong><br/>
      Rani Beauty Clinic
    </p>
  </div>
  <div style="background-color: #F8F6F1; padding: 16px; text-align: center;">
    <p style="margin: 0; color: #888; font-size: 12px;">Rani Beauty Clinic &middot; {{clinicAddress}}</p>
    <p style="margin: 4px 0 0; color: #888; font-size: 12px;">{{clinicPhone}} &middot; ranibeautyclinic.com</p>
  </div>
</div>`,
};

// ── EXPORTS ──

export const POST_CONSULT_NOBOOK_SEQUENCE = [
  { name: '48h-recap-financing', delayHours: 48, template: EMAIL_1_RECAP_FINANCING },
  { name: '5d-results-faq', delayHours: 120, template: EMAIL_2_RESULTS_FAQ },
  { name: '10d-personal-followup', delayHours: 240, template: EMAIL_3_PERSONAL_FOLLOWUP },
] as const;

export type PostConsultNoBookStep = typeof POST_CONSULT_NOBOOK_SEQUENCE[number]['name'];

/**
 * Get a rendered post-consult no-book template for a specific step.
 */
export function getPostConsultNoBookTemplate(
  stepName: string,
  vars: PostConsultNoBookVars
): { sms: string; emailSubject: string; emailBody: string } | null {
  const step = POST_CONSULT_NOBOOK_SEQUENCE.find(s => s.name === stepName);
  if (!step) return null;

  return {
    sms: fill(step.template.sms, vars),
    emailSubject: fill(step.template.emailSubject, vars),
    emailBody: fill(step.template.emailBody, vars),
  };
}

/**
 * Get all post-consult no-book templates for a client (for preview/testing).
 */
export function getAllPostConsultNoBookTemplates(vars: PostConsultNoBookVars) {
  return POST_CONSULT_NOBOOK_SEQUENCE.map(step => ({
    name: step.name,
    delayHours: step.delayHours,
    sms: fill(step.template.sms, vars),
    emailSubject: fill(step.template.emailSubject, vars),
    emailBody: fill(step.template.emailBody, vars),
  }));
}
