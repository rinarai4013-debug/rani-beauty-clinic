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
  subject: '{{first_name}}, Your Next Step to Beautiful Results',
  preheader: 'Continue your aesthetic journey - your provider has recommendations for you.',
  body: `
    ${heading('Your Journey Continues', 1)}
    ${paragraph(`Dear {{first_name}},`)}
    ${paragraph(`It has been {{days_since_visit}} days since your first visit with us, and we wanted to check in. The best results in aesthetics come from consistency and a thoughtful treatment plan.`)}

    ${divider('gold')}

    ${paragraph(`During your visit, {{provider_name}} recommended {{recommended_service}} as your next step. This treatment builds upon your initial session and moves you closer to your goals.`)}

    ${calloutBox(`
      <strong style="color: ${BRAND.gold};">Why Now?</strong><br>
      Timing matters in aesthetic treatments. The ideal window for your next session is within <strong>{{ideal_window}}</strong> of your first treatment. This ensures optimal results and allows treatments to build upon each other effectively.
    `, 'cream')}

    ${paragraph(`We have reserved preferred appointment times for you. Availability is limited, so we encourage you to book at your earliest convenience.`)}

    ${button('Book Your Next Session', '{{booking_url}}')}
    ${button('View Available Times', '{{calendar_url}}', 'secondary')}

    ${calloutBox(`
      <strong>Questions?</strong> Reply to this email or call <a href="tel:${BRAND.phone}" style="color: ${BRAND.gold};">${BRAND.phone}</a>. We are always happy to discuss your treatment plan.
    `, 'gold')}

    ${signoff('{{provider_name}}')}
  `,
});

export function secondVisitNudge(vars?: TemplateVariables): RenderedEmail {
  return render(template, vars);
}

export default secondVisitNudge;
