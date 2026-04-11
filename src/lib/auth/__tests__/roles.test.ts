import { canAccessPage, hasPermission } from '../roles';

describe('Auth Roles', () => {
  const requirePermission = (role: Parameters<typeof hasPermission>[0], permission: Parameters<typeof hasPermission>[1]) => {
    return hasPermission(role, permission);
  };

  it('prevents frontdesk from accessing finance permissions', () => {
    expect(requirePermission('frontdesk', 'view_finance')).toBe(false);
    expect(canAccessPage('frontdesk', '/dashboard/finance')).toBe(false);
  });

  it('prevents provider from managing settings', () => {
    expect(requirePermission('provider', 'manage_settings')).toBe(false);
    expect(canAccessPage('provider', '/dashboard/settings')).toBe(false);
  });

  it('allows CEO to access finance and settings', () => {
    expect(requirePermission('ceo', 'view_finance')).toBe(true);
    expect(requirePermission('ceo', 'manage_settings')).toBe(true);
    expect(canAccessPage('ceo', '/dashboard/finance')).toBe(true);
    expect(canAccessPage('ceo', '/dashboard/settings')).toBe(true);
  });

  it('prevents operations and frontdesk from plan-builder permission by default route map', () => {
    expect(requirePermission('frontdesk', 'entry_plan_builder')).toBe(true);
    expect(canAccessPage('frontdesk', '/dashboard/plan-builder')).toBe(true);
    expect(canAccessPage('operations', '/dashboard/plan-builder')).toBe(false);
    expect(requirePermission('operations', 'entry_plan_builder')).toBe(false);
  });

  it('uses fallback false for unknown pages', () => {
    expect(canAccessPage('ceo', '/dashboard/unknown')).toBe(false);
    expect(canAccessPage('frontdesk', '/dashboard/secret')).toBe(false);
  });
});
