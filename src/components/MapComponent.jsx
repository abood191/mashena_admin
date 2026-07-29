import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Remove default icon
delete L.Icon.Default.prototype._getIconUrl;

// Premium Custom Icons using HTML and CSS animations
const createIcon = (htmlContent, size = [36, 36], anchor = [18, 18]) => {
  return new L.DivIcon({
    className: 'custom-premium-icon',
    html: htmlContent,
    iconSize: size,
    iconAnchor: anchor,
    popupAnchor: [0, -size[1]/2]
  });
};

const carIcon = createIcon(`
  <div class="relative w-12 h-12 flex items-center justify-center">
    <div class="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-20"></div>
    <div class="absolute inset-2 bg-blue-500 rounded-full opacity-30 shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
    <div class="relative z-10 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-blue-500">
      <span class="text-lg">🚘</span>
    </div>
  </div>
`, [48, 48], [24, 24]);

const startIcon = createIcon(`
  <div class="w-6 h-6 bg-gradient-to-tr from-green-600 to-green-400 rounded-full border-[3px] border-white shadow-md flex items-center justify-center">
    <div class="w-1.5 h-1.5 bg-white rounded-full"></div>
  </div>
`, [24, 24], [12, 12]);

const endIcon = createIcon(`
  <div class="w-6 h-6 bg-gradient-to-tr from-red-600 to-red-400 rounded-full border-[3px] border-white shadow-md flex items-center justify-center">
    <div class="w-1.5 h-1.5 bg-white rounded-full"></div>
  </div>
`, [24, 24], [12, 12]);

const stopIcon = createIcon(`
  <div class="w-5 h-5 bg-gradient-to-tr from-yellow-500 to-orange-400 rounded-full border-[2.5px] border-white shadow-sm flex items-center justify-center">
    <div class="w-1 h-1 bg-white rounded-full"></div>
  </div>
`, [20, 20], [10, 10]);

function MapUpdater({ pickup, destination, driverLocation, stops }) {
  const map = useMap();
  const boundsFitted = useRef(false);

  useEffect(() => {
    if (!pickup && !destination && !driverLocation) return;

    const bounds = L.latLngBounds([]);
    if (pickup?.lat && pickup?.lng) bounds.extend([pickup.lat, pickup.lng]);
    if (destination?.lat && destination?.lng) bounds.extend([destination.lat, destination.lng]);
    if (driverLocation?.lat && driverLocation?.lng) bounds.extend([driverLocation.lat, driverLocation.lng]);
    
    if (stops && Array.isArray(stops)) {
      stops.forEach(stop => {
        if (stop.lat && stop.lng) bounds.extend([stop.lat, stop.lng]);
      });
    }
    
    if (bounds.isValid() && !boundsFitted.current) {
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15, animate: true, duration: 1 });
      boundsFitted.current = true;
    }
    
  }, [map, pickup, destination, driverLocation, stops]);

  return null;
}

export default function MapComponent({ tripData, driverLocation }) {
  const pickupPos = tripData?.pickup?.lat ? [tripData.pickup.lat, tripData.pickup.lng] : null;
  const destPos = tripData?.destination?.lat ? [tripData.destination.lat, tripData.destination.lng] : null;
  const driverPos = driverLocation?.lat ? [driverLocation.lat, driverLocation.lng] : null;
  
  // Extract stops
  const stops = Array.isArray(tripData?.stops) ? tripData.stops : [];
  const stopPositions = stops.filter(s => s.lat && s.lng).map(s => [s.lat, s.lng]);

  // Extract actual route geometry if available
  const routeGeometryPoints = tripData?.routeGeometry?.points || tripData?.route?.points;
  let polylinePositions = [];
  let useActualRoute = false;

  if (Array.isArray(routeGeometryPoints) && routeGeometryPoints.length > 0) {
    polylinePositions = routeGeometryPoints.map(p => [p.lat, p.lng]);
    useActualRoute = true;
  } else {
    // Fallback: Build the straight line route path including stops (Pickup -> Stop 1 -> Stop N -> Destination)
    if (pickupPos) polylinePositions.push(pickupPos);
    polylinePositions.push(...stopPositions);
    if (destPos) polylinePositions.push(destPos);
  }
  
  // Default center
  const defaultCenter = [33.5138, 36.2765];

  return (
    <MapContainer 
      center={pickupPos || defaultCenter} 
      zoom={14} 
      className="w-full h-full z-0"
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />
      
      {/* Route Line */}
      {polylinePositions.length > 1 && (
        <Polyline 
          positions={polylinePositions} 
          color="#3b82f6" 
          weight={useActualRoute ? 6 : 5} 
          opacity={useActualRoute ? 0.9 : 0.8} 
          lineCap="round"
          lineJoin="round"
          dashArray={useActualRoute ? undefined : "10, 10"} 
          className={useActualRoute ? "animate-pulse shadow-lg" : "animate-pulse"}
        />
      )}

      {pickupPos && (
        <Marker position={pickupPos} icon={startIcon}>
          <Popup className="premium-popup">
            <div className="font-bold text-gray-800" dir="rtl">🟢 نقطة الانطلاق</div>
            <div className="text-gray-500 text-sm mt-1" dir="rtl">{tripData?.pickup?.label}</div>
          </Popup>
        </Marker>
      )}

      {stops.map((stop, index) => (
        stop.lat && stop.lng && (
          <Marker key={index} position={[stop.lat, stop.lng]} icon={stopIcon}>
            <Popup className="premium-popup">
              <div className="font-bold text-gray-800" dir="rtl">🟡 توقف {stop.order || index + 1}</div>
              <div className="text-gray-500 text-sm mt-1" dir="rtl">{stop.label}</div>
            </Popup>
          </Marker>
        )
      ))}

      {destPos && (
        <Marker position={destPos} icon={endIcon}>
          <Popup className="premium-popup">
            <div className="font-bold text-gray-800" dir="rtl">🔴 الوجهة النهائية</div>
            <div className="text-gray-500 text-sm mt-1" dir="rtl">{tripData?.destination?.label}</div>
          </Popup>
        </Marker>
      )}

      {driverPos && (
        <Marker position={driverPos} icon={carIcon}>
          <Popup className="premium-popup">
            <div className="font-bold text-gray-800 text-center" dir="rtl">🚗 موقع السائق الحالي</div>
          </Popup>
        </Marker>
      )}

      <MapUpdater 
        pickup={tripData?.pickup} 
        destination={tripData?.destination} 
        driverLocation={driverLocation}
        stops={stops}
      />
    </MapContainer>
  );
}
