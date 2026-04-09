/**
 * Loyalty Program Notification Templates
 *
 * Used by n8n workflows to send loyalty-related notifications.
 * Templates for: points earned, points redeemed, tier upgrades.
 */

export interface LoyaltyNotificationVars {
  firstName: string;
  pointsEarned?: number;
  pointsRedeemed?: number;
  totalBalance: number;
  tier: 'Silver' | 'Gold' | 'Platinum';
  rewardName?: string;
  creditAmount?: number;
  newTier?: string;
  previousTier?: string;
  serviceName?: string;
  bonusType?: string;
}

interface NotificationTemplate {
  sms: string;
  emailSubject: string;
  emailBody: string;
}

const BOOKING_URL = 'https://www.ranibeautyclinic.com/contact';
const CLINIC_PHONE = '(425) 207-8883';

function fill(template: string, vars: LoyaltyNotificationVars): string {
  return template
    .replace(/{{firstName}}/g, vars.firstName)
    .replace(/{{pointsEarned}}/g, String(vars.pointsEarned || 0))
    .replace(/{{pointsRedeemed}}/g, String(vars.pointsRedeemed || 0))
    .replace(/{{totalBalance}}/g, String(vars.totalBalance))
    .replace(/{{tier}}/g, vars.tier)
    .replace(/{{rewardName}}/g, vars.rewardName || '')
    .replace(/{{creditAmount}}/g, String(vars.creditAmount || 0))
    .replace(/{{newTier}}/g, vars.newTier || '')
    .replace(/{{previousTier}}/g, vars.previousTier || '')
    .replace(/{{serviceName}}/g, vars.serviceName || '')
    .replace(/{{bookingUrl}}/g, BOOKING_URL)
    .replace(/{{clinicPhone}}/g, CLINIC_PHONE);
}

const brandHeader = `
<div style="background-color: #0F1D2C; padding: 32px; text-align: center;">
  <h1 style="color: #C9A96E; margin: 0; font-size: 28px; font-family: 'Playfair Display', Georgia, serif;">TITLE</h1>
</div>`;

const brandFooter = `
<div style="padding: 24px; text-align: center; background-color: #F8F6F1; border-top: 1px solid #E5E0D8;">
  <p style="color: #666; font-size: 13px; margin: 0;">Rani Beauty Clinic | ${CLINIC_PHONE}</p>
  <p style="color: #999; font-size: 12px; margin: 8px 0 0;">Your loyalty balance: {{totalBalance}} points</p>
</div>`;

// ── Points Earned ────────────────────────────────────────────────────────

const POINTS_EARNED: NotificationTemplate = {
  sms: `you just earned {{pointsEarned}} loyalty points for your {{serviceName}} at Rani! your balance is now {{totalBalance}} points. keep glowing! ranibeautyclinic.com`,
  emailSubject: `you earned {{pointsEarned}} points, {{firstName}}!`,
  emailBody: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
  ${brandHeader.replace('TITLE', 'points earned!')}
  <div style="padding: 32px; background-color: #ffffff;">
    <p style="color: #333; font-size: 16px; line-height: 1.6;">hi {{firstName}}!</p>
    <p style="color: #333; font-size: 16px; line-height: 1.6;">
      you just earned <strong style="color: #C9A96E;">{{pointsEarned}} loyalty points</strong> for your {{serviceName}} today.
    </p>
    <div style="background: #F8F6F1; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
      <p style="color: #666; font-size: 14px; margin: 0 0 4px;">Your balance</p>
      <p style="color: #0F1D2C; font-size: 36px; font-weight: 700; margin: 0;">{{totalBalance}}</p>
      <p style="color: #C9A96E; font-size: 14px; margin: 4px 0 0;">{{tier}} Member</p>
    </div>
    <div style="text-align: center; margin: 28px 0;">
      <a href="{{bookingUrl}}" style="display: inline-block; background-color: #C9A96E; color: #0F1D2C; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
        Book Your Next Visit
      </a>
    </div>
  </div>
  ${brandFooter}
</div>`,
};

// ── Points Redeemed ──────────────────────────────────────────────────────

const POINTS_REDEEMED: NotificationTemplate = {
  sms: `you redeemed {{pointsRedeemed}} points for {{rewardName}} (${'$'}{{creditAmount}} value)! your new balance is {{totalBalance}} points. enjoy! - Rani Beauty Clinic`,
  emailSubject: `reward redeemed: {{rewardName}}`,
  emailBody: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
  ${brandHeader.replace('TITLE', 'reward redeemed!')}
  <div style="padding: 32px; background-color: #ffffff;">
    <p style="color: #333; font-size: 16px; line-height: 1.6;">hi {{firstName}}!</p>
    <p style="color: #333; font-size: 16px; line-height: 1.6;">
      you've redeemed <strong>{{pointsRedeemed}} points</strong> for:
    </p>
    <div style="background: linear-gradient(135deg, #0F1D2C, #1a2d40); border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
      <p style="color: #C9A96E; font-size: 20px; font-weight: 600; margin: 0;">{{rewardName}}</p>
      <p style="color: #ffffff; font-size: 14px; margin: 8px 0 0;">${'$'}{{creditAmount}} value</p>
    </div>
    <p style="color: #333; font-size: 16px; line-height: 1.6;">
      your remaining balance is <strong>{{totalBalance}} points</strong>. this credit will be applied to your next visit.
    </p>
    <div style="text-align: center; margin: 28px 0;">
      <a href="{{bookingUrl}}" style="display: inline-block; background-color: #C9A96E; color: #0F1D2C; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
        Book & Use Your Reward
      </a>
    </div>
  </div>
  ${brandFooter}
</div>`,
};

// ── Tier Upgrade ─────────────────────────────────────────────────────────

const TIER_UPGRADE: NotificationTemplate = {
  sms: `congrats {{firstName}}! you've been upgraded to {{newTier}} tier at Rani Beauty Clinic! enjoy your new perks. details: ranibeautyclinic.com`,
  emailSubject: `you've been upgraded to {{newTier}}!`,
  emailBody: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
  ${brandHeader.replace('TITLE', 'tier upgrade!')}
  <div style="padding: 32px; background-color: #ffffff;">
    <p style="color: #333; font-size: 16px; line-height: 1.6;">hi {{firstName}}!</p>
    <p style="color: #333; font-size: 16px; line-height: 1.6;">
      amazing news - you've been upgraded from <strong>{{previousTier}}</strong> to <strong style="color: #C9A96E;">{{newTier}}</strong>!
    </p>
    <div style="background: linear-gradient(135deg, #C9A96E, #d4b97e); border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
      <p style="color: #0F1D2C; font-size: 14px; font-weight: 500; margin: 0 0 4px;">Welcome to</p>
      <p style="color: #0F1D2C; font-size: 32px; font-weight: 700; margin: 0; font-family: 'Playfair Display', Georgia, serif;">{{newTier}}</p>
    </div>
    <p style="color: #333; font-size: 16px; line-height: 1.6;">your new benefits include:</p>
    <ul style="color: #333; font-size: 15px; line-height: 1.8; padding-left: 20px;">
      <li>Exclusive tier discount on all services</li>
      <li>Priority booking access</li>
      <li>Bonus loyalty points earned per visit</li>
    </ul>
    <div style="text-align: center; margin: 28px 0;">
      <a href="{{bookingUrl}}" style="display: inline-block; background-color: #C9A96E; color: #0F1D2C; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
        Book as {{newTier}} Member
      </a>
    </div>
  </div>
  ${brandFooter}
</div>`,
};

// ── Public API ────────────────────────────────────────────────────────────

export type LoyaltyNotificationType = 'points_earned' | 'points_redeemed' | 'tier_upgrade';

const TEMPLATES: Record<LoyaltyNotificationType, NotificationTemplate> = {
  points_earned: POINTS_EARNED,
  points_redeemed: POINTS_REDEEMED,
  tier_upgrade: TIER_UPGRADE,
};

/**
 * Render a loyalty notification template with variable substitution.
 */
export function renderLoyaltyNotification(
  type: LoyaltyNotificationType,
  vars: LoyaltyNotificationVars,
): { sms: string; emailSubject: string; emailBody: string } {
  const template = TEMPLATES[type];
  if (!template) {
    throw new Error(`Unknown loyalty notification type: ${type}`);
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
export function getSupportedTypes(): LoyaltyNotificationType[] {
  return Object.keys(TEMPLATES) as LoyaltyNotificationType[];
}
