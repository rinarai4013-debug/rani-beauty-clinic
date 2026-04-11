import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';
import { requirePatientAuth, getAirtableBase } from '../require-patient';
import type { PatientSessionPayload } from '../session';

const mockGetPatientSession = vi.fn();
const mockGetSharedAirtableBase = vi.fn();

vi.mock('../session', () => ({
  getPatientSession: (...args: unknown[]) => mockGetPatientSession(...args),
}));

vi.mock('@/lib/airtable/client', () => ({
  getAirtableBase: (...args: unknown[]) => mockGetSharedAirtableBase(...args),
}));

describe('requirePatientAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns session when patient session exists', async () => {
    const expectedSession: PatientSessionPayload = {
      patientId: 'p-1',
      email: 'jane@example.com',
      name: 'Jane Patient',
    };

    mockGetPatientSession.mockResolvedValue(expectedSession);
    const result = await requirePatientAuth();

    expect(mockGetPatientSession).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ session: expectedSession });
    expect(result.error).toBeUndefined();
  });

  it('returns unauthorized 401 when session is missing', async () => {
    mockGetPatientSession.mockResolvedValue(null);
    const result = await requirePatientAuth();

    expect(result).toMatchObject({
      error: expect.any(NextResponse),
    });
    const response = result.error;
    expect(response).toBeInstanceOf(NextResponse);
    expect(response?.status).toBe(401);
    expect(await response?.json()).toEqual({
      error: 'Unauthorized. Please sign in to your patient portal.',
    });
  });

  it('returns the shared Airtable base', () => {
    const fakeBase = { baseId: 'app123' };
    mockGetSharedAirtableBase.mockReturnValue(fakeBase);

    const base = getAirtableBase();

    expect(mockGetSharedAirtableBase).toHaveBeenCalledTimes(1);
    expect(base).toBe(fakeBase);
  });
});
