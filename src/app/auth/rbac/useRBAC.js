import { useContext } from "react";
import RBACContext from "./RBACContext";

export function useRBAC() {
  const context = useContext(RBACContext);

  if (!context) {
    throw new Error("useRBAC must be used within an RBACProvider");
  }

  const { permissions, loading, userRole, userRoleName } = context;

  // Enhance Super Admin detection using ROLE_KEY or activeRole
  const storedRoleKey = localStorage.getItem("role") || localStorage.getItem("ROLE");
  const isSuperAdmin = userRoleName === "ADMIN" || userRole === 1 || userRole === 4 || storedRoleKey === "admin" || storedRoleKey === "ADMIN";

  /**
   * Check if user has a specific permission
   */
  const hasPermission = (permission) => {
    if (isSuperAdmin) return true;
    return permissions.includes(permission);
  };

  /**
   * Check if user has AT LEAST ONE of the required permissions
   */
  const hasAnyPermission = (requiredPermissions = []) => {
    if (isSuperAdmin) return true;
    if (requiredPermissions.length === 0) return true;
    return requiredPermissions.some((perm) => permissions.includes(perm));
  };

  /**
   * Check if user has ALL of the required permissions
   */
  const hasAllPermissions = (requiredPermissions = []) => {
    if (isSuperAdmin) return true;
    if (requiredPermissions.length === 0) return true;
    return requiredPermissions.every((perm) => permissions.includes(perm));
  };

  return {
    permissions,
    loading,
    userRole,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };
}
