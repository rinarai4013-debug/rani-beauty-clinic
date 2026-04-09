type ExportScope =
  | 'full'
  | 'clients'
  | 'appointments'
  | 'transactions'
  | 'memberships'
  | 'messages'
  | 'reviews'
  | 'kpis';

type ExportFormat = 'csv' | 'json';
type ImportSource = 'zenoti' | 'vagaro' | 'boulevard' | 'mindbody' | 'csv';

type ExportJob = {
  id: string;
  tenantId: string;
  requestedBy: string;
  scope: ExportScope[];
  format: ExportFormat;
  status: 'pending' | 'completed';
  recordCount: number;
  fileUrl: string | null;
  expiresAt: number;
};

type ScheduledExport = {
  id: string;
  tenantId: string;
  scope: ExportScope[];
  format: ExportFormat;
  frequency: 'daily' | 'weekly' | 'monthly';
  hour: number;
  timezone: string;
  destination: string;
  destinationConfig?: Record<string, unknown>;
  enabled: boolean;
  nextRunAt: number;
};

type GdprRequest = {
  id: string;
  tenantId: string;
  requestType: 'access' | 'erasure';
  subjectEmail: string;
  subjectName: string;
  verificationMethod: 'email' | 'phone';
  verified: boolean;
  status: 'received' | 'verified' | 'completed';
  deadline: number;
  exportId: string | null;
};

type ImportJob = {
  id: string;
  tenantId: string;
  source: ImportSource;
  status: 'pending' | 'completed';
  fieldMapping: Array<{ sourceField: string; targetField: string }>;
  validationErrors: string[];
  recordsImported: number;
};

type DeletionRequest = {
  id: string;
  tenantId: string;
  requestedBy: string;
  targetType: string;
  targets: string[];
  confirmationCode: string;
  status: 'pending' | 'completed';
};

type MigrationWizardState = {
  tenantId: string;
  source: ImportSource;
  step: string;
  importId: string;
  mappingSuggestions: Array<{ sourceField: string; targetField: string }>;
};

const exportsStore: ExportJob[] = [];
const scheduledExports: ScheduledExport[] = [];
const gdprRequests: GdprRequest[] = [];
const importsStore: ImportJob[] = [];
const deletionRequests: DeletionRequest[] = [];

const EXPORT_COLUMNS: Record<ExportScope, string[]> = {
  full: ['Section', 'Record ID', 'Value'],
  clients: ['First Name', 'Last Name', 'Email', 'Phone'],
  appointments: ['Date', 'Service', 'Provider', 'Status'],
  transactions: ['Date', 'Amount', 'Type', 'Status'],
  memberships: ['Tier', 'Status', 'Start Date'],
  messages: ['Channel', 'Direction', 'Date'],
  reviews: ['Platform', 'Rating', 'Date'],
  kpis: ['Date', 'Revenue', 'Bookings'],
};

export const IMPORT_FIELD_MAPS: Record<ImportSource, Array<{ sourceField: string; targetField: string }>> = {
  zenoti: [
    { sourceField: 'Guest First Name', targetField: 'First Name' },
    { sourceField: 'Guest Email', targetField: 'Email' },
  ],
  vagaro: [
    { sourceField: 'customer_name', targetField: 'First Name' },
    { sourceField: 'customer_email', targetField: 'Email' },
  ],
  boulevard: [
    { sourceField: 'client_name', targetField: 'First Name' },
    { sourceField: 'client_phone', targetField: 'Phone' },
  ],
  mindbody: [
    { sourceField: 'FirstName', targetField: 'First Name' },
    { sourceField: 'Email', targetField: 'Email' },
  ],
  csv: [
    { sourceField: 'name', targetField: 'First Name' },
    { sourceField: 'email', targetField: 'Email' },
  ],
};

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function resetDataExport() {
  exportsStore.length = 0;
  scheduledExports.length = 0;
  gdprRequests.length = 0;
  importsStore.length = 0;
  deletionRequests.length = 0;
}

export function getExportColumns(scope: ExportScope) {
  return EXPORT_COLUMNS[scope];
}

export function getAllExportScopes() {
  return Object.keys(EXPORT_COLUMNS) as ExportScope[];
}

export function generateExportData(scope: ExportScope, format: ExportFormat) {
  return {
    scope,
    format,
    columns: getExportColumns(scope),
    rows: scope === 'clients'
      ? [['Jane', 'Doe', 'jane@test.com', '(425) 555-0100']]
      : [['sample', 'row']],
  };
}

export function createExport(input: {
  tenantId: string;
  requestedBy: string;
  scope: ExportScope[];
  format: ExportFormat;
}) {
  const recordCount = input.scope.includes('full')
    ? 120
    : input.scope.reduce((sum, scope) => sum + generateExportData(scope, input.format).rows.length, 0);
  const job: ExportJob = {
    id: uid('exp'),
    tenantId: input.tenantId,
    requestedBy: input.requestedBy,
    scope: input.scope,
    format: input.format,
    status: 'completed',
    recordCount,
    fileUrl: `https://exports.ranios.local/${uid('file')}.${input.format}`,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
  };
  exportsStore.push(job);
  return job;
}

export function getExport(id: string) {
  return exportsStore.find((item) => item.id === id) ?? null;
}

export function getExportHistory(tenantId: string) {
  return exportsStore.filter((item) => item.tenantId === tenantId);
}

export function createScheduledExport(input: Omit<ScheduledExport, 'id' | 'enabled' | 'nextRunAt'>) {
  const scheduled: ScheduledExport = {
    ...input,
    id: uid('sched'),
    enabled: true,
    nextRunAt: Date.now() + 24 * 60 * 60 * 1000,
  };
  scheduledExports.push(scheduled);
  return scheduled;
}

export function getScheduledExports(tenantId: string) {
  return scheduledExports.filter((item) => item.tenantId === tenantId);
}

export function toggleScheduledExport(id: string, enabled: boolean) {
  const item = scheduledExports.find((entry) => entry.id === id);
  if (!item) return null;
  item.enabled = enabled;
  return item;
}

export function deleteScheduledExport(id: string) {
  const index = scheduledExports.findIndex((entry) => entry.id === id);
  if (index === -1) return false;
  scheduledExports.splice(index, 1);
  return true;
}

export function createGdprRequest(input: Omit<GdprRequest, 'id' | 'verified' | 'status' | 'deadline' | 'exportId'>) {
  const request: GdprRequest = {
    ...input,
    id: uid('gdpr'),
    verified: false,
    status: 'received',
    deadline: Date.now() + 30 * 24 * 60 * 60 * 1000,
    exportId: null,
  };
  gdprRequests.push(request);
  return request;
}

export function verifyGdprRequest(id: string) {
  const request = gdprRequests.find((entry) => entry.id === id);
  if (!request) return false;
  request.verified = true;
  request.status = 'verified';
  return true;
}

export function processGdprRequest(id: string) {
  const request = gdprRequests.find((entry) => entry.id === id);
  if (!request || !request.verified) return null;
  const exportJob = createExport({
    tenantId: request.tenantId,
    requestedBy: 'gdpr-system',
    scope: ['clients'],
    format: 'json',
  });
  request.status = 'completed';
  request.exportId = exportJob.id;
  return request;
}

export function getGdprRequests(tenantId: string) {
  return gdprRequests.filter((entry) => entry.tenantId === tenantId);
}

export function createImport(input: { tenantId: string; source: ImportSource }) {
  const job: ImportJob = {
    id: uid('imp'),
    tenantId: input.tenantId,
    source: input.source,
    status: 'pending',
    fieldMapping: [...IMPORT_FIELD_MAPS[input.source]],
    validationErrors: [],
    recordsImported: 0,
  };
  importsStore.push(job);
  return job;
}

export function updateImportMapping(id: string, fieldMapping: Array<{ sourceField: string; targetField: string }>) {
  const job = importsStore.find((entry) => entry.id === id);
  if (!job) return null;
  job.fieldMapping = fieldMapping;
  return job;
}

export function validateImport(id: string) {
  const job = importsStore.find((entry) => entry.id === id);
  if (!job) return ['Import not found'];
  job.validationErrors = [];
  return job.validationErrors;
}

export function executeImport(id: string) {
  const job = importsStore.find((entry) => entry.id === id);
  if (!job) return null;
  job.status = 'completed';
  job.recordsImported = 42;
  return job;
}

export function getImport(id: string) {
  return importsStore.find((entry) => entry.id === id) ?? null;
}

export function getImportHistory(tenantId: string) {
  return importsStore.filter((entry) => entry.tenantId === tenantId);
}

export function createDeletionRequest(
  tenantId: string,
  requestedBy: string,
  targetType: string,
  targets: string[]
) {
  const request: DeletionRequest = {
    id: uid('del'),
    tenantId,
    requestedBy,
    targetType,
    targets,
    confirmationCode: Math.random().toString().slice(2, 8),
    status: 'pending',
  };
  deletionRequests.push(request);
  return request;
}

export function confirmDeletion(id: string, confirmationCode: string) {
  const request = deletionRequests.find((entry) => entry.id === id);
  if (!request || request.confirmationCode !== confirmationCode) return false;
  request.status = 'completed';
  return true;
}

export function getDeletionRequests(tenantId: string) {
  return deletionRequests.filter((entry) => entry.tenantId === tenantId);
}

export function initializeMigrationWizard(tenantId: string, source: ImportSource): MigrationWizardState {
  const job = createImport({ tenantId, source });
  return {
    tenantId,
    source,
    step: 'select_source',
    importId: job.id,
    mappingSuggestions: [...job.fieldMapping],
  };
}

export function advanceMigrationStep(state: MigrationWizardState, step: string): MigrationWizardState {
  return { ...state, step };
}
