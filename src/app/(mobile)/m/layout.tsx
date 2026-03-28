'use client';

import { ReactNode, useState, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import MobileTabBar from '@/components/mobile/MobileTabBar';

export default function MobileLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const touchDelta = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (scrollRef.current && scrollRef.current.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (scrollRef.current && scrollRef.current.scrollTop === 0) {
      touchDelta.current = e.touches[0].clientY - touchStartY.current;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (touchDelta.current > 80 && !isRefreshing) {
      setIsRefreshing(true);
      // Dispatch custom event for pages to handle refresh
      window.dispatchEvent(new CustomEvent('mobile-pull-refresh'));
      setTimeout(() => setIsRefreshing(false), 1500);
    }
    touchDelta.current = 0;
  }, [isRefreshing]);

  // Determine active tab from pathname
  const getActiveTab = () => {
    if (pathname === '/m' || pathname === '/m/') return 'home';
    if (pathname.startsWith('/m/book')) return 'book';
    if (pathname.startsWith('/m/treatments')) return 'treatments';
    if (pathname.startsWith('/m/rewards')) return 'rewards';
    if (pathname.startsWith('/m/profile')) return 'profile';
    return 'home';
  };

  // Page transition direction based on tab order
  const tabOrder = ['home', 'book', 'treatments', 'rewards', 'profile'];
  const activeTab = getActiveTab();

  return (
    <div className="fixed inset-0 flex flex-col bg-rani-cream overflow-hidden">
      {/* Status bar spacer (iOS safe area) */}
      <div className="h-[env(safe-area-inset-top,0px)] bg-rani-navy flex-shrink-0" />

      {/* Pull to refresh indicator */}
      <AnimatePresence>
        {isRefreshing && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 48, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex items-center justify-center bg-rani-navy flex-shrink-0"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-5 h-5 border-2 border-[#C9A96E] border-t-transparent rounded-full"
            />
            <span className="ml-2 text-xs text-[#C9A96E] font-body">Refreshing...</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main scrollable content */}
      <div
        ref={scrollRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="min-h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>

        {/* Bottom padding for tab bar + safe area */}
        <div className="h-24" />
      </div>

      {/* Bottom tab navigation */}
      <MobileTabBar activeTab={activeTab} />

      {/* Bottom safe area */}
      <div className="h-[env(safe-area-inset-bottom,0px)] bg-white flex-shrink-0" />
    </div>
  );
}
