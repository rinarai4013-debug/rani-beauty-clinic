import { describe, it, expect } from 'vitest';
import { BOOKABLE_SERVICES, getServiceById, getServicesByCategory, getBookableCategories } from '@/lib/booking/services';
import type { BookableService, RoomId } from '@/lib/booking/types';

describe('BOOKABLE_SERVICES', () => {
  it('has all expected service categories', () => {
    const categories = new Set(BOOKABLE_SERVICES.map(s => s.category));
    expect(categories.has('injectables')).toBe(true);
    expect(categories.has('facial')).toBe(true);
    expect(categories.has('chemical-peel')).toBe(true);
    expect(categories.has('laser')).toBe(true);
    expect(categories.has('rf-microneedling')).toBe(true);
    expect(categories.has('skin-tightening')).toBe(true);
    expect(categories.has('laser-hair-removal')).toBe(true);
    expect(categories.has('wellness')).toBe(true);
    expect(categories.has('consultation')).toBe(true);
  });

  it('has at least 30 services', () => {
    expect(BOOKABLE_SERVICES.length).toBeGreaterThanOrEqual(30);
  });

  it('all services have required fields', () => {
    for (const svc of BOOKABLE_SERVICES) {
      expect(svc.id).toBeTruthy();
      expect(svc.name).toBeTruthy();
      expect(svc.category).toBeTruthy();
      expect(svc.duration).toBeGreaterThan(0);
      expect(svc.prepTime).toBeGreaterThanOrEqual(0);
      expect(svc.cleanupTime).toBeGreaterThanOrEqual(0);
      expect(svc.price).toBeGreaterThanOrEqual(0);
      expect(typeof svc.requiresConsultation).toBe('boolean');
      expect(typeof svc.isActive).toBe('boolean');
      expect(svc.cancellationPolicy).toMatch(/standard|strict/);
    }
  });

  it('all services have buffer time = prep + cleanup', () => {
    for (const svc of BOOKABLE_SERVICES) {
      expect(svc.bufferTime).toBe(svc.prepTime + svc.cleanupTime);
    }
  });

  it('injectables require Glow room', () => {
    const injectables = BOOKABLE_SERVICES.filter(s => s.category === 'injectables');
    for (const svc of injectables) {
      expect(svc.requiredRooms).toContain('glow');
    }
  });

  it('HydraFacials require Aura room', () => {
    const facials = BOOKABLE_SERVICES.filter(s => s.category === 'facial');
    for (const svc of facials) {
      expect(svc.requiredRooms).toContain('aura');
    }
  });

  it('Sofwave requires Halo room', () => {
    const sofwave = BOOKABLE_SERVICES.filter(s => s.category === 'skin-tightening');
    for (const svc of sofwave) {
      expect(svc.requiredRooms).toContain('halo');
    }
  });

  it('RF Microneedling requires Halo room', () => {
    const rf = BOOKABLE_SERVICES.filter(s => s.category === 'rf-microneedling');
    for (const svc of rf) {
      expect(svc.requiredRooms).toContain('halo');
    }
  });

  it('LHR services require Glow room', () => {
    const lhr = BOOKABLE_SERVICES.filter(s => s.category === 'laser-hair-removal');
    for (const svc of lhr) {
      expect(svc.requiredRooms).toContain('glow');
    }
  });

  it('consultations are free', () => {
    const consults = BOOKABLE_SERVICES.filter(s => s.category === 'consultation');
    for (const svc of consults) {
      expect(svc.price).toBe(0);
    }
  });

  it('consultations do not require prior consultation', () => {
    const consults = BOOKABLE_SERVICES.filter(s => s.category === 'consultation');
    for (const svc of consults) {
      expect(svc.requiresConsultation).toBe(false);
    }
  });

  it('injectables require consultation for new clients', () => {
    const injectables = BOOKABLE_SERVICES.filter(s => s.category === 'injectables');
    for (const svc of injectables) {
      expect(svc.requiresConsultation).toBe(true);
    }
  });

  it('injectables have strict cancellation policy', () => {
    const injectables = BOOKABLE_SERVICES.filter(s => s.category === 'injectables');
    for (const svc of injectables) {
      expect(svc.cancellationPolicy).toBe('strict');
    }
  });

  it('injectables require deposit', () => {
    const injectables = BOOKABLE_SERVICES.filter(s => s.category === 'injectables');
    for (const svc of injectables) {
      expect(svc.depositRequired).toBeGreaterThan(0);
    }
  });

  it('wellness injections are short duration', () => {
    const wellness = BOOKABLE_SERVICES.filter(s => s.category === 'wellness');
    for (const svc of wellness) {
      expect(svc.duration).toBeLessThanOrEqual(30);
    }
  });

  it('all services have pre-instructions', () => {
    for (const svc of BOOKABLE_SERVICES) {
      expect(Array.isArray(svc.preInstructions)).toBe(true);
      expect(svc.preInstructions.length).toBeGreaterThan(0);
    }
  });

  it('services have rebooking intervals', () => {
    const servicesToCheck = BOOKABLE_SERVICES.filter(s =>
      s.category !== 'consultation' && s.rebookingIntervalDays > 0
    );
    expect(servicesToCheck.length).toBeGreaterThan(0);
  });
});

describe('getServiceById', () => {
  it('returns service for valid ID', () => {
    const svc = getServiceById('botox');
    expect(svc).toBeDefined();
    expect(svc!.name).toBe('Botox');
  });

  it('returns undefined for invalid ID', () => {
    const svc = getServiceById('nonexistent');
    expect(svc).toBeUndefined();
  });

  it('returns correct price for Botox', () => {
    const svc = getServiceById('botox');
    expect(svc!.price).toBe(400);
  });

  it('returns correct duration for HydraFacial', () => {
    const svc = getServiceById('hydrafacial-signature');
    expect(svc!.duration).toBe(60);
  });
});

describe('getServicesByCategory', () => {
  it('returns only active services', () => {
    const services = getServicesByCategory('injectables');
    for (const svc of services) {
      expect(svc.isActive).toBe(true);
    }
  });

  it('returns correct category', () => {
    const services = getServicesByCategory('facial');
    for (const svc of services) {
      expect(svc.category).toBe('facial');
    }
  });

  it('returns empty for nonexistent category', () => {
    const services = getServicesByCategory('nonexistent-category');
    expect(services.length).toBe(0);
  });

  it('returns multiple injectables', () => {
    const services = getServicesByCategory('injectables');
    expect(services.length).toBeGreaterThanOrEqual(4);
  });
});

describe('getBookableCategories', () => {
  it('returns all categories with counts', () => {
    const categories = getBookableCategories();
    expect(categories.length).toBeGreaterThanOrEqual(8);

    for (const cat of categories) {
      expect(cat.id).toBeTruthy();
      expect(cat.name).toBeTruthy();
      expect(cat.count).toBeGreaterThan(0);
    }
  });

  it('has human-readable names', () => {
    const categories = getBookableCategories();
    const names = categories.map(c => c.name);
    expect(names.some(n => n === 'Injectables')).toBe(true);
    expect(names.some(n => n === 'HydraFacial')).toBe(true);
  });
});
