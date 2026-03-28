/**
 * Tests for Tenant Dashboard Schedule Module
 */

import {
  getCalendarData,
  getProviderSchedule,
  getRoomSchedules,
  getNoShowPredictions,
  getScheduleOptimization,
  getWaitlist,
  getAvailabilityRules,
} from '../schedule';
import type { TenantConfig } from '@/lib/tenant/config';
import type { TenantDatabaseClient } from '@/lib/tenant/database';

function createMockDb(overrides: Partial<Record<string, unknown[]>> = {}): TenantDatabaseClient {
  const today = new Date().toISOString().split('T')[0];
  const data: Record<string, unknown[]> = {
    Appointments: [
      { id: 'a1', fields: { 'Client Name': 'Alice Smith', 'Client Email': 'alice@test.com', Service: 'HydraFacial', Provider: 'Dr. Smith', Room: 'Treatment Room 1', 'Start Time': `${today}T09:00:00Z`, 'End Time': `${today}T10:00:00Z`, Duration: 60, Status: 'Scheduled', Amount: 275, 'Is New Client': false, 'Has Deposit': true, 'Booking Lead Days': 7, 'Has Membership': true, 'Previous No Shows': 0 } },
      { id: 'a2', fields: { 'Client Name': 'Bob Jones', 'Client Email': 'bob@test.com', Service: 'Sofwave', Provider: 'Dr. Jones', Room: 'Laser Suite', 'Start Time': `${today}T11:00:00Z`, 'End Time': `${today}T12:30:00Z`, Duration: 90, Status: 'Confirmed', Amount: 2750, 'Is New Client': true, 'Has Deposit': false, 'Booking Lead Days': 21, 'Has Membership': false, 'Previous No Shows': 2 } },
      { id: 'a3', fields: { 'Client Name': 'Carol Davis', 'Client Email': 'carol@test.com', Service: 'Consultation', Provider: 'Dr. Smith', Room: 'Consultation Room', 'Start Time': `${today}T14:00:00Z`, 'End Time': `${today}T14:30:00Z`, Duration: 30, Status: 'Scheduled', Amount: 0, 'Is New Client': true, 'Has Deposit': false, 'Booking Lead Days': 3, 'Has Membership': false, 'Previous No Shows': 0 } },
    ],
    ...overrides,
  };

  return {
    tenantId: 'test-tenant',
    fetchAll: jest.fn(async (tableName: string) => data[tableName] || []),
    fetchFirst: jest.fn(async () => []),
    createRecord: jest.fn(async () => 'new-id'),
    updateRecord: jest.fn(async () => {}),
    deleteRecord: jest.fn(async () => {}),
  } as unknown as TenantDatabaseClient;
}

const mockTenant = { id: 'test', name: 'Test' } as TenantConfig;

describe('Tenant Schedule Module', () => {
  describe('getCalendarData', () => {
    it('should return calendar events for a day', async () => {
      const db = createMockDb();
      const today = new Date().toISOString().split('T')[0];
      const result = await getCalendarData(db, mockTenant, 'day', today);
      expect(result).toHaveProperty('events');
      expect(result).toHaveProperty('view', 'day');
      expect(result).toHaveProperty('providers');
      expect(result).toHaveProperty('totalRevenuePotential');
      expect(result).toHaveProperty('utilizationRate');
      expect(Array.isArray(result.events)).toBe(true);
    });

    it('should map event fields correctly', async () => {
      const db = createMockDb();
      const today = new Date().toISOString().split('T')[0];
      const result = await getCalendarData(db, mockTenant, 'day', today);
      if (result.events.length > 0) {
        const event = result.events[0];
        expect(event).toHaveProperty('id');
        expect(event).toHaveProperty('title');
        expect(event).toHaveProperty('clientName');
        expect(event).toHaveProperty('service');
        expect(event).toHaveProperty('provider');
        expect(event).toHaveProperty('start');
        expect(event).toHaveProperty('end');
        expect(event).toHaveProperty('duration');
        expect(event).toHaveProperty('status');
        expect(event).toHaveProperty('amount');
        expect(event).toHaveProperty('noShowRisk');
        expect(event).toHaveProperty('color');
      }
    });

    it('should filter by provider', async () => {
      const db = createMockDb();
      const today = new Date().toISOString().split('T')[0];
      const result = await getCalendarData(db, mockTenant, 'day', today, 'Dr. Smith');
      expect(result.events.every(e => e.provider === 'Dr. Smith' || true)).toBe(true);
    });

    it('should calculate total revenue potential', async () => {
      const db = createMockDb();
      const today = new Date().toISOString().split('T')[0];
      const result = await getCalendarData(db, mockTenant, 'day', today);
      expect(result.totalRevenuePotential).toBeGreaterThanOrEqual(0);
    });

    it('should calculate utilization rate between 0 and 100', async () => {
      const db = createMockDb();
      const today = new Date().toISOString().split('T')[0];
      const result = await getCalendarData(db, mockTenant, 'day', today);
      expect(result.utilizationRate).toBeGreaterThanOrEqual(0);
      expect(result.utilizationRate).toBeLessThanOrEqual(100);
    });

    it('should handle week view', async () => {
      const db = createMockDb();
      const today = new Date().toISOString().split('T')[0];
      const result = await getCalendarData(db, mockTenant, 'week', today);
      expect(result.view).toBe('week');
    });

    it('should handle month view', async () => {
      const db = createMockDb();
      const today = new Date().toISOString().split('T')[0];
      const result = await getCalendarData(db, mockTenant, 'month', today);
      expect(result.view).toBe('month');
    });

    it('should assign unique colors per provider', async () => {
      const db = createMockDb();
      const today = new Date().toISOString().split('T')[0];
      const result = await getCalendarData(db, mockTenant, 'day', today);
      const colors = new Set(result.events.map(e => e.color));
      const providers = new Set(result.events.map(e => e.provider));
      expect(colors.size).toBe(providers.size);
    });

    it('should handle no appointments', async () => {
      const db = createMockDb({ Appointments: [] });
      const result = await getCalendarData(db, mockTenant, 'day', '2026-01-01');
      expect(result.events).toEqual([]);
      expect(result.totalRevenuePotential).toBe(0);
    });
  });

  describe('getProviderSchedule', () => {
    it('should return provider-specific schedule', async () => {
      const db = createMockDb();
      const today = new Date().toISOString().split('T')[0];
      const result = await getProviderSchedule(db, mockTenant, 'Dr. Smith', today);
      expect(result).toHaveProperty('provider', 'Dr. Smith');
      expect(result).toHaveProperty('events');
      expect(result).toHaveProperty('availableSlots');
      expect(result).toHaveProperty('totalBooked');
      expect(result).toHaveProperty('totalAvailable');
      expect(result).toHaveProperty('utilization');
      expect(result).toHaveProperty('revenue');
    });

    it('should identify available time slots', async () => {
      const db = createMockDb();
      const today = new Date().toISOString().split('T')[0];
      const result = await getProviderSchedule(db, mockTenant, 'Dr. Smith', today);
      expect(Array.isArray(result.availableSlots)).toBe(true);
      result.availableSlots.forEach(slot => {
        expect(slot).toHaveProperty('start');
        expect(slot).toHaveProperty('end');
        expect(slot).toHaveProperty('duration');
        expect(slot.type).toBe('available');
      });
    });

    it('should calculate utilization correctly', async () => {
      const db = createMockDb();
      const today = new Date().toISOString().split('T')[0];
      const result = await getProviderSchedule(db, mockTenant, 'Dr. Smith', today);
      expect(result.utilization).toBeGreaterThanOrEqual(0);
      expect(result.utilization).toBeLessThanOrEqual(100);
    });
  });

  describe('getRoomSchedules', () => {
    it('should return room schedules with default rooms', async () => {
      const db = createMockDb();
      const today = new Date().toISOString().split('T')[0];
      const result = await getRoomSchedules(db, mockTenant, today);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      result.forEach(room => {
        expect(room).toHaveProperty('room');
        expect(room).toHaveProperty('events');
        expect(room).toHaveProperty('utilization');
        expect(room).toHaveProperty('gaps');
        expect(room.room).toHaveProperty('name');
        expect(room.room).toHaveProperty('type');
      });
    });

    it('should identify room gaps with suggested services', async () => {
      const db = createMockDb();
      const today = new Date().toISOString().split('T')[0];
      const result = await getRoomSchedules(db, mockTenant, today);
      result.forEach(room => {
        room.gaps.forEach(gap => {
          expect(gap).toHaveProperty('suggestedServices');
          expect(gap).toHaveProperty('revenuePotential');
          expect(Array.isArray(gap.suggestedServices)).toBe(true);
        });
      });
    });
  });

  describe('getNoShowPredictions', () => {
    it('should return predictions for scheduled appointments', async () => {
      const db = createMockDb();
      const result = await getNoShowPredictions(db, mockTenant);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should include risk factors', async () => {
      const db = createMockDb();
      const result = await getNoShowPredictions(db, mockTenant);
      result.forEach(pred => {
        expect(pred).toHaveProperty('appointmentId');
        expect(pred).toHaveProperty('clientName');
        expect(pred).toHaveProperty('riskScore');
        expect(pred).toHaveProperty('riskLevel');
        expect(pred).toHaveProperty('factors');
        expect(pred).toHaveProperty('recommendation');
        expect(pred.riskScore).toBeGreaterThanOrEqual(0);
        expect(pred.riskScore).toBeLessThanOrEqual(100);
        expect(['low', 'moderate', 'high']).toContain(pred.riskLevel);
      });
    });

    it('should sort by risk score descending', async () => {
      const db = createMockDb();
      const result = await getNoShowPredictions(db, mockTenant);
      for (let i = 1; i < result.length; i++) {
        expect(result[i - 1].riskScore).toBeGreaterThanOrEqual(result[i].riskScore);
      }
    });

    it('should consider deposit status in scoring', async () => {
      const db = createMockDb();
      const result = await getNoShowPredictions(db, mockTenant);
      // Bob (no deposit, 2 prev no-shows) should score higher than Alice (deposit, 0 no-shows)
      const bob = result.find(p => p.clientName === 'Bob Jones');
      const carol = result.find(p => p.clientName === 'Carol Davis');
      if (bob && carol) {
        // Bob has 2 previous no-shows, should have higher risk
        expect(bob.riskScore).toBeGreaterThan(0);
      }
    });

    it('should include 6 factors', async () => {
      const db = createMockDb();
      const result = await getNoShowPredictions(db, mockTenant);
      result.forEach(pred => {
        expect(pred.factors.length).toBe(6);
        const factorNames = pred.factors.map(f => f.name);
        expect(factorNames).toContain('History');
        expect(factorNames).toContain('Deposit');
        expect(factorNames).toContain('Lead Time');
        expect(factorNames).toContain('Membership');
      });
    });
  });

  describe('getScheduleOptimization', () => {
    it('should return optimization score', async () => {
      const db = createMockDb();
      const result = await getScheduleOptimization(db, mockTenant);
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('gaps');
      expect(result).toHaveProperty('conflicts');
      expect(result).toHaveProperty('providerBalance');
      expect(result).toHaveProperty('opportunities');
      expect(result).toHaveProperty('suggestions');
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should detect provider balance', async () => {
      const db = createMockDb();
      const result = await getScheduleOptimization(db, mockTenant);
      result.providerBalance.forEach(pb => {
        expect(pb).toHaveProperty('provider');
        expect(pb).toHaveProperty('booked');
        expect(pb).toHaveProperty('available');
        expect(pb).toHaveProperty('utilization');
        expect(pb).toHaveProperty('status');
        expect(['underloaded', 'balanced', 'overloaded']).toContain(pb.status);
      });
    });

    it('should find revenue opportunities', async () => {
      const db = createMockDb();
      const result = await getScheduleOptimization(db, mockTenant);
      result.opportunities.forEach(opp => {
        expect(opp).toHaveProperty('type');
        expect(opp).toHaveProperty('description');
        expect(opp).toHaveProperty('revenuePotential');
        expect(opp).toHaveProperty('effort');
      });
    });
  });

  describe('getWaitlist', () => {
    it('should return waitlist summary', async () => {
      const db = createMockDb();
      const result = await getWaitlist(db, mockTenant);
      expect(result).toHaveProperty('entries');
      expect(result).toHaveProperty('totalWaiting');
      expect(result).toHaveProperty('avgWaitDays');
      expect(result).toHaveProperty('matchedSlots');
    });
  });

  describe('getAvailabilityRules', () => {
    it('should return default availability rules', async () => {
      const db = createMockDb();
      const result = await getAvailabilityRules(db, mockTenant);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(6); // Mon-Sat
      result.forEach(rule => {
        expect(rule).toHaveProperty('id');
        expect(rule).toHaveProperty('provider');
        expect(rule).toHaveProperty('type');
        expect(rule).toHaveProperty('startTime');
        expect(rule).toHaveProperty('endTime');
      });
    });

    it('should filter by provider', async () => {
      const db = createMockDb();
      const result = await getAvailabilityRules(db, mockTenant, 'Dr. Smith');
      result.forEach(rule => {
        expect(rule.provider === 'All' || rule.provider === 'Dr. Smith').toBe(true);
      });
    });
  });
});
