// =============================================================================
// RaniOS Integration Marketplace
// 30+ integrations catalog, installation, health monitoring, search
// =============================================================================

import type {
  IntegrationDefinition,
  IntegrationInstance,
  IntegrationCategory,
  IntegrationStatus,
  IntegrationPricing,
  IntegrationUsageMetrics,
  IntegrationHealthReport,
  HealthCheckItem,
  IntegrationConfig,
  MarketplaceSearchParams,
  MarketplaceSearchResult,
  SyncMode,
  EncryptedCredentials,
} from './types';

// =============================================================================
// Integration Catalog (30+ integrations)
// =============================================================================

const INTEGRATION_CATALOG: IntegrationDefinition[] = [
  // --- CRM ---
  {
    id: 'mangomint',
    name: 'Mangomint',
    slug: 'mangomint',
    category: 'crm',
    description: 'Premium salon and spa management software with scheduling, POS, and client management.',
    longDescription: 'Connect Mangomint to sync appointments, client profiles, transactions, and service catalogs. Two-way sync keeps your operations dashboard in perfect alignment with front-desk activity.',
    icon: '/integrations/mangomint.svg',
    pricing: 'free',
    monthlyPrice: null,
    setupComplexity: 'moderate',
    connectionMethod: 'api_key',
    documentationUrl: 'https://docs.ranios.com/integrations/mangomint',
    requiredScopes: ['appointments:read', 'appointments:write', 'clients:read', 'clients:write', 'services:read'],
    webhookEvents: ['appointment.created', 'appointment.updated', 'appointment.cancelled', 'appointment.completed', 'client.created', 'client.updated'],
    features: ['Appointment sync', 'Client profile sync', 'Service catalog import', 'Transaction history', 'Webhook real-time events'],
    tier: 'starter',
    isPopular: true,
    isFeatured: true,
    isNew: false,
    version: '2.1.0',
    author: 'RaniOS',
    supportUrl: 'https://support.ranios.com/mangomint',
    privacyUrl: 'https://www.mangomint.com/privacy',
  },
  {
    id: 'boulevard',
    name: 'Boulevard',
    slug: 'boulevard',
    category: 'crm',
    description: 'Client experience platform built for appointment-based, self-care businesses.',
    longDescription: 'Sync clients, appointments, and services from Boulevard. Auto-import booking data and keep your CRM enriched with the latest visit history and preferences.',
    icon: '/integrations/boulevard.svg',
    pricing: 'free',
    monthlyPrice: null,
    setupComplexity: 'moderate',
    connectionMethod: 'oauth2',
    documentationUrl: 'https://docs.ranios.com/integrations/boulevard',
    requiredScopes: ['clients:read', 'appointments:read', 'services:read'],
    webhookEvents: ['appointment.created', 'appointment.completed', 'client.created'],
    features: ['Client sync', 'Appointment sync', 'Service catalog', 'Online booking data'],
    tier: 'starter',
    isPopular: true,
    isFeatured: false,
    isNew: false,
    version: '1.4.0',
    author: 'RaniOS',
    supportUrl: 'https://support.ranios.com/boulevard',
    privacyUrl: 'https://www.joinblvd.com/privacy',
  },
  {
    id: 'vagaro',
    name: 'Vagaro',
    slug: 'vagaro',
    category: 'crm',
    description: 'Booking, payments, and business management for salons, spas, and fitness.',
    longDescription: 'Import your Vagaro client base, appointment history, and service menu into RaniOS. Keep everything synchronized for a complete operational picture.',
    icon: '/integrations/vagaro.svg',
    pricing: 'free',
    monthlyPrice: null,
    setupComplexity: 'simple',
    connectionMethod: 'api_key',
    documentationUrl: 'https://docs.ranios.com/integrations/vagaro',
    requiredScopes: ['clients:read', 'appointments:read'],
    webhookEvents: ['appointment.created', 'appointment.completed'],
    features: ['Client import', 'Appointment sync', 'Service catalog'],
    tier: 'starter',
    isPopular: false,
    isFeatured: false,
    isNew: false,
    version: '1.2.0',
    author: 'RaniOS',
    supportUrl: 'https://support.ranios.com/vagaro',
    privacyUrl: 'https://www.vagaro.com/privacy',
  },
  {
    id: 'mindbody',
    name: 'MindBody',
    slug: 'mindbody',
    category: 'crm',
    description: 'Wellness business management for fitness, beauty, and integrative health.',
    longDescription: 'Connect MindBody to pull in class schedules, client data, and transaction history. Perfect for hybrid wellness-medspa practices.',
    icon: '/integrations/mindbody.svg',
    pricing: 'paid',
    monthlyPrice: 29,
    setupComplexity: 'advanced',
    connectionMethod: 'oauth2',
    documentationUrl: 'https://docs.ranios.com/integrations/mindbody',
    requiredScopes: ['clients', 'appointments', 'classes', 'sales'],
    webhookEvents: ['appointment.created', 'appointment.completed', 'client.created', 'payment.completed'],
    features: ['Full client sync', 'Class/appointment sync', 'Sales data', 'Staff management', 'Membership tracking'],
    tier: 'pro',
    isPopular: true,
    isFeatured: false,
    isNew: false,
    version: '2.0.0',
    author: 'RaniOS',
    supportUrl: 'https://support.ranios.com/mindbody',
    privacyUrl: 'https://www.mindbodyonline.com/privacy-policy',
  },
  {
    id: 'zenoti',
    name: 'Zenoti',
    slug: 'zenoti',
    category: 'crm',
    description: 'Enterprise spa and salon management for multi-location businesses.',
    longDescription: 'Full enterprise sync with Zenoti including multi-location data, advanced reporting feeds, and centralized client management across all your locations.',
    icon: '/integrations/zenoti.svg',
    pricing: 'premium',
    monthlyPrice: 79,
    setupComplexity: 'advanced',
    connectionMethod: 'oauth2',
    documentationUrl: 'https://docs.ranios.com/integrations/zenoti',
    requiredScopes: ['centers', 'guests', 'appointments', 'sales', 'inventory', 'employees'],
    webhookEvents: ['appointment.created', 'appointment.updated', 'appointment.completed', 'client.created', 'client.updated', 'payment.completed', 'inventory.low'],
    features: ['Multi-location sync', 'Full client profiles', 'Inventory tracking', 'Employee management', 'Advanced reporting', 'Membership data'],
    tier: 'enterprise',
    isPopular: false,
    isFeatured: true,
    isNew: false,
    version: '1.8.0',
    author: 'RaniOS',
    supportUrl: 'https://support.ranios.com/zenoti',
    privacyUrl: 'https://www.zenoti.com/privacy-policy',
  },

  // --- Payments ---
  {
    id: 'square',
    name: 'Square',
    slug: 'square',
    category: 'payments',
    description: 'Payment processing, POS, and business management tools.',
    longDescription: 'Sync all Square transactions, invoices, and payment methods. Auto-categorize revenue by service type and track real-time payment activity in your dashboard.',
    icon: '/integrations/square.svg',
    pricing: 'free',
    monthlyPrice: null,
    setupComplexity: 'simple',
    connectionMethod: 'oauth2',
    documentationUrl: 'https://docs.ranios.com/integrations/square',
    requiredScopes: ['PAYMENTS_READ', 'ORDERS_READ', 'CUSTOMERS_READ', 'INVOICES_READ'],
    webhookEvents: ['payment.completed', 'payment.refunded', 'invoice.created', 'invoice.paid'],
    features: ['Transaction sync', 'Invoice tracking', 'Customer data', 'Refund monitoring', 'Daily settlement reports'],
    tier: 'starter',
    isPopular: true,
    isFeatured: true,
    isNew: false,
    version: '2.3.0',
    author: 'RaniOS',
    supportUrl: 'https://support.ranios.com/square',
    privacyUrl: 'https://squareup.com/privacy',
  },
  {
    id: 'stripe',
    name: 'Stripe',
    slug: 'stripe',
    category: 'payments',
    description: 'Online payment processing for internet businesses.',
    longDescription: 'Connect Stripe for subscription billing, one-time payments, and financial reporting. Essential for practices with online booking deposits or membership billing.',
    icon: '/integrations/stripe.svg',
    pricing: 'free',
    monthlyPrice: null,
    setupComplexity: 'simple',
    connectionMethod: 'oauth2',
    documentationUrl: 'https://docs.ranios.com/integrations/stripe',
    requiredScopes: ['read_write'],
    webhookEvents: ['payment.completed', 'payment.refunded', 'invoice.created', 'invoice.paid', 'membership.created', 'membership.cancelled'],
    features: ['Payment processing', 'Subscription billing', 'Invoice management', 'Refund handling', 'Revenue reporting'],
    tier: 'starter',
    isPopular: true,
    isFeatured: true,
    isNew: false,
    version: '3.0.0',
    author: 'RaniOS',
    supportUrl: 'https://support.ranios.com/stripe',
    privacyUrl: 'https://stripe.com/privacy',
  },
  {
    id: 'cherry',
    name: 'Cherry',
    slug: 'cherry',
    category: 'payments',
    description: 'Patient financing for medical aesthetics and wellness.',
    longDescription: 'Track Cherry financing applications, approvals, and disbursements. See which clients are using financing and monitor approval rates in your dashboard.',
    icon: '/integrations/cherry.svg',
    pricing: 'free',
    monthlyPrice: null,
    setupComplexity: 'simple',
    connectionMethod: 'api_key',
    documentationUrl: 'https://docs.ranios.com/integrations/cherry',
    requiredScopes: ['applications:read', 'transactions:read'],
    webhookEvents: ['payment.completed'],
    features: ['Application tracking', 'Approval monitoring', 'Disbursement sync', 'Financing analytics'],
    tier: 'starter',
    isPopular: false,
    isFeatured: false,
    isNew: false,
    version: '1.1.0',
    author: 'RaniOS',
    supportUrl: 'https://support.ranios.com/cherry',
    privacyUrl: 'https://www.withcherry.com/privacy',
  },
  {
    id: 'patientfi',
    name: 'PatientFi',
    slug: 'patientfi',
    category: 'payments',
    description: 'Buy-now-pay-later financing for elective healthcare.',
    longDescription: 'Monitor PatientFi financing plans, track client payment progress, and analyze financing adoption rates across your services.',
    icon: '/integrations/patientfi.svg',
    pricing: 'free',
    monthlyPrice: null,
    setupComplexity: 'simple',
    connectionMethod: 'api_key',
    documentationUrl: 'https://docs.ranios.com/integrations/patientfi',
    requiredScopes: ['plans:read'],
    webhookEvents: ['payment.completed'],
    features: ['Plan tracking', 'Payment monitoring', 'Adoption analytics'],
    tier: 'pro',
    isPopular: false,
    isFeatured: false,
    isNew: false,
    version: '1.0.0',
    author: 'RaniOS',
    supportUrl: 'https://support.ranios.com/patientfi',
    privacyUrl: 'https://www.patientfi.com/privacy',
  },
  {
    id: 'carecredit',
    name: 'CareCredit',
    slug: 'carecredit',
    category: 'payments',
    description: 'Healthcare credit card for patients.',
    longDescription: 'Track CareCredit transactions and monitor which clients are using healthcare financing for their treatments.',
    icon: '/integrations/carecredit.svg',
    pricing: 'free',
    monthlyPrice: null,
    setupComplexity: 'simple',
    connectionMethod: 'api_key',
    documentationUrl: 'https://docs.ranios.com/integrations/carecredit',
    requiredScopes: ['transactions:read'],
    webhookEvents: ['payment.completed'],
    features: ['Transaction tracking', 'Client financing status'],
    tier: 'pro',
    isPopular: false,
    isFeatured: false,
    isNew: true,
    version: '1.0.0',
    author: 'RaniOS',
    supportUrl: 'https://support.ranios.com/carecredit',
    privacyUrl: 'https://www.carecredit.com/privacy',
  },

  // --- Communications ---
  {
    id: 'twilio',
    name: 'Twilio',
    slug: 'twilio',
    category: 'communications',
    description: 'Cloud communications platform for SMS, voice, and messaging.',
    longDescription: 'Power your appointment reminders, follow-up sequences, and client communications with Twilio. Full SMS and voice support with delivery tracking.',
    icon: '/integrations/twilio.svg',
    pricing: 'free',
    monthlyPrice: null,
    setupComplexity: 'moderate',
    connectionMethod: 'api_key',
    documentationUrl: 'https://docs.ranios.com/integrations/twilio',
    requiredScopes: ['messages:send', 'messages:read', 'calls:send'],
    webhookEvents: ['message.sent', 'message.received'],
    features: ['SMS sending', 'Delivery tracking', 'Two-way messaging', 'Voice calls', 'Phone number provisioning'],
    tier: 'starter',
    isPopular: true,
    isFeatured: false,
    isNew: false,
    version: '2.0.0',
    author: 'RaniOS',
    supportUrl: 'https://support.ranios.com/twilio',
    privacyUrl: 'https://www.twilio.com/legal/privacy',
  },
  {
    id: 'mailchimp',
    name: 'Mailchimp',
    slug: 'mailchimp',
    category: 'communications',
    description: 'Email marketing and audience management platform.',
    longDescription: 'Sync your client segments to Mailchimp audiences. Power targeted email campaigns based on treatment history, membership status, and engagement level.',
    icon: '/integrations/mailchimp.svg',
    pricing: 'free',
    monthlyPrice: null,
    setupComplexity: 'simple',
    connectionMethod: 'oauth2',
    documentationUrl: 'https://docs.ranios.com/integrations/mailchimp',
    requiredScopes: ['lists:read', 'lists:write', 'campaigns:read'],
    webhookEvents: ['lead.created'],
    features: ['Audience sync', 'Segment mapping', 'Campaign analytics', 'Tag management'],
    tier: 'starter',
    isPopular: true,
    isFeatured: false,
    isNew: false,
    version: '1.5.0',
    author: 'RaniOS',
    supportUrl: 'https://support.ranios.com/mailchimp',
    privacyUrl: 'https://www.intuit.com/privacy/statement/',
  },
  {
    id: 'klaviyo',
    name: 'Klaviyo',
    slug: 'klaviyo',
    category: 'communications',
    description: 'Email and SMS marketing automation for growth.',
    longDescription: 'Advanced email and SMS marketing automation. Sync client data, treatment history, and behavioral events to power personalized marketing flows.',
    icon: '/integrations/klaviyo.svg',
    pricing: 'paid',
    monthlyPrice: 19,
    setupComplexity: 'moderate',
    connectionMethod: 'api_key',
    documentationUrl: 'https://docs.ranios.com/integrations/klaviyo',
    requiredScopes: ['profiles:read', 'profiles:write', 'events:write', 'flows:read'],
    webhookEvents: ['client.created', 'appointment.completed', 'lead.created'],
    features: ['Profile sync', 'Event tracking', 'Flow triggers', 'Segment sync', 'SMS + Email'],
    tier: 'pro',
    isPopular: false,
    isFeatured: true,
    isNew: false,
    version: '1.3.0',
    author: 'RaniOS',
    supportUrl: 'https://support.ranios.com/klaviyo',
    privacyUrl: 'https://www.klaviyo.com/legal/privacy-notice',
  },
  {
    id: 'mailgun',
    name: 'Mailgun',
    slug: 'mailgun',
    category: 'communications',
    description: 'Transactional email API for developers.',
    longDescription: 'Send transactional emails (appointment confirmations, follow-ups, receipts) through Mailgun with delivery tracking and analytics.',
    icon: '/integrations/mailgun.svg',
    pricing: 'free',
    monthlyPrice: null,
    setupComplexity: 'moderate',
    connectionMethod: 'api_key',
    documentationUrl: 'https://docs.ranios.com/integrations/mailgun',
    requiredScopes: ['messages:send'],
    webhookEvents: ['message.sent'],
    features: ['Transactional email', 'Delivery tracking', 'Bounce handling', 'Template management'],
    tier: 'pro',
    isPopular: false,
    isFeatured: false,
    isNew: false,
    version: '1.1.0',
    author: 'RaniOS',
    supportUrl: 'https://support.ranios.com/mailgun',
    privacyUrl: 'https://www.sinch.com/privacy-notice/',
  },

  // --- EHR ---
  {
    id: 'drchrono',
    name: 'DrChrono',
    slug: 'drchrono',
    category: 'ehr',
    description: 'EHR, practice management, and medical billing.',
    longDescription: 'Sync patient records, clinical notes, and billing data from DrChrono. Keep clinical and operational data aligned for a complete patient picture.',
    icon: '/integrations/drchrono.svg',
    pricing: 'paid',
    monthlyPrice: 49,
    setupComplexity: 'advanced',
    connectionMethod: 'oauth2',
    documentationUrl: 'https://docs.ranios.com/integrations/drchrono',
    requiredScopes: ['patients:read', 'appointments:read', 'clinical:read'],
    webhookEvents: ['appointment.created', 'appointment.completed', 'client.created', 'client.updated'],
    features: ['Patient record sync', 'Appointment sync', 'Clinical notes access', 'Billing data', 'Insurance verification'],
    tier: 'enterprise',
    isPopular: false,
    isFeatured: false,
    isNew: false,
    version: '1.2.0',
    author: 'RaniOS',
    supportUrl: 'https://support.ranios.com/drchrono',
    privacyUrl: 'https://www.drchrono.com/privacy/',
  },
  {
    id: 'modmed',
    name: 'ModMed',
    slug: 'modmed',
    category: 'ehr',
    description: 'Specialty-specific EHR for dermatology and plastic surgery.',
    longDescription: 'Connect ModMed for specialty-specific clinical data sync. Pull in dermatology and plastic surgery records, photos, and treatment histories.',
    icon: '/integrations/modmed.svg',
    pricing: 'premium',
    monthlyPrice: 79,
    setupComplexity: 'advanced',
    connectionMethod: 'oauth2',
    documentationUrl: 'https://docs.ranios.com/integrations/modmed',
    requiredScopes: ['patients:read', 'encounters:read', 'photos:read'],
    webhookEvents: ['client.created', 'client.updated', 'appointment.completed'],
    features: ['Clinical record sync', 'Photo documentation', 'Treatment history', 'Prescription data'],
    tier: 'enterprise',
    isPopular: false,
    isFeatured: false,
    isNew: false,
    version: '1.0.0',
    author: 'RaniOS',
    supportUrl: 'https://support.ranios.com/modmed',
    privacyUrl: 'https://www.modmed.com/privacy-policy/',
  },
  {
    id: 'nextech',
    name: 'Nextech',
    slug: 'nextech',
    category: 'ehr',
    description: 'Practice management and EHR for specialty healthcare.',
    longDescription: 'Enterprise EHR integration for specialty practices. Sync patient records, clinical workflows, and billing data from Nextech.',
    icon: '/integrations/nextech.svg',
    pricing: 'premium',
    monthlyPrice: 99,
    setupComplexity: 'advanced',
    connectionMethod: 'api_key',
    documentationUrl: 'https://docs.ranios.com/integrations/nextech',
    requiredScopes: ['patients:read', 'appointments:read', 'billing:read'],
    webhookEvents: ['client.created', 'appointment.created', 'appointment.completed'],
    features: ['Full EHR sync', 'Practice management data', 'Billing integration', 'Clinical workflows'],
    tier: 'enterprise',
    isPopular: false,
    isFeatured: false,
    isNew: true,
    version: '1.0.0',
    author: 'RaniOS',
    supportUrl: 'https://support.ranios.com/nextech',
    privacyUrl: 'https://www.nextech.com/privacy-policy',
  },

  // --- Scheduling ---
  {
    id: 'acuity',
    name: 'Acuity Scheduling',
    slug: 'acuity',
    category: 'scheduling',
    description: 'Online appointment scheduling for service businesses.',
    longDescription: 'Sync your Acuity calendar with RaniOS. Auto-import bookings, cancellations, and client data to power your schedule optimizer and no-show predictions.',
    icon: '/integrations/acuity.svg',
    pricing: 'free',
    monthlyPrice: null,
    setupComplexity: 'simple',
    connectionMethod: 'oauth2',
    documentationUrl: 'https://docs.ranios.com/integrations/acuity',
    requiredScopes: ['appointments:read', 'clients:read'],
    webhookEvents: ['appointment.created', 'appointment.updated', 'appointment.cancelled'],
    features: ['Calendar sync', 'Client data import', 'Cancellation tracking', 'Availability management'],
    tier: 'starter',
    isPopular: false,
    isFeatured: false,
    isNew: false,
    version: '1.3.0',
    author: 'RaniOS',
    supportUrl: 'https://support.ranios.com/acuity',
    privacyUrl: 'https://acuityscheduling.com/privacy.php',
  },
  {
    id: 'calendly',
    name: 'Calendly',
    slug: 'calendly',
    category: 'scheduling',
    description: 'Meeting scheduling automation for professionals.',
    longDescription: 'Connect Calendly for consult booking and demo scheduling. Track booking conversion rates and follow up with leads who schedule through Calendly.',
    icon: '/integrations/calendly.svg',
    pricing: 'free',
    monthlyPrice: null,
    setupComplexity: 'simple',
    connectionMethod: 'oauth2',
    documentationUrl: 'https://docs.ranios.com/integrations/calendly',
    requiredScopes: ['events:read', 'invitees:read'],
    webhookEvents: ['appointment.created', 'appointment.cancelled'],
    features: ['Event sync', 'Invitee tracking', 'Cancellation alerts', 'Routing forms'],
    tier: 'starter',
    isPopular: false,
    isFeatured: false,
    isNew: false,
    version: '1.2.0',
    author: 'RaniOS',
    supportUrl: 'https://support.ranios.com/calendly',
    privacyUrl: 'https://calendly.com/privacy',
  },
  {
    id: 'janeapp',
    name: 'Jane App',
    slug: 'janeapp',
    category: 'scheduling',
    description: 'Practice management for health and wellness practitioners.',
    longDescription: 'Full sync with Jane App for scheduling, charting, and billing. Ideal for wellness practitioners who want AI-powered operations on top of Jane.',
    icon: '/integrations/janeapp.svg',
    pricing: 'paid',
    monthlyPrice: 19,
    setupComplexity: 'moderate',
    connectionMethod: 'api_key',
    documentationUrl: 'https://docs.ranios.com/integrations/janeapp',
    requiredScopes: ['patients:read', 'appointments:read', 'billing:read'],
    webhookEvents: ['appointment.created', 'appointment.completed', 'client.created', 'payment.completed'],
    features: ['Appointment sync', 'Patient data', 'Billing sync', 'Charting data access'],
    tier: 'pro',
    isPopular: false,
    isFeatured: false,
    isNew: false,
    version: '1.1.0',
    author: 'RaniOS',
    supportUrl: 'https://support.ranios.com/janeapp',
    privacyUrl: 'https://jane.app/privacy-policy',
  },

  // --- Accounting ---
  {
    id: 'quickbooks',
    name: 'QuickBooks',
    slug: 'quickbooks',
    category: 'accounting',
    description: 'Small business accounting and bookkeeping.',
    longDescription: 'Sync revenue, expenses, and invoices with QuickBooks. Auto-categorize transactions and keep your P&L intelligence in sync with your books.',
    icon: '/integrations/quickbooks.svg',
    pricing: 'free',
    monthlyPrice: null,
    setupComplexity: 'moderate',
    connectionMethod: 'oauth2',
    documentationUrl: 'https://docs.ranios.com/integrations/quickbooks',
    requiredScopes: ['com.intuit.quickbooks.accounting'],
    webhookEvents: ['payment.completed', 'invoice.created', 'invoice.paid'],
    features: ['Revenue sync', 'Expense tracking', 'Invoice matching', 'P&L reconciliation', 'Tax category mapping'],
    tier: 'pro',
    isPopular: true,
    isFeatured: true,
    isNew: false,
    version: '2.0.0',
    author: 'RaniOS',
    supportUrl: 'https://support.ranios.com/quickbooks',
    privacyUrl: 'https://www.intuit.com/privacy/statement/',
  },
  {
    id: 'xero',
    name: 'Xero',
    slug: 'xero',
    category: 'accounting',
    description: 'Cloud accounting for small businesses.',
    longDescription: 'Connect Xero for full accounting sync. Revenue data flows from your clinic operations directly into your books with auto-categorization.',
    icon: '/integrations/xero.svg',
    pricing: 'free',
    monthlyPrice: null,
    setupComplexity: 'moderate',
    connectionMethod: 'oauth2',
    documentationUrl: 'https://docs.ranios.com/integrations/xero',
    requiredScopes: ['accounting.transactions', 'accounting.contacts'],
    webhookEvents: ['payment.completed', 'invoice.created'],
    features: ['Revenue sync', 'Contact sync', 'Invoice creation', 'Bank reconciliation'],
    tier: 'pro',
    isPopular: false,
    isFeatured: false,
    isNew: false,
    version: '1.4.0',
    author: 'RaniOS',
    supportUrl: 'https://support.ranios.com/xero',
    privacyUrl: 'https://www.xero.com/us/about/legal/privacy/',
  },
  {
    id: 'freshbooks',
    name: 'FreshBooks',
    slug: 'freshbooks',
    category: 'accounting',
    description: 'Invoicing and accounting for small businesses.',
    longDescription: 'Simple invoicing and expense tracking through FreshBooks. Auto-generate invoices from treatments and sync expenses for P&L tracking.',
    icon: '/integrations/freshbooks.svg',
    pricing: 'free',
    monthlyPrice: null,
    setupComplexity: 'simple',
    connectionMethod: 'oauth2',
    documentationUrl: 'https://docs.ranios.com/integrations/freshbooks',
    requiredScopes: ['user:invoices:read', 'user:expenses:read'],
    webhookEvents: ['invoice.created', 'invoice.paid', 'payment.completed'],
    features: ['Invoice sync', 'Expense tracking', 'Payment monitoring'],
    tier: 'pro',
    isPopular: false,
    isFeatured: false,
    isNew: false,
    version: '1.1.0',
    author: 'RaniOS',
    supportUrl: 'https://support.ranios.com/freshbooks',
    privacyUrl: 'https://www.freshbooks.com/policies/privacy',
  },

  // --- Marketing ---
  {
    id: 'meta_ads',
    name: 'Meta Ads',
    slug: 'meta-ads',
    category: 'marketing',
    description: 'Facebook and Instagram advertising platform.',
    longDescription: 'Connect your Meta Ads account for AI-powered campaign optimization. Get ad copy suggestions, budget recommendations, and creative fatigue alerts.',
    icon: '/integrations/meta.svg',
    pricing: 'free',
    monthlyPrice: null,
    setupComplexity: 'moderate',
    connectionMethod: 'oauth2',
    documentationUrl: 'https://docs.ranios.com/integrations/meta-ads',
    requiredScopes: ['ads_read', 'ads_management', 'business_management'],
    webhookEvents: ['lead.created'],
    features: ['Campaign analytics', 'AI ad copy generation', 'Budget optimization', 'Creative fatigue detection', 'Lead form sync'],
    tier: 'pro',
    isPopular: true,
    isFeatured: true,
    isNew: false,
    version: '2.1.0',
    author: 'RaniOS',
    supportUrl: 'https://support.ranios.com/meta-ads',
    privacyUrl: 'https://www.facebook.com/privacy/explanation',
  },
  {
    id: 'google_ads',
    name: 'Google Ads',
    slug: 'google-ads',
    category: 'marketing',
    description: 'Search, display, and video advertising on Google.',
    longDescription: 'Pull Google Ads campaign data into your analytics dashboard. Track cost per lead, conversion rates, and keyword performance alongside your clinic metrics.',
    icon: '/integrations/google-ads.svg',
    pricing: 'paid',
    monthlyPrice: 29,
    setupComplexity: 'moderate',
    connectionMethod: 'oauth2',
    documentationUrl: 'https://docs.ranios.com/integrations/google-ads',
    requiredScopes: ['adwords'],
    webhookEvents: ['lead.created'],
    features: ['Campaign data sync', 'Keyword tracking', 'Cost per lead analysis', 'Conversion tracking'],
    tier: 'pro',
    isPopular: true,
    isFeatured: false,
    isNew: false,
    version: '1.5.0',
    author: 'RaniOS',
    supportUrl: 'https://support.ranios.com/google-ads',
    privacyUrl: 'https://policies.google.com/privacy',
  },
  {
    id: 'yelp',
    name: 'Yelp for Business',
    slug: 'yelp',
    category: 'marketing',
    description: 'Local business listing and advertising.',
    longDescription: 'Monitor your Yelp listing, track review velocity, and manage your business presence. Get alerts for new reviews and AI-suggested responses.',
    icon: '/integrations/yelp.svg',
    pricing: 'free',
    monthlyPrice: null,
    setupComplexity: 'simple',
    connectionMethod: 'api_key',
    documentationUrl: 'https://docs.ranios.com/integrations/yelp',
    requiredScopes: ['business:read', 'reviews:read'],
    webhookEvents: ['review.received'],
    features: ['Review monitoring', 'Business listing sync', 'Review response drafts'],
    tier: 'starter',
    isPopular: false,
    isFeatured: false,
    isNew: false,
    version: '1.2.0',
    author: 'RaniOS',
    supportUrl: 'https://support.ranios.com/yelp',
    privacyUrl: 'https://www.yelp.com/tos/privacy_policy',
  },
  {
    id: 'healthgrades',
    name: 'Healthgrades',
    slug: 'healthgrades',
    category: 'marketing',
    description: 'Healthcare provider directory and patient reviews.',
    longDescription: 'Track your Healthgrades profile, monitor patient reviews, and maintain accurate provider information across the platform.',
    icon: '/integrations/healthgrades.svg',
    pricing: 'free',
    monthlyPrice: null,
    setupComplexity: 'simple',
    connectionMethod: 'api_key',
    documentationUrl: 'https://docs.ranios.com/integrations/healthgrades',
    requiredScopes: ['profile:read', 'reviews:read'],
    webhookEvents: ['review.received'],
    features: ['Profile monitoring', 'Review tracking', 'Provider data sync'],
    tier: 'pro',
    isPopular: false,
    isFeatured: false,
    isNew: true,
    version: '1.0.0',
    author: 'RaniOS',
    supportUrl: 'https://support.ranios.com/healthgrades',
    privacyUrl: 'https://www.healthgrades.com/content/privacy-policy',
  },

  // --- AI ---
  {
    id: 'claude',
    name: 'Claude (Anthropic)',
    slug: 'claude',
    category: 'ai',
    description: 'Advanced AI assistant for analysis, writing, and reasoning.',
    longDescription: 'Powers the core RaniOS intelligence: intake analysis, treatment recommendations, consult scripts, ad copy generation, and chat concierge.',
    icon: '/integrations/anthropic.svg',
    pricing: 'free',
    monthlyPrice: null,
    setupComplexity: 'simple',
    connectionMethod: 'api_key',
    documentationUrl: 'https://docs.ranios.com/integrations/claude',
    requiredScopes: ['messages:create'],
    webhookEvents: [],
    features: ['Intake intelligence', 'Treatment recommendations', 'Ad copy generation', 'Chat concierge', 'Content creation'],
    tier: 'starter',
    isPopular: true,
    isFeatured: true,
    isNew: false,
    version: '3.0.0',
    author: 'RaniOS',
    supportUrl: 'https://support.ranios.com/claude',
    privacyUrl: 'https://www.anthropic.com/privacy',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    slug: 'openai',
    category: 'ai',
    description: 'GPT models for text generation and analysis.',
    longDescription: 'Optional OpenAI integration for specific tasks like embeddings, image analysis, or as a fallback AI provider.',
    icon: '/integrations/openai.svg',
    pricing: 'free',
    monthlyPrice: null,
    setupComplexity: 'simple',
    connectionMethod: 'api_key',
    documentationUrl: 'https://docs.ranios.com/integrations/openai',
    requiredScopes: ['models:read', 'completions:create'],
    webhookEvents: [],
    features: ['Text generation', 'Embeddings', 'Image analysis', 'Fallback AI'],
    tier: 'pro',
    isPopular: false,
    isFeatured: false,
    isNew: false,
    version: '1.2.0',
    author: 'RaniOS',
    supportUrl: 'https://support.ranios.com/openai',
    privacyUrl: 'https://openai.com/policies/privacy-policy',
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    slug: 'gemini',
    category: 'ai',
    description: 'Google multimodal AI model.',
    longDescription: 'Optional Google Gemini integration for multimodal tasks like before/after photo analysis and document processing.',
    icon: '/integrations/google-gemini.svg',
    pricing: 'paid',
    monthlyPrice: 19,
    setupComplexity: 'simple',
    connectionMethod: 'api_key',
    documentationUrl: 'https://docs.ranios.com/integrations/gemini',
    requiredScopes: ['generativeai'],
    webhookEvents: [],
    features: ['Multimodal analysis', 'Photo comparison', 'Document processing'],
    tier: 'enterprise',
    isPopular: false,
    isFeatured: false,
    isNew: true,
    version: '1.0.0',
    author: 'RaniOS',
    supportUrl: 'https://support.ranios.com/gemini',
    privacyUrl: 'https://policies.google.com/privacy',
  },

  // --- Reviews ---
  {
    id: 'google_reviews',
    name: 'Google Reviews',
    slug: 'google-reviews',
    category: 'reviews',
    description: 'Google Business Profile review monitoring.',
    longDescription: 'Monitor Google reviews in real time, get AI-drafted response suggestions, and track your rating trends over time.',
    icon: '/integrations/google.svg',
    pricing: 'free',
    monthlyPrice: null,
    setupComplexity: 'moderate',
    connectionMethod: 'oauth2',
    documentationUrl: 'https://docs.ranios.com/integrations/google-reviews',
    requiredScopes: ['business.manage'],
    webhookEvents: ['review.received'],
    features: ['Review monitoring', 'AI response drafts', 'Rating trends', 'Review request triggers'],
    tier: 'starter',
    isPopular: true,
    isFeatured: false,
    isNew: false,
    version: '1.4.0',
    author: 'RaniOS',
    supportUrl: 'https://support.ranios.com/google-reviews',
    privacyUrl: 'https://policies.google.com/privacy',
  },
  {
    id: 'realself',
    name: 'RealSelf',
    slug: 'realself',
    category: 'reviews',
    description: 'Aesthetic treatment reviews and provider directory.',
    longDescription: 'Track your RealSelf provider profile, monitor treatment reviews, and understand patient sentiment for specific procedures.',
    icon: '/integrations/realself.svg',
    pricing: 'paid',
    monthlyPrice: 19,
    setupComplexity: 'simple',
    connectionMethod: 'api_key',
    documentationUrl: 'https://docs.ranios.com/integrations/realself',
    requiredScopes: ['profile:read', 'reviews:read'],
    webhookEvents: ['review.received'],
    features: ['Profile monitoring', 'Review tracking', 'Procedure-specific sentiment'],
    tier: 'pro',
    isPopular: false,
    isFeatured: false,
    isNew: false,
    version: '1.0.0',
    author: 'RaniOS',
    supportUrl: 'https://support.ranios.com/realself',
    privacyUrl: 'https://www.realself.com/privacy',
  },
  {
    id: 'birdeye',
    name: 'Birdeye',
    slug: 'birdeye',
    category: 'reviews',
    description: 'Reputation management and review platform.',
    longDescription: 'Centralized review management across Google, Yelp, Facebook, and more. Auto-send review requests after appointments and monitor your online reputation.',
    icon: '/integrations/birdeye.svg',
    pricing: 'paid',
    monthlyPrice: 29,
    setupComplexity: 'moderate',
    connectionMethod: 'api_key',
    documentationUrl: 'https://docs.ranios.com/integrations/birdeye',
    requiredScopes: ['reviews:read', 'requests:send'],
    webhookEvents: ['review.received'],
    features: ['Multi-platform reviews', 'Auto review requests', 'Sentiment analysis', 'Competitive benchmarking'],
    tier: 'pro',
    isPopular: false,
    isFeatured: false,
    isNew: false,
    version: '1.2.0',
    author: 'RaniOS',
    supportUrl: 'https://support.ranios.com/birdeye',
    privacyUrl: 'https://birdeye.com/privacy-policy/',
  },

  // --- Analytics ---
  {
    id: 'ga4',
    name: 'Google Analytics 4',
    slug: 'ga4',
    category: 'analytics',
    description: 'Web and app analytics from Google.',
    longDescription: 'Connect GA4 to enrich your analytics with website traffic data. See which pages drive bookings, track conversion funnels, and measure campaign performance.',
    icon: '/integrations/ga4.svg',
    pricing: 'free',
    monthlyPrice: null,
    setupComplexity: 'moderate',
    connectionMethod: 'oauth2',
    documentationUrl: 'https://docs.ranios.com/integrations/ga4',
    requiredScopes: ['analytics.readonly'],
    webhookEvents: [],
    features: ['Traffic analytics', 'Conversion tracking', 'Campaign attribution', 'Audience insights'],
    tier: 'starter',
    isPopular: true,
    isFeatured: false,
    isNew: false,
    version: '1.3.0',
    author: 'RaniOS',
    supportUrl: 'https://support.ranios.com/ga4',
    privacyUrl: 'https://policies.google.com/privacy',
  },
  {
    id: 'mixpanel',
    name: 'Mixpanel',
    slug: 'mixpanel',
    category: 'analytics',
    description: 'Product analytics for user behavior tracking.',
    longDescription: 'Track tenant behavior, feature usage, and user journeys with Mixpanel. Power your engagement scoring and feature adoption metrics.',
    icon: '/integrations/mixpanel.svg',
    pricing: 'paid',
    monthlyPrice: 29,
    setupComplexity: 'moderate',
    connectionMethod: 'api_key',
    documentationUrl: 'https://docs.ranios.com/integrations/mixpanel',
    requiredScopes: ['events:track', 'profiles:update'],
    webhookEvents: [],
    features: ['Event tracking', 'Funnel analysis', 'Cohort analysis', 'User flows'],
    tier: 'pro',
    isPopular: false,
    isFeatured: false,
    isNew: false,
    version: '1.1.0',
    author: 'RaniOS',
    supportUrl: 'https://support.ranios.com/mixpanel',
    privacyUrl: 'https://mixpanel.com/legal/privacy-policy/',
  },
  {
    id: 'amplitude',
    name: 'Amplitude',
    slug: 'amplitude',
    category: 'analytics',
    description: 'Digital analytics for product and growth teams.',
    longDescription: 'Advanced product analytics for understanding how tenants use the platform. Power retention analysis, feature impact measurement, and growth experiments.',
    icon: '/integrations/amplitude.svg',
    pricing: 'paid',
    monthlyPrice: 49,
    setupComplexity: 'advanced',
    connectionMethod: 'api_key',
    documentationUrl: 'https://docs.ranios.com/integrations/amplitude',
    requiredScopes: ['events:track', 'user:update'],
    webhookEvents: [],
    features: ['Behavioral analytics', 'Retention analysis', 'Feature impact', 'A/B test analysis'],
    tier: 'enterprise',
    isPopular: false,
    isFeatured: false,
    isNew: false,
    version: '1.0.0',
    author: 'RaniOS',
    supportUrl: 'https://support.ranios.com/amplitude',
    privacyUrl: 'https://amplitude.com/privacy',
  },
];

// =============================================================================
// Catalog Access
// =============================================================================

export function getIntegrationCatalog(): IntegrationDefinition[] {
  return INTEGRATION_CATALOG;
}

export function getIntegrationById(id: string): IntegrationDefinition | null {
  return INTEGRATION_CATALOG.find((i) => i.id === id) || null;
}

export function getIntegrationsByCategory(category: IntegrationCategory): IntegrationDefinition[] {
  return INTEGRATION_CATALOG.filter((i) => i.category === category);
}

export function getFeaturedIntegrations(): IntegrationDefinition[] {
  return INTEGRATION_CATALOG.filter((i) => i.isFeatured);
}

export function getPopularIntegrations(): IntegrationDefinition[] {
  return INTEGRATION_CATALOG.filter((i) => i.isPopular);
}

export function getNewIntegrations(): IntegrationDefinition[] {
  return INTEGRATION_CATALOG.filter((i) => i.isNew);
}

export function getIntegrationsByTier(tier: 'starter' | 'pro' | 'enterprise'): IntegrationDefinition[] {
  const tierHierarchy = { starter: 0, pro: 1, enterprise: 2 };
  const requestedLevel = tierHierarchy[tier];
  return INTEGRATION_CATALOG.filter((i) => tierHierarchy[i.tier] <= requestedLevel);
}

export function getCategoryList(): Array<{ category: IntegrationCategory; label: string; count: number; icon: string }> {
  const categories: Array<{ category: IntegrationCategory; label: string; icon: string }> = [
    { category: 'crm', label: 'CRM & Practice Management', icon: 'users' },
    { category: 'payments', label: 'Payments & Financing', icon: 'credit-card' },
    { category: 'communications', label: 'Communications', icon: 'message-circle' },
    { category: 'ehr', label: 'EHR & Clinical', icon: 'clipboard' },
    { category: 'scheduling', label: 'Scheduling', icon: 'calendar' },
    { category: 'accounting', label: 'Accounting', icon: 'dollar-sign' },
    { category: 'marketing', label: 'Marketing & Ads', icon: 'trending-up' },
    { category: 'ai', label: 'AI & Machine Learning', icon: 'cpu' },
    { category: 'reviews', label: 'Reviews & Reputation', icon: 'star' },
    { category: 'analytics', label: 'Analytics', icon: 'bar-chart' },
  ];

  return categories.map((c) => ({
    ...c,
    count: INTEGRATION_CATALOG.filter((i) => i.category === c.category).length,
  }));
}

// =============================================================================
// Marketplace Search & Filtering
// =============================================================================

export function searchMarketplace(params: MarketplaceSearchParams): MarketplaceSearchResult {
  let filtered = [...INTEGRATION_CATALOG];

  // Text search
  if (params.query) {
    const q = params.query.toLowerCase();
    filtered = filtered.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.category.includes(q) ||
        i.features.some((f) => f.toLowerCase().includes(q))
    );
  }

  // Category filter
  if (params.category) {
    filtered = filtered.filter((i) => i.category === params.category);
  }

  // Pricing filter
  if (params.pricing) {
    filtered = filtered.filter((i) => i.pricing === params.pricing);
  }

  // Tier filter
  if (params.tier) {
    const tierHierarchy = { starter: 0, pro: 1, enterprise: 2 };
    const requestedLevel = tierHierarchy[params.tier];
    filtered = filtered.filter((i) => tierHierarchy[i.tier] <= requestedLevel);
  }

  // Sort
  switch (params.sortBy) {
    case 'name':
      filtered.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'popularity':
      filtered.sort((a, b) => (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0));
      break;
    case 'newest':
      filtered.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
      break;
    case 'price':
      filtered.sort((a, b) => (a.monthlyPrice || 0) - (b.monthlyPrice || 0));
      break;
  }

  // Pagination
  const total = filtered.length;
  const start = (params.page - 1) * params.pageSize;
  const paginated = filtered.slice(start, start + params.pageSize);

  // Category counts
  const categories = getCategoryList().map((c) => ({
    category: c.category,
    count: INTEGRATION_CATALOG.filter((i) => i.category === c.category).length,
  }));

  return {
    integrations: paginated,
    total,
    page: params.page,
    pageSize: params.pageSize,
    categories,
  };
}

// =============================================================================
// Installation Flow
// =============================================================================

export function createIntegrationInstance(
  tenantId: string,
  integrationId: string
): IntegrationInstance {
  const integration = getIntegrationById(integrationId);
  if (!integration) {
    throw new Error(`Integration not found: ${integrationId}`);
  }

  const now = new Date().toISOString();

  return {
    id: `inst-${tenantId}-${integrationId}-${Date.now()}`,
    tenantId,
    integrationId,
    status: 'connecting',
    connectionMethod: integration.connectionMethod,
    credentials: {
      accessToken: null,
      refreshToken: null,
      apiKey: null,
      clientId: null,
      clientSecret: null,
      additionalFields: {},
      expiresAt: null,
    },
    config: createDefaultIntegrationConfig(integration),
    webhookUrl: integration.webhookEvents.length > 0
      ? `https://api.ranios.com/webhooks/${tenantId}/${integrationId}`
      : null,
    webhookSecret: integration.webhookEvents.length > 0
      ? generateWebhookSecret()
      : null,
    syncMode: 'incremental',
    lastSyncAt: null,
    lastSyncStatus: null,
    errorMessage: null,
    usageMetrics: createEmptyUsageMetrics(),
    healthScore: 100,
    installedAt: now,
    updatedAt: now,
  };
}

function createDefaultIntegrationConfig(integration: IntegrationDefinition): IntegrationConfig {
  return {
    syncInterval: 300, // 5 minutes
    syncDirection: 'bidirectional',
    fieldMappings: [],
    filters: [],
    transforms: [],
    notifications: {
      onSuccess: false,
      onFailure: true,
      onWarning: true,
      channels: ['email'],
    },
    retryPolicy: {
      maxRetries: 3,
      backoffMultiplier: 2,
      initialDelayMs: 1000,
      maxDelayMs: 30000,
    },
  };
}

function createEmptyUsageMetrics(): IntegrationUsageMetrics {
  return {
    apiCallsToday: 0,
    apiCallsThisMonth: 0,
    dataRecordsSynced: 0,
    lastApiCallAt: null,
    avgResponseTimeMs: 0,
    errorRate: 0,
    quotaUsed: 0,
    quotaLimit: 10000,
  };
}

function generateWebhookSecret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let secret = 'whsec_';
  for (let i = 0; i < 32; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return secret;
}

export function connectIntegration(
  instance: IntegrationInstance,
  credentials: Partial<EncryptedCredentials>
): IntegrationInstance {
  return {
    ...instance,
    credentials: { ...instance.credentials, ...credentials },
    status: 'connected',
    updatedAt: new Date().toISOString(),
  };
}

export function configureIntegration(
  instance: IntegrationInstance,
  config: Partial<IntegrationConfig>
): IntegrationInstance {
  return {
    ...instance,
    config: { ...instance.config, ...config },
    status: 'configured',
    updatedAt: new Date().toISOString(),
  };
}

export function activateIntegration(instance: IntegrationInstance): IntegrationInstance {
  if (instance.status !== 'configured' && instance.status !== 'connected') {
    throw new Error(`Cannot activate integration in ${instance.status} status`);
  }

  return {
    ...instance,
    status: 'active',
    updatedAt: new Date().toISOString(),
  };
}

export function pauseIntegration(instance: IntegrationInstance): IntegrationInstance {
  return {
    ...instance,
    status: 'paused',
    updatedAt: new Date().toISOString(),
  };
}

export function disconnectIntegration(instance: IntegrationInstance): IntegrationInstance {
  return {
    ...instance,
    status: 'disconnected',
    credentials: {
      accessToken: null,
      refreshToken: null,
      apiKey: null,
      clientId: null,
      clientSecret: null,
      additionalFields: {},
      expiresAt: null,
    },
    updatedAt: new Date().toISOString(),
  };
}

// =============================================================================
// Integration Health Monitoring
// =============================================================================

export function checkIntegrationHealth(instance: IntegrationInstance): IntegrationHealthReport {
  const checks: HealthCheckItem[] = [];

  // Connection check
  checks.push({
    name: 'Connection',
    status: instance.status === 'active' ? 'pass' : instance.status === 'error' ? 'fail' : 'warn',
    message: instance.status === 'active' ? 'Connected and active' : `Status: ${instance.status}`,
    detail: instance.errorMessage,
  });

  // Credentials check
  const hasCredentials = instance.credentials.accessToken || instance.credentials.apiKey;
  checks.push({
    name: 'Credentials',
    status: hasCredentials ? 'pass' : 'fail',
    message: hasCredentials ? 'Credentials configured' : 'No credentials found',
    detail: null,
  });

  // Token expiry check
  if (instance.credentials.expiresAt) {
    const expiresAt = new Date(instance.credentials.expiresAt);
    const hoursUntilExpiry = (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60);
    checks.push({
      name: 'Token Expiry',
      status: hoursUntilExpiry > 24 ? 'pass' : hoursUntilExpiry > 0 ? 'warn' : 'fail',
      message: hoursUntilExpiry > 24
        ? `Token valid for ${Math.floor(hoursUntilExpiry)} hours`
        : hoursUntilExpiry > 0
        ? `Token expiring in ${Math.floor(hoursUntilExpiry)} hours`
        : 'Token expired',
      detail: null,
    });
  }

  // Sync check
  if (instance.lastSyncAt) {
    const hoursSinceSync = (Date.now() - new Date(instance.lastSyncAt).getTime()) / (1000 * 60 * 60);
    checks.push({
      name: 'Last Sync',
      status: hoursSinceSync < 1 ? 'pass' : hoursSinceSync < 24 ? 'warn' : 'fail',
      message: hoursSinceSync < 1
        ? 'Synced recently'
        : `Last sync ${Math.floor(hoursSinceSync)} hours ago`,
      detail: instance.lastSyncStatus ? `Last status: ${instance.lastSyncStatus}` : null,
    });
  }

  // Error rate check
  checks.push({
    name: 'Error Rate',
    status: instance.usageMetrics.errorRate < 1 ? 'pass' : instance.usageMetrics.errorRate < 5 ? 'warn' : 'fail',
    message: `${instance.usageMetrics.errorRate.toFixed(1)}% error rate`,
    detail: null,
  });

  // Quota check
  const quotaPercent = (instance.usageMetrics.quotaUsed / instance.usageMetrics.quotaLimit) * 100;
  checks.push({
    name: 'API Quota',
    status: quotaPercent < 80 ? 'pass' : quotaPercent < 95 ? 'warn' : 'fail',
    message: `${quotaPercent.toFixed(0)}% of quota used`,
    detail: `${instance.usageMetrics.quotaUsed.toLocaleString()} / ${instance.usageMetrics.quotaLimit.toLocaleString()} calls`,
  });

  // Calculate overall score
  const scoreMap = { pass: 100, warn: 60, fail: 0 };
  const totalScore = checks.reduce((sum, c) => sum + scoreMap[c.status], 0);
  const score = Math.round(totalScore / checks.length);

  const recommendations: string[] = [];
  if (checks.some((c) => c.name === 'Token Expiry' && c.status !== 'pass')) {
    recommendations.push('Refresh your authentication token to prevent sync interruptions');
  }
  if (checks.some((c) => c.name === 'Error Rate' && c.status !== 'pass')) {
    recommendations.push('High error rate detected. Check your integration configuration and API credentials');
  }
  if (checks.some((c) => c.name === 'API Quota' && c.status !== 'pass')) {
    recommendations.push('Approaching API quota limit. Consider upgrading your plan or optimizing sync frequency');
  }

  return {
    integrationId: instance.integrationId,
    tenantId: instance.tenantId,
    score,
    status: score >= 80 ? 'healthy' : score >= 50 ? 'degraded' : 'critical',
    checks,
    recommendations,
    lastCheckedAt: new Date().toISOString(),
  };
}

// =============================================================================
// Usage Metering
// =============================================================================

export function recordApiCall(
  metrics: IntegrationUsageMetrics,
  responseTimeMs: number,
  success: boolean
): IntegrationUsageMetrics {
  const totalCalls = metrics.apiCallsThisMonth + 1;
  const errorCount = Math.round(metrics.errorRate * metrics.apiCallsThisMonth / 100) + (success ? 0 : 1);

  return {
    ...metrics,
    apiCallsToday: metrics.apiCallsToday + 1,
    apiCallsThisMonth: totalCalls,
    lastApiCallAt: new Date().toISOString(),
    avgResponseTimeMs: Math.round(
      (metrics.avgResponseTimeMs * metrics.apiCallsThisMonth + responseTimeMs) / totalCalls
    ),
    errorRate: Math.round((errorCount / totalCalls) * 10000) / 100,
    quotaUsed: metrics.quotaUsed + 1,
  };
}

export function recordSyncedRecords(
  metrics: IntegrationUsageMetrics,
  count: number
): IntegrationUsageMetrics {
  return {
    ...metrics,
    dataRecordsSynced: metrics.dataRecordsSynced + count,
  };
}

// =============================================================================
// Recommended Integrations Engine
// =============================================================================

export function getRecommendedIntegrations(
  installedIds: string[],
  vertical: string,
  tier: 'starter' | 'pro' | 'enterprise'
): IntegrationDefinition[] {
  const installed = new Set(installedIds);
  const available = getIntegrationsByTier(tier).filter((i) => !installed.has(i.id));

  // Scoring: Popular gets +3, featured +2, relevant category +1
  const essentialByVertical: Record<string, string[]> = {
    medspa: ['mangomint', 'square', 'twilio', 'claude', 'google_reviews', 'meta_ads'],
    dental: ['mindbody', 'stripe', 'twilio', 'claude', 'google_reviews'],
    dermatology: ['modmed', 'stripe', 'twilio', 'claude', 'google_reviews', 'healthgrades'],
    wellness: ['janeapp', 'stripe', 'mailchimp', 'claude', 'ga4'],
    chiropractic: ['janeapp', 'square', 'twilio', 'claude', 'google_reviews'],
  };

  const essentials = new Set(essentialByVertical[vertical] || essentialByVertical['medspa']);

  const scored = available.map((i) => {
    let score = 0;
    if (essentials.has(i.id)) score += 5;
    if (i.isPopular) score += 3;
    if (i.isFeatured) score += 2;
    if (i.pricing === 'free') score += 1;
    return { integration: i, score };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, 6).map((s) => s.integration);
}
