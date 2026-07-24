/**
 * ============================================================
 *  API Client – with Automatic Token Refresh & Race-Condition Guard
 * ============================================================
 *
 *  Flow on 401:
 *  1. If NOT currently refreshing → trigger refresh, hold request in queue
 *  2. If ALREADY refreshing       → add request to queue, wait for new token
 *  3. On refresh SUCCESS          → replay all queued requests with new token
 *  4. On refresh FAILURE          → reject all queued requests, force logout
 *
 *  This guarantees the refresh endpoint is called EXACTLY ONCE
 *  even when multiple parallel requests fail simultaneously.
 * ============================================================
 */

import { getAccessToken, refreshTokens, clearSession } from "../auth/auth";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// ── Refresh State (Race Condition Guard) ──────────────────────
let isRefreshing = false;
let failedQueue = []; // { resolve, reject }[]

function processQueue(error, newToken = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(newToken);
    }
  });
  failedQueue = [];
}

// ── Force Logout (called when refresh token is dead) ──────────
function forceLogout() {
  clearSession();
  // Hard redirect – clears React state entirely and forces re-render to /login
  window.location.href = "/login";
}

// ── Core Request Function ─────────────────────────────────────
async function request(
  path,
  { method = "GET", body, params, isFormData = false } = {},
  { _retry = false } = {},
) {
  const token = getAccessToken();
  console.log("tokendddddddddddddddddd", token)

  const isAbsolute = path.startsWith("http");
  const url = new URL(isAbsolute ? path : BASE_URL + path);

  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") {
        url.searchParams.set(k, String(v));
      }
    });
  }

  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const fetchOptions = {
    method,
    headers,
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
  };

  const res = await fetch(url.toString(), fetchOptions);

  // ── 401 Handler ───────────────────────────────────────────────
  if (res.status === 401 && !_retry) {
    // If a refresh is already in progress, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((newToken) => {
        // Replay with fresh token
        headers["Authorization"] = `Bearer ${newToken}`;
        return fetch(url.toString(), { ...fetchOptions, headers });
      }).then(async (retryRes) => {
        const text = await retryRes.text();
        let data = null;
        try { data = text ? JSON.parse(text) : null; } catch { data = text; }
        if (!retryRes.ok) {
          const message = data?.message || data?.error || `Request failed (${retryRes.status})`;
          const err = new Error(message);
          err.status = retryRes.status;
          err.data = data;
          throw err;
        }
        return data;
      });
    }

    // Start the refresh process
    isRefreshing = true;

    try {
      const { accessToken: newToken } = await refreshTokens();
      isRefreshing = false;
      processQueue(null, newToken); // unblock all waiting requests

      // Replay the original request with the new token
      headers["Authorization"] = `Bearer ${newToken}`;
      const retryRes = await fetch(url.toString(), { ...fetchOptions, headers });

      const text = await retryRes.text();
      let data = null;
      try { data = text ? JSON.parse(text) : null; } catch { data = text; }

      if (!retryRes.ok) {
        const message = data?.message || data?.error || `Request failed (${retryRes.status})`;
        const err = new Error(message);
        err.status = retryRes.status;
        err.data = data;
        throw err;
      }

      return data;
    } catch (refreshError) {
      isRefreshing = false;
      processQueue(refreshError, null); // reject all waiting requests
      forceLogout();
      throw refreshError;
    }
  }

  // ── Normal Response Handling ──────────────────────────────────
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const message =
      data?.message ||
      data?.error ||
      (typeof data === "string" ? data : `Request failed (${res.status})`);

    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

// ── Public API ────────────────────────────────────────────────
export const api = {
  get: (path, params) => request(path, { method: "GET", params }),

  post: (path, body, options = {}) =>
    request(path, { method: "POST", body, ...options }),

  patch: (path, body, options = {}) =>
    request(path, { method: "PATCH", body, ...options }),

  put: (path, body, options = {}) =>
    request(path, { method: "PUT", body, ...options }),

  del: (path) => request(path, { method: "DELETE" }),
};
