'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Inbox, Plus, RefreshCw } from 'lucide-react';
import { InboxView, ComposeMessage } from '@/components/dashboard/communications';
import { DashboardErrorBoundary, InlineError } from '@/components/dashboard/shared';
import { useInbox } from '@/hooks/useDashboardData';
import type { Conversation, SmartReply, SendMessageRequest } from '@/types/communications';

export default function InboxPage() {
  const { data, isLoading, error, mutate } = useInbox();
  const [showCompose, setShowCompose] = useState(false);

  const inboxData = data as {
    conversations: Conversation[];
    smartReplies?: Record<string, SmartReply[]>;
  } | undefined;

  const conversations = inboxData?.conversations ?? [];

  // Build smart replies map
  const smartRepliesMap = new Map<string, SmartReply[]>();
  if (inboxData?.smartReplies) {
    for (const [convId, replies] of Object.entries(inboxData.smartReplies)) {
      smartRepliesMap.set(convId, replies);
    }
  }

  const handleSendMessage = useCallback(async (conversationId: string, body: string) => {
    try {
      await fetch('/api/dashboard/communications/inbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reply',
          conversationId,
          body,
        }),
      });
      mutate();
    } catch {
      // Error handled by SWR
    }
  }, [mutate]);

  const handleMarkRead = useCallback(async (conversationId: string) => {
    try {
      await fetch('/api/dashboard/communications/inbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'markRead',
          conversationId,
        }),
      });
      mutate();
    } catch {
      // Silent
    }
  }, [mutate]);

  const handleComposeSend = useCallback(async (request: SendMessageRequest) => {
    try {
      await fetch('/api/dashboard/communications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
      setShowCompose(false);
      mutate();
    } catch {
      // Error handling
    }
  }, [mutate]);

  return (
    <DashboardErrorBoundary pageName="Inbox">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-heading text-rani-navy flex items-center gap-2">
              <Inbox className="w-6 h-6" />
              Inbox
            </h1>
            <p className="text-xs sm:text-sm font-body text-rani-muted mt-1">
              All client conversations in one place
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => mutate()}
              className="p-2 rounded-lg border border-rani-border hover:bg-gray-50 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4 text-rani-muted" />
            </button>
            <button
              onClick={() => setShowCompose(!showCompose)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rani-navy text-white text-xs font-body font-semibold
                         hover:bg-rani-navy-light transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              New Message
            </button>
          </div>
        </div>

        {/* Compose Modal */}
        {showCompose && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <ComposeMessage
              onSend={handleComposeSend}
              onCancel={() => setShowCompose(false)}
            />
          </motion.div>
        )}

        {/* Inbox */}
        {error ? (
          <InlineError message="Failed to load inbox" onRetry={() => mutate()} />
        ) : (
          <InboxView
            conversations={conversations}
            smartRepliesMap={smartRepliesMap}
            onSendMessage={handleSendMessage}
            onMarkRead={handleMarkRead}
            isLoading={isLoading}
          />
        )}
      </div>
    </DashboardErrorBoundary>
  );
}
