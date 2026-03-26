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
  subject: '{{first_name}}, How Was Your Visit?',
  preheader: 'We would love to hear about your experience at Rani Beauty Clinic.',
  body: `
    ${heading('How Was Your Experience?', 1)}
    ${paragraph(`Dear {{first_name}},`)}
    ${paragraph(`Thank you for your recent visit on <strong>{{visit_date}}</strong> with {{provider_name}}. Your feedback is incredibly valuable to us - it helps us maintain the level of excellence you deserve.`)}

    ${divider('gold')}

    ${paragraph(`Would you take a moment to share your experience? It only takes about 2 minutes.`)}

    ${calloutBox(`
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td align="center" style="padding: 20px;">
            <p style="font-family: Georgia, serif; font-size: 16px; color: ${BRAND.navy}; margin: 0 0 16px 0;">How would you rate your experience?</p>
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
              <tr>
                <td style="padding: 0 6px;"><a href="{{review_url_1}}" style="text-decoration: none; font-size: 32px;">&#9733;</a></td>
                <td style="padding: 0 6px;"><a href="{{review_url_2}}" style="text-decoration: none; font-size: 32px;">&#9733;</a></td>
                <td style="padding: 0 6px;"><a href="{{review_url_3}}" style="text-decoration: none; font-size: 32px;">&#9733;</a></td>
                <td style="padding: 0 6px;"><a href="{{review_url_4}}" style="text-decoration: none; font-size: 32px;">&#9733;</a></td>
                <td style="padding: 0 6px;"><a href="{{review_url_5}}" style="text-decoration: none; font-size: 32px;">&#9733;</a></td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `, 'cream')}

    ${button('Leave a Review', '{{review_url}}')}

    ${calloutBox(`
      <strong style="color: ${BRAND.gold};">Earn Bonus Points</strong><br>
      As a thank-you for your feedback, you will receive <strong>{{review_points}} bonus loyalty points</strong> when you complete your review.
    `, 'gold')}

    ${paragraph(`Your honest feedback - whether praise or constructive suggestions - helps us serve you and all our clients better.`)}

    ${signoff('{{provider_name}}')}
  `,
});

export function request(vars?: TemplateVariables): RenderedEmail {
  return render(template, vars);
}

export default request;
