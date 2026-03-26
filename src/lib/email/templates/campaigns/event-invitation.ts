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
  subject: 'You Are Invited - {{event_name}} at Rani',
  preheader: 'An exclusive event experience awaits you. RSVP to secure your spot.',
  body: `
    ${heading('You Are Invited', 1)}
    ${paragraph(`Dear {{first_name}},`)}
    ${paragraph(`We would be honored by your presence at an exclusive event at ${BRAND.name}.`)}

    ${divider('gold')}

    ${calloutBox(`
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td align="center" style="padding: 24px;">
            <p style="font-family: Georgia, serif; font-size: 14px; color: ${BRAND.gold}; text-transform: uppercase; letter-spacing: 3px; margin: 0 0 16px 0;">Exclusive Event</p>
            <p style="font-family: Georgia, serif; font-size: 28px; color: ${BRAND.navy}; font-weight: 700; margin: 0;">{{event_name}}</p>
            <hr style="border: none; border-top: 2px solid ${BRAND.gold}; margin: 20px auto; width: 40px;">
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
              <tr><td style="font-family: Georgia, serif; font-size: 15px; color: ${BRAND.navy}; padding: 6px 0;">{{event_date}}</td></tr>
              <tr><td style="font-family: Georgia, serif; font-size: 15px; color: ${BRAND.navy}; padding: 6px 0;">{{event_time}}</td></tr>
              <tr><td style="font-family: Georgia, serif; font-size: 15px; color: ${BRAND.navy}; padding: 6px 0;">{{event_location}}</td></tr>
            </table>
          </td>
        </tr>
      </table>
    `, 'cream')}

    ${heading('What to Expect', 2)}
    ${paragraph(`{{event_description}}`)}

    ${heading('The Evening Includes', 3)}
    ${bulletList([
      '{{event_highlight_1}}',
      '{{event_highlight_2}}',
      '{{event_highlight_3}}',
      '{{event_highlight_4}}',
    ])}

    {{#if has_event_offer}}
    ${calloutBox(`
      <strong style="color: ${BRAND.gold};">Event-Exclusive Offer</strong><br>
      Attendees will receive <strong>{{event_offer}}</strong>. This exclusive offer is available only to those who attend.
    `, 'gold')}
    {{/if has_event_offer}}

    ${paragraph(`Space is limited to {{max_guests}} guests to ensure an intimate experience. We encourage you to RSVP at your earliest convenience.`)}

    ${button('RSVP Now', '{{rsvp_url}}')}

    ${paragraph(`Bring a guest? You are welcome to bring one guest. Simply note their name when you RSVP.`, false)}

    ${signoff()}
  `,
});

export function eventInvitation(vars?: TemplateVariables): RenderedEmail {
  return render(template, vars);
}

export default eventInvitation;
