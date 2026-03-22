'use client';

import { useCallback, useEffect, useRef } from 'react';
import type confetti from 'canvas-confetti';

type ConfettiFn = (options?: confetti.Options) => Promise<undefined> | null;

// Dynamic import canvas-confetti to avoid SSR issues
export function useConfetti() {
  const confettiRef = useRef<ConfettiFn | null>(null);

  useEffect(() => {
    import('canvas-confetti').then((mod) => {
      // canvas-confetti exports the function as the module itself
      confettiRef.current = (mod.default ?? mod) as unknown as ConfettiFn;
    });
  }, []);

  const fireConfetti = useCallback((type: 'achievement' | 'levelup' | 'boss' | 'streak') => {
    const confetti = confettiRef.current;
    if (!confetti) return;

    switch (type) {
      case 'achievement':
        // Gold sparkle burst
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 }, colors: ['#C9A96E', '#F3D6BE', '#FAF8F5'] });
        break;
      case 'levelup': {
        // Big celebration — multiple bursts
        const duration = 2000;
        const end = Date.now() + duration;
        const frame = () => {
          confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#C9A96E', '#0F1D2C', '#F3D6BE'] });
          confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#C9A96E', '#0F1D2C', '#F3D6BE'] });
          if (Date.now() < end) requestAnimationFrame(frame);
        };
        frame();
        break;
      }
      case 'boss': {
        // Massive explosion — fireworks style
        const count = 200;
        confetti({ particleCount: count, spread: 100, origin: { y: 0.6 }, colors: ['#C9A96E', '#0F1D2C', '#F3D6BE', '#FFD700'] });
        setTimeout(() => confetti({ particleCount: 100, spread: 120, origin: { y: 0.5, x: 0.3 }, colors: ['#FFD700', '#C9A96E'] }), 300);
        setTimeout(() => confetti({ particleCount: 100, spread: 120, origin: { y: 0.5, x: 0.7 }, colors: ['#FFD700', '#C9A96E'] }), 600);
        break;
      }
      case 'streak':
        // Upward flame effect
        confetti({ particleCount: 30, spread: 40, origin: { y: 0.8 }, colors: ['#FF6B35', '#C9A96E', '#FFD700'], gravity: 0.8 });
        break;
    }
  }, []);

  return fireConfetti;
}
