'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Search, Plus, Edit, Eye, Phone, Mail, Copy,
  FileText, Tag,
} from 'lucide-react';
import type { MessageTemplate, TemplateCategory } from '@/types/communications';

interface TemplateLibraryProps {
  templates: MessageTemplate[];
  onEdit: (_id: string) => void;
  onPreview: (_template: MessageTemplate) => void;
  onCreateNew: () => void;
  onDuplicate: (_id: string) => void;
  onSelect?: (_template: MessageTemplate) => void;
  selectable?: boolean;
}

const CATEGORY_COLORS: Record<TemplateCategory, string> = {
  booking_confirmation: 'bg-blue-50 text-blue-700',
  appointment_reminder: 'bg-cyan-50 text-cyan-700',
  post_treatment: 'bg-emerald-50 text-emerald-700',
  reactivation: 'bg-amber-50 text-amber-700',
  promotional: 'bg-pink-50 text-pink-700',
  educational: 'bg-indigo-50 text-indigo-700',
  birthday: 'bg-rose-50 text-rose-700',
  membership: 'bg-purple-50 text-purple-700',
  review_request: 'bg-yellow-50 text-yellow-700',
  welcome: 'bg-green-50 text-green-700',
  custom: 'bg-gray-50 text-gray-700',
};

const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  booking_confirmation: 'Booking Confirmation',
  appointment_reminder: 'Appointment Reminder',
  post_treatment: 'Post Treatment',
  reactivation: 'Reactivation',
  promotional: 'Promotional',
  educational: 'Educational',
  birthday: 'Birthday',
  membership: 'Membership',
  review_request: 'Review Request',
  welcome: 'Welcome',
  custom: 'Custom',
};

export default function TemplateLibrary({
  templates,
  onEdit,
  onPreview,
  onCreateNew,
  onDuplicate,
  onSelect,
  selectable = false,
}: TemplateLibraryProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<TemplateCategory | 'all'>('all');
  const [channelFilter, setChannelFilter] = useState<'all' | 'sms' | 'email' | 'both'>('all');

  const categories = useMemo(() => {
    const cats = new Set(templates.map(t => t.category));
    return Array.from(cats);
  }, [templates]);

  const filtered = useMemo(() => {
    let result = templates;

    if (search) {
      const term = search.toLowerCase();
      result = result.filter(
        t => t.name.toLowerCase().includes(term) || t.body.toLowerCase().includes(term)
      );
    }

    if (categoryFilter !== 'all') {
      result = result.filter(t => t.category === categoryFilter);
    }

    if (channelFilter !== 'all') {
      result = result.filter(t => t.channel === channelFilter || t.channel === 'both');
    }

    return result;
  }, [templates, search, categoryFilter, channelFilter]);

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rani-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-rani-border text-sm font-body
                       placeholder:text-rani-muted focus:outline-none focus:ring-2 focus:ring-rani-gold/30"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as TemplateCategory | 'all')}
            className="text-xs font-body px-3 py-2 rounded-lg border border-rani-border focus:ring-2 focus:ring-rani-gold/30"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
            ))}
          </select>

          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value as typeof channelFilter)}
            className="text-xs font-body px-3 py-2 rounded-lg border border-rani-border focus:ring-2 focus:ring-rani-gold/30"
          >
            <option value="all">All Channels</option>
            <option value="sms">SMS</option>
            <option value="email">Email</option>
            <option value="both">Both</option>
          </select>

          <button
            onClick={onCreateNew}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rani-navy text-white text-xs font-body font-semibold
                       hover:bg-rani-navy-light transition-colors whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            New Template
          </button>
        </div>
      </div>

      {/* Template Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-10 h-10 text-rani-muted/20 mx-auto mb-2" />
          <p className="text-sm font-body text-rani-muted">No templates found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((template) => (
            <motion.div
              key={template.id}
              whileHover={{ y: -2, boxShadow: '0 6px 24px rgba(15, 29, 44, 0.06)' }}
              className={`bg-white rounded-xl border border-rani-border p-4 transition-all ${
                selectable ? 'cursor-pointer' : ''
              }`}
              onClick={() => selectable && onSelect?.(template)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-body font-medium ${CATEGORY_COLORS[template.category]}`}>
                    {CATEGORY_LABELS[template.category]}
                  </span>
                  <span className="flex items-center gap-0.5 text-[10px] font-body text-rani-muted">
                    {template.channel === 'sms' && <Phone className="w-3 h-3" />}
                    {template.channel === 'email' && <Mail className="w-3 h-3" />}
                    {template.channel === 'both' && (
                      <>
                        <Phone className="w-3 h-3" />
                        <Mail className="w-3 h-3" />
                      </>
                    )}
                  </span>
                </div>
                {!template.isActive && (
                  <span className="text-[10px] font-body text-rani-muted bg-gray-100 px-1.5 py-0.5 rounded">
                    Inactive
                  </span>
                )}
              </div>

              <h4 className="text-sm font-body font-semibold text-rani-navy mb-1 truncate">
                {template.name}
              </h4>

              <p className="text-[11px] font-body text-rani-muted line-clamp-3 mb-3">
                {template.body}
              </p>

              {/* Variables */}
              {template.variables.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {template.variables.slice(0, 3).map(v => (
                    <span
                      key={v}
                      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-body font-medium bg-rani-gold/10 text-rani-navy"
                    >
                      <Tag className="w-2.5 h-2.5" />
                      {v}
                    </span>
                  ))}
                  {template.variables.length > 3 && (
                    <span className="text-[9px] font-body text-rani-muted">
                      +{template.variables.length - 3} more
                    </span>
                  )}
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-rani-border/50">
                <span className="text-[10px] font-body text-rani-muted">
                  Used {template.usageCount} times
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); onPreview(template); }}
                    className="p-1 rounded hover:bg-gray-100 transition-colors"
                    title="Preview"
                  >
                    <Eye className="w-3.5 h-3.5 text-rani-muted" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onEdit(template.id); }}
                    className="p-1 rounded hover:bg-gray-100 transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-3.5 h-3.5 text-rani-muted" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDuplicate(template.id); }}
                    className="p-1 rounded hover:bg-gray-100 transition-colors"
                    title="Duplicate"
                  >
                    <Copy className="w-3.5 h-3.5 text-rani-muted" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
