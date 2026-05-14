import { api } from "../services/apiClient";
import {
  TOKEN_KEY,
  ROLE_KEY,
  USER_KEY,
  setToken,
  getToken,
  clearToken,
  isAuthed,
  logout,
} from "./token";

export { setToken, getToken, clearToken, isAuthed, logout };

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
  const resp = await api.post("/api/auth/admin/login", { email, password, fcmToken });

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
