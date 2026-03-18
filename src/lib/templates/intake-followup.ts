/**
 * Intake Follow-Up Nurture Sequence
 *
 * 5-email drip campaign for leads who filled out the Typeform intake
 * but have NOT yet booked a consultation.
 *
 * Triggered by n8n WF2b (No-Booking Follow-Up Ladder).
 *
 * Sequence:
 * 1. Immediate (0h) — "Your Personalized Treatment Plan is Ready"
 * 2. 24 hours   — "What [Treatment] Can Do For You" (educational)
 * 3. 72 hours   — "Limited-Time: Complimentary Consultation" (urgency)
 * 4. 7 days     — "Real Results from Clients Like You" (social proof)
 * 5. 14 days    — "We Saved Your Treatment Plan" (last chance)
 *
 * IMPORTANT: Never use the word "infusion" — always say "injection."
 */

export interface IntakeFollowUpVars {
  firstName: string;
  treatmentName: string;        // primary recommended treatment
  treatmentPlan: string;        // AI-generated plan summary
  costEstimate: string;         // e.g. "$2,750–$4,500"
  suggestedNextStep: string;    // e.g. "Book a complimentary consultation"
  intakeDate: string;           // date they submitted the form
  concerns: string;             // primary concern from intake
}

interface Template {
  sms: string;
  emailSubject: string;
  emailBody: string;
}

const BOOKING_URL = 'https://www.ranibeautyclinic.com/contact';
const CLINIC_PHONE = '(425) 207-8883';
const CLINIC_ADDRESS = '401 Olympia Ave NE #101, Renton, WA 98056';

function fill(template: string, vars: IntakeFollowUpVars): string {
  return template
    .replace(/{{firstName}}/g, vars.firstName)
    .replace(/{{treatmentName}}/g, vars.treatmentName)
    .replace(/{{treatmentPlan}}/g, vars.treatmentPlan)
    .replace(/{{costEstimate}}/g, vars.costEstimate)
    .replace(/{{suggestedNextStep}}/g, vars.suggestedNextStep)
    .replace(/{{intakeDate}}/g, vars.intakeDate)
    .replace(/{{concerns}}/g, vars.concerns)
    .replace(/{{bookingUrl}}/g, BOOKING_URL)
    .replace(/{{clinicPhone}}/g, CLINIC_PHONE)
    .replace(/{{clinicAddress}}/g, CLINIC_ADDRESS);
}

// ── EMAIL 1: IMMEDIATE — TREATMENT PLAN READY ──

const EMAIL_1_PLAN_READY: Template = {
  sms: `Hi {{firstName}}! Thank you for sharing your goals with Rani Beauty Clinic. Your personalized treatment plan for {{treatmentName}} is ready. Book your complimentary consultation to review it in person: {{bookingUrl}}`,
  emailSubject: `Your Personalized Treatment Plan is Ready, {{firstName}}`,
  emailBody: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #0F1D2C; padding: 32px; text-align: center;">
    <h1 style="color: #C9A96E; margin: 0; font-size: 28px; font-family: 'Playfair Display', Georgia, serif;">Your Treatment Plan is Ready</h1>
    <p style="color: rgba(255,255,255,0.6); margin: 8px 0 0; font-size: 14px;">Personalized just for you, {{firstName}}</p>
  </div>
  <div style="padding: 32px; background-color: #ffffff;">
    <p style="color: #333; font-size: 16px; line-height: 1.6;">Hi {{firstName}},</p>
    <p style="color: #333; font-size: 16px; line-height: 1.6;">
      Thank you for completing your intake form. Our clinical team has reviewed your goals and concerns, and we've created a personalized treatment plan designed specifically for you.
    </p>

    <div style="background-color: #F8F6F1; border-radius: 12px; padding: 24px; margin: 24px 0; border-left: 4px solid #C9A96E;">
      <p style="color: #0F1D2C; font-size: 16px; font-weight: 600; margin: 0 0 12px; font-family: 'Playfair Display', Georgia, serif;">Your Recommended Treatment</p>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 6px 0; color: #888; font-size: 14px; width: 120px;">Treatment</td>
          <td style="padding: 6px 0; color: #0F1D2C; font-size: 14px; font-weight: 600;">{{treatmentName}}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #888; font-size: 14px;">Investment</td>
          <td style="padding: 6px 0; color: #0F1D2C; font-size: 14px; font-weight: 600;">{{costEstimate}}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #888; font-size: 14px;">Next Step</td>
          <td style="padding: 6px 0; color: #0F1D2C; font-size: 14px; font-weight: 600;">{{suggestedNextStep}}</td>
        </tr>
      </table>
    </div>

    <p style="color: #333; font-size: 16px; line-height: 1.6;">
      We'd love to walk you through everything in person during a complimentary consultation. This is a no-pressure conversation — just an opportunity to ask questions and see the clinic.
    </p>

    <div style="text-align: center; margin: 28px 0;">
      <a href="{{bookingUrl}}" style="display: inline-block; background-color: #C9A96E; color: #0F1D2C; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
        Book Your Free Consultation
      </a>
    </div>

    <p style="color: #888; font-size: 13px; text-align: center;">
      Or call us directly at <a href="tel:+14252078883" style="color: #C9A96E;">{{clinicPhone}}</a>
    </p>
  </div>
  <div style="background-color: #F8F6F1; padding: 16px; text-align: center;">
    <p style="margin: 0; color: #888; font-size: 12px;">Rani Beauty Clinic &middot; {{clinicAddress}}</p>
    <p style="margin: 4px 0 0; color: #888; font-size: 12px;">{{clinicPhone}} &middot; ranibeautyclinic.com</p>
  </div>
</div>`,
};

// ── EMAIL 2: 24H — EDUCATIONAL ──

const EMAIL_2_EDUCATIONAL: Template = {
  sms: `Hi {{firstName}}, curious about what {{treatmentName}} can do for you? We put together some answers to the questions we hear most. Read more and book your free consult: {{bookingUrl}}`,
  emailSubject: `What {{treatmentName}} Can Do For You`,
  emailBody: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #0F1D2C; padding: 32px; text-align: center;">
    <h1 style="color: #C9A96E; margin: 0; font-size: 28px; font-family: 'Playfair Display', Georgia, serif;">What {{treatmentName}} Can Do For You</h1>
  </div>
  <div style="padding: 32px; background-color: #ffffff;">
    <p style="color: #333; font-size: 16px; line-height: 1.6;">Hi {{firstName}},</p>
    <p style="color: #333; font-size: 16px; line-height: 1.6;">
      Based on your intake, we recommended {{treatmentName}} to address your concerns around {{concerns}}. Here's what you should know:
    </p>

    <div style="margin: 24px 0;">
      <div style="border-bottom: 1px solid #eee; padding: 16px 0;">
        <p style="color: #0F1D2C; font-size: 15px; font-weight: 600; margin: 0 0 8px;">How does it work?</p>
        <p style="color: #555; font-size: 14px; line-height: 1.6; margin: 0;">
          {{treatmentName}} is performed in our physician-supervised clinic using the latest technology. Most treatments are comfortable with minimal downtime, allowing you to return to your routine quickly.
        </p>
      </div>
      <div style="border-bottom: 1px solid #eee; padding: 16px 0;">
        <p style="color: #0F1D2C; font-size: 15px; font-weight: 600; margin: 0 0 8px;">When will I see results?</p>
        <p style="color: #555; font-size: 14px; line-height: 1.6; margin: 0;">
          Many clients notice visible improvement within the first few sessions. Optimal results develop progressively as your skin responds to treatment — this is a transformation journey, not a one-time fix.
        </p>
      </div>
      <div style="padding: 16px 0;">
        <p style="color: #0F1D2C; font-size: 15px; font-weight: 600; margin: 0 0 8px;">Is it right for me?</p>
        <p style="color: #555; font-size: 14px; line-height: 1.6; margin: 0;">
          Based on what you shared in your intake, our clinical team believes this is an excellent match for your goals. A consultation will confirm the ideal approach for your unique needs.
        </p>
      </div>
    </div>

    <div style="text-align: center; margin: 28px 0;">
      <a href="{{bookingUrl}}" style="display: inline-block; background-color: #C9A96E; color: #0F1D2C; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
        Book Your Free Consultation
      </a>
    </div>
  </div>
  <div style="background-color: #F8F6F1; padding: 16px; text-align: center;">
    <p style="margin: 0; color: #888; font-size: 12px;">Rani Beauty Clinic &middot; {{clinicAddress}}</p>
  </div>
</div>`,
};

// ── EMAIL 3: 72H — URGENCY / COMPLIMENTARY CONSULT ──

const EMAIL_3_URGENCY: Template = {
  sms: `{{firstName}}, we're offering complimentary consultations this week for new clients. This is the perfect time to discuss your {{treatmentName}} treatment plan with our team — no obligation. Book now: {{bookingUrl}}`,
  emailSubject: `Limited-Time: Complimentary Consultation for {{firstName}}`,
  emailBody: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #0F1D2C; padding: 32px; text-align: center;">
    <h1 style="color: #C9A96E; margin: 0; font-size: 28px; font-family: 'Playfair Display', Georgia, serif;">Complimentary Consultation</h1>
    <p style="color: rgba(255,255,255,0.6); margin: 8px 0 0; font-size: 14px;">Limited availability this week</p>
  </div>
  <div style="padding: 32px; background-color: #ffffff;">
    <p style="color: #333; font-size: 16px; line-height: 1.6;">Hi {{firstName}},</p>
    <p style="color: #333; font-size: 16px; line-height: 1.6;">
      We know taking the first step can feel like a big decision. That's why we want to make it as easy as possible — we're offering a <strong>complimentary consultation</strong> so you can meet our team, tour the clinic, and review your personalized treatment plan in person.
    </p>

    <div style="background-color: #F8F6F1; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
      <p style="color: #0F1D2C; font-size: 18px; font-weight: 600; margin: 0 0 8px; font-family: 'Playfair Display', Georgia, serif;">What's Included</p>
      <ul style="text-align: left; color: #555; font-size: 14px; line-height: 2; margin: 12px auto; padding-left: 20px; max-width: 380px;">
        <li>One-on-one consultation with our provider</li>
        <li>Review of your personalized {{treatmentName}} plan</li>
        <li>Honest answers to all your questions</li>
        <li>Zero pressure — only proceed if it feels right</li>
      </ul>
    </div>

    <div style="background-color: #fff8e7; border: 1px solid #C9A96E33; border-radius: 8px; padding: 16px; margin: 16px 0; text-align: center;">
      <p style="color: #0F1D2C; font-size: 14px; font-weight: 600; margin: 0 0 4px;">Limited Spots Available</p>
      <p style="color: #555; font-size: 13px; margin: 0;">We keep our consultation calendar small to ensure each client gets undivided attention.</p>
    </div>

    <div style="text-align: center; margin: 28px 0;">
      <a href="{{bookingUrl}}" style="display: inline-block; background-color: #C9A96E; color: #0F1D2C; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
        Claim Your Free Consultation
      </a>
    </div>
  </div>
  <div style="background-color: #F8F6F1; padding: 16px; text-align: center;">
    <p style="margin: 0; color: #888; font-size: 12px;">Rani Beauty Clinic &middot; {{clinicAddress}}</p>
  </div>
</div>`,
};

// ── EMAIL 4: 7 DAYS — SOCIAL PROOF ──

const EMAIL_4_SOCIAL_PROOF: Template = {
  sms: `{{firstName}}, clients just like you are seeing incredible results with {{treatmentName}} at Rani. See what they're saying and book your consultation: {{bookingUrl}}`,
  emailSubject: `Real Results from Clients Like You, {{firstName}}`,
  emailBody: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #0F1D2C; padding: 32px; text-align: center;">
    <h1 style="color: #C9A96E; margin: 0; font-size: 28px; font-family: 'Playfair Display', Georgia, serif;">Real Results, Real Clients</h1>
  </div>
  <div style="padding: 32px; background-color: #ffffff;">
    <p style="color: #333; font-size: 16px; line-height: 1.6;">Hi {{firstName}},</p>
    <p style="color: #333; font-size: 16px; line-height: 1.6;">
      We understand that choosing a clinic for {{treatmentName}} is a big decision. We want you to feel confident — here's what other clients have to say about their experience at Rani Beauty Clinic.
    </p>

    <div style="margin: 24px 0;">
      <div style="background-color: #F8F6F1; border-radius: 12px; padding: 20px; margin: 16px 0;">
        <p style="font-size: 32px; margin: 0 0 8px;">&#11088;&#11088;&#11088;&#11088;&#11088;</p>
        <p style="color: #333; font-size: 14px; line-height: 1.6; font-style: italic; margin: 0 0 12px;">
          "The team at Rani made me feel so comfortable from the very first consultation. My results have been incredible — I only wish I'd started sooner!"
        </p>
        <p style="color: #888; font-size: 13px; margin: 0;">— Verified Google Review</p>
      </div>

      <div style="background-color: #F8F6F1; border-radius: 12px; padding: 20px; margin: 16px 0;">
        <p style="font-size: 32px; margin: 0 0 8px;">&#11088;&#11088;&#11088;&#11088;&#11088;</p>
        <p style="color: #333; font-size: 14px; line-height: 1.6; font-style: italic; margin: 0 0 12px;">
          "Professional, knowledgeable, and genuinely caring. Rani Beauty Clinic is a hidden gem in Renton. The results speak for themselves."
        </p>
        <p style="color: #888; font-size: 13px; margin: 0;">— Verified Google Review</p>
      </div>
    </div>

    <div style="text-align: center; padding: 16px 0;">
      <p style="color: #0F1D2C; font-size: 22px; font-weight: 700; margin: 0;">4.9 / 5.0</p>
      <p style="color: #888; font-size: 13px; margin: 4px 0 0;">Average Google Review Rating</p>
    </div>

    <div style="text-align: center; margin: 28px 0;">
      <a href="{{bookingUrl}}" style="display: inline-block; background-color: #C9A96E; color: #0F1D2C; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
        Start Your Transformation
      </a>
    </div>
  </div>
  <div style="background-color: #F8F6F1; padding: 16px; text-align: center;">
    <p style="margin: 0; color: #888; font-size: 12px;">Rani Beauty Clinic &middot; {{clinicAddress}}</p>
  </div>
</div>`,
};

// ── EMAIL 5: 14 DAYS — LAST CHANCE ──

const EMAIL_5_LAST_CHANCE: Template = {
  sms: `{{firstName}}, we've saved your personalized {{treatmentName}} treatment plan at Rani. Whenever you're ready, we're here. Book your free consultation: {{bookingUrl}}`,
  emailSubject: `We Saved Your Treatment Plan, {{firstName}}`,
  emailBody: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #0F1D2C; padding: 32px; text-align: center;">
    <h1 style="color: #C9A96E; margin: 0; font-size: 28px; font-family: 'Playfair Display', Georgia, serif;">Your Plan is Still Waiting</h1>
  </div>
  <div style="padding: 32px; background-color: #ffffff;">
    <p style="color: #333; font-size: 16px; line-height: 1.6;">Hi {{firstName}},</p>
    <p style="color: #333; font-size: 16px; line-height: 1.6;">
      We wanted to let you know that the personalized treatment plan we created for you is still here, ready whenever you are.
    </p>

    <div style="background-color: #F8F6F1; border-radius: 12px; padding: 24px; margin: 24px 0; border-left: 4px solid #C9A96E;">
      <p style="color: #0F1D2C; font-size: 16px; font-weight: 600; margin: 0 0 12px; font-family: 'Playfair Display', Georgia, serif;">Your Saved Plan</p>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 6px 0; color: #888; font-size: 14px; width: 120px;">Treatment</td>
          <td style="padding: 6px 0; color: #0F1D2C; font-size: 14px; font-weight: 600;">{{treatmentName}}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #888; font-size: 14px;">Investment</td>
          <td style="padding: 6px 0; color: #0F1D2C; font-size: 14px; font-weight: 600;">{{costEstimate}}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #888; font-size: 14px;">Created</td>
          <td style="padding: 6px 0; color: #0F1D2C; font-size: 14px;">{{intakeDate}}</td>
        </tr>
      </table>
    </div>

    <p style="color: #333; font-size: 16px; line-height: 1.6;">
      We understand that the timing may not have been right. There's absolutely no rush. But when you're ready, we'd love to welcome you in for a conversation — no commitment, no pressure.
    </p>

    <p style="color: #333; font-size: 16px; line-height: 1.6;">
      If your goals or concerns have changed since you filled out your intake, that's perfectly fine too. We'll update your plan to reflect where you are today.
    </p>

    <div style="text-align: center; margin: 28px 0;">
      <a href="{{bookingUrl}}" style="display: inline-block; background-color: #C9A96E; color: #0F1D2C; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
        Book When You're Ready
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

// ── EXPORTS ──

export const INTAKE_FOLLOWUP_SEQUENCE = [
  { name: 'plan-ready', delayHours: 0, template: EMAIL_1_PLAN_READY },
  { name: '24h-educational', delayHours: 24, template: EMAIL_2_EDUCATIONAL },
  { name: '72h-urgency', delayHours: 72, template: EMAIL_3_URGENCY },
  { name: '7d-social-proof', delayHours: 168, template: EMAIL_4_SOCIAL_PROOF },
  { name: '14d-last-chance', delayHours: 336, template: EMAIL_5_LAST_CHANCE },
] as const;

export type IntakeFollowUpStep = typeof INTAKE_FOLLOWUP_SEQUENCE[number]['name'];

/**
 * Get a rendered intake follow-up template for a specific step.
 */
export function getIntakeFollowUpTemplate(
  stepName: string,
  vars: IntakeFollowUpVars
): { sms: string; emailSubject: string; emailBody: string } | null {
  const step = INTAKE_FOLLOWUP_SEQUENCE.find(s => s.name === stepName);
  if (!step) return null;

  return {
    sms: fill(step.template.sms, vars),
    emailSubject: fill(step.template.emailSubject, vars),
    emailBody: fill(step.template.emailBody, vars),
  };
}

/**
 * Get all intake follow-up templates for a client (for preview/testing).
 */
export function getAllIntakeFollowUpTemplates(vars: IntakeFollowUpVars) {
  return INTAKE_FOLLOWUP_SEQUENCE.map(step => ({
    name: step.name,
    delayHours: step.delayHours,
    sms: fill(step.template.sms, vars),
    emailSubject: fill(step.template.emailSubject, vars),
    emailBody: fill(step.template.emailBody, vars),
  }));
}
