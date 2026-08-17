/**
 * ============================================================
 *  Auth Service – HttpOnly Cookie-based tokens
 * ============================================================
 *
 *  - Login: tokens are set by server as HttpOnly cookies automatically.
 *    We only save user & role info to localStorage.
 *
 *  - Refresh: send POST with credentials:'include' so browser
 *    automatically sends the refresh_token cookie.
 *
 *  - Logout: call server to clear cookies, then wipe local state.
 * ============================================================
 */

import {
  ROLE_KEY,
  USER_KEY,
  clearSession,
  isAuthed,
  hasStoredSession,
} from "./token";

export { isAuthed, hasStoredSession, clearSession };

// getAccessToken is kept as a no-op for any legacy imports
export function getAccessToken() { return null; }

// In development: requests go to Vite proxy (/api → backend).
// In production: VITE_API_URL must point to the real backend.
const _CONFIGURED_URL = import.meta.env.VITE_API_URL || "";
const getBase = () => _CONFIGURED_URL || window.location.origin;

function extractUser(resp) {
  return resp?.user || resp?.data?.user || null;
}

// ── Login ─────────────────────────────────────────────────────
export async function loginAdmin({ email, password, fcmToken }) {
  const res = await fetch(`${getBase()}/api/auth/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",                     // ← receive HttpOnly cookies
    body: JSON.stringify({ email, password, fcmToken }),
  });

  const data = await res.json();

  if (!res.ok) {
    const message = data?.message || data?.error || `Login failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }

  // Tokens are now in HttpOnly cookies — just save display data
  const user = extractUser(data);
  if (!user) {
    throw new Error("Login succeeded but user data not found in response.");
  }

  localStorage.setItem(ROLE_KEY, "admin");
  localStorage.setItem(USER_KEY, JSON.stringify(user));

  return { user };
}

// ── Refresh Tokens ────────────────────────────────────────────
export async function refreshTokens() {
  // Browser automatically sends the refresh_token HttpOnly cookie
  const res = await fetch(`${getBase()}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",                     // ← send & receive HttpOnly cookies
  });

  if (!res.ok) {
    clearSession();
    throw new Error("Session expired. Please log in again.");
  }

  // New access_token cookie is set automatically by the server response
  // Return a truthy marker so the apiClient knows refresh succeeded
  return { accessToken: true };
}
