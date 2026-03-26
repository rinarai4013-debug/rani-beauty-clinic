#!/usr/bin/env node
/**
 * HIPAA Security: Password Hashing Utility
 *
 * Converts plaintext passwords in DASHBOARD_USERS to PBKDF2-SHA512 hashes.
 *
 * Usage:
 *   node scripts/hash-passwords.mjs
 *
 * This reads .env.local, hashes all plaintext passwords, and prints the
 * updated DASHBOARD_USERS value. You must manually update .env.local.
 *
 * IMPORTANT: After updating, the old plaintext passwords will no longer work
 * with older versions of the login route. Deploy the updated login route first.
 */

import { pbkdf2Sync, randomBytes } from 'crypto';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ITERATIONS = 100_000;
const KEYLEN = 64;
const DIGEST = 'sha512';

function hashPassword(password) {
  const salt = randomBytes(32).toString('hex');
  const hash = pbkdf2Sync(password, salt, ITERATIONS, KEYLEN, DIGEST).toString('hex');
  return `pbkdf2:${salt}:${hash}`;
}

// Read .env.local
const envPath = resolve(__dirname, '..', '.env.local');
let envContent;
try {
  envContent = readFileSync(envPath, 'utf8');
} catch {
  console.error('Could not read .env.local');
  process.exit(1);
}

// Extract DASHBOARD_USERS line
const match = envContent.match(/^DASHBOARD_USERS=(.+)$/m);
if (!match) {
  console.error('DASHBOARD_USERS not found in .env.local');
  process.exit(1);
}

const users = JSON.parse(match[1]);
let changed = 0;

for (const [email, cred] of Object.entries(users)) {
  if (!cred.password.startsWith('pbkdf2:')) {
    console.log(`Hashing password for: ${email}`);
    cred.password = hashPassword(cred.password);
    changed++;
  } else {
    console.log(`Already hashed: ${email}`);
  }
}

if (changed === 0) {
  console.log('\nAll passwords are already hashed. No changes needed.');
} else {
  const newValue = JSON.stringify(users);
  console.log(`\n${changed} password(s) hashed.\n`);
  console.log('Update DASHBOARD_USERS in .env.local to:\n');
  console.log(`DASHBOARD_USERS=${newValue}`);
  console.log('\nWARNING: Deploy the updated login route BEFORE updating .env.local in production.');
}
