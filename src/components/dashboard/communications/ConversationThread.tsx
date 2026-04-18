'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Phone, Mail, User, Bot, Clock, ArrowLeft,
  CheckCheck, AlertTriangle, Sparkles,
} from 'lucide-react';
import DeliveryStatusBadge from './DeliveryStatusBadge';
import type { Conversation, Message, SmartReply } from '@/types/communications';

interface ConversationThreadProps {
  conversation: Conversation;
  smartReplies?: SmartReply[];
  onSendMessage: (body: string) => void;
  onBack?: () => void;
  onMarkRead?: () => void;
}

export default function ConversationThread({
  conversation,
  smartReplies = [],
  onSendMessage,
  onBack,
  onMarkRead,
}: ConversationThreadProps) {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation.messages.length]);

  // Mark as read when viewing
  useEffect(() => {
    if (conversation.unreadCount > 0 && onMarkRead) {
      onMarkRead();
    }
  }, [conversation.id, conversation.unreadCount, onMarkRead]);

  const handleSend = () => {
    if (!newMessage.trim()) return;
    onSendMessage(newMessage.trim());
    setNewMessage('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSmartReply = (reply: SmartReply) => {
    setNewMessage(reply.text);
    inputRef.current?.focus();
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  const channelIcon = conversation.channel === 'sms' ? Phone : Mail;
  const ChannelIcon = channelIcon;

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-rani-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-rani-border bg-white/80 backdrop-blur-sm">
        {onBack && (
          <button
            onClick={onBack}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors lg:hidden"
          >
            <ArrowLeft className="w-5 h-5 text-rani-muted" />
          </button>
        )}
        <div className="w-10 h-10 rounded-full bg-rani-gold/10 flex items-center justify-center flex-shrink-0">
          <User className="w-5 h-5 text-rani-gold-accessible" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-body font-semibold text-rani-navy truncate">
            {conversation.clientName}
          </h3>
          <div className="flex items-center gap-2 text-[11px] font-body text-rani-muted">
            <ChannelIcon className="w-3 h-3" />
            <span>{conversation.channel === 'sms' ? conversation.clientPhone : conversation.clientEmail}</span>
            {conversation.category && (
              <>
                <span className="text-rani-border">|</span>
                <span className="capitalize">{conversation.category.replace('_', ' ')}</span>
              </>
            )}
          </div>
        </div>
        {conversation.priority === 'urgent' && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-body font-semibold bg-red-50 text-red-600">
            <AlertTriangle className="w-3 h-3" />
            Urgent
          </span>
        )}
        {conversation.priority === 'high' && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-body font-semibold bg-amber-50 text-amber-600">
            <AlertTriangle className="w-3 h-3" />
            High
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        <AnimatePresence initial={false}>
          {conversation.messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Smart Replies */}
      {smartReplies.length > 0 && (
        <div className="px-4 py-2 border-t border-rani-border/50 bg-gray-50/50">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Sparkles className="w-3 h-3 text-rani-gold-accessible" />
            <span className="text-[10px] font-body font-semibold text-rani-muted uppercase tracking-wider">
              Suggested Replies
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {smartReplies.map((reply) => (
              <button
                key={reply.id}
                onClick={() => handleSmartReply(reply)}
                className="text-[11px] font-body px-2.5 py-1 rounded-full bg-white border border-rani-border
                           hover:bg-rani-gold/5 hover:border-rani-gold/30 transition-colors
                           text-rani-text truncate max-w-[200px]"
                title={reply.text}
              >
                {reply.text.length > 40 ? reply.text.slice(0, 40) + '...' : reply.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Compose */}
      <div className="px-4 py-3 border-t border-rani-border bg-white">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 resize-none rounded-lg border border-rani-border px-3 py-2
                       text-sm font-body text-rani-text placeholder:text-rani-muted
                       focus:outline-none focus:ring-2 focus:ring-rani-gold/30 focus:border-rani-gold/50
                       max-h-24"
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim()}
            className="p-2.5 rounded-lg bg-rani-navy text-white hover:bg-rani-navy-light
                       disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Message Bubble ───────────────────────────────────────────────────

function MessageBubble({ message }: { message: Message }) {
  const isOutbound = message.direction === 'outbound';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`
          max-w-[75%] rounded-2xl px-3.5 py-2
          ${isOutbound
            ? 'bg-rani-navy text-white rounded-br-md'
            : 'bg-gray-100 text-rani-text rounded-bl-md'
          }
        `}
      >
        <p className="text-sm font-body leading-relaxed whitespace-pre-wrap">
          {message.body}
        </p>
        <div
          className={`flex items-center gap-1.5 mt-1 ${isOutbound ? 'justify-end' : 'justify-start'}`}
        >
          <span className={`text-[10px] font-body ${isOutbound ? 'text-white/60' : 'text-rani-muted'}`}>
            {new Date(message.createdAt).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
            })}
          </span>
          {isOutbound && (
            <DeliveryStatusBadge status={message.status} compact />
          )}
        </div>
      </div>
    </motion.div>
  );
}
