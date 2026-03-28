// =============================================================================
// RaniOS White-Label Types
// =============================================================================

export type ThemePreset = 'medical' | 'wellness' | 'luxury' | 'modern' | 'minimal';

export interface ColorShade {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
}

export interface ColorPalette {
  primary: ColorShade;
  secondary: ColorShade;
  accent: ColorShade;
  neutral: ColorShade;
  semantic: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };
}

export interface TypographyConfig {
  headingFamily: string;
  bodyFamily: string;
  monoFamily: string;
  scale: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
    '5xl': string;
  };
  weights: {
    light: number;
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
  lineHeights: {
    tight: string;
    snug: string;
    normal: string;
    relaxed: string;
    loose: string;
  };
}

export interface LogoSet {
  primary: string;
  icon: string;
  favicon: string;
  darkMode: string;
  emailHeader: string;
  width: number;
  height: number;
}

export interface ComponentVariants {
  buttons: {
    borderRadius: string;
    paddingX: string;
    paddingY: string;
    fontSize: string;
    fontWeight: number;
    textTransform: 'none' | 'uppercase' | 'capitalize';
    shadow: string;
  };
  cards: {
    borderRadius: string;
    borderWidth: string;
    borderColor: string;
    shadow: string;
    padding: string;
  };
  inputs: {
    borderRadius: string;
    borderWidth: string;
    borderColor: string;
    focusRingColor: string;
    paddingX: string;
    paddingY: string;
    fontSize: string;
  };
  navigation: {
    style: 'fixed' | 'sticky' | 'relative';
    background: string;
    blur: boolean;
    height: string;
    borderBottom: boolean;
  };
}

export interface EmailBranding {
  headerLogo: string;
  headerBackground: string;
  headerTextColor: string;
  bodyBackground: string;
  bodyTextColor: string;
  footerBackground: string;
  footerTextColor: string;
  accentColor: string;
  buttonColor: string;
  buttonTextColor: string;
  fontFamily: string;
  footerLinks: Array<{ label: string; url: string }>;
  socialLinks: Array<{ platform: string; url: string; icon: string }>;
  companyName: string;
  companyAddress: string;
  unsubscribeUrl: string;
}

export interface PdfBranding {
  logo: string;
  primaryColor: string;
  secondaryColor: string;
  headerFont: string;
  bodyFont: string;
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyWebsite: string;
  watermark: boolean;
  watermarkText: string;
  footerText: string;
}

export interface WhiteLabelTheme {
  id: string;
  tenantId: string;
  name: string;
  preset: ThemePreset;
  colors: ColorPalette;
  typography: TypographyConfig;
  logos: LogoSet;
  components: ComponentVariants;
  email: EmailBranding;
  pdf: PdfBranding;
  customCss: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ContrastResult {
  ratio: number;
  aa: boolean;
  aaLarge: boolean;
  aaa: boolean;
  aaaLarge: boolean;
}

export interface ThemeValidationResult {
  valid: boolean;
  warnings: ThemeWarning[];
  errors: ThemeError[];
}

export interface ThemeWarning {
  field: string;
  message: string;
  suggestion: string;
}

export interface ThemeError {
  field: string;
  message: string;
}

export interface CssVariableMap {
  [key: string]: string;
}

export interface BrandPreview {
  theme: WhiteLabelTheme;
  previewUrl: string;
  screenshots: {
    desktop: string;
    tablet: string;
    mobile: string;
  };
  generatedAt: string;
}

// Domain management types

export type DomainStatus =
  | 'pending_verification'
  | 'verifying'
  | 'verified'
  | 'active'
  | 'failed'
  | 'expired'
  | 'suspended';

export type SslStatus =
  | 'pending'
  | 'provisioning'
  | 'active'
  | 'renewal_pending'
  | 'expired'
  | 'error';

export type DnsRecordType = 'CNAME' | 'A' | 'AAAA' | 'TXT' | 'MX';

export interface DnsRecord {
  type: DnsRecordType;
  name: string;
  value: string;
  ttl: number;
  priority?: number;
  verified: boolean;
}

export interface DomainConfig {
  id: string;
  tenantId: string;
  subdomain: string;
  customDomain: string | null;
  status: DomainStatus;
  sslStatus: SslStatus;
  sslExpiresAt: string | null;
  dnsRecords: DnsRecord[];
  vanityUrls: VanityUrl[];
  healthCheck: DomainHealthCheck;
  routingConfig: DomainRouting;
  createdAt: string;
  updatedAt: string;
}

export interface VanityUrl {
  id: string;
  slug: string;
  targetPath: string;
  isActive: boolean;
  createdAt: string;
}

export interface DomainHealthCheck {
  lastChecked: string;
  httpStatus: number | null;
  sslValid: boolean;
  dnsResolved: boolean;
  responseTimeMs: number | null;
  issues: string[];
}

export interface DomainRouting {
  defaultPath: string;
  redirectRules: RedirectRule[];
  customHeaders: Record<string, string>;
  cors: CorsConfig;
}

export interface RedirectRule {
  from: string;
  to: string;
  statusCode: 301 | 302 | 307 | 308;
  isActive: boolean;
}

export interface CorsConfig {
  allowedOrigins: string[];
  allowedMethods: string[];
  allowedHeaders: string[];
  maxAge: number;
}
