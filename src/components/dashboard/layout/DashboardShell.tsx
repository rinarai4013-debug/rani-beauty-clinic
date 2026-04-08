'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import MobileNav from '../shared/MobileNav';
import type { UserRole } from '@/types/auth';
import { isPathEnabled } from '@/lib/dashboard/features';

interface DashboardShellProps {
  children: React.ReactNode;
  role: UserRole;
  displayName: string;
}

export default function DashboardShell({ children, role, displayName }: DashboardShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [soundMuted, setSoundMuted] = useState(false);
  const pathname = usePathname();
  const pathEnabled = isPathEnabled(pathname);

  useEffect(() => {
    const saved = localStorage.getItem('rani-dashboard-sound-muted');
    if (saved === 'true') setSoundMuted(true);
  }, []);

  useEffect(() => {
    localStorage.setItem('rani-dashboard-sound-muted', String(soundMuted));
  }, [soundMuted]);

  return (
    <div className="min-h-screen bg-rani-cream">
      {/* Sidebar - hidden on mobile */}
      <div className="hidden lg:block">
        <Sidebar
          role={role}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-10">
            <Sidebar
              role={role}
              collapsed={false}
              onToggle={() => setMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Content - shifts right on desktop when sidebar is visible */}
      <div className={`transition-all duration-200 ${
        sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[280px]'
      }`}>
        <Topbar
          role={role}
          displayName={displayName}
          sidebarCollapsed={sidebarCollapsed}
          onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
          soundMuted={soundMuted}
          onSoundToggle={() => setSoundMuted(!soundMuted)}
        />

        <main className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-8">
          {pathEnabled ? (
            children
          ) : (
            <div className="bg-white border border-rani-border rounded-2xl p-6 sm:p-8 text-center">
              <h1 className="text-xl font-heading text-rani-navy">Section Disabled</h1>
              <p className="text-sm text-rani-muted mt-2">
                This dashboard section is temporarily unavailable while backend data
                integrations are being finalized.
              </p>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <MobileNav role={role} />
    </div>
  );
}
