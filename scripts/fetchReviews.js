#!/usr/bin/env node
// scripts/fetchReviews.js
// Fetches Google Place reviews via the Places API and saves them to Firestore.
//
// Usage:
//   node scripts/fetchReviews.js
//
// Prerequisites:
//   npm install firebase-admin dotenv node-fetch
//   Set in .env:
//     FIREBASE_SERVICE_ACCOUNT_KEY_PATH=./serviceAccount.json
//     GOOGLE_PLACES_API_KEY=your_api_key
//     GOOGLE_PLACE_ID=your_place_id     (find at: https://developers.google.com/maps/documentation/places/web-service/place-id)

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Validate env ──────────────────────────────────────────────────────────────

const PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const PLACE_ID       = process.env.GOOGLE_PLACE_ID;

if (!PLACES_API_KEY) {
  console.error('❌  GOOGLE_PLACES_API_KEY not set in .env');
  console.error('   Get one at: https://console.cloud.google.com/apis/library/places-backend.googleapis.com');
  process.exit(1);
}
if (!PLACE_ID) {
  console.error('❌  GOOGLE_PLACE_ID not set in .env');
  console.error('   Find yours at: https://developers.google.com/maps/documentation/places/web-service/place-id');
  process.exit(1);
}

// ── Load Firebase Admin ───────────────────────────────────────────────────────

let admin, fetch;
try {
  const m = await import('firebase-admin');
  admin = m.default;
} catch {
  console.error('❌  firebase-admin not installed. Run: npm install firebase-admin dotenv node-fetch');
  process.exit(1);
}

try {
  const m = await import('node-fetch');
  fetch = m.default;
} catch {
  // node 18+ has native fetch
  fetch = globalThis.fetch;
  if (!fetch) {
    console.error('❌  node-fetch not installed. Run: npm install node-fetch');
    process.exit(1);
  }
}

// ── Init Firebase Admin ───────────────────────────────────────────────────────

const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH;
let credential;

if (keyPath) {
  const sa = JSON.parse(readFileSync(resolve(keyPath), 'utf8'));
  credential = admin.credential.cert(sa);
} else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  credential = admin.credential.applicationDefault();
} else {
  console.error('❌  No Firebase credentials. Set FIREBASE_SERVICE_ACCOUNT_KEY_PATH in .env');
  process.exit(1);
}

admin.initializeApp({ credential });
const db = admin.firestore();

// ── Fetch reviews from Google Places API ──────────────────────────────────────

async function fetchGoogleReviews() {
  const fields = 'reviews,rating,user_ratings_total';
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${PLACE_ID}&fields=${fields}&key=${PLACES_API_KEY}`;

  console.log('📡 Fetching from Google Places API…');
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);

  const json = await res.json();

  if (json.status !== 'OK') {
    throw new Error(`Places API error: ${json.status} – ${json.error_message || 'Unknown error'}`);
  }

  return json.result?.reviews || [];
}

// ── Save reviews to Firestore ─────────────────────────────────────────────────

async function saveReviews(reviews) {
  if (reviews.length === 0) {
    console.log('ℹ️  No reviews returned from Google.');
    return;
  }

  const batch = db.batch();
  const col = db.collection('reviews');

  for (const review of reviews) {
    const docRef = col.doc(); // auto-id
    batch.set(docRef, {
      author: review.author_name || 'Anonymous',
      profilePhoto: review.profile_photo_url || null,
      rating: review.rating || 0,
      text: review.text || '',
      time: admin.firestore.Timestamp.fromMillis((review.time || 0) * 1000),
      source: 'google',
      syncedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }

  await batch.commit();
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n⭐ Anika\'s Cake Studio – Review Fetcher\n');

  // Optional: clear existing Google reviews before re-syncing
  if (process.argv.includes('--clear')) {
    console.log('🗑️  Clearing existing reviews…');
    const snap = await db.collection('reviews').where('source', '==', 'google').get();
    const batch = db.batch();
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
    console.log(`   Deleted ${snap.size} existing review(s).`);
  }

  const reviews = await fetchGoogleReviews();
  console.log(`✅ Fetched ${reviews.length} review(s) from Google.`);

  if (reviews.length > 0) {
    await saveReviews(reviews);
    console.log(`✅ Saved ${reviews.length} review(s) to Firestore.\n`);

    reviews.forEach((r, i) => {
      console.log(`  ${i + 1}. ${r.author_name} – ${'★'.repeat(r.rating)} (${r.rating}/5)`);
      if (r.text) console.log(`     "${r.text.slice(0, 80)}${r.text.length > 80 ? '…' : ''}"`);
    });
  }

  console.log('\nDone! Reviews are now live on your website.\n');
  process.exit(0);
}

main().catch(err => {
  console.error('❌  Error:', err.message);
  process.exit(1);
});
