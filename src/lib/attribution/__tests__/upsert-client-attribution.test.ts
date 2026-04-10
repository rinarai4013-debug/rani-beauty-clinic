import { describe, it, expect, vi, beforeEach } from "vitest";
import { FIELDS } from "@/lib/airtable/tables";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
//
// We mock the Airtable client so no real network calls are attempted and we
// can assert the exact shape of payloads passed to createRecord / updateRecord.
// Tables.clients() is mocked to return a sentinel we can identify in assertions.

const CLIENTS_TABLE_SENTINEL = { __table: "Clients" } as const;

vi.mock("@/lib/airtable/client", () => {
  return {
    fetchFirst: vi.fn(),
    createRecord: vi.fn(),
    updateRecord: vi.fn(),
    Tables: {
      clients: vi.fn(() => CLIENTS_TABLE_SENTINEL),
    },
  };
});

// Pass-through mock for sanitizeFormulaValue so we can verify it is invoked and
// still observe the real stripping behavior when we want to.
vi.mock("@/lib/airtable/sanitize", () => {
  return {
    sanitizeFormulaValue: vi.fn((v: string) => v.replace(/['"\\\n\r]/g, "")),
  };
});

// Import *after* vi.mock so the module under test picks up the mocks.
import { upsertClientAttribution } from "@/lib/attribution/upsert-client-attribution";
import {
  fetchFirst,
  createRecord,
  updateRecord,
  Tables,
} from "@/lib/airtable/client";
import { sanitizeFormulaValue } from "@/lib/airtable/sanitize";

const mockedFetchFirst = vi.mocked(fetchFirst);
const mockedCreateRecord = vi.mocked(createRecord);
const mockedUpdateRecord = vi.mocked(updateRecord);
const mockedTablesClients = vi.mocked(Tables.clients);
const mockedSanitize = vi.mocked(sanitizeFormulaValue);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fullPayload(overrides: Record<string, unknown> = {}) {
  return {
    name: "Jane Smith",
    email: "jane@example.com",
    phone: "555-123-4567",
    leadSource: "google",
    leadMedium: "cpc",
    leadCampaign: "spring-launch",
    leadAdSet: "wellness-adset",
    leadAd: "hero-ad",
    leadOffer: "free-consult",
    leadLandingPage: "/landing/wellness",
    leadKeyword: "medspa renton",
    leadReferrer: "https://google.com",
    attributionId: "attr_abc123",
    firstTouchAt: "2026-04-01T10:00:00.000Z",
    lastTouchAt: "2026-04-09T10:00:00.000Z",
    utm_source: "google",
    utm_medium: "cpc",
    utm_campaign: "spring-launch",
    utm_content: "hero-v1",
    utm_term: "medspa",
    ...overrides,
  };
}

function existingRecord(fields: Record<string, unknown> = {}) {
  return [{ id: "recEXISTING123", fields }];
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedTablesClients.mockReturnValue(
    CLIENTS_TABLE_SENTINEL as unknown as ReturnType<typeof Tables.clients>
  );
});

// ---------------------------------------------------------------------------
// 1. CREATE PATH
// ---------------------------------------------------------------------------

describe("upsertClientAttribution — create path (new client)", () => {
  it("creates a new record when fetchFirst returns an empty array", async () => {
    mockedFetchFirst.mockResolvedValueOnce([]);

    await upsertClientAttribution(fullPayload());

    expect(mockedFetchFirst).toHaveBeenCalledTimes(1);
    expect(mockedCreateRecord).toHaveBeenCalledTimes(1);
    expect(mockedUpdateRecord).not.toHaveBeenCalled();
  });

  it("passes the Clients table sentinel and skipTestFilter=true to fetchFirst", async () => {
    mockedFetchFirst.mockResolvedValueOnce([]);

    await upsertClientAttribution(fullPayload());

    const [tableArg, maxRecords, options, skipTestFilter] =
      mockedFetchFirst.mock.calls[0];
    expect(tableArg).toBe(CLIENTS_TABLE_SENTINEL);
    expect(maxRecords).toBe(1);
    expect(options?.filterByFormula).toBe(
      `{${FIELDS.clients.email}} = 'jane@example.com'`
    );
    expect(skipTestFilter).toBe(true);
  });

  it("uses payload.name (trimmed) when provided", async () => {
    mockedFetchFirst.mockResolvedValueOnce([]);

    await upsertClientAttribution(
      fullPayload({ name: "   Jane Smith   ", email: "jane@example.com" })
    );

    const fields = mockedCreateRecord.mock.calls[0][1] as Record<string, string>;
    expect(fields[FIELDS.clients.name]).toBe("Jane Smith");
  });

  it("falls back to emailNameFallback (email prefix) when name is missing", async () => {
    mockedFetchFirst.mockResolvedValueOnce([]);

    await upsertClientAttribution(
      fullPayload({ name: undefined, email: "john.doe-123@example.com" })
    );

    const fields = mockedCreateRecord.mock.calls[0][1] as Record<string, string>;
    expect(fields[FIELDS.clients.name]).toBe("john doe 123");
  });

  it("falls back to emailNameFallback when name is whitespace only", async () => {
    mockedFetchFirst.mockResolvedValueOnce([]);

    await upsertClientAttribution(
      fullPayload({ name: "   ", email: "alice@example.com" })
    );

    const fields = mockedCreateRecord.mock.calls[0][1] as Record<string, string>;
    expect(fields[FIELDS.clients.name]).toBe("alice");
  });

  it('sets status to "New Lead" on create', async () => {
    mockedFetchFirst.mockResolvedValueOnce([]);

    await upsertClientAttribution(fullPayload());

    const fields = mockedCreateRecord.mock.calls[0][1] as Record<string, string>;
    expect(fields[FIELDS.clients.status]).toBe("New Lead");
  });

  it('sets preferredContact to "Text" when phone is present', async () => {
    mockedFetchFirst.mockResolvedValueOnce([]);

    await upsertClientAttribution(fullPayload({ phone: "555-000-1111" }));

    const fields = mockedCreateRecord.mock.calls[0][1] as Record<string, string>;
    expect(fields[FIELDS.clients.preferredContact]).toBe("Text");
    expect(fields[FIELDS.clients.phone]).toBe("555-000-1111");
  });

  it('sets preferredContact to "Email" and omits phone field when phone is missing', async () => {
    mockedFetchFirst.mockResolvedValueOnce([]);

    await upsertClientAttribution(fullPayload({ phone: undefined }));

    const fields = mockedCreateRecord.mock.calls[0][1] as Record<string, string>;
    expect(fields[FIELDS.clients.preferredContact]).toBe("Email");
    expect(fields).not.toHaveProperty(FIELDS.clients.phone);
  });

  it('sets attributionModel to "first_touch" on create', async () => {
    mockedFetchFirst.mockResolvedValueOnce([]);

    await upsertClientAttribution(fullPayload());

    const fields = mockedCreateRecord.mock.calls[0][1] as Record<string, string>;
    expect(fields[FIELDS.clients.attributionModel]).toBe("first_touch");
  });

  it("maps all 16 attribution fields correctly via FIELDS.clients", async () => {
    mockedFetchFirst.mockResolvedValueOnce([]);

    await upsertClientAttribution(fullPayload());

    const fields = mockedCreateRecord.mock.calls[0][1] as Record<string, string>;
    expect(fields[FIELDS.clients.leadSource]).toBe("google");
    expect(fields[FIELDS.clients.leadMedium]).toBe("cpc");
    expect(fields[FIELDS.clients.leadCampaign]).toBe("spring-launch");
    expect(fields[FIELDS.clients.leadAdSet]).toBe("wellness-adset");
    expect(fields[FIELDS.clients.leadAd]).toBe("hero-ad");
    expect(fields[FIELDS.clients.leadOffer]).toBe("free-consult");
    expect(fields[FIELDS.clients.leadLandingPage]).toBe("/landing/wellness");
    expect(fields[FIELDS.clients.leadKeyword]).toBe("medspa renton");
    expect(fields[FIELDS.clients.leadReferrer]).toBe("https://google.com");
    expect(fields[FIELDS.clients.attributionId]).toBe("attr_abc123");
    expect(fields[FIELDS.clients.firstTouchAt]).toBe("2026-04-01T10:00:00.000Z");
    expect(fields[FIELDS.clients.lastTouchAt]).toBe("2026-04-09T10:00:00.000Z");
    expect(fields[FIELDS.clients.utmSource]).toBe("google");
    expect(fields[FIELDS.clients.utmMedium]).toBe("cpc");
    expect(fields[FIELDS.clients.utmCampaign]).toBe("spring-launch");
    expect(fields[FIELDS.clients.utmContent]).toBe("hero-v1");
    expect(fields[FIELDS.clients.utmTerm]).toBe("medspa");
  });

  it("creates against the Clients table", async () => {
    mockedFetchFirst.mockResolvedValueOnce([]);

    await upsertClientAttribution(fullPayload());

    expect(mockedCreateRecord.mock.calls[0][0]).toBe(CLIENTS_TABLE_SENTINEL);
  });

  it("omits optional attribution fields that are not in the payload", async () => {
    mockedFetchFirst.mockResolvedValueOnce([]);

    await upsertClientAttribution({
      email: "min@example.com",
      name: "Min Viable",
    });

    const fields = mockedCreateRecord.mock.calls[0][1] as Record<string, string>;
    expect(fields[FIELDS.clients.name]).toBe("Min Viable");
    expect(fields[FIELDS.clients.email]).toBe("min@example.com");
    expect(fields[FIELDS.clients.status]).toBe("New Lead");
    expect(fields[FIELDS.clients.preferredContact]).toBe("Email");
    expect(fields[FIELDS.clients.attributionModel]).toBe("first_touch");
    expect(fields).not.toHaveProperty(FIELDS.clients.leadSource);
    expect(fields).not.toHaveProperty(FIELDS.clients.utmSource);
    expect(fields).not.toHaveProperty(FIELDS.clients.firstTouchAt);
  });
});

// ---------------------------------------------------------------------------
// 2. UPDATE PATH
// ---------------------------------------------------------------------------

describe("upsertClientAttribution — update path (existing client)", () => {
  it("calls updateRecord with the existing record id when any field needs updating", async () => {
    mockedFetchFirst.mockResolvedValueOnce(existingRecord({}));

    await upsertClientAttribution(fullPayload());

    expect(mockedUpdateRecord).toHaveBeenCalledTimes(1);
    expect(mockedCreateRecord).not.toHaveBeenCalled();
    const [tableArg, recordId] = mockedUpdateRecord.mock.calls[0];
    expect(tableArg).toBe(CLIENTS_TABLE_SENTINEL);
    expect(recordId).toBe("recEXISTING123");
  });

  describe("name update logic", () => {
    it("updates name when current name is empty", async () => {
      mockedFetchFirst.mockResolvedValueOnce(
        existingRecord({ [FIELDS.clients.name]: "" })
      );

      await upsertClientAttribution({
        email: "jane@example.com",
        name: "Jane Smith",
      });

      const updates = mockedUpdateRecord.mock.calls[0][2] as Record<string, string>;
      expect(updates[FIELDS.clients.name]).toBe("Jane Smith");
    });

    it("updates name when current name matches email-fallback pattern", async () => {
      mockedFetchFirst.mockResolvedValueOnce(
        existingRecord({ [FIELDS.clients.name]: "jane" })
      );

      await upsertClientAttribution({
        email: "jane@example.com",
        name: "Jane Smith",
      });

      const updates = mockedUpdateRecord.mock.calls[0][2] as Record<string, string>;
      expect(updates[FIELDS.clients.name]).toBe("Jane Smith");
    });

    it("does NOT update name when current name is a real user-set value", async () => {
      mockedFetchFirst.mockResolvedValueOnce(
        existingRecord({
          [FIELDS.clients.name]: "Jane Q. Smith",
          [FIELDS.clients.preferredContact]: "Email",
          [FIELDS.clients.status]: "Active",
          [FIELDS.clients.attributionModel]: "first_touch",
          [FIELDS.clients.phone]: "555-9999",
        })
      );

      await upsertClientAttribution({
        email: "jane@example.com",
        name: "New Name",
      });

      // updates may still contain lastTouchAt etc in other tests, but name must be absent
      if (mockedUpdateRecord.mock.calls.length > 0) {
        const updates = mockedUpdateRecord.mock.calls[0][2] as Record<string, string>;
        expect(updates).not.toHaveProperty(FIELDS.clients.name);
      }
    });

    it("does NOT set name when payload name is missing/empty", async () => {
      mockedFetchFirst.mockResolvedValueOnce(
        existingRecord({ [FIELDS.clients.name]: "" })
      );

      await upsertClientAttribution({ email: "jane@example.com" });

      if (mockedUpdateRecord.mock.calls.length > 0) {
        const updates = mockedUpdateRecord.mock.calls[0][2] as Record<string, string>;
        expect(updates).not.toHaveProperty(FIELDS.clients.name);
      }
    });
  });

  describe("phone update logic", () => {
    it("updates phone when current phone is null/undefined", async () => {
      mockedFetchFirst.mockResolvedValueOnce(existingRecord({}));

      await upsertClientAttribution({
        email: "jane@example.com",
        phone: "555-111-2222",
      });

      const updates = mockedUpdateRecord.mock.calls[0][2] as Record<string, string>;
      expect(updates[FIELDS.clients.phone]).toBe("555-111-2222");
    });

    it("does NOT update phone when current phone is already set", async () => {
      mockedFetchFirst.mockResolvedValueOnce(
        existingRecord({ [FIELDS.clients.phone]: "555-000-0000" })
      );

      await upsertClientAttribution({
        email: "jane@example.com",
        phone: "555-111-2222",
      });

      if (mockedUpdateRecord.mock.calls.length > 0) {
        const updates = mockedUpdateRecord.mock.calls[0][2] as Record<string, string>;
        expect(updates).not.toHaveProperty(FIELDS.clients.phone);
      }
    });

    it("trims whitespace from payload phone before writing", async () => {
      mockedFetchFirst.mockResolvedValueOnce(existingRecord({}));

      await upsertClientAttribution({
        email: "jane@example.com",
        phone: "  555-111-2222  ",
      });

      const updates = mockedUpdateRecord.mock.calls[0][2] as Record<string, string>;
      expect(updates[FIELDS.clients.phone]).toBe("555-111-2222");
    });
  });

  describe("preferredContact update logic", () => {
    it("sets preferredContact when not yet set (Text when phone provided)", async () => {
      mockedFetchFirst.mockResolvedValueOnce(existingRecord({}));

      await upsertClientAttribution({
        email: "jane@example.com",
        phone: "555-111-2222",
      });

      const updates = mockedUpdateRecord.mock.calls[0][2] as Record<string, string>;
      expect(updates[FIELDS.clients.preferredContact]).toBe("Text");
    });

    it("sets preferredContact to Email when not yet set and no phone", async () => {
      mockedFetchFirst.mockResolvedValueOnce(existingRecord({}));

      await upsertClientAttribution({ email: "jane@example.com" });

      const updates = mockedUpdateRecord.mock.calls[0][2] as Record<string, string>;
      expect(updates[FIELDS.clients.preferredContact]).toBe("Email");
    });

    it("does NOT update preferredContact when already set", async () => {
      mockedFetchFirst.mockResolvedValueOnce(
        existingRecord({ [FIELDS.clients.preferredContact]: "Phone" })
      );

      await upsertClientAttribution({
        email: "jane@example.com",
        phone: "555-111-2222",
      });

      if (mockedUpdateRecord.mock.calls.length > 0) {
        const updates = mockedUpdateRecord.mock.calls[0][2] as Record<string, string>;
        expect(updates).not.toHaveProperty(FIELDS.clients.preferredContact);
      }
    });
  });

  describe("status update logic", () => {
    it('sets status to "New Lead" when not yet set', async () => {
      mockedFetchFirst.mockResolvedValueOnce(existingRecord({}));

      await upsertClientAttribution({ email: "jane@example.com" });

      const updates = mockedUpdateRecord.mock.calls[0][2] as Record<string, string>;
      expect(updates[FIELDS.clients.status]).toBe("New Lead");
    });

    it("does NOT update status when already set (e.g. Active)", async () => {
      mockedFetchFirst.mockResolvedValueOnce(
        existingRecord({ [FIELDS.clients.status]: "Active" })
      );

      await upsertClientAttribution({ email: "jane@example.com" });

      if (mockedUpdateRecord.mock.calls.length > 0) {
        const updates = mockedUpdateRecord.mock.calls[0][2] as Record<string, string>;
        expect(updates).not.toHaveProperty(FIELDS.clients.status);
      }
    });
  });

  describe("attributionModel update logic", () => {
    it('sets attributionModel to "first_touch" when not yet set', async () => {
      mockedFetchFirst.mockResolvedValueOnce(existingRecord({}));

      await upsertClientAttribution({ email: "jane@example.com" });

      const updates = mockedUpdateRecord.mock.calls[0][2] as Record<string, string>;
      expect(updates[FIELDS.clients.attributionModel]).toBe("first_touch");
    });

    it("does NOT update attributionModel when already set", async () => {
      mockedFetchFirst.mockResolvedValueOnce(
        existingRecord({ [FIELDS.clients.attributionModel]: "last_touch" })
      );

      await upsertClientAttribution({ email: "jane@example.com" });

      if (mockedUpdateRecord.mock.calls.length > 0) {
        const updates = mockedUpdateRecord.mock.calls[0][2] as Record<string, string>;
        expect(updates).not.toHaveProperty(FIELDS.clients.attributionModel);
      }
    });
  });

  describe("first-touch rule for UTM/Lead fields", () => {
    it("writes first-touch fields when current values are empty", async () => {
      mockedFetchFirst.mockResolvedValueOnce(existingRecord({}));

      await upsertClientAttribution(fullPayload());

      const updates = mockedUpdateRecord.mock.calls[0][2] as Record<string, string>;
      expect(updates[FIELDS.clients.leadSource]).toBe("google");
      expect(updates[FIELDS.clients.leadMedium]).toBe("cpc");
      expect(updates[FIELDS.clients.leadCampaign]).toBe("spring-launch");
      expect(updates[FIELDS.clients.leadAdSet]).toBe("wellness-adset");
      expect(updates[FIELDS.clients.leadAd]).toBe("hero-ad");
      expect(updates[FIELDS.clients.leadOffer]).toBe("free-consult");
      expect(updates[FIELDS.clients.leadLandingPage]).toBe("/landing/wellness");
      expect(updates[FIELDS.clients.leadKeyword]).toBe("medspa renton");
      expect(updates[FIELDS.clients.leadReferrer]).toBe("https://google.com");
      expect(updates[FIELDS.clients.attributionId]).toBe("attr_abc123");
      expect(updates[FIELDS.clients.firstTouchAt]).toBe("2026-04-01T10:00:00.000Z");
      expect(updates[FIELDS.clients.utmSource]).toBe("google");
      expect(updates[FIELDS.clients.utmMedium]).toBe("cpc");
      expect(updates[FIELDS.clients.utmCampaign]).toBe("spring-launch");
      expect(updates[FIELDS.clients.utmContent]).toBe("hero-v1");
      expect(updates[FIELDS.clients.utmTerm]).toBe("medspa");
    });

    it("NEVER overwrites first-touch fields that are already set", async () => {
      mockedFetchFirst.mockResolvedValueOnce(
        existingRecord({
          [FIELDS.clients.leadSource]: "facebook",
          [FIELDS.clients.leadMedium]: "social",
          [FIELDS.clients.leadCampaign]: "brand-awareness",
          [FIELDS.clients.leadAdSet]: "lookalike-1",
          [FIELDS.clients.leadAd]: "carousel-v1",
          [FIELDS.clients.leadOffer]: "intro-50",
          [FIELDS.clients.leadLandingPage]: "/lp/fb",
          [FIELDS.clients.leadKeyword]: "",
          [FIELDS.clients.leadReferrer]: "https://facebook.com",
          [FIELDS.clients.attributionId]: "attr_original",
          [FIELDS.clients.firstTouchAt]: "2026-01-01T00:00:00.000Z",
          [FIELDS.clients.utmSource]: "facebook",
          [FIELDS.clients.utmMedium]: "social",
          [FIELDS.clients.utmCampaign]: "brand-awareness",
          [FIELDS.clients.utmContent]: "carousel-v1",
          [FIELDS.clients.utmTerm]: "",
        })
      );

      await upsertClientAttribution(fullPayload());

      const updates = mockedUpdateRecord.mock.calls[0][2] as Record<string, string>;
      // Already-set fields must NOT be overwritten
      expect(updates).not.toHaveProperty(FIELDS.clients.leadSource);
      expect(updates).not.toHaveProperty(FIELDS.clients.leadMedium);
      expect(updates).not.toHaveProperty(FIELDS.clients.leadCampaign);
      expect(updates).not.toHaveProperty(FIELDS.clients.leadAdSet);
      expect(updates).not.toHaveProperty(FIELDS.clients.leadAd);
      expect(updates).not.toHaveProperty(FIELDS.clients.leadOffer);
      expect(updates).not.toHaveProperty(FIELDS.clients.leadLandingPage);
      expect(updates).not.toHaveProperty(FIELDS.clients.leadReferrer);
      expect(updates).not.toHaveProperty(FIELDS.clients.attributionId);
      expect(updates).not.toHaveProperty(FIELDS.clients.firstTouchAt);
      expect(updates).not.toHaveProperty(FIELDS.clients.utmSource);
      expect(updates).not.toHaveProperty(FIELDS.clients.utmMedium);
      expect(updates).not.toHaveProperty(FIELDS.clients.utmCampaign);
      expect(updates).not.toHaveProperty(FIELDS.clients.utmContent);
      // Empty-string fields should be backfilled
      expect(updates[FIELDS.clients.leadKeyword]).toBe("medspa renton");
      expect(updates[FIELDS.clients.utmTerm]).toBe("medspa");
    });

    it("selectively backfills only empty first-touch fields (mixed state)", async () => {
      mockedFetchFirst.mockResolvedValueOnce(
        existingRecord({
          [FIELDS.clients.leadSource]: "facebook", // already set
          // leadMedium empty → should backfill
          [FIELDS.clients.utmSource]: "facebook", // already set
          // utmMedium empty → should backfill
        })
      );

      await upsertClientAttribution(fullPayload());

      const updates = mockedUpdateRecord.mock.calls[0][2] as Record<string, string>;
      expect(updates).not.toHaveProperty(FIELDS.clients.leadSource);
      expect(updates).not.toHaveProperty(FIELDS.clients.utmSource);
      expect(updates[FIELDS.clients.leadMedium]).toBe("cpc");
      expect(updates[FIELDS.clients.utmMedium]).toBe("cpc");
    });
  });

  describe("lastTouchAt exception", () => {
    it("ALWAYS updates lastTouchAt even when current value is set", async () => {
      mockedFetchFirst.mockResolvedValueOnce(
        existingRecord({
          [FIELDS.clients.lastTouchAt]: "2026-01-01T00:00:00.000Z",
        })
      );

      await upsertClientAttribution(
        fullPayload({ lastTouchAt: "2026-04-09T12:34:56.000Z" })
      );

      const updates = mockedUpdateRecord.mock.calls[0][2] as Record<string, string>;
      expect(updates[FIELDS.clients.lastTouchAt]).toBe(
        "2026-04-09T12:34:56.000Z"
      );
    });

    it("updates lastTouchAt even when all first-touch fields are already set (only lastTouchAt + preferredContact may change)", async () => {
      mockedFetchFirst.mockResolvedValueOnce(
        existingRecord({
          [FIELDS.clients.name]: "Jane Smith",
          [FIELDS.clients.phone]: "555-0000",
          [FIELDS.clients.preferredContact]: "Text",
          [FIELDS.clients.status]: "Active",
          [FIELDS.clients.attributionModel]: "first_touch",
          [FIELDS.clients.leadSource]: "google",
          [FIELDS.clients.leadMedium]: "cpc",
          [FIELDS.clients.leadCampaign]: "existing",
          [FIELDS.clients.leadAdSet]: "existing",
          [FIELDS.clients.leadAd]: "existing",
          [FIELDS.clients.leadOffer]: "existing",
          [FIELDS.clients.leadLandingPage]: "existing",
          [FIELDS.clients.leadKeyword]: "existing",
          [FIELDS.clients.leadReferrer]: "existing",
          [FIELDS.clients.attributionId]: "existing",
          [FIELDS.clients.firstTouchAt]: "2026-01-01T00:00:00.000Z",
          [FIELDS.clients.utmSource]: "existing",
          [FIELDS.clients.utmMedium]: "existing",
          [FIELDS.clients.utmCampaign]: "existing",
          [FIELDS.clients.utmContent]: "existing",
          [FIELDS.clients.utmTerm]: "existing",
          [FIELDS.clients.lastTouchAt]: "2026-01-01T00:00:00.000Z",
        })
      );

      await upsertClientAttribution(
        fullPayload({ lastTouchAt: "2026-04-09T12:34:56.000Z" })
      );

      expect(mockedUpdateRecord).toHaveBeenCalledTimes(1);
      const updates = mockedUpdateRecord.mock.calls[0][2] as Record<string, string>;
      expect(updates).toEqual({
        [FIELDS.clients.lastTouchAt]: "2026-04-09T12:34:56.000Z",
      });
    });

    it("does NOT add lastTouchAt when payload has no lastTouchAt", async () => {
      mockedFetchFirst.mockResolvedValueOnce(existingRecord({}));

      await upsertClientAttribution({
        email: "jane@example.com",
        leadSource: "google",
      });

      const updates = mockedUpdateRecord.mock.calls[0][2] as Record<string, string>;
      expect(updates).not.toHaveProperty(FIELDS.clients.lastTouchAt);
    });
  });

  describe("skip-update optimization", () => {
    it("skips updateRecord entirely when nothing needs updating", async () => {
      mockedFetchFirst.mockResolvedValueOnce(
        existingRecord({
          [FIELDS.clients.name]: "Jane Smith",
          [FIELDS.clients.phone]: "555-0000",
          [FIELDS.clients.preferredContact]: "Text",
          [FIELDS.clients.status]: "Active",
          [FIELDS.clients.attributionModel]: "first_touch",
          [FIELDS.clients.leadSource]: "google",
          [FIELDS.clients.leadMedium]: "cpc",
          [FIELDS.clients.leadCampaign]: "existing",
          [FIELDS.clients.leadAdSet]: "existing",
          [FIELDS.clients.leadAd]: "existing",
          [FIELDS.clients.leadOffer]: "existing",
          [FIELDS.clients.leadLandingPage]: "existing",
          [FIELDS.clients.leadKeyword]: "existing",
          [FIELDS.clients.leadReferrer]: "existing",
          [FIELDS.clients.attributionId]: "existing",
          [FIELDS.clients.firstTouchAt]: "2026-01-01T00:00:00.000Z",
          [FIELDS.clients.utmSource]: "existing",
          [FIELDS.clients.utmMedium]: "existing",
          [FIELDS.clients.utmCampaign]: "existing",
          [FIELDS.clients.utmContent]: "existing",
          [FIELDS.clients.utmTerm]: "existing",
        })
      );

      // Payload carries only an email — nothing to update since every field is set
      // and no lastTouchAt is provided.
      await upsertClientAttribution({ email: "jane@example.com" });

      expect(mockedUpdateRecord).not.toHaveBeenCalled();
      expect(mockedCreateRecord).not.toHaveBeenCalled();
    });
  });
});

// ---------------------------------------------------------------------------
// 3. EDGE CASES
// ---------------------------------------------------------------------------

describe("upsertClientAttribution — edge cases", () => {
  it("silently returns when email is empty string (no API calls)", async () => {
    await upsertClientAttribution({ email: "" });

    expect(mockedFetchFirst).not.toHaveBeenCalled();
    expect(mockedCreateRecord).not.toHaveBeenCalled();
    expect(mockedUpdateRecord).not.toHaveBeenCalled();
  });

  it("silently returns when email is whitespace-only (no API calls)", async () => {
    await upsertClientAttribution({ email: "   \t  \n  " });

    expect(mockedFetchFirst).not.toHaveBeenCalled();
    expect(mockedCreateRecord).not.toHaveBeenCalled();
    expect(mockedUpdateRecord).not.toHaveBeenCalled();
  });

  it("trims leading/trailing whitespace from email before lookup", async () => {
    mockedFetchFirst.mockResolvedValueOnce([]);

    await upsertClientAttribution({ email: "  jane@example.com  " });

    const options = mockedFetchFirst.mock.calls[0][2];
    expect(options?.filterByFormula).toBe(
      `{${FIELDS.clients.email}} = 'jane@example.com'`
    );
    const created = mockedCreateRecord.mock.calls[0][1] as Record<string, string>;
    expect(created[FIELDS.clients.email]).toBe("jane@example.com");
  });

  it("passes email through sanitizeFormulaValue to prevent formula injection", async () => {
    mockedFetchFirst.mockResolvedValueOnce([]);

    await upsertClientAttribution({
      email: "evil'),OR(1=1)@example.com",
    });

    expect(mockedSanitize).toHaveBeenCalledWith("evil'),OR(1=1)@example.com");
    const options = mockedFetchFirst.mock.calls[0][2];
    // Single quotes stripped by the sanitizer pass-through
    expect(options?.filterByFormula).toBe(
      `{${FIELDS.clients.email}} = 'evil),OR(1=1)@example.com'`
    );
    // No unescaped quotes remain inside the string literal
    const inner = (options?.filterByFormula as string).slice(
      (options?.filterByFormula as string).indexOf("'") + 1,
      (options?.filterByFormula as string).lastIndexOf("'")
    );
    expect(inner).not.toContain("'");
  });

  it("also strips newlines and backslashes from the email via the sanitizer", async () => {
    mockedFetchFirst.mockResolvedValueOnce([]);

    await upsertClientAttribution({
      email: 'jane\n"escaped\\path"@example.com',
    });

    const options = mockedFetchFirst.mock.calls[0][2];
    expect(options?.filterByFormula).toBe(
      `{${FIELDS.clients.email}} = 'janeescapedpath@example.com'`
    );
  });

  describe("emailNameFallback", () => {
    it('"john.doe-123@example.com" → "john doe 123"', async () => {
      mockedFetchFirst.mockResolvedValueOnce([]);

      await upsertClientAttribution({ email: "john.doe-123@example.com" });

      const fields = mockedCreateRecord.mock.calls[0][1] as Record<string, string>;
      expect(fields[FIELDS.clients.name]).toBe("john doe 123");
    });

    it('"___@test.com" → "New Lead"', async () => {
      mockedFetchFirst.mockResolvedValueOnce([]);

      await upsertClientAttribution({ email: "___@test.com" });

      const fields = mockedCreateRecord.mock.calls[0][1] as Record<string, string>;
      expect(fields[FIELDS.clients.name]).toBe("New Lead");
    });

    it('"a.b_c-d@example.com" → "a b c d"', async () => {
      mockedFetchFirst.mockResolvedValueOnce([]);

      await upsertClientAttribution({ email: "a.b_c-d@example.com" });

      const fields = mockedCreateRecord.mock.calls[0][1] as Record<string, string>;
      expect(fields[FIELDS.clients.name]).toBe("a b c d");
    });
  });
});

// ---------------------------------------------------------------------------
// 4. ERROR HANDLING
// ---------------------------------------------------------------------------

describe("upsertClientAttribution — error handling", () => {
  it("propagates errors thrown by fetchFirst", async () => {
    const err = new Error("Airtable 500");
    mockedFetchFirst.mockRejectedValueOnce(err);

    await expect(
      upsertClientAttribution({ email: "jane@example.com" })
    ).rejects.toThrow("Airtable 500");

    expect(mockedCreateRecord).not.toHaveBeenCalled();
    expect(mockedUpdateRecord).not.toHaveBeenCalled();
  });

  it("propagates errors thrown by createRecord (not swallowed)", async () => {
    mockedFetchFirst.mockResolvedValueOnce([]);
    const err = new Error("Airtable validation failed");
    mockedCreateRecord.mockRejectedValueOnce(err);

    await expect(
      upsertClientAttribution({ email: "jane@example.com" })
    ).rejects.toThrow("Airtable validation failed");
  });

  it("propagates errors thrown by updateRecord (not swallowed)", async () => {
    mockedFetchFirst.mockResolvedValueOnce(existingRecord({}));
    const err = new Error("Airtable 429");
    mockedUpdateRecord.mockRejectedValueOnce(err);

    await expect(
      upsertClientAttribution({
        email: "jane@example.com",
        name: "Jane Smith",
      })
    ).rejects.toThrow("Airtable 429");
  });
});
