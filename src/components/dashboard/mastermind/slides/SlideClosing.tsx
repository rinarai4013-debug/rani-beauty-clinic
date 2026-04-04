'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

// ── Celebration confetti ──
function ConfettiField() {
  const [particles] = useState(() =>
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: 20 + Math.random() * 60,
      color: ['#C9A96E', '#E8D5A8', '#7EC8A0', '#A8C4E0', '#F5C842'][Math.floor(Math.random() * 5)],
      size: 4 + Math.random() * 6,
      rotation: Math.random() * 360,
      delay: Math.random() * 2,
      duration: 3 + Math.random() * 3,
    }))
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-sm"
          style={{
            left: `${p.x}%`,
            top: '-5%',
            width: p.size,
            height: p.size * 0.6,
            background: p.color,
            rotate: p.rotation,
          }}
          initial={{ y: 0, opacity: 0 }}
          animate={{
            y: ['0vh', '110vh'],
            opacity: [0, 1, 1, 0],
            rotate: [p.rotation, p.rotation + 360 + Math.random() * 360],
            x: [0, (Math.random() - 0.5) * 100],
          }}
          transition={{
            duration: p.duration,
            delay: 0.5 + p.delay,
            ease: 'easeIn',
            repeat: Infinity,
            repeatDelay: 4,
          }}
        />
      ))}
    </div>
  );
}

interface SlideClosingProps {
  patientName: string;
  providerName?: string;
  onBookSession?: () => void;
  onShareLink?: () => void;
}

export default function SlideClosing({
  patientName,
  providerName,
  onBookSession,
  onShareLink,
}: SlideClosingProps) {
  return (
    <div className="relative flex flex-col items-center justify-center h-full w-full bg-[#0F1D2C] overflow-hidden">
      <ConfettiField />

      {/* Radial glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.15, scale: 1 }}
          transition={{ duration: 2 }}
          className="w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(201,169,110,0.4), transparent 70%)' }}
        />
      </div>

      {/* Main content */}
      <motion.h2
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 1, ease: [0.22, 1, 0.36, 1] }}
        className="text-4xl md:text-6xl text-white text-center mb-4 z-10 max-w-2xl"
        style={{ fontFamily: 'Playfair Display, serif' }}
      >
        Your transformation starts today
      </motion.h2>

      <motion.div
        initial={{ opacity: 0, width: 0 }}
        animate={{ opacity: 1, width: 120 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        className="h-[1px] bg-[#C9A96E] mb-8 z-10"
      />

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.8 }}
        className="text-lg text-white/50 text-center mb-10 z-10 max-w-md"
        style={{ fontFamily: 'Montserrat, sans-serif' }}
      >
        {patientName}, we are honored to be part of your journey to radiant, confident skin.
      </motion.p>

      {/* CTA Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2, duration: 0.6 }}
        className="flex flex-col sm:flex-row gap-4 z-10"
      >
        <button
          onClick={onBookSession}
          className="px-8 py-4 rounded-full text-[#0F1D2C] font-semibold text-base tracking-wide transition-all hover:scale-105 active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #C9A96E, #E8D5A8)',
            fontFamily: 'Montserrat, sans-serif',
            boxShadow: '0 4px 20px rgba(201,169,110,0.3)',
          }}
        >
          Book Your First Session
        </button>
        <button
          onClick={onShareLink}
          className="px-8 py-4 rounded-full text-[#C9A96E] font-semibold text-base tracking-wide border border-[#C9A96E]/30 bg-transparent hover:bg-[#C9A96E]/10 transition-all hover:scale-105 active:scale-95"
          style={{ fontFamily: 'Montserrat, sans-serif' }}
        >
          Take Your Plan Home
        </button>
      </motion.div>

      {/* Provider info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5, duration: 0.8 }}
        className="mt-12 text-center z-10"
      >
        {providerName && (
          <p className="text-sm text-white/40 mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Your provider: <span className="text-white/60">{providerName}</span>
          </p>
        )}
        <motion.div
          className="text-lg font-bold tracking-[0.2em] text-[#C9A96E]/40"
          style={{ fontFamily: 'Playfair Display, serif' }}
        >
          RANI
        </motion.div>
        <p className="text-xs text-white/20 mt-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          401 Olympia Ave NE, Suite 101, Renton, WA 98056
        </p>
        <p className="text-xs text-white/20" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          info@ranibeautyclinic.com
        </p>
      </motion.div>
    </div>
  );
}
