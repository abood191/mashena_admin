import { api } from "./apiClient";

export const ratingTagsService = {
  getAll: ({ skip, limit, targetType, sentiment, isActive }) => {
    const params = { skip, limit };
    if (targetType) params.targetType = targetType;
    if (sentiment) params.sentiment = sentiment;
    if (isActive !== "" && isActive !== undefined) params.isActive = isActive;
    params.includeDeleted = false;
    return api.get("/api/admin/rating-tags", params);
  },

  getById: (id) => api.get(`/api/admin/rating-tags/${id}`),

  create: (body) => api.post("/api/admin/rating-tags", body),

  update: (id, body) => api.patch(`/api/admin/rating-tags/${id}`, body),

  remove: (id) => api.del(`/api/admin/rating-tags/${id}`),

  toggleActive: (id) => api.patch(`/api/admin/rating-tags/${id}/toggle-active`),
};
