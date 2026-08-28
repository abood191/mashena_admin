import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { socketService } from "../../services/socket.service";
import { driverLocationStore } from "../../realtime/driverStore";
import { normalizeTrip } from "../../services/trips.service";
import { trackLocationEvent } from "../../utils/routing";
import { tripKeys } from "../api/useActiveTrips";

function getDriverId(payload) {
  const id = (
    payload?.driverId ||
    payload?.driver?.id ||
    payload?.driver?._id ||
    payload?.driverProfileId ||
    payload?.driverProfile?.id ||
    payload?.driverProfile?._id ||
    null
  );
  return id != null ? Number(id) : null;
}

function normalizeLocation(payload, fallbackTripId) {
  if (!payload) return null;

  const location = payload.location || payload.driverLocation || payload.currentLocation || payload;
  const driver = payload.driver || payload.driverProfile || location.driver || null;
  const driverId = getDriverId(payload) || getDriverId(location);
  const latitude = location.latitude ?? location.lat;
  const longitude = location.longitude ?? location.lng ?? location.lon;

  if (!driverId || latitude === undefined || longitude === undefined) return null;

  const tripIdRaw = payload.tripId || payload.rideRequestId || location.tripId || location.rideRequestId || fallbackTripId;

  return {
    ...location,
    driverId,
    name: location.name || driver?.name || driver?.fullName || driver?.user?.name,
    phone: location.phone || driver?.phone || driver?.user?.phone,
    latitude: Number(latitude),
    longitude: Number(longitude),
    bearing: location.bearing ?? payload.bearing,
    speed: location.speed ?? payload.speed ?? 0,
    tripId: tripIdRaw != null ? Number(tripIdRaw) : null,
    status: location.status || payload.status || "online",
  };
}

function updateTripInList(trips = [], nextTrip) {
  if (!nextTrip?.id) return trips;

  const index = trips.findIndex((trip) => trip.id === nextTrip.id);
  if (index < 0) return [...trips, nextTrip];

  return trips.map((trip, itemIndex) => {
    if (itemIndex !== index) return trip;
    
    // Merge only non-null, non-undefined fields to prevent wiping existing data
    const merged = { ...trip };
    for (const [key, value] of Object.entries(nextTrip)) {
      if (value !== null && value !== undefined && value !== "" && (Array.isArray(value) ? value.length > 0 : true)) {
        merged[key] = value;
      }
    }
    return merged;
  });
}

export function useTripTracking(rawTripId) {
  const [snapshot, setSnapshot] = useState(null);
  const queryClient = useQueryClient();
  
  const tripId = rawTripId != null ? Number(rawTripId) : null;

  useEffect(() => {
    if (!tripId) {
      setSnapshot(null);
      driverLocationStore.clear();
      return undefined;
    }

    socketService.connect();
    driverLocationStore.clear();

    const handleSnapshot = (payload) => {
      const rawTrip = payload?.trip || payload?.data?.trip || payload;
      const trip = normalizeTrip(rawTrip);

      if (trip?.id) {
        queryClient.setQueryData(tripKeys.active(), (current = []) => {
          const mergedList = updateTripInList(current, trip);
          const mergedTrip = mergedList.find((t) => t.id === trip.id);
          setSnapshot(mergedTrip);
          queryClient.setQueryData(tripKeys.detail(trip.id), mergedTrip);
          return mergedList;
        });
      }

      const location = normalizeLocation(
  {
    ...(payload?.currentLocation || {}),
    driverId: payload?.driverId,
    tripId: payload?.tripId,
    status: payload?.status,
  },
  trip?.id || tripId
);

      if (location) {
        driverLocationStore.updateLocation(location.driverId, location);
      }
      
    };

   const handleDriverLocation = (payload) => {
  console.log("DRIVER LOCATION EVENT", payload);

  const location = normalizeLocation(payload, tripId);

  console.log("NORMALIZED LOCATION", location);

  if (!location) return;

  trackLocationEvent();
  driverLocationStore.updateLocation(location.driverId, location);
  
  // Accumulate live path so it draws on the map in real-time
  if (location.tripId) {
    const updateTripActualRoute = (trip) => {
      if (!trip) return trip;
      return {
        ...trip,
        actualRoute: [
          ...(trip.actualRoute || []),
          [location.latitude, location.longitude]
        ]
      };
    };

    queryClient.setQueryData(tripKeys.active(), (current = []) => {
      return current.map(t => t.id === location.tripId ? updateTripActualRoute(t) : t);
    });
    
    queryClient.setQueryData(tripKeys.detail(location.tripId), (trip) => {
      return updateTripActualRoute(trip);
    });
  }
};

    const handleTripRemoved = (payload) => {
      const removedTripId = payload?.tripId || payload?.id;
      if (removedTripId === tripId) {
        driverLocationStore.clear();
        setSnapshot(null);
        queryClient.setQueryData(tripKeys.active(), (current = []) => {
          return current.filter(t => t.id !== tripId);
        });
      }
    };

    socketService.on("admin:trip:snapshot", handleSnapshot);
    socketService.on("admin:trip:driver-location", handleDriverLocation);
    socketService.on("admin:trip:removed", handleTripRemoved);
    socketService.emit("admin:trip:join", { tripId });
    console.log(
  "JOINING ROOM",
  tripId
);

    return () => {
      socketService.emit("admin:trip:leave", { tripId });
      socketService.off("admin:trip:snapshot", handleSnapshot);
      socketService.off("admin:trip:driver-location", handleDriverLocation);
      socketService.off("admin:trip:removed", handleTripRemoved);
      driverLocationStore.clear();
    };
  }, [queryClient, tripId]);

  return { snapshot };
}
