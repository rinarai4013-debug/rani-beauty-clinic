import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import {
  getAllConversations,
  addMessageToConversation,
  markConversationRead,
  getSmartReplies,
  getConversation,
} from '@/lib/communications';
import type { MessageChannel } from '@/types/communications';

// GET /api/dashboard/communications/inbox
export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') as 'active' | 'resolved' | 'escalated' | 'archived' | null;
  const channel = searchParams.get('channel') as MessageChannel | null;
  const search = searchParams.get('search') ?? undefined;
  const unreadOnly = searchParams.get('unread') === 'true';

  try {
    const conversations = getAllConversations({
      status: status ?? undefined,
      channel: channel ?? undefined,
      search,
      unreadOnly,
    });

    // Build smart replies for each conversation
    const smartReplies: Record<string, ReturnType<typeof getSmartReplies>> = {};
    for (const conv of conversations.slice(0, 20)) {
      smartReplies[conv.id] = getSmartReplies(conv);
    }

    return NextResponse.json({
      success: true,
      conversations,
      smartReplies,
    });
  } catch (err) {
    console.error('[Inbox GET]', err);
    return NextResponse.json({ error: 'Failed to load inbox' }, { status: 500 });
  }
}

// POST /api/dashboard/communications/inbox - Reply, mark read, etc.
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action, conversationId } = body;

    if (action === 'reply') {
      const message = addMessageToConversation(conversationId, {
        body: body.body,
        direction: 'outbound',
      });
      if (!message) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, message });
    }

    if (action === 'markRead') {
      markConversationRead(conversationId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    console.error('[Inbox POST]', err);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
