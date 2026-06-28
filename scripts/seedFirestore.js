#!/usr/bin/env node
// scripts/seedFirestore.js
// Seeds Firestore with initial cake configuration options.
// Run ONCE after creating your Firebase project.
//
// Usage:
//   node scripts/seedFirestore.js
//
// Prerequisites:
//   npm install firebase-admin dotenv
//   Set FIREBASE_SERVICE_ACCOUNT_KEY_PATH in .env (path to your service account JSON)
//   OR set GOOGLE_APPLICATION_CREDENTIALS env var

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Load Firebase Admin ───────────────────────────────────────────────────────

let admin;
try {
  const m = await import('firebase-admin');
  admin = m.default;
} catch {
  console.error('❌  firebase-admin not installed. Run: npm install firebase-admin dotenv');
  process.exit(1);
}

// ── Init Admin SDK ────────────────────────────────────────────────────────────

let credential;
const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH;

if (keyPath) {
  const serviceAccount = JSON.parse(readFileSync(resolve(keyPath), 'utf8'));
  credential = admin.credential.cert(serviceAccount);
} else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  credential = admin.credential.applicationDefault();
} else {
  console.error('❌  No credentials found.');
  console.error('   Set FIREBASE_SERVICE_ACCOUNT_KEY_PATH=./path/to/serviceAccount.json in your .env file.');
  console.error('   Download your service account key from Firebase Console → Project Settings → Service Accounts.');
  process.exit(1);
}

admin.initializeApp({ credential });
const db = admin.firestore();

// ── Seed data ─────────────────────────────────────────────────────────────────

const SEED = {
  cakeConfig: {
    options: {
      cakeTypes: [
        'Birthday Cake',
        'Anniversary Cake',
        'Kids Theme Cake',
        'Custom Cake',
        'Bento Cake'
      ],
      sizes: [
        '250 Gm',
        '500 Gm',
        '1 Kg',
        '1.5 Kg',
        '2 Kg',
        '3 Kg'
      ],
      flavours: [
        'Chocolate',
        'Butterscotch',
        'Black Forest',
        'Strawberry',
        'Vanilla',
        'Pineapple',
        'Red Velvet'
      ]
    }
  }
};

// ── Run seeding ───────────────────────────────────────────────────────────────

async function seed() {
  console.log('🌱 Starting Firestore seed...\n');

  // cakeConfig/options
  const configRef = db.collection('cakeConfig').doc('options');
  const existing = await configRef.get();
  if (existing.exists) {
    console.log('⚠️  cakeConfig/options already exists. Skipping (use --force to overwrite).');
    if (!process.argv.includes('--force')) {
      console.log('\nDone. Use --force flag to overwrite existing data.\n');
      process.exit(0);
    }
  }

  await configRef.set(SEED.cakeConfig.options);
  console.log('✅  cakeConfig/options seeded:');
  console.log(`    Cake Types: ${SEED.cakeConfig.options.cakeTypes.join(', ')}`);
  console.log(`    Sizes:      ${SEED.cakeConfig.options.sizes.join(', ')}`);
  console.log(`    Flavours:   ${SEED.cakeConfig.options.flavours.join(', ')}`);

  // Create empty collection stubs (Firestore auto-creates collections on first write,
  // but we add placeholder markers here as a development hint)
  const collections = ['gallery', 'reviews', 'orderRequests', 'admins'];
  console.log(`\nℹ️  Firestore auto-creates collections on first document write.`);
  console.log(`   Collections expected: ${collections.join(', ')}`);

  console.log('\n✅  Seed complete!\n');
  console.log('Next steps:');
  console.log('  1. Create your admin user in Firebase Console → Authentication → Add User');
  console.log('  2. Add their UID to Firestore: admins/{uid} → { email, displayName, role: "superadmin", createdAt: now }');
  console.log('  3. Run: node scripts/fetchReviews.js  (optional: seeds Google reviews)');
  console.log('');
  process.exit(0);
}

seed().catch(err => {
  console.error('❌  Seed failed:', err.message);
  process.exit(1);
});
