import React, { useState, useEffect, useRef, memo } from "react";
import { MapContainer, TileLayer, Polyline, Popup, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import { driverLocationStore } from "../../../realtime/driverStore";
import { socketService } from "../../../services/socket.service";
import { getCacheStats, getEventsPerSecond } from "../../../utils/routing";
import "leaflet/dist/leaflet.css";

// Fix Leaflet marker icon asset paths with try-catch safety
try {
  if (L.Icon?.Default?.prototype) {
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
      iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    });
  }
} catch (e) {
  console.warn("Leaflet default icon patch failed:", e);
}

// ---------------------- UTILS ----------------------
function getBearing(start, end) {
  if (!start || !end) return 0;
  const dy = end[0] - start[0];
  const dx = Math.cos((Math.PI / 180) * start[0]) * (end[1] - start[1]);
  let angle = (Math.atan2(dx, dy) * 180) / Math.PI;
  if (angle < 0) angle += 360;
  return angle;
}

function findClosestRoutePointIndex(route, [lat, lng]) {
  if (!route || route.length === 0) return 0;
  let minDistance = Infinity;
  let closestIndex = 0;
  for (let i = 0; i < route.length; i++) {
    const [rLat, rLng] = route[i];
    const distSq = Math.pow(rLat - lat, 2) + Math.pow(rLng - lng, 2);
    if (distSq < minDistance) {
      minDistance = distSq;
      closestIndex = i;
    }
  }
  return closestIndex;
}

function formatMapTripId(id) {
  if (id == null) return "Unknown";
  const strId = String(id);
  return strId.length > 8 ? strId.slice(-8) : strId;
}

// ---------------------- PIN HTML / DOM ICONS ----------------------
const CAR_ICON_HTML = `
  <div class="relative w-9 h-9 flex items-center justify-center">
    <span class="absolute inline-flex h-full w-full rounded-full bg-indigo-400/20 animate-ping opacity-75"></span>
    <div class="absolute w-8 h-8 rounded-full bg-slate-950 border border-indigo-400/60 shadow-[0_0_8px_rgba(99,102,241,0.5)] flex items-center justify-center">
      <div class="car-pointer text-indigo-400 flex items-center justify-center" style="transform: rotate(0deg);">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
          <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
        </svg>
      </div>
    </div>
  </div>
`;

const PICKUP_ICON_HTML = `
  <div class="relative w-7 h-7 flex items-center justify-center">
    <span class="absolute inline-flex h-6 w-6 rounded-full bg-emerald-400/35 animate-ping"></span>
    <div class="w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center shadow-lg transition-transform hover:scale-125 duration-100">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-2.5 h-2.5 text-slate-950 font-bold">
        <path fill-rule="evenodd" d="M10 2a6 6 0 00-6 6c0 4.906 5.437 9.479 5.672 9.675a.5.5 0 00.656 0C10.563 17.479 16 12.906 16 8a6 6 0 00-6-6zm0 8a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
      </svg>
    </div>
  </div>
`;

const DEST_ICON_HTML = `
  <div class="relative w-7 h-7 flex items-center justify-center">
    <span class="absolute inline-flex h-5 w-5 rounded-full bg-rose-400/20 animate-pulse"></span>
    <div class="w-5 h-5 rounded-full bg-rose-500 border-2 border-slate-950 flex items-center justify-center shadow-lg transition-transform hover:scale-125 duration-100">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-2.5 h-2.5 text-foreground">
        <path fill-rule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V3zm10 2.5a.5.5 0 00-.5-.5h-5a.5.5 0 000 1h5a.5.5 0 00.5-.5z" clip-rule="evenodd" />
      </svg>
    </div>
  </div>
`;

const STOP_ICON_HTML = `
  <div class="relative w-7 h-7 flex items-center justify-center">
    <span class="absolute inline-flex h-5 w-5 rounded-full bg-amber-400/30 animate-pulse"></span>
    <div class="w-5 h-5 rounded-full bg-amber-500 border-2 border-slate-950 flex items-center justify-center shadow-lg transition-transform hover:scale-125 duration-100">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-3 h-3 text-slate-950">
        <circle cx="12" cy="12" r="6" />
      </svg>
    </div>
  </div>
`;

// Helper component to center map dynamically on first render
function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || map.getZoom());
    }
  }, [center, zoom, map]);
  return null;
}

// Cinematic focus controller for selected routes
function MapFlyController({ selectedTripId, activeTrips }) {
  const map = useMap();
  
  useEffect(() => {
    if (!selectedTripId || activeTrips.length === 0) return;
    
    const trip = activeTrips.find((t) => t.id === selectedTripId);
    if (!trip || !trip.route || trip.route.length === 0) return;

    // Build precise bounding box for full road snapped coordinates
    const bounds = L.latLngBounds(trip.route);
    map.flyToBounds(bounds, {
      padding: [80, 80],
      maxZoom: 15,
      duration: 1.4,
      easeLinearity: 0.2,
    });
  }, [selectedTripId, activeTrips, map]);

  return null;
}

// ---------------------- MEMOIZED DRIVER MARKER WITH RUNTIME INTERPOLATION ----------------------
const DriverMarker = memo(({ driverId, isSelected, onClick }) => {
  const map = useMap();
  const [position, setPosition] = useState(null);
  const [bearing, setBearing] = useState(0);
  const [metadata, setMetadata] = useState(null);
  const markerRef = useRef(null);

  const prevPositionRef = useRef(null);
  const targetPositionRef = useRef(null);
  const prevBearingRef = useRef(null);
  const targetBearingRef = useRef(null);
  const animationFrameId = useRef(null);
  const startTimeRef = useRef(null);
  const lastUpdateTimeRef = useRef(performance.now());
  const durationRef = useRef(1000);

  // Track zoom level for dynamic marker scaling
  const [currentZoom, setCurrentZoom] = useState(map.getZoom());
  useEffect(() => {
    const handleZoom = () => setCurrentZoom(map.getZoom());
    map.on('zoom', handleZoom);
    return () => map.off('zoom', handleZoom);
  }, [map]);

  useEffect(() => {
    const unsubscribe = driverLocationStore.subscribe(driverId, (data) => {
      if (!data) {
        setPosition(null);
        return;
      }

      setMetadata({
        name: data.name || `Driver #${driverId}`,
        phone: data.phone || "+963-955-555-555",
        status: data.status || "online",
        speed: Math.round((data.speed || 0) * 3.6),
        tripId: data.tripId,
      });

      const nextLat = data.latitude;
      const nextLng = data.longitude;
      
      const now = performance.now();
      const timeSinceLastUpdate = now - lastUpdateTimeRef.current;
      lastUpdateTimeRef.current = now;

      if (!targetPositionRef.current) {
        const initialBearing = data.bearing || 0;
        prevPositionRef.current = [nextLat, nextLng];
        targetPositionRef.current = [nextLat, nextLng];
        prevBearingRef.current = initialBearing;
        targetBearingRef.current = initialBearing;
        setPosition([nextLat, nextLng]);
        setBearing(initialBearing);
        return;
      }

      prevPositionRef.current = targetPositionRef.current;
      targetPositionRef.current = [nextLat, nextLng];
      
      // Dynamic duration based on update interval, clamped for safety (800ms - 3500ms)
      durationRef.current = Math.min(Math.max(timeSinceLastUpdate, 800), 3500);

      // Distance calculation to prevent jitter turning
      const distMeters = map.distance(prevPositionRef.current, targetPositionRef.current);
      
      let nextBearing = data.bearing;
      // Infer bearing from movement if missing or handle GPS noise
      if (nextBearing == null) {
        if (distMeters > 1.5) {
          nextBearing = getBearing(prevPositionRef.current, targetPositionRef.current);
        } else {
          nextBearing = targetBearingRef.current; // Keep previous to prevent spin on jitter
        }
      }

      prevBearingRef.current = targetBearingRef.current;
      targetBearingRef.current = nextBearing;
      startTimeRef.current = performance.now();

      const animateMarker = (time) => {
        if (!startTimeRef.current) return;
        const elapsed = time - startTimeRef.current;
        
        // Easing function (easeOutCubic) for smoother deceleration
        const rawT = Math.min(elapsed / durationRef.current, 1);
        const t = 1 - Math.pow(1 - rawT, 3);

        const startLat = prevPositionRef.current[0];
        const startLng = prevPositionRef.current[1];
        const targetLat = targetPositionRef.current[0];
        const targetLng = targetPositionRef.current[1];
        const lat = startLat + (targetLat - startLat) * t;
        const lng = startLng + (targetLng - startLng) * t;

        const startB = prevBearingRef.current;
        const targetB = targetBearingRef.current;
        let diff = targetB - startB;
        while (diff < -180) diff += 360;
        while (diff > 180) diff -= 360;
        const currentB = startB + diff * t;

        setPosition([lat, lng]);
        setBearing(currentB);

        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        }

        if (rawT < 1) {
          animationFrameId.current = requestAnimationFrame(animateMarker);
        }
      };

      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      animationFrameId.current = requestAnimationFrame(animateMarker);
    });

    return () => {
      unsubscribe();
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [driverId, map]);

  if (!position) return null;

  // Scale marker based on zoom level
  const scale = Math.max(0.6, Math.min(1.4, Math.pow(1.15, currentZoom - 13)));
  const iconHtmlScaled = CAR_ICON_HTML
    .replace('class="relative w-9 h-9', `style="transform: scale(${scale}); transform-origin: center;" class="relative w-9 h-9`)
    .replace('rotate(0deg)', `rotate(${bearing - 90}deg)`);

  const divClass = `custom-driver-icon ${isSelected ? "selected-pointer" : ""}`;
  const customIcon = L.divIcon({
    html: iconHtmlScaled,
    className: divClass,
    iconSize: [36 * scale, 36 * scale],
    iconAnchor: [18 * scale, 18 * scale],
  });

  return (
    <Marker
      position={position}
      icon={customIcon}
      ref={markerRef}
      eventHandlers={{
        click: () => {
          if (onClick && metadata?.tripId) onClick(metadata.tripId);
        },
      }}
    >
      <Popup className="custom-leaflet-popup">
        <div className="p-1.5 min-w-[200px] text-foreground">
          <div className="flex justify-between items-center border-b border-border-subtle pb-1 mb-2">
            <span className="font-bold text-sm text-indigo-400">{metadata?.name}</span>
            <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded uppercase font-semibold">
              {metadata?.status}
            </span>
          </div>
          <div className="space-y-1 text-xs text-foreground/70">
            <p><span className="text-foreground/40">Phone:</span> {metadata?.phone}</p>
            <p><span className="text-foreground/40">Speed:</span> {metadata?.speed} km/h</p>
            {metadata?.tripId ? (
              <p className="mt-2 text-indigo-300 font-semibold bg-indigo-500/10 p-1.5 rounded border border-indigo-500/20 text-center">
                On Active Trip
              </p>
            ) : (
              <p className="mt-2 text-emerald-400 font-semibold bg-emerald-500/10 p-1.5 rounded border border-emerald-500/20 text-center">
                Idle / Available
              </p>
            )}
          </div>
        </div>
      </Popup>
    </Marker>
  );
});

// ---------------------- MAIN MAP COMPONENT ----------------------
export default function TrackingMap({ activeDriverIds, mapStyle = "google", activeTrips = [], selectedTripId, onSelectTrip }) {
  const [center] = useState([33.5138, 36.2765]); // Default: Damascus
  const [zoom] = useState(13);

  // Telemetry debug panel stats
  const [stats, setStats] = useState({ hits: 0, misses: 0, eps: 0.0 });
  const [showDebug, setShowDebug] = useState(false);
  const [wsConnected, setWsConnected] = useState(socketService.isConnected());

  useEffect(() => {
    const handle = setInterval(() => {
      const cache = getCacheStats();
      const eps = getEventsPerSecond();
      setWsConnected(socketService.isConnected());
      setStats({
        hits: cache.hits,
        misses: cache.misses,
        eps: eps !== null ? eps : stats.eps
      });
    }, 1000);
    return () => clearInterval(handle);
  }, [stats.eps]);

  // Leaflet styles mapping
  const TILE_LAYERS = {
    dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    light: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", // Carto Voyager (Google-like)
    google: "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
    satellite: "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
  };

  const currentTileUrl = TILE_LAYERS[mapStyle] || TILE_LAYERS.google;

  const pickupIcon = L.divIcon({
    html: PICKUP_ICON_HTML,
    className: "pickup-custom-icon",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

  const destIcon = L.divIcon({
    html: DEST_ICON_HTML,
    className: "dest-custom-icon",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

  const stopIcon = L.divIcon({
    html: STOP_ICON_HTML,
    className: "stop-custom-icon",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

  // Calculate dynamic segments along the route based on snapping
  const getTripSegments = (trip) => {
    let currentIndex = 0;
    
    if (trip.driverId) {
      const loc = driverLocationStore.getLocation(trip.driverId);
      if (loc && loc.latitude && loc.longitude) {
        currentIndex = findClosestRoutePointIndex(trip.route, [loc.latitude, loc.longitude]);
      }
    }
    
    const pickupIdx = trip.pickupIndex ?? 0;
    
    // 1. Completed Path segment
    const completedRoute = trip.route.slice(0, currentIndex + 1);
    
    // 2. Pickup Path segment (driver to passenger)
    let pickupRoute = [];
    if (trip.status === "pending" || trip.status === "accepted" || trip.status === "driver_arrived") {
      if (currentIndex < pickupIdx) {
        pickupRoute = trip.route.slice(currentIndex, pickupIdx + 1);
      }
    }
    
    // 3. Active Passenger Transit Path segment
    let activeRoute = [];
    if (trip.status === "started") {
      activeRoute = trip.route.slice(currentIndex);
    } else {
      activeRoute = trip.route.slice(pickupIdx);
    }
    
    return {
      completedRoute,
      pickupRoute,
      activeRoute,
      currentIndex
    };
  };

  // Compute remaining distance (km) and remaining ETA (mins)
  const getRemainingMetrics = (trip, segments, driverSpeed) => {
    const { activeRoute, pickupRoute } = segments;
    const remainingPath = trip.status === "started" ? activeRoute : [...pickupRoute, ...activeRoute];
    
    let remainingMeters = 0;
    for (let i = 0; i < remainingPath.length - 1; i++) {
      const [lat1, lng1] = remainingPath[i];
      const [lat2, lng2] = remainingPath[i + 1];
      const dy = lat2 - lat1;
      const dx = Math.cos((Math.PI / 180) * lat1) * (lng2 - lng1);
      remainingMeters += Math.sqrt(dx * dx + dy * dy) * 111000;
    }
    
    const remainingKm = Number((remainingMeters / 1000).toFixed(1));
    const speedMs = driverSpeed && driverSpeed > 0 ? (driverSpeed * 1000) / 3600 : 11.1; // default 40 km/h
    const remainingMins = Math.ceil(remainingMeters / speedMs / 60);
    
    return {
      distanceKm: remainingKm,
      etaMins: remainingMins,
      remainingPath
    };
  };

  const buildTripTrackingData = (trip) => {
    if (!trip?.route || trip.route.length === 0) return null;

    const segments = getTripSegments(trip);
    const loc = trip.driverId ? driverLocationStore.getLocation(trip.driverId) : null;
    const metrics = getRemainingMetrics(trip, segments, loc?.speed || 0);
    const progress = trip.route.length > 1
      ? Math.round((segments.currentIndex / (trip.route.length - 1)) * 100)
      : 0;

    return {
      trip,
      segments,
      metrics,
      progress,
      loc
    };
  };

  // Render chevron SVGs along the route path in order of direction
  const renderDirectionalChevrons = (remainingPath) => {
    if (!remainingPath || remainingPath.length < 2) return null;
    
    const chevrons = [];
    const step = Math.max(10, Math.floor(remainingPath.length / 8));
    
    for (let i = 4; i < remainingPath.length - 2; i += step) {
      const current = remainingPath[i];
      const next = remainingPath[i + 1];
      const bearing = getBearing(current, next);
      
      const arrowIcon = L.divIcon({
        html: `<div class="text-indigo-400 opacity-90 drop-shadow-[0_0_2px_rgba(99,102,241,0.9)]" style="transform: rotate(${bearing}deg); width: 14px; height: 14px; display: flex; align-items: center; justify-content: center;">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
            <path fill-rule="evenodd" d="M16.28 11.47a.75.75 0 0 1 0 1.06l-7.5 7.5a.75.75 0 0 1-1.06-1.06L14.69 12 7.72 5.03a.75.75 0 0 1 1.06-1.06l7.5 7.5Z" clip-rule="evenodd" />
          </svg>
        </div>`,
        className: "route-arrow-marker",
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      });
      
      chevrons.push(
        <Marker
          key={`chevron-${i}`}
          position={current}
          icon={arrowIcon}
          interactive={false}
        />
      );
    }
    
    return chevrons;
  };

  // Bottom Selected HUD Data
  const selectedTrip = activeTrips.find((t) => t.id === selectedTripId);
  let selectedHUDData = null;

  if (selectedTrip && selectedTrip.route) {
    selectedHUDData = buildTripTrackingData(selectedTrip);
  }

  return (
    <div className="w-full h-full relative rounded-3xl overflow-hidden border border-border-subtle shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
      
      {/* Inline styles for custom premium flow & halo animations */}
      <style>{`
        @keyframes routeFlow {
          to {
            stroke-dashoffset: -20;
          }
        }
        .animated-route-flow {
          stroke-dasharray: 10, 10;
          animation: routeFlow 1s linear infinite;
        }
        @keyframes pulseHalo {
          0% { stroke-width: 13px; opacity: 0.2; }
          50% { stroke-width: 16px; opacity: 0.4; }
          100% { stroke-width: 13px; opacity: 0.2; }
        }
        .selected-pulse-halo {
          animation: pulseHalo 1.8s ease-in-out infinite;
        }
      `}</style>

      <MapContainer
        center={center}
        zoom={zoom}
        className="w-full h-full z-10"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
          url={currentTileUrl}
        />

        <MapController center={center} zoom={zoom} />
        <MapFlyController selectedTripId={selectedTripId} activeTrips={activeTrips} />

        {/* Render Pickup & Destination Markers */}
        {activeTrips.map((trip) => {
          const isSelected = selectedTripId === trip.id;
          
          return (
            <React.Fragment key={trip.id}>
              {trip.pickup && (
                <Marker
                  position={trip.pickup}
                  icon={pickupIcon}
                  eventHandlers={{ click: () => onSelectTrip(trip.id) }}
                >
                  <Popup className="custom-leaflet-popup">
                    <div className="p-1 text-foreground text-xs">
                      <span className="font-bold text-emerald-400 block">Pickup Origin</span>
                      <span className="text-[10px] text-foreground/50 block mt-0.5">#{formatMapTripId(trip.id)}</span>
                    </div>
                  </Popup>
                </Marker>
              )}

              {trip.destination && (
                <Marker
                  position={trip.destination}
                  icon={destIcon}
                  eventHandlers={{ click: () => onSelectTrip(trip.id) }}
                >
                  <Popup className="custom-leaflet-popup">
                    <div className="p-1 text-foreground text-xs">
                      <span className="font-bold text-rose-400 block">Destination</span>
                      <span className="text-[10px] text-foreground/50 block mt-0.5">#{formatMapTripId(trip.id)}</span>
                    </div>
                  </Popup>
                </Marker>
              )}

              {trip.stops && trip.stops.length > 0 && trip.stops.map((stop, index) => (
                <Marker
                  key={`stop-${stop.id || index}`}
                  position={[stop.lat, stop.lng]}
                  icon={stopIcon}
                  eventHandlers={{ click: () => onSelectTrip(trip.id) }}
                >
                  <Popup className="custom-leaflet-popup">
                    <div className="p-1 text-foreground text-xs">
                      <span className="font-bold text-amber-400 block">Stop {stop.order || index + 1}</span>
                      {stop.address && <span className="text-[10px] text-foreground/70 block mt-1 truncate max-w-[200px]">{stop.address}</span>}
                      <span className="text-[10px] text-foreground/50 block mt-0.5">#{formatMapTripId(trip.id)}</span>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* Advanced Segmented Route Polylines */}
              {trip.route && trip.route.length >= 2 && (
                <React.Fragment>
                  {(() => {
                    const trackingData = buildTripTrackingData(trip);
                    if (!trackingData) return null;

                    const { segments, metrics } = trackingData;
                    
                    return (
                      <React.Fragment>
                        {/* 1. Completed Path segment (Slate Grey) */}
                        {segments.completedRoute.length >= 2 && (
                          <Polyline
                            positions={segments.completedRoute}
                            pathOptions={{
                              color: "#64748B",
                              weight: isSelected ? 4 : 2,
                              opacity: isSelected ? 0.55 : 0.15,
                              lineJoin: "round"
                            }}
                          />
                        )}

                        {/* 2. Pickup Path segment (Amber) */}
                        {segments.pickupRoute.length >= 2 && (
                          <Polyline
                            positions={segments.pickupRoute}
                            pathOptions={{
                              color: "#F59E0B",
                              weight: isSelected ? 6 : 3,
                              opacity: isSelected ? 1.0 : 0.25,
                              lineJoin: "round"
                            }}
                            eventHandlers={{ click: () => onSelectTrip(trip.id) }}
                          />
                        )}

                        {/* 3. Active Transit Path segment (Indigo/Vibrant Blue) */}
                        {segments.activeRoute.length >= 2 && (
                          <Polyline
                            positions={segments.activeRoute}
                            pathOptions={{
                              color: "#6366F1",
                              weight: isSelected ? 6 : 3,
                              opacity: isSelected ? 1.0 : 0.25,
                              lineJoin: "round"
                            }}
                            eventHandlers={{ click: () => onSelectTrip(trip.id) }}
                          />
                        )}

                        {/* Pulsing Glowing Halo for selected route */}
                        {isSelected && (
                          <Polyline
                            positions={segments.pickupRoute.length >= 2 ? segments.pickupRoute : segments.activeRoute}
                            pathOptions={{
                              color: segments.pickupRoute.length >= 2 ? "#F59E0B" : "#6366F1",
                              weight: 13,
                              opacity: 0.3,
                              lineJoin: "round",
                              className: "selected-pulse-halo"
                            }}
                          />
                        )}

                        {/* Neon dasharray flow overlay for selected route */}
                        {isSelected && (
                          <Polyline
                            positions={segments.pickupRoute.length >= 2 ? segments.pickupRoute : segments.activeRoute}
                            pathOptions={{
                              color: "#FFFFFF",
                              weight: 2,
                              opacity: 0.8,
                              lineJoin: "round",
                              className: "animated-route-flow"
                            }}
                          />
                        )}

                        {/* Directional Chevrons for selected route */}
                        {isSelected && renderDirectionalChevrons(metrics.remainingPath)}

                      </React.Fragment>
                    );
                  })()}
                </React.Fragment>
              )}
            </React.Fragment>
          );
        })}

        {/* Render Active Driver Markers */}
        {activeDriverIds.map((driverId) => {
          const loc = driverLocationStore.getLocation(driverId);
          const isSelected = loc?.tripId && selectedTripId === loc.tripId;
          
          return (
            <DriverMarker
              key={driverId}
              driverId={driverId}
              isSelected={isSelected}
              onClick={onSelectTrip}
            />
          );
        })}
      </MapContainer>

      {/* Floating Collapsible Telemetry Debug Panel */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 pointer-events-auto">
        <div 
          className={`bg-surface/95 backdrop-blur-xl border border-border-subtle shadow-xl transition-all duration-300 ease-in-out ${
            showDebug ? "w-[220px] rounded-2xl" : "w-[170px] rounded-full hover:bg-surface cursor-pointer"
          }`}
          onClick={() => !showDebug && setShowDebug(true)}
        >
          {/* Header */}
          <div 
            className={`flex items-center justify-between ${
              showDebug ? "px-4 py-3 border-b border-border-subtle cursor-pointer" : "px-4 py-2"
            }`}
            onClick={(e) => {
              if (showDebug) {
                e.stopPropagation();
                setShowDebug(false);
              }
            }}
          >
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${wsConnected ? "bg-emerald-400" : "bg-red-500"}`}></span>
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${wsConnected ? "bg-emerald-500" : "bg-red-500"}`}></span>
              </span>
              <span className="text-xs font-bold text-foreground/80 dark:text-foreground tracking-wide">
                {showDebug ? "Telemetry Hub" : "Ops Hub"}
              </span>
            </div>
            <span className="text-[9px] text-foreground/40 dark:text-foreground/70 font-bold uppercase transition-colors hover:text-foreground">
              {showDebug ? "HIDE" : "VIEW"}
            </span>
          </div>

          {/* Collapsible Content */}
          <div 
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              showDebug ? "max-h-[300px] opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <div className="p-4 space-y-2.5 text-[11px]">
              <div className="flex justify-between items-center"><span className="text-foreground/50 dark:text-foreground/80 font-medium">WS Link</span><span className={wsConnected ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>{wsConnected ? "ONLINE" : "OFFLINE"}</span></div>
              <div className="flex justify-between items-center"><span className="text-foreground/50 dark:text-foreground/80 font-medium">Active Trips</span><span className="text-foreground font-bold">{activeTrips.length}</span></div>
              <div className="flex justify-between items-center"><span className="text-foreground/50 dark:text-foreground/80 font-medium">Live Drivers</span><span className="text-foreground font-bold">{activeDriverIds.length}</span></div>
              
              <div className="h-px w-full bg-border-subtle my-1"></div>
              
              <div className="flex justify-between items-center"><span className="text-foreground/50 dark:text-foreground/80 font-medium">Cache Hits</span><span className="text-emerald-400 font-mono">{stats.hits}</span></div>
              <div className="flex justify-between items-center"><span className="text-foreground/50 dark:text-foreground/80 font-medium">Cache Misses</span><span className="text-red-400 font-mono">{stats.misses}</span></div>
              
              <div className="bg-foreground/5 rounded-lg p-2.5 mt-2 border border-border-subtle flex justify-between items-center">
                <span className="text-foreground/50 dark:text-foreground/80 font-bold text-[9px] uppercase">Throughput</span>
                <span className="text-indigo-400 font-bold font-mono">{stats.eps} p/s</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Selected Trip Details HUD */}
      {selectedHUDData && (
        <div className="absolute bottom-6 left-6 w-[calc(100%-3rem)] sm:w-[400px] z-20 bg-surface/95 backdrop-blur-md border border-border-subtle rounded-3xl p-4 shadow-2xl animate-in slide-in-from-left duration-300">
          
          {/* Header Row */}
          <div className="flex items-start justify-between border-b border-border-subtle pb-3">
            <div>
              <span className="text-[9px] text-foreground/30 dark:text-foreground/60 font-bold uppercase tracking-wider block leading-none">Selected Operational Route</span>
              <h3 className="text-xs font-black text-indigo-400 mt-1 uppercase">
                #{formatMapTripId(selectedHUDData.trip.id)}
              </h3>
            </div>
            
            <div className="flex items-center gap-2">
              <span className={`text-[8px] px-2 py-0.5 rounded font-black border tracking-wider uppercase leading-none ${
                selectedHUDData.trip.status === "started"
                  ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
                  : selectedHUDData.trip.status === "driver_arrived"
                  ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400"
                  : "bg-amber-500/10 border-amber-500/20 text-amber-400"
              }`}>
                {selectedHUDData.trip.status === "driver_arrived" ? "ARRIVED AT PICKUP" : selectedHUDData.trip.status === "started" ? "IN TRANSIT" : "PICKING UP"}
              </span>
              
              <button 
                onClick={() => onSelectTrip(null)}
                className="text-[10px] bg-foreground/5 hover:bg-foreground/10 h-5 w-5 rounded-full grid place-items-center text-foreground/40 dark:text-foreground/70 hover:text-foreground transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Telemetry Metrics Row */}
          <div className="grid grid-cols-3 gap-2 py-4">
            
            {/* ETA */}
            <div className="bg-foreground/5 border border-border-subtle rounded-2xl p-3 flex flex-col justify-center">
              <span className="text-[9px] text-foreground/30 dark:text-foreground/60 font-bold uppercase block text-center leading-none">ETA</span>
              <span className="text-sm font-black text-indigo-400 mt-1.5 block text-center leading-none">
                {selectedHUDData.metrics.etaMins} MINS
              </span>
            </div>

            {/* Remaining Distance */}
            <div className="bg-foreground/5 border border-border-subtle rounded-2xl p-3 flex flex-col justify-center">
              <span className="text-[9px] text-foreground/30 dark:text-foreground/60 font-bold uppercase block text-center leading-none">Remaining</span>
              <span className="text-sm font-black text-foreground mt-1.5 block text-center leading-none">
                {selectedHUDData.metrics.distanceKm} km
              </span>
            </div>

            {/* Speed */}
            <div className="bg-foreground/5 border border-border-subtle rounded-2xl p-3 flex flex-col justify-center">
              <span className="text-[9px] text-foreground/30 dark:text-foreground/60 font-bold uppercase block text-center leading-none">Telemetry</span>
              <span className="text-sm font-black text-emerald-400 mt-1.5 block text-center leading-none">
                {selectedHUDData.loc ? `${Math.round(selectedHUDData.loc.speed * 3.6)} km/h` : "0 km/h"}
              </span>
            </div>

          </div>

          {/* Linear Progress Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[9px] text-foreground/30 dark:text-foreground/60 font-bold uppercase">
              <span>Transit Progress</span>
              <span>{selectedHUDData.progress}%</span>
            </div>
            <div className="h-1.5 w-full bg-foreground/5 rounded-full overflow-hidden border border-border-subtle">
              <div 
                className="h-full bg-indigo-500 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                style={{ width: `${selectedHUDData.progress}%` }}
              />
            </div>
          </div>

          {/* Driver Metadata Section */}
          {selectedHUDData.loc && (
            <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="h-7 w-7 rounded-xl bg-indigo-500/10 border border-indigo-500/20 grid place-items-center">👤</span>
                <div>
                  <span className="font-bold text-foreground block leading-none">{selectedHUDData.loc.name}</span>
                  <span className="text-[9px] text-foreground/30 dark:text-foreground/60 font-semibold block mt-0.5 leading-none">{selectedHUDData.loc.phone}</span>
                </div>
              </div>
              <span className="text-[9px] text-emerald-400 font-bold tracking-widest flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                SNAPPED TO ROUTE
              </span>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
