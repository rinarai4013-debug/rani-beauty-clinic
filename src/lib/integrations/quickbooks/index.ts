// ═══════════════════════════════════════════════════════════════
// QuickBooks Online Integration — Public API
// ═══════════════════════════════════════════════════════════════

// Client
export {
  qboClient,
  getQBOConfig,
  getAuthorizationUrl,
  exchangeCodeForTokens,
  refreshAccessToken,
  revokeTokens,
  getStoredTokens,
  storeTokens,
  clearTokens,
  QBOApiError,
  QBOAuthError,
} from './client';

// Sync
export {
  incrementalSync,
  fullReconciliation,
  handleWebhook,
  getSyncStatus,
  getTransactionCache,
  getTransactionsByDateRange,
  getTransactionsByCategory,
  getTransactionsByType,
  mapToExpenseCategory,
  getAccountCache,
  getCustomerCache,
  getVendorCache,
  getItemCache,
  getClassCache,
} from './sync';

// Reports
export {
  getProfitAndLoss,
  getBalanceSheet,
  getCashFlowStatement,
  getARAgingSummary,
  getAPAgingSummary,
  getRevenueByService,
  getExpenseBreakdown,
  getTaxSummary,
  getBudgetVsActual,
  getProviderProfitability,
  getFinancialSummary,
  setBudget,
} from './reports';

// Invoices
export {
  createInvoice,
  createPaymentPlanInvoices,
  recordPayment,
  getOverdueInvoices,
  getUnpaidInvoices,
  getCustomerInvoices,
  getInvoice,
  getInvoiceAnalytics,
  getPaymentReminders,
  sendInvoice,
  voidInvoice,
} from './invoice';

// Payroll
export {
  calculateCommissions,
  estimatePayrollTaxes,
  getBenefitsCostAllocation,
  getRevenuePerEmployeeHour,
  getLaborCostAnalysis,
  getPayrollSummary,
  setProviderConfigs,
  getProviderConfigs,
  getQBOEmployees,
  syncProviderConfigsFromQBO,
} from './payroll';

// Types
export type * from './types';
