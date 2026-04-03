export type UserRole = 'ceo' | 'frontdesk' | 'provider' | 'marketing' | 'operations';

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
  | 'manage_settings'
  | 'dismiss_alerts'
  | 'manage_bank_connections'
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
  | 'entry_plan_builder';

export interface SessionPayload {
  username: string;
  role: UserRole;
  name: string;
  iat?: number;
  exp?: number;
}
