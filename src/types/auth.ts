// Auth and role type definitions

export type UserRole = 'ceo' | 'frontdesk' | 'provider' | 'marketing' | 'operations';

export interface DashboardUser {
  username: string;
  role: UserRole;
  displayName: string;
  avatar?: string;
}

export interface SessionPayload {
  username: string;
  role: UserRole;
  displayName: string;
  iat: number;
  exp: number;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export type Permission =
  | 'view_executive'
  | 'view_revenue'
  | 'view_revenue_full'
  | 'view_leads'
  | 'view_leads_full'
  | 'view_schedule'
  | 'view_schedule_full'
  | 'view_finance'
  | 'view_clients'
  | 'view_providers'
  | 'view_leaderboard'
  | 'view_settings'
  | 'entry_lead'
  | 'entry_consult_notes'
  | 'entry_sale'
  | 'entry_expense'
  | 'entry_inventory'
  | 'entry_staff_note'
  | 'entry_review'
  | 'entry_eod_recap'
  | 'entry_room_issue'
  | 'entry_ceo_note'
  | 'manage_settings'
  | 'manage_bank_connections'
  | 'dismiss_alerts'
  | 'entry_plan_builder';
