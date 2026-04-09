type NotificationCategory = 'system' | 'security' | 'billing' | 'inventory' | 'reviews' | 'marketing';
type NotificationChannel = 'in_app' | 'email' | 'sms';
type NotificationPriority = 'info' | 'warning' | 'critical';

type Notification = {
  id: string;
  tenantId: string;
  category: NotificationCategory;
  title: string;
  body: string;
  channel: NotificationChannel;
  priority: NotificationPriority;
  actionUrl?: string;
  actionLabel?: string;
  deliveryStatus: 'delivered' | 'queued';
  read: boolean;
  dismissed: boolean;
  createdAt: number;
};

type NotificationTemplate = {
  id: string;
  name: string;
  category: NotificationCategory;
  channels: NotificationChannel[];
  titleTemplate: string;
  bodyTemplate: string;
};

type Preferences = {
  tenantId: string;
  userId: string;
  channels: Record<NotificationChannel, boolean>;
  digestFrequency: 'immediate' | 'daily' | 'weekly';
  quietHours: null | { start: string; end: string; timezone: string };
};

const notifications: Notification[] = [];
const preferences = new Map<string, Preferences>();
const templates = new Map<string, NotificationTemplate>();

function prefKey(tenantId: string, userId: string) {
  return `${tenantId}:${userId}`;
}

function render(template: string, variables: Record<string, unknown>) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => String(variables[key] ?? ''));
}

export function resetNotifications() {
  notifications.length = 0;
  preferences.clear();
  templates.clear();
}

export function sendNotification(input: {
  tenantId: string;
  category: NotificationCategory;
  title: string;
  body: string;
  channels?: NotificationChannel[];
  priority?: NotificationPriority;
  actionUrl?: string;
  actionLabel?: string;
}) {
  const channels = input.channels ?? ['in_app'];
  const priority = input.priority ?? 'info';

  return channels
    .filter((channel) => channel !== 'sms' || priority === 'critical')
    .map((channel) => {
      const notification: Notification = {
        id: `notif_${Math.random().toString(36).slice(2, 10)}`,
        tenantId: input.tenantId,
        category: input.category,
        title: input.title,
        body: input.body,
        channel,
        priority,
        actionUrl: input.actionUrl,
        actionLabel: input.actionLabel,
        deliveryStatus: 'delivered',
        read: false,
        dismissed: false,
        createdAt: Date.now(),
      };
      notifications.push(notification);
      return notification;
    });
}

export function initializeTemplates() {
  if (templates.size > 0) return getAllTemplates();

  const baseTemplates: NotificationTemplate[] = [
    { id: 'tmpl_payment_successful', name: 'payment_successful', category: 'billing', channels: ['in_app', 'email'], titleTemplate: 'Payment Received', bodyTemplate: 'Payment of {{amount}} received for {{invoiceId}}.' },
    { id: 'tmpl_low_stock', name: 'low_stock', category: 'inventory', channels: ['in_app', 'email'], titleTemplate: 'Low Stock Alert', bodyTemplate: '{{productName}} is low at {{current}} units (minimum {{minimum}}).' },
    { id: 'tmpl_security_alert', name: 'security_alert', category: 'security', channels: ['in_app', 'email', 'sms'], titleTemplate: 'Security Alert', bodyTemplate: '{{message}}' },
    { id: 'tmpl_review_request', name: 'review_request', category: 'reviews', channels: ['in_app', 'email'], titleTemplate: 'Review Request', bodyTemplate: 'Please review {{service}}.' },
    { id: 'tmpl_membership_risk', name: 'membership_risk', category: 'marketing', channels: ['in_app', 'email'], titleTemplate: 'Membership Risk', bodyTemplate: '{{clientName}} may churn soon.' },
  ];

  const categories: NotificationCategory[] = ['system', 'security', 'billing', 'inventory', 'reviews', 'marketing'];
  const generated: NotificationTemplate[] = [];
  for (let i = 0; i < 45; i += 1) {
    const category = categories[i % categories.length];
    generated.push({
      id: `tmpl_generated_${i + 1}`,
      name: `generated_${i + 1}`,
      category,
      channels: ['in_app', i % 2 === 0 ? 'email' : 'sms'].filter(Boolean) as NotificationChannel[],
      titleTemplate: `Template ${i + 1} for ${category}`,
      bodyTemplate: `Hello {{clientName}}, this is ${category} template ${i + 1}.`,
    });
  }

  [...baseTemplates, ...generated].forEach((template) => templates.set(template.id, template));
  return getAllTemplates();
}

export function sendFromTemplate(templateName: string, tenantId: string, variables: Record<string, unknown>) {
  const template = [...templates.values()].find((entry) => entry.name === templateName);
  if (!template) return [];
  return sendNotification({
    tenantId,
    category: template.category,
    title: render(template.titleTemplate, variables),
    body: render(template.bodyTemplate, variables),
    channels: template.channels,
    priority: template.category === 'security' ? 'critical' : 'info',
  });
}

export function getNotifications(tenantId: string, filters?: { category?: NotificationCategory; read?: boolean }) {
  const items = notifications.filter((notification) => {
    if (notification.tenantId !== tenantId) return false;
    if (filters?.category && notification.category !== filters.category) return false;
    if (typeof filters?.read === 'boolean' && notification.read !== filters.read) return false;
    return !notification.dismissed;
  });

  const unreadCount = items.filter((notification) => !notification.read).length;
  const categories = Object.entries(
    items.reduce<Record<string, number>>((acc, notification) => {
      acc[notification.category] = (acc[notification.category] ?? 0) + 1;
      return acc;
    }, {})
  ).map(([category, count]) => ({ category, count }));

  return { notifications: items, unreadCount, categories };
}

export function markAsRead(id: string) {
  const notification = notifications.find((entry) => entry.id === id);
  if (!notification) return false;
  notification.read = true;
  return true;
}

export function markAllAsRead(tenantId: string) {
  let count = 0;
  notifications.forEach((notification) => {
    if (notification.tenantId === tenantId && !notification.dismissed && !notification.read) {
      notification.read = true;
      count += 1;
    }
  });
  return count;
}

export function dismissNotification(id: string) {
  const notification = notifications.find((entry) => entry.id === id);
  if (!notification) return false;
  notification.dismissed = true;
  return true;
}

export function getPreferences(tenantId: string, userId: string) {
  const key = prefKey(tenantId, userId);
  const existing = preferences.get(key);
  if (existing) return existing;
  const created: Preferences = {
    tenantId,
    userId,
    channels: { in_app: true, email: true, sms: false },
    digestFrequency: 'immediate',
    quietHours: null,
  };
  preferences.set(key, created);
  return created;
}

export function updatePreferences(tenantId: string, userId: string, updates: Partial<Preferences>) {
  const current = getPreferences(tenantId, userId);
  const next = { ...current, ...updates };
  preferences.set(prefKey(tenantId, userId), next);
  return next;
}

export function getAllTemplates() {
  return [...templates.values()];
}

export function getTemplatesByCategory(category: NotificationCategory) {
  return getAllTemplates().filter((template) => template.category === category);
}

export function getTemplate(id: string) {
  return templates.get(id) ?? null;
}

export function processDigests() {
  return [];
}
