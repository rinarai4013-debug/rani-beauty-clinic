/**
 * Referral Program Notification Templates
 *
 * Used by n8n workflows to send referral-related notifications.
 * Templates for: referral sent, referral completed, reward issued.
 */

export interface ReferralNotificationVars {
  referrerFirstName: string;
  referrerName: string;
  refereeFirstName?: string;
  refereeName?: string;
  referralCode: string;
  rewardAmount?: number;
  refereeDiscount?: number;
  shareUrl?: string;
}

interface NotificationTemplate {
  sms: string;
  emailSubject: string;
  emailBody: string;
}

const BOOKING_URL = 'https://www.ranibeautyclinic.com/contact';
const CLINIC_PHONE = '(425) 207-8883';

function fill(template: string, vars: ReferralNotificationVars): string {
  const shareUrl = vars.shareUrl || `https://www.ranibeautyclinic.com/get-started?ref=${vars.referralCode}`;
  return template
    .replace(/{{referrerFirstName}}/g, vars.referrerFirstName)
    .replace(/{{referrerName}}/g, vars.referrerName)
    .replace(/{{refereeFirstName}}/g, vars.refereeFirstName || 'your friend')
    .replace(/{{refereeName}}/g, vars.refereeName || 'your friend')
    .replace(/{{referralCode}}/g, vars.referralCode)
    .replace(/{{rewardAmount}}/g, String(vars.rewardAmount || 50))
    .replace(/{{refereeDiscount}}/g, String(vars.refereeDiscount || 25))
    .replace(/{{shareUrl}}/g, shareUrl)
    .replace(/{{bookingUrl}}/g, BOOKING_URL)
    .replace(/{{clinicPhone}}/g, CLINIC_PHONE);
}

const brandHeader = (title: string) => `
<div style="background-color: #0F1D2C; padding: 32px; text-align: center;">
  <h1 style="color: #C9A96E; margin: 0; font-size: 28px; font-family: 'Playfair Display', Georgia, serif;">${title}</h1>
</div>`;

const brandFooter = `
<div style="padding: 24px; text-align: center; background-color: #F8F6F1; border-top: 1px solid #E5E0D8;">
  <p style="color: #666; font-size: 13px; margin: 0;">Rani Beauty Clinic | ${CLINIC_PHONE}</p>
  <p style="color: #999; font-size: 12px; margin: 8px 0 0;">401 Olympia Ave NE, Suite 101, Renton, WA 98056</p>
</div>`;

// ── Referral Sent (to referrer) ──────────────────────────────────────────

const REFERRAL_SENT: NotificationTemplate = {
  sms: `your referral code is ready: {{referralCode}}! share it with friends and you'll both get rewarded - you get \${{rewardAmount}} credit, they get \${{refereeDiscount}} off. share: {{shareUrl}}`,
  emailSubject: `your referral code is ready: {{referralCode}}`,
  emailBody: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
  ${brandHeader('share the glow!')}
  <div style="padding: 32px; background-color: #ffffff;">
    <p style="color: #333; font-size: 16px; line-height: 1.6;">hi {{referrerFirstName}}!</p>
    <p style="color: #333; font-size: 16px; line-height: 1.6;">
      your referral code is ready to share. for every friend who books and completes their first treatment, you'll receive a <strong style="color: #C9A96E;">\${{rewardAmount}} treatment credit</strong>.
    </p>
    <div style="background: linear-gradient(135deg, #0F1D2C, #1a2d40); border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
      <p style="color: #C9A96E; font-size: 14px; margin: 0 0 8px;">Your referral code</p>
      <p style="color: #ffffff; font-size: 36px; font-weight: 700; letter-spacing: 4px; margin: 0;">{{referralCode}}</p>
      <p style="color: #aaa; font-size: 13px; margin: 8px 0 0;">Your friend gets \${{refereeDiscount}} off their first visit</p>
    </div>
    <div style="text-align: center; margin: 28px 0;">
      <a href="{{shareUrl}}" style="display: inline-block; background-color: #C9A96E; color: #0F1D2C; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
        Share Your Link
      </a>
    </div>
    <p style="color: #666; font-size: 14px; text-align: center;">
      Or share this link: <a href="{{shareUrl}}" style="color: #C9A96E;">{{shareUrl}}</a>
    </p>
  </div>
  ${brandFooter}
</div>`,
};

// ── Referral Completed (to referrer) ─────────────────────────────────────

const REFERRAL_COMPLETED: NotificationTemplate = {
  sms: `great news! {{refereeFirstName}} completed their first treatment at Rani. your \${{rewardAmount}} credit is being applied! thank you for spreading the glow.`,
  emailSubject: `you earned a \${{rewardAmount}} referral reward!`,
  emailBody: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
  ${brandHeader('referral reward!')}
  <div style="padding: 32px; background-color: #ffffff;">
    <p style="color: #333; font-size: 16px; line-height: 1.6;">hi {{referrerFirstName}}!</p>
    <p style="color: #333; font-size: 16px; line-height: 1.6;">
      amazing news - <strong>{{refereeFirstName}}</strong> just completed their first treatment at Rani Beauty Clinic, thanks to your referral!
    </p>
    <div style="background: #F8F6F1; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
      <p style="color: #666; font-size: 14px; margin: 0 0 4px;">Your reward</p>
      <p style="color: #C9A96E; font-size: 36px; font-weight: 700; margin: 0;">\${{rewardAmount}}</p>
      <p style="color: #666; font-size: 14px; margin: 4px 0 0;">treatment credit</p>
    </div>
    <p style="color: #333; font-size: 16px; line-height: 1.6;">
      this credit will be automatically applied to your next appointment. keep referring friends - there's no limit to how much you can earn!
    </p>
    <div style="text-align: center; margin: 28px 0;">
      <a href="{{bookingUrl}}" style="display: inline-block; background-color: #C9A96E; color: #0F1D2C; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
        Book & Use Your Credit
      </a>
    </div>
  </div>
  ${brandFooter}
</div>`,
};

// ── Referee Welcome (to referee) ─────────────────────────────────────────

const REFEREE_WELCOME: NotificationTemplate = {
  sms: `welcome to Rani Beauty Clinic! {{referrerFirstName}} referred you and you've got \${{refereeDiscount}} off your first treatment. book now: {{bookingUrl}}`,
  emailSubject: `{{referrerFirstName}} sent you a gift from Rani Beauty Clinic`,
  emailBody: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
  ${brandHeader('welcome to Rani!')}
  <div style="padding: 32px; background-color: #ffffff;">
    <p style="color: #333; font-size: 16px; line-height: 1.6;">hi there!</p>
    <p style="color: #333; font-size: 16px; line-height: 1.6;">
      your friend <strong>{{referrerFirstName}}</strong> thinks you'd love Rani Beauty Clinic - and we think so too!
    </p>
    <div style="background: linear-gradient(135deg, #C9A96E, #d4b97e); border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
      <p style="color: #0F1D2C; font-size: 14px; font-weight: 500; margin: 0 0 8px;">Your welcome gift</p>
      <p style="color: #0F1D2C; font-size: 36px; font-weight: 700; margin: 0;">\${{refereeDiscount}} OFF</p>
      <p style="color: #0F1D2C; font-size: 14px; margin: 8px 0 0;">your first treatment</p>
    </div>
    <p style="color: #333; font-size: 16px; line-height: 1.6;">
      use code <strong style="color: #C9A96E;">{{referralCode}}</strong> when you book to claim your discount. we offer advanced skincare treatments, wellness injections, and medical aesthetics - all in a luxury setting.
    </p>
    <div style="text-align: center; margin: 28px 0;">
      <a href="{{shareUrl}}" style="display: inline-block; background-color: #C9A96E; color: #0F1D2C; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
        Book Your First Visit
      </a>
    </div>
  </div>
  ${brandFooter}
</div>`,
};

// ── Public API ────────────────────────────────────────────────────────────

export type ReferralNotificationType = 'referral_sent' | 'referral_completed' | 'referee_welcome';

const TEMPLATES: Record<ReferralNotificationType, NotificationTemplate> = {
  referral_sent: REFERRAL_SENT,
  referral_completed: REFERRAL_COMPLETED,
  referee_welcome: REFEREE_WELCOME,
};

/**
 * Render a referral notification template with variable substitution.
 */
export function renderReferralNotification(
  type: ReferralNotificationType,
  vars: ReferralNotificationVars,
): { sms: string; emailSubject: string; emailBody: string } {
  const template = TEMPLATES[type];
  if (!template) {
    throw new Error(`Unknown referral notification type: ${type}`);
  }

  return {
    sms: fill(template.sms, vars),
    emailSubject: fill(template.emailSubject, vars),
    emailBody: fill(template.emailBody, vars),
  };
}

/**
 * Get all supported notification types.
 */
export function getSupportedTypes(): ReferralNotificationType[] {
  return Object.keys(TEMPLATES) as ReferralNotificationType[];
}
