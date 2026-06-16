import { useQuery } from "@tanstack/react-query";
import { tripsService } from "../../services/trips.service";

export const tripKeys = {
  all: ["trips"],
  active: () => ["trips", "active"],
  detail: (tripId) => ["trips", "detail", tripId],
};

export function useActiveTrips() {
  return useQuery({
    queryKey: tripKeys.active(),
    queryFn: tripsService.getActiveTrips,
    staleTime: 1000 * 60 * 5, // keep query data fresh; will be updated reactively via WebSockets
    refetchOnWindowFocus: false,
  });
}

export function useTrip(tripId) {
  return useQuery({
    queryKey: tripKeys.detail(tripId),
    queryFn: () => tripsService.getTripById(tripId),
    enabled: Boolean(tripId),
    staleTime: 1000 * 60,
    refetchOnWindowFocus: false,
  });
}
