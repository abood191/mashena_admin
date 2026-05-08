import { getToken } from "../auth/auth";

const BASE_URL = "http://localhost:3000";

async function request(
  path,
  { method = "GET", body, params, isFormData = false } = {},
) {
  const token = getToken();

  const url = new URL(BASE_URL + path);

  if (params) {
    Object.entries(params).forEach(([k, v]) =>
      url.searchParams.set(k, String(v)),
    );
  }

  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  // ❗ لا تحط Content-Type إذا FormData
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url.toString(), {
    method,
    headers,
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
  });

  const text = await res.text();

  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const message =
      data?.message || data?.error || `Request failed (${res.status})`;

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
