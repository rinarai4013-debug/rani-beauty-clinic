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
  subject: '{{first_name}}, We Would Love to Earn Your Trust Again',
  preheader: 'An exclusive offer and a personal invitation to return to Rani.',
  body: `
    ${heading('We Miss You, {{first_name}}', 1)}
    ${paragraph(`Dear {{first_name}},`)}
    ${paragraph(`It has been a while, and we have been thinking about you. We hope everything is well.`)}
    ${paragraph(`We understand that you may have had reasons for stepping away, and we respect that completely. If there was anything about your experience that did not meet your expectations, we sincerely want to know - and to make it right.`)}

    ${divider('gold')}

    ${calloutBox(`
      <strong style="color: ${BRAND.gold};">A Personal Invitation</strong><br>
      We would love to welcome you back with our most exclusive offer. Enjoy <strong>{{winback_offer}}</strong> on any treatment or service of your choice. This is our way of saying we value you and hope to see you again.<br><br>
      <em>Code: <strong>{{offer_code}}</strong></em><br>
      <em>Valid through: <strong>{{offer_expiry}}</strong></em>
    `, 'gold')}

    ${heading('What Has Changed', 3)}
    ${paragraph(`We are always evolving. Since your last visit, we have enhanced our services, introduced new treatments, and continued investing in the most advanced technology available. We would love to show you.`)}

    ${button('Return to Rani', '{{booking_url}}')}

    ${calloutBox(`
      <strong>Your Feedback Matters</strong><br>
      If there is anything we can improve, we genuinely want to hear from you. Reply to this email directly - it reaches our team, and every message is read personally.
    `, 'cream')}

    ${paragraph(`No matter what you decide, we are grateful for the time you spent with us. You will always be part of the Rani family.`)}

    ${signoff()}
  `,
});

export function winBack(vars?: TemplateVariables): RenderedEmail {
  return render(template, vars);
}

export default winBack;
