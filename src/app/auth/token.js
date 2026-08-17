/**
 * ============================================================
 *  Token Store – HttpOnly Cookies (managed by browser/server)
 * ============================================================
 *
 *  - accessToken & refreshToken: Stored in HttpOnly cookies by the server.
 *    The browser sends them automatically with every request.
 *    The frontend NEVER reads or writes these tokens directly.
 *
 *  - Session state is determined by the presence of user data in localStorage.
 *  - Role and user info are still stored in localStorage for display purposes.
 * ============================================================
 */

export const ROLE_KEY = "mashena_role";
export const USER_KEY = "mashena_user";

// ── Session State (based on stored user, not token) ───────────
export function isAuthed() {
  return Boolean(localStorage.getItem(USER_KEY));
}

export function hasStoredSession() {
  return Boolean(localStorage.getItem(USER_KEY));
}

// ── Full Session Wipe ─────────────────────────────────────────
export function clearSession() {
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(USER_KEY);
}

// ── Legacy / Compat stubs (no-ops — tokens are in HttpOnly cookies) ─
export function setAccessToken()  { /* managed by server cookies */ }
export function getAccessToken()  { return null; }
export function clearAccessToken(){ /* managed by server cookies */ }
export function setRefreshToken() { /* managed by server cookies */ }
export function getRefreshToken() { return null; }
export function clearRefreshToken(){ /* managed by server cookies */ }

export const getToken   = getAccessToken;
export const setToken   = setAccessToken;
export const clearToken = clearAccessToken;
export const logout     = clearSession;

// ── Access Token key kept for compat imports (unused now) ─────
export const ACCESS_TOKEN_KEY = "mashena_access";
