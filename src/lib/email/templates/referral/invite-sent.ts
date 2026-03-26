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
  subject: 'Your Referral Has Been Sent - Here Is What Happens Next',
  preheader: 'Thank you for sharing Rani with someone you care about.',
  body: `
    ${heading('Referral Sent Successfully', 1)}
    ${paragraph(`Dear {{first_name}},`)}
    ${paragraph(`Thank you for sharing ${BRAND.name} with <strong>{{friend_name}}</strong>. Your personal referral invitation has been sent.`)}

    ${divider('gold')}

    ${calloutBox(`
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding: 16px;">
            <p style="font-family: Georgia, serif; font-size: 14px; color: ${BRAND.gold}; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 12px 0;">Referral Details</p>
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
              <tr><td style="font-family: Georgia, serif; font-size: 14px; color: ${BRAND.navy}; padding: 4px 0;"><strong>Friend:</strong> {{friend_name}}</td></tr>
              <tr><td style="font-family: Georgia, serif; font-size: 14px; color: ${BRAND.navy}; padding: 4px 0;"><strong>Your Referral Code:</strong> {{referral_code}}</td></tr>
              <tr><td style="font-family: Georgia, serif; font-size: 14px; color: ${BRAND.navy}; padding: 4px 0;"><strong>Their Offer:</strong> {{friend_offer}}</td></tr>
              <tr><td style="font-family: Georgia, serif; font-size: 14px; color: ${BRAND.navy}; padding: 4px 0;"><strong>Your Reward:</strong> {{referrer_reward}} (when they book)</td></tr>
            </table>
          </td>
        </tr>
      </table>
    `, 'cream')}

    ${heading('What Happens Next', 3)}
    ${paragraph(`When {{friend_name}} books and attends their first appointment using your referral, you will automatically receive <strong>{{referrer_reward}}</strong>. We will notify you as soon as it happens.`)}

    ${button('Refer Another Friend', '{{referral_url}}')}

    ${signoff()}
  `,
});

export function inviteSent(vars?: TemplateVariables): RenderedEmail {
  return render(template, vars);
}

export default inviteSent;
