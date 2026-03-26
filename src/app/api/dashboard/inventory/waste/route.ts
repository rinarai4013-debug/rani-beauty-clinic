import { NextRequest, NextResponse } from 'next/server';
import {
  sampleWasteEntries, WASTE_CATEGORY_CONFIG,
  getTotalWasteCost, getPreventableWastePercent,
  type WasteEntry, type WasteCategory,
} from '@/data/inventory/purchase-orders';
import { getProductById } from '@/data/inventory/products';

/* ─── /api/dashboard/inventory/waste ───────────────────────────────────
 *  GET: Waste log with filtering
 *  POST: Log new waste entry
 * ──────────────────────────────────────────────────────────────────── */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') as WasteCategory | null;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let entries = [...sampleWasteEntries];

    if (category) {
      entries = entries.filter((e) => e.category === category);
    }

    if (startDate) {
      entries = entries.filter((e) => e.date >= startDate);
    }
    if (endDate) {
      entries = entries.filter((e) => e.date <= endDate);
    }

    const totalCost = getTotalWasteCost(entries);
    const preventablePercent = getPreventableWastePercent(entries);

    // Category breakdown
    const categoryBreakdown = Object.keys(WASTE_CATEGORY_CONFIG).map((cat) => {
      const catEntries = entries.filter((e) => e.category === cat);
      return {
        category: cat,
        label: WASTE_CATEGORY_CONFIG[cat as WasteCategory].label,
        count: catEntries.length,
        totalCost: catEntries.reduce((s, e) => s + e.totalCost, 0),
      };
    }).filter((c) => c.count > 0);

    return NextResponse.json({
      success: true,
      data: {
        entries,
        summary: {
          totalEntries: entries.length,
          totalCost,
          preventablePercent,
          preventableCost: entries.filter((e) => e.preventable).reduce((s, e) => s + e.totalCost, 0),
          categoryBreakdown,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching waste log:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch waste data' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, category, quantity, reason, preventable, correctiveAction, lotNumber } = body;

    const product = getProductById(productId);
    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    const newEntry: WasteEntry = {
      id: `w-${Date.now()}`,
      productId,
      productName: product.name,
      sku: product.sku,
      category,
      quantity,
      unitCost: product.unitCost,
      totalCost: quantity * product.unitCost,
      lotNumber,
      reason,
      date: new Date().toISOString().split('T')[0],
      recordedBy: 'Rina',
      preventable: preventable || false,
      correctiveAction,
    };

    return NextResponse.json({
      success: true,
      data: newEntry,
    });
  } catch (error) {
    console.error('Error logging waste:', error);
    return NextResponse.json({ success: false, error: 'Failed to log waste' }, { status: 500 });
  }
}
