// src/js/admin/upload.js
// Handles file uploads to Cloudinary from the admin dashboard.
// Images are compressed client-side before upload. Videos uploaded as-is (max 50MB).

import { db } from '../firebase.js';
import {
  collection,
  addDoc,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const CLOUDINARY_CLOUD = 'dshs5hmcq';
const CLOUDINARY_PRESET = 'anikas_cake_shop_gallery';
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/auto/upload`;

const MAX_IMAGE_MB = 10;
const MAX_VIDEO_MB = 50;
const COMPRESS_MAX_PX = 1600;   // max width/height after compression
const COMPRESS_QUALITY = 0.82;  // JPEG quality after compression

// DOM refs
const uploadZone = document.getElementById('upload-zone');
const fileInput = document.getElementById('file-input');
const uploadBtn = document.getElementById('upload-btn');
const captionInput = document.getElementById('upload-caption');
const previewList = document.getElementById('file-preview-list');
const progressWrap = document.getElementById('upload-progress');
const progressBar = document.getElementById('progress-bar');
const progressLabel = document.getElementById('progress-label');
const progressPct = document.getElementById('progress-pct');

let selectedFiles = [];

// ── Drag & drop / click to browse ─────────────────────────────────────────────

if (uploadZone) {
  uploadZone.addEventListener('click', () => fileInput?.click());

  uploadZone.addEventListener('dragover', e => {
    e.preventDefault();
    uploadZone.classList.add('drag-over');
  });

  uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('drag-over');
  });

  uploadZone.addEventListener('drop', e => {
    e.preventDefault();
    uploadZone.classList.remove('drag-over');
    handleFiles(Array.from(e.dataTransfer.files));
  });
}

if (fileInput) {
  fileInput.addEventListener('change', () => {
    handleFiles(Array.from(fileInput.files));
    fileInput.value = '';
  });
}

// ── File selection handler ────────────────────────────────────────────────────

function handleFiles(files) {
  const valid = files.filter(file => {
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type === 'video/mp4';
    const withinSize = isVideo
      ? file.size <= MAX_VIDEO_MB * 1024 * 1024
      : file.size <= MAX_IMAGE_MB * 1024 * 1024;

    if (!isImage && !isVideo) {
      showToast(`"${file.name}" skipped – only JPG, PNG, WebP images and MP4 videos are allowed.`, 'error');
      return false;
    }
    if (!withinSize) {
      const limit = isVideo ? MAX_VIDEO_MB : MAX_IMAGE_MB;
      showToast(`"${file.name}" exceeds the ${limit}MB limit.`, 'error');
      return false;
    }
    return true;
  });

  selectedFiles = [...selectedFiles, ...valid];
  renderPreviews();
  if (uploadBtn) uploadBtn.disabled = selectedFiles.length === 0;
}

// ── Render file preview list ──────────────────────────────────────────────────

function renderPreviews() {
  if (!previewList) return;
  previewList.innerHTML = selectedFiles.map((file, idx) => `
    <div class="flex items-center gap-3 bg-rose-50 rounded-lg px-3 py-2 text-sm">
      <span class="text-lg">${file.type.startsWith('image') ? '🖼️' : '🎬'}</span>
      <span class="flex-1 truncate text-gray-700">${escHtml(file.name)}</span>
      <span class="text-gray-400">${formatSize(file.size)}</span>
      <button onclick="removeFile(${idx})" class="text-red-400 hover:text-red-600 transition font-bold">✕</button>
    </div>
  `).join('');
}

window.removeFile = function(idx) {
  selectedFiles.splice(idx, 1);
  renderPreviews();
  if (uploadBtn) uploadBtn.disabled = selectedFiles.length === 0;
};

// ── Upload handler ────────────────────────────────────────────────────────────

if (uploadBtn) {
  uploadBtn.addEventListener('click', startUpload);
}

async function startUpload() {
  if (selectedFiles.length === 0) return;

  uploadBtn.disabled = true;
  if (progressWrap) progressWrap.classList.remove('hidden');

  const caption = captionInput?.value.trim() || '';
  let completed = 0;

  for (const file of selectedFiles) {
    try {
      updateProgress(completed, selectedFiles.length, `Uploading ${file.name}…`);

      // Compress images before upload
      const uploadFile = file.type.startsWith('image/')
        ? await compressImage(file)
        : file;

      const result = await uploadToCloudinary(uploadFile);

      // Save to Firestore
      await addDoc(collection(db, 'gallery'), {
        url: result.secure_url,
        publicId: result.public_id,
        type: file.type.startsWith('image/') ? 'image' : 'video',
        caption,
        uploadedAt: serverTimestamp()
      });

      completed++;
      updateProgress(completed, selectedFiles.length, `Uploaded ${completed} of ${selectedFiles.length}`);
    } catch (err) {
      console.error('Upload error for', file.name, err);
      showToast(`Failed to upload "${file.name}". ${err.message}`, 'error');
    }
  }

  showToast(`${completed} file${completed !== 1 ? 's' : ''} uploaded successfully! 🎉`, 'success');
  selectedFiles = [];
  renderPreviews();
  if (captionInput) captionInput.value = '';
  uploadBtn.disabled = false;
  if (progressWrap) progressWrap.classList.add('hidden');
  updateProgress(0, 1, '');

  // Reload gallery grid
  document.dispatchEvent(new CustomEvent('gallery:reload'));
}

// ── Cloudinary upload via unsigned preset ─────────────────────────────────────

function uploadToCloudinary(file) {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_PRESET);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', CLOUDINARY_UPLOAD_URL);

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new Error(`Cloudinary error: ${xhr.statusText}`));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send(formData);
  });
}

// ── Client-side image compression ────────────────────────────────────────────

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;
      if (width > COMPRESS_MAX_PX || height > COMPRESS_MAX_PX) {
        if (width > height) {
          height = Math.round((height * COMPRESS_MAX_PX) / width);
          width = COMPRESS_MAX_PX;
        } else {
          width = Math.round((width * COMPRESS_MAX_PX) / height);
          height = COMPRESS_MAX_PX;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        blob => {
          if (!blob) { reject(new Error('Canvas compression failed')); return; }
          resolve(new File([blob], file.name, { type: 'image/jpeg' }));
        },
        'image/jpeg',
        COMPRESS_QUALITY
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for compression'));
    };

    img.src = url;
  });
}

// ── Progress UI ───────────────────────────────────────────────────────────────

function updateProgress(done, total, label) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  if (progressBar) progressBar.style.width = `${pct}%`;
  if (progressLabel) progressLabel.textContent = label;
  if (progressPct) progressPct.textContent = `${pct}%`;
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function showToast(message, type = 'info') {
  // Use global toast if available
  if (window.__showToast) { window.__showToast(message, type); return; }
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.className = `fixed top-4 right-4 z-[999] px-5 py-3 rounded-xl shadow-lg text-sm font-semibold transition ${type === 'error' ? 'bg-red-600 text-white' : 'bg-rose-600 text-white'}`;
  toast.textContent = message;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 4000);
}
