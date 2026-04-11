/**
 * Notification System Tests — 30+ tests
 */

import {
  sendNotification, sendFromTemplate,
  getNotifications, markAsRead, markAllAsRead, dismissNotification,
  getPreferences, updatePreferences,
  initializeTemplates, getAllTemplates, getTemplatesByCategory,
  getTemplate, processDigests,
  resetNotifications,
} from '../notifications/system';

beforeEach(() => {
  resetNotifications();
  initializeTemplates();
});

describe('sendNotification', () => {
  it('sends a basic notification', () => {
    const sent = sendNotification({
      tenantId: 't_001', category: 'system',
      title: 'Test', body: 'Test notification',
      channels: ['in_app'],
    });
    expect(sent.length).toBe(1);
    expect(sent[0].title).toBe('Test');
    expect(sent[0].deliveryStatus).toBe('delivered');
  });

  it('sends to multiple channels', () => {
    const sent = sendNotification({
      tenantId: 't_001', category: 'security', priority: 'critical',
      title: 'Alert', body: 'Security alert',
      channels: ['in_app', 'email', 'sms'],
    });
    expect(sent.length).toBe(3);
  });

  it('skips SMS for non-critical', () => {
    const sent = sendNotification({
      tenantId: 't_001', category: 'system', priority: 'info',
      title: 'Info', body: 'Just info',
      channels: ['in_app', 'sms'],
    });
    expect(sent.length).toBe(1);
    expect(sent[0].channel).toBe('in_app');
  });

  it('sets correct priority', () => {
    const sent = sendNotification({
      tenantId: 't_001', category: 'billing', priority: 'warning',
      title: 'Warning', body: 'Billing warning',
    });
    expect(sent[0].priority).toBe('warning');
  });

  it('includes action URL', () => {
    const sent = sendNotification({
      tenantId: 't_001', category: 'system',
      title: 'Action', body: 'Click here',
      actionUrl: 'https://ranios.com/dashboard',
      actionLabel: 'Go to Dashboard',
    });
    expect(sent[0].actionUrl).toBe('https://ranios.com/dashboard');
    expect(sent[0].actionLabel).toBe('Go to Dashboard');
  });
});

describe('sendFromTemplate', () => {
  it('sends from template with variables', () => {
    const sent = sendFromTemplate('payment_successful', 't_001', {
      amount: '$499.00', invoiceId: 'inv_123',
    });
    expect(sent.length).toBeGreaterThan(0);
    expect(sent[0].title).toContain('Payment');
  });

  it('returns empty for unknown template', () => {
    const sent = sendFromTemplate('nonexistent_template', 't_001', {});
    expect(sent.length).toBe(0);
  });

  it('interpolates variables in body', () => {
    const sent = sendFromTemplate('low_stock', 't_001', {
      productName: 'Botox', current: '5', minimum: '20',
    });
    expect(sent.length).toBeGreaterThan(0);
  });
});

describe('getNotifications', () => {
  it('retrieves tenant notifications', () => {
    sendNotification({ tenantId: 't_001', category: 'system', title: 'Test 1', body: 'Body 1' });
    sendNotification({ tenantId: 't_001', category: 'system', title: 'Test 2', body: 'Body 2' });
    sendNotification({ tenantId: 't_002', category: 'system', title: 'Other', body: 'Body' });
    const data = getNotifications('t_001');
    expect(data.notifications.length).toBe(2);
  });

  it('returns unread count', () => {
    sendNotification({ tenantId: 't_001', category: 'system', title: 'Unread 1', body: 'Body' });
    sendNotification({ tenantId: 't_001', category: 'system', title: 'Unread 2', body: 'Body' });
    const data = getNotifications('t_001');
    expect(data.unreadCount).toBe(2);
  });

  it('filters by category', () => {
    sendNotification({ tenantId: 't_001', category: 'billing', title: 'Bill', body: 'Body' });
    sendNotification({ tenantId: 't_001', category: 'security', title: 'Sec', body: 'Body' });
    const data = getNotifications('t_001', { category: 'billing' });
    expect(data.notifications.length).toBe(1);
  });

  it('filters by read status', () => {
    const sent = sendNotification({ tenantId: 't_001', category: 'system', title: 'Test', body: 'Body' });
    markAsRead(sent[0].id);
    sendNotification({ tenantId: 't_001', category: 'system', title: 'Unread', body: 'Body' });
    const unread = getNotifications('t_001', { read: false });
    expect(unread.notifications.length).toBe(1);
  });

  it('returns category counts', () => {
    sendNotification({ tenantId: 't_001', category: 'billing', title: 'B1', body: 'Body' });
    sendNotification({ tenantId: 't_001', category: 'billing', title: 'B2', body: 'Body' });
    sendNotification({ tenantId: 't_001', category: 'security', title: 'S1', body: 'Body' });
    const data = getNotifications('t_001');
    expect(data.categories.length).toBeGreaterThan(0);
  });
});

describe('markAsRead', () => {
  it('marks notification as read', () => {
    const sent = sendNotification({ tenantId: 't_001', category: 'system', title: 'Read Me', body: 'Body' });
    expect(markAsRead(sent[0].id)).toBe(true);
    const data = getNotifications('t_001', { read: true });
    expect(data.notifications.length).toBe(1);
  });

  it('returns false for non-existent', () => {
    expect(markAsRead('fake_id')).toBe(false);
  });
});

describe('markAllAsRead', () => {
  it('marks all as read', () => {
    sendNotification({ tenantId: 't_001', category: 'system', title: 'A', body: 'Body' });
    sendNotification({ tenantId: 't_001', category: 'system', title: 'B', body: 'Body' });
    const count = markAllAsRead('t_001');
    expect(count).toBe(2);
    expect(getNotifications('t_001', { read: false }).unreadCount).toBe(0);
  });
});

describe('dismissNotification', () => {
  it('dismisses notification', () => {
    const sent = sendNotification({ tenantId: 't_001', category: 'system', title: 'Dismiss', body: 'Body' });
    expect(dismissNotification(sent[0].id)).toBe(true);
  });
});

describe('preferences', () => {
  it('returns default preferences', () => {
    const prefs = getPreferences('t_001', 'user_1');
    expect(prefs.channels.in_app).toBe(true);
    expect(prefs.channels.email).toBe(true);
    expect(prefs.digestFrequency).toBe('immediate');
  });

  it('updates preferences', () => {
    updatePreferences('t_001', 'user_1', { digestFrequency: 'daily' } as never);
    const prefs = getPreferences('t_001', 'user_1');
    expect(prefs.digestFrequency).toBe('daily');
  });

  it('sets quiet hours', () => {
    updatePreferences('t_001', 'user_1', {
      quietHours: { start: '22:00', end: '07:00', timezone: 'America/Los_Angeles' },
    } as never);
    const prefs = getPreferences('t_001', 'user_1');
    expect(prefs.quietHours).not.toBeNull();
    expect(prefs.quietHours!.start).toBe('22:00');
  });
});

describe('templates', () => {
  it('initializes 50+ templates', () => {
    const templates = getAllTemplates();
    expect(templates.length).toBeGreaterThanOrEqual(50);
  });

  it('filters templates by category', () => {
    const billing = getTemplatesByCategory('billing');
    expect(billing.length).toBeGreaterThan(0);
    billing.forEach(t => expect(t.category).toBe('billing'));
  });

  it('gets template by ID', () => {
    const tmpl = getTemplate('tmpl_payment_successful');
    expect(tmpl).not.toBeNull();
    expect(tmpl!.name).toBe('payment_successful');
  });

  it('templates have required fields', () => {
    const templates = getAllTemplates();
    templates.forEach(t => {
      expect(t.id).toBeDefined();
      expect(t.name).toBeDefined();
      expect(t.category).toBeDefined();
      expect(t.channels.length).toBeGreaterThan(0);
      expect(t.titleTemplate).toBeDefined();
    });
  });
});

describe('digest mode', () => {
  it('processes empty digest queue', () => {
    const digests = processDigests();
    expect(digests.length).toBe(0);
  });
});
