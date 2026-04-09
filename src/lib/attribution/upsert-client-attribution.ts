import { fetchFirst, Tables, createRecord, updateRecord } from "@/lib/airtable/client";
import { sanitizeFormulaValue } from "@/lib/airtable/sanitize";
import { FIELDS } from "@/lib/airtable/tables";

type ClientAttributionPayload = {
  name?: string;
  email: string;
  phone?: string;
  leadSource?: string;
  leadMedium?: string;
  leadCampaign?: string;
  leadAdSet?: string;
  leadAd?: string;
  leadOffer?: string;
  leadLandingPage?: string;
  leadKeyword?: string;
  leadReferrer?: string;
  attributionId?: string;
  firstTouchAt?: string;
  lastTouchAt?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
};

type AirtableClientRecord = Record<string, string | number | null | string[] | undefined>;

type FirstTouchFieldKey =
  | "leadSource"
  | "leadMedium"
  | "leadCampaign"
  | "leadAdSet"
  | "leadAd"
  | "leadOffer"
  | "leadLandingPage"
  | "leadKeyword"
  | "leadReferrer"
  | "attributionId"
  | "firstTouchAt"
  | "utm_source"
  | "utm_medium"
  | "utm_campaign"
  | "utm_content"
  | "utm_term";

const FIRST_TOUCH_FIELDS: FirstTouchFieldKey[] = [
  "leadSource",
  "leadMedium",
  "leadCampaign",
  "leadAdSet",
  "leadAd",
  "leadOffer",
  "leadLandingPage",
  "leadKeyword",
  "leadReferrer",
  "attributionId",
  "firstTouchAt",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
];

const FIRST_TOUCH_FIELD_MAP: Record<FirstTouchFieldKey, string> = {
  leadSource: FIELDS.clients.leadSource,
  leadMedium: FIELDS.clients.leadMedium,
  leadCampaign: FIELDS.clients.leadCampaign,
  leadAdSet: FIELDS.clients.leadAdSet,
  leadAd: FIELDS.clients.leadAd,
  leadOffer: FIELDS.clients.leadOffer,
  leadLandingPage: FIELDS.clients.leadLandingPage,
  leadKeyword: FIELDS.clients.leadKeyword,
  leadReferrer: FIELDS.clients.leadReferrer,
  attributionId: FIELDS.clients.attributionId,
  firstTouchAt: FIELDS.clients.firstTouchAt,
  utm_source: FIELDS.clients.utmSource,
  utm_medium: FIELDS.clients.utmMedium,
  utm_campaign: FIELDS.clients.utmCampaign,
  utm_content: FIELDS.clients.utmContent,
  utm_term: FIELDS.clients.utmTerm,
};

function emailNameFallback(email: string) {
  return email.split("@")[0].replace(/[._-]+/g, " ").trim() || "New Lead";
}

function toClientFields(payload: ClientAttributionPayload): Record<string, string> {
  const fields: Record<string, string> = {};

  if (payload.leadSource) fields[FIELDS.clients.leadSource] = payload.leadSource;
  if (payload.leadMedium) fields[FIELDS.clients.leadMedium] = payload.leadMedium;
  if (payload.leadCampaign) fields[FIELDS.clients.leadCampaign] = payload.leadCampaign;
  if (payload.leadAdSet) fields[FIELDS.clients.leadAdSet] = payload.leadAdSet;
  if (payload.leadAd) fields[FIELDS.clients.leadAd] = payload.leadAd;
  if (payload.leadOffer) fields[FIELDS.clients.leadOffer] = payload.leadOffer;
  if (payload.leadLandingPage) fields[FIELDS.clients.leadLandingPage] = payload.leadLandingPage;
  if (payload.leadKeyword) fields[FIELDS.clients.leadKeyword] = payload.leadKeyword;
  if (payload.leadReferrer) fields[FIELDS.clients.leadReferrer] = payload.leadReferrer;
  if (payload.attributionId) fields[FIELDS.clients.attributionId] = payload.attributionId;
  if (payload.firstTouchAt) fields[FIELDS.clients.firstTouchAt] = payload.firstTouchAt;
  if (payload.lastTouchAt) fields[FIELDS.clients.lastTouchAt] = payload.lastTouchAt;
  if (payload.utm_source) fields[FIELDS.clients.utmSource] = payload.utm_source;
  if (payload.utm_medium) fields[FIELDS.clients.utmMedium] = payload.utm_medium;
  if (payload.utm_campaign) fields[FIELDS.clients.utmCampaign] = payload.utm_campaign;
  if (payload.utm_content) fields[FIELDS.clients.utmContent] = payload.utm_content;
  if (payload.utm_term) fields[FIELDS.clients.utmTerm] = payload.utm_term;

  return fields;
}

function choosePreferredContact(payload: ClientAttributionPayload) {
  return payload.phone ? "Text" : "Email";
}

function createClientPayload(payload: ClientAttributionPayload): Record<string, string> {
  return {
    [FIELDS.clients.name]: payload.name?.trim() || emailNameFallback(payload.email),
    [FIELDS.clients.email]: payload.email.trim(),
    ...(payload.phone ? { [FIELDS.clients.phone]: payload.phone.trim() } : {}),
    [FIELDS.clients.status]: "New Lead",
    [FIELDS.clients.preferredContact]: choosePreferredContact(payload),
    [FIELDS.clients.attributionModel]: "first_touch",
    ...toClientFields(payload),
  };
}

export async function upsertClientAttribution(payload: ClientAttributionPayload) {
  const email = payload.email.trim();
  if (!email) return;

  const existing = await fetchFirst<AirtableClientRecord>(
    Tables.clients(),
    1,
    { filterByFormula: `{${FIELDS.clients.email}} = '${sanitizeFormulaValue(email)}'` },
    true
  );

  if (existing.length === 0) {
    await createRecord(Tables.clients(), createClientPayload(payload));
    return;
  }

  const current = existing[0];
  const currentFields = current.fields;
  const updates: Record<string, string> = {};
  const mapped = toClientFields(payload);

  const currentName = String(currentFields[FIELDS.clients.name] || "").trim();
  if (payload.name?.trim() && (!currentName || currentName === emailNameFallback(email))) {
    updates[FIELDS.clients.name] = payload.name.trim();
  }

  if (payload.phone?.trim() && !currentFields[FIELDS.clients.phone]) {
    updates[FIELDS.clients.phone] = payload.phone.trim();
  }

  if (!currentFields[FIELDS.clients.preferredContact]) {
    updates[FIELDS.clients.preferredContact] = choosePreferredContact(payload);
  }

  if (!currentFields[FIELDS.clients.status]) {
    updates[FIELDS.clients.status] = "New Lead";
  }

  if (!currentFields[FIELDS.clients.attributionModel]) {
    updates[FIELDS.clients.attributionModel] = "first_touch";
  }

  for (const key of FIRST_TOUCH_FIELDS) {
    const fieldName = FIRST_TOUCH_FIELD_MAP[key];
    const value = mapped[fieldName];
    if (value && !currentFields[fieldName]) {
      updates[fieldName] = value;
    }
  }

  if (mapped[FIELDS.clients.lastTouchAt]) {
    updates[FIELDS.clients.lastTouchAt] = mapped[FIELDS.clients.lastTouchAt];
  }

  if (Object.keys(updates).length > 0) {
    await updateRecord(Tables.clients(), current.id, updates);
  }
}
