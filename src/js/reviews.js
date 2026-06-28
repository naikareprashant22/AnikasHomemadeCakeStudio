// src/js/reviews.js
// Public reviews page – loads reviews from Firestore and renders star ratings

import { db } from './firebase.js';
import {
  collection,
  getDocs,
  orderBy,
  query
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const grid = document.getElementById('reviews-grid');
const loadingEl = document.getElementById('reviews-loading');
const emptyEl = document.getElementById('reviews-empty');
const avgRatingEl = document.getElementById('avg-rating');
const totalCountEl = document.getElementById('total-reviews');
const starsBarEl = document.getElementById('stars-bar');

// ── Load reviews from Firestore ───────────────────────────────────────────────

async function loadReviews() {
  try {
    const q = query(collection(db, 'reviews'), orderBy('rating', 'desc'));
    const snap = await getDocs(q);
    const reviews = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    if (loadingEl) loadingEl.classList.add('hidden');

    if (reviews.length === 0) {
      if (emptyEl) emptyEl.classList.remove('hidden');
      return;
    }

    renderSummary(reviews);
    renderReviews(reviews);
  } catch (err) {
    console.error('Reviews load error:', err);
    if (loadingEl) loadingEl.textContent = 'Failed to load reviews. Please try again.';
  }
}

// ── Render summary stats ──────────────────────────────────────────────────────

function renderSummary(reviews) {
  if (!avgRatingEl && !totalCountEl) return;

  const avg = reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length;
  const rounded = Math.round(avg * 10) / 10;

  if (avgRatingEl) avgRatingEl.textContent = rounded.toFixed(1);
  if (totalCountEl) totalCountEl.textContent = `${reviews.length} review${reviews.length !== 1 ? 's' : ''}`;

  // Distribution bars (1–5 stars)
  if (starsBarEl) {
    const dist = [5, 4, 3, 2, 1].map(star => ({
      star,
      count: reviews.filter(r => Math.round(r.rating) === star).length
    }));
    starsBarEl.innerHTML = dist.map(({ star, count }) => {
      const pct = reviews.length ? Math.round((count / reviews.length) * 100) : 0;
      return `
        <div class="flex items-center gap-3">
          <span class="text-sm text-gray-600 w-8">${star}★</span>
          <div class="flex-1 bg-gray-100 rounded-full h-2">
            <div class="bg-amber-400 h-2 rounded-full" style="width:${pct}%"></div>
          </div>
          <span class="text-sm text-gray-500 w-8 text-right">${count}</span>
        </div>`;
    }).join('');
  }
}

// ── Render review cards ───────────────────────────────────────────────────────

function renderReviews(reviews) {
  if (!grid) return;
  grid.classList.remove('hidden');

  grid.innerHTML = reviews.map(review => {
    const stars = renderStars(review.rating || 0);
    const date = review.time ? formatDate(review.time) : '';
    const photo = review.profilePhoto
      ? `<img src="${escHtml(review.profilePhoto)}" alt="${escHtml(review.author)}" class="w-10 h-10 rounded-full object-cover" />`
      : `<div class="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-bold text-sm">${escHtml(review.author?.[0]?.toUpperCase() || '?')}</div>`;

    return `
      <div class="bg-white rounded-2xl shadow-sm p-6 border border-rose-50">
        <div class="flex items-start gap-3 mb-3">
          ${photo}
          <div>
            <p class="font-semibold text-gray-800 text-sm">${escHtml(review.author || 'Anonymous')}</p>
            <div class="flex items-center gap-1 mt-0.5">
              ${stars}
              ${date ? `<span class="text-xs text-gray-400 ml-2">${date}</span>` : ''}
            </div>
          </div>
        </div>
        <p class="text-gray-600 text-sm leading-relaxed">${escHtml(review.text || '')}</p>
      </div>`;
  }).join('');
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderStars(rating) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return Array.from({ length: 5 }, (_, i) => {
    if (i < full) return '<span class="text-amber-400 text-sm">★</span>';
    if (i === full && half) return '<span class="text-amber-400 text-sm">½</span>';
    return '<span class="text-gray-200 text-sm">★</span>';
  }).join('');
}

function formatDate(timestamp) {
  try {
    const d = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
}

function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Init ──────────────────────────────────────────────────────────────────────

loadReviews();
