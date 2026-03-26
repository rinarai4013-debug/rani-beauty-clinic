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
  type ServiceEmailSet,
  type TemplateVariables,
  render,
} from '../../engine';

const pretreatmentTemplate = buildTemplate({
  subject: 'Your GLP-1 Therapy Appointment - Preparation Guide',
  preheader: 'Important information to prepare for your GLP-1 weight management session.',
  body: `
    ${heading('Preparing for GLP-1 Therapy', 1)}
    ${paragraph(`Dear {{first_name}},`)}
    ${paragraph(`Your GLP-1 Therapy appointment is scheduled for <strong>{{appointment_date}}</strong> at <strong>{{appointment_time}}</strong> with {{provider_name}}. This medically supervised program uses GLP-1 receptor agonists to support sustainable weight management.`)}

    ${heading('Pre-Appointment Guidelines', 2)}
    ${bulletList([
      'Complete and return any intake forms or questionnaires we have sent',
      'Bring a list of all <strong>current medications and supplements</strong>',
      'Have recent <strong>lab work</strong> available (or we can order it during your visit)',
      'Prepare a brief history of previous weight management approaches',
      'Eat normally the day of - no fasting required',
      'Wear comfortable clothing with easy access for injection',
    ])}

    ${calloutBox(`
      <strong style="color: ${BRAND.gold};">What to Expect at Your First Visit</strong><br>
      Your initial appointment takes approximately 45-60 minutes. Your provider will review your health history, discuss goals, explain the medication protocol, and administer your first injection if appropriate. This is a comprehensive consultation.
    `, 'cream')}

    ${calloutBox(`
      <strong>Bring Your Questions</strong><br>
      This is a collaborative process. We encourage you to bring any questions about the medication, expected timeline, dietary guidance, or anything else on your mind.
    `, 'gold')}

    ${button('Confirm Your Appointment', '{{confirmation_url}}')}
    ${signoff('{{provider_name}}')}
  `,
});

const dayOfTemplate = buildTemplate({
  subject: 'Your GLP-1 Therapy Appointment Is Today',
  preheader: 'Your wellness journey continues today at Rani Beauty Clinic.',
  body: `
    ${heading('Your Appointment Is Today', 1)}
    ${paragraph(`Good morning, {{first_name}}.`)}
    ${paragraph(`Your GLP-1 Therapy session is today at <strong>{{appointment_time}}</strong> with {{provider_name}}.`)}

    ${calloutBox(`
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr><td style="font-family: Georgia, serif; color: ${BRAND.navy}; font-size: 14px; padding: 4px 0;"><strong>Time:</strong> {{appointment_time}}</td></tr>
        <tr><td style="font-family: Georgia, serif; color: ${BRAND.navy}; font-size: 14px; padding: 4px 0;"><strong>Provider:</strong> {{provider_name}}</td></tr>
        <tr><td style="font-family: Georgia, serif; color: ${BRAND.navy}; font-size: 14px; padding: 4px 0;"><strong>Visit Type:</strong> {{visit_type}}</td></tr>
        <tr><td style="font-family: Georgia, serif; color: ${BRAND.navy}; font-size: 14px; padding: 4px 0;"><strong>Location:</strong> ${BRAND.address}</td></tr>
      </table>
    `, 'cream')}

    ${heading('Reminders', 3)}
    ${bulletList([
      'Bring your medication list and any recent lab results',
      'Comfortable clothing with easy injection access',
      'Questions or concerns to discuss with your provider',
    ])}

    ${button('Get Directions', '{{directions_url}}', 'secondary')}
    ${signoff()}
  `,
});

const aftercareTemplate = buildTemplate({
  subject: 'GLP-1 Therapy - Your Post-Visit Guide',
  preheader: 'Guidance, tips, and what to expect as your GLP-1 therapy begins working.',
  body: `
    ${heading('Your GLP-1 Therapy Guide', 1)}
    ${paragraph(`Dear {{first_name}},`)}
    ${paragraph(`Thank you for your visit today. Here is your comprehensive guide to supporting your GLP-1 therapy for the best possible results.`)}

    ${divider('gold')}

    ${heading('After Your Injection', 2)}
    ${bulletList([
      'Mild nausea is the most common side effect - this typically improves over <strong>1-2 weeks</strong>',
      'Eat <strong>small, frequent meals</strong> rather than large portions',
      'Avoid high-fat, greasy, or heavily processed foods',
      'Stay well-hydrated - aim for <strong>64+ ounces</strong> of water daily',
      'Keep the injection site clean; mild redness is normal',
    ])}

    ${heading('Dietary Recommendations', 2)}
    ${bulletList([
      'Prioritize <strong>lean protein</strong> at every meal (chicken, fish, tofu, eggs)',
      'Include fiber-rich vegetables and whole grains',
      'Eat slowly and stop when you feel satisfied - not stuffed',
      'Limit sugary beverages and alcohol',
      'Consider a daily multivitamin to ensure adequate nutrition',
    ])}

    ${heading('Lifestyle Support', 2)}
    ${bulletList([
      'Aim for <strong>150 minutes</strong> of moderate exercise per week',
      'Prioritize quality sleep - 7-9 hours nightly',
      'Track your meals and progress in a journal or app',
      'Attend all scheduled follow-up appointments',
    ])}

    ${calloutBox(`
      <strong style="color: ${BRAND.gold};">Managing Common Side Effects</strong><br>
      <strong>Nausea:</strong> Eat bland foods, stay hydrated, try ginger tea.<br>
      <strong>Constipation:</strong> Increase fiber and water intake.<br>
      <strong>Fatigue:</strong> Ensure adequate protein and sleep.<br>
      Contact us if symptoms are severe or persist beyond 2 weeks.
    `, 'cream')}

    ${paragraph(`Your next appointment is scheduled for <strong>{{next_appointment_date}}</strong>. We will assess your progress and adjust your protocol as needed.`)}

    ${button('Schedule Your Follow-Up', '{{booking_url}}')}
    ${signoff('{{provider_name}}')}
  `,
});

export const glp1: ServiceEmailSet = {
  pretreatment: (vars?: TemplateVariables) => render(pretreatmentTemplate, vars),
  dayOf: (vars?: TemplateVariables) => render(dayOfTemplate, vars),
  aftercare: (vars?: TemplateVariables) => render(aftercareTemplate, vars),
};

export default glp1;
