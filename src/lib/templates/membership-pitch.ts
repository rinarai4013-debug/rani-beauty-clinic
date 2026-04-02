/**
 * Membership Pitch Templates - Angel Glow Up Membership
 *
 * 3-email sequence to upgrade existing clients to the Angel Glow Up
 * monthly membership program. Triggered by n8n WF7 (Membership Engine)
 * for clients who meet upgrade criteria (3+ visits, no active membership).
 *
 * Sequence:
 * 1. Immediate - Membership introduction + savings breakdown
 * 2. 3 days - Exclusive member perks + testimonial
 * 3. 7 days - Limited enrollment + urgency close
 *
 * IMPORTANT: Never use the word "infusion" - always say "injection."
 */

export interface MembershipPitchVars {
  firstName: string;
  totalVisits: number;
  totalSpent: string;           // "$3,200"
  potentialSavings: string;     // "$960"
  favoriteService: string;      // their most-booked treatment
  providerName: string;
  membershipPrice: string;      // "$199/mo"
}

interface Template {
  sms: string;
  emailSubject: string;
  emailBody: string;
}

const BOOKING_URL = 'https://www.ranibeautyclinic.com/contact';
const CLINIC_PHONE = '(425) 207-8883';
const CLINIC_ADDRESS = '401 Olympia Ave NE, Suite 101, Renton, WA 98056';

function fill(template: string, vars: MembershipPitchVars): string {
  return template
    .replace(/{{firstName}}/g, vars.firstName)
    .replace(/{{totalVisits}}/g, String(vars.totalVisits))
    .replace(/{{totalSpent}}/g, vars.totalSpent)
    .replace(/{{potentialSavings}}/g, vars.potentialSavings)
    .replace(/{{favoriteService}}/g, vars.favoriteService)
    .replace(/{{providerName}}/g, vars.providerName)
    .replace(/{{membershipPrice}}/g, vars.membershipPrice || '$199/mo')
    .replace(/{{bookingUrl}}/g, BOOKING_URL)
    .replace(/{{clinicPhone}}/g, CLINIC_PHONE)
    .replace(/{{clinicAddress}}/g, CLINIC_ADDRESS);
}

// ── EMAIL 1: IMMEDIATE - MEMBERSHIP INTRO + SAVINGS ──

const EMAIL_1_INTRO: Template = {
  sms: `Hi {{firstName}}! As one of our valued clients, you're invited to join the Angel Glow Up membership - starting at {{membershipPrice}}. Members save 20-40% on every treatment. Ask us about it at your next visit or call {{clinicPhone}}.`,
  emailSubject: `{{firstName}}, You're Invited: Angel Glow Up Membership`,
  emailBody: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #0F1D2C; padding: 32px; text-align: center;">
    <h1 style="color: #C9A96E; margin: 0; font-size: 28px; font-family: 'Playfair Display', Georgia, serif;">You're Invited</h1>
    <p style="color: rgba(255,255,255,0.6); margin: 8px 0 0; font-size: 14px;">Angel Glow Up Membership</p>
  </div>
  <div style="padding: 32px; background-color: #ffffff;">
    <p style="color: #333; font-size: 16px; line-height: 1.6;">Hi {{firstName}},</p>
    <p style="color: #333; font-size: 16px; line-height: 1.6;">
      You've been one of our most dedicated clients - with <strong>{{totalVisits}} visits</strong> and a clear commitment to your beauty and wellness journey. We love seeing you!
    </p>
    <p style="color: #333; font-size: 16px; line-height: 1.6;">
      That's exactly why we'd love to invite you to our <strong>Angel Glow Up membership</strong>. It's designed for clients like you who are serious about maintaining and building on their results.
    </p>

    <div style="background-color: #0F1D2C; border-radius: 12px; padding: 28px; margin: 28px 0; text-align: center;">
      <p style="color: #C9A96E; font-size: 20px; font-weight: 600; margin: 0 0 4px; font-family: 'Playfair Display', Georgia, serif;">Angel Glow Up</p>
      <p style="color: rgba(255,255,255,0.6); font-size: 13px; margin: 0 0 16px;">Monthly Membership</p>
      <p style="color: #fff; font-size: 36px; font-weight: 700; margin: 0;">{{membershipPrice}}</p>
      <p style="color: rgba(255,255,255,0.5); font-size: 13px; margin: 4px 0 0;">per month</p>
    </div>

    <div style="margin: 24px 0;">
      <p style="color: #0F1D2C; font-size: 16px; font-weight: 600; margin: 0 0 16px; font-family: 'Playfair Display', Georgia, serif;">What's Included</p>
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <div style="display: flex; align-items: flex-start; gap: 12px;">
          <span style="color: #C9A96E; font-size: 18px; line-height: 1;">&#10003;</span>
          <p style="color: #555; font-size: 14px; line-height: 1.5; margin: 0;"><strong>Monthly treatment credit</strong> - applied toward your favorite services</p>
        </div>
        <div style="display: flex; align-items: flex-start; gap: 12px;">
          <span style="color: #C9A96E; font-size: 18px; line-height: 1;">&#10003;</span>
          <p style="color: #555; font-size: 14px; line-height: 1.5; margin: 0;"><strong>20-40% off all services</strong> - including {{favoriteService}}</p>
        </div>
        <div style="display: flex; align-items: flex-start; gap: 12px;">
          <span style="color: #C9A96E; font-size: 18px; line-height: 1;">&#10003;</span>
          <p style="color: #555; font-size: 14px; line-height: 1.5; margin: 0;"><strong>Priority booking</strong> - first access to preferred appointment times</p>
        </div>
        <div style="display: flex; align-items: flex-start; gap: 12px;">
          <span style="color: #C9A96E; font-size: 18px; line-height: 1;">&#10003;</span>
          <p style="color: #555; font-size: 14px; line-height: 1.5; margin: 0;"><strong>Exclusive member events</strong> - early access to new treatments and VIP events</p>
        </div>
        <div style="display: flex; align-items: flex-start; gap: 12px;">
          <span style="color: #C9A96E; font-size: 18px; line-height: 1;">&#10003;</span>
          <p style="color: #555; font-size: 14px; line-height: 1.5; margin: 0;"><strong>Complimentary add-ons</strong> - LED therapy, dermaplaning, or enhancement upgrades</p>
        </div>
      </div>
    </div>

    <div style="background-color: #F8F6F1; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
      <p style="color: #0F1D2C; font-size: 14px; font-weight: 600; margin: 0 0 4px;">Your Estimated Annual Savings</p>
      <p style="color: #C9A96E; font-size: 28px; font-weight: 700; margin: 0;">{{potentialSavings}}</p>
      <p style="color: #888; font-size: 12px; margin: 4px 0 0;">Based on your treatment history of {{totalSpent}}</p>
    </div>

    <div style="text-align: center; margin: 28px 0;">
      <a href="{{bookingUrl}}" style="display: inline-block; background-color: #C9A96E; color: #0F1D2C; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
        Join Angel Glow Up
      </a>
      <p style="margin: 12px 0 0; color: #888; font-size: 13px;">
        Or ask about it at your next visit
      </p>
    </div>
  </div>
  <div style="background-color: #F8F6F1; padding: 16px; text-align: center;">
    <p style="margin: 0; color: #888; font-size: 12px;">Rani Beauty Clinic &middot; {{clinicAddress}}</p>
    <p style="margin: 4px 0 0; color: #888; font-size: 12px;">{{clinicPhone}} &middot; ranibeautyclinic.com</p>
  </div>
</div>`,
};

// ── EMAIL 2: 3 DAYS - PERKS + TESTIMONIAL ──

const EMAIL_2_PERKS: Template = {
  sms: `{{firstName}}, Angel Glow Up members at Rani get 20-40% off every visit + priority booking. One of our members said it's the best investment she's made in herself. Learn more: {{bookingUrl}}`,
  emailSubject: `Why Our Members Love Angel Glow Up, {{firstName}}`,
  emailBody: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #0F1D2C; padding: 32px; text-align: center;">
    <h1 style="color: #C9A96E; margin: 0; font-size: 28px; font-family: 'Playfair Display', Georgia, serif;">The Glow Up Experience</h1>
  </div>
  <div style="padding: 32px; background-color: #ffffff;">
    <p style="color: #333; font-size: 16px; line-height: 1.6;">Hi {{firstName}},</p>
    <p style="color: #333; font-size: 16px; line-height: 1.6;">
      We wanted to share what the Angel Glow Up membership really means for clients like you who are already committed to their aesthetic journey.
    </p>

    <div style="background-color: #F8F6F1; border-radius: 12px; padding: 24px; margin: 24px 0;">
      <p style="font-size: 32px; margin: 0 0 8px; text-align: center;">&#11088;&#11088;&#11088;&#11088;&#11088;</p>
      <p style="color: #333; font-size: 15px; line-height: 1.6; font-style: italic; margin: 0 0 12px; text-align: center;">
        "Joining the Angel Glow Up membership was the best decision. I save so much on my monthly treatments, and the priority booking means I always get the times I want. It's made being consistent with my skincare so much easier."
      </p>
      <p style="color: #888; font-size: 13px; margin: 0; text-align: center;"> -  Angel Glow Up Member</p>
    </div>

    <div style="margin: 24px 0;">
      <p style="color: #0F1D2C; font-size: 16px; font-weight: 600; margin: 0 0 16px; font-family: 'Playfair Display', Georgia, serif;">The Membership Difference</p>

      <div style="border-bottom: 1px solid #eee; padding: 14px 0;">
        <p style="color: #0F1D2C; font-size: 14px; font-weight: 600; margin: 0 0 4px;">Consistency = Better Results</p>
        <p style="color: #555; font-size: 14px; line-height: 1.5; margin: 0;">Regular treatments deliver compounding results. Members stay on track with scheduled sessions, and their results show it.</p>
      </div>

      <div style="border-bottom: 1px solid #eee; padding: 14px 0;">
        <p style="color: #0F1D2C; font-size: 14px; font-weight: 600; margin: 0 0 4px;">Savings That Add Up</p>
        <p style="color: #555; font-size: 14px; line-height: 1.5; margin: 0;">Based on your love of {{favoriteService}}, you'd save approximately <strong>{{potentialSavings}}</strong> per year as a member.</p>
      </div>

      <div style="padding: 14px 0;">
        <p style="color: #0F1D2C; font-size: 14px; font-weight: 600; margin: 0 0 4px;">VIP Treatment</p>
        <p style="color: #555; font-size: 14px; line-height: 1.5; margin: 0;">Priority scheduling, exclusive events, complimentary add-ons, and first access to new treatments and technology.</p>
      </div>
    </div>

    <div style="text-align: center; margin: 28px 0;">
      <a href="{{bookingUrl}}" style="display: inline-block; background-color: #C9A96E; color: #0F1D2C; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
        Become a Member
      </a>
    </div>
  </div>
  <div style="background-color: #F8F6F1; padding: 16px; text-align: center;">
    <p style="margin: 0; color: #888; font-size: 12px;">Rani Beauty Clinic &middot; {{clinicAddress}}</p>
  </div>
</div>`,
};

// ── EMAIL 3: 7 DAYS - LIMITED ENROLLMENT + URGENCY ──

const EMAIL_3_URGENCY: Template = {
  sms: `{{firstName}}, this is your last chance to join Angel Glow Up at {{membershipPrice}}. We're limiting new members this month to maintain our VIP experience. Enroll now: {{bookingUrl}} or call {{clinicPhone}}.`,
  emailSubject: `Last Chance to Join Angel Glow Up, {{firstName}}`,
  emailBody: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #0F1D2C; padding: 32px; text-align: center;">
    <h1 style="color: #C9A96E; margin: 0; font-size: 28px; font-family: 'Playfair Display', Georgia, serif;">Final Invitation</h1>
    <p style="color: rgba(255,255,255,0.6); margin: 8px 0 0; font-size: 14px;">Limited membership spots available</p>
  </div>
  <div style="padding: 32px; background-color: #ffffff;">
    <p style="color: #333; font-size: 16px; line-height: 1.6;">Hi {{firstName}},</p>
    <p style="color: #333; font-size: 16px; line-height: 1.6;">
      This is your final invitation to join our Angel Glow Up membership. We intentionally limit the number of members we accept each month to ensure every member receives the VIP experience they deserve.
    </p>

    <div style="background-color: #fff8e7; border: 1px solid #C9A96E33; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
      <p style="color: #0F1D2C; font-size: 16px; font-weight: 600; margin: 0 0 8px;">Enrollment Closing Soon</p>
      <p style="color: #555; font-size: 14px; line-height: 1.5; margin: 0;">
        We're accepting a limited number of new members this month. Once spots are filled, the next enrollment window won't open until the following month.
      </p>
    </div>

    <div style="background-color: #F8F6F1; border-radius: 12px; padding: 24px; margin: 24px 0;">
      <p style="color: #0F1D2C; font-size: 14px; font-weight: 600; margin: 0 0 16px;">Here's what you'll get as a member:</p>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #C9A96E; font-size: 14px; width: 24px; vertical-align: top;">&#10003;</td>
          <td style="padding: 8px 0; color: #555; font-size: 14px;">Monthly treatment credit</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #C9A96E; font-size: 14px; vertical-align: top;">&#10003;</td>
          <td style="padding: 8px 0; color: #555; font-size: 14px;">20-40% off all services (including {{favoriteService}})</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #C9A96E; font-size: 14px; vertical-align: top;">&#10003;</td>
          <td style="padding: 8px 0; color: #555; font-size: 14px;">Priority booking &amp; exclusive member events</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #C9A96E; font-size: 14px; vertical-align: top;">&#10003;</td>
          <td style="padding: 8px 0; color: #555; font-size: 14px;">Complimentary add-ons every visit</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #C9A96E; font-size: 14px; vertical-align: top;">&#10003;</td>
          <td style="padding: 8px 0; color: #555; font-size: 14px;">Est. annual savings: <strong>{{potentialSavings}}</strong></td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin: 28px 0;">
      <a href="{{bookingUrl}}" style="display: inline-block; background-color: #C9A96E; color: #0F1D2C; padding: 16px 40px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
        Enroll Now - {{membershipPrice}}
      </a>
      <p style="margin: 12px 0 0; color: #888; font-size: 13px;">
        Or call to enroll: <a href="tel:+14252078883" style="color: #C9A96E;">{{clinicPhone}}</a>
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

export const MEMBERSHIP_PITCH_SEQUENCE = [
  { name: 'intro-savings', delayHours: 0, template: EMAIL_1_INTRO },
  { name: '3d-perks', delayHours: 72, template: EMAIL_2_PERKS },
  { name: '7d-urgency', delayHours: 168, template: EMAIL_3_URGENCY },
] as const;

export type MembershipPitchStep = typeof MEMBERSHIP_PITCH_SEQUENCE[number]['name'];

/**
 * Get a rendered membership pitch template for a specific step.
 */
export function getMembershipPitchTemplate(
  stepName: string,
  vars: MembershipPitchVars
): { sms: string; emailSubject: string; emailBody: string } | null {
  const step = MEMBERSHIP_PITCH_SEQUENCE.find(s => s.name === stepName);
  if (!step) return null;

  return {
    sms: fill(step.template.sms, vars),
    emailSubject: fill(step.template.emailSubject, vars),
    emailBody: fill(step.template.emailBody, vars),
  };
}

/**
 * Get all membership pitch templates for a client (for preview/testing).
 */
export function getAllMembershipPitchTemplates(vars: MembershipPitchVars) {
  return MEMBERSHIP_PITCH_SEQUENCE.map(step => ({
    name: step.name,
    delayHours: step.delayHours,
    sms: fill(step.template.sms, vars),
    emailSubject: fill(step.template.emailSubject, vars),
    emailBody: fill(step.template.emailBody, vars),
  }));
}
