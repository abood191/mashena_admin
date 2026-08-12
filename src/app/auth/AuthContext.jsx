import {
  createContext,
  useContext,
  useState,
  useCallback,
} from "react";
import {
  setAccessToken,
  setRefreshToken,
  clearSession,
  hasStoredSession,
} from "./token";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [authed, setAuthed] = useState(() => hasStoredSession());

  // ── login – called after successful loginAdmin() ──────────
  const login = useCallback(({ accessToken, refreshToken }) => {
    setAccessToken(accessToken);
    if (refreshToken) setRefreshToken(refreshToken);
    setAuthed(true);
  }, []);

  // ── logout – explicit user action ─────────────────────────
  const logout = useCallback(() => {
    clearSession();
    setAuthed(false);
  }, []);

  return (
    <AuthContext.Provider value={{ authed, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
