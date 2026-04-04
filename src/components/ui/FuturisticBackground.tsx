'use client';

import { useEffect, useRef, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';

type Variant = 'dark' | 'light' | 'presentation';

interface FuturisticBackgroundProps {
  variant?: Variant;
  particleCount?: number;
  showGrid?: boolean;
  showAmbientLight?: boolean;
  className?: string;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  speedX: number;
  speedY: number;
  pulse: number;
  pulseSpeed: number;
}

const VARIANT_COLORS = {
  dark: {
    particle: '201, 169, 110',
    grid: 'rgba(201, 169, 110, 0.03)',
    gridFine: 'rgba(201, 169, 110, 0.015)',
    ambient: 'rgba(201, 169, 110, 0.06)',
    meshA: 'rgba(201, 169, 110, 0.05)',
    meshB: 'rgba(22, 37, 54, 0.4)',
    bg: 'linear-gradient(135deg, #0a1520 0%, #0F1D2C 50%, #162536 100%)',
  },
  light: {
    particle: '160, 128, 64',
    grid: 'rgba(201, 169, 110, 0.06)',
    gridFine: 'rgba(201, 169, 110, 0.03)',
    ambient: 'rgba(201, 169, 110, 0.08)',
    meshA: 'rgba(201, 169, 110, 0.04)',
    meshB: 'rgba(248, 246, 241, 0.6)',
    bg: 'linear-gradient(180deg, #FAF8F5 0%, #F0EDE6 100%)',
  },
  presentation: {
    particle: '201, 169, 110',
    grid: 'rgba(201, 169, 110, 0.04)',
    gridFine: 'rgba(201, 169, 110, 0.02)',
    ambient: 'rgba(201, 169, 110, 0.1)',
    meshA: 'rgba(201, 169, 110, 0.07)',
    meshB: 'rgba(15, 29, 44, 0.3)',
    bg: 'linear-gradient(135deg, #070d14 0%, #0a1520 50%, #0F1D2C 100%)',
  },
} as const;

function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 1.5 + Math.random() * 3,
    opacity: 0.1 + Math.random() * 0.35,
    speedX: (Math.random() - 0.5) * 0.015,
    speedY: (Math.random() - 0.5) * 0.012,
    pulse: Math.random() * Math.PI * 2,
    pulseSpeed: 0.005 + Math.random() * 0.015,
  }));
}

export default function FuturisticBackground({
  variant = 'dark',
  particleCount = 24,
  showGrid = true,
  showAmbientLight = true,
  className = '',
}: FuturisticBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const ambientRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const particleDotsRef = useRef<(HTMLDivElement | null)[]>([]);
  const rafRef = useRef<number>(0);
  const mouseRef = useRef({ x: 50, y: 50 });

  const colors = VARIANT_COLORS[variant];

  const initialParticles = useMemo(
    () => generateParticles(particleCount),
    [particleCount]
  );

  useEffect(() => {
    particlesRef.current = initialParticles.map((p) => ({ ...p }));
  }, [initialParticles]);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!showAmbientLight) return;
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      mouseRef.current = {
        x: ((e.clientX - rect.left) / rect.width) * 100,
        y: ((e.clientY - rect.top) / rect.height) * 100,
      };
    },
    [showAmbientLight]
  );

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  // Animation loop
  useEffect(() => {
    let lastAmbientUpdate = 0;

    const animate = (time: number) => {
      const particles = particlesRef.current;
      const dots = particleDotsRef.current;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.speedX;
        p.y += p.speedY;
        p.pulse += p.pulseSpeed;

        // Wrap around
        if (p.x < -2) p.x = 102;
        if (p.x > 102) p.x = -2;
        if (p.y < -2) p.y = 102;
        if (p.y > 102) p.y = -2;

        const dot = dots[i];
        if (dot) {
          const currentOpacity = p.opacity + Math.sin(p.pulse) * 0.15;
          dot.style.transform = `translate(${p.x}vw, ${p.y}vh)`;
          dot.style.opacity = String(Math.max(0.05, currentOpacity));
        }
      }

      // Update ambient light (throttled to ~30fps)
      if (showAmbientLight && ambientRef.current && time - lastAmbientUpdate > 33) {
        lastAmbientUpdate = time;
        const { x, y } = mouseRef.current;
        ambientRef.current.style.background = `radial-gradient(600px circle at ${x}% ${y}%, ${colors.ambient}, transparent 70%)`;
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [colors.ambient, showAmbientLight]);

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 pointer-events-none overflow-hidden ${className}`}
      style={{ background: colors.bg, zIndex: 0 }}
      aria-hidden="true"
    >
      {/* Gradient mesh */}
      <motion.div
        className="absolute inset-0"
        animate={{
          background: [
            `radial-gradient(ellipse at 20% 20%, ${colors.meshA} 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, ${colors.meshB} 0%, transparent 50%)`,
            `radial-gradient(ellipse at 30% 70%, ${colors.meshA} 0%, transparent 50%), radial-gradient(ellipse at 70% 30%, ${colors.meshB} 0%, transparent 50%)`,
            `radial-gradient(ellipse at 20% 20%, ${colors.meshA} 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, ${colors.meshB} 0%, transparent 50%)`,
          ],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      />

      {/* HUD Grid */}
      {showGrid && (
        <>
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `linear-gradient(${colors.grid} 1px, transparent 1px), linear-gradient(90deg, ${colors.grid} 1px, transparent 1px)`,
              backgroundSize: '80px 80px',
              opacity: 0.7,
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `linear-gradient(${colors.gridFine} 1px, transparent 1px), linear-gradient(90deg, ${colors.gridFine} 1px, transparent 1px)`,
              backgroundSize: '20px 20px',
              opacity: 0.5,
            }}
          />
          {/* Animated grid fade */}
          <motion.div
            className="absolute inset-0"
            style={{
              backgroundImage: `linear-gradient(${colors.grid} 1px, transparent 1px), linear-gradient(90deg, ${colors.grid} 1px, transparent 1px)`,
              backgroundSize: '80px 80px',
            }}
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
        </>
      )}

      {/* Ambient light that follows cursor */}
      {showAmbientLight && (
        <div
          ref={ambientRef}
          className="absolute inset-0 transition-opacity duration-300"
          style={{ opacity: 0.7 }}
        />
      )}

      {/* Floating particles */}
      <div className="absolute inset-0">
        {initialParticles.map((p, i) => (
          <div
            key={p.id}
            ref={(el) => { particleDotsRef.current[i] = el; }}
            className="absolute rounded-full"
            style={{
              width: `${p.size}px`,
              height: `${p.size}px`,
              background: `rgba(${colors.particle}, ${p.opacity})`,
              boxShadow: `0 0 ${p.size * 2}px rgba(${colors.particle}, ${p.opacity * 0.5})`,
              transform: `translate(${p.x}vw, ${p.y}vh)`,
              willChange: 'transform, opacity',
            }}
          />
        ))}
      </div>

      {/* Subtle scan line effect (presentation mode only) */}
      {variant === 'presentation' && (
        <motion.div
          className="absolute left-0 right-0 h-px"
          style={{
            background: `linear-gradient(90deg, transparent, rgba(201, 169, 110, 0.15), transparent)`,
          }}
          animate={{ top: ['-5%', '105%'] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        />
      )}

      {/* Corner accents */}
      <svg
        className="absolute top-4 left-4 w-8 h-8 opacity-20"
        viewBox="0 0 32 32"
        fill="none"
      >
        <path d="M0 12V0h12" stroke={`rgba(${colors.particle}, 0.5)`} strokeWidth="1" />
      </svg>
      <svg
        className="absolute top-4 right-4 w-8 h-8 opacity-20"
        viewBox="0 0 32 32"
        fill="none"
      >
        <path d="M32 12V0H20" stroke={`rgba(${colors.particle}, 0.5)`} strokeWidth="1" />
      </svg>
      <svg
        className="absolute bottom-4 left-4 w-8 h-8 opacity-20"
        viewBox="0 0 32 32"
        fill="none"
      >
        <path d="M0 20v12h12" stroke={`rgba(${colors.particle}, 0.5)`} strokeWidth="1" />
      </svg>
      <svg
        className="absolute bottom-4 right-4 w-8 h-8 opacity-20"
        viewBox="0 0 32 32"
        fill="none"
      >
        <path d="M32 20v12H20" stroke={`rgba(${colors.particle}, 0.5)`} strokeWidth="1" />
      </svg>
    </div>
  );
}
