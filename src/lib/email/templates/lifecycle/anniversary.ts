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
  subject: 'Happy Anniversary, {{first_name}} - One Year With Rani',
  preheader: 'Celebrating one year of your aesthetic journey with us.',
  body: `
    ${heading('Happy Anniversary, {{first_name}}', 1)}
    ${paragraph(`One year ago, you walked through our doors for the first time. Today, we celebrate the beautiful journey we have shared together.`)}

    ${divider('gold')}

    ${calloutBox(`
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td align="center" style="padding: 24px;">
            <p style="font-family: Georgia, serif; font-size: 14px; color: ${BRAND.gold}; text-transform: uppercase; letter-spacing: 3px; margin: 0 0 8px 0;">Your Year in Review</p>
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
              <tr>
                <td align="center" style="padding: 12px 24px;">
                  <p style="font-family: Georgia, serif; font-size: 32px; color: ${BRAND.navy}; font-weight: 700; margin: 0;">{{total_visits}}</p>
                  <p style="font-family: Georgia, serif; font-size: 12px; color: ${BRAND.textMuted}; margin: 4px 0 0 0;">Visits</p>
                </td>
                <td align="center" style="padding: 12px 24px;">
                  <p style="font-family: Georgia, serif; font-size: 32px; color: ${BRAND.navy}; font-weight: 700; margin: 0;">{{total_treatments}}</p>
                  <p style="font-family: Georgia, serif; font-size: 12px; color: ${BRAND.textMuted}; margin: 4px 0 0 0;">Treatments</p>
                </td>
                <td align="center" style="padding: 12px 24px;">
                  <p style="font-family: Georgia, serif; font-size: 32px; color: ${BRAND.navy}; font-weight: 700; margin: 0;">{{loyalty_points}}</p>
                  <p style="font-family: Georgia, serif; font-size: 12px; color: ${BRAND.textMuted}; margin: 4px 0 0 0;">Points Earned</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `, 'cream')}

    ${paragraph(`To celebrate this milestone, we have a special anniversary gift for you.`)}

    ${calloutBox(`
      <strong style="color: ${BRAND.gold};">Anniversary Exclusive</strong><br>
      Enjoy <strong>{{anniversary_offer}}</strong> on your next visit. This offer is exclusively for you and valid for the next 30 days.<br><br>
      <em>Use code: <strong>{{offer_code}}</strong></em>
    `, 'gold')}

    ${button('Celebrate With a Booking', '{{booking_url}}')}

    ${paragraph(`Here is to another year of confidence, beauty, and self-care. We cannot wait to continue this journey with you.`)}

    ${signoff()}
  `,
});

export function anniversary(vars?: TemplateVariables): RenderedEmail {
  return render(template, vars);
}

export default anniversary;
