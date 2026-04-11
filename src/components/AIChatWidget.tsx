'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Loader2, Sparkles, Calendar } from 'lucide-react';

interface ChatAction {
  type: 'book_now';
  label: string;
  url: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  actions?: ChatAction[];
}

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: "Hi! I'm Rani's AI concierge. I can help you learn about our treatments, pricing, or book a consultation. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState('');
  const [smsConsent, setSmsConsent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  // Listen for the custom event dispatched by MobileCTA to open the chat
  useEffect(() => {
    const handleOpenChat = () => setIsOpen(true);
    window.addEventListener("rani:open-chat", handleOpenChat);
    return () => window.removeEventListener("rani:open-chat", handleOpenChat);
  }, []);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', content: trimmed };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          visitorInfo: {
            page: typeof window !== 'undefined' ? window.location.pathname : '',
          },
        }),
      });

      const data = await res.json();
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: data.reply,
          actions: data.actions,
        },
      ]);

      // If lead info was captured, fire to contact API
      if (data.leadInfo?.captured) {
        fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Chat Visitor',
            email: data.leadInfo.email || '',
            phone: data.leadInfo.phone || '',
            service: 'AI Chat Lead',
            message: `Captured from AI chat. Last message: ${trimmed}`,
            smsConsent,
          }),
        }).catch(() => {});
      }
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: "I'm sorry, I'm having trouble connecting right now. Please call us at (425) 539-4440 or visit ranibeautyclinic.com to book." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-24 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-rani-gold shadow-lg shadow-rani-gold/30 transition-transform hover:scale-110 lg:bottom-6"
          aria-label="Open chat"
        >
          <MessageCircle className="h-6 w-6 text-rani-navy" />
        </button>
      )}

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="dialog"
            aria-modal="false"
            aria-label="AI Chat"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-4 z-50 flex h-[500px] w-[340px] flex-col overflow-hidden rounded-2xl border border-rani-border bg-white shadow-2xl sm:w-[380px] lg:bottom-6 lg:right-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between bg-rani-navy px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rani-gold/20">
                  <Sparkles className="h-4 w-4 text-rani-gold" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white font-body">Rani AI Concierge</p>
                  <p className="text-xs text-white/50 font-body">Typically replies instantly</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Close chat"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" aria-live="polite" aria-relevant="additions">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className="max-w-[85%]">
                    <div
                      className={`rounded-2xl px-4 py-2.5 text-sm font-body leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-rani-navy text-white rounded-br-md'
                          : 'bg-rani-cream text-rani-navy rounded-bl-md'
                      }`}
                    >
                      {msg.content}
                    </div>
                    {/* Book Now CTA buttons */}
                    {msg.actions && msg.actions.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {msg.actions.map((action, j) => (
                          <a
                            key={j}
                            href={action.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-xl bg-rani-gold px-4 py-2 text-xs font-semibold text-rani-navy font-body transition-all hover:bg-rani-gold/90 hover:shadow-md"
                          >
                            <Calendar className="h-3.5 w-3.5" />
                            {action.label}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-md bg-rani-cream px-4 py-3">
                    <div className="flex gap-1.5">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-rani-navy/30" style={{ animationDelay: '0ms' }} />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-rani-navy/30" style={{ animationDelay: '150ms' }} />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-rani-navy/30" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* SMS Consent + Input */}
            <div className="border-t border-rani-border bg-white px-4 py-3">
              <label className="flex items-center gap-2 mb-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={smsConsent}
                  onChange={e => setSmsConsent(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-rani-border accent-rani-gold"
                />
                <span className="text-[11px] font-body text-rani-muted leading-tight">
                  OK to text me appointment reminders
                </span>
              </label>
              <form
                onSubmit={e => { e.preventDefault(); sendMessage(); }}
                className="flex items-center gap-2"
              >
                <label htmlFor="rani-chat-input" className="sr-only">Type your message</label>
                <input
                  id="rani-chat-input"
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Ask about our treatments..."
                  className="flex-1 rounded-xl border border-rani-border bg-rani-cream/50 px-4 py-2.5 text-sm font-body text-rani-navy outline-none placeholder:text-rani-muted/50 focus:border-rani-gold focus:ring-1 focus:ring-rani-gold/20"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-rani-gold text-rani-navy transition-all hover:bg-rani-gold/90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
                  <span className="sr-only">{isLoading ? 'Sending...' : 'Send message'}</span>
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
