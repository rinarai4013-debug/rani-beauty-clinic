/* ─── Purchase Order Types & Workflow ──────────────────────────────────
 *  PO lifecycle: Draft → Submitted → Approved → Ordered → Shipped
 *  → Received (partial or full) → Invoiced → Paid
 * ──────────────────────────────────────────────────────────────────── */

export type POStatus =
  | 'draft'
  | 'submitted'
  | 'approved'
  | 'ordered'
  | 'shipped'
  | 'partially_received'
  | 'received'
  | 'invoiced'
  | 'paid'
  | 'cancelled';

export type POPriority = 'routine' | 'urgent' | 'emergency';

export interface POLineItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantityOrdered: number;
  quantityReceived: number;
  unitCost: number;
  totalCost: number;
  /** Lot number assigned upon receipt */
  lotNumber?: string;
  /** Expiry date recorded upon receipt */
  expirationDate?: string;
  /** Notes about this line item (e.g., back-ordered) */
  notes?: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  status: POStatus;
  priority: POPriority;
  lineItems: POLineItem[];
  /** Total PO value */
  subtotal: number;
  tax: number;
  shippingCost: number;
  total: number;
  /** Discount applied */
  discount: number;
  /** Order dates */
  createdDate: string;
  submittedDate?: string;
  approvedDate?: string;
  orderedDate?: string;
  expectedDeliveryDate?: string;
  receivedDate?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  paidDate?: string;
  /** Who created the PO */
  createdBy: string;
  /** Who approved the PO */
  approvedBy?: string;
  /** Internal notes */
  notes?: string;
  /** Shipping tracking number */
  trackingNumber?: string;
}

export const PO_STATUS_CONFIG: Record<POStatus, { label: string; color: string; bgColor: string; dotColor: string }> = {
  draft: { label: 'Draft', color: 'text-gray-700', bgColor: 'bg-gray-50', dotColor: 'bg-gray-400' },
  submitted: { label: 'Submitted', color: 'text-blue-700', bgColor: 'bg-blue-50', dotColor: 'bg-blue-400' },
  approved: { label: 'Approved', color: 'text-indigo-700', bgColor: 'bg-indigo-50', dotColor: 'bg-indigo-400' },
  ordered: { label: 'Ordered', color: 'text-purple-700', bgColor: 'bg-purple-50', dotColor: 'bg-purple-400' },
  shipped: { label: 'Shipped', color: 'text-cyan-700', bgColor: 'bg-cyan-50', dotColor: 'bg-cyan-400' },
  partially_received: { label: 'Partial', color: 'text-amber-700', bgColor: 'bg-amber-50', dotColor: 'bg-amber-400' },
  received: { label: 'Received', color: 'text-emerald-700', bgColor: 'bg-emerald-50', dotColor: 'bg-emerald-400' },
  invoiced: { label: 'Invoiced', color: 'text-teal-700', bgColor: 'bg-teal-50', dotColor: 'bg-teal-400' },
  paid: { label: 'Paid', color: 'text-green-700', bgColor: 'bg-green-50', dotColor: 'bg-green-400' },
  cancelled: { label: 'Cancelled', color: 'text-red-700', bgColor: 'bg-red-50', dotColor: 'bg-red-400' },
};

export const PO_PRIORITY_CONFIG: Record<POPriority, { label: string; color: string; bgColor: string }> = {
  routine: { label: 'Routine', color: 'text-gray-600', bgColor: 'bg-gray-50' },
  urgent: { label: 'Urgent', color: 'text-amber-700', bgColor: 'bg-amber-50' },
  emergency: { label: 'Emergency', color: 'text-red-700', bgColor: 'bg-red-50' },
};

/** Approval thresholds - POs above these amounts require higher-level approval */
export const APPROVAL_THRESHOLDS = {
  autoApprove: 500,
  managerApproval: 2000,
  ceoApproval: 5000,
};

export type WasteCategory = 'expired' | 'damaged' | 'recalled' | 'contaminated' | 'returned' | 'spilled' | 'other';

export interface WasteEntry {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  category: WasteCategory;
  quantity: number;
  unitCost: number;
  totalCost: number;
  lotNumber?: string;
  reason: string;
  date: string;
  recordedBy: string;
  /** Whether the loss was preventable */
  preventable: boolean;
  /** Corrective action taken */
  correctiveAction?: string;
}

export const WASTE_CATEGORY_CONFIG: Record<WasteCategory, { label: string; color: string; icon: string }> = {
  expired: { label: 'Expired', color: 'text-red-600', icon: 'clock' },
  damaged: { label: 'Damaged', color: 'text-orange-600', icon: 'alert-triangle' },
  recalled: { label: 'Recalled', color: 'text-purple-600', icon: 'alert-circle' },
  contaminated: { label: 'Contaminated', color: 'text-red-700', icon: 'shield-x' },
  returned: { label: 'Returned', color: 'text-blue-600', icon: 'undo' },
  spilled: { label: 'Spilled', color: 'text-amber-600', icon: 'droplet' },
  other: { label: 'Other', color: 'text-gray-600', icon: 'help-circle' },
};

// ── Sample PO Data ────────────────────────────────────────────────────

export const samplePurchaseOrders: PurchaseOrder[] = [
  {
    id: 'po-001',
    poNumber: 'PO-2026-0042',
    supplierId: 'sup-allergan',
    supplierName: 'Allergan Aesthetics',
    status: 'received',
    priority: 'routine',
    lineItems: [
      {
        id: 'li-001',
        productId: 'ntx-001',
        productName: 'Botox Cosmetic 100U',
        sku: 'BTX-100U',
        quantityOrdered: 10,
        quantityReceived: 10,
        unitCost: 396,
        totalCost: 3960,
        lotNumber: 'L2026A481',
        expirationDate: '2028-11-15',
      },
      {
        id: 'li-002',
        productId: 'fil-001',
        productName: 'Juvederm Ultra XC',
        sku: 'JUV-ULTRA',
        quantityOrdered: 6,
        quantityReceived: 6,
        unitCost: 225,
        totalCost: 1350,
        lotNumber: 'L2026A482',
        expirationDate: '2028-03-20',
      },
    ],
    subtotal: 5310,
    tax: 0,
    shippingCost: 0,
    total: 5310,
    discount: 265.50,
    createdDate: '2026-03-10',
    submittedDate: '2026-03-10',
    approvedDate: '2026-03-10',
    orderedDate: '2026-03-11',
    expectedDeliveryDate: '2026-03-14',
    receivedDate: '2026-03-13',
    invoiceNumber: 'INV-ALG-88421',
    invoiceDate: '2026-03-13',
    paidDate: '2026-03-20',
    createdBy: 'Rina',
    approvedBy: 'Rina',
    notes: 'Regular monthly order. Received 1 day early.',
  },
  {
    id: 'po-002',
    poNumber: 'PO-2026-0043',
    supplierId: 'sup-empower',
    supplierName: 'Empower Pharmacy',
    status: 'shipped',
    priority: 'urgent',
    lineItems: [
      {
        id: 'li-003',
        productId: 'glp-001',
        productName: 'Semaglutide 5mg/2mL',
        sku: 'GLP-SEMA5',
        quantityOrdered: 15,
        quantityReceived: 0,
        unitCost: 120,
        totalCost: 1800,
      },
      {
        id: 'li-004',
        productId: 'glp-003',
        productName: 'Tirzepatide 10mg/2mL',
        sku: 'GLP-TIRZ10',
        quantityOrdered: 10,
        quantityReceived: 0,
        unitCost: 160,
        totalCost: 1600,
      },
    ],
    subtotal: 3400,
    tax: 0,
    shippingCost: 25,
    total: 3425,
    discount: 0,
    createdDate: '2026-03-18',
    submittedDate: '2026-03-18',
    approvedDate: '2026-03-18',
    orderedDate: '2026-03-19',
    expectedDeliveryDate: '2026-03-26',
    createdBy: 'Rina',
    approvedBy: 'Rina',
    trackingNumber: '1Z999AA10123456784',
    notes: 'GLP-1 restock - high demand. Marked urgent.',
  },
  {
    id: 'po-003',
    poNumber: 'PO-2026-0044',
    supplierId: 'sup-galderma',
    supplierName: 'Galderma',
    status: 'approved',
    priority: 'routine',
    lineItems: [
      {
        id: 'li-005',
        productId: 'ntx-003',
        productName: 'Dysport 300U',
        sku: 'DYS-300U',
        quantityOrdered: 6,
        quantityReceived: 0,
        unitCost: 460,
        totalCost: 2760,
      },
      {
        id: 'li-006',
        productId: 'fil-013',
        productName: 'Sculptra Aesthetic',
        sku: 'SCP-5ML',
        quantityOrdered: 4,
        quantityReceived: 0,
        unitCost: 310,
        totalCost: 1240,
      },
    ],
    subtotal: 4000,
    tax: 0,
    shippingCost: 0,
    total: 4000,
    discount: 160,
    createdDate: '2026-03-22',
    submittedDate: '2026-03-22',
    approvedDate: '2026-03-23',
    createdBy: 'Rina',
    approvedBy: 'Rina',
    notes: 'Scheduled quarterly Galderma order.',
  },
  {
    id: 'po-004',
    poNumber: 'PO-2026-0045',
    supplierId: 'sup-mckesson',
    supplierName: 'McKesson Medical-Surgical',
    status: 'draft',
    priority: 'routine',
    lineItems: [
      {
        id: 'li-007',
        productId: 'sup-001',
        productName: 'Insulin Syringes 1mL (100-pack)',
        sku: 'SUP-SYR1',
        quantityOrdered: 5,
        quantityReceived: 0,
        unitCost: 18,
        totalCost: 90,
      },
      {
        id: 'li-008',
        productId: 'sup-003',
        productName: 'Needles 30G 1/2" (100-pack)',
        sku: 'SUP-NDL30',
        quantityOrdered: 5,
        quantityReceived: 0,
        unitCost: 8,
        totalCost: 40,
      },
      {
        id: 'li-009',
        productId: 'sup-006',
        productName: 'Alcohol Prep Pads (200-pack)',
        sku: 'SUP-ALC',
        quantityOrdered: 10,
        quantityReceived: 0,
        unitCost: 5,
        totalCost: 50,
      },
      {
        id: 'li-010',
        productId: 'sup-012',
        productName: 'Bacteriostatic Water 30mL',
        sku: 'SUP-BWAT',
        quantityOrdered: 15,
        quantityReceived: 0,
        unitCost: 4,
        totalCost: 60,
      },
    ],
    subtotal: 240,
    tax: 0,
    shippingCost: 0,
    total: 240,
    discount: 0,
    createdDate: '2026-03-25',
    createdBy: 'Rina',
    notes: 'Monthly supplies restock draft - needs review.',
  },
  {
    id: 'po-005',
    poNumber: 'PO-2026-0046',
    supplierId: 'sup-olympia',
    supplierName: 'Olympia Compounding Pharmacy',
    status: 'ordered',
    priority: 'routine',
    lineItems: [
      {
        id: 'li-011',
        productId: 'vit-001',
        productName: 'Vitamin B12 1000mcg/mL',
        sku: 'VIT-B12',
        quantityOrdered: 10,
        quantityReceived: 0,
        unitCost: 18,
        totalCost: 180,
      },
      {
        id: 'li-012',
        productId: 'vit-004',
        productName: 'Tri-Immune Boost',
        sku: 'VIT-TRIIM',
        quantityOrdered: 6,
        quantityReceived: 0,
        unitCost: 28,
        totalCost: 168,
      },
      {
        id: 'li-013',
        productId: 'vit-006',
        productName: 'NAD+ 100mg/mL',
        sku: 'VIT-NAD100',
        quantityOrdered: 4,
        quantityReceived: 0,
        unitCost: 85,
        totalCost: 340,
      },
    ],
    subtotal: 688,
    tax: 0,
    shippingCost: 0,
    total: 688,
    discount: 0,
    createdDate: '2026-03-20',
    submittedDate: '2026-03-20',
    approvedDate: '2026-03-20',
    orderedDate: '2026-03-21',
    expectedDeliveryDate: '2026-03-28',
    createdBy: 'Rina',
    approvedBy: 'Rina',
    notes: 'Wellness injection restock. NAD+ running low.',
  },
];

// ── Sample Waste Data ─────────────────────────────────────────────────

export const sampleWasteEntries: WasteEntry[] = [
  {
    id: 'w-001',
    productId: 'vit-006',
    productName: 'NAD+ 100mg/mL',
    sku: 'VIT-NAD100',
    category: 'expired',
    quantity: 2,
    unitCost: 85,
    totalCost: 170,
    lotNumber: 'L2025B221',
    reason: 'Expired before use - short shelf life (6 months)',
    date: '2026-03-15',
    recordedBy: 'Rina',
    preventable: true,
    correctiveAction: 'Reduced par level for NAD+ from 10 to 8. Implementing FIFO rotation labels.',
  },
  {
    id: 'w-002',
    productId: 'ntx-003',
    productName: 'Dysport 300U',
    sku: 'DYS-300U',
    category: 'damaged',
    quantity: 1,
    unitCost: 460,
    totalCost: 460,
    lotNumber: 'L2026A119',
    reason: 'Vial broken during unpacking - packaging was damaged in transit',
    date: '2026-03-08',
    recordedBy: 'Rina',
    preventable: false,
    correctiveAction: 'Filed claim with Galderma for replacement. Credit memo received.',
  },
  {
    id: 'w-003',
    productId: 'ntx-001',
    productName: 'Botox Cosmetic 100U',
    sku: 'BTX-100U',
    category: 'expired',
    quantity: 1,
    unitCost: 396,
    totalCost: 396,
    lotNumber: 'L2025A997',
    reason: 'Reconstituted vial unused within 24-hour BUD window',
    date: '2026-02-28',
    recordedBy: 'Mom',
    preventable: true,
    correctiveAction: 'Schedule same-day neurotoxin patients together to minimize waste.',
  },
  {
    id: 'w-004',
    productId: 'dev-001',
    productName: 'HydraFacial Serum - Activ-4',
    sku: 'DEV-HF-ACT4',
    category: 'spilled',
    quantity: 1,
    unitCost: 45,
    totalCost: 45,
    lotNumber: 'L2026A090',
    reason: 'Bottle knocked over during treatment prep - partially spilled',
    date: '2026-03-12',
    recordedBy: 'Mom',
    preventable: true,
    correctiveAction: 'Relocated serum storage to lower shelf with lip guard.',
  },
];

// ── Utility Functions ─────────────────────────────────────────────────

export function generatePONumber(): string {
  const year = new Date().getFullYear();
  const num = Math.floor(Math.random() * 9000) + 1000;
  return `PO-${year}-${num}`;
}

export function calculatePOTotal(lineItems: POLineItem[], discount = 0, shippingCost = 0, tax = 0): {
  subtotal: number;
  discount: number;
  shippingCost: number;
  tax: number;
  total: number;
} {
  const subtotal = lineItems.reduce((sum, item) => sum + item.totalCost, 0);
  return {
    subtotal,
    discount,
    shippingCost,
    tax,
    total: subtotal - discount + shippingCost + tax,
  };
}

export function getApprovalLevel(total: number): 'auto' | 'manager' | 'ceo' {
  if (total <= APPROVAL_THRESHOLDS.autoApprove) return 'auto';
  if (total <= APPROVAL_THRESHOLDS.ceoApproval) return 'manager';
  return 'ceo';
}

export function canTransitionTo(currentStatus: POStatus, newStatus: POStatus): boolean {
  const transitions: Record<POStatus, POStatus[]> = {
    draft: ['submitted', 'cancelled'],
    submitted: ['approved', 'cancelled'],
    approved: ['ordered', 'cancelled'],
    ordered: ['shipped', 'partially_received', 'received', 'cancelled'],
    shipped: ['partially_received', 'received'],
    partially_received: ['received'],
    received: ['invoiced'],
    invoiced: ['paid'],
    paid: [],
    cancelled: [],
  };
  return transitions[currentStatus]?.includes(newStatus) || false;
}

export function getReceivingVariance(lineItem: POLineItem): {
  variance: number;
  percentReceived: number;
  status: 'complete' | 'partial' | 'over' | 'pending';
} {
  const variance = lineItem.quantityReceived - lineItem.quantityOrdered;
  const percentReceived = lineItem.quantityOrdered > 0
    ? (lineItem.quantityReceived / lineItem.quantityOrdered) * 100
    : 0;

  let status: 'complete' | 'partial' | 'over' | 'pending';
  if (lineItem.quantityReceived === 0) status = 'pending';
  else if (variance === 0) status = 'complete';
  else if (variance > 0) status = 'over';
  else status = 'partial';

  return { variance, percentReceived, status };
}

export function getTotalWasteCost(entries: WasteEntry[]): number {
  return entries.reduce((sum, e) => sum + e.totalCost, 0);
}

export function getPreventableWastePercent(entries: WasteEntry[]): number {
  if (entries.length === 0) return 0;
  const preventable = entries.filter((e) => e.preventable);
  const preventableCost = preventable.reduce((sum, e) => sum + e.totalCost, 0);
  const totalCost = getTotalWasteCost(entries);
  return totalCost > 0 ? (preventableCost / totalCost) * 100 : 0;
}
