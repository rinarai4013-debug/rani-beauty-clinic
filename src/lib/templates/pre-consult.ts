/**
 * Pre-Consult Communication Templates
 *
 * Automated SMS and email sequences for clients who have booked consultations.
 * Triggered by Mangomint "Appointment Created" webhook via n8n WF3.
 *
 * Sequence:
 * 1. Immediate — Booking confirmation + what to expect
 * 2. 24h before — Reminder + prep instructions (service-specific)
 * 3. 2h before — Final reminder + directions/parking
 */

export interface PreConsultVars {
  firstName: string;
  serviceName: string;
  serviceCategory: string;
  providerName: string;
  appointmentDate: string; // "March 20, 2026"
  appointmentTime: string; // "2:30 PM"
  duration: number; // minutes
  isNewClient: boolean;
  depositPaid: boolean;
  depositAmount?: number;
  consultType?: string; // initial, follow_up, package_review
}

interface Template {
  sms: string;
  emailSubject: string;
  emailBody: string;
}

const CLINIC_ADDRESS = '401 Olympia Ave NE #101, Renton, WA 98056';
const CLINIC_PHONE = '(425) 207-8883';
const MAPS_LINK = 'https://maps.google.com/?q=401+Olympia+Ave+NE+%23101+Renton+WA+98056';
const BOOKING_URL = 'https://www.ranibeautyclinic.com/contact';

function fill(template: string, vars: PreConsultVars): string {
  return template
    .replace(/{{firstName}}/g, vars.firstName)
    .replace(/{{serviceName}}/g, vars.serviceName)
    .replace(/{{serviceCategory}}/g, vars.serviceCategory)
    .replace(/{{providerName}}/g, vars.providerName)
    .replace(/{{appointmentDate}}/g, vars.appointmentDate)
    .replace(/{{appointmentTime}}/g, vars.appointmentTime)
    .replace(/{{duration}}/g, String(vars.duration))
    .replace(/{{clinicAddress}}/g, CLINIC_ADDRESS)
    .replace(/{{clinicPhone}}/g, CLINIC_PHONE)
    .replace(/{{mapsLink}}/g, MAPS_LINK)
    .replace(/{{depositAmount}}/g, vars.depositAmount ? `$${vars.depositAmount}` : '$150');
}

// ── SERVICE-SPECIFIC PREP INSTRUCTIONS ──

const PREP_INSTRUCTIONS: Record<string, string[]> = {
  laser: [
    'Avoid sun exposure and self-tanning for 2 weeks before your appointment',
    'Shave the treatment area 24 hours prior (do not wax or pluck)',
    'Discontinue retinol and AHA/BHA products 3-5 days before',
    'Come with clean skin — no makeup, lotion, or deodorant on the treatment area',
  ],
  injectable: [
    'Avoid blood-thinning supplements (fish oil, vitamin E, aspirin) for 7 days prior',
    'No alcohol for 24 hours before your appointment',
    'Come with a clean face — no makeup',
    'Eat a light meal before your visit to prevent lightheadedness',
  ],
  facial: [
    'Arrive with clean, makeup-free skin if possible',
    'Discontinue retinol products 3 days before',
    'Stay hydrated — drink plenty of water the day before',
    'Let us know about any new skincare products you\'ve started',
  ],
  wellness: [
    'Fast for 8-12 hours if bloodwork is included in your visit',
    'Bring a list of current medications and supplements',
    'Wear comfortable clothing with easy arm access for injections',
    'Stay hydrated — drink plenty of water',
  ],
  body: [
    'Wear comfortable, loose-fitting clothing',
    'Stay well-hydrated before and after your treatment',
    'Avoid heavy meals 2 hours before your appointment',
    'Avoid caffeine the morning of your treatment if possible',
  ],
  consult: [
    'Think about your goals and what results you\'d like to achieve',
    'Bring a list of any current skincare products or medications',
    'Feel free to bring reference photos of results you admire',
    'We\'ll discuss a personalized treatment plan — no pressure to commit',
  ],
};

function getPrepInstructions(category: string): string[] {
  const key = category.toLowerCase();
  return PREP_INSTRUCTIONS[key] || PREP_INSTRUCTIONS['consult'];
}

function formatPrepListSMS(category: string): string {
  const preps = getPrepInstructions(category);
  return preps.slice(0, 3).map((p, i) => `${i + 1}. ${p}`).join('\n');
}

function formatPrepListHTML(category: string): string {
  const preps = getPrepInstructions(category);
  return preps.map(p => `<li style="padding: 4px 0; color: #555;">${p}</li>`).join('');
}

// ── TEMPLATES ──

const BOOKING_CONFIRMATION: Template = {
  sms: `hi beautiful! ✨ your appointment is confirmed for {{appointmentDate}} at {{appointmentTime}}! we are SO excited to see you 💛 we're at {{clinicAddress}}. questions? text us or call {{clinicPhone}} 🤍`,
  emailSubject: `you're booked, {{firstName}}! ✨`,
  emailBody: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #0F1D2C; padding: 32px; text-align: center;">
    <h1 style="color: #C9A96E; margin: 0; font-size: 28px; font-family: 'Playfair Display', Georgia, serif;">you're booked! ✨</h1>
    <p style="color: rgba(255,255,255,0.6); margin: 8px 0 0; font-size: 14px;">we are SO excited to see you 💛</p>
  </div>
  <div style="padding: 32px; background-color: #ffffff;">
    <p style="color: #333; font-size: 16px; line-height: 1.6;">hi beautiful! 💛</p>
    <p style="color: #333; font-size: 16px; line-height: 1.6;">
      your appointment is confirmed and we can't wait to see you! here are your details ✨
    </p>

    <div style="background-color: #F8F6F1; border-radius: 12px; padding: 20px; margin: 20px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #888; font-size: 14px; width: 120px;">Service</td>
          <td style="padding: 8px 0; color: #0F1D2C; font-size: 14px; font-weight: 600;">{{serviceName}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #888; font-size: 14px;">Date</td>
          <td style="padding: 8px 0; color: #0F1D2C; font-size: 14px; font-weight: 600;">{{appointmentDate}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #888; font-size: 14px;">Time</td>
          <td style="padding: 8px 0; color: #0F1D2C; font-size: 14px; font-weight: 600;">{{appointmentTime}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #888; font-size: 14px;">Duration</td>
          <td style="padding: 8px 0; color: #0F1D2C; font-size: 14px; font-weight: 600;">{{duration}} minutes</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #888; font-size: 14px;">Provider</td>
          <td style="padding: 8px 0; color: #0F1D2C; font-size: 14px; font-weight: 600;">{{providerName}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #888; font-size: 14px;">Location</td>
          <td style="padding: 8px 0; color: #0F1D2C; font-size: 14px;">
            <a href="{{mapsLink}}" style="color: #C9A96E; text-decoration: none;">{{clinicAddress}}</a>
          </td>
        </tr>
      </table>
    </div>

    <p style="color: #333; font-size: 14px; line-height: 1.6;">
      need to reschedule? just call us at <a href="tel:+14252078883" style="color: #C9A96E;">{{clinicPhone}}</a> or reply to this email 🤍
    </p>
  </div>
  <div style="background-color: #F8F6F1; padding: 16px; text-align: center;">
    <p style="margin: 0; color: #888; font-size: 12px;">Rani Beauty Clinic &middot; {{clinicAddress}}</p>
  </div>
</div>`,
};

const REMINDER_24H: Template = {
  sms: `hey angel! 💛 just a friendly reminder — your {{serviceName}} appointment is tomorrow at {{appointmentTime}} ✨ remember to:\n{{prepList}}\nand we'll have everything ready for you! can't wait! 🤍`,
  emailSubject: `see you tomorrow, {{firstName}}! ✨`,
  emailBody: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #0F1D2C; padding: 28px; text-align: center;">
    <h1 style="color: #C9A96E; margin: 0; font-size: 24px; font-family: 'Playfair Display', Georgia, serif;">see you tomorrow! ✨</h1>
  </div>
  <div style="padding: 32px; background-color: #ffffff;">
    <p style="color: #333; font-size: 16px; line-height: 1.6;">hey angel! 💛</p>
    <p style="color: #333; font-size: 16px; line-height: 1.6;">
      just a friendly reminder — your <strong>{{serviceName}}</strong> appointment is tomorrow at <strong>{{appointmentTime}}</strong> with {{providerName}} ✨ we'll have everything ready for you!
    </p>

    <div style="background-color: #F8F6F1; border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid #C9A96E;">
      <p style="color: #0F1D2C; font-size: 14px; font-weight: 600; margin: 0 0 12px;">how to prepare ✨</p>
      <ul style="margin: 0; padding-left: 20px; line-height: 1.8;">
        {{prepListHTML}}
      </ul>
    </div>

    <div style="background-color: #f9f9f9; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <p style="color: #0F1D2C; font-size: 13px; font-weight: 600; margin: 0 0 4px;">parking &amp; directions 💛</p>
      <p style="color: #555; font-size: 13px; margin: 0; line-height: 1.5;">
        free parking available in the lot directly in front of our building.
        <a href="{{mapsLink}}" style="color: #C9A96E;">get directions</a>
      </p>
    </div>
    <p style="color: #333; font-size: 14px; line-height: 1.6; text-align: center;">can't wait to see you! 🤍</p>
  </div>
  <div style="background-color: #F8F6F1; padding: 16px; text-align: center;">
    <p style="margin: 0; color: #888; font-size: 12px;">Rani Beauty Clinic &middot; {{clinicAddress}}</p>
  </div>
</div>`,
};

const REMINDER_2H: Template = {
  sms: `hi gorgeous! ✨ see you in 2 hours! we're all set and ready for you 💛 free parking right in front of our building at {{clinicAddress}}. see you soon beautiful! 🤍`,
  emailSubject: `see you in 2 hours! ✨`,
  emailBody: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #0F1D2C; padding: 28px; text-align: center;">
    <h1 style="color: #C9A96E; margin: 0; font-size: 24px; font-family: 'Playfair Display', Georgia, serif;">see you soon! ✨</h1>
  </div>
  <div style="padding: 32px; background-color: #ffffff;">
    <p style="color: #333; font-size: 16px; line-height: 1.6;">hi gorgeous! 💛</p>
    <p style="color: #333; font-size: 16px; line-height: 1.6;">
      your <strong>{{serviceName}}</strong> appointment with {{providerName}} is in about 2 hours ✨ we're all set and ready for you!
    </p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="{{mapsLink}}" style="display: inline-block; background-color: #C9A96E; color: #0F1D2C; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
        Get Directions 💛
      </a>
    </div>
    <p style="color: #888; font-size: 13px; text-align: center;">free parking available right in front of our building 🤍</p>
    <p style="color: #333; font-size: 14px; line-height: 1.6; text-align: center;">see you soon beautiful! ✨</p>
  </div>
  <div style="background-color: #F8F6F1; padding: 16px; text-align: center;">
    <p style="margin: 0; color: #888; font-size: 12px;">{{clinicAddress}} &middot; {{clinicPhone}}</p>
  </div>
</div>`,
};

// ── NEW CLIENT WELCOME ADD-ON ──

const NEW_CLIENT_ADDON_SMS = `\n\nSince this is your first visit: please arrive 10 minutes early to complete a quick intake form. Bring a valid photo ID and any relevant medical history.`;

const NEW_CLIENT_ADDON_HTML = `
<div style="background-color: #fff8e7; border: 1px solid #C9A96E33; border-radius: 8px; padding: 16px; margin: 16px 0;">
  <p style="color: #0F1D2C; font-size: 13px; font-weight: 600; margin: 0 0 8px;">First Visit? Here's What to Bring</p>
  <ul style="margin: 0; padding-left: 20px; color: #555; font-size: 13px; line-height: 1.8;">
    <li>Please arrive 10 minutes early for intake paperwork</li>
    <li>Valid photo ID</li>
    <li>List of current medications/supplements</li>
    <li>Any relevant medical history or treatment records</li>
  </ul>
</div>`;

// ── EXPORTS ──

export const PRE_CONSULT_SEQUENCE = [
  { name: 'booking-confirmation', delayHours: 0, template: BOOKING_CONFIRMATION },
  { name: '24h-reminder', delayHours: -24, template: REMINDER_24H }, // negative = before appointment
  { name: '2h-reminder', delayHours: -2, template: REMINDER_2H },
] as const;

/**
 * Get a rendered pre-consult template.
 */
export function getPreConsultTemplate(
  stepName: string,
  vars: PreConsultVars
): { sms: string; emailSubject: string; emailBody: string } | null {
  const step = PRE_CONSULT_SEQUENCE.find(s => s.name === stepName);
  if (!step) return null;

  let sms = fill(step.template.sms, vars);
  let emailBody = fill(step.template.emailBody, vars);
  const emailSubject = fill(step.template.emailSubject, vars);

  // Inject prep instructions for 24h reminder
  if (stepName === '24h-reminder') {
    sms = sms.replace('{{prepList}}', formatPrepListSMS(vars.serviceCategory));
    emailBody = emailBody.replace('{{prepListHTML}}', formatPrepListHTML(vars.serviceCategory));
  }

  // Add new client addons
  if (vars.isNewClient && stepName === 'booking-confirmation') {
    sms += NEW_CLIENT_ADDON_SMS;
    emailBody = emailBody.replace('</div>\n  <div style="background-color: #F8F6F1',
      NEW_CLIENT_ADDON_HTML + '</div>\n  <div style="background-color: #F8F6F1');
  }

  return { sms, emailSubject, emailBody };
}

/**
 * Get all pre-consult templates (for preview).
 */
export function getAllPreConsultTemplates(vars: PreConsultVars) {
  return PRE_CONSULT_SEQUENCE.map(step => {
    const result = getPreConsultTemplate(step.name, vars);
    return {
      name: step.name,
      delayHours: step.delayHours,
      ...result,
    };
  });
}
