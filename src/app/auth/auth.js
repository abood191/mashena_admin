/**
 * ============================================================
 *  Auth Service
 * ============================================================
 */

import {
  ROLE_KEY,
  USER_KEY,
  setAccessToken,
  getAccessToken,
  setRefreshToken,
  getRefreshToken,
  clearSession,
  isAuthed,
  hasStoredSession,
} from "./token";

export { isAuthed, hasStoredSession, clearSession, getAccessToken };


const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// ── Token Extractors ──────────────────────────────────────────
function extractAccessToken(resp) {
  return (
    resp?.accessToken  ||
    resp?.token        ||
    resp?.data?.accessToken ||
    resp?.data?.token  ||
    resp?.access_token ||
    null
  );
}

function extractRefreshToken(resp) {
  return (
    resp?.refreshToken      ||
    resp?.data?.refreshToken ||
    resp?.refresh_token     ||
    null
  );
}

function extractUser(resp) {
  return resp?.user || resp?.data?.user || null;
}

// ── Login ─────────────────────────────────────────────────────
export async function loginAdmin({ email, password, fcmToken }) {
  const res = await fetch(`${BASE_URL}/api/auth/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, fcmToken }),
  });

  const data = await res.json();

  if (!res.ok) {
    const message = data?.message || data?.error || `Login failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }

  const accessToken  = extractAccessToken(data);
  const refreshToken = extractRefreshToken(data);

  if (!accessToken) {
    console.error("Login response:", data);
    throw new Error("Login succeeded but access token not found in response.");
  }

  // accessToken → memory only
  setAccessToken(accessToken);

  // refreshToken → localStorage (persists page reloads)
  if (refreshToken) setRefreshToken(refreshToken);

  // Non-sensitive display data → localStorage
  localStorage.setItem(ROLE_KEY, "admin");
  const user = extractUser(data);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));

  return { accessToken, refreshToken, user };
}

// ── Silent Refresh ────────────────────────────────────────────
/**
 * Exchanges the stored refreshToken for a fresh accessToken.
 * Called:
 *   1. On app start (AuthProvider) if a refresh token exists in localStorage
 *   2. Automatically by apiClient on every 401
 *
 * Uses raw fetch (not apiClient) to avoid infinite 401 loops.
 * On failure → clears session and throws (caller handles redirect).
 */
export async function refreshTokens() {
  const currentRefresh = getRefreshToken();

  if (!currentRefresh) {
    clearSession();
    throw new Error("No refresh token available. Please log in.");
  }

  const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: currentRefresh }),
  });

  if (!res.ok) {
    
    // Refresh token expired or revoked → full wipe
    clearSession();
    throw new Error("Session expired. Please log in again.");
  }
 console.log("res + token refresheffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffd", res)
  const data = await res.json();

  const newAccess  = extractAccessToken(data);
  const newRefresh = extractRefreshToken(data);

  if (!newAccess) {
    clearSession();
    throw new Error("Refresh response missing access token.");
  }

  // Rotate both tokens
  setAccessToken(newAccess);
  if (newRefresh) setRefreshToken(newRefresh);

  return { accessToken: newAccess, refreshToken: newRefresh };
}
