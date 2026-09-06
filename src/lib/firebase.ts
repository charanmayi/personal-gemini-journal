import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as firebaseSignOut,
  User,
  Auth,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  Firestore,
  Unsubscribe,
} from "firebase/firestore";
import { JournalEntry, JournalSummaryPayload } from "../types";

// Firebase error logging conforming to Firebase Security Skill
export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const currentAuth = auth ? auth.currentUser : null;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentAuth?.uid,
      email: currentAuth?.email,
      emailVerified: currentAuth?.emailVerified,
      isAnonymous: currentAuth?.isAnonymous,
    },
    operationType,
    path,
  };
  console.error("Firestore Permission / Operation Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Check if environment has valid Firebase configuration
export function getFirebaseConfig() {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;
  const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID;
  const appId = import.meta.env.VITE_FIREBASE_APP_ID;

  const isConfigured = !!(apiKey && projectId && !apiKey.includes("YourFirebaseWebApiKeyHere"));

  return {
    isConfigured,
    config: {
      apiKey: apiKey || "demo-api-key",
      authDomain: authDomain || `${projectId || "demo-app"}.firebaseapp.com`,
      projectId: projectId || "demo-app",
      storageBucket: storageBucket || `${projectId || "demo-app"}.appspot.com`,
      messagingSenderId: messagingSenderId || "1234567890",
      appId: appId || "1:1234567890:web:demoapp",
    },
  };
}

const { isConfigured, config } = getFirebaseConfig();

let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

try {
  if (!getApps().length) {
    app = initializeApp(config);
  } else {
    app = getApp();
  }
  authInstance = getAuth(app);
  dbInstance = getFirestore(app);
} catch (e) {
  console.warn("Firebase initialized in mock/fallback mode:", e);
}

export const auth = authInstance as Auth;
export const db = dbInstance as Firestore;
export const isFirebaseReady = isConfigured;

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

// --- AUTHENTICATION ACTIONS ---

export async function loginWithGoogle(): Promise<User> {
  if (!auth) throw new Error("Firebase Auth is not initialized.");
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function loginWithEmail(email: string, pass: string): Promise<User> {
  if (!auth) throw new Error("Firebase Auth is not initialized.");
  const result = await signInWithEmailAndPassword(auth, email, pass);
  return result.user;
}

export async function signupWithEmail(email: string, pass: string, displayName: string): Promise<User> {
  if (!auth) throw new Error("Firebase Auth is not initialized.");
  const result = await createUserWithEmailAndPassword(auth, email, pass);
  if (displayName && result.user) {
    await updateProfile(result.user, { displayName });
  }
  return result.user;
}

export async function logoutUser(): Promise<void> {
  if (!auth) return;
  await firebaseSignOut(auth);
}

export async function getCurrentUserToken(): Promise<string | null> {
  if (!auth || !auth.currentUser) return null;
  return await auth.currentUser.getIdToken(true);
}

// --- FIRESTORE JOURNAL OPERATIONS (Strictly Isolated by User UID) ---

/**
 * Subscribes to real-time updates for a user's private journal collection:
 * /users/{userId}/journals/{journalId}
 */
export function subscribeToUserJournals(
  userId: string,
  onEntries: (entries: JournalEntry[]) => void,
  onError: (error: Error) => void
): Unsubscribe {
  if (!db || !userId) {
    onEntries([]);
    return () => {};
  }

  const path = `users/${userId}/journals`;
  const journalsQuery = query(collection(db, path), orderBy("createdAt", "desc"));

  return onSnapshot(
    journalsQuery,
    (snapshot) => {
      const items: JournalEntry[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          userId: data.userId || userId,
          title: data.title || "Untitled",
          summary: data.summary || "",
          insights: data.insights || [],
          tags: data.tags || [],
          mood: data.mood || "Reflective",
          messageCount: data.messageCount || 0,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : undefined,
        });
      });
      onEntries(items);
    },
    (err) => {
      try {
        handleFirestoreError(err, OperationType.LIST, path);
      } catch (wrapped) {
        onError(wrapped as Error);
      }
    }
  );
}

/**
 * Creates a private journal entry under /users/{userId}/journals/{journalId}
 * Enforces serverTimestamp() and user identity matching
 */
export async function saveJournalEntry(
  userId: string,
  payload: JournalSummaryPayload,
  messageCount = 0
): Promise<string> {
  if (!db || !userId) {
    throw new Error("Cannot save entry: Database not available or unauthenticated.");
  }

  // Generate safe alphanumeric document ID
  const entryId = `entry_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const path = `users/${userId}/journals`;

  try {
    const docRef = doc(db, path, entryId);
    await setDoc(docRef, {
      userId,
      title: payload.title.slice(0, 150),
      summary: payload.summary.slice(0, 5000),
      insights: (payload.insights || []).slice(0, 20),
      tags: (payload.tags || []).slice(0, 20),
      mood: (payload.mood || "Reflective").slice(0, 50),
      messageCount,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return entryId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${path}/${entryId}`);
  }
}

/**
 * Deletes a private journal entry under /users/{userId}/journals/{journalId}
 */
export async function deleteJournalEntry(userId: string, entryId: string): Promise<void> {
  if (!db || !userId) {
    throw new Error("Cannot delete entry: Database not available or unauthenticated.");
  }

  const path = `users/${userId}/journals/${entryId}`;
  try {
    const docRef = doc(db, "users", userId, "journals", entryId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
