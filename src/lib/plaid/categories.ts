import type { RaniExpenseCategory, CategoryMappingRule } from '@/types/plaid';

export const DEFAULT_CATEGORY_MAPPINGS: CategoryMappingRule[] = [
  // Revenue / deposits
  { pattern: 'INCOME|DEPOSIT|TRANSFER_IN|DIRECT DEP', raniCategory: 'revenue-deposit', priority: 100 },

  // Ad spend
  { pattern: 'META|FACEBOOK|FACEBK|GOOGLE ADS|GOOG AD|TIKTOK ADS', raniCategory: 'ad-spend', priority: 90 },

  // Payroll
  { pattern: 'ADP|GUSTO|PAYCHEX|PAYROLL|QUICKBOOKS PAY|SQUARE PAY', plaidCategory: 'PAYROLL', raniCategory: 'payroll', priority: 90 },

  // Software
  { pattern: 'MANGOMINT|MAILCHIMP|CANVA|ZAPIER|NOTION|SLACK|ZOOM|DROPBOX|SQUARE|STRIPE|TYPEFORM|N8N|VERCEL|RESEND|SENDGRID|TWILIO', raniCategory: 'software', priority: 85 },

  // Insurance
  { pattern: 'INSURANCE|GEICO|STATE FARM|LIBERTY|ALLSTATE|HARTFORD|HISCOX', raniCategory: 'insurance', priority: 85 },

  // Device rentals
  { pattern: 'CUTERA|SOFWAVE|HYDRAFACIAL|SCITON|CYNOSURE|CANDELA|LEASE|EQUIPMENT RENTAL', raniCategory: 'device-rental', priority: 80 },

  // Rent / utilities
  { pattern: 'RENT|ELECTRIC|GAS BILL|WATER|INTERNET|COMCAST|AT&T|VERIZON|T-MOBILE|XFINITY|PG&E|PSE|SEATTLE CITY', plaidCategory: 'RENT_AND_UTILITIES', raniCategory: 'rent', priority: 80 },

  // Inventory
  { pattern: 'PHARMACY|OLYMPIA|MEDICAL SUPPLY|AMAZON|COSTCO|SKIN CARE|ESTHETICIAN|ALLERGAN|GALDERMA|MERZ|SKINMEDICA|OBAGI', raniCategory: 'inventory', priority: 70 },

  // Training
  { pattern: 'TRAINING|CONFERENCE|WORKSHOP|CERTIFICATION|CME|SEMINAR|EDUCATION|COURSE', raniCategory: 'training', priority: 70 },

  // Marketing (non-digital)
  { pattern: 'VISTAPRINT|PRINT|SIGNAGE|PHOTOGRAPHY|VIDEOGRAPHY|YELP|NEXTDOOR', raniCategory: 'marketing', priority: 70 },

  // Transfers
  { pattern: 'TRANSFER|XFER|ACH|WIRE', plaidCategory: 'TRANSFER_OUT', raniCategory: 'transfer', priority: 60 },
];

export function categorizeTransaction(
  name: string,
  merchantName: string | null,
  plaidCategory: { primary: string; detailed: string } | null,
): RaniExpenseCategory {
  const searchText = `${name} ${merchantName || ''}`.toUpperCase();
  const plaidPrimary = plaidCategory?.primary?.toUpperCase() || '';

  // Sort by priority descending
  const sorted = [...DEFAULT_CATEGORY_MAPPINGS].sort((a, b) => b.priority - a.priority);

  for (const rule of sorted) {
    // Check pattern against transaction name/merchant
    const patternParts = rule.pattern.split('|');
    const patternMatch = patternParts.some((p) => searchText.includes(p));

    // Check Plaid category if specified
    const categoryMatch = rule.plaidCategory
      ? plaidPrimary.includes(rule.plaidCategory)
      : false;

    if (patternMatch || categoryMatch) {
      return rule.raniCategory;
    }
  }

  return 'other';
}

// Human-readable labels for categories
export const CATEGORY_LABELS: Record<RaniExpenseCategory, string> = {
  payroll: 'Payroll & Contractors',
  'ad-spend': 'Ad Spend (Meta + Google)',
  inventory: 'Inventory & Supplies',
  rent: 'Rent + Utilities',
  'device-rental': 'Device Rentals',
  software: 'Software & Tools',
  insurance: 'Insurance',
  training: 'Training & Education',
  marketing: 'Marketing',
  'revenue-deposit': 'Revenue / Deposits',
  transfer: 'Transfers',
  other: 'Other',
};
