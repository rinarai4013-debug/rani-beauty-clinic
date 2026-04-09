import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { Tables, fetchAll } from '@/lib/airtable/client';
import { cache, TTL } from '@/lib/cache';
import { analyzeInventory, type InventoryInput } from '@/lib/inventory/auto-manager';
import { buildInventoryItems, type InventoryAlertFields } from '@/lib/dashboard/inventory-alerts';

export async function GET() {
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
}
