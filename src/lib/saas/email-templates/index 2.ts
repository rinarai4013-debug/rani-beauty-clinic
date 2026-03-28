/**
 * RaniOS Email Templates
 *
 * Complete automated email sequence for the sales funnel,
 * onboarding nudges, dunning, and customer success.
 */

// ─── Types ────────────────────────────────────────────────────────

export interface EmailTemplate {
  id: string;
  subject: string;
  preheader: string;
  body: string;
  ctaText: string;
  ctaUrl: string;
  category: 'funnel' | 'onboarding' | 'billing' | 'success' | 'transactional';
}

export interface EmailVariables {
  name: string;
  email: string;
  clinicName: string;
  providerCount?: number;
  currentSoftware?: string;
  subdomain?: string;
  password?: string;
  planName?: string;
  amount?: string;
  feature?: string;
  featureBenefit?: string;
  healthScore?: number;
  milestoneText?: string;
  roiSavings?: string;
  daysLeft?: number;
  invoiceUrl?: string;
  loginUrl?: string;
}

// ─── Template Renderer ────────────────────────────────────────────

export function renderTemplate(
  template: string,
  vars: EmailVariables
): string {
  let rendered = template;
  for (const [key, value] of Object.entries(vars)) {
    if (value !== undefined) {
      rendered = rendered.replace(
        new RegExp(`\\{\\{${key}\\}\\}`, 'g'),
        String(value)
      );
    }
  }
  return rendered;
}

function wrapInLayout(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8f6f1; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .card { background: #ffffff; border-radius: 16px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .logo { text-align: center; margin-bottom: 24px; }
    .logo-mark { display: inline-block; width: 40px; height: 40px; background: #0F1D2C; border-radius: 10px; line-height: 40px; text-align: center; color: #F3D6BE; font-weight: bold; font-size: 16px; }
    h1 { color: #0F1D2C; font-size: 22px; margin: 0 0 12px; }
    p { color: #555; font-size: 15px; line-height: 1.6; margin: 0 0 16px; }
    .cta { display: inline-block; padding: 14px 28px; background: #0F1D2C; color: #F3D6BE !important; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 14px; margin: 8px 0 16px; }
    .footer { text-align: center; padding-top: 24px; color: #999; font-size: 12px; }
    .divider { border: none; border-top: 1px solid #eee; margin: 24px 0; }
    .highlight { background: #f0f7ff; border-radius: 8px; padding: 16px; margin: 16px 0; }
    .metric { font-size: 32px; font-weight: bold; color: #0F1D2C; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo"><span class="logo-mark">R</span></div>
      ${content}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} RaniOS | AI-Powered Clinic Management</p>
      <p><a href="{{unsubscribeUrl}}" style="color: #999;">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>`.trim();
}

// ─── Funnel Email Sequence ────────────────────────────────────────

export const FUNNEL_EMAILS: Record<string, EmailTemplate> = {
  welcome: {
    id: 'funnel_welcome',
    subject: 'Welcome to RaniOS, {{name}}',
    preheader: 'Your clinic automation journey starts now',
    body: wrapInLayout(`
      <h1>Welcome to the Future of Clinic Management</h1>
      <p>Hi {{name}},</p>
      <p>Thank you for your interest in RaniOS! You have taken the first step toward automating {{clinicName}}'s operations with AI.</p>
      <p>Here is what happens next:</p>
      <div class="highlight">
        <p style="margin:0"><strong>1.</strong> Watch our 2-minute demo video<br>
        <strong>2.</strong> Explore the interactive sandbox<br>
        <strong>3.</strong> Book a personalized walkthrough</p>
      </div>
      <p><a href="https://ranios.com/marketing/demo" class="cta">Watch Demo Video</a></p>
      <p>In the meantime, I will be sharing some insights about how clinics like yours are using AI to grow revenue and save time.</p>
      <p>Best,<br>The RaniOS Team</p>
    `),
    ctaText: 'Watch Demo Video',
    ctaUrl: 'https://ranios.com/marketing/demo',
    category: 'funnel',
  },

  case_study: {
    id: 'funnel_case_study',
    subject: 'How Rani Beauty Clinic saved 20+ hours/week',
    preheader: 'Real results from a clinic just like yours',
    body: wrapInLayout(`
      <h1>From Manual to Automated in 90 Days</h1>
      <p>Hi {{name}},</p>
      <p>Yesterday I shared how RaniOS works. Today, I want to show you <strong>real results</strong> from a clinic that made the switch.</p>
      <div class="highlight">
        <p class="metric">+73%</p>
        <p style="margin:0"><strong>Revenue growth</strong> in 3 months</p>
      </div>
      <p>Rani Beauty Clinic, a luxury medspa in Renton, WA, went from manual operations to a fully AI-automated clinic:</p>
      <p>&bull; No-show rate dropped from 14% to 4%<br>
      &bull; Client retention improved 44%<br>
      &bull; 22 hours/week freed from manual tasks<br>
      &bull; Lead response time cut from 4 hours to 2 minutes</p>
      <p><a href="https://ranios.com/marketing/case-study" class="cta">Read the Full Case Study</a></p>
      <p>Could your clinic see similar results? Tomorrow I will share the specific feature that made the biggest impact for clinics with {{providerCount}} providers.</p>
    `),
    ctaText: 'Read the Full Case Study',
    ctaUrl: 'https://ranios.com/marketing/case-study',
    category: 'funnel',
  },

  feature_highlight: {
    id: 'funnel_feature_highlight',
    subject: 'The #1 feature clinics like {{clinicName}} love',
    preheader: '{{feature}} could transform how you operate',
    body: wrapInLayout(`
      <h1>{{feature}}</h1>
      <p>Hi {{name}},</p>
      <p>Based on what you shared about {{clinicName}}, I think you would love this feature:</p>
      <div class="highlight">
        <p style="margin:0"><strong>{{feature}}</strong></p>
        <p style="margin:8px 0 0">{{featureBenefit}}</p>
      </div>
      <p>This is one of 12 AI engines built into every RaniOS dashboard. Clinics using it report significant improvements within the first month.</p>
      <p><a href="https://ranios.com/marketing/demo" class="cta">Try It in the Sandbox</a></p>
      <p>In two days, I will share your personalized ROI projection based on {{clinicName}}'s size and current setup.</p>
    `),
    ctaText: 'Try It in the Sandbox',
    ctaUrl: 'https://ranios.com/marketing/demo',
    category: 'funnel',
  },

  roi_calculator: {
    id: 'funnel_roi',
    subject: '{{clinicName}}: Your projected ROI with RaniOS',
    preheader: 'We ran the numbers for a clinic your size',
    body: wrapInLayout(`
      <h1>Your Personalized ROI Projection</h1>
      <p>Hi {{name}},</p>
      <p>We ran the numbers for a clinic with {{providerCount}} providers currently using {{currentSoftware}}. Here is what RaniOS could save {{clinicName}}:</p>
      <div class="highlight" style="text-align: center;">
        <p class="metric">{{roiSavings}}</p>
        <p style="margin:0"><strong>Projected annual savings</strong></p>
      </div>
      <p>This includes labor savings, recovered revenue from reduced no-shows, and marketing optimization.</p>
      <p><a href="https://ranios.com/marketing/roi" class="cta">See Full ROI Breakdown</a></p>
      <p>Want to validate these numbers? Start a free trial and see the impact firsthand — no credit card required.</p>
    `),
    ctaText: 'See Full ROI Breakdown',
    ctaUrl: 'https://ranios.com/marketing/roi',
    category: 'funnel',
  },

  free_trial: {
    id: 'funnel_trial',
    subject: 'Try RaniOS free for 14 days — no card required',
    preheader: 'Full access to every feature, starting now',
    body: wrapInLayout(`
      <h1>Your Free Trial Awaits</h1>
      <p>Hi {{name}},</p>
      <p>Over the past week, you have seen what RaniOS can do:</p>
      <p>&bull; A real case study with 73% revenue growth<br>
      &bull; The AI features most relevant to {{clinicName}}<br>
      &bull; Your personalized ROI projection</p>
      <p>Now it is time to experience it firsthand.</p>
      <div class="highlight" style="text-align: center;">
        <p style="margin:0;font-size:18px;font-weight:bold;color:#0F1D2C">14-Day Free Trial</p>
        <p style="margin:4px 0 0;color:#666">No credit card required. Cancel anytime.</p>
      </div>
      <p><a href="https://ranios.com/marketing#lead-form" class="cta">Start Free Trial</a></p>
      <p>Setup takes about 10 minutes. We will pre-load your dashboard with sample data so you can see the "aha" moment immediately.</p>
    `),
    ctaText: 'Start Free Trial',
    ctaUrl: 'https://ranios.com/marketing#lead-form',
    category: 'funnel',
  },

  personal_check_in: {
    id: 'funnel_checkin',
    subject: 'Quick question about {{clinicName}}',
    preheader: 'I wanted to check in personally',
    body: wrapInLayout(`
      <h1>How Can I Help?</h1>
      <p>Hi {{name}},</p>
      <p>I wanted to personally check in. I noticed you have been exploring RaniOS for {{clinicName}} — is there anything I can help with?</p>
      <p>Common questions I get:</p>
      <p>&bull; "Will it work with my current booking software?"<br>
      &bull; "How long does setup actually take?"<br>
      &bull; "Can I see it working with my real data?"</p>
      <p>Just hit reply — I read every message and will get back to you within a few hours.</p>
      <p>If you would prefer a live walkthrough, I would be happy to schedule a 15-minute call:</p>
      <p><a href="https://ranios.com/marketing/demo" class="cta">Book a Quick Call</a></p>
      <p>Talk soon,<br>The RaniOS Team</p>
    `),
    ctaText: 'Book a Quick Call',
    ctaUrl: 'https://ranios.com/marketing/demo',
    category: 'funnel',
  },

  final_offer: {
    id: 'funnel_final',
    subject: 'Founding member pricing expires Friday',
    preheader: '50% off your first 3 months — last chance',
    body: wrapInLayout(`
      <h1>Last Chance: Founding Member Pricing</h1>
      <p>Hi {{name}},</p>
      <p>Two weeks ago you started exploring RaniOS for {{clinicName}}. I hope the case study, feature highlights, and ROI calculator gave you a clear picture of the value.</p>
      <p>I have one more thing to share: <strong>founding member pricing</strong>.</p>
      <div class="highlight" style="text-align: center;">
        <p style="margin:0;font-size:18px;font-weight:bold;color:#0F1D2C">50% Off First 3 Months</p>
        <p style="margin:4px 0 0;color:#666">Use code: <strong>FOUNDING50</strong></p>
        <p style="margin:8px 0 0;color:#cc0000;font-weight:bold">Expires this Friday</p>
      </div>
      <p>This pricing is only available to the first 100 clinics. After Friday, it goes away for good.</p>
      <p><a href="https://ranios.com/marketing#lead-form" class="cta">Claim Founding Member Pricing</a></p>
      <p>Questions? Just hit reply. I am here to help.</p>
    `),
    ctaText: 'Claim Founding Member Pricing',
    ctaUrl: 'https://ranios.com/marketing#lead-form',
    category: 'funnel',
  },
};

// ─── Onboarding Emails ────────────────────────────────────────────

export const ONBOARDING_EMAILS: Record<string, EmailTemplate> = {
  welcome_credentials: {
    id: 'onboarding_welcome',
    subject: 'Your RaniOS dashboard is ready, {{name}}!',
    preheader: 'Login credentials inside',
    body: wrapInLayout(`
      <h1>Your Dashboard is Live!</h1>
      <p>Hi {{name}},</p>
      <p>Congratulations! Your {{clinicName}} dashboard is provisioned and ready to go.</p>
      <div class="highlight">
        <p style="margin:0"><strong>Dashboard URL:</strong> https://{{subdomain}}.ranios.com</p>
        <p style="margin:4px 0 0"><strong>Email:</strong> {{email}}</p>
        <p style="margin:4px 0 0"><strong>Temporary Password:</strong> {{password}}</p>
      </div>
      <p>Please change your password after your first login.</p>
      <p><a href="https://{{subdomain}}.ranios.com" class="cta">Log In Now</a></p>
      <p>The setup wizard will guide you through 7 easy steps. Most clinics finish in under 10 minutes.</p>
    `),
    ctaText: 'Log In Now',
    ctaUrl: 'https://{{subdomain}}.ranios.com',
    category: 'onboarding',
  },

  stalled_24h: {
    id: 'onboarding_stalled_24h',
    subject: 'Continue setting up {{clinicName}}',
    preheader: 'Pick up where you left off',
    body: wrapInLayout(`
      <h1>Continue Your Setup</h1>
      <p>Hi {{name}},</p>
      <p>You started setting up {{clinicName}}'s dashboard — just a few more steps to go!</p>
      <p><a href="{{loginUrl}}" class="cta">Continue Setup</a></p>
      <p>Need help? Reply to this email and our team will assist you.</p>
    `),
    ctaText: 'Continue Setup',
    ctaUrl: '{{loginUrl}}',
    category: 'onboarding',
  },

  stalled_72h: {
    id: 'onboarding_stalled_72h',
    subject: 'Quick tip to finish your setup',
    preheader: 'Just a few minutes to unlock all features',
    body: wrapInLayout(`
      <h1>Almost There!</h1>
      <p>Hi {{name}},</p>
      <p>Your {{clinicName}} dashboard is waiting for you. Here is a quick walkthrough of your next step to help you finish in under 5 minutes.</p>
      <p><a href="{{loginUrl}}" class="cta">Finish Setup</a></p>
      <p>Or if you would prefer a guided walkthrough, book a free 15-minute setup call with our team.</p>
    `),
    ctaText: 'Finish Setup',
    ctaUrl: '{{loginUrl}}',
    category: 'onboarding',
  },

  setup_complete: {
    id: 'onboarding_complete',
    subject: 'Setup complete! {{clinicName}} is live',
    preheader: 'Your AI-powered dashboard is ready',
    body: wrapInLayout(`
      <h1>You Are All Set!</h1>
      <p>Hi {{name}},</p>
      <p>Congratulations! {{clinicName}}'s RaniOS dashboard is fully configured and live.</p>
      <p>Here is what is working for you right now:</p>
      <p>&bull; Real-time KPIs updating every 30 seconds<br>
      &bull; AI monitoring your client retention<br>
      &bull; Automated follow-up sequences ready to trigger<br>
      &bull; Schedule optimization running in the background</p>
      <p><a href="{{loginUrl}}" class="cta">Open Dashboard</a></p>
      <p>In 7 days, I will check in with your first week's results. Exciting times ahead!</p>
    `),
    ctaText: 'Open Dashboard',
    ctaUrl: '{{loginUrl}}',
    category: 'onboarding',
  },
};

// ─── Billing Emails ───────────────────────────────────────────────

export const BILLING_EMAILS: Record<string, EmailTemplate> = {
  payment_failed: {
    id: 'billing_payment_failed',
    subject: 'Action required: Payment failed for RaniOS',
    preheader: 'Please update your payment method',
    body: wrapInLayout(`
      <h1>Payment Could Not Be Processed</h1>
      <p>Hi {{name}},</p>
      <p>Your recent payment of {{amount}} for {{clinicName}}'s {{planName}} plan could not be processed.</p>
      <p>Please update your payment method to avoid any interruption to your service.</p>
      <p><a href="https://ranios.com/billing" class="cta">Update Payment Method</a></p>
      <p>If you believe this is an error, please reply to this email.</p>
    `),
    ctaText: 'Update Payment Method',
    ctaUrl: 'https://ranios.com/billing',
    category: 'billing',
  },

  suspension_warning: {
    id: 'billing_suspension_warning',
    subject: 'Account suspension warning: RaniOS',
    preheader: 'Update your payment to keep access',
    body: wrapInLayout(`
      <h1>Account Suspension in {{daysLeft}} Days</h1>
      <p>Hi {{name}},</p>
      <p>Your RaniOS account for {{clinicName}} will be suspended in {{daysLeft}} days due to non-payment.</p>
      <p>To keep your dashboard, AI features, and all data accessible, please update your payment method now.</p>
      <p><a href="https://ranios.com/billing" class="cta">Update Payment Now</a></p>
    `),
    ctaText: 'Update Payment Now',
    ctaUrl: 'https://ranios.com/billing',
    category: 'billing',
  },

  invoice_paid: {
    id: 'billing_invoice_paid',
    subject: 'Payment received — thank you!',
    preheader: 'Your RaniOS invoice has been paid',
    body: wrapInLayout(`
      <h1>Payment Confirmed</h1>
      <p>Hi {{name}},</p>
      <p>We have received your payment of {{amount}} for {{clinicName}}'s {{planName}} plan.</p>
      <p><a href="{{invoiceUrl}}" class="cta">View Invoice</a></p>
      <p>Thank you for being a RaniOS customer!</p>
    `),
    ctaText: 'View Invoice',
    ctaUrl: '{{invoiceUrl}}',
    category: 'billing',
  },
};

// ─── Customer Success Emails ──────────────────────────────────────

export const SUCCESS_EMAILS: Record<string, EmailTemplate> = {
  milestone: {
    id: 'success_milestone',
    subject: 'Milestone unlocked: {{milestoneText}}!',
    preheader: 'Congratulations on your achievement',
    body: wrapInLayout(`
      <h1>{{milestoneText}}</h1>
      <p>Hi {{name}},</p>
      <p>Congratulations! {{clinicName}} just hit a major milestone on RaniOS.</p>
      <div class="highlight" style="text-align: center;">
        <p style="margin:0;font-size:24px">&#127881;</p>
        <p style="margin:8px 0 0;font-weight:bold;color:#0F1D2C">{{milestoneText}}</p>
      </div>
      <p>Keep up the amazing work! Your clinic is growing stronger every day.</p>
      <p><a href="{{loginUrl}}" class="cta">View Dashboard</a></p>
    `),
    ctaText: 'View Dashboard',
    ctaUrl: '{{loginUrl}}',
    category: 'success',
  },

  feature_nudge: {
    id: 'success_feature_nudge',
    subject: 'You haven\'t tried {{feature}} yet!',
    preheader: '{{featureBenefit}}',
    body: wrapInLayout(`
      <h1>Unlock More Value with {{feature}}</h1>
      <p>Hi {{name}},</p>
      <p>Did you know {{clinicName}}'s plan includes <strong>{{feature}}</strong>? It is ready to use but has not been activated yet.</p>
      <div class="highlight">
        <p style="margin:0"><strong>Why activate it?</strong></p>
        <p style="margin:8px 0 0">{{featureBenefit}}</p>
      </div>
      <p><a href="{{loginUrl}}" class="cta">Activate {{feature}}</a></p>
    `),
    ctaText: 'Activate Feature',
    ctaUrl: '{{loginUrl}}',
    category: 'success',
  },

  nps_survey: {
    id: 'success_nps',
    subject: 'Quick question: How likely are you to recommend RaniOS?',
    preheader: 'Takes 30 seconds',
    body: wrapInLayout(`
      <h1>How Are We Doing?</h1>
      <p>Hi {{name}},</p>
      <p>You have been using RaniOS for {{clinicName}} and we would love your feedback. One quick question:</p>
      <p style="font-weight:bold;color:#0F1D2C">How likely are you to recommend RaniOS to a fellow medspa owner?</p>
      <div style="text-align:center;margin:16px 0">
        <p>0 (Not likely) &mdash;&mdash; 10 (Extremely likely)</p>
      </div>
      <p><a href="https://ranios.com/nps" class="cta">Take 30-Second Survey</a></p>
      <p>Your feedback directly shapes what we build next. Thank you!</p>
    `),
    ctaText: 'Take 30-Second Survey',
    ctaUrl: 'https://ranios.com/nps',
    category: 'success',
  },

  churn_save: {
    id: 'success_save',
    subject: 'We miss you, {{name}} — let us make it right',
    preheader: 'Special offer inside',
    body: wrapInLayout(`
      <h1>We Want to Keep You</h1>
      <p>Hi {{name}},</p>
      <p>We noticed {{clinicName}} has not been as active on RaniOS recently. We want to make sure the platform is delivering value for your practice.</p>
      <p>As a thank you for being an early customer, we would like to offer:</p>
      <div class="highlight" style="text-align:center;">
        <p style="margin:0;font-size:18px;font-weight:bold;color:#0F1D2C">Your Next Month is On Us</p>
        <p style="margin:8px 0 0;color:#666">No strings attached.</p>
      </div>
      <p>Or if something specific is not working, I would love to hop on a call and fix it together.</p>
      <p><a href="https://ranios.com/marketing/demo" class="cta">Book a Call With Me</a></p>
      <p>Either way, we are here for {{clinicName}}.</p>
    `),
    ctaText: 'Book a Call With Me',
    ctaUrl: 'https://ranios.com/marketing/demo',
    category: 'success',
  },

  referral_invite: {
    id: 'success_referral',
    subject: 'Know another medspa? Earn a free month',
    preheader: 'Refer a clinic and get 1 month free',
    body: wrapInLayout(`
      <h1>Share the Love, Get Rewarded</h1>
      <p>Hi {{name}},</p>
      <p>You have been rocking it with RaniOS at {{clinicName}}! Know another medspa that could benefit?</p>
      <div class="highlight" style="text-align:center;">
        <p style="margin:0;font-size:18px;font-weight:bold;color:#0F1D2C">Refer a Clinic, Get 1 Month Free</p>
        <p style="margin:8px 0 0;color:#666">For every clinic that signs up, you both get a free month.</p>
      </div>
      <p><a href="{{loginUrl}}" class="cta">Get Your Referral Link</a></p>
    `),
    ctaText: 'Get Your Referral Link',
    ctaUrl: '{{loginUrl}}',
    category: 'success',
  },
};

// ─── Export all templates ─────────────────────────────────────────

export const ALL_TEMPLATES = {
  ...FUNNEL_EMAILS,
  ...ONBOARDING_EMAILS,
  ...BILLING_EMAILS,
  ...SUCCESS_EMAILS,
};

export function getTemplate(id: string): EmailTemplate | undefined {
  return Object.values(ALL_TEMPLATES).find((t) => t.id === id);
}

export function getTemplatesByCategory(
  category: EmailTemplate['category']
): EmailTemplate[] {
  return Object.values(ALL_TEMPLATES).filter((t) => t.category === category);
}
