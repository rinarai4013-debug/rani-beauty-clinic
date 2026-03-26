import { describe, it, expect } from 'vitest';
import { hasPermission, getPermissions, canAccessPage } from '../roles';
import type { UserRole, Permission } from '@/types/auth';

// ── hasPermission ──

describe('hasPermission', () => {
  // CEO - full access
  it('CEO has view_executive permission', () => {
    expect(hasPermission('ceo', 'view_executive')).toBe(true);
  });

  it('CEO has view_finance permission', () => {
    expect(hasPermission('ceo', 'view_finance')).toBe(true);
  });

  it('CEO has manage_settings permission', () => {
    expect(hasPermission('ceo', 'manage_settings')).toBe(true);
  });

  it('CEO has manage_bank_connections permission', () => {
    expect(hasPermission('ceo', 'manage_bank_connections')).toBe(true);
  });

  it('CEO has entry_ceo_note permission', () => {
    expect(hasPermission('ceo', 'entry_ceo_note')).toBe(true);
  });

  it('CEO has dismiss_alerts permission', () => {
    expect(hasPermission('ceo', 'dismiss_alerts')).toBe(true);
  });

  it('CEO has entry_plan_builder permission', () => {
    expect(hasPermission('ceo', 'entry_plan_builder')).toBe(true);
  });

  // Frontdesk - limited
  it('frontdesk cannot view finance', () => {
    expect(hasPermission('frontdesk', 'view_finance')).toBe(false);
  });

  it('frontdesk cannot manage settings', () => {
    expect(hasPermission('frontdesk', 'manage_settings')).toBe(false);
  });

  it('frontdesk cannot manage bank connections', () => {
    expect(hasPermission('frontdesk', 'manage_bank_connections')).toBe(false);
  });

  it('frontdesk can view schedule and leads', () => {
    expect(hasPermission('frontdesk', 'view_schedule')).toBe(true);
    expect(hasPermission('frontdesk', 'view_leads')).toBe(true);
    expect(hasPermission('frontdesk', 'entry_lead')).toBe(true);
  });

  it('frontdesk can dismiss alerts', () => {
    expect(hasPermission('frontdesk', 'dismiss_alerts')).toBe(true);
  });

  it('frontdesk can enter consult notes', () => {
    expect(hasPermission('frontdesk', 'entry_consult_notes')).toBe(true);
  });

  it('frontdesk cannot enter CEO notes', () => {
    expect(hasPermission('frontdesk', 'entry_ceo_note')).toBe(false);
  });

  // Provider - clinical scope
  it('provider can view executive dashboard', () => {
    expect(hasPermission('provider', 'view_executive')).toBe(true);
  });

  it('provider can view revenue (limited)', () => {
    expect(hasPermission('provider', 'view_revenue')).toBe(true);
  });

  it('provider cannot view full revenue', () => {
    expect(hasPermission('provider', 'view_revenue_full')).toBe(false);
  });

  it('provider can enter consult notes', () => {
    expect(hasPermission('provider', 'entry_consult_notes')).toBe(true);
  });

  it('provider can report room issues', () => {
    expect(hasPermission('provider', 'entry_room_issue')).toBe(true);
  });

  it('provider cannot view finance', () => {
    expect(hasPermission('provider', 'view_finance')).toBe(false);
  });

  it('provider cannot enter expenses', () => {
    expect(hasPermission('provider', 'entry_expense')).toBe(false);
  });

  it('provider can access plan builder', () => {
    expect(hasPermission('provider', 'entry_plan_builder')).toBe(true);
  });

  // Marketing - marketing scope
  it('marketing can view leads with full access', () => {
    expect(hasPermission('marketing', 'view_leads')).toBe(true);
    expect(hasPermission('marketing', 'view_leads_full')).toBe(true);
  });

  it('marketing can view revenue', () => {
    expect(hasPermission('marketing', 'view_revenue')).toBe(true);
  });

  it('marketing cannot view finance', () => {
    expect(hasPermission('marketing', 'view_finance')).toBe(false);
  });

  it('marketing cannot manage settings', () => {
    expect(hasPermission('marketing', 'manage_settings')).toBe(false);
  });

  it('marketing cannot view schedule', () => {
    expect(hasPermission('marketing', 'view_schedule')).toBe(false);
  });

  it('marketing cannot dismiss alerts', () => {
    expect(hasPermission('marketing', 'dismiss_alerts')).toBe(false);
  });

  // Operations - operational scope
  it('operations can view schedule with full access', () => {
    expect(hasPermission('operations', 'view_schedule')).toBe(true);
    expect(hasPermission('operations', 'view_schedule_full')).toBe(true);
  });

  it('operations can enter expenses and inventory', () => {
    expect(hasPermission('operations', 'entry_expense')).toBe(true);
    expect(hasPermission('operations', 'entry_inventory')).toBe(true);
  });

  it('operations can view settings but not manage them', () => {
    expect(hasPermission('operations', 'view_settings')).toBe(true);
    expect(hasPermission('operations', 'manage_settings')).toBe(false);
  });

  it('operations can dismiss alerts', () => {
    expect(hasPermission('operations', 'dismiss_alerts')).toBe(true);
  });

  it('operations cannot manage bank connections', () => {
    expect(hasPermission('operations', 'manage_bank_connections')).toBe(false);
  });
});

// ── getPermissions ──

describe('getPermissions', () => {
  it('returns all CEO permissions (most permissions of any role)', () => {
    const perms = getPermissions('ceo');
    expect(perms.length).toBeGreaterThan(20);
    expect(perms).toContain('view_finance');
    expect(perms).toContain('manage_bank_connections');
    expect(perms).toContain('entry_ceo_note');
  });

  it('returns fewer permissions for provider than CEO', () => {
    const ceoPerms = getPermissions('ceo');
    const providerPerms = getPermissions('provider');
    expect(providerPerms.length).toBeLessThan(ceoPerms.length);
  });

  it('returns fewer permissions for marketing than CEO', () => {
    const ceoPerms = getPermissions('ceo');
    const marketingPerms = getPermissions('marketing');
    expect(marketingPerms.length).toBeLessThan(ceoPerms.length);
  });

  it('marketing has the fewest permissions', () => {
    const roles: UserRole[] = ['ceo', 'frontdesk', 'provider', 'marketing', 'operations'];
    const counts = roles.map(r => getPermissions(r).length);
    const marketingCount = getPermissions('marketing').length;
    expect(marketingCount).toBe(Math.min(...counts));
  });

  it('every role has view_executive permission', () => {
    const roles: UserRole[] = ['ceo', 'frontdesk', 'provider', 'marketing', 'operations'];
    for (const role of roles) {
      expect(getPermissions(role)).toContain('view_executive');
    }
  });

  it('every role has view_leaderboard permission', () => {
    const roles: UserRole[] = ['ceo', 'frontdesk', 'provider', 'marketing', 'operations'];
    for (const role of roles) {
      expect(getPermissions(role)).toContain('view_leaderboard');
    }
  });

  it('returns empty array for unknown role', () => {
    // @ts-expect-error - testing runtime behavior with invalid input
    const perms = getPermissions('nonexistent');
    expect(perms).toEqual([]);
  });
});

// ── canAccessPage ──

describe('canAccessPage', () => {
  it('CEO can access all known pages', () => {
    expect(canAccessPage('ceo', '/dashboard')).toBe(true);
    expect(canAccessPage('ceo', '/dashboard/revenue')).toBe(true);
    expect(canAccessPage('ceo', '/dashboard/finance')).toBe(true);
    expect(canAccessPage('ceo', '/dashboard/settings')).toBe(true);
    expect(canAccessPage('ceo', '/dashboard/leaderboard')).toBe(true);
    expect(canAccessPage('ceo', '/dashboard/plan-builder')).toBe(true);
  });

  it('provider cannot access finance page', () => {
    expect(canAccessPage('provider', '/dashboard/finance')).toBe(false);
  });

  it('provider cannot access settings page', () => {
    expect(canAccessPage('provider', '/dashboard/settings')).toBe(false);
  });

  it('frontdesk cannot access finance page', () => {
    expect(canAccessPage('frontdesk', '/dashboard/finance')).toBe(false);
  });

  it('marketing cannot access finance or schedule pages', () => {
    expect(canAccessPage('marketing', '/dashboard/finance')).toBe(false);
    expect(canAccessPage('marketing', '/dashboard/schedule')).toBe(false);
  });

  it('operations can access schedule but not finance', () => {
    expect(canAccessPage('operations', '/dashboard/schedule')).toBe(true);
    expect(canAccessPage('operations', '/dashboard/finance')).toBe(false);
  });

  it('unknown routes return false (deny-by-default)', () => {
    expect(canAccessPage('ceo', '/dashboard/secret-admin')).toBe(false);
    expect(canAccessPage('frontdesk', '/some/random/path')).toBe(false);
  });

  it('all roles can access the main dashboard page', () => {
    const roles: UserRole[] = ['ceo', 'frontdesk', 'provider', 'marketing', 'operations'];
    for (const role of roles) {
      expect(canAccessPage(role, '/dashboard')).toBe(true);
    }
  });

  it('all roles can access the leaderboard page', () => {
    const roles: UserRole[] = ['ceo', 'frontdesk', 'provider', 'marketing', 'operations'];
    for (const role of roles) {
      expect(canAccessPage(role, '/dashboard/leaderboard')).toBe(true);
    }
  });
});
