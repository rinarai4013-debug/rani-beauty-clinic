import { describe, expect, it } from 'vitest';

import { BOOKABLE_SERVICES, getBookableCategories, getServiceById, getServicesByCategory } from '@/lib/booking/services';

describe('booking/services', () => {
  it('exposes a populated bookable services catalog', () => {
    expect(BOOKABLE_SERVICES.length).toBeGreaterThan(20);
    expect(BOOKABLE_SERVICES.some(service => service.id === 'botox')).toBe(true);
    expect(BOOKABLE_SERVICES.some(service => service.id === 'lhr-full-body')).toBe(true);
  });

  it('returns specific services by id', () => {
    expect(getServiceById('sofwave-full-face-neck')).toMatchObject({
      name: 'Sofwave - Full Face + Neck',
      price: 3999,
      depositRequired: 400,
    });
    expect(getServiceById('missing-service')).toBeUndefined();
  });

  it('filters active services by category', () => {
    const injectables = getServicesByCategory('injectables');
    const consultations = getServicesByCategory('consultation');

    expect(injectables.every(service => service.category === 'injectables' && service.isActive)).toBe(true);
    expect(consultations.some(service => service.id === 'consult-aesthetic')).toBe(true);
  });

  it('includes generated laser hair removal services with expected rules', () => {
    const lhr = getServicesByCategory('laser-hair-removal');

    expect(lhr).toHaveLength(10);
    expect(lhr.every(service => service.requiredRooms.includes('glow'))).toBe(true);
    expect(lhr.find(service => service.id === 'lhr-full-body')?.depositRequired).toBe(50);
  });

  it('summarizes active bookable categories with counts', () => {
    const categories = getBookableCategories();

    expect(categories.some(category => category.id === 'injectables' && category.count > 0)).toBe(true);
    expect(categories.some(category => category.id === 'wellness' && category.name === 'Wellness Injections')).toBe(true);
  });
});
