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
  subject: '{{expiring_points}} Points Expiring Soon - Use Them Before {{expiry_date}}',
  preheader: 'Your loyalty points are expiring soon. Book a visit to keep or use them.',
  body: `
    ${heading('Your Points Are Expiring', 1)}
    ${paragraph(`Dear {{first_name}},`)}
    ${paragraph(`We wanted to give you a heads-up - <strong>{{expiring_points}} loyalty points</strong> are set to expire on <strong>{{expiry_date}}</strong>. We do not want you to lose what you have earned.`)}

    ${divider('gold')}

    ${calloutBox(`
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td align="center" style="padding: 24px;">
            <p style="font-family: Georgia, serif; font-size: 14px; color: ${BRAND.gold}; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 8px 0;">Expiring Soon</p>
            <p style="font-family: Georgia, serif; font-size: 42px; color: ${BRAND.navy}; font-weight: 700; margin: 0;">{{expiring_points}}</p>
            <p style="font-family: Georgia, serif; font-size: 14px; color: ${BRAND.textMuted}; margin: 8px 0 0 0;">Points expire on {{expiry_date}}</p>
          </td>
        </tr>
      </table>
    `, 'cream')}

    ${heading('How to Keep Your Points', 3)}
    ${paragraph(`Simply book and attend any appointment before <strong>{{expiry_date}}</strong>. Your visit will reset the expiration clock on all your points, plus you will earn even more.`)}

    ${button('Book Now to Save Your Points', '{{booking_url}}')}

    ${paragraph(`Alternatively, you can <a href="{{redeem_url}}" style="color: ${BRAND.gold};">redeem your points</a> for a reward before they expire.`, false)}

    ${signoff()}
  `,
});

export function pointsExpiring(vars?: TemplateVariables): RenderedEmail {
  return render(template, vars);
}

export default pointsExpiring;
