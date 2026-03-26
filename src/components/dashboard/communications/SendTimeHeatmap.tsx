'use client';

import type { SendTimeSlot } from '@/types/communications';

interface SendTimeHeatmapProps {
  data: SendTimeSlot[];
  className?: string;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function getColor(score: number): string {
  if (score === 0) return 'bg-gray-50';
  if (score < 20) return 'bg-emerald-50';
  if (score < 40) return 'bg-emerald-100';
  if (score < 60) return 'bg-emerald-200';
  if (score < 80) return 'bg-emerald-300';
  return 'bg-emerald-500';
}

function getTextColor(score: number): string {
  if (score >= 80) return 'text-white';
  if (score >= 40) return 'text-emerald-900';
  return 'text-gray-400';
}

function formatHour(hour: number): string {
  if (hour === 0) return '12a';
  if (hour < 12) return `${hour}a`;
  if (hour === 12) return '12p';
  return `${hour - 12}p`;
}

export default function SendTimeHeatmap({ data, className = '' }: SendTimeHeatmapProps) {
  const slotMap = new Map<string, SendTimeSlot>();
  for (const slot of data) {
    slotMap.set(`${slot.day}-${slot.hour}`, slot);
  }

  // Find best slot
  const bestSlot = data.reduce(
    (best, slot) => (slot.engagementScore > best.engagementScore ? slot : best),
    { day: 0, hour: 0, engagementScore: 0, sampleSize: 0 }
  );

  // Only show business hours (6am - 10pm)
  const displayHours = HOURS.filter(h => h >= 6 && h <= 22);

  return (
    <div className={`bg-white rounded-xl border border-rani-border p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-body font-semibold text-rani-navy">Best Send Times</h3>
          <p className="text-[11px] font-body text-rani-muted">
            Engagement score by day and hour (PST)
          </p>
        </div>
        {bestSlot.engagementScore > 0 && (
          <div className="text-right">
            <span className="text-[10px] font-body text-rani-muted">Peak Engagement</span>
            <p className="text-xs font-body font-semibold text-rani-navy">
              {DAYS[bestSlot.day]} at {formatHour(bestSlot.hour)} ({bestSlot.engagementScore}%)
            </p>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Hour Headers */}
          <div className="flex items-center mb-1">
            <div className="w-10" />
            {displayHours.map(hour => (
              <div
                key={hour}
                className="flex-1 text-center text-[9px] font-body text-rani-muted"
              >
                {formatHour(hour)}
              </div>
            ))}
          </div>

          {/* Day Rows */}
          {DAYS.map((day, dayIndex) => (
            <div key={day} className="flex items-center mb-0.5">
              <div className="w-10 text-[10px] font-body font-medium text-rani-muted pr-2 text-right">
                {day}
              </div>
              {displayHours.map(hour => {
                const slot = slotMap.get(`${dayIndex}-${hour}`);
                const score = slot?.engagementScore ?? 0;
                const isBest = dayIndex === bestSlot.day && hour === bestSlot.hour && score > 0;

                return (
                  <div
                    key={hour}
                    className={`
                      flex-1 aspect-square max-w-[28px] rounded-sm mx-[1px]
                      flex items-center justify-center
                      ${getColor(score)}
                      ${isBest ? 'ring-2 ring-rani-gold ring-offset-1' : ''}
                      transition-colors cursor-default
                    `}
                    title={`${day} ${formatHour(hour)}: ${score}% engagement (${slot?.sampleSize ?? 0} messages)`}
                  >
                    {score > 0 && (
                      <span className={`text-[7px] font-body font-bold ${getTextColor(score)}`}>
                        {score}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}

          {/* Legend */}
          <div className="flex items-center justify-end gap-1 mt-3">
            <span className="text-[9px] font-body text-rani-muted mr-1">Low</span>
            {[0, 20, 40, 60, 80].map(score => (
              <div
                key={score}
                className={`w-4 h-4 rounded-sm ${getColor(score)}`}
                title={`${score}%`}
              />
            ))}
            <span className="text-[9px] font-body text-rani-muted ml-1">High</span>
          </div>
        </div>
      </div>
    </div>
  );
}
