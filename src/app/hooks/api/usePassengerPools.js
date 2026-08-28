import { useQuery } from "@tanstack/react-query";
import { passengerPoolService } from "../../services/passengerPool.service";

export const passengerPoolsKeys = {
  all: ["passengerPools"],
  list: (filters) => ["passengerPools", "list", filters],
  tracking: (id) => ["passengerPools", "tracking", String(id)],
};

export function usePassengerPools(filters) {
  return useQuery({
    queryKey: passengerPoolsKeys.list(filters),
    queryFn: () => passengerPoolService.getPassengerPools(filters),
    staleTime: 1000 * 60, // 1 minute
    refetchOnWindowFocus: false,
    keepPreviousData: true,
  });
}

export function usePassengerPoolTracking(id) {
  return useQuery({
    queryKey: passengerPoolsKeys.tracking(id),
    queryFn: () => passengerPoolService.getPassengerPoolTracking(id),
    enabled: !!id,
    staleTime: 0, // Always fetch fresh initial state for tracking
    refetchOnWindowFocus: false,
  });
}
