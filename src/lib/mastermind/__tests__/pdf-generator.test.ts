import { describe, it, expect } from 'vitest';
import { generateConsultationPdf } from '../pdf-generator';
import { createSession } from '../session';
import { mockAuraScanResult, mockMastermindPlan } from '../mock-data';
import type { MastermindSession } from '@/types/mastermind';

function makeSessionWithPlan(overrides?: Partial<MastermindSession>): MastermindSession {
  return createSession({
    patientName: 'Sarah Johnson',
    patientEmail: 'sarah@test.com',
    auraScanResult: mockAuraScanResult(),
    mastermindPlan: mockMastermindPlan(),
    selectedPackageTier: 'Transform',
    ...overrides,
  });
}

describe('generateConsultationPdf', () => {
  it('generates HTML with patient name', () => {
    const session = makeSessionWithPlan();
    const result = generateConsultationPdf(session);
    expect(result.html).toContain('Sarah Johnson');
    expect(result.html).toContain('Rani');
    expect(result.html).toContain('Beauty');
  });

  it('generates correct filename', () => {
    const session = makeSessionWithPlan();
    const result = generateConsultationPdf(session);
    expect(result.filename).toMatch(/^rani-treatment-plan-sarah-johnson-\d{4}-\d{2}-\d{2}\.pdf$/);
  });

  it('includes aura score in output', () => {
    const session = makeSessionWithPlan();
    const result = generateConsultationPdf(session);
    expect(result.html).toContain('Aura Score');
    expect(result.html).toContain(String(session.auraScanResult!.auraScore.overall));
  });

  it('includes treatment sections', () => {
    const session = makeSessionWithPlan();
    const result = generateConsultationPdf(session);
    expect(result.html).toContain('Primary Treatments');
    expect(result.html).toContain('Botox');
  });

  it('includes selected package when present', () => {
    const session = makeSessionWithPlan({ selectedPackageTier: 'Transform' });
    const result = generateConsultationPdf(session);
    expect(result.html).toContain('Transform');
    expect(result.html).toContain('Complete Transformation');
  });

  it('works without selected package', () => {
    const session = makeSessionWithPlan({ selectedPackageTier: null });
    const result = generateConsultationPdf(session);
    expect(result.html).toBeTruthy();
    expect(result.filename).toBeTruthy();
  });

  it('throws when scan result missing', () => {
    const session = makeSessionWithPlan({ auraScanResult: null });
    expect(() => generateConsultationPdf(session)).toThrow('scan result');
  });

  it('throws when plan missing', () => {
    const session = makeSessionWithPlan({ mastermindPlan: null });
    expect(() => generateConsultationPdf(session)).toThrow('plan');
  });

  it('escapes HTML in patient name', () => {
    const session = makeSessionWithPlan({ patientName: '<script>alert("xss")</script>' });
    const result = generateConsultationPdf(session);
    expect(result.html).not.toContain('<script>');
    expect(result.html).toContain('&lt;script&gt;');
  });

  it('handles empty patient name gracefully', () => {
    const session = makeSessionWithPlan({ patientName: '' });
    const result = generateConsultationPdf(session);
    expect(result.filename).toContain('patient');
    expect(result.html).toBeTruthy();
  });

  it('includes financing options when package selected', () => {
    const session = makeSessionWithPlan({ selectedPackageTier: 'Transform' });
    const result = generateConsultationPdf(session);
    expect(result.html).toContain('Financing');
    expect(result.html).toContain('/mo');
  });

  it('includes disclaimer footer', () => {
    const session = makeSessionWithPlan();
    const result = generateConsultationPdf(session);
    expect(result.html).toContain('Individual results may vary');
    expect(result.html).toContain('ranibeautyclinic.com');
  });

  it('returns valid generatedAt timestamp', () => {
    const session = makeSessionWithPlan();
    const result = generateConsultationPdf(session);
    expect(new Date(result.generatedAt).getTime()).not.toBeNaN();
  });
});
