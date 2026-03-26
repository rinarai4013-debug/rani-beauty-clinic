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
  subject: 'Happy Birthday, {{first_name}} - A Gift From Rani',
  preheader: 'Your birthday deserves something beautiful. Open for your special gift.',
  body: `
    ${heading('Happy Birthday, {{first_name}}', 1)}
    ${paragraph(`Today is your day, and we want to make it even more special.`)}
    ${paragraph(`At ${BRAND.name}, we believe birthdays are the perfect time to invest in yourself. To celebrate you, we have prepared an exclusive birthday gift.`)}

    ${divider('gold')}

    ${calloutBox(`
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td align="center" style="padding: 32px;">
            <p style="font-family: Georgia, serif; font-size: 14px; color: ${BRAND.gold}; text-transform: uppercase; letter-spacing: 3px; margin: 0 0 16px 0;">Your Birthday Gift</p>
            <p style="font-family: Georgia, serif; font-size: 36px; color: ${BRAND.navy}; font-weight: 700; margin: 0;">{{birthday_offer}}</p>
            <p style="font-family: Georgia, serif; font-size: 14px; color: ${BRAND.textMuted}; margin: 12px 0 0 0;">Valid through {{offer_expiry}}</p>
            <p style="font-family: Georgia, serif; font-size: 16px; color: ${BRAND.gold}; font-weight: 600; margin: 16px 0 0 0;">Code: {{offer_code}}</p>
          </td>
        </tr>
      </table>
    `, 'cream')}

    ${paragraph(`Use your birthday gift on any treatment or service. Whether it is a rejuvenating facial, a confidence-boosting injectable, or a wellness treatment - the choice is yours.`)}

    ${button('Treat Yourself', '{{booking_url}}')}

    ${paragraph(`Wishing you a day filled with joy, beauty, and everything you deserve.`)}

    ${signoff()}
  `,
});

export function birthday(vars?: TemplateVariables): RenderedEmail {
  return render(template, vars);
}

export default birthday;
