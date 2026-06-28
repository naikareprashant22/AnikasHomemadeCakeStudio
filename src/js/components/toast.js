// src/js/components/toast.js
// Simple toast notification system.

let toastTimer;

export function showToast(message, type = 'info') {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    document.body.appendChild(toast);
  }

  const colors = {
    success: 'background:#16a34a;color:#fff',
    error:   'background:#dc2626;color:#fff',
    info:    'background:#C2185B;color:#fff',
  };

  toast.style.cssText = `position:fixed;top:1rem;right:1rem;z-index:9999;padding:0.75rem 1.25rem;border-radius:0.75rem;font-size:0.875rem;font-weight:600;box-shadow:0 4px 20px rgba(0,0,0,0.15);${colors[type] || colors.info}`;
  toast.textContent = message;
  toast.style.display = 'block';

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.style.display = 'none'; }, 4000);
}
