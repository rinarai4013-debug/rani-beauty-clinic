import { NextRequest, NextResponse } from 'next/server';
import {
  samplePurchaseOrders, generatePONumber, calculatePOTotal,
  getApprovalLevel, canTransitionTo,
  type PurchaseOrder, type POStatus,
} from '@/data/inventory/purchase-orders';
import { getSupplierById } from '@/data/inventory/suppliers';

/* ─── /api/dashboard/inventory/purchase-orders ─────────────────────────
 *  GET: List POs with filtering
 *  POST: Create new PO
 *  PATCH: Update PO status
 * ──────────────────────────────────────────────────────────────────── */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as POStatus | null;
    const supplier = searchParams.get('supplier');

    let result = [...samplePurchaseOrders];

    if (status) {
      result = result.filter((po) => po.status === status);
    }
    if (supplier) {
      result = result.filter((po) => po.supplierId === supplier);
    }

    // Sort by most recent first
    result.sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime());

    return NextResponse.json({
      success: true,
      data: result,
      total: result.length,
      summary: {
        totalValue: result.reduce((s, po) => s + po.total, 0),
        pendingCount: result.filter((po) => !['received', 'paid', 'cancelled'].includes(po.status)).length,
        drafts: result.filter((po) => po.status === 'draft').length,
      },
    });
  } catch (error) {
    console.error('Error fetching POs:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch purchase orders' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'create') {
      const { supplierId, priority, lineItems, notes } = body;

      const supplier = getSupplierById(supplierId);
      if (!supplier) {
        return NextResponse.json({ success: false, error: 'Supplier not found' }, { status: 404 });
      }

      const totals = calculatePOTotal(lineItems);
      const approvalLevel = getApprovalLevel(totals.total);

      const newPO: PurchaseOrder = {
        id: `po-${Date.now()}`,
        poNumber: generatePONumber(),
        supplierId,
        supplierName: supplier.name,
        status: approvalLevel === 'auto' ? 'approved' : 'submitted',
        priority: priority || 'routine',
        lineItems,
        ...totals,
        createdDate: new Date().toISOString().split('T')[0],
        submittedDate: new Date().toISOString().split('T')[0],
        approvedDate: approvalLevel === 'auto' ? new Date().toISOString().split('T')[0] : undefined,
        createdBy: 'Rina',
        approvedBy: approvalLevel === 'auto' ? 'System (auto-approved)' : undefined,
        notes,
      };

      return NextResponse.json({
        success: true,
        data: newPO,
        approvalLevel,
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error creating PO:', error);
    return NextResponse.json({ success: false, error: 'Failed to create purchase order' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, poId, status: newStatus } = body;

    if (action === 'update_status') {
      const order = samplePurchaseOrders.find((po) => po.id === poId);
      if (!order) {
        return NextResponse.json({ success: false, error: 'PO not found' }, { status: 404 });
      }

      if (!canTransitionTo(order.status, newStatus)) {
        return NextResponse.json({
          success: false,
          error: `Cannot transition from ${order.status} to ${newStatus}`,
        }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        data: {
          poId,
          previousStatus: order.status,
          newStatus,
          updatedAt: new Date().toISOString(),
        },
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating PO:', error);
    return NextResponse.json({ success: false, error: 'Failed to update purchase order' }, { status: 500 });
  }
}
