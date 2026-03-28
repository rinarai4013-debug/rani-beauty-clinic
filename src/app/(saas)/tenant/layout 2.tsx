/**
 * RaniOS Tenant Dashboard Layout
 *
 * White-label layout with sidebar navigation, header with branding,
 * and tenant context provider. Uses CSS variables from tenant config.
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// ─── Navigation Items ───────────────────────────────────────────────────────

interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: number;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Overview', href: '/tenant', icon: 'LayoutDashboard' },
  { label: 'Clients', href: '/tenant/clients', icon: 'Users' },
  { label: 'Schedule', href: '/tenant/schedule', icon: 'Calendar' },
  { label: 'Revenue', href: '/tenant/revenue', icon: 'DollarSign' },
  { label: 'AI Engines', href: '/tenant/ai', icon: 'Brain' },
  { label: 'Communications', href: '/tenant/communications', icon: 'MessageSquare' },
  { label: 'Reports', href: '/tenant/reports', icon: 'BarChart3' },
  { label: 'Integrations', href: '/tenant/integrations', icon: 'Plug' },
  { label: 'Settings', href: '/tenant/settings', icon: 'Settings' },
];

// ─── Icon Map ───────────────────────────────────────────────────────────────

function NavIcon({ name, className }: { name: string; className?: string }) {
  const icons: Record<string, string> = {
    LayoutDashboard: 'M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 0h6v6h-6v-6z',
    Users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm13 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
    Calendar: 'M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zM16 2v4M8 2v4M3 10h18',
    DollarSign: 'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
    Brain: 'M12 2a7 7 0 0 0-7 7c0 3 2 5.5 5 7v4h4v-4c3-1.5 5-4 5-7a7 7 0 0 0-7-7z',
    MessageSquare: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
    BarChart3: 'M18 20V10M12 20V4M6 20v-6',
    Plug: 'M12 22v-5M7 7V2M17 7V2M7 7h10a3 3 0 0 1 3 3v1a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-1a3 3 0 0 1 3-3z',
    Settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z',
    Menu: 'M3 12h18M3 6h18M3 18h18',
    X: 'M18 6L6 18M6 6l12 12',
    ChevronDown: 'M6 9l6 6 6-6',
    Bell: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0',
    LogOut: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  };

  return (
    <svg
      className={className || 'w-5 h-5'}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={icons[name] || icons.LayoutDashboard} />
    </svg>
  );
}

// ─── Layout Component ───────────────────────────────────────────────────────

export default function TenantDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // These would come from TenantProvider in production
  const clinicName = 'Your Clinic';
  const primaryColor = 'var(--color-primary, #0F1D2C)';
  const secondaryColor = 'var(--color-secondary, #C9A96E)';

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-20'
        } lg:relative ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          {sidebarOpen && (
            <Link href="/tenant" className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                style={{ backgroundColor: primaryColor }}
              >
                {clinicName[0]}
              </div>
              <span className="font-semibold text-gray-900 truncate text-sm">
                {clinicName}
              </span>
            </Link>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden lg:block p-1.5 rounded-md hover:bg-gray-100 text-gray-500"
          >
            <NavIcon name="Menu" className="w-5 h-5" />
          </button>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1.5 rounded-md hover:bg-gray-100 text-gray-500"
          >
            <NavIcon name="X" className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === '/tenant'
                ? pathname === '/tenant'
                : pathname?.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
                style={isActive ? { backgroundColor: primaryColor } : undefined}
                title={!sidebarOpen ? item.label : undefined}
              >
                <NavIcon name={item.icon} className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
                {sidebarOpen && item.badge && (
                  <span
                    className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: secondaryColor }}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        {sidebarOpen && (
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600">
                U
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">User</p>
                <p className="text-xs text-gray-500 truncate">Admin</p>
              </div>
              <button className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400">
                <NavIcon name="LogOut" className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-md hover:bg-gray-100 text-gray-500"
            >
              <NavIcon name="Menu" className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">
              {NAV_ITEMS.find(
                (item) =>
                  item.href === '/tenant'
                    ? pathname === '/tenant'
                    : pathname?.startsWith(item.href)
              )?.label || 'Dashboard'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-md hover:bg-gray-100 text-gray-500">
              <NavIcon name="Bell" className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
