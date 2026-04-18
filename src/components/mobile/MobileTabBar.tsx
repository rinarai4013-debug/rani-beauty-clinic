'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home, CalendarPlus, Sparkles, Gift, User } from 'lucide-react';

interface MobileTabBarProps {
  activeTab: string;
}

const tabs = [
  { id: 'home', label: 'Home', icon: Home, href: '/m' },
  { id: 'book', label: 'Book', icon: CalendarPlus, href: '/m/book' },
  { id: 'treatments', label: 'Treatments', icon: Sparkles, href: '/m/treatments' },
  { id: 'rewards', label: 'Rewards', icon: Gift, href: '/m/rewards' },
  { id: 'profile', label: 'Profile', icon: User, href: '/m/profile' },
];

export default function MobileTabBar({ activeTab }: MobileTabBarProps) {
  return (
    <nav className="flex-shrink-0 bg-white border-t border-rani-border/50 backdrop-blur-xl">
      <div className="flex items-center justify-around px-2 h-16">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <Link
              key={tab.id}
              href={tab.href}
              className="relative flex flex-col items-center justify-center w-16 h-full gap-0.5"
            >
              <div className="relative">
                {isActive && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute -inset-2 bg-[#C9A96E]/10 rounded-xl"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 1.5}
                  className={isActive ? 'text-rani-gold-accessible' : 'text-rani-muted'}
                />
              </div>
              <span
                className={`text-[10px] font-body leading-tight ${
                  isActive ? 'text-rani-gold-accessible font-semibold' : 'text-rani-muted'
                }`}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
