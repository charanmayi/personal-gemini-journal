# Personal Gemini Journal

A production-grade, secure AI-assisted journaling and creative brainstorming web application built with **React**, **Node.js/Express**, **Firebase Authentication**, **Cloud Firestore**, and **Google Gemini 3.8 Flash** via the `@google/genai` SDK.

---

## Table of Contents
1. [Security & Isolation Guarantees](#1-security--isolation-guarantees)
2. [Firebase Console Configuration (Exact Services to Enable)](#2-firebase-console-configuration)
3. [Architecture Recommendation: Node/Express vs Cloud Functions on Cloud Run](#3-architecture-recommendation-nodeexpress-vs-cloud-functions)
4. [Secret Management: Google Cloud Secret Manager vs Local Dev](#4-secret-management-secret-manager-vs-local-dev)
5. [Local Development Setup (Step-by-Step)](#5-local-development-setup-step-by-step)
6. [Firestore Security Rules & Deployment](#6-firestore-security-rules--deployment)
7. [Codebase File Tour](#7-codebase-file-tour)

---

## 1. Security & Isolation Guarantees

This application follows a strict **Zero-Trust Per-User Architecture**:

- **No Hardcoded Secrets (Rule 1)**: `GEMINI_API_KEY` is never hardcoded or exposed to the client bundle. The client communicates exclusively through authenticated server-side `/api/*` endpoints.
- **Mandatory ID Token Verification (Rule 2)**: Every backend route (`/api/chat`, `/api/summarize`) verifies the caller's Firebase Auth ID token using the Firebase Admin SDK (`admin.auth().verifyIdToken()`). Unauthenticated requests are rejected immediately with `HTTP 401 Unauthorized`.
- **Per-User Isolation in Firestore (Rule 3)**: All journal records are stored under `users/{userId}/journals/{journalId}`. `firestore.rules` enforces that `request.auth.uid == userId` for every read, list, create, update, and delete operation.
- **Input Sanitization & Boundary Constraints (Rule 4)**: The backend sanitizes all prompts and transcripts (stripping control codes, truncating lengths, and enforcing schema limits) before invoking the Gemini API.
- **Auditable Security Rules**: Enforces type checks, ID format guards (`isValidId()`), array size limits, and `request.time` timestamps to defend against Denial-of-Wallet attacks.

---

## 2. Firebase Console Configuration

You need to enable two core Firebase services:

### A. Firebase Authentication
1. Open the [Firebase Console](https://console.firebase.google.com) and create or select your project.
2. In the left navigation, navigate to **Build > Authentication**. Click **Get Started**.
3. Under the **Sign-in method** tab, enable:
   - **Google**: Enable the toggle, configure your project support email, and save.
   - **Email/Password**: Enable the top toggle (Email/Password). (Keep "Email link / passwordless" off).
4. Under the **Settings > Authorized domains** tab:
   - Ensure `localhost` is listed for local development.
   - Add your Cloud Run custom domain or Cloud Run service URL when deploying.

### B. Cloud Firestore
1. In the left navigation, navigate to **Build > Firestore Database**. Click **Create Database**.
2. **Database Mode**: Select **Start in production mode** (this defaults all reads and writes to deny).
3. **Location**: Select your preferred Google Cloud region (e.g., `us-central1`).
4. Click **Enable**.

### C. Obtaining Your Web Client Keys
1. In the Firebase Console, click the **Settings (gear icon) > Project settings**.
2. Under the **General** tab, scroll down to **Your apps**.
3. Click the **Web (&lt;/&gt;)** icon and register an app (e.g., "personal-gemini-journal").
4. Copy the `firebaseConfig` properties into your `.env` file as:
   ```env
   VITE_FIREBASE_API_KEY="AIzaSy..."
   VITE_FIREBASE_AUTH_DOMAIN="your-project-id.firebaseapp.com"
   VITE_FIREBASE_PROJECT_ID="your-project-id"
   VITE_FIREBASE_STORAGE_BUCKET="your-project-id.appspot.com"
   VITE_FIREBASE_MESSAGING_SENDER_ID="123456789012"
   VITE_FIREBASE_APP_ID="1:123456789012:web:abcdef123456"
   ```

---

## 3. Architecture Recommendation: Node/Express vs Cloud Functions

### Why Node/Express on Cloud Run is Recommended:
1. **Unified Container Lifecycle**: The Express backend serves both the API endpoints (`/api/chat`, `/api/summarize`, `/api/health`) and the production-built static Vite bundle (`dist/`). You deploy one container to Google Cloud Run.
2. **Zero CORS Friction**: Since the frontend and backend share the same origin, browser CORS preflight requests (`OPTIONS`) are eliminated, reducing chat latency.
3. **Simpler Secret Management**: You bind your Google Cloud Secret Manager secrets to a single Cloud Run service rather than orchestrating individual environment permissions across multiple separate Cloud Functions.
4. **No Cold-Start Cascades**: Cloud Run maintains container instances warm according to your minimum instances setting (`--min-instances=1`), providing instant response times for interactive multi-turn AI chat.

---

## 4. Secret Management: Secret Manager vs Local Dev

### Local Development
In local development, credentials live in a local `.env` file (which is ignored by `.gitignore`):
```env
GEMINI_API_KEY="AIzaSyYourGeminiApiKeyHere"
FIREBASE_PROJECT_ID="your-project-id"
PORT=3000
```

### Production on Google Cloud Run with Secret Manager
1. **Create the Secret in Google Cloud Secret Manager**:
   ```bash
   # Create the Gemini API key secret
   gcloud secrets create gemini-api-key \
     --data-file=- <<< "YOUR_ACTUAL_GEMINI_API_KEY"
   ```

2. **Grant the Cloud Run Service Account Access**:
   Cloud Run uses the Compute Engine default service account (or a custom service account):
   ```bash
   PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format="value(projectNumber)")

   gcloud secrets add-iam-policy-binding gemini-api-key \
     --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
     --role="roles/secretmanager.secretAccessor"
   ```

3. **Deploy or Update Cloud Run with the Secret Attached**:
   ```bash
   gcloud run services update personal-gemini-journal \
     --set-secrets="GEMINI_API_KEY=gemini-api-key:latest" \
     --set-env-vars="FIREBASE_PROJECT_ID=your-project-id"
   ```

4. **Service Account for Firebase Admin Token Verification**:
   When running on Cloud Run in the same GCP project as Firebase, Firebase Admin automatically utilizes **Application Default Credentials (ADC)**! If your Cloud Run service account has the **Firebase Authentication Admin** role (`roles/firebaseauth.admin`), no manual service account JSON is needed.

---

## 5. Local Development Setup (Step-by-Step)

### Step 1: Clone and Install Dependencies
```bash
git clone <your-repo-url>
cd personal-gemini-journal
npm install
```

### Step 2: Configure Environment Variables
Copy the `.env.example` template:
```bash
cp .env.example .env
```
Open `.env` and fill in:
- `GEMINI_API_KEY`: From [Google AI Studio](https://aistudio.google.com/app/apikey).
- `FIREBASE_PROJECT_ID`: Your Firebase project ID.
- `VITE_FIREBASE_*`: Your Firebase Web app credentials.

### Step 3: Run the Development Server
```bash
npm run dev
```
The server will start on `http://localhost:3000`. In development mode, Express boots with Vite middleware for instant hot development.

### Step 4: Production Build & Start
```bash
npm run build
npm run start
```

---

## 6. Firestore Security Rules & Deployment

Deploy the hardened security rules to Firebase:

```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize project (select your project)
firebase use your-firebase-project-id

# Deploy rules
firebase deploy --only firestore:rules
```

---

## 7. Codebase File Tour

- `server.ts`: The Express backend. Implements Firebase ID token verification middleware (`verifyFirebaseToken`), input validation, `/api/chat` (multi-turn Gemini conversational interaction), `/api/summarize` (session synthesis into title, summary, insights, tags, and mood), and Vite/static serving.
- `firestore.rules`: Production security rules enforcing per-user UID isolation (`users/{userId}/journals/{journalId}`), timestamp integrity, and schema boundary constraints.
- `firebase-blueprint.json`: Intermediate data model representation defining `JournalEntry` and `UserProfile` entities and collection paths.
- `security_spec.md`: Formal security threat modeling covering data invariants and 12 attack vectors (cross-tenant reads, UID spoofing, Denial-of-Wallet).
- `src/lib/firebase.ts`: Initializes Firebase client Auth & Firestore, exports Google sign-in, email/password auth, token retrieval, real-time snapshot subscription, and safe document creation.
- `src/components/Navbar.tsx`: Top navigation with brand identity, UID isolation badge, active tab switcher, and user avatar/sign-out.
- `src/components/AuthModal.tsx`: Login and account creation modal supporting Google Popup and Email/Password with validation.
- `src/components/ChatSession.tsx`: Multi-turn conversational UI with prompt starters, conversation history context preservation, and AI response rendering.
- `src/components/JournalSummaryModal.tsx`: Generates a structured synthesis from the current session via `/api/summarize`, allows user editing, and commits directly to Firestore under the user's UID.
- `src/components/JournalList.tsx`: The "Journal Vault" displaying private entries in real time with keyword search, tag filtering, full reader modal, and delete actions.
- `src/components/SetupGuideModal.tsx`: In-app interactive security and setup guide detailing Cloud Run deployment, Secret Manager, and Firebase configuration.
- `.env.example`: Annotated environment variable template separating backend secrets from public Vite configuration.
