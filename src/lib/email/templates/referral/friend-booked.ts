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
  subject: 'Your Friend Booked - Your Referral Reward Is Coming',
  preheader: 'Great news! Your referral just booked their first appointment.',
  body: `
    ${heading('Your Friend Just Booked', 1)}
    ${paragraph(`Dear {{first_name}},`)}
    ${paragraph(`Wonderful news - <strong>{{friend_name}}</strong> has booked their first appointment at ${BRAND.name}, thanks to your referral.`)}

    ${divider('gold')}

    ${calloutBox(`
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td align="center" style="padding: 24px;">
            <p style="font-family: Georgia, serif; font-size: 14px; color: ${BRAND.gold}; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 8px 0;">Reward Incoming</p>
            <p style="font-family: Georgia, serif; font-size: 32px; color: ${BRAND.navy}; font-weight: 700; margin: 0;">{{referrer_reward}}</p>
            <p style="font-family: Georgia, serif; font-size: 14px; color: ${BRAND.textMuted}; margin: 8px 0 0 0;">Applied after {{friend_name}}'s first visit</p>
          </td>
        </tr>
      </table>
    `, 'cream')}

    ${paragraph(`Your reward will be credited to your account once {{friend_name}} completes their first visit. You will receive a confirmation email at that time.`)}

    ${paragraph(`Want to keep the rewards flowing? Share the Rani experience with more friends and family.`)}

    ${button('Refer More Friends', '{{referral_url}}')}

    ${signoff()}
  `,
});

export function friendBooked(vars?: TemplateVariables): RenderedEmail {
  return render(template, vars);
}

export default friendBooked;
