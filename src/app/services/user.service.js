import { apiFetch } from "../auth/apiClient"; 

export const userService = {
  getDrivers: ({ skip, limit, search }) =>
    apiFetch(`/api/user/drivers?skip=${skip}&limit=${limit}&search=${search || ""}`),

  getRiders: ({ skip, limit, search }) =>
    apiFetch(`/api/user/riders?skip=${skip}&limit=${limit}&search=${search || ""}`),

  getAdmins: ({ skip, limit, search }) =>
    apiFetch(`/api/user/admins?skip=${skip}&limit=${limit}&search=${search || ""}`),
};
