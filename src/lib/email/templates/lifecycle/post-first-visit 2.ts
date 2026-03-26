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
  subject: 'Thank You for Visiting - Your Rani Journey Has Begun',
  preheader: 'It was a pleasure meeting you. Here is what comes next.',
  body: `
    ${heading('Thank You, {{first_name}}', 1)}
    ${paragraph(`It was an absolute pleasure welcoming you to ${BRAND.name} for the first time. We hope the experience exceeded your expectations.`)}

    ${divider('gold')}

    ${heading('Your Visit Summary', 2)}
    ${paragraph(`You met with <strong>{{provider_name}}</strong> for your {{service_name}} consultation. Your provider has crafted initial recommendations based on your goals and unique needs.`)}

    {{#if has_treatment_plan}}
    ${calloutBox(`
      <strong style="color: ${BRAND.gold};">Your Recommended Treatment Plan</strong><br>
      {{treatment_plan_summary}}<br><br>
      Your personalized plan is designed to achieve your aesthetic goals through a thoughtful, phased approach.
    `, 'cream')}
    ${button('View Your Treatment Plan', '{{treatment_plan_url}}')}
    {{/if has_treatment_plan}}

    ${heading('What Comes Next', 3)}
    ${bulletList([
      'Follow any <strong>aftercare instructions</strong> provided during your visit',
      'Schedule your <strong>next appointment</strong> to maintain momentum',
      'Join our <strong>loyalty program</strong> to earn points on every visit',
      'Follow us on <a href="${BRAND.socialInstagram}" style="color: ${BRAND.gold};">Instagram</a> for tips and inspiration',
    ])}

    ${button('Book Your Next Visit', '{{booking_url}}')}

    ${calloutBox(`
      <strong>We Value Your Feedback</strong><br>
      Your experience matters deeply to us. If there is anything we can do to make your next visit even better, please do not hesitate to reach out.
    `, 'gold')}

    ${signoff('{{provider_name}}')}
  `,
});

export function postFirstVisit(vars?: TemplateVariables): RenderedEmail {
  return render(template, vars);
}

export default postFirstVisit;
