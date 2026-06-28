// src/js/admin/dashboard.js

import { db } from '../firebase.js';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  orderBy
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

// ── State ─────────────────────────────────────────────────────────────────────

let galleryItems = [];
let allOrders = [];
let configData = { cakeTypes: [], sizes: [], flavours: [] };
let galleryFilter = 'all';
let deleteTarget = null;

// ── Tab switching ─────────────────────────────────────────────────────────────

const tabBtns = document.querySelectorAll('.tab-btn');
const tabPanels = document.querySelectorAll('.tab-panel');

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    tabBtns.forEach(b => b.classList.remove('active'));
    tabPanels.forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`tab-${btn.dataset.tab}`)?.classList.add('active');
  });
});

// ── Wait for auth before loading data ─────────────────────────────────────────

document.addEventListener('admin:ready', () => {
  loadGallery();
  loadOrders();
  loadConfig();
  loadAdminReviews();
});

// ── GALLERY ───────────────────────────────────────────────────────────────────

async function loadGallery() {
  const loading = document.getElementById('gallery-loading');
  try {
    const q = query(collection(db, 'gallery'), orderBy('uploadedAt', 'desc'));
    const snap = await getDocs(q);
    galleryItems = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (loading) loading.classList.add('hidden');
    renderAdminGallery();
  } catch (err) {
    console.error('Gallery load:', err);
    if (loading) loading.textContent = 'Failed to load gallery.';
  }
}

document.addEventListener('gallery:reload', loadGallery);

function renderAdminGallery() {
  const grid = document.getElementById('gallery-grid');
  const empty = document.getElementById('gallery-empty');
  if (!grid) return;

  const filtered = galleryFilter === 'all'
    ? galleryItems
    : galleryItems.filter(i => i.type === galleryFilter);

  if (filtered.length === 0) {
    grid.classList.add('hidden');
    if (empty) empty.classList.remove('hidden');
    return;
  }

  if (empty) empty.classList.add('hidden');
  grid.classList.remove('hidden');

  grid.innerHTML = filtered.map(item => `
    <div class="gallery-item group relative aspect-square bg-gray-100 rounded-xl overflow-hidden cursor-pointer"
         onclick="adminLightbox('${escHtml(item.url)}', '${item.type}')">
      ${item.type === 'video'
        ? `<div class="w-full h-full flex items-center justify-center bg-rose-50">
             <video src="${escHtml(item.url)}" class="w-full h-full object-cover" muted preload="metadata"></video>
             <div class="absolute inset-0 flex items-center justify-center bg-black/20">
               <span class="text-3xl">▶</span>
             </div>
           </div>`
        : `<img src="${escHtml(item.url)}" alt="${escHtml(item.caption || '')}"
               class="w-full h-full object-cover group-hover:scale-105 transition duration-300" loading="lazy" />`}
      ${item.caption ? `<div class="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs px-2 py-1 truncate">${escHtml(item.caption)}</div>` : ''}
      <button class="delete-btn absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white w-7 h-7 rounded-full flex items-center justify-center text-xs transition shadow-md"
              onclick="event.stopPropagation(); confirmDelete('${item.id}', '${escHtml(item.publicId || '')}')">✕</button>
    </div>
  `).join('');
}

document.querySelectorAll('.gallery-filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    galleryFilter = btn.dataset.filter;
    document.querySelectorAll('.gallery-filter-btn').forEach(b => b.classList.remove('active-filter', 'bg-rose-100'));
    btn.classList.add('active-filter', 'bg-rose-100');
    renderAdminGallery();
  });
});

// ── Delete flow ───────────────────────────────────────────────────────────────

window.confirmDelete = function(id, publicId) {
  deleteTarget = { id, publicId };
  document.getElementById('delete-modal')?.classList.remove('hidden');
};

document.getElementById('cancel-delete')?.addEventListener('click', () => {
  deleteTarget = null;
  document.getElementById('delete-modal')?.classList.add('hidden');
});

document.getElementById('confirm-delete')?.addEventListener('click', async () => {
  if (!deleteTarget) return;
  document.getElementById('delete-modal')?.classList.add('hidden');
  try {
    await deleteDoc(doc(db, 'gallery', deleteTarget.id));
    showToast('Item deleted from gallery.', 'success');
    galleryItems = galleryItems.filter(i => i.id !== deleteTarget.id);
    renderAdminGallery();
  } catch (err) {
    console.error('Delete error:', err);
    showToast('Failed to delete item.', 'error');
  } finally {
    deleteTarget = null;
  }
});

// ── Admin lightbox ────────────────────────────────────────────────────────────

window.adminLightbox = function(url, type) {
  const lb = document.getElementById('lightbox');
  const img = document.getElementById('lightbox-img');
  const vid = document.getElementById('lightbox-video');
  if (!lb) return;
  lb.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  if (type === 'video') {
    img?.classList.add('hidden');
    if (vid) { vid.classList.remove('hidden'); vid.src = url; vid.play().catch(() => {}); }
  } else {
    vid?.classList.add('hidden');
    if (vid) { vid.pause(); vid.src = ''; }
    if (img) { img.classList.remove('hidden'); img.src = url; }
  }
};

document.getElementById('lightbox-close')?.addEventListener('click', closeLightbox);
document.getElementById('lightbox')?.addEventListener('click', e => {
  if (e.target.id === 'lightbox') closeLightbox();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });

function closeLightbox() {
  const lb = document.getElementById('lightbox');
  const vid = document.getElementById('lightbox-video');
  const img = document.getElementById('lightbox-img');
  lb?.classList.add('hidden');
  document.body.style.overflow = '';
  if (vid) { vid.pause(); vid.src = ''; }
  if (img) img.src = '';
}

// ── ORDERS ────────────────────────────────────────────────────────────────────

async function loadOrders() {
  const loading = document.getElementById('orders-loading');
  try {
    const q = query(collection(db, 'orderRequests'), orderBy('submittedAt', 'desc'));
    const snap = await getDocs(q);
    allOrders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (loading) loading.classList.add('hidden');
    renderOrders(allOrders);
    populateOrderFilters();
    wireOrderSearch();
  } catch (err) {
    console.error('Orders load:', err);
    if (loading) loading.textContent = 'Failed to load orders.';
  }
}

function renderOrders(orders) {
  const empty = document.getElementById('orders-empty');
  const wrap = document.getElementById('orders-table-wrap');
  const tbody = document.getElementById('orders-tbody');
  const countEl = document.getElementById('orders-count');

  if (countEl) countEl.textContent = `${orders.length} order${orders.length !== 1 ? 's' : ''}`;

  if (orders.length === 0) {
    wrap?.classList.add('hidden');
    empty?.classList.remove('hidden');
    return;
  }

  empty?.classList.add('hidden');
  wrap?.classList.remove('hidden');

  if (tbody) {
    tbody.innerHTML = orders.map(o => `
      <tr class="order-row border-b border-gray-50">
        <td class="py-3 pr-4 font-medium text-gray-800">${escHtml(o.name || '')}</td>
        <td class="py-3 pr-4">
          <a href="https://wa.me/91${escHtml(o.phone || '')}" target="_blank"
             class="text-rose-600 hover:underline">${escHtml(o.phone || '')}</a>
        </td>
        <td class="py-3 pr-4 text-gray-600">${escHtml(o.cakeType || '')}</td>
        <td class="py-3 pr-4 text-gray-600">${escHtml(o.size || '')}</td>
        <td class="py-3 pr-4 text-gray-600">${escHtml(o.flavour || '')}</td>
        <td class="py-3 pr-4 text-gray-600">${escHtml(o.deliveryDate || '')}</td>
        <td class="py-3 pr-4 text-gray-500 max-w-xs">
          <span class="truncate block" title="${escHtml(o.message || '')}">${escHtml(o.message || '–')}</span>
        </td>
        <td class="py-3 text-xs text-gray-400 whitespace-nowrap">${formatTimestamp(o.submittedAt)}</td>
      </tr>
    `).join('');
  }
}

function populateOrderFilters() {
  const typesSel = document.getElementById('order-filter-type');
  const sizesSel = document.getElementById('order-filter-size');
  const types = [...new Set(allOrders.map(o => o.cakeType).filter(Boolean))];
  const sizes = [...new Set(allOrders.map(o => o.size).filter(Boolean))];
  types.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t; opt.textContent = t;
    typesSel?.appendChild(opt);
  });
  sizes.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s; opt.textContent = s;
    sizesSel?.appendChild(opt);
  });
}

function wireOrderSearch() {
  const searchInput = document.getElementById('order-search');
  const typeSel = document.getElementById('order-filter-type');
  const sizeSel = document.getElementById('order-filter-size');
  const filter = () => {
    const q = searchInput?.value.toLowerCase() || '';
    const type = typeSel?.value || '';
    const size = sizeSel?.value || '';
    const filtered = allOrders.filter(o => {
      const matchQ = !q || o.name?.toLowerCase().includes(q) || o.phone?.includes(q);
      const matchType = !type || o.cakeType === type;
      const matchSize = !size || o.size === size;
      return matchQ && matchType && matchSize;
    });
    renderOrders(filtered);
  };
  searchInput?.addEventListener('input', filter);
  typeSel?.addEventListener('change', filter);
  sizeSel?.addEventListener('change', filter);
}

document.getElementById('export-orders-btn')?.addEventListener('click', () => {
  const headers = ['Name', 'Phone', 'Cake Type', 'Size', 'Flavour', 'Delivery Date', 'Message', 'Submitted At'];
  const rows = allOrders.map(o => [
    o.name, o.phone, o.cakeType, o.size, o.flavour, o.deliveryDate, o.message, formatTimestamp(o.submittedAt)
  ]);
  const csv = [headers, ...rows].map(r => r.map(c => `"${String(c || '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
});

// ── CONFIG ────────────────────────────────────────────────────────────────────

async function loadConfig() {
  try {
    const snap = await getDoc(doc(db, 'cakeConfig', 'options'));
    if (snap.exists()) {
      configData = snap.data();
    }
    renderConfigList('cakeTypes');
    renderConfigList('sizes');
    renderConfigList('flavours');
  } catch (err) {
    console.error('Config load:', err);
    showToast('Failed to load config.', 'error');
  }
}

function renderConfigList(key) {
  const listEl = document.getElementById(`${key}-list`);
  if (!listEl) return;
  const items = configData[key] || [];
  listEl.innerHTML = items.length
    ? items.map((item, idx) => `
        <div class="flex items-center gap-2 bg-rose-50 rounded-lg px-3 py-2">
          <span class="flex-1 text-sm text-gray-700">${escHtml(item)}</span>
          <button data-key="${key}" data-idx="${idx}" class="remove-config-btn text-red-400 hover:text-red-600 text-xs font-bold transition">✕</button>
        </div>
      `).join('')
    : '<p class="text-sm text-gray-400">No items. Add some below.</p>';

  // ✅ Wire remove buttons via event listeners (not onclick)
  listEl.querySelectorAll('.remove-config-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const k = btn.dataset.key;
      const i = parseInt(btn.dataset.idx);
      configData[k]?.splice(i, 1);
      renderConfigList(k);
    });
  });
}

// ✅ FIX: Wire ALL Add and Save buttons via getElementById — no onclick needed
['cakeTypes', 'sizes', 'flavours'].forEach(key => {
  const addBtn  = document.getElementById(`add-${key}-btn`);
  const saveBtn = document.getElementById(`save-${key}-btn`);
  const input   = document.getElementById(`new-${key}`);

  // Add button
  addBtn?.addEventListener('click', () => {
    const val = input?.value.trim();
    if (!val) {
      showToast('Please type something first.', 'error');
      return;
    }
    if (!configData[key]) configData[key] = [];
    if (configData[key].includes(val)) {
      showToast('Item already exists.', 'error');
      return;
    }
    configData[key].push(val);
    renderConfigList(key);
    if (input) input.value = '';
    showToast(`"${val}" added. Click Save to store it.`, 'info');
  });

  // Allow Enter key to trigger Add
  input?.addEventListener('keydown', e => {
    if (e.key === 'Enter') addBtn?.click();
  });

  // Save button
  saveBtn?.addEventListener('click', async () => {
    try {
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving…';
      await setDoc(doc(db, 'cakeConfig', 'options'), configData, { merge: true });
      showToast(`${key} saved to Firestore! ✅`, 'success');
    } catch (err) {
      console.error('Config save error:', err);
      showToast('Failed to save. Check Firestore rules.', 'error');
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = key === 'cakeTypes' ? 'Save Cake Types' : key === 'sizes' ? 'Save Sizes' : 'Save Flavours';
    }
  });
});

// ── REVIEWS ───────────────────────────────────────────────────────────────────

async function loadAdminReviews() {
  const loading = document.getElementById('reviews-loading');
  const empty = document.getElementById('reviews-empty');
  const grid = document.getElementById('reviews-grid');

  try {
    const q = query(collection(db, 'reviews'), orderBy('rating', 'desc'));
    const snap = await getDocs(q);
    const reviews = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (loading) loading.classList.add('hidden');
    if (reviews.length === 0) {
      if (empty) empty.classList.remove('hidden');
      return;
    }
    if (grid) {
      grid.classList.remove('hidden');
      grid.innerHTML = reviews.map(r => `
        <div class="border border-gray-100 rounded-xl p-4">
          <div class="flex items-center gap-3 mb-2">
            ${r.profilePhoto
              ? `<img src="${escHtml(r.profilePhoto)}" class="w-9 h-9 rounded-full object-cover" />`
              : `<div class="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-bold text-sm">${(r.author?.[0] || '?').toUpperCase()}</div>`}
            <div>
              <p class="font-semibold text-sm text-gray-800">${escHtml(r.author || 'Anonymous')}</p>
              <div class="flex">${'★'.repeat(Math.round(r.rating || 0)).split('').map(() => '<span class="star text-sm">★</span>').join('')}</div>
            </div>
            <span class="ml-auto text-xs text-gray-400">${r.rating?.toFixed(1) || ''}</span>
          </div>
          <p class="text-sm text-gray-600 leading-relaxed">${escHtml(r.text || '')}</p>
        </div>
      `).join('');
    }
  } catch (err) {
    console.error('Reviews load:', err);
    if (loading) loading.textContent = 'Failed to load reviews.';
  }
}

document.getElementById('refresh-reviews-btn')?.addEventListener('click', () => {
  showToast('Run scripts/fetchReviews.js from your terminal to pull fresh reviews from Google.', 'info');
});

// ── Utilities ─────────────────────────────────────────────────────────────────

function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatTimestamp(ts) {
  if (!ts) return '—';
  try {
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return '—'; }
}

function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  const colors = {
    success: 'bg-green-600 text-white',
    error:   'bg-red-600 text-white',
    info:    'bg-rose-600 text-white'
  };
  toast.className = `fixed top-4 right-4 z-[999] px-5 py-3 rounded-xl shadow-lg text-sm font-semibold ${colors[type] || colors.info}`;
  toast.textContent = message;
  toast.classList.remove('hidden');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.add('hidden'), 4000);
}

window.__showToast = showToast;