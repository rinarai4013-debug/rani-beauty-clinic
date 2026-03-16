// Form data type definitions for all 10 manual entry forms

export interface LeadFormData {
  fullName: string;
  phone: string;
  email?: string;
  source: string;
  campaign?: string;
  interestArea: string;
  desiredTreatment?: string;
  budgetRange?: string;
  timingReadiness: string;
  notes?: string;
}

export interface ConsultNotesFormData {
  clientName: string;
  consultType: 'initial' | 'follow_up' | 'package_review' | 'upgrade';
  outcome: 'booked_package' | 'thinking' | 'needs_financing' | 'not_interested' | 'no_show';
  treatmentPlanPresented: string;
  objections?: string;
  followUpPriority: 'high' | 'medium' | 'low';
  nextFollowUpDate?: string;
  notes?: string;
}

export interface ManualSaleFormData {
  clientName: string;
  service: string;
  category: string;
  provider: string;
  amount: number;
  paymentMethod: string;
  discountApplied?: number;
  isFinancing: boolean;
  financingProvider?: string;
  notes?: string;
  bankTransactionId?: string;
}

export interface ExpenseFormData {
  date: string;
  vendor: string;
  category: string;
  subcategory?: string;
  amount: number;
  isFixed: boolean;
  isRecurring: boolean;
  paymentSource: string;
  notes?: string;
  bankTransactionId?: string;
}

export interface InventoryFormData {
  itemName: string;
  sku?: string;
  category: string;
  adjustmentType: 'add' | 'remove' | 'set';
  quantity: number;
  reason: string;
  notes?: string;
}

export interface StaffNoteFormData {
  staffMember: string;
  category: 'performance' | 'attendance' | 'training' | 'recognition' | 'issue';
  note: string;
  severity?: 'positive' | 'neutral' | 'concern';
}

export interface ReviewFormData {
  clientName?: string;
  platform: 'google' | 'yelp' | 'facebook' | 'instagram' | 'other';
  starRating: number;
  reviewText: string;
  reviewerName: string;
  reviewUrl?: string;
}

export interface EODRecapFormData {
  date: string;
  totalRevenue: number;
  totalClients: number;
  highlights: string;
  issues?: string;
  inventoryNotes?: string;
  tomorrowPriorities?: string;
}

export interface RoomIssueFormData {
  room: string;
  issueType: 'equipment' | 'cleanliness' | 'supply' | 'damage' | 'other';
  description: string;
  severity: 'low' | 'medium' | 'high';
  actionTaken?: string;
}

export interface CEONoteFormData {
  category: 'strategy' | 'blocker' | 'opportunity' | 'team' | 'finance' | 'marketing' | 'other';
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actionItems?: string;
}

export type FormType =
  | 'lead'
  | 'consult-notes'
  | 'sale'
  | 'expense'
  | 'inventory'
  | 'staff-note'
  | 'review'
  | 'eod-recap'
  | 'room-issue'
  | 'ceo-note';
