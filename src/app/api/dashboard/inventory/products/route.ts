import { NextRequest, NextResponse } from 'next/server';
import {
  products, getProductById, getProductsByCategory, getStockStatus,
  type Product, type ProductCategory, type StockStatus,
} from '@/data/inventory/products';

/* ─── /api/dashboard/inventory/products ────────────────────────────────
 *  GET: List products with filtering
 *  POST: Stock adjustment, lot tracking
 * ──────────────────────────────────────────────────────────────────── */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') as ProductCategory | null;
    const status = searchParams.get('status') as StockStatus | null;
    const search = searchParams.get('search');
    const expiring = searchParams.get('expiring');
    const reorder = searchParams.get('reorder');

    let result = products.filter((p) => p.active);

    // Category filter
    if (category) {
      result = result.filter((p) => p.category === category);
    }

    // Stock status filter
    if (status) {
      result = result.filter((p) => getStockStatus(p) === status);
    }

    // Search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }

    // Reorder filter - products at or below reorder point
    if (reorder === 'true') {
      result = result.filter((p) => p.currentStock <= p.reorderPoint);
    }

    // Expiring filter - products with short shelf life
    if (expiring === 'true') {
      result = result.filter((p) => p.expirationMonths <= 12);
    }

    // Enrich with stock status
    const enriched = result.map((p) => ({
      ...p,
      stockStatus: getStockStatus(p),
      inventoryValue: p.currentStock * p.unitCost,
    }));

    return NextResponse.json({
      success: true,
      data: enriched,
      total: enriched.length,
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'adjust_stock') {
      const { productId, adjustment, reason } = body;
      const product = getProductById(productId);

      if (!product) {
        return NextResponse.json(
          { success: false, error: 'Product not found' },
          { status: 404 }
        );
      }

      const newStock = Math.max(0, product.currentStock + adjustment);

      // In production, this would update Airtable
      return NextResponse.json({
        success: true,
        data: {
          productId,
          previousStock: product.currentStock,
          adjustment,
          newStock,
          reason,
          adjustedAt: new Date().toISOString(),
        },
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error processing product action:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
