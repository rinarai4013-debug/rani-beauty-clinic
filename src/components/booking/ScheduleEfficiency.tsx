'use client';

interface ScheduleEfficiencyProps {
  score: number;
  utilizationPercent: number;
  revenuePerHour: number;
  gapCount: number;
  totalGapMinutes: number;
  providerBalance: number;
  recommendations: string[];
}

export default function ScheduleEfficiency({
  score,
  utilizationPercent,
  revenuePerHour,
  gapCount,
  totalGapMinutes,
  providerBalance,
  recommendations,
}: ScheduleEfficiencyProps) {
  const getScoreColor = (s: number) => {
    if (s >= 80) return 'text-green-600';
    if (s >= 60) return 'text-[#C9A96E]';
    if (s >= 40) return 'text-amber-500';
    return 'text-red-500';
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E8E4DF] p-6">
      <h3 className="text-lg font-semibold text-[#0F1D2C] font-[family-name:var(--font-heading)] mb-4">
        Schedule Efficiency
      </h3>

      {/* Score */}
      <div className="text-center mb-6">
        <p className={`text-5xl font-bold ${getScoreColor(score)}`}>{score}</p>
        <p className="text-sm text-[#6B7280] mt-1">Efficiency Score</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <MetricCard label="Utilization" value={`${utilizationPercent}%`} />
        <MetricCard label="Revenue/Hour" value={`$${revenuePerHour}`} />
        <MetricCard label="Schedule Gaps" value={`${gapCount}`} sublabel={`${totalGapMinutes} min total`} />
        <MetricCard label="Provider Balance" value={`${providerBalance}%`} />
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-[#0F1D2C]">Recommendations</p>
          {recommendations.map((rec, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-[#6B7280]">
              <span className="text-[#C9A96E] mt-0.5">&#8226;</span>
              {rec}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, sublabel }: { label: string; value: string; sublabel?: string }) {
  return (
    <div className="bg-[#F8F6F1] rounded-xl p-4">
      <p className="text-xs text-[#6B7280]">{label}</p>
      <p className="text-xl font-bold text-[#0F1D2C]">{value}</p>
      {sublabel && <p className="text-xs text-[#6B7280]">{sublabel}</p>}
    </div>
  );
}
