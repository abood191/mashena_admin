import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { socketService } from "../../services/socket.service";
import { passengerPoolsKeys } from "../api/usePassengerPools";

import { driverLocationStore } from "../../realtime/driverStore";

export function usePoolSocket(roomId, sharedRideId) {
  const queryClient = useQueryClient();
  const id = roomId != null ? Number(roomId) : null;

  useEffect(() => {
    if (!id) return;

    socketService.connect();

    // Join room
    socketService.emit("admin:pool:join", { roomId: id });

    // Handle generic pool updates by invalidating the query to fetch fresh data
    const handlePoolUpdate = (payload) => {
      console.log("Pool update received", payload);
      queryClient.invalidateQueries({ queryKey: passengerPoolsKeys.tracking(id) });
      queryClient.invalidateQueries({ queryKey: passengerPoolsKeys.all });
    };

    socketService.on("pool:member_joined", handlePoolUpdate);
    socketService.on("pool:member_left", handlePoolUpdate);
    socketService.on("pool:passenger_joined", handlePoolUpdate);
    socketService.on("pool:passenger_left", handlePoolUpdate);
    socketService.on("pool:joined", handlePoolUpdate);
    socketService.on("pool:left", handlePoolUpdate);
    socketService.on("pool:updated", handlePoolUpdate);
    socketService.on("admin:pool:joined", handlePoolUpdate);
    socketService.on("admin:pool:left", handlePoolUpdate);
    socketService.on("admin:pool:passenger_joined", handlePoolUpdate);
    socketService.on("admin:pool:passenger_left", handlePoolUpdate);
    socketService.on("admin:pool:updated", handlePoolUpdate);
    socketService.on("pool:meeting_point_updated", handlePoolUpdate);
    socketService.on("pool:room_ready", handlePoolUpdate);
    socketService.on("pool:matched", handlePoolUpdate); // payload might contain sharedRideId
    socketService.on("pool:cancelled", handlePoolUpdate);
    socketService.on("pool:completed", handlePoolUpdate);
    socketService.on("pool:status-changed", handlePoolUpdate);
    socketService.on("admin:pool:status-changed", handlePoolUpdate);

    if (sharedRideId) {
      socketService.emit("admin:shared_ride:join", { sharedRideId });
      
      const handleDriverLocation = (payload) => {
        if (payload?.lat && payload?.lng) {
          const driverId = payload.driverId || `shared_ride_driver_${sharedRideId}`;
          driverLocationStore.updateLocation(driverId, {
            latitude: Number(payload.lat),
            longitude: Number(payload.lng),
            driverId
          });
        }
      };
      
      socketService.on("shared_ride:driver_location", handleDriverLocation);

      return () => {
        socketService.emit("admin:pool:leave", { roomId: id });
        socketService.emit("admin:shared_ride:leave", { sharedRideId });
        socketService.off("pool:member_joined", handlePoolUpdate);
        socketService.off("pool:member_left", handlePoolUpdate);
        socketService.off("pool:passenger_joined", handlePoolUpdate);
        socketService.off("pool:passenger_left", handlePoolUpdate);
        socketService.off("pool:joined", handlePoolUpdate);
        socketService.off("pool:left", handlePoolUpdate);
        socketService.off("pool:updated", handlePoolUpdate);
        socketService.off("admin:pool:joined", handlePoolUpdate);
        socketService.off("admin:pool:left", handlePoolUpdate);
        socketService.off("admin:pool:passenger_joined", handlePoolUpdate);
        socketService.off("admin:pool:passenger_left", handlePoolUpdate);
        socketService.off("admin:pool:updated", handlePoolUpdate);
        socketService.off("pool:meeting_point_updated", handlePoolUpdate);
        socketService.off("pool:room_ready", handlePoolUpdate);
        socketService.off("pool:matched", handlePoolUpdate);
        socketService.off("pool:cancelled", handlePoolUpdate);
        socketService.off("pool:completed", handlePoolUpdate);
        socketService.off("pool:status-changed", handlePoolUpdate);
        socketService.off("admin:pool:status-changed", handlePoolUpdate);
        socketService.off("shared_ride:driver_location", handleDriverLocation);
      };
    }

    return () => {
      socketService.emit("admin:pool:leave", { roomId: id });
      socketService.off("pool:member_joined", handlePoolUpdate);
      socketService.off("pool:member_left", handlePoolUpdate);
      socketService.off("pool:passenger_joined", handlePoolUpdate);
      socketService.off("pool:passenger_left", handlePoolUpdate);
      socketService.off("pool:joined", handlePoolUpdate);
      socketService.off("pool:left", handlePoolUpdate);
      socketService.off("pool:updated", handlePoolUpdate);
      socketService.off("admin:pool:joined", handlePoolUpdate);
      socketService.off("admin:pool:left", handlePoolUpdate);
      socketService.off("admin:pool:passenger_joined", handlePoolUpdate);
      socketService.off("admin:pool:passenger_left", handlePoolUpdate);
      socketService.off("admin:pool:updated", handlePoolUpdate);
      socketService.off("pool:meeting_point_updated", handlePoolUpdate);
      socketService.off("pool:room_ready", handlePoolUpdate);
      socketService.off("pool:matched", handlePoolUpdate);
      socketService.off("pool:cancelled", handlePoolUpdate);
      socketService.off("pool:completed", handlePoolUpdate);
      socketService.off("pool:status-changed", handlePoolUpdate);
      socketService.off("admin:pool:status-changed", handlePoolUpdate);
    };
  }, [id, sharedRideId, queryClient]);
}
