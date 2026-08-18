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

export const REFRESH_TOKEN_KEY = "mashena_refresh";

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

// ── Refresh Token (Persisted in localStorage) ──────────────────
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
export function isAuthed() {
  return Boolean(getAccessToken());
}

export function hasStoredSession() {
  return Boolean(getAccessToken());
}

// ── Full Session Wipe ─────────────────────────────────────────
export function clearSession() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(USER_KEY);
}

// ── Legacy Aliases ───────────────────────────────────────────
export const getToken   = getAccessToken;
export const setToken   = setAccessToken;
export const clearToken = clearAccessToken;
export const logout     = clearSession;
