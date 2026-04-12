import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { Tables, fetchAll } from '@/lib/airtable/client';
import { cache, TTL } from '@/lib/cache';
import { analyzeInventory, type InventoryInput, type InventoryItem, type InventoryCategory } from '@/lib/inventory/auto-manager';
import { withSentry } from '@/lib/sentry-utils';

// Fields stored in the Alerts table by the entry/inventory form
interface InventoryAlertFields {
  'Type': string;
  'Severity': string;
  'Message': string;
  'Action Recommended': string;
  'Status': string;
  'Created Date': string;
}

// Valid inventory categories from the auto-manager
const VALID_CATEGORIES = new Set<InventoryCategory>([
  'injectables', 'topicals', 'laser_consumables', 'facial_supplies',
  'wellness_supplies', 'disposables', 'retail', 'office_supplies',
]);

/**
 * Parse an inventory alert message back into structured data.
 * Format: [Inventory {type}] {name} ({sku}) - {qty} units | {category} | {reason}
 * or:     [Inventory {type}] {name} - {qty} units | {category} | {reason}
 */
function parseInventoryMessage(message: string): {
  adjustmentType: string;
  itemName: string;
  sku: string;
  quantity: number;
  category: string;
  reason: string;
} | null {
  const match = message.match(
    /^\[Inventory (\w+)\]\s+(.+?)\s+ - \s+(\d+)\s+units\s*\|\s*([^|]*)\s*\|\s*(.*)$/
  );
  if (!match) return null;

  const [, adjustmentType, nameWithSku, qtyStr, category, reason] = match;
  // Extract SKU if present: "Item Name (SKU123)" → name="Item Name", sku="SKU123"
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

/**
 * Aggregate inventory alert records into InventoryItem objects.
 * Multiple alerts for the same item (by name) are merged - adds increase stock,
 * subtracts for removals/adjustments.
 */
function buildInventoryItems(
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
    const parsed = parseInventoryMessage(record.fields['Message'] || '');
    if (!parsed) continue;

    const key = parsed.itemName.toLowerCase();
    const existing = itemMap.get(key);

    const delta = parsed.adjustmentType === 'remove' || parsed.adjustmentType === 'subtract'
      ? -parsed.quantity
      : parsed.quantity;

    if (existing) {
      existing.totalQuantity += delta;
      // Keep the latest category/sku if present
      if (parsed.category) existing.category = parsed.category;
      if (parsed.sku) existing.sku = parsed.sku;
      const recordDate = record.fields['Created Date'] || '';
      if (recordDate > existing.latestDate) existing.latestDate = recordDate;
    } else {
      itemMap.set(key, {
        name: parsed.itemName,
        sku: parsed.sku,
        category: parsed.category,
        totalQuantity: Math.max(0, delta),
        latestDate: record.fields['Created Date'] || '',
      });
    }
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
      unitCost: 0, // Not tracked in alert records
      minStock: 5, // Default par level
      maxStock: 20, // Default max
      supplier: 'Unknown',
      leadTimeDays: 5, // Default lead time
    };
  });
}

export async function GET() {
  return withSentry('dashboard/inventory', async () => {
    // Auth check
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    if (!hasPermission(session.role, 'view_executive')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check cache
    const cacheKey = 'inventory-intelligence';
    const cached = cache.get<{ success: true; data: ReturnType<typeof analyzeInventory>; generatedAt: string }>(cacheKey);
    if (cached) return NextResponse.json(cached);

    try {
      // Query Alerts table for inventory entries
      // The entry/inventory form writes records with Message starting with "[Inventory"
      const inventoryRecords = await fetchAll<InventoryAlertFields>(
        Tables.alerts(),
        {
          filterByFormula: `SEARCH("[Inventory", {Message})`,
          sort: [{ field: 'Created Date', direction: 'desc' }],
        }
      );

    // No inventory data yet - return clear empty state
    if (inventoryRecords.length === 0) {
      const emptyResponse = {
        success: true as const,
        data: null,
        message: 'No inventory data yet. Use the Entry > Inventory form to add items.',
        generatedAt: new Date().toISOString(),
      };
      cache.set(cacheKey, emptyResponse, TTL.SLOW);
      return NextResponse.json(emptyResponse);
    }

    // Transform alert records into InventoryItem format
    const items = buildInventoryItems(inventoryRecords);

    // If parsing yielded no valid items, treat as empty
    if (items.length === 0) {
      const emptyResponse = {
        success: true as const,
        data: null,
        message: 'No inventory data yet. Use the Entry > Inventory form to add items.',
        generatedAt: new Date().toISOString(),
      };
      cache.set(cacheKey, emptyResponse, TTL.SLOW);
      return NextResponse.json(emptyResponse);
    }

    const inventoryInput: InventoryInput = {
      items,
      appointments: [],
      suppliers: [],
      orderHistory: [],
    };

    const result = analyzeInventory(inventoryInput);

    const response = {
      success: true as const,
      data: result,
      generatedAt: new Date().toISOString(),
    };

      cache.set(cacheKey, response, TTL.SLOW);
      return NextResponse.json(response);
    } catch (error) {
      console.error('Inventory analysis error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to analyze inventory' },
        { status: 500 }
      );
    }
  });
}
