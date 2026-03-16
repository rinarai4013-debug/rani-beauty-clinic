import type { Level } from '@/types/gamification';

export const LEVELS: Level[] = [
  { level: 1, name: 'New Glow', xpRequired: 0, icon: '✨' },
  { level: 2, name: 'Rising Star', xpRequired: 500, icon: '⭐' },
  { level: 3, name: 'Glow Getter', xpRequired: 1500, icon: '🌟' },
  { level: 4, name: 'Beauty Boss', xpRequired: 3500, icon: '💄' },
  { level: 5, name: 'Clinic Queen', xpRequired: 7000, icon: '👑' },
  { level: 6, name: 'Revenue Royalty', xpRequired: 12000, icon: '💰' },
  { level: 7, name: 'Legendary Aura', xpRequired: 20000, icon: '🔮' },
  { level: 8, name: 'Diamond Crown', xpRequired: 35000, icon: '💎' },
  { level: 9, name: 'Empire Builder', xpRequired: 60000, icon: '🏰' },
  { level: 10, name: 'Rani Supreme', xpRequired: 100000, icon: '🌙' },
];

export function getCurrentLevel(totalXP: number): Level {
  let current = LEVELS[0];
  for (const level of LEVELS) {
    if (totalXP >= level.xpRequired) {
      current = level;
    } else {
      break;
    }
  }
  return current;
}

export function getNextLevel(totalXP: number): Level | null {
  for (const level of LEVELS) {
    if (totalXP < level.xpRequired) {
      return level;
    }
  }
  return null; // max level reached
}

export function getXPToNextLevel(totalXP: number): number {
  const next = getNextLevel(totalXP);
  if (!next) return 0;
  return next.xpRequired - totalXP;
}

export function getLevelProgress(totalXP: number): number {
  const current = getCurrentLevel(totalXP);
  const next = getNextLevel(totalXP);
  if (!next) return 100;
  const rangeXP = next.xpRequired - current.xpRequired;
  const progressXP = totalXP - current.xpRequired;
  return Math.round((progressXP / rangeXP) * 100);
}
