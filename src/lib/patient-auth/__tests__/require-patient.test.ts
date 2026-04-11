// @vitest-environment node

import { describe, it, expect, vi, beforeEach } from 'vitest';

const getPatientSession = vi.fn();
const baseMock = vi.fn();
const airtableConstructor = vi.fn(() => ({
  base: baseMock,
}));

vi.hoisted(() => {
  process.env.AIRTABLE_PAT = 'pat-test-key';
  process.env.AIRTABLE_BASE_ID = 'appRenton123';
});

vi.mock('@/lib/patient-auth/session', () => ({
  getPatientSession,
}));

vi.mock('airtable', () => ({
  default: airtableConstructor,
}));

import { requirePatientAuth, getAirtableBase } from '@/lib/patient-auth/require-patient';

describe('patient-auth/require-patient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    baseMock.mockImplementation((baseId: string) => ({ baseId }));
  });

  describe('requirePatientAuth', () => {
    it('returns the session when a patient is authenticated', async () => {
      getPatientSession.mockResolvedValueOnce({
        patientId: 'patient-rina',
        email: 'rina@ranibeauty.com',
        name: 'Rina',
      });

      await expect(requirePatientAuth()).resolves.toEqual({
        session: {
          patientId: 'patient-rina',
          email: 'rina@ranibeauty.com',
          name: 'Rina',
        },
      });
    });

    it('returns a 401 response when no patient session exists', async () => {
      getPatientSession.mockResolvedValueOnce(null);

      const result = await requirePatientAuth();

      expect(result.session).toBeUndefined();
      expect(result.error?.status).toBe(401);
      await expect(result.error?.json()).resolves.toEqual({
        error: 'Unauthorized. Please sign in to your patient portal.',
      });
    });
  });

  describe('getAirtableBase', () => {
    it('constructs an Airtable base using env credentials', async () => {
      const base = await getAirtableBase();

      expect(airtableConstructor).toHaveBeenCalledWith({
        apiKey: 'pat-test-key',
      });
      expect(baseMock).toHaveBeenCalledWith('appRenton123');
      expect(base).toEqual({ baseId: 'appRenton123' });
    });
  });
});
