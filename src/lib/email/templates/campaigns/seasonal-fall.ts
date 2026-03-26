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
  subject: 'Fall Restoration - Repair, Renew, and Prepare',
  preheader: 'Fall is the ideal season for corrective treatments. Here is why.',
  body: `
    ${heading('Fall Restoration Season', 1)}
    ${paragraph(`Dear {{first_name}},`)}
    ${paragraph(`As the temperature drops and sun exposure decreases, fall becomes the ideal season for restorative and corrective skin treatments. This is the time to address summer damage and prepare your skin for the months ahead.`)}

    ${divider('gold')}

    ${heading('Fall Treatment Recommendations', 2)}

    ${calloutBox(`
      <strong style="color: ${BRAND.navy};">Chemical Peels</strong><br>
      Fall is prime peel season. With reduced sun exposure, your skin can heal optimally. Address hyperpigmentation, sun spots, and textural irregularities from the summer.
    `, 'cream')}

    ${calloutBox(`
      <strong style="color: ${BRAND.navy};">RF Microneedling</strong><br>
      Stimulate deep collagen production with reduced risk of post-inflammatory hyperpigmentation. Fall provides the ideal conditions for this powerful treatment.
    `, 'cream')}

    ${calloutBox(`
      <strong style="color: ${BRAND.navy};">Laser Facial</strong><br>
      Address sun damage, uneven tone, and fine lines with precision laser technology. The cooler months provide a safer treatment window and easier recovery.
    `, 'cream')}

    ${heading('Why Fall Is Ideal', 3)}
    ${bulletList([
      'Lower UV exposure means safer healing for corrective treatments',
      'Results develop over 3-6 months - start now and glow by the holidays',
      'Cooler weather makes post-treatment care easier',
      'Less time outdoors means fewer disruptions to your recovery',
    ])}

    ${calloutBox(`
      <strong style="color: ${BRAND.gold};">{{fall_offer_title}}</strong><br>
      {{fall_offer_description}}<br><br>
      <em>Valid through {{offer_expiry}}</em>
    `, 'gold')}

    ${button('Book Your Fall Treatment', '{{booking_url}}')}

    ${signoff()}
  `,
});

export function seasonalFall(vars?: TemplateVariables): RenderedEmail {
  return render(template, vars);
}

export default seasonalFall;
