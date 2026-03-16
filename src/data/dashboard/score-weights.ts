// Daily clinic score calculation weights (must sum to 1.0)

export const SCORE_WEIGHTS = {
  revenue: 0.30,
  utilization: 0.15,
  consultConversion: 0.15,
  rebooks: 0.10,
  reviews: 0.10,
  followUps: 0.10,
  operations: 0.10,
} as const;

// Revenue targets
export const TARGETS = {
  dailyRevenue: 4000, // ~$120K/month target ÷ 30 days
  weeklyRevenue: 23000,
  monthlyRevenue: 100000,
  consultCloseRate: 60, // %
  showRate: 85, // %
  rebookRate: 70, // %
  utilizationRate: 80, // %
  reviewsPerDay: 1,
} as const;
