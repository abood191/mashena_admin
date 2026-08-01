import { api } from "./apiClient";

export const couponsService = {
  /**
   * Get all coupons with optional filters.
   * @param {{ skip?, limit?, status?, type?, isActive? }} params
   */
  getCoupons: ({ skip, limit, status, type, isActive } = {}) => {
    const params = {};
    if (skip !== undefined) params.skip = skip;
    if (limit !== undefined) params.limit = limit;
    if (status) params.status = status;
    if (type) params.type = type;
    if (isActive !== undefined && isActive !== "") params.isActive = isActive;
    return api.get("/api/coupons", params);
  },

  /** Get a single coupon by ID. */
  getCouponById: (id) => api.get(`/api/coupons/${id}`),

  /** Create a new coupon. */
  createCoupon: (data) => api.post("/api/coupons", data),

  /** Update a coupon by ID. */
  updateCoupon: (id, data) => api.patch(`/api/coupons/${id}`, data),

  /** Soft-delete a coupon by ID. */
  deleteCoupon: (id) => api.del(`/api/coupons/${id}`),

  /** Get the global usage history across all coupons. */
  getGlobalHistory: ({ skip, limit } = {}) =>
    api.get("/api/coupons/history/all", { skip, limit }),

  /** Get usage history for a specific coupon. */
  getCouponHistory: (id, { skip, limit } = {}) =>
    api.get(`/api/coupons/${id}/history`, { skip, limit }),

  /** Get coupons owned by a specific user. */
  getUserCoupons: (userId, { skip, limit } = {}) =>
    api.get(`/api/coupons/users/${userId}`, { skip, limit }),
};
