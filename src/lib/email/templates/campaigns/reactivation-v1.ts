import {
  buildTemplate,
  heading,
  paragraph,
  calloutBox,
  button,
  signoff,
  BRAND,
  type TemplateVariables,
  render,
  type RenderedEmail,
} from '../../engine';

const brandedHeading = (text: string, level: 1 | 2 | 3 = 1): string =>
  heading(
    `<span style="font-family: 'Playfair Display', Georgia, serif;">${text}</span>`,
    level,
  );

const brandedParagraph = (text: string): string =>
  paragraph(`<span style="font-family: 'Montserrat', Arial, sans-serif;">${text}</span>`);

const customSignoff = signoff('the rani team ✨').replace('With warmth,', 'with love,');

const template = buildTemplate({
  subject: "hi angel ✨ we've been thinking about you 💛",
  preheader:
    'exciting news from inside the clinic, thought you should be the first to know 💛',
  body: `
    ${brandedHeading("we've been thinking about you 💛", 1)}
    ${brandedParagraph('hi {{first_name}},')}
    ${brandedParagraph(
      "it has been a little while, and you have been on our minds. we wanted to share what is new inside the clinic and invite you back whenever it feels right.",
    )}

    ${calloutBox(
      `<span style="font-family: 'Montserrat', Arial, sans-serif; color: ${BRAND.textDark};">
        <strong style="font-family: 'Playfair Display', Georgia, serif; color: ${BRAND.navy};">what is new right now</strong><br>
        we have refined protocols, new options for skin support, and more personalized planning so every visit feels clear, calm, and beautifully tailored to you.
      </span>`,
      'cream',
    )}

    ${calloutBox(
      `<span style="font-family: 'Montserrat', Arial, sans-serif; color: ${BRAND.textDark};">
        <strong style="font-family: 'Playfair Display', Georgia, serif; color: ${BRAND.gold};">a little gift for your return</strong><br>
        when you come back in, we will include a refreshed treatment roadmap and a gentle progress check so you feel fully supported again.
      </span>`,
      'gold',
    )}

    ${button('book a visit', '{{booking_url}}')}

    ${brandedParagraph(
      'no pressure at all. whenever you are ready, we are here for you and your glow journey.',
    )}

    ${customSignoff}

    ${calloutBox(
      `<span style="font-family: 'Montserrat', Arial, sans-serif; color: ${BRAND.textMuted}; font-size: 13px; line-height: 1.6;">
        <strong style="font-family: 'Playfair Display', Georgia, serif; color: ${BRAND.navy};">rani beauty clinic</strong><br>
        401 Olympia Ave NE Ste 101, Renton WA 98056<br>
        425-539-4440<br>
        <a href="{{unsubscribe_url}}" style="color: ${BRAND.gold}; text-decoration: underline;">unsubscribe</a>
      </span>`,
      'cream',
    )}
  `,
});

export function reactivationV1(vars?: TemplateVariables): RenderedEmail {
  return render(template, vars);
}

export default reactivationV1;
