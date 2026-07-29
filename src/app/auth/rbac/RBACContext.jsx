import React, { createContext, useState, useEffect } from "react";
import { useAuth } from "../AuthContext";
import { rolesService } from "../../services/roles.service";
import { USER_KEY } from "../token";

const RBACContext = createContext(null);

export function RBACProvider({ children }) {
  const { authed } = useAuth();
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [userRoleName, setUserRoleName] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadPermissions() {
      if (!authed) {
        setPermissions([]);
        setUserRole(null);
        setUserRoleName(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const storedUser = localStorage.getItem(USER_KEY);
        if (storedUser) {
          const user = JSON.parse(storedUser);
          
          let roleIdToFetch = user.roleId || null;
          let roleNameToUse = null;

          if (user.roles && user.activeRole) {
            const activeRoleObj = user.roles.find(r => r.name === user.activeRole);
            if (activeRoleObj) {
              roleIdToFetch = activeRoleObj.id;
              roleNameToUse = activeRoleObj.name;
            }
          }

          setUserRole(roleIdToFetch);
          setUserRoleName(roleNameToUse);
          
          if (roleIdToFetch) {
            // Fetch permissions for the specific role
            const res = await rolesService.getRolePermissions({ roleId: roleIdToFetch });
            const perms = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
            const permNames = perms.map(p => typeof p === 'string' ? p : p.name);
            
            if (isMounted) {
              setPermissions(permNames);
            }
          }
        }
      } catch (error) {
        console.error("Failed to load permissions:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadPermissions();

    return () => {
      isMounted = false;
    };
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  , [authed]);

  return (
    <RBACContext.Provider value={{ permissions, loading, userRole, userRoleName }}>
      {children}
    </RBACContext.Provider>
  );
}

export default RBACContext;
