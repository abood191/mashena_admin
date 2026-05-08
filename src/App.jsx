import { Routes, Route, Navigate } from "react-router-dom";


import AppShell from "./app/layouts/AppShell";
import AppRoutes from "./app/routes/AppRoutes";
import LoginPage from "./app/pages/LoginPage";
import { useAuth } from "./app/auth/authContext"; 
export default function App() {
 
const { authed } = useAuth();
  return (
    <Routes>
      <Route
        path="/login"
        element={authed ? <Navigate to="/" replace /> : <LoginPage />}
      />

      <Route
        path="/*"
        element={
          authed ? (
            <AppShell>
              <AppRoutes />
            </AppShell>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}