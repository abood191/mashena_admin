import { api } from "./apiClient";

export const notificationService = {
  // FCM Token management
  registerToken: (payload) => api.post("/api/notifications/token", payload),
  removeToken: (payload) => api.del("/api/notifications/token", payload),

  // Notifications management
  getNotifications: ({ skip = 0, limit = 20 } = {}) => api.get("/api/notifications", { skip, limit }),
  markAsRead: (id) => api.patch(`/api/notifications/${id}/read`),
  markAllAsRead: () => api.patch("/api/notifications/read-all"),
  sendAdminNotification: (payload) => api.post("/api/notifications/admin/send", payload)
};
