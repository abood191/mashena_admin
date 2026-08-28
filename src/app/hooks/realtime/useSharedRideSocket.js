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
      if (payload?.lat && payload?.lng) {
        const driverId = `shared_ride_driver_${id}`;
        driverLocationStore.updateLocation(driverId, {
          latitude: Number(payload.lat),
          longitude: Number(payload.lng),
          driverId
        });

        // Accumulate live path so it draws on the map in real-time
        queryClient.setQueryData(sharedRidesKeys.tracking(id), (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            actualRouteGeometry: [
              ...(oldData.actualRouteGeometry || []),
              { lat: Number(payload.lat), lng: Number(payload.lng) }
            ]
          };
        });
      }
    };

    const handlePassengerStatus = (payload) => {
      // e.g. shared_ride:passenger_on_board, shared_ride:passenger_dropped
      // payload could just trigger a refetch of the snapshot
      queryClient.invalidateQueries({ queryKey: sharedRidesKeys.tracking(id) });
      queryClient.invalidateQueries({ queryKey: sharedRidesKeys.all });
    };

    const handleTripStatus = (payload) => {
      // e.g. shared_ride:trip_started, shared_ride:completed, shared_ride:cancelled
      queryClient.invalidateQueries({ queryKey: sharedRidesKeys.tracking(id) });
      queryClient.invalidateQueries({ queryKey: sharedRidesKeys.all });
    };

    // 3. Attach Listeners
    socketService.on("shared_ride:driver_location", handleDriverLocation);
    socketService.on("shared_ride:passenger_on_board", handlePassengerStatus);
    socketService.on("shared_ride:passenger_dropped", handlePassengerStatus);
    socketService.on("shared_ride:passenger_joined", handlePassengerStatus);
    socketService.on("shared_ride:passenger_left", handlePassengerStatus);
    socketService.on("shared_ride:joined", handlePassengerStatus);
    socketService.on("shared_ride:left", handlePassengerStatus);
    socketService.on("shared_ride:updated", handlePassengerStatus);
    socketService.on("admin:shared_ride:updated", handlePassengerStatus);
    socketService.on("admin:shared_ride:joined", handlePassengerStatus);
    socketService.on("admin:shared_ride:left", handlePassengerStatus);
    socketService.on("shared_ride:trip_started", handleTripStatus);
    socketService.on("shared_ride:completed", handleTripStatus);
    socketService.on("shared_ride:cancelled", handleTripStatus);

    return () => {
      socketService.emit("admin:shared_ride:leave", { sharedRideId: id });
      socketService.off("shared_ride:driver_location", handleDriverLocation);
      socketService.off("shared_ride:passenger_on_board", handlePassengerStatus);
      socketService.off("shared_ride:passenger_dropped", handlePassengerStatus);
      socketService.off("shared_ride:passenger_joined", handlePassengerStatus);
      socketService.off("shared_ride:passenger_left", handlePassengerStatus);
      socketService.off("shared_ride:joined", handlePassengerStatus);
      socketService.off("shared_ride:left", handlePassengerStatus);
      socketService.off("shared_ride:updated", handlePassengerStatus);
      socketService.off("admin:shared_ride:updated", handlePassengerStatus);
      socketService.off("admin:shared_ride:joined", handlePassengerStatus);
      socketService.off("admin:shared_ride:left", handlePassengerStatus);
      socketService.off("shared_ride:trip_started", handleTripStatus);
      socketService.off("shared_ride:completed", handleTripStatus);
      socketService.off("shared_ride:cancelled", handleTripStatus);
    };
  }, [id, queryClient]);
}
