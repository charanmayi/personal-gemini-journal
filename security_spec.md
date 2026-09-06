# Security Specification: Personal Gemini Journal

## 1. Core Data Invariants & Zero-Trust Architecture
1. **Per-User Isolation**: No user can read, list, create, update, or delete documents outside of their personal path `/users/{userId}/...` where `request.auth.uid == userId`.
2. **Authenticated Access**: All operations require a valid, non-null Firebase Authentication token (`request.auth != null`). Unauthenticated access is rejected by default.
3. **Identity Binding**: In every document write (`create` and `update`), the document's internal `userId` must strictly equal `request.auth.uid`.
4. **Size & Input Boundaries**: 
   - `title`: max 150 characters.
   - `summary`: max 5,000 characters.
   - `mood`: max 50 characters.
   - `tags` / `insights`: lists capped at 20 items each to prevent Denial-of-Wallet attacks.
5. **Timestamp Integrity**: Document `createdAt` must match `request.time` during creation and remains immutable on update.
6. **Backend Token Verification**: Every Express backend route (`/api/chat`, `/api/summarize`) verifies the Firebase Auth ID Token using the Firebase Admin SDK (`admin.auth().verifyIdToken()`) and rejects unauthenticated callers with HTTP 401.

## 2. The "Dirty Dozen" Threat Scenarios
1. **Cross-Tenant Read**: User B sends `get(/users/UserA/journals/entry123)` -> **DENIED** (`request.auth.uid != userId`).
2. **Cross-Tenant List Scraping**: User B queries `collectionGroup('journals')` or queries `/users/UserA/journals` -> **DENIED**.
3. **Cross-Tenant Write**: User B attempts to write a document into `/users/UserA/journals/injectedDoc` -> **DENIED**.
4. **UID Spoofing**: User A writes to `/users/UserA/journals/entry1` but sets `userId: "UserB"` in document payload -> **DENIED** (`data.userId != request.auth.uid`).
5. **Denial-of-Wallet Payload Flooding**: Attacker attempts to post a 2MB string into `title` or `summary` -> **DENIED** (size constraints).
6. **Array Flooding Attack**: Attacker posts an array of 5,000 tags -> **DENIED** (`data.tags.size() <= 20`).
7. **Path ID Poisoning**: Attacker injects malformed path characters (`{journalId}` containing non-alphanumeric or > 128 chars) -> **DENIED** (`isValidId()`).
8. **Shadow Field Injection**: Attacker injects unexpected system fields like `isAdmin: true` -> **DENIED** (strict key checking).
9. **Timestamp Backdating**: Attacker sends a forged timestamp from 2020 -> **DENIED** (`incoming().createdAt == request.time`).
10. **Immutable Field Tampering**: User attempts to update `userId` or `createdAt` of an existing journal -> **DENIED**.
11. **Unauthenticated API Access**: Attacker invokes `/api/chat` without an `Authorization: Bearer <token>` header -> **401 Unauthorized**.
12. **Expired / Forged JWT**: Attacker invokes backend API with a manipulated token signature -> **401 Unauthorized**.
