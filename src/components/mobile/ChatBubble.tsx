'use client';

import { motion } from 'framer-motion';
import { CalendarPlus, ShoppingBag, ExternalLink, Phone } from 'lucide-react';
import type { ChatMessage, ChatAction } from '@/types/mobile';

interface ChatBubbleProps {
  message: ChatMessage;
  onAction?: (action: ChatAction) => void;
}

const actionIcons: Record<string, typeof CalendarPlus> = {
  book: CalendarPlus,
  product: ShoppingBag,
  link: ExternalLink,
  escalate: Phone,
};

export default function ChatBubble({ message, onAction }: ChatBubbleProps) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <span className="text-[10px] text-rani-muted font-body bg-rani-cream px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}
    >
      {/* Avatar for assistant */}
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-rani-navy flex items-center justify-center flex-shrink-0 mr-2 mt-1">
          <span className="text-[10px] text-[#C9A96E] font-heading font-bold">R</span>
        </div>
      )}

      <div className={`max-w-[80%] ${isUser ? '' : ''}`}>
        {/* Bubble */}
        <div
          className={`px-4 py-3 rounded-2xl ${
            isUser
              ? 'bg-rani-navy text-white rounded-br-md'
              : 'bg-white border border-rani-border/30 text-rani-text rounded-bl-md'
          }`}
        >
          <p className="text-sm font-body leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>

        {/* Action buttons */}
        {message.actions && message.actions.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {message.actions.map((action, i) => {
              const Icon = actionIcons[action.type] || ExternalLink;
              return (
                <motion.button
                  key={i}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onAction?.(action)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#C9A96E]/10 border border-[#C9A96E]/20 rounded-xl"
                >
                  <Icon size={12} className="text-[#C9A96E]" />
                  <span className="text-xs text-rani-navy font-body font-medium">
                    {action.label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        )}

        {/* Timestamp */}
        <p
          className={`text-[10px] mt-1 ${
            isUser ? 'text-right text-rani-muted' : 'text-rani-muted'
          } font-body`}
        >
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: 'numeric',
            minute: '2-digit',
          })}
        </p>
      </div>
    </motion.div>
  );
}
