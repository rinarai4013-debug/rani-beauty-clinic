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
  subject: 'Introducing {{service_name}} - Now Available at Rani',
  preheader: 'Be among the first to experience our newest treatment offering.',
  body: `
    ${heading('Something New Has Arrived', 1)}
    ${paragraph(`Dear {{first_name}},`)}
    ${paragraph(`We are excited to announce the addition of <strong>{{service_name}}</strong> to our treatment menu. This is something we have been preparing for, and we cannot wait for you to experience it.`)}

    ${divider('gold')}

    ${heading('About {{service_name}}', 2)}
    ${paragraph(`{{service_description}}`)}

    ${heading('Key Benefits', 3)}
    ${bulletList([
      '{{benefit_1}}',
      '{{benefit_2}}',
      '{{benefit_3}}',
      '{{benefit_4}}',
    ])}

    ${calloutBox(`
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding: 16px;">
            <p style="font-family: Georgia, serif; font-size: 14px; color: ${BRAND.gold}; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 12px 0;">Treatment Details</p>
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
              <tr><td style="font-family: Georgia, serif; font-size: 14px; color: ${BRAND.navy}; padding: 4px 0;"><strong>Duration:</strong> {{treatment_duration}}</td></tr>
              <tr><td style="font-family: Georgia, serif; font-size: 14px; color: ${BRAND.navy}; padding: 4px 0;"><strong>Downtime:</strong> {{treatment_downtime}}</td></tr>
              <tr><td style="font-family: Georgia, serif; font-size: 14px; color: ${BRAND.navy}; padding: 4px 0;"><strong>Ideal For:</strong> {{ideal_candidate}}</td></tr>
              <tr><td style="font-family: Georgia, serif; font-size: 14px; color: ${BRAND.navy}; padding: 4px 0;"><strong>Starting At:</strong> {{starting_price}}</td></tr>
            </table>
          </td>
        </tr>
      </table>
    `, 'cream')}

    ${calloutBox(`
      <strong style="color: ${BRAND.gold};">Introductory Offer</strong><br>
      Be among the first to try {{service_name}} and enjoy <strong>{{intro_offer}}</strong> on your first session. Limited availability - book early to secure your spot.<br><br>
      <em>Code: <strong>{{offer_code}}</strong></em>
    `, 'gold')}

    ${button('Book {{service_name}}', '{{booking_url}}')}
    ${button('Learn More', '{{service_page_url}}', 'secondary')}

    ${signoff()}
  `,
});

export function newService(vars?: TemplateVariables): RenderedEmail {
  return render(template, vars);
}

export default newService;
