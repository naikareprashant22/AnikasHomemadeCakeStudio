// src/js/admin/auth.js
// Firebase Auth guard for admin pages.
// Import this as the FIRST script on any admin-protected page.

import { auth } from '../firebase.js';
import {
  onAuthStateChanged,
  signOut
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { db } from '../firebase.js';
import {
  doc,
  getDoc
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const ADMIN_LOGIN_URL = '/src/pages/admin/index.html';

// ── Auth state guard ──────────────────────────────────────────────────────────

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    // Not logged in → redirect to login
    window.location.href = ADMIN_LOGIN_URL;
    return;
  }

  // Verify this user is in the admins collection
  try {
    const adminSnap = await getDoc(doc(db, 'admins', user.uid));
    if (!adminSnap.exists()) {
      // Authenticated but not an admin → sign out and redirect
      await signOut(auth);
      window.location.href = ADMIN_LOGIN_URL + '?error=unauthorized';
      return;
    }

    // Populate admin info in the header
    const emailEl = document.getElementById('admin-email');
    if (emailEl) {
      emailEl.textContent = adminSnap.data().displayName || user.email;
      emailEl.classList.remove('hidden');
    }

    // Expose current user for other modules
    window.__adminUser = user;
    window.__adminData = adminSnap.data();

    // Signal that auth is ready
    document.dispatchEvent(new CustomEvent('admin:ready', { detail: { user, data: adminSnap.data() } }));

  } catch (err) {
    console.error('Admin verification error:', err);
    window.location.href = ADMIN_LOGIN_URL + '?error=auth_error';
  }
});

// ── Logout ────────────────────────────────────────────────────────────────────

const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    try {
      await signOut(auth);
      window.location.href = ADMIN_LOGIN_URL;
    } catch (err) {
      console.error('Logout error:', err);
    }
  });
}

// ── Login page handler (for admin/index.html) ─────────────────────────────────

export { auth };
