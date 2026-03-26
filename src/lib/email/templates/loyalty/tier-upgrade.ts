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
  subject: 'Congratulations - You Have Reached {{new_tier}} Status',
  preheader: 'Your loyalty has been rewarded. Welcome to your new tier.',
  body: `
    ${heading('You Have Been Upgraded', 1)}
    ${paragraph(`Dear {{first_name}},`)}
    ${paragraph(`Your dedication to self-care has paid off. We are thrilled to announce that you have been elevated to <strong>{{new_tier}}</strong> status in our loyalty program.`)}

    ${divider('gold')}

    ${calloutBox(`
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td align="center" style="padding: 24px;">
            <p style="font-family: Georgia, serif; font-size: 14px; color: ${BRAND.textMuted}; margin: 0;">Previously: {{previous_tier}}</p>
            <p style="font-family: Georgia, serif; font-size: 14px; color: ${BRAND.gold}; margin: 8px 0;">&#8595;</p>
            <p style="font-family: Georgia, serif; font-size: 32px; color: ${BRAND.gold}; font-weight: 700; margin: 0;">{{new_tier}}</p>
            <p style="font-family: Georgia, serif; font-size: 14px; color: ${BRAND.navy}; margin: 8px 0 0 0;">Effective immediately</p>
          </td>
        </tr>
      </table>
    `, 'cream')}

    ${heading('Your New Benefits', 2)}
    ${bulletList([
      '{{tier_benefit_1}}',
      '{{tier_benefit_2}}',
      '{{tier_benefit_3}}',
      '{{tier_benefit_4}}',
    ])}

    ${button('Explore Your Benefits', '{{rewards_url}}')}

    ${paragraph(`Thank you for choosing ${BRAND.name}. Your loyalty means the world to us.`)}

    ${signoff()}
  `,
});

export function tierUpgrade(vars?: TemplateVariables): RenderedEmail {
  return render(template, vars);
}

export default tierUpgrade;
