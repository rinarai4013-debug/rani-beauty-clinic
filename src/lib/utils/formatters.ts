// Currency, percentage, date, and number formatters

export function formatCurrency(amount: number, compact = false): string {
  if (compact && Math.abs(amount) >= 1000) {
    const k = amount / 1000;
    return `$${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}K`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

export function formatPercent(value: number, decimals = 0): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatNumber(value: number, compact = false): string {
  if (compact && Math.abs(value) >= 1000) {
    const k = value / 1000;
    return `${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}K`;
  }
  return new Intl.NumberFormat('en-US').format(value);
}

export function formatTime(minutes: number): string {
  if (minutes < 60) return `${minutes}min`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}

export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatDate(dateStr: string, format: 'short' | 'medium' | 'long' = 'medium'): string {
  const date = new Date(dateStr);
  const options: Intl.DateTimeFormatOptions =
    format === 'short'
      ? { month: 'numeric', day: 'numeric' }
      : format === 'medium'
        ? { month: 'short', day: 'numeric', year: 'numeric' }
        : { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

export function formatTimeOfDay(time24: string): string {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`;
}

// Trend direction helper
export function getTrend(current: number, previous: number): { value: number; direction: 'up' | 'down' | 'flat' } {
  if (previous === 0) return { value: 0, direction: 'flat' };
  const pctChange = ((current - previous) / previous) * 100;
  return {
    value: Math.abs(pctChange),
    direction: pctChange > 0.5 ? 'up' : pctChange < -0.5 ? 'down' : 'flat',
  };
}

// Score status color helper
export function getScoreColor(score: number): string {
  // Aligned with mangomint-intelligence.ts clinic score thresholds
  if (score >= 85) return '#F3D6BE'; // elite gold
  if (score >= 70) return '#059669'; // green
  if (score >= 50) return '#F59E0B'; // amber
  return '#EF4444'; // red
}

export function getScoreStatus(score: number): 'critical' | 'growing' | 'strong' | 'elite' {
  // Aligned with mangomint-intelligence.ts clinic score thresholds
  if (score >= 85) return 'elite';
  if (score >= 70) return 'strong';
  if (score >= 50) return 'growing';
  return 'critical';
}

export function getScoreLabel(status: 'critical' | 'growing' | 'strong' | 'elite'): string {
  switch (status) {
    case 'elite': return 'Elite Mode';
    case 'strong': return 'Strong';
    case 'growing': return 'Growing';
    case 'critical': return 'Needs Attention';
  }
}
