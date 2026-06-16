import { api } from "./apiClient";
import { getRoadRoute } from "../utils/routing";

const ACTIVE_TRIP_STATUSES = new Set([
  "pending",
  "accepted",
  "assigned",
  "driver_arrived",
  "started",
  "in_progress",
]);

function unwrapList(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response?.trips)) return response.trips;
  if (Array.isArray(response?.results)) return response.results;
  return [];
}

function unwrapItem(response) {
  return (
    response?.data || response?.trip || response?.result || response || null
  );
}

function getId(value) {
  const id = value?.id || value?._id || value?.tripId || value?.uuid || null;
  return id != null ? Number(id) : null;
}

function coordinateFrom(value, fallbackLat, fallbackLng) {
  if (value) {
    if (Array.isArray(value) && value.length >= 2)
      return [Number(value[0]), Number(value[1])];

    const lat = value.lat ?? value.latitude;
    const lng = value.lng ?? value.lon ?? value.longitude;
    if (lat !== undefined && lng !== undefined) return [Number(lat), Number(lng)];
  }
  
  if (fallbackLat !== undefined && fallbackLng !== undefined && fallbackLat !== null && fallbackLng !== null) {
    return [Number(fallbackLat), Number(fallbackLng)];
  }
  
  return null;
}

function routeFrom(value) {
  const route =
    value?.route ||
    value?.routeCoordinates ||
    value?.path ||
    value?.coordinates ||
    value;
  if (!Array.isArray(route)) return [];

  return route
    .map((point) => coordinateFrom(point))
    .filter(
      (point) =>
        point && Number.isFinite(point[0]) && Number.isFinite(point[1]),
    );
}

export function normalizeTrip(rawTrip) {
  if (!rawTrip) return null;

  const id = getId(rawTrip);
  const status = String(
    rawTrip.status || rawTrip.tripStatus || "pending",
  ).toLowerCase();
  
  const driver =
    rawTrip.driver || rawTrip.driverProfile || rawTrip.assignedDriver || {
      id: rawTrip.driverId,
      name: rawTrip.driverFullName,
      phone: rawTrip.driverPhoneNumber,
      rating: rawTrip.driverRatingAvg,
    };
    
  if (driver && !driver.id && rawTrip.driverId) {
    driver.id = rawTrip.driverId;
  }

  const pickup =
    coordinateFrom(rawTrip.pickup, rawTrip.pickupLat, rawTrip.pickupLng) ||
    coordinateFrom(rawTrip.pickupLocation) ||
    coordinateFrom(rawTrip.pickupCoordinates) ||
    coordinateFrom(rawTrip.origin) ||
    coordinateFrom(rawTrip.startLocation);
    
  const destination =
    coordinateFrom(rawTrip.destination, rawTrip.destinationLat , rawTrip.destinationLng) ||
    coordinateFrom(rawTrip.destinationLocation) ||
    coordinateFrom(rawTrip.dropoff) ||
    coordinateFrom(rawTrip.dropoffLocation) ||
    coordinateFrom(rawTrip.endLocation);
    
  const route = routeFrom(
    rawTrip.route || rawTrip.routeCoordinates || rawTrip.path,
  );

  return {
    ...rawTrip,
    id,
    status,
    driverId: getId(driver) || getId({ id: rawTrip.driverId }),
    pickup,
    destination,
    route,
    pickupIndex: Number.isInteger(rawTrip.pickupIndex)
      ? rawTrip.pickupIndex
      : 0,
    driver,
  };
}

function normalizeTrips(response) {
  return unwrapList(response)
    .map(normalizeTrip)
    .filter((trip) => trip?.id);
}

export const tripsService = {
  getTrips: async (params = { skip: 0, limit: 100 }) =>
    normalizeTrips(await api.get("/api/trips", params)),

  getActiveTrips: async () => {
    // Using the new online endpoint with required pagination parameters
    const tripsResponse = await api.get("/api/trips/online", { skip: 0, limit: 100 });
    let activeTrips = normalizeTrips(tripsResponse);
    
    activeTrips = activeTrips.filter((trip) =>
      ACTIVE_TRIP_STATUSES.has(String(trip.status).toLowerCase()),
    );
    
    // Enrich with routes if missing
    await Promise.all(activeTrips.map(async (trip) => {
      if (trip.pickup && trip.destination && (!trip.route || trip.route.length < 2)) {
         try {
           const stops = [trip.pickup, trip.destination];
           const routeData = await getRoadRoute(stops);
           if (routeData && routeData.coordinates) {
             trip.route = routeData.coordinates;
             trip.distanceKm = routeData.distanceKm;
             trip.durationSec = routeData.durationSec;
           }
         } catch (e) {
           console.error("Failed to fetch route for trip", trip.id, e);
         }
      }
    }));

    return activeTrips;
  },

  getTripById: async (tripId) => {
    // Workaround: Since GET /api/trips/:id does not exist, fetch from lists and filter
    let trip = null;
    
    try {
      const tripsResponse = await api.get("/api/trips/online", { skip: 0, limit: 100 });
      const onlineTrips = normalizeTrips(tripsResponse);
      trip = onlineTrips.find(t => t.id === Number(tripId));
      
      if (!trip) {
        const allResponse = await api.get("/api/trips", { skip: 0, limit: 100 });
        const allTrips = normalizeTrips(allResponse);
        trip = allTrips.find(t => t.id === Number(tripId));
      }
    } catch (e) {
      console.warn("Failed to fetch trip by ID via lists:", e);
    }

    if (trip && trip.pickup && trip.destination && (!trip.route || trip.route.length < 2)) {
       try {
         const routeData = await getRoadRoute([trip.pickup, trip.destination]);
         if (routeData && routeData.coordinates) {
           trip.route = routeData.coordinates;
         }
       } catch (e) {}
    }
    return trip || null;
  }
};
