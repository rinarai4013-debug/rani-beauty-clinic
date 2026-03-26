'use client';

import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  Calendar,
  Sparkles,
  ClipboardList,
  Star,
  Users,
  User,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';

interface PortalNavProps {
  patientName: string;
}

const NAV_ITEMS = [
  { href: '/portal', label: 'Home', icon: Home },
  { href: '/portal/appointments', label: 'Appointments', icon: Calendar },
  { href: '/portal/treatments', label: 'Treatments', icon: Sparkles },
  { href: '/portal/plan', label: 'My Plan', icon: ClipboardList },
  { href: '/portal/loyalty', label: 'Loyalty', icon: Star },
  { href: '/portal/referrals', label: 'Referrals', icon: Users },
  { href: '/portal/profile', label: 'Profile', icon: User },
];

export default function PortalNav({ patientName }: PortalNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await fetch('/api/patient/auth/me', { method: 'DELETE' });
    router.push('/portal');
    router.refresh();
  };

  const firstName = patientName.split(' ')[0];

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-rani-navy text-white z-40">
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <h1 className="font-heading text-xl font-bold text-rani-gold tracking-wide">
            Rani Beauty
          </h1>
          <p className="text-[10px] text-white/40 uppercase tracking-[3px] mt-1">
            Patient Portal
          </p>
        </div>

        {/* Greeting */}
        <div className="px-6 py-4 border-b border-white/5">
          <p className="text-xs text-white/40">Welcome back,</p>
          <p className="text-sm font-medium text-rani-gold-light truncate">{firstName}</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === '/portal'
                ? pathname === '/portal'
                : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <a
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-body transition-all duration-200 ${
                  isActive
                    ? 'bg-white/10 text-rani-gold'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-rani-gold' : ''}`} />
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-body text-white/40 hover:text-white hover:bg-white/5 transition-all w-full"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 inset-x-0 bg-rani-navy text-white z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <h1 className="font-heading text-lg font-bold text-rani-gold">Rani Beauty</h1>
            <p className="text-[9px] text-white/40 uppercase tracking-[2px]">Patient Portal</p>
          </div>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="border-t border-white/10 bg-rani-navy pb-4">
            <div className="px-4 py-3 border-b border-white/5">
              <p className="text-xs text-white/40">Welcome, {firstName}</p>
            </div>
            <nav className="px-3 py-2 space-y-1">
              {NAV_ITEMS.map((item) => {
                const isActive =
                  item.href === '/portal'
                    ? pathname === '/portal'
                    : pathname.startsWith(item.href);
                const Icon = item.icon;

                return (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${
                      isActive
                        ? 'bg-white/10 text-rani-gold'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </a>
                );
              })}
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/40 hover:text-white w-full mt-2"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </nav>
          </div>
        )}
      </div>

      {/* Bottom tab bar for mobile */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-rani-border z-50 safe-area-bottom">
        <div className="flex items-center justify-around py-2 px-1">
          {NAV_ITEMS.slice(0, 5).map((item) => {
            const isActive =
              item.href === '/portal'
                ? pathname === '/portal'
                : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <a
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg ${
                  isActive ? 'text-rani-navy' : 'text-rani-muted'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-rani-gold' : ''}`} />
                <span className="text-[10px]">{item.label}</span>
              </a>
            );
          })}
        </div>
      </div>
    </>
  );
}
