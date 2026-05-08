const BASE_URL = import.meta.env.VITE_API_URL;

export async function apiFetch(path, { method = "GET", body, headers } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(headers || {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const error =
      data?.error || data?.error || (typeof data === "string" ? data : `Request failed (${res.status})`);
    const err = new Error(error);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}
