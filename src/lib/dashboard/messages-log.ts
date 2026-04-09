export interface MessagesLogFields {
  Type?: string;
  Direction?: string;
  Status?: string;
  Message?: string;
  Subject?: string;
  Date?: string;
  'Client Name'?: string;
  'Client Email'?: string;
  'Client Phone'?: string;
}

export interface InboxConversation {
  id: string;
  clientName: string;
  clientEmail: string | null;
  clientPhone: string | null;
  channel: string;
  status: string;
  unreadCount: number;
  lastMessage: string;
  lastMessageAt: string;
  messages: Array<{
    id: string;
    channel: string;
    direction: string;
    status: string;
    body: string;
    subject?: string;
    sentAt: string;
  }>;
}

export function buildInboxConversations(
  records: Array<{ id: string; fields: MessagesLogFields }>
): InboxConversation[] {
  const conversations = new Map<string, InboxConversation>();

  for (const record of records) {
    const email = record.fields['Client Email'] || null;
    const phone = record.fields['Client Phone'] || null;
    const key = email || phone || record.id;
    const status = record.fields.Status || 'Queued';
    const direction = record.fields.Direction || 'Outbound';
    const channel = (record.fields.Type || 'email').toLowerCase();
    const message = {
      id: record.id,
      channel,
      direction,
      status,
      body: record.fields.Message || '',
      subject: record.fields.Subject,
      sentAt: record.fields.Date || '',
    };

    const existing = conversations.get(key);
    if (existing) {
      existing.messages.push(message);
      if ((record.fields.Date || '') >= existing.lastMessageAt) {
        existing.lastMessage = message.body;
        existing.lastMessageAt = message.sentAt;
        existing.status = status;
        existing.channel = channel;
      }
      if (direction.toLowerCase() === 'inbound' && status.toLowerCase() !== 'read') {
        existing.unreadCount += 1;
      }
      continue;
    }

    conversations.set(key, {
      id: key,
      clientName: record.fields['Client Name'] || 'Unknown',
      clientEmail: email,
      clientPhone: phone,
      channel,
      status,
      unreadCount: direction.toLowerCase() === 'inbound' && status.toLowerCase() !== 'read' ? 1 : 0,
      lastMessage: message.body,
      lastMessageAt: message.sentAt,
      messages: [message],
    });
  }

  return Array.from(conversations.values())
    .map((conversation) => ({
      ...conversation,
      messages: conversation.messages.sort((left, right) => left.sentAt.localeCompare(right.sentAt)),
    }))
    .sort((left, right) => right.lastMessageAt.localeCompare(left.lastMessageAt));
}
