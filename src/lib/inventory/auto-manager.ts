/**
 * Inventory Auto-Management Engine
 *
 * Tracks supply levels, predicts reorder points, calculates optimal
 * stock levels based on booking patterns, and generates purchase orders.
 *
 * Capabilities:
 * 1. Usage rate calculation from appointment volume
 * 2. Automatic reorder point detection
 * 3. Par level optimization (min/max stock)
 * 4. Expiration tracking
 * 5. Cost optimization (bulk vs. JIT ordering)
 * 6. Waste reduction analysis
 * 7. Supplier comparison
 */

// ── TYPES ──

export interface InventoryInput {
  items: InventoryItem[];
  appointments: AppointmentConsumption[];
  suppliers: SupplierInfo[];
  orderHistory: OrderHistory[];
  lookbackDays?: number; // default 30
}

export interface InventoryItem {
  id: string;
  name: string;
  category: InventoryCategory;
  currentStock: number;
  unit: string; // "units", "ml", "syringes", "vials", "packs"
  unitCost: number;
  expirationDate?: string; // YYYY-MM-DD
  minStock: number; // par level — reorder when below this
  maxStock: number; // max storage capacity
  supplier: string;
  lastOrdered?: string;
  leadTimeDays: number; // delivery time
}

export type InventoryCategory =
  | 'injectables'
  | 'topicals'
  | 'laser_consumables'
  | 'facial_supplies'
  | 'wellness_supplies'
  | 'disposables'
  | 'retail'
  | 'office_supplies';

export interface AppointmentConsumption {
  date: string;
  service: string;
  itemsUsed: { itemId: string; quantity: number }[];
}

export interface SupplierInfo {
  name: string;
  items: string[]; // item IDs they supply
  avgLeadDays: number;
  minOrderAmount: number;
  bulkDiscountThreshold?: number;
  bulkDiscountPercent?: number;
  reliability: number; // 0-100
}

export interface OrderHistory {
  date: string;
  itemId: string;
  quantity: number;
  totalCost: number;
  supplier: string;
  received: boolean;
  receivedDate?: string;
}

// ── OUTPUT TYPES ──

export interface InventoryIntelligence {
  alerts: InventoryAlert[];
  reorderRecommendations: ReorderRecommendation[];
  usageAnalysis: UsageAnalysis[];
  wasteReport: WasteReport;
  costOptimizations: CostOptimization[];
  parLevelAdjustments: ParLevelAdjustment[];
  inventoryScore: number; // 0-100
  totalInventoryValue: number;
  monthlyConsumptionCost: number;
}

export interface InventoryAlert {
  type: 'low_stock' | 'out_of_stock' | 'expiring_soon' | 'expired' | 'overstock' | 'reorder_now';
  severity: 'info' | 'warning' | 'critical';
  itemId: string;
  itemName: string;
  message: string;
  action: string;
}

export interface ReorderRecommendation {
  itemId: string;
  itemName: string;
  currentStock: number;
  suggestedQuantity: number;
  urgency: 'immediate' | 'this_week' | 'next_order' | 'monitor';
  estimatedCost: number;
  supplier: string;
  reason: string;
  daysUntilStockout: number;
}

export interface UsageAnalysis {
  itemId: string;
  itemName: string;
  dailyUsageRate: number;
  weeklyUsageRate: number;
  monthlyUsageRate: number;
  costPerDay: number;
  costPerMonth: number;
  topConsumingServices: { service: string; usage: number }[];
  trend: 'increasing' | 'stable' | 'decreasing';
  daysOfStockRemaining: number;
}

export interface WasteReport {
  expiredItems: { item: string; quantity: number; value: number }[];
  nearExpiryItems: { item: string; quantity: number; daysLeft: number; value: number }[];
  totalWasteValue: number;
  wastePercentage: number;
  recommendations: string[];
}

export interface CostOptimization {
  type: 'bulk_order' | 'supplier_switch' | 'reduce_par' | 'negotiate' | 'substitute';
  description: string;
  currentCost: number;
  projectedCost: number;
  savings: number;
  savingsPercent: number;
}

export interface ParLevelAdjustment {
  itemId: string;
  itemName: string;
  currentMin: number;
  currentMax: number;
  suggestedMin: number;
  suggestedMax: number;
  reason: string;
}

// ── SERVICE-TO-SUPPLY MAPPING ──

const SERVICE_SUPPLY_MAP: Record<string, { itemCategory: InventoryCategory; estimatedUnitsPerSession: number }[]> = {
  'HydraFacial': [
    { itemCategory: 'facial_supplies', estimatedUnitsPerSession: 1 },
    { itemCategory: 'disposables', estimatedUnitsPerSession: 2 },
  ],
  'Botox': [
    { itemCategory: 'injectables', estimatedUnitsPerSession: 1 },
    { itemCategory: 'disposables', estimatedUnitsPerSession: 3 },
  ],
  'Fillers': [
    { itemCategory: 'injectables', estimatedUnitsPerSession: 1 },
    { itemCategory: 'disposables', estimatedUnitsPerSession: 3 },
  ],
  'VI Peel': [
    { itemCategory: 'topicals', estimatedUnitsPerSession: 1 },
    { itemCategory: 'disposables', estimatedUnitsPerSession: 2 },
  ],
  'RF Microneedling': [
    { itemCategory: 'laser_consumables', estimatedUnitsPerSession: 1 },
    { itemCategory: 'topicals', estimatedUnitsPerSession: 1 },
    { itemCategory: 'disposables', estimatedUnitsPerSession: 3 },
  ],
  'Laser Hair Removal': [
    { itemCategory: 'laser_consumables', estimatedUnitsPerSession: 0.5 },
    { itemCategory: 'topicals', estimatedUnitsPerSession: 1 },
    { itemCategory: 'disposables', estimatedUnitsPerSession: 2 },
  ],
  'GLP-1': [
    { itemCategory: 'wellness_supplies', estimatedUnitsPerSession: 1 },
    { itemCategory: 'disposables', estimatedUnitsPerSession: 2 },
  ],
  'NAD+': [
    { itemCategory: 'wellness_supplies', estimatedUnitsPerSession: 1 },
    { itemCategory: 'disposables', estimatedUnitsPerSession: 2 },
  ],
  'B12': [
    { itemCategory: 'wellness_supplies', estimatedUnitsPerSession: 1 },
    { itemCategory: 'disposables', estimatedUnitsPerSession: 1 },
  ],
};

// ── MAIN ENGINE ──

export function analyzeInventory(input: InventoryInput): InventoryIntelligence {
  const lookbackDays = input.lookbackDays || 30;
  const usageAnalysis = analyzeUsage(input, lookbackDays);
  const alerts = generateAlerts(input, usageAnalysis);
  const reorderRecommendations = generateReorderRecommendations(input, usageAnalysis);
  const wasteReport = analyzeWaste(input);
  const costOptimizations = findCostOptimizations(input, usageAnalysis);
  const parLevelAdjustments = suggestParLevels(input, usageAnalysis);
  const inventoryScore = calculateInventoryScore(input, alerts, usageAnalysis);

  const totalInventoryValue = input.items.reduce(
    (sum, item) => sum + item.currentStock * item.unitCost, 0
  );
  const monthlyConsumptionCost = usageAnalysis.reduce(
    (sum, u) => sum + u.costPerMonth, 0
  );

  return {
    alerts,
    reorderRecommendations,
    usageAnalysis,
    wasteReport,
    costOptimizations,
    parLevelAdjustments,
    inventoryScore,
    totalInventoryValue: Math.round(totalInventoryValue),
    monthlyConsumptionCost: Math.round(monthlyConsumptionCost),
  };
}

// ── USAGE ANALYSIS ──

function analyzeUsage(input: InventoryInput, lookbackDays: number): UsageAnalysis[] {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - lookbackDays);
  const cutoff = cutoffDate.toISOString().slice(0, 10);

  const recentConsumption = input.appointments.filter(a => a.date >= cutoff);

  return input.items.map(item => {
    // Calculate usage from consumption records
    let totalUsed = 0;
    const serviceUsage = new Map<string, number>();

    recentConsumption.forEach(appt => {
      appt.itemsUsed
        .filter(u => u.itemId === item.id)
        .forEach(u => {
          totalUsed += u.quantity;
          serviceUsage.set(
            appt.service,
            (serviceUsage.get(appt.service) || 0) + u.quantity
          );
        });
    });

    const dailyRate = totalUsed / lookbackDays;
    const weeklyRate = dailyRate * 7;
    const monthlyRate = dailyRate * 30;
    const daysRemaining = dailyRate > 0 ? Math.round(item.currentStock / dailyRate) : 999;

    // Trend: compare first half vs second half of lookback
    const midpoint = new Date();
    midpoint.setDate(midpoint.getDate() - Math.floor(lookbackDays / 2));
    const midStr = midpoint.toISOString().slice(0, 10);

    const firstHalf = recentConsumption
      .filter(a => a.date < midStr)
      .reduce((sum, a) => sum + a.itemsUsed
        .filter(u => u.itemId === item.id)
        .reduce((s, u) => s + u.quantity, 0), 0);

    const secondHalf = recentConsumption
      .filter(a => a.date >= midStr)
      .reduce((sum, a) => sum + a.itemsUsed
        .filter(u => u.itemId === item.id)
        .reduce((s, u) => s + u.quantity, 0), 0);

    const trend: 'increasing' | 'stable' | 'decreasing' =
      secondHalf > firstHalf * 1.15 ? 'increasing' :
      secondHalf < firstHalf * 0.85 ? 'decreasing' : 'stable';

    const topConsumingServices = Array.from(serviceUsage.entries())
      .map(([service, usage]) => ({ service, usage }))
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 5);

    return {
      itemId: item.id,
      itemName: item.name,
      dailyUsageRate: Math.round(dailyRate * 100) / 100,
      weeklyUsageRate: Math.round(weeklyRate * 100) / 100,
      monthlyUsageRate: Math.round(monthlyRate),
      costPerDay: Math.round(dailyRate * item.unitCost * 100) / 100,
      costPerMonth: Math.round(monthlyRate * item.unitCost),
      topConsumingServices,
      trend,
      daysOfStockRemaining: daysRemaining,
    };
  });
}

// ── ALERTS ──

function generateAlerts(input: InventoryInput, usage: UsageAnalysis[]): InventoryAlert[] {
  const alerts: InventoryAlert[] = [];
  const today = new Date().toISOString().slice(0, 10);

  for (const item of input.items) {
    const itemUsage = usage.find(u => u.itemId === item.id);

    // Out of stock
    if (item.currentStock <= 0) {
      alerts.push({
        type: 'out_of_stock',
        severity: 'critical',
        itemId: item.id,
        itemName: item.name,
        message: `${item.name} is OUT OF STOCK`,
        action: `Emergency order from ${item.supplier} — lead time ${item.leadTimeDays} days`,
      });
    }
    // Low stock (below par)
    else if (item.currentStock <= item.minStock) {
      alerts.push({
        type: 'low_stock',
        severity: 'warning',
        itemId: item.id,
        itemName: item.name,
        message: `${item.name}: ${item.currentStock} ${item.unit} remaining (min: ${item.minStock})`,
        action: `Reorder ${item.maxStock - item.currentStock} ${item.unit}`,
      });
    }

    // Reorder point (stock will hit 0 before delivery arrives)
    if (itemUsage && itemUsage.daysOfStockRemaining <= item.leadTimeDays + 3) {
      alerts.push({
        type: 'reorder_now',
        severity: item.currentStock <= item.minStock ? 'critical' : 'warning',
        itemId: item.id,
        itemName: item.name,
        message: `${item.name}: ~${itemUsage.daysOfStockRemaining} days of stock left, lead time is ${item.leadTimeDays} days`,
        action: `Order now to avoid stockout`,
      });
    }

    // Expiring soon (within 30 days)
    if (item.expirationDate) {
      const daysUntilExpiry = Math.ceil(
        (new Date(item.expirationDate).getTime() - new Date(today).getTime()) / 86400000
      );

      if (daysUntilExpiry <= 0) {
        alerts.push({
          type: 'expired',
          severity: 'critical',
          itemId: item.id,
          itemName: item.name,
          message: `${item.name} EXPIRED on ${item.expirationDate} — ${item.currentStock} ${item.unit} waste`,
          action: `Remove from inventory. Loss: $${(item.currentStock * item.unitCost).toFixed(0)}`,
        });
      } else if (daysUntilExpiry <= 30) {
        alerts.push({
          type: 'expiring_soon',
          severity: 'warning',
          itemId: item.id,
          itemName: item.name,
          message: `${item.name} expires in ${daysUntilExpiry} days (${item.currentStock} ${item.unit} remaining)`,
          action: `Prioritize usage. Consider promotional pricing for treatments using this product.`,
        });
      }
    }

    // Overstock
    if (item.currentStock > item.maxStock * 1.2) {
      alerts.push({
        type: 'overstock',
        severity: 'info',
        itemId: item.id,
        itemName: item.name,
        message: `${item.name}: ${item.currentStock} ${item.unit} exceeds max capacity (${item.maxStock})`,
        action: `Reduce next order quantity. Excess value: $${((item.currentStock - item.maxStock) * item.unitCost).toFixed(0)}`,
      });
    }
  }

  return alerts.sort((a, b) => {
    const sevOrder = { critical: 0, warning: 1, info: 2 };
    return sevOrder[a.severity] - sevOrder[b.severity];
  });
}

// ── REORDER RECOMMENDATIONS ──

function generateReorderRecommendations(
  input: InventoryInput,
  usage: UsageAnalysis[]
): ReorderRecommendation[] {
  return input.items
    .map(item => {
      const itemUsage = usage.find(u => u.itemId === item.id);
      const daysRemaining = itemUsage?.daysOfStockRemaining || 999;

      // Calculate optimal order quantity
      // Target: fill to max level + buffer for lead time
      const dailyRate = itemUsage?.dailyUsageRate || 0;
      const safetyStock = Math.ceil(dailyRate * item.leadTimeDays * 1.2); // 20% safety buffer
      const targetStock = item.maxStock;
      const orderQty = Math.max(0, targetStock - item.currentStock + safetyStock);

      if (orderQty <= 0) return null;

      const urgency: 'immediate' | 'this_week' | 'next_order' | 'monitor' =
        daysRemaining <= item.leadTimeDays ? 'immediate' :
        daysRemaining <= item.leadTimeDays + 7 ? 'this_week' :
        item.currentStock <= item.minStock * 1.2 ? 'next_order' : 'monitor';

      const reason =
        urgency === 'immediate' ? `Stock will run out in ${daysRemaining} days — order immediately` :
        urgency === 'this_week' ? `Below reorder point — ${daysRemaining} days of stock remaining` :
        urgency === 'next_order' ? `Approaching minimum stock level` :
        `Proactive reorder to maintain optimal levels`;

      return {
        itemId: item.id,
        itemName: item.name,
        currentStock: item.currentStock,
        suggestedQuantity: Math.ceil(orderQty),
        urgency,
        estimatedCost: Math.round(orderQty * item.unitCost),
        supplier: item.supplier,
        reason,
        daysUntilStockout: daysRemaining,
      };
    })
    .filter((r): r is ReorderRecommendation => r !== null)
    .sort((a, b) => {
      const urgOrder = { immediate: 0, this_week: 1, next_order: 2, monitor: 3 };
      return urgOrder[a.urgency] - urgOrder[b.urgency];
    });
}

// ── WASTE ANALYSIS ──

function analyzeWaste(input: InventoryInput): WasteReport {
  const today = new Date().toISOString().slice(0, 10);
  const thirtyDaysOut = new Date();
  thirtyDaysOut.setDate(thirtyDaysOut.getDate() + 30);
  const thirtyStr = thirtyDaysOut.toISOString().slice(0, 10);

  const expiredItems = input.items
    .filter(i => i.expirationDate && i.expirationDate < today && i.currentStock > 0)
    .map(i => ({
      item: i.name,
      quantity: i.currentStock,
      value: Math.round(i.currentStock * i.unitCost),
    }));

  const nearExpiryItems = input.items
    .filter(i => i.expirationDate && i.expirationDate >= today && i.expirationDate <= thirtyStr && i.currentStock > 0)
    .map(i => ({
      item: i.name,
      quantity: i.currentStock,
      daysLeft: Math.ceil((new Date(i.expirationDate!).getTime() - new Date(today).getTime()) / 86400000),
      value: Math.round(i.currentStock * i.unitCost),
    }));

  const totalWasteValue = expiredItems.reduce((sum, i) => sum + i.value, 0);
  const totalInventoryValue = input.items.reduce((sum, i) => sum + i.currentStock * i.unitCost, 0);
  const wastePercentage = totalInventoryValue > 0
    ? Math.round((totalWasteValue / totalInventoryValue) * 100)
    : 0;

  const recommendations: string[] = [];
  if (expiredItems.length > 0) {
    recommendations.push(`Remove ${expiredItems.length} expired items — $${totalWasteValue} in waste`);
  }
  if (nearExpiryItems.length > 0) {
    const atRiskValue = nearExpiryItems.reduce((s, i) => s + i.value, 0);
    recommendations.push(`${nearExpiryItems.length} items expiring within 30 days ($${atRiskValue}) — prioritize usage or run promotions`);
  }
  if (wastePercentage > 5) {
    recommendations.push('Waste rate above 5% — consider smaller, more frequent orders to reduce expiration risk');
  }

  return { expiredItems, nearExpiryItems, totalWasteValue, wastePercentage, recommendations };
}

// ── COST OPTIMIZATION ──

function findCostOptimizations(
  input: InventoryInput,
  usage: UsageAnalysis[]
): CostOptimization[] {
  const optimizations: CostOptimization[] = [];

  // Bulk ordering opportunities
  for (const supplier of input.suppliers) {
    if (!supplier.bulkDiscountThreshold || !supplier.bulkDiscountPercent) continue;

    const supplierItems = input.items.filter(i => i.supplier === supplier.name);
    const currentMonthlySpend = supplierItems.reduce((sum, item) => {
      const itemUsage = usage.find(u => u.itemId === item.id);
      return sum + (itemUsage?.costPerMonth || 0);
    }, 0);

    if (currentMonthlySpend > 0 && currentMonthlySpend < supplier.bulkDiscountThreshold) {
      const gapToThreshold = supplier.bulkDiscountThreshold - currentMonthlySpend;
      const savings = currentMonthlySpend * (supplier.bulkDiscountPercent / 100);

      if (savings > gapToThreshold * 0.5) {
        optimizations.push({
          type: 'bulk_order',
          description: `Increase ${supplier.name} order by $${Math.round(gapToThreshold)} to hit bulk discount threshold`,
          currentCost: Math.round(currentMonthlySpend),
          projectedCost: Math.round(currentMonthlySpend * (1 - supplier.bulkDiscountPercent / 100)),
          savings: Math.round(savings),
          savingsPercent: supplier.bulkDiscountPercent,
        });
      }
    }
  }

  // Overstock reduction
  const overstocked = input.items.filter(i => i.currentStock > i.maxStock);
  if (overstocked.length > 0) {
    const excessValue = overstocked.reduce(
      (sum, i) => sum + (i.currentStock - i.maxStock) * i.unitCost, 0
    );
    optimizations.push({
      type: 'reduce_par',
      description: `${overstocked.length} items overstocked — $${Math.round(excessValue)} in excess inventory tying up cash`,
      currentCost: Math.round(excessValue),
      projectedCost: 0,
      savings: Math.round(excessValue),
      savingsPercent: 100,
    });
  }

  return optimizations.sort((a, b) => b.savings - a.savings);
}

// ── PAR LEVEL ADJUSTMENT ──

function suggestParLevels(
  input: InventoryInput,
  usage: UsageAnalysis[]
): ParLevelAdjustment[] {
  const adjustments: ParLevelAdjustment[] = [];

  for (const item of input.items) {
    const itemUsage = usage.find(u => u.itemId === item.id);
    if (!itemUsage) continue;

    // Optimal min = daily usage × (lead time + safety days)
    const safetyDays = 3;
    const optimalMin = Math.ceil(itemUsage.dailyUsageRate * (item.leadTimeDays + safetyDays));

    // Optimal max = min + (daily usage × reorder cycle days)
    const reorderCycle = 14; // reorder every 2 weeks
    const optimalMax = optimalMin + Math.ceil(itemUsage.dailyUsageRate * reorderCycle);

    // Only suggest if significantly different
    const minDiff = Math.abs(optimalMin - item.minStock);
    const maxDiff = Math.abs(optimalMax - item.maxStock);

    if (minDiff > item.minStock * 0.2 || maxDiff > item.maxStock * 0.2) {
      let reason = '';
      if (itemUsage.trend === 'increasing') {
        reason = `Usage trending up — increase par levels to prevent stockouts`;
      } else if (itemUsage.trend === 'decreasing') {
        reason = `Usage trending down — reduce par levels to minimize carrying costs`;
      } else {
        reason = `Optimized based on ${itemUsage.dailyUsageRate.toFixed(1)} ${item.unit}/day usage rate and ${item.leadTimeDays}-day lead time`;
      }

      adjustments.push({
        itemId: item.id,
        itemName: item.name,
        currentMin: item.minStock,
        currentMax: item.maxStock,
        suggestedMin: optimalMin,
        suggestedMax: optimalMax,
        reason,
      });
    }
  }

  return adjustments;
}

// ── INVENTORY SCORE ──

function calculateInventoryScore(
  input: InventoryInput,
  alerts: InventoryAlert[],
  usage: UsageAnalysis[]
): number {
  let score = 100;

  // Deductions for critical alerts
  const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;
  const warningAlerts = alerts.filter(a => a.severity === 'warning').length;
  score -= criticalAlerts * 15;
  score -= warningAlerts * 5;

  // Deductions for items near stockout
  const nearStockout = usage.filter(u => u.daysOfStockRemaining < 7).length;
  score -= nearStockout * 10;

  // Bonus for well-stocked items
  const wellStocked = input.items.filter(i =>
    i.currentStock >= i.minStock && i.currentStock <= i.maxStock
  ).length;
  const stockHealth = input.items.length > 0 ? wellStocked / input.items.length : 0;
  score += Math.round(stockHealth * 10);

  return Math.max(0, Math.min(100, score));
}
