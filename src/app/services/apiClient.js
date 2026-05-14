import { getToken } from "../auth/token";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

async function request(
  path,
  { method = "GET", body, params, isFormData = false } = {},
) {
  const token = getToken();

  // Handle absolute URLs (if path is already a full URL)
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

  // Do not set Content-Type for FormData; fetch sets it automatically with the correct boundary
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const fetchOptions = {
    method,
    headers,
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
  };

  const res = await fetch(url.toString(), fetchOptions);

  const text = await res.text();

  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    // Standardize error structure for the frontend
    const message =
      data?.message || data?.error || (typeof data === "string" ? data : `Request failed (${res.status})`);

    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

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
