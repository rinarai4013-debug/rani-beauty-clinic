import type { UserRole, Permission } from '@/types/auth';

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  ceo: [
    'view_executive', 'view_revenue', 'view_revenue_full', 'view_leads', 'view_leads_full',
    'view_schedule', 'view_schedule_full', 'view_finance', 'view_clients', 'view_providers',
    'view_leaderboard', 'view_settings', 'manage_settings', 'dismiss_alerts',
    'entry_lead', 'entry_consult_notes', 'entry_sale', 'entry_expense', 'entry_inventory',
    'entry_staff_note', 'entry_review', 'entry_eod_recap', 'entry_room_issue', 'entry_ceo_note',
    'manage_bank_connections',
    'entry_plan_builder',
  ],
  frontdesk: [
    'view_executive', 'view_leads', 'view_leads_full', 'view_schedule', 'view_schedule_full',
    'view_leaderboard', 'view_clients', 'dismiss_alerts',
    'entry_lead', 'entry_consult_notes', 'entry_sale', 'entry_review', 'entry_eod_recap',
    'entry_plan_builder',
  ],
  provider: [
    'view_executive', 'view_revenue', 'view_schedule', 'view_leaderboard',
    'view_clients', 'view_providers',
    'entry_consult_notes', 'entry_review', 'entry_room_issue',
    'entry_plan_builder',
  ],
  marketing: [
    'view_executive', 'view_revenue', 'view_leads', 'view_leads_full',
    'view_leaderboard',
    'entry_lead', 'entry_review',
  ],
  operations: [
    'view_executive', 'view_revenue', 'view_schedule', 'view_schedule_full',
    'view_leaderboard', 'view_settings', 'view_clients', 'dismiss_alerts',
    'entry_lead', 'entry_expense', 'entry_inventory', 'entry_eod_recap', 'entry_room_issue',
    'entry_staff_note',
  ],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function getPermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

export function canAccessPage(role: UserRole, page: string): boolean {
  const pagePermissions: Record<string, Permission> = {
    '/dashboard': 'view_executive',
    '/dashboard/revenue': 'view_revenue',
    '/dashboard/leads': 'view_leads',
    '/dashboard/schedule': 'view_schedule',
    '/dashboard/finance': 'view_finance',
    '/dashboard/leaderboard': 'view_leaderboard',
    '/dashboard/settings': 'view_settings',
    '/dashboard/entry': 'view_executive', // all roles can access some forms
    '/dashboard/plan-builder': 'entry_plan_builder',
  };
  const required = pagePermissions[page];
  if (!required) return false;
  return hasPermission(role, required);
}
