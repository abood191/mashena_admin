import { api } from "./apiClient";

export const driverRequestsService = {
  getAll: ({ skip = 0, limit = 10, search = "", status = "" } = {}) =>
    api.get("/api/driver-approval-requests", { skip, limit, search, status }),

  getById: (id) => api.get(`/api/driver-approval-requests/${id}`),

  approve: (id, body) =>
    api.patch(`/api/driver-approval-requests/${id}/approve`, body),

  reject: (id, body) =>
    api.patch (`/api/driver-approval-requests/${id}/reject`, body),
};
