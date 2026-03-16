import type { Permission } from '@/types/auth';

export interface NavItem {
  label: string;
  href: string;
  icon: string; // Lucide icon name
  permission?: Permission;
  badge?: string;
  group: 'overview' | 'revenue' | 'operations' | 'tools' | 'settings';
}

export const NAV_ITEMS: NavItem[] = [
  // Overview
  {
    label: 'Command Center',
    href: '/dashboard',
    icon: 'LayoutDashboard',
    permission: 'view_executive',
    group: 'overview',
  },
  {
    label: 'Leaderboard',
    href: '/dashboard/leaderboard',
    icon: 'Trophy',
    permission: 'view_leaderboard',
    group: 'overview',
  },

  // Revenue
  {
    label: 'Revenue',
    href: '/dashboard/revenue',
    icon: 'DollarSign',
    permission: 'view_revenue',
    group: 'revenue',
  },
  {
    label: 'Lead Funnel',
    href: '/dashboard/leads',
    icon: 'Filter',
    permission: 'view_leads',
    group: 'revenue',
  },
  {
    label: 'Ad Performance',
    href: '/dashboard/ads',
    icon: 'Megaphone',
    permission: 'view_revenue',
    group: 'revenue',
  },

  // Operations
  {
    label: 'Schedule',
    href: '/dashboard/schedule',
    icon: 'Calendar',
    permission: 'view_schedule',
    group: 'operations',
  },
  {
    label: 'Finance',
    href: '/dashboard/finance',
    icon: 'Wallet',
    permission: 'view_finance',
    group: 'operations',
  },

  // Tools
  {
    label: 'Quick Entry',
    href: '/dashboard/entry',
    icon: 'PenSquare',
    group: 'tools',
  },

  // System
  {
    label: 'Integrations',
    href: '/dashboard/integrations',
    icon: 'Plug',
    permission: 'manage_settings',
    group: 'settings',
  },
  {
    label: 'Settings',
    href: '/dashboard/settings',
    icon: 'Settings',
    permission: 'view_settings',
    group: 'settings',
  },
];

export const NAV_GROUPS = [
  { key: 'overview', label: 'Overview' },
  { key: 'revenue', label: 'Revenue' },
  { key: 'operations', label: 'Operations' },
  { key: 'tools', label: 'Tools' },
  { key: 'settings', label: 'System' },
] as const;
