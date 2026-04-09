import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { Tables, fetchAll } from '@/lib/airtable/client';
import { cache, TTL } from '@/lib/cache';
import { buildInboxConversations, type MessagesLogFields } from '@/lib/dashboard/messages-log';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!hasPermission(session.role, 'view_leads')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const channel = searchParams.get('channel');
  const search = (searchParams.get('search') || '').toLowerCase();
  const cacheKey = `communications-inbox:${status || 'all'}:${channel || 'all'}:${search || 'none'}`;
  const cached = cache.get(cacheKey);
  if (cached) return NextResponse.json(cached);

  try {
    const records = await fetchAll<MessagesLogFields>(
      Tables.messagesLog(),
      { sort: [{ field: 'Date', direction: 'desc' }] },
      true
    );

    let conversations = buildInboxConversations(records);
    if (status) {
      conversations = conversations.filter((conversation) => conversation.status.toLowerCase() === status.toLowerCase());
    }
    if (channel) {
      conversations = conversations.filter((conversation) => conversation.channel === channel.toLowerCase());
    }
    if (search) {
      conversations = conversations.filter((conversation) =>
        conversation.clientName.toLowerCase().includes(search) ||
        (conversation.clientEmail || '').toLowerCase().includes(search) ||
        conversation.lastMessage.toLowerCase().includes(search)
      );
    }

    const payload = {
      success: true,
      data: {
        total: conversations.length,
        unread: conversations.filter((conversation) => conversation.unreadCount > 0).length,
        urgent: conversations.filter((conversation) => conversation.status.toLowerCase() === 'failed').length,
        channels: [
          { channel: 'sms', count: conversations.filter((conversation) => conversation.channel === 'sms').length },
          { channel: 'email', count: conversations.filter((conversation) => conversation.channel === 'email').length },
        ],
        conversations,
      },
    };

    cache.set(cacheKey, payload, TTL.STANDARD);
    return NextResponse.json(payload);
  } catch (error) {
    console.error('[dashboard/communications/inbox]', error);
    return NextResponse.json({ error: 'Failed to load inbox' }, { status: 500 });
  }
}
