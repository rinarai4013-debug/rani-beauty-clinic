import { NextRequest, NextResponse } from 'next/server';
import {
  products, CATEGORY_LABELS, CATEGORY_COLORS,
  getTotalInventoryValue, getTotalRetailValue,
  getStockStatus, getReorderCount,
  type ProductCategory,
} from '@/data/inventory/products';
import { sampleWasteEntries, getTotalWasteCost } from '@/data/inventory/purchase-orders';

/* ─── /api/dashboard/inventory/analytics ───────────────────────────────
 *  GET: Usage trends, cost analysis, optimization recommendations
 * ──────────────────────────────────────────────────────────────────── */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '6m';
    const metric = searchParams.get('metric');

    const activeProducts = products.filter((p) => p.active);
    const totalValue = getTotalInventoryValue();
    const totalRetail = getTotalRetailValue();
    const reorderCount = getReorderCount();
    const wasteCost = getTotalWasteCost(sampleWasteEntries);

    // Category breakdown
    const categories = Object.entries(CATEGORY_LABELS).map(([key, label]) => {
      const catProducts = activeProducts.filter((p) => p.category === key);
      const value = catProducts.reduce((s, p) => s + p.currentStock * p.unitCost, 0);
      const stockLevels = {
        full: catProducts.filter((p) => getStockStatus(p) === 'full').length,
        adequate: catProducts.filter((p) => getStockStatus(p) === 'adequate').length,
        low: catProducts.filter((p) => getStockStatus(p) === 'low').length,
        critical: catProducts.filter((p) => getStockStatus(p) === 'critical').length,
        out: catProducts.filter((p) => getStockStatus(p) === 'out').length,
      };

      return {
        key,
        label,
        color: CATEGORY_COLORS[key as ProductCategory],
        productCount: catProducts.length,
        inventoryValue: value,
        stockLevels,
        avgMargin: catProducts.filter((p) => p.retailPrice > 0).length > 0
          ? catProducts.filter((p) => p.retailPrice > 0).reduce((s, p) => s + ((p.retailPrice - p.unitCost) / p.retailPrice * 100), 0) / catProducts.filter((p) => p.retailPrice > 0).length
          : 0,
      };
    }).filter((c) => c.productCount > 0);

    // Top products by value
    const topByValue = [...activeProducts]
      .sort((a, b) => (b.currentStock * b.unitCost) - (a.currentStock * a.unitCost))
      .slice(0, 10)
      .map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        inventoryValue: p.currentStock * p.unitCost,
        stockStatus: getStockStatus(p),
        currentStock: p.currentStock,
        parLevel: p.parLevel,
      }));

    // Storage requirements
    const storageBreakdown = {
      room: activeProducts.filter((p) => p.storageTemp === 'room').length,
      refrigerated: activeProducts.filter((p) => p.storageTemp === 'refrigerated').length,
      frozen: activeProducts.filter((p) => p.storageTemp === 'frozen').length,
    };

    // Recommendations
    const recommendations: { type: string; title: string; description: string; impact: string; priority: 'high' | 'medium' | 'low' }[] = [];

    // Check for overstock
    const overstocked = activeProducts.filter((p) => p.currentStock > p.parLevel * 1.5);
    if (overstocked.length > 0) {
      const overstockValue = overstocked.reduce((s, p) => s + (p.currentStock - p.parLevel) * p.unitCost, 0);
      recommendations.push({
        type: 'overstock',
        title: `${overstocked.length} products overstocked`,
        description: `Reduce ordering for ${overstocked.map((p) => p.name).slice(0, 3).join(', ')}`,
        impact: `Free up $${overstockValue.toLocaleString()} in capital`,
        priority: overstockValue > 5000 ? 'high' : 'medium',
      });
    }

    // Check short shelf life products
    const shortShelf = activeProducts.filter((p) => p.expirationMonths <= 6 && p.currentStock > p.reorderPoint);
    if (shortShelf.length > 0) {
      recommendations.push({
        type: 'shelf_life',
        title: 'Short shelf-life products need FIFO rotation',
        description: `${shortShelf.map((p) => p.name).slice(0, 3).join(', ')} expire within 6 months`,
        impact: 'Reduce waste from expiration',
        priority: 'high',
      });
    }

    // Waste reduction
    if (wasteCost > 500) {
      recommendations.push({
        type: 'waste',
        title: 'Waste reduction opportunity',
        description: `$${wasteCost.toLocaleString()} in waste logged this period. Focus on preventable losses.`,
        impact: `Save up to $${Math.round(wasteCost * 0.6).toLocaleString()}/period`,
        priority: wasteCost > 1000 ? 'high' : 'medium',
      });
    }

    // Supplier consolidation
    const supplierCount = new Set(activeProducts.map((p) => p.supplier)).size;
    if (supplierCount > 12) {
      recommendations.push({
        type: 'consolidation',
        title: 'Consider supplier consolidation',
        description: `${supplierCount} active suppliers. Consolidating could improve volume discounts.`,
        impact: 'Potential 3-5% savings on bulk orders',
        priority: 'low',
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalProducts: activeProducts.length,
          totalInventoryValue: totalValue,
          totalRetailValue: totalRetail,
          reorderNeeded: reorderCount,
          wasteCostPeriod: wasteCost,
          avgTurnoverDays: 45,
          inventoryEfficiency: Math.round((1 - wasteCost / totalValue) * 100),
        },
        categories,
        topByValue,
        storageBreakdown,
        recommendations,
        range,
      },
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
