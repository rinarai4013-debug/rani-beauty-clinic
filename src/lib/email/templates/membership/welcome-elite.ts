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
  subject: 'Welcome to Elite - The Pinnacle of Rani Membership',
  preheader: 'You have unlocked our most exclusive tier. Your Elite benefits await.',
  body: `
    ${heading('Welcome to Elite, {{first_name}}', 1)}
    ${paragraph(`You have achieved the pinnacle of the ${BRAND.name} experience. The <strong>Elite</strong> membership is our most exclusive tier, reserved for clients who demand the very best in luxury aesthetics and wellness.`)}

    ${divider('gold')}

    ${heading('Your Elite Benefits', 2)}
    ${bulletList([
      '<strong>Unlimited Treatments:</strong> Unlimited signature treatments each month',
      '<strong>Elite Pricing:</strong> Our deepest member discounts on all premium services',
      '<strong>Concierge Booking:</strong> Dedicated scheduling coordinator for your appointments',
      '<strong>Loyalty Points:</strong> Earn 3x points on every visit',
      '<strong>Birthday Experience:</strong> Full birthday treatment package (value {{birthday_package_value}})',
      '<strong>Monthly Skin Analysis:</strong> Advanced skin assessments with your provider',
      '<strong>Guest Passes:</strong> Two complimentary guest consultations per month',
      '<strong>Product Collection:</strong> Curated monthly skincare package included',
      '<strong>Early Access:</strong> First access to new treatments, events, and products',
      '<strong>Annual Retreat:</strong> Invitation to our exclusive annual wellness event',
    ])}

    ${calloutBox(`
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding: 16px;">
            <p style="font-family: Georgia, serif; font-size: 14px; color: ${BRAND.gold}; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 12px 0;">Membership Details</p>
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
              <tr><td style="font-family: Georgia, serif; font-size: 14px; color: ${BRAND.navy}; padding: 4px 0;"><strong>Tier:</strong> Elite</td></tr>
              <tr><td style="font-family: Georgia, serif; font-size: 14px; color: ${BRAND.navy}; padding: 4px 0;"><strong>Monthly Rate:</strong> {{monthly_rate}}</td></tr>
              <tr><td style="font-family: Georgia, serif; font-size: 14px; color: ${BRAND.navy}; padding: 4px 0;"><strong>Billing Date:</strong> {{billing_date}} of each month</td></tr>
              <tr><td style="font-family: Georgia, serif; font-size: 14px; color: ${BRAND.navy}; padding: 4px 0;"><strong>Start Date:</strong> {{start_date}}</td></tr>
              <tr><td style="font-family: Georgia, serif; font-size: 14px; color: ${BRAND.navy}; padding: 4px 0;"><strong>Concierge:</strong> {{concierge_name}} - {{concierge_email}}</td></tr>
            </table>
          </td>
        </tr>
      </table>
    `, 'cream')}

    ${paragraph(`Your dedicated concierge, <strong>{{concierge_name}}</strong>, is your single point of contact for scheduling, questions, and anything you need. Reach them directly at <a href="mailto:{{concierge_email}}" style="color: ${BRAND.gold};">{{concierge_email}}</a>.`)}

    ${button('Book With Your Concierge', '{{booking_url}}')}

    ${signoff()}
  `,
});

export function welcomeElite(vars?: TemplateVariables): RenderedEmail {
  return render(template, vars);
}

export default welcomeElite;
