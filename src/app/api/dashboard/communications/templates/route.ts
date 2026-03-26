import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import type { MessageTemplate, TemplateCategory } from '@/types/communications';

// In-memory template store (production: Airtable)
const templates = new Map<string, MessageTemplate>();

// Seed default templates
const DEFAULT_TEMPLATES: Omit<MessageTemplate, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Appointment Reminder',
    category: 'appointment_reminder',
    channel: 'sms',
    body: 'Hi {{clientName}}, this is a reminder about your {{serviceName}} appointment tomorrow at {{appointmentTime}} with {{providerName}} at Rani Beauty Clinic. Reply CONFIRM to confirm or call (425) 999-8888 to reschedule.',
    variables: ['clientName', 'serviceName', 'appointmentTime', 'providerName'],
    isActive: true,
    usageCount: 342,
  },
  {
    name: 'Post-Treatment Follow-Up',
    category: 'post_treatment',
    channel: 'both',
    subject: 'How are you feeling after your {{serviceName}}?',
    body: 'Hi {{clientName}},\n\nWe hope you are enjoying the results of your {{serviceName}} treatment! If you have any questions about aftercare, please do not hesitate to reach out.\n\nFor aftercare instructions, visit: ranibeautyclinic.com/aftercare\n\nWarm regards,\nRani Beauty Clinic\n401 Olympia Ave NE #101, Renton, WA 98056\nTo unsubscribe, reply STOP',
    variables: ['clientName', 'serviceName'],
    isActive: true,
    usageCount: 156,
  },
  {
    name: 'Welcome New Client',
    category: 'welcome',
    channel: 'email',
    subject: 'Welcome to Rani Beauty Clinic, {{clientName}}!',
    body: 'Dear {{clientName}},\n\nWelcome to Rani Beauty Clinic! We are thrilled to have you join our family of clients who trust us with their aesthetic goals.\n\nAs a luxury medical aesthetics clinic, we specialize in advanced injection treatments, skin rejuvenation, and wellness solutions tailored to your unique needs.\n\nYour transformation journey starts here.\n\nWarm regards,\nThe Rani Beauty Clinic Team\n401 Olympia Ave NE #101, Renton, WA 98056\nTo unsubscribe, reply STOP',
    variables: ['clientName'],
    isActive: true,
    usageCount: 89,
  },
  {
    name: 'Review Request',
    category: 'review_request',
    channel: 'sms',
    body: 'Hi {{clientName}}, thank you for visiting Rani Beauty Clinic! We would love to hear about your experience. Would you mind leaving us a quick review? {{reviewLink}}',
    variables: ['clientName', 'reviewLink'],
    isActive: true,
    usageCount: 201,
  },
  {
    name: 'Birthday Greeting',
    category: 'birthday',
    channel: 'both',
    subject: 'Happy Birthday, {{clientName}}! A Special Gift Awaits',
    body: 'Happy Birthday, {{clientName}}!\n\nFrom all of us at Rani Beauty Clinic, we wish you a wonderful birthday. As our gift to you, enjoy a complimentary add-on with your next treatment.\n\nBook your birthday appointment: ranibeautyclinic.com\n\nCelebrate beautifully,\nRani Beauty Clinic\n401 Olympia Ave NE #101, Renton, WA 98056\nTo unsubscribe, reply STOP',
    variables: ['clientName'],
    isActive: true,
    usageCount: 67,
  },
  {
    name: 'Reactivation (30 Days)',
    category: 'reactivation',
    channel: 'sms',
    body: 'Hi {{clientName}}, we have missed you at Rani Beauty Clinic! It has been a while since your last visit. We would love to see you again and help you continue your transformation journey. Book online or call (425) 999-8888.',
    variables: ['clientName'],
    isActive: true,
    usageCount: 134,
  },
  {
    name: 'Membership Renewal Reminder',
    category: 'membership',
    channel: 'email',
    subject: 'Your Rani Beauty Clinic Membership - Renew Today',
    body: 'Hi {{clientName}},\n\nYour membership at Rani Beauty Clinic is coming up for renewal. As a valued member, you enjoy exclusive benefits and priority booking.\n\nRenew today to maintain your member perks.\n\nRani Beauty Clinic\n401 Olympia Ave NE #101, Renton, WA 98056\nTo unsubscribe, reply STOP',
    variables: ['clientName'],
    isActive: true,
    usageCount: 45,
  },
  {
    name: 'Booking Confirmation',
    category: 'booking_confirmation',
    channel: 'sms',
    body: 'Your {{serviceName}} appointment at Rani Beauty Clinic is confirmed for {{appointmentDate}} at {{appointmentTime}} with {{providerName}}. See you soon! Reply STOP to unsubscribe.',
    variables: ['serviceName', 'appointmentDate', 'appointmentTime', 'providerName'],
    isActive: true,
    usageCount: 523,
  },
];

// Initialize default templates
function ensureDefaults() {
  if (templates.size === 0) {
    const now = new Date().toISOString();
    for (let i = 0; i < DEFAULT_TEMPLATES.length; i++) {
      const t = DEFAULT_TEMPLATES[i];
      const id = `tmpl_default_${i + 1}`;
      templates.set(id, { ...t, id, createdAt: now, updatedAt: now });
    }
  }
}

// GET /api/dashboard/communications/templates
export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  ensureDefaults();

  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') as TemplateCategory | null;

  let result = Array.from(templates.values());
  if (category) {
    result = result.filter(t => t.category === category);
  }

  return NextResponse.json({
    success: true,
    templates: result.sort((a, b) => b.usageCount - a.usageCount),
  });
}

// POST /api/dashboard/communications/templates
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  ensureDefaults();

  try {
    const body = await request.json();

    // Duplicate
    if (body.action === 'duplicate' && body.templateId) {
      const original = templates.get(body.templateId);
      if (!original) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 });
      }
      const now = new Date().toISOString();
      const id = `tmpl_${Date.now()}`;
      const duplicate: MessageTemplate = {
        ...original,
        id,
        name: `${original.name} (Copy)`,
        usageCount: 0,
        createdAt: now,
        updatedAt: now,
      };
      templates.set(id, duplicate);
      return NextResponse.json({ success: true, template: duplicate }, { status: 201 });
    }

    // Create new
    const now = new Date().toISOString();
    const id = `tmpl_${Date.now()}`;
    const template: MessageTemplate = {
      id,
      name: body.name,
      category: body.category,
      channel: body.channel,
      subject: body.subject,
      body: body.body,
      variables: body.variables ?? [],
      previewText: body.previewText,
      isActive: body.isActive ?? true,
      usageCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    templates.set(id, template);

    return NextResponse.json({ success: true, template }, { status: 201 });
  } catch (err) {
    console.error('[Templates POST]', err);
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
  }
}
