import {
  createContext,
  useContext,
  useState,
  useCallback,
} from "react";
import {
  clearSession,
  hasStoredSession,
} from "./token";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [authed, setAuthed] = useState(() => hasStoredSession());

  // ── login – called after successful loginAdmin() ──────────
  // Tokens are already in HttpOnly cookies set by the server.
  // We just flip the authed flag here.
  const login = useCallback(() => {
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
