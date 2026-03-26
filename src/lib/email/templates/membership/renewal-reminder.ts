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
  subject: 'Your {{membership_tier}} Membership Renews Soon',
  preheader: 'A quick heads-up - your Rani membership renewal is coming up.',
  body: `
    ${heading('Membership Renewal Reminder', 1)}
    ${paragraph(`Dear {{first_name}},`)}
    ${paragraph(`This is a friendly reminder that your <strong>{{membership_tier}}</strong> membership will renew on <strong>{{renewal_date}}</strong>. Your membership rate of <strong>{{monthly_rate}}</strong> will be charged to the payment method on file.`)}

    ${divider('gold')}

    ${calloutBox(`
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding: 16px;">
            <p style="font-family: Georgia, serif; font-size: 14px; color: ${BRAND.gold}; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 12px 0;">Renewal Summary</p>
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
              <tr><td style="font-family: Georgia, serif; font-size: 14px; color: ${BRAND.navy}; padding: 4px 0;"><strong>Tier:</strong> {{membership_tier}}</td></tr>
              <tr><td style="font-family: Georgia, serif; font-size: 14px; color: ${BRAND.navy}; padding: 4px 0;"><strong>Rate:</strong> {{monthly_rate}}/month</td></tr>
              <tr><td style="font-family: Georgia, serif; font-size: 14px; color: ${BRAND.navy}; padding: 4px 0;"><strong>Next Billing:</strong> {{renewal_date}}</td></tr>
              <tr><td style="font-family: Georgia, serif; font-size: 14px; color: ${BRAND.navy}; padding: 4px 0;"><strong>Payment:</strong> {{payment_method}}</td></tr>
            </table>
          </td>
        </tr>
      </table>
    `, 'cream')}

    ${paragraph(`No action is required if you would like to continue your membership. It will renew automatically.`)}

    ${paragraph(`If you need to update your payment method, adjust your membership, or have any questions, please reach out before your renewal date.`)}

    ${button('Manage My Membership', '{{account_url}}')}

    ${signoff()}
  `,
});

export function renewalReminder(vars?: TemplateVariables): RenderedEmail {
  return render(template, vars);
}

export default renewalReminder;
