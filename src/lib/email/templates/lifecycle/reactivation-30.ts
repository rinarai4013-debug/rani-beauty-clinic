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
  subject: '{{first_name}}, We Miss You at Rani',
  preheader: 'It has been a little while - we would love to see you again.',
  body: `
    ${heading('We Have Been Thinking of You', 1)}
    ${paragraph(`Dear {{first_name}},`)}
    ${paragraph(`It has been about a month since your last visit, and we wanted to check in. Life gets busy, and sometimes self-care moves to the back of the list. We understand - but we also know how much better you feel when you prioritize yourself.`)}

    ${divider('gold')}

    ${paragraph(`Your last visit was on <strong>{{last_visit_date}}</strong> for <strong>{{last_service}}</strong>. Based on your treatment plan, now is the ideal time to continue your progress.`)}

    ${calloutBox(`
      <strong style="color: ${BRAND.gold};">Why Timing Matters</strong><br>
      Consistent treatments build upon each other for compounding results. Waiting too long can mean starting over rather than building forward. Your skin and body respond best to a well-timed schedule.
    `, 'cream')}

    ${button('Book Your Next Visit', '{{booking_url}}')}

    ${paragraph(`If your schedule has changed or you would like to explore different treatment options, we are happy to adjust your plan. Simply reply to this email or give us a call.`, false)}

    ${signoff()}
  `,
});

export function reactivation30(vars?: TemplateVariables): RenderedEmail {
  return render(template, vars);
}

export default reactivation30;
