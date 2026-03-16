import { useSoundContext } from '@/components/dashboard/sound/SoundProvider';

export function useSound() {
  const { play, muted, setMuted, volume, setVolume } = useSoundContext();
  return { play, muted, setMuted, volume, setVolume };
}
