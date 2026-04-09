import type { MessageTemplate } from '@/types/communications';
import { NOTE_TEMPLATES } from '@/lib/crm/notes';
import { STAGE_TEMPLATES } from '@/lib/crm/lifecycle';
import { getSystemTemplates } from '@/lib/saas/tenant-dashboard/communications';

function noteTypeToChannel(type: string): MessageTemplate['channel'] {
  if (type === 'text') return 'sms';
  if (type === 'email') return 'email';
  return 'both';
}

function noteTypeToCategory(type: string): MessageTemplate['category'] {
  if (type === 'email') return 'educational';
  if (type === 'text') return 'reactivation';
  return 'custom';
}

function stageToCategory(stage: string): MessageTemplate['category'] {
  if (['at_risk', 'dormant', 'lost', 'reactivated'].includes(stage)) {
    return 'reactivation';
  }
  if (stage === 'first_visit') return 'welcome';
  if (stage === 'vip') return 'membership';
  return 'custom';
}

export function getDashboardCommunicationTemplates(): MessageTemplate[] {
  const systemTemplates: MessageTemplate[] = getSystemTemplates().map((template) => ({
    id: template.id,
    name: template.name,
    category: template.category as MessageTemplate['category'],
    channel: template.channel === 'sms' || template.channel === 'email' ? template.channel : 'both',
    subject: template.channel === 'email' ? template.name : undefined,
    body: template.body,
    variables: [...template.variables],
    isActive: true,
    usageCount: 0,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  }));

  const noteTemplates: MessageTemplate[] = NOTE_TEMPLATES.map((template) => ({
    id: template.id,
    name: template.name,
    category: noteTypeToCategory(template.type),
    channel: noteTypeToChannel(template.type),
    subject: template.subject,
    body: template.content,
    variables: [...template.variables],
    isActive: true,
    usageCount: 0,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  }));

  const lifecycleTemplates: MessageTemplate[] = STAGE_TEMPLATES.flatMap((stageTemplate) =>
    stageTemplate.templates.map((template, index) => ({
      id: `lifecycle_${stageTemplate.stage}_${index + 1}`,
      name: `${stageTemplate.stage.replace(/_/g, ' ')} ${template.channel} ${index + 1}`,
      category: stageToCategory(stageTemplate.stage),
      channel: template.channel,
      subject: template.subject,
      body: template.body,
      variables: ['clientName'],
      previewText: template.timing,
      isActive: true,
      usageCount: 0,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    }))
  );

  const deduped = new Map<string, MessageTemplate>();
  for (const template of [...systemTemplates, ...noteTemplates, ...lifecycleTemplates]) {
    deduped.set(template.id, template);
  }

  return Array.from(deduped.values()).sort((left, right) => left.name.localeCompare(right.name));
}
