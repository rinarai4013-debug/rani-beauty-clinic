import { describe, expect, it } from 'vitest';
import { getInvalidMedicalSpecialties, sanitizeJsonLd, stringifyJsonLd } from '../schema-org';

describe('schema.org JSON-LD helpers', () => {
  it('normalizes known invalid medicalSpecialty aliases', () => {
    expect(
      sanitizeJsonLd({
        provider: {
          medicalSpecialty: ['Dermatology', 'CosmeticSurgery', 'PlasticSurgery', 'Neurology'],
        },
      }),
    ).toEqual({
      provider: {
        medicalSpecialty: ['Dermatology', 'PlasticSurgery', 'Neurologic'],
      },
    });
  });

  it('converts MedicalSpecialty objects to valid enum text', () => {
    expect(
      sanitizeJsonLd({
        medicalSpecialty: {
          '@type': 'MedicalSpecialty',
          name: 'Medical-aesthetics',
        },
      }),
    ).toEqual({
      medicalSpecialty: 'Dermatology',
    });
  });

  it('escapes HTML-sensitive characters when stringifying', () => {
    expect(stringifyJsonLd({ name: '<script>alert(1)</script>' })).toContain('\\u003cscript>');
  });

  it('supports schema.org URL-style medicalSpecialty values', () => {
    expect(
      sanitizeJsonLd({
        medicalSpecialty: 'https://schema.org/Dermatology',
      }),
    ).toEqual({
      medicalSpecialty: 'Dermatology',
    });
  });

  it('removes impossible medical specialties in production-safe output', () => {
    const dirty = {
      provider: {
        '@type': 'MedicalClinic',
        medicalSpecialty: ['Dermatology', 'NotARealMedicalSpecialty', { '@type': 'MedicalSpecialty', name: 'Neurology' }],
      },
    };

    expect(sanitizeJsonLd(dirty)).toEqual({
      provider: {
        '@type': 'MedicalClinic',
        medicalSpecialty: ['Dermatology', 'Neurologic'],
      },
    });
    expect(getInvalidMedicalSpecialties(dirty)).toEqual(['NotARealMedicalSpecialty']);
  });
});
