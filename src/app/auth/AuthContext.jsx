import { createContext, useContext, useState } from "react";
import { getToken, setToken, clearToken } from "./auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [authed, setAuthed] = useState(() => !!getToken());

  const login = (token) => {
    setToken(token);
    setAuthed(true); // 🔥 هذا هو المفتاح
  };

  const logout = () => {
    clearToken();
    setAuthed(false);
  };

  return (
    <AuthContext.Provider value={{ authed, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
