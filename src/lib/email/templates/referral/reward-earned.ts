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
  subject: 'Your Referral Reward Has Been Credited - {{referrer_reward}}',
  preheader: 'Your friend visited and your reward is now in your account.',
  body: `
    ${heading('Reward Earned', 1)}
    ${paragraph(`Dear {{first_name}},`)}
    ${paragraph(`Congratulations - <strong>{{friend_name}}</strong> has completed their first visit, and your referral reward has been credited to your account.`)}

    ${divider('gold')}

    ${calloutBox(`
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td align="center" style="padding: 24px;">
            <p style="font-family: Georgia, serif; font-size: 14px; color: ${BRAND.gold}; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 8px 0;">Your Reward</p>
            <p style="font-family: Georgia, serif; font-size: 36px; color: ${BRAND.navy}; font-weight: 700; margin: 0;">{{referrer_reward}}</p>
            <p style="font-family: Georgia, serif; font-size: 14px; color: ${BRAND.textMuted}; margin: 8px 0 0 0;">Now available in your account</p>
          </td>
        </tr>
      </table>
    `, 'cream')}

    ${calloutBox(`
      <strong style="color: ${BRAND.gold};">Your Referral Stats</strong><br>
      Total Referrals: <strong>{{total_referrals}}</strong><br>
      Total Rewards Earned: <strong>{{total_rewards_earned}}</strong>
    `, 'gold')}

    ${paragraph(`Use your reward on your next visit. It can be applied to any treatment or service.`)}

    ${button('Book and Use My Reward', '{{booking_url}}')}
    ${button('Refer Another Friend', '{{referral_url}}', 'secondary')}

    ${signoff()}
  `,
});

export function rewardEarned(vars?: TemplateVariables): RenderedEmail {
  return render(template, vars);
}

export default rewardEarned;
