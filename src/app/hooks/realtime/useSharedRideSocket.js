import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { socketService } from "../../services/socket.service";
import { sharedRidesKeys } from "../api/useSharedRides";
import { driverLocationStore } from "../../realtime/driverStore";

export function useSharedRideSocket(sharedRideId) {
  const queryClient = useQueryClient();
  const id = sharedRideId != null ? Number(sharedRideId) : null;

  useEffect(() => {
    if (!id) return;

    socketService.connect();

    // 1. Join event
    socketService.emit("admin:shared_ride:join", { sharedRideId: id });

    // 2. Event Handlers
    const handleDriverLocation = (payload) => {
      // payload: { sharedRideId: 10, lat: 33.5138, lng: 36.2765, timestamp: ... }
      if (payload?.lat && payload?.lng) {
        // We can use a driverStore or just local state. For now let's update a dummy driverId or specific cache
        // assuming driverId is known from snapshot, or store it in driverLocationStore with driverId if available
        // If driverLocationStore expects driverId, we need it. Let's assume snapshot provides driver.id
        // We will just pass a generic ID or if driver ID is known from payload, use it.
        const driverId = payload.driverId || `shared_ride_driver_${id}`;
        driverLocationStore.updateLocation(driverId, {
          latitude: Number(payload.lat),
          longitude: Number(payload.lng),
          driverId
        });
      }
    };

    const handlePassengerStatus = (payload) => {
      // e.g. shared_ride:passenger_on_board, shared_ride:passenger_dropped
      // payload could just trigger a refetch of the snapshot
      queryClient.invalidateQueries(sharedRidesKeys.tracking(id));
    };

    const handleTripStatus = (payload) => {
      // e.g. shared_ride:trip_started, shared_ride:completed, shared_ride:cancelled
      queryClient.invalidateQueries(sharedRidesKeys.tracking(id));
    };

    // 3. Attach Listeners
    socketService.on("shared_ride:driver_location", handleDriverLocation);
    socketService.on("shared_ride:passenger_on_board", handlePassengerStatus);
    socketService.on("shared_ride:passenger_dropped", handlePassengerStatus);
    socketService.on("shared_ride:trip_started", handleTripStatus);
    socketService.on("shared_ride:completed", handleTripStatus);
    socketService.on("shared_ride:cancelled", handleTripStatus);

    return () => {
      socketService.emit("admin:shared_ride:leave", { sharedRideId: id });
      socketService.off("shared_ride:driver_location", handleDriverLocation);
      socketService.off("shared_ride:passenger_on_board", handlePassengerStatus);
      socketService.off("shared_ride:passenger_dropped", handlePassengerStatus);
      socketService.off("shared_ride:trip_started", handleTripStatus);
      socketService.off("shared_ride:completed", handleTripStatus);
      socketService.off("shared_ride:cancelled", handleTripStatus);
    };
  }, [id, queryClient]);
}
