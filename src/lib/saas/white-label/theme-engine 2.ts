// =============================================================================
// RaniOS White-Label Theme Engine
// Production-quality theming system for multi-tenant white-labeling
// =============================================================================

import type {
  WhiteLabelTheme,
  ThemePreset,
  ColorPalette,
  ColorShade,
  TypographyConfig,
  LogoSet,
  ComponentVariants,
  EmailBranding,
  PdfBranding,
  ContrastResult,
  ThemeValidationResult,
  ThemeWarning,
  ThemeError,
  CssVariableMap,
  BrandPreview,
} from './types';

// =============================================================================
// Color Utilities
// =============================================================================

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const cleaned = hex.replace('#', '');
  if (cleaned.length !== 6) return null;
  const num = parseInt(cleaned, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return `#${[clamp(r), clamp(g), clamp(b)]
    .map((c) => c.toString(16).padStart(2, '0'))
    .join('')}`;
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  const sNorm = s / 100;
  const lNorm = l / 100;
  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lNorm - c / 2;

  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const l = (max + min) / 2;

  if (max === min) return { h: 0, s: 0, l: Math.round(l * 100) };

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h = 0;
  if (max === rNorm) h = ((gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0)) * 60;
  else if (max === gNorm) h = ((bNorm - rNorm) / d + 2) * 60;
  else h = ((rNorm - gNorm) / d + 4) * 60;

  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const sRgb = c / 255;
    return sRgb <= 0.03928 ? sRgb / 12.92 : Math.pow((sRgb + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// =============================================================================
// Color Palette Generator
// =============================================================================

export function generateColorShade(baseHex: string): ColorShade {
  const rgb = hexToRgb(baseHex);
  if (!rgb) {
    throw new Error(`Invalid hex color: ${baseHex}`);
  }

  const { h, s } = rgbToHsl(rgb.r, rgb.g, rgb.b);

  const shadeMap: Record<keyof ColorShade, number> = {
    50: 97,
    100: 94,
    200: 86,
    300: 76,
    400: 62,
    500: 50,
    600: 40,
    700: 32,
    800: 24,
    900: 16,
    950: 10,
  };

  const shade: Record<string, string> = {};
  for (const [key, lightness] of Object.entries(shadeMap)) {
    const adjustedS = lightness > 80 ? Math.max(s - 20, 10) : lightness < 30 ? Math.max(s - 10, 15) : s;
    const { r, g, b } = hslToRgb(h, adjustedS, lightness);
    shade[key] = rgbToHex(r, g, b);
  }

  return shade as unknown as ColorShade;
}

export function generateColorPalette(
  primaryHex: string,
  secondaryHex?: string,
  accentHex?: string
): ColorPalette {
  const primaryRgb = hexToRgb(primaryHex);
  if (!primaryRgb) throw new Error(`Invalid primary color: ${primaryHex}`);

  const { h } = rgbToHsl(primaryRgb.r, primaryRgb.g, primaryRgb.b);

  const secondaryBase = secondaryHex || (() => {
    const secH = (h + 30) % 360;
    const { r, g, b } = hslToRgb(secH, 45, 50);
    return rgbToHex(r, g, b);
  })();

  const accentBase = accentHex || (() => {
    const accH = (h + 180) % 360;
    const { r, g, b } = hslToRgb(accH, 65, 55);
    return rgbToHex(r, g, b);
  })();

  return {
    primary: generateColorShade(primaryHex),
    secondary: generateColorShade(secondaryBase),
    accent: generateColorShade(accentBase),
    neutral: generateColorShade('#6B7280'),
    semantic: {
      success: '#059669',
      warning: '#D97706',
      error: '#DC2626',
      info: '#2563EB',
    },
  };
}

// =============================================================================
// Contrast Ratio Checking (WCAG 2.1)
// =============================================================================

export function checkContrastRatio(foregroundHex: string, backgroundHex: string): ContrastResult {
  const fg = hexToRgb(foregroundHex);
  const bg = hexToRgb(backgroundHex);

  if (!fg || !bg) {
    return { ratio: 0, aa: false, aaLarge: false, aaa: false, aaaLarge: false };
  }

  const lum1 = relativeLuminance(fg.r, fg.g, fg.b);
  const lum2 = relativeLuminance(bg.r, bg.g, bg.b);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  const ratio = (lighter + 0.05) / (darker + 0.05);

  return {
    ratio: Math.round(ratio * 100) / 100,
    aa: ratio >= 4.5,
    aaLarge: ratio >= 3,
    aaa: ratio >= 7,
    aaaLarge: ratio >= 4.5,
  };
}

// =============================================================================
// Typography Configuration
// =============================================================================

export function createTypographyConfig(
  headingFamily: string = 'Playfair Display',
  bodyFamily: string = 'Montserrat',
  monoFamily: string = 'JetBrains Mono'
): TypographyConfig {
  return {
    headingFamily,
    bodyFamily,
    monoFamily,
    scale: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
    },
    weights: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeights: {
      tight: '1.25',
      snug: '1.375',
      normal: '1.5',
      relaxed: '1.625',
      loose: '2',
    },
  };
}

const FONT_OPTIONS = [
  { name: 'Playfair Display', category: 'serif', mood: 'luxury' },
  { name: 'Montserrat', category: 'sans-serif', mood: 'modern' },
  { name: 'Inter', category: 'sans-serif', mood: 'clean' },
  { name: 'Lora', category: 'serif', mood: 'elegant' },
  { name: 'Raleway', category: 'sans-serif', mood: 'sophisticated' },
  { name: 'Poppins', category: 'sans-serif', mood: 'friendly' },
  { name: 'DM Sans', category: 'sans-serif', mood: 'minimal' },
  { name: 'Source Serif 4', category: 'serif', mood: 'professional' },
  { name: 'Manrope', category: 'sans-serif', mood: 'geometric' },
  { name: 'Cormorant Garamond', category: 'serif', mood: 'luxury' },
  { name: 'Work Sans', category: 'sans-serif', mood: 'neutral' },
  { name: 'Libre Baskerville', category: 'serif', mood: 'traditional' },
];

export function getFontOptions() {
  return FONT_OPTIONS;
}

// =============================================================================
// Logo Management
// =============================================================================

export function createDefaultLogoSet(tenantName: string): LogoSet {
  return {
    primary: `/tenants/${tenantName.toLowerCase().replace(/\s+/g, '-')}/logo.svg`,
    icon: `/tenants/${tenantName.toLowerCase().replace(/\s+/g, '-')}/icon.svg`,
    favicon: `/tenants/${tenantName.toLowerCase().replace(/\s+/g, '-')}/favicon.ico`,
    darkMode: `/tenants/${tenantName.toLowerCase().replace(/\s+/g, '-')}/logo-dark.svg`,
    emailHeader: `/tenants/${tenantName.toLowerCase().replace(/\s+/g, '-')}/email-header.png`,
    width: 180,
    height: 48,
  };
}

export function validateLogoFile(
  fileName: string,
  fileSizeBytes: number,
  type: 'primary' | 'icon' | 'favicon'
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const ext = fileName.split('.').pop()?.toLowerCase();

  const allowedTypes: Record<string, string[]> = {
    primary: ['svg', 'png', 'webp'],
    icon: ['svg', 'png', 'webp'],
    favicon: ['ico', 'png', 'svg'],
  };

  const maxSizes: Record<string, number> = {
    primary: 2 * 1024 * 1024,
    icon: 512 * 1024,
    favicon: 256 * 1024,
  };

  if (!ext || !allowedTypes[type].includes(ext)) {
    errors.push(`File type .${ext || 'unknown'} not allowed. Accepted: ${allowedTypes[type].join(', ')}`);
  }

  if (fileSizeBytes > maxSizes[type]) {
    const maxMb = (maxSizes[type] / (1024 * 1024)).toFixed(1);
    errors.push(`File size exceeds ${maxMb}MB limit`);
  }

  return { valid: errors.length === 0, errors };
}

// =============================================================================
// CSS Variable Generator
// =============================================================================

export function generateCssVariables(theme: WhiteLabelTheme): CssVariableMap {
  const vars: CssVariableMap = {};

  // Color palette variables
  const colorGroups = ['primary', 'secondary', 'accent', 'neutral'] as const;
  for (const group of colorGroups) {
    const shades = theme.colors[group];
    for (const [shade, value] of Object.entries(shades)) {
      vars[`--color-${group}-${shade}`] = value;
    }
  }

  // Semantic colors
  vars['--color-success'] = theme.colors.semantic.success;
  vars['--color-warning'] = theme.colors.semantic.warning;
  vars['--color-error'] = theme.colors.semantic.error;
  vars['--color-info'] = theme.colors.semantic.info;

  // Typography
  vars['--font-heading'] = `'${theme.typography.headingFamily}', serif`;
  vars['--font-body'] = `'${theme.typography.bodyFamily}', sans-serif`;
  vars['--font-mono'] = `'${theme.typography.monoFamily}', monospace`;

  for (const [key, value] of Object.entries(theme.typography.scale)) {
    vars[`--text-${key}`] = value;
  }
  for (const [key, value] of Object.entries(theme.typography.weights)) {
    vars[`--font-weight-${key}`] = String(value);
  }
  for (const [key, value] of Object.entries(theme.typography.lineHeights)) {
    vars[`--leading-${key}`] = value;
  }

  // Component variants
  vars['--btn-radius'] = theme.components.buttons.borderRadius;
  vars['--btn-px'] = theme.components.buttons.paddingX;
  vars['--btn-py'] = theme.components.buttons.paddingY;
  vars['--btn-font-size'] = theme.components.buttons.fontSize;
  vars['--btn-font-weight'] = String(theme.components.buttons.fontWeight);
  vars['--btn-text-transform'] = theme.components.buttons.textTransform;
  vars['--btn-shadow'] = theme.components.buttons.shadow;

  vars['--card-radius'] = theme.components.cards.borderRadius;
  vars['--card-border-width'] = theme.components.cards.borderWidth;
  vars['--card-border-color'] = theme.components.cards.borderColor;
  vars['--card-shadow'] = theme.components.cards.shadow;
  vars['--card-padding'] = theme.components.cards.padding;

  vars['--input-radius'] = theme.components.inputs.borderRadius;
  vars['--input-border-width'] = theme.components.inputs.borderWidth;
  vars['--input-border-color'] = theme.components.inputs.borderColor;
  vars['--input-focus-ring'] = theme.components.inputs.focusRingColor;
  vars['--input-px'] = theme.components.inputs.paddingX;
  vars['--input-py'] = theme.components.inputs.paddingY;
  vars['--input-font-size'] = theme.components.inputs.fontSize;

  vars['--nav-height'] = theme.components.navigation.height;
  vars['--nav-bg'] = theme.components.navigation.background;

  return vars;
}

export function generateCssString(theme: WhiteLabelTheme): string {
  const vars = generateCssVariables(theme);
  const lines = Object.entries(vars).map(([key, value]) => `  ${key}: ${value};`);

  let css = `:root {\n${lines.join('\n')}\n}\n`;

  // Dark mode overrides
  css += `\n@media (prefers-color-scheme: dark) {\n  :root {\n`;
  css += `    --color-primary-50: ${theme.colors.primary[950]};\n`;
  css += `    --color-primary-950: ${theme.colors.primary[50]};\n`;
  css += `    --color-neutral-50: ${theme.colors.neutral[950]};\n`;
  css += `    --color-neutral-950: ${theme.colors.neutral[50]};\n`;
  css += `  }\n}\n`;

  // Custom CSS from tenant
  if (theme.customCss) {
    css += `\n/* Tenant custom CSS */\n${theme.customCss}\n`;
  }

  return css;
}

// =============================================================================
// Component Variant System
// =============================================================================

export function createComponentVariants(preset: ThemePreset): ComponentVariants {
  const presets: Record<ThemePreset, ComponentVariants> = {
    medical: {
      buttons: {
        borderRadius: '0.75rem',
        paddingX: '1.5rem',
        paddingY: '0.75rem',
        fontSize: '0.875rem',
        fontWeight: 600,
        textTransform: 'none',
        shadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      },
      cards: {
        borderRadius: '1rem',
        borderWidth: '1px',
        borderColor: '#E5E7EB',
        shadow: '0 1px 3px 0 rgba(0, 0, 0, 0.08)',
        padding: '1.5rem',
      },
      inputs: {
        borderRadius: '0.75rem',
        borderWidth: '1px',
        borderColor: '#D1D5DB',
        focusRingColor: 'rgba(59, 130, 246, 0.3)',
        paddingX: '0.875rem',
        paddingY: '0.625rem',
        fontSize: '0.875rem',
      },
      navigation: {
        style: 'fixed',
        background: 'rgba(255, 255, 255, 0.95)',
        blur: true,
        height: '4rem',
        borderBottom: true,
      },
    },
    wellness: {
      buttons: {
        borderRadius: '2rem',
        paddingX: '2rem',
        paddingY: '0.75rem',
        fontSize: '0.875rem',
        fontWeight: 500,
        textTransform: 'none',
        shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      },
      cards: {
        borderRadius: '1.5rem',
        borderWidth: '0px',
        borderColor: 'transparent',
        shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.08)',
        padding: '2rem',
      },
      inputs: {
        borderRadius: '1rem',
        borderWidth: '1px',
        borderColor: '#E5E7EB',
        focusRingColor: 'rgba(16, 185, 129, 0.3)',
        paddingX: '1rem',
        paddingY: '0.75rem',
        fontSize: '1rem',
      },
      navigation: {
        style: 'fixed',
        background: 'rgba(255, 255, 255, 0.9)',
        blur: true,
        height: '4.5rem',
        borderBottom: false,
      },
    },
    luxury: {
      buttons: {
        borderRadius: '0.5rem',
        paddingX: '2rem',
        paddingY: '0.875rem',
        fontSize: '0.8125rem',
        fontWeight: 700,
        textTransform: 'uppercase',
        shadow: '0 10px 15px -3px rgba(0, 0, 0, 0.15)',
      },
      cards: {
        borderRadius: '1rem',
        borderWidth: '1px',
        borderColor: '#F3F4F6',
        shadow: '0 10px 25px -5px rgba(0, 0, 0, 0.06)',
        padding: '2rem',
      },
      inputs: {
        borderRadius: '0.5rem',
        borderWidth: '1px',
        borderColor: '#D1D5DB',
        focusRingColor: 'rgba(217, 119, 6, 0.3)',
        paddingX: '1rem',
        paddingY: '0.75rem',
        fontSize: '0.875rem',
      },
      navigation: {
        style: 'fixed',
        background: 'rgba(15, 29, 44, 0.97)',
        blur: true,
        height: '4rem',
        borderBottom: false,
      },
    },
    modern: {
      buttons: {
        borderRadius: '0.5rem',
        paddingX: '1.25rem',
        paddingY: '0.625rem',
        fontSize: '0.875rem',
        fontWeight: 600,
        textTransform: 'none',
        shadow: 'none',
      },
      cards: {
        borderRadius: '0.75rem',
        borderWidth: '1px',
        borderColor: '#E5E7EB',
        shadow: 'none',
        padding: '1.5rem',
      },
      inputs: {
        borderRadius: '0.5rem',
        borderWidth: '1px',
        borderColor: '#D1D5DB',
        focusRingColor: 'rgba(99, 102, 241, 0.3)',
        paddingX: '0.75rem',
        paddingY: '0.5rem',
        fontSize: '0.875rem',
      },
      navigation: {
        style: 'sticky',
        background: '#FFFFFF',
        blur: false,
        height: '3.5rem',
        borderBottom: true,
      },
    },
    minimal: {
      buttons: {
        borderRadius: '0.375rem',
        paddingX: '1rem',
        paddingY: '0.5rem',
        fontSize: '0.875rem',
        fontWeight: 500,
        textTransform: 'none',
        shadow: 'none',
      },
      cards: {
        borderRadius: '0.5rem',
        borderWidth: '1px',
        borderColor: '#F3F4F6',
        shadow: 'none',
        padding: '1.25rem',
      },
      inputs: {
        borderRadius: '0.375rem',
        borderWidth: '1px',
        borderColor: '#E5E7EB',
        focusRingColor: 'rgba(107, 114, 128, 0.3)',
        paddingX: '0.75rem',
        paddingY: '0.5rem',
        fontSize: '0.875rem',
      },
      navigation: {
        style: 'relative',
        background: '#FFFFFF',
        blur: false,
        height: '3.5rem',
        borderBottom: true,
      },
    },
  };

  return presets[preset];
}

// =============================================================================
// Email Template Branding
// =============================================================================

export function createEmailBranding(theme: WhiteLabelTheme, tenantName: string): EmailBranding {
  return {
    headerLogo: theme.logos.emailHeader,
    headerBackground: theme.colors.primary[900],
    headerTextColor: '#FFFFFF',
    bodyBackground: '#F9FAFB',
    bodyTextColor: '#374151',
    footerBackground: theme.colors.neutral[100],
    footerTextColor: theme.colors.neutral[500],
    accentColor: theme.colors.accent[500],
    buttonColor: theme.colors.primary[600],
    buttonTextColor: '#FFFFFF',
    fontFamily: theme.typography.bodyFamily,
    footerLinks: [
      { label: 'Privacy Policy', url: '/privacy' },
      { label: 'Terms of Service', url: '/terms' },
      { label: 'Unsubscribe', url: '{{unsubscribeUrl}}' },
    ],
    socialLinks: [],
    companyName: tenantName,
    companyAddress: '',
    unsubscribeUrl: '{{unsubscribeUrl}}',
  };
}

export function renderEmailTemplate(
  branding: EmailBranding,
  subject: string,
  bodyHtml: string
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { margin: 0; padding: 0; font-family: '${branding.fontFamily}', Arial, sans-serif; background: ${branding.bodyBackground}; color: ${branding.bodyTextColor}; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { background: ${branding.headerBackground}; padding: 24px; text-align: center; }
    .header img { max-height: 48px; }
    .body { background: #FFFFFF; padding: 32px 24px; }
    .footer { background: ${branding.footerBackground}; padding: 24px; text-align: center; font-size: 12px; color: ${branding.footerTextColor}; }
    .btn { display: inline-block; background: ${branding.buttonColor}; color: ${branding.buttonTextColor}; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; }
    .footer a { color: ${branding.footerTextColor}; text-decoration: underline; margin: 0 8px; }
    .social-links { margin: 16px 0; }
    .social-links a { display: inline-block; margin: 0 6px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${branding.headerLogo}" alt="${branding.companyName}" />
    </div>
    <div class="body">
      ${bodyHtml}
    </div>
    <div class="footer">
      ${branding.socialLinks.length > 0 ? `
      <div class="social-links">
        ${branding.socialLinks.map((s) => `<a href="${s.url}">${s.platform}</a>`).join('')}
      </div>` : ''}
      <p>${branding.companyName}</p>
      ${branding.companyAddress ? `<p>${branding.companyAddress}</p>` : ''}
      <div>
        ${branding.footerLinks.map((l) => `<a href="${l.url}">${l.label}</a>`).join(' | ')}
      </div>
    </div>
  </div>
</body>
</html>`;
}

// =============================================================================
// PDF Branding
// =============================================================================

export function createPdfBranding(theme: WhiteLabelTheme, tenantName: string): PdfBranding {
  return {
    logo: theme.logos.primary,
    primaryColor: theme.colors.primary[700],
    secondaryColor: theme.colors.secondary[500],
    headerFont: theme.typography.headingFamily,
    bodyFont: theme.typography.bodyFamily,
    companyName: tenantName,
    companyAddress: '',
    companyPhone: '',
    companyEmail: '',
    companyWebsite: '',
    watermark: false,
    watermarkText: tenantName,
    footerText: `Powered by RaniOS | ${tenantName}`,
  };
}

export function generatePdfStyles(branding: PdfBranding): string {
  return `
    @page {
      size: letter;
      margin: 1in 0.75in;
      @top-center { content: element(header); }
      @bottom-center { content: element(footer); }
    }
    body { font-family: '${branding.bodyFont}', sans-serif; color: #1F2937; font-size: 10pt; line-height: 1.6; }
    h1, h2, h3, h4 { font-family: '${branding.headerFont}', serif; color: ${branding.primaryColor}; }
    h1 { font-size: 20pt; margin-bottom: 8pt; }
    h2 { font-size: 16pt; margin-bottom: 6pt; border-bottom: 2px solid ${branding.primaryColor}; padding-bottom: 4pt; }
    h3 { font-size: 13pt; margin-bottom: 4pt; }
    .pdf-header { position: running(header); display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #E5E7EB; padding-bottom: 8pt; }
    .pdf-header img { max-height: 32pt; }
    .pdf-footer { position: running(footer); text-align: center; font-size: 8pt; color: #9CA3AF; border-top: 1px solid #E5E7EB; padding-top: 6pt; }
    table { width: 100%; border-collapse: collapse; margin: 12pt 0; }
    th { background: ${branding.primaryColor}; color: white; text-align: left; padding: 8pt 10pt; font-size: 9pt; font-weight: 600; }
    td { padding: 8pt 10pt; border-bottom: 1px solid #E5E7EB; font-size: 9pt; }
    tr:nth-child(even) td { background: #F9FAFB; }
    .amount { text-align: right; font-family: monospace; }
    .total-row td { font-weight: 700; border-top: 2px solid ${branding.primaryColor}; background: #F9FAFB; }
    ${branding.watermark ? `.watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 72pt; color: rgba(0,0,0,0.03); font-family: '${branding.headerFont}', serif; white-space: nowrap; z-index: -1; }` : ''}
  `.trim();
}

// =============================================================================
// Brand Preview Renderer
// =============================================================================

export function generateBrandPreview(theme: WhiteLabelTheme): BrandPreview {
  const previewId = `preview-${theme.tenantId}-${Date.now()}`;

  return {
    theme,
    previewUrl: `/api/saas/preview/${previewId}`,
    screenshots: {
      desktop: `/api/saas/preview/${previewId}/desktop`,
      tablet: `/api/saas/preview/${previewId}/tablet`,
      mobile: `/api/saas/preview/${previewId}/mobile`,
    },
    generatedAt: new Date().toISOString(),
  };
}

export function generatePreviewHtml(theme: WhiteLabelTheme): string {
  const css = generateCssString(theme);
  const primaryBg = theme.colors.primary[600];
  const primaryText = '#FFFFFF';
  const cardBg = '#FFFFFF';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Brand Preview - ${theme.name}</title>
  <style>
    ${css}
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: var(--font-body); background: #F9FAFB; }
    .preview-nav { height: var(--nav-height); background: var(--nav-bg, ${theme.components.navigation.background}); display: flex; align-items: center; padding: 0 24px; ${theme.components.navigation.borderBottom ? 'border-bottom: 1px solid #E5E7EB;' : ''} }
    .preview-nav .logo { font-family: var(--font-heading); font-size: 1.25rem; font-weight: 700; color: var(--color-primary-700); }
    .preview-hero { background: ${primaryBg}; color: ${primaryText}; padding: 80px 24px; text-align: center; }
    .preview-hero h1 { font-family: var(--font-heading); font-size: var(--text-4xl); margin-bottom: 16px; }
    .preview-hero p { font-size: var(--text-lg); opacity: 0.8; max-width: 600px; margin: 0 auto 32px; }
    .preview-btn { display: inline-block; background: ${cardBg}; color: ${primaryBg}; padding: var(--btn-py) var(--btn-px); border-radius: var(--btn-radius); font-size: var(--btn-font-size); font-weight: var(--btn-font-weight); text-transform: var(--btn-text-transform); box-shadow: var(--btn-shadow); text-decoration: none; }
    .preview-cards { padding: 48px 24px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; max-width: 960px; margin: 0 auto; }
    .preview-card { background: ${cardBg}; border-radius: var(--card-radius); border: var(--card-border-width) solid var(--card-border-color); box-shadow: var(--card-shadow); padding: var(--card-padding); }
    .preview-card h3 { font-family: var(--font-heading); color: var(--color-primary-800); margin-bottom: 8px; }
    .preview-card p { font-size: var(--text-sm); color: var(--color-neutral-500); line-height: var(--leading-relaxed); }
    .preview-input { width: 100%; padding: var(--input-py) var(--input-px); border-radius: var(--input-radius); border: var(--input-border-width) solid var(--input-border-color); font-size: var(--input-font-size); font-family: var(--font-body); margin-top: 16px; outline: none; }
  </style>
</head>
<body>
  <nav class="preview-nav">
    <div class="logo">${theme.name}</div>
  </nav>
  <section class="preview-hero">
    <h1>Welcome to ${theme.name}</h1>
    <p>This is a preview of your branded experience. Colors, typography, and components reflect your theme configuration.</p>
    <a href="#" class="preview-btn">Get Started</a>
  </section>
  <section class="preview-cards">
    <div class="preview-card">
      <h3>Dashboard</h3>
      <p>Your operations command center with real-time metrics, AI insights, and team performance tracking.</p>
    </div>
    <div class="preview-card">
      <h3>Analytics</h3>
      <p>Revenue trends, client engagement, and predictive intelligence to inform every decision.</p>
    </div>
    <div class="preview-card">
      <h3>Automation</h3>
      <p>Smart follow-ups, scheduling optimization, and AI-driven workflows running in the background.</p>
      <input class="preview-input" type="text" placeholder="Search features..." />
    </div>
  </section>
</body>
</html>`;
}

// =============================================================================
// Theme Validation
// =============================================================================

export function validateTheme(theme: WhiteLabelTheme): ThemeValidationResult {
  const warnings: ThemeWarning[] = [];
  const errors: ThemeError[] = [];

  // Validate colors exist and are valid hex
  const colorGroups = ['primary', 'secondary', 'accent', 'neutral'] as const;
  for (const group of colorGroups) {
    const shades = theme.colors[group];
    for (const [shade, value] of Object.entries(shades)) {
      if (!hexToRgb(value as string)) {
        errors.push({ field: `colors.${group}.${shade}`, message: `Invalid hex color: ${value}` });
      }
    }
  }

  // Check contrast ratios for primary text on backgrounds
  const bgContrast = checkContrastRatio(theme.colors.primary[900], '#FFFFFF');
  if (!bgContrast.aa) {
    warnings.push({
      field: 'colors.primary.900',
      message: `Primary dark text on white fails AA contrast (${bgContrast.ratio}:1)`,
      suggestion: 'Use a darker shade for text on white backgrounds',
    });
  }

  const btnContrast = checkContrastRatio('#FFFFFF', theme.colors.primary[600]);
  if (!btnContrast.aa) {
    warnings.push({
      field: 'colors.primary.600',
      message: `White text on primary-600 fails AA contrast (${btnContrast.ratio}:1)`,
      suggestion: 'Use a darker primary-600 or consider dark text on buttons',
    });
  }

  // Validate typography
  if (!theme.typography.headingFamily || theme.typography.headingFamily.length < 2) {
    errors.push({ field: 'typography.headingFamily', message: 'Heading font family is required' });
  }
  if (!theme.typography.bodyFamily || theme.typography.bodyFamily.length < 2) {
    errors.push({ field: 'typography.bodyFamily', message: 'Body font family is required' });
  }

  // Validate logos
  if (!theme.logos.primary) {
    warnings.push({
      field: 'logos.primary',
      message: 'No primary logo set',
      suggestion: 'Upload a primary logo for consistent branding across the platform',
    });
  }
  if (!theme.logos.favicon) {
    warnings.push({
      field: 'logos.favicon',
      message: 'No favicon set',
      suggestion: 'Upload a favicon for browser tab branding',
    });
  }

  // Validate component variants have reasonable values
  const radiusPattern = /^\d+(\.\d+)?(rem|px|em)$/;
  if (!radiusPattern.test(theme.components.buttons.borderRadius)) {
    errors.push({
      field: 'components.buttons.borderRadius',
      message: 'Button border radius must be a valid CSS length (e.g., 0.5rem, 8px)',
    });
  }

  // Semantic color validation
  for (const [key, value] of Object.entries(theme.colors.semantic)) {
    if (!hexToRgb(value)) {
      errors.push({ field: `colors.semantic.${key}`, message: `Invalid semantic color: ${value}` });
    }
  }

  return {
    valid: errors.length === 0,
    warnings,
    errors,
  };
}

// =============================================================================
// Default Theme Library
// =============================================================================

export function getDefaultTheme(
  preset: ThemePreset,
  tenantId: string,
  tenantName: string
): WhiteLabelTheme {
  const presetConfigs: Record<ThemePreset, { primary: string; secondary: string; accent: string; headingFont: string; bodyFont: string }> = {
    medical: {
      primary: '#1E40AF',
      secondary: '#0D9488',
      accent: '#F59E0B',
      headingFont: 'Inter',
      bodyFont: 'Inter',
    },
    wellness: {
      primary: '#059669',
      secondary: '#8B5CF6',
      accent: '#F97316',
      headingFont: 'Lora',
      bodyFont: 'Poppins',
    },
    luxury: {
      primary: '#0F1D2C',
      secondary: '#C9A96E',
      accent: '#F3D6BE',
      headingFont: 'Playfair Display',
      bodyFont: 'Montserrat',
    },
    modern: {
      primary: '#4F46E5',
      secondary: '#06B6D4',
      accent: '#EC4899',
      headingFont: 'DM Sans',
      bodyFont: 'DM Sans',
    },
    minimal: {
      primary: '#1F2937',
      secondary: '#6B7280',
      accent: '#3B82F6',
      headingFont: 'Work Sans',
      bodyFont: 'Work Sans',
    },
  };

  const config = presetConfigs[preset];
  const colors = generateColorPalette(config.primary, config.secondary, config.accent);
  const typography = createTypographyConfig(config.headingFont, config.bodyFont);
  const components = createComponentVariants(preset);
  const logos = createDefaultLogoSet(tenantName);

  const theme: WhiteLabelTheme = {
    id: `theme-${tenantId}-${preset}`,
    tenantId,
    name: tenantName,
    preset,
    colors,
    typography,
    logos,
    components,
    email: createEmailBranding(
      { colors, typography, logos, components } as WhiteLabelTheme,
      tenantName
    ),
    pdf: createPdfBranding(
      { colors, typography, logos, components } as WhiteLabelTheme,
      tenantName
    ),
    customCss: '',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Fix email and PDF branding now that we have the full theme
  theme.email = createEmailBranding(theme, tenantName);
  theme.pdf = createPdfBranding(theme, tenantName);

  return theme;
}

export function getAvailablePresets(): Array<{
  preset: ThemePreset;
  name: string;
  description: string;
  primaryColor: string;
}> {
  return [
    {
      preset: 'medical',
      name: 'Medical',
      description: 'Clean, professional, and trustworthy. Ideal for medical practices and clinical settings.',
      primaryColor: '#1E40AF',
    },
    {
      preset: 'wellness',
      name: 'Wellness',
      description: 'Warm, calming, and organic. Perfect for wellness centers, spas, and holistic practices.',
      primaryColor: '#059669',
    },
    {
      preset: 'luxury',
      name: 'Luxury',
      description: 'Sophisticated, premium, and exclusive. Built for high-end medspas and boutique clinics.',
      primaryColor: '#0F1D2C',
    },
    {
      preset: 'Modern',
      name: 'Modern',
      description: 'Bold, vibrant, and tech-forward. Great for innovative practices pushing boundaries.',
      primaryColor: '#4F46E5',
    },
    {
      preset: 'minimal',
      name: 'Minimal',
      description: 'Simple, understated, and focused. Let the content speak with minimal visual distraction.',
      primaryColor: '#1F2937',
    },
  ];
}

// =============================================================================
// Theme Merge Utility
// =============================================================================

export function mergeThemeOverrides(
  base: WhiteLabelTheme,
  overrides: Partial<WhiteLabelTheme>
): WhiteLabelTheme {
  const merged = { ...base };

  if (overrides.colors) {
    merged.colors = {
      primary: overrides.colors.primary || base.colors.primary,
      secondary: overrides.colors.secondary || base.colors.secondary,
      accent: overrides.colors.accent || base.colors.accent,
      neutral: overrides.colors.neutral || base.colors.neutral,
      semantic: { ...base.colors.semantic, ...overrides.colors.semantic },
    };
  }

  if (overrides.typography) {
    merged.typography = { ...base.typography, ...overrides.typography };
  }

  if (overrides.logos) {
    merged.logos = { ...base.logos, ...overrides.logos };
  }

  if (overrides.components) {
    merged.components = {
      buttons: { ...base.components.buttons, ...overrides.components.buttons },
      cards: { ...base.components.cards, ...overrides.components.cards },
      inputs: { ...base.components.inputs, ...overrides.components.inputs },
      navigation: { ...base.components.navigation, ...overrides.components.navigation },
    };
  }

  if (overrides.email) {
    merged.email = { ...base.email, ...overrides.email };
  }

  if (overrides.pdf) {
    merged.pdf = { ...base.pdf, ...overrides.pdf };
  }

  if (overrides.customCss !== undefined) {
    merged.customCss = overrides.customCss;
  }

  merged.updatedAt = new Date().toISOString();

  return merged;
}

// =============================================================================
// Color Suggestion Engine
// =============================================================================

export function suggestComplementaryColors(primaryHex: string): {
  secondary: string[];
  accent: string[];
} {
  const rgb = hexToRgb(primaryHex);
  if (!rgb) return { secondary: [], accent: [] };

  const { h, s } = rgbToHsl(rgb.r, rgb.g, rgb.b);

  const secondaryOptions = [
    (h + 30) % 360,
    (h + 60) % 360,
    (h + 330) % 360,
  ].map((hue) => {
    const { r, g, b } = hslToRgb(hue, Math.min(s, 60), 45);
    return rgbToHex(r, g, b);
  });

  const accentOptions = [
    (h + 180) % 360,
    (h + 150) % 360,
    (h + 210) % 360,
    (h + 120) % 360,
  ].map((hue) => {
    const { r, g, b } = hslToRgb(hue, Math.max(s, 50), 55);
    return rgbToHex(r, g, b);
  });

  return {
    secondary: secondaryOptions,
    accent: accentOptions,
  };
}

// =============================================================================
// Export theme as Tailwind config snippet
// =============================================================================

export function generateTailwindExtend(theme: WhiteLabelTheme): Record<string, unknown> {
  return {
    colors: {
      brand: {
        primary: theme.colors.primary,
        secondary: theme.colors.secondary,
        accent: theme.colors.accent,
      },
    },
    fontFamily: {
      heading: [`'${theme.typography.headingFamily}'`, 'serif'],
      body: [`'${theme.typography.bodyFamily}'`, 'sans-serif'],
      mono: [`'${theme.typography.monoFamily}'`, 'monospace'],
    },
    borderRadius: {
      btn: theme.components.buttons.borderRadius,
      card: theme.components.cards.borderRadius,
      input: theme.components.inputs.borderRadius,
    },
  };
}
