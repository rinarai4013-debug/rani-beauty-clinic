import { NextRequest, NextResponse } from 'next/server';
import {
  sendNotification, sendFromTemplate, getNotifications,
  markAsRead, markAllAsRead, dismissNotification,
  getPreferences, updatePreferences,
  getAllTemplates, getTemplatesByCategory,
  initializeTemplates, SendNotificationSchema,
} from '@/lib/saas/notifications/system';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'list';
  const tenantId = searchParams.get('tenantId') || '';

  initializeTemplates();

  switch (action) {
    case 'list': {
      const userId = searchParams.get('userId') || undefined;
      const category = searchParams.get('category') as never;
      const read = searchParams.get('read') !== null ? searchParams.get('read') === 'true' : undefined;
      return NextResponse.json(getNotifications(tenantId, { userId, category, read }));
    }
    case 'unread': {
      const data = getNotifications(tenantId, { read: false });
      return NextResponse.json({ unreadCount: data.unreadCount });
    }
    case 'preferences': {
      const userId = searchParams.get('userId') || 'default';
      return NextResponse.json(getPreferences(tenantId, userId));
    }
    case 'templates': {
      const category = searchParams.get('category') as never;
      if (category) return NextResponse.json({ templates: getTemplatesByCategory(category) });
      return NextResponse.json({ templates: getAllTemplates() });
    }
    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action || 'send';

    initializeTemplates();

    switch (action) {
      case 'send': {
        const parsed = SendNotificationSchema.safeParse(body);
        if (!parsed.success) {
          return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
        }
        const notifications = sendNotification(parsed.data);
        return NextResponse.json({ sent: notifications.length, notifications }, { status: 201 });
      }
      case 'send_template': {
        const notifications = sendFromTemplate(body.templateName, body.tenantId, body.variables, body.userId);
        return NextResponse.json({ sent: notifications.length, notifications }, { status: 201 });
      }
      case 'mark_read': {
        const success = markAsRead(body.notificationId);
        return NextResponse.json({ success });
      }
      case 'mark_all_read': {
        const count = markAllAsRead(body.tenantId, body.userId);
        return NextResponse.json({ marked: count });
      }
      case 'dismiss': {
        const success = dismissNotification(body.notificationId);
        return NextResponse.json({ success });
      }
      case 'update_preferences': {
        const prefs = updatePreferences(body.tenantId, body.userId, body.preferences);
        return NextResponse.json(prefs);
      }
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
