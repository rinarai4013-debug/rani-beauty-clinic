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
  subject: 'Welcome to Halo - Your Rani Membership Is Active',
  preheader: 'Your Halo membership benefits are now live. Here is everything included.',
  body: `
    ${heading('Welcome to Halo, {{first_name}}', 1)}
    ${paragraph(`Congratulations on joining the <strong>Halo</strong> membership at ${BRAND.name}. You have taken the first step toward a consistent, elevated self-care routine backed by clinical expertise.`)}

    ${divider('gold')}

    ${heading('Your Halo Benefits', 2)}
    ${bulletList([
      '<strong>Monthly Treatment:</strong> One signature treatment per month included',
      '<strong>Member Pricing:</strong> Exclusive discounts on additional treatments and products',
      '<strong>Priority Booking:</strong> Preferred appointment scheduling',
      '<strong>Loyalty Points:</strong> Earn 1.5x points on every visit',
      '<strong>Birthday Bonus:</strong> Special birthday treatment upgrade',
      '<strong>Complimentary Consultations:</strong> Unlimited provider consultations',
    ])}

    ${calloutBox(`
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding: 16px;">
            <p style="font-family: Georgia, serif; font-size: 14px; color: ${BRAND.gold}; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 12px 0;">Membership Details</p>
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
              <tr><td style="font-family: Georgia, serif; font-size: 14px; color: ${BRAND.navy}; padding: 4px 0;"><strong>Tier:</strong> Halo</td></tr>
              <tr><td style="font-family: Georgia, serif; font-size: 14px; color: ${BRAND.navy}; padding: 4px 0;"><strong>Monthly Rate:</strong> {{monthly_rate}}</td></tr>
              <tr><td style="font-family: Georgia, serif; font-size: 14px; color: ${BRAND.navy}; padding: 4px 0;"><strong>Billing Date:</strong> {{billing_date}} of each month</td></tr>
              <tr><td style="font-family: Georgia, serif; font-size: 14px; color: ${BRAND.navy}; padding: 4px 0;"><strong>Start Date:</strong> {{start_date}}</td></tr>
            </table>
          </td>
        </tr>
      </table>
    `, 'cream')}

    ${button('Book Your First Member Treatment', '{{booking_url}}')}

    ${paragraph(`Have questions about your membership? Reply to this email or call us at <a href="tel:${BRAND.phone}" style="color: ${BRAND.gold};">${BRAND.phone}</a>.`)}

    ${signoff()}
  `,
});

export function welcomeHalo(vars?: TemplateVariables): RenderedEmail {
  return render(template, vars);
}

export default welcomeHalo;
