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

import { useRemoveFCMToken } from "../hooks/api/useNotifications";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [authed, setAuthed] = useState(() => hasStoredSession());

  // ── login – called after successful loginAdmin() ──────────
  const login = useCallback(({ accessToken, refreshToken }) => {
    setAccessToken(accessToken);
    if (refreshToken) setRefreshToken(refreshToken);
    setAuthed(true);
  }, []);

  const removeMutation = useRemoveFCMToken();

  // ── logout – explicit user action ─────────────────────────
  const logout = useCallback(async () => {
    try {
      const deviceId = localStorage.getItem("mashena_device_id");
      if (deviceId) {
        await removeMutation.mutateAsync({ deviceId });
      }
    } catch (err) {
      console.warn("Failed to unregister FCM token", err);
    }
    clearSession();
    setAuthed(false);
  }, [removeMutation]);

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
