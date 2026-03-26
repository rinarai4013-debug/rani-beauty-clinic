'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Phone, Mail, User, Search, Eye,
  Calendar, FileText, X, Sparkles,
} from 'lucide-react';
import type {
  MessageChannel,
  MessageTemplate,
  SendMessageRequest,
} from '@/types/communications';

interface ComposeMessageProps {
  templates?: MessageTemplate[];
  onSend: (request: SendMessageRequest) => void;
  onCancel?: () => void;
  defaultChannel?: MessageChannel;
  defaultClientId?: string;
  defaultClientName?: string;
}

export default function ComposeMessage({
  templates = [],
  onSend,
  onCancel,
  defaultChannel = 'sms',
  defaultClientId,
  defaultClientName,
}: ComposeMessageProps) {
  const [channel, setChannel] = useState<MessageChannel>(defaultChannel);
  const [clientId, setClientId] = useState(defaultClientId ?? '');
  const [clientName, setClientName] = useState(defaultClientName ?? '');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isPromotional, setIsPromotional] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [templateSearch, setTemplateSearch] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);

  const filteredTemplates = templates.filter(t => {
    if (t.channel !== 'both' && t.channel !== channel) return false;
    if (templateSearch) {
      const term = templateSearch.toLowerCase();
      return t.name.toLowerCase().includes(term) || t.category.toLowerCase().includes(term);
    }
    return true;
  });

  const handleTemplateSelect = (template: MessageTemplate) => {
    setSelectedTemplate(template);
    setBody(template.body);
    if (template.subject) setSubject(template.subject);
    setShowTemplates(false);
  };

  const handleSend = () => {
    if (!clientId || !body.trim()) return;

    onSend({
      clientId,
      channel,
      subject: channel === 'email' ? subject : undefined,
      body: body.trim(),
      isPromotional,
      templateId: selectedTemplate?.id,
      scheduledAt: scheduledAt || undefined,
    });
  };

  const charCount = body.length;
  const smsSegments = Math.ceil(charCount / 160) || 0;

  return (
    <div className="bg-white rounded-xl border border-rani-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-rani-border">
        <h3 className="text-sm font-body font-semibold text-rani-navy">New Message</h3>
        <div className="flex items-center gap-2">
          {onCancel && (
            <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <X className="w-4 h-4 text-rani-muted" />
            </button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Channel Select */}
        <div>
          <label className="block text-[11px] font-body font-semibold uppercase tracking-wider text-rani-muted mb-1.5">
            Channel
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setChannel('sms')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-body font-medium transition-colors ${
                channel === 'sms'
                  ? 'border-rani-navy bg-rani-navy text-white'
                  : 'border-rani-border text-rani-text hover:bg-gray-50'
              }`}
            >
              <Phone className="w-4 h-4" />
              SMS
            </button>
            <button
              onClick={() => setChannel('email')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-body font-medium transition-colors ${
                channel === 'email'
                  ? 'border-rani-navy bg-rani-navy text-white'
                  : 'border-rani-border text-rani-text hover:bg-gray-50'
              }`}
            >
              <Mail className="w-4 h-4" />
              Email
            </button>
          </div>
        </div>

        {/* Client */}
        <div>
          <label className="block text-[11px] font-body font-semibold uppercase tracking-wider text-rani-muted mb-1.5">
            Recipient
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rani-muted" />
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Search client..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-rani-border text-sm font-body
                           placeholder:text-rani-muted focus:outline-none focus:ring-2 focus:ring-rani-gold/30"
              />
            </div>
          </div>
        </div>

        {/* Subject (email only) */}
        <AnimatePresence>
          {channel === 'email' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <label className="block text-[11px] font-body font-semibold uppercase tracking-wider text-rani-muted mb-1.5">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject line..."
                className="w-full px-3 py-2 rounded-lg border border-rani-border text-sm font-body
                           placeholder:text-rani-muted focus:outline-none focus:ring-2 focus:ring-rani-gold/30"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Template Selector */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-body font-semibold uppercase tracking-wider text-rani-muted">
              Message
            </label>
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className="flex items-center gap-1 text-[11px] font-body font-medium text-rani-gold hover:text-rani-navy transition-colors"
            >
              <FileText className="w-3 h-3" />
              {showTemplates ? 'Hide Templates' : 'Use Template'}
            </button>
          </div>

          <AnimatePresence>
            {showTemplates && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-3"
              >
                <div className="border border-rani-border rounded-lg overflow-hidden">
                  <div className="p-2 border-b border-rani-border">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-rani-muted" />
                      <input
                        type="text"
                        value={templateSearch}
                        onChange={(e) => setTemplateSearch(e.target.value)}
                        placeholder="Search templates..."
                        className="w-full pl-8 pr-3 py-1.5 rounded-md border border-rani-border text-xs font-body
                                   placeholder:text-rani-muted focus:outline-none focus:ring-1 focus:ring-rani-gold/30"
                      />
                    </div>
                  </div>
                  <div className="max-h-40 overflow-y-auto">
                    {filteredTemplates.length === 0 ? (
                      <p className="px-3 py-4 text-xs font-body text-rani-muted text-center">No templates found</p>
                    ) : (
                      filteredTemplates.map(t => (
                        <button
                          key={t.id}
                          onClick={() => handleTemplateSelect(t)}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors border-b border-rani-border/50 last:border-0"
                        >
                          <span className="text-xs font-body font-medium text-rani-navy">{t.name}</span>
                          <span className="text-[10px] font-body text-rani-muted ml-2 capitalize">{t.category.replace('_', ' ')}</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={channel === 'sms' ? 'Type your SMS message...' : 'Type your email body...'}
            rows={5}
            className="w-full px-3 py-2 rounded-lg border border-rani-border text-sm font-body
                       placeholder:text-rani-muted focus:outline-none focus:ring-2 focus:ring-rani-gold/30
                       resize-none"
          />
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-3">
              {channel === 'sms' && (
                <span className="text-[10px] font-body text-rani-muted">
                  {charCount} chars | {smsSegments} segment{smsSegments !== 1 ? 's' : ''}
                </span>
              )}
              {selectedTemplate && (
                <span className="flex items-center gap-1 text-[10px] font-body text-rani-gold">
                  <FileText className="w-3 h-3" />
                  {selectedTemplate.name}
                </span>
              )}
            </div>
            <span className="text-[10px] font-body text-rani-muted">
              Variables: {'{{clientName}}'}, {'{{serviceName}}'}, {'{{providerName}}'}
            </span>
          </div>
        </div>

        {/* Options Row */}
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isPromotional}
              onChange={(e) => setIsPromotional(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-rani-border text-rani-navy focus:ring-rani-gold/30"
            />
            <span className="text-xs font-body text-rani-text">Promotional message</span>
          </label>

          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-rani-muted" />
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="text-xs font-body text-rani-text border border-rani-border rounded-md px-2 py-1
                         focus:outline-none focus:ring-1 focus:ring-rani-gold/30"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-rani-border/50">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-1.5 text-xs font-body font-medium text-rani-muted hover:text-rani-navy transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            Preview
          </button>
          <div className="flex items-center gap-2">
            {onCancel && (
              <button
                onClick={onCancel}
                className="px-4 py-2 text-xs font-body font-medium text-rani-muted hover:text-rani-text transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              onClick={handleSend}
              disabled={!body.trim() || !clientId}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-rani-navy text-white text-xs font-body font-semibold
                         hover:bg-rani-navy-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              {scheduledAt ? 'Schedule' : 'Send'}
            </button>
          </div>
        </div>

        {/* Preview */}
        <AnimatePresence>
          {showPreview && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-lg border border-rani-border bg-gray-50 p-4"
            >
              <h4 className="text-[11px] font-body font-semibold uppercase tracking-wider text-rani-muted mb-2">
                Message Preview
              </h4>
              {channel === 'email' && subject && (
                <p className="text-sm font-body font-semibold text-rani-navy mb-1">
                  Subject: {subject}
                </p>
              )}
              <div className={`p-3 rounded-lg ${channel === 'sms' ? 'bg-green-50' : 'bg-white border border-rani-border'}`}>
                <p className="text-sm font-body text-rani-text whitespace-pre-wrap">{body || 'No content yet'}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
