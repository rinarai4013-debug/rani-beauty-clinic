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
  subject: 'Welcome to Rani Beauty Clinic - Your Journey Begins',
  preheader: 'We are honored to welcome you to the Rani family.',
  body: `
    ${heading('Welcome, {{first_name}}', 1)}
    ${paragraph(`We are truly delighted to welcome you to ${BRAND.name}. From the moment you walk through our doors, you will experience the intersection of luxury aesthetics and clinical precision.`)}

    <hr style="border: none; border-top: 2px solid ${BRAND.gold}; margin: 32px auto; width: 60px;">

    ${heading('What Sets Us Apart', 2)}
    ${paragraph(`At Rani, every treatment is a bespoke experience. Our providers combine advanced medical training with an artist's eye for beauty. We do not believe in cookie-cutter approaches - your treatment plan is uniquely yours.`)}

    ${heading('Your First Step', 3)}
    ${bulletList([
      '<strong>Personalized Consultation:</strong> Every journey starts with understanding your goals',
      '<strong>Customized Treatment Plan:</strong> Tailored recommendations based on your unique needs',
      '<strong>Ongoing Support:</strong> We are here for you before, during, and after every treatment',
    ])}

    ${calloutBox(`
      <strong style="color: ${BRAND.gold};">New Client Benefit</strong><br>
      As a new member of the Rani family, your first consultation is complimentary. This is our opportunity to learn about your goals and craft your personalized aesthetic roadmap.
    `, 'gold')}

    ${button('Book Your Consultation', '{{booking_url}}')}

    ${heading('Explore Our Services', 3)}
    ${bulletList([
      '<strong>Injectables:</strong> Botox, dermal fillers, and precision contouring',
      '<strong>Skin Rejuvenation:</strong> HydraFacials, chemical peels, laser facials',
      '<strong>Body Contouring:</strong> Sofwave skin tightening, RF microneedling',
      '<strong>Wellness:</strong> Vitamin injections, peptide therapy, NAD+, HRT',
    ])}

    ${button('View All Services', '{{services_url}}', 'secondary')}

    ${signoff()}
  `,
});

export function welcome(vars?: TemplateVariables): RenderedEmail {
  return render(template, vars);
}

export default welcome;
