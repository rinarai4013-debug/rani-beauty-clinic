'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Trophy, DollarSign, Filter, Calendar, Wallet,
  PenSquare, Settings, ChevronLeft, ChevronRight, Sparkles, Megaphone, Plug,
  TrendingUp, BarChart2, Zap, Package, MessageCircle, BookOpen, Phone, UserMinus,
  FileText, Radar, Star, Bell,
} from 'lucide-react';
import { NAV_ITEMS, NAV_GROUPS, type NavItem } from '@/data/dashboard/nav-items';
import type { UserRole } from '@/types/auth';
import { hasPermission } from '@/lib/auth/roles';

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard, Trophy, DollarSign, Filter, Calendar, Wallet,
  PenSquare, Settings, Megaphone, Plug, TrendingUp, BarChart2, Zap, Package, MessageCircle,
  BookOpen, Phone, UserMinus, FileText, Radar, Star, Bell,
};

interface SidebarProps {
  role: UserRole;
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ role, collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  const filteredItems = NAV_ITEMS.filter(
    (item) => !item.permission || hasPermission(role, item.permission)
  );

  const groupedItems = NAV_GROUPS.map((group) => ({
    ...group,
    items: filteredItems.filter((item) => item.group === group.key),
  })).filter((g) => g.items.length > 0);

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 280 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="fixed left-0 top-0 h-screen bg-rani-navy z-40 flex flex-col border-r border-white/5"
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-white/10">
        <Sparkles className="w-7 h-7 text-rani-gold flex-shrink-0" />
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="ml-3 text-white font-heading text-lg whitespace-nowrap overflow-hidden"
            >
              Rani Beauty
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto scrollbar-thin">
        {groupedItems.map((group) => (
          <div key={group.key} className="mb-4">
            <AnimatePresence>
              {!collapsed && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="px-5 mb-2 text-[10px] font-body font-semibold uppercase tracking-[0.15em] text-white/30"
                >
                  {group.label}
                </motion.p>
              )}
            </AnimatePresence>
            {group.items.map((item) => (
              <SidebarLink
                key={item.href}
                item={item}
                isActive={pathname === item.href}
                collapsed={collapsed}
              />
            ))}
          </div>
        ))}
      </nav>

      {/* Collapse Toggle */}
      <button
        onClick={onToggle}
        className="h-12 flex items-center justify-center border-t border-white/10 text-white/40 hover:text-rani-gold transition-colors"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </motion.aside>
  );
}

function SidebarLink({ item, isActive, collapsed }: { item: NavItem; isActive: boolean; collapsed: boolean }) {
  const Icon = ICON_MAP[item.icon] || LayoutDashboard;

  return (
    <Link
      href={item.href}
      className={`
        relative flex items-center h-11 mx-2 rounded-lg transition-all duration-200
        ${isActive
          ? 'bg-white/10 text-rani-gold'
          : 'text-white/60 hover:text-white hover:bg-white/5'
        }
        ${collapsed ? 'justify-center px-0' : 'px-4'}
      `}
    >
      {/* Active indicator */}
      {isActive && (
        <motion.div
          layoutId="sidebar-active"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-rani-gold rounded-r"
        />
      )}

      <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-rani-gold' : ''}`} />

      <AnimatePresence>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            className="ml-3 text-sm font-body font-medium whitespace-nowrap overflow-hidden"
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>

      {/* Tooltip for collapsed */}
      {collapsed && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-rani-navy-light rounded text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50">
          {item.label}
        </div>
      )}
    </Link>
  );
}
