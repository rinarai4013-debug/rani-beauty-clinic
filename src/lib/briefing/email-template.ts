/**
 * Rani Beauty Clinic - CEO Briefing Email Template Builder
 *
 * Generates beautiful branded HTML emails for CEO briefings.
 * Navy/gold/cream theme with organized data sections.
 */

import { BRAND, htmlToPlainText } from '@/lib/email/engine';

// ── Color tokens for briefing emails ─────────────────────────

const COLORS = {
  navy: BRAND.navy,
  gold: BRAND.gold,
  cream: BRAND.cream,
  white: BRAND.white,
  darkGold: BRAND.darkGold,
  lightGold: BRAND.lightGold,
  textDark: BRAND.textDark,
  textMuted: BRAND.textMuted,
  borderLight: BRAND.borderLight,
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',
};

// ── Formatting helpers ───────────────────────────────────────

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
}

export function formatCurrencyDetailed(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

export function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

function changeArrow(value: number): string {
  if (value > 0) return '&#9650;'; // up triangle
  if (value < 0) return '&#9660;'; // down triangle
  return '&#9654;'; // right triangle (no change)
}

function changeColor(value: number): string {
  if (value > 0) return COLORS.success;
  if (value < 0) return COLORS.danger;
  return COLORS.textMuted;
}

function severityColor(severity: string): string {
  switch (severity) {
    case 'critical': return COLORS.danger;
    case 'warning': return COLORS.warning;
    case 'info': return COLORS.info;
    default: return COLORS.textMuted;
  }
}

function priorityColor(priority: string): string {
  switch (priority) {
    case 'high': return COLORS.danger;
    case 'medium': return COLORS.warning;
    case 'low': return COLORS.info;
    default: return COLORS.textMuted;
  }
}

// ── Email layout ─────────────────────────────────────────────

export function briefingLayout(bodyContent: string, preheader: string, title: string, subtitle: string): string {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>${title} - ${BRAND.name}</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:AllowPNG/><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; background-color: ${COLORS.cream}; }
    @media screen and (max-width: 640px) {
      .email-container { width: 100% !important; max-width: 100% !important; }
      .padding-mobile { padding-left: 16px !important; padding-right: 16px !important; }
      .kpi-cell { display: block !important; width: 100% !important; padding: 8px 0 !important; }
      .hide-mobile { display: none !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${COLORS.cream};">
  <div style="display:none;font-size:1px;color:${COLORS.cream};line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${preheader}${'&zwnj;&nbsp;'.repeat(20)}
  </div>

  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${COLORS.cream};">
    <tr>
      <td align="center" style="padding: 24px 12px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="640" class="email-container" style="max-width: 640px; width: 100%;">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, ${COLORS.navy} 0%, #1a2d42 100%); background-color: ${COLORS.navy}; padding: 36px 40px 28px; text-align: center; border-radius: 8px 8px 0 0;" class="padding-mobile">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <p style="font-family: 'Georgia', serif; font-size: 32px; font-weight: 700; color: ${COLORS.gold}; margin: 0 0 4px 0; letter-spacing: 6px;">RANI</p>
                    <p style="font-family: 'Georgia', serif; font-size: 10px; letter-spacing: 4px; text-transform: uppercase; color: ${COLORS.lightGold}; margin: 0 0 20px 0;">
                      BEAUTY CLINIC
                    </p>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <hr style="border: none; border-top: 1px solid ${COLORS.gold}; width: 60px; margin: 0 auto 20px;">
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <p style="font-family: 'Georgia', serif; font-size: 22px; font-weight: 600; color: ${COLORS.white}; margin: 0 0 6px 0;">${title}</p>
                    <p style="font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 13px; color: ${COLORS.lightGold}; margin: 0; letter-spacing: 1px;">${subtitle}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Gold accent line -->
          <tr>
            <td style="background-color: ${COLORS.gold}; height: 3px; font-size: 0; line-height: 0;">&nbsp;</td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background-color: ${COLORS.white}; padding: 0;">
              ${bodyContent}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: ${COLORS.navy}; padding: 28px 40px; text-align: center; border-radius: 0 0 8px 8px;" class="padding-mobile">
              <p style="font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: ${COLORS.lightGold}; margin: 0 0 4px 0;">
                ${BRAND.name}
              </p>
              <p style="font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 11px; color: ${COLORS.textMuted}; margin: 0 0 4px 0;">
                401 Olympia Ave NE, Suite 101, Renton, WA 98056
              </p>
              <p style="font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 11px; color: ${COLORS.textMuted}; margin: 0 0 12px 0;">
                This briefing was auto-generated by RaniOS Intelligence
              </p>
              <p style="font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 10px; color: rgba(255,255,255,0.3); margin: 0;">
                &copy; ${new Date().getFullYear()} ${BRAND.name}. All rights reserved.
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

// ── Section builders ─────────────────────────────────────────

export function section(title: string, content: string, icon?: string): string {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-bottom: 1px solid ${COLORS.borderLight};">
    <tr>
      <td style="padding: 28px 40px;" class="padding-mobile">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td>
              <p style="font-family: 'Georgia', serif; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 3px; color: ${COLORS.gold}; margin: 0 0 16px 0;">
                ${icon ? icon + '&nbsp;&nbsp;' : ''}${title}
              </p>
            </td>
          </tr>
          <tr>
            <td>
              ${content}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`;
}

export function kpiRow(kpis: { label: string; value: string; change?: number; sublabel?: string }[]): string {
  const cells = kpis.map((kpi) => {
    const changeHtml = kpi.change !== undefined
      ? `<span style="font-size: 12px; color: ${changeColor(kpi.change)};">${changeArrow(kpi.change)} ${formatPercent(kpi.change)}</span>`
      : '';
    const sublabelHtml = kpi.sublabel
      ? `<p style="font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 11px; color: ${COLORS.textMuted}; margin: 2px 0 0 0;">${kpi.sublabel}</p>`
      : '';

    return `<td class="kpi-cell" style="padding: 12px 8px; text-align: center; vertical-align: top;" width="${Math.floor(100 / kpis.length)}%">
      <p style="font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: ${COLORS.textMuted}; margin: 0 0 4px 0;">${kpi.label}</p>
      <p style="font-family: 'Georgia', serif; font-size: 28px; font-weight: 700; color: ${COLORS.navy}; margin: 0 0 2px 0;">${kpi.value}</p>
      ${changeHtml}
      ${sublabelHtml}
    </td>`;
  }).join('');

  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${COLORS.cream}; border-radius: 6px; margin-bottom: 16px;">
    <tr>${cells}</tr>
  </table>`;
}

export function dataTable(headers: string[], rows: string[][]): string {
  const headerCells = headers
    .map((h) => `<th style="font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: ${COLORS.textMuted}; padding: 8px 12px; text-align: left; border-bottom: 2px solid ${COLORS.borderLight};">${h}</th>`)
    .join('');

  const bodyRows = rows
    .map(
      (row, i) =>
        `<tr style="background-color: ${i % 2 === 0 ? COLORS.white : COLORS.cream};">
          ${row.map((cell) => `<td style="font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 13px; color: ${COLORS.textDark}; padding: 10px 12px; border-bottom: 1px solid ${COLORS.borderLight};">${cell}</td>`).join('')}
        </tr>`
    )
    .join('');

  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-radius: 6px; overflow: hidden;">
    <thead><tr>${headerCells}</tr></thead>
    <tbody>${bodyRows}</tbody>
  </table>`;
}

export function alertBadge(severity: string, text: string): string {
  const color = severityColor(severity);
  return `<span style="display: inline-block; background-color: ${color}; color: ${COLORS.white}; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; padding: 3px 8px; border-radius: 3px;">${text}</span>`;
}

export function actionItemRow(priority: string, action: string, reason: string): string {
  const color = priorityColor(priority);
  const dot = `<span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: ${color}; margin-right: 8px; vertical-align: middle;"></span>`;

  return `<tr>
    <td style="padding: 10px 0; border-bottom: 1px solid ${COLORS.borderLight}; vertical-align: top;">
      <p style="font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: ${COLORS.textDark}; margin: 0 0 2px 0;">${dot}${action}</p>
      <p style="font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: ${COLORS.textMuted}; margin: 0; padding-left: 16px;">${reason}</p>
    </td>
  </tr>`;
}

export function quickLink(text: string, url: string): string {
  return `<a href="${url}" style="display: inline-block; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: ${COLORS.gold}; text-decoration: none; border: 1px solid ${COLORS.gold}; padding: 8px 16px; border-radius: 4px; margin: 4px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">${text}</a>`;
}

export function quickLinksBar(links: { text: string; url: string }[]): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td style="padding: 20px 40px; text-align: center; background-color: ${COLORS.cream};" class="padding-mobile">
        <p style="font-family: 'Georgia', serif; font-size: 11px; text-transform: uppercase; letter-spacing: 3px; color: ${COLORS.gold}; margin: 0 0 12px 0;">Quick Links</p>
        ${links.map((l) => quickLink(l.text, l.url)).join('\n        ')}
      </td>
    </tr>
  </table>`;
}

export function calloutBox(content: string, variant: 'success' | 'warning' | 'info' | 'gold' = 'gold'): string {
  const bgMap = { success: '#F0FDF4', warning: '#FFFBEB', info: '#EFF6FF', gold: '#FDF8F0' };
  const borderMap = { success: COLORS.success, warning: COLORS.warning, info: COLORS.info, gold: COLORS.gold };

  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 12px 0;">
    <tr>
      <td style="background-color: ${bgMap[variant]}; border-left: 4px solid ${borderMap[variant]}; padding: 16px 20px; border-radius: 0 4px 4px 0;">
        <p style="font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 13px; line-height: 1.6; color: ${COLORS.textDark}; margin: 0;">${content}</p>
      </td>
    </tr>
  </table>`;
}

export function emptyState(message: string): string {
  return `<p style="font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 13px; color: ${COLORS.textMuted}; text-align: center; padding: 16px 0; margin: 0;">${message}</p>`;
}

// ── Plain text generator ─────────────────────────────────────

export function generatePlainText(html: string): string {
  return htmlToPlainText(html);
}
