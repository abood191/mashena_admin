import React, { useState, useEffect, useRef, memo } from "react";
import { MapContainer, TileLayer, Polyline, Popup, Marker, useMap } from "react-leaflet";
import { useParams } from "react-router-dom";
import L from "leaflet";
import { driverLocationStore } from "../../../realtime/driverStore";
import "leaflet/dist/leaflet.css";

// Fix Leaflet marker icon asset paths
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
    <div class="w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center shadow-lg">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-2.5 h-2.5 text-slate-950 font-bold">
        <path fill-rule="evenodd" d="M10 2a6 6 0 00-6 6c0 4.906 5.437 9.479 5.672 9.675a.5.5 0 00.656 0C10.563 17.479 16 12.906 16 8a6 6 0 00-6-6zm0 8a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
      </svg>
    </div>
  </div>
`;

const DEST_ICON_HTML = `
  <div class="relative w-7 h-7 flex items-center justify-center">
    <span class="absolute inline-flex h-5 w-5 rounded-full bg-rose-400/20 animate-pulse"></span>
    <div class="w-5 h-5 rounded-full bg-rose-500 border-2 border-slate-950 flex items-center justify-center shadow-lg">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-2.5 h-2.5 text-foreground">
        <path fill-rule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V3zm10 2.5a.5.5 0 00-.5-.5h-5a.5.5 0 000 1h5a.5.5 0 00.5-.5z" clip-rule="evenodd" />
      </svg>
    </div>
  </div>
`;

function MapController({ center, zoom, bounds, tripId }) {
  const map = useMap();
  const hasFlownRef = useRef(false);
  const prevTripId = useRef(tripId);

  useEffect(() => {
    if (tripId !== prevTripId.current) {
      hasFlownRef.current = false;
      prevTripId.current = tripId;
    }

    if (!hasFlownRef.current && bounds && bounds.length > 0) {
      const latLngBounds = L.latLngBounds(bounds);
      map.flyToBounds(latLngBounds, { padding: [50, 50], duration: 1 });
      hasFlownRef.current = true;
    } else if (!hasFlownRef.current && center) {
      map.setView(center, zoom || map.getZoom());
    }
  }, [center, zoom, bounds, map, tripId]);
  return null;
}

const DriverMarker = memo(({ driverId }) => {
  const map = useMap();
  const [position, setPosition] = useState(null);
  const [bearing, setBearing] = useState(0);

  useEffect(() => {
    if (!driverId) return;
    const unsubscribe = driverLocationStore.subscribe(driverId, (data) => {
      if (!data) {
        setPosition(null);
        return;
      }
      if (data?.latitude && data?.longitude) {
        setPosition([data.latitude, data.longitude]);
        if (data.bearing != null) setBearing(data.bearing);
      }
    });
    return unsubscribe;
  }, [driverId]);

  if (!position) return null;

  const currentZoom = map.getZoom();
  const scale = Math.max(0.6, Math.min(1.4, Math.pow(1.15, currentZoom - 13)));
  const iconHtmlScaled = CAR_ICON_HTML
    .replace('class="relative w-9 h-9', `style="transform: scale(${scale}); transform-origin: center;" class="relative w-9 h-9`)
    .replace('rotate(0deg)', `rotate(${bearing - 90}deg)`);

  const customIcon = L.divIcon({
    html: iconHtmlScaled,
    className: "custom-driver-icon",
    iconSize: [36 * scale, 36 * scale],
    iconAnchor: [18 * scale, 18 * scale],
  });

  return (
    <Marker position={position} icon={customIcon}>
      <Popup className="custom-leaflet-popup text-xs font-medium">Live Driver Location</Popup>
    </Marker>
  );
});

export default function SharedRideMap({ snapshot }) {
  const { id } = useParams();
  const [center] = useState([33.5138, 36.2765]); // Default Damascus
  
  const pickupIcon = L.divIcon({ html: PICKUP_ICON_HTML, className: "", iconSize: [28, 28], iconAnchor: [14, 14] });
  const destIcon = L.divIcon({ html: DEST_ICON_HTML, className: "", iconSize: [28, 28], iconAnchor: [14, 14] });

  // Extract all relevant coordinates for auto-bounding
  const bounds = [];
  if (snapshot?.origin) bounds.push([snapshot.origin.lat, snapshot.origin.lng]);
  if (snapshot?.destination) bounds.push([snapshot.destination.lat, snapshot.destination.lng]);
  
  // Parse planned (original) route geometry
  let plannedRoutePath = [];
  if (snapshot?.routeGeometry && Array.isArray(snapshot.routeGeometry)) {
    plannedRoutePath = snapshot.routeGeometry.map(p => {
      if (Array.isArray(p)) return p;
      if (p.lat !== undefined && p.lng !== undefined) return [p.lat, p.lng];
      if (p.latitude !== undefined && p.longitude !== undefined) return [p.latitude, p.longitude];
      return [0, 0];
    });
    bounds.push(...plannedRoutePath);
  }

  // Parse actual driven route geometry
  let actualRoutePath = [];
  if (snapshot?.actualRouteGeometry && Array.isArray(snapshot.actualRouteGeometry)) {
    actualRoutePath = snapshot.actualRouteGeometry.map(p => {
      if (Array.isArray(p)) return p;
      if (p.lat !== undefined && p.lng !== undefined) return [p.lat, p.lng];
      if (p.latitude !== undefined && p.longitude !== undefined) return [p.latitude, p.longitude];
      return [0, 0];
    });
    bounds.push(...actualRoutePath);
  }

  // Use consistent store ID matching the socket hook
  const driverId = `shared_ride_driver_${id}`;

  return (
    <div className="absolute inset-0 z-0">
      <MapContainer center={center} zoom={13} className="w-full h-full z-0" zoomControl={false}>
        <TileLayer
          attribution='&copy; Google Maps'
          url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}" // Google Road Map
        />
        
        <MapController center={center} zoom={13} bounds={bounds.length > 1 ? bounds : null} tripId={id} />

        {/* Origin */}
        {snapshot?.origin && (
          <Marker position={[snapshot.origin.lat, snapshot.origin.lng]} icon={pickupIcon}>
            <Popup className="text-xs">Origin: {snapshot.origin.address}</Popup>
          </Marker>
        )}

        {/* Destination */}
        {snapshot?.destination && (
          <Marker position={[snapshot.destination.lat, snapshot.destination.lng]} icon={destIcon}>
            <Popup className="text-xs">Destination: {snapshot.destination.address}</Popup>
          </Marker>
        )}

        {/* Planned (Original) Route */}
        {plannedRoutePath.length >= 2 && (
          <Polyline positions={plannedRoutePath} pathOptions={{ color: "#6366F1", weight: 4, opacity: 0.6, dashArray: "10, 10" }} />
        )}

        {/* Actual Driven Route */}
        {actualRoutePath.length >= 2 && (
          <Polyline positions={actualRoutePath} pathOptions={{ color: "#10B981", weight: 6, opacity: 0.9 }} />
        )}

        {/* Passengers */}
        {snapshot?.passengers?.map((p, i) => {
          if (p.pickupLocation) {
            return (
              <Marker key={`p-${i}`} position={[p.pickupLocation.lat, p.pickupLocation.lng]} icon={pickupIcon}>
                <Popup className="text-xs">
                  Passenger: {p.riderName}<br/>Status: {p.status}
                </Popup>
              </Marker>
            );
          }
          return null;
        })}

        {/* Driver Live Location */}
        {driverId && <DriverMarker driverId={driverId} />}
      </MapContainer>
    </div>
  );
}
