import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { Tables, fetchAll } from '@/lib/airtable/client';
import { cache, TTL } from '@/lib/cache';
import { buildInventoryItems, parseInventoryMessage, type InventoryAlertFields } from '@/lib/dashboard/inventory-alerts';
import { analyzeInventory, type InventoryInput } from '@/lib/inventory/auto-manager';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!hasPermission(session.role, 'view_executive')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const cacheKey = 'inventory-analytics';
  const cached = cache.get(cacheKey);
  if (cached) return NextResponse.json(cached);

  try {
    const inventoryRecords = await fetchAll<InventoryAlertFields>(Tables.alerts(), {
      filterByFormula: `SEARCH("[Inventory", {Message})`,
      sort: [{ field: 'Created Date', direction: 'desc' }],
    });

    if (inventoryRecords.length === 0) {
      const emptyPayload = {
        status: 'ok',
        summary: {
          inventoryScore: 0,
          totalItems: 0,
          lowStockItems: 0,
          reorderCount: 0,
          monthlyConsumptionCost: 0,
        },
        categories: [],
        recentMovements: [],
      };
      cache.set(cacheKey, emptyPayload, TTL.SLOW);
      return NextResponse.json(emptyPayload);
    }

    const items = buildInventoryItems(inventoryRecords);
    const inventoryInput: InventoryInput = {
      items,
      appointments: [],
      suppliers: [],
      orderHistory: [],
    };
    const intelligence = analyzeInventory(inventoryInput);
    const categories = items.reduce<Record<string, { itemCount: number; unitsOnHand: number }>>((acc, item) => {
      const existing = acc[item.category] || { itemCount: 0, unitsOnHand: 0 };
      existing.itemCount += 1;
      existing.unitsOnHand += item.currentStock;
      acc[item.category] = existing;
      return acc;
    }, {});

    const payload = {
      status: 'ok',
      summary: {
        inventoryScore: intelligence.inventoryScore,
        totalItems: items.length,
        lowStockItems: intelligence.alerts.filter((alert) => alert.type === 'low_stock' || alert.type === 'out_of_stock').length,
        reorderCount: intelligence.reorderRecommendations.length,
        monthlyConsumptionCost: intelligence.monthlyConsumptionCost,
      },
      categories: Object.entries(categories)
        .map(([category, data]) => ({ category, ...data }))
        .sort((a, b) => b.unitsOnHand - a.unitsOnHand),
      recentMovements: inventoryRecords.slice(0, 8).flatMap((record) => {
        const parsed = parseInventoryMessage(record.fields.Message || '');
        if (!parsed) return [];
        return [{
          id: record.id,
          date: record.fields['Created Date'] || '',
          itemName: parsed.itemName,
          quantity: parsed.quantity,
          adjustmentType: parsed.adjustmentType,
          category: parsed.category || 'Unknown',
          reason: parsed.reason,
        }];
      }),
    };

    cache.set(cacheKey, payload, TTL.SLOW);
    return NextResponse.json(payload);
  } catch (error) {
    console.error('[dashboard/inventory/analytics]', error);
    return NextResponse.json({ error: 'Failed to load inventory analytics' }, { status: 500 });
  }
}
