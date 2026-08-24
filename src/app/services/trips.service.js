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

/**
 * Extract route from the new routeGeometry field returned by the backend.
 * routeGeometry: { points: [{ lat, lng }, ...], distanceMeters, durationSeconds }
 */
function routeFromGeometry(rawTrip) {
  const geom = rawTrip?.routeGeometry;
  if (!geom || !Array.isArray(geom.points) || geom.points.length < 2) return null;

  const points = geom.points
    .map((p) => coordinateFrom(p))
    .filter((p) => p && Number.isFinite(p[0]) && Number.isFinite(p[1]));

  if (points.length < 2) return null;

  return {
    coordinates: points,
    distanceKm: geom.distanceMeters != null ? geom.distanceMeters / 1000 : 0,
    durationSec: geom.durationSeconds ?? 0,
  };
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

  // Priority: routeGeometry from backend > legacy route field > empty
  const backendRoute = routeFromGeometry(rawTrip);
  const legacyRoute = routeFrom(
    rawTrip.route || rawTrip.routeCoordinates || rawTrip.path,
  );

  const route = backendRoute?.coordinates?.length >= 2
    ? backendRoute.coordinates
    : legacyRoute;

  let actualRoute = null;
  const rawActual = rawTrip.actualRouteGeometry;
  if (Array.isArray(rawActual)) {
    const pts = rawActual
      .map(p => coordinateFrom(p))
      .filter((p) => p && Number.isFinite(p[0]) && Number.isFinite(p[1]));
    if (pts.length >= 2) actualRoute = pts;
  } else if (rawActual && Array.isArray(rawActual.points)) {
    const pts = rawActual.points
      .map(p => coordinateFrom(p))
      .filter((p) => p && Number.isFinite(p[0]) && Number.isFinite(p[1]));
    if (pts.length >= 2) actualRoute = pts;
  }

  return {
    ...rawTrip,
    id,
    status,
    driverId: getId(driver) || getId({ id: rawTrip.driverId }),
    pickup,
    destination,
    route,
    actualRoute,
    distanceKm: backendRoute?.distanceKm ?? rawTrip.distanceKm ?? 0,
    durationSec: backendRoute?.durationSec ?? rawTrip.durationSec ?? 0,
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
  getTrips: async (params = { skip: 0, limit: 100 }) => {
    const response = await api.get("/api/trips", params);
    return {
      data: normalizeTrips(response),
      count: response?.count || response?.total || 0,
    };
  },

  cancelTrip: async (tripId) => {
    const response = await api.post(`/api/trips/${tripId}/cancel-by-admin`);
    return response;
  },

  getActiveTrips: async () => {
    // Using the new online endpoint with required pagination parameters
    const tripsResponse = await api.get("/api/trips/online", { skip: 0, limit: 100 });
    let activeTrips = normalizeTrips(tripsResponse);
    
    activeTrips = activeTrips.filter((trip) =>
      ACTIVE_TRIP_STATUSES.has(String(trip.status).toLowerCase()),
    );
    
    // Enrich with OSRM routes ONLY if backend didn't provide routeGeometry
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
    try {
      // Use the new dedicated GET /api/trips/:id endpoint
      const response = await api.get(`/api/trips/${tripId}`);
      const trip = normalizeTrip(unwrapItem(response));
      
      if (trip && trip.pickup && trip.destination && (!trip.route || trip.route.length < 2)) {
        try {
          const routeData = await getRoadRoute([trip.pickup, trip.destination]);
          if (routeData && routeData.coordinates) {
            trip.route = routeData.coordinates;
            trip.distanceKm = routeData.distanceKm;
            trip.durationSec = routeData.durationSec;
          }
        } catch (e) {
          console.warn("OSRM fallback failed for trip", tripId, e);
        }
      }
      
      return trip;
    } catch (e) {
      console.warn("Failed to fetch trip by ID:", e);
      return null;
    }
  }
};
