// Mangomint integration — webhook verification only
// Mangomint does NOT expose a public REST API, so all outbound API
// functions have been removed. Booking data comes from Airtable
// (populated by inbound Mangomint webhooks via n8n).

import crypto from 'crypto';

const MANGOMINT_WEBHOOK_SECRET = process.env.MANGOMINT_WEBHOOK_SECRET;

export interface MangomintAppointment {
  id: number;
  startAt: string;
  endAt: string;
  status: string;
  clientId: number;
  staffId: number;
  serviceId: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MangomintClient {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
  mobilePhone?: string;
  homePhone?: string;
  createdAt: string;
  lastVisitDate?: string;
  totalVisits?: number;
}

export interface MangomintService {
  id: number;
  name: string;
  duration: number;
  price: number;
  categoryName?: string;
}

export interface ParsedAppointment {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  clientName: string;
  clientId: number;
  staffId: number;
  serviceName?: string;
  notes?: string;
}

// Webhook event types Mangomint can send
export type WebhookEventType =
  | 'appointment.created'
  | 'appointment.updated'
  | 'appointment.cancelled'
  | 'appointment.completed'
  | 'client.created'
  | 'client.updated'
  | 'sale.completed';

export interface WebhookPayload {
  event: WebhookEventType;
  data: Record<string, unknown>;
  timestamp: string;
}

// ─── Stubs for callers that check API availability ──────────────────────────
// These functions are called by booking/data.ts and mangomint-intelligence.ts.
// They gracefully degrade — callers fall back to Airtable when these return
// empty results or when isConfigured() returns false.

/**
 * Always returns false — Mangomint has no public API.
 * Callers use this to decide whether to try the API or fall back to Airtable.
 */
export function isConfigured(): boolean {
  return false;
}

export function isWebhookConfigured(): boolean {
  return !!MANGOMINT_WEBHOOK_SECRET;
}

/** @deprecated Mangomint has no public API — always throws */
export async function getAppointments(_options?: {
  startDate?: string;
  endDate?: string;
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<MangomintAppointment[]> {
  throw new Error('Mangomint does not expose a public API. Use Airtable data instead.');
}

/** @deprecated Mangomint has no public API — always throws */
export async function getClients(_options?: {
  limit?: number;
  offset?: number;
  search?: string;
}): Promise<MangomintClient[]> {
  throw new Error('Mangomint does not expose a public API. Use Airtable data instead.');
}

/** @deprecated Mangomint has no public API — always throws */
export async function getServices(): Promise<MangomintService[]> {
  throw new Error('Mangomint does not expose a public API. Use Airtable data instead.');
}

/** @deprecated Mangomint has no public API — always throws */
export async function getTodayAppointments(): Promise<MangomintAppointment[]> {
  throw new Error('Mangomint does not expose a public API. Use Airtable data instead.');
}

// ─── Webhook Verification (active — this is how Mangomint data flows in) ────

export function verifyWebhookSignature(
  body: string,
  signature: string
): boolean {
  if (!MANGOMINT_WEBHOOK_SECRET) return false;
  // Mangomint uses HMAC-SHA256 for webhook verification
  const expectedSignature = crypto
    .createHmac('sha256', MANGOMINT_WEBHOOK_SECRET)
    .update(body)
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}
