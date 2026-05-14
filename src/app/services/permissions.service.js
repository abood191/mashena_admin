import { api } from "./apiClient";

export const permissionsService = {
  list: ({ skip = 0, limit = 50, search = "" } = {}) =>
    api.get("/api/permissions", { skip, limit, search }),

  create: ({ name }) =>
    api.post("/api/permissions", { name }),

  update: ({ id, name }) =>
    api.patch(`/api/permissions/${id}`, { name }),

  remove: ({ id }) =>
    api.del(`/api/permissions/${id}`),
};
