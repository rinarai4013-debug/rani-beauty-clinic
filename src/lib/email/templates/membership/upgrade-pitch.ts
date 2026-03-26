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
  subject: '{{first_name}}, Unlock More With a Membership Upgrade',
  preheader: 'You are getting so much from your membership - imagine what the next tier offers.',
  body: `
    ${heading('Ready for More?', 1)}
    ${paragraph(`Dear {{first_name}},`)}
    ${paragraph(`You have been an incredible <strong>{{current_tier}}</strong> member, and we have noticed how much you love your treatments. We think you might be ready to unlock even more.`)}

    ${divider('gold')}

    ${heading('Upgrade to {{upgrade_tier}}', 2)}
    ${paragraph(`The <strong>{{upgrade_tier}}</strong> tier includes everything you already love, plus:`)}

    ${bulletList([
      '{{upgrade_benefit_1}}',
      '{{upgrade_benefit_2}}',
      '{{upgrade_benefit_3}}',
      '{{upgrade_benefit_4}}',
    ])}

    ${calloutBox(`
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td align="center" style="padding: 24px;">
            <p style="font-family: Georgia, serif; font-size: 14px; color: ${BRAND.textMuted}; text-decoration: line-through; margin: 0;">Your current rate: {{current_rate}}/mo</p>
            <p style="font-family: Georgia, serif; font-size: 28px; color: ${BRAND.gold}; font-weight: 700; margin: 8px 0;">{{upgrade_rate}}/mo</p>
            <p style="font-family: Georgia, serif; font-size: 14px; color: ${BRAND.navy}; margin: 0;">for {{upgrade_tier}} membership</p>
          </td>
        </tr>
      </table>
    `, 'cream')}

    ${calloutBox(`
      <strong style="color: ${BRAND.gold};">Limited-Time Upgrade Offer</strong><br>
      Upgrade this month and receive <strong>{{upgrade_incentive}}</strong> as our thank-you for your loyalty.
    `, 'gold')}

    ${button('Upgrade My Membership', '{{upgrade_url}}')}
    ${button('Learn More', '{{membership_url}}', 'secondary')}

    ${signoff()}
  `,
});

export function upgradePitch(vars?: TemplateVariables): RenderedEmail {
  return render(template, vars);
}

export default upgradePitch;
