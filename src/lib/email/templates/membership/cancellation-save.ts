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
  subject: '{{first_name}}, Before You Go - Can We Talk?',
  preheader: 'We noticed your cancellation request and want to make sure we have done everything we can.',
  body: `
    ${heading('We Do Not Want to Lose You', 1)}
    ${paragraph(`Dear {{first_name}},`)}
    ${paragraph(`We received your request to cancel your <strong>{{membership_tier}}</strong> membership, and honestly - we are disappointed. Not because of the business, but because we genuinely value having you as part of the Rani family.`)}

    ${divider('gold')}

    ${paragraph(`Before your cancellation is finalized, we wanted to share a few options that might change your mind.`)}

    ${heading('Options to Consider', 2)}
    ${bulletList([
      '<strong>Pause Your Membership:</strong> Take a break for up to 3 months without losing your benefits or rate',
      '<strong>Adjust Your Tier:</strong> Move to a different tier that better fits your current needs and budget',
      '<strong>Stay and Save:</strong> We can offer <strong>{{save_offer}}</strong> for the next {{save_duration}} months',
    ])}

    ${calloutBox(`
      <strong style="color: ${BRAND.gold};">What You Will Lose</strong><br>
      By canceling, you would lose access to:<br><br>
      &bull; Member pricing (savings of {{annual_savings}} per year)<br>
      &bull; {{loyalty_multiplier}}x loyalty point earning rate<br>
      &bull; Priority booking access<br>
      &bull; Your locked-in monthly rate of {{monthly_rate}}
    `, 'cream')}

    ${paragraph(`If you do decide to leave, your membership remains active through <strong>{{end_date}}</strong>. We encourage you to use any remaining benefits before then.`)}

    ${button('Keep My Membership', '{{save_url}}')}
    ${button('Pause Instead', '{{pause_url}}', 'secondary')}

    ${calloutBox(`
      <strong>Talk to Us</strong><br>
      If there is anything specific that is not working for you, we truly want to hear it. Reply to this email or call <a href="tel:${BRAND.phone}" style="color: ${BRAND.gold};">${BRAND.phone}</a>. Sometimes a small change makes all the difference.
    `, 'gold')}

    ${signoff()}
  `,
});

export function cancellationSave(vars?: TemplateVariables): RenderedEmail {
  return render(template, vars);
}

export default cancellationSave;
