import { apiFetch } from "./apiClient";

const TOKEN_KEY = "mashena_token";
const ROLE_KEY = "mashena_role";
const USER_KEY = "mashena_user";
   
//


export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}
//




export function isAuthed() {
  return Boolean(localStorage.getItem(TOKEN_KEY));
}



export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(USER_KEY);
}

// إذا شكل response عندك مختلف، عدّل هون فقط
function extractToken(resp) {
  return (
    resp?.accessToken ||
    resp?.token ||
    resp?.data?.accessToken ||
    resp?.data?.token ||
    resp?.access_token ||
    null
  );
}

function extractUser(resp) {
  return resp?.user || resp?.data?.user || null;
}

export async function loginAdmin({ email, password, fcmToken }) {
  const resp = await apiFetch("/api/auth/admin/login", {
    method: "POST",
    body: { email, password, fcmToken },
  });

  const token = extractToken(resp);

  if (!token) {
    console.log("Login response (token not found):", resp);
    throw new Error("Login succeeded but token not found in response.");
  }

  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(ROLE_KEY, "admin");

  const user = extractUser(resp);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));

  return { token, user };
}
