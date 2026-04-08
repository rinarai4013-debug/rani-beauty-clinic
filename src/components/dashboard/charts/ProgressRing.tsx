'use client';

type ProgressRingProps = {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  showLabel?: boolean;
};

export default function ProgressRing({
  value,
  size = 96,
  strokeWidth = 10,
  color = '#C9A96E',
  trackColor = 'rgba(15, 29, 44, 0.12)',
  showLabel = true,
}: ProgressRingProps) {
  const normalizedValue = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (normalizedValue / 100) * circumference;
  const center = size / 2;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-rani-navy">
          {Math.round(normalizedValue)}%
        </div>
      )}
    </div>
  );
}
