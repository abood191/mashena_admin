import { api } from "./apiClient";

export const ratingsService = {
  getRatings: ({ skip, limit, search, tripId, score }) => {
    const params = { skip, limit };
    if (search) params.search = search;
    if (tripId) params.tripId = tripId;
    if (score)  params.score  = score;
    return api.get("/api/admin/ratings", params);
  },
};

