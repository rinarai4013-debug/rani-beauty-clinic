'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, DollarSign, Calendar, PenSquare, Trophy,
  TrendingUp, Filter, Megaphone, Wallet, UserMinus, BarChart2,
  Zap, Package, MessageCircle, BookOpen, Phone, Settings, Plug,
  ChevronUp, X, Brain, Star, Bell, FileText,
  type LucideIcon,
} from 'lucide-react';
import type { UserRole } from '@/types/auth';
import { hasPermission } from '@/lib/auth/roles';

/* ─── Mobile Navigation ────────────────────────────────────────────────
 *  Premium bottom tab bar with expandable "more" drawer.
 *  Shows 5 primary tabs + "More" button that opens the full nav.
 *  Handles safe-area insets for notched devices.
 * ──────────────────────────────────────────────────────────────────── */

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard, DollarSign, Calendar, PenSquare, Trophy,
  TrendingUp, Filter, Megaphone, Wallet, UserMinus, BarChart2,
  Zap, Package, MessageCircle, BookOpen, Phone, Settings, Plug,
  Brain, Star, Bell, FileText,
};

interface MobileNavItem {
  href: string;
  icon: LucideIcon;
  label: string;
}

// Primary tabs - always visible in the bottom bar
const PRIMARY_TABS: MobileNavItem[] = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { href: '/dashboard/revenue', icon: DollarSign, label: 'Revenue' },
  { href: '/dashboard/schedule', icon: Calendar, label: 'Schedule' },
  { href: '/dashboard/entry', icon: PenSquare, label: 'Entry' },
];

// Grouped secondary nav for the "More" drawer
interface NavSection {
  title: string;
  items: { href: string; icon: string; label: string; permission?: string }[];
}

const SECONDARY_SECTIONS: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { href: '/dashboard/leaderboard', icon: 'Trophy', label: 'Leaderboard', permission: 'view_leaderboard' },
      { href: '/dashboard/alerts', icon: 'Bell', label: 'Alerts', permission: 'view_executive' },
    ],
  },
  {
    title: 'Revenue',
    items: [
      { href: '/dashboard/leads', icon: 'Filter', label: 'Lead Funnel', permission: 'view_leads' },
      { href: '/dashboard/ads', icon: 'Megaphone', label: 'Ad Performance', permission: 'view_revenue' },
      { href: '/dashboard/glp1', icon: 'TrendingUp', label: 'GLP-1 Program', permission: 'view_revenue' },
    ],
  },
  {
    title: 'Operations',
    items: [
      { href: '/dashboard/finance', icon: 'Wallet', label: 'Finance', permission: 'view_finance' },
      { href: '/dashboard/reactivation', icon: 'UserMinus', label: 'Reactivation', permission: 'view_clients' },
    ],
  },
  {
    title: 'Intelligence',
    items: [
      { href: '/dashboard/pricing', icon: 'TrendingUp', label: 'Pricing AI', permission: 'view_revenue' },
      { href: '/dashboard/pnl', icon: 'BarChart2', label: 'P&L', permission: 'view_finance' },
      { href: '/dashboard/schedule-optimizer', icon: 'Zap', label: 'Schedule Optimizer', permission: 'view_schedule' },
      { href: '/dashboard/inventory-intel', icon: 'Package', label: 'Inventory', permission: 'view_finance' },
      { href: '/dashboard/social', icon: 'PenSquare', label: 'Social AI', permission: 'view_revenue' },
      { href: '/dashboard/meta-ads', icon: 'Megaphone', label: 'Meta Ads AI', permission: 'view_revenue' },
      { href: '/dashboard/consult', icon: 'MessageCircle', label: 'Consult Co-pilot', permission: 'view_schedule' },
      { href: '/dashboard/knowledge-base', icon: 'BookOpen', label: 'Knowledge Base', permission: 'view_executive' },
      { href: '/dashboard/phone-agent', icon: 'Phone', label: 'Phone Agent', permission: 'view_executive' },
      { href: '/dashboard/reviews', icon: 'Star', label: 'Reviews', permission: 'view_executive' },
    ],
  },
  {
    title: 'Tools',
    items: [
      { href: '/dashboard/plan-builder', icon: 'FileText', label: 'Plan Builder', permission: 'entry_plan_builder' },
    ],
  },
  {
    title: 'System',
    items: [
      { href: '/dashboard/integrations', icon: 'Plug', label: 'Integrations', permission: 'manage_settings' },
      { href: '/dashboard/settings', icon: 'Settings', label: 'Settings', permission: 'view_settings' },
    ],
  },
];

interface MobileNavProps {
  role: UserRole;
}

export default function MobileNav({ role }: MobileNavProps) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  // Check if current path is in primary tabs
  const isTabActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* ── Bottom Tab Bar ────────────────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 pb-[env(safe-area-inset-bottom)]">
        {/* Frosted glass background */}
        <div className="bg-white/90 backdrop-blur-xl border-t border-rani-border/60 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-around h-16 px-1">
            {PRIMARY_TABS.map((tab) => {
              const active = isTabActive(tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className="relative flex flex-col items-center justify-center gap-0.5 w-16 py-1 rounded-xl transition-colors"
                >
                  {active && (
                    <motion.div
                      layoutId="mobile-tab-indicator"
                      className="absolute -top-[1px] left-3 right-3 h-[2px] bg-rani-gold rounded-full"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <tab.icon className={`w-5 h-5 transition-colors ${active ? 'text-rani-gold' : 'text-rani-muted'}`} />
                  <span className={`text-[10px] font-body font-medium transition-colors ${active ? 'text-rani-gold' : 'text-rani-muted'}`}>
                    {tab.label}
                  </span>
                </Link>
              );
            })}

            {/* More button */}
            <button
              onClick={() => setDrawerOpen(!drawerOpen)}
              className="relative flex flex-col items-center justify-center gap-0.5 w-16 py-1 rounded-xl transition-colors"
            >
              {drawerOpen ? (
                <X className="w-5 h-5 text-rani-gold" />
              ) : (
                <ChevronUp className="w-5 h-5 text-rani-muted" />
              )}
              <span className={`text-[10px] font-body font-medium ${drawerOpen ? 'text-rani-gold' : 'text-rani-muted'}`}>
                More
              </span>
            </button>
          </div>
        </div>
      </nav>

      {/* ── Expanded "More" Drawer ────────────────────────────────── */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeDrawer}
              className="lg:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            />

            {/* Drawer */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="lg:hidden fixed bottom-0 left-0 right-0 z-50 max-h-[75vh] overflow-y-auto overscroll-contain rounded-t-2xl bg-white shadow-[0_-8px_40px_rgba(0,0,0,0.12)] pb-[calc(4rem+env(safe-area-inset-bottom))]"
            >
              {/* Handle */}
              <div className="sticky top-0 bg-white/95 backdrop-blur-sm z-10 pt-3 pb-2 px-6 border-b border-rani-border/30">
                <div className="w-8 h-1 rounded-full bg-rani-border mx-auto mb-3" />
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-heading text-rani-navy">All Pages</h3>
                  <button
                    onClick={closeDrawer}
                    className="w-7 h-7 rounded-full bg-rani-cream flex items-center justify-center"
                  >
                    <X className="w-4 h-4 text-rani-muted" />
                  </button>
                </div>
              </div>

              {/* Sections */}
              <div className="px-4 py-3 space-y-4">
                {SECONDARY_SECTIONS.map((section) => {
                  const visibleItems = section.items.filter(
                    (item) => !item.permission || hasPermission(role, item.permission as any)
                  );
                  if (visibleItems.length === 0) return null;

                  return (
                    <div key={section.title}>
                      <p className="text-[10px] font-body font-semibold uppercase tracking-[0.15em] text-rani-muted/50 px-2 mb-2">
                        {section.title}
                      </p>
                      <div className="grid grid-cols-3 gap-1.5">
                        {visibleItems.map((navItem) => {
                          const Icon = ICON_MAP[navItem.icon] || LayoutDashboard;
                          const active = isTabActive(navItem.href);
                          return (
                            <Link
                              key={navItem.href}
                              href={navItem.href}
                              onClick={closeDrawer}
                              className={`
                                flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all
                                ${active
                                  ? 'bg-rani-gold/10 text-rani-gold'
                                  : 'text-rani-muted hover:bg-rani-cream'
                                }
                              `}
                            >
                              <Icon className="w-5 h-5" />
                              <span className="text-[10px] font-body font-medium text-center leading-tight">
                                {navItem.label}
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
