import { api } from "./apiClient";

export const passengerPoolService = {
  /**
   * Fetch all passenger pools with optional filters
   * @param {Object} params - { skip, limit, status, fromDate, toDate, search }
   */
  getPassengerPools: async (params = { skip: 0, limit: 10 }) => {
    const response = await api.get("/api/passenger-pools", params);
    return {
      data: response?.data || [],
      count: response?.count || 0,
    };
  },

  /**
   * Fetch live tracking snapshot for a specific passenger pool
   * @param {number|string} id - The passenger pool ID
   */
  getPassengerPoolTracking: async (id) => {
    try {
      const response = await api.get(`/api/passenger-pools/${id}/tracking`);
      return response; // returns the detailed tracking snapshot
    } catch (error) {
      console.error("Failed to fetch passenger pool tracking:", error);
      throw error;
    }
  }
};
