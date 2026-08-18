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

  getAccredited: ({ skip, limit, search }) =>
    api.get("/api/user/accredited", { skip, limit, search }),

  createAccredited: (data) =>
    api.post("/api/user/accredited", data, { isFormData: true }),

  getDriverById: (id) => api.get(`/api/user/drivers/${id}`),
  getRiderById: (id) => api.get(`/api/user/riders/${id}`),
  getAdminById: (id) => api.get(`/api/user/admins/${id}`),
  getAccreditedById: (id) => api.get(`/api/user/accredited/${id}`),
};
