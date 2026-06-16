// Local in-memory cache for OSRM routes
const routeCache = new Map();
let cacheHits = 0;
let cacheMisses = 0;

// Dynamic telemetry stats tracking
let totalLocationEvents = 0;
let lastResetTime = Date.now();

export const getCacheStats = () => ({
  hits: cacheHits,
  misses: cacheMisses,
});

export const trackLocationEvent = () => {
  totalLocationEvents++;
};

export const getEventsPerSecond = () => {
  const elapsed = (Date.now() - lastResetTime) / 1000;
  if (elapsed >= 1) {
    const eps = totalLocationEvents / elapsed;
    totalLocationEvents = 0;
    lastResetTime = Date.now();
    return Number(eps.toFixed(1));
  }
  // Return a moving average or keep track
  return null;
};

/**
 * Generate a dense path of points for smooth simulation between two coordinate sets
 */
export function generateDensePath(stops, segmentsPerStop = 20) {
  const path = [];
  for (let i = 0; i < stops.length - 1; i++) {
    const start = stops[i];
    const end = stops[i + 1];
    for (let j = 0; j < segmentsPerStop; j++) {
      const t = j / segmentsPerStop;
      path.push([
        start[0] + (end[0] - start[0]) * t,
        start[1] + (end[1] - start[1]) * t,
      ]);
    }
  }
  path.push(stops[stops.length - 1]);
  return path;
}

/**
 * Fetch a road-aligned route from OSRM.
 * Stops are in Leaflet [lat, lng] format.
 */
export async function getRoadRoute(stops) {
  if (!stops || stops.length < 2) return null;

  // Generate deterministic cache key based on coordinate signatures (rounded to 5 decimal places)
  const key = stops
    .map(([lat, lng]) => `${lat.toFixed(5)},${lng.toFixed(5)}`)
    .join("|");

  if (routeCache.has(key)) {
    cacheHits++;
    return routeCache.get(key);
  }

  cacheMisses++;

  try {
    // Format stops as lng,lat for OSRM URL query path
    const coordinateString = stops
      .map(([lat, lng]) => `${lng},${lat}`)
      .join(";");

    const url = `https://router.project-osrm.org/route/v1/driving/${coordinateString}?overview=full&geometries=geojson`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`OSRM HTTP error: ${response.status}`);
    }

    const data = await response.json();
    if (!data.routes || data.routes.length === 0) {
      throw new Error("OSRM returned no routes");
    }

    const route = data.routes[0];
    
    // OSRM GeoJSON geometry coordinates are in [lng, lat] format.
    // Map them back to Leaflet [lat, lng] format.
    const coordinates = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
    const distanceKm = route.distance / 1000;
    const durationSec = route.duration;

    const routeData = {
      coordinates,
      distanceKm,
      durationSec,
      isFailsafe: false,
    };

    // Cache the successful route calculation
    routeCache.set(key, routeData);
    return routeData;

  } catch (error) {
    console.warn("[RoutingService] Routing API failed, falling back to straight-line interpolation:", error.message);
    
    // Failsafe fallback: generate straight line dense coordinates
    const denseCoordinates = generateDensePath(stops, 30);
    
    // Estimate simple distance (Haversine formula approximation)
    let approxDistanceMeters = 0;
    for (let i = 0; i < stops.length - 1; i++) {
      const [lat1, lng1] = stops[i];
      const [lat2, lng2] = stops[i + 1];
      const dy = lat2 - lat1;
      const dx = Math.cos((Math.PI / 180) * lat1) * (lng2 - lng1);
      approxDistanceMeters += Math.sqrt(dx * dx + dy * dy) * 111000;
    }

    const routeData = {
      coordinates: denseCoordinates,
      distanceKm: approxDistanceMeters / 1000,
      durationSec: approxDistanceMeters / 12, // approx 43 km/h
      isFailsafe: true,
    };

    return routeData;
  }
}
