import type { Permission } from '@/types/auth';

export interface NavItem {
  label: string;
  href: string;
  icon: string; // Lucide icon name
  permission?: Permission;
  badge?: string;
  group: 'overview' | 'revenue' | 'operations' | 'intelligence' | 'tools' | 'settings';
  feature?: import('@/lib/dashboard/features').DashboardFeature;
}

export const NAV_ITEMS: NavItem[] = [
  // Overview
  {
    label: 'Command Center',
    href: '/dashboard',
    icon: 'LayoutDashboard',
    permission: 'view_executive',
    group: 'overview',
    feature: 'command-center',
  },
  {
    label: 'Leaderboard',
    href: '/dashboard/leaderboard',
    icon: 'Trophy',
    permission: 'view_leaderboard',
    group: 'overview',
    feature: 'command-center',
  },

  // Revenue
  {
    label: 'Revenue',
    href: '/dashboard/revenue',
    icon: 'DollarSign',
    permission: 'view_revenue',
    group: 'revenue',
    feature: 'revenue',
  },
  {
    label: 'Lead Funnel',
    href: '/dashboard/leads',
    icon: 'Filter',
    permission: 'view_leads',
    group: 'revenue',
    feature: 'leads',
  },
  {
    label: 'Ad Performance',
    href: '/dashboard/ads',
    icon: 'Megaphone',
    permission: 'view_revenue',
    group: 'revenue',
    feature: 'command-center',
  },

  // Operations
  {
    label: 'GLP-1 Program',
    href: '/dashboard/glp1',
    icon: 'TrendingUp',
    permission: 'view_revenue',
    badge: 'New',
    group: 'operations',
    feature: 'command-center',
  },
  {
    label: 'Schedule',
    href: '/dashboard/schedule',
    icon: 'Calendar',
    permission: 'view_schedule',
    group: 'operations',
    feature: 'schedule',
  },
  {
    label: 'Finance',
    href: '/dashboard/finance',
    icon: 'Wallet',
    permission: 'view_finance',
    group: 'operations',
    feature: 'command-center',
  },
  {
    label: 'Reactivation',
    href: '/dashboard/reactivation',
    icon: 'UserMinus',
    permission: 'view_clients',
    group: 'operations',
    feature: 'command-center',
  },

  // Intelligence
  {
    label: 'Pricing AI',
    href: '/dashboard/pricing',
    icon: 'TrendingUp',
    permission: 'view_revenue',
    group: 'intelligence',
    feature: 'command-center',
  },
  {
    label: 'P&L Intelligence',
    href: '/dashboard/pnl',
    icon: 'BarChart2',
    permission: 'view_finance',
    group: 'intelligence',
    feature: 'command-center',
  },
  {
    label: 'Schedule Optimizer',
    href: '/dashboard/schedule-optimizer',
    icon: 'Zap',
    permission: 'view_schedule',
    group: 'intelligence',
    feature: 'command-center',
  },
  {
    label: 'Inventory',
    href: '/dashboard/inventory-intel',
    icon: 'Package',
    permission: 'view_finance',
    group: 'intelligence',
    feature: 'command-center',
  },
  {
    label: 'Social AI',
    href: '/dashboard/social',
    icon: 'PenSquare',
    permission: 'view_revenue',
    group: 'intelligence',
    feature: 'command-center',
  },
  {
    label: 'Meta Ads AI',
    href: '/dashboard/meta-ads',
    icon: 'Megaphone',
    permission: 'view_revenue',
    group: 'intelligence',
    feature: 'command-center',
  },
  {
    label: 'Consult Co-pilot',
    href: '/dashboard/consult',
    icon: 'MessageCircle',
    permission: 'view_schedule',
    group: 'intelligence',
    feature: 'command-center',
  },
  {
    label: 'Knowledge Base',
    href: '/dashboard/knowledge-base',
    icon: 'BookOpen',
    permission: 'view_executive',
    group: 'intelligence',
    feature: 'command-center',
  },
  {
    label: 'Phone Agent',
    href: '/dashboard/phone-agent',
    icon: 'Phone',
    permission: 'view_executive',
    group: 'intelligence',
    feature: 'command-center',
  },
  {
    label: 'Competitor Intel',
    href: '/dashboard/competitor-intel',
    icon: 'Radar',
    permission: 'view_executive',
    group: 'intelligence',
    feature: 'command-center',
  },
  {
    label: 'Reviews',
    href: '/dashboard/reviews',
    icon: 'Star',
    permission: 'view_executive',
    group: 'intelligence',
    feature: 'command-center',
  },

  // Operations - Alerts
  {
    label: 'Alerts',
    href: '/dashboard/alerts',
    icon: 'Bell',
    permission: 'view_executive',
    group: 'operations',
    feature: 'command-center',
  },

  // Tools
  {
    label: 'Plan Builder',
    href: '/dashboard/plan-builder',
    icon: 'FileText',
    permission: 'entry_plan_builder',
    group: 'tools',
    feature: 'command-center',
  },
  {
    label: 'Quick Entry',
    href: '/dashboard/entry',
    icon: 'PenSquare',
    group: 'tools',
    feature: 'command-center',
  },

  // System
  {
    label: 'Integrations',
    href: '/dashboard/integrations',
    icon: 'Plug',
    permission: 'manage_settings',
    group: 'settings',
    feature: 'command-center',
  },
  {
    label: 'Settings',
    href: '/dashboard/settings',
    icon: 'Settings',
    permission: 'view_settings',
    group: 'settings',
    feature: 'command-center',
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
