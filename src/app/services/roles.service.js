import { api } from "./apiClient";

export const rolesService = {
  list: ({ skip = 0, limit = 10 }) =>
    api.get("/api/roles", { skip, limit }),

  create: ({ name }) =>
    api.post("/api/roles", { name }),

  update: ({ id, name }) =>
    api.patch(`/api/roles/${id}`, { name }),

  remove: ({ id }) =>
    api.del(`/api/roles/${id}`),

  getRolePermissions: ({ roleId }) =>
    api.get(`/api/roles/${roleId}/permissions`),

  setRolePermissions: ({ roleId, permissionIds }) =>
    api.put(`/api/roles/${roleId}/permissions`, { permissionIds }),
};
