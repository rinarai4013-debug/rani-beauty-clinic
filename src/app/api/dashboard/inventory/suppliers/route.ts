import { NextRequest, NextResponse } from 'next/server';
import {
  suppliers, getSupplierById, calculateSupplierScore,
  type Supplier,
} from '@/data/inventory/suppliers';
import { getProductsBySupplier } from '@/data/inventory/products';

/* ─── /api/dashboard/inventory/suppliers ────────────────────────────────
 *  GET: List suppliers with scorecard data
 *  PATCH: Update supplier info
 * ──────────────────────────────────────────────────────────────────── */

export async function GET(request: NextRequest) {
  try {
    const activeSuppliers = suppliers.filter((s) => s.active);

    const scorecards = activeSuppliers.map((supplier) => {
      const products = getProductsBySupplier(supplier.id);
      const score = calculateSupplierScore(supplier);

      return {
        ...supplier,
        productCount: products.length,
        overallScore: score,
        grade: score >= 90 ? 'A' : score >= 80 ? 'B+' : score >= 70 ? 'B' : score >= 60 ? 'C' : 'D',
      };
    });

    // Sort by score descending
    scorecards.sort((a, b) => b.overallScore - a.overallScore);

    return NextResponse.json({
      success: true,
      data: scorecards,
      total: scorecards.length,
      summary: {
        avgScore: Math.round(scorecards.reduce((s, sc) => s + sc.overallScore, 0) / scorecards.length),
        avgLeadTime: Math.round(scorecards.reduce((s, sc) => s + sc.leadTimeDays, 0) / scorecards.length),
        totalSuppliers: scorecards.length,
        autoReplenishCount: scorecards.filter((s) => s.autoReplenish).length,
      },
    });
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch suppliers' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { supplierId, ...updates } = body;

    const supplier = getSupplierById(supplierId);
    if (!supplier) {
      return NextResponse.json({ success: false, error: 'Supplier not found' }, { status: 404 });
    }

    // In production, this would update Airtable
    return NextResponse.json({
      success: true,
      data: {
        supplierId,
        updates,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error updating supplier:', error);
    return NextResponse.json({ success: false, error: 'Failed to update supplier' }, { status: 500 });
  }
}
