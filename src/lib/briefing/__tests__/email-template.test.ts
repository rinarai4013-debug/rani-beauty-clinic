import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatCurrencyDetailed,
  formatPercent,
  formatNumber,
  briefingLayout,
  section,
  kpiRow,
  dataTable,
  alertBadge,
  actionItemRow,
  quickLinksBar,
  calloutBox,
  emptyState,
  generatePlainText,
} from '../email-template';

// ── Formatting helpers ───────────────────────────────────────

describe('formatCurrency', () => {
  it('should format positive numbers', () => {
    expect(formatCurrency(5250)).toBe('$5,250');
  });

  it('should format zero', () => {
    expect(formatCurrency(0)).toBe('$0');
  });

  it('should format large numbers', () => {
    expect(formatCurrency(128500)).toBe('$128,500');
  });

  it('should round to whole numbers', () => {
    expect(formatCurrency(5250.75)).toBe('$5,251');
  });
});

describe('formatCurrencyDetailed', () => {
  it('should include cents', () => {
    expect(formatCurrencyDetailed(656.25)).toBe('$656.25');
  });

  it('should format zero', () => {
    expect(formatCurrencyDetailed(0)).toBe('$0.00');
  });
});

describe('formatPercent', () => {
  it('should format positive with plus sign', () => {
    expect(formatPercent(16.1)).toBe('+16.1%');
  });

  it('should format negative with minus', () => {
    expect(formatPercent(-8.5)).toBe('-8.5%');
  });

  it('should format zero with plus', () => {
    expect(formatPercent(0)).toBe('+0.0%');
  });
});

describe('formatNumber', () => {
  it('should add commas', () => {
    expect(formatNumber(1234567)).toBe('1,234,567');
  });

  it('should handle small numbers', () => {
    expect(formatNumber(42)).toBe('42');
  });
});

// ── Layout ───────────────────────────────────────────────────

describe('briefingLayout', () => {
  it('should wrap content in valid HTML', () => {
    const html = briefingLayout('<p>Test</p>', 'preview text', 'Test Title', 'Test Subtitle');
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('</html>');
  });

  it('should include title', () => {
    const html = briefingLayout('<p>Test</p>', '', 'My Title', '');
    expect(html).toContain('My Title');
  });

  it('should include subtitle', () => {
    const html = briefingLayout('<p>Test</p>', '', '', 'My Subtitle');
    expect(html).toContain('My Subtitle');
  });

  it('should include preheader text', () => {
    const html = briefingLayout('<p>Test</p>', 'Secret preview', '', '');
    expect(html).toContain('Secret preview');
  });

  it('should include RANI branding', () => {
    const html = briefingLayout('<p>Test</p>', '', '', '');
    expect(html).toContain('RANI');
    expect(html).toContain('BEAUTY CLINIC');
  });

  it('should include navy header', () => {
    const html = briefingLayout('<p>Test</p>', '', '', '');
    expect(html).toContain('#0F1D2C');
  });

  it('should include gold accent line', () => {
    const html = briefingLayout('<p>Test</p>', '', '', '');
    expect(html).toContain('#C9A96E');
  });

  it('should include footer', () => {
    const html = briefingLayout('<p>Test</p>', '', '', '');
    expect(html).toContain('RaniOS Intelligence');
    expect(html).toContain('401 Olympia Ave NE');
  });

  it('should include body content', () => {
    const html = briefingLayout('<p>My body content here</p>', '', '', '');
    expect(html).toContain('My body content here');
  });

  it('should be responsive', () => {
    const html = briefingLayout('<p>Test</p>', '', '', '');
    expect(html).toContain('max-width: 640px');
    expect(html).toContain('@media screen');
  });
});

// ── Section builders ─────────────────────────────────────────

describe('section', () => {
  it('should include title', () => {
    const html = section('My Section', '<p>Content</p>');
    expect(html).toContain('My Section');
  });

  it('should include content', () => {
    const html = section('Title', '<p>Section body</p>');
    expect(html).toContain('Section body');
  });

  it('should include icon when provided', () => {
    const html = section('Title', '<p>Content</p>', '&#128200;');
    expect(html).toContain('&#128200;');
  });

  it('should use gold color for title', () => {
    const html = section('Title', '<p>Content</p>');
    expect(html).toContain('#C9A96E');
  });
});

describe('kpiRow', () => {
  it('should render KPIs', () => {
    const html = kpiRow([
      { label: 'Revenue', value: '$5,000' },
      { label: 'Tickets', value: '12' },
    ]);
    expect(html).toContain('Revenue');
    expect(html).toContain('$5,000');
    expect(html).toContain('Tickets');
    expect(html).toContain('12');
  });

  it('should show change indicator', () => {
    const html = kpiRow([{ label: 'Growth', value: '16%', change: 16 }]);
    expect(html).toContain('#22C55E'); // green for positive
    expect(html).toContain('+16.0%');
  });

  it('should show negative change in red', () => {
    const html = kpiRow([{ label: 'Decline', value: '-8%', change: -8 }]);
    expect(html).toContain('#EF4444');
  });

  it('should include sublabel', () => {
    const html = kpiRow([{ label: 'Revenue', value: '$5K', sublabel: '8 transactions' }]);
    expect(html).toContain('8 transactions');
  });
});

describe('dataTable', () => {
  it('should render headers', () => {
    const html = dataTable(['Name', 'Value'], []);
    expect(html).toContain('Name');
    expect(html).toContain('Value');
  });

  it('should render rows', () => {
    const html = dataTable(['Name', 'Amount'], [['Sofwave', '$2,750'], ['HydraFacial', '$275']]);
    expect(html).toContain('Sofwave');
    expect(html).toContain('$2,750');
    expect(html).toContain('HydraFacial');
  });

  it('should alternate row colors', () => {
    const html = dataTable(['A'], [['Row1'], ['Row2']]);
    expect(html).toContain('#FFFFFF'); // white
    expect(html).toContain('#F8F6F1'); // cream
  });
});

describe('alertBadge', () => {
  it('should use red for critical', () => {
    const html = alertBadge('critical', 'CRITICAL');
    expect(html).toContain('#EF4444');
    expect(html).toContain('CRITICAL');
  });

  it('should use yellow for warning', () => {
    const html = alertBadge('warning', 'WARNING');
    expect(html).toContain('#F59E0B');
  });

  it('should use blue for info', () => {
    const html = alertBadge('info', 'INFO');
    expect(html).toContain('#3B82F6');
  });
});

describe('actionItemRow', () => {
  it('should include action text', () => {
    const html = actionItemRow('high', 'Do something', 'Because reasons');
    expect(html).toContain('Do something');
    expect(html).toContain('Because reasons');
  });

  it('should use red dot for high priority', () => {
    const html = actionItemRow('high', 'Action', 'Reason');
    expect(html).toContain('#EF4444');
  });

  it('should use yellow dot for medium priority', () => {
    const html = actionItemRow('medium', 'Action', 'Reason');
    expect(html).toContain('#F59E0B');
  });

  it('should use blue dot for low priority', () => {
    const html = actionItemRow('low', 'Action', 'Reason');
    expect(html).toContain('#3B82F6');
  });
});

describe('quickLinksBar', () => {
  it('should include all links', () => {
    const html = quickLinksBar([
      { text: 'Dashboard', url: 'https://example.com/dash' },
      { text: 'Bookings', url: 'https://example.com/book' },
    ]);
    expect(html).toContain('Dashboard');
    expect(html).toContain('https://example.com/dash');
    expect(html).toContain('Bookings');
    expect(html).toContain('https://example.com/book');
  });

  it('should include Quick Links header', () => {
    const html = quickLinksBar([]);
    expect(html).toContain('Quick Links');
  });
});

describe('calloutBox', () => {
  it('should render success variant', () => {
    const html = calloutBox('Good news!', 'success');
    expect(html).toContain('Good news!');
    expect(html).toContain('#F0FDF4');
  });

  it('should render warning variant', () => {
    const html = calloutBox('Be careful', 'warning');
    expect(html).toContain('#FFFBEB');
  });

  it('should render info variant', () => {
    const html = calloutBox('FYI', 'info');
    expect(html).toContain('#EFF6FF');
  });

  it('should default to gold variant', () => {
    const html = calloutBox('Default box');
    expect(html).toContain('#FDF8F0');
  });
});

describe('emptyState', () => {
  it('should render message', () => {
    const html = emptyState('Nothing to show');
    expect(html).toContain('Nothing to show');
  });

  it('should be centered', () => {
    const html = emptyState('Test');
    expect(html).toContain('text-align: center');
  });
});

describe('generatePlainText', () => {
  it('should strip HTML tags', () => {
    const text = generatePlainText('<p>Hello <strong>world</strong></p>');
    expect(text).toContain('Hello');
    expect(text).toContain('world');
    expect(text).not.toContain('<p>');
    expect(text).not.toContain('<strong>');
  });

  it('should preserve link URLs', () => {
    const text = generatePlainText('<a href="https://example.com">Click here</a>');
    expect(text).toContain('https://example.com');
    expect(text).toContain('Click here');
  });

  it('should handle empty input', () => {
    const text = generatePlainText('');
    expect(text).toBe('');
  });
});
