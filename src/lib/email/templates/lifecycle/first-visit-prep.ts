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
  subject: 'Your First Visit Is Coming - Here\'s What to Expect',
  preheader: 'Everything you need to know before your first visit to Rani Beauty Clinic.',
  body: `
    ${heading('Your First Visit Awaits', 1)}
    ${paragraph(`Dear {{first_name}},`)}
    ${paragraph(`We are looking forward to welcoming you on <strong>{{appointment_date}}</strong> at <strong>{{appointment_time}}</strong>. Here is everything you need to know to make your first visit smooth and enjoyable.`)}

    ${divider('gold')}

    ${heading('Before You Arrive', 2)}
    ${bulletList([
      'Complete your <strong>intake forms</strong> online - check your email for the link',
      'Bring a <strong>valid photo ID</strong>',
      'Arrive <strong>15 minutes early</strong> to settle in comfortably',
      'Prepare a list of any <strong>medications, allergies, or health conditions</strong>',
      'Have <strong>photos of your goals</strong> ready if applicable (inspiration images welcome)',
    ])}

    ${heading('What to Expect', 2)}
    ${paragraph(`Your first visit begins with a comprehensive consultation. Your provider will take the time to understand your goals, assess your unique features, and recommend a personalized treatment plan. There is never any pressure - this is about you.`)}

    ${calloutBox(`
      <strong style="color: ${BRAND.gold};">The Rani Experience</strong><br>
      From our serene reception area to our private treatment suites, every detail is designed for your comfort. Complimentary refreshments await you. We want this to feel like your sanctuary.
    `, 'cream')}

    ${heading('Parking & Arrival', 3)}
    ${paragraph(`Free parking is available in our building lot. Enter through the main lobby and take the elevator to Suite 200. Our reception team will greet you.`)}

    ${button('Get Directions', '{{directions_url}}')}

    ${calloutBox(`
      <strong>Questions?</strong> Reply to this email or call us at <a href="tel:${BRAND.phone}" style="color: ${BRAND.gold};">${BRAND.phone}</a>. We are here to help.
    `, 'gold')}

    ${signoff()}
  `,
});

export function firstVisitPrep(vars?: TemplateVariables): RenderedEmail {
  return render(template, vars);
}

export default firstVisitPrep;
