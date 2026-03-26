import {
  buildTemplate,
  heading,
  paragraph,
  button,
  calloutBox,
  divider,
  signoff,
  BRAND,
  type TemplateVariables,
  render,
  type RenderedEmail,
} from '../../engine';

const template = buildTemplate({
  subject: 'You Earned {{points_earned}} Points - Your Balance Is Growing',
  preheader: 'Your loyalty points just got a boost. See your updated balance.',
  body: `
    ${heading('Points Earned', 1)}
    ${paragraph(`Dear {{first_name}},`)}
    ${paragraph(`Great news - you have just earned <strong>{{points_earned}} loyalty points</strong> from your recent visit.`)}

    ${divider('gold')}

    ${calloutBox(`
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td align="center" style="padding: 24px;">
            <p style="font-family: Georgia, serif; font-size: 14px; color: ${BRAND.gold}; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 8px 0;">Points Summary</p>
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
              <tr>
                <td align="center" style="padding: 8px 32px; border-right: 1px solid ${BRAND.borderLight};">
                  <p style="font-family: Georgia, serif; font-size: 36px; color: ${BRAND.gold}; font-weight: 700; margin: 0;">+{{points_earned}}</p>
                  <p style="font-family: Georgia, serif; font-size: 12px; color: ${BRAND.textMuted}; margin: 4px 0 0 0;">Earned Today</p>
                </td>
                <td align="center" style="padding: 8px 32px;">
                  <p style="font-family: Georgia, serif; font-size: 36px; color: ${BRAND.navy}; font-weight: 700; margin: 0;">{{total_points}}</p>
                  <p style="font-family: Georgia, serif; font-size: 12px; color: ${BRAND.textMuted}; margin: 4px 0 0 0;">Total Balance</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `, 'cream')}

    ${paragraph(`You are <strong>{{points_to_next_reward}} points</strong> away from your next reward. Keep it up - every visit brings you closer.`)}

    ${button('View My Rewards', '{{rewards_url}}')}
    ${button('Book Next Visit', '{{booking_url}}', 'secondary')}

    ${signoff()}
  `,
});

export function pointsEarned(vars?: TemplateVariables): RenderedEmail {
  return render(template, vars);
}

export default pointsEarned;
