import { useEffect, useState } from "react";
import { socketService } from "../../services/socket.service";
import { driverLocationStore } from "../../realtime/driverStore";

export function useRealtimeTracking() {
  const [isConnected, setIsConnected] = useState(socketService.isConnected());
  const [activeDriverIds, setActiveDriverIds] = useState([]);

  useEffect(() => {
    socketService.connect();

    const unsubscribeStatus = socketService.onStatusChange(setIsConnected);
    const unsubscribeList = driverLocationStore.subscribeToList(setActiveDriverIds);

    return () => {
      unsubscribeStatus();
      unsubscribeList();
    };
  }, []);

  return {
    isConnected,
    activeDriverIds,
    socket: socketService,
  };
}
