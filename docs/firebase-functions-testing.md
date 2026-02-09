# Testing Firebase Callable Functions (Postman / curl)

Your app uses **Firebase Callable Functions**. You can test them with Postman, Insomnia, or curl.

## Base URL

- **Project:** `auth-bf4f5`
- **Region:** `europe-west1` (see `packages/auth/src/firebase.ts`)

**Production:**
```
https://europe-west1-auth-bf4f5.cloudfunctions.net/<functionName>
```

**Emulator (when running `firebase emulators:start --only functions`):**
```
http://127.0.0.1:5001/auth-bf4f5/europe-west1/<functionName>
```

---

## Callable protocol

1. **Method:** `POST`
2. **Headers:**
   - `Content-Type: application/json`
   - For **authenticated** functions: `Authorization: Bearer <firebaseIdToken>`
3. **Body:** JSON with a `data` key (required by Callable):

   ```json
   { "data": { ... your payload ... } }
   ```

   The backend receives whatever you put inside `data`.

---

## 1. Postman

1. **Import the collection** (optional):  
   Import `docs/postman/Firebase-Callables.postman_collection.json` in Postman (File → Import).

2. **Set variables** in the collection (or per request):
   - `baseUrl`: `https://europe-west1-auth-bf4f5.cloudfunctions.net`
   - `idToken`: your Firebase ID token (for auth-required functions; see “Getting an ID token” below).

3. **Send a request:**  
   Each request uses `{{baseUrl}}/<functionName>` and sends `{ "data": <payload> }` in the body.

4. **Auth-required functions:**  
   In the request’s **Authorization** tab, set **Bearer Token** to `{{idToken}}`, or put the token in the **Headers** as `Authorization: Bearer <token>`.

---

## 2. curl examples

Replace `YOUR_ID_TOKEN` with a real token for functions that require auth.

**searchLocations** (no auth):
```bash
curl -X POST "https://europe-west1-auth-bf4f5.cloudfunctions.net/searchLocations" \
  -H "Content-Type: application/json" \
  -d '{"data":{"query":"Dakar","limit":5}}'
```

**suggestLocation** (no auth):
```bash
curl -X POST "https://europe-west1-auth-bf4f5.cloudfunctions.net/suggestLocation" \
  -H "Content-Type: application/json" \
  -d '{"data":{"query":"Dak","limit":5}}'
```

**retrieveLocation** (no auth):
```bash
curl -X POST "https://europe-west1-auth-bf4f5.cloudfunctions.net/retrieveLocation" \
  -H "Content-Type: application/json" \
  -d '{"data":{"mapboxId":"dXJuOi8...","sessionToken":"your-session-token"}}'
```

**getLocationHistory** (auth required):
```bash
curl -X POST "https://europe-west1-auth-bf4f5.cloudfunctions.net/getLocationHistory" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ID_TOKEN" \
  -d '{"data":{"limit":10}}'
```

**getRideHistory** (auth required):
```bash
curl -X POST "https://europe-west1-auth-bf4f5.cloudfunctions.net/getRideHistory" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ID_TOKEN" \
  -d '{"data":{"limit":20}}'
```

**saveLocationToHistory** (auth required):
```bash
curl -X POST "https://europe-west1-auth-bf4f5.cloudfunctions.net/saveLocationToHistory" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ID_TOKEN" \
  -d '{"data":{"address":"Dakar, Senegal","latitude":14.7167,"longitude":-17.4677}}'
```

---

## 3. Getting a Firebase ID token

For callables that require auth (e.g. `getRideHistory`, `getLocationHistory`, `saveLocationToHistory`), the backend expects `Authorization: Bearer <idToken>`.

**Option A – From your app (easiest)**  
After the user signs in, get the token and log it (or send it to yourself):

```ts
import { getAuth } from 'firebase/auth';

const token = await getAuth().currentUser?.getIdToken();
console.log(token); // Copy this into Postman as Bearer token
```

**Option B – Firebase Auth REST API**  
Sign in with email/password via the REST API and use the returned `idToken` in the `Authorization` header.  
Docs: [Firebase Auth REST API](https://firebase.google.com/docs/reference/rest/auth).

**Option C – Emulator**  
If you use the Auth emulator, you can create a test user and get a token the same way (e.g. from a small script or the app pointed at the emulator).

---

## 4. Using the Firebase Emulator

If your backend is in another repo with Firebase Functions:

1. In that repo: `firebase emulators:start --only functions`
2. Call the emulator base URL instead of production:

   ```
   http://127.0.0.1:5001/auth-bf4f5/europe-west1/<functionName>
   ```

3. In Postman, set `baseUrl` to  
   `http://127.0.0.1:5001/auth-bf4f5/europe-west1`  
   and keep the same `data` payloads and (if needed) `Authorization: Bearer <token>`.

---

## Quick reference – your callables

| Function                 | Auth  | Payload (inside `data`)                          |
|-------------------------|-------|--------------------------------------------------|
| `searchLocations`       | No    | `{ query, proximity?, limit? }`                  |
| `suggestLocation`       | No    | `{ query, sessionToken?, proximity?, limit? }`  |
| `retrieveLocation`      | No    | `{ mapboxId, sessionToken }`                    |
| `getLocationHistory`    | Yes   | `{ limit? }`                                    |
| `saveLocationToHistory` | Yes   | `Location` (address, latitude, longitude, …)   |
| `getRideHistory`        | Yes   | `{ limit? }`                                    |

Response shape from callables is typically:

```json
{ "result": { "success": true, "data": { ... } } }
```

or on error:

```json
{ "error": { "message": "...", "code": "..." } }
```

Use this doc with the Postman collection or curl to test all functions like “Postman-style” without running the app.
