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
  subject: '{{first_name}}, Let Us Restart Your Journey Together',
  preheader: 'It has been three months - we have a special offer to welcome you back.',
  body: `
    ${heading('A Fresh Start Awaits You', 1)}
    ${paragraph(`Dear {{first_name}},`)}
    ${paragraph(`It has been three months since your last visit, and we want you to know - your place in the Rani family is always here for you.`)}

    ${divider('gold')}

    ${paragraph(`We understand that priorities shift. But we also know that when you invest in yourself, everything else falls into place. Whether your goals have changed or you simply need a reset, we are here to meet you where you are.`)}

    ${calloutBox(`
      <strong style="color: ${BRAND.gold};">Your Personal Fresh-Start Offer</strong><br>
      To make it as easy as possible to return, we are offering you <strong>{{reactivation_offer}}</strong>. This is our most generous welcome-back offer, and it is reserved exclusively for you.<br><br>
      <em>Code: <strong>{{offer_code}}</strong></em><br>
      <em>Expires: <strong>{{offer_expiry}}</strong></em>
    `, 'gold')}

    ${paragraph(`We recommend starting with a <strong>complimentary consultation</strong> to reassess your goals and create an updated treatment plan. No obligation, no pressure - just an honest conversation about how we can help.`)}

    ${button('Book Your Consultation', '{{booking_url}}')}
    ${button('Call Us Directly', 'tel:${BRAND.phone}', 'secondary')}

    ${signoff()}
  `,
});

export function reactivation90(vars?: TemplateVariables): RenderedEmail {
  return render(template, vars);
}

export default reactivation90;
