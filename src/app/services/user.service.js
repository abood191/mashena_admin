import { api } from "./apiClient";

export const userService = {
  getDrivers: ({ skip, limit, search }) =>
    api.get("/api/user/drivers", { skip, limit, search }),

  getRiders: ({ skip, limit, search }) =>
    api.get("/api/user/riders", { skip, limit, search }),

  getAdmins: ({ skip, limit, search }) =>
    api.get("/api/user/admins", { skip, limit, search }),

  createEmployee: (data) =>
    api.post("/api/user/employees", data),

  getDriverById: (id) => api.get(`/api/user/drivers/${id}`),
  getRiderById: (id) => api.get(`/api/user/riders/${id}`),
  getAdminById: (id) => api.get(`/api/user/admins/${id}`),
};
