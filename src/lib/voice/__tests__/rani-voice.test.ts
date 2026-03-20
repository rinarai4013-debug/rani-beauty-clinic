import { describe, it, expect } from 'vitest';
import {
  sanitizeMessage,
  getGreeting,
  formatServiceName,
  RANI_VOICE,
  RANI_SYSTEM_PROMPT,
} from '../rani-voice';

describe('sanitizeMessage', () => {
  it('replaces "anti-aging" with "skin optimization"', () => {
    const result = sanitizeMessage('Our anti-aging treatments are the best.');
    expect(result).toBe('Our skin optimization treatments are the best.');
  });

  it('replaces "problem areas" with "focus areas"', () => {
    const result = sanitizeMessage('We can target your problem areas.');
    expect(result).toBe('We can target your focus areas.');
  });

  it('handles multiple replacements in one message', () => {
    const result = sanitizeMessage(
      'We can fix your problem areas with our anti-aging treatment.'
    );
    expect(result).toContain('focus areas');
    expect(result).toContain('skin optimization');
    expect(result).toContain('optimize');
    expect(result).not.toContain('fix');
    expect(result).not.toContain('problem areas');
    expect(result).not.toContain('anti-aging');
  });

  it('preserves text without banned words', () => {
    const original = 'Your skin is going to look amazing after this treatment.';
    const result = sanitizeMessage(original);
    expect(result).toBe(original);
  });

  it('handles case-insensitive replacement', () => {
    const result = sanitizeMessage('ANTI-AGING treatments and Problem Areas');
    expect(result).toContain('Skin optimization');
    expect(result).toContain('Focus areas');
  });

  it('replaces "infusion" with "injection"', () => {
    const result = sanitizeMessage('We offer vitamin infusion therapy.');
    expect(result).toBe('We offer vitamin injection therapy.');
  });

  it('replaces "free consult" with "complimentary consultation"', () => {
    const result = sanitizeMessage('Book a free consult today.');
    expect(result).toBe('Book a complimentary consultation today.');
  });
});

describe('getGreeting', () => {
  it('returns different greetings for each tier', () => {
    const newGreeting = getGreeting('new');
    const regularGreeting = getGreeting('regular');
    const vipGreeting = getGreeting('vip');

    expect(newGreeting).not.toBe(regularGreeting);
    expect(regularGreeting).not.toBe(vipGreeting);
    expect(newGreeting).not.toBe(vipGreeting);
  });

  it('new tier contains welcome/excited language', () => {
    const greeting = getGreeting('new');
    const hasWelcomeOrExcited =
      greeting.toLowerCase().includes('welcome') ||
      greeting.toLowerCase().includes('excited');
    expect(hasWelcomeOrExcited).toBe(true);
  });

  it('vip tier contains exclusive/valued language', () => {
    const greeting = getGreeting('vip');
    const hasExclusive =
      greeting.toLowerCase().includes('valued') ||
      greeting.toLowerCase().includes('first');
    expect(hasExclusive).toBe(true);
  });

  it('regular tier contains familiar/bestie language', () => {
    const greeting = getGreeting('regular');
    expect(greeting.toLowerCase()).toContain('amazing');
  });

  it('all greetings contain emojis', () => {
    const tiers: Array<'new' | 'regular' | 'vip'> = ['new', 'regular', 'vip'];
    for (const tier of tiers) {
      const greeting = getGreeting(tier);
      expect(greeting).toMatch(/[✨💛🤍💫🫶]/);
    }
  });
});

describe('formatServiceName', () => {
  it('formats HydraFacial correctly', () => {
    expect(formatServiceName('hydrafacial')).toBe('HydraFacial');
    expect(formatServiceName('HYDRAFACIAL')).toBe('HydraFacial');
    expect(formatServiceName('Hydra Facial')).toBe('HydraFacial');
  });

  it('formats RF Microneedling correctly', () => {
    expect(formatServiceName('rf microneedling')).toBe('RF Microneedling');
    expect(formatServiceName('rf_microneedling')).toBe('RF Microneedling');
  });

  it('formats PRX-T33 correctly', () => {
    expect(formatServiceName('prx-t33')).toBe('PRX-T33');
    expect(formatServiceName('prxt33')).toBe('PRX-T33');
  });

  it('formats PicoWay correctly', () => {
    expect(formatServiceName('picoway')).toBe('PicoWay');
  });

  it('formats GLP-1 correctly', () => {
    expect(formatServiceName('glp-1')).toBe('GLP-1');
    expect(formatServiceName('glp1')).toBe('GLP-1');
  });

  it('returns original for unknown services', () => {
    expect(formatServiceName('Custom Treatment')).toBe('Custom Treatment');
  });
});

describe('RANI_VOICE constant', () => {
  it('has required identity fields', () => {
    expect(RANI_VOICE.identity.name).toBe('Rani Beauty Clinic');
    expect(RANI_VOICE.identity.archetype).toBeTruthy();
    expect(RANI_VOICE.identity.vibe).toBeTruthy();
    expect(RANI_VOICE.identity.tone).toBeTruthy();
    expect(RANI_VOICE.identity.energy).toBeTruthy();
  });

  it('has terms of endearment', () => {
    expect(RANI_VOICE.termsOfEndearment).toContain('beautiful');
    expect(RANI_VOICE.termsOfEndearment).toContain('angel');
    expect(RANI_VOICE.termsOfEndearment).toContain('gorgeous');
    expect(RANI_VOICE.termsOfEndearment).toContain('perfect');
  });

  it('has 4 greetings', () => {
    expect(RANI_VOICE.greetings).toHaveLength(4);
  });

  it('has 4 closings', () => {
    expect(RANI_VOICE.closings).toHaveLength(4);
  });

  it('has primary and secondary emojis', () => {
    expect(RANI_VOICE.emojis.primary).toContain('✨');
    expect(RANI_VOICE.emojis.primary).toContain('💛');
    expect(RANI_VOICE.emojis.banned).toContain('❤️');
  });

  it('has banned words list', () => {
    expect(RANI_VOICE.bannedWords.length).toBeGreaterThan(0);
    expect(RANI_VOICE.bannedWords).toContain('anti-aging');
    expect(RANI_VOICE.bannedWords).toContain('infusion');
  });

  it('has preferred words map', () => {
    expect(RANI_VOICE.preferredWords.get('anti-aging')).toBe('skin optimization');
    expect(RANI_VOICE.preferredWords.get('problem areas')).toBe('focus areas');
    expect(RANI_VOICE.preferredWords.get('fix')).toBe('optimize');
  });
});

describe('RANI_SYSTEM_PROMPT', () => {
  it('is a non-empty string', () => {
    expect(typeof RANI_SYSTEM_PROMPT).toBe('string');
    expect(RANI_SYSTEM_PROMPT.length).toBeGreaterThan(100);
  });

  it('contains clinic address', () => {
    expect(RANI_SYSTEM_PROMPT).toContain('401 Olympia Ave NE #101');
  });

  it('contains the golden rule', () => {
    expect(RANI_SYSTEM_PROMPT).toContain('Would I feel good receiving this text');
  });

  it('mentions banned words', () => {
    expect(RANI_SYSTEM_PROMPT).toContain('BANNED');
    expect(RANI_SYSTEM_PROMPT).toContain('anti-aging');
  });

  it('contains booking link', () => {
    expect(RANI_SYSTEM_PROMPT).toContain('ranibeautyclinic.com/#booking');
  });
});
