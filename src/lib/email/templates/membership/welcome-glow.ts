import {
  buildTemplate,
  heading,
  paragraph,
  button,
  bulletList,
  calloutBox,
  divider,
  signoff,
  BRAND,
  type TemplateVariables,
  render,
  type RenderedEmail,
} from '../../engine';

const template = buildTemplate({
  subject: 'Welcome to Glow - Your Premium Rani Membership',
  preheader: 'Your Glow membership is active. Discover your elevated benefits inside.',
  body: `
    ${heading('Welcome to Glow, {{first_name}}', 1)}
    ${paragraph(`You have joined the <strong>Glow</strong> tier - our premium membership designed for clients who are serious about their aesthetic journey. Welcome to an elevated standard of care.`)}

    ${divider('gold')}

    ${heading('Your Glow Benefits', 2)}
    ${bulletList([
      '<strong>Monthly Treatments:</strong> Two signature treatments per month included',
      '<strong>Premium Pricing:</strong> Enhanced member discounts on all services and products',
      '<strong>Priority Plus Booking:</strong> First access to appointment slots and new services',
      '<strong>Loyalty Points:</strong> Earn 2x points on every visit',
      '<strong>Birthday Package:</strong> Complimentary birthday treatment of your choice',
      '<strong>Quarterly Skin Analysis:</strong> Complimentary advanced skin assessment',
      '<strong>Guest Pass:</strong> One complimentary guest consultation per quarter',
      '<strong>Product Perks:</strong> Monthly product samples from our curated collection',
    ])}

    ${calloutBox(`
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding: 16px;">
            <p style="font-family: Georgia, serif; font-size: 14px; color: ${BRAND.gold}; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 12px 0;">Membership Details</p>
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
              <tr><td style="font-family: Georgia, serif; font-size: 14px; color: ${BRAND.navy}; padding: 4px 0;"><strong>Tier:</strong> Glow</td></tr>
              <tr><td style="font-family: Georgia, serif; font-size: 14px; color: ${BRAND.navy}; padding: 4px 0;"><strong>Monthly Rate:</strong> {{monthly_rate}}</td></tr>
              <tr><td style="font-family: Georgia, serif; font-size: 14px; color: ${BRAND.navy}; padding: 4px 0;"><strong>Billing Date:</strong> {{billing_date}} of each month</td></tr>
              <tr><td style="font-family: Georgia, serif; font-size: 14px; color: ${BRAND.navy}; padding: 4px 0;"><strong>Start Date:</strong> {{start_date}}</td></tr>
            </table>
          </td>
        </tr>
      </table>
    `, 'cream')}

    ${button('Book Your First Member Treatments', '{{booking_url}}')}

    ${signoff()}
  `,
});

export function welcomeGlow(vars?: TemplateVariables): RenderedEmail {
  return render(template, vars);
}

export default welcomeGlow;
