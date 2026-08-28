import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { socketService } from "../../services/socket.service";
import { driverLocationStore } from "../../realtime/driverStore";
import { tripKeys } from "../api/useActiveTrips";
import { normalizeTrip } from "../../services/trips.service";
import { sharedRidesKeys } from "../api/useSharedRides";
import { passengerPoolsKeys } from "../api/usePassengerPools";

export function useRealtimeTracking() {
  const [isConnected, setIsConnected] = useState(socketService.isConnected());
  const [activeDriverIds, setActiveDriverIds] = useState([]);
  const queryClient = useQueryClient();

  useEffect(() => {
    socketService.connect();

    const unsubscribeStatus = socketService.onStatusChange(setIsConnected);
    const unsubscribeList = driverLocationStore.subscribeToList(setActiveDriverIds);

    const updateTripInCache = (payload) => {
      const rawTrip = payload?.trip || payload?.data?.trip || payload;
      if (rawTrip && (rawTrip.id || rawTrip._id || rawTrip.tripId)) {
        const trip = normalizeTrip(rawTrip);
        queryClient.setQueryData(tripKeys.active(), (current = []) => {
          const index = current.findIndex((t) => t.id === trip.id);
          if (index < 0) return [...current, trip];
          
          return current.map((t, i) => {
            if (i !== index) return t;
            const merged = { ...t };
            for (const [key, value] of Object.entries(trip)) {
              if (value !== null && value !== undefined && value !== "" && (Array.isArray(value) ? value.length > 0 : true)) {
                merged[key] = value;
              }
            }
            return merged;
          });
        });
        
        queryClient.setQueryData(tripKeys.detail(trip.id), (current) => {
           if (!current) return current;
           const merged = { ...current };
           for (const [key, value] of Object.entries(trip)) {
             if (value !== null && value !== undefined && value !== "" && (Array.isArray(value) ? value.length > 0 : true)) {
               merged[key] = value;
             }
           }
           return merged;
        });
        return true;
      }
      return false;
    };

    // Global listeners for regular trips
    const handleGlobalTripChange = (payload) => {
      const updated = updateTripInCache(payload);
      if (!updated) {
        queryClient.invalidateQueries({ queryKey: tripKeys.active() });
      }
    };

    // Global listeners for shared rides
    const handleGlobalSharedRideChange = () => {
      queryClient.invalidateQueries({ queryKey: sharedRidesKeys.all });
    };

    // Global listeners for passenger pools
    const handleGlobalPoolChange = () => {
      queryClient.invalidateQueries({ queryKey: passengerPoolsKeys.all });
    };

    socketService.on("admin:trip:created", handleGlobalTripChange);
    socketService.on("admin:trip:removed", handleGlobalTripChange);
    socketService.on("admin:trip:status-changed", handleGlobalTripChange);
    socketService.on("admin:trip:matched", handleGlobalTripChange);

    // Shared Rides events
    socketService.on("admin:shared_ride:created", handleGlobalSharedRideChange);
    socketService.on("admin:shared_ride:status-changed", handleGlobalSharedRideChange);
    socketService.on("admin:shared_ride:updated", handleGlobalSharedRideChange);
    socketService.on("admin:shared_ride:joined", handleGlobalSharedRideChange);
    socketService.on("admin:shared_ride:left", handleGlobalSharedRideChange);
    socketService.on("admin:shared_ride:passenger_joined", handleGlobalSharedRideChange);
    socketService.on("admin:shared_ride:passenger_left", handleGlobalSharedRideChange);
    socketService.on("shared_ride:created", handleGlobalSharedRideChange);
    socketService.on("shared_ride:updated", handleGlobalSharedRideChange);
    socketService.on("shared_ride:trip_started", handleGlobalSharedRideChange);
    socketService.on("shared_ride:completed", handleGlobalSharedRideChange);
    socketService.on("shared_ride:cancelled", handleGlobalSharedRideChange);
    socketService.on("shared_ride:joined", handleGlobalSharedRideChange);
    socketService.on("shared_ride:left", handleGlobalSharedRideChange);
    socketService.on("shared_ride:passenger_joined", handleGlobalSharedRideChange);
    socketService.on("shared_ride:passenger_left", handleGlobalSharedRideChange);
    
    // Pools events
    socketService.on("admin:pool:created", handleGlobalPoolChange);
    socketService.on("admin:pool:status-changed", handleGlobalPoolChange);
    socketService.on("admin:pool:updated", handleGlobalPoolChange);
    socketService.on("admin:pool:joined", handleGlobalPoolChange);
    socketService.on("admin:pool:left", handleGlobalPoolChange);
    socketService.on("admin:pool:passenger_joined", handleGlobalPoolChange);
    socketService.on("admin:pool:passenger_left", handleGlobalPoolChange);
    socketService.on("pool:created", handleGlobalPoolChange);
    socketService.on("pool:updated", handleGlobalPoolChange);
    socketService.on("pool:matched", handleGlobalPoolChange);
    socketService.on("pool:cancelled", handleGlobalPoolChange);
    socketService.on("pool:completed", handleGlobalPoolChange);
    socketService.on("pool:joined", handleGlobalPoolChange);
    socketService.on("pool:left", handleGlobalPoolChange);
    socketService.on("pool:passenger_joined", handleGlobalPoolChange);
    socketService.on("pool:passenger_left", handleGlobalPoolChange);

    return () => {
      unsubscribeStatus();
      unsubscribeList();
      socketService.off("admin:trip:created", handleGlobalTripChange);
      socketService.off("admin:trip:removed", handleGlobalTripChange);
      socketService.off("admin:trip:status-changed", handleGlobalTripChange);
      socketService.off("admin:trip:matched", handleGlobalTripChange);

      socketService.off("admin:shared_ride:created", handleGlobalSharedRideChange);
      socketService.off("admin:shared_ride:status-changed", handleGlobalSharedRideChange);
      socketService.off("admin:shared_ride:updated", handleGlobalSharedRideChange);
      socketService.off("admin:shared_ride:joined", handleGlobalSharedRideChange);
      socketService.off("admin:shared_ride:left", handleGlobalSharedRideChange);
      socketService.off("admin:shared_ride:passenger_joined", handleGlobalSharedRideChange);
      socketService.off("admin:shared_ride:passenger_left", handleGlobalSharedRideChange);
      socketService.off("shared_ride:created", handleGlobalSharedRideChange);
      socketService.off("shared_ride:updated", handleGlobalSharedRideChange);
      socketService.off("shared_ride:trip_started", handleGlobalSharedRideChange);
      socketService.off("shared_ride:completed", handleGlobalSharedRideChange);
      socketService.off("shared_ride:cancelled", handleGlobalSharedRideChange);
      socketService.off("shared_ride:joined", handleGlobalSharedRideChange);
      socketService.off("shared_ride:left", handleGlobalSharedRideChange);
      socketService.off("shared_ride:passenger_joined", handleGlobalSharedRideChange);
      socketService.off("shared_ride:passenger_left", handleGlobalSharedRideChange);

      socketService.off("admin:pool:created", handleGlobalPoolChange);
      socketService.off("admin:pool:status-changed", handleGlobalPoolChange);
      socketService.off("admin:pool:updated", handleGlobalPoolChange);
      socketService.off("admin:pool:joined", handleGlobalPoolChange);
      socketService.off("admin:pool:left", handleGlobalPoolChange);
      socketService.off("admin:pool:passenger_joined", handleGlobalPoolChange);
      socketService.off("admin:pool:passenger_left", handleGlobalPoolChange);
      socketService.off("pool:created", handleGlobalPoolChange);
      socketService.off("pool:updated", handleGlobalPoolChange);
      socketService.off("pool:matched", handleGlobalPoolChange);
      socketService.off("pool:cancelled", handleGlobalPoolChange);
      socketService.off("pool:completed", handleGlobalPoolChange);
      socketService.off("pool:joined", handleGlobalPoolChange);
      socketService.off("pool:left", handleGlobalPoolChange);
      socketService.off("pool:passenger_joined", handleGlobalPoolChange);
      socketService.off("pool:passenger_left", handleGlobalPoolChange);
    };
  }, [queryClient]);

  return {
    isConnected,
    activeDriverIds,
    socket: socketService,
  };
}
