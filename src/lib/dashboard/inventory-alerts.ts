import type { InventoryCategory, InventoryItem } from '@/lib/inventory/auto-manager';

export interface InventoryAlertFields {
  Type?: string;
  Severity?: string;
  Message?: string;
  'Action Recommended'?: string;
  Status?: string;
  'Created Date'?: string;
}

const VALID_CATEGORIES = new Set<InventoryCategory>([
  'injectables',
  'topicals',
  'laser_consumables',
  'facial_supplies',
  'wellness_supplies',
  'disposables',
  'retail',
  'office_supplies',
]);

export function parseInventoryMessage(message: string): {
  adjustmentType: string;
  itemName: string;
  sku: string;
  quantity: number;
  category: string;
  reason: string;
} | null {
  const match = message.match(
    /^\[Inventory (\w+)\]\s+(.+?)\s*-\s*(\d+)\s+units\s*\|\s*([^|]*)\s*\|\s*(.*)$/
  );
  if (!match) return null;

  const [, adjustmentType, nameWithSku, qtyStr, category, reason] = match;
  const skuMatch = nameWithSku.match(/^(.+?)\s*\(([^)]+)\)$/);
  const itemName = skuMatch ? skuMatch[1].trim() : nameWithSku.trim();
  const sku = skuMatch ? skuMatch[2].trim() : '';

  return {
    adjustmentType,
    itemName,
    sku,
    quantity: parseInt(qtyStr, 10),
    category: category.trim(),
    reason: reason.trim(),
  };
}

export function buildInventoryItems(
  records: { id: string; fields: InventoryAlertFields }[]
): InventoryItem[] {
  const itemMap = new Map<string, {
    name: string;
    sku: string;
    category: string;
    totalQuantity: number;
    latestDate: string;
  }>();

  for (const record of records) {
    const parsed = parseInventoryMessage(record.fields.Message || '');
    if (!parsed) continue;

    const key = parsed.itemName.toLowerCase();
    const existing = itemMap.get(key);
    const delta = parsed.adjustmentType === 'remove' || parsed.adjustmentType === 'subtract'
      ? -parsed.quantity
      : parsed.quantity;

    if (existing) {
      existing.totalQuantity += delta;
      if (parsed.category) existing.category = parsed.category;
      if (parsed.sku) existing.sku = parsed.sku;
      const recordDate = record.fields['Created Date'] || '';
      if (recordDate > existing.latestDate) existing.latestDate = recordDate;
      continue;
    }

    itemMap.set(key, {
      name: parsed.itemName,
      sku: parsed.sku,
      category: parsed.category,
      totalQuantity: Math.max(0, delta),
      latestDate: record.fields['Created Date'] || '',
    });
  }

  return Array.from(itemMap.entries()).map(([key, data]) => {
    const category = VALID_CATEGORIES.has(data.category as InventoryCategory)
      ? (data.category as InventoryCategory)
      : 'disposables';

    return {
      id: data.sku || key.replace(/\s+/g, '-'),
      name: data.name,
      category,
      currentStock: Math.max(0, data.totalQuantity),
      unit: 'units',
      unitCost: 0,
      minStock: 5,
      maxStock: 20,
      supplier: 'Unknown',
      leadTimeDays: 5,
    };
  });
}
