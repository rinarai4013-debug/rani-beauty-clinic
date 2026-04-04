'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

// ── Floating gold particle background ──
function ParticleField() {
  const [particles] = useState(() =>
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 2 + Math.random() * 4,
      duration: 8 + Math.random() * 12,
      delay: Math.random() * 5,
      opacity: 0.15 + Math.random() * 0.35,
    }))
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: `radial-gradient(circle, rgba(201,169,110,${p.opacity}) 0%, transparent 70%)`,
          }}
          animate={{
            y: [0, -60, 0],
            x: [0, Math.random() > 0.5 ? 20 : -20, 0],
            opacity: [p.opacity * 0.3, p.opacity, p.opacity * 0.3],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

interface SlideWelcomeProps {
  firstName: string;
  onAutoAdvance?: () => void;
}

export default function SlideWelcome({ firstName, onAutoAdvance }: SlideWelcomeProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onAutoAdvance?.();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onAutoAdvance]);

  return (
    <div className="relative flex flex-col items-center justify-center h-full w-full bg-[#0F1D2C] overflow-hidden">
      <ParticleField />

      {/* Subtle radial glow behind logo area */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="w-[600px] h-[600px] rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(201,169,110,0.3) 0%, transparent 70%)',
          }}
        />
      </div>

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 mb-12"
      >
        <motion.div
          className="text-5xl md:text-7xl font-bold tracking-[0.3em] text-[#C9A96E]"
          style={{ fontFamily: 'Playfair Display, serif' }}
          animate={{
            textShadow: [
              '0 0 20px rgba(201,169,110,0.0)',
              '0 0 40px rgba(201,169,110,0.3)',
              '0 0 20px rgba(201,169,110,0.0)',
            ],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          RANI
        </motion.div>
        <motion.div
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: '100%' }}
          transition={{ delay: 0.6, duration: 1, ease: 'easeOut' }}
          className="h-[1px] bg-gradient-to-r from-transparent via-[#C9A96E] to-transparent mt-4"
        />
      </motion.div>

      {/* Welcome text */}
      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0, duration: 1, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 text-4xl md:text-6xl text-white/95 mb-6 text-center"
        style={{ fontFamily: 'Playfair Display, serif' }}
      >
        Welcome, {firstName}
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.6, duration: 0.8, ease: 'easeOut' }}
        className="relative z-10 text-lg md:text-xl text-[#C9A96E]/80 tracking-[0.2em] uppercase"
        style={{ fontFamily: 'Montserrat, sans-serif' }}
      >
        Your Personalized Skin Analysis
      </motion.p>

      {/* Subtle bottom line */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ delay: 2.5, duration: 1 }}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 text-white/30 text-sm tracking-widest uppercase"
        style={{ fontFamily: 'Montserrat, sans-serif' }}
      >
        Tap to continue
      </motion.div>
    </div>
  );
}
