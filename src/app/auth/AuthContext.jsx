/**
 * ============================================================
 *  Auth Context
 * ============================================================
 *
 *  Lifecycle on every page load:
 *
 *   ┌─────────────────────────────────────────────────────────┐
 *   │  App loads → initializing = true                        │
 *   │                                                         │
 *   │  hasStoredSession()?                                    │
 *   │  ├── YES → call refreshTokens()                         │
 *   │  │         ├── success → authed=true, initializing=false│
 *   │  │         └── fail    → authed=false,initializing=false│
 *   │  │                       (refresh expired → /login)     │
 *   │  └── NO  → authed=false, initializing=false             │
 *   │                          (no session → /login)          │
 *   └─────────────────────────────────────────────────────────┘
 *
 *  While initializing=true, the app renders a full-screen
 *  spinner so the user never sees a flash to /login.
 * ============================================================
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  setAccessToken,
  setRefreshToken,
  clearSession,
  hasStoredSession,
} from "./token";
import { refreshTokens } from "./auth";

const AuthContext = createContext(null);

// ── Full-screen initializing spinner ─────────────────────────
function AppLoadingScreen() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#080f1e",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          border: "3px solid rgba(72,128,255,0.2)",
          borderTop: "3px solid #4880FF",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Provider ──────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [authed, setAuthed]           = useState(false);
  const [initializing, setInitializing] = useState(true);

  // ── On mount: attempt silent refresh if a session exists ──
  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      if (!hasStoredSession()) {
        // No refresh token stored → go straight to login
        setInitializing(false);
        return;
      }

      try {
        // Exchange stored refresh token for a fresh access token
        await refreshTokens();
        if (!cancelled) setAuthed(true);
      } catch {
        // Refresh token expired or invalid → wipe & show login
        if (!cancelled) setAuthed(false);
      } finally {
        if (!cancelled) setInitializing(false);
      }
    }

    restoreSession();
    return () => { cancelled = true; };
  }, []); // runs once on mount

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

  // Block rendering until we know the auth state
  if (initializing) return <AppLoadingScreen />;

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
