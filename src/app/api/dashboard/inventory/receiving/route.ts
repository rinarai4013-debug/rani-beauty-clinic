import { NextRequest, NextResponse } from 'next/server';
import { samplePurchaseOrders } from '@/data/inventory/purchase-orders';
import { getProductById } from '@/data/inventory/products';

/* ─── /api/dashboard/inventory/receiving ────────────────────────────────
 *  POST: Receive stock against a PO, update quantities
 * ──────────────────────────────────────────────────────────────────── */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { poId, entries, receivedDate, notes } = body;

    const order = samplePurchaseOrders.find((po) => po.id === poId);
    if (!order) {
      return NextResponse.json({ success: false, error: 'Purchase order not found' }, { status: 404 });
    }

    // Validate entries
    const results = entries.map((entry: {
      lineItemId: string;
      quantityReceived: number;
      lotNumber: string;
      expirationDate: string;
      damaged: number;
      notes: string;
    }) => {
      const lineItem = order.lineItems.find((li) => li.id === entry.lineItemId);
      if (!lineItem) return { lineItemId: entry.lineItemId, error: 'Line item not found' };

      const product = getProductById(lineItem.productId);
      const variance = entry.quantityReceived - lineItem.quantityOrdered;
      const goodUnits = entry.quantityReceived - (entry.damaged || 0);

      return {
        lineItemId: entry.lineItemId,
        productId: lineItem.productId,
        productName: lineItem.productName,
        quantityOrdered: lineItem.quantityOrdered,
        quantityReceived: entry.quantityReceived,
        quantityDamaged: entry.damaged || 0,
        netReceived: goodUnits,
        variance,
        lotNumber: entry.lotNumber,
        expirationDate: entry.expirationDate,
        previousStock: product?.currentStock || 0,
        newStock: (product?.currentStock || 0) + goodUnits,
        varianceFlag: variance !== 0 || (entry.damaged || 0) > 0,
      };
    });

    const hasVariances = results.some((r: { varianceFlag?: boolean }) => r.varianceFlag);
    const allReceived = results.every(
      (r: { quantityReceived: number; quantityOrdered: number }) =>
        r.quantityReceived >= r.quantityOrdered
    );

    return NextResponse.json({
      success: true,
      data: {
        poId,
        receivedDate: receivedDate || new Date().toISOString().split('T')[0],
        newStatus: allReceived ? 'received' : 'partially_received',
        lineResults: results,
        hasVariances,
        notes,
        receivedBy: 'Rina',
      },
    });
  } catch (error) {
    console.error('Error receiving stock:', error);
    return NextResponse.json({ success: false, error: 'Failed to receive stock' }, { status: 500 });
  }
}
