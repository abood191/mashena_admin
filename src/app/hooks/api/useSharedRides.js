import { useQuery } from "@tanstack/react-query";
import { sharedRideService } from "../../services/sharedRide.service";

export const sharedRidesKeys = {
  all: ["sharedRides"],
  list: (filters) => ["sharedRides", "list", filters],
  tracking: (id) => ["sharedRides", "tracking", String(id)],
};

export function useSharedRides(filters) {
  return useQuery({
    queryKey: sharedRidesKeys.list(filters),
    queryFn: () => sharedRideService.getSharedRides(filters),
    staleTime: 1000 * 60, // 1 minute
    refetchOnWindowFocus: false,
    keepPreviousData: true,
  });
}

export function useSharedRideTracking(id) {
  return useQuery({
    queryKey: sharedRidesKeys.tracking(id),
    queryFn: () => sharedRideService.getSharedRideTracking(id),
    enabled: !!id,
    staleTime: 0, // Always fetch fresh initial state for tracking
    refetchOnWindowFocus: false,
  });
}
