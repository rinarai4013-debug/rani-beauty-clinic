/**
 * Rani Beauty Clinic - Email Template Engine
 *
 * Renders branded HTML emails with variable interpolation,
 * conditional sections, and automatic plain-text generation.
 */

// ── Brand tokens ──────────────────────────────────────────────
export const BRAND = {
  navy: '#0F1D2C',
  gold: '#C9A96E',
  cream: '#F8F6F1',
  white: '#FFFFFF',
  darkGold: '#B8944F',
  lightGold: '#E8D5B0',
  textDark: '#1A1A1A',
  textMuted: '#6B6B6B',
  borderLight: '#E8E3DA',
  name: 'Rani Beauty Clinic',
  tagline: 'Luxury Aesthetics. Clinical Precision.',
  url: 'https://www.ranibeautyclinic.com',
  phone: '(555) 926-7264',
  address: '123 Luxury Lane, Suite 200, Beverly Hills, CA 90210',
  logoUrl: 'https://www.ranibeautyclinic.com/images/logo-gold.png',
  socialInstagram: 'https://instagram.com/ranibeautyclinic',
  socialFacebook: 'https://facebook.com/ranibeautyclinic',
  unsubscribeUrl: '{{unsubscribe_url}}',
} as const;

// ── Types ─────────────────────────────────────────────────────
export interface TemplateVariables {
  [key: string]: string | number | boolean | undefined | null;
}

export interface ConditionalSection {
  condition: string; // variable name - truthy = show
  content: string;
}

export interface EmailTemplate {
  subject: string;
  preheader: string;
  html: string;
  text: string;
}

export interface ServiceEmailSet {
  pretreatment: (_vars?: TemplateVariables) => EmailTemplate;
  dayOf: (_vars?: TemplateVariables) => EmailTemplate;
  aftercare: (_vars?: TemplateVariables) => EmailTemplate;
}

export interface RenderedEmail {
  subject: string;
  preheader: string;
  html: string;
  text: string;
}

// ── Variable interpolation ────────────────────────────────────
export function interpolate(
  template: string,
  vars: TemplateVariables = {}
): string {
  // Merge brand vars as defaults
  const merged: TemplateVariables = {
    brand_name: BRAND.name,
    brand_url: BRAND.url,
    brand_phone: BRAND.phone,
    brand_address: BRAND.address,
    brand_tagline: BRAND.tagline,
    current_year: new Date().getFullYear(),
    ...vars,
  };

  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = merged[key];
    if (value === undefined || value === null) return match;
    return String(value);
  });
}

// ── Conditional sections ──────────────────────────────────────
export function processConditionals(
  html: string,
  vars: TemplateVariables = {}
): string {
  // {{#if var_name}}...content...{{/if var_name}}
  return html.replace(
    /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\s+\1\}\}/g,
    (_, key, content) => {
      const value = vars[key];
      return value ? content : '';
    }
  );
}

// ── HTML → Plain text ─────────────────────────────────────────
export function htmlToPlainText(html: string): string {
  let text = html;
  // Remove style/head blocks
  text = text.replace(/<style[\s\S]*?<\/style>/gi, '');
  text = text.replace(/<head[\s\S]*?<\/head>/gi, '');
  // Preserve links
  text = text.replace(
    /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi,
    '$2 ($1)'
  );
  // Block elements → newlines
  text = text.replace(/<\/(p|div|h[1-6]|li|tr|br\s*\/?)>/gi, '\n');
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<hr\s*\/?>/gi, '\n---\n');
  // List items
  text = text.replace(/<li[^>]*>/gi, '  - ');
  // Strip remaining tags
  text = text.replace(/<[^>]+>/g, '');
  // Decode entities
  text = text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&mdash;/g, '---')
    .replace(/&ndash;/g, '--')
    .replace(/&bull;/g, '*');
  // Collapse whitespace
  text = text.replace(/[ \t]+/g, ' ');
  text = text.replace(/\n{3,}/g, '\n\n');
  text = text.trim();
  return text;
}

// ── Base layout wrapper ───────────────────────────────────────
export function baseLayout(bodyContent: string, preheader: string = ''): string {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>${BRAND.name}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:AllowPNG/>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    /* Reset */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; height: 100% !important; background-color: ${BRAND.cream}; }
    /* Typography */
    .email-body { font-family: 'Georgia', 'Times New Roman', serif; color: ${BRAND.textDark}; line-height: 1.7; }
    .heading-primary { font-family: 'Georgia', serif; color: ${BRAND.navy}; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; margin: 0 0 16px 0; }
    .heading-secondary { font-family: 'Georgia', serif; color: ${BRAND.navy}; font-size: 22px; font-weight: 600; margin: 0 0 12px 0; }
    .heading-tertiary { font-family: 'Georgia', serif; color: ${BRAND.gold}; font-size: 16px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 8px 0; }
    .body-text { font-size: 16px; line-height: 1.7; color: ${BRAND.textDark}; margin: 0 0 16px 0; }
    .text-muted { color: ${BRAND.textMuted}; font-size: 14px; }
    .text-gold { color: ${BRAND.gold}; }
    /* Buttons */
    .btn-primary { display: inline-block; background-color: ${BRAND.gold}; color: ${BRAND.white} !important; text-decoration: none; font-family: 'Georgia', serif; font-size: 14px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; padding: 16px 40px; border-radius: 0; }
    .btn-primary:hover { background-color: ${BRAND.darkGold}; }
    .btn-secondary { display: inline-block; background-color: transparent; color: ${BRAND.gold} !important; text-decoration: none; font-family: 'Georgia', serif; font-size: 14px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; padding: 14px 38px; border: 2px solid ${BRAND.gold}; border-radius: 0; }
    /* Divider */
    .divider { border: none; border-top: 1px solid ${BRAND.borderLight}; margin: 32px 0; }
    .divider-gold { border: none; border-top: 2px solid ${BRAND.gold}; margin: 32px auto; width: 60px; }
    /* Responsive */
    @media screen and (max-width: 600px) {
      .email-container { width: 100% !important; max-width: 100% !important; }
      .padding-mobile { padding-left: 24px !important; padding-right: 24px !important; }
      .heading-primary { font-size: 24px !important; }
      .heading-secondary { font-size: 20px !important; }
      .btn-primary, .btn-secondary { padding: 14px 32px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${BRAND.cream};">
  <!-- Preheader (hidden preview text) -->
  <div style="display:none;font-size:1px;color:${BRAND.cream};line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${preheader}${'&zwnj;&nbsp;'.repeat(30)}
  </div>

  <!-- Outer wrapper -->
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${BRAND.cream};">
    <tr>
      <td align="center" style="padding: 40px 16px;">

        <!-- Email container -->
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" class="email-container" style="max-width: 600px; width: 100%; background-color: ${BRAND.white}; border: 1px solid ${BRAND.borderLight};">

          <!-- Header -->
          <tr>
            <td style="background-color: ${BRAND.navy}; padding: 32px 48px; text-align: center;" class="padding-mobile">
              <img src="${BRAND.logoUrl}" alt="${BRAND.name}" width="180" style="display: block; margin: 0 auto 12px auto; max-width: 180px;">
              <p style="font-family: 'Georgia', serif; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: ${BRAND.gold}; margin: 0;">
                ${BRAND.tagline}
              </p>
            </td>
          </tr>

          <!-- Gold accent line -->
          <tr>
            <td style="background-color: ${BRAND.gold}; height: 3px; font-size: 0; line-height: 0;">&nbsp;</td>
          </tr>

          <!-- Body -->
          <tr>
            <td class="email-body padding-mobile" style="padding: 48px;">
              ${bodyContent}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: ${BRAND.navy}; padding: 40px 48px; text-align: center;" class="padding-mobile">
              <!-- Social icons -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto 24px auto;">
                <tr>
                  <td style="padding: 0 8px;">
                    <a href="${BRAND.socialInstagram}" style="color: ${BRAND.gold}; text-decoration: none; font-family: Georgia, serif; font-size: 13px; letter-spacing: 1px;">INSTAGRAM</a>
                  </td>
                  <td style="color: ${BRAND.gold}; padding: 0 4px;">|</td>
                  <td style="padding: 0 8px;">
                    <a href="${BRAND.socialFacebook}" style="color: ${BRAND.gold}; text-decoration: none; font-family: Georgia, serif; font-size: 13px; letter-spacing: 1px;">FACEBOOK</a>
                  </td>
                </tr>
              </table>

              <p style="font-family: Georgia, serif; font-size: 13px; color: ${BRAND.lightGold}; margin: 0 0 8px 0;">
                ${BRAND.name}
              </p>
              <p style="font-family: Georgia, serif; font-size: 12px; color: ${BRAND.textMuted}; margin: 0 0 8px 0;">
                ${BRAND.address}
              </p>
              <p style="font-family: Georgia, serif; font-size: 12px; color: ${BRAND.textMuted}; margin: 0 0 24px 0;">
                ${BRAND.phone}
              </p>

              <hr style="border: none; border-top: 1px solid rgba(201,169,110,0.3); margin: 0 0 24px 0;">

              <p style="font-family: Georgia, serif; font-size: 11px; color: ${BRAND.textMuted}; margin: 0;">
                <a href="${BRAND.unsubscribeUrl}" style="color: ${BRAND.textMuted}; text-decoration: underline;">Unsubscribe</a>
                &nbsp;&bull;&nbsp;
                <a href="${BRAND.url}/privacy" style="color: ${BRAND.textMuted}; text-decoration: underline;">Privacy Policy</a>
              </p>
              <p style="font-family: Georgia, serif; font-size: 11px; color: ${BRAND.textMuted}; margin: 8px 0 0 0;">
                &copy; {{current_year}} ${BRAND.name}. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── Render pipeline ───────────────────────────────────────────
export function render(
  template: EmailTemplate,
  vars: TemplateVariables = {}
): RenderedEmail {
  const processedHtml = interpolate(
    processConditionals(template.html, vars),
    vars
  );
  const processedSubject = interpolate(template.subject, vars);
  const processedPreheader = interpolate(template.preheader, vars);

  // Auto-generate plain text if not provided or if it contains variables
  const processedText = template.text
    ? interpolate(processConditionals(template.text, vars), vars)
    : htmlToPlainText(processedHtml);

  return {
    subject: processedSubject,
    preheader: processedPreheader,
    html: processedHtml,
    text: processedText,
  };
}

// ── Component helpers ─────────────────────────────────────────
export function button(text: string, url: string, variant: 'primary' | 'secondary' = 'primary'): string {
  const className = variant === 'primary' ? 'btn-primary' : 'btn-secondary';
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
  <tr>
    <td align="center">
      <a href="${url}" class="${className}" style="display: inline-block; background-color: ${variant === 'primary' ? BRAND.gold : 'transparent'}; color: ${variant === 'primary' ? BRAND.white : BRAND.gold} !important; text-decoration: none; font-family: 'Georgia', serif; font-size: 14px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; padding: ${variant === 'primary' ? '16px 40px' : '14px 38px'}; ${variant === 'secondary' ? `border: 2px solid ${BRAND.gold};` : ''}">${text}</a>
    </td>
  </tr>
</table>`;
}

export function divider(variant: 'full' | 'gold' = 'full'): string {
  if (variant === 'gold') {
    return `<hr style="border: none; border-top: 2px solid ${BRAND.gold}; margin: 32px auto; width: 60px;">`;
  }
  return `<hr style="border: none; border-top: 1px solid ${BRAND.borderLight}; margin: 32px 0;">`;
}

export function heading(text: string, level: 1 | 2 | 3 = 1): string {
  const styles: Record<number, string> = {
    1: `font-family: 'Georgia', serif; color: ${BRAND.navy}; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; margin: 0 0 16px 0;`,
    2: `font-family: 'Georgia', serif; color: ${BRAND.navy}; font-size: 22px; font-weight: 600; margin: 0 0 12px 0;`,
    3: `font-family: 'Georgia', serif; color: ${BRAND.gold}; font-size: 16px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 8px 0;`,
  };
  return `<h${level} style="${styles[level]}">${text}</h${level}>`;
}

export function paragraph(text: string, muted = false): string {
  const color = muted ? BRAND.textMuted : BRAND.textDark;
  const size = muted ? '14px' : '16px';
  return `<p style="font-family: 'Georgia', serif; font-size: ${size}; line-height: 1.7; color: ${color}; margin: 0 0 16px 0;">${text}</p>`;
}

export function bulletList(items: string[]): string {
  const lis = items
    .map(
      (item) =>
        `<li style="font-family: 'Georgia', serif; font-size: 16px; line-height: 1.7; color: ${BRAND.textDark}; margin: 0 0 8px 0; padding-left: 8px;">${item}</li>`
    )
    .join('\n      ');
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 0 24px 0;">
  <tr>
    <td>
      <ul style="margin: 0; padding-left: 20px; list-style-type: disc;">
        ${lis}
      </ul>
    </td>
  </tr>
</table>`;
}

export function calloutBox(content: string, variant: 'cream' | 'navy' | 'gold' = 'cream'): string {
  const bgColors = { cream: BRAND.cream, navy: BRAND.navy, gold: '#FDF8F0' };
  const textColors = { cream: BRAND.textDark, navy: BRAND.white, gold: BRAND.textDark };
  const borderColors = { cream: BRAND.borderLight, navy: BRAND.navy, gold: BRAND.gold };
  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0;">
  <tr>
    <td style="background-color: ${bgColors[variant]}; border-left: 4px solid ${borderColors[variant]}; padding: 24px 28px; font-family: 'Georgia', serif; font-size: 15px; line-height: 1.7; color: ${textColors[variant]};">
      ${content}
    </td>
  </tr>
</table>`;
}

export function signoff(name: string = 'The Rani Team'): string {
  return `${divider('gold')}
${paragraph('With warmth,')}
<p style="font-family: 'Georgia', serif; font-size: 18px; color: ${BRAND.gold}; font-weight: 600; margin: 0;">${name}</p>
<p style="font-family: 'Georgia', serif; font-size: 13px; color: ${BRAND.textMuted}; margin: 4px 0 0 0;">${BRAND.name}</p>`;
}

// ── Template builder shorthand ────────────────────────────────
export function buildTemplate(opts: {
  subject: string;
  preheader: string;
  body: string;
  text?: string;
}): EmailTemplate {
  const html = baseLayout(opts.body, opts.preheader);
  const text = opts.text || htmlToPlainText(html);
  return {
    subject: opts.subject,
    preheader: opts.preheader,
    html,
    text,
  };
}
