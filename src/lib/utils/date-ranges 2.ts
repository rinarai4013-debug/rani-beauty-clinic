import { startOfDay, startOfWeek, startOfMonth, startOfQuarter, startOfYear, endOfDay, subDays } from 'date-fns';
import type { DateRange, DateRangeValue } from '@/types/dashboard';

export function getDateRange(range: DateRange): DateRangeValue {
  const now = new Date();

  switch (range) {
    case 'today':
      return { start: startOfDay(now), end: endOfDay(now), label: 'Today' };
    case 'yesterday':
      return { start: startOfDay(subDays(now, 1)), end: endOfDay(subDays(now, 1)), label: 'Yesterday' };
    case 'last7':
      return { start: startOfDay(subDays(now, 6)), end: endOfDay(now), label: 'Last 7 Days' };
    case 'last30':
      return { start: startOfDay(subDays(now, 29)), end: endOfDay(now), label: 'Last 30 Days' };
    case 'wtd':
      return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfDay(now), label: 'Week to Date' };
    case 'mtd':
      return { start: startOfMonth(now), end: endOfDay(now), label: 'Month to Date' };
    case 'qtd':
      return { start: startOfQuarter(now), end: endOfDay(now), label: 'Quarter to Date' };
    case 'ytd':
      return { start: startOfYear(now), end: endOfDay(now), label: 'Year to Date' };
    default:
      return { start: startOfDay(now), end: endOfDay(now), label: 'Today' };
  }
}

export function toAirtableDateFormula(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function buildDateFilter(field: string, start: Date, end: Date): string {
  const startStr = toAirtableDateFormula(start);
  const endStr = toAirtableDateFormula(end);
  return `AND(IS_AFTER({${field}}, '${startStr}'), IS_BEFORE({${field}}, '${endStr}'))`;
}

export function todayFormula(field: string): string {
  return `IS_SAME({${field}}, TODAY(), 'day')`;
}

export function thisWeekFormula(field: string): string {
  return `IS_SAME({${field}}, TODAY(), 'week')`;
}

export function thisMonthFormula(field: string): string {
  return `IS_SAME({${field}}, TODAY(), 'month')`;
}
