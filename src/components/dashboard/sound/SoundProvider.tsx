'use client';

import { createContext, useContext, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

type SoundName =
  | 'booking'    // New booking chime
  | 'payment'    // Payment received
  | 'review'     // New review sparkle
  | 'goal'       // Goal reached tone
  | 'levelup'    // Level up flourish
  | 'achievement' // Achievement unlock
  | 'streak'     // Streak maintained
  | 'click';     // Subtle UI click

interface SoundContextType {
  play: (_sound: SoundName) => void;
  muted: boolean;
  setMuted: (_muted: boolean) => void;
  volume: number;
  setVolume: (_volume: number) => void;
}

const SoundContext = createContext<SoundContextType>({
  play: () => {},
  muted: false,
  setMuted: () => {},
  volume: 0.3,
  setVolume: () => {},
});

export function useSoundContext() {
  return useContext(SoundContext);
}

// Web Audio API based sound synthesis (no external files needed)
function createOscillatorSound(
  audioCtx: AudioContext,
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume: number = 0.3,
  detune: number = 0,
) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = frequency;
  osc.detune.value = detune;
  gain.gain.setValueAtTime(volume, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

const SOUND_DEFINITIONS: Record<SoundName, (_ctx: AudioContext, _vol: number) => void> = {
  booking: (ctx, vol) => {
    createOscillatorSound(ctx, 523.25, 0.15, 'sine', vol); // C5
    setTimeout(() => createOscillatorSound(ctx, 659.25, 0.15, 'sine', vol), 100); // E5
    setTimeout(() => createOscillatorSound(ctx, 783.99, 0.25, 'sine', vol), 200); // G5
  },
  payment: (ctx, vol) => {
    createOscillatorSound(ctx, 440, 0.1, 'triangle', vol); // A4
    setTimeout(() => createOscillatorSound(ctx, 554.37, 0.1, 'triangle', vol), 80); // C#5
    setTimeout(() => createOscillatorSound(ctx, 659.25, 0.12, 'triangle', vol), 160); // E5
    setTimeout(() => createOscillatorSound(ctx, 880, 0.3, 'triangle', vol), 240); // A5
  },
  review: (ctx, vol) => {
    for (let i = 0; i < 5; i++) {
      setTimeout(() => createOscillatorSound(ctx, 1200 + i * 200, 0.08, 'sine', vol * 0.6), i * 60);
    }
  },
  goal: (ctx, vol) => {
    createOscillatorSound(ctx, 392, 0.2, 'square', vol * 0.5); // G4
    setTimeout(() => createOscillatorSound(ctx, 523.25, 0.2, 'square', vol * 0.5), 150); // C5
    setTimeout(() => createOscillatorSound(ctx, 659.25, 0.3, 'square', vol * 0.5), 300); // E5
    setTimeout(() => createOscillatorSound(ctx, 783.99, 0.4, 'square', vol * 0.5), 450); // G5
  },
  levelup: (ctx, vol) => {
    const notes = [523.25, 587.33, 659.25, 783.99, 880, 1046.5];
    notes.forEach((freq, i) => {
      setTimeout(() => createOscillatorSound(ctx, freq, 0.15, 'sine', vol), i * 80);
    });
  },
  achievement: (ctx, vol) => {
    createOscillatorSound(ctx, 659.25, 0.15, 'sine', vol); // E5
    setTimeout(() => createOscillatorSound(ctx, 783.99, 0.15, 'sine', vol), 120); // G5
    setTimeout(() => createOscillatorSound(ctx, 1046.5, 0.4, 'sine', vol), 240); // C6
    setTimeout(() => createOscillatorSound(ctx, 1046.5, 0.2, 'triangle', vol * 0.5, 5), 240); // shimmer
  },
  streak: (ctx, vol) => {
    createOscillatorSound(ctx, 440, 0.12, 'sine', vol);
    setTimeout(() => createOscillatorSound(ctx, 554.37, 0.12, 'sine', vol), 100);
    setTimeout(() => createOscillatorSound(ctx, 659.25, 0.2, 'sine', vol), 200);
  },
  click: (ctx, vol) => {
    createOscillatorSound(ctx, 800, 0.04, 'sine', vol * 0.4);
  },
};

export default function SoundProvider({ children }: { children: ReactNode }) {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.3);

  // Initialize AudioContext on first user interaction
  useEffect(() => {
    const initAudio = () => {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      document.removeEventListener('click', initAudio);
      document.removeEventListener('keydown', initAudio);
    };
    document.addEventListener('click', initAudio);
    document.addEventListener('keydown', initAudio);
    return () => {
      document.removeEventListener('click', initAudio);
      document.removeEventListener('keydown', initAudio);
    };
  }, []);

  // Load muted preference
  useEffect(() => {
    const saved = localStorage.getItem('rani-sound-muted');
    if (saved) setMuted(saved === 'true');
    const savedVol = localStorage.getItem('rani-sound-volume');
    if (savedVol) setVolume(parseFloat(savedVol));
  }, []);

  const handleSetMuted = useCallback((value: boolean) => {
    setMuted(value);
    localStorage.setItem('rani-sound-muted', String(value));
  }, []);

  const handleSetVolume = useCallback((value: number) => {
    setVolume(value);
    localStorage.setItem('rani-sound-volume', String(value));
  }, []);

  const play = useCallback((sound: SoundName) => {
    if (muted || !audioCtxRef.current) return;
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    const fn = SOUND_DEFINITIONS[sound];
    if (fn) fn(audioCtxRef.current, volume);
  }, [muted, volume]);

  return (
    <SoundContext.Provider value={{ play, muted, setMuted: handleSetMuted, volume, setVolume: handleSetVolume }}>
      {children}
    </SoundContext.Provider>
  );
}
