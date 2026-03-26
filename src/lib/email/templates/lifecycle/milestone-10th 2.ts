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
  subject: '10 Visits - You Are Officially a Rani VIP, {{first_name}}',
  preheader: 'A decade of visits deserves a very special thank you.',
  body: `
    ${heading('A Milestone Worth Celebrating', 1)}
    ${paragraph(`Dear {{first_name}},`)}
    ${paragraph(`Ten visits. Ten moments of intentional self-care. Ten sessions of investing in the most beautiful version of yourself. We are deeply honored by your loyalty to ${BRAND.name}.`)}

    ${divider('gold')}

    ${calloutBox(`
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td align="center" style="padding: 20px;">
            <p style="font-family: Georgia, serif; font-size: 48px; color: ${BRAND.gold}; font-weight: 700; margin: 0;">10</p>
            <p style="font-family: Georgia, serif; font-size: 14px; color: ${BRAND.navy}; text-transform: uppercase; letter-spacing: 2px; margin: 8px 0 0 0;">Visits Completed</p>
          </td>
        </tr>
      </table>
    `, 'cream')}

    ${paragraph(`Your dedication to your aesthetic goals inspires us. To mark this special milestone, we have prepared an exclusive reward.`)}

    ${calloutBox(`
      <strong style="color: ${BRAND.gold};">Your VIP Milestone Reward</strong><br>
      Enjoy <strong>{{reward_value}}</strong> toward any treatment or service of your choice. This is our way of saying thank you for being an extraordinary part of the Rani family.<br><br>
      <em>Use code: <strong>{{reward_code}}</strong></em>
    `, 'gold')}

    ${paragraph(`Additionally, you now have access to <strong>VIP priority booking</strong> and exclusive early access to new treatments and events.`)}

    ${button('Redeem Your Reward', '{{booking_url}}')}

    ${signoff()}
  `,
});

export function milestone10th(vars?: TemplateVariables): RenderedEmail {
  return render(template, vars);
}

export default milestone10th;
