import { describe, it, expect } from 'vitest';
import {
  interpolate,
  processConditionals,
  htmlToPlainText,
  baseLayout,
  render,
  buildTemplate,
  button,
  divider,
  heading,
  paragraph,
  bulletList,
  calloutBox,
  signoff,
  BRAND,
  type EmailTemplate,
} from '../engine';
import { botox } from '../templates/services/botox';
import { hydrafacial } from '../templates/services/hydrafacial';
import { welcome } from '../templates/lifecycle/welcome';
import { birthday } from '../templates/lifecycle/birthday';
import { welcomeHalo } from '../templates/membership/welcome-halo';
import { pointsEarned } from '../templates/loyalty/points-earned';
import { inviteSent } from '../templates/referral/invite-sent';
import { reviewRequest } from '../templates/review/request';
import { seasonalSpring } from '../templates/campaigns/seasonal-spring';
import { serviceTemplates } from '../templates';

// ── interpolate ───────────────────────────────────────────────
describe('interpolate', () => {
  it('should replace simple variables', () => {
    const result = interpolate('Hello {{first_name}}!', { first_name: 'Sarah' });
    expect(result).toBe('Hello Sarah!');
  });

  it('should replace multiple variables', () => {
    const result = interpolate('{{first_name}} on {{date}}', {
      first_name: 'Sarah',
      date: 'March 25',
    });
    expect(result).toBe('Sarah on March 25');
  });

  it('should leave unmatched placeholders intact', () => {
    const result = interpolate('Hello {{first_name}} at {{location}}', {
      first_name: 'Sarah',
    });
    expect(result).toBe('Hello Sarah at {{location}}');
  });

  it('should handle numeric values', () => {
    const result = interpolate('You earned {{points}} points', { points: 150 });
    expect(result).toBe('You earned 150 points');
  });

  it('should handle boolean values', () => {
    const result = interpolate('Active: {{is_active}}', { is_active: true });
    expect(result).toBe('Active: true');
  });

  it('should skip null and undefined values', () => {
    const result = interpolate('Hello {{name}}', { name: null });
    expect(result).toBe('Hello {{name}}');
    const result2 = interpolate('Hello {{name}}', { name: undefined });
    expect(result2).toBe('Hello {{name}}');
  });

  it('should inject brand defaults automatically', () => {
    const result = interpolate('Call {{brand_phone}}', {});
    expect(result).toContain(BRAND.phone);
  });

  it('should inject current year', () => {
    const result = interpolate('{{current_year}}', {});
    expect(result).toBe(String(new Date().getFullYear()));
  });

  it('should allow overriding brand defaults', () => {
    const result = interpolate('{{brand_name}}', { brand_name: 'Custom Brand' });
    expect(result).toBe('Custom Brand');
  });
});

// ── processConditionals ───────────────────────────────────────
describe('processConditionals', () => {
  it('should show content when condition is truthy', () => {
    const html = '{{#if show_offer}}Special offer!{{/if show_offer}}';
    const result = processConditionals(html, { show_offer: true });
    expect(result).toBe('Special offer!');
  });

  it('should hide content when condition is falsy', () => {
    const html = '{{#if show_offer}}Special offer!{{/if show_offer}}';
    const result = processConditionals(html, { show_offer: false });
    expect(result).toBe('');
  });

  it('should hide content when condition variable is missing', () => {
    const html = '{{#if show_offer}}Special offer!{{/if show_offer}}';
    const result = processConditionals(html, {});
    expect(result).toBe('');
  });

  it('should handle multiple conditional sections', () => {
    const html = '{{#if a}}AAA{{/if a}} {{#if b}}BBB{{/if b}}';
    const result = processConditionals(html, { a: true, b: false });
    expect(result).toBe('AAA ');
  });

  it('should handle multiline content in conditionals', () => {
    const html = '{{#if show}}\n<p>Line 1</p>\n<p>Line 2</p>\n{{/if show}}';
    const result = processConditionals(html, { show: true });
    expect(result).toContain('Line 1');
    expect(result).toContain('Line 2');
  });

  it('should treat non-empty strings as truthy', () => {
    const html = '{{#if name}}Hello!{{/if name}}';
    const result = processConditionals(html, { name: 'Sarah' });
    expect(result).toBe('Hello!');
  });
});

// ── htmlToPlainText ───────────────────────────────────────────
describe('htmlToPlainText', () => {
  it('should strip HTML tags', () => {
    const result = htmlToPlainText('<p>Hello <strong>World</strong></p>');
    expect(result).toContain('Hello');
    expect(result).toContain('World');
    expect(result).not.toContain('<p>');
    expect(result).not.toContain('<strong>');
  });

  it('should preserve link URLs', () => {
    const result = htmlToPlainText('<a href="https://example.com">Click here</a>');
    expect(result).toContain('Click here');
    expect(result).toContain('https://example.com');
  });

  it('should convert br tags to newlines', () => {
    const result = htmlToPlainText('Line 1<br>Line 2<br/>Line 3');
    expect(result).toContain('Line 1');
    expect(result).toContain('Line 2');
    expect(result).toContain('Line 3');
  });

  it('should decode HTML entities', () => {
    const result = htmlToPlainText('Tom &amp; Jerry &mdash; Friends');
    expect(result).toContain('Tom & Jerry --- Friends');
  });

  it('should remove style blocks', () => {
    const result = htmlToPlainText('<style>.foo { color: red; }</style><p>Hello</p>');
    expect(result).not.toContain('color');
    expect(result).toContain('Hello');
  });

  it('should collapse excessive whitespace', () => {
    const result = htmlToPlainText('<p>Hello</p>\n\n\n\n\n<p>World</p>');
    const newlines = result.match(/\n/g) || [];
    expect(newlines.length).toBeLessThanOrEqual(3);
  });
});

// ── baseLayout ────────────────────────────────────────────────
describe('baseLayout', () => {
  it('should produce valid HTML document', () => {
    const html = baseLayout('<p>Test</p>');
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('</html>');
    expect(html).toContain('<body');
    expect(html).toContain('</body>');
  });

  it('should include brand header with logo', () => {
    const html = baseLayout('<p>Test</p>');
    expect(html).toContain(BRAND.logoUrl);
    expect(html).toContain(BRAND.tagline);
  });

  it('should include footer with address and phone', () => {
    const html = baseLayout('<p>Test</p>');
    expect(html).toContain(BRAND.address);
    expect(html).toContain(BRAND.phone);
  });

  it('should include unsubscribe link', () => {
    const html = baseLayout('<p>Test</p>');
    expect(html).toContain('Unsubscribe');
    expect(html).toContain('unsubscribe_url');
  });

  it('should include social media links', () => {
    const html = baseLayout('<p>Test</p>');
    expect(html).toContain('INSTAGRAM');
    expect(html).toContain('FACEBOOK');
  });

  it('should include preheader text', () => {
    const html = baseLayout('<p>Test</p>', 'Preview text here');
    expect(html).toContain('Preview text here');
  });

  it('should use brand colors', () => {
    const html = baseLayout('<p>Test</p>');
    expect(html).toContain(BRAND.navy);
    expect(html).toContain(BRAND.gold);
    expect(html).toContain(BRAND.cream);
  });
});

// ── render pipeline ───────────────────────────────────────────
describe('render', () => {
  it('should process variables and conditionals together', () => {
    const template: EmailTemplate = {
      subject: 'Hello {{first_name}}',
      preheader: 'Welcome',
      html: '<p>Hi {{first_name}}</p>{{#if vip}}<p>VIP!</p>{{/if vip}}',
      text: 'Hi {{first_name}}',
    };
    const result = render(template, { first_name: 'Sarah', vip: true });
    expect(result.subject).toBe('Hello Sarah');
    expect(result.html).toContain('Hi Sarah');
    expect(result.html).toContain('VIP!');
    expect(result.text).toBe('Hi Sarah');
  });

  it('should auto-generate plain text from HTML when text is empty', () => {
    const template: EmailTemplate = {
      subject: 'Test',
      preheader: 'Test',
      html: '<p>Hello World</p>',
      text: '',
    };
    const result = render(template);
    expect(result.text).toContain('Hello World');
  });
});

// ── Component helpers ─────────────────────────────────────────
describe('component helpers', () => {
  it('button() should render primary button with link', () => {
    const html = button('Book Now', 'https://example.com');
    expect(html).toContain('Book Now');
    expect(html).toContain('https://example.com');
    expect(html).toContain(BRAND.gold);
  });

  it('button() should render secondary variant', () => {
    const html = button('Learn More', 'https://example.com', 'secondary');
    expect(html).toContain('Learn More');
    expect(html).toContain('border');
  });

  it('divider() should render full divider', () => {
    const html = divider();
    expect(html).toContain('border-top');
    expect(html).toContain(BRAND.borderLight);
  });

  it('divider("gold") should render gold accent divider', () => {
    const html = divider('gold');
    expect(html).toContain(BRAND.gold);
    expect(html).toContain('60px');
  });

  it('heading() should render h1 with navy color', () => {
    const html = heading('Test Heading', 1);
    expect(html).toContain('<h1');
    expect(html).toContain(BRAND.navy);
    expect(html).toContain('Test Heading');
  });

  it('heading(3) should render gold uppercase', () => {
    const html = heading('Sub', 3);
    expect(html).toContain('<h3');
    expect(html).toContain(BRAND.gold);
    expect(html).toContain('uppercase');
  });

  it('paragraph() should render styled p tag', () => {
    const html = paragraph('Hello world');
    expect(html).toContain('<p');
    expect(html).toContain('Hello world');
    expect(html).toContain('Georgia');
  });

  it('paragraph(muted) should use muted color', () => {
    const html = paragraph('Muted text', true);
    expect(html).toContain(BRAND.textMuted);
    expect(html).toContain('14px');
  });

  it('bulletList() should render list items', () => {
    const html = bulletList(['Item 1', 'Item 2', 'Item 3']);
    expect(html).toContain('Item 1');
    expect(html).toContain('Item 2');
    expect(html).toContain('Item 3');
    expect(html).toContain('<li');
    expect(html).toContain('<ul');
  });

  it('calloutBox() should render with cream variant', () => {
    const html = calloutBox('Content here', 'cream');
    expect(html).toContain('Content here');
    expect(html).toContain(BRAND.cream);
    expect(html).toContain('border-left');
  });

  it('calloutBox("gold") should use gold border', () => {
    const html = calloutBox('Content', 'gold');
    expect(html).toContain(BRAND.gold);
  });

  it('signoff() should include brand name and divider', () => {
    const html = signoff();
    expect(html).toContain('With warmth');
    expect(html).toContain('The Rani Team');
    expect(html).toContain(BRAND.name);
  });

  it('signoff() should accept custom name', () => {
    const html = signoff('Dr. Smith');
    expect(html).toContain('Dr. Smith');
  });
});

// ── buildTemplate ─────────────────────────────────────────────
describe('buildTemplate', () => {
  it('should create a complete EmailTemplate', () => {
    const template = buildTemplate({
      subject: 'Test Subject',
      preheader: 'Preview text',
      body: '<p>Body content</p>',
    });
    expect(template.subject).toBe('Test Subject');
    expect(template.preheader).toBe('Preview text');
    expect(template.html).toContain('<!DOCTYPE html>');
    expect(template.html).toContain('Body content');
    expect(template.text).toContain('Body content');
  });

  it('should auto-generate plain text', () => {
    const template = buildTemplate({
      subject: 'Test',
      preheader: 'Test',
      body: '<h1>Title</h1><p>Body paragraph.</p>',
    });
    expect(template.text).toContain('Title');
    expect(template.text).toContain('Body paragraph');
    expect(template.text).not.toContain('<h1>');
  });
});

// ── Service templates integration ─────────────────────────────
describe('service templates', () => {
  const vars = {
    first_name: 'Sarah',
    appointment_date: 'March 30, 2026',
    appointment_time: '2:00 PM',
    provider_name: 'Dr. Patel',
    confirmation_url: 'https://ranibeautyclinic.com/confirm/123',
    booking_url: 'https://ranibeautyclinic.com/book',
    directions_url: 'https://maps.google.com',
  };

  it('botox pretreatment should render complete branded email', () => {
    const email = botox.pretreatment(vars);
    expect(email.subject).toContain('Botox');
    expect(email.html).toContain('Sarah');
    expect(email.html).toContain('March 30, 2026');
    expect(email.html).toContain('Dr. Patel');
    expect(email.html).toContain('<!DOCTYPE html>');
    expect(email.html).toContain(BRAND.navy);
    expect(email.html).toContain(BRAND.gold);
    expect(email.text).toContain('Sarah');
    expect(email.preheader.length).toBeGreaterThan(0);
  });

  it('botox aftercare should include recovery instructions', () => {
    const email = botox.aftercare(vars);
    expect(email.html).toContain('Aftercare');
    expect(email.html).toContain('upright');
    expect(email.html).toContain('4 hours');
  });

  it('hydrafacial dayOf should include appointment details', () => {
    const email = hydrafacial.dayOf(vars);
    expect(email.html).toContain('2:00 PM');
    expect(email.html).toContain('Dr. Patel');
  });

  it('serviceTemplates map should have all 13 services', () => {
    expect(Object.keys(serviceTemplates)).toHaveLength(13);
    expect(serviceTemplates.botox).toBeDefined();
    expect(serviceTemplates.hydrafacial).toBeDefined();
    expect(serviceTemplates['rf-microneedling']).toBeDefined();
    expect(serviceTemplates.sofwave).toBeDefined();
    expect(serviceTemplates['laser-hair-removal']).toBeDefined();
    expect(serviceTemplates['chemical-peel']).toBeDefined();
    expect(serviceTemplates['vitamin-injections']).toBeDefined();
    expect(serviceTemplates['peptide-therapy']).toBeDefined();
    expect(serviceTemplates.glp1).toBeDefined();
    expect(serviceTemplates.hrt).toBeDefined();
    expect(serviceTemplates['nad-plus']).toBeDefined();
    expect(serviceTemplates['scar-reduction']).toBeDefined();
    expect(serviceTemplates['laser-facial']).toBeDefined();
  });

  it('all service templates should have pretreatment, dayOf, aftercare', () => {
    for (const [slug, service] of Object.entries(serviceTemplates)) {
      expect(typeof service.pretreatment).toBe('function');
      expect(typeof service.dayOf).toBe('function');
      expect(typeof service.aftercare).toBe('function');

      const email = service.pretreatment({ first_name: 'Test' });
      expect(email.subject.length).toBeGreaterThan(0);
      expect(email.html).toContain('<!DOCTYPE html>');
      expect(email.text.length).toBeGreaterThan(0);
    }
  });
});

// ── Lifecycle templates integration ───────────────────────────
describe('lifecycle templates', () => {
  it('welcome email should contain brand introduction', () => {
    const email = welcome({ first_name: 'Sarah', booking_url: '#', services_url: '#' });
    expect(email.subject).toContain('Welcome');
    expect(email.html).toContain('Sarah');
    expect(email.html).toContain(BRAND.name);
  });

  it('birthday email should contain gift offer', () => {
    const email = birthday({
      first_name: 'Sarah',
      birthday_offer: '20% Off',
      offer_code: 'BDAY20',
      offer_expiry: 'April 30',
      booking_url: '#',
    });
    expect(email.subject).toContain('Happy Birthday');
    expect(email.html).toContain('20% Off');
    expect(email.html).toContain('BDAY20');
  });
});

// ── Membership templates integration ──────────────────────────
describe('membership templates', () => {
  it('welcomeHalo should include tier-specific benefits', () => {
    const email = welcomeHalo({
      first_name: 'Sarah',
      monthly_rate: '$199',
      billing_date: '1st',
      start_date: 'March 25, 2026',
      booking_url: '#',
    });
    expect(email.subject).toContain('Halo');
    expect(email.html).toContain('$199');
    expect(email.html).toContain('1.5x points');
  });
});

// ── Loyalty templates integration ─────────────────────────────
describe('loyalty templates', () => {
  it('pointsEarned should show points summary', () => {
    const email = pointsEarned({
      first_name: 'Sarah',
      points_earned: 50,
      total_points: 350,
      points_to_next_reward: 150,
      rewards_url: '#',
      booking_url: '#',
    });
    expect(email.html).toContain('+50');
    expect(email.html).toContain('350');
  });
});

// ── Referral templates integration ────────────────────────────
describe('referral templates', () => {
  it('inviteSent should include referral details', () => {
    const email = inviteSent({
      first_name: 'Sarah',
      friend_name: 'Emma',
      referral_code: 'SARAH2026',
      friend_offer: '15% off first visit',
      referrer_reward: '$25 credit',
      referral_url: '#',
    });
    expect(email.html).toContain('Emma');
    expect(email.html).toContain('SARAH2026');
    expect(email.html).toContain('$25 credit');
  });
});

// ── No "infusion" in any template ─────────────────────────────
describe('brand compliance', () => {
  it('should never use the word "infusion" in any service template', () => {
    for (const [slug, service] of Object.entries(serviceTemplates)) {
      const pre = service.pretreatment({ first_name: 'Test' });
      const day = service.dayOf({ first_name: 'Test' });
      const after = service.aftercare({ first_name: 'Test' });

      expect(pre.html.toLowerCase()).not.toContain('infusion');
      expect(day.html.toLowerCase()).not.toContain('infusion');
      expect(after.html.toLowerCase()).not.toContain('infusion');
      expect(pre.text.toLowerCase()).not.toContain('infusion');
      expect(day.text.toLowerCase()).not.toContain('infusion');
      expect(after.text.toLowerCase()).not.toContain('infusion');
    }
  });

  it('should use "injection" not "infusion" in vitamin templates', () => {
    const email = serviceTemplates['vitamin-injections'].pretreatment({
      first_name: 'Test',
    });
    expect(email.html.toLowerCase()).toContain('injection');
    expect(email.html.toLowerCase()).not.toContain('infusion');
  });
});
