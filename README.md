# 🎂 Anika's Homemade Cake Studio — Website

> **"Baked with Love, Purely Eggless"**
> A fully custom marketing website for Anika's Homemade Cake Studio, Pune.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Prerequisites](#2-prerequisites)
3. [Folder Structure](#3-folder-structure)
4. [Firebase Project Setup](#4-firebase-project-setup)
5. [Cloudinary Account Setup](#5-cloudinary-account-setup)
6. [Environment Variables](#6-environment-variables)
7. [Creating an Admin User](#7-creating-an-admin-user)
8. [Seeding Firestore](#8-seeding-firestore)
9. [Fetching Google Reviews](#9-fetching-google-reviews)
10. [Local Development](#10-local-development)
11. [GitHub Repository Setup](#11-github-repository-setup)
12. [Firebase Hosting Deployment](#12-firebase-hosting-deployment)
13. [Tech Stack](#13-tech-stack)

---

## 1. Project Overview

This is a **static marketing website** (no backend server) for Anika's Homemade Cake Studio. It includes:

- **Public pages:** Home, About, Gallery (photos + videos), Reviews, Contact + Order Form
- **Admin dashboard:** Protected behind Firebase Auth, allows gallery management, order viewing, and cake config editing
- **Order flow:** Order form → saved to Firestore → opens WhatsApp with pre-filled message
- **Gallery storage:** Cloudinary (free tier, no credit card needed)
- **Reviews:** Seeded into Firestore via Google Places API script

**Stack:**
- Vite + Vanilla JS (ES Modules)
- TailwindCSS v3
- Firebase v10 (Auth + Firestore + Hosting)
- Cloudinary (image & video storage)

---

## 2. Prerequisites

Before you begin, install:

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 18+ | https://nodejs.org |
| npm | 9+ | Bundled with Node |
| Firebase CLI | Latest | `npm install -g firebase-tools` |
| Git | Any | https://git-scm.com |

---

## 3. Folder Structure

```
anikas-cake-studio/
├── public/                    # Static files copied to dist as-is
│   ├── favicon.svg
│   ├── sitemap.xml
│   └── robots.txt
├── scripts/                   # Node.js scripts (run locally, not served)
│   ├── seedFirestore.js       # Seeds cakeConfig/options in Firestore
│   └── fetchReviews.js        # Pulls Google reviews into Firestore
├── src/
│   ├── css/
│   │   └── style.css          # Global styles (Tailwind + custom)
│   ├── js/
│   │   ├── firebase.js        # Firebase app initialisation (shared)
│   │   ├── gallery.js         # Public gallery page logic
│   │   ├── reviews.js         # Public reviews page logic
│   │   ├── orderForm.js       # Order form logic (Firestore + WhatsApp)
│   │   └── admin/
│   │       ├── auth.js        # Firebase Auth guard for dashboard
│   │       ├── upload.js      # Cloudinary upload + Firestore save
│   │       └── dashboard.js   # Dashboard tabs: gallery, orders, config
│   └── pages/
│       ├── index.html         # Home
│       ├── about.html         # About
│       ├── gallery.html       # Gallery (public)
│       ├── reviews.html       # Reviews (public)
│       ├── contact.html       # Contact + Order Form
│       └── admin/
│           ├── index.html     # Admin login
│           └── dashboard.html # Admin dashboard (protected)
├── .env                       # Your local secrets (never commit)
├── .env.example               # Template for .env
├── .gitignore
├── firebase.json              # Firebase Hosting config
├── firestore.rules            # Firestore security rules
├── package.json
├── postcss.config.js
├── tailwind.config.js
└── vite.config.js
```

---

## 4. Firebase Project Setup

### Step 1 — Create a Firebase project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **Add project** → name it `anikas-cake-studio` (or any name)
3. Disable Google Analytics if you don't need it → click **Create project**

### Step 2 — Enable Authentication

1. In your project sidebar, go to **Build → Authentication**
2. Click **Get started**
3. Under **Sign-in method**, enable **Email/Password**

### Step 3 — Create Firestore Database

1. Go to **Build → Firestore Database**
2. Click **Create database**
3. Choose **Production mode** (rules are already set in `firestore.rules`)
4. Select your preferred region (e.g. `asia-south1` for Mumbai)
5. Click **Enable**

### Step 4 — Get your Firebase web config

1. Go to **Project Settings** (gear icon, top left)
2. Scroll to **Your apps** → click **</>** (Web app)
3. Register the app, name it `anikas-cake-studio-web`
4. Copy the config object — it looks like:

```js
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

5. Paste these values into your `.env` file (see [Section 6](#6-environment-variables))

### Step 5 — Deploy Firestore Rules

```bash
firebase login
firebase use your-project-id
firebase deploy --only firestore:rules
```

### Step 6 — Download service account key (for scripts only)

> Required only for `seedFirestore.js` and `fetchReviews.js`. Not used in the website itself.

1. Go to **Project Settings → Service Accounts**
2. Click **Generate new private key**
3. Save the JSON file as `serviceAccount.json` in the project root
4. This file is already in `.gitignore` — **never commit it**

---

## 5. Cloudinary Account Setup

### Step 1 — Create a free account

1. Sign up at [cloudinary.com](https://cloudinary.com) — no credit card required
2. Your **Cloud Name** is shown on the dashboard (e.g. `dshs5hmcq`)

### Step 2 — Create an unsigned upload preset

1. Go to **Settings → Upload** (in Cloudinary dashboard)
2. Scroll to **Upload presets** → click **Add upload preset**
3. Set:
   - **Preset name:** `anikas_cake_shop_gallery`
   - **Signing Mode:** `Unsigned`
   - **Folder:** `anikas-gallery` (optional, for organisation)
4. Click **Save**

### Step 3 — Verify credentials in code

In `src/js/admin/upload.js`, confirm these constants match your Cloudinary account:

```js
const CLOUDINARY_CLOUD  = 'dshs5hmcq';             // your cloud name
const CLOUDINARY_PRESET = 'anikas_cake_shop_gallery'; // your preset name
```

### Notes on free tier

- **25 GB storage**, no bandwidth cap for small sites
- **Image transformations:** unlimited on free tier
- **Video:** MP4 only, max 50MB per file
- Deletion from Cloudinary requires Admin API (paid) or manual cleanup in the Cloudinary dashboard. The website removes items from Firestore, keeping Cloudinary clean-up manual.

---

## 6. Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Fill in your values:

```env
# Firebase (from your Firebase web app config)
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123

# Cloudinary (for upload.js — also hardcoded since preset is unsigned/public)
VITE_CLOUDINARY_CLOUD_NAME=dshs5hmcq
VITE_CLOUDINARY_UPLOAD_PRESET=anikas_cake_shop_gallery

# Scripts only (not exposed to browser)
FIREBASE_SERVICE_ACCOUNT_KEY_PATH=./serviceAccount.json

# For fetchReviews.js
GOOGLE_PLACES_API_KEY=your_google_places_api_key
GOOGLE_PLACE_ID=ChIJ...your_place_id
```

> **Security note:** Variables prefixed `VITE_` are embedded in the browser bundle. Since the Cloudinary preset is unsigned (public), this is intentional and safe. Firebase API keys are also safe to expose — Firestore rules protect your data.

---

## 7. Creating an Admin User

Admin users are managed entirely through Firebase Console. **There is no self-registration.**

### Step 1 — Create the Firebase Auth account

1. Go to **Firebase Console → Authentication → Users**
2. Click **Add user**
3. Enter the admin's email and a strong password
4. Click **Add user** — note the **User UID** (e.g. `abc123xyz`)

### Step 2 — Create the Firestore admin document

1. Go to **Firebase Console → Firestore Database**
2. Click **+ Start collection** → Collection ID: `admins`
3. Document ID: paste the **User UID** from Step 1
4. Add these fields:

| Field | Type | Value |
|-------|------|-------|
| `email` | string | admin@example.com |
| `displayName` | string | Anika |
| `role` | string | superadmin |
| `createdAt` | timestamp | (current time) |

5. Click **Save**

### The admin can now log in at `/src/pages/admin/index.html`

**Forgot password** uses Firebase's built-in `sendPasswordResetEmail()` — available on the login page.

---

## 8. Seeding Firestore

This script creates the `cakeConfig/options` document with initial cake types, sizes, and flavours.

### Prerequisites

```bash
npm install firebase-admin dotenv
```

### Run

```bash
node scripts/seedFirestore.js
```

**Output:**
```
🌱 Starting Firestore seed...
✅  cakeConfig/options seeded:
    Cake Types: Birthday Cake, Anniversary Cake, ...
    Sizes: 250 Gm, 500 Gm, ...
    Flavours: Chocolate, Butterscotch, ...
✅  Seed complete!
```

**Force overwrite** (if already seeded):

```bash
node scripts/seedFirestore.js --force
```

---

## 9. Fetching Google Reviews

This script fetches reviews from Google Places API and saves them to Firestore.

### Prerequisites

1. **Enable the Places API** in Google Cloud Console:
   - Go to [console.cloud.google.com](https://console.cloud.google.com)
   - Enable **Places API**
   - Create an API key under **APIs & Services → Credentials**

2. **Find your Google Place ID:**
   - Visit: https://developers.google.com/maps/documentation/places/web-service/place-id
   - Search for "Anika's Homemade Cake Studio, Ravet, Pune"

3. **Set env vars** in `.env`:
   ```env
   GOOGLE_PLACES_API_KEY=AIzaSy...
   GOOGLE_PLACE_ID=ChIJ...
   ```

4. **Install dependencies:**
   ```bash
   npm install firebase-admin dotenv node-fetch
   ```

### Run

```bash
# Fetch and add reviews (won't duplicate if run multiple times)
node scripts/fetchReviews.js

# Clear existing Google reviews first, then re-fetch
node scripts/fetchReviews.js --clear
```

**Output:**
```
⭐ Anika's Cake Studio – Review Fetcher

📡 Fetching from Google Places API…
✅ Fetched 8 review(s) from Google.
✅ Saved 8 review(s) to Firestore.

  1. Priya Sharma – ★★★★★ (5/5)
     "Absolutely loved the chocolate cake! So moist and perfectly eggless…"
  ...

Done! Reviews are now live on your website.
```

> Note: Google Places API returns a maximum of **5 most recent reviews** on the free tier. For more, a paid plan or alternative review source is needed.

---

## 10. Local Development

### Install dependencies

```bash
npm install
```

### Start dev server

```bash
npm run dev
```

Vite starts at **http://localhost:5173**

### Available scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Build for production (outputs to `dist/`) |
| `npm run preview` | Preview production build locally |

### Testing the admin dashboard

1. Start dev server: `npm run dev`
2. Navigate to `http://localhost:5173/src/pages/admin/index.html`
3. Log in with the admin email/password you created in Firebase Console
4. You should be redirected to `dashboard.html`

---

## 11. GitHub Repository Setup

```bash
# Initialise git (if not already done)
git init
git add .
git commit -m "Initial commit – Anika's Cake Studio website"

# Create repo on GitHub (via gh CLI or github.com)
gh repo create anikas-cake-studio --private

# Push
git remote add origin https://github.com/YOUR_USERNAME/anikas-cake-studio.git
git branch -M main
git push -u origin main
```

### CI/CD with GitHub Actions (optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Firebase Hosting

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
      - run: npm ci
      - run: npm run build
        env:
          VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}
          VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
          VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.VITE_FIREBASE_STORAGE_BUCKET }}
          VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.VITE_FIREBASE_MESSAGING_SENDER_ID }}
          VITE_FIREBASE_APP_ID: ${{ secrets.VITE_FIREBASE_APP_ID }}
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
          channelId: live
          projectId: your-project-id
```

Add secrets in **GitHub → Repo → Settings → Secrets and variables → Actions**.

---

## 12. Firebase Hosting Deployment

### Step 1 — Login and select project

```bash
firebase login
firebase use your-project-id
```

### Step 2 — Build the project

```bash
npm run build
```

This outputs to `dist/`.

### Step 3 — Deploy

```bash
firebase deploy --only hosting
```

Your site will be live at:
- `https://your-project-id.web.app`
- `https://your-project-id.firebaseapp.com`

### Step 4 — Custom domain (optional)

1. Go to **Firebase Console → Hosting → Add custom domain**
2. Follow the DNS verification steps
3. Firebase provides a free SSL certificate automatically

### Step 5 — Update sitemap.xml

After your domain is confirmed, update `public/sitemap.xml` to replace `anikas-cake-studio.web.app` with your actual domain.

---

## 13. Tech Stack

| Layer | Technology |
|-------|-----------|
| Build tool | Vite 5 |
| Frontend | Vanilla JS (ES Modules, no framework) |
| Styling | TailwindCSS v3 + custom CSS |
| Auth | Firebase Authentication (Email/Password) |
| Database | Cloud Firestore (Firebase) |
| Hosting | Firebase Hosting |
| Media storage | Cloudinary (free tier) |
| Scripts runtime | Node.js 18+ |

---

## Contact

**Business:** Anika's Homemade Cake Studio
**WhatsApp:** +91 95030 25610
**Instagram:** [@anika_shomemadecakestudio](https://www.instagram.com/anika_shomemadecakestudio)
**Address:** Vision Aristo, Mukai Chowk, Ravet, Pune – 412101

---

*Built with ❤️ for Anika's Homemade Cake Studio*
