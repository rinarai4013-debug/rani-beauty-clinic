'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Minus, ShoppingCart, Truck, Search, X,
  AlertTriangle, CheckCircle, DollarSign,
} from 'lucide-react';
import { products, getProductById, type Product } from '@/data/inventory/products';
import { suppliers, getSupplierById, type Supplier } from '@/data/inventory/suppliers';
import {
  generatePONumber, calculatePOTotal, getApprovalLevel,
  APPROVAL_THRESHOLDS, type POLineItem, type POPriority,
  PO_PRIORITY_CONFIG,
} from '@/data/inventory/purchase-orders';

/* ─── PurchaseOrderForm ───────────────────────────────────────────────
 *  Multi-product PO builder with supplier auto-select, cost
 *  calculation, and approval routing.
 * ──────────────────────────────────────────────────────────────────── */

interface PurchaseOrderFormProps {
  onSubmit?: (po: {
    supplierId: string;
    priority: POPriority;
    lineItems: POLineItem[];
    notes: string;
    total: number;
  }) => void;
  onCancel?: () => void;
}

interface DraftLineItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
}

export default function PurchaseOrderForm({ onSubmit, onCancel }: PurchaseOrderFormProps) {
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [priority, setPriority] = useState<POPriority>('routine');
  const [lineItems, setLineItems] = useState<DraftLineItem[]>([]);
  const [notes, setNotes] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [showProductPicker, setShowProductPicker] = useState(false);

  const selectedSupplier = selectedSupplierId ? getSupplierById(selectedSupplierId) : null;

  // Filter products by selected supplier
  const availableProducts = useMemo(() => {
    let result = products.filter((p) => p.active);
    if (selectedSupplierId) {
      result = result.filter((p) => p.supplier === selectedSupplierId);
    }
    if (productSearch.trim()) {
      const q = productSearch.toLowerCase();
      result = result.filter(
        (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
      );
    }
    // Exclude already-added products
    const addedIds = new Set(lineItems.map((li) => li.productId));
    result = result.filter((p) => !addedIds.has(p.id));
    return result;
  }, [selectedSupplierId, productSearch, lineItems]);

  // Auto-detect supplier from first product if not manually set
  const autoSelectSupplier = useCallback((product: Product) => {
    if (!selectedSupplierId) {
      setSelectedSupplierId(product.supplier);
    }
  }, [selectedSupplierId]);

  const addProduct = useCallback((product: Product) => {
    autoSelectSupplier(product);
    const suggestedQty = Math.max(1, product.parLevel - product.currentStock);
    setLineItems((prev) => [
      ...prev,
      {
        id: `draft-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        productId: product.id,
        product,
        quantity: suggestedQty,
      },
    ]);
    setShowProductPicker(false);
    setProductSearch('');
  }, [autoSelectSupplier]);

  const removeProduct = useCallback((id: string) => {
    setLineItems((prev) => {
      const next = prev.filter((li) => li.id !== id);
      if (next.length === 0) setSelectedSupplierId('');
      return next;
    });
  }, []);

  const updateQuantity = useCallback((id: string, delta: number) => {
    setLineItems((prev) =>
      prev.map((li) => li.id === id ? { ...li, quantity: Math.max(1, li.quantity + delta) } : li)
    );
  }, []);

  // Calculate totals
  const poLineItems: POLineItem[] = lineItems.map((li) => ({
    id: li.id,
    productId: li.productId,
    productName: li.product.name,
    sku: li.product.sku,
    quantityOrdered: li.quantity,
    quantityReceived: 0,
    unitCost: li.product.unitCost,
    totalCost: li.quantity * li.product.unitCost,
  }));

  const discount = selectedSupplier?.bulkDiscountPercent && selectedSupplier.bulkDiscountMinimum
    ? poLineItems.reduce((s, li) => s + li.totalCost, 0) >= selectedSupplier.bulkDiscountMinimum
      ? poLineItems.reduce((s, li) => s + li.totalCost, 0) * (selectedSupplier.bulkDiscountPercent / 100)
      : 0
    : 0;

  const shipping = selectedSupplier?.freeShippingThreshold
    ? poLineItems.reduce((s, li) => s + li.totalCost, 0) >= selectedSupplier.freeShippingThreshold ? 0 : 25
    : 0;

  const totals = calculatePOTotal(poLineItems, discount, shipping);
  const approvalLevel = getApprovalLevel(totals.total);

  const handleSubmit = () => {
    if (!selectedSupplierId || lineItems.length === 0) return;
    onSubmit?.({
      supplierId: selectedSupplierId,
      priority,
      lineItems: poLineItems,
      notes,
      total: totals.total,
    });
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider">
            New Purchase Order
          </h3>
          <p className="text-xs font-body text-rani-muted mt-0.5">{generatePONumber()}</p>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-xs font-body text-rani-muted hover:text-rani-navy transition-colors"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Supplier + Priority */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] font-body font-semibold uppercase tracking-wider text-rani-muted mb-1.5">
            Supplier
          </label>
          <select
            value={selectedSupplierId}
            onChange={(e) => {
              setSelectedSupplierId(e.target.value);
              setLineItems([]);
            }}
            className="w-full h-10 px-3 rounded-lg bg-rani-cream/60 border border-rani-border/50 text-sm font-body text-rani-navy focus:outline-none focus:ring-2 focus:ring-rani-gold/30"
          >
            <option value="">Select supplier...</option>
            {suppliers.filter((s) => s.active).map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-body font-semibold uppercase tracking-wider text-rani-muted mb-1.5">
            Priority
          </label>
          <div className="flex gap-1.5">
            {(Object.keys(PO_PRIORITY_CONFIG) as POPriority[]).map((p) => {
              const config = PO_PRIORITY_CONFIG[p];
              return (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`flex-1 h-10 rounded-lg text-xs font-body font-medium transition-all ${
                    priority === p
                      ? `${config.bgColor} ${config.color} ring-2 ring-current/20`
                      : 'bg-rani-cream/60 text-rani-muted hover:bg-rani-cream'
                  }`}
                >
                  {config.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Supplier info bar */}
      {selectedSupplier && (
        <div className="flex flex-wrap gap-4 p-3 rounded-lg bg-rani-cream/40 border border-rani-border/30 text-[10px] font-body text-rani-muted">
          <span><strong>Lead Time:</strong> {selectedSupplier.leadTimeDays} days</span>
          <span><strong>Min Order:</strong> ${selectedSupplier.minimumOrderAmount}</span>
          <span><strong>Terms:</strong> {selectedSupplier.paymentTerms}</span>
          {selectedSupplier.freeShippingThreshold && (
            <span><strong>Free Shipping:</strong> ${selectedSupplier.freeShippingThreshold}+</span>
          )}
          {selectedSupplier.bulkDiscountPercent && (
            <span><strong>Bulk Discount:</strong> {selectedSupplier.bulkDiscountPercent}% on ${selectedSupplier.bulkDiscountMinimum}+</span>
          )}
        </div>
      )}

      {/* Line Items */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-[10px] font-body font-semibold uppercase tracking-wider text-rani-muted">
            Products ({lineItems.length})
          </label>
          <button
            onClick={() => setShowProductPicker(true)}
            disabled={!selectedSupplierId}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-body font-medium bg-rani-navy text-white hover:bg-rani-navy/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <Plus className="w-3 h-3" />
            Add Product
          </button>
        </div>

        {/* Product picker dropdown */}
        <AnimatePresence>
          {showProductPicker && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-3 p-3 rounded-lg border border-rani-border bg-white shadow-lg"
            >
              <div className="relative mb-2">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-rani-muted" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search products..."
                  autoFocus
                  className="w-full h-8 pl-8 pr-8 rounded-md bg-rani-cream/60 border border-rani-border/50 text-xs font-body text-rani-navy placeholder:text-rani-muted/50 focus:outline-none focus:ring-2 focus:ring-rani-gold/30"
                />
                <button
                  onClick={() => { setShowProductPicker(false); setProductSearch(''); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                >
                  <X className="w-3.5 h-3.5 text-rani-muted" />
                </button>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {availableProducts.length === 0 ? (
                  <p className="text-xs font-body text-rani-muted text-center py-4">No products found</p>
                ) : (
                  availableProducts.slice(0, 15).map((product) => (
                    <button
                      key={product.id}
                      onClick={() => addProduct(product)}
                      className="w-full flex items-center justify-between p-2 rounded-md hover:bg-rani-cream/60 text-left transition-colors"
                    >
                      <div>
                        <p className="text-xs font-body font-medium text-rani-navy">{product.name}</p>
                        <p className="text-[10px] font-body text-rani-muted">{product.sku} | Stock: {product.currentStock}</p>
                      </div>
                      <span className="text-xs font-body text-rani-muted">${product.unitCost}</span>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Line item rows */}
        <div className="space-y-2">
          {lineItems.map((li) => (
            <div
              key={li.id}
              className="flex items-center gap-3 p-3 rounded-lg border border-rani-border/30 bg-rani-cream/20"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-body font-medium text-rani-navy truncate">{li.product.name}</p>
                <p className="text-[10px] font-body text-rani-muted">
                  {li.product.sku} | ${li.product.unitCost}/unit | Need: {Math.max(0, li.product.parLevel - li.product.currentStock)}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => updateQuantity(li.id, -1)}
                  className="w-6 h-6 rounded-md bg-rani-cream flex items-center justify-center hover:bg-rani-border transition-colors"
                >
                  <Minus className="w-3 h-3 text-rani-muted" />
                </button>
                <span className="w-10 text-center text-sm font-body font-medium text-rani-navy">
                  {li.quantity}
                </span>
                <button
                  onClick={() => updateQuantity(li.id, 1)}
                  className="w-6 h-6 rounded-md bg-rani-cream flex items-center justify-center hover:bg-rani-border transition-colors"
                >
                  <Plus className="w-3 h-3 text-rani-muted" />
                </button>
              </div>
              <span className="text-sm font-body font-medium text-rani-navy w-20 text-right">
                ${(li.quantity * li.product.unitCost).toLocaleString()}
              </span>
              <button
                onClick={() => removeProduct(li.id)}
                className="w-6 h-6 rounded-md flex items-center justify-center text-rani-muted hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {lineItems.length === 0 && (
          <div className="text-center py-8 text-rani-muted">
            <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-xs font-body">Select a supplier, then add products</p>
          </div>
        )}
      </div>

      {/* Notes */}
      <div>
        <label className="block text-[10px] font-body font-semibold uppercase tracking-wider text-rani-muted mb-1.5">
          Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Internal notes for this order..."
          rows={2}
          className="w-full px-3 py-2 rounded-lg bg-rani-cream/60 border border-rani-border/50 text-sm font-body text-rani-navy placeholder:text-rani-muted/50 focus:outline-none focus:ring-2 focus:ring-rani-gold/30 resize-none"
        />
      </div>

      {/* Totals */}
      {lineItems.length > 0 && (
        <div className="border-t border-rani-border/30 pt-4 space-y-1.5">
          <div className="flex justify-between text-xs font-body text-rani-muted">
            <span>Subtotal</span>
            <span>${totals.subtotal.toLocaleString()}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-xs font-body text-emerald-600">
              <span>Bulk Discount ({selectedSupplier?.bulkDiscountPercent}%)</span>
              <span>-${discount.toFixed(2)}</span>
            </div>
          )}
          {shipping > 0 && (
            <div className="flex justify-between text-xs font-body text-rani-muted">
              <span>Shipping</span>
              <span>${shipping}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-body font-bold text-rani-navy pt-1.5 border-t border-rani-border/20">
            <span>Total</span>
            <span>${totals.total.toLocaleString()}</span>
          </div>

          {/* Approval level indicator */}
          <div className={`flex items-center gap-1.5 text-[10px] font-body mt-2 ${
            approvalLevel === 'ceo' ? 'text-red-600' : approvalLevel === 'manager' ? 'text-amber-600' : 'text-emerald-600'
          }`}>
            {approvalLevel === 'auto' ? (
              <><CheckCircle className="w-3 h-3" /> Auto-approved (under ${APPROVAL_THRESHOLDS.autoApprove})</>
            ) : approvalLevel === 'manager' ? (
              <><AlertTriangle className="w-3 h-3" /> Requires manager approval</>
            ) : (
              <><AlertTriangle className="w-3 h-3" /> Requires CEO approval (over ${APPROVAL_THRESHOLDS.ceoApproval.toLocaleString()})</>
            )}
          </div>

          {/* Min order warning */}
          {selectedSupplier && totals.subtotal < selectedSupplier.minimumOrderAmount && (
            <div className="flex items-center gap-1.5 text-[10px] font-body text-amber-600 mt-1">
              <AlertTriangle className="w-3 h-3" />
              Below minimum order (${selectedSupplier.minimumOrderAmount})
            </div>
          )}
        </div>
      )}

      {/* Submit */}
      <div className="flex gap-3">
        <button
          onClick={handleSubmit}
          disabled={lineItems.length === 0 || !selectedSupplierId}
          className="flex-1 h-10 rounded-lg bg-rani-navy text-white text-sm font-body font-medium hover:bg-rani-navy/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all inline-flex items-center justify-center gap-2"
        >
          <Truck className="w-4 h-4" />
          Submit Purchase Order
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            className="h-10 px-4 rounded-lg border border-rani-border text-sm font-body font-medium text-rani-muted hover:text-rani-navy hover:bg-rani-cream transition-all"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
