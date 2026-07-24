import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { ratingsService } from "../../services/ratings.service";

export const ratingKeys = {
  all: ["ratings"],
  list: (filters) => [...ratingKeys.all, { filters }],
};

export const useRatings = (filters = {}, options = {}) => {
  return useQuery({
    queryKey: ratingKeys.list(filters),
    queryFn: () => ratingsService.getRatings(filters),
    placeholderData: keepPreviousData,
    ...options,
  });
};
