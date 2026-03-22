import type { Permission } from '@/types/auth';

export interface NavItem {
  label: string;
  href: string;
  icon: string; // Lucide icon name
  permission?: Permission;
  badge?: string;
  group: 'overview' | 'revenue' | 'operations' | 'intelligence' | 'tools' | 'settings';
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
  {
    label: 'Reactivation',
    href: '/dashboard/reactivation',
    icon: 'UserMinus',
    permission: 'view_clients',
    group: 'operations',
  },

  // Intelligence
  {
    label: 'Pricing AI',
    href: '/dashboard/pricing',
    icon: 'TrendingUp',
    permission: 'view_revenue',
    group: 'intelligence',
  },
  {
    label: 'P&L Intelligence',
    href: '/dashboard/pnl',
    icon: 'BarChart2',
    permission: 'view_finance',
    group: 'intelligence',
  },
  {
    label: 'Schedule Optimizer',
    href: '/dashboard/schedule-optimizer',
    icon: 'Zap',
    permission: 'view_schedule',
    group: 'intelligence',
  },
  {
    label: 'Inventory',
    href: '/dashboard/inventory-intel',
    icon: 'Package',
    permission: 'view_finance',
    group: 'intelligence',
  },
  {
    label: 'Social AI',
    href: '/dashboard/social',
    icon: 'PenSquare',
    permission: 'view_revenue',
    group: 'intelligence',
  },
  {
    label: 'Meta Ads AI',
    href: '/dashboard/meta-ads',
    icon: 'Megaphone',
    permission: 'view_revenue',
    group: 'intelligence',
  },
  {
    label: 'Consult Co-pilot',
    href: '/dashboard/consult',
    icon: 'MessageCircle',
    permission: 'view_schedule',
    group: 'intelligence',
  },
  {
    label: 'Knowledge Base',
    href: '/dashboard/knowledge-base',
    icon: 'BookOpen',
    permission: 'view_executive',
    group: 'intelligence',
  },
  {
    label: 'Phone Agent',
    href: '/dashboard/phone-agent',
    icon: 'Phone',
    permission: 'view_executive',
    group: 'intelligence',
  },
  {
    label: 'Competitor Intel',
    href: '/dashboard/competitor-intel',
    icon: 'Radar',
    permission: 'view_executive',
    group: 'intelligence',
  },
  {
    label: 'Reviews',
    href: '/dashboard/reviews',
    icon: 'Star',
    permission: 'view_executive',
    group: 'intelligence',
  },

  // Operations — Alerts
  {
    label: 'Alerts',
    href: '/dashboard/alerts',
    icon: 'Bell',
    permission: 'view_executive',
    group: 'operations',
  },

  // Tools
  {
    label: 'Plan Builder',
    href: '/dashboard/plan-builder',
    icon: 'FileText',
    permission: 'entry_plan_builder',
    group: 'tools',
  },
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
  { key: 'intelligence', label: 'Intelligence' },
  { key: 'tools', label: 'Tools' },
  { key: 'settings', label: 'System' },
] as const;
