/**
 * RaniOS White-Label Branding System
 *
 * Custom domain support, logo/color/font customization,
 * email template branding, login page, PWA manifest,
 * custom CSS injection, brand preview.
 */

import { z } from 'zod';

// ─── Types ────────────────────────────────────────────────────────

export type DomainStatus = 'pending' | 'verifying' | 'active' | 'failed' | 'expired';

export type ThemeMode = 'light' | 'dark' | 'auto';

export type FontFamily =
  | 'Inter'
  | 'Playfair Display'
  | 'Montserrat'
  | 'Poppins'
  | 'Lato'
  | 'Roboto'
  | 'Open Sans'
  | 'Raleway'
  | 'Merriweather'
  | 'Source Sans Pro'
  | 'Nunito'
  | 'DM Sans';

export interface BrandConfig {
  tenantId: string;
  published: boolean;
  publishedAt: number | null;
  lastModified: number;
  modifiedBy: string;

  // Domain
  customDomain: CustomDomain | null;

  // Logo
  logo: LogoConfig;

  // Colors
  colors: ColorTheme;

  // Typography
  typography: TypographyConfig;

  // Login Page
  loginPage: LoginPageConfig;

  // Email
  emailBranding: EmailBrandingConfig;

  // PWA
  pwa: PwaConfig;

  // Custom CSS
  customCss: CustomCssConfig;

  // Meta
  metadata: BrandMetadata;
}

export interface CustomDomain {
  domain: string;
  status: DomainStatus;
  cnameTarget: string;
  cnameVerified: boolean;
  sslStatus: 'pending' | 'active' | 'failed';
  verifiedAt: number | null;
  createdAt: number;
  lastCheckedAt: number;
}

export interface LogoConfig {
  primary: string | null; // URL
  icon: string | null; // square icon URL
  favicon: string | null;
  darkMode: string | null; // logo variant for dark backgrounds
  maxHeight: number; // pixels
}

export interface ColorTheme {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  warning: string;
  success: string;
  info: string;
}

export interface TypographyConfig {
  headingFont: FontFamily;
  bodyFont: FontFamily;
  headingWeight: number;
  bodyWeight: number;
  baseFontSize: number;
  lineHeight: number;
}

export interface LoginPageConfig {
  backgroundImage: string | null;
  backgroundGradient: string | null;
  tagline: string;
  showPoweredBy: boolean;
  customContent: string | null;
  layout: 'centered' | 'split' | 'minimal';
}

export interface EmailBrandingConfig {
  headerLogo: string | null;
  headerBackground: string;
  footerText: string;
  socialLinks: { platform: string; url: string }[];
  primaryButtonColor: string;
  primaryButtonTextColor: string;
  fontFamily: string;
  accentColor: string;
}

export interface PwaConfig {
  appName: string;
  shortName: string;
  description: string;
  themeColor: string;
  backgroundColor: string;
  icon192: string | null;
  icon512: string | null;
  startUrl: string;
  display: 'standalone' | 'fullscreen' | 'minimal-ui' | 'browser';
}

export interface CustomCssConfig {
  enabled: boolean;
  css: string;
  sanitized: boolean;
  lastValidated: number | null;
  warnings: string[];
}

export interface BrandMetadata {
  clinicName: string;
  tagline: string;
  description: string;
  phone: string;
  email: string;
  address: string;
  website: string;
  socialMedia: Record<string, string>;
}

export interface BrandPreview {
  tenantId: string;
  previewUrl: string;
  generatedAt: number;
  expiresAt: number;
  config: BrandConfig;
}

export interface CssValidationResult {
  valid: boolean;
  warnings: string[];
  errors: string[];
  sanitizedCss: string;
}

// ─── Schemas ──────────────────────────────────────────────────────

export const UpdateBrandSchema = z.object({
  tenantId: z.string().min(1),
  modifiedBy: z.string().min(1),
  logo: z.object({
    primary: z.string().url().nullable().optional(),
    icon: z.string().url().nullable().optional(),
    favicon: z.string().url().nullable().optional(),
    darkMode: z.string().url().nullable().optional(),
    maxHeight: z.number().min(20).max(200).optional(),
  }).optional(),
  colors: z.object({
    primary: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    primaryLight: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    primaryDark: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    secondary: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    accent: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    background: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    surface: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    text: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    textSecondary: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    border: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  }).optional(),
  typography: z.object({
    headingFont: z.string().optional(),
    bodyFont: z.string().optional(),
    headingWeight: z.number().min(100).max(900).optional(),
    bodyWeight: z.number().min(100).max(900).optional(),
    baseFontSize: z.number().min(12).max(24).optional(),
    lineHeight: z.number().min(1).max(2.5).optional(),
  }).optional(),
  loginPage: z.object({
    tagline: z.string().max(200).optional(),
    showPoweredBy: z.boolean().optional(),
    layout: z.enum(['centered', 'split', 'minimal']).optional(),
  }).optional(),
  metadata: z.object({
    clinicName: z.string().optional(),
    tagline: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    address: z.string().optional(),
  }).optional(),
});

export const SetupDomainSchema = z.object({
  tenantId: z.string().min(1),
  domain: z.string().min(1).regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/i, 'Invalid domain format'),
});

// ─── Constants ────────────────────────────────────────────────────

export const AVAILABLE_FONTS: { name: FontFamily; category: string; googleUrl: string }[] = [
  { name: 'Inter', category: 'Sans-Serif', googleUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap' },
  { name: 'Playfair Display', category: 'Serif', googleUrl: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&display=swap' },
  { name: 'Montserrat', category: 'Sans-Serif', googleUrl: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap' },
  { name: 'Poppins', category: 'Sans-Serif', googleUrl: 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap' },
  { name: 'Lato', category: 'Sans-Serif', googleUrl: 'https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&display=swap' },
  { name: 'Roboto', category: 'Sans-Serif', googleUrl: 'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap' },
  { name: 'Open Sans', category: 'Sans-Serif', googleUrl: 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700&display=swap' },
  { name: 'Raleway', category: 'Sans-Serif', googleUrl: 'https://fonts.googleapis.com/css2?family=Raleway:wght@300;400;500;600;700&display=swap' },
  { name: 'Merriweather', category: 'Serif', googleUrl: 'https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;700&display=swap' },
  { name: 'Source Sans Pro', category: 'Sans-Serif', googleUrl: 'https://fonts.googleapis.com/css2?family=Source+Sans+Pro:wght@300;400;600;700&display=swap' },
  { name: 'Nunito', category: 'Sans-Serif', googleUrl: 'https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;500;600;700&display=swap' },
  { name: 'DM Sans', category: 'Sans-Serif', googleUrl: 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap' },
];

const DEFAULT_COLORS: ColorTheme = {
  primary: '#C9A96E',
  primaryLight: '#D4BC8E',
  primaryDark: '#A88A4E',
  secondary: '#0F1D2C',
  accent: '#E8D5B5',
  background: '#FFFFFF',
  surface: '#F8F6F1',
  text: '#0F1D2C',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  error: '#EF4444',
  warning: '#F59E0B',
  success: '#10B981',
  info: '#3B82F6',
};

const CSS_FORBIDDEN_PATTERNS = [
  /position\s*:\s*fixed/gi,
  /@import/gi,
  /javascript\s*:/gi,
  /expression\s*\(/gi,
  /url\s*\(\s*['"]?\s*javascript/gi,
  /-moz-binding/gi,
  /behavior\s*:/gi,
];

// ─── In-Memory Store ──────────────────────────────────────────────

const brandConfigs = new Map<string, BrandConfig>();
const previews = new Map<string, BrandPreview>();

// ─── Brand Config Management ──────────────────────────────────────

export function getBrandConfig(tenantId: string): BrandConfig {
  return brandConfigs.get(tenantId) || getDefaultBrandConfig(tenantId);
}

export function updateBrandConfig(
  tenantId: string,
  updates: Partial<BrandConfig>,
  modifiedBy: string,
): BrandConfig {
  const current = getBrandConfig(tenantId);

  const updated: BrandConfig = {
    ...current,
    ...updates,
    logo: updates.logo ? { ...current.logo, ...updates.logo } : current.logo,
    colors: updates.colors ? { ...current.colors, ...updates.colors } : current.colors,
    typography: updates.typography ? { ...current.typography, ...updates.typography } : current.typography,
    loginPage: updates.loginPage ? { ...current.loginPage, ...updates.loginPage } : current.loginPage,
    emailBranding: updates.emailBranding ? { ...current.emailBranding, ...updates.emailBranding } : current.emailBranding,
    pwa: updates.pwa ? { ...current.pwa, ...updates.pwa } : current.pwa,
    metadata: updates.metadata ? { ...current.metadata, ...updates.metadata } : current.metadata,
    lastModified: Date.now(),
    modifiedBy,
  };

  brandConfigs.set(tenantId, updated);
  return updated;
}

export function publishBrand(tenantId: string, publishedBy: string): BrandConfig | null {
  const config = brandConfigs.get(tenantId);
  if (!config) return null;

  config.published = true;
  config.publishedAt = Date.now();
  config.modifiedBy = publishedBy;

  return config;
}

export function unpublishBrand(tenantId: string): boolean {
  const config = brandConfigs.get(tenantId);
  if (!config) return false;

  config.published = false;
  return true;
}

function getDefaultBrandConfig(tenantId: string): BrandConfig {
  return {
    tenantId,
    published: false,
    publishedAt: null,
    lastModified: Date.now(),
    modifiedBy: 'system',
    customDomain: null,
    logo: {
      primary: null,
      icon: null,
      favicon: null,
      darkMode: null,
      maxHeight: 48,
    },
    colors: { ...DEFAULT_COLORS },
    typography: {
      headingFont: 'Playfair Display',
      bodyFont: 'Montserrat',
      headingWeight: 600,
      bodyWeight: 400,
      baseFontSize: 16,
      lineHeight: 1.6,
    },
    loginPage: {
      backgroundImage: null,
      backgroundGradient: 'linear-gradient(135deg, #0F1D2C 0%, #1a2d3d 100%)',
      tagline: 'Intelligent Clinic Management',
      showPoweredBy: true,
      customContent: null,
      layout: 'centered',
    },
    emailBranding: {
      headerLogo: null,
      headerBackground: DEFAULT_COLORS.primary,
      footerText: 'Powered by RaniOS',
      socialLinks: [],
      primaryButtonColor: DEFAULT_COLORS.primary,
      primaryButtonTextColor: '#FFFFFF',
      fontFamily: 'Montserrat, sans-serif',
      accentColor: DEFAULT_COLORS.accent,
    },
    pwa: {
      appName: 'RaniOS Dashboard',
      shortName: 'RaniOS',
      description: 'AI-Powered Clinic Management',
      themeColor: DEFAULT_COLORS.primary,
      backgroundColor: DEFAULT_COLORS.background,
      icon192: null,
      icon512: null,
      startUrl: '/dashboard',
      display: 'standalone',
    },
    customCss: {
      enabled: false,
      css: '',
      sanitized: true,
      lastValidated: null,
      warnings: [],
    },
    metadata: {
      clinicName: '',
      tagline: '',
      description: '',
      phone: '',
      email: '',
      address: '',
      website: '',
      socialMedia: {},
    },
  };
}

// ─── Custom Domain ────────────────────────────────────────────────

export function setupCustomDomain(tenantId: string, domain: string): CustomDomain {
  const cnameTarget = `${tenantId}.cname.ranios.com`;

  const customDomain: CustomDomain = {
    domain,
    status: 'pending',
    cnameTarget,
    cnameVerified: false,
    sslStatus: 'pending',
    verifiedAt: null,
    createdAt: Date.now(),
    lastCheckedAt: Date.now(),
  };

  const config = getBrandConfig(tenantId);
  config.customDomain = customDomain;
  brandConfigs.set(tenantId, config);

  return customDomain;
}

export function verifyDomain(tenantId: string): CustomDomain | null {
  const config = brandConfigs.get(tenantId);
  if (!config?.customDomain) return null;

  // Simulate DNS verification
  config.customDomain.lastCheckedAt = Date.now();
  config.customDomain.status = 'verifying';

  // In production, would check DNS CNAME record
  // For now, simulate verification after creation
  if (Date.now() - config.customDomain.createdAt > 5000) {
    config.customDomain.cnameVerified = true;
    config.customDomain.sslStatus = 'active';
    config.customDomain.status = 'active';
    config.customDomain.verifiedAt = Date.now();
  }

  return config.customDomain;
}

export function removeDomain(tenantId: string): boolean {
  const config = brandConfigs.get(tenantId);
  if (!config) return false;
  config.customDomain = null;
  config.lastModified = Date.now();
  return true;
}

// ─── Custom CSS ───────────────────────────────────────────────────

export function validateCustomCss(css: string): CssValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Check for forbidden patterns
  for (const pattern of CSS_FORBIDDEN_PATTERNS) {
    if (pattern.test(css)) {
      errors.push(`Forbidden CSS pattern detected: ${pattern.source}`);
    }
  }

  // Size check
  if (css.length > 50000) {
    errors.push('Custom CSS exceeds maximum size of 50KB');
  }

  // Check for !important overuse
  const importantCount = (css.match(/!important/g) || []).length;
  if (importantCount > 10) {
    warnings.push(`Excessive use of !important (${importantCount} instances)`);
  }

  // Sandbox: prefix all selectors with tenant container
  const sanitizedCss = css.length > 0 && errors.length === 0
    ? `.tenant-custom { ${css} }`
    : '';

  return {
    valid: errors.length === 0,
    warnings,
    errors,
    sanitizedCss,
  };
}

export function updateCustomCss(tenantId: string, css: string): CssValidationResult {
  const validation = validateCustomCss(css);
  const config = getBrandConfig(tenantId);

  config.customCss = {
    enabled: validation.valid && css.length > 0,
    css: validation.valid ? css : config.customCss.css,
    sanitized: validation.valid,
    lastValidated: Date.now(),
    warnings: validation.warnings,
  };

  brandConfigs.set(tenantId, config);
  return validation;
}

// ─── CSS Generation ───────────────────────────────────────────────

export function generateCssVariables(config: BrandConfig): string {
  const { colors, typography } = config;

  return `:root {
  /* Colors */
  --brand-primary: ${colors.primary};
  --brand-primary-light: ${colors.primaryLight};
  --brand-primary-dark: ${colors.primaryDark};
  --brand-secondary: ${colors.secondary};
  --brand-accent: ${colors.accent};
  --brand-background: ${colors.background};
  --brand-surface: ${colors.surface};
  --brand-text: ${colors.text};
  --brand-text-secondary: ${colors.textSecondary};
  --brand-border: ${colors.border};
  --brand-error: ${colors.error};
  --brand-warning: ${colors.warning};
  --brand-success: ${colors.success};
  --brand-info: ${colors.info};

  /* Typography */
  --font-heading: '${typography.headingFont}', serif;
  --font-body: '${typography.bodyFont}', sans-serif;
  --font-weight-heading: ${typography.headingWeight};
  --font-weight-body: ${typography.bodyWeight};
  --font-size-base: ${typography.baseFontSize}px;
  --line-height-base: ${typography.lineHeight};
}`;
}

export function generatePwaManifest(config: BrandConfig): Record<string, unknown> {
  const { pwa, metadata } = config;

  return {
    name: pwa.appName || metadata.clinicName || 'RaniOS Dashboard',
    short_name: pwa.shortName || 'RaniOS',
    description: pwa.description || metadata.description || 'AI-Powered Clinic Management',
    start_url: pwa.startUrl,
    display: pwa.display,
    theme_color: pwa.themeColor,
    background_color: pwa.backgroundColor,
    icons: [
      ...(pwa.icon192 ? [{ src: pwa.icon192, sizes: '192x192', type: 'image/png' }] : []),
      ...(pwa.icon512 ? [{ src: pwa.icon512, sizes: '512x512', type: 'image/png' }] : []),
    ],
  };
}

export function generateEmailHeader(config: BrandConfig): string {
  const { emailBranding, logo, metadata } = config;

  return `<div style="background: ${emailBranding.headerBackground}; padding: 24px; text-align: center;">
  ${logo.primary ? `<img src="${logo.primary}" alt="${metadata.clinicName}" style="max-height: 48px; margin: 0 auto;" />` : `<h1 style="color: #ffffff; font-family: ${emailBranding.fontFamily}; margin: 0;">${metadata.clinicName || 'Your Clinic'}</h1>`}
</div>`;
}

export function generateEmailFooter(config: BrandConfig): string {
  const { emailBranding, metadata } = config;

  const socialHtml = emailBranding.socialLinks
    .map(s => `<a href="${s.url}" style="color: ${emailBranding.accentColor}; text-decoration: none; margin: 0 8px;">${s.platform}</a>`)
    .join('');

  return `<div style="padding: 24px; text-align: center; color: #6B7280; font-family: ${emailBranding.fontFamily}; font-size: 12px;">
  ${socialHtml ? `<div style="margin-bottom: 12px;">${socialHtml}</div>` : ''}
  <p>${metadata.address || ''}</p>
  <p>${emailBranding.footerText}</p>
</div>`;
}

// ─── Brand Preview ────────────────────────────────────────────────

export function generatePreview(tenantId: string): BrandPreview {
  const config = getBrandConfig(tenantId);
  const previewId = `preview_${Date.now().toString(36)}`;

  const preview: BrandPreview = {
    tenantId,
    previewUrl: `/api/saas/branding/preview/${previewId}`,
    generatedAt: Date.now(),
    expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour
    config,
  };

  previews.set(previewId, preview);
  return preview;
}

export function getPreview(previewId: string): BrandPreview | null {
  const preview = previews.get(previewId);
  if (preview && preview.expiresAt < Date.now()) {
    previews.delete(previewId);
    return null;
  }
  return preview || null;
}

// ─── Color Utilities ──────────────────────────────────────────────

export function generateColorPalette(primaryColor: string): Partial<ColorTheme> {
  // Generate complementary colors from a primary
  const hex = primaryColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  const lighten = (c: number, pct: number) => Math.min(255, Math.round(c + (255 - c) * pct));
  const darken = (c: number, pct: number) => Math.round(c * (1 - pct));
  const toHex = (rr: number, gg: number, bb: number) =>
    `#${rr.toString(16).padStart(2, '0')}${gg.toString(16).padStart(2, '0')}${bb.toString(16).padStart(2, '0')}`;

  return {
    primary: primaryColor,
    primaryLight: toHex(lighten(r, 0.3), lighten(g, 0.3), lighten(b, 0.3)),
    primaryDark: toHex(darken(r, 0.2), darken(g, 0.2), darken(b, 0.2)),
    accent: toHex(lighten(r, 0.5), lighten(g, 0.5), lighten(b, 0.5)),
  };
}

export function getContrastColor(hexColor: string): string {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

// ─── Reset (for testing) ──────────────────────────────────────────

export function resetBranding(): void {
  brandConfigs.clear();
  previews.clear();
}
