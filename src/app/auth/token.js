  /**
 * ============================================================
 *  Token Store – AccessToken in LocalStorage & RefreshToken in Memory
 * ============================================================
 *
 *  - accessToken: Persisted in localStorage so F5 page reloads stay logged in
 *  - refreshToken: Kept strictly in-memory (_refreshToken)
 * ============================================================
 */

export const ACCESS_TOKEN_KEY  = "mashena_access";
export const ROLE_KEY          = "mashena_role";
export const USER_KEY          = "mashena_user";

let _refreshToken = null;

// ── Access Token (Persisted in localStorage) ──────────────────
export function setAccessToken(token) {
  if (token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  }
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function clearAccessToken() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
}

// ── Refresh Token (In-Memory Only) ────────────────────────────
export function setRefreshToken(token) {
  _refreshToken = token || null;
}

export function getRefreshToken() {
  return _refreshToken;
}

export function clearRefreshToken() {
  _refreshToken = null;
}

// ── Auth State ────────────────────────────────────────────────
export function isAuthed() {
  return Boolean(getAccessToken());
}

export function hasStoredSession() {
  return Boolean(getAccessToken());
}

// ── Full Session Wipe ─────────────────────────────────────────
export function clearSession() {
  _refreshToken = null;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(USER_KEY);
}

// ── Legacy Aliases ───────────────────────────────────────────
export const getToken   = getAccessToken;
export const setToken   = setAccessToken;
export const clearToken = clearAccessToken;
export const logout     = clearSession;
