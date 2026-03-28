'use client';

interface EngagementScoreProps {
  score: number;
  breakdown: Record<string, number>;
  trend: 'improving' | 'stable' | 'declining';
  size?: 'sm' | 'md' | 'lg';
}

const FACTOR_LABELS: Record<string, string> = {
  creditUsage: 'Credit Usage',
  visitFrequency: 'Visit Frequency',
  recency: 'Recency',
  addOns: 'Add-On Purchases',
  social: 'Social Engagement',
  tenure: 'Tenure',
};

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-600';
  if (score >= 60) return 'text-blue-600';
  if (score >= 40) return 'text-amber-600';
  return 'text-red-600';
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  if (score >= 20) return 'Low';
  return 'Critical';
}

export default function EngagementScore({ score, breakdown, trend, size = 'md' }: EngagementScoreProps) {
  const radius = size === 'lg' ? 50 : size === 'md' ? 40 : 30;
  const stroke = size === 'lg' ? 8 : size === 'md' ? 6 : 4;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="bg-white rounded-xl border border-rani-border p-4 sm:p-6">
      <h3 className="text-sm font-heading font-semibold text-rani-navy mb-4">Engagement Score</h3>

      <div className="flex items-center gap-6">
        {/* Circular score */}
        <div className="relative flex-shrink-0">
          <svg width={(radius + stroke) * 2} height={(radius + stroke) * 2}>
            <circle
              cx={radius + stroke}
              cy={radius + stroke}
              r={radius}
              fill="none"
              stroke="#F3F4F6"
              strokeWidth={stroke}
            />
            <circle
              cx={radius + stroke}
              cy={radius + stroke}
              r={radius}
              fill="none"
              stroke={score >= 80 ? '#10B981' : score >= 60 ? '#3B82F6' : score >= 40 ? '#F59E0B' : '#EF4444'}
              strokeWidth={stroke}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              transform={`rotate(-90 ${radius + stroke} ${radius + stroke})`}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-xl font-heading font-bold ${getScoreColor(score)}`}>{score}</span>
            <span className="text-[9px] font-body text-rani-muted">{getScoreLabel(score)}</span>
          </div>
        </div>

        {/* Breakdown bars */}
        <div className="flex-1 space-y-2">
          {Object.entries(breakdown).map(([key, value]) => (
            <div key={key} className="space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-body text-rani-muted">{FACTOR_LABELS[key] || key}</span>
                <span className="text-[10px] font-body font-medium text-rani-navy">{value}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1">
                <div
                  className={`h-1 rounded-full transition-all ${
                    value >= 80 ? 'bg-emerald-500' : value >= 60 ? 'bg-blue-500' : value >= 40 ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(value, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trend */}
      <div className="mt-4 pt-3 border-t border-rani-border flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${
          trend === 'improving' ? 'bg-emerald-500' : trend === 'stable' ? 'bg-blue-500' : 'bg-red-500'
        }`} />
        <span className="text-xs font-body text-rani-muted capitalize">{trend} trend</span>
      </div>
    </div>
  );
}
