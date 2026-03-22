'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useConfetti } from './ConfettiCelebration';
import { useEffect } from 'react';

interface LevelUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  levelName: string;
  levelIcon: string;
  levelNumber: number;
  totalXP: number;
}

export default function LevelUpModal({ isOpen, onClose, levelName, levelIcon, levelNumber, totalXP }: LevelUpModalProps) {
  const fireConfetti = useConfetti();

  useEffect(() => {
    if (isOpen) {
      fireConfetti('levelup');
      // Auto-close after 5 seconds
      const timer = setTimeout(onClose, 5000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, fireConfetti, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: -50 }}
            transition={{ type: 'spring', damping: 15, stiffness: 150 }}
            onClick={(e) => e.stopPropagation()}
            className="relative bg-gradient-to-b from-rani-navy to-[#1A2A3C] rounded-2xl p-8 text-center max-w-sm mx-4 shadow-2xl border border-rani-gold/30"
          >
            <button onClick={onClose} className="absolute top-3 right-3 text-white/50 hover:text-white">
              <X className="w-5 h-5" />
            </button>

            {/* Animated level icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="text-6xl mb-4"
            >
              {levelIcon}
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-rani-gold text-sm font-body uppercase tracking-[0.2em] mb-2"
            >
              Level Up!
            </motion.p>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-white font-display text-3xl font-bold mb-2"
            >
              {levelName}
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-white/60 text-sm font-body mb-6"
            >
              Level {levelNumber} &bull; {totalXP.toLocaleString()} XP
            </motion.p>

            {/* Glow ring animation */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: [0, 1, 0.5], scale: [0.8, 1.2, 1] }}
              transition={{ delay: 0.3, duration: 1.5, repeat: Infinity, repeatType: 'reverse' }}
              className="absolute inset-0 rounded-2xl border-2 border-rani-gold/20 pointer-events-none"
            />

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              onClick={onClose}
              className="bg-rani-gold text-rani-navy px-6 py-2.5 rounded-lg font-body font-semibold text-sm hover:bg-rani-gold-light transition-colors"
            >
              Let&apos;s Go
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
