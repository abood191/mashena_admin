import { api } from "./apiClient";

export const ratingsService = {
  getRatings: ({ skip, limit, userId, tripId, score }) => {
    // Only pass defined filters to avoid sending empty params like score=""
    const params = { skip, limit };
    if (userId) params.userId = userId;
    if (tripId) params.tripId = tripId;
    if (score) params.score = score;
    
    return api.get("/api/admin/ratings", params);
  }
};
