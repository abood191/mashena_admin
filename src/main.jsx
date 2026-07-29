import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./App.css";
import { AuthProvider } from "./app/auth/AuthContext";
import { RBACProvider } from "./app/auth/rbac/RBACContext";
import { ThemeProvider } from "./app/context/ThemeContext";
import "./app/i18n/i18n";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes cache
    },
  },
});
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RBACProvider>
          <ThemeProvider>
            <BrowserRouter>
              <App />
              <Toaster theme="dark" position="top-center" richColors />
            </BrowserRouter>
          </ThemeProvider>
        </RBACProvider>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
