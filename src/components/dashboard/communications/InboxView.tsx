'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Filter, Phone, Mail, MessageSquare,
  User, Clock, AlertTriangle, ChevronRight,
} from 'lucide-react';
import ConversationThread from './ConversationThread';
import type { Conversation, MessageChannel, SmartReply } from '@/types/communications';

interface InboxViewProps {
  conversations: Conversation[];
  smartRepliesMap?: Map<string, SmartReply[]>;
  onSendMessage: (_conversationId: string, _body: string) => void;
  onMarkRead?: (_conversationId: string) => void;
  isLoading?: boolean;
}

const CHANNEL_FILTERS = [
  { value: 'all', label: 'All', icon: MessageSquare },
  { value: 'sms', label: 'SMS', icon: Phone },
  { value: 'email', label: 'Email', icon: Mail },
] as const;

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'escalated', label: 'Escalated' },
  { value: 'resolved', label: 'Resolved' },
] as const;

export default function InboxView({
  conversations,
  smartRepliesMap,
  onSendMessage,
  onMarkRead,
  isLoading = false,
}: InboxViewProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [channelFilter, setChannelFilter] = useState<'all' | MessageChannel>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Filter conversations
  const filtered = useMemo(() => {
    let result = conversations;

    if (search) {
      const term = search.toLowerCase();
      result = result.filter(
        c =>
          c.clientName.toLowerCase().includes(term) ||
          c.lastMessage.toLowerCase().includes(term)
      );
    }

    if (channelFilter !== 'all') {
      result = result.filter(c => c.channel === channelFilter);
    }

    if (statusFilter !== 'all') {
      result = result.filter(c => c.status === statusFilter);
    }

    return result;
  }, [conversations, search, channelFilter, statusFilter]);

  const selectedConversation = selectedId
    ? conversations.find(c => c.id === selectedId)
    : null;

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  return (
    <div className="flex h-[calc(100vh-12rem)] rounded-xl border border-rani-border overflow-hidden bg-white">
      {/* Conversation List */}
      <div
        className={`
          w-full lg:w-96 border-r border-rani-border flex flex-col
          ${selectedConversation ? 'hidden lg:flex' : 'flex'}
        `}
      >
        {/* Search & Filters */}
        <div className="p-3 border-b border-rani-border space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rani-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-rani-border text-sm font-body
                         placeholder:text-rani-muted focus:outline-none focus:ring-2 focus:ring-rani-gold/30"
            />
          </div>
          <div className="flex items-center gap-1.5">
            {CHANNEL_FILTERS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setChannelFilter(value as 'all' | MessageChannel)}
                className={`
                  flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-body font-medium
                  transition-colors
                  ${channelFilter === value
                    ? 'bg-rani-navy text-white'
                    : 'bg-gray-50 text-rani-muted hover:bg-gray-100'
                  }
                `}
              >
                <Icon className="w-3 h-3" />
                {label}
              </button>
            ))}
            <div className="w-px h-4 bg-rani-border mx-1" />
            {STATUS_FILTERS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setStatusFilter(value)}
                className={`
                  px-2 py-1 rounded-full text-[11px] font-body font-medium transition-colors
                  ${statusFilter === value
                    ? 'bg-rani-navy text-white'
                    : 'bg-gray-50 text-rani-muted hover:bg-gray-100'
                  }
                `}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="animate-pulse flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-100 rounded w-24" />
                    <div className="h-3 bg-gray-100 rounded w-48" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center">
              <MessageSquare className="w-10 h-10 text-rani-muted/30 mx-auto mb-2" />
              <p className="text-sm font-body text-rani-muted">No conversations found</p>
            </div>
          ) : (
            <div>
              {filtered.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedId(conv.id)}
                  className={`
                    w-full text-left px-3 py-3 border-b border-rani-border/50 transition-colors
                    hover:bg-gray-50
                    ${selectedId === conv.id ? 'bg-rani-gold/5' : ''}
                    ${conv.unreadCount > 0 ? 'bg-blue-50/30' : ''}
                  `}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-rani-gold/10 flex items-center justify-center">
                        <User className="w-5 h-5 text-rani-gold" />
                      </div>
                      {conv.unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                          {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-sm font-body truncate ${conv.unreadCount > 0 ? 'font-semibold text-rani-navy' : 'font-medium text-rani-text'}`}>
                          {conv.clientName}
                        </span>
                        <span className="text-[10px] font-body text-rani-muted flex-shrink-0">
                          {formatRelativeTime(conv.lastMessageAt)}
                        </span>
                      </div>
                      <p className={`text-xs font-body truncate mt-0.5 ${conv.unreadCount > 0 ? 'text-rani-text' : 'text-rani-muted'}`}>
                        {conv.lastDirection === 'outbound' && (
                          <span className="text-rani-muted">You: </span>
                        )}
                        {conv.lastMessage}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        {conv.channel === 'sms' ? (
                          <Phone className="w-3 h-3 text-rani-muted" />
                        ) : (
                          <Mail className="w-3 h-3 text-rani-muted" />
                        )}
                        {conv.category && (
                          <span className="text-[10px] font-body text-rani-muted capitalize">
                            {conv.category.replace('_', ' ')}
                          </span>
                        )}
                        {conv.priority === 'urgent' && (
                          <AlertTriangle className="w-3 h-3 text-red-500" />
                        )}
                        {conv.priority === 'high' && (
                          <AlertTriangle className="w-3 h-3 text-amber-500" />
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-rani-muted flex-shrink-0 mt-1 hidden lg:block" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="px-3 py-2 border-t border-rani-border bg-gray-50/50">
          <div className="flex items-center justify-between text-[11px] font-body text-rani-muted">
            <span>{filtered.length} conversations</span>
            {totalUnread > 0 && (
              <span className="font-semibold text-rani-navy">{totalUnread} unread</span>
            )}
          </div>
        </div>
      </div>

      {/* Thread View */}
      <div className={`flex-1 ${!selectedConversation ? 'hidden lg:flex' : 'flex'} flex-col`}>
        {selectedConversation ? (
          <ConversationThread
            conversation={selectedConversation}
            smartReplies={smartRepliesMap?.get(selectedConversation.id)}
            onSendMessage={(body) => onSendMessage(selectedConversation.id, body)}
            onBack={() => setSelectedId(null)}
            onMarkRead={() => onMarkRead?.(selectedConversation.id)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 text-rani-muted/20 mx-auto mb-3" />
              <p className="text-sm font-body text-rani-muted">
                Select a conversation to view messages
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
