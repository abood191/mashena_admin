import React from "react";
import { useRBAC } from "./useRBAC";

/**
 * A wrapper component that conditionally renders its children
 * based on whether the user has the required permissions.
 *
 * @param {string[]} requiredAny - Render if user has AT LEAST ONE of these permissions.
 * @param {string[]} requiredAll - Render if user has ALL of these permissions.
 */
export default function PermissionGuard({
  children,
  requiredAny = [],
  requiredAll = [],
  fallback = null,
}) {
  const { hasAnyPermission, hasAllPermissions, loading } = useRBAC();

  if (loading) return null; // Or a small inline spinner if desired

  let isAllowed = true;

  if (requiredAny.length > 0 && !hasAnyPermission(requiredAny)) {
    isAllowed = false;
  }

  if (requiredAll.length > 0 && !hasAllPermissions(requiredAll)) {
    isAllowed = false;
  }

  if (!isAllowed) {
    return fallback;
  }

  return <>{children}</>;
}
