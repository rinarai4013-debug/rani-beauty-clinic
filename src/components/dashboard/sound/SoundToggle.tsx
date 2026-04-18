'use client';

import { Volume2, VolumeX } from 'lucide-react';
import { useSoundContext } from './SoundProvider';

export default function SoundToggle() {
  const { muted, setMuted, play } = useSoundContext();

  return (
    <button
      onClick={() => {
        setMuted(!muted);
        if (muted) play('click');
      }}
      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
        muted ? 'text-rani-muted hover:text-rani-text' : 'text-rani-gold-accessible hover:text-rani-gold/80'
      }`}
      title={muted ? 'Unmute sounds' : 'Mute sounds'}
    >
      {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
    </button>
  );
}
