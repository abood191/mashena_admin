import { useQuery } from "@tanstack/react-query";
import { tripsService } from "../../services/trips.service";

export const tripsHistoryKeys = {
  all: ["tripsHistory"],
  list: (filters) => ["tripsHistory", "list", filters],
};

export function useTripsHistory(filters) {
  return useQuery({
    queryKey: tripsHistoryKeys.list(filters),
    queryFn: () => tripsService.getTrips(filters),
    staleTime: 1000 * 60, // 1 minute
    refetchOnWindowFocus: false,
    keepPreviousData: true,
  });
}
