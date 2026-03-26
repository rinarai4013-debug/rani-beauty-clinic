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
  subject: 'Celebrating 5 Visits - Thank You, {{first_name}}',
  preheader: 'Five visits in and your results are speaking for themselves.',
  body: `
    ${heading('Five Visits. One Beautiful Journey.', 1)}
    ${paragraph(`Dear {{first_name}},`)}
    ${paragraph(`We just noticed something worth celebrating - you have completed <strong>5 visits</strong> with us at ${BRAND.name}. That is not just a number; it is a commitment to yourself, and we are honored to be part of it.`)}

    ${divider('gold')}

    ${calloutBox(`
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td align="center" style="padding: 20px;">
            <p style="font-family: Georgia, serif; font-size: 48px; color: ${BRAND.gold}; font-weight: 700; margin: 0;">5</p>
            <p style="font-family: Georgia, serif; font-size: 14px; color: ${BRAND.navy}; text-transform: uppercase; letter-spacing: 2px; margin: 8px 0 0 0;">Visits Completed</p>
          </td>
        </tr>
      </table>
    `, 'cream')}

    ${paragraph(`To celebrate this milestone, we would love to offer you something special.`)}

    ${calloutBox(`
      <strong style="color: ${BRAND.gold};">Your Milestone Gift</strong><br>
      Enjoy a <strong>complimentary upgrade</strong> on your next treatment. Ask your provider about add-on enhancements available with your next booking.
    `, 'gold')}

    ${button('Book Your Next Visit', '{{booking_url}}')}

    ${paragraph(`Thank you for trusting us with your care. We are excited to see where your journey takes you next.`, false)}

    ${signoff()}
  `,
});

export function milestone5th(vars?: TemplateVariables): RenderedEmail {
  return render(template, vars);
}

export default milestone5th;
