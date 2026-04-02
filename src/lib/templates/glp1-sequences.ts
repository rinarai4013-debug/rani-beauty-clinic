/**
 * GLP-1 Weight Management Program - Email/SMS Sequences
 *
 * Three sequence types:
 * 1. WELCOME - After payment, guides through intake → GFE → first dose
 * 2. ONGOING - Monthly check-in reminders, progress, cross-sell, titration
 * 3. RE-ENGAGEMENT - If patient goes quiet (7/14/30 day)
 *
 * Called by n8n workflows. Variables replaced at send time.
 */

export interface GLP1TemplateVars {
  firstName: string;
  tier: 'Starter' | 'Premium' | 'VIP';
  programFee: string;
  intakeFormLink: string;
  gfeDate?: string;
  currentWeight?: string;
  startWeight?: string;
  weightLost?: string;
  nextCheckInDate?: string;
  currentDose?: string;
  nextDose?: string;
  crossSellService?: string;
  crossSellDiscount?: string;
}

interface GLP1Template {
  sms: string;
  emailSubject: string;
  emailBody: string;
  delay: string; // human-readable trigger timing
}

const BOOKING_URL = 'https://www.ranibeautyclinic.com/contact';
const INTAKE_URL = 'https://www.ranibeautyclinic.com/glp1/intake';
const CLINIC_PHONE = '(425) 207-8883';
const LILLYDIRECT_URL = 'https://www.lillydirect.com';

function emailWrapper(title: string, content: string): string {
  return `
<div style="font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #0F1D2C; padding: 32px; text-align: center;">
    <h1 style="color: #C9A96E; margin: 0; font-size: 24px; font-family: 'Playfair Display', Georgia, serif;">${title}</h1>
  </div>
  <div style="padding: 32px; background-color: #ffffff;">
    ${content}
  </div>
  <div style="background-color: #FAF8F5; padding: 16px; text-align: center;">
    <p style="margin: 0; color: #888; font-size: 12px; font-family: 'Montserrat', sans-serif;">Rani Beauty Clinic &middot; 401 Olympia Ave NE, Suite 101, Renton, WA 98056</p>
    <p style="margin: 4px 0 0; color: #888; font-size: 12px; font-family: 'Montserrat', sans-serif;">${CLINIC_PHONE} &middot; ranibeautyclinic.com</p>
  </div>
</div>`;
}

// ═══════════════════════════════════════════
// WELCOME SEQUENCE (after payment)
// ═══════════════════════════════════════════

export const WELCOME_1_IMMEDIATE: GLP1Template = {
  delay: 'Immediate (after payment)',
  sms: `hi {{firstName}}! welcome to Rani Weight Management! you're in good hands. first step: complete your intake form so we can get your medical evaluation started. here's the link: {{intakeFormLink}} - we're so excited for your journey!`,
  emailSubject: `welcome to Rani Weight Management, {{firstName}}!`,
  emailBody: emailWrapper('welcome, {{firstName}}!', `
    <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 16px; font-family: 'Montserrat', sans-serif;">
      we are so glad you are here! you just took the biggest step - deciding to invest in yourself. here is what happens next:
    </p>
    <div style="background-color: #FAF8F5; border-radius: 12px; padding: 24px; margin: 16px 0;">
      <p style="color: #0F1D2C; font-size: 14px; margin: 0 0 12px; font-family: 'Montserrat', sans-serif;"><strong>Step 1:</strong> Complete your intake form (takes ~10 min)</p>
      <p style="color: #0F1D2C; font-size: 14px; margin: 0 0 12px; font-family: 'Montserrat', sans-serif;"><strong>Step 2:</strong> Upload your recent lab results</p>
      <p style="color: #0F1D2C; font-size: 14px; margin: 0; font-family: 'Montserrat', sans-serif;"><strong>Step 3:</strong> We schedule your medical evaluation</p>
    </div>
    <a href="{{intakeFormLink}}" style="display: inline-block; background-color: #C9A96E; color: #0F1D2C; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin: 16px 0; font-family: 'Montserrat', sans-serif;">
      Complete Your Intake Form
    </a>
    <p style="color: #666; font-size: 14px; line-height: 1.5; margin: 16px 0 0; font-family: 'Montserrat', sans-serif;">
      your {{tier}} program includes {{programFee}}/month - check-ins, nutrition support, and accountability all included. medication is prescribed separately after your medical evaluation.
    </p>
    <p style="color: #333; font-size: 14px; margin: 24px 0 0; font-family: 'Montserrat', sans-serif;">
      questions? text or call us anytime at ${CLINIC_PHONE}<br/>
      <strong>the Rani Team</strong>
    </p>
  `),
};

export const WELCOME_2_LABS_REMINDER: GLP1Template = {
  delay: '2 hours after payment (if intake not completed)',
  sms: `hey {{firstName}}! quick reminder - to get your medical evaluation scheduled, we need your intake form + lab results. here's the link: {{intakeFormLink}} - the sooner we get these, the sooner you'll be on your way!`,
  emailSubject: `don't forget: upload your labs to get started`,
  emailBody: emailWrapper('one more step, {{firstName}}', `
    <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 16px; font-family: 'Montserrat', sans-serif;">
      just a friendly nudge - we need your intake form and lab results to schedule your medical evaluation. the faster we get these, the faster you can start!
    </p>
    <p style="color: #333; font-size: 14px; line-height: 1.6; margin: 0 0 16px; font-family: 'Montserrat', sans-serif;">
      <strong>labs we need:</strong> CBC, CMP, A1C, Lipid Panel, TSH (within last 6 months)
    </p>
    <p style="color: #666; font-size: 14px; line-height: 1.5; margin: 0 0 16px; font-family: 'Montserrat', sans-serif;">
      don't have recent labs? no worries - just let us know and we can help arrange blood work for you.
    </p>
    <a href="{{intakeFormLink}}" style="display: inline-block; background-color: #C9A96E; color: #0F1D2C; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin: 16px 0; font-family: 'Montserrat', sans-serif;">
      Upload Labs & Complete Intake
    </a>
  `),
};

export const WELCOME_3_GFE_SCHEDULED: GLP1Template = {
  delay: '24 hours after payment (or after intake submitted)',
  sms: `great news {{firstName}}! your medical evaluation is scheduled for {{gfeDate}}. it's a quick telehealth call - just be somewhere private and have your phone ready. you've got this!`,
  emailSubject: `your medical evaluation is scheduled!`,
  emailBody: emailWrapper('you are on your way, {{firstName}}!', `
    <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 16px; font-family: 'Montserrat', sans-serif;">
      your medical evaluation has been scheduled! here is what to expect:
    </p>
    <div style="background-color: #FAF8F5; border-radius: 12px; padding: 24px; margin: 16px 0;">
      <p style="color: #0F1D2C; font-size: 16px; margin: 0 0 8px; font-family: 'Playfair Display', Georgia, serif;"><strong>{{gfeDate}}</strong></p>
      <p style="color: #666; font-size: 14px; margin: 0 0 12px; font-family: 'Montserrat', sans-serif;">Telehealth evaluation via Qualiphy</p>
      <p style="color: #0F1D2C; font-size: 14px; margin: 0 0 8px; font-family: 'Montserrat', sans-serif;"><strong>What to have ready:</strong></p>
      <ul style="color: #666; font-size: 14px; margin: 0; padding-left: 20px; font-family: 'Montserrat', sans-serif;">
        <li>Photo ID</li>
        <li>Quiet, private space</li>
        <li>List of questions you may have</li>
      </ul>
    </div>
    <p style="color: #666; font-size: 14px; line-height: 1.5; margin: 16px 0; font-family: 'Montserrat', sans-serif;">
      the evaluation is conducted by a licensed medical provider who will review your health history, lab results, and determine if GLP-1 medication is right for you.
    </p>
    <p style="color: #333; font-size: 14px; margin: 24px 0 0; font-family: 'Montserrat', sans-serif;">
      you are doing amazing already,<br/>
      <strong>the Rani Team</strong>
    </p>
  `),
};

export const WELCOME_4_APPROVED: GLP1Template = {
  delay: 'After GFE approval',
  sms: `{{firstName}} - you're approved! your prescription for brand-name medication is ready. next step: set up your LillyDirect account to fill your Rx. we'll walk you through everything - call or text us at ${CLINIC_PHONE}!`,
  emailSubject: `you're approved! here's how to get your medication`,
  emailBody: emailWrapper('you are approved, {{firstName}}!', `
    <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 16px; font-family: 'Montserrat', sans-serif;">
      congratulations - your medical provider has prescribed your medication! here is how to get it filled:
    </p>
    <div style="background-color: #FAF8F5; border-radius: 12px; padding: 24px; margin: 16px 0;">
      <p style="color: #0F1D2C; font-size: 14px; margin: 0 0 12px; font-family: 'Montserrat', sans-serif;"><strong>Step 1:</strong> Visit <a href="${LILLYDIRECT_URL}" style="color: #C9A96E;">LillyDirect.com</a> and create an account</p>
      <p style="color: #0F1D2C; font-size: 14px; margin: 0 0 12px; font-family: 'Montserrat', sans-serif;"><strong>Step 2:</strong> Your prescription will be available in your account</p>
      <p style="color: #0F1D2C; font-size: 14px; margin: 0 0 12px; font-family: 'Montserrat', sans-serif;"><strong>Step 3:</strong> Activate your savings card for maximum discount</p>
      <p style="color: #0F1D2C; font-size: 14px; margin: 0; font-family: 'Montserrat', sans-serif;"><strong>Step 4:</strong> Complete your order - medication ships to your door!</p>
    </div>
    <p style="color: #666; font-size: 14px; line-height: 1.5; margin: 16px 0; font-family: 'Montserrat', sans-serif;">
      need help setting up LillyDirect or activating your savings card? call or text us at ${CLINIC_PHONE} - we will walk you through the whole thing.
    </p>
    <a href="${LILLYDIRECT_URL}" style="display: inline-block; background-color: #C9A96E; color: #0F1D2C; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin: 16px 0; font-family: 'Montserrat', sans-serif;">
      Set Up LillyDirect
    </a>
  `),
};

export const WELCOME_5_FIRST_DOSE: GLP1Template = {
  delay: '7 days after approval (after first dose)',
  sms: `hey {{firstName}}! how was your first week on medication? totally normal to feel some side effects - nausea, reduced appetite, maybe some fatigue. if anything feels off, don't hesitate to text us. we're here for you!`,
  emailSubject: `how's your first week going, {{firstName}}?`,
  emailBody: emailWrapper('first week check-in', `
    <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 16px; font-family: 'Montserrat', sans-serif;">
      hi {{firstName}}! you have been on your medication for about a week now - how are you feeling?
    </p>
    <p style="color: #333; font-size: 14px; line-height: 1.6; margin: 0 0 16px; font-family: 'Montserrat', sans-serif;">
      <strong>totally normal first-week experiences:</strong>
    </p>
    <ul style="color: #666; font-size: 14px; margin: 0 0 16px; padding-left: 20px; font-family: 'Montserrat', sans-serif;">
      <li>Mild nausea (usually improves within 2-3 weeks)</li>
      <li>Decreased appetite (this is the medication working!)</li>
      <li>Some fatigue or digestive changes</li>
      <li>Injection site tenderness</li>
    </ul>
    <div style="background-color: #FAF8F5; border-radius: 12px; padding: 20px; margin: 16px 0; border-left: 4px solid #C9A96E;">
      <p style="color: #0F1D2C; font-size: 14px; margin: 0; font-family: 'Montserrat', sans-serif;">
        <strong>Quick tips:</strong> Eat smaller meals, stay hydrated, avoid greasy/heavy foods, take your injection in the evening if nausea is an issue.
      </p>
    </div>
    <p style="color: #666; font-size: 14px; line-height: 1.5; margin: 16px 0; font-family: 'Montserrat', sans-serif;">
      if you experience severe nausea, vomiting, or any concerning symptoms, contact your prescribing provider or call us at ${CLINIC_PHONE} right away.
    </p>
    <p style="color: #333; font-size: 14px; margin: 24px 0 0; font-family: 'Montserrat', sans-serif;">
      you are doing great,<br/>
      <strong>the Rani Team</strong>
    </p>
  `),
};

// ═══════════════════════════════════════════
// ONGOING MONTHLY SEQUENCES
// ═══════════════════════════════════════════

export const ONGOING_CHECKIN_REMINDER: GLP1Template = {
  delay: '2 days before scheduled check-in',
  sms: `hey {{firstName}}! just a reminder - your weight management check-in is coming up on {{nextCheckInDate}}. looking forward to seeing your progress!`,
  emailSubject: `check-in reminder - {{nextCheckInDate}}`,
  emailBody: emailWrapper('check-in coming up!', `
    <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 16px; font-family: 'Montserrat', sans-serif;">
      hi {{firstName}}! your next check-in is on <strong>{{nextCheckInDate}}</strong>. here is what we will cover:
    </p>
    <ul style="color: #666; font-size: 14px; margin: 0 0 16px; padding-left: 20px; font-family: 'Montserrat', sans-serif;">
      <li>Weight and body composition update</li>
      <li>How the medication is working for you</li>
      <li>Nutrition and lifestyle adjustments</li>
      <li>Any questions or concerns</li>
    </ul>
    <p style="color: #666; font-size: 14px; font-family: 'Montserrat', sans-serif;">see you soon!</p>
  `),
};

export const ONGOING_PROGRESS_CELEBRATION: GLP1Template = {
  delay: 'Monthly (after weight log update)',
  sms: `{{firstName}}! you've lost {{weightLost}} lbs since starting the program! that's incredible progress. from {{startWeight}} to {{currentWeight}} - you should be so proud. keep going!`,
  emailSubject: `you've lost {{weightLost}} lbs - amazing progress!`,
  emailBody: emailWrapper('look at you go, {{firstName}}!', `
    <div style="text-align: center; margin: 0 0 24px;">
      <p style="color: #C9A96E; font-size: 48px; font-weight: 700; margin: 0; font-family: 'Playfair Display', Georgia, serif;">-{{weightLost}} lbs</p>
      <p style="color: #666; font-size: 14px; margin: 4px 0 0; font-family: 'Montserrat', sans-serif;">{{startWeight}} lbs → {{currentWeight}} lbs</p>
    </div>
    <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 16px; font-family: 'Montserrat', sans-serif;">
      {{firstName}}, your progress is incredible. every pound is a victory, and you are putting in the work. keep it up!
    </p>
    <p style="color: #333; font-size: 14px; margin: 24px 0 0; font-family: 'Montserrat', sans-serif;">
      so proud of you,<br/>
      <strong>the Rani Team</strong>
    </p>
  `),
};

export const ONGOING_CROSSSELL: GLP1Template = {
  delay: 'Monthly (week 3 of each month)',
  sms: `hey {{firstName}}! did you know? many of our weight loss patients love pairing their program with {{crossSellService}} - and as a {{tier}} member, you get {{crossSellDiscount}}! want to learn more? reply YES or call us.`,
  emailSubject: `patients like you love {{crossSellService}}`,
  emailBody: emailWrapper('enhance your transformation', `
    <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 16px; font-family: 'Montserrat', sans-serif;">
      hi {{firstName}}! as you continue your weight loss journey, many of our patients find that pairing their program with complementary treatments amplifies their results.
    </p>
    <div style="background-color: #FAF8F5; border-radius: 12px; padding: 24px; margin: 16px 0; text-align: center;">
      <p style="color: #0F1D2C; font-size: 18px; margin: 0 0 8px; font-family: 'Playfair Display', Georgia, serif;"><strong>{{crossSellService}}</strong></p>
      <p style="color: #666; font-size: 14px; margin: 0 0 12px; font-family: 'Montserrat', sans-serif;">Addresses skin changes during weight loss</p>
      <p style="color: #C9A96E; font-size: 16px; font-weight: 600; margin: 0; font-family: 'Montserrat', sans-serif;">{{tier}} Member Discount: {{crossSellDiscount}}</p>
    </div>
    <a href="${BOOKING_URL}" style="display: inline-block; background-color: #C9A96E; color: #0F1D2C; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin: 16px 0; font-family: 'Montserrat', sans-serif;">
      Book a Consultation
    </a>
  `),
};

export const ONGOING_TITRATION_REMINDER: GLP1Template = {
  delay: 'Monthly (after 4 weeks on current dose)',
  sms: `{{firstName}} - you've been on {{currentDose}} for about a month. it may be time to discuss adjusting your dose to {{nextDose}} at your next check-in. let us know if you have any questions!`,
  emailSubject: `time to discuss your next dose level`,
  emailBody: emailWrapper('dose check-in time', `
    <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 16px; font-family: 'Montserrat', sans-serif;">
      hi {{firstName}}! you have been on <strong>{{currentDose}}</strong> for about a month now. based on standard titration protocols, it may be time to discuss moving to <strong>{{nextDose}}</strong>.
    </p>
    <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 0 0 16px; font-family: 'Montserrat', sans-serif;">
      we will cover this at your next check-in, but if you have questions before then, text or call us anytime. your prescribing provider will update your prescription if a dose change is recommended.
    </p>
  `),
};

// ═══════════════════════════════════════════
// RE-ENGAGEMENT SEQUENCES
// ═══════════════════════════════════════════

export const REENGAGE_DAY_7: GLP1Template = {
  delay: '7 days after missed check-in',
  sms: `hey {{firstName}}! we noticed you haven't scheduled your check-in yet. just wanted to make sure everything is going well with your medication. text us back or call ${CLINIC_PHONE} - we're here for you!`,
  emailSubject: `we miss you, {{firstName}} - how's everything going?`,
  emailBody: emailWrapper('checking in on you', `
    <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 16px; font-family: 'Montserrat', sans-serif;">
      hi {{firstName}}! we noticed we haven't connected in a bit. how is everything going with your weight management program?
    </p>
    <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 0 0 16px; font-family: 'Montserrat', sans-serif;">
      whether you're crushing it or hitting a plateau, we are here to support you. your check-ins are an important part of the program - they help us adjust your plan and keep you on track.
    </p>
    <a href="${BOOKING_URL}" style="display: inline-block; background-color: #C9A96E; color: #0F1D2C; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin: 16px 0; font-family: 'Montserrat', sans-serif;">
      Schedule Your Check-in
    </a>
  `),
};

export const REENGAGE_DAY_14: GLP1Template = {
  delay: '14 days after missed check-in',
  sms: `{{firstName}} - your weight loss journey doesn't have to stall. we've seen patients get the best results when they stay consistent with check-ins. let's get you back on track - reply or call ${CLINIC_PHONE}.`,
  emailSubject: `your journey doesn't have to stall`,
  emailBody: emailWrapper('let\'s get back on track', `
    <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 16px; font-family: 'Montserrat', sans-serif;">
      hi {{firstName}} - we know life gets busy, and sometimes it is hard to stay on top of everything. but your weight management journey is worth prioritizing.
    </p>
    <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 0 0 16px; font-family: 'Montserrat', sans-serif;">
      patients who stay consistent with their check-ins see the best results. we are here to help you with dosing guidance, nutrition adjustments, and accountability - but we need to hear from you.
    </p>
    <a href="${BOOKING_URL}" style="display: inline-block; background-color: #C9A96E; color: #0F1D2C; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin: 16px 0; font-family: 'Montserrat', sans-serif;">
      Get Back on Track
    </a>
  `),
};

export const REENGAGE_DAY_30: GLP1Template = {
  delay: '30 days after missed check-in',
  sms: `{{firstName}} - we'd love to help you get back on track. as a thank you for coming back, we're offering 10% off your next month's program fee. just reply or call ${CLINIC_PHONE} and mention this text.`,
  emailSubject: `we'd love to help you get back on track`,
  emailBody: emailWrapper('we want you back, {{firstName}}', `
    <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 16px; font-family: 'Montserrat', sans-serif;">
      hi {{firstName}} - it has been a while since we connected, and we want you to know we are still here for you.
    </p>
    <p style="color: #333; font-size: 14px; line-height: 1.6; margin: 0 0 16px; font-family: 'Montserrat', sans-serif;">
      whether you paused your medication, hit a plateau, or just got busy - there is no judgment here. we are ready to help you pick back up wherever you left off.
    </p>
    <div style="background-color: #FAF8F5; border-radius: 12px; padding: 24px; margin: 16px 0; text-align: center;">
      <p style="color: #0F1D2C; font-size: 18px; margin: 0 0 4px; font-family: 'Playfair Display', Georgia, serif;"><strong>Welcome Back Offer</strong></p>
      <p style="color: #C9A96E; font-size: 24px; font-weight: 700; margin: 0; font-family: 'Montserrat', sans-serif;">10% Off Next Month</p>
      <p style="color: #666; font-size: 12px; margin: 8px 0 0; font-family: 'Montserrat', sans-serif;">Just mention this email when you call</p>
    </div>
    <a href="${BOOKING_URL}" style="display: inline-block; background-color: #C9A96E; color: #0F1D2C; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin: 16px 0; font-family: 'Montserrat', sans-serif;">
      Get Back on Track
    </a>
  `),
};

// ═══════════════════════════════════════════
// SEQUENCE EXPORTS
// ═══════════════════════════════════════════

export const GLP1_WELCOME_SEQUENCE = [
  WELCOME_1_IMMEDIATE,
  WELCOME_2_LABS_REMINDER,
  WELCOME_3_GFE_SCHEDULED,
  WELCOME_4_APPROVED,
  WELCOME_5_FIRST_DOSE,
];

export const GLP1_ONGOING_SEQUENCE = [
  ONGOING_CHECKIN_REMINDER,
  ONGOING_PROGRESS_CELEBRATION,
  ONGOING_CROSSSELL,
  ONGOING_TITRATION_REMINDER,
];

export const GLP1_REENGAGE_SEQUENCE = [
  REENGAGE_DAY_7,
  REENGAGE_DAY_14,
  REENGAGE_DAY_30,
];

export function fillGLP1Template(template: string, vars: Partial<GLP1TemplateVars>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    if (value) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    }
  }
  return result;
}
