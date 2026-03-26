'use client';

import { Bell, Search, Volume2, VolumeX, LogOut, Menu } from 'lucide-react';
import { useState } from 'react';
import { useClinicScore } from '@/hooks/useDashboardData';
import { getScoreColor, getScoreStatus, getScoreLabel } from '@/lib/utils/formatters';
import type { UserRole } from '@/types/auth';

interface TopbarProps {
  role: UserRole;
  displayName: string;
  sidebarCollapsed: boolean;
  onMenuToggle: () => void;
  soundMuted: boolean;
  onSoundToggle: () => void;
}

export default function Topbar({
  role,
  displayName,
  sidebarCollapsed,
  onMenuToggle,
  soundMuted,
  onSoundToggle,
}: TopbarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: scoreData } = useClinicScore();
  const score = (scoreData as { total?: number })?.total ?? 0;
  const scoreColor = getScoreColor(score);
  const status = getScoreStatus(score);

  return (
    <header
      className="h-14 sm:h-16 bg-white/80 backdrop-blur-md border-b border-rani-border flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30"
    >
      {/* Left: Menu toggle (mobile) + Search */}
      <div className="flex items-center gap-4 flex-1">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-lg hover:bg-rani-cream text-rani-text"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative max-w-md w-full hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rani-muted" />
          <input
            type="text"
            placeholder="Search clients, appointments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-rani-cream/50 border border-rani-border rounded-lg text-sm font-body text-rani-text placeholder:text-rani-muted focus:outline-none focus:ring-2 focus:ring-rani-gold/30 focus:border-rani-gold"
          />
        </div>
      </div>

      {/* Center: Clinic Score Badge */}
      <div className="hidden md:flex items-center gap-2 px-4">
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border"
          style={{
            borderColor: scoreColor + '40',
            backgroundColor: scoreColor + '10',
          }}
        >
          <div
            className="w-2.5 h-2.5 rounded-full animate-pulse"
            style={{ backgroundColor: scoreColor }}
          />
          <span className="text-sm font-body font-semibold" style={{ color: scoreColor }}>
            {score}
          </span>
          <span className="text-xs font-body text-rani-muted">
            {getScoreLabel(status)}
          </span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Sound Toggle */}
        <button
          onClick={onSoundToggle}
          className="p-2 rounded-lg hover:bg-rani-cream text-rani-muted hover:text-rani-text transition-colors"
          title={soundMuted ? 'Unmute sounds' : 'Mute sounds'}
        >
          {soundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-rani-cream text-rani-muted hover:text-rani-text transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* User */}
        <div className="flex items-center gap-2 ml-2 pl-3 border-l border-rani-border">
          <div className="w-8 h-8 rounded-full bg-rani-gold/20 flex items-center justify-center">
            <span className="text-xs font-body font-bold text-rani-navy">
              {displayName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="hidden lg:block">
            <p className="text-sm font-body font-medium text-rani-text leading-tight">{displayName}</p>
            <p className="text-[10px] font-body text-rani-muted uppercase tracking-wide">{role}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
