/**
 * ============================================================
 *  Secure Token Store – Best Practice Hybrid Model
 * ============================================================
 *
 *  ┌──────────────┬─────────────────┬───────────────────────┐
 *  │  Token       │  Storage        │  Reason               │
 *  ├──────────────┼─────────────────┼───────────────────────┤
 *  │ accessToken  │ In-Memory only  │ Never touches disk,   │
 *  │  (15 min)    │                 │ max XSS protection    │
 *  ├──────────────┼─────────────────┼───────────────────────┤
 *  │ refreshToken │ localStorage    │ Persists across page  │
 *  │  (1 month)   │                 │ reloads; rotated on   │
 *  │              │                 │ every use (accepted   │
 *  │              │                 │ SPA tradeoff without  │
 *  │              │                 │ httpOnly cookies)     │
 *  ├──────────────┼─────────────────┼───────────────────────┤
 *  │ user / role  │ localStorage    │ UI display only,      │
 *  │              │                 │ non-sensitive         │
 *  └──────────────┴─────────────────┴───────────────────────┘
 *
 *  On page reload:
 *   1. AuthProvider reads refreshToken from localStorage
 *   2. Calls /api/auth/refresh → gets fresh accessToken (memory)
 *      + rotated refreshToken (localStorage)
 *   3. User stays logged in seamlessly
 *   4. If refresh fails → clearSession() → redirect /login
 * ============================================================
 */

// ── Storage Keys ──────────────────────────────────────────────
export const REFRESH_TOKEN_KEY = "mashena_refresh";
export const ROLE_KEY          = "mashena_role";
export const USER_KEY          = "mashena_user";

// ── In-Memory Access Token ────────────────────────────────────
let _accessToken = null;

export function setAccessToken(token) {
  _accessToken = token;
}

export function getAccessToken() {
  return _accessToken;
}

export function clearAccessToken() {
  _accessToken = null;
}

// ── Persisted Refresh Token ───────────────────────────────────
export function setRefreshToken(token) {
  if (token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  }
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function clearRefreshToken() {
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

// ── Auth State ────────────────────────────────────────────────
/** True only when accessToken is live in memory */
export function isAuthed() {
  return Boolean(_accessToken);
}

/** True when a refresh token exists in localStorage (session can be restored) */
export function hasStoredSession() {
  return Boolean(localStorage.getItem(REFRESH_TOKEN_KEY));
}

// ── Full Session Wipe ─────────────────────────────────────────
/** Called on logout OR when refresh token is expired/invalid */
export function clearSession() {
  _accessToken = null;
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(USER_KEY);
}

// ── Legacy aliases (backward compat) ─────────────────────────
/** @deprecated use getAccessToken */
export const getToken    = getAccessToken;
/** @deprecated use setAccessToken */
export const setToken    = setAccessToken;
/** @deprecated use clearAccessToken */
export const clearToken  = clearAccessToken;
/** @deprecated use clearSession */
export const logout      = clearSession;
