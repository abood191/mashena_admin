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
      queryClient.invalidateQueries(passengerPoolsKeys.tracking(id));
    };

    socketService.on("pool:member_joined", handlePoolUpdate);
    socketService.on("pool:member_left", handlePoolUpdate);
    socketService.on("pool:meeting_point_updated", handlePoolUpdate);
    socketService.on("pool:room_ready", handlePoolUpdate);
    socketService.on("pool:matched", handlePoolUpdate); // payload might contain sharedRideId

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
        socketService.off("pool:meeting_point_updated", handlePoolUpdate);
        socketService.off("pool:room_ready", handlePoolUpdate);
        socketService.off("pool:matched", handlePoolUpdate);
        socketService.off("shared_ride:driver_location", handleDriverLocation);
      };
    }

    return () => {
      socketService.emit("admin:pool:leave", { roomId: id });
      socketService.off("pool:member_joined", handlePoolUpdate);
      socketService.off("pool:member_left", handlePoolUpdate);
      socketService.off("pool:meeting_point_updated", handlePoolUpdate);
      socketService.off("pool:room_ready", handlePoolUpdate);
      socketService.off("pool:matched", handlePoolUpdate);
    };
  }, [id, sharedRideId, queryClient]);
}
