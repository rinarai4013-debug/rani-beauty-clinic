// Gamification type definitions

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'revenue' | 'bookings' | 'reviews' | 'streaks' | 'operations' | 'sales' | 'finance';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  xpReward: number;
  soundEffect: SoundEvent;
  condition: (metrics: DailyMetrics) => boolean;
}

export interface EarnedAchievement {
  achievementId: string;
  dateEarned: string;
  metricsSnapshot: Partial<DailyMetrics>;
}

export interface Level {
  level: number;
  name: string;
  xpRequired: number;
  icon: string;
}

export interface BossLevel {
  id: string;
  name: string;
  target: number;
  reward: number;
  icon: string;
}

export interface GamificationData {
  clinicScore: number;
  scoreBreakdown: ScoreBreakdown;
  scoreStatus: ScoreStatus;
  streak: number;
  totalXP: number;
  currentLevel: Level;
  nextLevel: Level | null;
  xpToNextLevel: number;
  achievements: EarnedAchievement[];
  newAchievements: EarnedAchievement[];
  bossProgress: {
    current: BossLevel;
    progress: number; // 0-100
    currentRevenue: number;
  };
  winsToday: WinToday[];
}

export interface WinToday {
  id: string;
  type: string;
  label: string;
  emoji: string;
  timestamp: string;
}

export interface ScoreBreakdown {
  revenue: number;
  utilization: number;
  consultConversion: number;
  rebooks: number;
  reviews: number;
  followUps: number;
  operations: number;
}

export type ScoreStatus = 'critical' | 'growing' | 'strong' | 'elite';

export interface DailyMetrics {
  revenue: number;
  revenueTarget: number;
  bookedHours: number;
  availableHours: number;
  consultsClosed: number;
  consultsCompleted: number;
  patientsRebooked: number;
  patientsSeen: number;
  reviewsReceived: number;
  followUpsCompleted: number;
  followUpsDue: number;
  onTimeStarts: number;
  totalAppointments: number;
  noShows: number;
  cancellations: number;
}

export type SoundEvent =
  | 'booking'
  | 'payment'
  | 'review'
  | 'goal-hit'
  | 'level-up'
  | 'achievement'
  | 'streak'
  | 'error';

export interface LeaderboardEntry {
  name: string;
  role: string;
  avatar?: string;
  totalXP: number;
  level: Level;
  achievements: number;
  streak: number;
  weeklyScore: number;
}
