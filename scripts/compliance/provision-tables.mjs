#!/usr/bin/env node
/**
 * Compliance Table Provisioner
 *
 * Purpose:
 * - Check whether the 4 required compliance Airtable tables exist.
 * - Optionally create any missing tables using Airtable Metadata API.
 *
 * Usage:
 *   node scripts/compliance/provision-tables.mjs --check
 *   node scripts/compliance/provision-tables.mjs --apply
 *
 * Environment:
 *   AIRTABLE_PAT            (required)
 *   COMPLIANCE_BASE_ID      (preferred)
 *   AIRTABLE_BASE_ID        (fallback)
 *
 * Notes:
 * - `--check` never mutates.
 * - `--apply` requires Airtable PAT scopes that allow metadata writes.
 * - If metadata scopes are missing, script prints exact manual fallback.
 */

const args = new Set(process.argv.slice(2));
const shouldApply = args.has('--apply');
const mode = shouldApply ? 'apply' : 'check';

const pat = process.env.AIRTABLE_PAT;
const baseId = process.env.COMPLIANCE_BASE_ID || process.env.AIRTABLE_BASE_ID;

if (!pat) {
  process.stderr.write('❌ AIRTABLE_PAT is required.\n');
  process.exit(1);
}

if (!baseId) {
  process.stderr.write('❌ COMPLIANCE_BASE_ID or AIRTABLE_BASE_ID is required.\n');
  process.exit(1);
}

const TABLE_DEFINITIONS = [
  {
    name: 'PHI Access Log',
    fields: [
      { name: 'Log ID', type: 'singleLineText' },
      { name: 'Timestamp', type: 'dateTime' },
      { name: 'User ID', type: 'singleLineText' },
      { name: 'User Name', type: 'singleLineText' },
      { name: 'User Role', type: 'singleLineText' },
      { name: 'Patient ID', type: 'singleLineText' },
      { name: 'Patient Name', type: 'singleLineText' },
      { name: 'Action', type: 'singleLineText' },
      { name: 'Data Category', type: 'singleLineText' },
      { name: 'IP Address', type: 'singleLineText' },
      { name: 'Details', type: 'multilineText' },
    ],
  },
  {
    name: 'HIPAA Breaches',
    fields: [
      { name: 'Breach ID', type: 'singleLineText' },
      { name: 'Discovery Date', type: 'date' },
      { name: 'Breach Date', type: 'date' },
      { name: 'Reported Date', type: 'date' },
      { name: 'Description', type: 'multilineText' },
      { name: 'Data Involved', type: 'multilineText' },
      { name: 'Individuals Affected', type: 'number' },
      { name: 'Severity', type: 'singleLineText' },
      { name: 'Status', type: 'singleLineText' },
      { name: 'Root Cause', type: 'multilineText' },
      { name: 'Corrective Actions', type: 'multilineText' },
      { name: 'HHS Reported', type: 'checkbox' },
      { name: 'Individuals Notified', type: 'checkbox' },
      { name: 'Media Notified', type: 'checkbox' },
      { name: 'Investigator', type: 'singleLineText' },
      { name: 'Resolution Date', type: 'date' },
    ],
  },
  {
    name: 'BAAs',
    fields: [
      { name: 'BAA ID', type: 'singleLineText' },
      { name: 'Vendor Name', type: 'singleLineText' },
      { name: 'Vendor Contact', type: 'singleLineText' },
      { name: 'Vendor Email', type: 'email' },
      { name: 'Service Description', type: 'multilineText' },
      { name: 'Effective Date', type: 'date' },
      { name: 'Expiration Date', type: 'date' },
      { name: 'Renewal Date', type: 'date' },
      { name: 'Status', type: 'singleLineText' },
      { name: 'Signed By', type: 'singleLineText' },
      { name: 'Document URL', type: 'url' },
      { name: 'Last Review Date', type: 'date' },
      { name: 'Next Review Date', type: 'date' },
    ],
  },
  {
    name: 'HIPAA Training',
    fields: [
      { name: 'Training ID', type: 'singleLineText' },
      { name: 'Staff ID', type: 'singleLineText' },
      { name: 'Staff Name', type: 'singleLineText' },
      { name: 'Staff Role', type: 'singleLineText' },
      { name: 'Training Type', type: 'singleLineText' },
      { name: 'Completed Date', type: 'date' },
      { name: 'Expiration Date', type: 'date' },
      { name: 'Score', type: 'number' },
      { name: 'Passed', type: 'checkbox' },
      { name: 'Certificate URL', type: 'url' },
      { name: 'Renewal Required', type: 'checkbox' },
    ],
  },
];

function info(message) {
  process.stdout.write(`${message}\n`);
}

function err(message) {
  process.stderr.write(`${message}\n`);
}

async function requestJson(url, init = {}) {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${pat}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });

  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { raw: text };
  }

  return { response, body };
}

async function listTablesViaMetadata() {
  const url = `https://api.airtable.com/v0/meta/bases/${baseId}/tables`;
  const { response, body } = await requestJson(url);
  return { status: response.status, body };
}

async function checkDataTableExists(tableName) {
  const encoded = encodeURIComponent(tableName);
  const url = `https://api.airtable.com/v0/${baseId}/${encoded}?maxRecords=1`;
  const { response, body } = await requestJson(url);

  if (response.status === 200) return true;
  if (response.status === 404 && body?.error?.type === 'TABLE_NOT_FOUND') return false;

  throw new Error(
    `Unable to check "${tableName}" via data API (${response.status}): ${JSON.stringify(body)}`,
  );
}

async function getExistingTableNames() {
  const meta = await listTablesViaMetadata();

  if (meta.status === 200 && Array.isArray(meta.body?.tables)) {
    return {
      names: new Set(meta.body.tables.map((t) => t.name)),
      metadataWritable: true,
      metadataReadable: true,
    };
  }

  // Metadata API not available (scope or plan). Fall back to data API checks.
  if (meta.status === 401 || meta.status === 403 || meta.status === 404) {
    info('ℹ️ Metadata API unavailable; falling back to data API existence checks.');
    const names = new Set();
    for (const def of TABLE_DEFINITIONS) {
      const exists = await checkDataTableExists(def.name);
      if (exists) names.add(def.name);
    }
    return {
      names,
      metadataWritable: false,
      metadataReadable: false,
    };
  }

  throw new Error(
    `Failed to list tables (${meta.status}): ${JSON.stringify(meta.body)}`,
  );
}

async function createTable(definition) {
  const url = `https://api.airtable.com/v0/meta/bases/${baseId}/tables`;
  const payload = {
    name: definition.name,
    fields: definition.fields,
  };
  const { response, body } = await requestJson(url, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (response.status >= 200 && response.status < 300) {
    return;
  }

  if (response.status === 403) {
    throw new Error(
      `Create failed for "${definition.name}" (403 Forbidden).\n\n` +
      `Most likely causes:\n` +
      `  1. Your PAT is missing the "schema.bases:write" scope.\n` +
      `     → Go to https://airtable.com/create/tokens, edit your PAT, add "schema.bases:write".\n` +
      `  2. Your PAT doesn't have Creator/Editor role on base ${baseId}.\n` +
      `     → In the PAT editor, under "Access", ensure the base is listed with write access.\n\n` +
      `Fallback: create the 4 tables manually in the Airtable UI.\n` +
      `See docs/compliance/AUDIT-RUNBOOK.md section 14 for field specifications.\n\n` +
      `Raw error: ${JSON.stringify(body)}`,
    );
  }

  throw new Error(
    `Create failed for "${definition.name}" (${response.status}): ${JSON.stringify(body)}`,
  );
}

async function run() {
  info(`\nCompliance table provisioner (${mode})`);
  info(`Base: ${baseId}\n`);

  const existing = await getExistingTableNames();
  const missing = TABLE_DEFINITIONS.filter((def) => !existing.names.has(def.name));

  if (missing.length === 0) {
    info('✅ All required compliance tables already exist.');
    info('Next step: set COMPLIANCE_PERSISTENCE_ENABLED=1 in production env.');
    return;
  }

  info(`Missing tables (${missing.length}):`);
  for (const table of missing) {
    info(`- ${table.name}`);
  }

  if (!shouldApply) {
    info('\nCheck-only mode completed. Re-run with --apply to create missing tables.');
    process.exit(1);
  }

  if (!existing.metadataWritable) {
    err('\n❌ Cannot auto-create tables because metadata write scope is unavailable.');
    err('Create the missing tables manually in Airtable using field definitions in:');
    err('   src/lib/compliance/persistence.ts');
    err('Then run: node scripts/compliance/check-persistence-ready.mjs');
    process.exit(1);
  }

  info('\nApplying table creation...');
  for (const table of missing) {
    info(`- Creating ${table.name}...`);
    await createTable(table);
    info(`  ✅ Created ${table.name}`);
  }

  info('\n✅ Provisioning completed.');
  info('Next step:');
  info('1) node scripts/compliance/check-persistence-ready.mjs');
  info('2) Set COMPLIANCE_PERSISTENCE_ENABLED=1 in production');
}

run().catch((error) => {
  err(`\n❌ ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
