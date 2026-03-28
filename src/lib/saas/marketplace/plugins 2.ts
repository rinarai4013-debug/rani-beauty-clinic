/**
 * RaniOS Plugin Marketplace
 *
 * Plugin definition format, 15 pre-built plugins,
 * installation/uninstallation, configuration per tenant,
 * permissions/sandboxing, revenue sharing model.
 */

import { z } from 'zod';

// ─── Types ────────────────────────────────────────────────────────

export type PluginStatus = 'active' | 'inactive' | 'pending_review' | 'rejected' | 'deprecated';

export type PluginCategory =
  | 'marketing'
  | 'operations'
  | 'analytics'
  | 'communication'
  | 'integration'
  | 'finance'
  | 'scheduling'
  | 'client_experience';

export type PluginPermission =
  | 'clients:read'
  | 'clients:write'
  | 'appointments:read'
  | 'appointments:write'
  | 'transactions:read'
  | 'transactions:write'
  | 'reviews:read'
  | 'reviews:write'
  | 'inventory:read'
  | 'inventory:write'
  | 'messages:send'
  | 'webhooks:create'
  | 'analytics:read'
  | 'settings:read'
  | 'settings:write'
  | 'ai:use'
  | 'storage:use';

export type PricingModel = 'free' | 'one_time' | 'monthly' | 'usage_based';

export type InstallationStatus = 'installing' | 'active' | 'paused' | 'uninstalling' | 'error';

export interface Plugin {
  id: string;
  slug: string;
  name: string;
  description: string;
  longDescription: string;
  version: string;
  author: PluginAuthor;
  category: PluginCategory;
  tags: string[];
  status: PluginStatus;
  icon: string;
  screenshots: string[];
  permissions: PluginPermission[];
  pricing: PluginPricing;
  compatibility: {
    minTier: 'starter' | 'pro' | 'enterprise';
    apiVersion: string;
    dependencies: string[]; // other plugin slugs
  };
  stats: PluginStats;
  configSchema: PluginConfigField[];
  webhookEvents: string[];
  entryPoint: string; // URL or module path
  sandboxed: boolean;
  verified: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface PluginAuthor {
  id: string;
  name: string;
  email: string;
  website: string | null;
  verified: boolean;
}

export interface PluginPricing {
  model: PricingModel;
  price: number; // in cents for one_time/monthly, per unit for usage_based
  trialDays: number;
  currency: string;
}

export interface PluginStats {
  installs: number;
  activeInstalls: number;
  rating: number; // 0-5
  reviewCount: number;
  lastUpdated: number;
}

export interface PluginConfigField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'multiselect' | 'textarea' | 'url' | 'email';
  required: boolean;
  defaultValue: unknown;
  options: { label: string; value: string }[]; // for select/multiselect
  description: string;
  placeholder: string;
}

export interface PluginInstallation {
  id: string;
  tenantId: string;
  pluginId: string;
  pluginSlug: string;
  status: InstallationStatus;
  config: Record<string, unknown>;
  grantedPermissions: PluginPermission[];
  installedAt: number;
  updatedAt: number;
  installedBy: string;
  version: string;
  trialEndsAt: number | null;
  lastError: string | null;
}

export interface PluginReview {
  id: string;
  pluginId: string;
  tenantId: string;
  userId: string;
  userName: string;
  rating: number;
  title: string;
  body: string;
  createdAt: number;
  helpful: number;
}

export interface RevenueShare {
  pluginId: string;
  authorId: string;
  period: { start: number; end: number };
  totalRevenue: number;
  authorShare: number; // 70%
  platformShare: number; // 30%
  installs: number;
  activeInstalls: number;
}

export interface MarketplaceStats {
  totalPlugins: number;
  totalInstalls: number;
  totalRevenue: number;
  topPlugins: { plugin: Plugin; installs: number }[];
  categoryBreakdown: { category: PluginCategory; count: number }[];
  recentlyAdded: Plugin[];
  trending: Plugin[];
}

// ─── Schemas ──────────────────────────────────────────────────────

export const InstallPluginSchema = z.object({
  tenantId: z.string().min(1),
  pluginId: z.string().min(1),
  installedBy: z.string().min(1),
  config: z.record(z.unknown()).optional().default({}),
  grantedPermissions: z.array(z.string()).optional(),
});

export const UpdatePluginConfigSchema = z.object({
  config: z.record(z.unknown()),
});

export const SubmitReviewSchema = z.object({
  pluginId: z.string().min(1),
  tenantId: z.string().min(1),
  userId: z.string().min(1),
  userName: z.string().min(1),
  rating: z.number().min(1).max(5),
  title: z.string().min(1).max(200),
  body: z.string().min(10).max(2000),
});

// ─── Constants ────────────────────────────────────────────────────

export const REVENUE_SHARE_AUTHOR = 0.70;
export const REVENUE_SHARE_PLATFORM = 0.30;

// ─── In-Memory Stores ─────────────────────────────────────────────

const plugins = new Map<string, Plugin>();
const installations = new Map<string, PluginInstallation>();
const reviews: PluginReview[] = [];

// ─── 15 Pre-Built Plugins ─────────────────────────────────────────

const BUILTIN_PLUGINS: Omit<Plugin, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    slug: 'google-reviews-auto-response',
    name: 'Google Reviews Auto-Response',
    description: 'AI-powered automatic responses to Google reviews with brand-aligned messaging.',
    longDescription: 'Automatically detect new Google reviews and generate thoughtful, brand-aligned responses using AI. Customize response tone, handle negative reviews with care, and maintain your online reputation effortlessly. Supports multi-location clinics.',
    version: '1.2.0',
    author: { id: 'ranios', name: 'RaniOS Team', email: 'plugins@ranios.com', website: 'https://ranios.com', verified: true },
    category: 'marketing',
    tags: ['reviews', 'google', 'ai', 'automation', 'reputation'],
    status: 'active',
    icon: 'star',
    screenshots: [],
    permissions: ['reviews:read', 'reviews:write', 'ai:use'],
    pricing: { model: 'monthly', price: 2900, trialDays: 14, currency: 'USD' },
    compatibility: { minTier: 'starter', apiVersion: 'v1', dependencies: [] },
    stats: { installs: 245, activeInstalls: 198, rating: 4.7, reviewCount: 42, lastUpdated: Date.now() },
    configSchema: [
      { key: 'googleBusinessId', label: 'Google Business Profile ID', type: 'text', required: true, defaultValue: '', options: [], description: 'Your GBP listing ID', placeholder: 'accounts/123/locations/456' },
      { key: 'autoRespond', label: 'Auto-Respond to Reviews', type: 'boolean', required: false, defaultValue: true, options: [], description: 'Automatically respond or queue for approval', placeholder: '' },
      { key: 'minRatingAutoRespond', label: 'Min Rating for Auto-Response', type: 'number', required: false, defaultValue: 4, options: [], description: 'Only auto-respond to reviews with this rating or higher', placeholder: '4' },
      { key: 'tone', label: 'Response Tone', type: 'select', required: false, defaultValue: 'warm_professional', options: [{ label: 'Warm & Professional', value: 'warm_professional' }, { label: 'Formal', value: 'formal' }, { label: 'Friendly & Casual', value: 'friendly' }], description: 'Tone for generated responses', placeholder: '' },
    ],
    webhookEvents: ['review.created', 'review.responded'],
    entryPoint: '/plugins/google-reviews/index',
    sandboxed: true,
    verified: true,
  },
  {
    slug: 'instagram-post-scheduler',
    name: 'Instagram Post Scheduler',
    description: 'Schedule and auto-publish Instagram posts with AI-generated captions and hashtags.',
    longDescription: 'Plan your entire week of Instagram content with AI-powered caption generation, hashtag optimization, and optimal timing. Supports carousel posts, reels planning, and story scheduling. Integrates with your treatment photos and before/after gallery.',
    version: '2.0.1',
    author: { id: 'ranios', name: 'RaniOS Team', email: 'plugins@ranios.com', website: 'https://ranios.com', verified: true },
    category: 'marketing',
    tags: ['instagram', 'social-media', 'scheduler', 'ai', 'content'],
    status: 'active',
    icon: 'camera',
    screenshots: [],
    permissions: ['analytics:read', 'ai:use', 'storage:use'],
    pricing: { model: 'monthly', price: 3900, trialDays: 14, currency: 'USD' },
    compatibility: { minTier: 'pro', apiVersion: 'v1', dependencies: [] },
    stats: { installs: 312, activeInstalls: 267, rating: 4.5, reviewCount: 56, lastUpdated: Date.now() },
    configSchema: [
      { key: 'instagramAccountId', label: 'Instagram Business Account', type: 'text', required: true, defaultValue: '', options: [], description: 'Connected IG business account', placeholder: 'Enter account ID' },
      { key: 'postsPerWeek', label: 'Posts Per Week', type: 'number', required: false, defaultValue: 5, options: [], description: 'Target number of posts per week', placeholder: '5' },
      { key: 'hashtagStrategy', label: 'Hashtag Strategy', type: 'select', required: false, defaultValue: 'mixed', options: [{ label: 'High Volume', value: 'high_volume' }, { label: 'Niche Focused', value: 'niche' }, { label: 'Mixed', value: 'mixed' }], description: 'Hashtag targeting strategy', placeholder: '' },
    ],
    webhookEvents: ['post.scheduled', 'post.published', 'post.failed'],
    entryPoint: '/plugins/instagram-scheduler/index',
    sandboxed: true,
    verified: true,
  },
  {
    slug: 'patient-photo-gallery',
    name: 'Patient Photo Gallery',
    description: 'Secure before/after photo management with consent tracking and client portal integration.',
    longDescription: 'Manage treatment photos with HIPAA-compliant storage, automated consent tracking, and a beautiful client-facing gallery. Support for standardized photo positioning guides, side-by-side comparisons, and privacy-first sharing options.',
    version: '1.5.0',
    author: { id: 'ranios', name: 'RaniOS Team', email: 'plugins@ranios.com', website: 'https://ranios.com', verified: true },
    category: 'client_experience',
    tags: ['photos', 'before-after', 'hipaa', 'gallery', 'consent'],
    status: 'active',
    icon: 'image',
    screenshots: [],
    permissions: ['clients:read', 'storage:use', 'settings:read'],
    pricing: { model: 'monthly', price: 4900, trialDays: 7, currency: 'USD' },
    compatibility: { minTier: 'pro', apiVersion: 'v1', dependencies: [] },
    stats: { installs: 178, activeInstalls: 156, rating: 4.8, reviewCount: 38, lastUpdated: Date.now() },
    configSchema: [
      { key: 'storageProvider', label: 'Storage Provider', type: 'select', required: true, defaultValue: 'ranios_cloud', options: [{ label: 'RaniOS Cloud', value: 'ranios_cloud' }, { label: 'AWS S3', value: 's3' }, { label: 'Google Cloud', value: 'gcs' }], description: 'Where to store photos', placeholder: '' },
      { key: 'requireConsent', label: 'Require Consent', type: 'boolean', required: false, defaultValue: true, options: [], description: 'Require patient consent before storing', placeholder: '' },
      { key: 'watermark', label: 'Add Watermark', type: 'boolean', required: false, defaultValue: true, options: [], description: 'Add clinic watermark to gallery photos', placeholder: '' },
    ],
    webhookEvents: ['photo.uploaded', 'consent.signed'],
    entryPoint: '/plugins/photo-gallery/index',
    sandboxed: true,
    verified: true,
  },
  {
    slug: 'consent-form-builder',
    name: 'Treatment Consent Form Builder',
    description: 'Digital consent forms with e-signatures, customizable templates, and compliance tracking.',
    longDescription: 'Build professional treatment consent forms with drag-and-drop, collect legally binding e-signatures, track consent status per client, and maintain a compliance audit trail. Includes templates for common aesthetic procedures.',
    version: '1.3.0',
    author: { id: 'ranios', name: 'RaniOS Team', email: 'plugins@ranios.com', website: 'https://ranios.com', verified: true },
    category: 'operations',
    tags: ['consent', 'forms', 'e-signature', 'compliance', 'hipaa'],
    status: 'active',
    icon: 'file-text',
    screenshots: [],
    permissions: ['clients:read', 'clients:write', 'storage:use'],
    pricing: { model: 'monthly', price: 3900, trialDays: 14, currency: 'USD' },
    compatibility: { minTier: 'starter', apiVersion: 'v1', dependencies: [] },
    stats: { installs: 201, activeInstalls: 189, rating: 4.6, reviewCount: 35, lastUpdated: Date.now() },
    configSchema: [
      { key: 'signatureMethod', label: 'Signature Method', type: 'select', required: false, defaultValue: 'draw', options: [{ label: 'Draw', value: 'draw' }, { label: 'Type', value: 'type' }, { label: 'Both', value: 'both' }], description: 'How patients sign', placeholder: '' },
      { key: 'autoSend', label: 'Auto-Send Before Appointment', type: 'boolean', required: false, defaultValue: true, options: [], description: 'Send consent form 24h before appointment', placeholder: '' },
    ],
    webhookEvents: ['form.sent', 'form.signed', 'form.expired'],
    entryPoint: '/plugins/consent-forms/index',
    sandboxed: true,
    verified: true,
  },
  {
    slug: 'custom-report-builder',
    name: 'Custom Report Builder',
    description: 'Drag-and-drop report builder with scheduled delivery and custom KPI tracking.',
    longDescription: 'Create custom reports with a visual builder. Combine any data source, add charts and tables, schedule automatic delivery to stakeholders, and track custom KPIs unique to your clinic.',
    version: '1.1.0',
    author: { id: 'ranios', name: 'RaniOS Team', email: 'plugins@ranios.com', website: 'https://ranios.com', verified: true },
    category: 'analytics',
    tags: ['reports', 'analytics', 'custom', 'kpi', 'dashboard'],
    status: 'active',
    icon: 'bar-chart-2',
    screenshots: [],
    permissions: ['analytics:read', 'clients:read', 'transactions:read', 'appointments:read'],
    pricing: { model: 'monthly', price: 4900, trialDays: 14, currency: 'USD' },
    compatibility: { minTier: 'pro', apiVersion: 'v1', dependencies: [] },
    stats: { installs: 156, activeInstalls: 134, rating: 4.4, reviewCount: 28, lastUpdated: Date.now() },
    configSchema: [],
    webhookEvents: ['report.generated', 'report.delivered'],
    entryPoint: '/plugins/report-builder/index',
    sandboxed: true,
    verified: true,
  },
  {
    slug: 'inventory-barcode-scanner',
    name: 'Inventory Barcode Scanner',
    description: 'Scan barcodes to manage inventory, receive shipments, and track usage.',
    longDescription: 'Use your phone camera to scan product barcodes for instant inventory management. Receive shipments by scanning, track product usage per treatment, and automate reorder alerts.',
    version: '1.0.0',
    author: { id: 'medtools', name: 'MedTools Inc', email: 'dev@medtools.io', website: 'https://medtools.io', verified: true },
    category: 'operations',
    tags: ['inventory', 'barcode', 'scanner', 'mobile', 'tracking'],
    status: 'active',
    icon: 'scan',
    screenshots: [],
    permissions: ['inventory:read', 'inventory:write'],
    pricing: { model: 'monthly', price: 1900, trialDays: 7, currency: 'USD' },
    compatibility: { minTier: 'starter', apiVersion: 'v1', dependencies: [] },
    stats: { installs: 89, activeInstalls: 76, rating: 4.3, reviewCount: 15, lastUpdated: Date.now() },
    configSchema: [],
    webhookEvents: ['scan.completed', 'reorder.triggered'],
    entryPoint: '/plugins/barcode-scanner/index',
    sandboxed: true,
    verified: true,
  },
  {
    slug: 'staff-scheduling-optimizer',
    name: 'Staff Scheduling Optimizer',
    description: 'AI-optimized staff scheduling with demand forecasting and labor law compliance.',
    longDescription: 'Automatically generate optimal staff schedules based on demand forecasting, provider skills, overtime rules, and client preferences. Reduce scheduling conflicts and maximize provider utilization.',
    version: '1.4.0',
    author: { id: 'ranios', name: 'RaniOS Team', email: 'plugins@ranios.com', website: 'https://ranios.com', verified: true },
    category: 'scheduling',
    tags: ['scheduling', 'staff', 'optimization', 'ai', 'labor'],
    status: 'active',
    icon: 'users',
    screenshots: [],
    permissions: ['appointments:read', 'appointments:write', 'analytics:read', 'ai:use'],
    pricing: { model: 'monthly', price: 5900, trialDays: 14, currency: 'USD' },
    compatibility: { minTier: 'pro', apiVersion: 'v1', dependencies: [] },
    stats: { installs: 134, activeInstalls: 112, rating: 4.6, reviewCount: 24, lastUpdated: Date.now() },
    configSchema: [
      { key: 'maxHoursPerWeek', label: 'Max Hours Per Week', type: 'number', required: false, defaultValue: 40, options: [], description: 'Default max hours per provider', placeholder: '40' },
      { key: 'breakDuration', label: 'Min Break Duration (min)', type: 'number', required: false, defaultValue: 30, options: [], description: 'Minimum break between shifts', placeholder: '30' },
    ],
    webhookEvents: ['schedule.generated', 'conflict.detected'],
    entryPoint: '/plugins/staff-scheduler/index',
    sandboxed: true,
    verified: true,
  },
  {
    slug: 'client-birthday-automator',
    name: 'Client Birthday Automator',
    description: 'Automated birthday messages with personalized offers and loyalty rewards.',
    longDescription: 'Never miss a client birthday. Send personalized email and SMS greetings with exclusive birthday offers, track redemption rates, and boost client loyalty with thoughtful automation.',
    version: '1.1.0',
    author: { id: 'ranios', name: 'RaniOS Team', email: 'plugins@ranios.com', website: 'https://ranios.com', verified: true },
    category: 'communication',
    tags: ['birthday', 'automation', 'loyalty', 'email', 'sms'],
    status: 'active',
    icon: 'gift',
    screenshots: [],
    permissions: ['clients:read', 'messages:send'],
    pricing: { model: 'monthly', price: 1900, trialDays: 14, currency: 'USD' },
    compatibility: { minTier: 'starter', apiVersion: 'v1', dependencies: [] },
    stats: { installs: 267, activeInstalls: 234, rating: 4.8, reviewCount: 48, lastUpdated: Date.now() },
    configSchema: [
      { key: 'daysBeforeBirthday', label: 'Days Before Birthday', type: 'number', required: false, defaultValue: 7, options: [], description: 'When to send the birthday offer', placeholder: '7' },
      { key: 'discountPercent', label: 'Birthday Discount %', type: 'number', required: false, defaultValue: 15, options: [], description: 'Discount percentage for birthday offer', placeholder: '15' },
      { key: 'channels', label: 'Notification Channels', type: 'multiselect', required: false, defaultValue: ['email'], options: [{ label: 'Email', value: 'email' }, { label: 'SMS', value: 'sms' }], description: 'How to send birthday greetings', placeholder: '' },
    ],
    webhookEvents: ['birthday.sent', 'birthday.redeemed'],
    entryPoint: '/plugins/birthday-automator/index',
    sandboxed: true,
    verified: true,
  },
  {
    slug: 'referral-program-manager',
    name: 'Referral Program Manager',
    description: 'Track and reward client referrals with customizable tiers and automated payouts.',
    longDescription: 'Build a referral program that grows your practice. Track who referred whom, automate reward distribution, set up tiered incentives, and monitor referral ROI with detailed analytics.',
    version: '1.2.0',
    author: { id: 'growthlab', name: 'GrowthLab', email: 'hello@growthlab.dev', website: 'https://growthlab.dev', verified: true },
    category: 'marketing',
    tags: ['referral', 'rewards', 'loyalty', 'growth', 'marketing'],
    status: 'active',
    icon: 'share-2',
    screenshots: [],
    permissions: ['clients:read', 'clients:write', 'transactions:read', 'messages:send'],
    pricing: { model: 'monthly', price: 3900, trialDays: 14, currency: 'USD' },
    compatibility: { minTier: 'pro', apiVersion: 'v1', dependencies: [] },
    stats: { installs: 145, activeInstalls: 123, rating: 4.5, reviewCount: 26, lastUpdated: Date.now() },
    configSchema: [
      { key: 'rewardType', label: 'Reward Type', type: 'select', required: true, defaultValue: 'credit', options: [{ label: 'Account Credit', value: 'credit' }, { label: 'Discount Code', value: 'discount' }, { label: 'Free Service', value: 'free_service' }], description: 'Type of referral reward', placeholder: '' },
      { key: 'rewardAmount', label: 'Reward Value ($)', type: 'number', required: true, defaultValue: 50, options: [], description: 'Dollar value of referral reward', placeholder: '50' },
      { key: 'doubleReward', label: 'Reward Both Parties', type: 'boolean', required: false, defaultValue: true, options: [], description: 'Give reward to both referrer and referred', placeholder: '' },
    ],
    webhookEvents: ['referral.created', 'referral.completed', 'reward.issued'],
    entryPoint: '/plugins/referral-manager/index',
    sandboxed: true,
    verified: true,
  },
  {
    slug: 'loyalty-program',
    name: 'Loyalty Program',
    description: 'Points-based loyalty with tiers, rewards catalog, and automated engagement.',
    longDescription: 'Implement a comprehensive loyalty program with points earning, tier progression, reward redemption, and automated engagement triggers. Keep clients coming back with meaningful incentives.',
    version: '2.0.0',
    author: { id: 'ranios', name: 'RaniOS Team', email: 'plugins@ranios.com', website: 'https://ranios.com', verified: true },
    category: 'client_experience',
    tags: ['loyalty', 'points', 'rewards', 'retention', 'engagement'],
    status: 'active',
    icon: 'award',
    screenshots: [],
    permissions: ['clients:read', 'clients:write', 'transactions:read', 'messages:send'],
    pricing: { model: 'monthly', price: 4900, trialDays: 14, currency: 'USD' },
    compatibility: { minTier: 'pro', apiVersion: 'v1', dependencies: [] },
    stats: { installs: 198, activeInstalls: 176, rating: 4.7, reviewCount: 39, lastUpdated: Date.now() },
    configSchema: [
      { key: 'pointsPerDollar', label: 'Points Per Dollar Spent', type: 'number', required: false, defaultValue: 1, options: [], description: 'Points earned per dollar', placeholder: '1' },
      { key: 'tiers', label: 'Loyalty Tiers', type: 'multiselect', required: false, defaultValue: ['bronze', 'silver', 'gold'], options: [{ label: 'Bronze', value: 'bronze' }, { label: 'Silver', value: 'silver' }, { label: 'Gold', value: 'gold' }, { label: 'Platinum', value: 'platinum' }], description: 'Active loyalty tiers', placeholder: '' },
    ],
    webhookEvents: ['points.earned', 'tier.upgraded', 'reward.redeemed'],
    entryPoint: '/plugins/loyalty-program/index',
    sandboxed: true,
    verified: true,
  },
  {
    slug: 'gift-card-system',
    name: 'Gift Card System',
    description: 'Digital and physical gift cards with online purchasing, balance tracking, and reporting.',
    longDescription: 'Sell digital and physical gift cards through your website and in-clinic. Support custom amounts, branded designs, balance checking, and detailed sales reporting. Perfect for holidays and special occasions.',
    version: '1.3.0',
    author: { id: 'ranios', name: 'RaniOS Team', email: 'plugins@ranios.com', website: 'https://ranios.com', verified: true },
    category: 'finance',
    tags: ['gift-cards', 'sales', 'e-commerce', 'payments'],
    status: 'active',
    icon: 'credit-card',
    screenshots: [],
    permissions: ['transactions:read', 'transactions:write', 'clients:read'],
    pricing: { model: 'monthly', price: 2900, trialDays: 7, currency: 'USD' },
    compatibility: { minTier: 'starter', apiVersion: 'v1', dependencies: [] },
    stats: { installs: 167, activeInstalls: 145, rating: 4.4, reviewCount: 29, lastUpdated: Date.now() },
    configSchema: [
      { key: 'minAmount', label: 'Min Gift Card Amount ($)', type: 'number', required: false, defaultValue: 25, options: [], description: 'Minimum gift card value', placeholder: '25' },
      { key: 'maxAmount', label: 'Max Gift Card Amount ($)', type: 'number', required: false, defaultValue: 500, options: [], description: 'Maximum gift card value', placeholder: '500' },
      { key: 'expirationMonths', label: 'Expiration (months)', type: 'number', required: false, defaultValue: 12, options: [], description: 'Months until gift card expires (0 = no expiry)', placeholder: '12' },
    ],
    webhookEvents: ['giftcard.purchased', 'giftcard.redeemed', 'giftcard.expired'],
    entryPoint: '/plugins/gift-cards/index',
    sandboxed: true,
    verified: true,
  },
  {
    slug: 'online-booking-widget',
    name: 'Online Booking Widget',
    description: 'Embeddable booking widget for your website with real-time availability.',
    longDescription: 'Add a professional booking widget to any website with real-time provider availability, service selection, and instant confirmation. Fully customizable styling to match your brand.',
    version: '2.1.0',
    author: { id: 'ranios', name: 'RaniOS Team', email: 'plugins@ranios.com', website: 'https://ranios.com', verified: true },
    category: 'scheduling',
    tags: ['booking', 'widget', 'embed', 'scheduling', 'website'],
    status: 'active',
    icon: 'calendar',
    screenshots: [],
    permissions: ['appointments:read', 'appointments:write', 'clients:write', 'settings:read'],
    pricing: { model: 'free', price: 0, trialDays: 0, currency: 'USD' },
    compatibility: { minTier: 'starter', apiVersion: 'v1', dependencies: [] },
    stats: { installs: 423, activeInstalls: 398, rating: 4.6, reviewCount: 67, lastUpdated: Date.now() },
    configSchema: [
      { key: 'primaryColor', label: 'Primary Color', type: 'text', required: false, defaultValue: '#C9A96E', options: [], description: 'Widget accent color (hex)', placeholder: '#C9A96E' },
      { key: 'showPrices', label: 'Show Prices', type: 'boolean', required: false, defaultValue: true, options: [], description: 'Display service prices in widget', placeholder: '' },
      { key: 'requireDeposit', label: 'Require Deposit', type: 'boolean', required: false, defaultValue: false, options: [], description: 'Require deposit to book', placeholder: '' },
    ],
    webhookEvents: ['booking.created', 'booking.cancelled'],
    entryPoint: '/plugins/booking-widget/index',
    sandboxed: true,
    verified: true,
  },
  {
    slug: 'waitlist-manager',
    name: 'Waitlist Manager',
    description: 'Smart waitlist with auto-fill, priority rules, and client notifications.',
    longDescription: 'When a slot opens up, automatically notify waitlisted clients based on priority rules. Support for preferred providers, time windows, and service-specific waitlists.',
    version: '1.0.0',
    author: { id: 'ranios', name: 'RaniOS Team', email: 'plugins@ranios.com', website: 'https://ranios.com', verified: true },
    category: 'scheduling',
    tags: ['waitlist', 'scheduling', 'notifications', 'automation'],
    status: 'active',
    icon: 'list',
    screenshots: [],
    permissions: ['appointments:read', 'appointments:write', 'clients:read', 'messages:send'],
    pricing: { model: 'monthly', price: 2900, trialDays: 14, currency: 'USD' },
    compatibility: { minTier: 'starter', apiVersion: 'v1', dependencies: [] },
    stats: { installs: 112, activeInstalls: 95, rating: 4.5, reviewCount: 19, lastUpdated: Date.now() },
    configSchema: [
      { key: 'maxWaitlistSize', label: 'Max Waitlist Size', type: 'number', required: false, defaultValue: 50, options: [], description: 'Maximum clients per waitlist', placeholder: '50' },
      { key: 'notifyMethod', label: 'Notification Method', type: 'select', required: false, defaultValue: 'sms', options: [{ label: 'SMS', value: 'sms' }, { label: 'Email', value: 'email' }, { label: 'Both', value: 'both' }], description: 'How to notify clients', placeholder: '' },
      { key: 'responseWindow', label: 'Response Window (hours)', type: 'number', required: false, defaultValue: 2, options: [], description: 'Hours to respond before moving to next', placeholder: '2' },
    ],
    webhookEvents: ['waitlist.added', 'waitlist.notified', 'waitlist.booked'],
    entryPoint: '/plugins/waitlist-manager/index',
    sandboxed: true,
    verified: true,
  },
  {
    slug: 'treatment-protocol-library',
    name: 'Treatment Protocol Library',
    description: 'Standardized treatment protocols with provider guides and training materials.',
    longDescription: 'Build a comprehensive library of treatment protocols with step-by-step guides, product requirements, contraindications, and provider training checklists. Ensure consistency across your team.',
    version: '1.0.0',
    author: { id: 'medtools', name: 'MedTools Inc', email: 'dev@medtools.io', website: 'https://medtools.io', verified: true },
    category: 'operations',
    tags: ['protocols', 'training', 'documentation', 'standards'],
    status: 'active',
    icon: 'book',
    screenshots: [],
    permissions: ['settings:read', 'settings:write', 'storage:use'],
    pricing: { model: 'monthly', price: 3900, trialDays: 14, currency: 'USD' },
    compatibility: { minTier: 'pro', apiVersion: 'v1', dependencies: [] },
    stats: { installs: 87, activeInstalls: 78, rating: 4.3, reviewCount: 14, lastUpdated: Date.now() },
    configSchema: [],
    webhookEvents: ['protocol.created', 'protocol.updated'],
    entryPoint: '/plugins/protocol-library/index',
    sandboxed: true,
    verified: true,
  },
  {
    slug: 'revenue-forecasting',
    name: 'Revenue Forecasting',
    description: 'AI-powered revenue forecasting with scenario planning and goal tracking.',
    longDescription: 'Predict future revenue with machine learning models trained on your historical data. Run what-if scenarios, set revenue goals with milestones, and get actionable recommendations to hit your targets.',
    version: '1.2.0',
    author: { id: 'ranios', name: 'RaniOS Team', email: 'plugins@ranios.com', website: 'https://ranios.com', verified: true },
    category: 'analytics',
    tags: ['revenue', 'forecasting', 'ai', 'analytics', 'planning'],
    status: 'active',
    icon: 'trending-up',
    screenshots: [],
    permissions: ['analytics:read', 'transactions:read', 'appointments:read', 'ai:use'],
    pricing: { model: 'monthly', price: 5900, trialDays: 14, currency: 'USD' },
    compatibility: { minTier: 'pro', apiVersion: 'v1', dependencies: [] },
    stats: { installs: 134, activeInstalls: 118, rating: 4.7, reviewCount: 22, lastUpdated: Date.now() },
    configSchema: [
      { key: 'forecastHorizon', label: 'Forecast Horizon (months)', type: 'number', required: false, defaultValue: 6, options: [], description: 'How far ahead to forecast', placeholder: '6' },
      { key: 'goalAmount', label: 'Monthly Revenue Goal ($)', type: 'number', required: false, defaultValue: 0, options: [], description: 'Monthly revenue target (0 = auto-detect)', placeholder: '0' },
    ],
    webhookEvents: ['forecast.updated', 'goal.reached', 'goal.at_risk'],
    entryPoint: '/plugins/revenue-forecast/index',
    sandboxed: true,
    verified: true,
  },
];

// ─── Initialize Plugins ───────────────────────────────────────────

export function initializeMarketplace(): void {
  BUILTIN_PLUGINS.forEach(p => {
    const id = `plugin_${p.slug}`;
    if (!plugins.has(id)) {
      plugins.set(id, {
        ...p,
        id,
        createdAt: Date.now() - 90 * 24 * 60 * 60 * 1000, // 90 days ago
        updatedAt: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days ago
      });
    }
  });
}

// ─── Plugin Queries ───────────────────────────────────────────────

export function getAllPlugins(filter?: {
  category?: PluginCategory;
  search?: string;
  minTier?: string;
  sort?: 'popular' | 'rating' | 'newest' | 'price_low' | 'price_high';
}): Plugin[] {
  let result = Array.from(plugins.values()).filter(p => p.status === 'active');

  if (filter?.category) result = result.filter(p => p.category === filter.category);
  if (filter?.minTier) {
    const tiers = ['starter', 'pro', 'enterprise'];
    const minIdx = tiers.indexOf(filter.minTier);
    result = result.filter(p => tiers.indexOf(p.compatibility.minTier) <= minIdx);
  }
  if (filter?.search) {
    const term = filter.search.toLowerCase();
    result = result.filter(p =>
      p.name.toLowerCase().includes(term) ||
      p.description.toLowerCase().includes(term) ||
      p.tags.some(t => t.includes(term)),
    );
  }

  switch (filter?.sort) {
    case 'popular': result.sort((a, b) => b.stats.activeInstalls - a.stats.activeInstalls); break;
    case 'rating': result.sort((a, b) => b.stats.rating - a.stats.rating); break;
    case 'newest': result.sort((a, b) => b.createdAt - a.createdAt); break;
    case 'price_low': result.sort((a, b) => a.pricing.price - b.pricing.price); break;
    case 'price_high': result.sort((a, b) => b.pricing.price - a.pricing.price); break;
    default: result.sort((a, b) => b.stats.activeInstalls - a.stats.activeInstalls);
  }

  return result;
}

export function getPlugin(pluginId: string): Plugin | null {
  return plugins.get(pluginId) || null;
}

export function getPluginBySlug(slug: string): Plugin | null {
  return Array.from(plugins.values()).find(p => p.slug === slug) || null;
}

// ─── Installation ─────────────────────────────────────────────────

export function installPlugin(
  input: z.infer<typeof InstallPluginSchema>,
): PluginInstallation | null {
  const plugin = plugins.get(input.pluginId);
  if (!plugin) return null;

  // Check if already installed
  const existing = Array.from(installations.values()).find(
    i => i.tenantId === input.tenantId && i.pluginId === input.pluginId && i.status === 'active',
  );
  if (existing) return existing;

  const installation: PluginInstallation = {
    id: `inst_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`,
    tenantId: input.tenantId,
    pluginId: input.pluginId,
    pluginSlug: plugin.slug,
    status: 'active',
    config: input.config || {},
    grantedPermissions: (input.grantedPermissions as PluginPermission[]) || plugin.permissions,
    installedAt: Date.now(),
    updatedAt: Date.now(),
    installedBy: input.installedBy,
    version: plugin.version,
    trialEndsAt: plugin.pricing.trialDays > 0
      ? Date.now() + plugin.pricing.trialDays * 24 * 60 * 60 * 1000
      : null,
    lastError: null,
  };

  installations.set(installation.id, installation);

  // Update stats
  plugin.stats.installs += 1;
  plugin.stats.activeInstalls += 1;

  return installation;
}

export function uninstallPlugin(installationId: string): boolean {
  const inst = installations.get(installationId);
  if (!inst) return false;

  inst.status = 'uninstalling';

  const plugin = plugins.get(inst.pluginId);
  if (plugin) {
    plugin.stats.activeInstalls = Math.max(0, plugin.stats.activeInstalls - 1);
  }

  installations.delete(installationId);
  return true;
}

export function updatePluginConfig(
  installationId: string,
  config: Record<string, unknown>,
): boolean {
  const inst = installations.get(installationId);
  if (!inst) return false;

  inst.config = { ...inst.config, ...config };
  inst.updatedAt = Date.now();
  return true;
}

export function pausePlugin(installationId: string): boolean {
  const inst = installations.get(installationId);
  if (!inst) return false;
  inst.status = 'paused';
  inst.updatedAt = Date.now();
  return true;
}

export function resumePlugin(installationId: string): boolean {
  const inst = installations.get(installationId);
  if (!inst || inst.status !== 'paused') return false;
  inst.status = 'active';
  inst.updatedAt = Date.now();
  return true;
}

export function getTenantInstallations(tenantId: string): PluginInstallation[] {
  return Array.from(installations.values())
    .filter(i => i.tenantId === tenantId)
    .sort((a, b) => b.installedAt - a.installedAt);
}

export function getInstallation(installationId: string): PluginInstallation | null {
  return installations.get(installationId) || null;
}

export function isPluginInstalled(tenantId: string, pluginSlug: string): boolean {
  return Array.from(installations.values()).some(
    i => i.tenantId === tenantId && i.pluginSlug === pluginSlug && i.status === 'active',
  );
}

// ─── Reviews ──────────────────────────────────────────────────────

export function submitReview(input: z.infer<typeof SubmitReviewSchema>): PluginReview {
  const review: PluginReview = {
    id: `rev_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`,
    pluginId: input.pluginId,
    tenantId: input.tenantId,
    userId: input.userId,
    userName: input.userName,
    rating: input.rating,
    title: input.title,
    body: input.body,
    createdAt: Date.now(),
    helpful: 0,
  };

  reviews.push(review);

  // Update plugin rating
  const plugin = plugins.get(input.pluginId);
  if (plugin) {
    const pluginReviews = reviews.filter(r => r.pluginId === input.pluginId);
    plugin.stats.reviewCount = pluginReviews.length;
    plugin.stats.rating = Math.round(
      (pluginReviews.reduce((sum, r) => sum + r.rating, 0) / pluginReviews.length) * 10,
    ) / 10;
  }

  return review;
}

export function getPluginReviews(
  pluginId: string,
  limit: number = 20,
): PluginReview[] {
  return reviews
    .filter(r => r.pluginId === pluginId)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, limit);
}

// ─── Revenue Sharing ──────────────────────────────────────────────

export function calculateRevenueShare(
  pluginId: string,
  periodStart: number,
  periodEnd: number,
): RevenueShare | null {
  const plugin = plugins.get(pluginId);
  if (!plugin) return null;

  const activeInstalls = Array.from(installations.values()).filter(
    i => i.pluginId === pluginId && i.status === 'active',
  );

  let totalRevenue = 0;
  if (plugin.pricing.model === 'monthly') {
    const months = (periodEnd - periodStart) / (30 * 24 * 60 * 60 * 1000);
    totalRevenue = (plugin.pricing.price / 100) * activeInstalls.length * months;
  } else if (plugin.pricing.model === 'one_time') {
    const newInstalls = activeInstalls.filter(
      i => i.installedAt >= periodStart && i.installedAt <= periodEnd,
    );
    totalRevenue = (plugin.pricing.price / 100) * newInstalls.length;
  }

  return {
    pluginId,
    authorId: plugin.author.id,
    period: { start: periodStart, end: periodEnd },
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    authorShare: Math.round(totalRevenue * REVENUE_SHARE_AUTHOR * 100) / 100,
    platformShare: Math.round(totalRevenue * REVENUE_SHARE_PLATFORM * 100) / 100,
    installs: plugin.stats.installs,
    activeInstalls: activeInstalls.length,
  };
}

// ─── Marketplace Stats ────────────────────────────────────────────

export function getMarketplaceStats(): MarketplaceStats {
  const allPlugins = Array.from(plugins.values()).filter(p => p.status === 'active');
  const totalInstalls = allPlugins.reduce((sum, p) => sum + p.stats.installs, 0);
  const totalRevenue = allPlugins.reduce((sum, p) => sum + (p.pricing.price / 100) * p.stats.activeInstalls, 0);

  const categoryCounts = new Map<PluginCategory, number>();
  allPlugins.forEach(p => {
    categoryCounts.set(p.category, (categoryCounts.get(p.category) || 0) + 1);
  });

  return {
    totalPlugins: allPlugins.length,
    totalInstalls,
    totalRevenue: Math.round(totalRevenue),
    topPlugins: allPlugins
      .sort((a, b) => b.stats.activeInstalls - a.stats.activeInstalls)
      .slice(0, 5)
      .map(p => ({ plugin: p, installs: p.stats.activeInstalls })),
    categoryBreakdown: Array.from(categoryCounts.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count),
    recentlyAdded: allPlugins
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5),
    trending: allPlugins
      .sort((a, b) => b.stats.rating * b.stats.reviewCount - a.stats.rating * a.stats.reviewCount)
      .slice(0, 5),
  };
}

// ─── Reset (for testing) ──────────────────────────────────────────

export function resetMarketplace(): void {
  plugins.clear();
  installations.clear();
  reviews.length = 0;
}
