export const TOKEN_KEY = "mashena_token";
export const ROLE_KEY = "mashena_role";
export const USER_KEY = "mashena_user";

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function isAuthed() {
  return Boolean(localStorage.getItem(TOKEN_KEY));
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(USER_KEY);
}
