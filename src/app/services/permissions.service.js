import { api } from "./apiClient";

export const permissionsService = {
  list: ({ skip = 0, limit = 50 }) =>
    api.get("/api/permissions", { skip, limit }),

  create: ({ name }) =>
    api.post("/api/permissions", { name }),

  update: ({ id, name }) =>
    api.patch(`/api/permissions/${id}`, { name }),

  remove: ({ id }) =>
    api.del(`/api/permissions/${id}`),
};
