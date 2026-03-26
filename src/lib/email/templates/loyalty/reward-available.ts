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
  subject: 'You Have a Reward Waiting, {{first_name}}',
  preheader: 'You have earned enough points to claim a reward. See your options.',
  body: `
    ${heading('Your Reward Is Ready', 1)}
    ${paragraph(`Dear {{first_name}},`)}
    ${paragraph(`Your loyalty points have added up to something wonderful. You now have enough points to redeem a reward.`)}

    ${divider('gold')}

    ${calloutBox(`
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td align="center" style="padding: 24px;">
            <p style="font-family: Georgia, serif; font-size: 14px; color: ${BRAND.gold}; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 8px 0;">Available Reward</p>
            <p style="font-family: Georgia, serif; font-size: 28px; color: ${BRAND.navy}; font-weight: 700; margin: 0;">{{reward_name}}</p>
            <p style="font-family: Georgia, serif; font-size: 16px; color: ${BRAND.textMuted}; margin: 8px 0 0 0;">{{reward_points}} points</p>
          </td>
        </tr>
      </table>
    `, 'cream')}

    ${paragraph(`Your current balance is <strong>{{total_points}} points</strong>. Redeem your reward on your next visit, or save your points for an even bigger treat.`)}

    ${button('Redeem My Reward', '{{redeem_url}}')}
    ${button('View All Rewards', '{{rewards_url}}', 'secondary')}

    ${calloutBox(`
      <strong style="color: ${BRAND.gold};">How to Redeem</strong><br>
      Simply mention your reward when booking or checking in for your next appointment. Your points will be applied automatically.
    `, 'gold')}

    ${signoff()}
  `,
});

export function rewardAvailable(vars?: TemplateVariables): RenderedEmail {
  return render(template, vars);
}

export default rewardAvailable;
