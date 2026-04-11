/**
 * White-Label Branding Tests — 30+ tests
 */

import {
  getBrandConfig, updateBrandConfig, publishBrand, unpublishBrand,
  setupCustomDomain, verifyDomain, removeDomain,
  validateCustomCss, updateCustomCss,
  generateCssVariables, generatePwaManifest,
  generateEmailHeader, generateEmailFooter,
  generatePreview, getPreview,
  generateColorPalette, getContrastColor,
  AVAILABLE_FONTS,
  resetBranding,
} from '../white-label/branding';

beforeEach(() => {
  resetBranding();
});

describe('getBrandConfig', () => {
  it('returns default config for new tenant', () => {
    const config = getBrandConfig('t_new');
    expect(config.tenantId).toBe('t_new');
    expect(config.published).toBe(false);
    expect(config.colors.primary).toBe('#C9A96E');
  });

  it('default has Playfair + Montserrat fonts', () => {
    const config = getBrandConfig('t_new');
    expect(config.typography.headingFont).toBe('Playfair Display');
    expect(config.typography.bodyFont).toBe('Montserrat');
  });

  it('default login is centered layout', () => {
    const config = getBrandConfig('t_new');
    expect(config.loginPage.layout).toBe('centered');
    expect(config.loginPage.showPoweredBy).toBe(true);
  });
});

describe('updateBrandConfig', () => {
  it('updates colors', () => {
    updateBrandConfig('t_001', { colors: { primary: '#FF0000' } as never }, 'admin');
    const config = getBrandConfig('t_001');
    expect(config.colors.primary).toBe('#FF0000');
    // Other colors should remain default
    expect(config.colors.secondary).toBe('#0F1D2C');
  });

  it('updates typography', () => {
    updateBrandConfig('t_001', { typography: { headingFont: 'Inter' } as never }, 'admin');
    expect(getBrandConfig('t_001').typography.headingFont).toBe('Inter');
  });

  it('updates clinic name', () => {
    updateBrandConfig('t_001', { metadata: { clinicName: 'Glow Medical Spa' } as never }, 'admin');
    expect(getBrandConfig('t_001').metadata.clinicName).toBe('Glow Medical Spa');
  });

  it('updates login page settings', () => {
    updateBrandConfig('t_001', { loginPage: { layout: 'split', showPoweredBy: false } as never }, 'admin');
    const config = getBrandConfig('t_001');
    expect(config.loginPage.layout).toBe('split');
    expect(config.loginPage.showPoweredBy).toBe(false);
  });

  it('tracks last modified', () => {
    const before = Date.now();
    updateBrandConfig('t_001', { metadata: { clinicName: 'Test' } as never }, 'admin');
    const config = getBrandConfig('t_001');
    expect(config.lastModified).toBeGreaterThanOrEqual(before);
    expect(config.modifiedBy).toBe('admin');
  });
});

describe('publishBrand', () => {
  it('publishes brand config', () => {
    updateBrandConfig('t_001', {}, 'admin');
    const config = publishBrand('t_001', 'admin');
    expect(config).not.toBeNull();
    expect(config!.published).toBe(true);
    expect(config!.publishedAt).not.toBeNull();
  });

  it('returns null for unknown tenant', () => {
    expect(publishBrand('unknown', 'admin')).toBeNull();
  });
});

describe('unpublishBrand', () => {
  it('unpublishes brand', () => {
    updateBrandConfig('t_001', {}, 'admin');
    publishBrand('t_001', 'admin');
    expect(unpublishBrand('t_001')).toBe(true);
    expect(getBrandConfig('t_001').published).toBe(false);
  });
});

describe('custom domain', () => {
  it('sets up custom domain', () => {
    const domain = setupCustomDomain('t_001', 'app.glowmedspa.com');
    expect(domain.domain).toBe('app.glowmedspa.com');
    expect(domain.status).toBe('pending');
    expect(domain.cnameTarget).toContain('t_001');
    expect(domain.cnameTarget).toContain('cname.ranios.com');
  });

  it('stores domain in brand config', () => {
    setupCustomDomain('t_001', 'dashboard.myclinic.com');
    const config = getBrandConfig('t_001');
    expect(config.customDomain).not.toBeNull();
    expect(config.customDomain!.domain).toBe('dashboard.myclinic.com');
  });

  it('verifies domain (simulated)', () => {
    setupCustomDomain('t_001', 'test.domain.com');
    // Verification is time-based in the mock
    const result = verifyDomain('t_001');
    expect(result).not.toBeNull();
    expect(result!.status).toBe('verifying');
  });

  it('removes domain', () => {
    setupCustomDomain('t_001', 'test.domain.com');
    expect(removeDomain('t_001')).toBe(true);
    expect(getBrandConfig('t_001').customDomain).toBeNull();
  });

  it('returns false for removing from unknown tenant', () => {
    expect(removeDomain('unknown')).toBe(false);
  });
});

describe('custom CSS', () => {
  it('validates clean CSS', () => {
    const result = validateCustomCss('.button { color: red; }');
    expect(result.valid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  it('rejects position:fixed', () => {
    const result = validateCustomCss('.overlay { position: fixed; }');
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('rejects @import', () => {
    const result = validateCustomCss('@import url("https://evil.com");');
    expect(result.valid).toBe(false);
  });

  it('rejects javascript:', () => {
    const result = validateCustomCss('div { background: url(javascript:alert(1)); }');
    expect(result.valid).toBe(false);
  });

  it('warns about excessive !important', () => {
    const css = Array(15).fill('.test { color: red !important; }').join('\n');
    const result = validateCustomCss(css);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('rejects CSS over 50KB', () => {
    const css = 'a'.repeat(51000);
    const result = validateCustomCss(css);
    expect(result.valid).toBe(false);
  });

  it('sandboxes CSS with tenant container', () => {
    const result = validateCustomCss('.button { color: blue; }');
    expect(result.sanitizedCss).toContain('.tenant-custom');
  });

  it('updates custom CSS in config', () => {
    updateBrandConfig('t_001', {}, 'admin');
    const result = updateCustomCss('t_001', '.my-class { font-size: 14px; }');
    expect(result.valid).toBe(true);
    expect(getBrandConfig('t_001').customCss.enabled).toBe(true);
  });
});

describe('CSS generation', () => {
  it('generates CSS variables', () => {
    const config = getBrandConfig('t_001');
    const css = generateCssVariables(config);
    expect(css).toContain('--brand-primary: #C9A96E');
    expect(css).toContain('--font-heading');
    expect(css).toContain('--font-body');
    expect(css).toContain(':root');
  });
});

describe('PWA manifest', () => {
  it('generates valid manifest', () => {
    const config = getBrandConfig('t_001');
    const manifest = generatePwaManifest(config);
    expect(manifest.name).toBeDefined();
    expect(manifest.short_name).toBeDefined();
    expect(manifest.start_url).toBe('/dashboard');
    expect(manifest.display).toBe('standalone');
    expect(manifest.theme_color).toBe('#C9A96E');
  });
});

describe('email branding', () => {
  it('generates email header', () => {
    const config = getBrandConfig('t_001');
    const header = generateEmailHeader(config);
    expect(header).toContain('background');
    expect(header).toContain('<div');
  });

  it('generates email footer', () => {
    const config = getBrandConfig('t_001');
    const footer = generateEmailFooter(config);
    expect(footer).toContain('Powered by RaniOS');
  });
});

describe('brand preview', () => {
  it('generates preview', () => {
    updateBrandConfig('t_001', {}, 'admin');
    const preview = generatePreview('t_001');
    expect(preview.previewUrl).toBeDefined();
    expect(preview.expiresAt).toBeGreaterThan(Date.now());
    expect(preview.config).toBeDefined();
  });
});

describe('color utilities', () => {
  it('generates color palette from primary', () => {
    const palette = generateColorPalette('#C9A96E');
    expect(palette.primary).toBe('#C9A96E');
    expect(palette.primaryLight).toBeDefined();
    expect(palette.primaryDark).toBeDefined();
    expect(palette.accent).toBeDefined();
  });

  it('returns white contrast for dark colors', () => {
    expect(getContrastColor('#000000')).toBe('#FFFFFF');
    expect(getContrastColor('#0F1D2C')).toBe('#FFFFFF');
  });

  it('returns black contrast for light colors', () => {
    expect(getContrastColor('#FFFFFF')).toBe('#000000');
    expect(getContrastColor('#F8F6F1')).toBe('#000000');
  });
});

describe('available fonts', () => {
  it('has 12 fonts available', () => {
    expect(AVAILABLE_FONTS.length).toBe(12);
  });

  it('all fonts have Google URLs', () => {
    AVAILABLE_FONTS.forEach(f => {
      expect(f.googleUrl).toContain('fonts.googleapis.com');
    });
  });

  it('includes required fonts', () => {
    const names = AVAILABLE_FONTS.map(f => f.name);
    expect(names).toContain('Playfair Display');
    expect(names).toContain('Montserrat');
    expect(names).toContain('Inter');
  });
});
