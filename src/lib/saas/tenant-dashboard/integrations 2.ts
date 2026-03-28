/**
 * RaniOS Tenant Dashboard — Integration Hub
 *
 * Connector management for Mangomint, Square, Stripe, Twilio, Resend,
 * Google Business, Meta, Google Analytics, Zapier. API key management,
 * connection status monitoring, and data sync status.
 */

import type { TenantConfig, TenantIntegrations } from '@/lib/tenant/config';

// ─── Types ──────────────────────────────────────────────────────────────────

export type IntegrationId =
  | 'mangomint'
  | 'square'
  | 'stripe'
  | 'twilio'
  | 'resend'
  | 'google_business'
  | 'meta'
  | 'google_analytics'
  | 'zapier';

export type ConnectionStatus = 'connected' | 'disconnected' | 'error' | 'syncing' | 'pending';
export type SyncStatus = 'idle' | 'syncing' | 'completed' | 'failed';

export interface Integration {
  id: IntegrationId;
  name: string;
  description: string;
  icon: string;
  category: 'booking' | 'payments' | 'communication' | 'marketing' | 'analytics' | 'automation';
  status: ConnectionStatus;
  lastSync?: string;
  syncStatus: SyncStatus;
  recordsSynced: number;
  error?: string;
  requiredTier: 'starter' | 'professional' | 'enterprise';
  configFields: IntegrationConfigField[];
  capabilities: string[];
  webhookUrl?: string;
  docsUrl: string;
}

export interface IntegrationConfigField {
  key: string;
  label: string;
  type: 'text' | 'password' | 'url' | 'number' | 'select';
  required: boolean;
  placeholder: string;
  helpText?: string;
  options?: { value: string; label: string }[];
}

export interface IntegrationHub {
  integrations: Integration[];
  connected: number;
  total: number;
  syncHealth: number;       // 0–100
  lastFullSync?: string;
}

// ─── Sync Status ────────────────────────────────────────────────────────────

export interface SyncRecord {
  integrationId: IntegrationId;
  direction: 'inbound' | 'outbound' | 'bidirectional';
  entity: string;           // e.g., 'appointments', 'clients', 'payments'
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsFailed: number;
  startedAt: string;
  completedAt?: string;
  status: SyncStatus;
  error?: string;
}

export interface DataSyncStatus {
  integrationId: IntegrationId;
  entities: EntitySync[];
  overallStatus: SyncStatus;
  lastSync: string;
  nextSync: string;
}

export interface EntitySync {
  entity: string;
  recordCount: number;
  lastSynced: string;
  status: SyncStatus;
  syncDirection: 'inbound' | 'outbound' | 'bidirectional';
}

// ─── API Key Management ─────────────────────────────────────────────────────

export interface APIKeyInfo {
  integrationId: IntegrationId;
  keyPreview: string;       // Last 4 chars only
  createdAt: string;
  lastUsed?: string;
  status: 'active' | 'expired' | 'revoked';
}

// ─── Webhook Management ─────────────────────────────────────────────────────

export interface WebhookEndpoint {
  id: string;
  integrationId: IntegrationId;
  url: string;
  events: string[];
  status: 'active' | 'inactive';
  secret: string;
  lastDelivery?: string;
  failureCount: number;
}

// ─── Integration Definitions ────────────────────────────────────────────────

export function getIntegrationDefinitions(): Omit<Integration, 'status' | 'lastSync' | 'syncStatus' | 'recordsSynced' | 'error'>[] {
  return [
    {
      id: 'mangomint',
      name: 'Mangomint',
      description: 'Sync appointments, clients, and sales from your Mangomint account',
      icon: 'Calendar',
      category: 'booking',
      requiredTier: 'starter',
      configFields: [
        { key: 'apiKey', label: 'API Key', type: 'password', required: true, placeholder: 'mm_live_...' },
        { key: 'companyId', label: 'Company ID', type: 'text', required: true, placeholder: '876418' },
      ],
      capabilities: ['Appointment sync', 'Client sync', 'Service catalog', 'Staff schedules', 'Sales data'],
      docsUrl: '/tenant/integrations/mangomint',
    },
    {
      id: 'square',
      name: 'Square',
      description: 'Connect Square POS for payment processing and inventory management',
      icon: 'CreditCard',
      category: 'payments',
      requiredTier: 'starter',
      configFields: [
        { key: 'accessToken', label: 'Access Token', type: 'password', required: true, placeholder: 'sq0atp-...' },
        { key: 'locationId', label: 'Location ID', type: 'text', required: true, placeholder: 'L...' },
      ],
      capabilities: ['Payment processing', 'Transaction history', 'Inventory tracking', 'Gift cards', 'Invoices'],
      docsUrl: '/tenant/integrations/square',
    },
    {
      id: 'stripe',
      name: 'Stripe',
      description: 'Online payments, subscriptions, and checkout for memberships',
      icon: 'Wallet',
      category: 'payments',
      requiredTier: 'starter',
      configFields: [
        { key: 'secretKey', label: 'Secret Key', type: 'password', required: true, placeholder: 'sk_live_...' },
        { key: 'webhookSecret', label: 'Webhook Secret', type: 'password', required: true, placeholder: 'whsec_...' },
      ],
      capabilities: ['Online payments', 'Membership billing', 'Payment links', 'Invoices', 'Refunds'],
      docsUrl: '/tenant/integrations/stripe',
    },
    {
      id: 'twilio',
      name: 'Twilio',
      description: 'SMS messaging for appointment reminders and client communications',
      icon: 'MessageCircle',
      category: 'communication',
      requiredTier: 'starter',
      configFields: [
        { key: 'accountSid', label: 'Account SID', type: 'text', required: true, placeholder: 'AC...' },
        { key: 'authToken', label: 'Auth Token', type: 'password', required: true, placeholder: '' },
        { key: 'fromNumber', label: 'From Number', type: 'text', required: true, placeholder: '+1...' },
      ],
      capabilities: ['SMS sending', 'Appointment reminders', 'Two-way messaging', 'SMS templates'],
      docsUrl: '/tenant/integrations/twilio',
    },
    {
      id: 'resend',
      name: 'Resend',
      description: 'Email sending for campaigns, follow-ups, and transactional emails',
      icon: 'Mail',
      category: 'communication',
      requiredTier: 'starter',
      configFields: [
        { key: 'apiKey', label: 'API Key', type: 'password', required: true, placeholder: 're_...' },
        { key: 'fromEmail', label: 'From Email', type: 'text', required: true, placeholder: 'noreply@yourclinic.com' },
      ],
      capabilities: ['Email campaigns', 'Transactional emails', 'Email templates', 'Delivery tracking'],
      docsUrl: '/tenant/integrations/resend',
    },
    {
      id: 'google_business',
      name: 'Google Business Profile',
      description: 'Manage Google reviews and business profile',
      icon: 'Globe',
      category: 'marketing',
      requiredTier: 'professional',
      configFields: [
        { key: 'placeId', label: 'Place ID', type: 'text', required: true, placeholder: 'ChIJ...' },
        { key: 'apiKey', label: 'API Key', type: 'password', required: true, placeholder: '' },
      ],
      capabilities: ['Review monitoring', 'Review responses', 'Business info updates', 'Posts', 'Insights'],
      docsUrl: '/tenant/integrations/google-business',
    },
    {
      id: 'meta',
      name: 'Meta (Facebook/Instagram)',
      description: 'Meta Ads management and social media integration',
      icon: 'Share2',
      category: 'marketing',
      requiredTier: 'professional',
      configFields: [
        { key: 'accessToken', label: 'Access Token', type: 'password', required: true, placeholder: '' },
        { key: 'adAccountId', label: 'Ad Account ID', type: 'text', required: true, placeholder: 'act_...' },
        { key: 'pageId', label: 'Page ID', type: 'text', required: false, placeholder: '' },
      ],
      capabilities: ['Ad management', 'Campaign analytics', 'Pixel integration', 'Social posting', 'Audience insights'],
      docsUrl: '/tenant/integrations/meta',
    },
    {
      id: 'google_analytics',
      name: 'Google Analytics',
      description: 'Website traffic analytics and conversion tracking',
      icon: 'BarChart',
      category: 'analytics',
      requiredTier: 'professional',
      configFields: [
        { key: 'measurementId', label: 'Measurement ID', type: 'text', required: true, placeholder: 'G-...' },
        { key: 'propertyId', label: 'Property ID', type: 'text', required: true, placeholder: '' },
      ],
      capabilities: ['Traffic analytics', 'Conversion tracking', 'Audience demographics', 'Behavior flow', 'Goals'],
      docsUrl: '/tenant/integrations/google-analytics',
    },
    {
      id: 'zapier',
      name: 'Zapier',
      description: 'Connect to 5000+ apps via webhook endpoints',
      icon: 'Zap',
      category: 'automation',
      requiredTier: 'professional',
      configFields: [
        { key: 'webhookUrl', label: 'Webhook URL', type: 'url', required: false, placeholder: 'https://hooks.zapier.com/...' },
      ],
      capabilities: ['Webhook triggers', 'Custom automations', '5000+ app connections', 'Event streaming'],
      webhookUrl: '/api/tenant/webhooks/zapier',
      docsUrl: '/tenant/integrations/zapier',
    },
  ];
}

// ─── Integration Hub ────────────────────────────────────────────────────────

export function getIntegrationHub(tenant: TenantConfig): IntegrationHub {
  const definitions = getIntegrationDefinitions();
  const integrations: Integration[] = definitions.map(def => {
    const isConnected = checkIntegrationConnected(tenant.integrations, def.id);
    return {
      ...def,
      status: isConnected ? 'connected' : 'disconnected',
      syncStatus: isConnected ? 'completed' : 'idle',
      recordsSynced: 0,
    };
  });

  const connected = integrations.filter(i => i.status === 'connected').length;

  return {
    integrations,
    connected,
    total: integrations.length,
    syncHealth: connected > 0 ? Math.round((connected / integrations.length) * 100) : 0,
  };
}

// ─── Connection Management ──────────────────────────────────────────────────

export function validateIntegrationConfig(
  integrationId: IntegrationId,
  config: Record<string, string>
): { valid: boolean; errors: string[] } {
  const definitions = getIntegrationDefinitions();
  const def = definitions.find(d => d.id === integrationId);
  if (!def) return { valid: false, errors: [`Unknown integration: ${integrationId}`] };

  const errors: string[] = [];
  for (const field of def.configFields) {
    if (field.required && !config[field.key]) {
      errors.push(`${field.label} is required`);
    }
  }

  // Integration-specific validations
  switch (integrationId) {
    case 'stripe':
      if (config.secretKey && !config.secretKey.startsWith('sk_')) {
        errors.push('Stripe secret key should start with sk_');
      }
      break;
    case 'twilio':
      if (config.accountSid && !config.accountSid.startsWith('AC')) {
        errors.push('Twilio Account SID should start with AC');
      }
      break;
    case 'google_analytics':
      if (config.measurementId && !config.measurementId.startsWith('G-')) {
        errors.push('Google Analytics Measurement ID should start with G-');
      }
      break;
  }

  return { valid: errors.length === 0, errors };
}

export async function testIntegrationConnection(
  integrationId: IntegrationId,
  _config: Record<string, string>
): Promise<{ success: boolean; message: string; latency?: number }> {
  // In production, this would make actual API calls to test connectivity
  const start = Date.now();

  // Simulate connection test
  await new Promise(r => setTimeout(r, 100));

  return {
    success: true,
    message: `Successfully connected to ${integrationId}`,
    latency: Date.now() - start,
  };
}

// ─── Sync Operations ────────────────────────────────────────────────────────

export async function triggerSync(
  integrationId: IntegrationId,
  _tenant: TenantConfig,
  entities?: string[]
): Promise<SyncRecord> {
  return {
    integrationId,
    direction: 'bidirectional',
    entity: entities?.join(', ') || 'all',
    recordsProcessed: 0,
    recordsCreated: 0,
    recordsUpdated: 0,
    recordsFailed: 0,
    startedAt: new Date().toISOString(),
    status: 'syncing',
  };
}

export function getDataSyncStatus(
  integrationId: IntegrationId,
  _tenant: TenantConfig
): DataSyncStatus {
  const entityMap: Record<IntegrationId, EntitySync[]> = {
    mangomint: [
      { entity: 'appointments', recordCount: 0, lastSynced: '', status: 'idle', syncDirection: 'inbound' },
      { entity: 'clients', recordCount: 0, lastSynced: '', status: 'idle', syncDirection: 'inbound' },
      { entity: 'services', recordCount: 0, lastSynced: '', status: 'idle', syncDirection: 'inbound' },
      { entity: 'staff', recordCount: 0, lastSynced: '', status: 'idle', syncDirection: 'inbound' },
    ],
    square: [
      { entity: 'payments', recordCount: 0, lastSynced: '', status: 'idle', syncDirection: 'inbound' },
      { entity: 'inventory', recordCount: 0, lastSynced: '', status: 'idle', syncDirection: 'bidirectional' },
      { entity: 'customers', recordCount: 0, lastSynced: '', status: 'idle', syncDirection: 'inbound' },
    ],
    stripe: [
      { entity: 'payments', recordCount: 0, lastSynced: '', status: 'idle', syncDirection: 'inbound' },
      { entity: 'subscriptions', recordCount: 0, lastSynced: '', status: 'idle', syncDirection: 'inbound' },
      { entity: 'invoices', recordCount: 0, lastSynced: '', status: 'idle', syncDirection: 'inbound' },
    ],
    twilio: [
      { entity: 'messages', recordCount: 0, lastSynced: '', status: 'idle', syncDirection: 'bidirectional' },
    ],
    resend: [
      { entity: 'emails', recordCount: 0, lastSynced: '', status: 'idle', syncDirection: 'outbound' },
    ],
    google_business: [
      { entity: 'reviews', recordCount: 0, lastSynced: '', status: 'idle', syncDirection: 'inbound' },
      { entity: 'posts', recordCount: 0, lastSynced: '', status: 'idle', syncDirection: 'outbound' },
    ],
    meta: [
      { entity: 'campaigns', recordCount: 0, lastSynced: '', status: 'idle', syncDirection: 'inbound' },
      { entity: 'ads', recordCount: 0, lastSynced: '', status: 'idle', syncDirection: 'inbound' },
      { entity: 'insights', recordCount: 0, lastSynced: '', status: 'idle', syncDirection: 'inbound' },
    ],
    google_analytics: [
      { entity: 'pageviews', recordCount: 0, lastSynced: '', status: 'idle', syncDirection: 'inbound' },
      { entity: 'conversions', recordCount: 0, lastSynced: '', status: 'idle', syncDirection: 'inbound' },
    ],
    zapier: [
      { entity: 'webhooks', recordCount: 0, lastSynced: '', status: 'idle', syncDirection: 'outbound' },
    ],
  };

  return {
    integrationId,
    entities: entityMap[integrationId] || [],
    overallStatus: 'idle',
    lastSync: '',
    nextSync: '',
  };
}

// ─── Zapier Webhook ─────────────────────────────────────────────────────────

export interface ZapierWebhookPayload {
  event: string;
  tenantId: string;
  timestamp: string;
  data: Record<string, unknown>;
}

export function buildZapierPayload(
  tenantId: string,
  event: string,
  data: Record<string, unknown>
): ZapierWebhookPayload {
  return {
    event,
    tenantId,
    timestamp: new Date().toISOString(),
    data,
  };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function checkIntegrationConnected(integrations: TenantIntegrations, id: IntegrationId): boolean {
  switch (id) {
    case 'mangomint': return !!integrations.mangomint?.apiKey;
    case 'square': return !!integrations.square?.accessToken;
    case 'stripe': return !!integrations.stripe?.secretKey;
    case 'twilio': return !!integrations.twilio?.accountSid;
    case 'resend': return !!integrations.resend?.apiKey;
    case 'meta': return !!integrations.meta?.accessToken;
    default: return false;
  }
}
