import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useRBAC } from "./useRBAC";

/**
 * A Route wrapper that checks if the user has the required permissions
 * before rendering the route. Otherwise, it redirects to /403 (or dashboard).
 */
export default function ProtectedRoute({
  children,
  requiredAny = [],
  requiredAll = [],
}) {
  const { hasAnyPermission, hasAllPermissions, loading } = useRBAC();
  const location = useLocation();

  if (loading) {
    // Show a full screen loader while checking permissions
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center p-12 bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-[#4880FF]"></div>
        <span className="mt-4 text-sm text-white/50 tracking-widest uppercase">Checking Permissions...</span>
      </div>
    );
  }

  let isAllowed = true;

  if (requiredAny.length > 0 && !hasAnyPermission(requiredAny)) {
    isAllowed = false;
  }

  if (requiredAll.length > 0 && !hasAllPermissions(requiredAll)) {
    isAllowed = false;
  }

  if (!isAllowed) {
    // Redirect them to the unauthorized page or dashboard
    return <Navigate to="/403" state={{ from: location }} replace />;
  }

  return children;
}
