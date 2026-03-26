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
  subject: '{{first_name}}, Your Results Are Waiting',
  preheader: 'Two months have passed - let us help you get back on track.',
  body: `
    ${heading('Your Aesthetic Goals Are Worth It', 1)}
    ${paragraph(`Dear {{first_name}},`)}
    ${paragraph(`It has been about two months since we last saw you. We know that life can pull us in many directions, but your self-care journey does not have to wait.`)}

    ${divider('gold')}

    ${paragraph(`We have some exciting updates since your last visit that we think you will love.`)}

    ${calloutBox(`
      <strong style="color: ${BRAND.gold};">What Is New at Rani</strong><br>
      We are constantly elevating our offerings. Since your last visit, we have introduced new treatments and protocols designed to deliver even better results. Your provider would love to share what is new.
    `, 'cream')}

    ${calloutBox(`
      <strong style="color: ${BRAND.gold};">Welcome Back Offer</strong><br>
      We would love to make it easy for you to return. Enjoy <strong>{{reactivation_offer}}</strong> on your next visit when you book within the next 14 days.<br><br>
      <em>Code: <strong>{{offer_code}}</strong></em>
    `, 'gold')}

    ${button('Book Your Return Visit', '{{booking_url}}')}

    ${paragraph(`We genuinely miss seeing you. Whatever your reason for stepping away, know that we are here whenever you are ready.`)}

    ${signoff()}
  `,
});

export function reactivation60(vars?: TemplateVariables): RenderedEmail {
  return render(template, vars);
}

export default reactivation60;
