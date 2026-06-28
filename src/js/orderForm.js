// src/js/orderForm.js
// Handles the order request form:
//  1. Loads dropdown values from Firestore cakeConfig/options
//  2. On submit: saves to orderRequests collection
//  3. Opens WhatsApp with pre-filled message

import { db } from './firebase.js';
import {
  doc,
  getDoc,
  collection,
  addDoc,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const WHATSAPP_NUMBER = '919503025610';

const form = document.getElementById('order-form');
const submitBtn = document.getElementById('order-submit-btn');
const successMsg = document.getElementById('order-success');
const errorMsg = document.getElementById('order-error');

const selCakeType = document.getElementById('order-cake-type');
const selSize = document.getElementById('order-size');
const selFlavour = document.getElementById('order-flavour');

// ── Load dropdown config from Firestore ───────────────────────────────────────

async function loadConfig() {
  try {
    const snap = await getDoc(doc(db, 'cakeConfig', 'options'));
    if (!snap.exists()) return;

    const data = snap.data();

    populateSelect(selCakeType, data.cakeTypes || []);
    populateSelect(selSize, data.sizes || []);
    populateSelect(selFlavour, data.flavours || []);
  } catch (err) {
    console.error('Config load error:', err);
  }
}

function populateSelect(selectEl, options) {
  if (!selectEl) return;
  const placeholder = selectEl.querySelector('option[value=""]');
  selectEl.innerHTML = '';
  if (placeholder) selectEl.appendChild(placeholder);
  options.forEach(opt => {
    const el = document.createElement('option');
    el.value = opt;
    el.textContent = opt;
    selectEl.appendChild(el);
  });
}

// ── Form submission ───────────────────────────────────────────────────────────

if (form) {
  form.addEventListener('submit', async e => {
    e.preventDefault();
    clearMessages();

    const name = getVal('order-name').trim();
    const phone = getVal('order-phone').trim();
    const cakeType = getVal('order-cake-type');
    const size = getVal('order-size');
    const flavour = getVal('order-flavour');
    const deliveryDate = getVal('order-delivery-date');
    const message = getVal('order-message').trim();

    // Basic validation
    if (!name || !phone || !cakeType || !size || !flavour || !deliveryDate) {
      showError('Please fill in all required fields.');
      return;
    }

    if (!/^[6-9]\d{9}$/.test(phone.replace(/\s+/g, ''))) {
      showError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    setLoading(true);

    try {
      // 1. Save to Firestore
      await addDoc(collection(db, 'orderRequests'), {
        name,
        phone,
        cakeType,
        size,
        flavour,
        deliveryDate,
        message,
        submittedAt: serverTimestamp()
      });

      // 2. Open WhatsApp
      const waText = buildWhatsAppMessage({ name, phone, cakeType, size, flavour, deliveryDate, message });
      const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(waText)}`;
      window.open(waUrl, '_blank');

      // 3. Show success & reset
      showSuccess();
      form.reset();
    } catch (err) {
      console.error('Order submit error:', err);
      showError('Something went wrong. Please try again or contact us directly on WhatsApp.');
    } finally {
      setLoading(false);
    }
  });
}

// ── WhatsApp message builder ──────────────────────────────────────────────────

function buildWhatsAppMessage({ name, phone, cakeType, size, flavour, deliveryDate, message }) {
  return [
    '🎂 New Cake Order Request',
    `Name: ${name}`,
    `Phone: ${phone}`,
    `Cake Type: ${cakeType}`,
    `Size: ${size}`,
    `Flavour: ${flavour}`,
    `Required Date: ${deliveryDate}`,
    message ? `Message: ${message}` : '',
    '',
    'Sent from Anika\'s Homemade Cake Studio website'
  ].filter(line => line !== null).join('\n');
}

// ── UI helpers ────────────────────────────────────────────────────────────────

function getVal(id) {
  return document.getElementById(id)?.value || '';
}

function setLoading(loading) {
  if (!submitBtn) return;
  submitBtn.disabled = loading;
  submitBtn.textContent = loading ? 'Sending…' : 'Send Order on WhatsApp 📲';
}

function clearMessages() {
  if (successMsg) successMsg.classList.add('hidden');
  if (errorMsg) errorMsg.classList.add('hidden');
}

function showSuccess() {
  if (successMsg) {
    successMsg.classList.remove('hidden');
    successMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

function showError(msg) {
  if (errorMsg) {
    errorMsg.textContent = msg;
    errorMsg.classList.remove('hidden');
    errorMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

// ── Init ──────────────────────────────────────────────────────────────────────

loadConfig();
