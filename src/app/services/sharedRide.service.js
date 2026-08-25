import { api } from "./apiClient";

export const sharedRideService = {
  /**
   * Fetch all shared rides with optional filters
   * @param {Object} params - { skip, limit, status, fromDate, toDate, search, driverProfileId }
   */
  getSharedRides: async (params = { skip: 0, limit: 10 }) => {
    const response = await api.get("/api/shared-rides", params);
    return {
      data: response?.data || [],
      count: response?.count || 0,
    };
  },

  /**
   * Fetch live tracking snapshot for a specific shared ride
   * @param {number|string} id - The shared ride ID
   */
  getSharedRideTracking: async (id) => {
    try {
      const response = await api.get(`/api/shared-rides/${id}/tracking`);
      return response; // returns the detailed tracking snapshot
    } catch (error) {
      console.error("Failed to fetch shared ride tracking:", error);
      throw error;
    }
  }
};
