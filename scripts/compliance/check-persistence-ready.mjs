#!/usr/bin/env node
/**
 * Compliance Persistence Readiness Check
 *
 * Verifies that the HIPAA compliance persistence infrastructure is
 * ready to receive audit data. Checks:
 *
 *   1. Required env vars are set (COMPLIANCE_PERSISTENCE_ENABLED,
 *      AIRTABLE_PAT, AIRTABLE_BASE_ID or COMPLIANCE_BASE_ID)
 *   2. All 4 required Airtable tables exist and are accessible
 *   3. Each table has the critical fields needed by the persistence
 *      adapter (spot-check, not exhaustive)
 *
 * Exit codes:
 *   0 — all checks pass, persistence is ready to enable
 *   1 — one or more checks failed (details printed to stderr)
 *
 * Usage:
 *   node scripts/compliance/check-persistence-ready.mjs
 *
 * Daily ops: run this as part of morning compliance check. If it
 * returns non-zero, the compliance persistence adapter is silently
 * no-opping and audit data is NOT being retained. See
 * docs/compliance/AUDIT-RUNBOOK.md for remediation steps.
 *
 * Can also be used in CI or a scheduled cron to alert on drift.
 */

const REQUIRED_TABLES = [
  {
    name: 'PHI Access Log',
    criticalFields: ['Log ID', 'Timestamp', 'User ID', 'Action', 'Patient ID'],
    retention: '6 years (HIPAA §164.530(j))',
  },
  {
    name: 'HIPAA Breaches',
    criticalFields: ['Breach ID', 'Discovery Date', 'Description', 'Severity', 'Status'],
    retention: 'Indefinite (life of entity)',
  },
  {
    name: 'BAAs',
    criticalFields: ['BAA ID', 'Vendor Name', 'Effective Date', 'Status'],
    retention: '6 years after termination (HIPAA §164.504(e))',
  },
  {
    name: 'HIPAA Training',
    criticalFields: ['Training ID', 'Staff Name', 'Training Type', 'Completed Date', 'Passed'],
    retention: '6 years from completion (HIPAA §164.530(j))',
  },
];

// ─── Helpers ────────────────────────────────────────────────────────

function log(emoji, message) {
  process.stderr.write(`${emoji}  ${message}\n`);
}

function pass(message) { log('✅', message); }
function fail(message) { log('❌', message); }
function warn(message) { log('⚠️', message); }
function info(message) { log('ℹ️', message); }

async function airtableRequest(baseId, pat, tableName, params = '') {
  const encoded = encodeURIComponent(tableName);
  const url = `https://api.airtable.com/v0/${baseId}/${encoded}?maxRecords=1${params ? '&' + params : ''}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${pat}` },
  });
  return { status: res.status, body: await res.json().catch(() => null) };
}

// ─── Checks ─────────────────────────────────────────────────────────

async function run() {
  let failures = 0;

  // 1. Check env vars
  info('Checking environment variables...');

  const persistenceEnabled = process.env.COMPLIANCE_PERSISTENCE_ENABLED;
  const pat = process.env.AIRTABLE_PAT;
  const baseId = process.env.COMPLIANCE_BASE_ID || process.env.AIRTABLE_BASE_ID;

  if (persistenceEnabled === '1') {
    pass('COMPLIANCE_PERSISTENCE_ENABLED=1 (adapter active)');
  } else {
    warn(`COMPLIANCE_PERSISTENCE_ENABLED=${persistenceEnabled || '(unset)'} — adapter is NO-OPING. Set to "1" to enable.`);
    // This is a warning, not a failure — the script's job is to check
    // readiness, and the tables might be ready even if the flag isn't
    // flipped yet.
  }

  if (!pat) {
    fail('AIRTABLE_PAT is not set — cannot check tables.');
    process.exit(1);
  }
  pass('AIRTABLE_PAT is set');

  if (!baseId) {
    fail('Neither COMPLIANCE_BASE_ID nor AIRTABLE_BASE_ID is set — cannot check tables.');
    process.exit(1);
  }
  pass(`Base ID: ${baseId}`);

  // 2. Check each required table
  info('');
  info('Checking Airtable tables...');

  for (const table of REQUIRED_TABLES) {
    try {
      const { status, body } = await airtableRequest(baseId, pat, table.name);

      if (status === 404 || (body?.error?.type === 'TABLE_NOT_FOUND')) {
        fail(`Table "${table.name}" — NOT FOUND. Provision it in Airtable.`);
        info(`  Retention requirement: ${table.retention}`);
        info(`  Critical fields: ${table.criticalFields.join(', ')}`);
        failures++;
        continue;
      }

      if (status === 403 && body?.error?.type === 'INVALID_PERMISSIONS_OR_MODEL_NOT_FOUND') {
        fail(`Table "${table.name}" — NOT FOUND or inaccessible model (403). Provision it in Airtable.`);
        info(`  Retention requirement: ${table.retention}`);
        info(`  Critical fields: ${table.criticalFields.join(', ')}`);
        failures++;
        continue;
      }

      if (status === 401 || status === 403) {
        fail(`Table "${table.name}" — AUTH ERROR (${status}). Check AIRTABLE_PAT permissions.`);
        failures++;
        continue;
      }

      if (status !== 200) {
        fail(`Table "${table.name}" — unexpected status ${status}: ${JSON.stringify(body?.error)}`);
        failures++;
        continue;
      }

      // 3. Spot-check critical fields by examining the first record
      const records = body?.records || [];
      if (records.length === 0) {
        pass(`Table "${table.name}" — exists (empty, no field validation possible)`);
        continue;
      }

      const fields = Object.keys(records[0].fields || {});
      const missingFields = table.criticalFields.filter(
        (f) => !fields.some((existing) => existing.toLowerCase() === f.toLowerCase()),
      );

      if (missingFields.length > 0) {
        warn(`Table "${table.name}" — exists but missing critical fields: ${missingFields.join(', ')}`);
        info(`  Found fields: ${fields.join(', ')}`);
        // Missing fields is a warning, not a failure — the table exists
        // and the adapter handles UNKNOWN_FIELD_NAME errors gracefully.
      } else {
        pass(`Table "${table.name}" — exists with all critical fields verified`);
      }
    } catch (err) {
      fail(`Table "${table.name}" — network error: ${err.message}`);
      failures++;
    }
  }

  // ─── Summary ────────────────────────────────────────────────────

  info('');
  if (failures === 0) {
    if (persistenceEnabled !== '1') {
      info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      info('READY — all tables exist. Flip the flag to start writing:');
      info('  vercel env add COMPLIANCE_PERSISTENCE_ENABLED production');
      info('  (set value to: 1)');
      info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    } else {
      pass('ALL CHECKS PASSED — compliance persistence is fully operational.');
    }
    process.exit(0);
  } else {
    fail(`${failures} table(s) failed. Compliance data is NOT being retained.`);
    info('See docs/compliance/AUDIT-RUNBOOK.md for table provisioning steps.');
    process.exit(1);
  }
}

run().catch((err) => {
  fail(`Script error: ${err.message}`);
  process.exit(1);
});
