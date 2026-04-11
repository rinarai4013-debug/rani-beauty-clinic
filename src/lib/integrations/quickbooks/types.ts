// ═══════════════════════════════════════════════════════════════
// QuickBooks Online — TypeScript Types
// Full type definitions for QBO API entities
// ═══════════════════════════════════════════════════════════════

/* ─── OAuth & Config ────────────────────────────────────────── */

export interface QBOConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  realmId: string;
  environment: 'sandbox' | 'production';
}

export interface QBOTokens {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: number; // Unix timestamp ms
  refreshTokenExpiresAt: number; // Unix timestamp ms
  realmId: string;
}

export interface QBOAuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: 'bearer';
  expires_in: number; // seconds
  x_refresh_token_expires_in: number; // seconds
}

/* ─── Common QBO Patterns ───────────────────────────────────── */

export interface QBORef {
  value: string;
  name?: string;
}

export interface QBOAddress {
  Id?: string;
  Line1?: string;
  Line2?: string;
  Line3?: string;
  City?: string;
  CountrySubDivisionCode?: string;
  PostalCode?: string;
  Country?: string;
  Lat?: string;
  Long?: string;
}

export interface QBOPhoneNumber {
  FreeFormNumber?: string;
}

export interface QBOEmailAddress {
  Address?: string;
}

export interface QBOMetaData {
  CreateTime: string;
  LastUpdatedTime: string;
}

export interface QBOLinkedTxn {
  TxnId: string;
  TxnType: string;
  TxnLineDetail?: Record<string, unknown>;
}

/* ─── Account ───────────────────────────────────────────────── */

export type QBOAccountType =
  | 'Bank'
  | 'Accounts Receivable'
  | 'Other Current Asset'
  | 'Fixed Asset'
  | 'Other Asset'
  | 'Accounts Payable'
  | 'Credit Card'
  | 'Other Current Liability'
  | 'Long Term Liability'
  | 'Equity'
  | 'Income'
  | 'Cost of Goods Sold'
  | 'Expense'
  | 'Other Income'
  | 'Other Expense';

export type QBOAccountSubType =
  | 'CashOnHand'
  | 'Checking'
  | 'MoneyMarket'
  | 'Savings'
  | 'AccountsReceivable'
  | 'AllowanceForBadDebts'
  | 'DevelopmentCosts'
  | 'EmployeeCashAdvances'
  | 'Inventory'
  | 'LoansToOfficers'
  | 'OtherCurrentAssets'
  | 'PrepaidExpenses'
  | 'Retainage'
  | 'UndepositedFunds'
  | 'AccumulatedDepreciation'
  | 'Buildings'
  | 'FurnitureAndFixtures'
  | 'Land'
  | 'LeaseholdImprovements'
  | 'MachineryAndEquipment'
  | 'Vehicles'
  | 'AccountsPayable'
  | 'CreditCard'
  | 'LineOfCredit'
  | 'LoanPayable'
  | 'OtherCurrentLiabilities'
  | 'PayrollClearing'
  | 'PayrollTaxPayable'
  | 'SalesTaxPayable'
  | 'OpeningBalanceEquity'
  | 'RetainedEarnings'
  | 'ServiceFeeIncome'
  | 'SalesOfProductIncome'
  | 'OtherPrimaryIncome'
  | 'AdvertisingPromotional'
  | 'Insurance'
  | 'LegalProfessionalFees'
  | 'OfficeGeneralAdministrativeExpenses'
  | 'RentOrLeaseOfBuildings'
  | 'RepairMaintenance'
  | 'Utilities'
  | 'PayrollExpenses'
  | 'SuppliesMaterials'
  | string;

export interface QBOAccount {
  Id: string;
  Name: string;
  AccountType: QBOAccountType;
  AccountSubType: QBOAccountSubType;
  CurrentBalance: number;
  CurrentBalanceWithSubAccounts?: number;
  Active: boolean;
  Classification: 'Asset' | 'Equity' | 'Expense' | 'Liability' | 'Revenue';
  FullyQualifiedName: string;
  Description?: string;
  AcctNum?: string;
  SubAccount?: boolean;
  ParentRef?: QBORef;
  CurrencyRef?: QBORef;
  MetaData: QBOMetaData;
  SyncToken: string;
  domain: string;
  sparse: boolean;
}

/* ─── Customer ──────────────────────────────────────────────── */

export interface QBOCustomer {
  Id: string;
  DisplayName: string;
  GivenName?: string;
  FamilyName?: string;
  MiddleName?: string;
  CompanyName?: string;
  PrimaryPhone?: QBOPhoneNumber;
  PrimaryEmailAddr?: QBOEmailAddress;
  BillAddr?: QBOAddress;
  ShipAddr?: QBOAddress;
  Balance: number;
  BalanceWithJobs?: number;
  Active: boolean;
  Taxable?: boolean;
  Notes?: string;
  Job?: boolean;
  ParentRef?: QBORef;
  Level?: number;
  PreferredDeliveryMethod?: 'Print' | 'Email' | 'None';
  CurrencyRef?: QBORef;
  MetaData: QBOMetaData;
  SyncToken: string;
}

/* ─── Vendor ────────────────────────────────────────────────── */

export interface QBOVendor {
  Id: string;
  DisplayName: string;
  GivenName?: string;
  FamilyName?: string;
  CompanyName?: string;
  PrimaryPhone?: QBOPhoneNumber;
  PrimaryEmailAddr?: QBOEmailAddress;
  BillAddr?: QBOAddress;
  Balance: number;
  Active: boolean;
  Vendor1099?: boolean;
  TaxIdentifier?: string;
  AcctNum?: string;
  CurrencyRef?: QBORef;
  MetaData: QBOMetaData;
  SyncToken: string;
}

/* ─── Item (Service/Product) ────────────────────────────────── */

export type QBOItemType = 'Inventory' | 'Service' | 'NonInventory' | 'Group' | 'Category';

export interface QBOItem {
  Id: string;
  Name: string;
  Type: QBOItemType;
  Description?: string;
  Active: boolean;
  FullyQualifiedName: string;
  Taxable?: boolean;
  UnitPrice?: number;
  PurchaseCost?: number;
  QtyOnHand?: number;
  IncomeAccountRef?: QBORef;
  ExpenseAccountRef?: QBORef;
  AssetAccountRef?: QBORef;
  SubItem?: boolean;
  ParentRef?: QBORef;
  Level?: number;
  Sku?: string;
  SalesTaxCodeRef?: QBORef;
  PurchaseTaxCodeRef?: QBORef;
  MetaData: QBOMetaData;
  SyncToken: string;
}

/* ─── Invoice ───────────────────────────────────────────────── */

export interface QBOInvoiceLine {
  Id?: string;
  LineNum?: number;
  Amount: number;
  DetailType: 'SalesItemLineDetail' | 'SubTotalLineDetail' | 'DiscountLineDetail' | 'DescriptionOnly' | 'GroupLineDetail';
  Description?: string;
  SalesItemLineDetail?: {
    ItemRef: QBORef;
    UnitPrice?: number;
    Qty?: number;
    TaxCodeRef?: QBORef;
    ServiceDate?: string;
    ClassRef?: QBORef;
  };
  SubTotalLineDetail?: Record<string, unknown>;
  DiscountLineDetail?: {
    PercentBased?: boolean;
    DiscountPercent?: number;
    DiscountAccountRef?: QBORef;
  };
}

export interface QBOInvoice {
  Id: string;
  DocNumber?: string;
  TxnDate: string;
  DueDate?: string;
  CustomerRef: QBORef;
  Line: QBOInvoiceLine[];
  TotalAmt: number;
  Balance: number;
  Deposit?: number;
  CustomerMemo?: { value: string };
  BillAddr?: QBOAddress;
  ShipAddr?: QBOAddress;
  BillEmail?: QBOEmailAddress;
  EmailStatus?: 'NotSet' | 'NeedToSend' | 'EmailSent';
  PrintStatus?: 'NotSet' | 'NeedToPrint' | 'PrintComplete';
  SalesTermRef?: QBORef;
  DepartmentRef?: QBORef;
  ClassRef?: QBORef;
  TxnTaxDetail?: QBOTxnTaxDetail;
  LinkedTxn?: QBOLinkedTxn[];
  AllowIPNPayment?: boolean;
  AllowOnlinePayment?: boolean;
  AllowOnlineCreditCardPayment?: boolean;
  AllowOnlineACHPayment?: boolean;
  PrivateNote?: string;
  CustomField?: QBOCustomField[];
  CurrencyRef?: QBORef;
  MetaData: QBOMetaData;
  SyncToken: string;
}

/* ─── Payment ───────────────────────────────────────────────── */

export interface QBOPaymentLine {
  Amount: number;
  LinkedTxn: QBOLinkedTxn[];
}

export interface QBOPayment {
  Id: string;
  TotalAmt: number;
  TxnDate: string;
  CustomerRef: QBORef;
  DepositToAccountRef?: QBORef;
  PaymentMethodRef?: QBORef;
  PaymentRefNum?: string;
  Line: QBOPaymentLine[];
  UnappliedAmt?: number;
  ProcessPayment?: boolean;
  CurrencyRef?: QBORef;
  PrivateNote?: string;
  MetaData: QBOMetaData;
  SyncToken: string;
}

/* ─── Bill ──────────────────────────────────────────────────── */

export interface QBOBillLine {
  Id?: string;
  LineNum?: number;
  Amount: number;
  DetailType: 'AccountBasedExpenseLineDetail' | 'ItemBasedExpenseLineDetail';
  Description?: string;
  AccountBasedExpenseLineDetail?: {
    AccountRef: QBORef;
    BillableStatus?: 'Billable' | 'NotBillable' | 'HasBeenBilled';
    CustomerRef?: QBORef;
    ClassRef?: QBORef;
    TaxCodeRef?: QBORef;
  };
  ItemBasedExpenseLineDetail?: {
    ItemRef: QBORef;
    UnitPrice?: number;
    Qty?: number;
    ClassRef?: QBORef;
    BillableStatus?: 'Billable' | 'NotBillable' | 'HasBeenBilled';
    CustomerRef?: QBORef;
    TaxCodeRef?: QBORef;
  };
}

export interface QBOBill {
  Id: string;
  DocNumber?: string;
  TxnDate: string;
  DueDate?: string;
  VendorRef: QBORef;
  Line: QBOBillLine[];
  TotalAmt: number;
  Balance: number;
  APAccountRef?: QBORef;
  DepartmentRef?: QBORef;
  SalesTermRef?: QBORef;
  LinkedTxn?: QBOLinkedTxn[];
  TxnTaxDetail?: QBOTxnTaxDetail;
  PrivateNote?: string;
  CurrencyRef?: QBORef;
  MetaData: QBOMetaData;
  SyncToken: string;
}

/* ─── Purchase (Expense/Check) ──────────────────────────────── */

export type QBOPaymentType = 'Cash' | 'Check' | 'CreditCard';

export interface QBOPurchase {
  Id: string;
  PaymentType: QBOPaymentType;
  TxnDate: string;
  AccountRef: QBORef;
  EntityRef?: QBORef;
  Line: QBOBillLine[];
  TotalAmt: number;
  DocNumber?: string;
  DepartmentRef?: QBORef;
  Credit?: boolean;
  TxnTaxDetail?: QBOTxnTaxDetail;
  PrivateNote?: string;
  CurrencyRef?: QBORef;
  MetaData: QBOMetaData;
  SyncToken: string;
}

/* ─── Class (Provider/Location mapping) ─────────────────────── */

export interface QBOClass {
  Id: string;
  Name: string;
  FullyQualifiedName: string;
  Active: boolean;
  SubClass?: boolean;
  ParentRef?: QBORef;
  MetaData: QBOMetaData;
  SyncToken: string;
}

/* ─── Department ────────────────────────────────────────────── */

export interface QBODepartment {
  Id: string;
  Name: string;
  FullyQualifiedName: string;
  Active: boolean;
  SubDepartment?: boolean;
  ParentRef?: QBORef;
  MetaData: QBOMetaData;
  SyncToken: string;
}

/* ─── Tax Code ──────────────────────────────────────────────── */

export interface QBOTaxCode {
  Id: string;
  Name: string;
  Description?: string;
  Active: boolean;
  Taxable: boolean;
  TaxGroup: boolean;
  SalesTaxRateList?: {
    TaxRateDetail: Array<{
      TaxRateRef: QBORef;
      TaxTypeApplicable: string;
      TaxOrder: number;
    }>;
  };
  PurchaseTaxRateList?: {
    TaxRateDetail: Array<{
      TaxRateRef: QBORef;
      TaxTypeApplicable: string;
      TaxOrder: number;
    }>;
  };
  MetaData: QBOMetaData;
  SyncToken: string;
}

export interface QBOTaxRate {
  Id: string;
  Name: string;
  Description?: string;
  RateValue: number;
  AgencyRef?: QBORef;
  SpecialTaxType?: string;
  Active: boolean;
  MetaData: QBOMetaData;
  SyncToken: string;
}

export interface QBOTxnTaxDetail {
  TotalTax?: number;
  TxnTaxCodeRef?: QBORef;
  TaxLine?: Array<{
    Amount: number;
    DetailType: 'TaxLineDetail';
    TaxLineDetail: {
      TaxRateRef: QBORef;
      PercentBased: boolean;
      TaxPercent: number;
      NetAmountTaxable: number;
    };
  }>;
}

/* ─── Employee ──────────────────────────────────────────────── */

export interface QBOEmployee {
  Id: string;
  DisplayName: string;
  GivenName?: string;
  FamilyName?: string;
  MiddleName?: string;
  PrimaryPhone?: QBOPhoneNumber;
  PrimaryEmailAddr?: QBOEmailAddress;
  PrimaryAddr?: QBOAddress;
  Active: boolean;
  BillableTime?: boolean;
  HiredDate?: string;
  ReleasedDate?: string;
  SSN?: string;
  EmployeeNumber?: string;
  MetaData: QBOMetaData;
  SyncToken: string;
}

/* ─── Custom Field ──────────────────────────────────────────── */

export interface QBOCustomField {
  DefinitionId: string;
  Name: string;
  Type: 'StringType' | 'NumberType' | 'DateType';
  StringValue?: string;
  NumberValue?: number;
  DateValue?: string;
}

/* ─── Estimate ──────────────────────────────────────────────── */

export interface QBOEstimate {
  Id: string;
  DocNumber?: string;
  TxnDate: string;
  ExpirationDate?: string;
  CustomerRef: QBORef;
  Line: QBOInvoiceLine[];
  TotalAmt: number;
  TxnStatus: 'Pending' | 'Accepted' | 'Closed' | 'Rejected' | 'Converted';
  BillAddr?: QBOAddress;
  ShipAddr?: QBOAddress;
  BillEmail?: QBOEmailAddress;
  CustomerMemo?: { value: string };
  ClassRef?: QBORef;
  DepartmentRef?: QBORef;
  PrivateNote?: string;
  TxnTaxDetail?: QBOTxnTaxDetail;
  LinkedTxn?: QBOLinkedTxn[];
  CurrencyRef?: QBORef;
  MetaData: QBOMetaData;
  SyncToken: string;
}

/* ─── Credit Memo ───────────────────────────────────────────── */

export interface QBOCreditMemo {
  Id: string;
  DocNumber?: string;
  TxnDate: string;
  CustomerRef: QBORef;
  Line: QBOInvoiceLine[];
  TotalAmt: number;
  RemainingCredit: number;
  BillAddr?: QBOAddress;
  BillEmail?: QBOEmailAddress;
  ClassRef?: QBORef;
  DepartmentRef?: QBORef;
  TxnTaxDetail?: QBOTxnTaxDetail;
  PrivateNote?: string;
  CurrencyRef?: QBORef;
  MetaData: QBOMetaData;
  SyncToken: string;
}

/* ─── Journal Entry ─────────────────────────────────────────── */

export interface QBOJournalEntryLine {
  Id?: string;
  Amount: number;
  DetailType: 'JournalEntryLineDetail';
  Description?: string;
  JournalEntryLineDetail: {
    PostingType: 'Debit' | 'Credit';
    AccountRef: QBORef;
    ClassRef?: QBORef;
    DepartmentRef?: QBORef;
    Entity?: {
      Type: 'Customer' | 'Vendor' | 'Employee';
      EntityRef: QBORef;
    };
  };
}

export interface QBOJournalEntry {
  Id: string;
  DocNumber?: string;
  TxnDate: string;
  Line: QBOJournalEntryLine[];
  TotalAmt: number;
  Adjustment?: boolean;
  PrivateNote?: string;
  CurrencyRef?: QBORef;
  MetaData: QBOMetaData;
  SyncToken: string;
}

/* ─── Transfer ──────────────────────────────────────────────── */

export interface QBOTransfer {
  Id: string;
  Amount: number;
  TxnDate: string;
  FromAccountRef: QBORef;
  ToAccountRef: QBORef;
  PrivateNote?: string;
  MetaData: QBOMetaData;
  SyncToken: string;
}

/* ─── Deposit ───────────────────────────────────────────────── */

export interface QBODeposit {
  Id: string;
  TxnDate: string;
  DepositToAccountRef: QBORef;
  Line: Array<{
    Amount: number;
    DetailType: 'DepositLineDetail';
    DepositLineDetail: {
      AccountRef?: QBORef;
      PaymentMethodRef?: QBORef;
      Entity?: QBORef;
      ClassRef?: QBORef;
    };
    Description?: string;
    LinkedTxn?: QBOLinkedTxn[];
  }>;
  TotalAmt: number;
  CashBack?: {
    AccountRef: QBORef;
    Amount: number;
    Memo?: string;
  };
  PrivateNote?: string;
  CurrencyRef?: QBORef;
  MetaData: QBOMetaData;
  SyncToken: string;
}

/* ─── Reports ───────────────────────────────────────────────── */

export interface QBOReportColumn {
  ColTitle: string;
  ColType: string;
  MetaData?: Array<{ Name: string; Value: string }>;
}

export interface QBOReportRow {
  type?: 'Section' | 'Data' | 'GrandTotal';
  group?: string;
  Header?: { ColData: Array<{ value: string; id?: string }> };
  Rows?: { Row: QBOReportRow[] };
  Summary?: { ColData: Array<{ value: string; id?: string }> };
  ColData?: Array<{ value: string; id?: string }>;
}

export interface QBOReport {
  Header: {
    Time: string;
    ReportName: string;
    ReportBasis: 'Accrual' | 'Cash';
    StartPeriod: string;
    EndPeriod: string;
    Currency: string;
    Option?: Array<{ Name: string; Value: string }>;
  };
  Columns: { Column: QBOReportColumn[] };
  Rows: { Row: QBOReportRow[] };
}

/* ─── CDC (Change Data Capture) ─────────────────────────────── */

export interface QBOCDCResponse {
  CDCResponse: Array<{
    QueryResponse: Array<{
      [entityType: string]: Array<Record<string, unknown>>;
      startPosition?: never;
      maxResults?: never;
    }>;
  }>;
  time: string;
}

/* ─── Query Response ────────────────────────────────────────── */

export interface QBOQueryResponse<T> {
  QueryResponse: {
    [key: string]: T[];
    startPosition?: never;
    maxResults?: never;
    totalCount?: never;
  };
  time: string;
}

/* ─── Webhook ───────────────────────────────────────────────── */

export interface QBOWebhookNotification {
  eventNotifications: Array<{
    realmId: string;
    dataChangeEvent: {
      entities: Array<{
        name: string;
        id: string;
        operation: 'Create' | 'Update' | 'Delete' | 'Merge' | 'Void';
        lastUpdated: string;
      }>;
    };
  }>;
}

/* ─── Error ──────────────────────────────────────────────────── */

export interface QBOError {
  Fault: {
    Error: Array<{
      Message: string;
      Detail: string;
      code: string;
      element?: string;
    }>;
    type: 'ValidationFault' | 'AuthenticationFault' | 'AuthorizationFault' | 'SystemFault';
  };
  time: string;
}

/* ─── Clinic-Specific Mapped Types ──────────────────────────── */

export type ClinicExpenseCategory =
  | 'rent'
  | 'supplies'
  | 'payroll'
  | 'marketing'
  | 'insurance'
  | 'equipment'
  | 'utilities'
  | 'professional_services';

export interface ClinicTransaction {
  id: string;
  qboId: string;
  type: 'income' | 'expense';
  category: ClinicExpenseCategory | 'service_revenue' | 'product_revenue' | 'other_income';
  amount: number;
  date: string;
  description: string;
  vendorOrCustomer?: string;
  accountName?: string;
  className?: string; // Provider mapping
  departmentName?: string;
  memo?: string;
  syncedAt: string;
}

export interface ClinicFinancialSummary {
  period: { start: string; end: string };
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  revenueByCategory: Record<string, number>;
  expensesByCategory: Record<ClinicExpenseCategory, number>;
  revenueByProvider: Record<string, number>;
  cashBalance: number;
  accountsReceivable: number;
  accountsPayable: number;
}

export interface SyncStatus {
  lastSyncAt: string | null;
  lastFullSyncAt: string | null;
  syncInProgress: boolean;
  recordsSynced: number;
  errors: Array<{ entity: string; id: string; error: string; timestamp: string }>;
  nextSyncAt: string | null;
}

export interface QBOConnectionStatus {
  connected: boolean;
  realmId: string | null;
  companyName: string | null;
  lastAuthenticated: string | null;
  tokenExpiresAt: string | null;
  environment: 'sandbox' | 'production';
}

/* ─── Budget ────────────────────────────────────────────────── */

export interface ClinicBudget {
  month: string; // YYYY-MM
  categories: Record<ClinicExpenseCategory, { budgeted: number; actual: number }>;
  revenueTarget: number;
  actualRevenue: number;
}

/* ─── Payroll Types ─────────────────────────────────────────── */

export interface ProviderCompensation {
  providerId: string;
  providerName: string;
  baseSalary: number;
  commissionRate: number; // Percentage
  commissionEarned: number;
  totalCompensation: number;
  serviceRevenue: number;
  revenuePerHour: number;
  hoursWorked: number;
  laborCostRatio: number;
  period: { start: string; end: string };
}

export interface PayrollSummary {
  period: { start: string; end: string };
  totalPayroll: number;
  totalCommissions: number;
  totalBenefits: number;
  payrollTaxEstimate: number;
  providers: ProviderCompensation[];
  laborCostRatio: number;
  revenuePerEmployeeHour: number;
}

/* ─── Invoice Templates ─────────────────────────────────────── */

export interface ClinicInvoiceInput {
  clientName: string;
  clientEmail: string;
  treatments: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    providerName?: string;
    serviceDate?: string;
  }>;
  dueDate?: string;
  memo?: string;
  isPaymentPlan?: boolean;
  paymentPlanInstallments?: number;
}

export interface PaymentPlan {
  invoiceId: string;
  totalAmount: number;
  installmentCount: number;
  installmentAmount: number;
  schedule: Array<{
    dueDate: string;
    amount: number;
    status: 'pending' | 'paid' | 'overdue';
    paymentId?: string;
  }>;
}
