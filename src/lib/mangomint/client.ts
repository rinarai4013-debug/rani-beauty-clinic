// Mangomint API client for booking & scheduling data
// Mangomint uses API keys for authentication
// Docs: https://api.mangomint.com/docs

import crypto from 'crypto';

const MANGOMINT_API_KEY = process.env.MANGOMINT_API_KEY;
const MANGOMINT_WEBHOOK_SECRET = process.env.MANGOMINT_WEBHOOK_SECRET;
const BASE_URL = 'https://api.mangomint.com';

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

async function mangomintFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  if (!MANGOMINT_API_KEY) {
    throw new Error('MANGOMINT_API_KEY not configured');
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Basic ${MANGOMINT_API_KEY}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options?.headers || {}),
    },
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Mangomint API error: ${res.status} - ${errorBody}`);
  }

  return res.json() as Promise<T>;
}

export async function getAppointments(options?: {
  startDate?: string;
  endDate?: string;
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<MangomintAppointment[]> {
  const params = new URLSearchParams();
  if (options?.startDate) params.set('startDate', options.startDate);
  if (options?.endDate) params.set('endDate', options.endDate);
  if (options?.status) params.set('status', options.status);
  params.set('limit', String(options?.limit || 100));
  if (options?.offset) params.set('offset', String(options.offset));

  const query = params.toString();
  return mangomintFetch<MangomintAppointment[]>(
    `/appointments${query ? `?${query}` : ''}`
  );
}

export async function getClients(options?: {
  limit?: number;
  offset?: number;
  search?: string;
}): Promise<MangomintClient[]> {
  const params = new URLSearchParams();
  params.set('limit', String(options?.limit || 100));
  if (options?.offset) params.set('offset', String(options.offset));
  if (options?.search) params.set('search', options.search);

  return mangomintFetch<MangomintClient[]>(
    `/clients?${params.toString()}`
  );
}

export async function getServices(): Promise<MangomintService[]> {
  return mangomintFetch<MangomintService[]>('/services');
}

export async function getTodayAppointments(): Promise<MangomintAppointment[]> {
  const today = new Date().toISOString().substring(0, 10);
  return getAppointments({ startDate: today, endDate: today });
}

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

export function isConfigured(): boolean {
  return !!MANGOMINT_API_KEY;
}

export function isWebhookConfigured(): boolean {
  return !!MANGOMINT_WEBHOOK_SECRET;
}
