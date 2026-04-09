// Airtable table name constants and field name mappings

export const TABLE_NAMES = {
  CLIENTS: 'Clients',
  CLIENT_INTAKES: 'Intake',
  INTAKE_INTELLIGENCE: 'Intake Intelligence',
  APPOINTMENTS: 'Appointments',
  PACKAGES: 'Packages',
  MEMBERSHIPS: 'Memberships',
  TRANSACTIONS: 'Transactions',
  MESSAGES_LOG: 'Messages Log',
  REVIEWS: 'Reviews',
  KPI_SNAPSHOTS: 'KPI Snapshots',
  ALERTS: 'Alerts',
  COMPETITOR_INTELLIGENCE: 'Competitor Intelligence',
  TREATMENT_PLANS: 'Treatment Plans',
} as const;

// Key field names for each table (matching Airtable column names)
export const FIELDS = {
  clients: {
    // Actual fields in the live Airtable Clients table
    name: 'Client',           // Single-line text (full name)
    email: 'Email',
    phone: 'Phone',
    preferredContact: 'Preferred Contact',
    status: 'Status',         // Single select
    // Linked record fields (read-only, populated via linked tables)
    intakes: 'Client Intakes',
    intakeIntelligence: 'Intake Intelligence',
    appointments: 'Appointments',
    packages: 'Packages',
    memberships: 'Memberships',
    transactions: 'Transactions',
    messagesLog: 'Messages Log',
    reviews: 'Reviews',
  },
  appointments: {
    service: 'Service Name',
    category: 'Service Category',
    provider: 'Provider',
    date: 'Date',
    time: 'Time',
    duration: 'Duration',
    status: 'Status',
    isConsult: 'Is Consult',
    consultType: 'Consult Type',
    consultOutcome: 'Consult Outcome',
    depositAmount: 'Deposit Amount',
    depositPaid: 'Deposit Paid',
    amountQuoted: 'Amount Quoted',
    amountPaid: 'Amount Paid',
    bookingSource: 'Booking Source',
    reviewRequested: 'Review Requested',
    reviewReceived: 'Review Received',
  },
  transactions: {
    date: 'Date',
    type: 'Type',
    amount: 'Amount',
    paymentMethod: 'Payment Method',
    provider: 'Provider',
    serviceName: 'Service Name',
    status: 'Status',
    isFinancing: 'Is Financing',
    financingProvider: 'Financing Provider',
  },
  kpiSnapshots: {
    date: 'Date',
    period: 'Period',
    revenue: 'Revenue',
    revenueMTD: 'Revenue MTD',
    totalBookings: 'Total Bookings',
    totalShows: 'Total Shows',
    totalNoShows: 'Total No-Shows',
    showRate: 'Show Rate',
    newLeads: 'New Leads',
    consultsCompleted: 'Consultations Completed',
    packagesSold: 'Packages Sold',
    closeRate: 'Close Rate',
    avgTicket: 'Average Ticket',
    activeMembers: 'Active Members Count',
    newMembers: 'New Members',
    churnedMembers: 'Churned Members',
    membershipMRR: 'Membership MRR',
    reviewRequestsSent: 'Review Requests Sent',
    reviewsReceived: 'Reviews Received',
    averageRating: 'Average Rating',
    revenueByProviderJSON: 'Revenue by Provider JSON',
  },
  alerts: {
    type: 'Type',
    severity: 'Severity',
    metricName: 'Metric Name',
    metricValue: 'Metric Value',
    thresholdValue: 'Threshold Value',
    message: 'Message',
    actionRecommended: 'Action Recommended',
    status: 'Status',
    createdDate: 'Created Date',
    notes: 'Notes', // Long Text - used for System Config storage (e.g. encrypted Plaid connection)
  },
  reviews: {
    platform: 'Platform',
    starRating: 'Star Rating',
    reviewText: 'Review Text',
    reviewerName: 'Reviewer Name',
    reviewDate: 'Review Date',
    sentiment: 'Sentiment',
    responseStatus: 'Response Status',
    aiDraftResponse: 'AI Draft Response',
  },
  memberships: {
    tier: 'Tier',
    monthlyPrice: 'Monthly Price',
    status: 'Status',
    startDate: 'Start Date',
    churnRiskScore: 'Churn Risk Score',
  },
  treatmentPlans: {
    client: 'Client',              // Linked record to Clients
    planTier: 'Plan Tier',         // Single select: Essential, Recommended, Platinum
    planValue: 'Plan Value',       // Currency
    servicesIncluded: 'Services Included', // Long text
    planUrl: 'Plan URL',           // URL
    status: 'Status',              // Single select: Sent, Viewed, Selected, Booked, Expired
    createdDate: 'Created Date',   // Date
    sentAt: 'Sent At',
    intakeRecordId: 'Intake Record ID', // Single-line text (for linking back)
    clientName: 'Client Name',     // Single-line text (denormalized for easy access)
    clientEmail: 'Client Email',
    clientPhone: 'Client Phone',
    lastViewedAt: 'Last Viewed At',
    viewCount: 'View Count',
    financingClickedAt: 'Financing Clicked At',
  },
  packages: {
    name: 'Package Name',
    tier: 'Package Tier',
    type: 'Package Type',
    totalValue: 'Total Value',
    sessionsTotal: 'Sessions Total',
    sessionsCompleted: 'Sessions Completed',
    sessionsRemaining: 'Sessions Remaining',
    status: 'Status',
  },
} as const;

// Client status options
export const CLIENT_STATUSES = [
  'New Lead',
  'Active',
  'Lapsed 30',
  'Lapsed 60',
  'Lapsed 90',
  'Churned',
] as const;

// Service categories
export const SERVICE_CATEGORIES = [
  'Consult',
  'Laser',
  'Injectable',
  'Facial',
  'Body',
  'Wellness',
  'Follow-Up',
] as const;

// Provider names
export const PROVIDERS = ['Rina', 'Mom'] as const;

// Payment methods
export const PAYMENT_METHODS = [
  'Credit Card',
  'Debit Card',
  'Cash',
  'Afterpay',
  'Cherry',
  'PatientFi',
  'ACH',
] as const;
