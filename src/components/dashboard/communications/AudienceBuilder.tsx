'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Users, Filter, X } from 'lucide-react';
import type {
  AudienceFilter,
  SegmentGroup,
  SegmentCondition,
  SegmentField,
  SegmentOperator,
} from '@/types/communications';

interface AudienceBuilderProps {
  filter: AudienceFilter;
  onChange: (filter: AudienceFilter) => void;
  audienceSize?: number;
  totalClients?: number;
}

const FIELD_OPTIONS: { value: SegmentField; label: string; type: 'text' | 'number' | 'boolean' | 'select' }[] = [
  { value: 'treatment_history', label: 'Treatment History', type: 'text' },
  { value: 'spend_tier', label: 'Spend Tier', type: 'select' },
  { value: 'visit_recency', label: 'Days Since Last Visit', type: 'number' },
  { value: 'membership_status', label: 'Membership Status', type: 'select' },
  { value: 'age', label: 'Age', type: 'number' },
  { value: 'gender', label: 'Gender', type: 'select' },
  { value: 'zip_code', label: 'Zip Code', type: 'text' },
  { value: 'lead_status', label: 'Lead Status', type: 'select' },
  { value: 'last_service', label: 'Last Service', type: 'text' },
  { value: 'total_spend', label: 'Total Spend ($)', type: 'number' },
  { value: 'visit_count', label: 'Visit Count', type: 'number' },
  { value: 'days_since_last_visit', label: 'Visit Recency (Days)', type: 'number' },
  { value: 'has_email', label: 'Has Email', type: 'boolean' },
  { value: 'has_phone', label: 'Has Phone', type: 'boolean' },
  { value: 'sms_opt_in', label: 'SMS Opted In', type: 'boolean' },
  { value: 'email_opt_in', label: 'Email Opted In', type: 'boolean' },
];

const OPERATOR_OPTIONS: { value: SegmentOperator; label: string }[] = [
  { value: 'equals', label: 'equals' },
  { value: 'not_equals', label: 'does not equal' },
  { value: 'contains', label: 'contains' },
  { value: 'not_contains', label: 'does not contain' },
  { value: 'greater_than', label: 'greater than' },
  { value: 'less_than', label: 'less than' },
  { value: 'between', label: 'between' },
  { value: 'is_true', label: 'is true' },
  { value: 'is_false', label: 'is false' },
];

const SPEND_TIERS = ['new', 'bronze', 'silver', 'gold', 'vip'];
const MEMBERSHIP_STATUSES = ['active', 'cancelled', 'none'];
const GENDERS = ['female', 'male', 'non-binary', 'prefer not to say'];
const LEAD_STATUSES = ['new', 'contacted', 'qualified', 'converted', 'lost'];

export default function AudienceBuilder({
  filter,
  onChange,
  audienceSize,
  totalClients,
}: AudienceBuilderProps) {
  const addGroup = () => {
    const newGroup: SegmentGroup = {
      id: `grp_${Date.now()}`,
      logic: 'AND',
      conditions: [],
    };
    onChange({
      ...filter,
      groups: [...filter.groups, newGroup],
    });
  };

  const removeGroup = (groupId: string) => {
    onChange({
      ...filter,
      groups: filter.groups.filter(g => g.id !== groupId),
    });
  };

  const updateGroupLogic = (groupId: string, logic: 'AND' | 'OR') => {
    onChange({
      ...filter,
      groups: filter.groups.map(g =>
        g.id === groupId ? { ...g, logic } : g
      ),
    });
  };

  const addCondition = (groupId: string) => {
    const newCondition: SegmentCondition = {
      id: `cond_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      field: 'visit_recency',
      operator: 'greater_than',
      value: 30,
    };
    onChange({
      ...filter,
      groups: filter.groups.map(g =>
        g.id === groupId
          ? { ...g, conditions: [...g.conditions, newCondition] }
          : g
      ),
    });
  };

  const removeCondition = (groupId: string, conditionId: string) => {
    onChange({
      ...filter,
      groups: filter.groups.map(g =>
        g.id === groupId
          ? { ...g, conditions: g.conditions.filter(c => c.id !== conditionId) }
          : g
      ),
    });
  };

  const updateCondition = (groupId: string, conditionId: string, updates: Partial<SegmentCondition>) => {
    onChange({
      ...filter,
      groups: filter.groups.map(g =>
        g.id === groupId
          ? {
              ...g,
              conditions: g.conditions.map(c =>
                c.id === conditionId ? { ...c, ...updates } : c
              ),
            }
          : g
      ),
    });
  };

  const getSelectOptions = (field: SegmentField): string[] => {
    switch (field) {
      case 'spend_tier': return SPEND_TIERS;
      case 'membership_status': return MEMBERSHIP_STATUSES;
      case 'gender': return GENDERS;
      case 'lead_status': return LEAD_STATUSES;
      default: return [];
    }
  };

  const fieldConfig = (field: SegmentField) =>
    FIELD_OPTIONS.find(f => f.value === field);

  return (
    <div className="space-y-4">
      {/* Audience Size Preview */}
      {audienceSize !== undefined && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-rani-gold/5 border border-rani-gold/20">
          <Users className="w-5 h-5 text-rani-gold-accessible" />
          <div>
            <span className="text-lg font-body font-bold text-rani-navy">
              {audienceSize.toLocaleString()}
            </span>
            <span className="text-xs font-body text-rani-muted ml-1.5">
              {totalClients
                ? `of ${totalClients.toLocaleString()} clients (${Math.round((audienceSize / totalClients) * 100)}%)`
                : 'clients match'}
            </span>
          </div>
        </div>
      )}

      {/* Global Options */}
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filter.excludeUnsubscribed}
            onChange={(e) => onChange({ ...filter, excludeUnsubscribed: e.target.checked })}
            className="w-3.5 h-3.5 rounded border-rani-border text-rani-navy focus:ring-rani-gold/30"
          />
          <span className="text-xs font-body text-rani-text">Exclude unsubscribed</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filter.excludeRecentlyContacted}
            onChange={(e) => onChange({ ...filter, excludeRecentlyContacted: e.target.checked })}
            className="w-3.5 h-3.5 rounded border-rani-border text-rani-navy focus:ring-rani-gold/30"
          />
          <span className="text-xs font-body text-rani-text">Exclude recently contacted (24h)</span>
        </label>

        {filter.groups.length > 1 && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-[11px] font-body text-rani-muted">Between groups:</span>
            <select
              value={filter.logic}
              onChange={(e) => onChange({ ...filter, logic: e.target.value as 'AND' | 'OR' })}
              className="text-xs font-body px-2 py-1 rounded-md border border-rani-border focus:ring-1 focus:ring-rani-gold/30"
            >
              <option value="AND">AND (match all)</option>
              <option value="OR">OR (match any)</option>
            </select>
          </div>
        )}
      </div>

      {/* Segment Groups */}
      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {filter.groups.map((group, groupIndex) => (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="rounded-lg border border-rani-border bg-white"
            >
              {/* Group Header */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-rani-border/50 bg-gray-50/50 rounded-t-lg">
                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-rani-muted" />
                  <span className="text-xs font-body font-semibold text-rani-navy">
                    Group {groupIndex + 1}
                  </span>
                  {group.conditions.length > 1 && (
                    <select
                      value={group.logic}
                      onChange={(e) => updateGroupLogic(group.id, e.target.value as 'AND' | 'OR')}
                      className="text-[11px] font-body px-1.5 py-0.5 rounded border border-rani-border bg-white focus:ring-1 focus:ring-rani-gold/30"
                    >
                      <option value="AND">Match ALL conditions</option>
                      <option value="OR">Match ANY condition</option>
                    </select>
                  )}
                </div>
                <button
                  onClick={() => removeGroup(group.id)}
                  className="p-1 rounded hover:bg-red-50 text-rani-muted hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Conditions */}
              <div className="p-3 space-y-2">
                {group.conditions.map((condition) => {
                  const config = fieldConfig(condition.field);
                  const selectOpts = getSelectOptions(condition.field);

                  return (
                    <div key={condition.id} className="flex items-center gap-2 flex-wrap">
                      {/* Field */}
                      <select
                        value={condition.field}
                        onChange={(e) => updateCondition(group.id, condition.id, {
                          field: e.target.value as SegmentField,
                          value: '',
                          operator: 'equals',
                        })}
                        className="text-xs font-body px-2 py-1.5 rounded-md border border-rani-border bg-white
                                   focus:ring-1 focus:ring-rani-gold/30 min-w-[140px]"
                      >
                        {FIELD_OPTIONS.map(f => (
                          <option key={f.value} value={f.value}>{f.label}</option>
                        ))}
                      </select>

                      {/* Operator */}
                      <select
                        value={condition.operator}
                        onChange={(e) => updateCondition(group.id, condition.id, {
                          operator: e.target.value as SegmentOperator,
                        })}
                        className="text-xs font-body px-2 py-1.5 rounded-md border border-rani-border bg-white
                                   focus:ring-1 focus:ring-rani-gold/30"
                      >
                        {OPERATOR_OPTIONS
                          .filter(o => {
                            if (config?.type === 'boolean') return o.value === 'is_true' || o.value === 'is_false';
                            if (config?.type === 'number') return ['equals', 'not_equals', 'greater_than', 'less_than', 'between'].includes(o.value);
                            if (config?.type === 'select') return ['equals', 'not_equals', 'in', 'not_in'].includes(o.value);
                            return true;
                          })
                          .map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                      </select>

                      {/* Value */}
                      {condition.operator !== 'is_true' && condition.operator !== 'is_false' && (
                        <>
                          {selectOpts.length > 0 ? (
                            <select
                              value={String(condition.value)}
                              onChange={(e) => updateCondition(group.id, condition.id, { value: e.target.value })}
                              className="text-xs font-body px-2 py-1.5 rounded-md border border-rani-border bg-white
                                         focus:ring-1 focus:ring-rani-gold/30 min-w-[120px]"
                            >
                              <option value="">Select...</option>
                              {selectOpts.map(opt => (
                                <option key={opt} value={opt} className="capitalize">{opt}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={config?.type === 'number' ? 'number' : 'text'}
                              value={String(condition.value)}
                              onChange={(e) => updateCondition(group.id, condition.id, {
                                value: config?.type === 'number' ? Number(e.target.value) : e.target.value,
                              })}
                              placeholder="Value..."
                              className="text-xs font-body px-2 py-1.5 rounded-md border border-rani-border
                                         focus:ring-1 focus:ring-rani-gold/30 w-28"
                            />
                          )}
                          {condition.operator === 'between' && (
                            <>
                              <span className="text-xs font-body text-rani-muted">and</span>
                              <input
                                type="number"
                                value={String(condition.secondValue ?? '')}
                                onChange={(e) => updateCondition(group.id, condition.id, {
                                  secondValue: Number(e.target.value),
                                })}
                                placeholder="Max..."
                                className="text-xs font-body px-2 py-1.5 rounded-md border border-rani-border
                                           focus:ring-1 focus:ring-rani-gold/30 w-24"
                              />
                            </>
                          )}
                        </>
                      )}

                      <button
                        onClick={() => removeCondition(group.id, condition.id)}
                        className="p-1 rounded hover:bg-red-50 text-rani-muted hover:text-red-500 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}

                <button
                  onClick={() => addCondition(group.id)}
                  className="flex items-center gap-1.5 text-[11px] font-body font-medium text-rani-gold-accessible hover:text-rani-navy transition-colors mt-1"
                >
                  <Plus className="w-3 h-3" />
                  Add Condition
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add Group */}
      <button
        onClick={addGroup}
        className="flex items-center gap-2 w-full justify-center py-2.5 rounded-lg border-2 border-dashed border-rani-border
                   text-xs font-body font-medium text-rani-muted hover:border-rani-gold hover:text-rani-navy transition-colors"
      >
        <Plus className="w-4 h-4" />
        Add Segment Group
      </button>
    </div>
  );
}
