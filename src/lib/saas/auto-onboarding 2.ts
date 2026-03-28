/**
 * RaniOS Zero-Touch Onboarding System
 *
 * Stripe checkout → tenant provisioned → admin account created →
 * 7-step guided setup → automated nudges → go live.
 *
 * The entire flow runs without human intervention.
 */

import { z } from 'zod';

// ─── Schemas ──────────────────────────────────────────────────────

export const TenantProvisionSchema = z.object({
  clinicName: z.string().min(1),
  ownerName: z.string().min(1),
  ownerEmail: z.string().email(),
  plan: z.enum(['starter', 'professional', 'enterprise']),
  stripeCustomerId: z.string().min(1),
  stripeSubscriptionId: z.string().min(1),
});

export type TenantProvisionInput = z.infer<typeof TenantProvisionSchema>;

export const SetupStepDataSchema = z.discriminatedUnion('step', [
  z.object({
    step: z.literal('clinic_info'),
    name: z.string().min(1),
    address: z.string().min(1),
    phone: z.string().min(1),
    hours: z.record(z.object({ open: z.string(), close: z.string(), closed: z.boolean() })),
    logoUrl: z.string().optional(),
  }),
  z.object({
    step: z.literal('connect_airtable'),
    airtablePAT: z.string().min(1),
    baseId: z.string().min(1),
  }),
  z.object({
    step: z.literal('import_services'),
    services: z.array(
      z.object({
        name: z.string().min(1),
        category: z.string(),
        duration: z.number().min(5),
        price: z.number().min(0),
      })
    ),
    useTemplate: z.boolean().optional(),
  }),
  z.object({
    step: z.literal('add_team'),
    members: z.array(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
        role: z.enum(['owner', 'provider', 'frontdesk', 'marketing', 'operations']),
      })
    ),
  }),
  z.object({
    step: z.literal('configure_branding'),
    primaryColor: z.string(),
    secondaryColor: z.string(),
    accentColor: z.string(),
    logoUrl: z.string().optional(),
    fontFamily: z.string().optional(),
  }),
  z.object({
    step: z.literal('setup_integrations'),
    mangomint: z.object({ apiKey: z.string(), companyId: z.string() }).optional(),
    square: z.object({ accessToken: z.string() }).optional(),
    stripe: z.object({ secretKey: z.string() }).optional(),
  }),
  z.object({
    step: z.literal('go_live'),
    confirmed: z.boolean(),
    customDomain: z.string().optional(),
  }),
]);

export type SetupStepData = z.infer<typeof SetupStepDataSchema>;

// ─── Types ────────────────────────────────────────────────────────

export type SetupStepName =
  | 'clinic_info'
  | 'connect_airtable'
  | 'import_services'
  | 'add_team'
  | 'configure_branding'
  | 'setup_integrations'
  | 'go_live';

export interface Tenant {
  id: string;
  clinicName: string;
  subdomain: string;
  ownerName: string;
  ownerEmail: string;
  plan: 'starter' | 'professional' | 'enterprise';
  status: TenantStatus;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  airtableBaseId?: string;
  airtablePAT?: string;
  setupProgress: SetupProgress;
  config: TenantConfig;
  createdAt: string;
  activatedAt?: string;
  lastActivityAt: string;
}

export type TenantStatus =
  | 'provisioning'
  | 'setup_pending'
  | 'setup_in_progress'
  | 'active'
  | 'suspended'
  | 'cancelled';

export interface SetupProgress {
  currentStep: number;
  steps: SetupStepProgress[];
  completionPercentage: number;
  startedAt: string;
  completedAt?: string;
  lastStepAt?: string;
}

export interface SetupStepProgress {
  step: SetupStepName;
  label: string;
  description: string;
  completed: boolean;
  completedAt?: string;
  skipped: boolean;
  required: boolean;
  data?: Record<string, unknown>;
}

export interface TenantConfig {
  branding: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    logoUrl?: string;
    fontFamily: string;
  };
  features: Record<string, boolean>;
  integrations: {
    mangomint?: { apiKey: string; companyId: string; connected: boolean };
    square?: { accessToken: string; connected: boolean };
    stripe?: { secretKey: string; connected: boolean };
  };
  customDomain?: string;
}

export interface OnboardingNudge {
  type: 'email' | 'in_app' | 'sms';
  trigger: 'stalled_24h' | 'stalled_72h' | 'stalled_7d' | 'step_complete' | 'all_complete';
  subject: string;
  message: string;
  sentAt?: string;
}

export interface GuidedTour {
  id: string;
  name: string;
  steps: TourStep[];
  triggeredAt: string;
  completedAt?: string;
}

export interface TourStep {
  target: string; // CSS selector
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  action?: string; // optional action hint
}

// ─── Constants ────────────────────────────────────────────────────

export const SETUP_STEPS: {
  step: SetupStepName;
  label: string;
  description: string;
  required: boolean;
}[] = [
  {
    step: 'clinic_info',
    label: 'Clinic Information',
    description: 'Set up your clinic name, address, phone, and operating hours',
    required: true,
  },
  {
    step: 'connect_airtable',
    label: 'Connect Database',
    description: 'Connect your Airtable base for data storage',
    required: true,
  },
  {
    step: 'import_services',
    label: 'Import Services',
    description: 'Add your treatment menu from our template or manually',
    required: true,
  },
  {
    step: 'add_team',
    label: 'Add Team Members',
    description: 'Invite your providers and staff with role-based access',
    required: false,
  },
  {
    step: 'configure_branding',
    label: 'Configure Branding',
    description: 'Set your brand colors, logo, and fonts',
    required: false,
  },
  {
    step: 'setup_integrations',
    label: 'Set Up Integrations',
    description: 'Connect Mangomint, Square, or Stripe',
    required: false,
  },
  {
    step: 'go_live',
    label: 'Go Live',
    description: 'Review your setup and launch your dashboard',
    required: true,
  },
];

export const SERVICE_TEMPLATES: {
  name: string;
  category: string;
  duration: number;
  price: number;
}[] = [
  { name: 'Botox', category: 'Injectables', duration: 30, price: 12 },
  { name: 'Dermal Fillers', category: 'Injectables', duration: 45, price: 650 },
  { name: 'HydraFacial Signature', category: 'Facials', duration: 60, price: 275 },
  { name: 'Chemical Peel', category: 'Facials', duration: 45, price: 200 },
  { name: 'Microneedling', category: 'Skin Rejuvenation', duration: 60, price: 350 },
  { name: 'RF Microneedling', category: 'Skin Rejuvenation', duration: 75, price: 495 },
  { name: 'Laser Hair Removal', category: 'Laser', duration: 30, price: 200 },
  { name: 'IPL Photofacial', category: 'Laser', duration: 45, price: 350 },
  { name: 'PRP Therapy', category: 'Regenerative', duration: 60, price: 600 },
  { name: 'IV Therapy', category: 'Wellness', duration: 45, price: 200 },
  { name: 'B12 Injection', category: 'Wellness', duration: 15, price: 35 },
  { name: 'Weight Loss Consultation', category: 'Wellness', duration: 30, price: 100 },
  { name: 'Skin Consultation', category: 'Consultations', duration: 30, price: 0 },
  { name: 'Body Contouring', category: 'Body', duration: 60, price: 500 },
  { name: 'Scar Treatment', category: 'Skin Rejuvenation', duration: 45, price: 300 },
];

export const DEFAULT_BRANDING: TenantConfig['branding'] = {
  primaryColor: '#0F1D2C',
  secondaryColor: '#C9A96E',
  accentColor: '#F8F6F1',
  fontFamily: 'Inter',
};

export const SAMPLE_DATA_CONFIG = {
  clients: 25,
  appointments: 50,
  transactions: 30,
  reviews: 10,
  kpiDays: 30,
};

// ─── Tenant Provisioning ──────────────────────────────────────────

export function generateSubdomain(clinicName: string): string {
  return clinicName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 30)
    .replace(/^-|-$/g, '');
}

export function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const special = '!@#$%';
  let password = '';
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  password += special.charAt(Math.floor(Math.random() * special.length));
  return password;
}

export function createTenantRecord(input: TenantProvisionInput): Tenant {
  const id = `tn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const subdomain = generateSubdomain(input.clinicName);
  const now = new Date().toISOString();

  return {
    id,
    clinicName: input.clinicName,
    subdomain,
    ownerName: input.ownerName,
    ownerEmail: input.ownerEmail,
    plan: input.plan,
    status: 'provisioning',
    stripeCustomerId: input.stripeCustomerId,
    stripeSubscriptionId: input.stripeSubscriptionId,
    setupProgress: initializeSetupProgress(),
    config: {
      branding: { ...DEFAULT_BRANDING },
      features: getFeaturesByPlan(input.plan),
      integrations: {},
    },
    createdAt: now,
    lastActivityAt: now,
  };
}

export function initializeSetupProgress(): SetupProgress {
  return {
    currentStep: 0,
    steps: SETUP_STEPS.map((s) => ({
      step: s.step,
      label: s.label,
      description: s.description,
      completed: false,
      skipped: false,
      required: s.required,
    })),
    completionPercentage: 0,
    startedAt: new Date().toISOString(),
  };
}

export function getFeaturesByPlan(
  plan: 'starter' | 'professional' | 'enterprise'
): Record<string, boolean> {
  const base = {
    dashboard: true,
    crm: true,
    scheduling: true,
    basic_reports: true,
    email_campaigns: false,
    sms_campaigns: false,
    ai_chat: false,
    ai_recommendations: false,
    churn_prediction: false,
    no_show_prediction: false,
    dynamic_pricing: false,
    social_media_ai: false,
    meta_ads_ai: false,
    consult_copilot: false,
    rag_knowledge_base: false,
    phone_agent: false,
    schedule_optimizer: false,
    inventory_manager: false,
    pnl_intelligence: false,
    gamification: false,
    api_access: false,
    white_label: false,
    priority_support: false,
    custom_integrations: false,
  };

  if (plan === 'professional') {
    return {
      ...base,
      email_campaigns: true,
      sms_campaigns: true,
      ai_chat: true,
      ai_recommendations: true,
      churn_prediction: true,
      no_show_prediction: true,
      dynamic_pricing: true,
      social_media_ai: true,
      consult_copilot: true,
      schedule_optimizer: true,
      gamification: true,
    };
  }

  if (plan === 'enterprise') {
    return Object.fromEntries(Object.keys(base).map((k) => [k, true]));
  }

  return base;
}

// ─── Setup Wizard ─────────────────────────────────────────────────

export function calculateCompletionPercentage(
  progress: SetupProgress
): number {
  const requiredSteps = progress.steps.filter((s) => s.required);
  const completedRequired = requiredSteps.filter(
    (s) => s.completed || s.skipped
  );
  const allSteps = progress.steps;
  const completedAll = allSteps.filter((s) => s.completed || s.skipped);

  // Weight required steps more heavily
  const requiredWeight = 0.7;
  const optionalWeight = 0.3;

  const requiredPct =
    requiredSteps.length > 0
      ? completedRequired.length / requiredSteps.length
      : 1;

  const optionalPct =
    allSteps.length > requiredSteps.length
      ? (completedAll.length - completedRequired.length) /
        (allSteps.length - requiredSteps.length)
      : 1;

  return Math.round((requiredPct * requiredWeight + optionalPct * optionalWeight) * 100);
}

export function completeSetupStep(
  progress: SetupProgress,
  stepName: SetupStepName,
  data?: Record<string, unknown>
): SetupProgress {
  const updated = { ...progress, steps: [...progress.steps] };
  const stepIdx = updated.steps.findIndex((s) => s.step === stepName);

  if (stepIdx === -1) return progress;

  updated.steps[stepIdx] = {
    ...updated.steps[stepIdx],
    completed: true,
    completedAt: new Date().toISOString(),
    data,
  };

  // Advance current step if this was the current one
  if (stepIdx === updated.currentStep) {
    const nextIncomplete = updated.steps.findIndex(
      (s, i) => i > stepIdx && !s.completed && !s.skipped
    );
    updated.currentStep = nextIncomplete >= 0 ? nextIncomplete : updated.steps.length;
  }

  updated.completionPercentage = calculateCompletionPercentage(updated);
  updated.lastStepAt = new Date().toISOString();

  // Check if all required steps are done
  const allRequiredDone = updated.steps
    .filter((s) => s.required)
    .every((s) => s.completed);

  if (allRequiredDone && !updated.completedAt) {
    updated.completedAt = new Date().toISOString();
  }

  return updated;
}

export function skipSetupStep(
  progress: SetupProgress,
  stepName: SetupStepName
): SetupProgress {
  const step = progress.steps.find((s) => s.step === stepName);
  if (!step || step.required) return progress; // Can't skip required steps

  const updated = { ...progress, steps: [...progress.steps] };
  const stepIdx = updated.steps.findIndex((s) => s.step === stepName);
  updated.steps[stepIdx] = {
    ...updated.steps[stepIdx],
    skipped: true,
  };

  if (stepIdx === updated.currentStep) {
    const nextIncomplete = updated.steps.findIndex(
      (s, i) => i > stepIdx && !s.completed && !s.skipped
    );
    updated.currentStep = nextIncomplete >= 0 ? nextIncomplete : updated.steps.length;
  }

  updated.completionPercentage = calculateCompletionPercentage(updated);
  return updated;
}

export function getCurrentStep(progress: SetupProgress): SetupStepProgress | null {
  if (progress.currentStep >= progress.steps.length) return null;
  return progress.steps[progress.currentStep];
}

export function isSetupComplete(progress: SetupProgress): boolean {
  return progress.steps.filter((s) => s.required).every((s) => s.completed);
}

// ─── Onboarding Nudges ────────────────────────────────────────────

export function checkStalledOnboarding(
  tenant: Tenant
): OnboardingNudge | null {
  if (tenant.status === 'active' || tenant.status === 'cancelled') return null;
  if (isSetupComplete(tenant.setupProgress)) return null;

  const lastActivity = new Date(tenant.lastActivityAt).getTime();
  const now = Date.now();
  const hoursSinceActivity = (now - lastActivity) / (1000 * 60 * 60);

  const currentStep = getCurrentStep(tenant.setupProgress);
  const stepLabel = currentStep?.label ?? 'setup';

  if (hoursSinceActivity >= 168) {
    // 7 days
    return {
      type: 'email',
      trigger: 'stalled_7d',
      subject: `We miss you, ${tenant.ownerName}! Your clinic dashboard is waiting`,
      message: `It looks like you haven't finished setting up ${tenant.clinicName}'s dashboard. You're ${tenant.setupProgress.completionPercentage}% done — just a few more minutes to unlock the full power of RaniOS. Want help? Reply to this email and our team will walk you through it.`,
    };
  }

  if (hoursSinceActivity >= 72) {
    return {
      type: 'email',
      trigger: 'stalled_72h',
      subject: `Quick tip to finish your ${stepLabel} setup`,
      message: `Hi ${tenant.ownerName}, you're ${tenant.setupProgress.completionPercentage}% through setup. The next step — ${stepLabel} — takes just 2 minutes. Here's a quick walkthrough to help you finish.`,
    };
  }

  if (hoursSinceActivity >= 24) {
    return {
      type: 'in_app',
      trigger: 'stalled_24h',
      subject: `Continue where you left off`,
      message: `You left off at "${stepLabel}". Pick up right where you stopped — it only takes a moment.`,
    };
  }

  return null;
}

export function generateCompletionNudge(
  stepName: SetupStepName,
  nextStep: SetupStepProgress | null
): OnboardingNudge {
  if (!nextStep) {
    return {
      type: 'in_app',
      trigger: 'all_complete',
      subject: 'Setup Complete!',
      message:
        'Congratulations! Your clinic dashboard is fully set up and ready to go. Start exploring your AI-powered insights.',
    };
  }

  return {
    type: 'in_app',
    trigger: 'step_complete',
    subject: `Great progress! Next up: ${nextStep.label}`,
    message: `You just completed ${stepName.replace(/_/g, ' ')}. ${nextStep.description} — it only takes a few minutes.`,
  };
}

// ─── Sample Data Generator ────────────────────────────────────────

export interface SampleClient {
  name: string;
  email: string;
  phone: string;
  status: string;
  totalSpent: number;
  visitCount: number;
}

export function generateSampleClients(count: number): SampleClient[] {
  const firstNames = [
    'Sarah', 'Jessica', 'Emily', 'Ashley', 'Samantha',
    'Jennifer', 'Michelle', 'Amanda', 'Nicole', 'Stephanie',
    'Lisa', 'Rachel', 'Lauren', 'Megan', 'Brittany',
    'Olivia', 'Emma', 'Sophia', 'Isabella', 'Ava',
    'Mia', 'Charlotte', 'Amelia', 'Harper', 'Ella',
  ];
  const lastNames = [
    'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia',
    'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Anderson',
    'Taylor', 'Thomas', 'Hernandez', 'Moore', 'Jackson',
    'Martin', 'Lee', 'Thompson', 'White', 'Harris',
    'Clark', 'Lewis', 'Robinson', 'Walker', 'Young',
  ];
  const statuses = ['active', 'active', 'active', 'new', 'lapsed'];

  return Array.from({ length: count }, (_, i) => {
    const first = firstNames[i % firstNames.length];
    const last = lastNames[i % lastNames.length];
    const visitCount = Math.floor(Math.random() * 20) + 1;
    const avgSpend = 200 + Math.floor(Math.random() * 300);

    return {
      name: `${first} ${last}`,
      email: `${first.toLowerCase()}.${last.toLowerCase()}@example.com`,
      phone: `(555) ${String(100 + i).padStart(3, '0')}-${String(1000 + i * 7).slice(-4)}`,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      totalSpent: visitCount * avgSpend,
      visitCount,
    };
  });
}

export function generateSampleAppointments(
  clients: SampleClient[],
  count: number
): { clientName: string; service: string; date: string; status: string }[] {
  const services = [
    'Botox', 'HydraFacial', 'Filler', 'Chemical Peel',
    'Microneedling', 'Laser Hair Removal', 'IPL', 'Consultation',
  ];
  const statuses = ['completed', 'completed', 'completed', 'upcoming', 'cancelled'];

  return Array.from({ length: count }, (_, i) => {
    const client = clients[i % clients.length];
    const daysAgo = Math.floor(Math.random() * 90) - 10; // -10 to 80 days ago
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);

    return {
      clientName: client.name,
      service: services[Math.floor(Math.random() * services.length)],
      date: date.toISOString().split('T')[0],
      status: daysAgo > 0 ? statuses[Math.floor(Math.random() * 3)] : statuses[3],
    };
  });
}

// ─── Guided Tours ─────────────────────────────────────────────────

export const ONBOARDING_TOURS: GuidedTour[] = [
  {
    id: 'welcome_tour',
    name: 'Welcome to RaniOS',
    steps: [
      {
        target: '[data-tour="dashboard"]',
        title: 'Your Command Center',
        content: 'This is your clinic dashboard. Everything you need to run your practice — all in one place.',
        position: 'bottom',
      },
      {
        target: '[data-tour="kpis"]',
        title: 'Real-Time KPIs',
        content: 'See your revenue, bookings, and leads update in real time. No more waiting for end-of-day reports.',
        position: 'bottom',
      },
      {
        target: '[data-tour="ai-insights"]',
        title: 'AI-Powered Insights',
        content: 'Our AI engines analyze your data 24/7 to surface actionable insights — from churn risks to revenue opportunities.',
        position: 'left',
      },
      {
        target: '[data-tour="schedule"]',
        title: 'Smart Scheduling',
        content: 'View today\'s schedule with no-show risk scoring. The AI predicts which appointments might cancel.',
        position: 'right',
      },
      {
        target: '[data-tour="alerts"]',
        title: 'Proactive Alerts',
        content: 'Get notified about important events — low inventory, at-risk clients, revenue anomalies, and more.',
        position: 'top',
      },
    ],
    triggeredAt: new Date().toISOString(),
  },
  {
    id: 'ai_features_tour',
    name: 'AI Features Walkthrough',
    steps: [
      {
        target: '[data-tour="churn"]',
        title: 'Churn Prediction',
        content: 'Our AI identifies clients at risk of leaving 30 days before they churn. Automated reactivation saves them.',
        position: 'bottom',
      },
      {
        target: '[data-tour="recommendations"]',
        title: 'Treatment Recommendations',
        content: 'AI suggests the next best treatment for each client based on their history and goals.',
        position: 'bottom',
      },
      {
        target: '[data-tour="consult"]',
        title: 'Consult Co-Pilot',
        content: 'Get AI-powered talking points, objection handlers, and closing strategies for every consultation.',
        position: 'left',
      },
    ],
    triggeredAt: new Date().toISOString(),
  },
];

export function getTooltipForStep(stepName: SetupStepName): {
  target: string;
  title: string;
  content: string;
} | null {
  const tooltips: Record<string, { target: string; title: string; content: string }> = {
    clinic_info: {
      target: '[data-step="clinic-info"]',
      title: 'Start with the basics',
      content: 'Enter your clinic name, address, and hours. This information powers your client-facing pages.',
    },
    connect_airtable: {
      target: '[data-step="airtable"]',
      title: 'Connect your data',
      content: 'Paste your Airtable Personal Access Token to connect your database. We will set up 12 tables automatically.',
    },
    import_services: {
      target: '[data-step="services"]',
      title: 'Add your treatment menu',
      content: 'Choose from our med spa template or add services manually. You can always edit these later.',
    },
    add_team: {
      target: '[data-step="team"]',
      title: 'Invite your team',
      content: 'Add providers and staff. Each role gets tailored permissions and dashboards.',
    },
    configure_branding: {
      target: '[data-step="branding"]',
      title: 'Make it yours',
      content: 'Set your brand colors and upload your logo. The entire dashboard adapts to your brand.',
    },
    setup_integrations: {
      target: '[data-step="integrations"]',
      title: 'Connect your tools',
      content: 'Hook up Mangomint for booking, Square for payments, or Stripe for online checkout.',
    },
    go_live: {
      target: '[data-step="go-live"]',
      title: 'Ready to launch!',
      content: 'Review your setup and go live. Your AI-powered dashboard starts working immediately.',
    },
  };

  return tooltips[stepName] ?? null;
}

// ─── Airtable Template Provisioning ───────────────────────────────

export const AIRTABLE_TEMPLATE_TABLES = [
  'Clients',
  'Client Intakes',
  'Intake Intelligence',
  'Appointments',
  'Packages',
  'Memberships',
  'Transactions',
  'Messages Log',
  'Reviews',
  'KPI Snapshots',
  'Alerts',
  'Competitor Intelligence',
] as const;

export interface AirtableProvisionResult {
  success: boolean;
  baseId?: string;
  tables: string[];
  error?: string;
}

export function validateAirtablePAT(pat: string): boolean {
  // Airtable PATs start with 'pat' followed by alphanumeric
  return /^pat[a-zA-Z0-9]{14,}/.test(pat);
}

export function validateAirtableBaseId(baseId: string): boolean {
  return /^app[a-zA-Z0-9]{14,}/.test(baseId);
}

// ─── Welcome Email Content ────────────────────────────────────────

export function buildWelcomeEmailContent(tenant: Tenant): {
  subject: string;
  body: string;
} {
  const password = generateTempPassword();
  return {
    subject: `Welcome to RaniOS — Your ${tenant.clinicName} Dashboard is Ready`,
    body: `
Hi ${tenant.ownerName},

Welcome to RaniOS! Your AI-powered clinic management dashboard is ready.

Here are your login credentials:

Dashboard URL: https://${tenant.subdomain}.ranios.com
Email: ${tenant.ownerEmail}
Temporary Password: ${password}

Please change your password after your first login.

Next Steps:
1. Log in and complete the 7-step setup wizard
2. Connect your Airtable base for data storage
3. Import your service menu
4. Invite your team

The setup takes about 10 minutes and unlocks all AI features.

Need help? Reply to this email or book a call:
https://ranios.com/support

Best,
The RaniOS Team
    `.trim(),
  };
}

// ─── Provisioning Pipeline ────────────────────────────────────────

export type ProvisioningStep =
  | 'create_tenant'
  | 'create_airtable_base'
  | 'configure_subdomain'
  | 'create_admin_account'
  | 'load_sample_data'
  | 'send_welcome_email'
  | 'activate_tenant';

export interface ProvisioningStatus {
  tenantId: string;
  steps: {
    step: ProvisioningStep;
    status: 'pending' | 'running' | 'completed' | 'failed';
    startedAt?: string;
    completedAt?: string;
    error?: string;
  }[];
  overallStatus: 'running' | 'completed' | 'failed';
}

export function createProvisioningPipeline(
  tenantId: string
): ProvisioningStatus {
  const steps: ProvisioningStep[] = [
    'create_tenant',
    'create_airtable_base',
    'configure_subdomain',
    'create_admin_account',
    'load_sample_data',
    'send_welcome_email',
    'activate_tenant',
  ];

  return {
    tenantId,
    steps: steps.map((step) => ({
      step,
      status: 'pending',
    })),
    overallStatus: 'running',
  };
}

export function advanceProvisioningStep(
  pipeline: ProvisioningStatus,
  step: ProvisioningStep,
  success: boolean,
  error?: string
): ProvisioningStatus {
  const updated = {
    ...pipeline,
    steps: pipeline.steps.map((s) => {
      if (s.step === step) {
        return {
          ...s,
          status: success ? ('completed' as const) : ('failed' as const),
          completedAt: new Date().toISOString(),
          error,
        };
      }
      return s;
    }),
  };

  // Check overall status
  const hasFailure = updated.steps.some((s) => s.status === 'failed');
  const allDone = updated.steps.every(
    (s) => s.status === 'completed' || s.status === 'failed'
  );

  if (hasFailure) {
    updated.overallStatus = 'failed';
  } else if (allDone) {
    updated.overallStatus = 'completed';
  }

  return updated;
}

export function getNextProvisioningStep(
  pipeline: ProvisioningStatus
): ProvisioningStep | null {
  const next = pipeline.steps.find((s) => s.status === 'pending');
  return next?.step ?? null;
}
