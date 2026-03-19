import { describe, it, expect } from 'vitest';
import { hasPermission, getPermissions, canAccessPage } from '../roles';

describe('hasPermission', () => {
  it('CEO has all permissions', () => {
    expect(hasPermission('ceo', 'view_executive')).toBe(true);
    expect(hasPermission('ceo', 'view_finance')).toBe(true);
    expect(hasPermission('ceo', 'manage_settings')).toBe(true);
    expect(hasPermission('ceo', 'manage_bank_connections')).toBe(true);
    expect(hasPermission('ceo', 'entry_ceo_note')).toBe(true);
    expect(hasPermission('ceo', 'dismiss_alerts')).toBe(true);
  });

  it('frontdesk cannot view finance', () => {
    expect(hasPermission('frontdesk', 'view_finance')).toBe(false);
    expect(hasPermission('frontdesk', 'manage_settings')).toBe(false);
    expect(hasPermission('frontdesk', 'manage_bank_connections')).toBe(false);
  });

  it('frontdesk can view schedule and leads', () => {
    expect(hasPermission('frontdesk', 'view_schedule')).toBe(true);
    expect(hasPermission('frontdesk', 'view_leads')).toBe(true);
    expect(hasPermission('frontdesk', 'entry_lead')).toBe(true);
  });
});

describe('getPermissions', () => {
  it('returns all CEO permissions', () => {
    const perms = getPermissions('ceo');
    expect(perms.length).toBeGreaterThan(20);
    expect(perms).toContain('view_finance');
    expect(perms).toContain('manage_bank_connections');
  });

  it('returns fewer permissions for provider than CEO', () => {
    const ceoPerms = getPermissions('ceo');
    const providerPerms = getPermissions('provider');
    expect(providerPerms.length).toBeLessThan(ceoPerms.length);
  });
});

describe('canAccessPage', () => {
  it('CEO can access all known pages', () => {
    expect(canAccessPage('ceo', '/dashboard')).toBe(true);
    expect(canAccessPage('ceo', '/dashboard/finance')).toBe(true);
    expect(canAccessPage('ceo', '/dashboard/settings')).toBe(true);
  });

  it('provider cannot access finance page', () => {
    expect(canAccessPage('provider', '/dashboard/finance')).toBe(false);
  });

  it('unknown routes return false (deny-by-default)', () => {
    expect(canAccessPage('ceo', '/dashboard/secret-admin')).toBe(false);
    expect(canAccessPage('frontdesk', '/some/random/path')).toBe(false);
  });
});
