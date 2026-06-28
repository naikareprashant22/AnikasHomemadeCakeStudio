// src/js/gallery.js
// Public gallery page – loads images/videos from Firestore and renders grid with lightbox

import { db } from './firebase.js';
import {
  collection,
  getDocs,
  orderBy,
  query
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

let allItems = [];
let currentFilter = 'all';

const grid = document.getElementById('gallery-grid');
const loadingEl = document.getElementById('gallery-loading');
const emptyEl = document.getElementById('gallery-empty');
const filterBtns = document.querySelectorAll('.gallery-filter-btn');
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxVideo = document.getElementById('lightbox-video');
const lightboxClose = document.getElementById('lightbox-close');
const lightboxCaption = document.getElementById('lightbox-caption');

// ── Load gallery from Firestore ──────────────────────────────────────────────

async function loadGallery() {
  try {
    const q = query(collection(db, 'gallery'), orderBy('uploadedAt', 'desc'));
    const snap = await getDocs(q);
    allItems = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderGallery();
  } catch (err) {
    console.error('Gallery load error:', err);
    if (loadingEl) loadingEl.textContent = 'Failed to load gallery. Please try again later.';
  }
}

// ── Render filtered grid ─────────────────────────────────────────────────────

function renderGallery() {
  if (!grid) return;

  const filtered = currentFilter === 'all'
    ? allItems
    : allItems.filter(item => item.type === currentFilter);

  if (loadingEl) loadingEl.classList.add('hidden');

  if (filtered.length === 0) {
    grid.classList.add('hidden');
    if (emptyEl) emptyEl.classList.remove('hidden');
    return;
  }

  if (emptyEl) emptyEl.classList.add('hidden');
  grid.classList.remove('hidden');

  grid.innerHTML = filtered.map((item, idx) => {
    if (item.type === 'video') {
      return `
        <div class="gallery-item group cursor-pointer bg-gray-100 aspect-square"
             data-index="${idx}" onclick="openLightbox(${idx})">
          <div class="w-full h-full flex items-center justify-center bg-rose-50 relative">
            <video src="${item.url}" class="w-full h-full object-cover" muted preload="metadata"></video>
            <div class="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition">
              <span class="text-4xl">▶</span>
            </div>
          </div>
          ${item.caption ? `<p class="text-xs text-center text-gray-500 mt-1 px-1 truncate">${escHtml(item.caption)}</p>` : ''}
        </div>`;
    }
    return `
      <div class="gallery-item group cursor-pointer aspect-square overflow-hidden bg-gray-100"
           data-index="${idx}" onclick="openLightbox(${idx})">
        <img src="${item.url}" alt="${escHtml(item.caption || 'Cake photo')}"
             class="w-full h-full object-cover group-hover:scale-105 transition duration-300"
             loading="lazy" />
        ${item.caption ? `<p class="text-xs text-center text-gray-500 mt-1 px-1 truncate">${escHtml(item.caption)}</p>` : ''}
      </div>`;
  }).join('');
}

// ── Lightbox ─────────────────────────────────────────────────────────────────

window.openLightbox = function(idx) {
  const filtered = currentFilter === 'all'
    ? allItems
    : allItems.filter(item => item.type === currentFilter);
  const item = filtered[idx];
  if (!item || !lightbox) return;

  lightbox.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  if (item.type === 'video') {
    lightboxImg.classList.add('hidden');
    lightboxVideo.classList.remove('hidden');
    lightboxVideo.src = item.url;
    lightboxVideo.play().catch(() => {});
  } else {
    lightboxVideo.classList.add('hidden');
    lightboxVideo.pause();
    lightboxVideo.src = '';
    lightboxImg.classList.remove('hidden');
    lightboxImg.src = item.url;
    lightboxImg.alt = item.caption || 'Cake photo';
  }

  if (lightboxCaption) {
    lightboxCaption.textContent = item.caption || '';
  }
};

function closeLightbox() {
  if (!lightbox) return;
  lightbox.classList.add('hidden');
  document.body.style.overflow = '';
  if (lightboxVideo) {
    lightboxVideo.pause();
    lightboxVideo.src = '';
  }
  if (lightboxImg) lightboxImg.src = '';
}

// ── Event listeners ───────────────────────────────────────────────────────────

if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
if (lightbox) {
  lightbox.addEventListener('click', e => {
    if (e.target === lightbox) closeLightbox();
  });
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeLightbox();
});

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    currentFilter = btn.dataset.filter;
    filterBtns.forEach(b => b.classList.remove('active-filter', 'bg-rose-600', 'text-white'));
    btn.classList.add('active-filter', 'bg-rose-600', 'text-white');
    renderGallery();
  });
});

// ── Utility ───────────────────────────────────────────────────────────────────

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Init ──────────────────────────────────────────────────────────────────────

loadGallery();
