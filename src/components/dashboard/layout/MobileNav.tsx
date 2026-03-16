'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, DollarSign, Calendar, PenSquare, Trophy } from 'lucide-react';
import type { UserRole } from '@/types/auth';

const MOBILE_ITEMS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { href: '/dashboard/revenue', icon: DollarSign, label: 'Revenue' },
  { href: '/dashboard/schedule', icon: Calendar, label: 'Schedule' },
  { href: '/dashboard/entry', icon: PenSquare, label: 'Entry' },
  { href: '/dashboard/leaderboard', icon: Trophy, label: 'Score' },
];

interface MobileNavProps {
  role: UserRole;
}

export default function MobileNav({ role }: MobileNavProps) {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-md border-t border-rani-border z-30 flex items-center justify-around px-2">
      {MOBILE_ITEMS.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
              isActive ? 'text-rani-gold' : 'text-rani-muted'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-body font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
