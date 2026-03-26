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
  subject: 'Thank You for Your Review, {{first_name}}',
  preheader: 'Your feedback means the world to us. Plus, your bonus points are here.',
  body: `
    ${heading('Thank You for Your Feedback', 1)}
    ${paragraph(`Dear {{first_name}},`)}
    ${paragraph(`We genuinely appreciate you taking the time to share your experience. Your feedback helps us continue delivering the exceptional care you deserve.`)}

    ${divider('gold')}

    ${calloutBox(`
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td align="center" style="padding: 20px;">
            <p style="font-family: Georgia, serif; font-size: 14px; color: ${BRAND.gold}; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 8px 0;">Bonus Points Credited</p>
            <p style="font-family: Georgia, serif; font-size: 36px; color: ${BRAND.navy}; font-weight: 700; margin: 0;">+{{review_points}}</p>
            <p style="font-family: Georgia, serif; font-size: 14px; color: ${BRAND.textMuted}; margin: 8px 0 0 0;">New Balance: {{total_points}} points</p>
          </td>
        </tr>
      </table>
    `, 'cream')}

    ${paragraph(`Every piece of feedback - whether a glowing review or a constructive suggestion - is read by our team. It drives our commitment to continuous improvement.`)}

    {{#if is_positive}}
    ${paragraph(`We are thrilled that you had such a wonderful experience. If you would like to share your review publicly, it helps other clients discover what makes Rani special.`)}
    ${button('Share on Google', '{{google_review_url}}')}
    {{/if is_positive}}

    ${button('Book Your Next Visit', '{{booking_url}}', 'secondary')}

    ${signoff()}
  `,
});

export function thankYou(vars?: TemplateVariables): RenderedEmail {
  return render(template, vars);
}

export default thankYou;
